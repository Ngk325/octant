import { describe, expect, it } from "vitest";
import { COIN_OPTIONS, calculate, coins } from "../src/engine/ops";
import { COIN_LABELS, DETERMINING, TYPES, type MbtiType } from "../src/engine/data";
import { READ_PROMPTS, readPoleValue } from "../src/engine/read";

/* ------------------------------------------------------------------ *
 * "Read someone" asks about the same coins as the calculator, just
 * indirectly. These tests hold the two contracts that matter: the
 * prompt set actually covers what it claims to (all four determining
 * coins, no coin asked twice), and a session answered accurately still
 * resolves through the same calculate() the calculator uses — so the
 * two instruments cannot quietly disagree with each other.
 * ------------------------------------------------------------------ */

describe("what READ_PROMPTS covers", () => {
  it("asks exactly the four determining coins", () => {
    const asked = READ_PROMPTS.map((p) => p.coin).filter((c) =>
      (DETERMINING as readonly number[]).includes(c),
    );
    expect(new Set(asked)).toEqual(new Set(DETERMINING));
  });

  it("never asks the same coin twice", () => {
    const coins_ = READ_PROMPTS.map((p) => p.coin);
    expect(new Set(coins_).size).toBe(coins_.length);
  });

  it("every coin index is a real coin", () => {
    for (const p of READ_PROMPTS) {
      expect(p.coin).toBeGreaterThanOrEqual(0);
      expect(p.coin).toBeLessThan(COIN_OPTIONS.length);
      expect(COIN_LABELS[p.coin]).toBeDefined();
    }
  });

  it("carries a cue and two distinct poles for every prompt", () => {
    for (const p of READ_PROMPTS) {
      expect(p.cue.length).toBeGreaterThan(0);
      expect(p.poles).toHaveLength(2);
      expect(p.poles[0]).not.toBe(p.poles[1]);
    }
  });

  it("phrases nothing as a trait word from COIN_OPTIONS or COIN_LABELS", () => {
    // The whole point is that the wording never gives away the axis. If a
    // pole or cue literally contains one of the engine's own coin terms,
    // the disguise has failed.
    const jargon = [...COIN_OPTIONS.flat(), ...COIN_LABELS.flatMap((l) => l.split(" vs "))];
    for (const p of READ_PROMPTS) {
      const text = `${p.cue} ${p.poles[0]} ${p.poles[1]}`.toLowerCase();
      for (const word of jargon) {
        expect(text, `"${word}" leaked into prompt for coin ${p.coin}`).not.toContain(word.toLowerCase());
      }
    }
  });
});

describe("readPoleValue", () => {
  it("matches COIN_OPTIONS in order for every prompt", () => {
    for (const p of READ_PROMPTS) {
      expect(readPoleValue(p, 0)).toBe(COIN_OPTIONS[p.coin][0]);
      expect(readPoleValue(p, 1)).toBe(COIN_OPTIONS[p.coin][1]);
    }
  });
});

/** Build a full 8-slot answers array as an accurate "read someone" session would produce it. */
function readAnswersFor(t: MbtiType): (string | null)[] {
  const c = coins(t);
  const answers: (string | null)[] = Array(8).fill(null);
  for (const p of READ_PROMPTS) answers[p.coin] = c[p.coin];
  return answers;
}

describe("a full, accurate read resolves through the shared calculate()", () => {
  it("lands on the right type for all sixteen", () => {
    for (const t of TYPES) {
      const r = calculate(readAnswersFor(t));
      expect(r.best, t).toBe(t);
      expect(r.status, t).toBe("resolved");
    }
  });

  it("still resolves from the four determining prompts alone", () => {
    for (const t of TYPES) {
      const c = coins(t);
      const onlyDetermining: (string | null)[] = Array(8).fill(null);
      for (const i of DETERMINING) onlyDetermining[i] = c[i];
      expect(calculate(onlyDetermining).best, t).toBe(t);
    }
  });

  it("narrows without resolving on the two cross-check prompts alone", () => {
    const crossCheckOnly: (string | null)[] = Array(8).fill(null);
    const c = coins("ENTP");
    for (const p of READ_PROMPTS.filter((p) => !(DETERMINING as readonly number[]).includes(p.coin))) {
      crossCheckOnly[p.coin] = c[p.coin];
    }
    const r = calculate(crossCheckOnly);
    expect(r.status).toBe("incomplete");
    expect(r.best).toBeNull();
    expect(r.field.length).toBeGreaterThan(1);
  });
});
