import { describe, expect, it } from "vitest";
import fixture from "./reference-fixture.json";
import { TYPES, stack, relation } from "../src/engine/core";
import { sides, SIDE_ORDER, fourSides, gateways } from "../src/engine/sides";

const f = fixture as { perType: Record<string, { fourSides: string[] }> };

/* ------------------------------------------------------------------ *
 * The four sides of the mind.
 *
 * Verified against CS Joseph's own worked example: an INTP's subconscious
 * is ESFJ, its unconscious ENTJ, its superego ISFP — with gateways Ti,
 * Fe, Te and Fi respectively.
 * ------------------------------------------------------------------ */

describe("four sides", () => {
  it("still agrees with the reference engine on which types the sides are", () => {
    for (const t of TYPES) {
      expect(fourSides(t)).toEqual(f.perType[t].fourSides);
    }
  });

  it("matches CS Joseph's worked INTP example", () => {
    const s = sides("INTP");
    expect(s.ego.type).toBe("INTP");
    expect(s.subconscious.type).toBe("ESFJ");
    expect(s.unconscious.type).toBe("ENTJ");
    expect(s.superego.type).toBe("ISFP");

    expect(s.ego.gateway.fn).toBe("Ti");
    expect(s.subconscious.gateway.fn).toBe("Fe");
    expect(s.unconscious.gateway.fn).toBe("Te");
    expect(s.superego.gateway.fn).toBe("Fi");
  });

  it.each(TYPES)("%s: each side's own stack reproduces its four slots", (t) => {
    const s = sides(t);
    for (const k of SIDE_ORDER) {
      const own = stack(s[k].type).slice(0, 4);
      expect(s[k].slots.map((sl) => sl.fn)).toEqual(own);
    }
  });

  it.each(TYPES)("%s: the sides are built from the ego's eight slots, re-sorted", (t) => {
    const st = stack(t);
    const s = sides(t);
    expect(s.ego.slots.map((x) => x.fn)).toEqual(st.slice(0, 4));
    expect(s.subconscious.slots.map((x) => x.fn)).toEqual([...st.slice(0, 4)].reverse());
    expect(s.unconscious.slots.map((x) => x.fn)).toEqual(st.slice(4, 8));
    expect(s.superego.slots.map((x) => x.fn)).toEqual([...st.slice(4, 8)].reverse());
  });

  it.each(TYPES)("%s: each side stands in a fixed relation to the ego", (t) => {
    const s = sides(t);
    expect(relation(t, s.ego.type)).toBe("ID");
    expect(relation(t, s.subconscious.type)).toBe("DU");
    expect(relation(t, s.unconscious.type)).toBe("EX");
    expect(relation(t, s.superego.type)).toBe("SE");
  });

  it.each(TYPES)("%s: the gateway is always that side's own Lead", (t) => {
    const s = sides(t);
    for (const k of SIDE_ORDER) {
      expect(s[k].gateway.fn).toBe(s[k].slots[0].fn);
    }
  });

  it.each(TYPES)("%s: gateways are Lead, Cave, Doubt, Dread in order", (t) => {
    const st = stack(t);
    expect(gateways(t).map((g) => g.fn)).toEqual([st[0], st[3], st[4], st[7]]);
    expect(gateways(t).map((g) => g.egoSlot)).toEqual(["Lead", "Cave", "Doubt", "Dread"]);
  });

  it.each(TYPES)("%s: the Dread is the unconscious's Cave and the superego's Lead", (t) => {
    const s = sides(t);
    const dread = stack(t)[7];
    expect(s.unconscious.slots[3].fn).toBe(dread);
    expect(s.superego.slots[0].fn).toBe(dread);
  });

  it.each(TYPES)("%s: every side carries complete copy", (t) => {
    const s = sides(t);
    for (const k of SIDE_ORDER) {
      const side = s[k];
      for (const field of ["plain", "what", "blockedBy", "opensWith", "assess", "atWill", "forced", "interact", "produces", "developed", "undeveloped"] as const) {
        expect(side[field].length, `${t}/${k}.${field}`).toBeGreaterThan(20);
      }
    }
  });

  it("uses the four sides' own types as a permutation of four distinct types", () => {
    for (const t of TYPES) {
      expect(new Set(fourSides(t)).size).toBe(4);
    }
  });
});
