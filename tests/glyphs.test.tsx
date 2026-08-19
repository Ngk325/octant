import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { TYPES, stack } from "../src/engine/core";
import { ARCHETYPE, SLOT_NAMES, type Fn } from "../src/engine/data";
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
import FnDisc from "../src/components/glyphs/FnDisc";
import SeatFigure from "../src/components/glyphs/SeatFigure";
import ArchetypeSeal from "../src/components/glyphs/ArchetypeSeal";
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
  it("renders all four doors of every type, the gateway named as a seat on the lintel", () => {
    for (const t of TYPES) {
      const s = sides(t);
      for (const k of SIDE_ORDER) {
        const html = draw(<SideDoor side={k} gate={s[k].gateway.egoSlot} />);
        expectAccessible(html);
        expect(html).toContain(`gate: the ${s[k].gateway.egoSlot}`);
        expect(html).toContain(`>${s[k].gateway.egoSlot.toUpperCase()}<`);
      }
    }
  });

  it("stands each door on its own rung of the openness ladder", () => {
    const s = sides("ENTP");
    const RUNG = { ego: "open", subconscious: "ajar", unconscious: "cracked", superego: "barred" } as const;
    for (const k of SIDE_ORDER) {
      const html = draw(<SideDoor side={k} gate={s[k].gateway.egoSlot} />);
      expect(html, k).toContain(`>${RUNG[k]}<`);
    }
  });

  it("never names an element — the gate is a seat, which holds for all sixteen types", () => {
    const s = sides("ENTP");
    for (const k of SIDE_ORDER) {
      const html = draw(<SideDoor side={k} gate={s[k].gateway.egoSlot} />);
      for (const fn of FNS) expect(html, `${k} carries no ${fn}`).not.toContain(`>${fn}<`);
    }
  });

  it("only the superego is barred", () => {
    const s = sides("ENTP");
    for (const k of SIDE_ORDER) {
      const html = draw(<SideDoor side={k} gate={s[k].gateway.egoSlot} />);
      if (k === "superego") expect(html, k).toContain("var(--danger)");
      else expect(html, `${k} carries no danger styling`).not.toContain("var(--danger)");
    }
  });
});

describe("FnDisc", () => {
  it("names every element inside its disc and reads the attitude into the label", () => {
    for (const fn of FNS) {
      const html = draw(<FnDisc fn={fn} />);
      expectAccessible(html);
      expect(html).toContain(`>${fn}<`);
      expect(html).toContain(outward(fn) ? "facing out" : "facing in");
    }
  });

  it("filled means conscious, hollow means shadow — and says so", () => {
    const solid = draw(<FnDisc fn="Ne" />);
    const hollow = draw(<FnDisc fn="Ne" solid={false} />);
    expect(solid).not.toContain("in shadow");
    expect(hollow).toContain("in shadow");
    // the hollow disc is a ring: its rim is a stroke, not a fill
    expect(hollow).toContain('fill="none"');
  });

  it("draws four crests per disc, breaking outward for e and inward for i", () => {
    for (const fn of FNS) {
      const html = draw(<FnDisc fn={fn} />);
      // each of the four diagonals carries an arc and a crest triangle
      expect((html.match(/fill-opacity="0.55"/g) ?? []).length, fn).toBe(4);
    }
  });
});

describe("SeatFigure", () => {
  it("locates each of the eight seats and arcs to its twin", () => {
    for (let depth = 0; depth < 8; depth++) {
      const html = draw(<SeatFigure depth={depth} />);
      expectAccessible(html);
      const twin = depth < 4 ? depth + 4 : depth - 4;
      expect(html).toContain(`Seat ${depth + 1} of 8`);
      expect(html).toContain(`seat ${twin + 1}`);
      expect(html).toContain("SAME TOOL, FACING THE OTHER WAY");
      expect(html).toContain("CONSCIOUS");
      expect(html).toContain("SHADOW");
    }
  });

  it("is element-free, like the card: ink only, no hues", () => {
    const html = draw(<SeatFigure depth={2} />);
    for (const fn of FNS) expect(html).not.toContain(`>${fn}<`);
    expect(html).not.toMatch(/#[0-9A-F]{6}/i);
  });
});

describe("ArchetypeSeal", () => {
  it("stamps all sixteen, each named for its own archetype", () => {
    for (const t of TYPES) {
      const html = draw(<ArchetypeSeal type={t} />);
      expectAccessible(html);
      expect(html).toContain(ARCHETYPE[t][0]);
    }
  });

  it("is deterministic — the same Wiring stamps the same seal forever", () => {
    expect(draw(<ArchetypeSeal type="ISTJ" />)).toBe(draw(<ArchetypeSeal type="ISTJ" />));
  });

  it("no two seals are the same figure", () => {
    const seen = new Set(TYPES.map((t) => draw(<ArchetypeSeal type={t} />)));
    expect(seen.size).toBe(16);
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
      draw(<SideDoor side="unconscious" gate="Doubt" />),
      ...FNS.map((fn) => draw(<FnDisc fn={fn} />)),
      ...[0, 3, 4, 7].map((d) => draw(<SeatFigure depth={d} />)),
      ...TYPES.map((t) => draw(<ArchetypeSeal type={t} />)),
      draw(<EightSet />),
      draw(<AttitudeMark />),
      draw(<Agency />),
    ];
    for (const html of all) {
      for (const s of fontSizes(html)) expect(s).toBeGreaterThanOrEqual(14);
    }
  });
});
