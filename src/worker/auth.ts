import { b64url, unb64url, sign, digest, sameDigest, signatureMatches } from "./crypto";
import { escapeHtml } from "./html";
import { SHELL } from "./shell";
import { getUser, isOwner, needsApplication, type UserEnv } from "./users";

/* ------------------------------------------------------------------ *
 * THE ACCESS WALL
 *
 * Nothing is public. Every request — the app shell, every asset, every
 * API route — has to carry a valid session, and there are exactly two
 * ways to get one:
 *
 *   1. An INVITE CODE the owner issued. Stateless: the code either
 *      matches ACCESS_CODES or it does not.
 *   2. GOOGLE SIGN-IN, which additionally requires the owner to have
 *      approved that person. That approval lives in KV (src/worker/users.ts).
 *
 * Design notes, because the failure modes matter more than the feature:
 *
 *   - It FAILS CLOSED. With no way in configured at all, the site serves
 *     a "not configured" page rather than the app. A misconfigured wall
 *     that lets everyone in is worse than none, because you think you
 *     have one.
 *   - Codes are compared as SHA-256 digests, so neither the code nor its
 *     length leaks through response timing.
 *   - Sessions are signed, not stored. HMAC-SHA256 over {kind, label,
 *     email, expiry}, so there is no session table and a forged cookie
 *     needs the secret.
 *   - A Google session's STATUS is re-checked against KV on every
 *     request that is not a static asset. Checking on assets too would
 *     mean a KV read per JS chunk for no benefit — an asset is useless
 *     without the shell, and the shell is checked. So disabling somebody
 *     takes effect on their next page load or API call.
 *   - Unauthenticated /api/* gets JSON, not the HTML gate, so the app's
 *     own fetches fail cleanly instead of parsing a login page.
 *
 * The one thing that is instant: rotating AUTH_SECRET invalidates every
 * session everywhere, both kinds, immediately. That is the panic button,
 * and it is the answer to KV's eventual consistency.
 * ------------------------------------------------------------------ */

/** The rate-limiting binding's whole API. Absent in dev; the wall degrades to the in-memory brake. */
export interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface AuthEnv extends UserEnv {
  /**
   * Cross-isolate attempts ceiling for /api/auth/login. Counts every attempt,
   * not just failures — the binding consumes on call and cannot see the
   * outcome first — so its limit sits where only brute force reaches it,
   * and the failures-only principle lives on in the in-memory brake below.
   */
  LOGIN_LIMITER?: RateLimit;
  /**
   * Invite codes, comma-separated. Either bare codes or `label:code` pairs —
   * the label is how you tell people apart and revoke one without disturbing
   * the rest.
   *
   *   ACCESS_CODES="nick:river-oak-8821,jane:slate-harbor-4417"
   */
  ACCESS_CODES?: string;
  /** HMAC key for session cookies. Any long random string. Rotating it signs everyone out. */
  AUTH_SECRET?: string;
  /** Set when Google sign-in is available; only used here to decide whether to offer it. */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** Set when the Stripe webhook is wired up; only used here to decide whether the gate may promise the paid path. */
  STRIPE_WEBHOOK_SECRET?: string;
}

const COOKIE = "octant_session";
const SESSION_DAYS = 30;

/* Brute-force brake. Per-isolate like the chat limiter, so it is a brake and
   not a lock — but codes are long enough that this plus the digest comparison
   is a reasonable posture for an invite-only app.
 *
 * Only FAILURES are counted. Counting every attempt would lock out someone who
 * legitimately signs in on several devices in one sitting, while doing nothing
 * extra against an attacker — who, by definition, only ever fails. */
const LOGIN_WINDOW_MS = 10 * 60_000;
const MAX_LOGIN_FAILURES = 10;
const failures = new Map<string, number[]>();

/** Failed attempts from this address still inside the window. */
const recentFailures = (ip: string, now: number) =>
  (failures.get(ip) ?? []).filter((t) => now - t < LOGIN_WINDOW_MS);

/** Read-only check. Deliberately does not record, so a success costs nothing. */
function tooManyFailures(ip: string, now: number): boolean {
  return recentFailures(ip, now).length >= MAX_LOGIN_FAILURES;
}

/** Note a failed attempt. Only ever called when a code was actually wrong. */
function recordFailure(ip: string, now: number): void {
  const recent = recentFailures(ip, now);
  recent.push(now);
  failures.set(ip, recent);
  if (failures.size > 5_000) failures.clear(); // crude ceiling on isolate memory
}

/* ------------------------------- codes ------------------------------- */

interface Invite { label: string; code: string }

/** Parse ACCESS_CODES. Blank entries are dropped so a trailing comma is harmless. */
export function parseCodes(raw: string | undefined): Invite[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const i = entry.indexOf(":");
      return i === -1
        ? { label: "guest", code: entry }
        : { label: entry.slice(0, i).trim() || "guest", code: entry.slice(i + 1).trim() };
    })
    .filter((x) => x.code.length > 0);
}

/** Is Google sign-in available on this deployment? */
export const googleAvailable = (env: AuthEnv): boolean =>
  !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET && !!env.AUTH_SECRET && !!env.USERS;

/**
 * Is the payment → automatic access path live? True when the Stripe webhook
 * (stripe.ts) can preapprove a paying email into the same KV the Google
 * callback reads. Only used to decide whether the gate may promise it.
 */
export const stripeAvailable = (env: AuthEnv): boolean =>
  !!env.STRIPE_WEBHOOK_SECRET && !!env.USERS;

/**
 * True when there is a signing secret AND at least one way in.
 * Anything else fails closed.
 */
export const isConfigured = (env: AuthEnv): boolean =>
  !!env.AUTH_SECRET && (parseCodes(env.ACCESS_CODES).length > 0 || googleAvailable(env));

/**
 * The invite a submitted code matches, or null. Constant-time against every
 * code. `codeId` is a digest prefix, not the code: enough to tell two codes
 * apart forever, useless for recovering either.
 */
async function labelForCode(
  env: AuthEnv, submitted: string,
): Promise<{ label: string; codeId: string } | null> {
  const given = await digest(submitted);
  let found: { label: string; codeId: string } | null = null;
  for (const invite of parseCodes(env.ACCESS_CODES)) {
    if (sameDigest(await digest(invite.code), given)) {
      found = { label: invite.label, codeId: given.slice(0, 16) };
    }
  }
  return found;
}

/* ------------------------------ session ------------------------------ */

export type SessionKind = "code" | "google";

export interface Session {
  label: string;
  kind: SessionKind;
  /** Present only for Google sessions. The key into the user list. */
  email?: string;
  /**
   * Present only for code sessions minted since 2026-08: a prefix of the
   * code's digest. Labels are not identities — two bare codes both default
   * to "guest", and anything scoped by label (chat history) would let those
   * two people read each other. This is the identity the label is not.
   */
  codeId?: string;
  /**
   * Issued-at, seconds. Present only on sessions minted since the
   * application form existed (2026-08). Its ABSENCE is the signal: a code
   * session with no `iat` was handed out under the old rules, and sending
   * that person back to fill in a form mid-visit would be an ambush. They
   * keep what they have; the session expires within thirty days and the
   * next login goes through the form like everyone else's.
   */
  iat?: number;
  exp: number;
}

/** Mint a session token. Nothing is stored server-side; the signature is the proof. */
export async function issueSession(
  label: string, kind: SessionKind, email: string | undefined, secret: string, now: number,
  codeId?: string,
): Promise<string> {
  const iat = Math.floor(now / 1000);
  const exp = iat + SESSION_DAYS * 86_400;
  const payload = b64url(JSON.stringify({ l: label, k: kind, m: email, c: codeId, i: iat, e: exp }));
  return `${payload}.${await sign(payload, secret)}`;
}

async function open(token: string, secret: string, now: number): Promise<Session | null> {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  if (!(await signatureMatches(token.slice(dot + 1), await sign(payload, secret)))) return null;
  try {
    const { l, k, m, c, i, e } = JSON.parse(unb64url(payload)) as
      { l?: string; k?: string; m?: string; c?: string; i?: number; e?: number };
    if (typeof e !== "number" || e * 1000 <= now) return null;
    return {
      label: typeof l === "string" ? l : "guest",
      // Sessions minted before Google existed carry no kind; they are codes.
      kind: k === "google" ? "google" : "code",
      email: typeof m === "string" ? m : undefined,
      codeId: typeof c === "string" ? c : undefined,
      iat: typeof i === "number" ? i : undefined,
      exp: e,
    };
  } catch {
    return null;
  }
}

function cookieValue(header: string | null, name: string): string | null {
  for (const part of (header ?? "").split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

/** The caller's session, or null. Signature and expiry only — status is checked separately. */
export async function readSession(
  request: Request, env: AuthEnv, now = Date.now(),
): Promise<Session | null> {
  if (!env.AUTH_SECRET) return null;
  const token = cookieValue(request.headers.get("cookie"), COOKIE);
  return token ? open(token, env.AUTH_SECRET, now) : null;
}

/* Secure is omitted on plain-http localhost, or the browser drops the cookie
   and local development can never log in. Everything else gets it. */
const secureFlag = (url: URL) =>
  url.protocol === "https:" || !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname)
    ? "; Secure" : "";

export const setCookie = (url: URL, token: string) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86_400}${secureFlag(url)}`;

export const clearCookie = (url: URL) =>
  `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag(url)}`;

/* ------------------------------ handlers ------------------------------ */

const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });

/**
 * `/api/auth/*` — the code login, logout and "who am I".
 *
 * Google's own routes live in google.ts and are dispatched by index.ts;
 * this handler deliberately ignores anything under /api/auth/google/.
 * Returns null when the path is not ours, so the caller can carry on.
 */
export async function handleAuth(
  request: Request, env: AuthEnv, now = Date.now(),
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/auth/")) return null;
  if (url.pathname.startsWith("/api/auth/google/")) return null;

  if (url.pathname === "/api/auth/me") {
    const session = await readSession(request, env, now);
    const user = session?.email ? await getUser(env, session.email) : null;
    return json({
      signedIn: !!session,
      label: session?.label ?? null,
      kind: session?.kind ?? null,
      email: session?.email ?? null,
      status: user?.status ?? null,
      owner: !!user?.owner || (!!session?.email && isOwner(env, session.email)),
    }, 200);
  }

  if (url.pathname === "/api/auth/logout") {
    if (request.method !== "POST") return json({ error: "Use POST." }, 405);
    return json({ ok: true }, 200, { "set-cookie": clearCookie(url) });
  }

  if (url.pathname === "/api/auth/login") {
    if (request.method !== "POST") return json({ error: "Use POST." }, 405);
    if (!env.AUTH_SECRET || parseCodes(env.ACCESS_CODES).length === 0) {
      return json({ error: "Access is not configured on this deployment." }, 503);
    }

    const ip = request.headers.get("cf-connecting-ip") ?? "local";
    if (tooManyFailures(ip, now)) {
      return json({ error: "Too many attempts. Wait ten minutes and try again." }, 429);
    }
    /* The cross-isolate ceiling. The in-memory brake above is per-isolate and
       Workers discard isolates freely; this one holds across all of them.
       Failing open when the binding errors is deliberate — the wall's own
       digest comparison is the real defence, and a rate-limit outage must
       not lock the owner out. */
    if (env.LOGIN_LIMITER) {
      const verdict = await env.LOGIN_LIMITER.limit({ key: ip }).catch(() => ({ success: true }));
      if (!verdict.success) {
        return json({ error: "Too many attempts. Wait a minute and try again." }, 429);
      }
    }

    let code = "";
    try {
      const body = (await request.json()) as { code?: unknown };
      code = typeof body.code === "string" ? body.code.trim() : "";
    } catch {
      return json({ error: "Body must be JSON." }, 400);
    }
    if (!code) return json({ error: "Enter your access code." }, 400);

    const invite = await labelForCode(env, code);
    if (!invite) {
      recordFailure(ip, now);
      return json({ error: "That code was not recognised." }, 401);
    }

    const token = await issueSession(
      invite.label, "code", undefined, env.AUTH_SECRET, now, invite.codeId,
    );
    return json({ ok: true, label: invite.label }, 200, { "set-cookie": setCookie(url, token) });
  }

  return json({ error: "Not found." }, 404);
}

/**
 * A static asset — something with a file extension, outside /api.
 *
 * These skip the KV status check. An asset is useless without the shell, the
 * shell IS checked, and checking here would cost a KV read per chunk on every
 * cold load for no security gained.
 */
export const isAssetPath = (pathname: string) =>
  !pathname.startsWith("/api/") && /\.[a-z0-9]+$/i.test(pathname);

/**
 * The gate. Call this before ANY other routing.
 *
 * Returns null when the caller may proceed, or the Response to send when they
 * may not: JSON for API paths, HTML for everything else.
 */
export async function requireAuth(
  request: Request, env: AuthEnv, now = Date.now(),
): Promise<Response | null> {
  const url = new URL(request.url);
  const isApi = url.pathname.startsWith("/api/");

  if (!isConfigured(env)) {
    return isApi
      ? json({ error: "Access is not configured on this deployment." }, 503)
      : page(unconfiguredPage(), 503);
  }

  const session = await readSession(request, env, now);
  if (!session) {
    return isApi
      ? json({ error: "Not signed in." }, 401)
      : page(gatePage(env, url.pathname + url.search), 401);
  }

  /* Assets skip the rest for both kinds of session. An asset is useless
     without the shell, the shell IS checked, and checking here would cost a
     KV read per chunk on every cold load for no security gained. */
  if (isAssetPath(url.pathname)) return null;

  /* No user list means nowhere to record an application and nowhere to store
     an approval, so a codes-only deployment keeps its old behaviour: the code
     was the authorisation, and it was checked at login. Google sessions
     cannot reach this line without USERS — googleAvailable() requires it. */
  if (!env.USERS) return null;

  /* A code session minted before the application form existed. See Session.iat:
     these are grandfathered for the rest of their life rather than interrupted. */
  if (session.kind === "code" && session.iat === undefined) return null;

  const user = session.email ? await getUser(env, session.email) : null;

  /* Blocked is checked first and applies everywhere, including to the
     application form. A deliberate no is not a thing to talk your way out of
     by answering questions again. */
  if (user?.status === "blocked") {
    return isApi ? json({ error: "Access withdrawn." }, 403) : page(blockedPage(), 403);
  }

  /* No record at all means a code holder who has never applied — a code is
     stateless and carries no address, so until they fill in the form there is
     nobody here to approve. Everyone else has a record from recordSignIn. */
  if (!user || needsApplication(user)) {
    /* "/apply" is hardcoded rather than imported: this file must let an
       unapplied session reach exactly one path, and importing that path from
       apply.ts would make the wall depend on the page it holds people at.
       tests/apply.test.ts pins that the two strings agree. */
    if (url.pathname === "/apply") return null;
    return isApi
      ? json({ error: "Application required." }, 403)
      : new Response(null, { status: 303, headers: { location: "/apply", "cache-control": "no-store" } });
  }

  if (user.status === "approved") return null;

  return isApi
    ? json({ error: "Waiting for approval." }, 403)
    : page(pendingPage(session.email ?? user.email), 403);
}

const page = (html: string, status: number) =>
  new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      // The gate is the whole security boundary; do not let it be framed.
      "x-frame-options": "DENY",
      "referrer-policy": "no-referrer",
    },
  });

/**
 * The sign-in page as its own route, for the public front door to link to.
 *
 * Same gate the wall serves — same markup, same fail-closed posture — but at
 * 200: a person who deliberately navigated to /signin asked for this page and
 * got it, which is not an authorization failure. The wall's own copies stay
 * 401, because there the page is a refusal.
 */
export function signinPage(env: AuthEnv, returnTo = "/"): Response {
  if (!isConfigured(env)) return page(unconfiguredPage(), 503);
  return page(gatePage(env, returnTo), 200);
}

/* -------------------------------- pages -------------------------------- */
/* Written inline and self-contained, because the static assets are behind
   this wall too — the gate cannot load a stylesheet it is protecting. */

/* SHELL now lives in shell.ts — apply.ts serves the same surface and must not
   carry a second copy of these rules. */

const GOOGLE_MARK = `<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33Z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58Z"/></svg>`;

const gatePage = (env: AuthEnv, returnTo: string) => {
  /* The pricing card promises "payment unlocks your account automatically".
     The gate may only repeat that promise when the machinery behind it is
     actually deployed — Stripe webhook plus Google sign-in — and the
     owner-approval warning below is then scoped to the non-payer path. */
  const paidPath = googleAvailable(env) && stripeAvailable(env);
  const paid = paidPath
    ? `<p class="fine" style="margin-top:12px">Just subscribed? Sign in with Google using the
       email you paid with &mdash; payment unlocks your account automatically.</p>`
    : "";
  const google = googleAvailable(env)
    ? `<a class="google" href="/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}">
         ${GOOGLE_MARK}<span>Continue with Google</span></a>
       ${paid}
       <div class="or">or use an access code</div>`
    : "";
  const codes = parseCodes(env.ACCESS_CODES).length > 0
    ? `<form id="f" autocomplete="off">
    <label for="code">Access code</label>
    <input id="code" name="code" type="password" autocomplete="one-time-code"
           autocapitalize="off" autocorrect="off" spellcheck="false" required>
    <button id="go" type="submit">Enter</button>
    <p class="msg" id="msg" role="status" aria-live="polite"></p>
  </form>`
    : "";

  const approval = paidPath
    ? `Not a subscriber? Access is granted by the owner of this deployment. If you sign in
  with Google without a subscription you will wait until they approve you; if your code has
  stopped working it has been revoked or rotated.`
    : `Access is granted by the owner of this deployment. If you sign in with
  Google you will wait until they approve you; if your code has stopped working it has been
  revoked or rotated.`;

  return SHELL("Octant — access required", `
  <h1>Octant</h1>
  <p>This is a private instrument. Sign in to continue.</p>
  ${google}
  ${codes}
  <p class="fine">${approval}<br><br>
  New here? <a href="/">Read what Octant is</a> first.</p>
${codes ? `<script>${GATE_SCRIPT}</script>` : ""}`);
};

/**
 * The gate's login script, as its own constant because the CSP hashes it:
 * src/worker/headers.ts allows exactly this text and index.html's theme
 * script, and nothing else inline. Editing this string is safe — the hash is
 * recomputed from it at runtime — but moving it back inline in gatePage
 * would silently fall out of the hash's coverage.
 */
export const GATE_SCRIPT = `
(function () {
  var f = document.getElementById('f'), go = document.getElementById('go'),
      msg = document.getElementById('msg'), code = document.getElementById('code');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.textContent = ''; go.disabled = true; go.textContent = 'Checking…';
    fetch('/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: code.value })
    }).then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok, d: d }; });
    }).then(function (res) {
      if (res.ok) { location.replace(location.pathname + location.search + location.hash); return; }
      msg.textContent = res.d.error || 'That did not work.';
      go.disabled = false; go.textContent = 'Enter';
      code.value = ''; code.focus();
    }).catch(function () {
      msg.textContent = 'Network error. Try again.';
      go.disabled = false; go.textContent = 'Enter';
    });
  });
})();
`;

const pendingPage = (email: string) => SHELL("Octant — waiting for approval", `
  <div class="mark">◷</div>
  <h1>Your request is in</h1>
  <p>Your answers went to the owner${email ? `, along with <b>${escapeHtml(email)}</b>` : ""}, and
  a person reads every one of them. Nothing opens until they say yes.</p>
  <p>You can close this &mdash; the acknowledgement in your inbox says the same thing, and you
  will hear either way. Come back and reload once you do; you will not have to sign in again.</p>
  <p class="fine">Signed in as the wrong account?
  <a href="/api/auth/google/start">Switch account</a>.</p>`);

const blockedPage = () => SHELL("Octant — no access", `
  <div class="mark">—</div>
  <h1>No access</h1>
  <p>This account cannot open Octant. If you think that is a mistake, ask the person who
  gave you the link.</p>
  <p class="fine"><a href="/api/auth/google/start">Try a different account</a>.</p>`);

const unconfiguredPage = () => SHELL("Octant — not configured", `
  <h1>Not configured</h1>
  <p>This deployment has an access wall but no way through it, so it is refusing
  everyone — including you. That is deliberate: failing open would publish the site.</p>
  <p class="fine">Set a signing secret and at least one way in, then redeploy:<br><br>
  <code>npx wrangler secret put AUTH_SECRET</code><br>
  <code>npx wrangler secret put ACCESS_CODES</code><br><br>
  Full instructions are in <code>DEPLOY.md</code>, step 2.</p>`);
