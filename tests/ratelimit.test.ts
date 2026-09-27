import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { handleAuth, type AuthEnv } from "../src/worker/auth";
import { handleChat, type Env as ChatEnv } from "../src/worker/chat";
import worker from "../src/worker/index";
import type { Env } from "../src/worker/index";

/* ------------------------------------------------------------------ *
 * The cross-isolate brakes (wrangler.jsonc ratelimits) and the cron
 * sweep entry point. The bindings are absent in dev and in most tests —
 * that absence is itself load-bearing (the in-memory brakes still work)
 * — so these tests supply a hand-rolled binding and check both verdicts
 * plus the failure posture: a limiter OUTAGE fails open, because the
 * wall's digest comparison is the defence and a rate-limit hiccup must
 * not lock the owner out.
 * ------------------------------------------------------------------ */

const NOW = 1_800_000_000_000;

const login = (ip: string) =>
  new Request("https://octant.test/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": ip },
    body: JSON.stringify({ code: "nope" }),
  });

describe("LOGIN_LIMITER", () => {
  const base: AuthEnv = { AUTH_SECRET: "s", ACCESS_CODES: "a:real-code" };

  it("refuses when the binding says the ceiling is spent", async () => {
    const env: AuthEnv = { ...base, LOGIN_LIMITER: { limit: async () => ({ success: false }) } };
    const res = await handleAuth(login("9.9.9.1"), env, NOW);
    expect(res?.status).toBe(429);
  });

  it("proceeds to the code check when the binding allows", async () => {
    const env: AuthEnv = { ...base, LOGIN_LIMITER: { limit: async () => ({ success: true }) } };
    const res = await handleAuth(login("9.9.9.2"), env, NOW);
    expect(res?.status).toBe(401); // wrong code, not throttled
  });

  it("fails open when the binding itself fails", async () => {
    const env: AuthEnv = {
      ...base,
      LOGIN_LIMITER: { limit: async () => { throw new Error("limiter down"); } },
    };
    const res = await handleAuth(login("9.9.9.3"), env, NOW);
    expect(res?.status).toBe(401);
  });
});

describe("CHAT_LIMITER", () => {
  const post = (ip: string) =>
    new Request("https://octant.test/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": ip },
      body: JSON.stringify({ messages: [{ role: "user", text: "hi" }] }),
    });

  it("refuses when the binding says so, before spending Gemini quota", async () => {
    const fetchStub = vi.fn();
    vi.stubGlobal("fetch", fetchStub);
    const env: ChatEnv = {
      GEMINI_API_KEY: "k",
      CHAT_LIMITER: { limit: async () => ({ success: false }) },
    };
    const res = await handleChat(post("9.9.9.4"), env, {}, NOW);
    expect(res.status).toBe(429);
    expect(fetchStub).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("does NOT charge the shared budget for a malformed request", async () => {
    /* A flood of malformed POSTs from one NAT must not spend the per-IP chat
       budget and 429 the legitimate users behind it. The limiter is charged
       only once the request is a valid chat request; a bad body gets a cheap
       400 and touches the limiter zero times. */
    let charged = 0;
    const env: ChatEnv = {
      GEMINI_API_KEY: "k",
      CHAT_LIMITER: {
        limit: async () => {
          charged++;
          return { success: false };
        },
      },
    };
    const bad = new Request("https://octant.test/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "9.9.9.5" },
      body: "{not json",
    });
    const res = await handleChat(bad, env, {}, NOW);
    expect(res.status).toBe(400);
    expect(charged).toBe(0);
  });

  it("does NOT charge the budget for a malformed CONTEXT either", async () => {
    /* Not just malformed JSON: a well-formed body with a context that is not
       one the app produces (here a bad type code) must also 400 before the
       limiter, so a crafted-context flood cannot spend the budget. This locks
       in the validate-then-limit ordering against a future reorder. A fresh IP
       means the in-memory brake cannot be the thing returning 429, so a
       zero-charge 400 proves the request stopped at context validation, ahead
       of BOTH limiters. */
    let charged = 0;
    const env: ChatEnv = {
      GEMINI_API_KEY: "k",
      CHAT_LIMITER: {
        limit: async () => {
          charged++;
          return { success: false };
        },
      },
    };
    const req = new Request("https://octant.test/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "9.9.9.6" },
      body: JSON.stringify({
        messages: [{ role: "user", text: "hi" }],
        context: { kind: "type", type: "XXXX" },
      }),
    });
    const res = await handleChat(req, env, {}, NOW);
    expect(res.status).toBe(400);
    expect(charged).toBe(0);
  });
});

describe("the deployed config", () => {
  it("declares all three limiters and the hourly sweep", () => {
    const raw = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
    const config = JSON.parse(
      raw
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "")
        .replace(/,(\s*[}\]])/g, "$1"),
    ) as {
      ratelimits?: { name: string; simple: { limit: number; period: number } }[];
      triggers?: { crons?: string[] };
    };
    const names = (config.ratelimits ?? []).map((r) => r.name).sort();
    expect(names).toEqual(["CHAT_LIMITER", "LOGIN_LIMITER", "ONRAMP_LIMITER"]);
    for (const r of config.ratelimits ?? []) expect([10, 60]).toContain(r.simple.period);
    expect(config.triggers?.crons?.length).toBe(1);
  });
});

describe("the cron entry point", () => {
  it("exists and runs the sweep without a binding as a no-op", async () => {
    // The real assertion is in wrangler.jsonc's triggers block plus
    // tests/auth.test.ts's config parse; here: calling it cannot throw.
    await expect(
      worker.scheduled(undefined, {} as Env, undefined),
    ).resolves.toBeUndefined();
  });

  it("also refreshes the trending-tags cache on the same tick", async () => {
    const store = new Map<string, string>();
    const CHAT_LOGS = {
      async get(k: string) { return store.get(k) ?? null; },
      async put(k: string, v: string) { store.set(k, v); },
      async delete(k: string) { store.delete(k); },
      async list() { return { keys: [], list_complete: true }; },
    };
    await worker.scheduled(undefined, { CHAT_LOGS } as unknown as Env, undefined);
    // An empty scan still writes the cache — proof refreshTrendingTags ran,
    // not just that it was importable.
    expect(store.has("meta:trending")).toBe(true);
  });
});
