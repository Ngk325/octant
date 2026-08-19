import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import type { ReactNode } from "react";
import { TYPES, REL, stack, type MbtiType } from "../src/engine/core";
import { wheels } from "../src/engine/octagram";
import { ENTRIES } from "../src/engine/lexicon";
import { ThemeProvider } from "../src/components/Theme";
import WiringSchematic from "../src/components/WiringSchematic";
import StackOrder from "../src/components/StackOrder";
import OctagramWheel from "../src/components/OctagramWheel";
import OctagramMap from "../src/components/OctagramMap";
import FourSidesDiagram from "../src/components/FourSidesDiagram";
import AnimalStack from "../src/components/AnimalStack";
import LettersToStack from "../src/components/LettersToStack";
import ThemeSeasons from "../src/components/ThemeSeasons";
import RelationLanding from "../src/components/RelationLanding";
import InvolutionTable from "../src/components/InvolutionTable";
import DivergingEase from "../src/components/DivergingEase";
import GatewayPath from "../src/components/GatewayPath";
import ArchetypeGrid from "../src/components/ArchetypeGrid";
import SaviorDemonGrid from "../src/components/SaviorDemonGrid";
import QuadraFunctionGrid from "../src/components/QuadraFunctionGrid";
import CoinSet from "../src/components/CoinSet";
import TwoReadings from "../src/components/TwoReadings";
import { COIN_LABELS, DETERMINING, CONFIRMING, REL_NAME, DOM_AUX, type RelCode, type Fn } from "../src/engine/data";
import { ops, ANIMAL_LABEL } from "../src/engine/ops";
import { LEX_FIGURES, lexiconFigure } from "../src/components/lexicon-figures";
import { BY_ID } from "../src/engine/lexicon";

/* ------------------------------------------------------------------ *
 * Every diagram, rendered for every input it can take.
 *
 * Two guarantees. One: no diagram throws, for any type, any pair or any
 * wheel — a crash in a figure takes its whole page down. Two: no SVG
 * declares text below 14px. tokens.css calls 14px "the floor,
 * everywhere, including inside SVG", and the first build broke that
 * claim silently; this test makes breaking it loud.
 *
 * (The floor asserted here is the DECLARED size. The rendered size is
 * protected separately, by Figure minWidth and the wheel's tall layout —
 * scripts/shots.mjs checks those against a real viewport.)
 * ------------------------------------------------------------------ */

/* renderToStaticMarkup is a server render, and react-router's MemoryRouter
   warns about useLayoutEffect on every mount. The warning is real advice for
   an app that hydrates and irrelevant to a smoke test that renders once and
   reads the string; keep the output legible. */
beforeAll(() => {
  const real = console.error;
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("useLayoutEffect does nothing on the server")) return;
    real(...(args as Parameters<typeof console.error>));
  });
});

afterAll(() => vi.restoreAllMocks());

const draw = (node: ReactNode) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <ThemeProvider>{node}</ThemeProvider>
    </MemoryRouter>,
  );

/** Every font size declared anywhere in a rendered chunk of SVG markup. */
function declaredFontSizes(html: string): number[] {
  const out: number[] = [];
  for (const m of html.matchAll(/font-size:\s*([\d.]+)px/g)) out.push(Number(m[1]));
  for (const m of html.matchAll(/fontSize="?([\d.]+)"?/g)) out.push(Number(m[1]));
  for (const m of html.matchAll(/font-size="([\d.]+)"/g)) out.push(Number(m[1]));
  return out;
}

const expectFloor = (html: string) => {
  for (const size of declaredFontSizes(html)) {
    expect(size, "no declared text below the 14px floor").toBeGreaterThanOrEqual(14);
  }
};

describe("every diagram renders for every type without throwing", () => {
  for (const t of TYPES) {
    it(`${t}: schematic, sides, animals, letters, gateway path, grids`, () => {
      expectFloor(draw(<WiringSchematic type={t} showCorrespondence />));
      expectFloor(draw(<FourSidesDiagram type={t} />));
      draw(<AnimalStack sig={ops(t)} />);
      draw(<LettersToStack type={t} />);
      draw(<GatewayPath type={t} />);
      draw(<ArchetypeGrid type={t} />);
      draw(<SaviorDemonGrid type={t} />);
      draw(<SaviorDemonGrid type={t} sub={{ jumper: true }} />);
      expectFloor(draw(<TwoReadings type={t} />));
    });
  }
});

describe("stack order (onboarding figure A)", () => {
  it("renders every type at the floor, front four solid and back four quiet", () => {
    for (const t of TYPES) {
      const html = draw(<StackOrder type={t} />);
      expectFloor(html);
      expect(html).toContain('opacity="0.32"'); // the back four
      expect((html.match(/opacity="0\.32"/g) ?? []).length).toBe(4);
    }
  });
});

describe("the octagram wheels render in both layouts", () => {
  for (const w of wheels()) {
    it(`${w.origin} wheel, wide and tall, with and without development`, () => {
      for (const layout of ["wide", "tall"] as const) {
        expectFloor(draw(<OctagramWheel wheel={w} layout={layout} />));
        expectFloor(draw(<OctagramWheel wheel={w} layout={layout} development="SD" />));
        expectFloor(draw(<OctagramWheel wheel={w} layout={layout} development="UD" />));
      }
    });
  }

  it("the map renders with and without a highlight", () => {
    expectFloor(draw(<OctagramMap />));
    expectFloor(draw(<OctagramMap highlight="ENTJ" />));
  });
});

describe("relation landing", () => {
  it("renders for a spread of pairs, including identity, at the floor", () => {
    const pairs = [
      ["ENTP", "INFJ"], ["ENTP", "ENTP"], ["ISFJ", "ESTP"], ["ENTJ", "INTJ"], ["ESFP", "INFP"],
    ] as const;
    for (const [a, b] of pairs) {
      const html = draw(<RelationLanding a={a} b={b} />);
      expectFloor(html);
      // Both columns name their person — the diagram is read alongside the
      // pair page's "You are / Them" bar and has to agree with it.
      expect(html).toContain(`Them — ${a}`);
      expect(html).toContain(`You — ${b}`);
    }
  });
});

describe("the small grids", () => {
  it("involution table renders plain and highlighted", () => {
    draw(<InvolutionTable />);
    draw(<InvolutionTable highlight="Ne" />);
  });

  it("diverging ease renders and carries both values in its accessible name", () => {
    const html = draw(<DivergingEase toward={82} from={41} labels={["a with b", "b with a"]} />);
    expect(html).toContain("82 out of 100");
    expect(html).toContain("41 out of 100");
  });

  it("quadra grid renders plain and highlighted", () => {
    draw(<QuadraFunctionGrid />);
    draw(<QuadraFunctionGrid highlight="Beta" />);
  });

  it("theme seasons renders static and interactive", () => {
    draw(<ThemeSeasons />);
    draw(<ThemeSeasons development="SD" focus="SF" onPick={() => {}} />);
  });

  it("the switch set splits the eight by what they can decide", () => {
    const html = draw(<CoinSet />);
    expectFloor(html);
    /* Membership is read from DETERMINING/CONFIRMING, so the figure cannot
       disagree with the calculator that scores them — assert the split it
       actually drew, not a copy of the list. */
    for (const i of DETERMINING) expect(html).toContain(COIN_LABELS[i]);
    for (const i of CONFIRMING) expect(html).toContain(COIN_LABELS[i]);
    expect(html).toContain("Fix the type");
    expect(html).toContain("Cannot add evidence");
  });

  it("the two readings are drawn disagreeing, not merged", () => {
    /* The point of the figure. If it ever renders one weak point, or styles
       one reading as the answer, it has started asserting what the entry
       explicitly declines to. */
    const html = draw(<TwoReadings type="ENTP" />);
    expect(html).toContain("Eight-function stack");
    expect(html).toContain("Exchange overlay");
    /* Three MARKED CELLS in total: Cave from one reading, Delight+Cave from
       the other. Matched as element text (`>weak point<`) rather than as a
       bare substring, because the aria-label uses the phrase too and would
       inflate the count to four. */
    expect(html.match(/>weak point</g)?.length).toBe(3);
    expect(html).toContain("disagree");
  });
});

describe("the lexicon figure registry", () => {
  it("keys only entries that exist", () => {
    for (const id of Object.keys(LEX_FIGURES)) {
      expect(BY_ID.has(id), `registry key "${id}" is a real lexicon entry`).toBe(true);
    }
  });

  it("renders a figure for every entry that declares one, and for every Function entry", () => {
    let figures = 0;
    for (const e of ENTRIES) {
      const node = lexiconFigure(e);
      if (node) {
        draw(node);
        figures++;
      }
      if (e.category === "Function") expect(node).not.toBeNull();
    }
    // Every keyed entry plus the eight function fallbacks must produce something.
    expect(figures).toBeGreaterThanOrEqual(Object.keys(LEX_FIGURES).length);
  });

  /* The categories below are drawn by a RULE, not by a per-entry key: a
     relation finds a pair that exhibits it, a temperament finds the four
     types that share it. A rule that silently stops matching — a renamed
     label, a reordered id — degrades to no figure at all rather than to a
     wrong one, which is safe but invisible. These assert the whole category
     stays covered, so the failure is loud. */
  it.each([
    ["Relation", 16],
    ["Temperament", 4],
    ["Interaction Style", 4],
    ["Gate", 4],
  ] as const)("draws every %s entry", (category, expected) => {
    const es = ENTRIES.filter((e) => e.category === category);
    expect(es).toHaveLength(expected);
    for (const e of es) {
      expect(lexiconFigure(e), `${e.id} has a figure`).not.toBeNull();
    }
  });

  /* The relation figures on Complement and Catalyst are the one place in the
     registry where a code is HAND-KEYED rather than searched for, and it went
     wrong exactly there: Catalyst drew Spark, which belongs to Complement, so
     the caption named the wrong relation on a definition of the other one.
     Both sets are derived here from the entries' own claims, so the figure
     has to agree with the engine rather than with whoever typed the code. */
  it("Complement and Catalyst draw a relation those entries actually resolve to", () => {
    const t: MbtiType = "ENTP";

    /* A Complement is {Counterpart, Spark}, resolved through REL_NAME rather
       than by writing the codes down — the display names are what the entry
       says, and the codes are what the figure passes. Deriving one from the
       other is the whole point. (Going the other way — function to type —
       does not work: TWO types lead with any given function, so picking one
       by its dominant is ambiguous. That ambiguity is what made the first
       version of this test fail.) */
    const byName = (name: string) =>
      (Object.keys(REL_NAME) as RelCode[]).find((c) => REL_NAME[c] === name)!;
    const complement = new Set([byName("Counterpart"), byName("Spark")]);

    // A Catalyst is a type whose Lead is your Doubt — slot 5.
    const catalyst = new Set(
      TYPES.filter((x) => DOM_AUX[x][0] === stack(t)[4]).map((x) => REL[t][x]),
    );

    expect(catalyst, "Catalyst resolves to Damper and Loose fit").toEqual(new Set(["EX", "MG"]));
    expect(complement.has("DU"), "Complement includes the Counterpart").toBe(true);

    /* Every relation the caption names, not just the first — the caption
       names the drawn relation AND the other half of the pair, and both have
       to belong to the entry. Matched on the name plus its full stop, which
       is how both appear; the apostrophe before it is HTML-escaped, so
       anchoring on that is what made the previous attempt match nothing. */
    const named = (id: string) => {
      const html = draw(lexiconFigure(BY_ID.get(id)!));
      return (Object.keys(REL_NAME) as RelCode[]).filter((c) =>
        html.includes(`${REL_NAME[c]}.`),
      );
    };

    for (const [id, allowed] of [["complement", complement], ["catalyst", catalyst]] as const) {
      const drawn = named(id);
      expect(drawn.length, `${id} names at least one relation`).toBeGreaterThan(0);
      for (const c of drawn) {
        expect(allowed.has(c), `${id} names ${REL_NAME[c]} (${c}), which it does not resolve to`).toBe(true);
      }
    }
  });

  /* CELLS used to read [Lead, Delight, Support, Cave], and the row slice
     (row*2, row*2+2) put Delight in the "aware" row and Support in the
     "unaware" row — the opposite of both the component's own docstring
     and every archetype entry's own prose (e.g. `critic`/Scold: "Shadow,
     aware, pessimistic"). Locked here by DOM order: the grid is CSS grid
     with implicit rows, so cells render in row-major order — axis label,
     then its two cells — and that order is the only thing a reader's eye
     tracks too. */
  it("places each archetype in the aware/optimistic cell its own entry claims", () => {
    const html = draw(<ArchetypeGrid />);
    const at = (needle: string) => {
      const i = html.indexOf(needle);
      expect(i, `"${needle}" appears in the rendered grid`).toBeGreaterThanOrEqual(0);
      return i;
    };
    const awareRow = at("Aware of using it");
    const lead = at("1. Lead");
    const support = at("2. Support");
    const unawareRow = at("Runs without you noticing");
    const delight = at("3. Delight");
    const cave = at("4. Cave");

    expect(awareRow, "the aware row precedes its two cells").toBeLessThan(lead);
    expect(lead, "Lead (optimistic) precedes Support (pessimistic) within the aware row").toBeLessThan(support);
    expect(support, "Support stays inside the aware row, before the unaware row starts").toBeLessThan(unawareRow);
    expect(unawareRow, "the unaware row precedes its two cells").toBeLessThan(delight);
    expect(delight, "Delight (optimistic) precedes Cave (pessimistic) within the unaware row").toBeLessThan(cave);
  });

  /* Thinking (Te or Ti), Organize (Ni or Si) and six more used to draw a
     single FnIcon or SelfTribeCone, silently picking one branch of the
     entry's own "or". Matched against each glyph's own aria-label, which
     both components format as "${fn} — ...", so this fails loud if a
     future edit goes back to drawing only one function. */
  it("draws both functions of an either/or coin pole, never just one", () => {
    const pairs: Record<string, [Fn, Fn]> = {
      thinking: ["Te", "Ti"], feeling: ["Fe", "Fi"],
      sensing: ["Se", "Si"], intuition: ["Ne", "Ni"],
      organize: ["Ni", "Si"], gather: ["Ne", "Se"],
      identity: ["Ti", "Fi"], tribe: ["Te", "Fe"],
    };
    for (const [id, [a, b]] of Object.entries(pairs)) {
      const html = draw(lexiconFigure(BY_ID.get(id)!));
      expect(html, `${id} draws ${a}`).toContain(`aria-label="${a} —`);
      expect(html, `${id} draws ${b}`).toContain(`aria-label="${b} —`);
    }
  });

  /* `demon-animal` used to reuse `savior`'s figure verbatim, leaving its
     own claim — that the two Flinches resolve to one named current — as
     two disconnected cells. Locked against the live computation so a
     caption that stops matching the engine fails loud. */
  it("names the demon-animal figure's resultant current, live-computed", () => {
    const html = draw(lexiconFigure(BY_ID.get("demon-animal")!));
    const label = ANIMAL_LABEL[ops("ENTP").doubleDemon];
    expect(html, `names ${label}`).toContain(label);
  });

  it("leaves undrawn only the concepts that refuse a picture", () => {
    /* `fine-coins` says of itself that this build holds that material
       unsettled, so a diagram would assert what the entry declines to.
       `midlife-crisis` and its sibling `three-quarter-life-crisis` are
       about timing and pressure, which no mark in the language means.
       Listed so drawing one is a decision.

       `coin` and `dual-lighting` were on this list and are not any more.
       The reasoning that put them here confused "must not RESOLVE this" with
       "must not DRAW this": the switch set draws a split the entry states as
       arithmetic, and the two readings are drawn side by side so the slot
       they disagree about is the one you look at. Showing a disagreement is
       the entry's content; merging it would have been the dishonest figure. */
    const bare = ENTRIES
      .filter((e) => e.category === "Concept" && !lexiconFigure(e))
      .map((e) => e.id)
      .sort();
    expect(bare).toEqual(["fine-coins", "midlife-crisis", "three-quarter-life-crisis"]);
  });

  it("draws the coin poles the glyph language can state, and no others", () => {
    /* Initiating/Responding used to sit in this bare set too, even though
       they are literally "maps to extraversion"/"...introversion" — exactly
       what AttitudeMark already draws, and already shipped elsewhere in the
       app. The four left bare ask about sequencing and delivery, which no
       mark in the language means — the same restraint Calculator takes.
       Listed, so adding a stand-in for one is a deliberate edit rather than
       a drift. */
    const bare = ENTRIES
      .filter((e) => e.category === "Coin" && !lexiconFigure(e))
      .map((e) => e.id)
      .sort();
    expect(bare).toEqual(["control", "direct", "informative", "movement"]);
  });
});
