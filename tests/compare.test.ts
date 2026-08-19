import { describe, expect, it } from "vitest";
import worker, { type Env } from "../src/worker/index";
import { COMPARE_SLUGS, comparisonPage } from "../src/worker/compare";

/* ------------------------------------------------------------------ *
 * The comparison layer: the ONE place the public site names a
 * third-party system, and the rule it lives under -- each page says
 * where the other system is stronger, and the Big Five page concedes
 * psychometric validity outright. A comparison page that only flattered
 * Octant would undo the honesty posture the rest of the site runs on.
 * ------------------------------------------------------------------ */

const ENV = {
  AUTH_SECRET: "a-long-random-signing-key-for-tests",
  ACCESS_CODES: "tester:code-for-tests",
  ASSETS: { fetch: async () => new Response("APP-SHELL", { status: 200 }) },
} as unknown as Env;

const get = (path: string, init?: RequestInit) =>
  worker.fetch(new Request(`https://octant.example${path}`, init), ENV);

describe("the comparison layer", () => {
  it("serves the index anonymously", async () => {
    const res = await get("/compare");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("How Octant differs");
    for (const slug of COMPARE_SLUGS) expect(html).toContain(`/compare/${slug}`);
  });

  it("serves every known slug anonymously", async () => {
    for (const slug of COMPARE_SLUGS) {
      const res = await get(`/compare/${slug}`);
      expect(res.status, slug).toBe(200);
      expect(await res.text()).toContain("Where");
    }
  });

  it("names the system it compares against", async () => {
    expect(await (await get("/compare/mbti")).text()).toContain("MBTI");
    expect(await (await get("/compare/socionics")).text()).toContain("Socionics");
    expect(await (await get("/compare/big-five")).text()).toContain("Big Five");
  });

  it("says where the other system is stronger, on every page", async () => {
    for (const slug of COMPARE_SLUGS) {
      const html = await (await get(`/compare/${slug}`)).text();
      expect(html, slug).toMatch(/Where .* is stronger/);
    }
  });

  it("concedes psychometric validity rather than blurring it", async () => {
    const html = await (await get("/compare/big-five")).text();
    expect(html).toContain("not a validated psychometric");
    expect(html).toMatch(/hiring and selection/i);
  });

  it("leaks no app markup", async () => {
    for (const path of ["/compare", "/compare/mbti"]) {
      const html = await (await get(path)).text();
      expect(html).not.toContain("APP-SHELL");
      expect(html).not.toContain("/assets/");
      expect(html).not.toContain('id="root"');
    }
  });

  it("keeps the wall for unknown slugs, deeper paths and non-GET", async () => {
    // Matched against a known list, never by prefix.
    expect((await get("/compare/enneagram")).status).toBe(401);
    expect((await get("/compare/mbti/extra")).status).toBe(401);
    expect((await get("/compare/")).status).toBe(401);
    expect((await get("/comparex")).status).toBe(401);
    expect((await get("/compare", { method: "POST" })).status).toBe(401);
    expect((await get("/compare/mbti", { method: "POST" })).status).toBe(401);
  });

  it("returns null for an unknown slug at the module boundary", () => {
    expect(comparisonPage("https://octant.example", "nope")).toBeNull();
  });

  it("is reachable from the site nav", async () => {
    const home = await (await get("/")).text();
    expect(home).toContain('href="/compare"');
  });
});
