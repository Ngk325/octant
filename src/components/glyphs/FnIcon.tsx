import { type Fn, FN_FULL } from "../../engine/data";
import { usePalette } from "../Theme";
import { ring, arrowhead, outward } from "./geometry";

/**
 * One abstract icon per function — the pictorial answer to "what does this
 * function feel like", eight original marks built from one rule: extraverted
 * functions move OUTWARD (rays, branches, reach), intraverted ones move
 * INWARD (cores, strata, convergence).
 *
 *   Ne branches out from a node        Ni converges many lines to a point
 *   Se an open lens, rays out          Si layered strata, bottom-weighted
 *   Te steps rising to a target        Ti a lattice built from the ground
 *   Fe a linked ring of dots           Fi a plumb line into a core
 *
 * Original artwork. Geometry only; each mark is the same drawing in both
 * themes because colour comes from the palette and chrome from CSS vars.
 */
export default function FnIcon({ fn, size = 40 }: { fn: Fn; size?: number }) {
  const p = usePalette();
  const c = p.fn(fn);
  const soft = p.glow(fn);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={`${fn} — ${FN_FULL[fn]}, ${outward(fn) ? "outward-facing" : "inward-facing"}`}
      style={{ display: "block", flex: "0 0 auto" }}
    >
      {MARKS[fn](c, soft)}
    </svg>
  );
}

type Mark = (c: string, soft: string) => React.JSX.Element;

const MARKS: Record<Fn, Mark> = {
  /* A node whose branches reach outward, tipped with possibilities. */
  Ne: (c, soft) => (
    <g>
      <circle cx="24" cy="26" r="5.5" fill={c} />
      {ring(24, 26, 16, 6, -Math.PI / 2 - 0.3).map(({ x, y }, i) => (
        <g key={i}>
          <line x1="24" y1="26" x2={x} y2={y} stroke={c} strokeWidth="2" strokeLinecap="round" opacity=".7" />
          <circle cx={x} cy={y} r="3.4" fill={soft} stroke={c} strokeWidth="1.5" />
        </g>
      ))}
    </g>
  ),

  /* Many strands converging on one certain point. */
  Ni: (c, soft) => (
    <g>
      <circle cx="24" cy="24" r="17" fill={soft} opacity=".55" />
      {ring(24, 24, 18, 7, -Math.PI / 2).map(({ x, y }, i) => (
        <line key={i} x1={x} y1={y} x2="24" y2="24" stroke={c} strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
      ))}
      <circle cx="24" cy="24" r="6" fill={c} />
    </g>
  ),

  /* An open lens taking the world in at full colour, rays outward. */
  Se: (c, soft) => (
    <g>
      {ring(24, 24, 19, 8).map(({ x, y }, i) => (
        <line
          key={i}
          x1={24 + (x - 24) * 0.7} y1={24 + (y - 24) * 0.7}
          x2={x} y2={y}
          stroke={c} strokeWidth="2.4" strokeLinecap="round"
        />
      ))}
      <circle cx="24" cy="24" r="10" fill={soft} stroke={c} strokeWidth="2.4" />
      <circle cx="24" cy="24" r="4" fill={c} />
    </g>
  ),

  /* The archive: strata laid down in order, the deepest the widest. */
  Si: (c, soft) => (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={24 - (17 - i * 3)}
          y={34 - i * 7.5}
          width={(17 - i * 3) * 2}
          height="5.4"
          rx="2.7"
          fill={i === 0 ? c : soft}
          stroke={c}
          strokeWidth={i === 0 ? 0 : 1.4}
          opacity={i === 0 ? 1 : 1 - i * 0.12}
        />
      ))}
    </g>
  ),

  /* Steps rising to the point of it all. */
  Te: (c, soft) => (
    <g>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={8 + i * 9.5} y={36 - i * 8} width="7" height={6 + i * 8} rx="2" fill={soft} stroke={c} strokeWidth="1.6" />
      ))}
      <line x1="12" y1="18" x2="36" y2="10" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
      <path d={arrowhead(38.5, 9.2, 3, -1, 7)} fill={c} />
      <circle cx="40" cy="9" r="3.2" fill={c} />
    </g>
  ),

  /* A lattice assembled from the ground up, joint by joint. */
  Ti: (c, soft) => (
    <g>
      <line x1="24" y1="38" x2="24" y2="28" stroke={c} strokeWidth="2" />
      <line x1="24" y1="28" x2="14" y2="19" stroke={c} strokeWidth="2" />
      <line x1="24" y1="28" x2="34" y2="19" stroke={c} strokeWidth="2" />
      <line x1="14" y1="19" x2="9" y2="11" stroke={c} strokeWidth="1.7" opacity=".8" />
      <line x1="14" y1="19" x2="19" y2="11" stroke={c} strokeWidth="1.7" opacity=".8" />
      <line x1="34" y1="19" x2="29" y2="11" stroke={c} strokeWidth="1.7" opacity=".8" />
      <line x1="34" y1="19" x2="39" y2="11" stroke={c} strokeWidth="1.7" opacity=".8" />
      <circle cx="24" cy="38" r="4" fill={c} />
      {[[14, 19], [34, 19]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.2" fill={soft} stroke={c} strokeWidth="1.6" />
      ))}
      {[[9, 11], [19, 11], [29, 11], [39, 11]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.4" fill={soft} stroke={c} strokeWidth="1.4" />
      ))}
    </g>
  ),

  /* People, linked in a ring — the value lives between them. */
  Fe: (c, soft) => (
    <g>
      <circle cx="24" cy="24" r="14" fill="none" stroke={c} strokeWidth="1.6" opacity=".5" />
      {ring(24, 24, 14, 6).map(({ x, y }, i) => (
        <circle key={i} cx={x} cy={y} r="4.4" fill={i === 0 ? c : soft} stroke={c} strokeWidth="1.6" />
      ))}
    </g>
  ),

  /* A plumb line dropped to an inner core: true is measured inside. */
  Fi: (c, soft) => (
    <g>
      <circle cx="24" cy="28" r="12" fill={soft} opacity=".6" />
      <line x1="24" y1="6" x2="24" y2="22" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="6.5" r="2.2" fill={c} />
      <circle cx="24" cy="28" r="6.5" fill={c} />
      <circle cx="24" cy="28" r="2.4" fill="var(--surface)" />
    </g>
  ),
};
