import { arrowhead, ring } from "./geometry";

/**
 * The attitude itself, before it is attached to any function — the single
 * most reused idea in the model, and until now it had no mark of its own
 * (catalogue, "Attitude"). One relationship, drawn twice: a centre and a
 * ring, read outward then inward. Every element glyph in FnIcon is this
 * same shape once it picks up a family; this is what it looks like bare.
 *
 * Rule 3 (geometry.ts) says attitude is motion — arrows out, arrows in —
 * and a bare SVG <line> carries no arrowhead: reversing its x1/y1 and
 * x2/y2 changes nothing about how it paints, so the first version of this
 * mark rendered its two halves pixel-identical. Real arrowheads, drawn
 * with the same geometry.ts helper every other directional glyph in this
 * app already uses, are what actually make "out" and "in" two different
 * pictures rather than one shape asserted twice.
 *
 * Neutral ink, not a function hue — it belongs to no family yet.
 */
export default function AttitudeMark({ size = 88 }: { size?: number }) {
  const w = size * 2.3;
  const cx = size * 0.5, cy = size * 0.5;
  const coreR = size * 0.13;
  const points = ring(cx, cy, size * 0.34, 7);

  return (
    <svg
      width={w}
      height={size}
      viewBox={`0 0 ${w} ${size}`}
      role="img"
      aria-label="Two ways of facing: outward, with arrows reaching past the self, and inward, with arrows converging on the self."
      style={{ display: "block" }}
    >
      <g>
        <circle cx={cx} cy={cy} r={coreR} fill="var(--ink)" />
        {points.map(({ x, y }, i) => {
          const len = Math.hypot(x - cx, y - cy);
          const nx = (x - cx) / len, ny = (y - cy) / len; // unit direction, outward
          const lineEnd = len - 6; // stop short so the line doesn't poke past the arrowhead
          return (
            <g key={i}>
              <line
                x1={cx} y1={cy} x2={cx + nx * lineEnd} y2={cy + ny * lineEnd}
                stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" opacity=".55"
              />
              <path d={arrowhead(x, y, nx, ny, 6)} fill="var(--ink)" opacity=".85" />
            </g>
          );
        })}
        <text x={cx} y={size * 0.98} textAnchor="middle" fontSize="14" fill="var(--muted)">
          facing out
        </text>
      </g>
      <g transform={`translate(${w - size}, 0)`}>
        {points.map(({ x, y }, i) => {
          const len = Math.hypot(cx - x, cy - y);
          const nx = (cx - x) / len, ny = (cy - y) / len; // unit direction, inward
          const tipLen = len - coreR - 4; // stop just short of the core
          const tipX = x + nx * tipLen, tipY = y + ny * tipLen;
          const lineEnd = tipLen - 6;
          return (
            <g key={i}>
              <line
                x1={x} y1={y} x2={x + nx * lineEnd} y2={y + ny * lineEnd}
                stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" opacity=".55"
              />
              <path d={arrowhead(tipX, tipY, nx, ny, 6)} fill="var(--ink)" opacity=".85" />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={coreR} fill="var(--ink)" />
        <text x={cx} y={size * 0.98} textAnchor="middle" fontSize="14" fill="var(--muted)">
          facing in
        </text>
      </g>
    </svg>
  );
}
