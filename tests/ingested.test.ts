import { describe, expect, it } from "vitest";
import { TYPES, stack, ease, REL } from "../src/engine/core";
import { ARCHETYPE, FN_FULL, type Fn, type MbtiType } from "../src/engine/data";
import {
  FN_ROLE, FN_KEYWORD, FN_KEYWORD_GLOSS, FN_VERBS, FN_SAYS, FN_WANTS,
  FN_SATISFACTION, FN_STARVATION, FN_PRACTICE,
} from "../src/engine/functions";
import { SAVIOR_MARKERS, DEMON_MARKERS } from "../src/engine/ops";
import { fourSides } from "../src/engine/sides";
import { empirical, divergence, correlation, surveyMeanFor } from "../src/engine/empirical";

const FNS: Fn[] = ["Ne", "Ni", "Se", "Si", "Te", "Ti", "Fe", "Fi"];

/* ------------------------------------------------------------------ *
 * External validation from the ingested source material.
 * See docs/classification-report.md and docs/transcripts/.
 * ------------------------------------------------------------------ */

/**
 * Berens' published "16 Type Patterns" table, transcribed verbatim from
 * IMG_7570. The engine derives all eight slots from the (dominant, auxiliary)
 * pair via three involutions rather than storing them, so an independently
 * published table agreeing on every cell is real external confirmation.
 */
const BERENS: Record<string, Fn[]> = {
  ESTP: ["Se", "Ti", "Fe", "Ni", "Si", "Te", "Fi", "Ne"],
  ESFP: ["Se", "Fi", "Te", "Ni", "Si", "Fe", "Ti", "Ne"],
  ISTJ: ["Si", "Te", "Fi", "Ne", "Se", "Ti", "Fe", "Ni"],
  ISFJ: ["Si", "Fe", "Ti", "Ne", "Se", "Fi", "Te", "Ni"],
  ENTP: ["Ne", "Ti", "Fe", "Si", "Ni", "Te", "Fi", "Se"],
  ENFP: ["Ne", "Fi", "Te", "Si", "Ni", "Fe", "Ti", "Se"],
  INTJ: ["Ni", "Te", "Fi", "Se", "Ne", "Ti", "Fe", "Si"],
  INFJ: ["Ni", "Fe", "Ti", "Se", "Ne", "Fi", "Te", "Si"],
  ESTJ: ["Te", "Si", "Ne", "Fi", "Ti", "Se", "Ni", "Fe"],
  ENTJ: ["Te", "Ni", "Se", "Fi", "Ti", "Ne", "Si", "Fe"],
  ISTP: ["Ti", "Se", "Ni", "Fe", "Te", "Si", "Ne", "Fi"],
  INTP: ["Ti", "Ne", "Si", "Fe", "Te", "Ni", "Se", "Fi"],
  ESFJ: ["Fe", "Si", "Ne", "Ti", "Fi", "Se", "Ni", "Te"],
  ENFJ: ["Fe", "Ni", "Se", "Ti", "Fi", "Ne", "Si", "Te"],
  ISFP: ["Fi", "Se", "Ni", "Te", "Fe", "Si", "Ne", "Ti"],
  INFP: ["Fi", "Ne", "Si", "Te", "Fe", "Ni", "Se", "Ti"],
};

describe("Berens' 16 Type Patterns (external validation)", () => {
  it("covers all sixteen types", () => {
    expect(Object.keys(BERENS).sort()).toEqual([...TYPES].sort());
  });

  it.each(TYPES)("%s: the derived stack matches the published table", (t) => {
    expect(stack(t)).toEqual(BERENS[t]);
  });

  it("agrees on all 128 slots", () => {
    let matched = 0;
    for (const t of TYPES) stack(t).forEach((fn, i) => { if (fn === BERENS[t][i]) matched++; });
    expect(matched).toBe(128);
  });
});

describe("CS Joseph's Type Grid archetype names (external validation)", () => {
  // Transcribed from IMG_7482. Already present as ARCHETYPE[t]'s 4th entry.
  const CSJ: Record<string, string> = {
    ESTJ: "Judicator", ESTP: "Gladiator", ENTJ: "Marshal", ENFJ: "Cleric",
    ESFJ: "Cavalier", ESFP: "Duelist", ENTP: "Rogue", ENFP: "Bard",
    ISTJ: "Archivist", ISTP: "Artificer", INTJ: "Ranger", INFJ: "Paladin",
    ISFJ: "Knight", ISFP: "Druid", INTP: "Ardent", INFP: "Mystic",
  };
  it.each(TYPES)("%s carries its CSJ name", (t) => {
    expect(ARCHETYPE[t].split("/").pop()!.trim()).toBe(CSJ[t]);
  });
});

describe("per-function depth", () => {
  it("covers all eight functions in every table", () => {
    for (const f of FNS) {
      expect(FN_ROLE[f], `role ${f}`).toBeTruthy();
      expect(FN_WANTS[f], `wants ${f}`).toBeTruthy();
      expect(FN_VERBS[f], `verbs ${f}`).toHaveLength(5);
      expect(FN_SAYS[f], `says ${f}`).toHaveLength(2);
      expect(FN_SATISFACTION[f].length, `satisfaction ${f}`).toBeGreaterThan(60);
      expect(FN_STARVATION[f].length, `starvation ${f}`).toBeGreaterThan(40);
      expect(FN_PRACTICE[f].length, `practice ${f}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("gives every function a distinct one-word role, keyword and want", () => {
    expect(new Set(Object.values(FN_ROLE)).size).toBe(8);
    expect(new Set(Object.values(FN_KEYWORD)).size).toBe(8);
    expect(new Set(Object.values(FN_WANTS)).size).toBe(8);
  });

  it("carries the keyword gloss from the owner's whiteboards, with an explanation each", () => {
    // Transcribed from IMG_0314; several are counter-intuitive (Ni = Willpower,
    // Ne = Metaphysics) so each keyword must ship with a gloss.
    expect(FN_KEYWORD.Ni).toBe("Willpower");
    expect(FN_KEYWORD.Ne).toBe("Metaphysics");
    expect(FN_KEYWORD.Se).toBe("Physics");
    expect(FN_KEYWORD.Si).toBe("Duty");
    for (const f of FNS) expect(FN_KEYWORD_GLOSS[f].length, f).toBeGreaterThan(50);
  });

  it("keeps FN_ROLE and FN_KEYWORD as genuinely different cuts", () => {
    // One names what the function does, the other the domain it claims. If any
    // pair collided, one of the two tables would be redundant.
    for (const f of FNS) expect(FN_ROLE[f]).not.toBe(FN_KEYWORD[f]);
  });

  it("keeps every catchphrase short enough to be recognisable in speech", () => {
    for (const f of FNS) for (const phrase of FN_SAYS[f]) {
      expect(phrase.length, `${f}: "${phrase}"`).toBeLessThan(45);
    }
  });

  it("covers every function named in the engine's own table", () => {
    for (const f of Object.keys(FN_FULL) as Fn[]) expect(FN_ROLE[f]).toBeTruthy();
  });
});

describe("OPS savior/demon markers", () => {
  it("has three of each, with a quote and a note", () => {
    for (const set of [SAVIOR_MARKERS, DEMON_MARKERS]) {
      expect(set).toHaveLength(3);
      for (const m of set) {
        expect(m.name).toBeTruthy();
        expect(m.says.length).toBeGreaterThan(10);
        expect(m.note.length).toBeGreaterThan(30);
      }
    }
  });
  it("names the three demon tells from the source sheet", () => {
    expect(DEMON_MARKERS.map((m) => m.name)).toEqual(["Tidalwaves", "Fear / Pain", "Peacocking"]);
  });
});

describe("the empirical compatibility matrix", () => {
  it("is symmetric, as published", () => {
    for (const a of TYPES) for (const b of TYPES) {
      expect(empirical(a, b), `${a}/${b}`).toBe(empirical(b, a));
    }
  });

  it("covers all 256 cells with plausible percentages", () => {
    for (const a of TYPES) for (const b of TYPES) {
      const v = empirical(a, b);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("disagrees with the derived model, which is the point of including it", () => {
    const r = correlation(TYPES);
    expect(r).toBeLessThan(0);            // slightly negative
    expect(r).toBeGreaterThan(-0.5);      // not an inverted copy either
    expect(r).toBeCloseTo(-0.154, 2);
  });

  it("rates Duality low and Identity high — the opposite way round to the model", () => {
    expect(surveyMeanFor(TYPES, "DU")).toBeLessThan(20);   // model rates these 100
    expect(surveyMeanFor(TYPES, "ID")).toBeGreaterThan(85); // model rates these 74
  });

  it("produces an honest reading for every pair without throwing", () => {
    for (const a of TYPES) for (const b of TYPES) {
      const d = divergence(a, b);
      expect(d.delta).toBe(d.derived - d.survey);
      expect(d.reading.length).toBeGreaterThan(60);
      expect(["agree", "mild", "wide", "opposite"]).toContain(d.size);
    }
  });

  it("never claims the survey settles anything", () => {
    for (const a of TYPES) for (const b of TYPES) {
      const r = divergence(a, b).reading.toLowerCase();
      expect(r).not.toMatch(/\b(proves|disproves|wrong|debunk)\b/);
    }
  });

  it("leaves the derived matrix untouched", () => {
    // The empirical layer is additive: importing it must not perturb the core.
    expect(ease("ENTP", "ISFJ")).toBe(100);
    expect(REL.ENTP.ISFJ).toBe("DU");
    expect(empirical("ENTP", "ISFJ")).toBe(5);
  });
});

describe("no derived mapping was smuggled in", () => {
  it("does not key any ingested table to a type", () => {
    // Everything ingested is per-function or per-pair-of-types. Nothing claims a
    // type-level Hawkins level, KWML archetype or emotional state — those were
    // explicitly out of scope.
    const asType = TYPES as readonly MbtiType[];
    for (const t of asType) {
      expect(Object.prototype.hasOwnProperty.call(FN_ROLE, t)).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(FN_SATISFACTION, t)).toBe(false);
    }
  });
});


/* ------------------------------------------------------------------ *
 * The strongest external validation in the batch.
 *
 * An independently published Socionics intertype-relations chart
 * (IMG_6095) covering all 256 ordered pairs. The engine computes those
 * 256 cells from three involutions over sixteen (dominant, auxiliary)
 * pairs; the chart is a hand-built lookup table from a different
 * tradition. They agree on every cell.
 *
 * Two naming conventions differ and are recorded rather than "fixed":
 *   - the chart's "Look-a-like" is this app's Business, and its
 *     "Comparative" is this app's Kindred. English Socionics sources
 *     genuinely disagree on these two labels; the structure is identical.
 *   - the chart writes Benefit/Supervision from the actor's side
 *     (A is Benefactor to B), which is the reciprocal of REL's indexing.
 * ------------------------------------------------------------------ */
describe("Socionics intertype chart (external validation of all 256 relations)", () => {
  // Socionics notation -> MBTI. Extraverts unchanged; introverts swap the last letter.
  const SOC: Record<string, MbtiType> = {
    ENTp: "ENTP", ISFp: "ISFJ", ESFj: "ESFJ", INTj: "INTP", ENFj: "ENFJ", ISTj: "ISTP",
    ESTp: "ESTP", INFp: "INFJ", ESFp: "ESFP", INTp: "INTJ", ENTj: "ENTJ", ISFj: "ISFP",
    ESTj: "ESTJ", INFj: "INFP", ENFp: "ENFP", ISTp: "ISTJ",
  };
  const ORDER = ["ENTp", "ISFp", "ESFj", "INTj", "ENFj", "ISTj", "ESTp", "INFp",
                 "ESFp", "INTp", "ENTj", "ISFj", "ESTj", "INFj", "ENFp", "ISTp"];
  const CHART = `Idn Dlt Act Mrr Bn> Sp> Lkl Ill Ego Cnt Qid Cnf Bn< Sp< Cmp Sdl
Dlt Idn Mrr Act Sp> Bn> Ill Lkl Cnt Ego Cnf Qid Sp< Bn< Sdl Cmp
Act Mrr Idn Dlt Cmp Sdl Bn< Sp< Qid Cnf Ego Cnt Lkl Ill Bn> Sp>
Mrr Act Dlt Idn Sdl Cmp Sp< Bn< Cnf Qid Cnt Ego Ill Lkl Sp> Bn>
Bn< Sp< Cmp Sdl Idn Dlt Act Mrr Bn> Sp> Lkl Ill Ego Cnt Qid Cnf
Sp< Bn< Sdl Cmp Dlt Idn Mrr Act Sp> Bn> Ill Lkl Cnt Ego Cnf Qid
Lkl Ill Bn> Sp> Act Mrr Idn Dlt Cmp Sdl Bn< Sp< Qid Cnf Ego Cnt
Ill Lkl Sp> Bn> Mrr Act Dlt Idn Sdl Cmp Sp< Bn< Cnf Qid Cnt Ego
Ego Cnt Qid Cnf Bn< Sp< Cmp Sdl Idn Dlt Act Mrr Bn> Sp> Lkl Ill
Cnt Ego Cnf Qid Sp< Bn< Sdl Cmp Dlt Idn Mrr Act Sp> Bn> Ill Lkl
Qid Cnf Ego Cnt Lkl Ill Bn> Sp> Act Mrr Idn Dlt Cmp Sdl Bn< Sp<
Cnf Qid Cnt Ego Ill Lkl Sp> Bn> Mrr Act Dlt Idn Sdl Cmp Sp< Bn<
Bn> Sp> Lkl Ill Ego Cnt Qid Cnf Bn< Sp< Cmp Sdl Idn Dlt Act Mrr
Sp> Bn> Ill Lkl Cnt Ego Cnf Qid Sp< Bn< Sdl Cmp Dlt Idn Mrr Act
Cmp Sdl Bn< Sp< Qid Cnf Ego Cnt Lkl Ill Bn> Sp> Act Mrr Idn Dlt
Sdl Cmp Sp< Bn< Cnf Qid Cnt Ego Ill Lkl Sp> Bn> Mrr Act Dlt Idn`
    .trim().split("\n").map((r) => r.trim().split(/\s+/));

  const MAP: Record<string, string> = {
    Idn: "ID", Dlt: "DU", Act: "AC", Mrr: "MI", Sdl: "HD", Ill: "MG",
    Cnt: "EX", Cnf: "CF", Ego: "SE", Qid: "QI",
    Lkl: "BU", Cmp: "KD",            // labels swapped relative to this app's usage
    "Bn>": "BE", "Bn<": "BR", "Sp>": "SR", "Sp<": "SV",
  };

  it("is a complete 16x16 chart", () => {
    expect(CHART).toHaveLength(16);
    for (const row of CHART) expect(row).toHaveLength(16);
  });

  it("agrees with the engine on all 256 cells", () => {
    let matched = 0;
    const misses: string[] = [];
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
      const a = SOC[ORDER[i]], b = SOC[ORDER[j]];
      const expected = MAP[CHART[i][j]];
      const actual = REL[b][a];      // what A is to B
      if (actual === expected) matched++;
      else misses.push(`${ORDER[i]}->${ORDER[j]}: chart ${CHART[i][j]}=${expected}, engine ${actual}`);
    }
    expect(misses.slice(0, 5)).toEqual([]);
    expect(matched).toBe(256);
  });

  it("maps each chart label onto exactly one engine code — a clean bijection", () => {
    const seen = new Map<string, Set<string>>();
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
      const set = seen.get(CHART[i][j]) ?? new Set<string>();
      set.add(REL[SOC[ORDER[j]]][SOC[ORDER[i]]]);
      seen.set(CHART[i][j], set);
    }
    expect(seen.size).toBe(16);
    for (const [label, codes] of seen) {
      expect([...codes], `${label} is ambiguous`).toHaveLength(1);
    }
  });
});


/**
 * A third published relations table (IMG_6097), keyed in plain MBTI notation.
 * Because it needs no Socionics letter conversion, it isolates the relation
 * logic itself rather than the notation mapping.
 */
describe("MBTI-notation intertype table (third external validation)", () => {
  const ORDER: MbtiType[] = ["ENTP", "ISFJ", "ESFJ", "INTP", "ENFJ", "ISTP", "ESTP", "INFJ",
                             "ESFP", "INTJ", "ENTJ", "ISFP", "ESTJ", "INFP", "ENFP", "ISTJ"];
  const CHART = `Id Du Ac Mr Rq+ Sv+ Cp Mg Se Ex QI Cf Rq- Sv- Cg Sd
Du Id Mr Ac Sv+ Rq+ Mg Cp Ex Se Cf QI Sv- Rq- Sd Cg
Ac Mr Id Du Cg Sd Rq- Sv- QI Cf Se Ex Cp Mg Rq+ Sv+
Mr Ac Du Id Sd Cg Sv- Rq- Cf QI Ex Se Mg Cp Sv+ Rq+
Rq- Sv- Cg Sd Id Du Ac Mr Rq+ Sv+ Cp Mg Se Ex QI Cf
Sv- Rq- Sd Cg Du Id Mr Ac Sv+ Rq+ Mg Cp Ex Se Cf QI
Cp Mg Rq+ Sv+ Ac Mr Id Du Cg Sd Rq- Sv- QI Cf Se Ex
Mg Cp Sv+ Rq+ Mr Ac Du Id Sd Cg Sv- Rq- Cf QI Ex Se
Se Ex QI Cf Rq- Sv- Cg Sd Id Du Ac Mr Rq+ Sv+ Cp Mg
Ex Se Cf QI Sv- Rq- Sd Cg Du Id Mr Ac Sv+ Rq+ Mg Cp
QI Cf Se Ex Cp Mg Rq+ Sv+ Ac Mr Id Du Cg Sd Rq- Sv-
Cf QI Ex Se Mg Cp Sv+ Rq+ Mr Ac Du Id Sd Cg Sv- Rq-
Rq+ Sv+ Cp Mg Se Ex QI Cf Rq- Sv- Cg Sd Id Du Ac Mr
Sv+ Rq+ Mg Cp Ex Se Cf QI Sv- Rq- Sd Cg Du Id Mr Ac
Cg Sd Rq- Sv- QI Cf Se Ex Cp Mg Rq+ Sv+ Ac Mr Id Du
Sd Cg Sv- Rq- Cf QI Ex Se Mg Cp Sv+ Rq+ Mr Ac Du Id`
    .trim().split("\n").map((r) => r.trim().split(/\s+/));

  const MAP: Record<string, string> = {
    Id: "ID", Du: "DU", Ac: "AC", Mr: "MI", Sd: "HD", Mg: "MG", QI: "QI",
    Ex: "EX", Se: "SE", Cf: "CF",
    Cp: "BU", Cg: "KD",              // "Cooperation" / "Congenerity" in this sheet's names
    "Rq+": "BR", "Rq-": "BE", "Sv+": "SV", "Sv-": "SR",
  };

  it("agrees with the engine on all 256 cells", () => {
    let matched = 0;
    const misses: string[] = [];
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
      const actual = REL[ORDER[i]][ORDER[j]];
      if (actual === MAP[CHART[i][j]]) matched++;
      else misses.push(`${ORDER[i]}/${ORDER[j]}: chart ${CHART[i][j]}, engine ${actual}`);
    }
    expect(misses.slice(0, 5)).toEqual([]);
    expect(matched).toBe(256);
  });

  it("maps each label onto exactly one engine code", () => {
    const seen = new Map<string, Set<string>>();
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
      const set = seen.get(CHART[i][j]) ?? new Set<string>();
      set.add(REL[ORDER[i]][ORDER[j]]);
      seen.set(CHART[i][j], set);
    }
    expect(seen.size).toBe(16);
    for (const [label, codes] of seen) expect([...codes], `${label}`).toHaveLength(1);
  });
});


/**
 * CS Joseph's four "Temples" turn out to be fully derivable: the four-sides
 * operation partitions the sixteen types into exactly four closed classes of
 * four, and the class containing ENTP is {ENTP, INTJ, ESFP, ISFJ} — which he
 * names the Heart Temple. Recorded here now; surfacing it is next-build work.
 */
describe("the four-sides operation partitions the sixteen types", () => {
  it("yields exactly four closed classes of four", () => {
    const seen = new Set<string>();
    const groups: string[][] = [];
    for (const t of TYPES) {
      if (seen.has(t)) continue;
      const g = [...fourSides(t)].sort();
      g.forEach((x) => seen.add(x));
      groups.push(g);
    }
    expect(groups).toHaveLength(4);
    for (const g of groups) {
      expect(g).toHaveLength(4);
      // closed: every member's own four sides is the same set
      for (const t of g) expect([...fourSides(t as MbtiType)].sort()).toEqual(g);
    }
  });

  it("puts ENTP in the class CS Joseph calls the Heart Temple", () => {
    expect([...fourSides("ENTP")].sort()).toEqual(["ENTP", "ESFP", "INTJ", "ISFJ"]);
  });
});
