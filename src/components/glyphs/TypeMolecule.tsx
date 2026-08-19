import { stack, type MbtiType } from "../../engine/core";
import { SLOT_NAMES } from "../../engine/data";
import { usePalette } from "../Theme";
import { RANK_RATIO } from "./geometry";

/**
 * A type drawn as a molecule: its four ego functions as beads, sized by
 * rank (Lead largest, Cave smallest), joined by crossed bonds. Every
 * type's molecule is visibly different, every one is computed from
 * stack(), and together they give each of the sixteen a face — the same
 * glyph on its tile, its page header and its node in a group ring.
 *
 * Function labels appear inside the two big beads from 56px up; below
 * that the shape and the colours carry it, and the aria label names all
 * four slots.
 *
 * Original artwork.
 */
export default function TypeMolecule({ type, size = 64, labels }: {
  type: MbtiType;
  size?: number;
  /** Force labels on/off; default shows them at size ≥ 56. */
  labels?: boolean;
}) {
  const p = usePalette();
  const st = stack(type).slice(0, 4);
  const showLabels = labels ?? size >= 56;

  /* Lead upper-left, Support right, Delight lower-left, Cave lower-right —
     bonds cross Lead↔Cave and Support↔Delight, so the strongest and the
     feared sit on one axis, the steady and the playful on the other. */
  const POS = [
    { x: 36, y: 38 },
    { x: 70, y: 44 },
    { x: 38, y: 74 },
    { x: 68, y: 74 },
  ];
  const R = 21;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={
        `${type} as a molecule: ` +
        st.map((fn, i) => `${SLOT_NAMES[i]} ${fn}`).join(", ")
      }
      style={{ display: "block", flex: "0 0 auto" }}
    >
      <line x1={POS[0].x} y1={POS[0].y} x2={POS[3].x} y2={POS[3].y} stroke="var(--rule-strong)" strokeWidth="2.5" />
      <line x1={POS[1].x} y1={POS[1].y} x2={POS[2].x} y2={POS[2].y} stroke="var(--rule-strong)" strokeWidth="2.5" />

      {st.map((fn, i) => {
        const r = R * RANK_RATIO[i];
        const { x, y } = POS[i];
        return (
          <g key={fn}>
            <circle cx={x} cy={y} r={r} fill={p.fn(fn)} />
            {/* extraverted beads glow outward; intraverted carry a core */}
            {fn[1] === "e"
              ? <circle cx={x} cy={y} r={r + 3} fill="none" stroke={p.fn(fn)} strokeOpacity=".35" strokeWidth="2" />
              : <circle cx={x} cy={y} r={r * 0.35} fill="var(--canvas)" opacity=".55" />}
            {showLabels && i < 2 && (
              /* Fixed inks, not vars: extraverted beads are the LIGHT palette
                 variant in both themes (dark text holds), intraverted the deep
                 one (light text holds). A var would flip with the theme while
                 the bead colour does not. */
              <text
                x={x} y={y + (i === 0 ? 8 : 7)}
                textAnchor="middle"
                fontFamily="var(--mono)"
                fontSize={i === 0 ? 24 : 20}
                fontWeight="600"
                fill={fn[1] === "e" ? "#241F19" : "#FDFCFA"}
              >
                {fn}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
