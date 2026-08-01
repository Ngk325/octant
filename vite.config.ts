import { defineConfig } from "vitest/config";
import type { Plugin, ViteDevServer } from "vite";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

/**
 * Runs the SAME Worker — the whole router, not selected handlers — in
 * `npm run dev` that runs in production, so there is exactly one
 * implementation to keep correct, including the access wall. Vite plays the
 * part of the asset binding: whatever the Worker would fetch from the asset
 * store is handed back to Vite's own pipeline via a marker response.
 *
 * Bindings that only exist deployed (KV, rate limits) are simply absent
 * here, and every feature behind them degrades exactly as production does
 * without them — that degradation is itself the tested behaviour.
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

      /* The marker the ASSETS shim leaves on its response. The Worker calls
         env.ASSETS.fetch for anything past the wall that is not an API route;
         in dev "the asset store" is Vite itself, so the shim answers with this
         header and the middleware hands the request to next(). */
      const PASS = "x-octant-dev-passthrough";

      server.middlewares.use((req, res, next) => {
        void (async () => {
          try {
            /* The REAL router — the same default export wrangler deploys.
               There is deliberately no route list here any more: an earlier
               version of this file mirrored index.ts by hand and drifted
               (no Google routes, no /api/admin, no chat history), which meant
               five surfaces could not be exercised locally at all. */
            const { default: worker } = await server.ssrLoadModule("/src/worker/index.ts");

            const chunks: Buffer[] = [];
            if (req.method === "POST" || req.method === "PUT") {
              for await (const c of req) chunks.push(c as Buffer);
            }
            const request = new Request(`http://localhost${req.url ?? "/"}`, {
              method: req.method,
              headers: req.headers as HeadersInit,
              body: chunks.length ? Buffer.concat(chunks) : undefined,
            });

            const devEnv = {
              ...env,
              ASSETS: {
                fetch: async () =>
                  new Response(null, { status: 204, headers: { [PASS]: "1" } }),
              },
            };
            const out = (await worker.fetch(request, devEnv, {
              /* No runtime to outlive the response in dev; run it inline. */
              waitUntil: (p: Promise<unknown>) => void p.catch(() => {}),
            })) as Response;

            if (out.headers.get(PASS)) return next();
            res.statusCode = out.status;
            out.headers.forEach((v, k) => { res.setHeader(k, v); });
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
  test: {
    projects: [
      /* The original suite: pure functions and SSR renders, plain Node. */
      {
        test: {
          name: "unit",
          globals: true,
          environment: "node",
          include: ["tests/**/*.test.{ts,tsx}"],
          exclude: ["tests/workers/**"],
        },
      },
      /* tests/workers/ runs INSIDE workerd via vitest-pool-workers, against
         the real runtime the mocks in tests/auth.test.ts cannot speak for —
         real Request/Response semantics, real crypto.subtle, real KV. The
         wrangler config below is the deployed one, so bindings and
         compatibility flags cannot drift between test and production. */
      {
        plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" } })],
        test: {
          name: "workers",
          globals: true,
          include: ["tests/workers/**/*.test.ts"],
        },
      },
    ],
  },
});
