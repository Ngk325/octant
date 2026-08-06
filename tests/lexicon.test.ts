import { describe, expect, it } from "vitest";
import { TYPES, quadra, gate, stack, type MbtiType } from "../src/engine/core";
import { ops, coins, ANIMAL_LABEL, type Animal } from "../src/engine/ops";
import { GROUP, INTERACTION_STYLE, DOM_AUX } from "../src/engine/data";
import { ENTRIES, BY_ID, type Entry } from "../src/engine/lexicon";

/* ------------------------------------------------------------------ *
 * THE LEXICON, HELD TO THE ENGINE.
 *
 * The definitions are prose, so most of them can only be reviewed by
 * reading. But a good number make CHECKABLE claims — this current is
 * always a middle one, that style is held by these four types — and
 * those had nothing holding them to the engine at all.
 *
 * They drifted. engine/ops.ts records that Play and Consume were found
 * transposed and corrected, with tests/ops.test.ts asserting the
 * correction from first principles; the lexicon was never updated to
 * match, so eight statements across seven entries described Charge
 * doing Absorb's job and vice versa — including "every xxxP type is
 * Charge-primary", when Charge is never primary for anyone.
 *
 * Every assertion below DERIVES the truth and then looks for it in the
 * text, rather than restating a list that would drift in the same way.
 * ------------------------------------------------------------------ */

const say = (e: Entry) => `${e.short} ${e.definition} ${e.inSystem ?? ""}`;
const entry = (id: string) => BY_ID.get(id)!;

/** The animals that ever hold each position, computed across all sixteen. */
const positions = () => {
  const primary = new Set<Animal>(), last = new Set<Animal>(), middle = new Set<Animal>();
  for (const t of TYPES) {
    const o = ops(t);
    primary.add(o.doubleSavior);
    last.add(o.doubleDemon);
    o.middles.forEach((m) => { middle.add(m); });
  }
  return { primary, last, middle };
};

describe("the currents say what the engine computes", () => {
  const { primary, last, middle } = positions();
  const label = (s: Set<Animal>) => [...s].map((a) => ANIMAL_LABEL[a]).sort();

  it("an entry only claims to be a middle current if it always is one", () => {
    for (const a of ["Play", "Blast", "Consume", "Sleep"] as Animal[]) {
      const id = { Play: "play", Blast: "blast", Consume: "consume", Sleep: "sleep" }[a];
      const text = say(entry(id));
      const alwaysMiddle = middle.has(a) && !primary.has(a) && !last.has(a);
      if (/middle current/i.test(text)) {
        expect(alwaysMiddle, `${ANIMAL_LABEL[a]} calls itself a middle current`).toBe(true);
      }
      if (alwaysMiddle) {
        expect(text, `${ANIMAL_LABEL[a]} is always a middle current and should say so`)
          .toMatch(/middle current/i);
      }
    }
  });

  it("only the animals that can lead are described as primary, and for the right types", () => {
    for (const t of ["P", "J"] as const) {
      const leader = ANIMAL_LABEL[ops(TYPES.find((x) => x[3] === t)!).doubleSavior];
      const ender = ANIMAL_LABEL[ops(TYPES.find((x) => x[3] === t)!).doubleDemon];
      // every type with this letter agrees — the claim is about all of them
      for (const x of TYPES.filter((x) => x[3] === t)) {
        expect(ANIMAL_LABEL[ops(x).doubleSavior]).toBe(leader);
        expect(ANIMAL_LABEL[ops(x).doubleDemon]).toBe(ender);
      }
      const primaryClaim = new RegExp(`xxx${t} type is ${leader}-primary`);
      const lastClaim = new RegExp(`xxx${t} type (?:has ${ender} as its last current|ends on ${ender})`);
      const all = ENTRIES.map(say).join(" ");
      expect(all, `something should say xxx${t} leads on ${leader}`).toMatch(primaryClaim);
      expect(all, `something should say xxx${t} ends on ${ender}`).toMatch(lastClaim);
    }
  });

  it("no entry names a current in a position it never holds", () => {
    const all = ENTRIES.map(say).join(" ");
    for (const a of ["Play", "Blast", "Consume", "Sleep"] as Animal[]) {
      const name = ANIMAL_LABEL[a];
      if (!primary.has(a)) {
        expect(all, `${name} is never primary`).not.toMatch(new RegExp(`${name}-primary`));
      }
      if (!last.has(a)) {
        expect(all, `${name} is never last`).not.toMatch(new RegExp(`ends on ${name}`));
      }
    }
    expect(label(middle)).toEqual(["Charge", "Settle"]);
    expect(label(primary)).toEqual(["Absorb", "Broadcast"]);
  });
});

describe("membership claims name the right types", () => {
  /** Every type named in an entry's prose, as a set. */
  const named = (e: Entry) =>
    new Set((say(e).match(/\b[EI][NS][TF][JP]\b/g) ?? []) as MbtiType[]);

  const check = (id: string, actual: MbtiType[]) => {
    const claimed = named(entry(id));
    if (claimed.size === 0) return; // the entry does not list types; nothing to check
    expect([...claimed].sort(), `${id} names exactly its members`).toEqual([...actual].sort());
  };

  it("temperaments", () => {
    for (const id of ["nt", "nf", "sj", "sp"]) {
      const term = entry(id).term;
      check(id, TYPES.filter((t) => GROUP[t] === term));
    }
  });

  it("interaction styles", () => {
    for (const id of ["in-charge", "chart-the-course", "get-things-going", "behind-the-scenes"]) {
      check(id, TYPES.filter((t) => INTERACTION_STYLE[t] === entry(id).term));
    }
  });

  it("gates, and the caves they collapse from", () => {
    for (const id of ["gate-of-chaos", "gate-of-obligation", "gate-of-the-tribe", "gate-of-the-self"]) {
      const holders = TYPES.filter((t) => gate(t).gate === entry(id).term);
      check(id, holders);
      const caves = new Set(holders.map((t) => stack(t)[3]));
      for (const fn of caves) {
        expect(say(entry(id)), `${id} names its cave ${fn}`).toContain(fn);
      }
    }
  });

  it("quadras", () => {
    for (const id of ["alpha", "beta", "gamma", "delta"]) {
      check(id, TYPES.filter((t) => quadra(t) === entry(id).term));
    }
  });
});

describe("the switch poles describe the right split", () => {
  it("Direct and Informative each name a set that covers their types", () => {
    /* The prose groups types by letter shorthand (NJ, STP, SF…) rather than
       listing sixteen, so expand the shorthand and compare as sets. This is
       what caught "NP, SFJ and EFJ": ENFJ is Direct, and SFP was missing. */
    const expand = (text: string): Set<MbtiType> => {
      const out = new Set<MbtiType>();
      /* "Held by the NJ, STP and STJ types" — one phrase, several tokens.
         Matching only the token adjacent to "types" reads just the last of
         them, which silently passes any claim whose error is earlier in the
         list. Take the whole phrase and split it. */
      for (const m of text.matchAll(/\bthe ((?:[EINSTFJP]{2,4}[,\s]*(?:and\s*)?)+) types\b/g)) {
        for (const pat of m[1].split(/[,\s]+|and/).filter(Boolean)) {
          for (const t of TYPES) {
            if ([...pat].every((ch) => t.includes(ch))) out.add(t);
          }
        }
      }
      return out;
    };
    for (const [id, pole] of [["direct", "Direct"], ["informative", "Informative"]] as const) {
      const actual = new Set(TYPES.filter((t) => coins(t)[6] === pole));
      const claimed = expand(entry(id).definition);
      expect([...claimed].sort(), `${id} covers exactly its types`).toEqual([...actual].sort());
    }
  });

  it("Observer and Decider narrow to the letter patterns they claim", () => {
    for (const [id, pole] of [["observer", "Observer"], ["decider", "Decider"]] as const) {
      const actual = TYPES.filter((t) => coins(t)[0] === pole);
      const pats = [...entry(id).definition.matchAll(/\b([EI]xx[JP])\b/g)].map((m) => m[1]);
      expect(pats.length, `${id} names its patterns`).toBeGreaterThan(0);
      const covered = TYPES.filter((t) =>
        pats.some((p) => p[0] === t[0] && p[3] === t[3]));
      expect(covered.sort(), `${id} narrows to ${pats.join(" or ")}`).toEqual([...actual].sort());
    }
  });
});

describe("the lexicon is internally sound", () => {
  it("every seeAlso points at an entry that exists", () => {
    for (const e of ENTRIES) {
      for (const s of e.seeAlso ?? []) {
        expect(BY_ID.has(s), `${e.id} → ${s}`).toBe(true);
      }
    }
  });

  it("every entry carries a plain gloss", () => {
    for (const e of ENTRIES) {
      expect(e.plain.length, `${e.id} has a plain gloss`).toBeGreaterThan(0);
    }
  });

  it("ids are unique", () => {
    const ids = ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("the Counterpart claim on the Cave holds for every type", () => {
    // "Their Counterpart supplies precisely this function as their Lead."
    for (const t of TYPES) {
      const du = TYPES.find((x) => quadra(x) !== undefined && stack(t)[3] === DOM_AUX[x][0]);
      expect(du, `${t}'s cave ${stack(t)[3]} is somebody's lead`).toBeDefined();
    }
  });
});
