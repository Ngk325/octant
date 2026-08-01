import { alpha, beta, omega } from "../engine/core";
import type { Fn } from "../engine/data";
import { FnTag } from "./Bits";

const FNS: Fn[] = ["Ne", "Ni", "Se", "Si", "Te", "Ti", "Fe", "Fi"];

/**
 * The three moves as one table — the whole "no lookup table" claim, visible.
 * Every derived structure in this app is some composition of them: the shadow
 * is a flip of the ego, your Counterpart is a turn of you, and the four sides
 * are the same three moves applied to the (dominant, auxiliary) pair.
 *
 * The header used to read `α · flip attitude`, which was reported as the most
 * confusing thing in the lexicon and deserved it. It led with a Greek symbol —
 * the most prominent mark on screen, and the one piece of information a reader
 * never needs — and then explained it with two more words of vocabulary,
 * "attitude" and "element", that a newcomer has no reason to know yet.
 *
 * So: the moves are named for what they do, each carries a worked example in
 * its own header, and the symbols live here in the comment where they belong.
 * (α flip, β swap, ω turn, if you are reading the engine.)
 *
 * A CSS grid rather than SVG: four narrow columns of mono tags reflow for
 * free and cost nothing on a phone.
 */
export default function InvolutionTable({ highlight }: { highlight?: Fn }) {
  /** name · what it does, in words a first-time reader already has · a worked example */
  const cols: [name: string, what: string, eg: string, op: (f: Fn) => Fn][] = [
    ["flip", "same letter, other direction", "Ne → Ni", (f) => alpha[f]],
    ["swap", "other letter, same direction", "Ne → Se", (f) => beta[f]],
    ["turn", "both at once", "Ne → Si", (f) => omega[f]],
  ];

  const cell: React.CSSProperties = {
    padding: "var(--s2) var(--s3)",
    borderTop: "1px solid var(--rule)",
  };

  /* Each row spans all four columns and re-inherits their tracks as a subgrid,
     so the role="row" box stays in the accessibility tree without disturbing
     the layout the parent grid produced with display:contents. */
  const ROW: React.CSSProperties = {
    display: "grid",
    gridColumn: "1 / -1",
    gridTemplateColumns: "subgrid",
  };

  return (
    <div
      role="table"
      aria-label="Each of the eight functions after each of the three moves — flip, swap and turn"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        maxWidth: 480,
        fontFamily: "var(--sans)",
        fontSize: "var(--t-sm)",
      }}
    >
      {/* An ARIA row may only contain ARIA cells — role=table with bare divs
          inside was malformed and read as an empty table. The row is a SUBGRID
          spanning all columns, not display:contents: a contents box is dropped
          from the accessibility tree in several browsers, which would take the
          role="row" with it and leave the cells floating rowless. Subgrid keeps
          the row a real box AND inherits the parent's column tracks, so the
          layout is identical. */}
      <div style={ROW} role="row">
      <div style={{ ...cell, borderTop: 0 }} className="small muted" role="columnheader">start with</div>
      {cols.map(([name, what, eg]) => (
        <div key={name} style={{ ...cell, borderTop: 0 }} className="small muted" role="columnheader">
          {/* The name leads, because it is the only part a reader carries away.
              The example sits under it so the column explains itself before the
              description is read at all. */}
          <b style={{ color: "var(--ink)", fontSize: "var(--t-sm)" }}>{name}</b>
          <span className="mono" style={{ display: "block", color: "var(--accent-ink)" }}>{eg}</span>
          <span style={{ display: "block" }}>{what}</span>
        </div>
      ))}
      </div>

      {FNS.map((f) => {
        const on = highlight === f;
        return (
          <div key={f} style={ROW} role="row">
            <div role="rowheader" style={{ ...cell, background: on ? "var(--accent-soft)" : undefined }}>
              <FnTag fn={f} />
            </div>
            {cols.map(([name, , , op]) => (
              <div key={name} role="cell" style={{ ...cell, background: on ? "var(--accent-soft)" : undefined }}>
                <FnTag fn={op(f)} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
