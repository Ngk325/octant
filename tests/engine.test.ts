import { describe, expect, it } from "vitest";
import fixture from "./reference-fixture.json";
import {
  TYPES, REL, ease, stack, quadra, ops, coins, gate, fourSides,
  complements, frictions, calculate, verify, type MbtiType,
} from "../src/engine";
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
