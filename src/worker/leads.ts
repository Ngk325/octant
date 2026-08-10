import { seal, unseal } from "./crypto";
import { escapeHtml } from "./html";
import { STRIPE_LINK } from "./marketing";
import { sendMail, type MailEnv } from "./mail";
import { normalise, type KVNamespace } from "./users";

/* ------------------------------------------------------------------ *
 * ONRAMP LEADS — captured emails and a short nurture sequence.
 *
 * Own KV namespace, not a USERS prefix: a lead accumulates state over
 * about two weeks (nurture progress) and has nothing to do with auth —
 * the same reasoning that gave CHAT_LOGS its own namespace rather than
 * living inside USERS.
 *
 * The sequence is built to match two DISTINCT promises the email step
 * in onramp.ts already makes, not to invent a new one:
 *   - "We'll send the two-minute explainer... and nothing else without
 *     asking" — owed to EVERYONE who submits, opt-in or not. That's the
 *     one email sent synchronously at capture, below.
 *   - The opt-in checkbox's own text, "the occasional note... I can
 *     unsubscribe any time" — gates anything FURTHER. Only if optin is
 *     true do the two cron-driven follow-ups run.
 * ------------------------------------------------------------------ */

export interface LeadsEnv extends MailEnv {
  LEADS?: KVNamespace;
  /** For signing the unsubscribe link. Without it, nurture email omits the link. */
  AUTH_SECRET?: string;
}

interface Lead {
  email: string;
  firstSeen: number;
  goal?: string;
  friction?: string[];
  fieldSize?: number;
  optin: boolean;
  nurture: {
    /** 0 = just captured; 1 = explainer sent, waiting on email 2; 2 = waiting on email 3; 3 = sequence done. */
    stage: number;
    nextSendAt: number;
    stoppedAt?: number;
    stopReason?: "converted" | "unsubscribed";
  };
}

const KEY = (email: string) => `lead:${normalise(email)}`;
/** Long enough for the ~10-day sequence to finish with margin; not a permanent CRM. */
const TTL_SECONDS = 180 * 24 * 60 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

async function readLead(env: LeadsEnv, email: string): Promise<Lead | null> {
  if (!env.LEADS) return null;
  const raw = await env.LEADS.get(KEY(email));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Lead;
  } catch {
    return null;
  }
}

const writeLead = (env: LeadsEnv, lead: Lead) =>
  env.LEADS!.put(KEY(lead.email), JSON.stringify(lead), { expirationTtl: TTL_SECONDS });

/**
 * Capture one onramp lead and send the explainer immediately. Idempotent —
 * a reload of the done page finds the existing record and does nothing
 * further, so nobody gets the explainer twice. Never throws.
 */
export async function captureLead(
  env: LeadsEnv, origin: string, email: string, goal: string | undefined,
  friction: string[], fieldSize: number | undefined, optin: boolean, now: number,
): Promise<void> {
  if (!env.LEADS) return;
  try {
    const existing = await readLead(env, email);
    if (existing) return;
    const lead: Lead = {
      email: normalise(email), firstSeen: now, goal, friction, fieldSize, optin,
      nurture: { stage: 0, nextSendAt: now },
    };
    await writeLead(env, lead);
    await sendMail(env, await explainerMessage(env, origin, lead, now), "leads");
    lead.nurture = { stage: 1, nextSendAt: now + 3 * DAY_MS };
    await writeLead(env, lead);
  } catch (err) {
    console.error("leads: capture failed", String(err));
  }
}

/** Called from the Stripe webhook — stops the sequence the moment a lead converts. */
export async function markLeadConverted(env: LeadsEnv, email: string, now: number): Promise<void> {
  if (!env.LEADS) return;
  try {
    const lead = await readLead(env, email);
    if (!lead || lead.nurture.stoppedAt) return;
    lead.nurture.stoppedAt = now;
    lead.nurture.stopReason = "converted";
    await writeLead(env, lead);
  } catch (err) {
    console.error("leads: markLeadConverted failed", String(err));
  }
}

/**
 * Hourly-cron entry point (see index.ts scheduled()), same shape as
 * chatlog.ts's sweepIdle/refreshTrendingTags: paginated scan, best-effort,
 * never throws overall.
 */
export async function sendQueuedNurture(env: LeadsEnv, origin: string, now: number): Promise<void> {
  if (!env.LEADS) return;
  try {
    let cursor: string | undefined;
    do {
      const page = await env.LEADS.list({ prefix: "lead:", cursor });
      for (const { name } of page.keys) {
        const email = name.slice("lead:".length);
        try {
          const lead = await readLead(env, email);
          if (!lead || lead.nurture.stoppedAt || !lead.optin) continue;
          if (lead.nurture.nextSendAt > now) continue;
          const entry = SEQUENCE[lead.nurture.stage - 1];
          if (!entry) continue; // sequence complete
          // Opt-in marketing mail must always carry an opt-out. Unlike the
          // immediate explainer (transactional — owed to everyone, opt-in
          // or not), these two sends wait for the misconfiguration
          // (missing AUTH_SECRET or PUBLIC_ORIGIN) to be fixed rather than
          // going out with no unsubscribe link; nextSendAt is left
          // untouched, so the retry happens automatically next hour.
          if (!env.AUTH_SECRET || !origin) {
            console.error("leads: nurture skipped — no origin/secret for unsubscribe link");
            continue;
          }
          const msg = await entry.build(env, origin, lead, now);
          await sendMail(env, msg, "leads");
          lead.nurture.stage += 1;
          lead.nurture.nextSendAt = now + 7 * DAY_MS;
          await writeLead(env, lead);
        } catch (err) {
          console.error(`leads: nurture send failed for one lead`, String(err));
        }
      }
      cursor = page.list_complete === false ? page.cursor : undefined;
    } while (cursor);
  } catch (err) {
    console.error("leads: sendQueuedNurture failed", String(err));
  }
}

/** `GET /api/leads/unsubscribe?t=...` — public, single-tap, no confirm step. */
export async function handleLeadsPublic(request: Request, env: LeadsEnv, now: number): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/leads/unsubscribe") return null;

  const token = url.searchParams.get("t");
  const secret = env.AUTH_SECRET;
  const payload = token && secret ? await unseal<{ email: string }>(token, secret, now) : null;
  if (!payload?.email) {
    return new Response(unsubscribePage("That link has expired or isn't valid."), unsubHeaders(400));
  }
  const lead = await readLead(env, payload.email);
  if (lead && !lead.nurture.stoppedAt) {
    lead.optin = false;
    lead.nurture.stoppedAt = now;
    lead.nurture.stopReason = "unsubscribed";
    await writeLead(env, lead);
  }
  return new Response(unsubscribePage("You're unsubscribed — we won't send any more notes."), unsubHeaders(200));
}

const unsubHeaders = (status: number) => ({ status, headers: { "content-type": "text/html; charset=utf-8" } });

const unsubscribePage = (message: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Octant</title><style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;
       font:400 18px/1.6 Georgia,'Times New Roman',serif;color:#1A1714;background:#FDFCFA}
  main{max-width:26rem;text-align:center}a{color:#6B3BC4}
</style></head><body><main><p>${escapeHtml(message)}</p><p><a href="/">Back to Octant</a></p></main></body></html>`;

/* ------------------------------- content ------------------------------- */

/**
 * Real copy from marketing.ts's #problem section, reused verbatim — never a
 * new claim. Exported so onramp.ts's personalized reflection interstitial
 * can share the exact same mapping rather than drifting from the nurture
 * email's version of the same content.
 */
export const FRICTION_COPY: Record<string, { heading: string; body: string }> = {
  recurring: {
    heading: "Compatibility isn't symmetric",
    body:
      "A single compatibility score is a fiction: many relationships are genuinely easy from one " +
      "side and expensive from the other — and the person on the heavier side usually can't tell " +
      "it's happening. Octant scores every relationship in both directions and names the asymmetry " +
      "when there is one.",
  },
  drain: {
    heading: "Labels don't explain anything",
    body:
      "A paragraph about \"your type\" can't tell you why one colleague energizes you and another " +
      "exhausts you doing the same job. Octant derives every reading from the same underlying " +
      "structure, so it can show you the mechanism — where their strengths land in your pattern — " +
      "not just an adjective.",
  },
  meetings: {
    heading: "Group dynamics stay invisible",
    body:
      "Team workshops end with everyone knowing their letters and nothing changing. A group is a " +
      "web of directed relationships — who quietly corrects whom, who absorbs it, who holds the " +
      "room together. Octant draws that web and does the arithmetic on it.",
  },
  language: {
    heading: "Labels don't explain anything",
    body:
      "A paragraph about \"your type\" can't tell you why one colleague energizes you and another " +
      "exhausts you doing the same job. Octant derives every reading from the same underlying " +
      "structure, so it can show you the mechanism — not just an adjective.",
  },
};

/** Exported so onramp.ts's done-step CTA builds the exact same URL — both
 *  paths must normalise the email first, or the same person's two CTAs
 *  (nurture email vs. the done page) carry different client_reference_id
 *  values when their address has mixed case. */
export const stripeHref = (email: string) =>
  `${STRIPE_LINK}?client_reference_id=${encodeURIComponent(normalise(email).slice(0, 200))}`;

async function unsubscribeLink(env: LeadsEnv, origin: string, email: string, now: number): Promise<string | null> {
  if (!env.AUTH_SECRET || !origin) return null;
  const token = await seal<{ email: string }>({ email }, env.AUTH_SECRET, TTL_SECONDS, now);
  return `${origin}/api/leads/unsubscribe?t=${encodeURIComponent(token)}`;
}

const shell = (heading: string, body: string, ctaHref: string, ctaLabel: string, footer: string) => `
<div style="font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1A1714;max-width:540px">
  <p style="font:600 20px/1.3 Georgia,serif;margin:0 0 12px">${escapeHtml(heading)}</p>
  <p style="color:#4C463D;margin:0 0 20px">${body}</p>
  <a href="${ctaHref}" style="display:inline-block;background:#6B3BC4;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:500">${escapeHtml(ctaLabel)}</a>
  <p style="color:#4C463D;font-size:13px;margin-top:28px;padding-top:16px;border-top:1px solid #E3DED4">${footer}</p>
</div>`;

async function explainerMessage(env: LeadsEnv, origin: string, lead: Lead, now: number) {
  const field = lead.fieldSize;
  const unsub = await unsubscribeLink(env, origin, lead.email, now);
  const heading = "Your two-minute explainer";
  const bodyText = field
    ? `Based on what you told us, your pattern is one of about ${field} of the sixteen. The full ` +
      `instrument answers the rest — the other either/or questions, both directions of every ` +
      `relationship, and a growth path — derived, not looked up.`
    : "Octant derives sixteen cognitive patterns, 256 directed relationships and a growth path for " +
      "each — all from one small piece of structure, so nothing can quietly contradict anything else.";
  const html = shell(
    heading, bodyText, stripeHref(lead.email), "Start now — $25/user·mo",
    `You're getting this because you asked for it at ${origin}/onramp, and nothing else without asking.` +
      (unsub ? ` <a href="${unsub}" style="color:#6B3BC4">Unsubscribe</a>` : ""),
  );
  const text =
    `${heading}\n\n${bodyText.replace(/<[^>]+>/g, "")}\n\nStart now: ${stripeHref(lead.email)}\n` +
    (unsub ? `\nUnsubscribe: ${unsub}\n` : "");
  return { to: [lead.email], subject: "Octant — your two-minute explainer", html, text };
}

interface NurtureEntry {
  subject: string;
  build(env: LeadsEnv, origin: string, lead: Lead, now: number): Promise<{ to: string[]; subject: string; html: string; text: string }>;
}

const SEQUENCE: NurtureEntry[] = [
  {
    // stage 1 -> 2, day 3: personalized by the visitor's own friction answer
    subject: "Octant — the mechanism, not the label",
    async build(env, origin, lead, now) {
      const key = lead.friction?.[0];
      const copy = (key && FRICTION_COPY[key]) || FRICTION_COPY.drain;
      const unsub = await unsubscribeLink(env, origin, lead.email, now);
      const html = shell(
        copy.heading, copy.body, stripeHref(lead.email), "Start now — $25/user·mo",
        `You opted in for the occasional note.` + (unsub ? ` <a href="${unsub}" style="color:#6B3BC4">Unsubscribe any time</a>.` : ""),
      );
      const text = `${copy.heading}\n\n${copy.body}\n\nStart now: ${stripeHref(lead.email)}\n` +
        (unsub ? `\nUnsubscribe: ${unsub}\n` : "");
      return { to: [lead.email], subject: "Octant — the mechanism, not the label", html, text };
    },
  },
  {
    // stage 2 -> 3, day 10: objection handling, same for everyone
    subject: "Octant — one more thing",
    async build(env, origin, lead, now) {
      const heading = "Descriptions are horoscopes";
      const body =
        "A paragraph about \"your type\" can't tell you why one colleague energizes you and another " +
        "exhausts you doing the same job. Octant derives every reading from the same underlying " +
        "structure, so it can show you the mechanism — not just an adjective. That's the difference " +
        "between a label and an instrument.";
      const unsub = await unsubscribeLink(env, origin, lead.email, now);
      const html = shell(
        heading, body, stripeHref(lead.email), "Start now — $25/user·mo",
        `Last note in this sequence.` + (unsub ? ` <a href="${unsub}" style="color:#6B3BC4">Unsubscribe any time</a>.` : ""),
      );
      const text = `${heading}\n\n${body}\n\nStart now: ${stripeHref(lead.email)}\n` +
        (unsub ? `\nUnsubscribe: ${unsub}\n` : "");
      return { to: [lead.email], subject: "Octant — one more thing", html, text };
    },
  },
];
