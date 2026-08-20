import { seal, unseal } from "./crypto";
import { escapeHtml } from "./html";
import { sendMail, type MailEnv } from "./mail";
import { normalise, type KVNamespace } from "./users";

/* ------------------------------------------------------------------ *
 * THE PARTNER ENQUIRY — form in, two emails out.
 *
 * One POST does three things, in this order:
 *
 *   1. Records the enquiry, so a reload cannot mail anyone twice.
 *   2. Sends the enquirer the private rate card, attached.
 *   3. Tells the owner who asked, what they said, and whether the card
 *      actually went out.
 *
 * Owner mail LAST on purpose: it is the one send that must not be lost,
 * and it is the only place the partner-send result can be reported. If
 * the attachment could not be loaded or the sender is misconfigured, the
 * owner learns that in the same email that tells them somebody is
 * waiting — rather than finding out when the partner never replies.
 *
 * WHAT THIS PAGE GIVES AWAY, said plainly. The rate card is stamped
 * confidential and its numbers are published nowhere, because a
 * wholesale rate in the open is a floor every later negotiation starts
 * from. Sending it automatically on an unverified form submission means
 * anyone willing to type an email address can have it. That is the
 * owner's call (2026-08) and the trade is deliberate: a partner who can
 * see real numbers in the first five minutes qualifies themselves, and
 * the alternative — an owner-approval tap, the same signed-link shape
 * notify.ts already uses for sign-ups — costs hours of latency on every
 * genuine enquiry. Turning that gate on later is a small change: hold
 * step 2 and put an action link in the owner's email instead.
 *
 * What is NOT deliberate is letting this become an open mail relay. An
 * unauthenticated POST that makes this Worker send an Octant-branded
 * message with a confidential attachment to any address a script names
 * is a sender-reputation problem for the whole domain. Three cheap
 * brakes, the same ones onramp.ts settled on for the same reason:
 *
 *   - a signed token minted when /partners rendered, which must be at
 *     least MIN_COMPLETION_MS old (a single scripted POST has none);
 *   - a honeypot field no human ever sees or fills;
 *   - one send per address, enforced by the stored record.
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
   * other. Without the binding the flow still mails; it just cannot dedupe.
   */
  LEADS?: KVNamespace;
  /** Signs the form token. Without it the form still renders, but no enquiry is accepted. */
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

/** Same permissive check as onramp.ts — not RFC 5322, just enough to refuse junk. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FORM_TTL_SECONDS = 6 * 60 * 60;
/** No person reads the four shapes and fills six fields in under two seconds. */
const MIN_COMPLETION_MS = 2_000;
/** Long enough that a partner conversation outlives it; this is not a CRM. */
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

interface Enquiry {
  email: string;
  name: string;
  org: string;
  shape: string;
  people: string;
  seeking: string;
  at: number;
}

/** Field label, and the cap past which we stop reading. Order is the order the owner reads. */
const FIELDS: [key: keyof Omit<Enquiry, "at" | "email">, label: string, max: number][] = [
  ["name", "Name", 120],
  ["org", "Organisation", 160],
  ["shape", "Closest shape", 60],
  ["people", "Roughly how many people", 80],
  ["seeking", "What they are looking for", 4000],
];

const trim = (v: FormDataEntryValue | null, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/* ------------------------------ the route ----------------------------- */

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
  };

  const work = deliver(env, url.origin, enquiry);
  if (ctx?.waitUntil) ctx.waitUntil(work); else await work;
  return seeOther("/partners?sent=1#enquiry");
}

const seeOther = (location: string) =>
  new Response(null, { status: 303, headers: { location, "cache-control": "no-store" } });

/* ---------------------------- the two sends --------------------------- */

/**
 * Record, mail the partner, mail the owner. Never throws — a failed send
 * must not turn into a 500 on a public form, and the redirect has usually
 * already gone out by the time this runs.
 */
async function deliver(env: PartnerEnquiryEnv, origin: string, enquiry: Enquiry): Promise<void> {
  try {
    if (env.LEADS) {
      const existing = await env.LEADS.get(KEY(enquiry.email));
      if (existing) return; // already handled — a reload, or a second submit
      await env.LEADS.put(KEY(enquiry.email), JSON.stringify(enquiry), {
        expirationTtl: RECORD_TTL_SECONDS,
      });
    }

    const owner = env.NOTIFY_EMAIL || env.OWNER_EMAIL;
    const card = await rateCardAttachment(env, origin);
    const partner = await sendMail(env, partnerMessage(enquiry, owner, card), "enquiry", {
      requireVerifiedSender: true,
    });
    if (!partner.sent) {
      console.error(`enquiry: rate card NOT delivered to ${enquiry.email} — ${partner.reason}`);
    }

    if (!owner) {
      console.error("enquiry: nobody to notify — set OWNER_EMAIL or NOTIFY_EMAIL");
      return;
    }
    await sendMail(env, ownerMessage(enquiry, owner, partner, !!card, origin), "enquiry");
  } catch (err) {
    console.error("enquiry: delivery failed", String(err));
  }
}

/**
 * Read the committed PDF out of the static build. Returns null rather than
 * throwing on every way this can be absent — an unbuilt dist, the dev shim's
 * empty passthrough response, a renamed file — because the partner should
 * still get an answer, and the owner's email says which version they got.
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
 * Repeating them here is deliberate: the point of sending the card first is
 * that the partner's reply can be substantive instead of a scheduling email.
 */
const ASKS = [
  "Which of the four shapes looks closest — A referral, B bundled seats, C embedded, D white-label?",
  "At renewal, whose product is the client renewing?",
  "Roughly how many people would be reading, and over what period?",
  "What is the missing piece that would make this fit cleanly?",
];

function partnerMessage(
  enquiry: Enquiry, owner: string | undefined, card: { filename: string; content: string } | null,
) {
  const subject = "Octant — partner rates and terms";
  const carried = card
    ? "Attached is the rate card: the standalone price, what each of the four shapes costs, what our time costs, and the terms that are fixed."
    : "The rate card follows separately in the next day — a technical problem stopped it attaching to this note, and it is being sent by hand.";

  const asksHtml = ASKS.map((q) => `<li style="margin-bottom:8px">${escapeHtml(q)}</li>`).join("");
  const html = `
<div style="font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#241F19;max-width:540px">
  <p style="margin:0 0 16px">${escapeHtml(GREETING(enquiry.name))}</p>
  <p style="margin:0 0 16px">Thank you for the enquiry about putting Octant inside what you offer. ${escapeHtml(carried)}</p>
  <p style="margin:0 0 8px">Nothing in it needs answering in order. When you have read it, these four are the places where your answer changes the structure:</p>
  <ol style="color:#4C463D;margin:0 0 20px;padding-left:20px">${asksHtml}</ol>
  <p style="margin:0 0 16px">Take it away and work out where it fits. Reply to this email with whatever you land on — including &ldquo;none of these four cut in the right place&rdquo;, which is a useful answer and not a dead end.</p>
  <p style="margin:0 0 4px">&mdash; Octant</p>
  <p style="color:#4C463D;font-size:13px;margin-top:28px;padding-top:16px;border-top:1px solid #E3DED4">
    The attached rates are confidential and are not published anywhere. They hold until the date printed on the sheet.
  </p>
</div>`;

  const text =
    `${GREETING(enquiry.name)}\n\n` +
    `Thank you for the enquiry about putting Octant inside what you offer. ${carried}\n\n` +
    `Nothing in it needs answering in order. When you have read it, these four are the places\n` +
    `where your answer changes the structure:\n\n` +
    ASKS.map((q, i) => `  ${i + 1}. ${q}`).join("\n") +
    `\n\nTake it away and work out where it fits. Reply to this email with whatever you land on —\n` +
    `including "none of these four cut in the right place", which is a useful answer.\n\n` +
    `— Octant\n\n` +
    `The attached rates are confidential and are not published anywhere. They hold until the\n` +
    `date printed on the sheet.\n`;

  return {
    to: [enquiry.email],
    subject,
    html,
    text,
    ...(owner ? { reply_to: owner } : {}),
    ...(card ? { attachments: [card] } : {}),
  };
}

function ownerMessage(
  enquiry: Enquiry, owner: string, partner: { sent: boolean; reason?: string },
  hadCard: boolean, origin: string,
) {
  const who = enquiry.org || enquiry.name || enquiry.email;
  const rows = FIELDS.filter(([key]) => enquiry[key]).map(
    ([key, label]) => `
    <tr>
      <td style="padding:6px 16px 6px 0;color:#6B6459;font-size:14px;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>
      <td style="padding:6px 0;vertical-align:top;white-space:pre-wrap">${escapeHtml(enquiry[key])}</td>
    </tr>`,
  ).join("");

  const status = partner.sent
    ? hadCard
      ? "The rate card went out to them, attached."
      : "A note went out to them, but WITHOUT the rate card — the PDF was not readable from the build. Send it by hand."
    : `Nothing reached them: ${partner.reason ?? "unknown"}. Send the card by hand.`;
  const statusColour = partner.sent && hadCard ? "#244C43" : "#983E4A";

  const html = `
<div style="font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#241F19;max-width:560px">
  <p style="font:600 20px/1.3 Georgia,serif;margin:0 0 4px">Partnership enquiry</p>
  <p style="color:#4C463D;margin:0 0 20px">${escapeHtml(who)} asked about putting Octant inside their offering.</p>

  <div style="border:1px solid #E3DED4;border-radius:8px;padding:16px;margin-bottom:20px">
    <table style="border-collapse:collapse;font-size:15px">
      <tr>
        <td style="padding:6px 16px 6px 0;color:#6B6459;font-size:14px;vertical-align:top;white-space:nowrap">Email</td>
        <td style="padding:6px 0;vertical-align:top"><a href="mailto:${escapeHtml(enquiry.email)}" style="color:#4C4899">${escapeHtml(enquiry.email)}</a></td>
      </tr>${rows}
    </table>
  </div>

  <p style="color:${statusColour};margin:0 0 20px;font-size:15px"><strong>${escapeHtml(status)}</strong></p>
  <p style="color:#4C463D;font-size:14px;margin:0">Reply to this email to reach them directly &mdash; it is addressed back to them.</p>
  <p style="color:#4C463D;font-size:13px;margin-top:28px;padding-top:16px;border-top:1px solid #E3DED4">
    From the partner form at <a href="${escapeHtml(origin)}/partners" style="color:#4C4899">${escapeHtml(origin)}/partners</a>.
  </p>
</div>`;

  const text =
    `${who} asked about putting Octant inside their offering.\n\n` +
    `Email: ${enquiry.email}\n` +
    FIELDS.filter(([key]) => enquiry[key]).map(([key, label]) => `${label}: ${enquiry[key]}`).join("\n") +
    `\n\n${status}\n\nReply to this email to reach them directly.\n` +
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
 * honeypot that keep the endpoint from being a mail relay. Only the email
 * is required, because a partner who wants the numbers and nothing else
 * should be able to have them.
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

    <button type="submit">Send the rate card</button>
    <p class="small muted" style="margin-top:14px">
      You get the rates and terms by email straight away &mdash; the standalone price, what each
      shape costs, what our time costs, and what is fixed. One email, and a reply from a person.
      Nothing else, ever.
    </p>
  </form>`;
}

/** The banner shown after a redirect back from the POST. */
export function enquiryNotice(sent: string | null): string {
  if (sent === "1") {
    return `<div class="notice"><p><strong>On their way.</strong> The rates and terms are heading
      to your inbox now &mdash; check spam if they are not there in a few minutes. Reply to that
      email and it reaches a person, not a queue.</p></div>`;
  }
  if (sent === "0") {
    return `<div class="notice bad"><p><strong>That did not go through.</strong> The most likely
      cause is an email address the form could not read, or a page left open long enough for its
      form to expire. Reload this page and try once more, or write to us directly &mdash; the
      address is at the bottom of the form.</p></div>`;
  }
  return "";
}
