import { type ReactNode } from "react";
import { type Entry, type Category } from "../engine/lexicon";
import {
  type Fn, type SlotName, type RelCode, REL_NAME,
  ROMANCE, INTERACTION_STYLE, GROUP,
} from "../engine/data";
import { TYPES, REL, ease, gate, type MbtiType, type Quadra } from "../engine/core";
import TypeMolecule from "./glyphs/TypeMolecule";
import DivergingEase from "./DivergingEase";
import CoinSet from "./CoinSet";
import TwoReadings from "./TwoReadings";
import OctagramMap from "./OctagramMap";
import OctagramWheel from "./OctagramWheel";
import ThemeSeasons from "./ThemeSeasons";
import { wheelOf } from "../engine/octagram";
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

  /* Each of these names a PAIR of relations, so each figure draws one of the
     two and the caption names the other rather than implying it is the whole
     set. Getting the sets from the entries: a Complement is {Counterpart,
     Spark}; a Catalyst is the two types whose Lead is your Doubt, which
     resolves to {Damper, False fit} — NOT to Spark. Drawing Spark here was
     exactly the error this pairing invites, so the sets are asserted against
     the engine in tests/diagrams.test.tsx. */
  complement: () => <RelationFigure code="DU" alsoSee="AC" />,
  catalyst: () => <RelationFigure code="EX" alsoSee="MG" />,

  /* The app's single most distinctive claim — ease is directional — had no
     picture on its own entry, only on the pages that use it. */
  ease: () => {
    const pair = exemplar("SV");
    if (!pair) return null;
    const [a, b] = pair;
    return (
      <div style={{ margin: "var(--s3) 0" }}>
        <DivergingEase
          toward={ease(a, b)}
          from={ease(b, a)}
          labels={[`Ease for ${a}`, `Ease for ${b}`]}
        />
        <p className="small muted" style={{ margin: "var(--s2) 0 0" }}>
          One pairing, read from each side. Four of the sixteen relations differ by
          direction like this, so a single compatibility number would hide the most
          useful thing about them.
        </p>
      </div>
    );
  },

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

  /* ---------------------------- the Octagram ----------------------------
   *
   * The advanced layer, and the last of the lexicon that went undrawn. Every
   * figure here is an existing component fed from the engine — the wheel is
   * looked up with wheelOf() rather than named, so the worked example cannot
   * come apart from the dyad it belongs to.
   *
   * Four entries in this layer are deliberately left bare. `fine-coins` says
   * of itself that the build holds that material unsettled, and `dual-lighting`
   * exists to say two readings disagree and are not reconciled — a diagram of
   * either would assert something the entry is refusing to claim. `coin` and
   * `midlife-crisis` have no mark in the language that means them. */

  /* Two entries that read as refusals but are not. Neither figure resolves
     anything: the switch set draws the split the entry states as arithmetic,
     and the two readings are drawn side by side precisely so the slot they
     disagree about is visible. A picture that MERGED them would be the
     dishonest one — see TwoReadings. */
  coin: () => <Plain><CoinSet /></Plain>,
  "dual-lighting": () => <Worked><TwoReadings /></Worked>,

  octagram: () => <Plain><OctagramMap /></Plain>,
  temple: () => <Plain><OctagramMap /></Plain>,

  /* The wheel itself, then the three parts of it that have their own entries:
     the origin at the centre, the virtue above, the sin below. */
  ...Object.fromEntries(
    (["temple-wheel", "cognitive-origin", "living-virtue", "deadly-sin"] as const)
      .map((id) => [id, () => <WheelFigure />]),
  ),

  /* The two poles, each emphasised by the development that drifts toward it.
     Directions are the engine's: poleFor(w, "SD") is the aspirational pole
     and poleFor(w, "UD") the shadow one, so the emphasis matches the entry. */
  "aspirational-pole": () => <WheelFigure development="SD" />,
  "shadow-pole": () => <WheelFigure development="UD" />,

  /* One 2x2, three entries: the theme is the cell, development is the rows,
     focus is the columns. Each defines a different input to the same grid. */
  ...Object.fromEntries(
    (["octagram-theme", "octagram-focus", "subconscious-development"] as const)
      .map((id) => [id, () => <Plain><ThemeSeasons /></Plain>]),
  ),

  /* The generic entry for the thing the four Gate entries each name one of. */
  gate: () => <Worked><GatewayPath type="ENTP" /></Worked>,

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

/**
 * The first ordered pair that actually exhibits a relation, searched rather
 * than tabulated — a hard-coded exemplar per code is sixteen chances to be
 * quietly wrong, and this cannot disagree with the grid it illustrates.
 *
 * Orientation follows the rest of the app: REL[a][b] reads "b is a's ___",
 * and RelationLanding(a, b) draws b's strongest two landing in a's stack.
 * That pairing is what makes the caption and the arrows the same claim.
 */
function exemplar(code: RelCode): [MbtiType, MbtiType] | null {
  for (const a of TYPES) for (const b of TYPES) if (REL[a][b] === code) return [a, b];
  return null;
}

/**
 * One temple wheel as the worked example for the Octagram entries.
 *
 * A wheel belongs to a DYAD, not to a type — so the caption names both, which
 * is also the difference between this and the per-type `Worked` note.
 */
function WheelFigure({ development }: { development?: "SD" | "UD" }) {
  const w = wheelOf("ENTP");
  return (
    <div style={{ margin: "var(--s3) 0" }}>
      <OctagramWheel wheel={w} development={development} />
      <p className="small muted" style={{ margin: "var(--s2) 0 0" }}>
        Worked example — the {w.temple} wheel, shared by {w.pair[0]} and {w.pair[1]}.
        There are eight of these, two per temple.
      </p>
    </div>
  );
}

/** One relation drawn as the landing that defines it, with its own caption. */
function RelationFigure({ code, alsoSee }: {
  code: RelCode;
  /** The other half, where the entry names two relations rather than one. */
  alsoSee?: RelCode;
}) {
  const pair = exemplar(code);
  if (!pair) return null;
  const [a, b] = pair;
  return (
    <div style={{ margin: "var(--s3) 0" }}>
      <RelationLanding a={a} b={b} />
      <p className="small muted" style={{ margin: "var(--s2) 0 0" }}>
        Worked example — {b} is {a}&rsquo;s {REL_NAME[code]}. Every pair with this
        relation lands the same way; only the functions change.
        {alsoSee && ` This entry names two relations; the other is ${REL_NAME[alsoSee]}.`}
      </p>
    </div>
  );
}

/**
 * Which four types carry a label, drawn as their molecules.
 *
 * Temperament, romance style and interaction style are all the same shape of
 * fact — a name given to a set of four — and all three were defined in prose
 * that never said which four. The entry's `term` IS the table's value, so the
 * membership is looked up rather than restated, and a label that stopped
 * matching would render an empty row instead of a confident wrong one.
 */
function sharedBy(label: (t: MbtiType) => string, term: string): ReactNode {
  const members = TYPES.filter((t) => label(t) === term);
  if (!members.length) return null;
  return (
    <Plain>
      <div className="cluster" style={{ gap: "var(--s4)" }}>
        {members.map((t) => (
          <div key={t} style={{ textAlign: "center" }}>
            <TypeMolecule type={t} size={44} labels={false} />
            <span className="mono small muted">{t}</span>
          </div>
        ))}
      </div>
      <p className="small muted" style={{ margin: "var(--s2) 0 0" }}>
        The {members.length} wirings that share this.
      </p>
    </Plain>
  );
}

/** The coin poles the glyph language can draw, matching Calculator's set. */
const COIN_MARKS: Record<string, Fn> = {
  organize: "Si", gather: "Se",      // the observer's attitude
  thinking: "Te", feeling: "Fe",     // the decider's element
  sensing: "Se", intuition: "Ne",    // the observer's element
};

/** The two coin poles that are a whole family group rather than one function. */
const COIN_FAMILIES: Record<string, Fn[]> = {
  observer: ["Ne", "Ni", "Se", "Si"],
  decider: ["Te", "Ti", "Fe", "Fi"],
};

/** Category-level fallbacks, when no id-specific figure exists. */
export const CATEGORY_FIGURES: Partial<Record<Category, (e: Entry) => ReactNode>> = {
  Temperament: (e) => sharedBy((t) => GROUP[t], e.term),
  "Romance Style": (e) => sharedBy((t) => ROMANCE[t], e.term),
  "Interaction Style": (e) => sharedBy((t) => INTERACTION_STYLE[t], e.term),

  /* A gate is the door onto the subconscious, so it gets both halves: who
     stands at this one, and — for the first of them — the path through it. */
  Gate: (e) => {
    const holder = TYPES.find((t) => gate(t).gate === e.term);
    if (!holder) return null;
    return (
      <div style={{ margin: "var(--s3) 0" }}>
        {sharedBy((t) => gate(t).gate, e.term)}
        <div style={{ marginTop: "var(--s3) " }}><GatewayPath type={holder} /></div>
        <p className="small muted" style={{ margin: "var(--s2) 0 0" }}>
          Worked example — {holder}. The doors are the same four for everyone; which
          function keys each one is what changes.
        </p>
      </div>
    );
  },

  /* Sixteen entries that all describe the same mechanism — where the other
     person's strongest two land in yours — and none of them drew it. The
     definition is the picture; the prose was restating it. */
  Relation: (e) => <RelationFigure code={e.id.replace(/^rel-/, "").toUpperCase() as RelCode} />,

  /* A coin is a choice between two poles, and half of them name something the
     glyph language already draws. The other half — sequencing and delivery —
     get nothing rather than a stand-in, the same restraint the calculator
     takes on the questions it cannot picture. */
  Coin: (e) => {
    const fam = COIN_FAMILIES[e.id];
    if (fam) {
      return (
        <Plain>
          <div className="cluster" style={{ gap: "var(--s4)" }}>
            {fam.map((fn) => (
              <div key={fn} style={{ textAlign: "center" }}>
                <FnIcon fn={fn} size={40} />
                <span className="mono small muted">{fn}</span>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ margin: "var(--s2) 0 0" }}>
            The four functions this pole selects between.
          </p>
        </Plain>
      );
    }
    if (e.id === "identity" || e.id === "tribe") {
      return (
        <Plain>
          <div style={{ width: 170 }}>
            <SelfTribeCone fn={e.id === "identity" ? "Fi" : "Fe"} />
          </div>
        </Plain>
      );
    }
    const fn = COIN_MARKS[e.id];
    return fn ? <Plain><FnIcon fn={fn} size={56} /></Plain> : null;
  },

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
