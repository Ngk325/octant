import { escapeHtml } from "./html";
import { normalise, type UserEnv } from "./users";
import { notifyOwnerOfScholarship, type NotifyEnv } from "./notify";

/* ------------------------------------------------------------------ *
 * THE FREE SCHOLARSHIP — "nobody is turned away for lack of funds."
 *
 * A public, pre-wall route (`/apply`, alongside `/signin`) that asks for
 * a name, a situation, and a reason, reflects the whole application back
 * for one last look, and then does exactly one thing: tells the owner.
 * Nothing here grants access by itself — that stays a person's decision,
 * made from the notification email's signed links or from `/admin`,
 * exactly like an ordinary Google sign-in.
 *
 * Stateless by design, like the rest of this Worker: there is no
 * in-progress-application record. Every step's answers travel forward as
 * hidden fields on the next step's form, so a lost tab loses nothing that
 * matters — the applicant just starts again — and the server never has to
 * reconcile an abandoned draft with a later one.
 *
 * Storage only begins once the form is actually submitted: one KV record
 * per applicant, in the same USERS namespace as the user list but under
 * its own key prefix, because it is a different kind of fact (a request,
 * not an account) rather than a different store.
 * ------------------------------------------------------------------ */

export interface ScholarshipEnv extends UserEnv, NotifyEnv {}

export type ScholarshipStatus = "pending" | "approved" | "denied";

export interface ScholarshipRequest {
  email: string;
  name: string;
  country: string;
  reason: string;
  status: ScholarshipStatus;
  /** Epoch ms. */
  submittedAt: number;
  decidedAt?: number;
}

const KEY = (email: string) => `scholarship:${normalise(email)}`;

export async function getScholarship(env: UserEnv, email: string): Promise<ScholarshipRequest | null> {
  if (!env.USERS) return null;
  const raw = await env.USERS.get(KEY(email));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ScholarshipRequest;
  } catch {
    return null;
  }
}

async function putScholarship(env: UserEnv, req: ScholarshipRequest): Promise<void> {
  if (env.USERS) await env.USERS.put(KEY(req.email), JSON.stringify(req));
}

/** Every application, most recent first. Same pagination posture as `listUsers`. */
export async function listScholarships(env: UserEnv): Promise<ScholarshipRequest[]> {
  if (!env.USERS) return [];

  const keys: { name: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.USERS.list({ prefix: "scholarship:", cursor });
    keys.push(...page.keys);
    cursor = page.list_complete === false ? page.cursor : undefined;
  } while (cursor);

  const reqs = await Promise.all(
    keys.map(async ({ name }) => {
      const raw = await env.USERS!.get(name);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as ScholarshipRequest;
      } catch {
        return null;
      }
    }),
  );
  return reqs.filter((r): r is ScholarshipRequest => !!r).sort((a, b) => b.submittedAt - a.submittedAt);
}

/** Record the owner's decision. Does not itself grant or revoke access — see admin.ts. */
export async function decideScholarship(
  env: UserEnv, email: string, status: "approved" | "denied", now: number,
): Promise<ScholarshipRequest | null> {
  const req = await getScholarship(env, email);
  if (!req) return null;
  const next: ScholarshipRequest = { ...req, status, decidedAt: now };
  await putScholarship(env, next);
  return next;
}

/* -------------------------------- the wizard -------------------------------- */

const MAX = { name: 120, email: 200, country: 160, reason: 4000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Values { name: string; email: string; country: string; reason: string }
const EMPTY: Values = { name: "", email: "", country: "", reason: "" };

type Step = 1 | 2 | 3 | 4;

const clip = (s: string, n: number) => s.slice(0, n);

function readValues(form: FormData): Values {
  return {
    name: clip(String(form.get("name") ?? "").trim(), MAX.name),
    email: clip(String(form.get("email") ?? "").trim(), MAX.email),
    country: clip(String(form.get("country") ?? "").trim(), MAX.country),
    reason: clip(String(form.get("reason") ?? "").trim(), MAX.reason),
  };
}

/** The one field (or set of fields) each step actually owns. */
function validateStep(step: Step, v: Values): string | null {
  if (step === 1) {
    if (!v.name) return "Enter your name.";
    if (!v.email || !EMAIL_RE.test(v.email)) return "Enter a valid email address.";
  }
  if (step === 2 && !v.country) return "Tell us where you are, or your situation.";
  if (step === 3 && !v.reason) return "Say a little about why you're applying.";
  return null;
}

const clampStep = (n: number): Step => (n === 2 || n === 3 || n === 4 ? n : 1);

/* Best-effort, per-isolate brake — see auth.ts's `failures` map for the same
   posture. This form has no session and nothing else stopping a script from
   filling the owner's inbox, so a small local ceiling is worth having even
   though Workers are free to spin up a fresh isolate with a clean counter. */
const SUBMIT_WINDOW_MS = 60 * 60_000;
const MAX_SUBMITS_PER_IP = 5;
const submits = new Map<string, number[]>();

function tooManySubmissions(ip: string, now: number): boolean {
  const recent = (submits.get(ip) ?? []).filter((t) => now - t < SUBMIT_WINDOW_MS);
  return recent.length >= MAX_SUBMITS_PER_IP;
}
function recordSubmission(ip: string, now: number): void {
  const recent = (submits.get(ip) ?? []).filter((t) => now - t < SUBMIT_WINDOW_MS);
  recent.push(now);
  submits.set(ip, recent);
  if (submits.size > 5_000) submits.clear();
}

const hidden = (name: string, value: string) =>
  `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`;

function renderStep(step: Step, v: Values, error?: string): string {
  const dots = ([1, 2, 3, 4] as const)
    .map((n) => `<span class="dot${n <= step ? " on" : ""}"></span>`).join("");

  let body = "";
  if (step === 1) {
    body = `
      <label for="name">Name</label>
      <input id="name" name="name" type="text" required maxlength="${MAX.name}"
             value="${escapeHtml(v.name)}" autocomplete="name">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required maxlength="${MAX.email}"
             value="${escapeHtml(v.email)}" autocomplete="email">`;
  } else if (step === 2) {
    body = `
      ${hidden("name", v.name)}${hidden("email", v.email)}
      <label for="country">Where you are, or your situation</label>
      <input id="country" name="country" type="text" required maxlength="${MAX.country}"
             value="${escapeHtml(v.country)}"
             placeholder="e.g. Lagos, Nigeria — or “full-time student, no income”">`;
  } else if (step === 3) {
    body = `
      ${hidden("name", v.name)}${hidden("email", v.email)}${hidden("country", v.country)}
      <label for="reason">Why you're applying</label>
      <textarea id="reason" name="reason" required maxlength="${MAX.reason}" rows="5"
                placeholder="A sentence or two is plenty.">${escapeHtml(v.reason)}</textarea>`;
  } else {
    body = `
      ${hidden("name", v.name)}${hidden("email", v.email)}${hidden("country", v.country)}${hidden("reason", v.reason)}
      <div class="review">
        <div><span class="k">Name</span><span class="v">${escapeHtml(v.name)}</span></div>
        <div><span class="k">Email</span><span class="v">${escapeHtml(v.email)}</span></div>
        <div><span class="k">Situation</span><span class="v">${escapeHtml(v.country)}</span></div>
        <div><span class="k">Why</span><span class="v">${escapeHtml(v.reason)}</span></div>
      </div>
      <p class="fine" style="margin-top:0">This is exactly what the owner will read. Go back to fix anything.</p>`;
  }

  const nextValue = step === 4 ? "submit" : "next";
  const nextLabel = step === 4 ? "Submit application" : "Continue →";

  return SHELL("Octant — apply for a scholarship", `
    <h1>Apply for a scholarship</h1>
    <p>Nobody is turned away for lack of funds. A few short questions, read personally by the
    person who runs this — no form ever decides on its own.</p>
    <div class="progress" role="group" aria-label="Part ${step} of 4">${dots}</div>
    <form method="POST" action="/apply">
      <input type="hidden" name="step" value="${step}">
      ${body}
      ${error ? `<p class="msg">${escapeHtml(error)}</p>` : `<p class="msg"></p>`}
      <div class="nav">
        ${step > 1 ? `<button type="submit" name="intent" value="back" class="btn">← Back</button>` : "<span></span>"}
        <button type="submit" name="intent" value="${nextValue}" class="btn primary">${nextLabel}</button>
      </div>
    </form>
    <p class="fine">Already applied? A new submission replaces your last one — the owner only
    ever sees where things stand now. <a href="/signin">Have a code or an approved account?</a></p>`);
}

const thanksPage = () => SHELL("Octant — application sent", `
  <div class="mark">✓</div>
  <h1>Sent</h1>
  <p>Your application went straight to the person who runs Octant, with nothing in between.
  You'll hear back by email — approved or not — and if it's a yes, sign in with Google using the
  same address and you're straight in.</p>
  <p class="fine"><a href="/">Back to the front page</a></p>`);

/**
 * `/apply`. Returns null when the path is not ours, so the caller can carry
 * on — same convention as `handleRead` and the Google routes.
 */
export async function handleScholarship(
  request: Request, env: ScholarshipEnv, url: URL, now: number,
  ctx?: { waitUntil?(p: Promise<unknown>): void },
): Promise<Response | null> {
  if (url.pathname !== "/apply") return null;

  if (request.method === "GET") return htmlPage(renderStep(1, EMPTY), 200);
  if (request.method !== "POST") return htmlPage(renderStep(1, EMPTY), 405);

  const form = await request.formData().catch(() => null);
  if (!form) return htmlPage(renderStep(1, EMPTY, "That didn't come through. Try again."), 400);

  const currentStep = clampStep(Number(form.get("step")));
  const intent = form.get("intent") === "back" ? "back"
    : form.get("intent") === "submit" ? "submit" : "next";
  const v = readValues(form);

  if (intent === "back") {
    return htmlPage(renderStep(Math.max(1, currentStep - 1) as Step, v), 200);
  }

  const error = validateStep(currentStep, v);
  if (error) return htmlPage(renderStep(currentStep, v, error), 200);

  if (currentStep < 4) {
    return htmlPage(renderStep((currentStep + 1) as Step, v), 200);
  }

  /* currentStep === 4: the review screen's own submit. Re-validate every
     field regardless of which step it belongs to — a hand-crafted POST could
     jump straight here with a blank field the earlier steps never saw. */
  for (const s of [1, 2, 3] as const) {
    const err = validateStep(s, v);
    if (err) return htmlPage(renderStep(s, v, err), 200);
  }

  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  if (tooManySubmissions(ip, now)) {
    return htmlPage(renderStep(4, v, "Too many attempts from this connection. Try again in an hour."), 429);
  }

  const req: ScholarshipRequest = {
    email: normalise(v.email), name: v.name, country: v.country, reason: v.reason,
    status: "pending", submittedAt: now,
  };
  await putScholarship(env, req);
  recordSubmission(ip, now);

  const send = notifyOwnerOfScholarship(env, url.origin, req, now);
  if (typeof ctx?.waitUntil === "function") ctx.waitUntil(send); else await send;

  return htmlPage(thanksPage(), 200);
}

/* -------------------------------- rendering -------------------------------- */
/* Self-contained, like every other pre-wall page — the static bundle is
   behind the wall too, so this cannot reach for its stylesheet or its
   fonts. No inline <script> anywhere: back/next are two submit buttons on
   one form, so the CSP's two-hash allowance never has to grow a third. */

const SHELL = (title: string, body: string) => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${title}</title>
<style>
  :root { color-scheme: light dark; --paper:#FDFCFA; --ink:#1A1714; --ink2:#4C463D;
          --rule:#E3DED4; --accent:#6B3BC4; --on:#fff; --bad:#AA2A1E; --surface:#fff; }
  @media (prefers-color-scheme: dark) {
    :root { --paper:#141310; --ink:#EDE9E1; --ink2:#B6AFA3; --rule:#2E2A24;
            --accent:#C9A0FF; --on:#1A1714; --bad:#E87A68; --surface:#1D1B17; }
  }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; padding:24px;
         background:var(--paper); color:var(--ink);
         font:400 19px/1.65 Georgia,"Times New Roman",serif; }
  main, form { width:100%; }
  .wrap { width:100%; max-width:32rem; }
  h1 { font-size:32px; line-height:1.2; margin:0 0 8px; }
  p { color:var(--ink2); margin:0 0 20px; }
  label { display:block; font:500 15px/1.4 system-ui,sans-serif; margin:16px 0 6px; }
  input, textarea { font:400 17px/1.4 system-ui,sans-serif; padding:12px 14px;
          border:1px solid var(--rule); border-radius:6px; background:var(--surface);
          color:var(--ink); width:100%; resize:vertical; }
  input:focus-visible, textarea:focus-visible { outline:2px solid var(--accent); outline-offset:1px; }
  .btn { font:500 16px/1 system-ui,sans-serif; padding:13px 18px; border:1px solid var(--rule);
         border-radius:6px; background:var(--surface); color:var(--ink); cursor:pointer; }
  .btn.primary { background:var(--accent); color:var(--on); border-color:var(--accent); }
  .nav { display:flex; justify-content:space-between; gap:12px; margin-top:22px; }
  .msg { font:400 15px/1.5 system-ui,sans-serif; color:var(--bad); min-height:1.4em; margin:14px 0 0; }
  .fine { font:400 15px/1.6 system-ui,sans-serif; color:var(--ink2); margin-top:28px;
          padding-top:20px; border-top:1px solid var(--rule); }
  .fine a { color:var(--accent); }
  .mark { font-size:34px; line-height:1; margin-bottom:12px; }
  .progress { display:flex; gap:8px; margin:4px 0 24px; }
  .dot { width:28px; height:4px; border-radius:2px; background:var(--rule); }
  .dot.on { background:var(--accent); }
  .review { display:flex; flex-direction:column; gap:14px; border:1px solid var(--rule);
            border-radius:8px; padding:16px; background:var(--surface); }
  .review .k { display:block; font:600 13px/1 system-ui,sans-serif; text-transform:uppercase;
               letter-spacing:.04em; color:var(--ink2); margin-bottom:4px; }
  .review .v { display:block; font-family:system-ui,sans-serif; font-size:16px;
               white-space:pre-wrap; word-break:break-word; }
</style>
</head><body><div class="wrap"><main>${body}</main></div></body></html>`;

const htmlPage = (html: string, status: number) =>
  new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
