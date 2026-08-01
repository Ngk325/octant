import { describe, expect, it } from "vitest";
import {
  wheelOf, templeOf, temples, wheels, themeFor, poleFor, THEMES, UNSETTLED,
  type TempleName,
} from "../src/engine/octagram";
import { fourSides } from "../src/engine/sides";
import { relation } from "../src/engine/core";
import { TYPES, type MbtiType } from "../src/engine/data";

/* ------------------------------------------------------------------ *
 * The Octagram's structure is the app's fourth external validation, and
 * the cleanest one: CS Joseph publishes the eight dyads and the four
 * temples as a LIST, and this engine derives the same partition from the
 * four-sides operation with no lookup table anywhere.
 *
 * If that claim is wrong, these tests fail. That is the point of them.
 * ------------------------------------------------------------------ */

/** Published on csjoseph.life, "The 8 Temple Wheels of the Octagram". */
const PUBLISHED: { temple: TempleName; dyads: [MbtiType, MbtiType][] }[] = [
  { temple: "Soul",  dyads: [["ENFP", "ISTJ"], ["ESTP", "INFJ"]] },
  { temple: "Heart", dyads: [["ENTP", "ISFJ"], ["ESFP", "INTJ"]] },
  { temple: "Mind",  dyads: [["ESTJ", "INFP"], ["ENFJ", "ISTP"]] },
  { temple: "Body",  dyads: [["ESFJ", "INTP"], ["ENTJ", "ISFP"]] },
];

describe("dyads are derived, and match the published eight", () => {
  it.each(PUBLISHED.flatMap((t) => t.dyads))(
    "%s and %s are one wheel",
    (a, b) => {
      expect(new Set(wheelOf(a).pair)).toEqual(new Set([a, b]));
      expect(new Set(wheelOf(b).pair)).toEqual(new Set([a, b]));
    },
  );

  it.each(TYPES)("%s's partner is its subconscious, which is its Dual", (t) => {
    const [, subconscious] = fourSides(t);
    const [self, partner] = wheelOf(t).pair;
    expect(self).toBe(t);
    expect(partner).toBe(subconscious);
    expect(relation(t, partner)).toBe("DU");
  });

  it("produces exactly eight, covering all sixteen types once", () => {
    const all = wheels();
    expect(all).toHaveLength(8);
    expect(new Set(all.flatMap((w) => w.pair)).size).toBe(16);
  });
});

describe("temples are derived, and match the published four", () => {
  it.each(PUBLISHED)("$temple holds exactly its two dyads", ({ temple, dyads }) => {
    const members = dyads.flat().sort();
    for (const t of members) {
      expect(templeOf(t).name).toBe(temple);
      expect(templeOf(t).types).toEqual(members);
    }
  });

  it.each(TYPES)("%s's temple is exactly its four-sides orbit", (t) => {
    expect(templeOf(t).types).toEqual([...fourSides(t)].sort());
  });

  it("partitions the sixteen into four closed classes of four", () => {
    const all = temples();
    expect(all.map((x) => x.name)).toEqual(["Soul", "Mind", "Heart", "Body"]);
    for (const temple of all) expect(temple.types).toHaveLength(4);
    expect(new Set(all.flatMap((x) => x.types)).size).toBe(16);
  });

  it("gives every member of a temple the same temple back", () => {
    for (const t of TYPES) {
      for (const other of templeOf(t).types) {
        expect(templeOf(other).name).toBe(templeOf(t).name);
      }
    }
  });
});

describe("the authored wheel content", () => {
  const all = wheels();

  it("names eight distinct origins, virtues, sins and poles", () => {
    for (const key of ["origin", "livingVirtue", "deadlySin", "shadowPole", "aspirationalPole"] as const) {
      expect(new Set(all.map((w) => w[key])).size, key).toBe(8);
    }
  });

  /**
   * One sin per wheel, and the set is CS Joseph's published eight. This
   * comment used to call them "the classical eight of the Evagrian/Cassian
   * tradition" — retired 2026-08 because it is not true: Evagrius's list
   * has sadness and acedia and no envy (envy is Gregory's addition). The
   * set below is what the eight public wheel diagrams actually show, which
   * is the stronger check anyway: direct, not by way of a misattributed
   * tradition.
   */
  it("uses CS Joseph's published eight deadly sins, one per wheel", () => {
    expect(all.map((w) => w.deadlySin).sort()).toEqual(
      ["Envy", "Gluttony", "Greed", "Lust", "Pride", "Sloth", "Vainglory", "Wrath"],
    );
  });

  it("gives every wheel plain-language prose for all five parts", () => {
    for (const w of all) {
      for (const key of ["originPlain", "virtuePlain", "sinPlain", "shadowPlain", "aspirationalPlain"] as const) {
        expect(w[key].length, `${w.origin}.${key}`).toBeGreaterThan(40);
      }
    }
  });

  it("puts both members of a dyad on the same origin", () => {
    for (const t of TYPES) {
      const [, partner] = wheelOf(t).pair;
      expect(wheelOf(partner).origin).toBe(wheelOf(t).origin);
    }
  });

  it("anchors the two wheels that could be cross-checked against source", () => {
    expect(wheelOf("ENFP").origin).toBe("Justification");
    expect(wheelOf("ENFP").livingVirtue).toBe("Absolution");
    expect(wheelOf("ENFP").deadlySin).toBe("Wrath");
    expect(wheelOf("ISTJ").origin).toBe("Justification");
    expect(wheelOf("ENTP").origin).toBe("Satisfaction");
    expect(wheelOf("ISFJ").origin).toBe("Satisfaction");
    // stated outright in the dedicated ESTP/INFJ episode
    expect(wheelOf("ESTP").shadowPole).toBe("Idolatry");
    expect(wheelOf("ESTP").aspirationalPole).toBe("Objectification");
  });
});

describe("the theme layer", () => {
  it("covers all four development x focus combinations", () => {
    expect(THEMES).toHaveLength(4);
    expect(themeFor("SD", "SF").theme).toBe("Joy");
    expect(themeFor("SD", "UF").theme).toBe("Decay");
    expect(themeFor("UD", "SF").theme).toBe("Hope");
    expect(themeFor("UD", "UF").theme).toBe("Despair");
  });

  it("keeps the seasons in the published order", () => {
    expect(themeFor("SD", "SF").season).toBe("Summer");
    expect(themeFor("SD", "UF").season).toBe("Autumn");
    expect(themeFor("UD", "SF").season).toBe("Spring");
    expect(themeFor("UD", "UF").season).toBe("Winter");
  });

  it("sends the subconscious-developed to the aspirational pole and the undeveloped to the shadow", () => {
    const w = wheelOf("INFJ");
    expect(poleFor(w, "SD")).toMatchObject({ which: "aspirational", name: "Objectification" });
    expect(poleFor(w, "UD")).toMatchObject({ which: "shadow", name: "Idolatry" });
  });
});

describe("the gaps are recorded rather than filled in", () => {
  it("keeps UNSETTLED populated and explained", () => {
    expect(UNSETTLED.length).toBeGreaterThan(0);
    for (const u of UNSETTLED) expect(u.why.length).toBeGreaterThan(80);
  });
});
