import { ops, type Subtype } from "../engine/ops";
import type { MbtiType } from "../engine/core";
import { usePalette } from "./Theme";
import { FnTag } from "./Bits";

/**
 * The savior/demon structure as the 2×2 the overlay itself reads from: one
 * observer and one decider are saviors (obvious, easy, matter-of-fact), and
 * their axis opposites are demons (nervous, performative, crushed by
 * criticism). The app used to state this in two separate panels of prose;
 * the grid shows that it is one structure with two axes, not four facts.
 */
export default function SaviorDemonGrid({ type, sub }: { type: MbtiType; sub?: Subtype }) {
  const p = usePalette();
  const o = ops(type, sub);

  const cells = [
    { axis: "Observer", state: "Savior" as const, fn: o.saviorObs },
    { axis: "Observer", state: "Demon" as const, fn: o.demonObs },
    { axis: "Decider", state: "Savior" as const, fn: o.saviorDec },
    { axis: "Decider", state: "Demon" as const, fn: o.demonDec },
  ];

  const label: React.CSSProperties = {
    fontFamily: "var(--sans)", fontSize: "var(--t-xs)", color: "var(--muted)",
  };

  return (
    <div
      role="img"
      aria-label={
        `${type}'s savior functions are ${o.saviorObs} and ${o.saviorDec}; ` +
        `its demons are ${o.demonObs} and ${o.demonDec}.`
      }
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr 1fr",
        gap: "var(--s2)",
        maxWidth: 520,
      }}
    >
      <div />
      <div style={{ ...label, textAlign: "center" }}>Anchors — trusted</div>
      <div style={{ ...label, textAlign: "center" }}>Flinches — distrusted</div>

      {(["Observer", "Decider"] as const).map((axis) => (
        <RowOf key={axis} axis={axis} cells={cells.filter((c) => c.axis === axis)} glow={p.glow} />
      ))}
    </div>
  );
}

function RowOf({ axis, cells, glow }: {
  axis: string;
  cells: { state: "Savior" | "Demon"; fn: string }[];
  glow(f: never): string;
}) {
  return (
    <>
      <div
        className="small muted"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", textAlign: "center" }}
      >
        {axis}
      </div>
      {cells.map(({ state, fn }) => (
        <div
          key={state}
          style={{
            border: "1px solid var(--rule)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--s3) var(--s4)",
            background: state === "Savior" ? glow(fn as never) : "var(--surface)",
          }}
        >
          <FnTag fn={fn} size="var(--t-lg)" />
          <p className="small" style={{ margin: "4px 0 0", color: state === "Demon" ? "var(--warn)" : "var(--ink-2)" }}>
            {state === "Savior"
              ? "Obvious and easy. Criticism of it shrugs off."
              : "Nervous, performative. Criticism of it lands hard."}
          </p>
        </div>
      ))}
    </>
  );
}
