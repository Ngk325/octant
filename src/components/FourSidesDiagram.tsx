import { Link } from "react-router-dom";
import { sides, SIDE_ORDER, type SideKey } from "../engine/sides";
import { SIDE_PLAIN } from "../engine/plain";
import type { MbtiType } from "../engine/data";
import { usePalette } from "./Theme";

/**
 * All four sides side by side, each showing its own four-slot stack.
 *
 * The point the diagram has to make is that these are the SAME eight functions
 * re-sorted, not four separate people: the ego's Inferior is the subconscious's
 * Hero, and the ego's Demon is the superego's Hero. So each cell is labelled
 * with both names — what it is here, and what it is in the ego.
 */
export default function FourSidesDiagram({ type }: { type: MbtiType }) {
  const p = usePalette();
  const s = sides(type);

  return (
    <div className="grid g-auto" style={{ gap: "var(--s4)" }}>
      {SIDE_ORDER.map((key: SideKey) => {
        const side = s[key];
        return (
          <div
            key={key}
            style={{
              border: "1px solid var(--rule)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--s4)",
              background: key === "ego" ? "var(--surface-2)" : "var(--surface)",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <h4 style={{ margin: 0, fontSize: "var(--t-base)" }}>{side.name}</h4>
              <Link to={`/type/${side.type}`} className="chip mono">{side.type}</Link>
            </div>

            <p className="small" style={{ margin: "6px 0 var(--s3)" }}>{SIDE_PLAIN[key]}</p>

            <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {side.slots.map((slot, i) => (
                <li
                  key={slot.fn}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    padding: "5px 0",
                    borderTop: i ? "1px solid var(--rule)" : "none",
                    marginBottom: 0,
                  }}
                >
                  <b
                    className="mono"
                    style={{ color: p.fn(slot.fn), fontSize: "var(--t-base)", minWidth: 30 }}
                  >
                    {slot.fn}
                  </b>
                  <span style={{ fontSize: "var(--t-sm)", fontFamily: "var(--sans)" }}>
                    {slot.role}
                  </span>
                  {slot.egoSlot !== slot.role && (
                    <span className="small muted" style={{ marginLeft: "auto", fontSize: "var(--t-xs)" }}>
                      your {slot.egoSlot}
                    </span>
                  )}
                </li>
              ))}
            </ol>

            <p
              className="small"
              style={{
                margin: "var(--s3) 0 0",
                paddingTop: "var(--s3)",
                borderTop: "1px solid var(--rule)",
              }}
            >
              <b style={{ fontFamily: "var(--sans)", fontWeight: 600 }}>Way in:</b>{" "}
              <b className="mono" style={{ color: p.fn(side.gateway.fn) }}>{side.gateway.fn}</b>
              {key !== "ego" && <> — your {side.gateway.egoSlot}</>}
            </p>
          </div>
        );
      })}
    </div>
  );
}
