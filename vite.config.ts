import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

/**
 * Runs the SAME Worker handlers in `npm run dev` that run in production, so
 * there is only ever one implementation to keep correct — including the access
 * wall. The dev site is gated exactly like the deployed one, which is the only
 * way to actually test the thing that is protecting it.
 *
 * Secrets are read from .dev.vars (gitignored) and never reach the bundle.
 */
function devApi(): Plugin {
  return {
    name: "octant-dev-api",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      const env: Record<string, string> = {};
      try {
        for (const raw of readFileSync(".dev.vars", "utf8").split("\n")) {
          const l = raw.trim();
          if (!l || l.startsWith("#")) continue;
          const eq = l.indexOf("=");
          if (eq > 0) env[l.slice(0, eq).trim()] = l.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        }
      } catch {
        server.config.logger.warn(
          "[octant] no .dev.vars found. The access wall fails closed, so the dev site will " +
            "serve its 'not configured' page until you run:  cp .dev.vars.example .dev.vars",
        );
      }

      server.middlewares.use((req, res, next) => {
        void (async () => {
          try {
            const { handleChat } = await server.ssrLoadModule("/src/worker/chat.ts");
            const { handleAuth, requireAuth, readSession, signinPage } =
              await server.ssrLoadModule("/src/worker/auth.ts");
            const { marketingPage } = await server.ssrLoadModule("/src/worker/marketing.ts");

            const chunks: Buffer[] = [];
            if (req.method === "POST" || req.method === "PUT") {
              for await (const c of req) chunks.push(c as Buffer);
            }
            const request = new Request(`http://localhost${req.url ?? "/"}`, {
              method: req.method,
              headers: req.headers as HeadersInit,
              body: chunks.length ? Buffer.concat(chunks) : undefined,
            });

            // Same order as src/worker/index.ts: auth routes, the sign-in
            // page, then the wall — with the same single front-door carve-out.
            let response: Response | null = await handleAuth(request, env);
            const url = new URL(request.url);
            if (!response && url.pathname === "/signin" && req.method === "GET") {
              const session = await readSession(request, env);
              response = session
                ? new Response(null, { status: 302, headers: { location: "/" } })
                : signinPage(env, url.searchParams.get("returnTo") ?? "/");
            }
            if (!response) response = await requireAuth(request, env);
            if (response && url.pathname === "/" && req.method === "GET" && response.status === 401) {
              response = marketingPage(url.origin);
            }

            // Signed in. Only /api/* is ours; everything else is Vite's.
            if (!response) {
              if (!req.url?.startsWith("/api/")) return next();
              response =
                req.url === "/api/chat"
                  ? await handleChat(request, { GEMINI_API_KEY: env.GEMINI_API_KEY })
                  : req.url === "/api/chat/end"
                    // No KV locally: the beacon is accepted and dropped, same
                    // as production without the binding.
                    ? new Response(null, { status: 204 })
                    : new Response(JSON.stringify({ error: "Not found." }), { status: 404 });
            }

            // ssrLoadModule is untyped, so the narrowing above does not survive. Asserted
            // rather than checked: every branch that reaches here has assigned one.
            const out = response as Response;
            res.statusCode = out.status;
            out.headers.forEach((v, k) => res.setHeader(k, v));
            if (!out.body) return res.end();
            const reader = out.body.getReader();
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(Buffer.from(value));
            }
            res.end();
          } catch (err) {
            server.config.logger.error(`[octant] dev handler error: ${String(err)}`);
            if (!res.headersSent) res.statusCode = 500;
            res.end(JSON.stringify({ error: "Local handler failed." }));
          }
        })();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devApi()],
  build: { outDir: "dist", sourcemap: false },
  test: { globals: true, environment: "node" },
});
