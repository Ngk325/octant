import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { TYPES, stack } from "../src/engine/core";
import { SLOT_NAMES, type Fn } from "../src/engine/data";
import { SIDE_ORDER, sides } from "../src/engine/sides";
import { type Animal, ANIMAL_LABEL } from "../src/engine/ops";
import { ThemeProvider } from "../src/components/Theme";
import { RANK_RATIO, outward } from "../src/components/glyphs/geometry";
import FnIcon from "../src/components/glyphs/FnIcon";
import TypeMolecule from "../src/components/glyphs/TypeMolecule";
import SelfTribeCone from "../src/components/glyphs/SelfTribeCone";
import AnimalGlyph from "../src/components/glyphs/AnimalGlyph";
import DerivationTree from "../src/components/glyphs/DerivationTree";
import SideDoor from "../src/components/glyphs/SideDoor";
import EightSet from "../src/components/glyphs/EightSet";
import AttitudeMark from "../src/components/glyphs/AttitudeMark";
import Agency from "../src/components/glyphs/Agency";

/* ------------------------------------------------------------------ *
 * The glyph language, held to its own rules: every glyph renders for
 * every valid input, carries an accessible name, declares no text under
 * 14px, and molecules obey the rank-is-size ratio.
 * ------------------------------------------------------------------ */

beforeAll(() => {
  const real = console.error;
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("useLayoutEffect does nothing on the server")) return;
    real(...(args as Parameters<typeof console.error>));
  });
});

afterAll(() => vi.restoreAllMocks());

const FNS: Fn[] = ["Ne", "Ni", "Se", "Si", "Te", "Ti", "Fe", "Fi"];
const ANIMALS: Animal[] = ["Play", "Blast", "Consume", "Sleep"];

const draw = (node: ReactNode) => renderToStaticMarkup(<ThemeProvider>{node}</ThemeProvider>);

const fontSizes = (html: string): number[] =>
  [...html.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]))
    .concat([...html.matchAll(/fontSize="?([\d.]+)"?/g)].map((m) => Number(m[1])));

const expectAccessible = (html: string) => {
  expect(html).toContain('role="img"');
  expect(html).toMatch(/aria-label="[^"]{10,}"/);
};

describe("the language's ground rules", () => {
  it("rank ratio is strictly decreasing from Lead to Cave", () => {
    for (let i = 1; i < RANK_RATIO.length; i++) {
      expect(RANK_RATIO[i]).toBeLessThan(RANK_RATIO[i - 1]);
    }
  });

  it("outward() reads the attitude letter", () => {
    for (const fn of FNS) expect(outward(fn)).toBe(fn[1] === "e");
  });
});

describe("FnIcon", () => {
  it("renders all eight, accessibly, naming the attitude", () => {
    for (const fn of FNS) {
      const html = draw(<FnIcon fn={fn} />);
      expectAccessible(html);
      expect(html).toContain(outward(fn) ? "outward-facing" : "inward-facing");
    }
  });
});

describe("TypeMolecule", () => {
  it("renders every type with beads sized by the rank ratio", () => {
    for (const t of TYPES) {
      const html = draw(<TypeMolecule type={t} />);
      expectAccessible(html);
      for (let i = 0; i < 4; i++) {
        expect(html, `${t} names its ${SLOT_NAMES[i]}`).toContain(`${SLOT_NAMES[i]} ${stack(t)[i]}`);
        expect(html, `${t} bead ${i} sized by rank`).toContain(`r="${21 * RANK_RATIO[i]}"`);
      }
    }
  });

  it("labels the two big beads only when large enough", () => {
    const big = draw(<TypeMolecule type="ENTP" size={64} />);
    const small = draw(<TypeMolecule type="ENTP" size={32} />);
    expect(big).toContain(">Ne<");
    expect(big).toContain(">Ti<");
    expect(small).not.toContain(">Ne<");
  });
});

describe("SelfTribeCone", () => {
  it("draws a crowd for extraverted functions and a single point for intraverted", () => {
    for (const fn of FNS) {
      const html = draw(<SelfTribeCone fn={fn} />);
      expectAccessible(html);
      expect(html).toContain(outward(fn) ? "on the tribe" : "on the self");
    }
  });
});

describe("AnimalGlyph", () => {
  it("renders each current with its arrow signature described", () => {
    for (const a of ANIMALS) {
      const html = draw(<AnimalGlyph animal={a} />);
      expectAccessible(html);
      // Labelled with what a reader sees, not the engine's internal value for
      // it — the union member stays "Play" while the label reads "Charge".
      expect(html).toContain(`${ANIMAL_LABEL[a]}:`);
    }
  });
});

describe("DerivationTree", () => {
  it("draws all eight leaves with real edges, no text below 14", () => {
    const html = draw(<DerivationTree />);
    expectAccessible(html);
    for (const fn of FNS) expect(html).toContain(`>${fn}<`);
    expect((html.match(/<line /g) ?? []).length).toBeGreaterThanOrEqual(14);
    for (const s of fontSizes(html)) expect(s).toBeGreaterThanOrEqual(14);
  });
});

describe("SideDoor", () => {
  it("renders all four doors of every type, keyed to the real gateway", () => {
    for (const t of TYPES) {
      const s = sides(t);
      for (const k of SIDE_ORDER) {
        const html = draw(<SideDoor side={k} fn={s[k].gateway.fn} />);
        expectAccessible(html);
        expect(html).toContain(`keystone ${s[k].gateway.fn}`);
      }
    }
  });

  it("only the superego is barred", () => {
    const s = sides("ENTP");
    for (const k of SIDE_ORDER) {
      const html = draw(<SideDoor side={k} fn={s[k].gateway.fn} />);
      if (k === "superego") expect(html, k).toContain("var(--danger)");
      else expect(html, `${k} carries no danger styling`).not.toContain("var(--danger)");
    }
  });
});

describe("EightSet", () => {
  it("draws all eight functions, split into an outward row and an inward row", () => {
    const html = draw(<EightSet />);
    expectAccessible(html);
    for (const fn of FNS) expect(html, fn).toContain(`>${fn}<`);
    expect(html).toContain("Facing out");
    expect(html).toContain("Facing in");
  });
});

describe("AttitudeMark", () => {
  it("draws the bare attitude, outward then inward, in neutral ink — no function hue yet", () => {
    const html = draw(<AttitudeMark />);
    expectAccessible(html);
    expect(html).toContain("facing out");
    expect(html).toContain("facing in");
    expect(html).toContain("var(--ink)");
  });
});

describe("Agency", () => {
  it("draws both rows — reached-for and self-triggered — without throwing", () => {
    const html = draw(<Agency />);
    expectAccessible(html);
    expect(html).toContain("You reach for these");
    expect(html).toContain("These go off on their own");
  });
});

describe("the whole set respects the 14px floor", () => {
  it("no glyph declares smaller text", () => {
    const all = [
      ...FNS.map((fn) => draw(<FnIcon fn={fn} />)),
      ...FNS.map((fn) => draw(<SelfTribeCone fn={fn} />)),
      ...ANIMALS.map((a) => draw(<AnimalGlyph animal={a} />)),
      draw(<TypeMolecule type="ISFJ" size={64} />),
      draw(<DerivationTree />),
      draw(<SideDoor side="unconscious" fn="Ni" />),
      draw(<EightSet />),
      draw(<AttitudeMark />),
      draw(<Agency />),
    ];
    for (const html of all) {
      for (const s of fontSizes(html)) expect(s).toBeGreaterThanOrEqual(14);
    }
  });
});
