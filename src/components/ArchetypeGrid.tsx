import { stack, type MbtiType } from "../engine/core";
import { SLOT_NAMES, type SlotName } from "../engine/data";
import { FnTag } from "./Bits";

/**
 * The ego's four archetypes as the 2×2 they secretly are: aware/unaware of
 * using it × optimistic/pessimistic about it. Hero is aware and optimistic,
 * Parent aware and pessimistic, Child unaware and optimistic, Inferior
 * unaware and pessimistic — the lexicon states these eight facts in prose,
 * one entry at a time; here they are one picture.
 *
 * Each cell also names the slot's shadow mirror (1↔5, 2↔6, 3↔7, 4↔8), which
 * is the same capacity facing the other way — the grid and the mirror
 * together are the whole eight-slot stack.
 */
export default function ArchetypeGrid({ type, highlight }: {
  /** With a type, each cell shows that type's actual function in the slot. */
  type?: MbtiType;
  highlight?: SlotName;
}) {
  const st = type ? stack(type) : null;

  const CELLS: { slot: SlotName; idx: number; blurb: string }[] = [
    { slot: "Hero", idx: 0, blurb: "Best at it, sure of it, overruns with it." },
    { slot: "Child", idx: 2, blurb: "Delights in it, undefended about it." },
    { slot: "Parent", idx: 1, blurb: "Careful with it, responsible for the Hero." },
    { slot: "Inferior", idx: 3, blurb: "Afraid of it — and the way through." },
  ];

  const label: React.CSSProperties = {
    fontFamily: "var(--sans)", fontSize: "var(--t-xs)", color: "var(--muted)",
  };

  return (
    <div
      role="img"
      aria-label={
        "The four ego archetypes on two axes: Hero aware and optimistic, Parent aware and " +
        "pessimistic, Child unaware and optimistic, Inferior unaware and pessimistic."
      }
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr 1fr",
        gap: "var(--s2)",
        maxWidth: 560,
        alignItems: "stretch",
      }}
    >
      <div />
      <div style={{ ...label, textAlign: "center" }}>Optimistic about it</div>
      <div style={{ ...label, textAlign: "center" }}>Pessimistic about it</div>

      {[0, 1].map((row) => (
        <RowOf
          key={row}
          axis={row === 0 ? "Aware of using it" : "Runs without you noticing"}
          cells={CELLS.slice(row * 2, row * 2 + 2)}
          st={st}
          highlight={highlight}
        />
      ))}
    </div>
  );
}

function RowOf({ axis, cells, st, highlight }: {
  axis: string;
  cells: { slot: SlotName; idx: number; blurb: string }[];
  st: readonly string[] | null;
  highlight?: SlotName;
}) {
  return (
    <>
      <div
        className="small muted"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", textAlign: "center" }}
      >
        {axis}
      </div>
      {cells.map(({ slot, idx, blurb }) => {
        const on = highlight === slot;
        const mirror = SLOT_NAMES[idx + 4];
        return (
          <div
            key={slot}
            style={{
              border: `1px solid ${on ? "var(--accent)" : "var(--rule)"}`,
              background: on ? "var(--accent-soft)" : "var(--surface)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--s3) var(--s4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--s2)", flexWrap: "wrap" }}>
              <b style={{ fontFamily: "var(--serif)", fontSize: "var(--t-base)" }}>
                {idx + 1}. {slot}
              </b>
              {st && <FnTag fn={st[idx]} />}
            </div>
            <p className="small" style={{ margin: "2px 0 4px" }}>{blurb}</p>
            <p className="small muted" style={{ margin: 0 }}>
              Shadow mirror: {idx + 5}. {mirror}{st && <> — <FnTag fn={st[idx + 4]} /></>}
            </p>
          </div>
        );
      })}
    </>
  );
}
