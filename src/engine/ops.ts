import { omega, isObserver, isExtraverted, stack } from "./core";
import {
  TYPES, DOM_AUX, COIN_LABELS, DETERMINING, CONFIRMING,
  type MbtiType, type Fn,
} from "./data";

/* ------------------------------------------------------------------ *
 * THE OPS OVERLAY
 *
 * Objective Personality reads the same four ego functions as a pair of
 * SAVIORS (trusted, effortless, shrugged off) and a pair of DEMONS
 * (distrusted, effortful, defended). Two corrections against the
 * retired Python reference engine are baked in here; both are asserted
 * from first principles in tests/ops.test.ts.
 *
 *   1. The demon functions are the MODEL A OPPOSITES of the saviors --
 *      omega, not alpha. Savior Ne/Ti demons to Si/Fe, not Ni/Te.
 *      OPS's four functions are exactly MBTI's top four: saviors are
 *      dominant + auxiliary, demons are tertiary + inferior. The old
 *      code reached into the shadow block, which OPS does not model.
 *      Source: OPS "Savior vs Demon Functions" -- "you cannot have two
 *      observing saviors"; savior Ne/Ti -> demon Si/Fe.
 *
 *   2. Play and Consume were transposed. The published definitions are
 *      Play = Oe+De and Consume = Oe+Di, so the two ENERGY animals are
 *      the attitude-pure ones and the two INFORMATION animals are the
 *      mixed ones. The old table had it the other way round, which
 *      mislabelled the primary animal of all sixteen types.
 *
 * Both errors flow from the same place and neither touches the 4-bit
 * head, so no relation, score or playbook changes.
 * ------------------------------------------------------------------ */

export type Animal = "Play" | "Blast" | "Consume" | "Sleep";
export type AnimalKind = "Energy" | "Information";

/**
 * An animal is one observer attitude bolted to one decider attitude.
 *   Play    Oe + De   expend energy outward           ENERGY
 *   Sleep   Oi + Di   conserve and process inward     ENERGY
 *   Blast   Oi + De   organise inside, broadcast out  INFORMATION
 *   Consume Oe + Di   gather outside, digest inside   INFORMATION
 */
export function animalOf(obs: Fn, dec: Fn): Animal {
  const oe = isExtraverted(obs), de = isExtraverted(dec);
  if (oe && de) return "Play";
  if (!oe && !de) return "Sleep";
  if (!oe && de) return "Blast";
  return "Consume";
}

export const ANIMAL_KIND: Record<Animal, AnimalKind> = {
  Play: "Energy", Sleep: "Energy", Blast: "Information", Consume: "Information",
};

export const ANIMAL_DOES: Record<Animal, string> = {
  Play: "Expends energy outward with people. Doing the thing, together, now.",
  Sleep: "Conserves and processes energy alone. Recharging, digesting, sitting with it.",
  Blast: "Pushes information out. Teaching, directing, starting things, declaring.",
  Consume: "Pulls information in. Learning, researching, taking it all in before moving.",
};

export const ANIMAL_LETTER: Record<Animal, string> = {
  Play: "P", Blast: "B", Consume: "C", Sleep: "S",
};

/* --------------------------- savior / demon --------------------------- */

export const SAVIOR_STATE =
  "Obvious, easy, matter-of-fact. You can do it again tomorrow, you feel responsible for it, " +
  "and criticism of it slides off — you already know you are fine here.";

export const DEMON_STATE =
  "Nervous, awkward, showing off, proving yourself. You do not feel responsible for it, you " +
  "put it off until later, and criticism of it lands as a verdict on you rather than the work.";

/**
 * The three tells for each side, which are far easier to spot in yourself than
 * the general descriptions above. Structure from the OPS coin sheet (IMG_7589);
 * see docs/transcripts/IMG_7589-ops-coins.md.
 */
export interface Marker { name: string; says: string; note: string }

export const SAVIOR_MARKERS: Marker[] = [
  { name: "Responsible", says: "I'm responsible, so this is where I spend my time.",
    note: "You take ownership here without being asked, and without noticing you did." },
  { name: "Confidence", says: "I can work through the struggles here.",
    note: "Difficulty in this area reads as a problem to solve, not as evidence about you." },
  { name: "Obvious", says: "Let me just do that for you — thank me later.",
    note: "It is so easy you assume anyone could, which is exactly why you undervalue it." },
];

export const DEMON_MARKERS: Marker[] = [
  { name: "Tidalwaves", says: "I'm not responsible for this — someone else is.",
    note: "The whole area feels like weather happening to you rather than something you steer." },
  { name: "Fear / Pain", says: "Why does this keep happening to me?",
    note: "The same failure recurs and reads as fate rather than as a skill you have not built." },
  { name: "Peacocking", says: "I secretly want to be good at this.",
    note: "You show off here rather than work here — the wanting is real, the practice is not." },
];

export interface Subtype {
  /**
   * OPS's other sixteen. A jumper's saviors are dominant + TERTIARY rather than
   * dominant + auxiliary, so both saviors share an attitude. Not derivable from
   * the 4-bit head — self-reported.
   */
  jumper?: boolean;
  /** Which of the two mixed animals joins the savior pair. Free coin. */
  secondSavior?: Animal;
  /** Whether the double-savior animal leads, or the other savior animal does. Free coin. */
  lead?: "double-savior" | "second-savior";
  /** Modality: how sensory information is held. Free coin. */
  sensory?: "M" | "F";
  /** Modality: whether the extraverted decider pushes out or draws in. Free coin. */
  decider?: "M" | "F";
}

export interface AnimalSlot {
  animal: Animal;
  obs: Fn;
  dec: Fn;
  kind: AnimalKind;
  /** 1-4 once the free coins are set; null while the ordering is still open. */
  position: number | null;
  /** What this position means in OPS. `open` = the free coin that decides has not been set. */
  role: "savior" | "activated" | "last" | "open";
  /** Whether this slot's position falls out of the structure or needs a coin. */
  certainty: "derived" | "free";
  note: string;
}

export interface OpsSignature {
  saviorObs: Fn;
  saviorDec: Fn;
  demonObs: Fn;
  demonDec: Fn;
  /** The animal built from both saviors. Always in the savior pair. */
  doubleSavior: Animal;
  /** The animal built from both demons. Always last — the "missing" animal. */
  doubleDemon: Animal;
  /** The two mixed animals; one joins the savior pair, the other is the hobby animal. */
  middles: [Animal, Animal];
  /** The four animals in order, as far as the set coins allow. */
  animals: AnimalSlot[];
  /** Energy-dominant iff the last animal is an information animal. */
  dominance: AnimalKind;
  /** Fully-ordered stack string, or a partial one with `?` where a coin is unset. */
  stackCode: string;
  /** The full OPS code, e.g. `MM-Ne/Ti-PC/S(B)`. */
  code: string;
  jumper: boolean;
  /** Which free coins are still unset. */
  unset: string[];

  /** @deprecated kept so older call sites still read; equals `doubleSavior`. */
  primary: Animal;
  /** @deprecated kept so older call sites still read; equals `doubleDemon`. */
  demon: Animal;
}

export function ops(t: MbtiType, sub: Subtype = {}): OpsSignature {
  const [d, x] = DOM_AUX[t];
  const st = stack(t);

  // Saviors. Standard: dominant + auxiliary. Jumper: dominant + tertiary.
  const jumper = !!sub.jumper;
  const secondFn = jumper ? st[2] : x;
  const saviorObs = isObserver(d) ? d : secondFn;
  const saviorDec = isObserver(d) ? secondFn : d;

  // Demons are the Model A opposites — same axis, both element and attitude flipped.
  const demonObs = omega[saviorObs];
  const demonDec = omega[saviorDec];

  const doubleSavior = animalOf(saviorObs, saviorDec);
  const doubleDemon = animalOf(demonObs, demonDec);
  const midA = animalOf(saviorObs, demonDec);
  const midB = animalOf(demonObs, saviorDec);
  const middles: [Animal, Animal] = [midA, midB];

  const pairOf: Record<Animal, [Fn, Fn]> = {
    [doubleSavior]: [saviorObs, saviorDec],
    [doubleDemon]: [demonObs, demonDec],
    [midA]: [saviorObs, demonDec],
    [midB]: [demonObs, saviorDec],
  } as Record<Animal, [Fn, Fn]>;

  // Position 4 is always the double-demon animal; the double-savior animal is
  // always in the top pair. Which mixed animal joins it, and which of the two
  // leads, are the two free coins that take OPS from 32 types to 128.
  const secondSavior =
    sub.secondSavior && middles.includes(sub.secondSavior) ? sub.secondSavior : undefined;
  const third = secondSavior ? middles.find((m) => m !== secondSavior)! : undefined;

  let ordered: Animal[] = [];
  if (secondSavior && sub.lead) {
    ordered = sub.lead === "double-savior"
      ? [doubleSavior, secondSavior, third!, doubleDemon]
      : [secondSavior, doubleSavior, third!, doubleDemon];
  } else if (secondSavior) {
    ordered = [doubleSavior, secondSavior, third!, doubleDemon];
  }

  const posOf = (a: Animal): number | null => {
    if (!secondSavior) return a === doubleDemon ? 4 : null;
    const i = ordered.indexOf(a);
    return i < 0 ? null : i + 1;
  };

  const roleOf = (a: Animal): AnimalSlot["role"] => {
    if (a === doubleDemon) return "last";
    if (a === doubleSavior) return "savior";
    if (!secondSavior) return "open";
    return a === secondSavior ? "savior" : "activated";
  };

  const NOTES: Record<AnimalSlot["role"], string> = {
    savior: "Savior animal. Trusted, used constantly, and rarely thought about.",
    activated: "The activated or hobby animal. A demon you use anyway, and the easiest place to grow.",
    last: "The last or missing animal. Barely used without deliberate effort, and the sorest spot.",
    open: "Undecided. One of these two joins the savior pair and the other becomes the hobby animal — that is a coin you set, not something the type determines.",
  };

  const listed: Animal[] = secondSavior
    ? ordered
    : [doubleSavior, middles[0], middles[1], doubleDemon];

  const animals: AnimalSlot[] = listed.map((a) => ({
    animal: a,
    obs: pairOf[a][0],
    dec: pairOf[a][1],
    kind: ANIMAL_KIND[a],
    position: posOf(a),
    role: roleOf(a),
    certainty: a === doubleDemon || a === doubleSavior ? "derived" : "free",
    note: NOTES[roleOf(a)],
  }));

  // "Info dominant" means both information animals sit in the top three, which
  // is the same as saying an energy animal is last. For the sixteen types whose
  // saviors run opposite attitudes, the last animal is always an information
  // animal -- so every non-jumper is energy-dominant, and every jumper is
  // info-dominant. That is exactly the line this app's 16-type core sits on.
  const dominance: AnimalKind = ANIMAL_KIND[doubleDemon] === "Information" ? "Energy" : "Information";

  const L = (a: Animal | undefined) => (a ? ANIMAL_LETTER[a] : "?");
  const stackCode = secondSavior
    ? `${L(ordered[0])}${L(ordered[1])}/${L(ordered[2])}(${L(ordered[3])})`
    : `${L(doubleSavior)}?/?(${L(doubleDemon)})`;

  const mod = `${sub.sensory ?? "?"}${sub.decider ?? "?"}`;
  const code = `${mod}-${saviorObs}/${saviorDec}-${stackCode}`;

  const unset: string[] = [];
  if (!secondSavior) unset.push("second savior animal");
  if (!sub.lead) unset.push("info vs energy lead");
  if (!sub.sensory) unset.push("sensory modality");
  if (!sub.decider) unset.push("decider modality");

  return {
    saviorObs, saviorDec, demonObs, demonDec,
    doubleSavior, doubleDemon, middles, animals, dominance,
    stackCode, code, jumper, unset,
    primary: doubleSavior, demon: doubleDemon,
  };
}

/** The animal that is the reader's growth edge — the hobby animal if known, else the last one. */
export function growthAnimal(sig: OpsSignature): AnimalSlot {
  return sig.animals.find((a) => a.role === "activated") ?? sig.animals[sig.animals.length - 1];
}

/* ------------------------------ coins ------------------------------ */
/* The eight coins are read off the OPS saviors, so they live here. */

const DIRECTING = new Set<MbtiType>([
  "ESTJ", "ENTJ", "ISTJ", "INTJ", "ESTP", "ISTP", "ENFJ", "INFJ",
]);

export function coins(t: MbtiType): string[] {
  const [d] = DOM_AUX[t];
  const o = ops(t);
  const c1 = isObserver(d) ? "Observer" : "Decider";
  const c2 = isExtraverted(o.saviorDec) ? "Tribe" : "Identity";
  const c3 = isExtraverted(o.saviorObs) ? "Gather" : "Organize";
  const c4 = o.saviorDec[0] === "T" ? "Thinking" : "Feeling";
  const c5 = o.saviorObs[0] === "N" ? "iNtuition" : "Sensing";
  const c6 = t[0] === "E" ? "Initiating" : "Responding";
  const c7 = DIRECTING.has(t) ? "Direct" : "Informative";
  const c8 = (c6 === "Initiating") === (c7 === "Direct") ? "Control" : "Movement";
  return [c1, c2, c3, c4, c5, c6, c7, c8];
}

export const COIN_OPTIONS: [string, string][] = [
  ["Observer", "Decider"], ["Identity", "Tribe"], ["Organize", "Gather"],
  ["Thinking", "Feeling"], ["Sensing", "iNtuition"], ["Initiating", "Responding"],
  ["Direct", "Informative"], ["Control", "Movement"],
];

export interface CalcResult {
  ranked: { type: MbtiType; determining: number; confirming: number; score: number }[];
  best: MbtiType | null;
  determiningAnswered: number;
  confirmingAnswered: number;
  confirmingAgreed: number;
  status: "incomplete" | "tie" | "friction" | "resolved";
  conflicts: { index: number; label: string; said: string; predicted: string }[];
  field: MbtiType[];
}

/** Weighted scoring, not an AND-filter: always narrows, never returns nothing. */
export function calculate(answers: (string | null)[]): CalcResult {
  const ranked = TYPES.map((type) => {
    const c = coins(type);
    let determining = 0, confirming = 0, score = 0;
    DETERMINING.forEach((i) => { if (answers[i] && answers[i] === c[i]) { determining++; score += 10; } });
    CONFIRMING.forEach((i) => { if (answers[i] && answers[i] === c[i]) { confirming++; score += 1; } });
    return { type, determining, confirming, score };
  }).sort((a, b) => b.score - a.score || TYPES.indexOf(a.type) - TYPES.indexOf(b.type));

  const determiningAnswered = DETERMINING.filter((i) => !!answers[i]).length;
  const confirmingAnswered = CONFIRMING.filter((i) => !!answers[i]).length;
  const top = ranked[0];
  const tied = ranked.filter((r) => r.score === top.score);

  // the surviving field on determining coins alone
  const field = TYPES.filter((t) => {
    const c = coins(t);
    return DETERMINING.every((i) => !answers[i] || answers[i] === c[i]);
  });

  let status: CalcResult["status"];
  if (determiningAnswered < DETERMINING.length) status = "incomplete";
  else if (tied.length > 1) status = "tie";
  else if (top.confirming < confirmingAnswered) status = "friction";
  else status = "resolved";

  const best = status === "incomplete" ? null : top.type;
  const conflicts = best
    ? CONFIRMING.flatMap((i) => {
        const predicted = coins(best)[i];
        return answers[i] && answers[i] !== predicted
          ? [{ index: i, label: COIN_LABELS[i], said: answers[i]!, predicted }]
          : [];
      })
    : [];

  return { ranked, best, determiningAnswered, confirmingAnswered,
           confirmingAgreed: top.confirming, status, conflicts, field };
}
