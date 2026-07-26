import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

/**
 * Serves /api/* in `npm run dev` using the SAME handler the Worker runs in
 * production, so there is only ever one implementation to keep correct.
 * The key is read from .dev.vars (gitignored) and never reaches the bundle.
 */
function devApi(): Plugin {
  return {
    name: "stratfield-dev-api",
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
          "[stratfield] no .dev.vars found — the assistant will report itself unconfigured. " +
            "Copy .dev.vars.example and add your key.",
        );
      }

      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();

        void (async () => {
          try {
            const { handleChat } = await server.ssrLoadModule("/src/worker/chat.ts");

            const chunks: Buffer[] = [];
            for await (const c of req) chunks.push(c as Buffer);
            const request = new Request(`http://localhost${req.url}`, {
              method: req.method,
              headers: req.headers as HeadersInit,
              body: chunks.length ? Buffer.concat(chunks) : undefined,
            });

            const response: Response =
              req.url === "/api/chat"
                ? await handleChat(request, { GEMINI_API_KEY: env.GEMINI_API_KEY })
                : new Response(JSON.stringify({ error: "Not found." }), { status: 404 });

            res.statusCode = response.status;
            response.headers.forEach((v, k) => res.setHeader(k, v));
            if (!response.body) return res.end();
            const reader = response.body.getReader();
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(Buffer.from(value));
            }
            res.end();
          } catch (err) {
            server.config.logger.error(`[stratfield] /api error: ${String(err)}`);
            if (!res.headersSent) res.statusCode = 500;
            res.end(JSON.stringify({ error: "Local API handler failed." }));
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
