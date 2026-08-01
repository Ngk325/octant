import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import worker, { type Env } from "../src/worker/index";
import { GATE_SCRIPT } from "../src/worker/auth";
import { THEME_SCRIPT_HASH, withSecurityHeaders } from "../src/worker/headers";

/* ------------------------------------------------------------------ *
 * The header layer at the Worker's exit.
 *
 * Two kinds of assertion here. The behavioural ones call the real router
 * and read what actually goes out. The hash pin is different in kind: the
 * CSP's theme-script hash is a constant, and this file recomputes it from
 * index.html — so editing that inline script without updating the constant
 * fails the suite instead of silently serving a CSP that blocks the page.
 * ------------------------------------------------------------------ */

const sha256b64 = async (s: string) => {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Buffer.from(h).toString("base64");
};

const ENV = {
  AUTH_SECRET: "headers-test-secret",
  ACCESS_CODES: "tester:some-code",
  ASSETS: { fetch: async () => new Response("APP-SHELL") },
} as unknown as Env;

describe("the hash pins", () => {
  it("theme-script constant matches what index.html actually ships", async () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const m = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(m, "index.html must carry exactly its inline theme script").toBeTruthy();
    expect(await sha256b64(m![1])).toBe(THEME_SCRIPT_HASH);
  });

  it("index.html carries no second inline script for the hash to miss", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const inline = html.match(/<script>[\s\S]*?<\/script>/g) ?? [];
    expect(inline).toHaveLength(1);
  });

  it("the gate script's hash is in the CSP", async () => {
    const res = await worker.fetch(new Request("https://octant.test/type/ENTP"), ENV);
    const policy = res.headers.get("content-security-policy") ?? "";
    expect(policy).toContain(`'sha256-${await sha256b64(GATE_SCRIPT)}'`);
    expect(policy).toContain(`'sha256-${THEME_SCRIPT_HASH}'`);
  });
});

describe("what every response carries", () => {
  it("documents get the full layer", async () => {
    const res = await worker.fetch(new Request("https://octant.test/type/ENTP"), ENV);
    expect(res.status).toBe(401);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
    expect(res.headers.get("permissions-policy")).toContain("camera=()");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    const policy = res.headers.get("content-security-policy") ?? "";
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    // The owner kept Google Fonts (2026-08), so the CSP must let them load.
    expect(policy).toContain("https://fonts.googleapis.com");
    expect(policy).toContain("https://fonts.gstatic.com");
  });

  it("API JSON gets the layer but not the document-only parts", async () => {
    const res = await worker.fetch(
      new Request("https://octant.test/api/chat", { method: "POST" }), ENV,
    );
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("content-security-policy")).toBeNull();
    expect(res.headers.get("x-frame-options")).toBeNull();
  });

  it("HSTS appears on https and not on plain-http localhost", async () => {
    const https = await worker.fetch(new Request("https://octant.test/signin"), ENV);
    expect(https.headers.get("strict-transport-security")).toBe("max-age=31536000");
    const http = await worker.fetch(new Request("http://localhost:5173/signin"), ENV);
    expect(http.headers.get("strict-transport-security")).toBeNull();
  });

  it("passes body and status through untouched, including past the wall", async () => {
    const login = await worker.fetch(
      new Request("https://octant.test/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: "some-code" }),
      }),
      ENV,
    );
    expect(login.status).toBe(200);
    const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0];
    const app = await worker.fetch(
      new Request("https://octant.test/pair/ENTP/ENFJ", { headers: { cookie } }), ENV,
    );
    expect(app.status).toBe(200);
    expect(await app.text()).toBe("APP-SHELL");
    expect(app.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("does not disturb an existing cache-control", async () => {
    const wrapped = await withSecurityHeaders(
      new URL("https://octant.test/x"),
      new Response("ok", { headers: { "cache-control": "no-store", "content-type": "text/html" } }),
    );
    expect(wrapped.headers.get("cache-control")).toBe("no-store");
  });
});
