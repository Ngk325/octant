import { randomToken, pkceChallenge, seal, unseal } from "./crypto";

/* ------------------------------------------------------------------ *
 * GOOGLE SIGN-IN
 *
 * Authorization Code flow with PKCE. The shape is unremarkable; the
 * parts worth reading are the checks on the way back, because that is
 * where OAuth implementations usually go wrong:
 *
 *   - state is signed and short-lived, and lives in its own cookie. An
 *     attacker cannot mint one, so they cannot get your browser to
 *     complete a login they started (CSRF against the callback).
 *   - the code is exchanged over TLS directly with Google, so the
 *     id_token's provenance is the connection itself. That is why the
 *     signature is not re-verified against JWKS — this is the one case
 *     Google's own guidance says it is unnecessary. It WOULD be
 *     necessary if we accepted an id_token posted to us by a client,
 *     which we never do.
 *   - `aud` is checked against our client id, so a token minted for a
 *     different application cannot be replayed at this one.
 *   - `email_verified` is required. Without it, "email" is a string
 *     somebody typed, and the whole approval model rests on it being
 *     an identity.
 * ------------------------------------------------------------------ */

export interface GoogleEnv {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  AUTH_SECRET?: string;
}

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

const STATE_COOKIE = "octant_oauth";
/** Long enough to sign in unhurriedly, short enough to be useless if leaked. */
const STATE_TTL_SECONDS = 15 * 60;

export const googleConfigured = (env: GoogleEnv): boolean =>
  !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET && !!env.AUTH_SECRET;

/** Where Google sends the browser back. Derived from the request, never configured twice. */
export const redirectUri = (url: URL) => `${url.origin}/api/auth/google/callback`;

interface StatePayload { n: string; v: string; r: string }

/** Google's answer, once we have decided it is trustworthy. */
export interface GoogleIdentity { email: string; name: string }

/* ------------------------------- start ------------------------------- */

/**
 * Build the redirect that starts a sign-in.
 *
 * Returns the Google URL and the cookie that has to travel with it — the
 * caller sets both, because only it knows how it wants to respond.
 */
export async function startGoogleSignIn(
  url: URL, env: GoogleEnv, now: number, returnTo = "/",
): Promise<{ location: string; cookie: string }> {
  const nonce = randomToken(16);
  const verifier = randomToken(32);
  const state: StatePayload = { n: nonce, v: verifier, r: safeReturn(returnTo) };
  const sealed = await seal(state, env.AUTH_SECRET!, STATE_TTL_SECONDS, now);

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(url),
    response_type: "code",
    scope: "openid email profile",
    state: nonce,
    code_challenge: await pkceChallenge(verifier),
    code_challenge_method: "S256",
    access_type: "online",
    // Always offer the account chooser. Without it, anyone already signed in to
    // one Google account is silently signed in as that account, which is
    // baffling on a shared machine.
    prompt: "select_account",
  });

  return {
    location: `${AUTH_ENDPOINT}?${params}`,
    cookie:
      `${STATE_COOKIE}=${sealed}; Path=/api/auth; HttpOnly; SameSite=Lax; ` +
      `Max-Age=${STATE_TTL_SECONDS}${secureFlag(url)}`,
  };
}

/* ------------------------------ callback ------------------------------ */

export type CallbackResult =
  | { ok: true; identity: GoogleIdentity; returnTo: string; clearCookie: string }
  | { ok: false; error: string };

/**
 * Complete a sign-in: validate the state, exchange the code, and decide
 * whether the identity that comes back can be believed.
 */
export async function completeGoogleSignIn(
  request: Request, env: GoogleEnv, now: number,
): Promise<CallbackResult> {
  const url = new URL(request.url);

  const denied = url.searchParams.get("error");
  if (denied) {
    return { ok: false, error: denied === "access_denied"
      ? "Sign-in was cancelled."
      : "Google refused the sign-in." };
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  if (!code || !returnedState) return { ok: false, error: "Google's reply was incomplete." };

  const sealed = readCookie(request.headers.get("cookie"), STATE_COOKIE);
  if (!sealed) return { ok: false, error: "That sign-in took too long. Start again." };

  const state = await unseal<StatePayload>(sealed, env.AUTH_SECRET!, now);
  if (!state) return { ok: false, error: "That sign-in took too long. Start again." };
  if (state.n !== returnedState) return { ok: false, error: "That sign-in could not be verified." };

  let payload: Record<string, unknown>;
  try {
    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri(url),
        grant_type: "authorization_code",
        code_verifier: state.v,
      }),
    });
    if (!res.ok) return { ok: false, error: "Google would not complete the sign-in." };
    const body = (await res.json()) as { id_token?: string };
    if (!body.id_token) return { ok: false, error: "Google did not return an identity." };
    payload = decodeJwtPayload(body.id_token);
  } catch {
    return { ok: false, error: "Could not reach Google. Try again." };
  }

  const email = typeof payload.email === "string" ? payload.email : "";
  const verified = payload.email_verified === true || payload.email_verified === "true";
  const aud = payload.aud;

  if (aud !== env.GOOGLE_CLIENT_ID) {
    return { ok: false, error: "That sign-in was issued for a different application." };
  }
  if (!email) return { ok: false, error: "Google did not share an email address." };
  if (!verified) {
    return { ok: false, error: "That Google account's email address is not verified." };
  }

  return {
    ok: true,
    identity: { email, name: typeof payload.name === "string" ? payload.name : email },
    returnTo: state.r,
    clearCookie: `${STATE_COOKIE}=; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag(url)}`,
  };
}

/* ------------------------------- helpers ------------------------------- */

/** The claims of a JWT, without verifying it. Only ever called on a token fetched over TLS from Google. */
function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const part = jwt.split(".")[1] ?? "";
  const json = atob(part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "="));
  return JSON.parse(json) as Record<string, unknown>;
}

/**
 * Only ever return to a path on this site.
 *
 * `returnTo` arrives in a query string, so without this the sign-in link is an
 * open redirect: `?returnTo=https://evil.example` would bounce somebody through
 * a genuine login on a genuine domain and out to somewhere else.
 */
export function safeReturn(to: string): string {
  if (!to.startsWith("/") || to.startsWith("//")) return "/";
  return to;
}

function readCookie(header: string | null, name: string): string | null {
  for (const part of (header ?? "").split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

const secureFlag = (url: URL) =>
  url.protocol === "https:" || !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname)
    ? "; Secure" : "";
