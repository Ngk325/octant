import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import TypeReader from "../src/views/TypeReader";
import TypeReaderLegacy from "../src/views/TypeReaderLegacy";
import { ThemeProvider } from "../src/components/Theme";
import { ChatProvider } from "../src/chat/ChatContext";
import { TYPES } from "../src/engine/data";

/* ------------------------------------------------------------------ *
 * THE READING ORDER OF THE "A TYPE" SECTION
 *
 * /type/:type was resequenced in 2026-08 so that the foundations come
 * first and the reference material last. Three things are worth holding:
 *
 *   1. the live page renders the new order, for all sixteen types;
 *   2. every anchor id the previous page carried still resolves, because
 *      things deep-link into it (learn/curriculum.tsx uses #octagram);
 *   3. the archived copy still holds the OLD order — it is the rollback,
 *      so it has to keep being the thing it says it is — and stays
 *      unrouted, which is what "kept but not published" means.
 * ------------------------------------------------------------------ */

const render = (path: string, route: string, El: () => React.ReactNode) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <ChatProvider>
          <Routes>
            <Route path={route} element={<El />} />
          </Routes>
        </ChatProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );

const live = (t: string) => render(`/type/${t}`, "/type/:type", TypeReader);
const archived = (t: string) => render(`/type/${t}`, "/type/:type", TypeReaderLegacy);

/** The order the anchored headings appear in, top to bottom. */
const anchorOrder = (html: string, ids: readonly string[]) =>
  ids
    .map((id) => [id, html.indexOf(`id="${id}"`)] as const)
    .filter(([, at]) => at >= 0)
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id);

const ALL_IDS = [
  "slots", "powers", "sides", "exchange", "exchange-switches",
  "growth", "octagram", "theme", "self-report", "fit", "reference",
] as const;

const NEW_ORDER = [
  "slots", "powers", "sides", "exchange", "growth", "octagram",
  "self-report", "exchange-switches", "theme", "fit", "reference",
];

const OLD_ORDER = [
  "powers", "slots", "sides", "exchange", "exchange-switches",
  "growth", "octagram", "theme", "fit",
];

describe("the live type reader", () => {
  it("renders the new order, for every one of the sixteen", () => {
    for (const t of TYPES) {
      expect(anchorOrder(live(t), ALL_IDS), t).toEqual(NEW_ORDER);
    }
  });

  it("keeps every anchor id the previous page carried, so deep links survive", () => {
    const html = live("ENTP");
    for (const id of anchorOrder(archived("ENTP"), ALL_IDS)) {
      expect(html, id).toContain(`id="${id}"`);
    }
  });

  it("is the only reader with a route", () => {
    const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
    expect(app).toContain("<TypeReader />");
    expect(app).not.toContain("TypeReaderLegacy");
    expect(app).not.toContain("a-type-v2");
  });
});

describe("the archived reader", () => {
  it("still holds the order it is the rollback for", () => {
    expect(anchorOrder(archived("ENTP"), ALL_IDS)).toEqual(OLD_ORDER);
  });

  it("is imported by nothing under src/, so it never reaches the bundle", () => {
    const views = ["App", "Home", "Types", "Sides", "Network", "Read", "Calculator", "Guide"];
    for (const v of views) {
      const src = readFileSync(
        new URL(v === "App" ? "../src/App.tsx" : `../src/views/${v}.tsx`, import.meta.url),
        "utf8",
      );
      expect(src, v).not.toContain("TypeReaderLegacy");
    }
  });
});
