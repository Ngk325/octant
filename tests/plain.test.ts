import { describe, expect, it } from "vitest";
import { TYPES, REL, stack } from "../src/engine/core";
import { ENTRIES } from "../src/engine/lexicon";
import {
  PLAIN_BY_ID, FN_PLAIN, SLOT_PLAIN, REL_PLAIN, QUADRA_PLAIN, GATE_PLAIN,
  COIN_PLAIN, CONCEPT_PLAIN, SIDE_PLAIN,
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

  it("covers all 88 entries", () => {
    expect(ENTRIES).toHaveLength(88);
    for (const e of ENTRIES) expect(PLAIN_BY_ID[e.id], e.id).toBeTruthy();
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
      .filter(([id, text]) => id !== "model-a" && banned.test(text))
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
    expect(facts).toContain("gateway Si");           // the Inferior
    expect(facts).toContain("OPS demons: Si");       // corrected demons
    expect(facts).toContain("Energy-dominant");
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
    expect(s).toContain("CSJ AND OPS ARE NOT RECONCILED");
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
