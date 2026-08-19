import type { Fn } from "../engine/data";
import { FnDiscMark } from "./glyphs/FnDisc";
import { usePalette } from "./Theme";

/*
 * The two Bond figures, ported from the deck's art (bond() and mesh() in
 * src/cards/art.ts): element-level pairing, drawn type-agnostically.
 * Nobody's four letters appear in either — the pairing holds wherever
 * these elements sit, which is the whole point of the Bond altitude.
 */

/**
 * An axis bond: two elements that answer each other, and the traffic
 * between them. Two arrows, because the supply runs both ways and in
 * equal measure.
 */
export function AxisBondFigure({ a, b }: { a: Fn; b: Fn }) {
  const W = 360, H = 110, y = 52, R = 19;
  const ax = 70, bx = W - 70;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`${a} and ${b} supply each other, in equal measure and both directions.`}
      style={{ display: "block", maxWidth: 400, fontFamily: "var(--sans)" }}
    >
      {[-11, 11].map((dy) => {
        const from = dy < 0 ? ax : bx;
        const to = dy < 0 ? bx : ax;
        const dir = Math.sign(to - from);
        const s = from + dir * (R + 10), e = to - dir * (R + 10);
        return (
          <g key={dy} stroke="var(--ink-2)" strokeOpacity="0.55" strokeWidth="1.5" fill="none">
            <line x1={s} y1={y + dy} x2={e} y2={y + dy} />
            <path d={`M ${e - dir * 6} ${y + dy - 4} L ${e} ${y + dy} L ${e - dir * 6} ${y + dy + 4}`} />
          </g>
        );
      })}
      <text x={W / 2} y={y + 5} textAnchor="middle" fontSize="14" fill="var(--muted)">
        supplies
      </text>
      <FnDiscMark fn={a} cx={ax} cy={y} r={R} />
      <FnDiscMark fn={b} cx={bx} cy={y} r={R} />
    </svg>
  );
}

/**
 * A spark mesh: two pairs of tools, Leads above Supports, with the two
 * crossings drawn — each Lead lined to the OTHER side's Support. The X is
 * the figure's whole fact; the faint verticals (a Lead over its own
 * Support) are there so the crossing reads as a crossing, not a layout.
 */
export function SparkMeshFigure({ fns }: {
  /** [a's Lead, a's Support, b's Lead, b's Support]. */
  fns: [Fn, Fn, Fn, Fn];
}) {
  const p = usePalette();
  const [aL, aS, bL, bS] = fns;
  const W = 420, H = 190, R = 17;
  const ax = 140, bx = W - 140;
  const yL = 44, yS = H - 44;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={
        `The mesh: ${aL} leads with ${aS} in support, ${bL} leads with ${bS} in support, ` +
        `and each Lead is answered by the other's Support.`
      }
      style={{ display: "block", maxWidth: 460, fontFamily: "var(--sans)" }}
    >
      {[ax, bx].map((x) => (
        <line key={x} x1={x} y1={yL + R + 6} x2={x} y2={yS - R - 6} stroke="var(--rule-strong)" strokeWidth="1" opacity="0.5" />
      ))}
      <line x1={ax + 12} y1={yL + 12} x2={bx - 11} y2={yS - 11} stroke={p.fn(aL)} strokeWidth="2" strokeOpacity="0.6" />
      <line x1={bx - 12} y1={yL + 12} x2={ax + 11} y2={yS - 11} stroke={p.fn(bL)} strokeWidth="2" strokeOpacity="0.6" />
      <text x="14" y={yL + 5} fontSize="14" fontWeight="600" letterSpacing="0.08em" fill="var(--muted)">LEADS</text>
      <text x="14" y={yS + 5} fontSize="14" fontWeight="600" letterSpacing="0.08em" fill="var(--muted)">SUPPORTS</text>
      <FnDiscMark fn={aL} cx={ax} cy={yL} r={R} />
      <FnDiscMark fn={bL} cx={bx} cy={yL} r={R} />
      <FnDiscMark fn={aS} cx={ax} cy={yS} r={R} />
      <FnDiscMark fn={bS} cx={bx} cy={yS} r={R} />
    </svg>
  );
}
