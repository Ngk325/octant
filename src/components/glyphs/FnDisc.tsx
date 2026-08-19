import { FN_FULL, type Fn } from "../../engine/data";
import { usePalette } from "../Theme";
import { outward } from "./geometry";

/*
 * THE DECK'S ONE MARK, home in the app: an element, named.
 *
 * The print deck (src/cards/art.ts, fnMark) settled a grammar the app's
 * glyphs predate, and this component is that grammar as a React glyph:
 *
 *   - The two-letter code sits INSIDE the disc. Colour alone cannot say
 *     which element a circle is — four hue families over eight elements
 *     means every hue appears twice.
 *   - FILLED means conscious here, a HOLLOW ring means it runs in shadow.
 *     (Hollow never means intraverted — attitude is the ripples' job.)
 *   - Four ripples on the diagonals say which way the element faces:
 *     crests breaking outward for e, back into the disc for i. A second
 *     channel besides the small letter. The diagonals are deliberate —
 *     rows, rails and dividers all run horizontal or vertical, so the
 *     ripples never sit on top of one.
 *
 * The letters are SVG text, so the app's 14px floor applies: keep r at
 * 14 or above (the label is drawn at the disc's own radius).
 */

const polar = (cx: number, cy: number, r: number, a: number): [number, number] =>
  [cx + r * Math.cos(a), cy + r * Math.sin(a)];

/**
 * The attitude, as direction — the deck's ripple, verbatim geometry. On an
 * extraverted element the crests break outward (the tool spends itself on
 * the world); on an intraverted one they break back into the disc. Reused
 * bare by TypeMolecule, whose beads carry attitude without the letters.
 */
export function Ripple({ hue, cx, cy, r, out }: {
  hue: string; cx: number; cy: number; r: number; out: boolean;
}) {
  const w = Math.max(r * 0.08, 1);
  // Inward ripples start a shade further out — their crest travels toward
  // the rim, and the whole figure must still clear a neighbouring mark's.
  const arcR = out ? r * 1.22 : r * 1.3;
  const span = out ? 0.42 : 0.4;
  const tipR = out ? r * 1.5 : r * 1.04;
  return (
    <g>
      {[0, 1, 2, 3].map((k) => {
        const a = Math.PI / 4 + (k * Math.PI) / 2;
        const [sx, sy] = polar(cx, cy, arcR, a - span);
        const [ex, ey] = polar(cx, cy, arcR, a + span);
        const [b1x, b1y] = polar(cx, cy, arcR, a - 0.13);
        const [b2x, b2y] = polar(cx, cy, arcR, a + 0.13);
        const [tx, ty] = polar(cx, cy, tipR, a);
        return (
          <g key={k}>
            <path
              d={`M ${sx} ${sy} A ${arcR} ${arcR} 0 0 1 ${ex} ${ey}`}
              fill="none" stroke={hue} strokeWidth={w} strokeOpacity="0.45" strokeLinecap="round"
            />
            <path d={`M ${b1x} ${b1y} L ${tx} ${ty} L ${b2x} ${b2y} Z`} fill={hue} fillOpacity="0.55" />
          </g>
        );
      })}
    </g>
  );
}

/**
 * The mark as a fragment, for composing into a larger diagram's SVG:
 * ripples, disc, letters, centred at (cx, cy). `solid` is CONSCIOUSNESS,
 * not attitude. The whole figure extends to 1.5·r from the centre (the
 * outward crest tip) — leave that much clearance.
 */
export function FnDiscMark({ fn, cx, cy, r, solid = true, ghost }: {
  fn: Fn;
  cx: number;
  cy: number;
  /** Disc radius in viewBox units. Keep ≥ 14 — the letters are drawn at this size. */
  r: number;
  /** Filled = conscious here; hollow ring = runs in shadow. */
  solid?: boolean;
  /** Fade the whole mark, for de-emphasised rows. */
  ghost?: boolean;
}) {
  const p = usePalette();
  const c = p.fn(fn);
  return (
    <g opacity={ghost ? 0.45 : 1}>
      <Ripple hue={c} cx={cx} cy={cy} r={r} out={outward(fn)} />
      {solid ? (
        <>
          <circle cx={cx} cy={cy} r={r} fill={c} />
          {/* Letters punched out to the page ground, like the deck's paper. */}
          <text
            x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
            fontSize={Math.max(14, r * 1.02)} fontWeight="700" fill="var(--canvas)"
            fontFamily="var(--sans)"
          >
            {fn}
          </text>
        </>
      ) : (
        <>
          {/* Hollow interior stays the page's own ground, whatever it is. */}
          <circle cx={cx} cy={cy} r={r} fill="var(--canvas)" fillOpacity="0.001" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth={r * 0.16} strokeOpacity="0.95" />
          <text
            x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
            fontSize={Math.max(14, r * 1.02)} fontWeight="600" fill={c}
            fontFamily="var(--sans)"
          >
            {fn}
          </text>
        </>
      )}
    </g>
  );
}

/**
 * The mark standing alone — the app's `markFor()`. The viewBox is exactly
 * the ripple's own extent (crest tip at 1.5·r).
 */
export default function FnDisc({ fn, solid = true, size = 48 }: {
  fn: Fn;
  solid?: boolean;
  size?: number;
}) {
  const R = 15;
  const box = R * 3;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${box} ${box}`}
      role="img"
      aria-label={
        `${fn} — ${FN_FULL[fn]}, ${outward(fn) ? "facing out" : "facing in"}` +
        `${solid ? "" : ", in shadow"}`
      }
      style={{ display: "block", flex: "0 0 auto" }}
    >
      <FnDiscMark fn={fn} cx={box / 2} cy={box / 2} r={R} solid={solid} />
    </svg>
  );
}
