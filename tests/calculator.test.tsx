import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { ThemeProvider } from "../src/components/Theme";
import { ChatProvider } from "../src/chat/ChatContext";
import { COIN_LABELS } from "../src/engine/data";
import { COIN_OPTIONS } from "../src/engine/ops";
import Calculator from "../src/views/Calculator";

/* ------------------------------------------------------------------ *
 * WHICH GLYPH SITS ON WHICH QUESTION.
 *
 * coinGlyph takes the ZERO-BASED index of the question, while its doc
 * comment — and the page's own numbering — refer to coins by their
 * one-based position. A reviewer read the `coin === 1` branches as
 * one-based and proposed calling it with `i + 1`, which would slide
 * every glyph onto the wrong question: the self/tribe cone would land
 * on Observer-vs-Decider, the observer-posture icons on the decider
 * coins, and the last mapped coin would fall off the end.
 *
 * The mapping is semantic, not decorative — a picture of Si next to the
 * word "Gather" is a false statement about the model — so it is pinned
 * here per question rather than left to a comment.
 * ------------------------------------------------------------------ */

beforeAll(() => {
  const real = console.error;
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("useLayoutEffect does nothing on the server")) return;
    real(...(args as Parameters<typeof console.error>));
  });
});

afterAll(() => vi.restoreAllMocks());

const html = () =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={["/calculator"]}>
      <ThemeProvider>
        <ChatProvider>
          <Calculator />
        </ChatProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );

/** The rendered markup for one question, sliced between its label and the next. */
function questionBlock(markup: string, i: number): string {
  const start = markup.indexOf(COIN_LABELS[i]);
  expect(start, `question ${i + 1} (${COIN_LABELS[i]}) is on the page`).toBeGreaterThan(-1);
  const next = i + 1 < COIN_LABELS.length ? markup.indexOf(COIN_LABELS[i + 1], start) : -1;
  return markup.slice(start, next === -1 ? undefined : next);
}

/** Function names carrying an accessible label inside one question's markup. */
const glyphsIn = (block: string): string[] =>
  [...block.matchAll(/aria-label="([NSTF][ei]) —/g)].map((m) => m[1]);

/**
 * The intended picture for each question, by zero-based index. `null` means
 * the glyph language has nothing honest to draw for that coin, so the prompt
 * stands alone — the same posture the calculator takes for coins 6, 7 and 8.
 */
const EXPECTED: (["Fi" | "Si" | "Te" | "Se", string, string, string] | null)[] = [
  null,                                        // Observer vs Decider
  ["Fi", "Fe", "Identity", "Tribe"],           // self-calibrated vs tribe-calibrated
  ["Si", "Se", "Organize", "Gather"],          // observer attitude: inward vs outward
  ["Te", "Fe", "Thinking", "Feeling"],         // decider element
  ["Se", "Ne", "Sensing", "iNtuition"],        // observer element
  null,                                        // Initiating vs Responding
  null,                                        // Direct vs Informative
  null,                                        // Control vs Movement
];

describe("the calculator's coin glyphs", () => {
  const markup = html();

  it("renders all eight questions", () => {
    for (const label of COIN_LABELS) expect(markup).toContain(label);
  });

  it("puts each glyph pair on the question whose poles it draws", () => {
    EXPECTED.forEach((want, i) => {
      const block = questionBlock(markup, i);
      const found = glyphsIn(block);
      if (want === null) {
        expect(found, `question ${i + 1} (${COIN_LABELS[i]}) draws nothing`).toEqual([]);
        return;
      }
      const [first, second, poleA, poleB] = want;
      // The poles are the engine's, so a glyph cannot drift from its question
      // without this failing on the pole names too.
      expect(COIN_OPTIONS[i]).toEqual([poleA, poleB]);
      expect(found, `question ${i + 1} (${poleA} vs ${poleB}) draws ${first} then ${second}`)
        .toEqual([first, second]);
    });
  });

  it("draws attitude coins inward-then-outward, and element coins as one family each", () => {
    /* Two different jobs, so two different rules, and a pair reversed inside
       a branch breaks whichever one applies:

         attitude coins  the pair IS the answer, so it runs inward → outward
                         (Identity/Tribe as Fi/Fe, Organize/Gather as Si/Se)
         element coins   attitude is not what is being asked, so each pole is
                         drawn by the outward member of its family, standing
                         in for the family as a whole (Te/Fe, Se/Ne). */
    for (const i of [1, 2]) {
      const [a, b] = glyphsIn(questionBlock(markup, i));
      expect(a?.[1], `question ${i + 1} opens with the inward pole`).toBe("i");
      expect(b?.[1], `question ${i + 1} closes with the outward pole`).toBe("e");
    }
    for (const i of [3, 4]) {
      const pair = glyphsIn(questionBlock(markup, i));
      expect(pair.map((f) => f[1]), `question ${i + 1} draws two outward marks`)
        .toEqual(["e", "e"]);
      expect(pair[0][0], `question ${i + 1} contrasts two families`).not.toBe(pair[1][0]);
    }
  });
});
