/* ------------------------------------------------------------------ *
 * SIGNING PRIMITIVES
 *
 * Three things in this Worker need the same guarantee — "this string
 * came from us and has not been altered": the session cookie, the OAuth
 * state parameter, and the approve/deny links in the notification email.
 *
 * They all get it from here rather than each growing their own copy,
 * because three near-identical HMAC implementations is three places for
 * one of them to be subtly wrong.
 * ------------------------------------------------------------------ */

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Base64url, unpadded — safe in a cookie, a URL and a query string alike. */
export function b64url(buf: ArrayBuffer | Uint8Array | string): string {
  const bytes = typeof buf === "string"
    ? enc.encode(buf)
    : buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Reverse of b64url, restoring the padding base64 needs.
 *
 * The TextDecoder is not decoration. `atob` returns a string of code points
 * 0–255 — one character per byte, i.e. Latin-1 — but `b64url` encoded UTF-8.
 * Reading the result straight back mangles every multi-byte character, so a
 * session for `José` or `文` would round-trip to mojibake and, once it reached
 * a KV lookup keyed on that value, simply not be found.
 */
export function unb64url(s: string): string {
  const t = s.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(t + (t.length % 4 ? "=".repeat(4 - (t.length % 4)) : ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return dec.decode(bytes);
}

/** HMAC-SHA256 over the payload, base64url encoded. */
export async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
}

/** SHA-256 digest, hex. Comparing digests leaks neither value nor length. */
export async function digest(s: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time compare of two equal-length hex strings. */
export function sameDigest(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/** Compare a presented signature against the expected one, in constant time. */
export const signatureMatches = async (given: string, expected: string) =>
  sameDigest(await digest(given), await digest(expected));

/**
 * Wrap a value with an expiry and a signature: `<payload>.<sig>`.
 *
 * There is no encryption here and none is wanted — the contents are not secret
 * (an email address, a purpose), only unforgeable. Anyone can read a sealed
 * value; nobody without the secret can produce or alter one.
 */
export async function seal<T>(
  value: T, secret: string, ttlSeconds: number, now: number,
): Promise<string> {
  const payload = b64url(JSON.stringify({ v: value, e: Math.floor(now / 1000) + ttlSeconds }));
  return `${payload}.${await sign(payload, secret)}`;
}

/** Open a sealed value. Null for anything forged, malformed or expired. */
export async function unseal<T>(
  token: string, secret: string, now: number,
): Promise<T | null> {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  if (!(await signatureMatches(token.slice(dot + 1), await sign(payload, secret)))) return null;
  try {
    const { v, e } = JSON.parse(unb64url(payload)) as { v?: T; e?: number };
    if (typeof e !== "number" || e * 1000 <= now) return null;
    return (v ?? null) as T | null;
  } catch {
    return null;
  }
}

/** A random URL-safe token, for OAuth state and PKCE verifiers. */
export function randomToken(bytes = 32): string {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** The S256 PKCE challenge for a verifier. */
export async function pkceChallenge(verifier: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", enc.encode(verifier));
  return b64url(h);
}
