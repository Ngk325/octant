// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../src/components/Theme";
import { ChatProvider } from "../src/chat/ChatContext";
import { TYPES, stack } from "../src/engine/core";
import { ARCHETYPE, SLOT_NAMES, type Fn } from "../src/engine/data";
import { SIDE_ORDER } from "../src/engine/sides";
import { DOOR_EMOJI, FN_EMOJI, emojiStack } from "../src/engine/emoji";
import Guide from "../src/views/Guide";

/* ------------------------------------------------------------------ *
 * The emoji guide: the data tables held to their own rules (one emoji
 * per function, one per door, no collisions), then the page itself —
 * static render for the overview and the matrix, mounted for the
 * search box and the slots/sides toggle, which only a real interaction
 * exercises.
 * ------------------------------------------------------------------ */

const FNS: Fn[] = ["Ne", "Ni", "Se", "Si", "Te", "Ti", "Fe", "Fi"];

describe("the emoji tables", () => {
  it("every function has exactly one emoji, and no two share one", () => {
    expect(Object.keys(FN_EMOJI).sort()).toEqual([...FNS].sort());
    expect(new Set(Object.values(FN_EMOJI)).size).toBe(8);
  });

  it("every side has exactly one door emoji, and no two share one", () => {
    expect(Object.keys(DOOR_EMOJI).sort()).toEqual([...SIDE_ORDER].sort());
    expect(new Set(Object.values(DOOR_EMOJI)).size).toBe(4);
  });

  it("emojiStack renders every type's actual stack, front four then back four", () => {
    for (const t of TYPES) {
      const st = stack(t);
      const want = `${st.slice(0, 4).map((f) => FN_EMOJI[f]).join("")} · ${st.slice(4).map((f) => FN_EMOJI[f]).join("")}`;
      expect(emojiStack(t)).toBe(want);
    }
  });
});

const draw = (path: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <ChatProvider>
          <Routes>
            <Route path="/guide" element={<Guide />} />
            <Route path="/guide/:type" element={<Guide />} />
          </Routes>
        </ChatProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );

describe("Guide — static render", () => {
  it("/guide shows all eight functions and both attitude columns", () => {
    const html = draw("/guide");
    for (const fn of FNS) {
      expect(html, fn).toContain(`>${fn}<`);
      expect(html, FN_EMOJI[fn]).toContain(FN_EMOJI[fn]);
    }
    expect(html).toContain("Extraverted — facing out");
    expect(html).toContain("Introverted — facing in");
  });

  it("/guide's matrix has one column per slot plus the type column, one row per type", () => {
    const html = draw("/guide");
    expect((html.match(/scope="col"/g) ?? []).length).toBe(1 + SLOT_NAMES.length);
    expect((html.match(/scope="row"/g) ?? []).length).toBe(TYPES.length);
  });

  it("every matrix cell carries an accessible label naming its type, slot and function", () => {
    const html = draw("/guide");
    // renderToStaticMarkup HTML-escapes the apostrophe as &#x27;.
    expect((html.match(/aria-label="[^"]*&#x27;s [^"]* is [A-Za-z]{2}"/g) ?? []).length).toBe(TYPES.length * 8);
  });

  it("/guide/:type opens straight into that type's drilldown, slot order by default", () => {
    const html = draw("/guide/INTJ");
    expect(html).toContain("INTJ");
    expect(html).toContain(ARCHETYPE.INTJ[0]);
    for (const name of SLOT_NAMES) expect(html, name).toContain(name);
    expect(html).toContain(emojiStack("INTJ"));
  });

  it("an unknown type in the URL falls back to the overview, not a crash", () => {
    const html = draw("/guide/XXXX");
    expect(html).toContain("The emoji guide");
    expect(html).not.toContain("XXXX");
  });
});

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  act(() => root?.unmount());
  host.remove();
  vi.restoreAllMocks();
});

async function mount(path: string): Promise<HTMLElement> {
  await act(async () => {
    root = createRoot(host);
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <ThemeProvider>
          <ChatProvider>
            <Routes>
              <Route path="/guide" element={<Guide />} />
              <Route path="/guide/:type" element={<Guide />} />
            </Routes>
          </ChatProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );
  });
  return host;
}

describe("Guide — interactive", () => {
  it("searching for a function code hides the functions that do not match", async () => {
    const el = await mount("/guide");
    const input = el.querySelector('input[aria-label="Search the guide"]') as HTMLInputElement;
    // React tracks the native input's value setter, so a plain `input.value = …`
    // is invisible to it — the native setter must be called directly for the
    // subsequent "input" event to be seen as a real change.
    const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    await act(async () => {
      setValue.call(input, "Fi");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(el.textContent).toContain("Introverted Feeling");
    expect(el.textContent).not.toContain("Extraverted Intuition");
  });

  it("the sides toggle reveals each side's own type, name and archetypes", async () => {
    const el = await mount("/guide/INTJ");
    const sidesBtn = [...el.querySelectorAll("button.chip")].find((b) => b.textContent === "By the four sides");
    expect(sidesBtn).toBeTruthy();
    await act(async () => (sidesBtn as HTMLButtonElement).click());

    // ENTP is INTJ's subconscious (Dual); its epithets should be right there in the
    // reveal, with no further click needed to see them.
    expect(el.textContent).toContain("ENTP");
    expect(el.textContent).toContain(ARCHETYPE.ENTP[0]);
  });

  it("ArrowRight cycles to the next type", async () => {
    const el = await mount("/guide/ENTP");
    expect(el.textContent).toContain(ARCHETYPE.ENTP[0]);
    const i = TYPES.indexOf("ENTP");
    const next = TYPES[i + 1];
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });
    expect(el.textContent).toContain(ARCHETYPE[next][0]);
  });
});
