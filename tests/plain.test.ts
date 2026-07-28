import { describe, expect, it } from "vitest";
import { TYPES, REL, stack } from "../src/engine/core";
import { ENTRIES, compareAspects } from "../src/engine/lexicon";
import {
  PLAIN_BY_ID, FN_PLAIN, SLOT_PLAIN, SLOT_ABOUT, slotAbout, REL_PLAIN, QUADRA_PLAIN,
  GATE_PLAIN, COIN_PLAIN, CONCEPT_PLAIN, SIDE_PLAIN,
} from "../src/engine/plain";
import { SLOT_NAMES, REL_NAME, FN_FULL, type Fn } from "../src/engine/data";
import { buildSystemInstruction, typeFacts, pairFacts } from "../src/engine/context";

/* The plain layer only works if it is complete — one missing gloss and a
   newcomer hits a wall of vocabulary with nothing underneath it. */

describe("plain language coverage", () => {
  it("gives every lexicon entry a plain gloss", () => {
    const missing = ENTRIES.filter((e) => !e.plain || e.plain.length < 20);
    expect(missing.map((e) => e.id)).toEqual([]);
  });

  it("covers all 103 entries", () => {
    expect(ENTRIES).toHaveLength(103);
    for (const e of ENTRIES) expect(PLAIN_BY_ID[e.id], e.id).toBeTruthy();
  });

  /* Added with the Octagram: seeAlso is navigation, so a dangling id is a dead
     link in the reader's hand, not just untidy data. */
  it("has no dangling seeAlso reference", () => {
    const ids = new Set(ENTRIES.map((e) => e.id));
    const dangling = ENTRIES.flatMap((e) =>
      (e.seeAlso ?? []).filter((r) => !ids.has(r)).map((r) => `${e.id} → ${r}`));
    expect(dangling).toEqual([]);
  });

  it("covers every function, slot, relation, quadra, gate and coin", () => {
    for (const f of Object.keys(FN_FULL) as Fn[]) expect(FN_PLAIN[f]).toBeTruthy();
    for (const s of SLOT_NAMES) expect(SLOT_PLAIN[s], s).toBeTruthy();
    for (const c of Object.keys(REL_NAME)) expect(REL_PLAIN[c as never], c).toBeTruthy();
    for (const q of ["Alpha", "Beta", "Gamma", "Delta"] as const) expect(QUADRA_PLAIN[q]).toBeTruthy();
    for (const g of Object.keys(GATE_PLAIN)) expect(GATE_PLAIN[g]).toBeTruthy();
    expect(COIN_PLAIN).toHaveLength(8);
    for (const k of ["ego", "subconscious", "unconscious", "superego"]) {
      expect(SIDE_PLAIN[k], k).toBeTruthy();
    }
  });

  it("keeps the plain layer free of the jargon it is meant to replace", () => {
    const banned = /\b(cognitive function|involution|Model A|Socionics|Beebe|auxiliary|dominant function)\b/i;
    const offenders = Object.entries(PLAIN_BY_ID)
      .filter(([id, text]) => id !== "stack-map" && banned.test(text))
      .map(([id]) => id);
    expect(offenders).toEqual([]);
  });

  it("has a plain gloss for every concept the course leans on", () => {
    for (const k of ["function", "stack", "ego", "savior", "demon", "animal", "gateway",
                     "ease", "directional", "quadra", "complement", "catalyst"]) {
      expect(CONCEPT_PLAIN[k], k).toBeTruthy();
    }
  });
});

describe("assistant grounding", () => {
  it("puts real derived facts in front of the model for a type", () => {
    const facts = typeFacts("ENTP").join("\n");
    expect(facts).toContain("Ne");
    expect(facts).toContain("Subconscious=ISFJ");   // ENTP's Dual
    expect(facts).toContain("gateway Si");           // the Cave
    expect(facts).toContain("Demons: Si");       // corrected demons
    expect(facts).toContain("Energy-dominant");
  });

  it("carries the Octagram, and refuses to guess the part that is biographical", () => {
    const facts = typeFacts("ENTP").join("\n");
    expect(facts).toContain("Heart");                 // ENTP's temple
    expect(facts).toContain("Origin Satisfaction");   // shared with ISFJ
    expect(facts).toContain("deadly sin Envy");
    expect(facts).toMatch(/Octagram theme.*NOT DERIVABLE/);
    expect(buildSystemInstruction({ kind: "type", type: "ENTP" }))
      .toContain("Never guess someone's theme from their type");
  });

  it("gives both directions of ease for a pair", () => {
    const facts = pairFacts("ENTP", "INFJ").join("\n");
    expect(facts).toMatch(/Ease for ENTP of being around INFJ/);
    expect(facts).toMatch(/Ease for INFJ of being around ENTP/);
  });

  it("builds a system instruction that names the model's own rules", () => {
    const s = buildSystemInstruction({ kind: "type", type: "INFJ" });
    expect(s).toContain("EASE IS DIRECTIONAL");
    expect(s).toContain("FOUR SIDES OF THE MIND");
    expect(s).toContain("THE TWO GROWTH READINGS ARE NOT RECONCILED");
    expect(s).toContain("INFJ");
  });

  it("never leaks a key or a raw endpoint into the prompt", () => {
    const s = buildSystemInstruction({ kind: "home" });
    expect(s).not.toMatch(/AIza|AQ\.|api[_-]?key/i);
  });

  it("produces a context block for every screen without throwing", () => {
    for (const t of TYPES) {
      expect(buildSystemInstruction({ kind: "type", type: t }).length).toBeGreaterThan(500);
    }
    expect(buildSystemInstruction({ kind: "pair", a: "ENTP", b: "ISFJ" }).length).toBeGreaterThan(500);
    expect(buildSystemInstruction({
      kind: "network",
      members: [{ name: "A", type: "ENTP" }, { name: "B", type: "INTJ" }],
    })).toContain("Pairwise");
    expect(buildSystemInstruction({ kind: "learn", stage: 3, title: "Your top four" })).toContain("stage 3");
    expect(buildSystemInstruction({ kind: "matrix" })).toContain("matrix");
    expect(buildSystemInstruction({ kind: "lexicon" })).toContain("lexicon");
    expect(buildSystemInstruction({ kind: "calculator", best: null })).toContain("calculator");
  });

  it("describes the relation both ways round for asymmetric pairs", () => {
    // ENTP supervises ESFJ in one direction only.
    const pair = TYPES.flatMap((a) => TYPES.map((b) => [a, b] as const))
      .find(([a, b]) => REL[a][b] === "SR")!;
    const facts = pairFacts(pair[0], pair[1]).join("\n");
    expect(facts).toContain("NO — this relation runs differently in each direction");
  });

  it("names the reader's own stack slots rather than generic advice", () => {
    const facts = typeFacts("ISFJ").join("\n");
    for (const fn of stack("ISFJ")) expect(facts).toContain(fn);
  });
});

/* Renaming a display label must never silently drop a pair-page row.
 *
 * compareAspects keys its pairing lookups by lexicon id. It used to derive
 * that id by slugifying the DISPLAY label, which couples the pairing tables
 * to the copy: rename "Infantile" to "Playful" and every romance lookup
 * misses, so the rows vanish from the pair page with nothing failing —
 * pairing comes back null and the view filters nulls out. It now resolves
 * through the entry alias to the canonical id instead. */
describe("pairings survive a display rename", () => {
  const NEVER_NULL = ["Quadra", "Temperament", "Interaction style", "Romance style"];

  it.each(NEVER_NULL)("%s resolves a pairing for every ordered pair", (aspect) => {
    const misses: string[] = [];
    for (const a of TYPES) {
      for (const b of TYPES) {
        const row = compareAspects(a, b).find((r) => r.aspect === aspect);
        if (!row?.pairing) misses.push(`${a}->${b}`);
      }
    }
    expect(misses.slice(0, 5)).toEqual([]);
  });

  it("resolves ids that are real entries, not slugified labels", () => {
    const row = compareAspects("ENTP", "ESTJ").find((r) => r.aspect === "Romance style")!;
    const ids = new Set(ENTRIES.map((e) => e.id));
    expect(ids.has(row.aId)).toBe(true);
    expect(ids.has(row.bId)).toBe(true);
  });
});

/* The pair page has two people on it, so second-person copy is ambiguous
   there. SLOT_PLAIN stays second-person for the type page; SLOT_ABOUT is the
   same eight slots with the owner named. */
describe("slot copy written from outside", () => {
  it("covers exactly the eight slots", () => {
    expect(Object.keys(SLOT_ABOUT).sort()).toEqual([...SLOT_NAMES].sort());
  });

  it("names the type instead of saying 'you' or 'your'", () => {
    for (const slot of SLOT_NAMES) {
      const line = slotAbout(slot, "ENTP");
      expect(line, slot).toContain("ENTP");
      expect(line, `${slot} still addresses the reader`).not.toMatch(/\byou\b|\byour\b/i);
    }
  });

  it("substitutes every occurrence of the placeholder", () => {
    for (const slot of SLOT_NAMES) {
      expect(slotAbout(slot, "INFJ"), slot).not.toContain("{who}");
    }
  });

  it("keeps the second-person originals intact for the type page", () => {
    for (const slot of SLOT_NAMES) expect(SLOT_PLAIN[slot]).toMatch(/\bYou\b|\bYour\b/);
  });

  it("returns empty rather than throwing on an unknown slot", () => {
    expect(slotAbout("Nonesuch", "ENTP")).toBe("");
  });
});
