import { handleChat, type Env as ChatEnv } from "./chat";

/**
 * Assets-plus-API Worker. Everything that is not /api/* is handed straight to
 * the static asset binding, which keeps `not_found_handling: single-page-application`
 * doing its job for deep links like /pair/ENTP/ENFJ.
 */
export interface Env extends ChatEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
