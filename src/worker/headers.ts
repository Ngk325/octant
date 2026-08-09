import { b64url } from "./crypto";
import { GATE_SCRIPT } from "./auth";
import { ONRAMP_SCRIPT } from "./onramp";

/* ------------------------------------------------------------------ *
 * SECURITY HEADERS — one layer, at the Worker's single exit.
 *
 * Before this file, x-frame-options existed on the gate pages and nowhere
 * else: the app shell, every asset and every API response went out bare.
 * Wrapping the router's return means no future route can forget — a page
 * would have to opt out on purpose.
 *
 * The CSP allows exactly three inline scripts, by hash: the theme resolver
 * in index.html, the gate's login script, and the onramp funnel's
 * tap-to-advance script. Everything else executable must come from this
 * origin. Two consequences worth knowing:
 *
 *   - The theme script's hash is a CONSTANT here, pinned by a test that
 *     recomputes it from index.html — editing that script without
 *     updating the hash fails the suite, not the deployed page.
 *   - Styles allow 'unsafe-inline', because the worker-rendered pages
 *     carry <style> blocks and React writes style attributes. Inline
 *     style is a far smaller injection surface than inline script, and
 *     the app never renders fetched HTML.
 *
 * Fonts stay on Google's CDN (owner's call, 2026-08), so style-src and
 * font-src name those hosts; self-hosting them would be the one change
 * that lets this tighten to 'self' alone.
 * ------------------------------------------------------------------ */

/** sha256 of the inline theme script in index.html. Pinned by tests/headers.test.ts. */
export const THEME_SCRIPT_HASH = "fI7cPwjKmhiJb+s9GwOotcGNxeFCKEdQ+OKGXLLbVLU=";

/** Base64 (not base64url — CSP wants standard alphabet) of a sha256. */
async function sha256b64(s: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return b64url(h).replace(/-/g, "+").replace(/_/g, "/") + pad(h.byteLength);
}
/* base64url strips padding; standard base64 of 32 bytes ends in "=". */
const pad = (bytes: number) => (bytes % 3 === 0 ? "" : bytes % 3 === 1 ? "==" : "=");

/** Built once per isolate; the gate script's hash cannot drift because it is computed from the string itself. */
let cspPromise: Promise<string> | null = null;
function csp(): Promise<string> {
  cspPromise ??= (async () => {
    const gate = await sha256b64(GATE_SCRIPT);
    const onramp = await sha256b64(ONRAMP_SCRIPT);
    return [
      "default-src 'self'",
      `script-src 'self' 'sha256-${THEME_SCRIPT_HASH}' 'sha256-${gate}' 'sha256-${onramp}'`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");
  })();
  return cspPromise;
}

/**
 * Apply the layer to whatever the router returned. Never touches status,
 * body or existing cache-control; the body is passed through as the same
 * stream, so SSE keeps streaming.
 */
export async function withSecurityHeaders(url: URL, res: Response): Promise<Response> {
  /* Asset responses arrive with immutable headers; rebuild around the same body. */
  const out = new Response(res.body, res);
  const h = out.headers;

  h.set("x-content-type-options", "nosniff");
  h.set("referrer-policy", "no-referrer");
  h.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");

  /* HSTS only where it is true. No includeSubDomains: this Worker cannot
     speak for whatever else lives under the owner's zone. */
  if (url.protocol === "https:") {
    h.set("strict-transport-security", "max-age=31536000");
  }

  /* Documents additionally get the CSP and the frame refusal. API JSON and
     asset files cannot be framed or execute markup, so the noise is spared. */
  if ((h.get("content-type") ?? "").includes("text/html")) {
    h.set("content-security-policy", await csp());
    h.set("x-frame-options", "DENY");
  }
  return out;
}
