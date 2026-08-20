import { createExecutionContext, waitOnExecutionContext, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import worker from "../../src/worker/index";
import type { Env } from "../../src/worker/index";
import { issueSession } from "../../src/worker/auth";
import { recordApplication, setStatus } from "../../src/worker/users";
import { stack } from "../../src/engine/core";
import { TYPES } from "../../src/engine/data";

/* ------------------------------------------------------------------ *
 * THE STACK EXPORT, against the real runtime.
 *
 * Same posture as wall.test.ts: executed inside workerd, so the CORS
 * semantics, the header layer and crypto.subtle are the real ones rather
 * than mocks agreeing with themselves.
 *
 * The three properties worth holding down here are the ones that would
 * be silent if they broke: that the route is not a hole in the wall,
 * that it answers with the agreed contract and nothing wider, and that
 * the cross-origin headers go only to allowed origins.
 * ------------------------------------------------------------------ */

const TOKEN = "export-token-for-tests";
const ALLOWED = "https://strata.example";

const CONFIGURED: Env = {
  ...(env as unknown as Env),
  AUTH_SECRET: "workers-test-secret",
  ACCESS_CODES: "tester:real-runtime-code",
  EXPORT_TOKEN: TOKEN,
  EXPORT_ORIGINS: `${ALLOWED},https://other.example`,
  ASSETS: { fetch: async () => new Response("APP-SHELL", { status: 200 }) },
};

const ctx = () => createExecutionContext();

async function call(url: string, init: RequestInit = {}, envOverride: Partial<Env> = {}) {
  const c = ctx();
  const res = await worker.fetch(
    new Request(url, init),
    { ...CONFIGURED, ...envOverride } as Env,
    c,
  );
  await waitOnExecutionContext(c);
  return res;
}

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

describe("the export is gated", () => {
  it("refuses an anonymous caller with no token", async () => {
    const res = await call("https://octant.test/api/export/stack/INTJ");
    expect(res.status).toBe(401);
    expect(await res.text()).not.toContain("Ni");
  });

  it("refuses a wrong token", async () => {
    const res = await call("https://octant.test/api/export/stack/INTJ", {
      headers: bearer("not-the-token"),
    });
    expect(res.status).toBe(401);
  });

  it("refuses a token when none is configured, rather than letting it through", async () => {
    const res = await call(
      "https://octant.test/api/export/stack/INTJ",
      { headers: bearer(TOKEN) },
      { EXPORT_TOKEN: undefined },
    );
    expect(res.status).toBe(401);
  });

  it("accepts a valid token", async () => {
    const res = await call("https://octant.test/api/export/stack/INTJ", {
      headers: bearer(TOKEN),
    });
    expect(res.status).toBe(200);
  });

  it("accepts a signed-in session on this origin, without any token", async () => {
    /* An APPROVED session, which since the application form is a different
       thing from merely a valid one: a signed-in person who still owes an
       application is held at the form, and that has to hold on this route
       too or the export would be the way around it. */
    const email = `exporter-${Math.floor(Math.random() * 1e9)}@example.test`;
    const now = Date.now();
    await recordApplication(CONFIGURED, email, "Tester", {
      purpose: "Figure myself out", context: "Just me", familiarity: "New to it",
      hoping: "Read my own stack.", found: "", at: now,
    }, now);
    await setStatus(CONFIGURED, email, "approved", now);

    const token = await issueSession("tester", "google", email, CONFIGURED.AUTH_SECRET!, now);
    const res = await call("https://octant.test/api/export/stack/INTJ", {
      headers: { cookie: `octant_session=${token}` },
    });
    expect(res.status).toBe(200);
  });

  it("refuses a session that has not applied — the export is not a way around the form", async () => {
    const token = await issueSession("tester", "code", undefined, CONFIGURED.AUTH_SECRET!, Date.now());
    const res = await call("https://octant.test/api/export/stack/INTJ", {
      headers: { cookie: `octant_session=${token}` },
    });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Application required." });
  });

  it("carries CORS headers on the refusal too, so the browser can read it", async () => {
    const res = await call("https://octant.test/api/export/stack/INTJ", {
      headers: { origin: ALLOWED },
    });
    expect(res.status).toBe(401);
    expect(res.headers.get("access-control-allow-origin")).toBe(ALLOWED);
  });
});

describe("the contract, and nothing wider", () => {
  it("returns eight slots, numbered 1..8, matching the engine", async () => {
    const res = await call("https://octant.test/api/export/stack/INTJ", { headers: bearer(TOKEN) });
    const body = (await res.json()) as {
      type: string;
      slots: { slot: number; function_attitude: string }[];
    };
    expect(body.type).toBe("INTJ");
    expect(body.slots).toHaveLength(8);
    expect(body.slots.map((s) => s.slot)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(body.slots.map((s) => s.function_attitude)).toEqual(stack("INTJ"));
  });

  it("agrees with the engine for all sixteen types", async () => {
    for (const t of TYPES) {
      const res = await call(`https://octant.test/api/export/stack/${t}`, { headers: bearer(TOKEN) });
      const body = (await res.json()) as { slots: { function_attitude: string }[] };
      expect(body.slots.map((s) => s.function_attitude), t).toEqual(stack(t));
    }
  });

  it("exposes only the two agreed keys per slot — no reading leaks through", async () => {
    const res = await call("https://octant.test/api/export/stack/ENFP", { headers: bearer(TOKEN) });
    const body = (await res.json()) as Record<string, unknown> & {
      slots: Record<string, unknown>[];
    };
    expect(Object.keys(body).sort()).toEqual(["slots", "type"]);
    for (const slot of body.slots) {
      expect(Object.keys(slot).sort()).toEqual(["function_attitude", "slot"]);
    }
  });

  it("accepts a lowercase code and answers with the canonical one", async () => {
    const res = await call("https://octant.test/api/export/stack/intj", { headers: bearer(TOKEN) });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { type: string }).type).toBe("INTJ");
  });

  it("404s an unknown type and a bare prefix", async () => {
    for (const path of ["/api/export/stack/XXXX", "/api/export/stack/", "/api/export/"]) {
      const res = await call(`https://octant.test${path}`, { headers: bearer(TOKEN) });
      expect(res.status, path).toBe(404);
    }
  });

  it("405s a write attempt — the seam is read-only", async () => {
    const res = await call("https://octant.test/api/export/stack/INTJ", {
      method: "POST",
      headers: bearer(TOKEN),
    });
    expect(res.status).toBe(405);
  });
});

describe("cross-origin access is an allowlist", () => {
  it("answers the preflight for an allowed origin, without credentials", async () => {
    const res = await call("https://octant.test/api/export/stack/INTJ", {
      method: "OPTIONS",
      headers: { origin: ALLOWED },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(ALLOWED);
    expect(res.headers.get("access-control-allow-methods")).toContain("GET");
  });

  it("withholds the header from an origin that is not on the list", async () => {
    const res = await call("https://octant.test/api/export/stack/INTJ", {
      method: "OPTIONS",
      headers: { origin: "https://not-invited.example" },
    });
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("withholds it entirely when no origins are configured", async () => {
    const res = await call(
      "https://octant.test/api/export/stack/INTJ",
      { headers: { origin: ALLOWED, ...bearer(TOKEN) } },
      { EXPORT_ORIGINS: undefined },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("varies on origin, so a cache cannot cross the wires", async () => {
    const res = await call("https://octant.test/api/export/stack/INTJ", {
      headers: { origin: ALLOWED, ...bearer(TOKEN) },
    });
    expect(res.headers.get("vary")).toContain("origin");
  });
});

describe("the rest of the wall is untouched", () => {
  it("still refuses the app shell to an anonymous visitor holding an export token", async () => {
    const res = await call("https://octant.test/types", { headers: bearer(TOKEN) });
    expect(res.status).toBe(401);
    expect(await res.text()).not.toContain("APP-SHELL");
  });

  it("still refuses another API route to an export token", async () => {
    const res = await call("https://octant.test/api/chat/history", { headers: bearer(TOKEN) });
    expect(res.status).toBe(401);
  });
});
