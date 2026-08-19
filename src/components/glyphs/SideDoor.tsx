import type { SlotName } from "../../engine/data";
import type { SideKey } from "../../engine/sides";

/**
 * A side of the mind as the door you enter it through. The lintel names
 * the GATEWAY SEAT — always one of the ego's own eight — and the door's
 * state is the side's honest condition, the deck's openness ladder:
 *
 *   ego           open: you live here
 *   subconscious  ajar: opens with courage, past insecurity
 *   unconscious   cracked: opens with trust, past worry
 *   superego      barred: opens last, and opens YOU if forced early
 *
 * The gate is named as a seat, never as an element: which element stands
 * in a gate changes with every type, so an element-coloured keystone
 * (the first build's design) made a type-agnostic figure type-specific.
 * The print deck settled this — GATE: THE CAVE on the lintel — and the
 * app follows it.
 *
 * Original artwork.
 */
export default function SideDoor({ side, gate }: {
  side: SideKey;
  /** The ego seat that opens this side (Lead, Cave, Doubt or Dread). */
  gate: SlotName;
}) {
  const STATE_LABEL: Record<SideKey, string> = {
    ego: "open — you live here",
    subconscious: "ajar — opens past insecurity",
    unconscious: "cracked — opens past worry",
    superego: "barred — opens last: seized, or earned",
  };
  const STATE_WORD: Record<SideKey, string> = {
    ego: "open",
    subconscious: "ajar",
    unconscious: "cracked",
    superego: "barred",
  };

  /* the arch: jambs up, a curve over the top */
  const arch = "M 14 84 L 14 42 Q 14 18 36 18 Q 58 18 58 42 L 58 84";

  return (
    <svg
      width="76"
      height="130"
      viewBox="0 0 76 130"
      role="img"
      aria-label={`The ${side} door — gate: the ${gate}. ${STATE_LABEL[side]}`}
      style={{ display: "block", flex: "0 0 auto" }}
    >
      {/* the lintel: which SEAT opens this side */}
      <text x="38" y="11" textAnchor="middle" fontSize="14" fontWeight="600" letterSpacing="0.04em" fill="var(--ink)">
        {gate.toUpperCase()}
      </text>

      <g transform="translate(2, 14)">
        {/* what's inside: lit for the ego, dim for the rest */}
        <path
          d={`${arch} Z`}
          fill={side === "ego" ? "var(--accent-soft)" : "var(--sunk)"}
        />

        {/* the door panel, by the openness ladder */}
        {side === "subconscious" && (
          /* ajar: the panel swung inward from the right jamb */
          <path d="M 58 84 L 58 42 Q 58 18 36 18 L 40 24 Q 52 28 52 46 L 52 84 Z" fill="var(--surface-2)" stroke="var(--rule-strong)" strokeWidth="1.4" />
        )}
        {side === "unconscious" && (
          /* cracked: shut against the left jamb, one sliver of inside showing */
          <g>
            <path d="M 17 84 L 17 44 Q 17 22 34 22 Q 50 22 50 44 L 50 84 Z" fill="var(--surface-2)" stroke="var(--rule-strong)" strokeWidth="1.4" />
            <circle cx="44" cy="56" r="2.6" fill="var(--rule-strong)" />
          </g>
        )}
        {side === "superego" && (
          <g>
            <path d="M 18 84 L 18 44 Q 18 22 36 22 Q 54 22 54 44 L 54 84 Z" fill="var(--surface-2)" stroke="var(--rule-strong)" strokeWidth="1.4" />
            <circle cx="47" cy="56" r="2.6" fill="var(--rule-strong)" />
            <g stroke="var(--danger)" strokeWidth="4" strokeLinecap="round" opacity=".85">
              <line x1="16" y1="38" x2="56" y2="66" />
              <line x1="56" y1="38" x2="16" y2="66" />
            </g>
          </g>
        )}

        {/* the frame, over everything */}
        <path d={arch} fill="none" stroke="var(--ink-2)" strokeWidth="3" strokeLinecap="round" />
        <line x1="8" y1="84" x2="64" y2="84" stroke="var(--ink-2)" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* the rung of the openness ladder this door stands on */}
      <text x="38" y="126" textAnchor="middle" fontSize="14" fill="var(--muted)">
        {STATE_WORD[side]}
      </text>
    </svg>
  );
}
