import { gateways } from "../engine/sides";
import type { MbtiType } from "../engine/core";
import { usePalette } from "./Theme";
import { FnTag } from "./Bits";

const SIDE_LABEL: Record<string, string> = {
  ego: "Ego",
  subconscious: "Subconscious",
  unconscious: "Unconscious",
  superego: "Superego",
};

/**
 * The four gateways as an ordered path — because they ARE an order, not a
 * list. You develop the sides of the mind in sequence, and each one has
 * exactly one door: a function of the ego's own stack. The superego comes
 * last on purpose; its step is drawn in the danger colour because opening it
 * before the others is how it opens you instead.
 *
 * First consumer of gateways() — the engine derived this path from day one
 * and nothing ever drew it.
 */
export default function GatewayPath({ type }: { type: MbtiType }) {
  const p = usePalette();
  const path = gateways(type);

  return (
    <ol
      className="gpath"
      aria-label={`The development path of ${type}: ` +
        path.map((g) => `${SIDE_LABEL[g.side]} through ${g.fn}`).join(", then ")}
    >
      {path.map((g, i) => (
        <li key={g.side} className="gpath-step" style={{ background: p.glow(g.fn) }}>
          <span className="small muted">{i + 1} · {SIDE_LABEL[g.side]}</span>
          <span className="gpath-door">
            <FnTag fn={g.fn} size="var(--t-lg)" />
          </span>
          <span className="small" style={{ color: g.side === "superego" ? "var(--danger)" : "var(--ink-2)" }}>
            {g.side === "ego" ? "already open" : `through your ${g.egoSlot}`}
          </span>
        </li>
      ))}
    </ol>
  );
}
