import { describe, expect, it } from "vitest";
import { TYPES, stack, alpha, beta, omega, REL, type MbtiType, type RelCode } from "../src/engine/core";
import { DOM_AUX, SLOT_NAMES } from "../src/engine/data";
import { ENTRIES } from "../src/engine/lexicon";
import { ARCHETYPE } from "../src/engine/data";
import {
  typeElsewhere, relationElsewhere, slotElsewhere, conceptElsewhere, archetypeAliases,
  romanceElsewhere, TRANSLATED_IDS, MODEL_A_POSITION, DIVERGENCES, SYSTEMS,
} from "../src/engine/translation";
import { EROTIC_ATTITUDE } from "../src/engine/data";

/* ------------------------------------------------------------------ *
 * The translation surface.
 *
 * Its job is to be RIGHT, not complete. A mapping table that quietly
 * papers over a divergence is worse than no table, because it invites
 * confident wrong conclusions — so the slot permutation is re-derived
 * here from the engine rather than trusted as a constant.
 * ------------------------------------------------------------------ */

describe("the slot permutation is derived, not asserted", () => {
  /**
   * Build their eight-position model from OUR three moves:
   *   [d, x, β(d), β(x), ω(d), ω(x), α(d), α(x)]
   * then ask, for each of our slots, which of their positions holds the
   * same function. If our slot order matched theirs this would be the
   * identity; it is not, and six of eight move.
   */
  const permutationFor = (t: MbtiType): number[] => {
    const [d, x] = DOM_AUX[t];
    const theirs = [d, x, beta[d], beta[x], omega[d], omega[x], alpha[d], alpha[x]];
    return stack(t).map((fn) => theirs.indexOf(fn) + 1);
  };

  it("is the same single permutation for all sixteen types", () => {
    const distinct = new Set(TYPES.map((t) => permutationFor(t).join(",")));
    expect([...distinct]).toHaveLength(1);
  });

  it("matches the constant the module publishes", () => {
    expect(permutationFor("ENTP")).toEqual([...MODEL_A_POSITION]);
  });

  it("moves six of the eight — the whole reason this table exists", () => {
    const moved = MODEL_A_POSITION.filter((pos, i) => pos !== i + 1);
    expect(moved).toHaveLength(6);
  });

  it("puts our slot 4 at their suggestive position", () => {
    // Our Cave is what a Counterpart leads with. This is why our growth
    // story and their duality story arrive at the same place.
    expect(MODEL_A_POSITION[3]).toBe(5);
  });

  it("puts our slot 7 at their vulnerable position", () => {
    // Their most-discussed position, six places from a naive reading.
    expect(MODEL_A_POSITION[6]).toBe(4);
  });
});

describe("coverage", () => {
  it("translates every type", () => {
    for (const t of TYPES) {
      const rows = typeElsewhere(t);
      expect(rows.length, t).toBeGreaterThanOrEqual(4);
      for (const r of rows) {
        expect(r.system, t).toBeTruthy();
        expect(r.term, t).toBeTruthy();
      }
    }
  });

  /* Octant's own romantic-dynamics reading (engine/romance.ts) is derived
     and lives outside this file entirely. This surface exists only so the
     borrowed erotic-attitude label can be shown, attributed, to a reader
     who arrived carrying it — never as if it were Octant's own model. */
  it("translates every type's borrowed romance label, attributed", () => {
    for (const t of TYPES) {
      const rows = romanceElsewhere(t);
      expect(rows.length, t).toBe(1);
      expect(rows[0].system, t).toBeTruthy();
      expect(rows[0].term, t).toBe(EROTIC_ATTITUDE[t]);
      expect(rows[0].note, t).toBeTruthy();
    }
  });

  it("gives every type a distinct code in the other notation", () => {
    const codes = TYPES.map((t) => typeElsewhere(t)[0].term);
    expect(new Set(codes).size).toBe(16);
  });

  it("translates all sixteen relations", () => {
    const codes = new Set<RelCode>();
    for (const a of TYPES) for (const b of TYPES) codes.add(REL[a][b]);
    expect(codes.size).toBe(16);
    for (const c of codes) {
      expect(relationElsewhere(c)[0]?.term, c).toBeTruthy();
    }
  });

  it("translates all eight slots", () => {
    for (let i = 0; i < SLOT_NAMES.length; i++) {
      const rows = slotElsewhere(i);
      expect(rows.length, SLOT_NAMES[i]).toBe(2);
      expect(rows[1].note, SLOT_NAMES[i]).toContain(`position ${MODEL_A_POSITION[i]}`);
    }
  });

  it("only translates ids that are real lexicon entries", () => {
    const ids = new Set(ENTRIES.map((e) => e.id));
    const orphans = TRANSLATED_IDS.filter((id) => !ids.has(id));
    expect(orphans).toEqual([]);
  });

  it("returns empty rather than throwing for a term nobody else names", () => {
    expect(conceptElsewhere("gate-of-chaos")).toEqual([]);
    expect(conceptElsewhere("nonesuch")).toEqual([]);
  });
});

describe("archetypeAliases — the unsourced list on the type page itself", () => {
  it("gives every type three distinct alternates, none matching our own epithets", () => {
    for (const t of TYPES) {
      const aliases = archetypeAliases(t);
      expect(aliases, t).toHaveLength(3);
      expect(new Set(aliases).size, t).toBe(3);
      for (const a of aliases) expect(ARCHETYPE[t], t).not.toContain(a);
    }
  });

  it("is exactly the popular/temperament/grid rows of typeElsewhere, without the system that named them", () => {
    for (const t of TYPES) {
      const sourced = typeElsewhere(t)
        .filter((e) => e.system !== SYSTEMS[0]) // drop the Socionics code+full-name row
        .map((e) => e.term);
      expect(archetypeAliases(t)).toEqual(sourced);
    }
  });
});

describe("honesty", () => {
  it("carries every divergence with a real explanation", () => {
    expect(DIVERGENCES).toHaveLength(4);
    for (const d of DIVERGENCES) {
      expect(d.title).toBeTruthy();
      expect(d.body.length, d.title).toBeGreaterThan(120);
    }
  });

  it("flags the slot-order divergence with the actual permutation", () => {
    const slots = DIVERGENCES.find((d) => /slot order/i.test(d.title));
    expect(slots?.body).toContain(MODEL_A_POSITION.join(","));
  });

  it("warns that the letter convention is contested", () => {
    expect(typeElsewhere("ENTP")[0].note).toMatch(/convention/i);
  });

  it("never leaks an internal export name into reader-facing copy", () => {
    // "see DIVERGENCES" shipped once. It means nothing to somebody reading
    // their own type page, and these notes render verbatim.
    const notes = [
      ...TYPES.flatMap((t) => typeElsewhere(t).map((e) => e.note ?? "")),
      ...(["DU", "SE", "CF"] as RelCode[]).flatMap((c) => relationElsewhere(c).map((e) => e.note ?? "")),
      ...[0, 3, 6].flatMap((i) => slotElsewhere(i).map((e) => e.note ?? "")),
    ];
    for (const n of notes) expect(n, n).not.toMatch(/DIVERGENCES|TRANSLATED_IDS|MODEL_A_/);
  });

  it("warns that their Super-Ego block is not our Super-Ego relation", () => {
    expect(relationElsewhere("SE")[0].note).toMatch(/block/i);
  });

  it("names every system it draws on", () => {
    expect(SYSTEMS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(SYSTEMS).size).toBe(SYSTEMS.length);
  });
});
