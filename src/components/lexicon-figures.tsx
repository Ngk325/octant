import { type ReactNode } from "react";
import { type Entry, type Category } from "../engine/lexicon";
import { type Fn, type SlotName } from "../engine/data";
import { type MbtiType, type Quadra } from "../engine/core";
import { sides, SIDE_ORDER, type SideKey } from "../engine/sides";
import { type Animal, ANIMAL_LABEL } from "../engine/ops";
import FnIcon from "./glyphs/FnIcon";
import SelfTribeCone from "./glyphs/SelfTribeCone";
import AnimalGlyph from "./glyphs/AnimalGlyph";
import SideDoor from "./glyphs/SideDoor";
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
    ([["nemesis", "Lead"], ["critic", "Support"], ["trickster", "Delight"], ["demon", "Cave"]] as const)
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
  "stack-map": () => <Plain><InvolutionTable /></Plain>,

  relation: () => <Worked><RelationLanding a="ENTP" b="INFJ" /></Worked>,

  savior: () => <Worked><SaviorDemonGrid type="ENTP" /></Worked>,
  "demon-animal": () => <Worked><SaviorDemonGrid type="ENTP" /></Worked>,

  /* Each side of the mind is its door, then the whole path in order. */
  ...Object.fromEntries(
    (["four-sides", "ego", "subconscious", "unconscious", "superego"] as const).map((id) => [
      id,
      () => (
        <Worked>
          <SideDoorRow type="ENTP" emphasis={id === "four-sides" ? undefined : id as SideKey} />
          <div style={{ marginTop: "var(--s3)" }}><GatewayPath type="ENTP" /></div>
        </Worked>
      ),
    ]),
  ),

  /* The animals as arrow signatures. */
  ...Object.fromEntries(
    (["play", "blast", "consume", "sleep"] as const).map((id) => [
      id,
      (e: Entry) => <Plain><AnimalGlyph animal={e.term as Animal} /></Plain>,
    ]),
  ),
  animal: () => (
    <Plain>
      <div className="cluster" style={{ gap: "var(--s5)", alignItems: "flex-end" }}>
        {(["Consume", "Blast", "Play", "Sleep"] as const).map((a) => (
          <div key={a} style={{ width: 120, textAlign: "center" }}>
            <AnimalGlyph animal={a} />
            <span className="small muted">{ANIMAL_LABEL[a]}</span>
          </div>
        ))}
      </div>
    </Plain>
  ),

};

/**
 * The four doors of one type in a row, dimming all but the emphasised one.
 * Local composition, not a glyph — SideDoor stays single-purpose.
 */
function SideDoorRow({ type, emphasis }: { type: MbtiType; emphasis?: SideKey }) {
  const s = sides(type);
  return (
    <div className="cluster" style={{ gap: "var(--s4)", alignItems: "flex-end" }}>
      {SIDE_ORDER.map((k) => (
        <div key={k} style={{ textAlign: "center", opacity: emphasis && emphasis !== k ? 0.45 : 1 }}>
          <SideDoor side={k} fn={s[k].gateway.fn} />
          <span className="small muted">{s[k].name}</span>
        </div>
      ))}
    </div>
  );
}

/** Category-level fallbacks, when no id-specific figure exists. */
export const CATEGORY_FIGURES: Partial<Record<Category, (e: Entry) => ReactNode>> = {
  /* A Function entry leads with its own icon and its self/tribe reading,
     then the involution table that places it among the eight. */
  Function: (e) => {
    const fn = e.term as Fn;
    return (
      <Plain>
        <div className="cluster" style={{ gap: "var(--s5)", alignItems: "flex-start", marginBottom: "var(--s3)" }}>
          <FnIcon fn={fn} size={56} />
          <div style={{ width: 150 }}><SelfTribeCone fn={fn} /></div>
        </div>
        <InvolutionTable highlight={fn} />
      </Plain>
    );
  },
};

/** The figure for an entry, or null. */
export function lexiconFigure(e: Entry): ReactNode {
  const render = LEX_FIGURES[e.id] ?? CATEGORY_FIGURES[e.category];
  return render ? render(e) : null;
}
