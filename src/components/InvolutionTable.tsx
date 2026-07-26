import { alpha, beta, omega } from "../engine/core";
import { type Fn } from "../engine/data";
import { FnTag } from "./Bits";

const FNS: Fn[] = ["Ne", "Ni", "Se", "Si", "Te", "Ti", "Fe", "Fi"];

/**
 * The three involutions as one table — the whole "no lookup table" claim,
 * visible. Every derived structure in this app is some composition of these
 * three moves: α flips the attitude, β swaps the element, ω does both. The
 * shadow is α of the ego, the Dual is ω of you, the four sides are these
 * same operators applied to the (dominant, auxiliary) pair.
 *
 * A CSS grid rather than SVG: four narrow columns of mono tags reflow for
 * free and cost nothing on a phone.
 */
export default function InvolutionTable({ highlight }: { highlight?: Fn }) {
  const cols: [string, string, (f: Fn) => Fn][] = [
    ["α", "flip attitude", (f) => alpha[f]],
    ["β", "swap element", (f) => beta[f]],
    ["ω", "flip both", (f) => omega[f]],
  ];

  const cell: React.CSSProperties = {
    padding: "var(--s2) var(--s3)",
    borderTop: "1px solid var(--rule)",
  };

  return (
    <div
      role="table"
      aria-label="The three involutions applied to each of the eight functions"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        maxWidth: 480,
        fontFamily: "var(--sans)",
        fontSize: "var(--t-sm)",
      }}
    >
      <div style={{ ...cell, borderTop: 0 }} className="small muted">function</div>
      {cols.map(([sym, what]) => (
        <div key={sym} style={{ ...cell, borderTop: 0 }} className="small muted">
          <b style={{ color: "var(--ink-2)" }}>{sym}</b> · {what}
        </div>
      ))}

      {FNS.map((f) => {
        const on = highlight === f;
        return (
          <div key={f} style={{ display: "contents" }} role="row">
            <div style={{ ...cell, background: on ? "var(--accent-soft)" : undefined }}>
              <FnTag fn={f} />
            </div>
            {cols.map(([sym, , op]) => (
              <div key={sym} style={{ ...cell, background: on ? "var(--accent-soft)" : undefined }}>
                <FnTag fn={op(f)} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
