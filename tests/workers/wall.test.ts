import { createExecutionContext, waitOnExecutionContext, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import worker from "../../src/worker/index";
import type { Env } from "../../src/worker/index";
import { issueSession } from "../../src/worker/auth";

/* ------------------------------------------------------------------ *
 * The wall, against the real runtime.
 *
 * tests/auth.test.ts proves the handlers' logic against mock objects, and
 * says itself that a test against a mock only tests the mock. This file is
 * the other half: the same requests, executed inside workerd — real
 * Request/Response semantics, real crypto.subtle, real streams, and the
 * real KV implementation behind the bindings wrangler.jsonc declares.
 *
 * What it still cannot prove: that Cloudflare's edge routes requests here
 * at all. `run_worker_first: true` is asserted from the config file in
 * auth.test.ts; only a deployed probe proves the routing (QA-REVIEW.md
 * carries that checklist).
 * ------------------------------------------------------------------ */

/** A deployment with one invite code, riding on the real KV bindings. */
const CONFIGURED: Env = {
  ...(env as unknown as Env),
  AUTH_SECRET: "workers-test-secret",
  ACCESS_CODES: "tester:real-runtime-code",
  // The asset store stands in for Cloudflare's; the point is to observe
  // whether the Worker chose to reach it.
  ASSETS: { fetch: async () => new Response("APP-SHELL", { status: 200 }) },
};

const ctx = () => createExecutionContext();

describe("fail-closed, in workerd", () => {
  it("serves the not-configured page, not the app, when no way in exists", async () => {
    const c = ctx();
    const res = await worker.fetch(
      new Request("https://octant.test/"),
      { ASSETS: { fetch: async () => new Response("APP-SHELL") } } as unknown as Env,
      c,
    );
    await waitOnExecutionContext(c);
    expect(res.status).toBe(503);
    const body = await res.text();
    expect(body).toContain("Not configured");
    expect(body).not.toContain("APP-SHELL");
  });

  it("gives API callers JSON, not the HTML gate", async () => {
    const res = await worker.fetch(
      new Request("https://octant.test/api/chat", { method: "POST" }),
      {} as Env,
      ctx(),
    );
    expect(res.status).toBe(503);
    expect(res.headers.get("content-type")).toContain("application/json");
  });
});

describe("the wall, configured, in workerd", () => {
  it("refuses an anonymous deep link and never consults the asset store", async () => {
    let assetTouched = false;
    const spied: Env = {
      ...CONFIGURED,
      ASSETS: {
        fetch: async () => {
          assetTouched = true;
          return new Response("APP-SHELL");
        },
      },
    };
    const res = await worker.fetch(new Request("https://octant.test/type/ENTP"), spied, ctx());
    expect(res.status).toBe(401);
    expect(await res.text()).not.toContain("APP-SHELL");
    expect(assetTouched).toBe(false);
  });

  it("logs in with the real crypto stack and then reaches the app", async () => {
    const c = ctx();
    const login = await worker.fetch(
      new Request("https://octant.test/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: "real-runtime-code" }),
      }),
      CONFIGURED,
      c,
    );
    await waitOnExecutionContext(c);
    expect(login.status).toBe(200);
    const cookie = login.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("octant_session=");
    expect(cookie).toContain("HttpOnly");

    const res = await worker.fetch(
      new Request("https://octant.test/pair/ENTP/ENFJ", {
        headers: { cookie: cookie.split(";")[0] },
      }),
      CONFIGURED,
      ctx(),
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("APP-SHELL");
  });

  it("rejects a forged cookie under real crypto.subtle", async () => {
    const forged = await issueSession("intruder", "code", undefined, "wrong-secret", Date.now());
    const res = await worker.fetch(
      new Request("https://octant.test/type/ENTP", {
        headers: { cookie: `octant_session=${forged}` },
      }),
      CONFIGURED,
      ctx(),
    );
    expect(res.status).toBe(401);
  });

  it("stores and enforces a Google user's status through the real KV binding", async () => {
    // The USERS binding here is miniflare's actual KV, not a Map pretending.
    await (env as unknown as Env & { USERS: KVNamespace }).USERS.put(
      "user:blocked@example.com",
      JSON.stringify({
        email: "blocked@example.com", name: "Blocked", status: "blocked",
        firstSeen: 1, lastSeen: 1,
      }),
    );
    const token = await issueSession(
      "Blocked", "google", "blocked@example.com", "workers-test-secret", Date.now(),
    );
    const res = await worker.fetch(
      new Request("https://octant.test/type/ENTP", {
        headers: { cookie: `octant_session=${token}` },
      }),
      CONFIGURED,
      ctx(),
    );
    expect(res.status).toBe(403);
    expect(await res.text()).toContain("No access");
  });
});

interface KVNamespace {
  put(key: string, value: string): Promise<void>;
}
