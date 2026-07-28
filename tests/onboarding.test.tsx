import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "../src/components/Theme";
import Welcome, { resolveStep, ONBOARDING_DONE_KEY } from "../src/views/Welcome";

/* ------------------------------------------------------------------ *
 * The foundation gate (design catalogue, "Onboarding"): six screens,
 * skippable, re-enterable, clamped against a bad or missing :step.
 * ------------------------------------------------------------------ */

beforeAll(() => {
  const real = console.error;
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("useLayoutEffect does nothing on the server")) return;
    real(...(args as Parameters<typeof console.error>));
  });
});

afterAll(() => vi.restoreAllMocks());

const SCREEN_COUNT = 6;

const draw = (path: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/welcome/:step" element={<Welcome />} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>,
  );

const dotsOn = (html: string) => (html.match(/onboard-dot on/g) ?? []).length;

describe("resolveStep", () => {
  it("defaults to 1 with no param", () => {
    expect(resolveStep(undefined, SCREEN_COUNT)).toBe(1);
  });

  it("clamps non-numeric, zero and negative input to 1", () => {
    expect(resolveStep("abc", SCREEN_COUNT)).toBe(1);
    expect(resolveStep("0", SCREEN_COUNT)).toBe(1);
    expect(resolveStep("-3", SCREEN_COUNT)).toBe(1);
  });

  it("truncates fractional steps and clamps anything past the last screen", () => {
    expect(resolveStep("3.9", SCREEN_COUNT)).toBe(3);
    expect(resolveStep("99", SCREEN_COUNT)).toBe(SCREEN_COUNT);
  });
});

describe("Welcome", () => {
  it("opens on screen 1: no back link, a next link to step 2, one dot lit", () => {
    const html = draw("/welcome");
    expect(html).toContain("eight basic ways of paying attention");
    expect(html).not.toContain("← Back");
    expect(html).toContain('href="/welcome/2"');
    expect(dotsOn(html)).toBe(1);
  });

  it("carries the right idea and both back/next links mid-run", () => {
    const html = draw("/welcome/3");
    expect(html).toContain("ranked, from the one they reach for first");
    expect(html).toContain('href="/welcome/2"');
    expect(html).toContain('href="/welcome/4"');
    expect(dotsOn(html)).toBe(3);
  });

  it("swaps Next for the finishing action on the last screen", () => {
    const html = draw(`/welcome/${SCREEN_COUNT}`);
    expect(html).toContain("Enter Octant");
    expect(html).not.toContain(`href="/welcome/${SCREEN_COUNT + 1}"`);
    expect(dotsOn(html)).toBe(SCREEN_COUNT);
  });

  it("clamps a step past the end to the last real screen instead of blanking", () => {
    expect(draw("/welcome/999")).toContain("Enter Octant");
  });

  it("offers Skip on every screen — never a quiz someone has to finish to leave", () => {
    for (const path of ["/welcome", "/welcome/3", `/welcome/${SCREEN_COUNT}`]) {
      expect(draw(path)).toContain("Skip intro");
    }
  });

  it("renders every screen's figure without throwing", () => {
    for (let n = 1; n <= SCREEN_COUNT; n++) expect(() => draw(`/welcome/${n}`)).not.toThrow();
  });
});

describe("ONBOARDING_DONE_KEY", () => {
  it("is the storage key App.tsx reads to decide whether \"/\" redirects here", () => {
    expect(ONBOARDING_DONE_KEY).toBe("onboarding.done");
  });
});
