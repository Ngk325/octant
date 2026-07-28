import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { type ReactNode } from "react";
import { TYPES } from "../src/engine/core";
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
import { ops } from "../src/engine/ops";
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
});
