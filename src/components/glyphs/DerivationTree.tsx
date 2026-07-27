import { type Fn } from "../../engine/data";
import { usePalette } from "../Theme";

/**
 * How four letters become eight functions, drawn as the branching it is:
 * a mind takes in and decides → Perceiving and Judging → the four element
 * families → each facing outward or inward. The predecessor component
 * implied this tree with indentation and no edges; this one draws them.
 *
 * Original artwork.
 */
export default function DerivationTree() {
  const p = usePalette();

  const leaves: { fn: Fn; x: number }[] = [
    { fn: "Se", x: 44 }, { fn: "Si", x: 124 },
    { fn: "Ne", x: 204 }, { fn: "Ni", x: 284 },
    { fn: "Te", x: 364 }, { fn: "Ti", x: 444 },
    { fn: "Fe", x: 524 }, { fn: "Fi", x: 604 },
  ];
  const families = [
    { label: "Sensing", x: 84, pair: [44, 124], c: p.fn("Se") },
    { label: "Intuition", x: 244, pair: [204, 284], c: p.fn("Ne") },
    { label: "Thinking", x: 404, pair: [364, 444], c: p.fn("Te") },
    { label: "Feeling", x: 564, pair: [524, 604], c: p.fn("Fe") },
  ];

  const Y = { root: 30, branch: 92, family: 158, leaf: 232, legend: 296 };

  return (
    <svg
      width="100%"
      viewBox="0 0 648 310"
      role="img"
      aria-label={
        "The derivation of the eight functions: perceiving splits into Sensing and Intuition, " +
        "judging into Thinking and Feeling, and each family faces outward (e) or inward (i)."
      }
      style={{ display: "block", fontFamily: "var(--sans)" }}
    >
      <text x="324" y={Y.root} textAnchor="middle" fontSize="17" fontWeight="600" fill="var(--ink)">
        A mind takes things in, and decides about them
      </text>

      {/* root → the two jobs */}
      {[
        { x: 164, label: "Perceiving — takes in", to: [84, 244] },
        { x: 484, label: "Judging — decides", to: [404, 564] },
      ].map((b) => (
        <g key={b.label}>
          <line x1="324" y1={Y.root + 10} x2={b.x} y2={Y.branch - 16} stroke="var(--rule-strong)" strokeWidth="2" />
          <text x={b.x} y={Y.branch} textAnchor="middle" fontSize="16" fontWeight="600" fill="var(--ink-2)">
            {b.label}
          </text>
          {b.to.map((fx) => (
            <line key={fx} x1={b.x} y1={Y.branch + 8} x2={fx} y2={Y.family - 20} stroke="var(--rule-strong)" strokeWidth="1.8" />
          ))}
        </g>
      ))}

      {/* the four families */}
      {families.map((f) => (
        <g key={f.label}>
          <text x={f.x} y={Y.family} textAnchor="middle" fontSize="16" fontWeight="600" fill={f.c}>
            {f.label}
          </text>
          {f.pair.map((lx) => (
            <line key={lx} x1={f.x} y1={Y.family + 8} x2={lx} y2={Y.leaf - 24} stroke="var(--rule-strong)" strokeWidth="1.6" />
          ))}
        </g>
      ))}

      {/* the eight leaves */}
      {leaves.map(({ fn, x }) => (
        <g key={fn}>
          <circle cx={x} cy={Y.leaf} r="19" fill={p.glow(fn)} stroke={p.fn(fn)} strokeWidth="2.2" />
          {fn[1] === "e"
            ? <circle cx={x} cy={Y.leaf} r="23" fill="none" stroke={p.fn(fn)} strokeOpacity=".35" strokeWidth="1.6" />
            : <circle cx={x} cy={Y.leaf} r="6.5" fill={p.fn(fn)} opacity=".3" />}
          <text x={x} y={Y.leaf + 6} textAnchor="middle" fontFamily="var(--mono)" fontSize="16" fontWeight="600" fill={p.fn(fn)}>
            {fn}
          </text>
        </g>
      ))}

      <text x="324" y={Y.legend} textAnchor="middle" fontSize="14" fill="var(--muted)">
        In each pair: left faces outward (…e, ringed), right faces inward (…i, cored)
      </text>
    </svg>
  );
}
