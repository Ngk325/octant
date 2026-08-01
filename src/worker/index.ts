import { handleChat, type Env as ChatEnv } from "./chat";
import {
  handleAuth, requireAuth, readSession, issueSession, setCookie, signinPage,
  type AuthEnv,
} from "./auth";
import { marketingPage } from "./marketing";
import {
  startGoogleSignIn, completeGoogleSignIn, googleConfigured, safeReturn,
  type GoogleEnv,
} from "./google";
import { handleAdmin, type AdminEnv } from "./admin";
import { endSession, sweepIdle, validThreadId, listThreads, getThreadFor, type ChatWho } from "./chatlog";
import { recordSignIn, isOwner, getUser } from "./users";
import { notifyOwnerOfSignup, type NotifyEnv } from "./notify";
import { withSecurityHeaders } from "./headers";

/**
 * Assets-plus-API Worker, behind an access wall.
 *
 * Order matters and is the whole security property: the auth routes are the
 * only thing reachable without a session, and the gate runs before anything
 * else — including before the asset binding. An unauthenticated visitor never
 * receives a byte of the app, not the shell and not a single chunk of JS.
 *
 * That last part depends on `assets.run_worker_first: true` in wrangler.jsonc.
 * With a route list there instead, Cloudflare serves matching assets without
 * ever invoking this file, and none of the below runs. tests/auth.test.ts
 * asserts that value for exactly this reason.
 */
export interface Env extends ChatEnv, AuthEnv, GoogleEnv, AdminEnv, NotifyEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

/** The third argument the runtime passes to `fetch`. Only `waitUntil` is used. */
export interface Ctx { waitUntil?(promise: Promise<unknown>): void }

export default {
  async fetch(request: Request, env: Env, ctx?: Ctx): Promise<Response> {
    const url = new URL(request.url);
    /* Everything the router returns leaves through the header layer —
       gate pages, assets, API JSON and the SSE stream alike. Routes decide
       content; headers.ts decides what every response must carry. */
    return withSecurityHeaders(url, await route(request, env, url, ctx));
  },

  /* The hourly transcript sweep (wrangler.jsonc triggers). This is what
     guarantees the owner's "every conversation reaches my inbox": the
     beacon covers a clean tab-close, and this covers everything else —
     crashes, lost networks, and the last session before a quiet week,
     which the old piggyback-on-traffic sweep could never mail because it
     needed a next message that never came. */
  async scheduled(_event: unknown, env: Env, ctx?: Ctx): Promise<void> {
    const work = sweepIdle(env, Date.now());
    if (ctx?.waitUntil) ctx.waitUntil(work); else await work;
  },
};

async function route(request: Request, env: Env, url: URL, ctx?: Ctx): Promise<Response> {
  const now = Date.now();

  // 1. Google's two routes, public by necessity — this is how you get a session.
  if (url.pathname.startsWith("/api/auth/google/")) {
    return handleGoogle(request, env, url, now, ctx);
  }

  // 2. The code login, logout and "who am I". Also public by necessity.
  const auth = await handleAuth(request, env, now);
  if (auth) return auth;

  // 3. The signed approve/deny links from the notification email. Public on
  //    purpose: the signature IS the authorisation, so the owner can act from
  //    a phone without signing in. It can only ever affect the one person the
  //    link already names.
  if (url.pathname === "/api/admin/act") {
    return (await handleAdmin(request, env, { owner: false }, now))!;
  }

  // 4. The sign-in page, at its own public route so the front door can link
  //    to it. Someone already signed in is sent home instead.
  if (url.pathname === "/signin" && request.method === "GET") {
    const session = await readSession(request, env, now);
    if (session) return new Response(null, { status: 302, headers: { location: "/" } });
    return signinPage(env, safeReturn(url.searchParams.get("returnTo") ?? "/"));
  }

  // 5. The wall. Returns a response for everyone not signed in and approved —
  //    with ONE carve-out: an anonymous GET of the front page gets the public
  //    marketing page instead of a 401. Only the 401 (no session at all) is
  //    softened, only for "/", and only for GET; a pending or blocked person
  //    (403) still sees their status page, and no app markup or asset is ever
  //    in the marketing response. The wall itself is untouched.
  const blocked = await requireAuth(request, env, now);
  if (blocked) {
    if (url.pathname === "/" && request.method === "GET" && blocked.status === 401) {
      return marketingPage(url.origin);
    }
    return blocked;
  }

  // 6. Past the wall. The rest of /api/admin needs to be the owner.
  if (url.pathname.startsWith("/api/admin/")) {
    const session = await readSession(request, env, now);
    const user = session?.email ? await getUser(env, session.email) : null;
    const owner = !!user?.owner || (!!session?.email && isOwner(env, session.email));
    return (await handleAdmin(request, env, { email: session?.email, owner }, now))!;
  }

  if (url.pathname === "/api/chat") {
    const session = await readSession(request, env, now);
    return handleChat(request, env, {
      who: {
        email: session?.email,
        label: session?.label ?? "unknown",
        kind: session?.kind ?? "code",
        codeId: session?.codeId,
      },
      ua: request.headers.get("user-agent") ?? undefined,
      waitUntil: ctx?.waitUntil?.bind(ctx),
    }, now);
  }

  // The session-end beacon: mails the thread's transcript to the owner.
  // Behind the wall, idempotent, and always 204 — a beacon cannot retry, so
  // there is nothing useful to tell it.
  if (url.pathname === "/api/chat/end" && request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as { threadId?: unknown };
    if (validThreadId(body.threadId)) {
      const work = endSession(env, body.threadId, now);
      if (ctx?.waitUntil) ctx.waitUntil(work); else await work;
    }
    return new Response(null, { status: 204 });
  }

  // History: the caller's own past threads (list, and one in full). Never
  // another user's — both are scoped to the session's identity.
  if (url.pathname === "/api/chat/history" && request.method === "GET") {
    const session = await readSession(request, env, now);
    const who: ChatWho = {
      email: session?.email,
      label: session?.label ?? "unknown",
      kind: session?.kind ?? "code",
      codeId: session?.codeId,
    };
    const threads = await listThreads(env, who);
    return new Response(JSON.stringify({ threads }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (url.pathname.startsWith("/api/chat/thread/") && request.method === "GET") {
    const threadId = url.pathname.slice("/api/chat/thread/".length);
    if (!validThreadId(threadId)) {
      return new Response(JSON.stringify({ error: "Not found." }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    const session = await readSession(request, env, now);
    const who: ChatWho = {
      email: session?.email,
      label: session?.label ?? "unknown",
      kind: session?.kind ?? "code",
      codeId: session?.codeId,
    };
    const thread = await getThreadFor(env, who, threadId);
    if (!thread) {
      return new Response(JSON.stringify({ error: "Not found." }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ thread }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (url.pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ error: "Not found." }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  return env.ASSETS.fetch(request);
}

/**
 * `/api/auth/google/start` and `/api/auth/google/callback`.
 *
 * The callback is where a first-time visitor becomes a pending user and the
 * owner gets an email. Note what it does NOT do: it issues a session either
 * way. Somebody waiting for approval is signed in and held at the gate, rather
 * than signed out — otherwise they would have to re-authenticate every time
 * they checked whether they had been let in.
 */
async function handleGoogle(
  request: Request, env: Env, url: URL, now: number, ctx?: Ctx,
): Promise<Response> {
  if (!googleConfigured(env) || !env.USERS) {
    return new Response(JSON.stringify({ error: "Google sign-in is not configured." }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  if (url.pathname === "/api/auth/google/start") {
    const { location, cookie } = await startGoogleSignIn(
      url, env, now, safeReturn(url.searchParams.get("returnTo") ?? "/"),
    );
    return new Response(null, { status: 302, headers: { location, "set-cookie": cookie } });
  }

  if (url.pathname !== "/api/auth/google/callback") {
    return new Response(JSON.stringify({ error: "Not found." }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const result = await completeGoogleSignIn(request, env, now);
  if (!result.ok) return signInProblem(result.error);

  const { user, isNew } = await recordSignIn(env, result.identity.email, result.identity.name, now);

  /* The email is best-effort and must never fail the sign-in — notifyOwnerOfSignup
     never throws, so neither branch below can.

     waitUntil lives on the ExecutionContext, the THIRD argument to fetch. It was
     previously read off the Request, where it does not exist: the check was always
     false, the send was never registered, and the runtime was free to cancel it the
     moment the redirect went out. The owner could silently never be told anyone had
     signed up — the one failure mode this whole feature exists to prevent.

     Without a context (a direct call in a test), await instead. Fire-and-forget was
     the other half of the bug: an unawaited promise in a Worker is not a background
     task, it is a promise nobody is keeping alive. */
  if (isNew && !user.owner) {
    const send = notifyOwnerOfSignup(env, url.origin, user, now);
    if (typeof ctx?.waitUntil === "function") ctx.waitUntil(send);
    else await send;
  }

  const token = await issueSession(user.name, "google", user.email, env.AUTH_SECRET!, now);
  return new Response(null, {
    status: 302,
    headers: [
      ["location", user.status === "approved" ? result.returnTo : "/"],
      ["set-cookie", setCookie(url, token)],
      ["set-cookie", result.clearCookie],
    ],
  });
}

/** A readable page when Google hands back a problem, rather than a raw error. */
const signInProblem = (message: string) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Octant — sign-in problem</title>
<style>
  :root{color-scheme:light dark;--paper:#FDFCFA;--ink:#1A1714;--ink2:#4C463D;--accent:#6B3BC4}
  @media(prefers-color-scheme:dark){:root{--paper:#141310;--ink:#EDE9E1;--ink2:#B6AFA3;--accent:#C9A0FF}}
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--paper);
       color:var(--ink);font:400 19px/1.6 Georgia,'Times New Roman',serif}
  main{max-width:26rem}h1{font-size:30px;margin:0 0 8px}p{color:var(--ink2);margin:0 0 20px}
  a{color:var(--accent)}
</style></head><body><main>
<h1>That did not work</h1><p>${message.replace(/[<>&]/g, "")}</p>
<p><a href="/">Back to the start</a></p>
</main></body></html>`,
    { status: 400, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
