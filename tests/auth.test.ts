import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import worker from "../src/worker/index";
import {
  parseCodes, isConfigured, handleAuth, requireAuth, readSession, type AuthEnv,
} from "../src/worker/auth";

/* ------------------------------------------------------------------ *
 * The access wall is the whole security boundary, so it is tested like
 * one: the questions below are "can an unauthenticated request get a
 * byte of the app", "can a forged or expired cookie get in", and "what
 * happens when it is misconfigured".
 * ------------------------------------------------------------------ */

const ENV: AuthEnv = {
  ACCESS_CODES: "nick:river-oak-8821, jane:slate-harbor-4417",
  AUTH_SECRET: "a-long-random-signing-key-for-tests",
};

const NOW = 1_800_000_000_000;

const get = (path = "/", cookie?: string) =>
  new Request(`https://example.com${path}`, cookie ? { headers: { cookie } } : undefined);

/* The brute-force brake is keyed by IP and lives for the whole module, so every
   test that can trip it gets its own address. Otherwise one test's failures
   throttle the next test's legitimate logins. */
const post = (path: string, body: unknown, cookie?: string, ip = "test-default") =>
  new Request(`https://example.com${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": ip,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });

/** Log in properly and return the cookie the browser would send back. */
async function signIn(code: string, env: AuthEnv = ENV, now = NOW): Promise<string> {
  const res = await handleAuth(post("/api/auth/login", { code }, undefined, "sign-in-helper"), env, now);
  const setCookie = res!.headers.get("set-cookie")!;
  return setCookie.split(";")[0];
}

describe("parsing ACCESS_CODES", () => {
  it("reads label:code pairs and bare codes, and tolerates whitespace", () => {
    expect(parseCodes("nick:abc, def ,  jane:ghi ")).toEqual([
      { label: "nick", code: "abc" },
      { label: "guest", code: "def" },
      { label: "jane", code: "ghi" },
    ]);
  });

  it("drops empty entries so a trailing comma is harmless", () => {
    expect(parseCodes("abc,,  ,")).toEqual([{ label: "guest", code: "abc" }]);
    expect(parseCodes("nick:")).toEqual([]);
  });

  it("treats an unset or empty value as no codes at all", () => {
    expect(parseCodes(undefined)).toEqual([]);
    expect(parseCodes("")).toEqual([]);
  });

  it("keeps colons inside a code", () => {
    expect(parseCodes("nick:a:b:c")).toEqual([{ label: "nick", code: "a:b:c" }]);
  });
});

describe("configuration", () => {
  it("needs both a secret and at least one code", () => {
    expect(isConfigured(ENV)).toBe(true);
    expect(isConfigured({ ACCESS_CODES: "abc" })).toBe(false);
    expect(isConfigured({ AUTH_SECRET: "s" })).toBe(false);
    expect(isConfigured({})).toBe(false);
  });

  /**
   * The single most important assertion here. A wall that fails open
   * publishes the site while its owner believes it is private.
   */
  it("FAILS CLOSED when unconfigured — it does not serve the app", async () => {
    for (const env of [{}, { ACCESS_CODES: "abc" }, { AUTH_SECRET: "s" }] as AuthEnv[]) {
      const res = (await requireAuth(get("/"), env, NOW))!;
      expect(res, "an unconfigured wall must still return a response").toBeTruthy();
      expect(res.status).toBe(503);
      expect(await res.text()).toContain("Not configured");
    }
  });

  it("refuses to mint a session when unconfigured", async () => {
    const res = (await handleAuth(post("/api/auth/login", { code: "abc" }), { ACCESS_CODES: "abc" }, NOW))!;
    expect(res.status).toBe(503);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("the gate", () => {
  it("blocks an anonymous page request with the access page, not app content", async () => {
    const res = (await requireAuth(get("/type/ENTP"), ENV, NOW))!;
    expect(res.status).toBe(401);
    const html = await res.text();
    expect(html).toContain("Access code");
    expect(html).not.toContain("<script type=\"module\"");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("blocks an anonymous API request with JSON, not HTML", async () => {
    const res = (await requireAuth(get("/api/chat"), ENV, NOW))!;
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    expect(await res.json()).toEqual({ error: "Not signed in." });
  });

  it("lets a signed-in request straight through", async () => {
    const cookie = await signIn("river-oak-8821");
    expect(await requireAuth(get("/", cookie), ENV, NOW)).toBeNull();
    expect(await requireAuth(get("/api/chat", cookie), ENV, NOW)).toBeNull();
  });
});

describe("logging in", () => {
  it("accepts a valid code and returns its label", async () => {
    const res = (await handleAuth(post("/api/auth/login", { code: "slate-harbor-4417" }), ENV, NOW))!;
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, label: "jane" });
  });

  it("sets an HttpOnly, SameSite, Secure cookie", async () => {
    const res = (await handleAuth(post("/api/auth/login", { code: "river-oak-8821" }), ENV, NOW))!;
    const c = res.headers.get("set-cookie")!;
    expect(c).toMatch(/^octant_session=/);
    expect(c).toContain("HttpOnly");
    expect(c).toContain("SameSite=Lax");
    expect(c).toContain("Secure");
    expect(c).toContain("Path=/");
  });

  it("rejects a wrong code without saying which part was wrong", async () => {
    const res = (await handleAuth(post("/api/auth/login", { code: "not-a-code" }), ENV, NOW))!;
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect((await res.json()).error).toBe("That code was not recognised.");
  });

  it("rejects a code that is a prefix of a real one", async () => {
    const res = (await handleAuth(post("/api/auth/login", { code: "river-oak" }), ENV, NOW))!;
    expect(res.status).toBe(401);
  });

  it("rejects an empty code and a non-POST", async () => {
    expect((await handleAuth(post("/api/auth/login", { code: "  " }), ENV, NOW))!.status).toBe(400);
    expect((await handleAuth(get("/api/auth/login"), ENV, NOW))!.status).toBe(405);
  });

  it("throttles repeated FAILURES from one address", async () => {
    const ip = "brute-forcer";
    let throttledAfter = -1;
    for (let i = 0; i < 15; i++) {
      const res = (await handleAuth(post("/api/auth/login", { code: `guess-${i}` }, undefined, ip), ENV, NOW))!;
      if (res.status === 429 && throttledAfter === -1) throttledAfter = i;
    }
    expect(throttledAfter).toBe(10);
  });

  /**
   * Successful logins must NOT count toward the brake. Counting them would lock
   * out somebody signing in on several devices in one sitting, and would do
   * nothing extra against an attacker, who only ever fails.
   */
  it("never throttles someone who keeps getting it right", async () => {
    const ip = "honest-user";
    for (let i = 0; i < 20; i++) {
      const res = (await handleAuth(post("/api/auth/login", { code: "river-oak-8821" }, undefined, ip), ENV, NOW))!;
      expect(res.status, `attempt ${i + 1}`).toBe(200);
    }
  });

  it("forgets failures once the window has passed", async () => {
    const ip = "reformed";
    for (let i = 0; i < 12; i++) {
      await handleAuth(post("/api/auth/login", { code: "wrong" }, undefined, ip), ENV, NOW);
    }
    expect((await handleAuth(post("/api/auth/login", { code: "river-oak-8821" }, undefined, ip), ENV, NOW))!.status)
      .toBe(429);
    const later = NOW + 11 * 60_000;
    expect((await handleAuth(post("/api/auth/login", { code: "river-oak-8821" }, undefined, ip), ENV, later))!.status)
      .toBe(200);
  });
});

describe("sessions", () => {
  it("round-trips a real cookie", async () => {
    const cookie = await signIn("river-oak-8821");
    expect(await readSession(get("/", cookie), ENV, NOW)).toMatchObject({ label: "nick" });
  });

  it("rejects a cookie signed with a different secret", async () => {
    const cookie = await signIn("river-oak-8821", { ...ENV, AUTH_SECRET: "some-other-key" });
    expect(await readSession(get("/", cookie), ENV, NOW)).toBeNull();
    expect(await requireAuth(get("/", cookie), ENV, NOW)).not.toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const cookie = await signIn("river-oak-8821");
    const [name, token] = cookie.split("=");
    const [payload, sig] = token.split(".");
    const forged = btoa(JSON.stringify({ l: "attacker", e: 9_999_999_999 }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(await readSession(get("/", `${name}=${forged}.${sig}`), ENV, NOW)).toBeNull();
    expect(await readSession(get("/", `${name}=${payload}.${sig}x`), ENV, NOW)).toBeNull();
  });

  it("rejects an expired session", async () => {
    const cookie = await signIn("river-oak-8821");
    const later = NOW + 31 * 86_400_000;
    expect(await readSession(get("/", cookie), ENV, NOW + 86_400_000)).not.toBeNull();
    expect(await readSession(get("/", cookie), ENV, later)).toBeNull();
  });

  it("rejects junk in the cookie without throwing", async () => {
    for (const junk of ["", "x", "a.b", "....", "%%%.%%%"]) {
      expect(await readSession(get("/", `octant_session=${junk}`), ENV, NOW)).toBeNull();
    }
  });

  /** Revocation is by editing ACCESS_CODES; rotation is by changing AUTH_SECRET. */
  it("cuts off a revoked code at the next login but honours the live session", async () => {
    const cookie = await signIn("slate-harbor-4417");
    const revoked: AuthEnv = { ...ENV, ACCESS_CODES: "nick:river-oak-8821" };
    expect(await readSession(get("/", cookie), revoked, NOW)).not.toBeNull();
    const res = (await handleAuth(post("/api/auth/login", { code: "slate-harbor-4417" }), revoked, NOW))!;
    expect(res.status).toBe(401);
  });

  it("signs everyone out when the secret is rotated", async () => {
    const cookie = await signIn("river-oak-8821");
    const rotated: AuthEnv = { ...ENV, AUTH_SECRET: "rotated-key" };
    expect(await readSession(get("/", cookie), rotated, NOW)).toBeNull();
  });
});

describe("auth routing", () => {
  it("ignores paths that are not auth routes", async () => {
    expect(await handleAuth(get("/"), ENV, NOW)).toBeNull();
    expect(await handleAuth(get("/api/chat"), ENV, NOW)).toBeNull();
  });

  it("reports who you are, and says so honestly when nobody", async () => {
    expect(await (await handleAuth(get("/api/auth/me"), ENV, NOW))!.json())
      .toMatchObject({ signedIn: false, label: null, kind: null, email: null, owner: false });
    const cookie = await signIn("river-oak-8821");
    expect(await (await handleAuth(get("/api/auth/me", cookie), ENV, NOW))!.json())
      .toMatchObject({ signedIn: true, label: "nick", kind: "code", email: null });
  });

  /** Google has its own handler; this one must not swallow those paths. */
  it("leaves the Google routes to google.ts", async () => {
    expect(await handleAuth(get("/api/auth/google/start"), ENV, NOW)).toBeNull();
    expect(await handleAuth(get("/api/auth/google/callback?code=x"), ENV, NOW)).toBeNull();
  });

  it("clears the cookie on logout", async () => {
    const res = (await handleAuth(post("/api/auth/logout", {}), ENV, NOW))!;
    expect(res.headers.get("set-cookie")).toMatch(/octant_session=;.*Max-Age=0/);
  });

  it("404s an unknown auth route rather than falling through", async () => {
    expect((await handleAuth(get("/api/auth/nope"), ENV, NOW))!.status).toBe(404);
  });
});

/* ------------------------------------------------------------------ *
 * ROUTING — the part that was actually broken in production.
 *
 * Everything above tests requireAuth() in isolation, and all of it
 * passed while the deployed site was completely public. The gate was
 * correct; it was never being CALLED for anything except /api/*.
 *
 * With Cloudflare Static Assets, a request matching an asset is served
 * by the Asset Worker without invoking the user Worker at all. Which
 * requests reach the user Worker is decided by ONE line of config —
 * `assets.run_worker_first` — and it was set to ["/api/*"]. So /,
 * /index.html and every JS chunk went straight from the asset store to
 * anyone who asked, while the app reported itself private.
 *
 * A unit test of a function cannot catch that. These two can.
 * ------------------------------------------------------------------ */

describe("the Worker is actually in front of the assets", () => {
  /**
   * PARSED, not pattern-matched. A regex over the file text would pass on a
   * `"run_worker_first": true` appearing anywhere — including under some other
   * key, or in a comment — while `assets.run_worker_first` was still a route
   * list and the wall still bypassable. For the one assertion the whole
   * security property rests on, that is not good enough.
   */
  const config: {
    main?: string;
    assets?: { binding?: string; not_found_handling?: string; run_worker_first?: unknown };
  } = (() => {
    const raw = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
    const json = raw
      .replace(/\/\*[\s\S]*?\*\//g, "")   // block comments
      .replace(/^\s*\/\/.*$/gm, "")        // whole-line // comments
      .replace(/,(\s*[}\]])/g, "$1");      // trailing commas JSONC allows
    return JSON.parse(json);
  })();

  it("routes EVERY request through the Worker, not just /api/*", () => {
    expect(
      config.assets?.run_worker_first,
      "assets.run_worker_first must be exactly true — a route list, false or an " +
        "omission leaves every path outside that list served straight from the " +
        "asset store, with the access wall never invoked",
    ).toBe(true);
  });

  it("still keeps the SPA fallback and the assets binding", () => {
    expect(config.assets?.not_found_handling).toBe("single-page-application");
    expect(config.assets?.binding).toBe("ASSETS");
    expect(config.main).toBe("src/worker/index.ts");
  });
});

describe("the Worker entry point", () => {
  const SHELL = "<!doctype html><script type=\"module\" src=\"/assets/app.js\">";
  const PRESENT = ["/index.html", "/assets/app.js"];

  /**
   * A stub asset binding that records every path it was asked for.
   *
   * It models Cloudflare's documented behaviour for the two cases this Worker
   * depends on: a path that exists is returned, and a path that does not falls
   * back to the shell, which is what `not_found_handling: single-page-application`
   * does. Returning 200 for literally everything would have let this suite pass
   * while a deep link 404'd in production.
   *
   * What it CANNOT prove is that Cloudflare actually behaves this way — a test
   * against a mock only tests the mock. That half is verified against the real
   * runtime with `wrangler dev`; DEPLOY.md step 2 has the commands, and they are
   * what caught the routing bug this file exists because of.
   */
  const stubAssets = () => {
    const calls: string[] = [];
    return {
      calls,
      binding: {
        fetch: async (req: Request) => {
          const path = new URL(req.url).pathname;
          calls.push(path);
          const hit = path === "/" || PRESENT.includes(path);
          return new Response(SHELL, {
            status: 200,
            headers: { "content-type": "text/html", "x-stub-asset": hit ? "hit" : "spa-fallback" },
          });
        },
      },
    };
  };

  it("never reaches the assets for an anonymous request", async () => {
    const { calls, binding } = stubAssets();
    for (const path of ["/", "/index.html", "/assets/app.js", "/type/ENTP"]) {
      const res = await worker.fetch(get(path), { ...ENV, ASSETS: binding } as never);
      expect(res.status, path).toBe(401);
      expect(await res.text(), path).not.toContain("<script type=\"module\"");
    }
    expect(calls, "the asset binding must not be touched by an anonymous request").toEqual([]);
  });

  it("serves a real asset once signed in", async () => {
    const { calls, binding } = stubAssets();
    const cookie = await signIn("river-oak-8821");
    const res = await worker.fetch(get("/assets/app.js", cookie), { ...ENV, ASSETS: binding } as never);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-stub-asset")).toBe("hit");
    expect(calls).toEqual(["/assets/app.js"]);
  });

  /**
   * Deep links are the case a naive gate breaks: /type/ENTP is not a file, so it
   * only works if the Worker forwards the ORIGINAL request and lets the asset
   * layer apply its SPA fallback. Rewriting the path here would silently send
   * every deep link to the wrong place.
   */
  it("forwards a deep link unchanged so the SPA fallback can apply", async () => {
    const { calls, binding } = stubAssets();
    const cookie = await signIn("river-oak-8821");
    const res = await worker.fetch(get("/pair/ENTP/INFJ", cookie), { ...ENV, ASSETS: binding } as never);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-stub-asset")).toBe("spa-fallback");
    expect(calls, "the path must reach the asset layer as-is").toEqual(["/pair/ENTP/INFJ"]);
  });

  it("keeps the auth routes reachable without a session", async () => {
    const { calls, binding } = stubAssets();
    const res = await worker.fetch(
      post("/api/auth/login", { code: "river-oak-8821" }, undefined, "entry-point-test"),
      { ...ENV, ASSETS: binding } as never,
    );
    expect(res.status).toBe(200);
    expect(calls).toEqual([]);
  });
});
