import { describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../src/worker/index";
import { calculate } from "../src/engine/ops";
import { DETERMINING } from "../src/engine/data";
import { STRIPE_LINK } from "../src/worker/marketing";

/* ------------------------------------------------------------------ *
 * THE ONRAMP FUNNEL — public by design, worker-rendered, never the SPA.
 *
 * The rules this suite protects:
 *   1. Always reachable anonymously — it exists specifically for people
 *      who have not signed in yet.
 *   2. Never widens the wall — every other route keeps its normal
 *      behaviour, exactly like the marketing-page carve-out.
 *   3. Never overclaims — with only two of the four DETERMINING coins
 *      answered, calculate() cannot resolve a type, and the page must
 *      not pretend otherwise.
 * ------------------------------------------------------------------ */

const ENV = {
  AUTH_SECRET: "onramp-test-secret",
  ACCESS_CODES: "tester:some-code",
  ASSETS: { fetch: async () => new Response("APP-SHELL", { status: 200 }) },
} as unknown as Env;

const get = (path: string) => worker.fetch(new Request(`https://octant.example${path}`), ENV);

describe("GET /onramp", () => {
  it("is reachable anonymously at every step, never 401/403", async () => {
    for (let step = 0; step <= 11; step++) {
      const res = await get(`/onramp?step=${step}&goal=self&q0=Observer&q4=Sensing`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/html");
    }
  });

  it("leaks no app markup or bundle path", async () => {
    const html = await (await get("/onramp")).text();
    expect(html).not.toContain("APP-SHELL");
    expect(html).not.toContain("/assets/");
    expect(html).not.toContain("id=\"root\"");
  });

  it("clamps an out-of-range step instead of erroring", async () => {
    const tooHigh = await get("/onramp?step=999");
    expect(tooHigh.status).toBe(200);
    const negative = await get("/onramp?step=-5");
    expect(negative.status).toBe(200);
    const junk = await get("/onramp?step=not-a-number");
    expect(junk.status).toBe(200);
  });

  it("carries state forward as hidden inputs across a full walk", async () => {
    const html = await (await get("/onramp?step=2&goal=team")).text();
    expect(html).toContain('name="goal" value="team"');
  });

  it("does not widen the wall — every other anonymous route is unaffected", async () => {
    expect((await get("/type/ENTP")).status).toBe(401);
    expect((await get("/calculator")).status).toBe(401);
    expect((await get("/api/chat")).status).toBe(401);
  });

  it("the done step never claims a resolved type from partial DETERMINING answers", async () => {
    const answers: (string | null)[] = Array(8).fill(null);
    answers[0] = "Observer";
    answers[4] = "Sensing";
    const result = calculate(answers);
    // Regression guard for the brand-integrity rule: two of four
    // DETERMINING coins must never resolve a type.
    expect(DETERMINING.length).toBe(4);
    expect(result.status).toBe("incomplete");
    expect(result.best).toBeNull();
    expect(result.field.length).toBeGreaterThan(1);

    const html = await (await get("/onramp?step=11&q0=Observer&q4=Sensing")).text();
    expect(html).toContain(`one of about ${result.field.length} of the sixteen`);
  });

  it("the done step's Stripe CTA matches marketing.ts's single source of truth", async () => {
    const html = await (await get("/onramp?step=11")).text();
    expect(html).toContain(STRIPE_LINK);
  });

  it("the email step never pre-checks the marketing opt-in", async () => {
    const html = await (await get("/onramp?step=10")).text();
    expect(html).not.toMatch(/name="optin"[^>]*checked/);
  });

  it("the friction-reflection interstitial is personalized by the visitor's own answer", async () => {
    const html = await (await get("/onramp?step=7&friction=meetings")).text();
    expect(html).toContain("Group dynamics stay invisible");
  });

  it("the objection-handling interstitial precedes the email step, not after it", async () => {
    const html = await (await get("/onramp?step=9")).text();
    expect(html).toContain("Descriptions are horoscopes");
  });
});

describe("lead capture and analytics wiring at the done step", () => {
  function memoryKV() {
    const store = new Map<string, string>();
    return {
      store,
      async get(k: string) { return store.get(k) ?? null; },
      async put(k: string, v: string) { store.set(k, v); },
      async delete(k: string) { store.delete(k); },
      async list({ prefix = "" }: { prefix?: string } = {}) {
        const keys = [...store.keys()].filter((k) => k.startsWith(prefix)).sort();
        return { keys: keys.map((name) => ({ name })), list_complete: true };
      },
    };
  }

  const withLeadsAndAnalytics = () => {
    const LEADS = memoryKV();
    const points: { blobs?: string[]; doubles?: number[]; indexes?: string[] }[] = [];
    const env = {
      ...ENV,
      LEADS,
      ONRAMP_ANALYTICS: { writeDataPoint: (p: typeof points[number]) => points.push(p) },
    } as unknown as Env;
    return { LEADS, points, env };
  };

  it("captures a lead exactly once at the done step when an email is present", async () => {
    const { LEADS, env } = withLeadsAndAnalytics();
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 200 }));

    await worker.fetch(new Request("https://octant.example/onramp?step=11&email=jane@example.com&goal=self&optin=yes"), env);
    expect(LEADS.store.has("lead:jane@example.com")).toBe(true);

    // A reload of the done page must not send a second explainer / re-capture.
    let sends = 0;
    vi.stubGlobal("fetch", async () => { sends++; return new Response("{}", { status: 200 }); });
    await worker.fetch(new Request("https://octant.example/onramp?step=11&email=jane@example.com&goal=self&optin=yes"), env);
    expect(sends).toBe(0);

    vi.unstubAllGlobals();
  });

  it("captures nothing without an email at the done step", async () => {
    const { LEADS, env } = withLeadsAndAnalytics();
    await worker.fetch(new Request("https://octant.example/onramp?step=11"), env);
    expect(LEADS.store.size).toBe(0);
  });

  it("writes one analytics point per step render, keyed by step index", async () => {
    const { points, env } = withLeadsAndAnalytics();
    await worker.fetch(new Request("https://octant.example/onramp?step=3"), env);
    expect(points).toHaveLength(1);
    expect(points[0].indexes).toEqual(["3"]);
    expect(points[0].doubles).toEqual([3]);
  });

  it("a telemetry failure never breaks the rendered page", async () => {
    const env = {
      ...ENV,
      ONRAMP_ANALYTICS: { writeDataPoint: () => { throw new Error("boom"); } },
    } as unknown as Env;
    const res = await worker.fetch(new Request("https://octant.example/onramp?step=0"), env);
    expect(res.status).toBe(200);
  });
});
