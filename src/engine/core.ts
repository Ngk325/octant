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
/** The type that leads with `d` and supports with `x`. Every (dom, aux) pair is a type. */
export const fromPair = (d: Fn, x: Fn): MbtiType => BY_PAIR.get(`${d}|${x}`)!;

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

/* The four sides of the mind are built on these same involutions — see sides.ts. */

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

/**
 * The two types whose Hero is your Nemesis function.
 * Always resolves to your Extinguishment and Mirage partners, because both are
 * built from alpha(dominant) -- which is exactly slot 5. Where Complements supply
 * the function you FEAR, Catalysts supply the one you are consciously reaching
 * for and reflexively arguing with: stimulating rather than restful.
 */
export const catalysts = (t: MbtiType): MbtiType[] => {
  const nemesis = stack(t)[4];
  return TYPES.filter((p) => DOM_AUX[p][0] === nemesis);
};

/* The OPS overlay — saviors, demons and the animal stack — lives in ops.ts. */

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

/* The eight coins and the type calculator are OPS-derived — see ops.ts. */

export { TYPES, DOM_AUX, REL_SCORE, RECIPROCAL, COIN_LABELS, DETERMINING, CONFIRMING };
export type { MbtiType, Fn, RelCode };
