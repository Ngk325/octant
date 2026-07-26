import { type ReactNode } from "react";
import { type Entry, type Category } from "../engine/lexicon";
import { type Fn, type SlotName } from "../engine/data";
import { type Quadra } from "../engine/core";
import InvolutionTable from "./InvolutionTable";
import ArchetypeGrid from "./ArchetypeGrid";
import QuadraFunctionGrid from "./QuadraFunctionGrid";
import SaviorDemonGrid from "./SaviorDemonGrid";
import GatewayPath from "./GatewayPath";
import RelationLanding from "./RelationLanding";

/* ------------------------------------------------------------------ *
 * Per-entry figures for the lexicon.
 *
 * A definition that can be drawn should be. This registry attaches a
 * small diagram to entries whose concept has one, keyed by entry id with
 * a per-category fallback — the same shape as the existing hook in
 * Lexicon.tsx that used to special-case Function entries only.
 *
 * It lives in components/, not engine/, on purpose: the engine stays
 * JSX-free, and a figure is presentation, not derivation. A test asserts
 * every key here exists in BY_ID so the registry cannot drift.
 * ------------------------------------------------------------------ */

/** A tiny caption for figures that need a worked example to be drawable. */
const Worked = ({ children }: { children: ReactNode }) => (
  <div style={{ margin: "var(--s3) 0" }}>
    {children}
    <p className="small muted" style={{ margin: "var(--s2) 0 0" }}>
      Worked example — ENTP. Every type has its own version of this picture.
    </p>
  </div>
);

const Plain = ({ children }: { children: ReactNode }) => (
  <div style={{ margin: "var(--s3) 0" }}>{children}</div>
);

/** Figures for specific entries, by id. */
export const LEX_FIGURES: Record<string, (e: Entry) => ReactNode> = {
  /* The 2×2 the archetype entries describe one cell at a time. */
  ...Object.fromEntries(
    (["hero", "parent", "child", "inferior"] as const).map((id) => [
      id,
      (e: Entry) => <Plain><ArchetypeGrid highlight={e.term as SlotName} /></Plain>,
    ]),
  ),
  /* Shadow slots highlight their ego mirror — the grid names the mirror in-cell. */
  ...Object.fromEntries(
    ([["nemesis", "Hero"], ["critic", "Parent"], ["trickster", "Child"], ["demon", "Inferior"]] as const)
      .map(([id, mirror]) => [
        id,
        () => <Plain><ArchetypeGrid highlight={mirror as SlotName} /></Plain>,
      ]),
  ),
  /* Quadras highlight their own row of the value-club grid. */
  ...Object.fromEntries(
    (["alpha", "beta", "gamma", "delta"] as const).map((id) => [
      id,
      (e: Entry) => <Plain><QuadraFunctionGrid highlight={e.term as Quadra} /></Plain>,
    ]),
  ),
  quadra: () => <Plain><QuadraFunctionGrid /></Plain>,

  /* The structural entries get the involution table — the three moves that
     generate everything these definitions describe. */
  shadow: () => <Plain><InvolutionTable /></Plain>,
  "model-a": () => <Plain><InvolutionTable /></Plain>,

  relation: () => <Worked><RelationLanding a="ENTP" b="INFJ" /></Worked>,

  savior: () => <Worked><SaviorDemonGrid type="ENTP" /></Worked>,
  "demon-animal": () => <Worked><SaviorDemonGrid type="ENTP" /></Worked>,

  "four-sides": () => <Worked><GatewayPath type="ENTP" /></Worked>,
  subconscious: () => <Worked><GatewayPath type="ENTP" /></Worked>,
  unconscious: () => <Worked><GatewayPath type="ENTP" /></Worked>,
  superego: () => <Worked><GatewayPath type="ENTP" /></Worked>,
};

/** Category-level fallbacks, when no id-specific figure exists. */
export const CATEGORY_FIGURES: Partial<Record<Category, (e: Entry) => ReactNode>> = {
  Function: (e) => <Plain><InvolutionTable highlight={e.term as Fn} /></Plain>,
};

/** The figure for an entry, or null. */
export function lexiconFigure(e: Entry): ReactNode {
  const render = LEX_FIGURES[e.id] ?? CATEGORY_FIGURES[e.category];
  return render ? render(e) : null;
}
