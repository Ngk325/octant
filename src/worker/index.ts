import { handleChat, type Env as ChatEnv } from "./chat";
import { handleAuth, requireAuth, type AuthEnv } from "./auth";

/**
 * Assets-plus-API Worker, behind an access wall.
 *
 * Order matters and is the whole security property: the auth routes are the
 * only thing reachable without a session, and the gate runs before anything
 * else — including before the asset binding. An unauthenticated visitor never
 * receives a byte of the app, not the shell and not a single chunk of JS.
 *
 * Everything that survives the gate and is not /api/* goes to the static
 * assets, which keeps `not_found_handling: single-page-application` doing its
 * job for deep links like /pair/ENTP/ENFJ.
 */
export interface Env extends ChatEnv, AuthEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Auth routes are public by necessity — this is how you get a session.
    const auth = await handleAuth(request, env);
    if (auth) return auth;

    // 2. The wall. Returns a response for everyone who is not signed in.
    const blocked = await requireAuth(request, env);
    if (blocked) return blocked;

    // 3. Signed in. Normal routing.
    const { pathname } = new URL(request.url);
    if (pathname === "/api/chat") return handleChat(request, env);
    if (pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Not found." }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    return env.ASSETS.fetch(request);
  },
};
