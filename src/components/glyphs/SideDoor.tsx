import type { Fn } from "../../engine/data";
import type { SideKey } from "../../engine/sides";
import { usePalette } from "../Theme";

/**
 * A side of the mind as the door you enter it through. The keystone bead
 * is the gateway function — always one of the ego's own four — and the
 * door's state is the side's honest condition:
 *
 *   ego           open: you live here
 *   subconscious  ajar: opens with courage, past insecurity
 *   unconscious   closed: opens with trust, past worry
 *   superego      barred: opens last, and opens YOU if forced early
 *
 * Original artwork.
 */
export default function SideDoor({ side, fn }: { side: SideKey; fn: Fn }) {
  const p = usePalette();
  const c = p.fn(fn);

  const STATE_LABEL: Record<SideKey, string> = {
    ego: "open — you live here",
    subconscious: "ajar — opens past insecurity",
    unconscious: "closed — opens past worry",
    superego: "barred — opens last, if at all",
  };

  /* the arch: jambs up, a curve over the top */
  const arch = "M 14 84 L 14 42 Q 14 18 36 18 Q 58 18 58 42 L 58 84";

  return (
    <svg
      width="72"
      height="92"
      viewBox="0 0 72 92"
      role="img"
      aria-label={`The ${side} door, keystone ${fn}: ${STATE_LABEL[side]}`}
      style={{ display: "block", flex: "0 0 auto" }}
    >
      {/* what's inside: lit for the ego, dim for the rest */}
      <path
        d={`${arch} Z`}
        fill={side === "ego" ? p.glow(fn) : "var(--sunk)"}
        opacity={side === "ego" ? 0.9 : 1}
      />

      {/* the door panel, by state */}
      {side === "subconscious" && (
        /* ajar: the panel swung inward from the right jamb */
        <path d="M 58 84 L 58 42 Q 58 18 36 18 L 40 24 Q 52 28 52 46 L 52 84 Z" fill="var(--surface-2)" stroke="var(--rule-strong)" strokeWidth="1.4" />
      )}
      {(side === "unconscious" || side === "superego") && (
        <g>
          <path d="M 18 84 L 18 44 Q 18 22 36 22 Q 54 22 54 44 L 54 84 Z" fill="var(--surface-2)" stroke="var(--rule-strong)" strokeWidth="1.4" />
          <circle cx="47" cy="56" r="2.6" fill="var(--rule-strong)" />
        </g>
      )}
      {side === "superego" && (
        <g stroke="var(--danger)" strokeWidth="4" strokeLinecap="round" opacity=".85">
          <line x1="16" y1="38" x2="56" y2="66" />
          <line x1="56" y1="38" x2="16" y2="66" />
        </g>
      )}

      {/* the frame, over everything */}
      <path d={arch} fill="none" stroke="var(--ink-2)" strokeWidth="3" strokeLinecap="round" />
      <line x1="8" y1="84" x2="64" y2="84" stroke="var(--ink-2)" strokeWidth="3" strokeLinecap="round" />

      {/* the keystone: the gateway function */}
      <circle cx="36" cy="16" r="7.5" fill={c} stroke="var(--canvas)" strokeWidth="1.5" />
    </svg>
  );
}
