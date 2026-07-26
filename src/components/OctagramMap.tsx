import { Link } from "react-router-dom";
import { wheels, templeOf, type TempleName } from "../engine/octagram";
import { quadra, type MbtiType } from "../engine/core";
import { usePalette } from "./Theme";

/**
 * The Octagram itself: eight wheels around a ring, two per temple.
 *
 * This is the diagram that makes the name make sense — eight points, not
 * sixteen, because a type and its subconscious share a wheel. The four
 * temple arcs behind the points show the other half of the structure: two
 * adjacent wheels make a temple, and a temple is exactly one four-sides
 * orbit.
 *
 * Original artwork, built from `wheels()` rather than authored, so it cannot
 * disagree with the engine.
 */
export default function OctagramMap({ highlight }: { highlight?: MbtiType }) {
  const p = usePalette();
  const mine = highlight ? templeOf(highlight).name : null;

  const W = 560;
  const H = 560;
  const cx = W / 2;
  const cy = H / 2;
  const r = 196;

  /* Order the eight so the two wheels of a temple sit next to each other, and
     index the highlight into THAT order — indexing into wheels() instead put
     the ring's emphasis on the wrong circle. */
  const ORDER: TempleName[] = ["Soul", "Mind", "Heart", "Body"];
  const all = wheels();
  const ordered = ORDER.flatMap((t) => all.filter((w) => w.temple === t));
  const myWheel = highlight
    ? ordered.findIndex((w) => (w.pair as string[]).includes(highlight))
    : -1;

  /** Polar helper: position i of eight around the ring, at the given radius. */
  const at = (i: number, radius: number) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius };
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", maxWidth: 620, display: "block", margin: "0 auto" }}
      role="img"
      aria-label={
        "The Octagram: eight cognitive origins around a ring, grouped into four temples — " +
        ordered.map((w) => `${w.origin} (${w.pair.join(" and ")}, ${w.temple} temple)`).join("; ") + "."
      }
    >
      {/* the eight-pointed star that gives the thing its name */}
      {[0, 1].map((offset) => (
        <polygon
          key={offset}
          points={[0, 1, 2, 3].map((k) => {
            const { x, y } = at(offset + k * 2, r - 46);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(" ")}
          fill="none"
          stroke="var(--rule)"
          strokeWidth={1}
        />
      ))}

      {/* temple arcs */}
      {ORDER.map((name, ti) => {
        const start = at(ti * 2 - 0.42, r + 40);
        const end = at(ti * 2 + 1.42, r + 40);
        const on = mine === name;
        return (
          <g key={name}>
            <path
              d={`M ${start.x} ${start.y} A ${r + 40} ${r + 40} 0 0 1 ${end.x} ${end.y}`}
              fill="none"
              stroke={on ? "var(--accent)" : "var(--rule-strong)"}
              strokeWidth={on ? 3 : 1.5}
            />
            {(() => {
              const mid = at(ti * 2 + 0.5, r + 62);
              return (
                <text
                  x={mid.x} y={mid.y + 5}
                  textAnchor="middle"
                  style={{
                    fontFamily: "var(--sans)",
                    fontSize: 15,
                    fontWeight: 600,
                    fill: on ? "var(--accent-ink)" : "var(--muted)",
                  }}
                >
                  {name}
                </text>
              );
            })()}
          </g>
        );
      })}

      {/* the eight wheels */}
      {ordered.map((w, i) => {
        const { x, y } = at(i, r - 46);
        const on = i === myWheel;
        return (
          <g key={w.origin}>
            <circle
              cx={x} cy={y} r={on ? 46 : 42}
              fill={on ? "var(--accent-soft)" : "var(--surface)"}
              stroke={on ? "var(--accent)" : "var(--rule-strong)"}
              strokeWidth={on ? 2 : 1}
            />
            <text
              x={x} y={y - 6}
              textAnchor="middle"
              style={{
                fontFamily: "var(--serif)",
                fontSize: 15,
                fontWeight: 600,
                fill: on ? "var(--accent-ink)" : "var(--ink)",
              }}
            >
              {w.origin}
            </text>
            {w.pair.map((t, k) => (
              <text
                key={t}
                x={x} y={y + 11 + k * 15}
                textAnchor="middle"
                style={{ fontFamily: "var(--mono)", fontSize: 14, fill: p.quadra(quadra(t)) }}
              >
                {t}
              </text>
            ))}
          </g>
        );
      })}

      <text
        x={cx} y={cy - 6}
        textAnchor="middle"
        style={{ fontFamily: "var(--sans)", fontSize: 15, fill: "var(--muted)" }}
      >
        eight origins
      </text>
      <text
        x={cx} y={cy + 14}
        textAnchor="middle"
        style={{ fontFamily: "var(--sans)", fontSize: 15, fill: "var(--muted)" }}
      >
        four temples
      </text>
    </svg>
  );
}

/** The eight wheels as links, for anywhere the ring is too big to draw. */
export function OctagramLegend({ highlight }: { highlight?: MbtiType }) {
  const p = usePalette();
  return (
    <div className="grid g-auto" style={{ gap: "var(--s3)" }}>
      {wheels().map((w) => (
        <div
          key={w.origin}
          style={{
            border: "1px solid var(--rule)",
            borderLeft: `3px solid ${
              highlight && (w.pair as string[]).includes(highlight) ? "var(--accent)" : "var(--rule-strong)"
            }`,
            borderRadius: "var(--radius)",
            padding: "var(--s3)",
          }}
        >
          <b style={{ fontFamily: "var(--serif)", fontSize: "var(--t-base)" }}>{w.origin}</b>
          <div className="small muted" style={{ marginBottom: 6 }}>{w.temple} temple</div>
          <div className="cluster" style={{ gap: 6 }}>
            {w.pair.map((t) => (
              <Link key={t} to={`/type/${t}`} className="chip mono">
                <i className="dot" style={{ background: p.quadra(quadra(t)) }} />
                {t}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
