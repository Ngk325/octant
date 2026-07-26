import { stack, ops, type MbtiType } from "../engine/core";
import { FN_COLOR, FN_GLOW } from "../engine/palette";
import { SLOT_NAMES, SLOT_TAGS, FN_FULL, type Fn } from "../engine/data";

/**
 * The signal path. Ego block runs live; shadow block runs dim.
 * Two independent faults are marked, because the two instruments disagree:
 *   · CSJ  — the Inferior, the cave (a slot)
 *   · OPS  — the demon animal loop, an open circuit (a pair of functions)
 * They are not the same region. That divergence is the content.
 */
export default function WiringSchematic({ type }: { type: MbtiType }) {
  const st = stack(type);
  const o = ops(type);
  const openCircuit = new Set<Fn>([o.demonObs, o.demonDec]);

  const W = 560, TOP = 34, GAP = 46, RAIL = 96, H = TOP + GAP * 8 + 26;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
         aria-label={`Wiring schematic for ${type}`}
         style={{ display: "block", maxWidth: 620 }}>
      <defs>
        <filter id="halo" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="4.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <text x="0" y="12" fill="#6f7987" fontFamily="IBM Plex Mono" fontSize="9.5"
            letterSpacing="1.6">SIGNAL PATH · {type}</text>
      <text x={W} y="12" fill="#6f7987" fontFamily="IBM Plex Mono" fontSize="9.5"
            letterSpacing="1.6" textAnchor="end">
        EGO 1–4 · SHADOW 5–8
      </text>

      {st.map((fn, i) => {
        const y = TOP + GAP * i + 18;
        const shadow = i >= 4;
        const isInferior = i === 3;
        const isOpen = openCircuit.has(fn);
        const col = FN_COLOR[fn];
        const op = shadow ? 0.5 : 1;

        // rail segment down to the next node
        const nextY = y + GAP;
        const segment =
          i < 7 ? (
            <line
              x1={RAIL} y1={y + 11} x2={RAIL} y2={nextY - 11}
              stroke={i === 3 ? "#2a323e" : col}
              strokeOpacity={i === 3 ? 1 : shadow ? 0.28 : 0.5}
              strokeWidth={i === 3 ? 1 : 1.5}
              strokeDasharray={i === 3 ? "3 4" : undefined}
            />
          ) : null;

        return (
          <g key={fn}>
            {segment}

            {/* open-circuit break: a gap in the rail with two terminals */}
            {isOpen && (
              <>
                <line x1={RAIL - 9} y1={y} x2={RAIL - 3} y2={y} stroke="#b3743c" strokeWidth="1.4" />
                <line x1={RAIL + 3} y1={y} x2={RAIL + 9} y2={y} stroke="#b3743c" strokeWidth="1.4" />
                <circle cx={RAIL} cy={y} r="13.5" fill="none" stroke="#b3743c"
                        strokeWidth="1" strokeDasharray="2 3" opacity="0.85" />
              </>
            )}

            <circle cx={RAIL} cy={y} r={shadow ? 5.5 : 7.5} fill={col} opacity={op}
                    filter={shadow ? undefined : "url(#halo)"} />
            {!shadow && (
              <circle cx={RAIL} cy={y} r="13" fill="none" stroke={FN_GLOW[fn]} strokeWidth="1" />
            )}

            {/* slot index + name, left of the rail */}
            <text x={RAIL - 26} y={y - 2} textAnchor="end" fill="#6f7987"
                  fontFamily="IBM Plex Mono" fontSize="9.5" letterSpacing="1.2">
              {String(i + 1).padStart(2, "0")}
            </text>
            <text x={RAIL - 26} y={y + 9} textAnchor="end" fill={shadow ? "#4a525e" : "#aab3c0"}
                  fontFamily="IBM Plex Mono" fontSize="10" letterSpacing="0.6">
              {SLOT_NAMES[i].toUpperCase()}
            </text>

            {/* function + role, right of the rail */}
            <text x={RAIL + 26} y={y - 1} fill={col} opacity={shadow ? 0.75 : 1}
                  fontFamily="IBM Plex Mono" fontSize="13" letterSpacing="0.5">
              {fn}
            </text>
            <text x={RAIL + 56} y={y - 1} fill={shadow ? "#5b6472" : "#aab3c0"}
                  fontFamily="Inter" fontSize="11.5">
              {FN_FULL[fn]}
            </text>
            <text x={RAIL + 26} y={y + 12} fill="#5b6472" fontFamily="IBM Plex Mono"
                  fontSize="9.5" letterSpacing="1.1">
              [{SLOT_TAGS[i].toUpperCase()}]
              {isInferior && "  ·  CSJ: THE CAVE"}
              {isOpen && `  ·  OPS: OPEN CIRCUIT (${o.demon.toUpperCase()})`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
