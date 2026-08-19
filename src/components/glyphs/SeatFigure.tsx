import { SLOT_NAMES } from "../../engine/data";

/**
 * One seat located among the eight — the deck's Seat card art, on screen.
 *
 * Eight bars falling with awareness, split into CONSCIOUS and SHADOW, with
 * an arc from this seat to its twin across the divide: seats n and n+4
 * hold one tool facing opposite ways, and the arc draws the fact the
 * caption states. DELIBERATELY ELEMENT-FREE, like the card: which element
 * sits in a seat is exactly the thing that varies across the sixteen
 * wirings, so the bars carry their number and their awareness and nothing
 * more — ink, never a hue.
 */
export default function SeatFigure({ depth }: {
  /** The seat in focus, 0-based (0 = Lead … 7 = Dread). */
  depth: number;
}) {
  const W = 640;
  const H = 200;
  const gapW = (W - 52) / 8;
  const bw = gapW * 0.54;
  const floor = 142;
  const xAt = (i: number) => 26 + gapW * (i + 0.5);
  const hAt = (i: number) => 84 - i * 8;
  // Seats i and i+4 hold one tool facing opposite ways — the twin the arc points at.
  const twin = depth < 4 ? depth + 4 : depth - 4;
  const [ax, bx] = [xAt(depth), xAt(twin)];
  const split = 26 + gapW * 4;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={
        `Seat ${depth + 1} of 8 — the ${SLOT_NAMES[depth]}, ` +
        `${depth < 4 ? "conscious" : "shadow"}. Its twin is seat ${twin + 1}, ` +
        `the ${SLOT_NAMES[twin]}: the same tool, facing the other way.`
      }
      style={{ display: "block", maxWidth: 680, fontFamily: "var(--sans)" }}
    >
      {/* the caption owns the top strip; the arc crests under it */}
      <text x={(ax + bx) / 2} y="16" textAnchor="middle" fill="var(--muted)" fontSize="14" fontWeight="600" letterSpacing="0.06em">
        SAME TOOL, FACING THE OTHER WAY
      </text>

      {/* the twin arc */}
      <path
        d={`M ${ax} ${floor - hAt(depth) - 4} Q ${(ax + bx) / 2} 28 ${bx} ${floor - hAt(twin) - 4}`}
        fill="none" stroke="var(--ink-2)" strokeWidth="1.5" strokeOpacity="0.6"
      />

      {/* eight bars, tallest first — awareness falls left to right */}
      {SLOT_NAMES.map((name, i) => {
        const x = xAt(i);
        const here = i === depth;
        const isTwin = i === twin;
        const h = hAt(i);
        return (
          <g key={name}>
            <rect
              x={x - bw / 2} y={floor - h} width={bw} height={h}
              fill={here ? "var(--ink)" : "var(--surface-2)"}
              fillOpacity={here ? 0.9 : 1}
              stroke={here || isTwin ? "var(--ink-2)" : "var(--rule-strong)"}
              strokeWidth={here ? 1.5 : isTwin ? 1.5 : 1}
              strokeDasharray={isTwin ? "4 4" : undefined}
            />
            <text
              x={x} y={floor + 20} textAnchor="middle"
              fill={here ? "var(--ink)" : "var(--muted)"}
              fontSize="14" fontWeight={here ? 700 : 500}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {i + 1}
            </text>
          </g>
        );
      })}
      <line x1="14" y1={floor} x2={W - 14} y2={floor} stroke="var(--rule-strong)" strokeWidth="1" />

      {/* the conscious/shadow divide, under the baseline like the card */}
      <line x1={split} y1="40" x2={split} y2={floor + 26} stroke="var(--rule-strong)" strokeWidth="1" strokeDasharray="2 3" />
      <text
        x={26 + gapW * 2} y={floor + 44} textAnchor="middle" fontSize="14" fontWeight="600"
        letterSpacing="0.08em" fill={depth < 4 ? "var(--ink)" : "var(--muted)"}
      >
        CONSCIOUS
      </text>
      <text
        x={26 + gapW * 6} y={floor + 44} textAnchor="middle" fontSize="14" fontWeight="600"
        letterSpacing="0.08em" fill={depth < 4 ? "var(--muted)" : "var(--ink)"}
      >
        SHADOW
      </text>
    </svg>
  );
}
