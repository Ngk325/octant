import { ring } from "./geometry";

/**
 * The attitude itself, before it is attached to any function — the single
 * most reused idea in the model, and until now it had no mark of its own
 * (catalogue, "Attitude"). One relationship, drawn twice: a centre and a
 * ring, read outward then inward. Every element glyph in FnIcon is this
 * same shape once it picks up a family; this is what it looks like bare.
 *
 * Neutral ink, not a function hue — it belongs to no family yet.
 */
export default function AttitudeMark({ size = 88 }: { size?: number }) {
  const w = size * 2.3;
  return (
    <svg
      width={w}
      height={size}
      viewBox={`0 0 ${w} ${size}`}
      role="img"
      aria-label="Two ways of facing: outward, reaching past the self, and inward, converging on the self."
      style={{ display: "block" }}
    >
      <g>
        <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.13} fill="var(--ink)" />
        {ring(size * 0.5, size * 0.5, size * 0.34, 7).map(({ x, y }, i) => (
          <line
            key={i}
            x1={size * 0.5} y1={size * 0.5} x2={x} y2={y}
            stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" opacity=".55"
          />
        ))}
        <text x={size * 0.5} y={size * 0.98} textAnchor="middle" fontSize="14" fill="var(--muted)">
          facing out
        </text>
      </g>
      <g transform={`translate(${w - size}, 0)`}>
        {ring(size * 0.5, size * 0.5, size * 0.34, 7).map(({ x, y }, i) => (
          <line
            key={i}
            x1={x} y1={y} x2={size * 0.5} y2={size * 0.5}
            stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" opacity=".55"
          />
        ))}
        <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.13} fill="var(--ink)" />
        <text x={size * 0.5} y={size * 0.98} textAnchor="middle" fontSize="14" fill="var(--muted)">
          facing in
        </text>
      </g>
    </svg>
  );
}
