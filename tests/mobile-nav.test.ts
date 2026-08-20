import { describe, expect, it } from "vitest";
import { marketingPage, siteHeader } from "../src/worker/marketing";
import { partnersPage } from "../src/worker/partners";

/* ------------------------------------------------------------------ *
 * THE COMPACT MENU.
 *
 * The rule this file exists to hold: a destination reachable from the
 * masthead on a desktop must be reachable on a phone. The nav used to
 * fail that outright -- Product, Who it's for and Partners were
 * display:none below 640px with nothing to open in their place, so the
 * partner page could not be navigated to from a phone at all.
 * ------------------------------------------------------------------ */

const hrefsIn = (html: string, openTag: string): string[] => {
  const start = html.indexOf(openTag);
  if (start === -1) return [];
  const end = html.indexOf("</nav>", start);
  return [...html.slice(start, end).matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
};

const barLinks = (html: string) => hrefsIn(html, '<nav class="mnav"');
const panelLinks = (html: string) => hrefsIn(html, '<nav class="mmenu-panel"');

describe("the compact menu", () => {
  for (const [name, page] of [
    ["home", () => marketingPage("https://octant.example")],
    ["partners", () => partnersPage("https://octant.example")],
  ] as const) {
    it(`${name}: every masthead destination is also in the compact menu`, async () => {
      const html = await (await page()).text();
      const bar = barLinks(html).filter((h) => h !== "#pricing" && h !== "/#pricing");
      const panel = panelLinks(html);
      expect(panel.length).toBeGreaterThan(0);
      for (const href of bar) expect(panel).toContain(href);
    });

    it(`${name}: the menu needs no script`, async () => {
      const html = await (await page()).text();
      // script-src is 'self' plus three pinned sha256 hashes (headers.ts).
      // A menu that needed JS would mean a fourth pinned hash.
      expect(html).not.toContain("<script");
      expect(html).toContain("<details class=\"mmenu\">");
      expect(html).toContain("<summary");
    });
  }

  it("keeps the primary action in the bar rather than behind the menu", () => {
    const html = siteHeader(true);
    const bar = html.slice(html.indexOf('<nav class="mnav"'), html.indexOf("</nav>"));
    expect(bar).toContain('class="btn primary"');
  });

  // .wrap supplies the 24px side gutters every public page relies on. Any
  // class sharing an element with it has EQUAL specificity, so a `padding`
  // shorthand on that class wins by source order and silently zeroes those
  // gutters -- running the content flush to both screen edges at every width.
  // This bit .top-inner, .hero and .p-hero simultaneously. Assert the whole
  // class of bug rather than the three instances of it.
  for (const [name, page] of [
    ["home", () => marketingPage("https://octant.example")],
    ["partners", () => partnersPage("https://octant.example")],
  ] as const) {
    it(`${name}: nothing sharing an element with .wrap uses a padding shorthand`, async () => {
      const html = await (await page()).text();
      const css = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));

      const companions = new Set<string>();
      for (const m of html.matchAll(/class="wrap ([^"]+)"/g)) {
        for (const c of m[1].split(/\s+/)) if (c) companions.add(c);
      }
      expect(companions.size).toBeGreaterThan(0);

      for (const cls of companions) {
        for (const rule of css.matchAll(
          new RegExp(`\\.${cls}\\s*\\{[^}]*\\}`, "gs"),
        )) {
          expect(
            rule[0],
            `.${cls} shares an element with .wrap and must not set a padding shorthand`,
          ).not.toMatch(/[^-]padding\s*:/);
        }
      }
    });
  }

  it("gives the menu control a thumb-sized target", async () => {
    const html = await marketingPage("https://octant.example").text();
    const rule = html.match(/\.mmenu > summary \{[^}]*\}/s)?.[0] ?? "";
    expect(rule).toMatch(/width:44px/);
    expect(rule).toMatch(/height:44px/);
  });
});
