import { stack } from "./core";
import type { Fn, MbtiType } from "./data";
import type { SideKey } from "./sides";

/* ------------------------------------------------------------------ *
 * THE EMOJI GUIDE'S ONLY NEW VOCABULARY
 *
 * Everything else the guide shows is read off the engine — stacks,
 * sides, archetypes. These two tables are the only authored additions:
 * one emoji per function, one per door state. Deliberately not a third
 * table of per-slot emoji — the design catalogue already flagged "eight
 * competing label systems on one row" as the failure mode to avoid, and
 * a slot's emoji would just be its function's emoji again.
 *
 * Picked to echo functions.ts's own FN_ROLE/FN_KEYWORD and the outward
 * (facing out) / inward (facing in) split FnIcon already draws:
 * Ne bursts outward with branching possibility, Ni converges many lines
 * on one point, Se is immediate and physical, Si is the archive, Te is
 * the mechanism, Ti is the examination, Fe is the handshake between
 * people, Fi is the private compass.
 * ------------------------------------------------------------------ */
export const FN_EMOJI: Record<Fn, string> = {
  Ne: "🎆",
  Ni: "🎯",
  Se: "⚡",
  Si: "📚",
  Te: "⚙️",
  Ti: "🔍",
  Fe: "🤝",
  Fi: "🧭",
};

/** The door's honest condition, same four states SideDoor.tsx already draws. */
export const DOOR_STATE: Record<SideKey, string> = {
  ego: "open — you live here",
  subconscious: "ajar — opens past insecurity",
  unconscious: "closed — opens past worry",
  superego: "barred — opens last: seized, or earned",
};

export const DOOR_EMOJI: Record<SideKey, string> = {
  ego: "🚪",
  subconscious: "🔓",
  unconscious: "🔒",
  superego: "⛔",
};

/**
 * A type's eight-slot stack as one emoji string, front four then back four —
 * a compact, shareable signature. `stack()` always returns Lead..Dread in
 * that order, so no slot lookup is needed here.
 */
export function emojiStack(t: MbtiType): string {
  const st = stack(t);
  const front = st.slice(0, 4).map((f) => FN_EMOJI[f]).join("");
  const back = st.slice(4).map((f) => FN_EMOJI[f]).join("");
  return `${front} · ${back}`;
}
