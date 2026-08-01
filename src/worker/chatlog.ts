import { escapeHtml } from "./html";
import type { KVNamespace } from "./users";

/* ------------------------------------------------------------------ *
 * CHAT TRANSCRIPTS — stored for the owner, mailed at session end.
 *
 * Every exchange through /api/chat is appended to a KV record keyed by
 * the client's thread id; when the session ends (new thread, tab
 * closed, or an hour of silence) the whole transcript goes to the
 * owner's inbox with who/when/where metadata, and the record stays in
 * KV for ninety days.
 *
 * The postures are inherited from the rest of the Worker:
 *   - Best-effort, always. A logging failure must never break a chat
 *     reply, and a mail failure must never break anything — logged via
 *     console.error, not thrown.
 *   - Degrades without config. No CHAT_LOGS binding → no logging; no
 *     Resend key → records accumulate un-mailed and expire.
 *   - Users are told. The rail says conversations may be reviewed —
 *     silently logging chats would contradict the product's own
 *     honesty posture.
 * ------------------------------------------------------------------ */

export interface ChatLogEnv {
  CHAT_LOGS?: KVNamespace;
  RESEND_API_KEY?: string;
  OWNER_EMAIL?: string;
  NOTIFY_FROM?: string;
  NOTIFY_EMAIL?: string;
}

/** Who was talking, as established by the session layer. */
export interface ChatWho {
  /** Google email, when the session is a Google one. */
  email?: string;
  /** Invite-code label or Google display name. */
  label: string;
  kind: "code" | "google";
  /**
   * Digest-prefix identity of the invite code, for code sessions minted
   * since 2026-08. The label is NOT an identity — two bare codes both parse
   * to "guest" — and scoping history by it let those two people read each
   * other's transcripts. Records and sessions from before the change carry
   * no codeId and fall back to label matching until the 90-day TTL and the
   * 30-day session expiry age them out.
   */
  codeId?: string;
}

export interface LoggedTurn {
  role: "user" | "model";
  text: string;
  at: number;
}

export interface ChatLogRecord {
  who: ChatWho;
  ua?: string;
  started: number;
  updated: number;
  /** Human labels of the screens this thread was asked from, deduped, in order. */
  contexts: string[];
  turns: LoggedTurn[];
  /** Set when the transcript email has gone out; makes endSession idempotent. */
  mailed?: number;
}

/** Transcripts are for review, not archive. */
const TTL_SECONDS = 90 * 24 * 60 * 60;
/** A thread quiet this long is over, beacon or no beacon. */
export const IDLE_MS = 60 * 60 * 1000;
/** Threads are capped well above the client's 40-message window. */
const MAX_TURNS = 200;

const KEY = (threadId: string) => `chat:${threadId}`;

/** Client-supplied ids are used as KV keys; keep them boring. */
export const validThreadId = (id: unknown): id is string =>
  typeof id === "string" && /^[A-Za-z0-9-]{8,64}$/.test(id);

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Octant <onboarding@resend.dev>";

async function readRecord(env: ChatLogEnv, threadId: string): Promise<ChatLogRecord | null> {
  if (!env.CHAT_LOGS) return null;
  const raw = await env.CHAT_LOGS.get(KEY(threadId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ChatLogRecord;
  } catch {
    return null;
  }
}

const writeRecord = (env: ChatLogEnv, threadId: string, rec: ChatLogRecord) =>
  env.CHAT_LOGS!.put(KEY(threadId), JSON.stringify(rec), { expirationTtl: TTL_SECONDS });

/**
 * Append one exchange — the user's message and the model's full reply — to
 * the thread's record. Never throws; a failure here is a lost log line, not
 * a broken chat.
 */
export async function recordExchange(
  env: ChatLogEnv,
  threadId: string,
  who: ChatWho,
  contextLabel: string,
  userText: string,
  modelText: string,
  now: number,
  ua?: string,
): Promise<void> {
  if (!env.CHAT_LOGS) return;
  try {
    const existing = await readRecord(env, threadId);
    /* The first writer owns the record for good. This line used to read
       `rec.who = who`, which meant whoever wrote LAST owned the whole
       history — so knowing (or guessing) a threadId was enough to append
       once and then read everything before. Thread ids are client-chosen;
       ownership must not be. A mismatched append is dropped and logged, and
       chat itself is unaffected. */
    if (existing && !belongsTo(existing, who)) {
      console.error(`chatlog: append to ${threadId} by a different identity dropped`);
      return;
    }
    const rec: ChatLogRecord = existing ?? {
      who, ua, started: now, updated: now, contexts: [], turns: [],
    };
    rec.updated = now;
    if (ua) rec.ua = ua;
    if (contextLabel && rec.contexts[rec.contexts.length - 1] !== contextLabel) {
      rec.contexts.push(contextLabel);
    }
    rec.turns.push({ role: "user", text: userText, at: now });
    if (modelText) rec.turns.push({ role: "model", text: modelText, at: now });
    if (rec.turns.length > MAX_TURNS) rec.turns = rec.turns.slice(-MAX_TURNS);
    await writeRecord(env, threadId, rec);
  } catch (err) {
    console.error("chatlog: record failed", String(err));
  }
}

/** Whether a logged thread belongs to the caller asking for it. */
function belongsTo(rec: ChatLogRecord, who: ChatWho): boolean {
  if (who.email) return rec.who.email === who.email;
  if (rec.who.kind !== "code") return false;
  /* A caller that carries a codeId is proven by it ALONE: the record must
     carry the same one, and a codeId-less (pre-migration) record is NOT theirs
     to read. The earlier version fell back to label whenever either side
     lacked a codeId, which meant a new "guest" session could still read a
     legacy "guest" record by label for the 90-day retention window — the exact
     hole the codeId was added to close. Label is not identity. */
  if (who.codeId) return rec.who.codeId === who.codeId;
  /* The caller has NO codeId: a session minted before codeId existed, within
     30 days of expiry. It may match only other codeId-less records, by label —
     unchanged prior behaviour on a closed, expiring set. A legacy caller never
     reaches a new record, because new records always carry a codeId. */
  return !rec.who.codeId && rec.who.label === who.label;
}

export interface ThreadSummary {
  threadId: string;
  started: number;
  updated: number;
  contexts: string[];
  turns: number;
  preview: string;
}

/** The caller's own past threads, most recently updated first. History, not archive. */
export async function listThreads(env: ChatLogEnv, who: ChatWho): Promise<ThreadSummary[]> {
  if (!env.CHAT_LOGS) return [];
  const out: ThreadSummary[] = [];
  try {
    let cursor: string | undefined;
    do {
      const page = await env.CHAT_LOGS.list({ prefix: "chat:", cursor });
      for (const { name } of page.keys) {
        const threadId = name.slice("chat:".length);
        const rec = await readRecord(env, threadId);
        if (rec && rec.turns.length > 0 && belongsTo(rec, who)) {
          const firstUser = rec.turns.find((t) => t.role === "user");
          out.push({
            threadId,
            started: rec.started,
            updated: rec.updated,
            contexts: rec.contexts,
            turns: rec.turns.length,
            preview: (firstUser?.text ?? "").slice(0, 140),
          });
        }
      }
      cursor = page.list_complete === false ? page.cursor : undefined;
    } while (cursor);
  } catch (err) {
    console.error("chatlog: listThreads failed", String(err));
  }
  return out.sort((a, b) => b.updated - a.updated).slice(0, 50);
}

/** One of the caller's own past threads, in full — or null if it is not theirs. */
export async function getThreadFor(
  env: ChatLogEnv, who: ChatWho, threadId: string,
): Promise<ChatLogRecord | null> {
  const rec = await readRecord(env, threadId);
  if (!rec || !belongsTo(rec, who)) return null;
  return rec;
}

/**
 * The session is over — mail the transcript to the owner, once.
 * Idempotent via the `mailed` stamp, so the beacon, the reset button and the
 * idle sweep can all call it without producing duplicate email.
 */
export async function endSession(env: ChatLogEnv, threadId: string, now: number): Promise<void> {
  if (!env.CHAT_LOGS) return;
  try {
    const rec = await readRecord(env, threadId);
    if (!rec || rec.mailed || rec.turns.length === 0) return;

    const sent = await mailTranscript(env, threadId, rec);
    if (sent) {
      rec.mailed = now;
      await writeRecord(env, threadId, rec);
    }
  } catch (err) {
    console.error("chatlog: endSession failed", String(err));
  }
}

/**
 * The fallback for sessions that ended without a beacon — crash, lost
 * network, killed tab. Runs piggybacked on chat traffic (waitUntil), mails
 * anything quiet for over an hour. With zero traffic there is nothing to
 * sweep; the next use flushes the backlog.
 */
export async function sweepIdle(env: ChatLogEnv, now: number): Promise<void> {
  if (!env.CHAT_LOGS) return;
  try {
    let cursor: string | undefined;
    do {
      const page = await env.CHAT_LOGS.list({ prefix: "chat:", cursor });
      for (const { name } of page.keys) {
        const threadId = name.slice("chat:".length);
        const rec = await readRecord(env, threadId);
        if (rec && !rec.mailed && rec.turns.length > 0 && now - rec.updated > IDLE_MS) {
          await endSession(env, threadId, now);
        }
      }
      cursor = page.list_complete === false ? page.cursor : undefined;
    } while (cursor);
  } catch (err) {
    console.error("chatlog: sweep failed", String(err));
  }
}

/* ------------------------------- email ------------------------------- */

const when = (ms: number) => new Date(ms).toISOString().replace("T", " ").slice(0, 16) + " UTC";

async function mailTranscript(env: ChatLogEnv, threadId: string, rec: ChatLogRecord): Promise<boolean> {
  if (!env.RESEND_API_KEY) return false;
  const to = env.NOTIFY_EMAIL || env.OWNER_EMAIL;
  if (!to) return false;

  const who = rec.who.email ? `${rec.who.email} (${rec.who.kind})` : `${rec.who.label} (invite code)`;

  const text = [
    `Octant chat transcript`,
    ``,
    `Who:      ${who}`,
    `Started:  ${when(rec.started)}`,
    `Ended:    ${when(rec.updated)}`,
    `Screens:  ${rec.contexts.join(" → ") || "—"}`,
    `Agent:    ${rec.ua ?? "—"}`,
    `Thread:   ${threadId}`,
    ``,
    ...rec.turns.map((t) => `[${t.role === "user" ? "USER" : "OCTANT"}] ${t.text}\n`),
  ].join("\n");

  const html = `
<div style="font:400 15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1A1714;max-width:640px">
  <p style="font:600 19px/1.3 Georgia,serif;margin:0 0 12px">Chat transcript — ${escapeHtml(rec.who.email ?? rec.who.label)}</p>
  <div style="border:1px solid #E3DED4;border-radius:8px;padding:12px 16px;margin-bottom:20px;color:#4C463D;font-size:14px">
    <b>Who:</b> ${escapeHtml(who)} &middot; <b>Started:</b> ${when(rec.started)} &middot;
    <b>Ended:</b> ${when(rec.updated)}<br>
    <b>Screens:</b> ${escapeHtml(rec.contexts.join(" → ") || "—")}<br>
    <b>Agent:</b> ${escapeHtml(rec.ua ?? "—")} &middot; <b>Thread:</b> ${escapeHtml(threadId)}
  </div>
  ${rec.turns.map((t) => `
  <div style="margin-bottom:14px">
    <div style="font-weight:600;font-size:13px;color:${t.role === "user" ? "#4B2A8F" : "#6B6459"}">
      ${t.role === "user" ? "USER" : "OCTANT"} · ${when(t.at)}
    </div>
    <div style="white-space:pre-wrap">${escapeHtml(t.text)}</div>
  </div>`).join("")}
</div>`;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.NOTIFY_FROM || DEFAULT_FROM,
        to: [to],
        subject: `Octant chat — ${rec.who.email ?? rec.who.label} · ${rec.turns.length} turns`,
        html,
        text,
      }),
    });
    if (!res.ok) {
      console.error(`chatlog: resend ${res.status}`, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch {
    console.error("chatlog: network failure reaching Resend");
    return false;
  }
}
