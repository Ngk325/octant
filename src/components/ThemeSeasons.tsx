import { THEMES, type Development, type Focus } from "../engine/octagram";

/**
 * The four themes as a 2×2 — development down the side, focus across the top.
 *
 * Drawn rather than listed because the grid IS the argument: the two axes are
 * independent, one is set in childhood and one is where you are today, and
 * every square is a real place people live. The seasons are the source's own
 * metaphor and they carry the mood better than any label would.
 *
 * Layout lives in the `.seasons` classes (components.css) rather than inline,
 * because below 640px the grid stacks to one column, the column headers hide
 * and the rotated row labels become plain headings — and a media query cannot
 * reach an inline style.
 *
 * Original artwork.
 */
export default function ThemeSeasons({
  development, focus, onPick,
}: {
  development?: Development;
  focus?: Focus;
  onPick?: (d: Development, f: Focus) => void;
}) {
  /** The theme sitting at one development/focus intersection. */
  const cell = (d: Development, f: Focus) => THEMES.find((t) => t.development === d && t.focus === f)!;
  const rows: Development[] = ["SD", "UD"];
  const cols: Focus[] = ["SF", "UF"];
  const Tag = onPick ? "button" : "div";

  return (
    <div className="seasons">
      <div className="seasons-corner" />
      {cols.map((f) => (
        <div key={f} className="seasons-collabel small muted">
          {f === "SF" ? "Running on the subconscious" : "Running on the shadow"}
          <div className="mono" style={{ fontSize: "var(--t-xs)" }}>{f}</div>
        </div>
      ))}

      {rows.map((d) => (
        <Row key={d} d={d}>
          {cols.map((f) => {
            const t = cell(d, f);
            const on = development === d && focus === f;
            return (
              <Tag
                key={f}
                className="seasons-cell"
                {...(onPick
                  ? { type: "button" as const, onClick: () => onPick(d, f), "aria-pressed": on }
                  : {})}
                style={{
                  cursor: onPick ? "pointer" : "default",
                  border: `1px solid ${on ? "var(--accent)" : "var(--rule)"}`,
                  outline: on ? "1px solid var(--accent)" : "none",
                  background: on ? "var(--accent-soft)" : "var(--surface)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <b
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "var(--t-lg)",
                      color: on ? "var(--accent-ink)" : "var(--ink)",
                    }}
                  >
                    {t.theme}
                  </b>
                  <span className="small muted">{t.season}</span>
                  <span className="mono small muted" style={{ marginLeft: "auto" }}>
                    {t.development}|{t.focus}
                  </span>
                </div>
                <p className="small" style={{ margin: "6px 0 0" }}>{t.plain}</p>
              </Tag>
            );
          })}
        </Row>
      ))}
    </div>
  );
}

/** One development row, with its axis label — rotated on wide screens, a plain heading when stacked. */
function Row({ d, children }: { d: Development; children: React.ReactNode }) {
  return (
    <>
      <div className="seasons-rowlabel small muted">
        {d === "SD" ? "Subconscious fed early" : "Subconscious denied early"}
        <span className="mono" style={{ fontSize: "var(--t-xs)" }}> · {d}</span>
      </div>
      {children}
    </>
  );
}
