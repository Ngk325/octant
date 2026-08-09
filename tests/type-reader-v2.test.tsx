import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import TypeReader from "../src/views/TypeReader";
import TypeReaderV2 from "../src/views/TypeReaderV2";
import { ThemeProvider } from "../src/components/Theme";
import { ChatProvider } from "../src/chat/ChatContext";
import { TYPES } from "../src/engine/data";

/* ------------------------------------------------------------------ *
 * THE DRAFT RESTRUCTURE OF THE TYPE READER
 *
 * /a-type-v2 is a preview, so what is worth asserting is not its prose
 * but the two promises made about it:
 *
 *   1. it is a RESEQUENCE — the same nine anchors, in the new order, for
 *      all sixteen types, and no anchor id dropped, so anything that
 *      deep-links into a type reader (learn/curriculum.tsx uses
 *      #octagram) still lands somewhere here;
 *   2. the shipped page is untouched and keeps its own order.
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

const v2 = (t: string) => render(`/a-type-v2/${t}`, "/a-type-v2/:type", TypeReaderV2);
const v1 = (t: string) => render(`/type/${t}`, "/type/:type", TypeReader);

/** The order the h2/h3 anchors appear in, top to bottom. */
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

const V2_ORDER = [
  "slots", "powers", "sides", "exchange", "growth", "octagram",
  "self-report", "exchange-switches", "theme", "fit", "reference",
];

const V1_ORDER = [
  "powers", "slots", "sides", "exchange", "exchange-switches",
  "growth", "octagram", "theme", "fit",
];

describe("the draft reader is a resequence, not a rewrite", () => {
  it("puts the sections in the new order, for every one of the sixteen", () => {
    for (const t of TYPES) {
      expect(anchorOrder(v2(t), ALL_IDS), t).toEqual(V2_ORDER);
    }
  });

  it("keeps every anchor id the shipped page carries, so deep links survive", () => {
    const draft = v2("ENTP");
    for (const id of anchorOrder(v1("ENTP"), ALL_IDS)) {
      expect(draft, id).toContain(`id="${id}"`);
    }
  });

  it("marks itself as a draft and points at the live page", () => {
    const html = v2("INFJ");
    expect(html).toContain("Draft — not linked from the nav.");
    expect(html).toContain('href="/type/INFJ"');
  });

  it("leaves the shipped page's own order alone", () => {
    expect(anchorOrder(v1("ENTP"), ALL_IDS)).toEqual(V1_ORDER);
  });
});
