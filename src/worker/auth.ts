import { b64url, unb64url, sign, digest, sameDigest, signatureMatches } from "./crypto";
import { escapeHtml } from "./html";
import { getUser, isOwner, type UserEnv } from "./users";

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

export interface AuthEnv extends UserEnv {
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
 * True when there is a signing secret AND at least one way in.
 * Anything else fails closed.
 */
export const isConfigured = (env: AuthEnv): boolean =>
  !!env.AUTH_SECRET && (parseCodes(env.ACCESS_CODES).length > 0 || googleAvailable(env));

/** The label attached to a submitted code, or null. Constant-time against every code. */
async function labelForCode(env: AuthEnv, submitted: string): Promise<string | null> {
  const given = await digest(submitted);
  let found: string | null = null;
  for (const invite of parseCodes(env.ACCESS_CODES)) {
    if (sameDigest(await digest(invite.code), given)) found = invite.label;
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
  exp: number;
}

/** Mint a session token. Nothing is stored server-side; the signature is the proof. */
export async function issueSession(
  label: string, kind: SessionKind, email: string | undefined, secret: string, now: number,
): Promise<string> {
  const exp = Math.floor(now / 1000) + SESSION_DAYS * 86_400;
  const payload = b64url(JSON.stringify({ l: label, k: kind, m: email, e: exp }));
  return `${payload}.${await sign(payload, secret)}`;
}

async function open(token: string, secret: string, now: number): Promise<Session | null> {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  if (!(await signatureMatches(token.slice(dot + 1), await sign(payload, secret)))) return null;
  try {
    const { l, k, m, e } = JSON.parse(unb64url(payload)) as
      { l?: string; k?: string; m?: string; e?: number };
    if (typeof e !== "number" || e * 1000 <= now) return null;
    return {
      label: typeof l === "string" ? l : "guest",
      // Sessions minted before Google existed carry no kind; they are codes.
      kind: k === "google" ? "google" : "code",
      email: typeof m === "string" ? m : undefined,
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

    let code = "";
    try {
      const body = (await request.json()) as { code?: unknown };
      code = typeof body.code === "string" ? body.code.trim() : "";
    } catch {
      return json({ error: "Body must be JSON." }, 400);
    }
    if (!code) return json({ error: "Enter your access code." }, 400);

    const label = await labelForCode(env, code);
    if (!label) {
      recordFailure(ip, now);
      return json({ error: "That code was not recognised." }, 401);
    }

    const token = await issueSession(label, "code", undefined, env.AUTH_SECRET, now);
    return json({ ok: true, label }, 200, { "set-cookie": setCookie(url, token) });
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

  // A code session is as good as its code, and that was checked at login.
  if (session.kind === "code") return null;

  // A Google session is only as good as the owner's current answer about it.
  if (isAssetPath(url.pathname)) return null;

  const user = session.email ? await getUser(env, session.email) : null;
  if (user?.status === "approved") return null;

  const blocked = user?.status === "blocked";
  return isApi
    ? json({ error: blocked ? "Access withdrawn." : "Waiting for approval." }, 403)
    : page(blocked ? blockedPage() : pendingPage(session.email ?? ""), 403);
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
  main { width:100%; max-width:29rem; }
  h1 { font-size:34px; line-height:1.2; margin:0 0 8px; }
  p { color:var(--ink2); margin:0 0 20px; }
  form { display:flex; flex-direction:column; gap:12px; }
  label { font:500 15px/1.4 system-ui,sans-serif; }
  input { font:400 17px/1.4 ui-monospace,SFMono-Regular,monospace; padding:12px 14px;
          border:1px solid var(--rule); border-radius:6px; background:var(--surface);
          color:var(--ink); width:100%; }
  input:focus-visible { outline:2px solid var(--accent); outline-offset:1px; }
  button { font:500 17px/1 system-ui,sans-serif; padding:13px 18px; border:0;
           border-radius:6px; background:var(--accent); color:var(--on); cursor:pointer; }
  button[disabled] { opacity:.55; cursor:default; }
  .msg { font:400 15px/1.5 system-ui,sans-serif; color:var(--bad); min-height:1.4em; margin:0; }
  .fine { font:400 15px/1.6 system-ui,sans-serif; color:var(--ink2); margin-top:28px;
          padding-top:20px; border-top:1px solid var(--rule); }
  code { font:400 15px/1.5 ui-monospace,SFMono-Regular,monospace; background:var(--surface);
         border:1px solid var(--rule); border-radius:4px; padding:1px 5px; }
  .google { display:flex; align-items:center; justify-content:center; gap:10px;
            background:var(--surface); color:var(--ink); border:1px solid var(--rule);
            text-decoration:none; padding:13px 18px; border-radius:6px;
            font:500 17px/1 system-ui,sans-serif; }
  .or { display:flex; align-items:center; gap:12px; color:var(--ink2);
        font:400 14px/1 system-ui,sans-serif; margin:22px 0; }
  .or::before, .or::after { content:""; flex:1; height:1px; background:var(--rule); }
  .mark { font-size:34px; line-height:1; margin-bottom:12px; }
</style>
</head><body><main>${body}</main></body></html>`;

const GOOGLE_MARK = `<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33Z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58Z"/></svg>`;

const gatePage = (env: AuthEnv, returnTo: string) => {
  const google = googleAvailable(env)
    ? `<a class="google" href="/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}">
         ${GOOGLE_MARK}<span>Continue with Google</span></a>
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

  return SHELL("Octant — access required", `
  <h1>Octant</h1>
  <p>This is a private instrument. Sign in to continue.</p>
  ${google}
  ${codes}
  <p class="fine">Access is granted by the owner of this deployment. If you sign in with
  Google you will wait until they approve you; if your code has stopped working it has been
  revoked or rotated.<br><br>
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
  <h1>Waiting for approval</h1>
  <p>You are signed in${email ? ` as <b>${escapeHtml(email)}</b>` : ""}, and the owner has been
  told you are here. Nothing opens until they say yes.</p>
  <p>You can close this. Come back and reload once you hear from them — you will not have to
  sign in again.</p>
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
