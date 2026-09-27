import { afterEach, describe, expect, it, vi } from "vitest";
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

  it("the email step is titled by what it sends — the explainer, not a reading it doesn't deliver", async () => {
    const html = await (await get("/onramp?step=10")).text();
    expect(html).toContain("Get your two-minute explainer.");
    expect(html).not.toContain("See your directional reading");
  });

  it("guards the narrowing headline at both boundaries — no coins and invalid coins", async () => {
    // No coins answered: field is all 16, so "one of about 16 of the
    // sixteen" would negate itself. Invalid values: field is 0, so
    // "0 of the sixteen" is nonsense. Both render the honest fallback.
    for (const qs of ["", "&q0=garbage&q4=nonsense"]) {
      for (const step of [8, 11]) {
        const html = await (await get(`/onramp?step=${step}${qs}`)).text();
        expect(html).not.toContain("about 16 of the sixteen");
        expect(html).not.toContain("0 of the sixteen");
        expect(html).toContain("one of the sixteen");
      }
    }
    // A genuine partial answer still shows its genuinely narrowed count.
    const narrowed = await (await get("/onramp?step=11&q0=Observer&q4=Sensing")).text();
    expect(narrowed).toMatch(/one of about \d+ of the sixteen/);
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

  it("re-checks every previously-picked friction box, not just the first, on re-render", async () => {
    // Repeated params — the real wire format a GET <form> with two checked
    // same-name checkboxes actually submits.
    const html = await (await get("/onramp?step=6&friction=recurring&friction=meetings")).text();
    const checkedValues = [...html.matchAll(/name="friction" value="(\w+)" checked/g)].map((m) => m[1]);
    expect(checkedValues.sort()).toEqual(["meetings", "recurring"]);
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
      // Without a real key, sendMail() short-circuits before ever calling
      // fetch — which would let the idempotency assertion below pass no
      // matter what captureLead actually does. A key (even a fake one,
      // since fetch itself is stubbed) is required to make the "no second
      // send" claim mean anything.
      RESEND_API_KEY: "re_test",
      NOTIFY_FROM: "Octant <octant@verified.example>",
      LEADS,
      ONRAMP_ANALYTICS: { writeDataPoint: (p: typeof points[number]) => points.push(p) },
    } as unknown as Env;
    return { LEADS, points, env };
  };

  /** Mint a real start token the way a visitor would — by loading step 0. */
  async function startToken(env: Env): Promise<string> {
    const html = await (await worker.fetch(new Request("https://octant.example/onramp?step=0"), env)).text();
    const m = html.match(/name="_s" value="([^"]+)"/);
    if (!m) throw new Error("step 0 did not render a start token");
    return m[1];
  }

  const NOW = 1_800_000_000_000;
  const MIN_COMPLETION_MS = 2_000;

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("captures a lead exactly once at the done step when an email is present", async () => {
    const { LEADS, env } = withLeadsAndAnalytics();
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 200 }));
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const s = await startToken(env);
    vi.setSystemTime(NOW + MIN_COMPLETION_MS + 1000);

    await worker.fetch(
      new Request(`https://octant.example/onramp?step=11&email=jane@example.com&goal=self&optin=yes&_s=${encodeURIComponent(s)}`), env,
    );
    expect(LEADS.store.has("lead:jane@example.com")).toBe(true);

    // A reload of the done page must not send a second explainer / re-capture.
    let sends = 0;
    vi.stubGlobal("fetch", async () => { sends++; return new Response("{}", { status: 200 }); });
    await worker.fetch(
      new Request(`https://octant.example/onramp?step=11&email=jane@example.com&goal=self&optin=yes&_s=${encodeURIComponent(s)}`), env,
    );
    expect(sends).toBe(0);
  });

  it("captures nothing without an email at the done step", async () => {
    const { LEADS, env } = withLeadsAndAnalytics();
    await worker.fetch(new Request("https://octant.example/onramp?step=11"), env);
    expect(LEADS.store.size).toBe(0);
  });

  it("rejects a malformed email server-side — the endpoint cannot be used to mail arbitrary strings", async () => {
    const { LEADS, env } = withLeadsAndAnalytics();
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 200 }));
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const s = await startToken(env);
    vi.setSystemTime(NOW + MIN_COMPLETION_MS + 1000);
    // A valid start token is included so rejection is isolated to EMAIL_RE,
    // not the (separately tested) missing-token case.
    for (const bad of ["not-an-email", "no-at-sign.com", "@no-local-part.com", "trailing@dot."]) {
      const res = await worker.fetch(
        new Request(`https://octant.example/onramp?step=11&email=${encodeURIComponent(bad)}&_s=${encodeURIComponent(s)}`), env,
      );
      expect(res.status).toBe(200); // still renders the page, just doesn't capture/send
    }
    expect(LEADS.store.size).toBe(0);
  });

  it("never captures a lead from a bare step=11 request that skipped step 0 entirely", async () => {
    // The exact abuse this guards against: a single unauthenticated GET
    // with no prior render, previously enough to make the Worker mail an
    // Octant-branded message to any address a caller supplied.
    const { LEADS, env } = withLeadsAndAnalytics();
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 200 }));
    await worker.fetch(new Request("https://octant.example/onramp?step=11&email=jane@example.com"), env);
    expect(LEADS.store.size).toBe(0);
  });

  it("never captures a lead replaying a forged or another env's start token", async () => {
    const { LEADS, env } = withLeadsAndAnalytics();
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 200 }));
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    await worker.fetch(
      new Request("https://octant.example/onramp?step=11&email=jane@example.com&_s=garbage.notasignature"),
      env,
    );
    expect(LEADS.store.size).toBe(0);

    // A well-formed token signed with a DIFFERENT secret — the case that
    // actually exercises signature verification, not just format parsing.
    const otherEnv = { ...env, AUTH_SECRET: "a-different-secret" } as unknown as Env;
    const s = await startToken(otherEnv);
    vi.setSystemTime(NOW + MIN_COMPLETION_MS + 1000);
    await worker.fetch(
      new Request(`https://octant.example/onramp?step=11&email=jane@example.com&_s=${encodeURIComponent(s)}`), env,
    );
    expect(LEADS.store.size).toBe(0);
  });

  it("never captures a lead that replays a start token faster than a person could finish the funnel", async () => {
    const { LEADS, env } = withLeadsAndAnalytics();
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 200 }));
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const s = await startToken(env);
    vi.setSystemTime(NOW + MIN_COMPLETION_MS - 1); // one ms short of the floor

    await worker.fetch(
      new Request(`https://octant.example/onramp?step=11&email=jane@example.com&_s=${encodeURIComponent(s)}`), env,
    );
    expect(LEADS.store.size).toBe(0);
  });

  it("refuses the same start token replayed with a second address — 4xx and no send", async () => {
    // The replay this closes: one honestly-earned token, then a loop of
    // step=11 requests with different email= values — previously unlimited
    // Octant-branded emails to arbitrary addresses on one token.
    const { LEADS, env } = withLeadsAndAnalytics();
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 200 }));
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const s = await startToken(env);
    vi.setSystemTime(NOW + MIN_COMPLETION_MS + 1000);

    const first = await worker.fetch(
      new Request(`https://octant.example/onramp?step=11&email=jane@example.com&_s=${encodeURIComponent(s)}`), env,
    );
    expect(first.status).toBe(200);
    expect(LEADS.store.has("lead:jane@example.com")).toBe(true);

    let sends = 0;
    vi.stubGlobal("fetch", async () => { sends++; return new Response("{}", { status: 200 }); });
    const replay = await worker.fetch(
      new Request(`https://octant.example/onramp?step=11&email=mallory@example.com&_s=${encodeURIComponent(s)}`), env,
    );
    expect(replay.status).toBe(403);
    expect(LEADS.store.has("lead:mallory@example.com")).toBe(false);
    expect(sends).toBe(0);
  });

  it("rate-limits capture attempts per connecting IP when the binding exists", async () => {
    const { LEADS, env: base } = withLeadsAndAnalytics();
    let allowed = true;
    const keys: string[] = [];
    const env = {
      ...base,
      ONRAMP_LIMITER: { limit: async ({ key }: { key: string }) => { keys.push(key); return { success: allowed }; } },
    } as unknown as Env;
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 200 }));
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const s = await startToken(env);
    vi.setSystemTime(NOW + MIN_COMPLETION_MS + 1000);

    // Browsing the funnel never consumes the limiter — only capture does.
    await worker.fetch(new Request("https://octant.example/onramp?step=4"), env);
    expect(keys).toHaveLength(0);

    allowed = false;
    let sends = 0;
    vi.stubGlobal("fetch", async () => { sends++; return new Response("{}", { status: 200 }); });
    const limited = await worker.fetch(
      new Request(`https://octant.example/onramp?step=11&email=jane@example.com&_s=${encodeURIComponent(s)}`, {
        headers: { "cf-connecting-ip": "203.0.113.9" },
      }),
      env,
    );
    expect(limited.status).toBe(429);
    expect(keys).toEqual(["203.0.113.9"]);
    expect(LEADS.store.size).toBe(0);
    expect(sends).toBe(0);

    // With headroom the same walk completes normally.
    allowed = true;
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 200 }));
    const ok = await worker.fetch(
      new Request(`https://octant.example/onramp?step=11&email=jane@example.com&_s=${encodeURIComponent(s)}`, {
        headers: { "cf-connecting-ip": "203.0.113.9" },
      }),
      env,
    );
    expect(ok.status).toBe(200);
    expect(LEADS.store.has("lead:jane@example.com")).toBe(true);
  });

  it("preserves every friction pick, not just the first, through capture", async () => {
    const { LEADS, env } = withLeadsAndAnalytics();
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 200 }));
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const s = await startToken(env);
    vi.setSystemTime(NOW + MIN_COMPLETION_MS + 1000);

    // A real GET <form> submits repeated same-name checkboxes as repeated
    // params — this is the actual wire format, not a comma-joined value.
    await worker.fetch(
      new Request(
        `https://octant.example/onramp?step=11&email=jane@example.com&friction=recurring&friction=meetings&_s=${encodeURIComponent(s)}`,
      ),
      env,
    );
    const lead = JSON.parse(LEADS.store.get("lead:jane@example.com")!);
    expect(lead.friction).toEqual(["recurring", "meetings"]);
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
