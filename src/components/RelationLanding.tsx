import { stack, type MbtiType } from "../engine/core";
import { DOM_AUX, SLOT_NAMES } from "../engine/data";
import { usePalette } from "./Theme";

/**
 * The mechanism behind every relation, drawn: two stacks side by side, with
 * arrows showing where the reader's two strongest functions LAND in the
 * other person's stack.
 *
 * This is the whole engine in one picture. All 256 relations, both ease
 * directions, supervision and the playbooks reduce to this question — when
 * your Lead and Support arrive, which of my eight slots do they hit? A
 * Counterpart's strengths land on the Cave and Delight (relief); a Headwind
 * pairing's land on the Blind spot and Dread (nobody can tell what is
 * happening).
 *
 * `a` is the person being read, `b` the person doing the reading — the same
 * orientation as the pair reader. Arrows run from b's top two into a's stack.
 *
 * Original artwork, derived from stack() at render time.
 */
export default function RelationLanding({ a, b }: { a: MbtiType; b: MbtiType }) {
  const p = usePalette();
  const aStack = stack(a);
  const bStack = stack(b);
  const [bLead, bSupport] = DOM_AUX[b];
  const landings = [bLead, bSupport].map((fn) => aStack.indexOf(fn));

  const ROW = 44;
  const TOP = 46;
  const W = 560;
  const H = TOP + ROW * 8 + 12;
  const COL_A = { x: 24, w: 176 };            // a's stack, left
  const COL_B = { x: W - 200, w: 176 };       // b's stack, right
  const midY = (i: number) => TOP + ROW * i + ROW / 2;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={
        `${b}'s strongest functions landing in ${a}'s stack: ${bLead} lands on ${a}'s ` +
        `${SLOT_NAMES[landings[0]]}, ${bSupport} on ${a}'s ${SLOT_NAMES[landings[1]]}.`
      }
      style={{ display: "block", maxWidth: 620, fontFamily: "var(--sans)" }}
    >
      <defs>
        {[bLead, bSupport].map((fn) => (
          <marker
            key={fn} id={`arrow-${fn}`} viewBox="0 0 8 8"
            refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill={p.fn(fn)} />
          </marker>
        ))}
      </defs>

      {/* Matched to the pair page's perspective bar, which says "You are B"
          and "Them: A". "being read" / "reading" named the mechanism and left
          the reader to work out which column was which person. */}
      <text x={COL_A.x} y="18" fill="var(--ink)" fontSize="15" fontWeight="600">
        Them — {a}
      </text>
      <text x={COL_B.x + COL_B.w} y="18" fill="var(--ink)" fontSize="15" fontWeight="600" textAnchor="end">
        You — {b}
      </text>

      {/* a's ego band */}
      <rect
        x={COL_A.x - 8} y={TOP - 4} width={COL_A.w + 16} height={ROW * 4}
        rx="8" fill="var(--surface-2)" opacity="0.7"
      />

      {aStack.map((fn, i) => {
        const hit = landings.indexOf(i);
        return (
          <g key={`a${i}`}>
            {hit >= 0 && (
              <rect
                x={COL_A.x - 8} y={midY(i) - ROW / 2 + 2} width={COL_A.w + 16} height={ROW - 4}
                rx="6" fill={p.glow(fn)} stroke={p.fn(fn)} strokeOpacity="0.5"
              />
            )}
            <text x={COL_A.x} y={midY(i) + 5} fill="var(--muted)" fontSize="14" style={{ fontVariantNumeric: "tabular-nums" }}>
              {i + 1}
            </text>
            <text x={COL_A.x + 22} y={midY(i) + 5} fill={i < 4 ? "var(--ink)" : "var(--muted)"} fontSize="15">
              {SLOT_NAMES[i]}
            </text>
            <text
              x={COL_A.x + COL_A.w} y={midY(i) + 5} textAnchor="end"
              fill={p.fn(fn)} fontSize="16" fontWeight="600" fontFamily="var(--mono)"
            >
              {fn}
            </text>
          </g>
        );
      })}

      {/* b's stack — only the top two matter here, the rest are ghosted */}
      {bStack.map((fn, i) => {
        const isSource = i < 2;
        return (
          <g key={`b${i}`} opacity={isSource ? 1 : 0.45}>
            <text
              x={COL_B.x} y={midY(i) + 5}
              fill={p.fn(fn)} fontSize="16" fontWeight={isSource ? 700 : 500} fontFamily="var(--mono)"
            >
              {fn}
            </text>
            <text x={COL_B.x + 44} y={midY(i) + 5} fill={isSource ? "var(--ink)" : "var(--muted)"} fontSize="15">
              {SLOT_NAMES[i]}
            </text>
          </g>
        );
      })}

      {/* the landing arrows */}
      {landings.map((slot, n) => {
        const fn = n === 0 ? bLead : bSupport;
        const x1 = COL_B.x - 10;
        const y1 = midY(n);
        const x2 = COL_A.x + COL_A.w + 14;
        const y2 = midY(slot);
        const bend = (x1 + x2) / 2;
        return (
          <path
            key={fn}
            d={`M ${x1} ${y1} C ${bend} ${y1}, ${bend} ${y2}, ${x2} ${y2}`}
            fill="none"
            stroke={p.fn(fn)}
            strokeWidth="2"
            strokeOpacity="0.8"
            markerEnd={`url(#arrow-${fn})`}
          />
        );
      })}
    </svg>
  );
}
