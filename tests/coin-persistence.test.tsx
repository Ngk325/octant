// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import TypeReader from "../src/views/TypeReader";
import { ThemeProvider } from "../src/components/Theme";
import { ChatProvider } from "../src/chat/ChatContext";

/* ------------------------------------------------------------------ *
 * The self-reported coins persist per type (owner's decision, 2026-08)
 * — and the boundaries of that persistence are the point:
 *
 *   - still SELF-reported: nothing here derives a coin from the type;
 *   - keyed BY type, so an answer given about ENTP can never surface
 *     while reading INFJ — the original reset-on-navigation invariant,
 *     kept under persistence;
 *   - malformed storage reads as unset, the app's uniform posture.
 * ------------------------------------------------------------------ */

const at = (path: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <ChatProvider>
          <Routes>
            <Route path="/type/:type" element={<TypeReader />} />
          </Routes>
        </ChatProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );

beforeEach(() => localStorage.clear());

describe("coin persistence", () => {
  it("reads a stored answer back for the type it was given about", () => {
    localStorage.setItem("octant.coins.ENTP", JSON.stringify({ sub: { sensory: "F" }, oct: {} }));
    const html = at("/type/ENTP");
    // React marks the chosen option selected in server markup.
    expect(html).toMatch(/<select[^>]*>(?:(?!<\/select>)[\s\S])*value="F" selected/);
  });

  it("never lets one type's answers surface on another", () => {
    localStorage.setItem("octant.coins.ENTP", JSON.stringify({ sub: { sensory: "F" }, oct: {} }));
    const html = at("/type/INFJ");
    expect(html).not.toMatch(/value="F" selected/);
  });

  it("reads a corrupt record as unset instead of throwing", () => {
    localStorage.setItem("octant.coins.ENTP", "{not json");
    expect(() => at("/type/ENTP")).not.toThrow();
  });
});
