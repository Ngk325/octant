import {
  TYPES, DOM_AUX, type MbtiType, type Fn, type RelCode,
  REL_SCORE, RECIPROCAL, COIN_LABELS, DETERMINING, CONFIRMING,
} from "./data";

/* ------------------------------------------------------------------ *
 * The whole model is a pure function of sixteen (dominant, auxiliary)
 * pairs and three involutions on the eight information elements.
 * ------------------------------------------------------------------ */

/** flip attitude, keep element */
export const alpha: Record<Fn, Fn> = {
  Ne: "Ni", Ni: "Ne", Se: "Si", Si: "Se", Te: "Ti", Ti: "Te", Fe: "Fi", Fi: "Fe",
};
/** swap element, keep attitude */
export const beta: Record<Fn, Fn> = {
  Ne: "Se", Se: "Ne", Ni: "Si", Si: "Ni", Te: "Fe", Fe: "Te", Ti: "Fi", Fi: "Ti",
};
/** flip both — the Model A opposite */
export const omega: Record<Fn, Fn> = {
  Ne: "Si", Si: "Ne", Ni: "Se", Se: "Ni", Te: "Fi", Fi: "Te", Ti: "Fe", Fe: "Ti",
};

const BY_PAIR = new Map<string, MbtiType>(
  TYPES.map((t) => [DOM_AUX[t].join("|"), t]),
);
const fromPair = (d: Fn, x: Fn): MbtiType => BY_PAIR.get(`${d}|${x}`)!;

export const isObserver = (f: Fn) => f[0] === "N" || f[0] === "S";
export const isExtraverted = (f: Fn) => f[1] === "e";

/** Full eight-slot Beebe stack: Hero Parent Child Inferior | Nemesis Critic Trickster Demon */
export function stack(t: MbtiType): Fn[] {
  const [d, x] = DOM_AUX[t];
  return [d, x, omega[x], omega[d], alpha[d], alpha[x], beta[x], beta[d]];
}

export type Quadra = "Alpha" | "Beta" | "Gamma" | "Delta";
export function quadra(t: MbtiType): Quadra {
  const ego = new Set(stack(t).slice(0, 4));
  const has = (...f: Fn[]) => f.every((x) => ego.has(x));
  if (has("Ne", "Si", "Ti", "Fe")) return "Alpha";
  if (has("Se", "Ni", "Ti", "Fe")) return "Beta";
  if (has("Se", "Ni", "Te", "Fi")) return "Gamma";
  return "Delta";
}

/** Ego / Subconscious / Unconscious / Superego */
export function fourSides(t: MbtiType): [MbtiType, MbtiType, MbtiType, MbtiType] {
  const [d, x] = DOM_AUX[t];
  return [t, fromPair(omega[d], omega[x]), fromPair(alpha[d], alpha[x]), fromPair(beta[d], beta[x])];
}

/* ---------------------------- relations ---------------------------- */
/** Each operator returns the partner standing in that relation to (d, x). */
const REL_OPS: Record<RelCode, (d: Fn, x: Fn) => [Fn, Fn]> = {
  ID: (d, x) => [d, x],
  MI: (d, x) => [x, d],
  EX: (d, x) => [alpha[d], alpha[x]],
  QI: (d, x) => [alpha[x], alpha[d]],
  DU: (d, x) => [omega[d], omega[x]],
  AC: (d, x) => [omega[x], omega[d]],
  SE: (d, x) => [beta[d], beta[x]],
  CF: (d, x) => [beta[x], beta[d]],
  KD: (d, x) => [d, beta[x]],
  BU: (d, x) => [beta[d], x],
  HD: (d, x) => [omega[d], alpha[x]],
  MG: (d, x) => [alpha[d], omega[x]],
  SR: (d, x) => [beta[x], d],   // partner supervises subject
  SV: (d, x) => [x, beta[d]],   // subject supervises partner
  BR: (d, x) => [omega[x], alpha[d]], // partner is subject's benefactor
  BE: (d, x) => [alpha[x], omega[d]], // partner is subject's beneficiary
};

/** REL[target][perspective] — the code names WHAT THE PERSPECTIVE IS TO THE TARGET. */
export const REL: Record<MbtiType, Record<MbtiType, RelCode>> = (() => {
  const out = {} as Record<MbtiType, Record<MbtiType, RelCode>>;
  for (const t of TYPES) {
    const [d, x] = DOM_AUX[t];
    const row = {} as Record<MbtiType, RelCode>;
    for (const code of Object.keys(REL_OPS) as RelCode[]) {
      const [pd, px] = REL_OPS[code](d, x);
      row[fromPair(pd, px)] = code;
    }
    out[t] = row;
  }
  return out;
})();

export const relation = (target: MbtiType, perspective: MbtiType): RelCode =>
  REL[target][perspective];

/** Ease for `target`, given how `perspective` stands to them. Asymmetric by design. */
export const ease = (target: MbtiType, perspective: MbtiType): number =>
  REL_SCORE[REL[target][perspective]];

export const complements = (t: MbtiType): MbtiType[] =>
  TYPES.filter((p) => REL[t][p] === "DU").concat(TYPES.filter((p) => REL[t][p] === "AC"));

export const frictions = (t: MbtiType): MbtiType[] =>
  TYPES.filter((p) => REL[t][p] === "CF").concat(TYPES.filter((p) => REL[t][p] === "SE"));

/* ------------------------------- OPS ------------------------------- */
export type Animal = "Play" | "Blast" | "Consume" | "Sleep";

const animalOf = (obs: Fn, dec: Fn): Animal => {
  const oe = isExtraverted(obs), de = isExtraverted(dec);
  if (oe && !de) return "Play";
  if (!oe && de) return "Blast";
  if (oe && de) return "Consume";
  return "Sleep";
};

export interface OpsSignature {
  saviorObs: Fn; saviorDec: Fn; demonObs: Fn; demonDec: Fn;
  primary: Animal; demon: Animal; middles: Animal[]; stack: string;
}

export function ops(t: MbtiType): OpsSignature {
  const [d, x] = DOM_AUX[t];
  const saviorObs = isObserver(d) ? d : x;
  const saviorDec = isObserver(d) ? x : d;
  const demonObs = alpha[saviorObs], demonDec = alpha[saviorDec];
  const primary = animalOf(saviorObs, saviorDec);
  const demon = animalOf(demonObs, demonDec);
  const middles = [animalOf(saviorObs, demonDec), animalOf(demonObs, saviorDec)].sort();
  return {
    saviorObs, saviorDec, demonObs, demonDec, primary, demon, middles,
    // middle ordering is the deferred fine-coin layer
    stack: `${primary[0]}-[${middles[0][0]}/${middles[1][0]}]-[${middles[1][0]}/${middles[0][0]}]-${demon[0]}`,
  };
}

/* ------------------------------ gates ------------------------------ */
export interface Gate { gate: string; fear: string; cave: string; treasure: string }

export function gate(t: MbtiType): Gate {
  const grp = `${t[0]}${t[3]}`;
  const inf = stack(t)[3];
  switch (grp) {
    case "IJ": return { gate: "Gate of Chaos", fear: "Unpredictability / losing the plot",
      cave: `New experience taken raw (${inf})`, treasure: "Freedom / adaptability" };
    case "EP": return { gate: "Gate of Obligation", fear: "Being trapped, tied down, or bored",
      cave: `Routine, continuity and commitment (${inf})`, treasure: "Legacy / follow-through" };
    case "IP": return { gate: "Gate of the Tribe", fear: "Tribal rejection / being found incompetent",
      cave: `The tribe and its expectations (${inf})`, treasure: "Leadership / impact" };
    default: return { gate: "Gate of the Self", fear: "Internal emptiness / worthlessness",
      cave: `Sitting alone with yourself (${inf})`, treasure: "Authenticity / self-acceptance" };
  }
}

/* ------------------------------ coins ------------------------------ */
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

export { TYPES, DOM_AUX, REL_SCORE, RECIPROCAL, COIN_LABELS, DETERMINING, CONFIRMING };
export type { MbtiType, Fn, RelCode };
