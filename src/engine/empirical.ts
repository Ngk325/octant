import { REL, ease } from "./core";
import { REL_NAME, type MbtiType } from "./data";

/* ------------------------------------------------------------------ *
 * THE EMPIRICAL COUNTERWEIGHT
 *
 * A survey-derived 16x16 compatibility matrix from personalitydata.org,
 * used under CC BY 4.0 — the one item in the source batch whose licence
 * permits reuse. Transcribed from IMG_6099; see
 * docs/transcripts/IMG_6099-empirical-compatibility.md.
 *
 * It DISAGREES with this app's derived model, sharply and measurably:
 *
 *   Pearson r between the two             -0.154
 *   Duality pairs   — derived 100         survey mean  7.4%
 *   Identity pairs  — derived  74         survey mean 92.6%
 *   Symmetric?      — survey yes          derived no, by design
 *
 * That is not a bug in either. They answer different questions. The
 * survey measures self-reported LIKING, and people report liking people
 * like themselves. Socionics duality claims structural LOW FRICTION,
 * which is a different claim and arguably in tension with the first —
 * your Dual leads with the function you are most defensive about.
 *
 * It is here because the app's whole posture is that where two
 * instruments disagree, the divergence is the content. This is the
 * sharpest instance of that available, and it is quantified.
 * ------------------------------------------------------------------ */

export const EMPIRICAL_SOURCE = {
  name: "personalitydata.org",
  licence: "CC BY 4.0",
  what: "self-reported compatibility survey",
} as const;

/** Row/column order of the published table. */
const ORDER = [
  "ENFJ", "ENFP", "ENTJ", "ENTP", "ESFJ", "ESFP", "ESTJ", "ESTP",
  "INFJ", "INFP", "INTJ", "INTP", "ISFJ", "ISFP", "ISTJ", "ISTP",
] as const;

// Percentages as published. The table is symmetric; both halves are kept
// verbatim rather than mirrored, so a transcription slip would show up as an
// asymmetry — asserted in tests/empirical.test.ts.
const M: number[][] = [
  [86, 91, 42, 73, 64, 80, 22, 41, 74, 73, 16, 35, 30, 40, 18, 9],
  [91, 97, 37, 85, 42, 93, 27, 76, 51, 73, 13, 36, 11, 49, 4, 14],
  [42, 37, 91, 81, 53, 51, 87, 74, 25, 13, 46, 47, 29, 6, 66, 41],
  [73, 85, 81, 94, 32, 87, 70, 92, 11, 35, 22, 51, 5, 14, 11, 35],
  [64, 42, 53, 32, 94, 40, 77, 37, 74, 17, 32, 5, 79, 57, 71, 19],
  [80, 93, 51, 87, 40, 70, 39, 75, 43, 58, 22, 39, 12, 58, 8, 26],
  [22, 27, 87, 70, 77, 39, 96, 78, 14, 3, 33, 22, 48, 22, 79, 55],
  [41, 76, 74, 92, 37, 75, 78, 95, 5, 24, 17, 39, 12, 43, 20, 62],
  [74, 51, 25, 11, 74, 43, 14, 5, 95, 85, 65, 50, 85, 58, 53, 23],
  [73, 73, 13, 35, 17, 58, 3, 24, 85, 97, 70, 84, 46, 78, 21, 49],
  [16, 13, 46, 22, 32, 22, 33, 17, 65, 70, 86, 89, 79, 45, 85, 78],
  [35, 36, 47, 51, 5, 39, 22, 39, 50, 84, 89, 96, 38, 43, 51, 81],
  [30, 11, 29, 5, 79, 12, 48, 12, 85, 46, 79, 38, 95, 76, 93, 62],
  [40, 49, 6, 14, 57, 58, 22, 43, 58, 78, 45, 43, 76, 97, 47, 76],
  [18, 4, 66, 11, 71, 8, 79, 20, 53, 21, 85, 51, 93, 47, 96, 78],
  [9, 14, 41, 35, 19, 26, 55, 62, 23, 49, 78, 81, 62, 76, 78, 96],
];

const INDEX = new Map<string, number>(ORDER.map((t, i) => [t, i]));

/** Survey compatibility for a pair, 0–100. Symmetric — order does not matter. */
export function empirical(a: MbtiType, b: MbtiType): number {
  return M[INDEX.get(a)!][INDEX.get(b)!];
}

export interface Divergence {
  /** This app's derived ease for (a, b). */
  derived: number;
  /** The survey figure. */
  survey: number;
  /** derived − survey. Positive: the model is more optimistic than people are. */
  delta: number;
  /** How far apart, plain. */
  size: "agree" | "mild" | "wide" | "opposite";
  /** One sentence naming what the disagreement is. */
  reading: string;
}

const sizeOf = (d: number): Divergence["size"] =>
  Math.abs(d) < 15 ? "agree" : Math.abs(d) < 35 ? "mild" : Math.abs(d) < 60 ? "wide" : "opposite";

/** The two readings of one pair, and an honest sentence about the gap. */
export function divergence(a: MbtiType, b: MbtiType): Divergence {
  const derived = ease(a, b);
  const survey = empirical(a, b);
  const delta = derived - survey;
  const size = sizeOf(delta);
  const rel = REL_NAME[REL[a][b]];

  let reading: string;
  if (size === "agree") {
    reading = `Both readings land in the same place. The structure says ${rel}, and people who have lived it broadly agree.`;
  } else if (delta > 0) {
    reading =
      `The structure is far more optimistic than people are. ${rel} predicts low friction, but survey respondents rate this ` +
      `pairing at ${survey}%. The likeliest reason: the model is describing how the wiring meshes, and the survey is ` +
      `describing who people enjoy — and what completes you is not always what you find easy to be around.`;
  } else {
    reading =
      `People like this pairing considerably more than the structure predicts. ${rel} is a high-friction relation on paper, ` +
      `yet respondents rate it ${survey}%. Friction and attraction are not opposites, and shared interests can carry a pair ` +
      `a long way past a difficult function match.`;
  }
  return { derived, survey, delta, size, reading };
}

/** Pearson correlation across all 256 ordered pairs. Computed, not asserted. */
export function correlation(types: readonly MbtiType[]): number {
  const xs: number[] = [], ys: number[] = [];
  for (const a of types) for (const b of types) {
    xs.push(empirical(a, b));
    ys.push(ease(a, b));
  }
  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
  const mx = mean(xs), my = mean(ys);
  const num = xs.reduce((s, _, i) => s + (xs[i] - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0),
  );
  return num / den;
}

/** Mean survey figure across every pair standing in one relation. */
export function surveyMeanFor(types: readonly MbtiType[], code: string): number {
  const vals: number[] = [];
  for (const a of types) for (const b of types) {
    if (REL[a][b] === code) vals.push(empirical(a, b));
  }
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : NaN;
}
