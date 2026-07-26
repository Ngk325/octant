import { TYPES, REL, coins, ops, stack } from "./core";
import { RECIPROCAL, DETERMINING, type MbtiType } from "./data";

/** The same integrity assertions the spreadsheet's Validation sheet runs. */
export function verify(): string[] {
  const problems: string[] = [];
  for (const t of TYPES) {
    const codes = TYPES.map((p) => REL[t][p]);
    if (new Set(codes).size !== 16) problems.push(`${t}: ${new Set(codes).size} distinct codes`);
    if (REL[t][t] !== "ID") problems.push(`${t}: diagonal is ${REL[t][t]}`);
    if (new Set(stack(t)).size !== 8) problems.push(`${t}: stack is not a permutation`);
    const col = TYPES.map((q) => REL[q][t]);
    if (new Set(col).size !== 16) problems.push(`column ${t}: ${new Set(col).size} distinct codes`);
    const expected = t[3] === "P" ? "Play" : "Blast";
    if (ops(t).primary !== expected) problems.push(`${t}: primary ${ops(t).primary}`);
  }
  for (const t of TYPES) for (const p of TYPES) {
    if (RECIPROCAL[REL[t][p]] !== REL[p][t]) problems.push(`reciprocity ${t}/${p}`);
  }
  const sigs = new Set(TYPES.map((t: MbtiType) => DETERMINING.map((i) => coins(t)[i]).join("|")));
  if (sigs.size !== 16) problems.push(`determining coins collide: ${sigs.size}`);
  return problems;
}
