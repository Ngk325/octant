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
  const block = theme === "light"
    ? css.slice(css.indexOf(":root {"), css.indexOf(':root[data-theme="dark"]'))
    : css.slice(css.indexOf(':root[data-theme="dark"]'), css.indexOf("@media (prefers-color-scheme: dark)"));
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
