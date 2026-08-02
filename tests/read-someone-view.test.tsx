// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../src/components/Theme";
import { ChatProvider } from "../src/chat/ChatContext";
import { COIN_LABELS, DETERMINING } from "../src/engine/data";
import { coins } from "../src/engine/ops";
import { READ_PROMPTS, readPoleValue } from "../src/engine/read";
import Read from "../src/views/Read";

/* ------------------------------------------------------------------ *
 * "Read someone" is the calculator's data reached through a different
 * door. These tests hold the interactive contract — every prompt is on
 * the page, answering all six prompts resolves a type the same way the
 * calculator would, and a re-click clears an answer instead of leaving
 * it stuck — mounted in jsdom because the narrowing only happens
 * through the click handlers a static render never fires.
 * ------------------------------------------------------------------ */

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

async function mount(): Promise<HTMLElement> {
  await act(async () => {
    root = createRoot(host);
    root.render(
      <MemoryRouter initialEntries={["/read-someone"]}>
        <ThemeProvider>
          <ChatProvider>
            <Read />
          </ChatProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );
  });
  return host;
}

/** The choice button whose full text is exactly this pole's copy. */
function buttonFor(el: HTMLElement, text: string): HTMLButtonElement {
  const btn = [...el.querySelectorAll("button.choice")].find((b) => b.textContent === text);
  if (!btn) throw new Error(`no choice button for "${text}"`);
  return btn as HTMLButtonElement;
}

async function click(btn: HTMLButtonElement) {
  await act(async () => btn.click());
}

describe("Read someone — the page", () => {
  it("renders all six prompts and their coin labels", async () => {
    const el = await mount();
    expect(el.textContent).toContain("Read someone");
    for (const p of READ_PROMPTS) {
      expect(el.textContent, p.cue).toContain(p.cue);
      expect(el.textContent, p.poles[0]).toContain(p.poles[0]);
      expect(el.textContent, p.poles[1]).toContain(p.poles[1]);
      expect(el.textContent, COIN_LABELS[p.coin]).toContain(COIN_LABELS[p.coin]);
    }
  });

  it("tags exactly the four determining prompts and two cross-checks", async () => {
    const el = await mount();
    const determining = READ_PROMPTS.filter((p) => (DETERMINING as readonly number[]).includes(p.coin));
    const crossCheck = READ_PROMPTS.filter((p) => !(DETERMINING as readonly number[]).includes(p.coin));
    expect(determining).toHaveLength(4);
    expect(crossCheck).toHaveLength(2);
    expect([...el.querySelectorAll(".chip.on")].filter((c) => c.textContent === "decides their type")).toHaveLength(4);
    expect([...el.querySelectorAll(".chip")].filter((c) => c.textContent === "cross-check")).toHaveLength(2);
  });

  it("resolves the right type once every prompt is answered correctly", async () => {
    const el = await mount();
    const c = coins("ENTP");
    for (const p of READ_PROMPTS) {
      const wantsPoleA = readPoleValue(p, 0) === c[p.coin];
      await click(buttonFor(el, wantsPoleA ? p.poles[0] : p.poles[1]));
    }
    expect(el.textContent).toContain("Their type");
    expect(el.textContent).toMatch(/ENTP/);
    expect(el.textContent).toContain("Everything you noticed lines up.");
  });

  it("clicking the same pole twice clears the answer", async () => {
    const el = await mount();
    const p = READ_PROMPTS[0];
    const btn = buttonFor(el, p.poles[0]);
    await click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    await click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("shows the mobile dock once anything is answered, not before", async () => {
    const el = await mount();
    expect(el.querySelector(".calc-dock")).toBeNull();
    await click(buttonFor(el, READ_PROMPTS[0].poles[0]));
    expect(el.querySelector(".calc-dock")).not.toBeNull();
  });
});
