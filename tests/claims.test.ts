import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TYPES, ease } from "../src/engine/core";
import { ENTRIES } from "../src/engine/lexicon";
import { STAGES } from "../src/learn/curriculum";
import { marketingPage } from "../src/worker/marketing";

/* ------------------------------------------------------------------ *
 * THE DERIVED-OR-PINNED RULE.
 *
 * Every number or mechanical claim on a public surface is either rendered
 * from the engine at build/run time, or pinned here by a test that
 * recomputes it. This file exists because hand-written numbers drift:
 * the README said "thirteen-stage" while fifteen stages shipped, "all 100
 * lexicon entries" while 103 shipped, and the partner terms claimed A→B
 * and B→A are "different numbers, always" when only 64 of the 240 ordered
 * cross-type pairs differ.
 *
 * Already pinned elsewhere, referenced rather than re-pinned:
 *   - 256 relations/scores  — tests/engine.test.ts walks all 256 cells.
 *   - 128/128 stack slots   — tests/ingested.test.ts (Berens agreement).
 *   - r ≈ −0.15             — tests/ingested.test.ts (empirical counterweight).
 * ------------------------------------------------------------------ */

const read = (path: string) => readFileSync(path, "utf8");
const NUMBER_WORD: Record<number, string> = {
  12: "twelve", 13: "thirteen", 14: "fourteen", 15: "fifteen", 16: "sixteen", 17: "seventeen",
};

/* The asymmetric fraction, recomputed from the engine with its denominator
 * stated: ordered cross-type pairs (16 × 15 = 240), of which the ones in the
 * four asymmetric relations (4 relations × 16 types = 64) score differently
 * by direction. */
const orderedCrossPairs = TYPES.flatMap((a) => TYPES.filter((b) => b !== a).map((b) => [a, b] as const));
const asymmetric = orderedCrossPairs.filter(([a, b]) => ease(a, b) !== ease(b, a));

describe("the engine quantities the public claims hang on", () => {
  it("ships fifteen course stages", () => {
    expect(STAGES.length).toBe(15);
  });

  it("ships 103 lexicon entries", () => {
    expect(ENTRIES.length).toBe(103);
  });

  it("64 of 240 ordered cross-type pairs differ by direction — 27%", () => {
    expect(orderedCrossPairs.length).toBe(240);
    expect(asymmetric.length).toBe(64);
    expect(Math.round((asymmetric.length / orderedCrossPairs.length) * 100)).toBe(27);
  });
});

describe("README claims match the engine", () => {
  const readme = read("README.md");

  it("states the shipped stage count, not a retired one", () => {
    const word = NUMBER_WORD[STAGES.length];
    expect(readme).toContain(`the ${word}-stage course`);
    const cap = word[0].toUpperCase() + word.slice(1);
    expect(readme).toContain(`${cap} stages, in order`);
    expect(readme).not.toMatch(/thirteen-stage|Thirteen stages/);
  });

  it("states the shipped lexicon count everywhere it gives one", () => {
    expect(readme).toContain(`${ENTRIES.length} term definitions`);
    expect(readme).toContain(`all ${ENTRIES.length} lexicon entries`);
    expect(readme).toContain(`${ENTRIES.length} defined terms`);
    expect(readme).not.toContain("all 100 lexicon");
  });
});

describe("partner terms claims match the engine", () => {
  const terms = read("docs/PARTNERSHIP-TERMS.md");

  it("states the shipped stage and lexicon counts", () => {
    expect(terms).toContain(`a ${NUMBER_WORD[STAGES.length]}-stage course`);
    expect(terms).toContain(`${ENTRIES.length}-term lexicon`);
    expect(terms).not.toContain("thirteen-stage");
  });

  it("states the asymmetry truthfully, with its denominator", () => {
    // The old claim — "A→B and B→A are different numbers, always" — was false
    // for 176 of the 240 ordered cross-type pairs.
    expect(terms).not.toContain("different numbers, always");
    expect(terms).toContain(
      `${asymmetric.length} of the ${orderedCrossPairs.length} ordered`,
    );
  });
});

describe("marketing page numbers match the engine", () => {
  it("proof band and copy carry recomputed values", async () => {
    const html = await marketingPage("https://octant.example").text();
    const pct = Math.round((asymmetric.length / orderedCrossPairs.length) * 100);
    expect(html).toContain(
      `<span class="pv">${pct}%</span><span class="pk">of pairs differ by direction</span>`,
    );
    expect(html).toContain(`<span class="pv">${TYPES.length}</span>`);
    expect(html).toContain(`<span class="pv">${TYPES.length * TYPES.length}</span>`);
    expect(html).toContain(`${NUMBER_WORD[STAGES.length]}-stage course`);
  });

  it("the hero's 'Ten points apart' is the engine's own gap", async () => {
    const html = await marketingPage("https://octant.example").text();
    expect(html).toContain("Ten points apart");
    expect(Math.abs(ease("ENTP", "INFP") - ease("INFP", "ENTP"))).toBe(10);
  });
});
