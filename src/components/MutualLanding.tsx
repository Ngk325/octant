import { stack, ease, type MbtiType } from "../engine/core";
import { DOM_AUX, SLOT_NAMES, type Fn } from "../engine/data";
import { FnDiscMark } from "./glyphs/FnDisc";
import { usePalette } from "./Theme";

/**
 * The whole thesis in one picture: two stacks face each other, and BOTH
 * directions of the meeting are drawn at once. A's strongest two arrive in
 * B's stack (upper arc lane); B's strongest two arrive back in A's (lower
 * lane); the row each arrow lands on is lit, and each side carries its own
 * ease number — which differ, because ease is directional.
 *
 * RelationLanding draws one direction and is the right figure where a
 * reader IS one of the two people (the pair page, the course). This one
 * exists for the claim itself — "ease runs both ways" — which no one-way
 * picture can make. Feed it an asymmetric pair or the two numbers will
 * quietly agree.
 *
 * Original artwork, derived from stack() and ease() at render time.
 */
export default function MutualLanding({ a, b }: { a: MbtiType; b: MbtiType }) {
  const p = usePalette();
  const aStack = stack(a);
  const bStack = stack(b);
  const [aLead, aSupport] = DOM_AUX[a];
  const [bLead, bSupport] = DOM_AUX[b];
  const forA = ease(a, b);
  const forB = ease(b, a);

  const ROW = 42;
  const TOP = 96;
  const W = 700;
  const H = TOP + ROW * 8 + 18;
  // Disc rails; seat labels sit outboard, the arrows own the middle.
  const AX = 168;
  const BX = W - AX;
  const midY = (i: number) => TOP + ROW * i + ROW / 2;

  /** One direction's two arrows: from `fromX` discs into the other stack. */
  const arrows = (fns: [Fn, Fn], targets: number[], fromX: number, toX: number, sourceRows: number[]) =>
    fns.map((fn, n) => {
      const y1 = midY(sourceRows[n]);
      const y2 = midY(targets[n]);
      const dir = Math.sign(toX - fromX);
      const x1 = fromX + dir * 22;
      const x2 = toX - dir * 24;
      const bend = (x1 + x2) / 2;
      return (
        <path
          key={`${fn}${fromX}`}
          d={`M ${x1} ${y1} C ${bend} ${y1}, ${bend} ${y2}, ${x2} ${y2}`}
          fill="none"
          stroke={p.fn(fn)}
          strokeWidth={n === 0 ? 2.5 : 2}
          strokeOpacity={n === 0 ? 0.85 : 0.6}
          markerEnd={`url(#mutual-${fn})`}
        />
      );
    });

  const aTargets = [bStack.indexOf(aLead), bStack.indexOf(aSupport)];
  const bTargets = [aStack.indexOf(bLead), aStack.indexOf(bSupport)];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={
        `${a} and ${b}, both directions at once. ${a}'s ${aLead} lands on ${b}'s ` +
        `${SLOT_NAMES[aTargets[0]]} and ${a}'s ${aSupport} on ${b}'s ${SLOT_NAMES[aTargets[1]]}; ` +
        `coming back, ${b}'s ${bLead} lands on ${a}'s ${SLOT_NAMES[bTargets[0]]} and ${b}'s ` +
        `${bSupport} on ${a}'s ${SLOT_NAMES[bTargets[1]]}. Ease for ${a}: ${forA} of 100. ` +
        `Ease for ${b}: ${forB} of 100 — the same meeting, and not the same number.`
      }
      style={{ display: "block", fontFamily: "var(--sans)" }}
    >
      <defs>
        {[...new Set([aLead, aSupport, bLead, bSupport])].map((fn) => (
          <marker
            key={fn} id={`mutual-${fn}`} viewBox="0 0 8 8"
            refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill={p.fn(fn)} />
          </marker>
        ))}
      </defs>

      {/* each side's own headline: the type, then its own number for the SAME meeting */}
      <text x={AX} y="26" textAnchor="middle" fill="var(--ink)" fontSize="19" fontWeight="700">{a}</text>
      <text x={AX} y="56" textAnchor="middle" fontSize="26" fontWeight="700" fill={p.ease(forA)} style={{ fontVariantNumeric: "tabular-nums" }}>
        {forA}<tspan fontSize="14" fill="var(--muted)" fontWeight="500"> /100</tspan>
      </text>
      <text x={AX} y="74" textAnchor="middle" fill="var(--muted)" fontSize="14">how it feels for {a}</text>

      <text x={BX} y="26" textAnchor="middle" fill="var(--ink)" fontSize="19" fontWeight="700">{b}</text>
      <text x={BX} y="56" textAnchor="middle" fontSize="26" fontWeight="700" fill={p.ease(forB)} style={{ fontVariantNumeric: "tabular-nums" }}>
        {forB}<tspan fontSize="14" fill="var(--muted)" fontWeight="500"> /100</tspan>
      </text>
      <text x={BX} y="74" textAnchor="middle" fill="var(--muted)" fontSize="14">how it feels for {b}</text>

      <text x={W / 2} y="50" textAnchor="middle" fill="var(--muted)" fontSize="14">
        one meeting,
      </text>
      <text x={W / 2} y="68" textAnchor="middle" fill="var(--muted)" fontSize="14">
        two numbers
      </text>

      {/* conscious band behind seats 1-4, both sides */}
      <rect x={AX - 148} y={TOP - 4} width={170} height={ROW * 4} rx="8" fill="var(--surface-2)" opacity="0.7" />
      <rect x={BX - 22} y={TOP - 4} width={170} height={ROW * 4} rx="8" fill="var(--surface-2)" opacity="0.7" />

      {/* landing glows, under everything else in the rows */}
      {aTargets.map((t, n) => (
        <rect
          key={`ga${t}`} x={BX - 22} y={midY(t) - ROW / 2 + 3} width={170} height={ROW - 6} rx="6"
          fill={p.glow([aLead, aSupport][n])} stroke={p.fn([aLead, aSupport][n])} strokeOpacity="0.5"
        />
      ))}
      {bTargets.map((t, n) => (
        <rect
          key={`gb${t}`} x={AX - 148} y={midY(t) - ROW / 2 + 3} width={170} height={ROW - 6} rx="6"
          fill={p.glow([bLead, bSupport][n])} stroke={p.fn([bLead, bSupport][n])} strokeOpacity="0.5"
        />
      ))}

      {/* the arrows: A's strengths cross to B, B's cross back to A */}
      {arrows([aLead, aSupport], aTargets, AX, BX, [0, 1])}
      {arrows([bLead, bSupport], bTargets, BX, AX, [0, 1])}

      {/* the two stacks: discs on the rails, seat names outboard */}
      {aStack.map((fn, i) => (
        <g key={`a${i}`}>
          <text x={AX - 42} y={midY(i) + 5} textAnchor="end" fill={i < 4 ? "var(--ink)" : "var(--muted)"} fontSize="14">
            {SLOT_NAMES[i]}
          </text>
          <FnDiscMark fn={fn} cx={AX} cy={midY(i)} r={14} solid={i < 4} />
        </g>
      ))}
      {bStack.map((fn, i) => (
        <g key={`b${i}`}>
          <FnDiscMark fn={fn} cx={BX} cy={midY(i)} r={14} solid={i < 4} />
          <text x={BX + 42} y={midY(i) + 5} fill={i < 4 ? "var(--ink)" : "var(--muted)"} fontSize="14">
            {SLOT_NAMES[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}
