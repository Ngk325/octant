import { describe, expect, it } from "vitest";
import worker, { type Env } from "../src/worker/index";
import { partnersPage } from "../src/worker/partners";

/* ------------------------------------------------------------------ *
 * The partner door. Same rule as the front door: it may sell the app,
 * it may not leak it. And one rule of its own — it may describe the
 * SHAPE of a partnership, but the rate card stays in the private terms
 * sheet, because a published wholesale number is a floor every future
 * negotiation starts from.
 * ------------------------------------------------------------------ */

const SECRET = "a-long-random-signing-key-for-tests";

const assetsStub = { fetch: async () => new Response("APP-SHELL", { status: 200 }) };

const ENV = {
  AUTH_SECRET: SECRET,
  ACCESS_CODES: "tester:code-for-tests",
  ASSETS: assetsStub,
} as unknown as Env;

const get = (path: string, init?: RequestInit) =>
  worker.fetch(new Request(`https://octant.example${path}`, init), ENV);

describe("the partner door", () => {
  it("serves the partners page to an anonymous GET /partners", async () => {
    const res = await get("/partners");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain("Octant, inside your offering");
    expect(html).toContain("Stratfield Partners LLC");
  });

  it("leaks no app markup, bundle path or api surface", async () => {
    const html = await (await get("/partners")).text();
    expect(html).not.toContain("APP-SHELL");
    expect(html).not.toContain("/assets/");
    expect(html).not.toContain('id="root"');
    expect(html).not.toContain("/api/chat");
  });

  it("carries all four shapes and the three axes that separate them", async () => {
    const html = await (await get("/partners")).text();
    for (const shape of ["Referral", "Bundled seats", "Embedded", "White-label"]) {
      expect(html).toContain(shape);
    }
    // The axes are the load-bearing idea: without all three the table is noise.
    expect(html).toContain("Brand seen");
    expect(html).toContain("Who invoices");
    expect(html).toContain("Engineering");
  });

  it("publishes the standalone price but NOT the partner rate card", async () => {
    const html = await (await get("/partners")).text();
    expect(html).toContain("$25");

    // Assert against the VISIBLE copy, not the raw document: the enquiry
    // mailto is percent-encoded, and a "%20" followed by any other escape
    // spells "20%" in the source while saying nothing to a reader.
    const visible = html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");
    expect(visible).toContain("$25");

    // Every partner-specific number from docs/PARTNERSHIP-TERMS.md. If one of
    // these ever reaches the page, a negotiating position has gone public.
    for (const rate of ["$18", "$15", "$12", "$10", "25%", "20%", "$750", "$36,000", "$3,000"]) {
      expect(visible).not.toContain(rate);
    }
  });

  it("states the constraint that any integration has to surface", async () => {
    const html = await (await get("/partners")).text();
    expect(html).toContain("not a measurement");
    expect(html).toMatch(/hiring, selection or termination/);
  });

  it("is reachable from the front page and links back to it", async () => {
    const home = await (await get("/")).text();
    expect(home).toContain('href="/partners"');
    const html = await (await get("/partners")).text();
    expect(html).toContain('href="/#pricing"');
  });

  it("does not soften POST /partners", async () => {
    expect((await get("/partners", { method: "POST" })).status).toBe(401);
  });

  it("does not soften a path that merely starts with /partners", async () => {
    expect((await get("/partners/rates")).status).toBe(401);
    expect((await get("/partnersx")).status).toBe(401);
  });

  it("renders standalone, without going through the router", async () => {
    const res = await partnersPage("https://octant.example");
    expect(res.status).toBe(200);
    // Not shared-cacheable, unlike the front door: the page mints a
    // per-render enquiry token and can carry a personal confirmation.
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
