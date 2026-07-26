import { describe, expect, it } from "vitest";
import fixture from "./reference-fixture.json";
import {
  TYPES, REL, ease, stack, quadra, ops, coins, gate, fourSides,
  complements, catalysts, frictions, calculate, verify, type MbtiType,
} from "../src/engine";
import { ENTRIES, BY_ID, CATEGORIES, pairTerms, compareAspects } from "../src/engine/lexicon";
import { playbook } from "../src/engine/playbook";

type F = typeof fixture;
const f = fixture as F;

describe("engine integrity", () => {
  it("passes every structural assertion", () => {
    expect(verify()).toEqual([]);
  });
});

describe("faithful port of the reference engine", () => {
  it("agrees on the type list", () => {
    expect([...TYPES]).toEqual(f.types);
  });

  it.each(TYPES)("%s: stack, quadra, ops, coins, gate, sides", (t) => {
    const ref = (f.perType as Record<string, any>)[t];
    expect(stack(t)).toEqual(ref.stack);
    expect(quadra(t)).toBe(ref.quadra);
    expect(coins(t)).toEqual(ref.coins);
    expect(fourSides(t)).toEqual(ref.fourSides);
    expect(complements(t)).toEqual(ref.complements);
    expect(frictions(t)).toEqual(ref.frictions);

    const o = ops(t);
    expect(o.saviorObs).toBe(ref.ops.savior_obs);
    expect(o.saviorDec).toBe(ref.ops.savior_dec);
    expect(o.demonObs).toBe(ref.ops.demon_obs);
    expect(o.demonDec).toBe(ref.ops.demon_dec);
    expect(o.primary).toBe(ref.ops.primary);
    expect(o.demon).toBe(ref.ops.demon);
    expect(o.middles).toEqual(ref.ops.middles);
    expect(o.stack).toBe(ref.ops.stack);

    const g = gate(t);
    expect([g.gate, g.fear, g.cave, g.treasure]).toEqual(ref.gate);
  });

  it("reproduces all 256 relations and scores", () => {
    for (const t of TYPES) for (const p of TYPES) {
      expect(REL[t][p]).toBe((f.relations as any)[t][p]);
      expect(ease(t, p)).toBe((f.scores as any)[t][p]);
    }
  });

  it("reproduces all 256 playbooks character for character", () => {
    for (const p of TYPES) for (const t of TYPES) {
      expect(playbook(p, t)).toBe((f.playbooks as any)[p][t]);
    }
  });
});

describe("calculator", () => {
  const answersFor = (t: MbtiType) => coins(t);

  it("resolves every type from its own coins", () => {
    for (const t of TYPES) {
      const r = calculate(answersFor(t));
      expect(r.best).toBe(t);
      expect(r.status).toBe("resolved");
      expect(r.field).toEqual([t]);
    }
  });

  it("resolves from the four determining coins alone", () => {
    for (const t of TYPES) {
      const c = coins(t);
      const only = c.map((v, i) => ([0, 2, 3, 4].includes(i) ? v : null));
      expect(calculate(only).best).toBe(t);
    }
  });

  it("still resolves when a confirming coin conflicts, and flags it", () => {
    const c = coins("ENTP");
    const conflicted = [...c];
    conflicted[5] = "Responding"; // ENTP is structurally Initiating
    const r = calculate(conflicted);
    expect(r.best).toBe("ENTP");
    expect(r.status).toBe("friction");
    expect(r.conflicts).toHaveLength(1);
    expect(r.conflicts[0].predicted).toBe("Initiating");
  });

  it("narrows rather than failing on partial input", () => {
    const r = calculate([null, null, "Gather", "Thinking", "iNtuition", null, null, null]);
    expect(r.status).toBe("incomplete");
    expect(r.best).toBeNull();
    expect(r.field).toEqual(["ENTP", "INTP"]);
  });
});

describe("lexicon", () => {
  const cats = new Set(CATEGORIES);

  it("has unique ids and no empty definitions", () => {
    const ids = ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of ENTRIES) {
      expect(e.term.length).toBeGreaterThan(0);
      expect(e.short.length).toBeGreaterThan(10);
      expect(e.definition.length).toBeGreaterThan(80);
      expect(cats.has(e.category)).toBe(true);
    }
  });

  it("resolves every see-also cross-reference", () => {
    for (const e of ENTRIES) {
      for (const ref of e.seeAlso ?? []) {
        expect(BY_ID.has(ref), `${e.id} → ${ref}`).toBe(true);
      }
    }
  });

  it("pairs every ordered combination within a pairable category", () => {
    const pairable = ["Romance Style", "Interaction Style", "Quadra", "Animal",
                      "Function", "Archetype", "Gate", "Temperament"];
    for (const cat of pairable) {
      const members = ENTRIES.filter((e) => e.category === cat);
      for (const a of members) for (const b of members) {
        const p = pairTerms(a.id, b.id);
        expect(p, `${cat}: ${a.id} → ${b.id}`).not.toBeNull();
        expect(p!.body.length).toBeGreaterThan(60);
      }
    }
  });

  it("covers every aspect for all 256 type pairs with no gaps", () => {
    for (const a of TYPES) for (const b of TYPES) {
      const rows = compareAspects(a, b);
      expect(rows.length).toBe(16);
      for (const r of rows) {
        expect(BY_ID.has(r.aId), `${a}/${b} ${r.aspect} → ${r.aId}`).toBe(true);
        expect(BY_ID.has(r.bId), `${a}/${b} ${r.aspect} → ${r.bId}`).toBe(true);
        expect(r.pairing, `${a}/${b} ${r.aspect}`).not.toBeNull();
      }
    }
  });

  it("defines every relation code, coin pole and type-level term", () => {
    for (const t of TYPES) {
      expect(BY_ID.has(quadraId(t))).toBe(true);
      for (const p of TYPES) expect(BY_ID.has(`rel-${REL[t][p].toLowerCase()}`)).toBe(true);
    }
  });
});

function quadraId(t: MbtiType) {
  return quadra(t).toLowerCase();
}

describe("catalysts", () => {
  it("are always the Extinguishment and Mirage partners", () => {
    for (const t of TYPES) {
      const codes = catalysts(t).map((c) => REL[t][c]).sort();
      expect(codes).toEqual(["EX", "MG"]);
    }
  });
  it("always lead with the type's Nemesis function", () => {
    for (const t of TYPES) {
      const nem = stack(t)[4];
      for (const c of catalysts(t)) expect(stack(c)[0]).toBe(nem);
    }
  });
  it("never overlap with complements", () => {
    for (const t of TYPES) {
      const overlap = catalysts(t).filter((c) => complements(t).includes(c));
      expect(overlap).toEqual([]);
    }
  });
});
