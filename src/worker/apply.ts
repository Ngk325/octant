import { issueSession, readSession, setCookie, type AuthEnv, type Session } from "./auth";
import { escapeHtml } from "./html";
import { sendMail, type MailEnv } from "./mail";
import { notifyOwnerOfApplication, type NotifyEnv } from "./notify";
import { SHELL } from "./shell";
import { normalise, recordApplication, type Application, type User, type UserEnv } from "./users";

/* ------------------------------------------------------------------ *
 * THE APPLICATION — what somebody says before the owner decides.
 *
 * The wall already held people at `pending` and already mailed the owner
 * a one-tap approve/deny link. What it never did was ASK anything: the
 * owner decided on a Google display name and an address, which is not
 * enough to decide anything, and the applicant heard nothing at all
 * unless they kept the tab open.
 *
 * So the gate now has a step in front of it. Five questions, an
 * acknowledgement by email, and an owner notification that carries the
 * answers — the same shape enquiry.ts settled on for partners, because
 * it is the same problem: somebody is asking, and the person deciding
 * should be able to see who.
 *
 * ALL THREE WAYS IN pass through here, and each keeps what is true about
 * it afterwards:
 *
 *   - Google sign-in: applies, then waits. Unchanged except for the
 *     asking and the acknowledgement.
 *   - Payment: recordSignIn approves a pre-approved address on sight, so
 *     a payer answers the questions and is let straight through. They
 *     bought the product; they did not buy the owner's attention, and
 *     making them wait on an inbox is refund risk.
 *   - An invite code: applies, then waits. A code is stateless and
 *     carries no address, so this is also where a code holder first
 *     becomes somebody the owner can name, write to, or revoke. Their
 *     session is reissued carrying the address they gave, which is what
 *     makes them findable on every later request.
 *
 * Nobody who joined before this existed is sent back to fill it in —
 * see APPLICATION_REQUIRED_FROM in users.ts, and the session `iat` in
 * auth.ts for the code-holder half of the same promise.
 * ------------------------------------------------------------------ */

export interface ApplyEnv extends AuthEnv, UserEnv, MailEnv, NotifyEnv {}

/**
 * The route. auth.ts hardcodes this same string — it has to let an
 * unapplied session through to exactly one path, and importing it from here
 * would make the wall depend on the page it is holding people at.
 * tests/apply.test.ts pins that the two agree.
 */
export const APPLY_PATH = "/apply";

/* ------------------------------ the questions ------------------------------ */

interface Question {
  key: "purpose" | "context" | "familiarity" | "hoping" | "found";
  /** What the owner sees as the row label in their email. */
  label: string;
  prompt: string;
  hint?: string;
  /** Absent for the two free-text questions. */
  choices?: string[];
  required: boolean;
  placeholder?: string;
}

/**
 * Deliberately the vocabulary the site already uses. "Figure yourself out /
 * one relationship / a team / people you coach" is onramp.ts's GOAL_PHRASE,
 * word for word; the familiarity ladder is the one /compare assumes. A new
 * set of words here would mean the same person is asked the same question
 * twice in two dialects, and the answers could not be read together.
 */
const QUESTIONS: Question[] = [
  {
    key: "purpose",
    label: "What brought them",
    prompt: "What brought you here?",
    choices: [
      "Figure myself out",
      "Make sense of one relationship",
      "Read a team I'm part of",
      "Language for people I coach or advise",
    ],
    required: true,
  },
  {
    key: "context",
    label: "Who it is for",
    prompt: "Is this for you, or for work with other people?",
    choices: [
      "Just me",
      "Me and people close to me",
      "My team",
      "Clients I work with professionally",
    ],
    required: true,
  },
  {
    key: "familiarity",
    label: "Familiarity",
    prompt: "How familiar are you with this kind of model?",
    hint: "There is no wrong answer, and no answer that counts against you.",
    choices: ["New to it", "Read a fair amount", "I use one professionally"],
    required: true,
  },
  {
    key: "hoping",
    label: "Hoping it does",
    prompt: "What are you hoping it does that you can't do now?",
    required: true,
    placeholder: "A sentence is plenty.",
  },
  {
    key: "found",
    label: "Found us via",
    prompt: "How did you find Octant?",
    required: false,
    placeholder: "Optional.",
  },
];

const MAX_TEXT = 2000;
const MAX_NAME = 120;
/** Same permissive check as onramp.ts and enquiry.ts — not RFC 5322. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const trim = (v: FormDataEntryValue | null, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/* ------------------------------- the route -------------------------------- */

interface Ctx { waitUntil?(promise: Promise<unknown>): void }

/**
 * `/apply`, behind the wall but ahead of approval — auth.ts lets a signed-in
 * person who still owes an application reach this one path and nothing else.
 * Returns null when the path is not ours.
 *
 * A session is required, always. That is what keeps this from being another
 * public form needing its own anti-abuse apparatus: whoever is posting has
 * already proved a Google identity or an invite code, so there is nothing
 * here for a script to find.
 */
export async function handleApply(
  request: Request, env: ApplyEnv, url: URL, now: number, ctx?: Ctx,
): Promise<Response | null> {
  if (url.pathname !== APPLY_PATH) return null;

  const session = await readSession(request, env, now);
  if (!session) return redirect("/");
  if (!env.USERS) return redirect("/");

  if (request.method === "GET") {
    return page(applicationPage(session, {}), 200);
  }
  if (request.method !== "POST") {
    return new Response("Use GET or POST.", { status: 405 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return page(applicationPage(session, { error: "That did not submit cleanly. Try again." }), 400);

  /* A code session has no address of its own — the invite never carried one.
     This is where they supply it, and it is the only field a Google session
     never sees, because Google already told us. */
  const email = session.email ?? trim(form.get("email"), 254).toLowerCase();
  const values = readValues(form);

  const problem = validate(email, !session.email, values);
  if (problem) {
    return page(applicationPage(session, { error: problem, values, email }), 400);
  }

  const name = session.email
    ? session.label
    : trim(form.get("name"), MAX_NAME) || session.label;

  const application: Application = { ...values, at: now };
  const result = await recordApplication(env, email, name, application, now);
  if (!result) return redirect("/");

  const work = announce(env, url.origin, result.user, now);
  if (ctx?.waitUntil) ctx.waitUntil(work); else await work;

  /* The code holder's session is reissued carrying the address they just
     gave. Without this the next request looks exactly like the last one — a
     code session with no email — and the gate would ask them to apply again,
     forever. */
  const headers: [string, string][] = [["location", "/"]];
  if (!session.email && env.AUTH_SECRET) {
    const token = await issueSession(
      name, session.kind, normalise(email), env.AUTH_SECRET, now, session.codeId,
    );
    headers.push(["set-cookie", setCookie(url, token)]);
  }
  return new Response(null, { status: 303, headers });
}

const redirect = (location: string) =>
  new Response(null, { status: 303, headers: { location, "cache-control": "no-store" } });

const page = (html: string, status: number) =>
  new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-frame-options": "DENY",
      "referrer-policy": "no-referrer",
    },
  });

type Values = Omit<Application, "at">;

function readValues(form: FormData): Values {
  return {
    purpose: trim(form.get("purpose"), MAX_TEXT),
    context: trim(form.get("context"), MAX_TEXT),
    familiarity: trim(form.get("familiarity"), MAX_TEXT),
    hoping: trim(form.get("hoping"), MAX_TEXT),
    found: trim(form.get("found"), MAX_TEXT),
  };
}

/**
 * Server-side, because `required` on an input is a courtesy to a browser and
 * nothing else. A choice is checked against the offered options rather than
 * merely for being non-empty: the owner reads these as English, and a field
 * that can hold arbitrary text is a field that can hold anything a poster
 * likes.
 */
function validate(email: string, needsEmail: boolean, values: Values): string | null {
  if (needsEmail) {
    if (!email) return "We need an address to reach you at.";
    if (email.length > 254 || !EMAIL_RE.test(email)) return "That does not look like an email address.";
  }
  for (const q of QUESTIONS) {
    const given = values[q.key];
    if (!given) {
      if (q.required) return `Please answer: ${q.prompt}`;
      continue;
    }
    if (q.choices && !q.choices.includes(given)) return `Please choose one of the options for: ${q.prompt}`;
  }
  return null;
}

/* ------------------------------ the two sends ------------------------------ */

/**
 * Acknowledge the applicant, then tell the owner. Owner last, for the reason
 * enquiry.ts gives: it is the send that must not be lost, and the only place
 * the acknowledgement's result can be reported. Never throws.
 */
async function announce(
  env: ApplyEnv, origin: string, user: User, now: number,
): Promise<void> {
  try {
    /* "Already in" covers the payer whose account the Stripe webhook opened,
       and nobody else who reaches this function — a fresh applicant is
       `pending` until the owner says otherwise. */
    const alreadyIn = user.status === "approved";
    const ack = await sendMail(env, acknowledgement(user, alreadyIn), "apply", {
      requireVerifiedSender: true,
    });
    if (!ack.sent) console.error(`apply: acknowledgement NOT delivered to ${user.email} — ${ack.reason}`);
    await notifyOwnerOfApplication(env, origin, user, ack, now);
  } catch (err) {
    console.error("apply: announce failed", String(err));
  }
}

const GREETING = (name: string) => (name ? `Hi ${name.split(/\s+/)[0]},` : "Hello,");

function acknowledgement(user: { email: string; name: string }, alreadyIn: boolean) {
  const lede = alreadyIn
    ? "Thank you — you are in. Your account is open now, so you can close this and go straight back to Octant."
    : "Thank you — your request is in, and a person reads every one of them. Nothing opens until they say yes, and you will hear either way.";
  const after = alreadyIn
    ? "What you told us goes to the owner, so the first thing you hear from a person is about your answers rather than your paperwork."
    : "Nothing to do meanwhile. When you are let in, come back and reload — you will not have to sign in again.";

  const html = `
<div style="font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#241F19;max-width:520px">
  <p style="margin:0 0 16px">${escapeHtml(GREETING(user.name))}</p>
  <p style="margin:0 0 16px">${escapeHtml(lede)}</p>
  <p style="margin:0 0 16px">${escapeHtml(after)}</p>
  <p style="margin:0">&mdash; Octant</p>
  <p style="color:#4C463D;font-size:13px;margin-top:28px;padding-top:16px;border-top:1px solid #E3DED4">
    You are getting this because you asked for access to Octant with this address. It is the
    only thing we send about it, and there is nothing to unsubscribe from.
  </p>
</div>`;

  const text =
    `${GREETING(user.name)}\n\n${lede}\n\n${after}\n\n— Octant\n\n` +
    `You are getting this because you asked for access to Octant with this address. It is\n` +
    `the only thing we send about it, and there is nothing to unsubscribe from.\n`;

  return {
    to: [user.email],
    subject: alreadyIn ? "Octant — you're in" : "Octant — we have your request",
    html,
    text,
  };
}

/* -------------------------------- the page -------------------------------- */

/** What the form should show: an error, and whatever they had already typed. */
export interface ApplicationView {
  error?: string;
  values?: Values;
  email?: string;
}

/**
 * The form. No script, deliberately — the CSP pins three inline hashes
 * (headers.ts) and a fourth would have to be added for a form that a plain
 * POST already handles. Radio groups and two text areas need nothing else.
 *
 * Everything the applicant typed is echoed back on a validation failure. A
 * form that empties itself when you get one field wrong is a form people
 * abandon, and this one is standing between a willing reader and the product.
 */
export function applicationPage(session: Session, view: ApplicationView): string {
  const v = view.values;
  const askEmail = !session.email;

  const fields = QUESTIONS.map((q, i) => {
    const given = v?.[q.key] ?? "";
    /* The step label lives INSIDE the legend, not before it. A browser hoists
       <legend> to the top of its fieldset whatever the DOM order says, so a
       sibling above it renders below it — which read as the count belonging to
       the question after this one. */
    const step = `<span class="step">Question ${i + 1} of ${QUESTIONS.length}${q.required ? "" : " · optional"}</span>`;
    const hint = q.hint ? `<p class="hint">${escapeHtml(q.hint)}</p>` : "";

    if (q.choices) {
      const options = q.choices.map((choice) => `
        <label class="choice">
          <input type="radio" name="${q.key}" value="${escapeHtml(choice)}"${given === choice ? " checked" : ""}${q.required ? " required" : ""}>
          <span>${escapeHtml(choice)}</span>
        </label>`).join("");
      return `<fieldset><legend>${step}${escapeHtml(q.prompt)}</legend>${hint}${options}</fieldset>`;
    }

    /* One control needs no fieldset, and a <label> inside a <legend> would be
       two labelling mechanisms for the same thing. */
    return `<div class="q">${step}
      <label for="q-${q.key}">${escapeHtml(q.prompt)}</label>${hint}
      <textarea id="q-${q.key}" name="${q.key}" maxlength="${MAX_TEXT}"${q.required ? " required" : ""}
        placeholder="${escapeHtml(q.placeholder ?? "")}">${escapeHtml(given)}</textarea></div>`;
  }).join("");

  const identity = askEmail
    ? `<div class="q">
        <span class="step">First, who are you</span>
        <label for="q-email">Your email</label>
        <p class="hint">Your code let you in the door; this is how the owner reaches you.</p>
        <input id="q-email" type="email" name="email" required maxlength="254"
               autocomplete="email" value="${escapeHtml(view.email ?? "")}">
        <label for="q-name" style="margin-top:14px">Your name</label>
        <input id="q-name" type="text" name="name" maxlength="${MAX_NAME}" autocomplete="name">
      </div>`
    : `<p class="hint" style="margin-bottom:20px">Signing in as <b>${escapeHtml(session.email ?? "")}</b>.</p>`;

  return SHELL("Octant — ask for access", `
  <h1>Ask for access</h1>
  <p>Octant is opened one person at a time, by hand. Five questions, then the owner decides
  &mdash; and you get an email either way, so you can close this tab.</p>
  ${view.error ? `<p class="msg" role="alert">${escapeHtml(view.error)}</p>` : ""}
  <form method="post" action="${APPLY_PATH}">
    ${identity}
    ${fields}
    <button type="submit">Send my request</button>
  </form>
  <p class="fine">What you write here is read by one person and is not used for anything else.
  Signed in as the wrong account? <a href="/api/auth/google/start">Switch account</a>.</p>`);
}

/** Exported for the owner's email and decision page, so the labels cannot drift. */
export const APPLICATION_FIELDS: [key: Question["key"], label: string][] =
  QUESTIONS.map((q) => [q.key, q.label]);
