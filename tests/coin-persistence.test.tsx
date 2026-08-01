// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TypeReader from "../src/views/TypeReader";
import { ThemeProvider } from "../src/components/Theme";
import { ChatProvider } from "../src/chat/ChatContext";

/* ------------------------------------------------------------------ *
 * The self-reported coins persist per type (owner's decision, 2026-08).
 * These tests MOUNT the component in jsdom rather than server-rendering
 * it, because the write path lives in a useEffect that a static render
 * never runs — the earlier version could only see the read path. The
 * boundaries are the point:
 *
 *   - still SELF-reported: nothing derives a coin from the type;
 *   - keyed BY type, so an answer about ENTP never surfaces on INFJ, the
 *     original reset-on-navigation invariant kept under persistence;
 *   - malformed OR invalid-valued storage reads as unset.
 * ------------------------------------------------------------------ */

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  localStorage.clear();
  host = document.createElement("div");
  document.body.appendChild(host);
  /* jsdom has no layout; TypeReader's measured-width and scroll effects log
     harmlessly. Keep the test output legible. */
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  act(() => root?.unmount());
  host.remove();
  vi.restoreAllMocks();
});

/** Mount TypeReader at a route and return the host once effects have run. */
async function mount(path: string): Promise<HTMLElement> {
  await act(async () => {
    root = createRoot(host);
    root.render(
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
  });
  return host;
}

/** The sensory <select> — a stable handle for a self-reported coin control. */
const sensorySelect = (el: HTMLElement): HTMLSelectElement => {
  const sel = [...el.querySelectorAll("select")].find((s) =>
    [...s.options].some((o) => o.value === "M") && [...s.options].some((o) => o.value === "F"),
  );
  if (!sel) throw new Error("sensory select not found");
  return sel;
};

/** Fire a native change on a select, the way a user picking an option would. */
async function pick(sel: HTMLSelectElement, value: string) {
  await act(async () => {
    sel.value = value;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("coin persistence — the write path", () => {
  it("writes the answer to octant.coins.<type> when a coin is set", async () => {
    const el = await mount("/type/ENTP");
    await pick(sensorySelect(el), "F");
    const stored = JSON.parse(localStorage.getItem("octant.coins.ENTP") ?? "{}");
    expect(stored.sub.sensory).toBe("F");
  });

  it("does not litter storage on a first visit with nothing set", async () => {
    await mount("/type/ISTJ");
    expect(localStorage.getItem("octant.coins.ISTJ")).toBeNull();
  });
});

describe("coin persistence — the read path and its boundaries", () => {
  it("reads a stored answer back for the type it was given about", async () => {
    localStorage.setItem("octant.coins.ENTP", JSON.stringify({ sub: { sensory: "F" }, oct: {} }));
    const el = await mount("/type/ENTP");
    expect(sensorySelect(el).value).toBe("F");
  });

  it("never lets one type's answers surface on another", async () => {
    localStorage.setItem("octant.coins.ENTP", JSON.stringify({ sub: { sensory: "F" }, oct: {} }));
    const el = await mount("/type/INFJ");
    expect(sensorySelect(el).value).toBe("");
  });

  it("reads a corrupt record as unset instead of throwing", async () => {
    localStorage.setItem("octant.coins.ENTP", "{not json");
    const el = await mount("/type/ENTP");
    expect(sensorySelect(el).value).toBe("");
  });

  it("rejects a valid-JSON record carrying an invalid coin value", async () => {
    // Valid JSON, invalid field — must be treated as unset, not restored.
    localStorage.setItem("octant.coins.ENTP", JSON.stringify({ sub: { sensory: "ZZZ" }, oct: { development: "banana" } }));
    const el = await mount("/type/ENTP");
    expect(sensorySelect(el).value).toBe("");
  });
});
