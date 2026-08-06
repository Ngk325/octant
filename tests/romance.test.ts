import { describe, expect, it } from "vitest";
import { TYPES, stack, gate, complements, catalysts } from "../src/engine/core";
import { soloRomance, pairRomance } from "../src/engine/romance";

/* ------------------------------------------------------------------ *
 * Romance is derived from Complement/Catalyst/Cave/Animal — never a
 * static per-type label borrowed from elsewhere. These tests hold the
 * derivation to the engine it's built from: the mechanism classification
 * must agree with complements()/catalysts() for every one of the 240
 * ordered pairs, and every solo/pair text must actually name the facts
 * it claims to be describing.
 * ------------------------------------------------------------------ */

describe("soloRomance", () => {
  it("names this type's own Lead, Cave, Animal, Dual and Activity, for every type", () => {
    for (const t of TYPES) {
      const r = soloRomance(t);
      const st = stack(t);
      const [dual, activity] = complements(t);
      expect(r.lead).toBe(st[0]);
      expect(r.cave).toBe(st[3]);
      expect(r.fear).toBe(gate(t).fear);
      expect(r.dual).toBe(dual);
      expect(r.activity).toBe(activity);
      expect(r.text).toContain(t);
      expect(r.text).toContain(st[0]);
      expect(r.text).toContain(st[3]);
      expect(r.text).toContain(dual);
      expect(r.text).toContain(activity);
    }
  });

  it("the Dual is always the type whose own Lead is exactly this type's Cave", () => {
    for (const t of TYPES) {
      const { dual, cave } = soloRomance(t);
      expect(stack(dual)[0], `${t}'s Dual ${dual}`).toBe(cave);
    }
  });
});

describe("pairRomance — mechanism classification", () => {
  it("agrees with complements()/catalysts() for all 240 ordered pairs", () => {
    for (const a of TYPES) {
      const [dual, activity] = complements(a);
      const cats = catalysts(a);
      for (const b of TYPES) {
        if (a === b) continue;
        const { mechanism } = pairRomance(a, b);
        if (b === dual) expect(mechanism, `${a}/${b}`).toBe("dual");
        else if (b === activity) expect(mechanism, `${a}/${b}`).toBe("activity");
        else if (cats.includes(b)) expect(mechanism, `${a}/${b}`).toBe("catalyst");
        else expect(mechanism, `${a}/${b}`).toBe("other");
      }
    }
  });

  it("classifies every ordered pair into exactly one mechanism, with the right counts", () => {
    const counts: Record<string, number> = { dual: 0, activity: 0, catalyst: 0, other: 0 };
    for (const a of TYPES) {
      for (const b of TYPES) {
        if (a === b) continue;
        counts[pairRomance(a, b).mechanism]++;
      }
    }
    // 16 types x 1 Dual, 1 Activity, 2 Catalysts each = 16/16/32; the rest (176) are "other".
    expect(counts).toEqual({ dual: 16, activity: 16, catalyst: 32, other: 176 });
  });

  it("names the actual functions and types involved, for each mechanism", () => {
    const a = TYPES[0];
    const [dual, activity] = complements(a);
    const [catalyst1] = catalysts(a);
    const other = TYPES.find((t) => t !== a && t !== dual && t !== activity && !catalysts(a).includes(t))!;

    const dualText = pairRomance(a, dual).text;
    expect(dualText).toContain(dual);
    expect(dualText).toContain(stack(a)[3]); // a's Cave

    const activityText = pairRomance(a, activity).text;
    expect(activityText).toContain(activity);
    expect(activityText).toContain(stack(a)[3]);

    const catalystText = pairRomance(a, catalyst1).text;
    expect(catalystText).toContain(catalyst1);
    expect(catalystText).toContain(stack(a)[4]); // a's Doubt

    const otherText = pairRomance(a, other).text;
    expect(otherText).toContain(other);
    expect(otherText).toContain(stack(a)[3]);
    expect(otherText).toContain(stack(a)[4]);
  });

  it("the mechanism is always reciprocal, even though the TEXT is read directionally", () => {
    // Dual, Activity and Catalyst are all built from an involution (FLIP
    // twice returns the original function), so if b is a's Dual/Activity/
    // Catalyst, a is always b's — the mechanism matches both ways even
    // though pairRomance still writes two different, direction-specific
    // paragraphs (b's Lead landing on a's Cave reads differently than a's
    // Lead landing on b's).
    for (const a of TYPES) {
      for (const b of TYPES) {
        if (a === b) continue;
        expect(pairRomance(a, b).mechanism, `${a}/${b}`).toBe(pairRomance(b, a).mechanism);
      }
    }
  });

  it("still writes a direction-specific paragraph even when the mechanism is reciprocal", () => {
    const a = TYPES[0];
    const [dual] = complements(a);
    expect(pairRomance(a, dual).text).not.toBe(pairRomance(dual, a).text);
  });
});

describe("no static romantic archetype table survives", () => {
  it("the engine has no per-type romance label independent of a partner", () => {
    // soloRomance always requires deriving from stack/gate/ops — there is no
    // way to ask "what is t's romance style" without those calls, because no
    // such flat lookup exists any more.
    expect(Object.keys(soloRomance("ENTP"))).not.toContain("style");
  });
});
