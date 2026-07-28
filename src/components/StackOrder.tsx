import { stack, type MbtiType } from "../engine/core";
import { RANK_RATIO } from "./glyphs/geometry";
import { usePalette } from "./Theme";

/**
 * Figure A from the catalogue: the eight slots as one shape, ranked by
 * size, coloured by element — front four solid, back four quiet. No
 * overlay, no correspondence arcs, no keyword column; those are separate
 * figures (B and C) doing one job each. This is only: here is the order.
 */
export default function StackOrder({ type }: { type: MbtiType }) {
  const p = usePalette();
  const st = stack(type);

  const ROW = 26, GAP = 9, TOP = 4, W = 260, MAXBAR = W - 60;

  return (
    <svg
      viewBox={`0 0 ${W} ${TOP * 2 + ROW * 8 + GAP * 7}`}
      width="100%"
      role="img"
      aria-label={`${type}'s eight functions in one order, from most to least reached-for: ${st.join(", ")}. The front four are solid; the back four are quiet.`}
      style={{ display: "block", maxWidth: 320, fontFamily: "var(--sans)" }}
    >
      {st.map((fn, i) => {
        const shadow = i >= 4;
        const w = shadow ? MAXBAR * 0.3 : MAXBAR * RANK_RATIO[i];
        const y = TOP + i * (ROW + GAP);
        return (
          <g key={fn}>
            <rect x="0" y={y} width={w} height={ROW} rx={ROW / 2} fill={p.fn(fn)} opacity={shadow ? 0.32 : 1} />
            <text
              x={w + 10} y={y + ROW / 2 + 5}
              fontFamily="var(--mono)" fontSize="15" fontWeight={shadow ? 400 : 600}
              fill={shadow ? "var(--muted)" : "var(--ink)"}
            >
              {fn}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
