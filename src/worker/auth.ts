/* ------------------------------------------------------------------ *
 * THE ACCESS WALL
 *
 * Nothing is public. Every request — the app shell, every asset, every
 * API route — has to carry a valid session, and the only way to get one
 * is an invite code the owner issued.
 *
 * Design notes, because the failure modes here matter more than the
 * feature:
 *
 *   - It FAILS CLOSED. If ACCESS_CODES or AUTH_SECRET is missing the
 *     site serves a "not configured" page rather than serving the app.
 *     A misconfigured auth wall that silently lets everyone in is worse
 *     than no auth wall, because you think you have one.
 *   - Codes are compared as SHA-256 digests, so neither the code nor its
 *     length leaks through response timing.
 *   - The session is a signed token, not a stored one. HMAC-SHA256 over
 *     {label, expiry}, so there is no session table to keep and a forged
 *     cookie needs the secret.
 *   - Revocation is by editing ACCESS_CODES. Rotating AUTH_SECRET signs
 *     everyone out at once.
 *   - Unauthenticated /api/* gets JSON 401, not the HTML gate, so the
 *     app's own fetches fail cleanly instead of parsing a login page.
 * ------------------------------------------------------------------ */

export interface AuthEnv {
  /**
   * The invite codes, comma-separated. Either bare codes or `label:code`
   * pairs — the label is only ever used in logs and the sign-out line, so
   * you can tell who is who and revoke one person without disturbing the
   * rest.
   *
   *   ACCESS_CODES="nick:river-oak-8821,jane:slate-harbor-4417"
   */
  ACCESS_CODES?: string;
  /** HMAC key for session cookies. Any long random string. Rotating it signs everyone out. */
  AUTH_SECRET?: string;
}

const COOKIE = "octant_session";
const SESSION_DAYS = 30;

/* Brute-force brake. Per-isolate like the chat limiter, so it is a brake
   and not a lock — but codes are long enough that this plus the digest
   comparison is a reasonable posture for an invite-only app.
 *
 * Only FAILURES are counted. Counting every attempt would lock out someone
 * who legitimately signs in on several devices in one sitting, while doing
 * nothing extra against an attacker — who, by definition, only ever fails. */
const LOGIN_WINDOW_MS = 10 * 60_000;
const MAX_LOGIN_FAILURES = 10;
const failures = new Map<string, number[]>();

const recentFailures = (ip: string, now: number) =>
  (failures.get(ip) ?? []).filter((t) => now - t < LOGIN_WINDOW_MS);

function tooManyFailures(ip: string, now: number): boolean {
  return recentFailures(ip, now).length >= MAX_LOGIN_FAILURES;
}

function recordFailure(ip: string, now: number): void {
  const recent = recentFailures(ip, now);
  recent.push(now);
  failures.set(ip, recent);
  if (failures.size > 5_000) failures.clear(); // crude ceiling on isolate memory
}

/* ------------------------------ crypto ------------------------------ */

const enc = new TextEncoder();

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(s: string): string {
  const t = s.replace(/-/g, "+").replace(/_/g, "/");
  return atob(t + (t.length % 4 ? "=".repeat(4 - (t.length % 4)) : ""));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
}

async function sign(payload: string, secret: string): Promise<string> {
  return b64url(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(payload)));
}

/** SHA-256 digest, hex. Used so code comparison leaks neither value nor length. */
async function digest(s: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time compare of two equal-length hex strings. */
function sameDigest(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
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

/** True when the wall has everything it needs. Anything else fails closed. */
export const isConfigured = (env: AuthEnv): boolean =>
  !!env.AUTH_SECRET && parseCodes(env.ACCESS_CODES).length > 0;

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

interface Session { label: string; exp: number }

async function issue(label: string, secret: string, now: number): Promise<string> {
  const exp = Math.floor(now / 1000) + SESSION_DAYS * 86_400;
  const payload = b64url(enc.encode(JSON.stringify({ l: label, e: exp })));
  return `${payload}.${await sign(payload, secret)}`;
}

async function open(token: string, secret: string, now: number): Promise<Session | null> {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  if (!sameDigest(await digest(token.slice(dot + 1)), await digest(await sign(payload, secret)))) {
    return null;
  }
  try {
    const { l, e } = JSON.parse(unb64url(payload)) as { l?: string; e?: number };
    if (typeof e !== "number" || e * 1000 <= now) return null;
    return { label: typeof l === "string" ? l : "guest", exp: e };
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

/** The caller's session, or null. The single source of truth for "are you in". */
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

const setCookie = (url: URL, token: string) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86_400}${secureFlag(url)}`;

const clearCookie = (url: URL) =>
  `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag(url)}`;

/* ------------------------------ handlers ------------------------------ */

const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });

/**
 * `/api/auth/*` — login, logout and "who am I".
 *
 * Returns null when the path is not an auth route, so the caller can carry on.
 */
export async function handleAuth(
  request: Request, env: AuthEnv, now = Date.now(),
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/auth/")) return null;

  if (url.pathname === "/api/auth/me") {
    const session = await readSession(request, env, now);
    return json({ signedIn: !!session, label: session?.label ?? null }, 200);
  }

  if (url.pathname === "/api/auth/logout") {
    if (request.method !== "POST") return json({ error: "Use POST." }, 405);
    return json({ ok: true }, 200, { "set-cookie": clearCookie(url) });
  }

  if (url.pathname === "/api/auth/login") {
    if (request.method !== "POST") return json({ error: "Use POST." }, 405);
    if (!isConfigured(env)) {
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

    const token = await issue(label, env.AUTH_SECRET!, now);
    return json({ ok: true, label }, 200, { "set-cookie": setCookie(url, token) });
  }

  return json({ error: "Not found." }, 404);
}

/**
 * The gate. Call this before ANY other routing.
 *
 * Returns null when the caller may proceed, or the Response to send when
 * they may not — the JSON 401 for API paths, the HTML gate for everything
 * else, and the "not configured" page when the deployment has no codes.
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

  if (await readSession(request, env, now)) return null;

  return isApi
    ? json({ error: "Not signed in." }, 401)
    : page(gatePage(), 401);
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
</style>
</head><body><main>${body}</main></body></html>`;

const gatePage = () => SHELL("Octant — access required", `
  <h1>Octant</h1>
  <p>This is a private instrument. Enter the access code you were given.</p>
  <form id="f" autocomplete="off">
    <label for="code">Access code</label>
    <input id="code" name="code" type="password" autocomplete="one-time-code"
           autocapitalize="off" autocorrect="off" spellcheck="false" required autofocus>
    <button id="go" type="submit">Enter</button>
    <p class="msg" id="msg" role="status" aria-live="polite"></p>
  </form>
  <p class="fine">Codes are issued by the owner of this deployment. If yours has stopped
  working it has been revoked or rotated.</p>
<script>
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
</script>`);

const unconfiguredPage = () => SHELL("Octant — not configured", `
  <h1>Not configured</h1>
  <p>This deployment has an access wall but no way through it, so it is refusing
  everyone — including you. That is deliberate: failing open would publish the site.</p>
  <p class="fine">Set both secrets and redeploy:<br><br>
  <code>npx wrangler secret put ACCESS_CODES</code><br>
  <code>npx wrangler secret put AUTH_SECRET</code><br><br>
  Full instructions are in <code>DEPLOY.md</code>, step 3.</p>`);
