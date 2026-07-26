import { THEMES, type Development, type Focus } from "../engine/octagram";

/**
 * The four themes as a 2×2 — development down the side, focus across the top.
 *
 * Drawn rather than listed because the grid IS the argument: the two axes are
 * independent, one is set in childhood and one is where you are today, and
 * every square is a real place people live. The seasons are the source's own
 * metaphor and they carry the mood better than any label would.
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
  const cell = (d: Development, f: Focus) => THEMES.find((t) => t.development === d && t.focus === f)!;
  const rows: Development[] = ["SD", "UD"];
  const cols: Focus[] = ["SF", "UF"];
  const Tag = onPick ? "button" : "div";

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr 1fr",
          gap: "var(--s2)",
          alignItems: "stretch",
        }}
      >
        <div />
        {cols.map((f) => (
          <div key={f} className="small muted" style={{ textAlign: "center", paddingBottom: 4 }}>
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
                  {...(onPick
                    ? { type: "button" as const, onClick: () => onPick(d, f), "aria-pressed": on }
                    : {})}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    font: "inherit",
                    color: "inherit",
                    cursor: onPick ? "pointer" : "default",
                    border: `1px solid ${on ? "var(--accent)" : "var(--rule)"}`,
                    outline: on ? "1px solid var(--accent)" : "none",
                    borderRadius: "var(--radius-lg)",
                    background: on ? "var(--accent-soft)" : "var(--surface)",
                    padding: "var(--s4)",
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
    </div>
  );
}

function Row({ d, children }: { d: Development; children: React.ReactNode }) {
  return (
    <>
      <div
        className="small muted"
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          textAlign: "center",
          paddingRight: 4,
        }}
      >
        {d === "SD" ? "Subconscious fed early" : "Subconscious denied early"}
        <span className="mono" style={{ fontSize: "var(--t-xs)" }}> · {d}</span>
      </div>
      {children}
    </>
  );
}
