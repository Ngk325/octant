import { ease, isExtraverted, isObserver, omega, quadra, relation, stack, type MbtiType, type Quadra } from "./core";
import { REL_SCORE, TYPES, type Fn, type RelCode } from "./data";

/* ------------------------------------------------------------------ *
 * BONDS — the high-compatibility pairings, stated by element rather
 * than by type.
 *
 * Every other pair surface in this system names four-letter types. That
 * is the wrong altitude for the question "who works well with whom",
 * because the answer is not about types at all: it is about which
 * element answers which. Two shapes of answer:
 *
 *   AXIS bonds — Lead meets Lead across `omega`, the axis opposite. The
 *   strongest signal in the model: bondFacts() sweeps all 240 ordered
 *   cross-type pairs, groups them by (lead, lead), and finds the four
 *   axis pairings averaging 93 of 100 — against 64 for same-lead, 54
 *   for attitude-flip, 40 for element-swap — producing only Counterpart
 *   and Near fit.
 *
 *   SPARK bonds — Lead meets Support, crosswise, on both axes at once.
 *   Each camp's two axes admit exactly one mesh, realised twice (once
 *   outward, once inward). sparkFacts() verifies the whole structure by
 *   sweep: both crossings holding is exactly the Spark relation (92 in
 *   both directions), and one crossing alone is exactly Upstream (54)
 *   or Downstream (48).
 *
 * Born as the print deck's Bond suit (src/cards/deck.ts) and lifted
 * here so the app can teach the same surface; nothing is asserted —
 * every number is recomputed from the engine, and tests fail if the
 * deck or the app ever disagree with it.
 * ------------------------------------------------------------------ */

const FN_ORDER: Fn[] = ["Ne", "Ni", "Se", "Si", "Te", "Ti", "Fe", "Fi"];
const QUADRA_ORDER: Quadra[] = ["Alpha", "Beta", "Gamma", "Delta"];

export interface BondFacts {
  a: Fn;
  b: Fn;
  /** Mean ease across every ordered pair of types whose Leads are these two. */
  mean: number;
  /** The relations these two Leads actually produce, best first. */
  rels: RelCode[];
  /** How far above the next-best class of lead pairing this one sits. */
  overNext: number;
}

/** The four axis pairings, with their ease read off the engine. */
export function bondFacts(): BondFacts[] {
  const cell = new Map<string, number[]>();
  for (const a of TYPES) {
    for (const b of TYPES) {
      if (a === b) continue;
      const k = `${stack(a)[0]}|${stack(b)[0]}`;
      (cell.get(k) ?? cell.set(k, []).get(k)!).push(ease(a, b));
    }
  }
  const meanOf = (k: string) => {
    const xs = cell.get(k)!;
    return xs.reduce((s, x) => s + x, 0) / xs.length;
  };
  // The best pairing class that is NOT the axis opposite, so a caller can say
  // how much daylight there is rather than just claiming the top spot.
  const next = Math.max(
    ...[...cell.keys()].filter((k) => {
      const [f, g] = k.split("|") as [Fn, Fn];
      return omega[f] !== g;
    }).map(meanOf),
  );

  const done = new Set<Fn>();
  const out: BondFacts[] = [];
  for (const a of FN_ORDER) {
    const b = omega[a];
    if (done.has(a)) continue;
    done.add(a).add(b);
    const rels = [...new Set(
      TYPES.flatMap((x) => TYPES.filter((y) => x !== y && stack(x)[0] === a && stack(y)[0] === b).map((y) => relation(x, y))),
    )].sort((p, q) => REL_SCORE[q] - REL_SCORE[p]);
    out.push({ a, b, mean: meanOf(`${a}|${b}`), rels, overNext: meanOf(`${a}|${b}`) - next });
  }
  return out;
}

/** One camp's crosswise mesh: its two axes, and the two type pairs that realise it. */
export interface SparkFacts {
  quadra: Quadra;
  /** The camp's observer axis and decider axis, outward pole first. */
  obs: [Fn, Fn];
  dec: [Fn, Fn];
  /** The two realisations, [a, b] with a leading the observer axis's pole. */
  outward: [MbtiType, MbtiType];
  inward: [MbtiType, MbtiType];
  /** Ease of every realised pair, both directions — asserted identical. */
  ease: number;
}

/**
 * The four crosswise meshes, one per camp, read off the engine. A mesh holds
 * when each Lead is answered by the other's SUPPORT rather than their Lead:
 * within a camp that picks out the two same-attitude pairs, and the sweep in
 * tests/cards.test.ts confirms the general fact both surfaces print — both
 * crossings at once is exactly Spark, one alone is Upstream or Downstream.
 */
export function sparkFacts(): SparkFacts[] {
  return QUADRA_ORDER.map((q) => {
    const members = TYPES.filter((t) => quadra(t) === q);
    const pairs: [MbtiType, MbtiType][] = [];
    for (const x of members) {
      for (const y of members) {
        if (x < y && relation(x, y) === "AC") pairs.push([x, y]);
      }
    }
    const shared = [...new Set(members.flatMap((t) => stack(t).slice(0, 2)))];
    const obs = shared.filter(isObserver).sort((x) => (isExtraverted(x) ? -1 : 1)) as [Fn, Fn];
    const dec = shared.filter((f) => !isObserver(f)).sort((x) => (isExtraverted(x) ? -1 : 1)) as [Fn, Fn];
    /** The pair whose leads face the given way, observer-lead first. */
    const facing = (outward: boolean) => {
      const p = pairs.find(([x]) => isExtraverted(stack(x)[0]) === outward)!;
      return (isObserver(stack(p[0])[0]) ? p : [p[1], p[0]]) as [MbtiType, MbtiType];
    };
    const outward = facing(true);
    const inward = facing(false);
    const scores = new Set([outward, inward].flatMap(([x, y]) => [ease(x, y), ease(y, x)]));
    if (scores.size !== 1) throw new Error(`spark ease is not uniform in ${q}`);
    return { quadra: q, obs, dec, outward, inward, ease: [...scores][0] };
  });
}
