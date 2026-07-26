import { describe, expect, it } from "vitest";
import { TYPES, stack, omega, isExtraverted, type MbtiType } from "../src/engine/core";
import { ops, animalOf, ANIMAL_KIND, type Animal } from "../src/engine/ops";

/* ------------------------------------------------------------------ *
 * The OPS overlay, asserted from the published definitions rather than
 * from the retired Python reference (which had two errors here — see
 * the note in tests/engine.test.ts).
 *
 * Sources:
 *   Play    Oe + De   energy
 *   Sleep   Oi + Di   energy
 *   Blast   Oi + De   information
 *   Consume Oe + Di   information
 *   Demon functions are the Model A opposites of the saviors, which
 *   places OPS's four functions on the ego's top four exactly.
 * ------------------------------------------------------------------ */

describe("animals", () => {
  const CASES: [string, string, Animal][] = [
    ["Ne", "Te", "Play"],     // Oe + De
    ["Ni", "Ti", "Sleep"],    // Oi + Di
    ["Ni", "Te", "Blast"],    // Oi + De
    ["Ne", "Ti", "Consume"],  // Oe + Di
    ["Se", "Fe", "Play"],
    ["Si", "Fi", "Sleep"],
    ["Si", "Fe", "Blast"],
    ["Se", "Fi", "Consume"],
  ];

  it.each(CASES)("%s + %s is %s", (obs, dec, expected) => {
    expect(animalOf(obs as never, dec as never)).toBe(expected);
  });

  it("splits energy from information correctly", () => {
    expect(ANIMAL_KIND.Play).toBe("Energy");
    expect(ANIMAL_KIND.Sleep).toBe("Energy");
    expect(ANIMAL_KIND.Blast).toBe("Information");
    expect(ANIMAL_KIND.Consume).toBe("Information");
  });

  it("makes the energy animals exactly the attitude-pure pairs", () => {
    for (const obs of ["Ne", "Ni", "Se", "Si"] as const) {
      for (const dec of ["Te", "Ti", "Fe", "Fi"] as const) {
        const pure = isExtraverted(obs) === isExtraverted(dec);
        expect(ANIMAL_KIND[animalOf(obs, dec)]).toBe(pure ? "Energy" : "Information");
      }
    }
  });
});

describe("saviors and demons", () => {
  it.each(TYPES)("%s: OPS's four functions are the ego's top four", (t) => {
    const o = ops(t);
    const top4 = stack(t).slice(0, 4);
    expect([o.saviorObs, o.saviorDec].sort()).toEqual(top4.slice(0, 2).sort());
    expect([o.demonObs, o.demonDec].sort()).toEqual(top4.slice(2, 4).sort());
  });

  it.each(TYPES)("%s: demons are the Model A opposites of the saviors", (t) => {
    const o = ops(t);
    expect(o.demonObs).toBe(omega[o.saviorObs]);
    expect(o.demonDec).toBe(omega[o.saviorDec]);
  });

  it("gives ENTP savior Ne/Ti and demon Si/Fe, as OPS does", () => {
    const o = ops("ENTP");
    expect([o.saviorObs, o.saviorDec]).toEqual(["Ne", "Ti"]);
    expect([o.demonObs, o.demonDec]).toEqual(["Si", "Fe"]);
  });
});

describe("the animal stack", () => {
  it.each(TYPES)("%s: all four animals appear exactly once", (t) => {
    const animals = ops(t).animals.map((a) => a.animal);
    expect(new Set(animals).size).toBe(4);
  });

  it.each(TYPES)("%s: double-savior first, double-demon last", (t) => {
    const o = ops(t);
    expect(o.doubleSavior).toBe(animalOf(o.saviorObs, o.saviorDec));
    expect(o.doubleDemon).toBe(animalOf(o.demonObs, o.demonDec));
    expect(o.animals.find((a) => a.animal === o.doubleDemon)!.position).toBe(4);
    expect(o.animals.find((a) => a.animal === o.doubleDemon)!.role).toBe("last");
  });

  it.each(TYPES)("%s: P types lead Consume, J types lead Blast", (t) => {
    expect(ops(t).doubleSavior).toBe(t[3] === "P" ? "Consume" : "Blast");
  });

  it.each(TYPES)("%s: non-jumpers are energy-dominant, jumpers info-dominant", (t) => {
    expect(ops(t).dominance).toBe("Energy");
    expect(ops(t, { jumper: true }).dominance).toBe("Information");
  });

  it("leaves the middle ordering open until the coin is set", () => {
    const bare = ops("ENTP");
    expect(bare.unset).toContain("second savior animal");
    expect(bare.animals.filter((a) => a.role === "open")).toHaveLength(2);
    expect(bare.stackCode).toBe("C?/?(B)");
  });

  it("completes the OPS code once every coin is set", () => {
    const full = ops("ENTP", {
      secondSavior: "Play",
      lead: "second-savior",
      sensory: "F",
      decider: "F",
    });
    expect(full.unset).toEqual([]);
    expect(full.code).toBe("FF-Ne/Ti-PC/S(B)");
    expect(full.animals.map((a) => a.position)).toEqual([1, 2, 3, 4]);
    expect(full.animals.map((a) => a.role)).toEqual(["savior", "savior", "activated", "last"]);
  });

  it("keeps the double-savior animal in the savior pair whichever way it is coined", () => {
    for (const t of TYPES as readonly MbtiType[]) {
      for (const lead of ["double-savior", "second-savior"] as const) {
        for (const mid of ops(t).middles) {
          const o = ops(t, { secondSavior: mid, lead });
          const pos = o.animals.find((a) => a.animal === o.doubleSavior)!.position!;
          expect(pos).toBeLessThanOrEqual(2);
        }
      }
    }
  });
});
