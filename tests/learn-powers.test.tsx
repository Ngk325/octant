import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { TYPES } from "../src/engine/core";
import { STAGES } from "../src/learn/curriculum";
import { powersOf } from "../src/engine/powers";
import { ThemeProvider } from "../src/components/Theme";

/* ------------------------------------------------------------------ *
 * The "Superpower and kryptonite" stage: a smoke pass over all sixteen
 * worked examples (a crash in one figure takes the whole stage down,
 * same risk diagrams.test.tsx guards against elsewhere), plus a check
 * that it sits between the two stages it depends on — Lead is taught in
 * "ego", Dread in "shadow" — so a reader never reaches it early.
 * ------------------------------------------------------------------ */

const stage = STAGES.find((s) => s.slug === "powers");
if (!stage) throw new Error("the 'powers' stage was removed from STAGES");

describe("the 'powers' Learn stage", () => {
  it("sits after 'shadow' (Dread) and before 'four-sides'", () => {
    const slugs = STAGES.map((s) => s.slug);
    const i = slugs.indexOf("powers");
    expect(slugs[i - 1]).toBe("shadow");
    expect(slugs[i + 1]).toBe("four-sides");
  });

  it.each(TYPES)("%s: renders without throwing, and names both functions", (t) => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ThemeProvider>{stage.body(t)}</ThemeProvider>
      </MemoryRouter>,
    );
    const { superpower, kryptonite } = powersOf(t);
    expect(html).toContain(superpower.fn);
    expect(html).toContain(kryptonite.fn);
    expect(html).not.toContain("undefined");
    expect(html).not.toContain("NaN");
  });

  it("has a check question", () => {
    expect(String(stage.check).length).toBeGreaterThan(0);
  });
});
