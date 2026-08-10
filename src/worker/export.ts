import { stack } from "../engine/core";
import { TYPES, type MbtiType } from "../engine/data";
import { signatureMatches } from "./crypto";

/* ------------------------------------------------------------------ *
 * THE STACK EXPORT — the one read-only seam out of this instrument.
 *
 * A separate private tool of the owner's keeps its own per-person notes
 * and needs to agree with this app about one thing only: which function
 * sits in which of the eight slots. This route is that agreement, and
 * deliberately nothing more.
 *
 * THE CONTRACT IS THE WHOLE INTERFACE:
 *
 *     GET /api/export/stack/:type  ->  { type, slots: [{ slot, function_attitude }] }
 *
 * Eight entries, slot 1..8, each naming a function. No epithets, no
 * archetype names, no relation codes, no playbook, no reading — none of
 * the composed material this app exists to produce. A caller learns the
 * ordering it needs to line its own records up with ours and learns
 * nothing else. Widening this response is how the seam stops being a
 * seam, so it should be widened only on purpose.
 *
 * WHY A TYPE AND NOT A PERSON. The obvious shape for this would be
 * "give me person X's slots", but there is no such record to give: this
 * app keeps no server-side account of anybody's type. A reader's own
 * result lives in their browser (src/storage.ts) and the KV namespaces
 * hold sign-in status and transcripts, nothing typological. What this
 * app can answer authoritatively is the derivation — `stack()` is a pure
 * function of the four-letter code — so that is what it answers. The
 * caller holds the person; we hold the maths. That division is worth
 * more than the convenience of the other shape: it means this app never
 * has to learn that the caller's people exist.
 *
 * WHY A TOKEN AND NOT THE SESSION COOKIE. The wall would be the natural
 * gate, but the session cookie is SameSite=Lax (see auth.ts), which a
 * browser will not attach to a cross-site fetch. Gating this on the
 * cookie would therefore mean flipping the whole app to SameSite=None —
 * weakening CSRF protection on every route to serve this one. A scoped
 * bearer token avoids that entirely, and is strictly the safer grant: it
 * can read stack orderings and do absolutely nothing else, whereas a
 * session would carry the caller's full access.
 *
 * DEGRADES, DOES NOT FAIL OPEN. With no EXPORT_TOKEN set, the token path
 * simply does not exist and the route falls back to the wall — reachable
 * by a signed-in person on this origin, refused to everyone else. With
 * no EXPORT_ORIGINS set, no cross-origin headers are emitted and the
 * route is same-origin only. Neither missing value opens anything.
 * ------------------------------------------------------------------ */

export interface ExportEnv {
  /** Bearer token for the export route. Unset: token auth unavailable, wall applies. */
  EXPORT_TOKEN?: string;
  /** Comma-separated origins allowed to read this cross-site. Unset: same-origin only. */
  EXPORT_ORIGINS?: string;
}

const PREFIX = "/api/export/stack/";
const TYPE_SET = new Set<string>(TYPES);
const isType = (s: string): s is MbtiType => TYPE_SET.has(s);

/** Does this path belong to the export surface at all? */
export const isExportPath = (pathname: string) => pathname.startsWith("/api/export/");

/** The configured allowlist, or an empty set when unset/blank. */
function allowedOrigins(env: ExportEnv): Set<string> {
  return new Set(
    (env.EXPORT_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/**
 * Cross-origin headers for an allowed caller, or nothing at all.
 *
 * `Vary: origin` is not optional here: without it a cache can hand the
 * headers computed for one origin to a request from another.
 */
function corsHeaders(request: Request, env: ExportEnv): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins(env).has(origin)) return { vary: "origin" };
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "authorization",
    "access-control-max-age": "86400",
    vary: "origin",
  };
}

/** Attach the cross-origin headers to a response, successes and refusals alike. */
export function withExportCors(res: Response, request: Request, env: ExportEnv): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(corsHeaders(request, env))) out.headers.set(k, v);
  return out;
}

/**
 * Is a valid bearer token presented?
 *
 * Compared through the digest helper rather than `===` so that a wrong
 * token cannot be walked character by character off the response time.
 */
export async function hasExportToken(request: Request, env: ExportEnv): Promise<boolean> {
  if (!env.EXPORT_TOKEN) return false;
  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!presented) return false;
  return signatureMatches(presented, env.EXPORT_TOKEN);
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      /* A derivation, not a reading: identical for every caller and stable
         until the engine itself changes. Worth caching, briefly. */
      "cache-control": status === 200 ? "public, max-age=3600" : "no-store",
    },
  });

/**
 * The preflight. It must be answerable without credentials — a browser
 * sends no cookie and no Authorization header on an OPTIONS preflight —
 * which is why the router runs this ahead of the wall rather than behind
 * it. It reveals only whether the origin is allowed, which that origin
 * already knows.
 */
export function exportPreflight(request: Request, env: ExportEnv): Response | null {
  if (request.method !== "OPTIONS" || !isExportPath(new URL(request.url).pathname)) return null;
  return withExportCors(new Response(null, { status: 204 }), request, env);
}

/**
 * The route itself. Returns null for anything outside the export surface
 * so the router can carry on; authorisation is the caller's job, above.
 */
export function handleExport(request: Request, url: URL): Response | null {
  if (!isExportPath(url.pathname)) return null;

  if (request.method !== "GET") {
    return json({ error: "Method not allowed." }, 405);
  }
  if (!url.pathname.startsWith(PREFIX)) {
    return json({ error: "Not found." }, 404);
  }

  /* Case-insensitive on the way in, canonical on the way out — a caller
     that asks for `intj` gets `INTJ` back and can key on it safely. */
  const code = url.pathname.slice(PREFIX.length).toUpperCase();
  if (!isType(code)) {
    return json({ error: "Unknown type." }, 404);
  }

  return json(
    {
      type: code,
      slots: stack(code).map((fn, i) => ({ slot: i + 1, function_attitude: fn })),
    },
    200,
  );
}
