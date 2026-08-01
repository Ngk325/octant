import { TYPES, quadra, stack, type MbtiType, type Quadra } from "../engine/core";
import type { Fn } from "../engine/data";
import { usePalette } from "./Theme";
import { FnTag } from "./Bits";

/**
 * The four quadras as what they actually are: value clubs over the eight
 * functions. Each row is a quadra and the four functions its members hold in
 * their ego block; read down a column and you see which quadras share a
 * function — Alpha and Delta both value Ne/Si, Alpha and Beta both value
 * Ti/Fe. That shared-axis structure is why some quadras feel adjacent and
 * others opposite, and it was previously asserted in prose with nothing to
 * look at.
 */
export default function QuadraFunctionGrid({ highlight }: { highlight?: Quadra }) {
  const p = usePalette();
  const quadras: Quadra[] = ["Alpha", "Beta", "Gamma", "Delta"];

  /* Derived, not authored: the four valued functions are whatever the ego
     blocks of the quadra's members actually contain. */
  const valued = (q: Quadra): Fn[] => {
    const member = TYPES.find((t) => quadra(t) === q)!;
    const ego = stack(member).slice(0, 4);
    const obs = ego.filter((f) => f[0] === "N" || f[0] === "S").sort();
    const dec = ego.filter((f) => f[0] === "T" || f[0] === "F").sort();
    return [...obs, ...dec];
  };

  const members = (q: Quadra): MbtiType[] => TYPES.filter((t) => quadra(t) === q);

  return (
    <div
      role="table"
      aria-label="The four quadras and the four functions each values"
      style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--s2)", maxWidth: 620 }}
    >
      {quadras.map((q) => {
        const on = highlight === q;
        return (
          <div key={q} style={{ display: "contents" }} role="row">
            <div
              style={{
                display: "flex", alignItems: "center", gap: "var(--s2)",
                fontFamily: "var(--sans)", fontSize: "var(--t-sm)", fontWeight: 600,
                padding: "var(--s3) var(--s2)",
              }}
            >
              <i className="dot" style={{ background: p.quadra(q) }} />
              {q}
            </div>
            <div
              style={{
                border: `1px solid ${on ? "var(--accent)" : "var(--rule)"}`,
                background: on ? "var(--accent-soft)" : "var(--surface)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--s3) var(--s4)",
                display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "var(--s3)",
              }}
            >
              <span className="cluster" style={{ gap: "var(--s3)" }}>
                {valued(q).map((f) => <FnTag key={f} fn={f} size="var(--t-base)" />)}
              </span>
              <span className="small muted" style={{ marginLeft: "auto" }}>
                {members(q).join(" · ")}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
