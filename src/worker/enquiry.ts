import { seal, unseal } from "./crypto";
import { decisionPage } from "./decision";
import { escapeHtml } from "./html";
import { sendMail, type MailEnv } from "./mail";
import { normalise, type KVNamespace } from "./users";

/* ------------------------------------------------------------------ *
 * THE PARTNER ENQUIRY — form in, owner decides, rate card out.
 *
 * Three moves, and the middle one is a person:
 *
 *   1. The form records the enquiry, tells the enquirer it landed, and
 *      emails the owner everything they typed.
 *   2. The owner reads it and taps one of two signed links.
 *   3. Only then does the rate card go out, attached.
 *
 * The gate is the whole design, not an afterthought. The card is stamped
 * confidential and its numbers are published nowhere, because a
 * wholesale rate in the open is a floor every later negotiation starts
 * from — so who receives it is a decision, and a decision needs somebody
 * to make it. An earlier draft of this file sent the card automatically
 * on submit, which meant anyone willing to type an address could have
 * the rates. That is not the trade the owner wants (2026-08): they want
 * to see who is asking first.
 *
 * What the gate costs is latency, and the shape here is chosen to make
 * that cost as small as it can be. The links are the same one-tap,
 * no-sign-in, unforgeable shape notify.ts already uses for sign-ups:
 * an HMAC over {email, action} that expires, so the decision is two taps
 * on a phone at a bus stop rather than a laptop and a login. And the
 * enquirer is never left wondering — they get an immediate
 * acknowledgement carrying the four questions worth thinking about while
 * they wait, so the pause is useful to them rather than silent.
 *
 * TWO taps on that link, not one, for the reason admin.ts spells out:
 * mail clients, link-safety scanners and chat previews fetch every URL
 * in a message before a human sees it. A one-tap release would be
 * decided by whichever scanner touched the inbox first. So the GET only
 * shows who is asking, and the release is a POST from that page.
 *
 * The form endpoint itself is still public and session-less, and still
 * must not become a way to make this Worker mail strangers — the owner's
 * inbox is a recipient too, and an unusable inbox is its own outage.
 * Three cheap brakes, the same ones onramp.ts settled on:
 *
 *   - a signed token minted when /partners rendered, which must be at
 *     least MIN_COMPLETION_MS old (a single scripted POST has none);
 *   - a honeypot field no human ever sees or fills;
 *   - one enquiry per address, enforced by the stored record.
 *
 * None of these stop a determined attacker who scripts two requests with
 * a pause between them. They stop the single-request shape that
 * automated probing actually takes, which is the shape that finds an
 * endpoint like this one.
 * ------------------------------------------------------------------ */

export interface PartnerEnquiryEnv extends MailEnv {
  /**
   * Shared with the onramp leads (leads.ts) under a DIFFERENT key prefix,
   * not given a namespace of its own. leads.ts argues for one namespace per
   * concern and that reasoning still holds — but a new binding is a new
   * namespace to create by hand in Cloudflare, and the runbook already
   * records how easily that goes wrong. A partner enquiry is the same kind
   * of object as a lead (a captured address plus what they told us) and the
   * nurture scan is prefix-scoped to "lead:", so the two cannot see each
   * other.
   *
   * Without the binding the flow still works end to end — the decision
   * links carry the address themselves — but nothing is remembered, so a
   * second submit mails the owner twice and a second tap on the same link
   * sends the card twice.
   */
  LEADS?: KVNamespace;
  /** Signs the form token and the decision links. Without it no enquiry is accepted. */
  AUTH_SECRET?: string;
  OWNER_EMAIL?: string;
  NOTIFY_EMAIL?: string;
  /**
   * The asset binding, used only to read the committed rate-card PDF out of
   * the static build. Fetching it through ASSETS rather than embedding it in
   * the bundle keeps ~400KB of binary out of the Worker script, and the file
   * stays unreachable to the public because index.ts only serves assets to
   * requests that already cleared the wall.
   */
  ASSETS?: { fetch(request: Request): Promise<Response> };
}

/** Where the built PDF lives in the static build. Kept in sync by scripts/build-rate-card.mjs. */
export const RATE_CARD_ASSET = "/octant-partner-rate-card.pdf";
const RATE_CARD_FILENAME = "octant-partner-rate-card.pdf";

export const ENQUIRY_PATH = "/partners/enquiry";
export const ENQUIRY_ACT_PATH = "/api/partners/act";

/** Same permissive check as onramp.ts — not RFC 5322, just enough to refuse junk. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FORM_TTL_SECONDS = 6 * 60 * 60;
/** No person reads the four shapes and fills six fields in under two seconds. */
const MIN_COMPLETION_MS = 2_000;
/**
 * How long a decision link stays live. Longer than notify.ts's week for
 * sign-ups, because a partnership is not a sign-in: an enquiry can sit
 * through a holiday and a round of internal discussion and still be worth
 * answering, and an expired link means going and finding the address by hand.
 */
const DECISION_TTL_SECONDS = 30 * 24 * 60 * 60;
/** Long enough for the conversation to outlive the decision; this is not a CRM. */
const RECORD_TTL_SECONDS = 180 * 24 * 60 * 60;

const KEY = (email: string) => `partner:${normalise(email)}`;

/* --------------------------- the form token --------------------------- */

export async function issueEnquiryToken(env: PartnerEnquiryEnv, now: number): Promise<string | null> {
  if (!env.AUTH_SECRET) return null;
  return seal({ t: now }, env.AUTH_SECRET, FORM_TTL_SECONDS, now);
}

async function verifyEnquiryToken(
  env: PartnerEnquiryEnv, token: string | null, now: number,
): Promise<boolean> {
  if (!env.AUTH_SECRET || !token) return false;
  const payload = await unseal<{ t: number }>(token, env.AUTH_SECRET, now);
  return !!payload && now - payload.t >= MIN_COMPLETION_MS;
}

/* ------------------------------ the shape ----------------------------- */

type Decision = "send" | "decline";
interface DecisionPayload { email: string; action: Decision }

interface Enquiry {
  email: string;
  name: string;
  org: string;
  shape: string;
  people: string;
  seeking: string;
  at: number;
  /** "new" until the owner taps one of the two links. */
  status: "new" | "sent" | "declined";
  decidedAt?: number;
}

/** Field label, and the cap past which we stop reading. Order is the order the owner reads. */
const FIELDS: [key: "name" | "org" | "shape" | "people" | "seeking", label: string, max: number][] = [
  ["name", "Name", 120],
  ["org", "Organisation", 160],
  ["shape", "Closest shape", 60],
  ["people", "Roughly how many people", 80],
  ["seeking", "What they are looking for", 4000],
];

const trim = (v: FormDataEntryValue | null, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

async function readEnquiry(env: PartnerEnquiryEnv, email: string): Promise<Enquiry | null> {
  if (!env.LEADS) return null;
  const raw = await env.LEADS.get(KEY(email));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Enquiry;
  } catch {
    return null;
  }
}

const writeEnquiry = (env: PartnerEnquiryEnv, e: Enquiry) =>
  env.LEADS!.put(KEY(e.email), JSON.stringify(e), { expirationTtl: RECORD_TTL_SECONDS });

/* --------------------------- the form's route -------------------------- */

interface Ctx { waitUntil?(promise: Promise<unknown>): void }

/**
 * POST /partners/enquiry. Returns null for anything it does not own, the
 * same contract handleRead and handleOnramp use, so index.ts can dispatch to
 * it unconditionally from ahead of the wall.
 *
 * Always redirects, never renders: the answer belongs on /partners, and a
 * 303 means a reload of the confirmation cannot resubmit the form.
 */
export async function handlePartnerEnquiry(
  request: Request, env: PartnerEnquiryEnv, url: URL, now: number, ctx?: Ctx,
): Promise<Response | null> {
  if (url.pathname !== ENQUIRY_PATH) return null;
  if (request.method !== "POST") return seeOther("/partners#enquiry");

  const form = await request.formData().catch(() => null);
  if (!form) return seeOther("/partners?sent=0#enquiry");

  /* The honeypot. A bot fills every input it finds; a person never sees this
     one. Answer as though it worked — telling a scraper which check caught it
     is free tuning information. */
  if (trim(form.get("website"), 200)) return seeOther("/partners?sent=1#enquiry");

  const email = trim(form.get("email"), 254);
  if (!email || !EMAIL_RE.test(email)) return seeOther("/partners?sent=0#enquiry");

  if (!(await verifyEnquiryToken(env, trim(form.get("_s"), 4000) || null, now))) {
    console.error("enquiry: rejected — missing, forged, expired or too-fast form token");
    return seeOther("/partners?sent=0#enquiry");
  }

  const enquiry: Enquiry = {
    email: normalise(email),
    name: trim(form.get("name"), 120),
    org: trim(form.get("org"), 160),
    shape: trim(form.get("shape"), 60),
    people: trim(form.get("people"), 80),
    seeking: trim(form.get("seeking"), 4000),
    at: now,
    status: "new",
  };

  const work = receive(env, url.origin, enquiry, now);
  if (ctx?.waitUntil) ctx.waitUntil(work); else await work;
  return seeOther("/partners?sent=1#enquiry");
}

const seeOther = (location: string) =>
  new Response(null, { status: 303, headers: { location, "cache-control": "no-store" } });

/**
 * Record, acknowledge, and put the decision in front of the owner. Never
 * throws — a failed send must not turn into a 500 on a public form, and the
 * redirect has usually already gone out by the time this runs.
 *
 * Owner mail LAST, because it is the one send that must not be lost and the
 * only place the acknowledgement's result can be reported. If the enquirer
 * could not be reached, the owner learns that in the same email that tells
 * them somebody is waiting.
 */
async function receive(
  env: PartnerEnquiryEnv, origin: string, enquiry: Enquiry, now: number,
): Promise<void> {
  try {
    if (env.LEADS) {
      if (await readEnquiry(env, enquiry.email)) return; // a reload, or a second submit
      await writeEnquiry(env, enquiry);
    }

    const ack = await sendMail(env, acknowledgementMessage(enquiry), "enquiry", {
      requireVerifiedSender: true,
    });
    if (!ack.sent) {
      console.error(`enquiry: acknowledgement NOT delivered to ${enquiry.email} — ${ack.reason}`);
    }

    const owner = env.NOTIFY_EMAIL || env.OWNER_EMAIL;
    if (!owner) {
      console.error("enquiry: nobody to notify — set OWNER_EMAIL or NOTIFY_EMAIL");
      return;
    }
    const links = env.AUTH_SECRET
      ? {
          send: await decisionLink(origin, enquiry.email, "send", env.AUTH_SECRET, now),
          decline: await decisionLink(origin, enquiry.email, "decline", env.AUTH_SECRET, now),
        }
      : null;
    await sendMail(env, ownerMessage(enquiry, owner, ack, links, origin), "enquiry");
  } catch (err) {
    console.error("enquiry: receive failed", String(err));
  }
}

/* ------------------------- the decision's route ------------------------ */

/** A one-tap, expiring, unforgeable link for one decision about one enquiry. */
async function decisionLink(
  origin: string, email: string, action: Decision, secret: string, now: number,
): Promise<string> {
  const token = await seal<DecisionPayload>({ email, action }, secret, DECISION_TTL_SECONDS, now);
  return `${origin}${ENQUIRY_ACT_PATH}?t=${encodeURIComponent(token)}`;
}

/**
 * `/api/partners/act`. Public on purpose, exactly like /api/admin/act: the
 * signature IS the authorisation, so the owner can decide from a phone
 * without signing in. A leaked link can do one thing — release the rate card
 * to the one address that link already names, which is an address that
 * already asked for it.
 *
 * Returns null for anything it does not own.
 */
export async function handleEnquiryAction(
  request: Request, env: PartnerEnquiryEnv, url: URL, now: number,
): Promise<Response | null> {
  if (url.pathname !== ENQUIRY_ACT_PATH) return null;
  if (!env.AUTH_SECRET) return actPage("Not configured", "This deployment has no signing secret.", false);

  /* The token travels in the query string on the way in (it is a link in an
     email) and in the form body on the way back. Same token either way — the
     signature is what authorises, not where it was carried. */
  const token = request.method === "POST"
    ? (await request.formData().catch(() => null))?.get("t")?.toString() ?? ""
    : url.searchParams.get("t") ?? "";

  const payload = await unseal<DecisionPayload>(token, env.AUTH_SECRET, now);
  if (!payload?.email || (payload.action !== "send" && payload.action !== "decline")) {
    return actPage(
      "That link is no longer valid",
      "It has expired, or it was altered in transit. The enquiry is still in your inbox — reply to it directly instead.",
      false,
    );
  }

  /* Without LEADS there is no record, and the link's own address is all we
     have. That is enough to send the card; what is lost is the name, the
     context, and the ability to notice a second tap. */
  const record = await readEnquiry(env, payload.email);
  const who = record?.org || record?.name || payload.email;

  if (request.method !== "POST") {
    if (record?.status === "sent") {
      return actPage("Already sent", `${who} has the rate card. It went out once and cannot be recalled.`, true);
    }
    return payload.action === "send"
      ? actPage(
          "Send them the rate card?",
          `${who} <${payload.email}> asked for it. Sending releases the confidential rates — the standalone price, all four shapes, our time, and the fixed terms.`,
          false,
          confirmForm(token, "send"),
          200,
        )
      : actPage(
          "Leave this one?",
          `${who} <${payload.email}> gets nothing further and stays on record. You can still send the card later from the same email.`,
          false,
          confirmForm(token, "decline"),
          200,
        );
  }

  if (payload.action === "decline") {
    if (record?.status === "sent") {
      return actPage("Already sent", `${who} has the rate card. There is nothing left to hold back.`, true);
    }
    if (record) {
      record.status = "declined";
      record.decidedAt = now;
      await writeEnquiry(env, record);
    }
    return actPage("Left alone", `Nothing further goes to ${who}. Their enquiry is still in your inbox if you change your mind.`, true);
  }

  if (record?.status === "sent") {
    return actPage("Already sent", `${who} has the rate card. Tapping again does not send it twice.`, true);
  }

  const card = await rateCardAttachment(env, url.origin);
  const result = await sendMail(
    env, rateCardMessage(payload.email, record?.name ?? "", env.NOTIFY_EMAIL || env.OWNER_EMAIL, card),
    "enquiry", { requireVerifiedSender: true },
  );
  if (!result.sent) {
    console.error(`enquiry: rate card NOT delivered to ${payload.email} — ${result.reason}`);
    return actPage(
      "That did not send",
      result.reason === "no NOTIFY_FROM"
        ? "Resend's shared sender cannot reach anyone but the account's own address. Set NOTIFY_FROM to a verified sender and open this link again."
        : `Nothing reached ${who}: ${result.reason ?? "unknown"}. Nothing was recorded, so this link still works — try it again.`,
      false,
    );
  }

  if (record) {
    record.status = "sent";
    record.decidedAt = now;
    await writeEnquiry(env, record);
  }
  return actPage(
    "Sent",
    card
      ? `The rate card is on its way to ${who}. Replies come back to you.`
      : `A note went to ${who}, but WITHOUT the rate card — the PDF was not readable from the build. Send it by hand.`,
    !!card,
  );
}

const actPage = (title: string, body: string, ok: boolean, extra = "", status = ok ? 200 : 400) =>
  decisionPage(title, body, ok, {
    extra, status, footer: { href: "/partners", label: "The partner page →" },
  });

/* A POST, so no link scanner can trip it, and the token rides along in the body. */
const confirmForm = (token: string, action: Decision) => `
<form method="POST" action="${ENQUIRY_ACT_PATH}" style="margin-top:24px">
  <input type="hidden" name="t" value="${escapeHtml(token)}">
  <button type="submit" class="${action === "send" ? "yes" : "no"}">
    ${action === "send" ? "Send the rate card" : "Leave it"}
  </button>
</form>`;

/* ---------------------------- the attachment --------------------------- */

/**
 * Read the committed PDF out of the static build. Returns null rather than
 * throwing on every way this can be absent — an unbuilt dist, the dev shim's
 * empty passthrough response, a renamed file — because the partner should
 * still get an answer, and the owner's decision page says which version went.
 */
async function rateCardAttachment(
  env: PartnerEnquiryEnv, origin: string,
): Promise<{ filename: string; content: string } | null> {
  if (!env.ASSETS) return null;
  try {
    const res = await env.ASSETS.fetch(new Request(`${origin}${RATE_CARD_ASSET}`));
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 1024) return null; // a passthrough marker or an error page, not a PDF
    return { filename: RATE_CARD_FILENAME, content: base64(buf) };
  } catch {
    return null;
  }
}

/** btoa takes a binary string, and a 400KB spread in one call overflows the stack. */
function base64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/* ------------------------------- content ------------------------------ */

const GREETING = (name: string) => (name ? `Hi ${name.split(/\s+/)[0]},` : "Hello,");

/**
 * The four questions are the same ones /partners already says it will ask.
 * They go in the ACKNOWLEDGEMENT rather than with the card, deliberately:
 * they are the thing worth doing during the wait, which turns the gap
 * between asking and receiving from silence into work.
 */
const ASKS = [
  "Which of the four shapes looks closest — A referral, B bundled seats, C embedded, D white-label?",
  "At renewal, whose product is the client renewing?",
  "Roughly how many people would be reading, and over what period?",
  "What is the missing piece that would make this fit cleanly?",
];

function acknowledgementMessage(enquiry: Enquiry) {
  const asksHtml = ASKS.map((q) => `<li style="margin-bottom:8px">${escapeHtml(q)}</li>`).join("");
  const lede =
    "Thank you for the enquiry about putting Octant inside what you offer. It is with us, and a " +
    "person is reading it rather than a queue. The rates and terms come back to you by email — " +
    "the standalone price, what each of the four shapes costs, what our time costs, and which " +
    "terms are fixed rather than open.";

  const html = `
<div style="font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#241F19;max-width:540px">
  <p style="margin:0 0 16px">${escapeHtml(GREETING(enquiry.name))}</p>
  <p style="margin:0 0 16px">${escapeHtml(lede)}</p>
  <p style="margin:0 0 8px">Nothing to do meanwhile, but these four are the places where your answer changes the structure &mdash; worth a thought before the numbers arrive:</p>
  <ol style="color:#4C463D;margin:0 0 20px;padding-left:20px">${asksHtml}</ol>
  <p style="margin:0 0 16px">Reply to this email whenever you like, including with &ldquo;none of those four cut in the right place&rdquo; &mdash; that is a useful answer and not a dead end.</p>
  <p style="margin:0">&mdash; Octant</p>
</div>`;

  const text =
    `${GREETING(enquiry.name)}\n\n${lede}\n\n` +
    `Nothing to do meanwhile, but these four are the places where your answer changes the\n` +
    `structure — worth a thought before the numbers arrive:\n\n` +
    ASKS.map((q, i) => `  ${i + 1}. ${q}`).join("\n") +
    `\n\nReply to this email whenever you like, including with "none of those four cut in the\n` +
    `right place" — that is a useful answer and not a dead end.\n\n— Octant\n`;

  return { to: [enquiry.email], subject: "Octant — your partnership enquiry", html, text };
}

function rateCardMessage(
  email: string, name: string, owner: string | undefined,
  card: { filename: string; content: string } | null,
) {
  const carried = card
    ? "Attached is the rate card: the standalone price, what each of the four shapes costs, what our time costs, and the terms that are fixed."
    : "The rate card follows separately — a technical problem stopped it attaching to this note, and it is being sent by hand.";

  const html = `
<div style="font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#241F19;max-width:540px">
  <p style="margin:0 0 16px">${escapeHtml(GREETING(name))}</p>
  <p style="margin:0 0 16px">${escapeHtml(carried)}</p>
  <p style="margin:0 0 16px">Take it away and work out where it fits &mdash; there is nothing to book and nobody will chase you. Reply to this email with whatever you land on.</p>
  <p style="margin:0 0 4px">&mdash; Octant</p>
  <p style="color:#4C463D;font-size:13px;margin-top:28px;padding-top:16px;border-top:1px solid #E3DED4">
    The attached rates are confidential and are not published anywhere. They hold until the date printed on the sheet.
  </p>
</div>`;

  const text =
    `${GREETING(name)}\n\n${carried}\n\n` +
    `Take it away and work out where it fits — there is nothing to book and nobody will chase\n` +
    `you. Reply to this email with whatever you land on.\n\n— Octant\n\n` +
    `The attached rates are confidential and are not published anywhere. They hold until the\n` +
    `date printed on the sheet.\n`;

  return {
    to: [email],
    subject: "Octant — partner rates and terms",
    html,
    text,
    ...(owner ? { reply_to: owner } : {}),
    ...(card ? { attachments: [card] } : {}),
  };
}

function ownerMessage(
  enquiry: Enquiry, owner: string, ack: { sent: boolean; reason?: string },
  links: { send: string; decline: string } | null, origin: string,
) {
  const who = enquiry.org || enquiry.name || enquiry.email;
  const rows = FIELDS.filter(([key]) => enquiry[key]).map(
    ([key, label]) => `
    <tr>
      <td style="padding:6px 16px 6px 0;color:#6B6459;font-size:14px;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>
      <td style="padding:6px 0;vertical-align:top;white-space:pre-wrap">${escapeHtml(enquiry[key])}</td>
    </tr>`,
  ).join("");

  const buttons = links
    ? `<a href="${links.send}" style="display:inline-block;background:#4C4899;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:500;margin-right:8px">Send the rate card</a>
       <a href="${links.decline}" style="display:inline-block;background:#fff;color:#AA2A1E;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:500;border:1px solid #E3DED4">Leave it</a>`
    : `<p style="color:#983E4A;margin:0"><strong>No signing secret is set, so there are no decision links.</strong> Send the card by hand.</p>`;

  const ackLine = ack.sent
    ? "They have been told it landed and that the numbers follow."
    : `They could NOT be acknowledged (${ack.reason ?? "unknown"}) — as far as they know, nothing happened.`;

  const html = `
<div style="font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#241F19;max-width:560px">
  <p style="font:600 20px/1.3 Georgia,serif;margin:0 0 4px">Partnership enquiry</p>
  <p style="color:#4C463D;margin:0 0 20px">${escapeHtml(who)} asked about putting Octant inside their offering. Nothing has been sent to them but an acknowledgement &mdash; the rate card waits for you.</p>

  <div style="border:1px solid #E3DED4;border-radius:8px;padding:16px;margin-bottom:24px">
    <table style="border-collapse:collapse;font-size:15px">
      <tr>
        <td style="padding:6px 16px 6px 0;color:#6B6459;font-size:14px;vertical-align:top;white-space:nowrap">Email</td>
        <td style="padding:6px 0;vertical-align:top"><a href="mailto:${escapeHtml(enquiry.email)}" style="color:#4C4899">${escapeHtml(enquiry.email)}</a></td>
      </tr>${rows}
    </table>
  </div>

  ${buttons}

  <p style="color:${ack.sent ? "#4C463D" : "#983E4A"};font-size:14px;margin-top:24px">${escapeHtml(ackLine)}</p>
  <p style="color:#4C463D;font-size:14px;margin:8px 0 0">Reply to this email to reach them directly &mdash; it is addressed back to them.</p>
  <p style="color:#4C463D;font-size:13px;margin-top:28px;padding-top:16px;border-top:1px solid #E3DED4">
    ${links ? "These links expire in thirty days. " : ""}From the partner form at
    <a href="${escapeHtml(origin)}/partners" style="color:#4C4899">${escapeHtml(origin)}/partners</a>.
  </p>
</div>`;

  const text =
    `${who} asked about putting Octant inside their offering.\n` +
    `Nothing has been sent to them but an acknowledgement — the rate card waits for you.\n\n` +
    `Email: ${enquiry.email}\n` +
    FIELDS.filter(([key]) => enquiry[key]).map(([key, label]) => `${label}: ${enquiry[key]}`).join("\n") +
    (links
      ? `\n\nSend the rate card: ${links.send}\nLeave it:            ${links.decline}\n`
      : `\n\nNo signing secret is set, so there are no decision links. Send the card by hand.\n`) +
    `\n${ackLine}\n\nReply to this email to reach them directly.\n` +
    `\nFrom the partner form at ${origin}/partners\n`;

  return {
    to: [owner],
    subject: `Octant — partnership enquiry from ${who}`,
    html,
    text,
    reply_to: enquiry.email,
  };
}

/* ------------------------------ the form ------------------------------ */

/** Rules the form adds on top of SITE_CSS. Nothing here overrides a shared rule. */
export const ENQUIRY_CSS = `
  .enq { max-width:640px; margin-top:32px; }
  .enq .grid2 { display:grid; gap:18px; grid-template-columns:repeat(2,minmax(0,1fr)); }
  @media (max-width:640px){ .enq .grid2 { grid-template-columns:minmax(0,1fr); } }
  .enq label { display:block; font-family:var(--sans); font-size:14px; font-weight:600;
               color:var(--m-ink2); margin-bottom:6px; }
  .enq .req { color:var(--m-rose); font-weight:400; }
  .enq input, .enq select, .enq textarea {
    width:100%; box-sizing:border-box; font-family:var(--sans); font-size:16px; line-height:1.5;
    color:var(--m-ink); background:var(--m-paper); border:1px solid var(--m-rule);
    border-radius:8px; padding:11px 13px;
  }
  .enq textarea { min-height:8.5rem; resize:vertical; }
  .enq input:focus-visible, .enq select:focus-visible, .enq textarea:focus-visible {
    outline:2px solid var(--m-accent); outline-offset:1px; border-color:var(--m-accent);
  }
  .enq .field { margin-bottom:18px; }
  .enq .grid2 .field { margin-bottom:0; }
  .enq button {
    font-family:var(--sans); font-size:16px; font-weight:500; cursor:pointer;
    background:var(--m-accent); color:var(--m-on); border:1px solid var(--m-accent);
    border-radius:8px; padding:13px 26px;
  }
  .enq button:hover { filter:brightness(1.06); }
  @media (max-width:640px){ .enq button { width:100%; } }
  /* Off-screen rather than display:none — a bot that skips hidden inputs is
     exactly the bot this field is trying to catch. */
  .enq .hp { position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden; }
  .notice { border-left:3px solid var(--m-accent); background:var(--m-accent-soft);
            border-radius:0 8px 8px 0; padding:18px 22px; margin-top:32px; max-width:640px; }
  .notice.bad { border-left-color:var(--m-rose); background:var(--m-soft); }
  .notice p { font-family:var(--sans); font-size:16px; margin:0; max-width:none; }
`;

/**
 * Stored value, then visible label. The two differ because the owner reads
 * the value in their email and wants the shape letter, while the partner
 * reads the label inside a select box that does not wrap — a label long
 * enough to be truncated is worse than a short one.
 */
const SHAPES = [
  ["", "Not sure yet"],
  ["A · Referral", "A · Referral"],
  ["B · Bundled seats", "B · Bundled seats"],
  ["C · Embedded", "C · Embedded"],
  ["D · White-label", "D · White-label"],
  ["Something else", "Something else"],
];

/**
 * The form. Deliberately six fields and no account: everything here is
 * either something we would ask on a first call anyway, or the token and
 * honeypot that keep the endpoint from being abused. Only the email is
 * required — but the rest is what the owner reads before deciding, which is
 * why the copy asks rather than merely offering.
 *
 * partners.ts does not render this at all after a successful submit — an
 * empty form under a confirmation reads as an invitation to send again, and
 * the second send is the one the stored record silently swallows.
 */
export function enquiryForm(token: string | null): string {
  const options = SHAPES.map(
    ([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`,
  ).join("");
  return `
  <form class="enq" method="post" action="${ENQUIRY_PATH}">
    ${token ? `<input type="hidden" name="_s" value="${escapeHtml(token)}">` : ""}
    <div class="hp" aria-hidden="true">
      <label for="website">Website</label>
      <input id="website" type="text" name="website" tabindex="-1" autocomplete="off">
    </div>

    <div class="field">
      <label for="enq-email">Your email <span class="req">(required)</span></label>
      <input id="enq-email" type="email" name="email" required maxlength="254"
             autocomplete="email" placeholder="you@yourcompany.com">
    </div>

    <div class="grid2">
      <div class="field">
        <label for="enq-name">Your name</label>
        <input id="enq-name" type="text" name="name" maxlength="120" autocomplete="name">
      </div>
      <div class="field">
        <label for="enq-org">Your organisation</label>
        <input id="enq-org" type="text" name="org" maxlength="160" autocomplete="organization">
      </div>
    </div>

    <div class="grid2" style="margin-top:18px">
      <div class="field">
        <label for="enq-shape">Closest shape <span class="muted" style="font-weight:400">(from the table above)</span></label>
        <select id="enq-shape" name="shape">${options}</select>
      </div>
      <div class="field">
        <label for="enq-people">Roughly how many people</label>
        <input id="enq-people" type="text" name="people" maxlength="80" placeholder="e.g. 40 clients a year">
      </div>
    </div>

    <div class="field" style="margin-top:18px">
      <label for="enq-seeking">What you are looking for</label>
      <textarea id="enq-seeking" name="seeking" maxlength="4000"
                placeholder="What you do, where Octant would sit in it, and what you would need it to do that it may not do yet."></textarea>
    </div>

    <button type="submit">Ask for the rate card</button>
    <p class="small muted" style="margin-top:14px">
      A person reads every one of these &mdash; there is no autoresponder holding the numbers.
      You get an acknowledgement now and the full rate card by email once we have read it,
      usually the same working day. Nothing else, ever.
    </p>
  </form>`;
}

/** The banner shown after a redirect back from the POST. */
export function enquiryNotice(sent: string | null): string {
  if (sent === "1") {
    return `<div class="notice"><p><strong>With us.</strong> Check your inbox for the
      acknowledgement &mdash; and spam, if it is not there in a few minutes. The rate card
      follows once a person has read what you sent, usually the same working day.</p></div>`;
  }
  if (sent === "0") {
    return `<div class="notice bad"><p><strong>That did not go through.</strong> The most likely
      cause is an email address the form could not read, or a page left open long enough for its
      form to expire. Reload this page and try once more, or write to us directly &mdash; the
      address is at the bottom of the form.</p></div>`;
  }
  return "";
}
