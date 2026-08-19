import { stack, type MbtiType } from "../engine/core";
import { ops } from "../engine/ops";
import { SLOT_NAMES, SLOT_TAGS, FN_FULL, type Fn } from "../engine/data";
import { SLOT_PLAIN } from "../engine/plain";
import { FnDiscMark } from "./glyphs/FnDisc";
import { usePalette } from "./Theme";

/**
 * The eight slots as a single readable column.
 *
 * Two regions are marked, and with the demons taken as the axis opposites of
 * the saviors they now OVERLAP rather than sitting in different blocks:
 *   · cave    — the Cave, alone (slot 4)
 *   · demons  — Delight and Cave (slots 3 and 4)
 * So the two readings agree that slot 4 is the sore spot and disagree about
 * slot 3: one calls it the Delight and treats it as something to enjoy, the
 * other calls it a demon and treats it as neglected. That is the real
 * divergence, and it is more interesting than the one the first build drew.
 *
 * No text below 14px. Nothing depends on colour alone.
 */
export default function WiringSchematic({ type, showCorrespondence }: {
  type: MbtiType;
  /**
   * Draw the four ego↔shadow arcs: 1↔5, 2↔6, 3↔7, 4↔8. Each pair is the same
   * element with the attitude flipped — the shadow is not a second personality
   * but the same four capacities facing the other way, and the arcs make that
   * a fact of the picture instead of a sentence.
   */
  showCorrespondence?: boolean;
}) {
  const p = usePalette();
  const st = stack(type);
  const o = ops(type);
  const savior = new Set<Fn>([o.saviorObs, o.saviorDec]);
  const demon = new Set<Fn>([o.demonObs, o.demonDec]);

  const ROW = 54;
  const TOP = 44;
  const W = 660;
  const RAIL = 224;
  const H = TOP + ROW * 8 + 16 + (showCorrespondence ? 24 : 0);

  const rowY = (i: number) => TOP + ROW * i + ROW / 2;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`The eight function seats of ${type}, from Lead down to Dread`}
      style={{ display: "block", maxWidth: 700, fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <text x="0" y="16" fill="var(--muted)" fontSize="14" fontWeight="600">
        {type} — the eight seats
      </text>
      <text x={W} y="16" fill="var(--muted)" fontSize="14" textAnchor="end">
        1–4 you · 5–8 your shadow
      </text>

      {/* ego / shadow band */}
      <rect x="0" y={TOP - 10} width={W} height={ROW * 4} rx="8" fill="var(--surface-2)" opacity="0.7" />

      {/* ego↔shadow correspondence: same element, attitude flipped. Four
          parallel arcs in the free lane left of the rail, one per pair, each
          in its element's colour. Drawn under the nodes. */}
      {showCorrespondence && (
        // biome-ignore lint/a11y/noAriaHiddenOnFocusable: an SVG <g> of decorative paths is never focusable — the rule assumes HTML.
        <g aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M ${RAIL - 16} ${rowY(i)} C ${RAIL - 84} ${rowY(i)}, ${RAIL - 84} ${rowY(i + 4)}, ${RAIL - 16} ${rowY(i + 4)}`}
              fill="none"
              stroke={p.fn(st[i])}
              strokeOpacity="0.4"
              strokeWidth="1.5"
              strokeDasharray="3 4"
            />
          ))}
          <text x="0" y={H - 6} fill="var(--muted)" fontSize="14">
            1↔5 · 2↔6 · 3↔7 · 4↔8 — each shadow seat holds its ego seat&apos;s tool, facing the other way
          </text>
        </g>
      )}

      {st.map((fn, i) => {
        const y = TOP + ROW * i + ROW / 2;
        const shadow = i >= 4;
        const col = p.fn(fn);
        const isCave = i === 3;
        const isOpsSavior = !shadow && savior.has(fn);
        const isOpsDemon = !shadow && demon.has(fn);

        return (
          <g key={fn}>
            {i < 7 && (
              <line
                x1={RAIL} y1={y + 18} x2={RAIL} y2={y + ROW - 18}
                stroke={i === 3 ? "var(--rule-strong)" : col}
                strokeOpacity={i === 3 ? 1 : shadow ? 0.3 : 0.45}
                strokeWidth={i === 3 ? 1.5 : 2}
                strokeDasharray={i === 3 ? "4 5" : undefined}
              />
            )}

            {/* slot number + name */}
            <text x="0" y={y + 5} fill="var(--muted)" fontSize="14" style={{ fontVariantNumeric: "tabular-nums" }}>
              {i + 1}
            </text>
            <text x="22" y={y + 5} fill={shadow ? "var(--muted)" : "var(--ink)"} fontSize="16" fontWeight="500">
              {SLOT_NAMES[i]}
            </text>
            <text x="22" y={y + 23} fill="var(--muted)" fontSize="14">
              {SLOT_TAGS[i]}
            </text>

            {/* node — the deck's mark: letters in the disc, filled while
                conscious, hollow once the stack crosses into shadow, ripples
                breaking outward for e and inward for i. */}
            <FnDiscMark fn={fn} cx={RAIL} cy={y} r={14} solid={!shadow} />

            {/* meaning — the disc itself carries the two letters now */}
            <text x={RAIL + 34} y={y - 2} fill={shadow ? "var(--muted)" : "var(--ink)"} fontSize="15">
              {FN_FULL[fn]}
            </text>
            <text x={RAIL + 34} y={y + 19} fill="var(--muted)" fontSize="14">
              {shortPlain(SLOT_PLAIN[SLOT_NAMES[i]])}
            </text>

            {/* markers, right edge */}
            {isCave && <Marker x={W} y={y - 8} text="the cave" tone="var(--warn)" />}
            {isOpsSavior && <Marker x={W} y={y - 8} text="anchor" tone="var(--accent-ink)" />}
            {isOpsDemon && !isCave && <Marker x={W} y={y - 8} text="flinch" tone="var(--warn)" />}
            {isOpsDemon && isCave && <Marker x={W} y={y + 10} text="flinch" tone="var(--warn)" />}
          </g>
        );
      })}
    </svg>
  );
}

/** A bracket calling out a region of the stack, with a label. */
function Marker({ x, y, text, tone }: { x: number; y: number; text: string; tone: string }) {
  return (
    <text x={x} y={y} textAnchor="end" fill={tone} fontSize="14" fontWeight="500">
      {text}
    </text>
  );
}

/** The slot plain-language line, trimmed to its first clause for the diagram. */
const shortPlain = (s: string) => s.split(".")[0] + ".";
