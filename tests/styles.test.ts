import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* ------------------------------------------------------------------ *
 * The stylesheet's contracts, enforced.
 *
 * CSS custom properties cannot appear inside @media, so the breakpoint
 * set cannot be tokens — it is a documented list in tokens.css and this
 * test. A new media query at an undocumented width fails the build
 * instead of quietly fragmenting the responsive story.
 * ------------------------------------------------------------------ */

const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

const componentsCss = read("src/styles/components.css");
const tokensCss = read("src/styles/tokens.css");
const baseCss = read("src/styles/base.css");

/** The canonical breakpoint set. Change tokens.css and this together. */
const BREAKPOINTS = new Set([1180, 1100, 900, 700, 640, 480]);
/** Container-query thresholds for the masthead — its width, not the viewport's. */
const CONTAINER_BREAKPOINTS = new Set([1399, 1239]);

describe("the breakpoint contract", () => {
  it("every max-width media query uses a documented breakpoint", () => {
    for (const css of [componentsCss, baseCss]) {
      for (const m of css.matchAll(/@media[^{]*max-width:\s*(\d+)px/g)) {
        expect(
          BREAKPOINTS.has(Number(m[1])),
          `undocumented breakpoint ${m[1]}px — the set lives in tokens.css`,
        ).toBe(true);
      }
    }
  });

  it("every container query uses a documented threshold", () => {
    for (const m of componentsCss.matchAll(/@container[^{]*max-width:\s*(\d+)px/g)) {
      expect(
        CONTAINER_BREAKPOINTS.has(Number(m[1])),
        `undocumented container threshold ${m[1]}px — the set lives in tokens.css`,
      ).toBe(true);
    }
  });

  it("every documented breakpoint is named in tokens.css", () => {
    for (const bp of [...BREAKPOINTS, ...CONTAINER_BREAKPOINTS]) {
      expect(tokensCss, `tokens.css documents ${bp}px`).toContain(`${bp}px`);
    }
  });
});

describe("derived scroll offsets", () => {
  it("declares --masthead-h", () => {
    expect(tokensCss).toContain("--masthead-h");
  });

  it("no source file hard-codes the old 88px offset", () => {
    // The literal appeared as scrollMarginTop: 88, top: 88 and
    // scroll-margin-top: 88px across three files. All are calc()-derived now.
    const sources = [
      "src/styles/components.css",
      "src/styles/base.css",
      "src/views/TypeReader.tsx",
      "src/views/Calculator.tsx",
      "src/views/Lexicon.tsx",
    ];
    for (const p of sources) {
      const text = read(p);
      expect(text, `${p} has no scrollMarginTop: 88`).not.toMatch(/scrollMarginTop:\s*88\b/);
      expect(text, `${p} has no top: 88 literal`).not.toMatch(/top:\s*["']?88(px)?["']?\s*[,}]/);
      expect(text, `${p} has no scroll-margin-top: 88px`).not.toMatch(/scroll-margin-top:\s*88px/);
    }
  });

  it("scroll margins derive from the masthead height", () => {
    expect(componentsCss).toMatch(/\.sec\s*{\s*scroll-margin-top:\s*calc\(var\(--masthead-h\)/);
    expect(componentsCss).toMatch(/\.lex-entry\s*{\s*scroll-margin-top:\s*calc\(var\(--masthead-h\)/);
  });
});

describe("dead css stays dead", () => {
  it(".card.flush and .label are gone", () => {
    expect(componentsCss).not.toContain(".card.flush");
    expect(baseCss).not.toMatch(/^\.label\s*{/m);
  });
});

describe("structural guards", () => {
  it("the document cannot scroll horizontally", () => {
    expect(baseCss).toMatch(/html\s*{[^}]*overflow-x:\s*clip/s);
  });

  it("the grids step down at more than one width", () => {
    // g3 collapses in two steps; g2 collapses at a narrower width than
    // g-side. The point of the assertion: not everything at 900 again.
    /* All blocks at one width, concatenated — a width may appear more than
       once (component-local blocks like .gpath's live near their component). */
    const at = (px: number) =>
      [...componentsCss.matchAll(new RegExp(`@media \\(max-width: ${px}px\\) {([\\s\\S]*?)\\n}`, "g"))]
        .map((m) => m[1])
        .join("\n");
    expect(at(1100)).toContain(".g3");
    expect(at(700)).toContain(".g2");
    expect(at(900)).toContain(".g-side");
    expect(at(640)).toContain(".g3");
  });

  it("card prose is measure-capped", () => {
    expect(componentsCss).toMatch(/\.card p[^{]*{\s*max-width:\s*var\(--measure\)/);
  });
});

/* ------------------------------------------------------------------ *
 * The mobile-reachability guards.
 *
 * These three rules were each a reported bug, and none of them can be
 * caught by the headless screenshot pass in scripts/shots.mjs: headless
 * Chromium has no dynamic browser chrome, so its 100vh already equals
 * the visible height and the broken rail measures fine. They are
 * asserted as source facts instead, because the failure they prevent —
 * a composer you cannot reach on a phone — is invisible until someone
 * opens the real site on a real handset.
 * ------------------------------------------------------------------ */
describe("the chat rail stays usable on a phone", () => {
  it("the rail is sized in dvh, with a vh fallback under it", () => {
    const rail = componentsCss.match(/\n\.rail\s*{([\s\S]*?)\n}/)?.[1] ?? "";
    expect(rail, ".rail declares a height").toMatch(/height:/);
    expect(rail, ".rail sizes itself in dvh").toContain("height: 100dvh");
    // Order matters: the plain-vh line is the fallback and must come first.
    expect(rail.indexOf("height: 100vh")).toBeGreaterThanOrEqual(0);
    expect(rail.indexOf("height: 100vh")).toBeLessThan(rail.indexOf("height: 100dvh"));
  });

  it("the scrollable log may shrink below its content", () => {
    // Without min-height:0 a flex item refuses to go shorter than what is
    // inside it, so a long thread pushes .rail-form out of the rail.
    const log = componentsCss.match(/\.rail-log\s*{([\s\S]*?)\n}/)?.[1] ?? "";
    expect(log).toMatch(/min-height:\s*0/);
    expect(log).toMatch(/overflow-y:\s*auto/);
  });

  it("the composer clears the home indicator", () => {
    const form = componentsCss.match(/\.rail-form\s*{([\s\S]*?)\n}/)?.[1] ?? "";
    expect(form).toContain("env(safe-area-inset-bottom)");
  });
});

describe("the glossary popover stays on screen", () => {
  it("becomes a viewport-pinned sheet on phones", () => {
    // Anchored to the term it is min(340px, 80vw) wide — nearly the whole
    // screen — so hanging it off either edge of a mid-line term clipped it.
    // .flip only ever guarded the right edge; pinning guards both.
    /* 640px opens more than one block — same caveat the grid test documents,
       so concatenate them all rather than trusting the first. */
    const at640 = [...componentsCss.matchAll(/@media \(max-width: 640px\) {([\s\S]*?)\n}/g)]
      .map((m) => m[1])
      .join("\n");
    const sheet = at640.match(/\.term-pop,\s*\.term-pop\.flip\s*{([\s\S]*?)}/)?.[1] ?? "";
    expect(sheet, "both selectors, so .flip cannot re-introduce the overhang").not.toBe("");
    expect(sheet).toMatch(/position:\s*fixed/);
    expect(sheet).toMatch(/left:/);
    expect(sheet).toMatch(/right:/);
  });
});
