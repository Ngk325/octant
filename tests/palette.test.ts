import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  FN_COLOR, QUADRA_COLOR, CANVAS, easeColor, easeFill, onEaseFill, contrastRatio,
  type Theme,
} from "../src/engine/palette";
import type { Fn } from "../src/engine/data";

/* ------------------------------------------------------------------ *
 * "Terribly hard to read" was the headline complaint about the first
 * build, so legibility is a test rather than a matter of taste.
 *
 * WCAG 2.1 AA: 4.5:1 for body text, 3:1 for large text and UI edges.
 * ------------------------------------------------------------------ */

const AA = 4.5;
const THEMES: Theme[] = ["light", "dark"];
const FNS: Fn[] = ["Ne", "Ni", "Se", "Si", "Te", "Ti", "Fe", "Fi"];

/** Read the ink/surface tokens straight out of the stylesheet so the two cannot drift. */
function tokens(theme: Theme): Record<string, string> {
  const css = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
  const dark = css.indexOf(':root[data-theme="dark"] {');
  const block = theme === "light" ? css.slice(css.indexOf(":root {"), dark) : css.slice(dark);
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{3,8})\s*;/g)) out[m[1]] = m[2];
  return out;
}

describe.each(THEMES)("%s theme legibility", (theme) => {
  const tok = tokens(theme);

  it("defines the tokens the tests need", () => {
    for (const k of ["canvas", "surface", "ink", "ink-2", "muted", "accent", "accent-ink", "on-accent"]) {
      expect(tok[k], `--${k} missing from tokens.css`).toBeTruthy();
    }
  });

  it.each(["ink", "ink-2", "muted"])("%s clears AA on both canvas and surface", (name) => {
    for (const bg of ["canvas", "surface"] as const) {
      expect(contrastRatio(tok[name], tok[bg]), `${name} on ${bg}`).toBeGreaterThanOrEqual(AA);
    }
  });

  it("keeps accent text and buttons readable", () => {
    expect(contrastRatio(tok["accent-ink"], tok.canvas)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(tok["accent-ink"], tok["accent-soft"])).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(tok["on-accent"], tok.accent)).toBeGreaterThanOrEqual(AA);
  });

  it.each(FNS)("%s reads on canvas and on surface", (fn) => {
    expect(contrastRatio(FN_COLOR[theme][fn], tok.canvas)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(FN_COLOR[theme][fn], tok.surface)).toBeGreaterThanOrEqual(AA);
  });

  it("keeps quadra colours readable as text", () => {
    for (const [q, c] of Object.entries(QUADRA_COLOR[theme])) {
      expect(contrastRatio(c, tok.canvas), q).toBeGreaterThanOrEqual(AA);
    }
  });

  it("keeps the whole ease ramp readable, as text and as a matrix swatch", () => {
    for (let v = 0; v <= 100; v += 5) {
      expect(contrastRatio(easeColor(v, theme), tok.canvas), `easeColor(${v}) text`)
        .toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(onEaseFill(theme), easeFill(v, theme)), `easeFill(${v}) swatch`)
        .toBeGreaterThanOrEqual(AA);
    }
  });

  it("agrees with the canvas token exported for diagrams", () => {
    expect(CANVAS[theme].toLowerCase()).toBe(tok.canvas.toLowerCase());
  });
});

describe("the dark palette is declared once", () => {
  const css = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");

  /**
   * Regression: the dark tokens were declared twice — once under
   * `[data-theme="dark"]` and again inside `@media (prefers-color-scheme: dark)`.
   * The tests above only ever read the first copy, so the second could drift
   * below AA without anything failing. There is now exactly one copy, and
   * data-theme is always set (index.html boot script + ThemeProvider).
   */
  it("has no second copy hiding in a prefers-color-scheme block", () => {
    const code = css.replace(/\/\*[\s\S]*?\*\//g, ""); // comments talk about it; rules must not
    expect(code).not.toMatch(/@media\s*\(prefers-color-scheme/);
  });

  it("declares each dark token exactly once", () => {
    const block = css.slice(css.indexOf(':root[data-theme="dark"] {'));
    for (const name of ["canvas", "surface", "ink", "muted", "accent"]) {
      const hits = [...block.matchAll(new RegExp(`--${name}:`, "g"))];
      expect(hits.length, `--${name} declared ${hits.length}x in the dark block`).toBe(1);
    }
  });

  it("is applied by an attribute the app always sets", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    expect(html).toMatch(/documentElement\.dataset\.theme = t/);
    expect(html).toMatch(/prefers-color-scheme: dark/);
  });
});

describe("type scale", () => {
  const css = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");

  it("has no font size below 14px", () => {
    const sizes = [...css.matchAll(/--t-[a-z0-9]+:\s*(\d+)px/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(5);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14);
  });

  it("sets a serif body face at a real reading size", () => {
    expect(css).toMatch(/--t-body:\s*1[89]px/);
  });
});

describe("the grain overlay is gone", () => {
  it("no longer paints a fixed full-page layer over everything", () => {
    const base = readFileSync(new URL("../src/styles/base.css", import.meta.url), "utf8");
    expect(base).not.toMatch(/body::(before|after)/);
    expect(base).not.toMatch(/feTurbulence/);
    expect(base).not.toMatch(/z-index:\s*9999/);
  });
});

describe("the assistant is always reachable", () => {
  const css = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");

  /**
   * Regression: `.rail-launch` shipped as `display: none` with an un-hide only
   * under `max-width: 1180px`. The launcher is rendered ONLY when the rail is
   * closed, so on a desktop viewport closing the rail left no way to reopen it —
   * and the open/closed state persists to localStorage, so it stayed shut.
   */
  it("never hides the launcher that reopens a closed rail", () => {
    const block = css.slice(css.indexOf(".rail-launch {"));
    const rule = block.slice(0, block.indexOf("}"));
    expect(rule).toMatch(/display:\s*inline-flex/);
    expect(rule).not.toMatch(/display:\s*none/);
  });

  it("has no media query that hides the launcher", () => {
    for (const m of css.matchAll(/\.rail-launch\s*\{[^}]*\}/g)) {
      expect(m[0]).not.toMatch(/display:\s*none/);
    }
  });
});
