import { describe, expect, it } from "vitest";
import { handleRead } from "../src/worker/read";
import { playbook } from "../src/engine/playbook";
import { REL, ease } from "../src/engine/core";
import { TYPES, REL_NAME } from "../src/engine/data";

/* ------------------------------------------------------------------ *
 * The public readings. Two things matter most and both are asserted:
 *   1. Every one of the 136 URLs resolves and carries real SEO markup.
 *   2. The pages are a SLICE — not one sentence of the composed per-pair
 *      playbook (the instrument) appears; the page derives its own plain
 *      reading from the ease scores instead. That is the line that keeps
 *      the paid content paid, so it is a test, not a promise.
 * handleRead is a pure function of (url, origin); no runtime needed here.
 * The public-access-without-auth half is proved end-to-end in
 * tests/workers/wall.test.ts.
 * ------------------------------------------------------------------ */

const ORIGIN = "https://octant.test";
const call = (path: string) => handleRead(new URL(ORIGIN + path), ORIGIN);
const text = async (path: string) => {
  const res = call(path);
  if (!res) throw new Error(`no response for ${path}`);
  return { res, html: await res.text() };
};

describe("routing and coverage", () => {
  it("returns null for anything it does not own, so the wall still runs", () => {
    expect(call("/type/ENTP")).toBeNull();
    expect(call("/pair/ENTP/INFJ")).toBeNull();
    expect(call("/api/chat")).toBeNull();
    expect(call("/")).toBeNull();
  });

  it("serves the index, every type, and every pair", async () => {
    expect((await text("/read")).res.status).toBe(200);
    for (const t of TYPES) {
      const { res } = await text(`/read/${t.toLowerCase()}`);
      expect(res.status, t).toBe(200);
    }
    // A spot of pairs across the alphabet.
    for (const slug of ["entp-and-infj", "estj-and-isfp", "enfj-and-estj", "intj-and-intp"]) {
      expect((await text(`/read/${slug}`)).res.status, slug).toBe(200);
    }
  });

  it("canonicalises a reversed pair slug with a 301, not a duplicate page", () => {
    const res = call("/read/infj-and-entp");
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("/read/entp-and-infj");
  });

  it("404s an unknown slug, a same-type pair, and junk", async () => {
    expect((await text("/read/zzzz")).res.status).toBe(404);
    expect((await text("/read/entp-and-entp")).res.status).toBe(404);
    expect((await text("/read/entp-and-nope")).res.status).toBe(404);
  });
});

describe("SEO markup", () => {
  it("a pair page carries title, description, canonical and OG", async () => {
    const { html } = await text("/read/entp-and-infj");
    expect(html).toContain("<title>ENTP and INFJ compatibility");
    expect(html).toContain('<link rel="canonical" href="https://octant.test/read/entp-and-infj">');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('name="description"');
    expect(html).toContain('"@type":"Article"');
    // No noindex — these are meant to be found (unlike the gated pages).
    expect(html).not.toContain("noindex");
    // No inline script — nothing for the CSP to block, nothing to leak.
    expect(html).not.toMatch(/<script(?![^>]*application\/ld\+json)/);
  });

  it("the sitemap lists the index, all 16 types and all 120 pairs", async () => {
    const res = call("/sitemap.xml");
    const xml = await res!.text();
    expect(res!.headers.get("content-type")).toContain("xml");
    const locs = (xml.match(/<loc>/g) ?? []).length;
    expect(locs).toBe(1 /* home */ + 1 /* /read */ + 16 + 120);
    expect(xml).toContain("https://octant.test/read/entp-and-infj");
  });

  it("robots allows crawling and points at the sitemap", async () => {
    const txt = await call("/robots.txt")!.text();
    expect(txt).toContain("Allow: /");
    expect(txt).toContain("Sitemap: https://octant.test/sitemap.xml");
  });
});

describe("it is a slice, not the instrument", () => {
  it("shows not one sentence of the composed per-pair playbook", async () => {
    const a = "ENTP";
    const b = "INFJ";
    const { html } = await text(`/read/${a.toLowerCase()}-and-${b.toLowerCase()}`);

    // The instrument has signature phrasing that must never leak onto a public page.
    for (const phrase of ["Lead with your", "Back it with", "Shield their Cave", "Blind spot", "Dread "]) {
      expect(html.includes(phrase), `instrument phrasing must stay gated: "${phrase}"`).toBe(false);
    }

    // And, exhaustively: no sentence of the composed playbook (either direction)
    // appears on the page — not the first, not any.
    for (const [x, y] of [
      [a, b],
      [b, a],
    ] as const) {
      const sentences = playbook(x, y).split(/(?<=[.!?])\s+/).filter((s) => s.length > 40);
      for (const s of sentences) {
        const chunk = s.slice(10, 70);
        expect(html.includes(chunk), `playbook text must stay gated: "${chunk}"`).toBe(false);
      }
    }
  });

  it("every pair page links into the gated instrument", async () => {
    const { html } = await text("/read/entp-and-infj");
    expect(html).toContain('href="/pair/ENTP/INFJ"');
  });

  it("shows the relation and both ease scores as the headline", async () => {
    const { html } = await text("/read/entp-and-infj");
    expect(html).toContain(REL_NAME[REL.ENTP.INFJ]);
    expect(html).toContain(`${ease("ENTP", "INFJ")}`);
    expect(html).toContain(`${ease("INFJ", "ENTP")}`);
  });

  it("a type page teases the wiring and links into the instrument", async () => {
    const { html } = await text("/read/entp");
    expect(html).toContain("<h1>The ENTP</h1>");
    expect(html).toContain('href="/type/ENTP"');
  });
});
