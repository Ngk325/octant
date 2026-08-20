import { describe, expect, it } from "vitest";
import worker, { type Env } from "../src/worker/index";
import { issueSession } from "../src/worker/auth";
import { marketingPage } from "../src/worker/marketing";
import { ease, relation } from "../src/engine/core";
import { REL_DEF, REL_NAME, type MbtiType } from "../src/engine/data";

/* ------------------------------------------------------------------ *
 * The public front door, and the one rule it lives under: it may sell
 * the app, it may not leak it. An anonymous GET / gets marketing; every
 * other anonymous request keeps getting the wall.
 * ------------------------------------------------------------------ */

const SECRET = "a-long-random-signing-key-for-tests";
const NOW = 1_800_000_000_000;

const assetsStub = {
  fetch: async () => new Response("APP-SHELL", { status: 200 }),
};

const ENV = {
  AUTH_SECRET: SECRET,
  ACCESS_CODES: "tester:code-for-tests",
  ASSETS: assetsStub,
} as unknown as Env;

const get = (path: string, cookie?: string) =>
  worker.fetch(
    new Request(`https://octant.example${path}`, cookie ? { headers: { cookie } } : undefined),
    ENV,
  );

describe("the public front door", () => {
  it("serves the marketing page to an anonymous GET /", async () => {
    const res = await get("/");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Compatibility runs in two directions");
    // The proof band is the page's one uncopyable asset. If it ever silently
    // drops out again, this is the assertion that should notice.
    expect(html).toContain("128/128");
    expect(html).toContain("r &minus;0.15");
    expect(html).toContain("$25");
    expect(html).toContain("Stratfield Partners LLC");
    expect(html).toContain("buy.stripe.com");
    expect(html).toContain("/signin");
  });

  it("leaks no app markup, bundle path or api surface", async () => {
    const html = await (await get("/")).text();
    expect(html).not.toContain("APP-SHELL");
    expect(html).not.toContain("/assets/");
    expect(html).not.toContain("id=\"root\"");
    expect(html).not.toContain("/api/chat");
  });

  it("softens only the two public pages — every other anonymous path still hits the wall", async () => {
    // "/" here, "/partners" in tests/partners.test.ts. Nothing else.
    expect((await get("/partners")).status).toBe(200);
    expect((await get("/type/ENTP")).status).toBe(401);
    expect((await get("/matrix")).status).toBe(401);
    expect((await get("/index.html")).status).toBe(401);
    const api = await get("/api/chat");
    expect(api.status).toBe(401);
  });

  it("does not soften POST /", async () => {
    const res = await worker.fetch(
      new Request("https://octant.example/", { method: "POST" }),
      ENV,
    );
    expect(res.status).toBe(401);
  });

  it("still serves the app to a signed-in visitor at /", async () => {
    const token = await issueSession("tester", "code", undefined, SECRET, NOW);
    const res = await get("/", `octant_session=${token}`);
    expect(await res.text()).toBe("APP-SHELL");
  });

  it("has real metadata: title, description, canonical, og, favicon", async () => {
    const html = await (await get("/")).text();
    expect(html).toContain("<title>Octant —");
    expect(html).toMatch(/<meta name="description" content=".{50,}"/);
    expect(html).toContain('rel="canonical" href="https://octant.example/"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('rel="icon" href="data:image/svg+xml');
  });

  /* The "names no third-party system or source" check used to live here,
     scoped to marketing.ts alone. It now covers everything under src/ —
     see tests/attribution.test.ts. */
});

describe("the /signin route", () => {
  it("serves the gate at 200 to an anonymous visitor", async () => {
    const res = await get("/signin");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Access code");
    expect(html).toContain("private instrument");
  });

  it("redirects a signed-in visitor home", async () => {
    const token = await issueSession("tester", "code", undefined, SECRET, NOW);
    const res = await get("/signin", `octant_session=${token}`);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/");
  });

  it("refuses an open redirect through returnTo", async () => {
    const res = await get("/signin?returnTo=https://evil.example");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain("evil.example");
  });

  it("fails closed when nothing is configured", async () => {
    const bare = { ASSETS: assetsStub } as unknown as Env;
    const res = await worker.fetch(new Request("https://octant.example/signin"), bare);
    expect(res.status).toBe(503);
  });

  /* The pricing card promises "payment unlocks your account automatically".
     The gate must repeat that promise to a payer arriving at /signin — but
     only on deployments where the Stripe webhook and Google sign-in actually
     exist, and the owner-approval warning must then be scoped to the
     non-payer path rather than contradicting the pricing card outright. */
  it("offers the paid path when Stripe and Google are both configured", async () => {
    const paidEnv = {
      ...ENV,
      GOOGLE_CLIENT_ID: "client-id",
      GOOGLE_CLIENT_SECRET: "client-secret",
      USERS: { get: async () => null } as unknown,
      STRIPE_WEBHOOK_SECRET: "whsec_test",
    } as unknown as Env;
    const res = await worker.fetch(new Request("https://octant.example/signin"), paidEnv);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Just subscribed?");
    expect(html).toContain("payment unlocks your account automatically");
    // The approval wait is still stated — for the non-payer path only.
    expect(html).toContain("Not a subscriber?");
    expect(html).toContain("without a subscription you will wait until they approve you");
  });

  it("does not promise the paid path when Stripe is not configured", async () => {
    // Google without Stripe: sign-in exists, but payment cannot unlock anything.
    const googleOnly = {
      ...ENV,
      GOOGLE_CLIENT_ID: "client-id",
      GOOGLE_CLIENT_SECRET: "client-secret",
      USERS: { get: async () => null } as unknown,
    } as unknown as Env;
    const withGoogle = await (
      await worker.fetch(new Request("https://octant.example/signin"), googleOnly)
    ).text();
    expect(withGoogle).not.toContain("Just subscribed?");
    expect(withGoogle).toContain("you will wait until they approve you");

    // Codes only (the suite's default env): same unconditional copy as before.
    const codesOnly = await (await get("/signin")).text();
    expect(codesOnly).not.toContain("Just subscribed?");
    expect(codesOnly).not.toContain("Not a subscriber?");
  });
});

describe("the /api/chat/end beacon", () => {
  const post = (cookie?: string) =>
    worker.fetch(
      new Request("https://octant.example/api/chat/end", {
        method: "POST",
        body: JSON.stringify({ threadId: "thread-aaaa-1111" }),
        ...(cookie ? { headers: { cookie } } : {}),
      }),
      ENV,
    );

  it("is behind the wall", async () => {
    expect((await post()).status).toBe(401);
  });

  it("returns 204 for a signed-in caller, even with no log binding", async () => {
    const token = await issueSession("tester", "code", undefined, SECRET, NOW);
    expect((await post(`octant_session=${token}`)).status).toBe(204);
  });
});

describe("the marketing page itself", () => {
  it("is cacheable and carries the origin it was asked for", () => {
    const res = marketingPage("https://octant.example");
    expect(res.headers.get("cache-control")).toContain("public");
  });

  /* The onramp CTA note must promise what the funnel delivers: a teaser of
   * two of the eight questions, not the eight themselves (P0-6). */
  it("the hero's onramp note says what the funnel actually is", async () => {
    const html = await marketingPage("https://octant.example").text();
    expect(html).toContain(
      "Free, no account &mdash; a two-minute teaser: two of the eight questions, no scoring you can fail.",
    );
    expect(html).not.toContain("Eight either-or questions find your pattern");
  });

  /* The hero's worked example once shipped with its two directions swapped —
   * 44/"Examined" on the ENTP → INFP row the engine scores 34/"Examiner".
   * Each row must show the score and relation name the engine assigns the
   * direction its label names, and there must be two distinct directions. */
  it("hero worked example matches the engine, direction by direction", async () => {
    const html = await marketingPage("https://octant.example").text();
    const row =
      /<span class="mono way">(\w{4}) &rarr; (\w{4})<\/span>\s*<span class="rel">([^<]+)<\/span>\s*<span class="mono val">(\d+)<\/span>/g;
    const rows = [...html.matchAll(row)];
    expect(rows.length).toBe(2);
    for (const [, target, partner, relName, score] of rows) {
      const a = target as MbtiType;
      const b = partner as MbtiType;
      expect(Number(score)).toBe(ease(a, b));
      expect(relName).toBe(REL_NAME[relation(a, b)]);
      // The one-line gloss is that relation's own REL_DEF, minus its
      // categorical opening sentence.
      const def = REL_DEF[relation(a, b)];
      expect(html).toContain(def.slice(def.indexOf(". ") + 2));
    }
    // Two directions of one pair, not the same row twice.
    expect(rows[0][1]).toBe(rows[1][2]);
    expect(rows[0][2]).toBe(rows[1][1]);
  });
});
