import { describe, expect, it } from "vitest";
import worker, { type Env } from "../src/worker/index";
import { issueSession } from "../src/worker/auth";
import { marketingPage } from "../src/worker/marketing";

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
    expect(html).toContain("See how minds mesh");
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

  it("softens ONLY the front page — every other anonymous path still hits the wall", async () => {
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
});
