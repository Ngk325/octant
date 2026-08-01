import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import InvolutionTable from "../src/components/InvolutionTable";
import QuadraFunctionGrid from "../src/components/QuadraFunctionGrid";
import NetworkRing from "../src/components/NetworkRing";
import Figure from "../src/components/Figure";
import Matrix from "../src/views/Matrix";
import { ChatProvider } from "../src/chat/ChatContext";
import { analyse, type Member } from "../src/engine/network";
import { ThemeProvider } from "../src/components/Theme";

/* ------------------------------------------------------------------ *
 * The accessibility pass, held as assertions.
 *
 * The palette tests already hold colour; this file holds structure:
 * ARIA tables must contain cells (a row with none reads as an empty
 * table), sideways-scrolling regions must be reachable by keyboard, and
 * facts that only lived in mouse-only affordances (SVG <title> inside
 * role="img", the matrix cells' title attribute) must also exist as
 * text assistive tech actually announces.
 * ------------------------------------------------------------------ */

const count = (html: string, needle: string) => html.split(needle).length - 1;

describe("ARIA tables are actually tables", () => {
  it("InvolutionTable: every row holds cells, and headers are headers", () => {
    const html = renderToStaticMarkup(<ThemeProvider><InvolutionTable /></ThemeProvider>);
    expect(count(html, 'role="row"')).toBe(9); // 1 header + 8 function rows
    expect(count(html, 'role="columnheader"')).toBe(4);
    expect(count(html, 'role="rowheader"')).toBe(8);
    expect(count(html, 'role="cell"')).toBe(24); // 8 rows × 3 moves
  });

  it("QuadraFunctionGrid: four rows, each a header plus a cell", () => {
    const html = renderToStaticMarkup(<ThemeProvider><QuadraFunctionGrid /></ThemeProvider>);
    expect(count(html, 'role="row"')).toBe(4);
    expect(count(html, 'role="rowheader"')).toBe(4);
    expect(count(html, 'role="cell"')).toBe(4);
  });
});

describe("what only a mouse could reach, now announced", () => {
  it("NetworkRing carries every edge as real text, not only as <title>", () => {
    const members: Member[] = [
      { id: "1", name: "Ana", type: "ENTP" },
      { id: "2", name: "Ben", type: "INFJ" },
      { id: "3", name: "Cato", type: "ISTJ" },
    ];
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <NetworkRing members={members} report={analyse(members)} />
      </ThemeProvider>,
    );
    // n(n-1)/2 pairs, each once in the tooltip and once in the hidden list.
    expect(count(html, 'class="sr-only"')).toBe(1);
    expect(count(html, "Ana ↔ Ben")).toBe(2);
    expect(count(html, "<li>")).toBe(3);
  });

  it("every matrix cell names its relation to assistive tech", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ThemeProvider>
          <ChatProvider>
            <Matrix />
          </ChatProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );
    // 256 /pair/ links, each with its own aria-label — counted precisely, so a
    // missing link label cannot hide behind the group label or any other
    // aria-label on the page.
    const relationLinks = html.match(/<a\b(?=[^>]*\bhref="\/pair\/)[^>]*\baria-label="[^"]+"/g) ?? [];
    expect(relationLinks).toHaveLength(256);
    expect(html).toMatch(/aria-label="INFJ is ENTP('|&#x27;)s [^"]* — ease \d+ for ENTP"/);
  });
});

describe("scrollable figures are keyboard-reachable", () => {
  it("a figure with a minWidth is a focusable, labelled region", () => {
    const html = renderToStaticMarkup(
      <Figure label="The signal path" minWidth={660}>
        <svg role="img" aria-label="x" />
      </Figure>,
    );
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="The signal path"');
  });

  it("a figure that cannot scroll is not a tab stop", () => {
    const html = renderToStaticMarkup(
      <Figure label="Static">
        <svg role="img" aria-label="x" />
      </Figure>,
    );
    expect(html).not.toContain("tabindex");
  });
});
