import type { Fn } from "../../engine/data";
import { FnTag } from "../Bits";
import FnIcon from "./FnIcon";

/** The four families, outward member first — the order FN_FULL itself uses. */
const FAMILIES: [Fn, Fn][] = [["Ne", "Ni"], ["Se", "Si"], ["Te", "Ti"], ["Fe", "Fi"]];

/**
 * All eight functions as one figure, not eight separate lookups: four
 * families side by side, the outward half in one row and the inward half
 * directly beneath it, so the two-halves symmetry is a fact of the layout
 * rather than a sentence next to it. Built entirely from FnIcon — a glyph's
 * mark is the same everywhere (catalogue consistency rule 2).
 */
export default function EightSet({ size = 40 }: { size?: number }) {
  return (
    <div
      role="img"
      aria-label="The eight functions: four families, each with an outward version on top and an inward version below."
      style={{ display: "inline-flex", flexDirection: "column", gap: "var(--s3)" }}
    >
      <Row fns={FAMILIES.map(([out]) => out)} label="Facing out" size={size} />
      <Row fns={FAMILIES.map(([, inw]) => inw)} label="Facing in" size={size} />
    </div>
  );
}

function Row({ fns, label, size }: { fns: Fn[]; label: string; size: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s5)" }} aria-hidden="true">
      <span className="small muted" style={{ width: "7ch", flex: "0 0 auto" }}>{label}</span>
      {fns.map((fn) => (
        <div key={fn} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--s1)" }}>
          <FnIcon fn={fn} size={size} />
          {/* the deck's disc leads the name: attitude readable before the letters */}
          <span className="small"><FnTag fn={fn} disc /></span>
        </div>
      ))}
    </div>
  );
}
