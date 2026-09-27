import { calculate, COIN_OPTIONS } from "../engine/ops";
import { seal, unseal } from "./crypto";
import { escapeHtml } from "./html";
import { captureLead, FRICTION_COPY, stripeHref, type LeadsEnv } from "./leads";
import { FAVICON, MARK, STRIPE_LINK } from "./marketing";
import { normalise } from "./users";

/** The third argument the runtime passes to fetch. Duplicated from index.ts's
 *  Ctx (a type-only cross-import would work too, but this is a one-line
 *  interface and index.ts already imports this file — keeping it local
 *  avoids leaning on that direction reversing cleanly). */
interface Ctx { waitUntil?(promise: Promise<unknown>): void }

/** Minimal Workers Analytics Engine surface this file uses. */
interface AnalyticsEngineDataset {
  writeDataPoint(point: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void;
}

export interface OnrampEnv extends LeadsEnv {
  ONRAMP_ANALYTICS?: AnalyticsEngineDataset;
  /**
   * Cross-isolate ceiling on done-step capture attempts, keyed by connecting
   * IP — same binding shape and degrade-open posture as LOGIN_LIMITER
   * (auth.ts). Only the capture path consumes it; browsing the funnel's
   * steps never does.
   */
  ONRAMP_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

/* ------------------------------------------------------------------ *
 * THE ONRAMP — a short, public, worker-rendered quiz funnel.
 *
 * Same posture as marketing.ts and read.ts: complete, self-contained
 * HTML, no reference to the gated app bundle. That is load-bearing, not
 * a style choice — wrangler.jsonc's run_worker_first covers every
 * request, including every JS chunk of the SPA, so a React route here
 * would ship the whole gated app (all 16 readings, all 256 relations,
 * chat, admin) to anonymous ad traffic the moment it landed on a quiz
 * link. This file never imports anything from src/views or src/components.
 *
 * State lives entirely in the query string (?step=N&goal=...&q0=...),
 * never in a session or cookie: every step is a plain GET <form> that
 * re-emits everything collected so far as hidden inputs plus the new
 * step's own field. That makes reload, the browser back button and a
 * resumed mid-funnel link all work for free. The one deliberate cost:
 * the captured email transits as a query parameter (server logs,
 * browser history) — accepted in exchange for needing no client JS or
 * storage at all to carry state between steps.
 *
 * The ONE write this file makes is at the done step, once, to LEADS
 * (see leads.ts) — capturing the email and firing the explainer email
 * the copy already promises. Every other step is still pure rendering
 * with no side effect, and a captureLead() failure never blocks the
 * page from rendering (best-effort, matching every other side effect
 * in this Worker).
 *
 * Two of the questions read real coins (index 0 and 4, both members of
 * DETERMINING) and score them with the exact calculate() /calculator
 * uses, so the "field narrows to N of 16" teaser is a real, honestly
 * computed number, never invented. calculate()'s own status logic keeps
 * `best` null until all four DETERMINING coins are answered, so this
 * funnel is structurally unable to claim a definitive type from two
 * partial answers — which matters, because marketing.ts explicitly
 * positions Octant against tools that overclaim from a label.
 * ------------------------------------------------------------------ */

/** A basic, deliberately permissive format check — not full RFC 5322, just
 *  enough to reject "this endpoint can mail anything" abuse. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/*
 * A well-formed email alone does not prove anyone actually walked the
 * funnel: `/onramp?step=11&email=<anything>` is a single unauthenticated
 * GET, and without more it turns the endpoint into a script's way to make
 * this Worker mail an Octant-branded message to any address it likes —
 * spam-complaint and sender-reputation risk for the whole domain, not
 * just a nuisance.
 *
 * The mitigation matches how this Worker already proves things without a
 * session (seal/unseal, also used for the admin approve/deny links and the
 * unsubscribe link): step 0 mints a short-lived signed token carrying its
 * own issue time, and — because it isn't any step's own answer key —
 * hiddenEcho() carries it forward through every later step for free. Lead
 * capture at the done step requires a token whose signature checks out AND
 * whose age is at least MIN_COMPLETION_MS: long enough that no real person
 * could have answered ten questions in less, short enough to not slow down
 * anyone who actually did.
 *
 * The token also carries a random nonce, which makes it single-use: the
 * first capture records which address consumed it (in LEADS, beside the
 * lead it created — one extra write per genuine capture, nowhere near the
 * high-frequency shape leads.ts's header comment warns about), so the same
 * token replayed with a second address is refused outright instead of
 * minting an unlimited stream of Octant-branded emails and KV writes. The
 * same address again is just a reload of the done page, which captureLead
 * already treats as a no-op. ONRAMP_LIMITER (above) caps how fast one IP
 * can attempt captures at all, which also closes the mint-a-fresh-token-
 * per-address loop the nonce alone cannot see.
 */
const START_TTL_SECONDS = 60 * 60;
const MIN_COMPLETION_MS = 2_000;

async function issueStartToken(env: LeadsEnv, now: number): Promise<string | null> {
  if (!env.AUTH_SECRET) return null;
  const nonce = [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return seal({ t: now, n: nonce }, env.AUTH_SECRET, START_TTL_SECONDS, now);
}

/** The token's nonce when signature and age both check out, else null. */
async function verifyStartToken(env: LeadsEnv, token: string | null, now: number): Promise<string | null> {
  if (!env.AUTH_SECRET || !token) return null;
  const payload = await unseal<{ t: number; n?: string }>(token, env.AUTH_SECRET, now);
  if (!payload || typeof payload.n !== "string" || !payload.n) return null;
  return now - payload.t >= MIN_COMPLETION_MS ? payload.n : null;
}

/**
 * Enforce one capture per start token. "fresh" claims the nonce for this
 * address; "reload" is the same address again (harmless — captureLead is
 * idempotent); "replayed" is the abuse case: a second address on a token
 * that already captured. Without a LEADS store there is nothing to protect —
 * captureLead is a no-op — so the check passes open.
 */
async function consumeStartToken(
  env: LeadsEnv, nonce: string, email: string,
): Promise<"fresh" | "reload" | "replayed"> {
  if (!env.LEADS) return "fresh";
  const key = `start:${nonce}`;
  const used = await env.LEADS.get(key);
  if (used !== null) return used === normalise(email) ? "reload" : "replayed";
  await env.LEADS.put(key, normalise(email), { expirationTtl: START_TTL_SECONDS });
  return "fresh";
}

type Option = { value: string; label: string };

type Step =
  | { kind: "intro" }
  | { kind: "single"; key: string; prompt: string; sub?: string; options: Option[] }
  | { kind: "likert5"; key: string; statement: string }
  | { kind: "multi"; key: string; prompt: string; max: number; options: Option[] }
  | {
      kind: "interstitial";
      heading: (p: URLSearchParams) => string;
      body: (p: URLSearchParams) => string;
    }
  | { kind: "email" }
  | { kind: "done" };

const LIKERT: Option[] = [
  { value: "strongly_disagree", label: "Strongly disagree" },
  { value: "somewhat_disagree", label: "Somewhat disagree" },
  { value: "neutral", label: "Neutral" },
  { value: "somewhat_agree", label: "Somewhat agree" },
  { value: "strongly_agree", label: "Strongly agree" },
];

const GOAL_PHRASE: Record<string, string> = {
  self: "figure yourself out",
  relationship: "make sense of one relationship",
  team: "read the team you're part of",
  coach: "have language for people you coach or advise",
};

/** The answers array calculate() expects, from whatever the funnel has collected so far. */
function answersFrom(p: URLSearchParams): (string | null)[] {
  const a: (string | null)[] = Array(8).fill(null);
  a[0] = p.get("q0");
  a[4] = p.get("q4");
  return a;
}

/**
 * The genuinely-narrowed field size, or null when the coins say nothing: 16
 * means no coin was answered (nothing narrowed), 0 means the values were
 * invalid (a hand-edited URL). Both used to render self-negating headlines —
 * "one of about 16 of the sixteen", "0 of the sixteen" — so both fall back.
 */
function fieldNarrowed(p: URLSearchParams): number | null {
  const n = calculate(answersFrom(p)).field.length;
  return n > 0 && n < 16 ? n : null;
}

/**
 * A GET `<form>` submits repeated same-name checkboxes as repeated params
 * (`friction=recurring&friction=meetings`), not one comma-joined value —
 * `getAll` is the only correct way to read them back. `.get()` would
 * silently return just the first pick and drop the second.
 */
const frictionValues = (p: URLSearchParams, key = "friction"): string[] =>
  p.getAll(key).filter(Boolean);

const STEPS: readonly Step[] = [
  { kind: "intro" },
  {
    kind: "single",
    key: "goal",
    prompt: "What are you hoping to get clearer on?",
    options: [
      { value: "self", label: "Myself" },
      { value: "relationship", label: "One relationship" },
      { value: "team", label: "A team I'm part of" },
      { value: "coach", label: "Coaching or advising others" },
    ],
  },
  {
    kind: "single",
    key: "q0",
    prompt: "Walking into something new and unstructured — what happens first?",
    options: [
      { value: COIN_OPTIONS[0][0], label: "I take it in — read the room, decide later." },
      { value: COIN_OPTIONS[0][1], label: "I size it up — form a take fast, refine as I go." },
    ],
  },
  {
    kind: "likert5",
    key: "hook1",
    statement:
      "I can usually tell within a few minutes how someone is “wired” — even if I can't say why.",
  },
  {
    kind: "interstitial",
    heading: () => "Good to know.",
    body: (p) => {
      const phrase = GOAL_PHRASE[p.get("goal") ?? ""] ?? "figure out what you're seeing in people";
      return `You said you're mainly here to ${phrase}. That's exactly where seeing the ` +
        `mechanism — not just a label — does the most work.`;
    },
  },
  {
    kind: "single",
    key: "q4",
    prompt: "When you're trying to understand something, which comes first?",
    options: [
      { value: COIN_OPTIONS[4][0], label: "The concrete, provable thing." },
      { value: COIN_OPTIONS[4][1], label: "The connections between things." },
    ],
  },
  {
    kind: "multi",
    key: "friction",
    prompt: "Which of these sounds familiar? (pick up to two)",
    max: 2,
    options: [
      { value: "recurring", label: "The same disagreement keeps repeating with one person" },
      { value: "drain", label: "I can't tell why one colleague drains me and another doesn't" },
      { value: "meetings", label: "Team meetings end with everyone knowing their letters, nothing else changing" },
      { value: "language", label: "I don't have shared language for what I already notice about people" },
    ],
  },
  {
    // Personalized reflection, echoing the visitor's own friction answer
    // back using marketing.ts's real #problem-section copy — not a new claim.
    kind: "interstitial",
    heading: (p) => {
      const key = frictionValues(p)[0];
      return (key && FRICTION_COPY[key]?.heading) || FRICTION_COPY.drain.heading;
    },
    body: (p) => {
      const key = frictionValues(p)[0];
      return (key && FRICTION_COPY[key]?.body) || FRICTION_COPY.drain.body;
    },
  },
  {
    kind: "interstitial",
    heading: (p) => {
      const field = fieldNarrowed(p);
      return field
        ? `Your pattern is one of about ${field} of the sixteen.`
        : "Your pattern is one of the sixteen.";
    },
    body: (p) =>
      fieldNarrowed(p)
        ? "The other six either/or questions pin down exactly which one — that's the full read, " +
          "not this teaser."
        : "The eight either/or questions pin down exactly which one — that's the full read, " +
          "not this teaser.",
  },
  {
    // Objection handling right before the email ask — the same "descriptions
    // are horoscopes" point marketing.ts's #how section already makes.
    kind: "interstitial",
    heading: () => "Descriptions are horoscopes.",
    body: () =>
      "A paragraph about \"your type\" can't tell you why one colleague energizes you and " +
      "another exhausts you doing the same job. Octant derives every reading from the same " +
      "underlying structure, so it can show you the mechanism — not just an adjective.",
  },
  { kind: "email" },
  { kind: "done" },
];

const QUESTION_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // dot-progress range; 0 = intro, 11 = done

/* -------------------------------- rendering -------------------------------- */

const clampStep = (raw: string | null): number => {
  const n = raw === null ? 0 : Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 0), STEPS.length - 1);
};

/** The accumulated query string with `step` replaced, for Back links and hidden state. */
function withStep(p: URLSearchParams, step: number): string {
  const next = new URLSearchParams(p);
  next.set("step", String(step));
  return next.toString();
}

/** Hidden inputs echoing every answer collected so far, except the current step's own key(s). */
function hiddenEcho(p: URLSearchParams, omit: string[]): string {
  const skip = new Set(["step", ...omit]);
  const out: string[] = [];
  for (const [key, value] of p.entries()) {
    if (skip.has(key)) continue;
    out.push(`<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`);
  }
  return out.join("");
}

const dotProgress = (step: number): string => {
  if (!QUESTION_STEPS.includes(step)) return "";
  const dots = QUESTION_STEPS
    .map((s) => `<span class="dot${s <= step ? " on" : ""}"${s === step ? ' aria-current="step"' : ""}></span>`)
    .join("");
  return `<div class="progress" role="group" aria-label="Progress">${dots}</div>`;
};

const backLink = (p: URLSearchParams, step: number): string =>
  step > 0 && step < STEPS.length - 1
    ? `<a class="back" href="/onramp?${withStep(p, step - 1)}">← Back</a>`
    : "";

const optionTile = (name: string, opt: Option, type: "radio" | "checkbox", checked: boolean): string => `
  <label class="choice${checked ? " on" : ""}">
    <input type="${type}" name="${escapeHtml(name)}" value="${escapeHtml(opt.value)}" ${checked ? "checked" : ""}>
    <span>${escapeHtml(opt.label)}</span>
  </label>`;

function renderIntro(startToken: string | null): string {
  return `
  <h1>See your pattern.</h1>
  <p class="lede">
    Most of what looks like personality is a pattern — a running order of habits of mind,
    different in each of us. Two minutes finds a first read of yours.
  </p>
  <form method="get" action="/onramp">
    <input type="hidden" name="step" value="1">
    ${startToken ? `<input type="hidden" name="_s" value="${escapeHtml(startToken)}">` : ""}
    <button class="btn primary" type="submit">Start</button>
  </form>`;
}

function renderSingle(step: Extract<Step, { kind: "single" }>, i: number, p: URLSearchParams): string {
  const current = p.get(step.key);
  const tiles = step.options.map((o) => optionTile(step.key, o, "radio", o.value === current)).join("");
  return `
  <h1>${escapeHtml(step.prompt)}</h1>
  ${step.sub ? `<p class="muted">${escapeHtml(step.sub)}</p>` : ""}
  <form method="get" action="/onramp" data-auto="1">
    ${hiddenEcho(p, [step.key])}
    <input type="hidden" name="step" value="${i + 1}">
    <div class="tiles">${tiles}</div>
    <noscript><button class="btn primary" type="submit">Continue</button></noscript>
  </form>`;
}

function renderLikert(step: Extract<Step, { kind: "likert5" }>, i: number, p: URLSearchParams): string {
  const current = p.get(step.key);
  const tiles = LIKERT.map((o) => optionTile(step.key, o, "radio", o.value === current)).join("");
  return `
  <h1>${escapeHtml(step.statement)}</h1>
  <form method="get" action="/onramp" data-auto="1">
    ${hiddenEcho(p, [step.key])}
    <input type="hidden" name="step" value="${i + 1}">
    <div class="likert">${tiles}</div>
    <noscript><button class="btn primary" type="submit">Continue</button></noscript>
  </form>`;
}

function renderMulti(step: Extract<Step, { kind: "multi" }>, i: number, p: URLSearchParams): string {
  const picked = new Set(frictionValues(p, step.key));
  const tiles = step.options.map((o) => optionTile(step.key, o, "checkbox", picked.has(o.value))).join("");
  return `
  <h1>${escapeHtml(step.prompt)}</h1>
  <form method="get" action="/onramp" data-max="${step.max}" data-multi-key="${escapeHtml(step.key)}">
    ${hiddenEcho(p, [step.key])}
    <input type="hidden" name="step" value="${i + 1}">
    <div class="tiles">${tiles}</div>
    <button class="btn primary" type="submit">Continue</button>
  </form>`;
}

function renderInterstitial(
  step: Extract<Step, { kind: "interstitial" }>, i: number, p: URLSearchParams,
): string {
  return `
  <h1>${escapeHtml(step.heading(p))}</h1>
  <p class="lede">${escapeHtml(step.body(p))}</p>
  <form method="get" action="/onramp">
    ${hiddenEcho(p, [])}
    <input type="hidden" name="step" value="${i + 1}">
    <button class="btn primary" type="submit">Continue</button>
  </form>`;
}

function renderEmail(i: number, p: URLSearchParams): string {
  const email = p.get("email") ?? "";
  // Titled by what the step actually sends — the explainer email leads.ts
  // fires at capture — never by something the funnel does not deliver.
  return `
  <h1>Get your two-minute explainer.</h1>
  <p class="lede">We'll send the two-minute explainer for what you've found so far, and nothing else without asking.</p>
  <form method="get" action="/onramp">
    ${hiddenEcho(p, ["email", "optin"])}
    <input type="hidden" name="step" value="${i + 1}">
    <label class="field">
      <span>Email</span>
      <input type="email" name="email" value="${escapeHtml(email)}" required autocomplete="email">
    </label>
    <label class="opt">
      <input type="checkbox" name="optin" value="yes" ${p.get("optin") === "yes" ? "checked" : ""}>
      <span>Send me the occasional note about what Octant finds — I can unsubscribe any time.</span>
    </label>
    <button class="btn primary" type="submit">Continue</button>
  </form>`;
}

function renderDone(p: URLSearchParams): string {
  const field = fieldNarrowed(p);
  const email = p.get("email") ?? "";
  // stripeHref() normalises the email — reused from leads.ts so this CTA and
  // the nurture email's CTA build the identical client_reference_id for the
  // same person, even when the address's casing differs between requests.
  const href = email ? stripeHref(email) : STRIPE_LINK;
  const heading = field
    ? `Your pattern is one of about ${field} of the sixteen.`
    : "Your pattern is one of the sixteen.";
  const lede = field
    ? "That's a directional read from two of the eight questions — the full instrument answers " +
      "the other six and shows the mechanism, not just where you land."
    : "The full instrument's eight either-or questions find which one — and show the mechanism, " +
      "not just where you land.";
  return `
  <h1>${heading}</h1>
  <p class="lede">
    ${lede}
  </p>
  <div class="cta-row">
    <a class="btn primary" href="${escapeHtml(href)}">Start now — $25/user·mo</a>
    <a class="btn" href="/signin">Sign in</a>
  </div>
  <p class="muted small"><a href="/onramp">Start over</a></p>`;
}

function renderStep(i: number, p: URLSearchParams, startToken: string | null): string {
  const step = STEPS[i];
  switch (step.kind) {
    case "intro": return renderIntro(startToken);
    case "single": return renderSingle(step, i, p);
    case "likert5": return renderLikert(step, i, p);
    case "multi": return renderMulti(step, i, p);
    case "interstitial": return renderInterstitial(step, i, p);
    case "email": return renderEmail(i, p);
    case "done": return renderDone(p);
  }
}

const TITLE = "Octant — find your pattern";
const DESCRIPTION = "A two-minute directional read on how you think, from the people who built Octant.";

const STYLE = `
  :root {
    color-scheme: light dark;
    --paper:#FDFCFA; --surface:#FFFFFF; --soft:#F4F1EA;
    --ink:#241F19; --ink2:#4C463D; --muted:#6B6459; --rule:#E3DED4;
    --accent:#4C4899; --accent-ink:#373474; --accent-soft:#ECEBF7; --on:#fff;
    --serif:"Newsreader",Georgia,"Times New Roman",serif;
    --sans:"Inter",system-ui,-apple-system,sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --paper:#141310; --surface:#1D1B17; --soft:#24211C;
      --ink:#EDE9E1; --ink2:#B6AFA3; --muted:#8E8779; --rule:#2E2A24;
      --accent:#A8A6D3; --accent-ink:#C6C4E8; --accent-soft:#1F2033; --on:#241F19;
    }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--paper); color:var(--ink); font:400 19px/1.6 var(--serif); }
  .wrap { max-width:640px; margin:0 auto; padding:32px 24px 64px; }
  header.top { display:flex; align-items:center; gap:10px; padding:8px 0 28px; }
  header.top a { color:inherit; text-decoration:none; font-size:20px; font-weight:500;
                 display:flex; align-items:center; gap:8px; }
  h1 { font-size:clamp(26px,4.5vw,32px); line-height:1.25; letter-spacing:-0.01em; margin:0 0 12px; }
  .lede { font-size:18px; color:var(--ink2); margin:0 0 24px; }
  .muted { color:var(--muted); font-family:var(--sans); font-size:15px; }
  .small { font-size:14px; }
  form { display:flex; flex-direction:column; gap:16px; }
  .tiles { display:flex; flex-direction:column; gap:10px; }
  .choice { display:flex; align-items:center; gap:12px; padding:14px 16px; border:1px solid var(--rule);
            border-radius:10px; background:var(--surface); cursor:pointer; font-family:var(--sans);
            font-size:15.5px; line-height:1.5; }
  .choice:hover { border-color:var(--muted); }
  .choice.on { border-color:var(--accent); background:var(--accent-soft); }
  .choice input { accent-color:var(--accent); flex:none; }
  .choice input[disabled] { opacity:.4; }
  .likert { display:flex; flex-direction:column; gap:8px; }
  .likert .choice { justify-content:flex-start; }
  .field { display:flex; flex-direction:column; gap:6px; font-family:var(--sans); font-size:15px; }
  .field input { font:400 17px/1.4 var(--sans); padding:12px 14px; border:1px solid var(--rule);
                 border-radius:8px; background:var(--surface); color:var(--ink); }
  .opt { display:flex; align-items:flex-start; gap:10px; font-family:var(--sans); font-size:14px;
         color:var(--ink2); line-height:1.5; }
  .opt input { margin-top:3px; accent-color:var(--accent); }
  .btn { display:inline-block; font-family:var(--sans); font-size:16px; font-weight:500;
         padding:13px 22px; border-radius:8px; text-decoration:none; line-height:1.2;
         border:1px solid var(--rule); color:var(--ink); background:var(--surface); cursor:pointer; }
  .btn.primary { background:var(--accent); color:var(--on); border-color:var(--accent); }
  .cta-row { display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-top:4px; }
  .progress { display:flex; gap:6px; margin-bottom:24px; }
  .dot { width:8px; height:8px; border-radius:50%; background:var(--rule); }
  .dot.on { background:var(--accent); }
  .back { display:inline-block; margin-top:20px; font-family:var(--sans); font-size:14px;
          color:var(--muted); text-decoration:none; }
  .back:hover { color:var(--ink); }
`;

/**
 * The gate's tap-to-advance script, as its own constant because the CSP
 * hashes it (see src/worker/headers.ts). Editing this string is safe —
 * the hash is recomputed from it at runtime.
 */
export const ONRAMP_SCRIPT = `
(function () {
  document.querySelectorAll('form[data-auto] input[type=radio]').forEach(function (r) {
    r.addEventListener('change', function () {
      var f = r.closest('form');
      if (f) { if (f.requestSubmit) f.requestSubmit(); else f.submit(); }
    });
  });
  document.querySelectorAll('form[data-max]').forEach(function (f) {
    var max = parseInt(f.getAttribute('data-max'), 10) || 0;
    var boxes = Array.prototype.slice.call(f.querySelectorAll('input[type=checkbox]'));
    function sync() {
      var checked = boxes.filter(function (b) { return b.checked; }).length;
      boxes.forEach(function (b) { b.disabled = !b.checked && checked >= max; });
    }
    boxes.forEach(function (b) { b.addEventListener('change', sync); });
    sync();
  });
})();
`;

function page(step: number, p: URLSearchParams, origin: string, startToken: string | null): string {
  const body = renderStep(step, p, startToken);
  const indexable = step === 0;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${TITLE}</title>
<meta name="description" content="${DESCRIPTION}">
<meta name="robots" content="${indexable ? "index,follow" : "noindex,nofollow"}">
<link rel="canonical" href="${origin}/onramp">
<link rel="icon" href="${FAVICON}">
<meta name="color-scheme" content="light dark">
<style>${STYLE}</style>
</head>
<body>
<div class="wrap">
<header class="top"><a href="/">${MARK(24)} Octant</a></header>
${dotProgress(step)}
${body}
${backLink(p, step)}
</div>
<script>${ONRAMP_SCRIPT}</script>
</body>
</html>`;
}

/** A capture refusal, styled like the funnel, always with a way to start over. */
const refusalResponse = (status: number, message: string) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${TITLE}</title><style>${STYLE}</style></head>
<body><div class="wrap">
<header class="top"><a href="/">${MARK(24)} Octant</a></header>
<h1>That didn&rsquo;t work.</h1>
<p class="lede">${escapeHtml(message)}</p>
<p><a class="btn primary" href="/onramp">Start over</a></p>
</div></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );

/**
 * `GET /onramp` — the whole funnel, one route, state in the query string.
 * Returns null for anything it doesn't own, matching handleRead's contract,
 * so index.ts's public-route block can dispatch to it unconditionally.
 *
 * Async now (it wasn't before) for two best-effort side effects, neither of
 * which can block or fail the render: a per-step Analytics Engine write
 * (piece 3 — never KV, see leads.ts's header comment on why), and, once,
 * a lead capture at the done step.
 */
export async function handleOnramp(
  request: Request, env: OnrampEnv, url: URL, ctx?: Ctx,
): Promise<Response | null> {
  if (url.pathname !== "/onramp" && url.pathname !== "/onramp/") return null;
  const step = clampStep(url.searchParams.get("step"));

  try {
    env.ONRAMP_ANALYTICS?.writeDataPoint({
      blobs: [STEPS[step].kind, url.searchParams.get("utm_source") ?? "", request.headers.get("referer") ?? ""],
      doubles: [step],
      indexes: [String(step)],
    });
  } catch {
    /* best-effort — a telemetry failure must never affect the rendered page */
  }

  const now = Date.now();
  const startToken = step === 0 ? await issueStartToken(env, now) : null;

  if (step === STEPS.length - 1) {
    const email = url.searchParams.get("email");
    // Server-side gate: this is a public GET route with no session — the
    // HTML5 `type="email"` on the form only validates in a browser a
    // visitor actually used. Without both checks, any request to
    // /onramp?step=11&email=<anything> makes the Worker send an
    // Octant-branded email to that address from the verified sender,
    // turning the endpoint into an open mail relay. EMAIL_RE rejects
    // malformed addresses; the start-token check (above) rejects requests
    // that never actually rendered step 0 first; the nonce record refuses
    // a token that already captured for a different address.
    if (email && email.length <= 254 && EMAIL_RE.test(email)) {
      if (env.ONRAMP_LIMITER) {
        const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
        const verdict = await env.ONRAMP_LIMITER.limit({ key: ip }).catch(() => ({ success: true }));
        if (!verdict.success) {
          return refusalResponse(429, "Too many attempts from this connection. Wait a minute and try again.");
        }
      }
      const nonce = await verifyStartToken(env, url.searchParams.get("_s"), now);
      if (nonce) {
        const use = await consumeStartToken(env, nonce, email);
        if (use === "replayed") {
          console.error("onramp: lead capture refused — start token replayed with a different address");
          return refusalResponse(403, "That link has already been used for a different address.");
        }
        const goal = url.searchParams.get("goal") ?? undefined;
        const friction = frictionValues(url.searchParams);
        // A boundary field size (16 = nothing answered, 0 = invalid values)
        // is withheld, so the explainer email falls back to its generic body
        // instead of repeating the same nonsense the page now guards against.
        const fieldSize = fieldNarrowed(url.searchParams) ?? undefined;
        const optin = url.searchParams.get("optin") === "yes";
        const work = captureLead(env, url.origin, email, goal, friction, fieldSize, optin, now);
        if (ctx?.waitUntil) ctx.waitUntil(work); else await work;
      } else {
        console.error("onramp: lead capture blocked — missing, forged, expired or too-fast start token");
      }
    }
  }

  return new Response(page(step, url.searchParams, url.origin, startToken), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
