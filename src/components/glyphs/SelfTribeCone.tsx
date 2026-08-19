import { type Fn, FN_FULL } from "../../engine/data";
import { usePalette } from "../Theme";
import { person, outward } from "./geometry";

/**
 * Where a function's calibration comes from, drawn: an intraverted
 * function is a narrow beam rising from one person to a single point they
 * hold alone; an extraverted function is a wide fan cast over the crowd.
 * Fi answers to the self's values, Fe to the tribe's; Ti to the self's
 * reasons, Te to the tribe's — and the same inward/outward reading holds
 * for the observers.
 *
 * Original artwork. People are rule-5 geometry: a head and a shoulder arc.
 */
export default function SelfTribeCone({ fn }: { fn: Fn }) {
  const p = usePalette();
  const c = p.fn(fn);
  const soft = p.glow(fn);
  const out = outward(fn);

  const me = person(60, 100, 7);

  return (
    <svg
      width="100%"
      viewBox="0 0 120 110"
      role="img"
      aria-label={
        `${fn} — ${FN_FULL[fn]}: calibrated ${out ? "on the tribe — a wide beam cast over many people" : "on the self — one narrow beam held alone"}`
      }
      style={{ display: "block", maxWidth: 170, margin: "0 auto" }}
    >
      {out ? (
        <g>
          {/* the fan, over the crowd */}
          <path d={`M 60 ${me.head.cy - 4} L 10 18 Q 60 4, 110 18 Z`} fill={soft} opacity=".8" />
          {[22, 41, 60, 79, 98].map((x, i) => {
            const other = person(x, 40, 4.6);
            return (
              <g key={i} opacity=".75">
                <circle {...other.head} fill="var(--ink-2)" />
                <path d={other.shoulders} stroke="var(--ink-2)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                <circle cx={x} cy={other.head.cy - 10} r="3.4" fill={c} />
              </g>
            );
          })}
        </g>
      ) : (
        <g>
          {/* the beam, held alone */}
          <path d={`M 60 ${me.head.cy - 4} L 53 16 Q 60 12, 67 16 Z`} fill={soft} opacity=".9" />
          <circle cx="60" cy="14" r="7.5" fill={c} />
          <circle cx="60" cy="14" r="2.6" fill="var(--canvas)" opacity=".6" />
        </g>
      )}

      <circle {...me.head} fill="var(--ink)" />
      <path d={me.shoulders} stroke="var(--ink)" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
