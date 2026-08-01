import { beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { TYPES } from "../src/engine/core";
import { buildSystemInstruction } from "../src/engine/context";
import { ThemeProvider } from "../src/components/Theme";
import { chatFigure, DIRECTIVE, FIGURE_NAMES } from "../src/chat/chat-figures";
import Markdown from "../src/chat/Markdown";

/* ------------------------------------------------------------------ *
 * The assistant's figure directives: every name renders for valid
 * args, invalid input degrades to inert text, streaming partials stay
 * text, and the model's menu (the primer) cannot drift from the
 * client's renderer (the registry).
 * ------------------------------------------------------------------ */

beforeAll(() => {
  const real = console.error;
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("useLayoutEffect does nothing on the server")) return;
    real(...(args as Parameters<typeof console.error>));
  });
});

const draw = (node: ReactNode) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <ThemeProvider>{node}</ThemeProvider>
    </MemoryRouter>,
  );

describe("primer ↔ registry parity", () => {
  const primer = buildSystemInstruction({ kind: "home" });

  it("every registry figure is offered to the model", () => {
    for (const name of FIGURE_NAMES) {
      expect(primer, `primer names {{figure:${name}}}`).toContain(`{{figure:${name}`);
    }
  });

  it("every figure the primer offers exists in the registry", () => {
    for (const m of primer.matchAll(/\{\{figure:([a-z-]+)/g)) {
      expect(FIGURE_NAMES, `registry implements ${m[1]}`).toContain(m[1]);
    }
  });
});

describe("directives render", () => {
  it("every per-type figure renders for all sixteen types", () => {
    for (const t of TYPES) {
      for (const d of [
        `{{figure:wiring ${t}}}`,
        `{{figure:four-sides ${t}}}`,
        `{{figure:gateway-path ${t}}}`,
        `{{figure:savior-demon ${t}}}`,
        `{{figure:animal-stack ${t}}}`,
        `{{figure:wheel ${t}}}`,
      ]) {
        const html = draw(chatFigure(d));
        expect(html, d).toContain("chat-fig");
        expect(html, d).not.toContain("figure unavailable");
      }
    }
  });

  it("pair figures render, and arguments are case-tolerant", () => {
    for (const d of [
      "{{figure:relation-landing ENTP INFJ}}",
      "{{figure:diverging-ease entp infj}}",
      "{{figure:archetype-grid}}",
      "{{figure:involution-table Ne}}",
      "{{figure:quadra-grid beta}}",
      "{{figure:octagram-map ENTJ}}",
    ]) {
      const html = draw(chatFigure(d));
      expect(html, d).toContain("chat-fig");
    }
  });

  it("invalid but complete directives degrade to inert muted text", () => {
    for (const d of [
      "{{figure:relation-landing ENTP NOPE}}",
      "{{figure:wiring XXXX}}",
      "{{figure:made-up-name ENTP}}",
      "{{figure:involution-table Zz}}",
    ]) {
      const html = draw(chatFigure(d));
      expect(html, d).toContain("figure unavailable");
      expect(html, d).not.toContain("chat-fig");
    }
  });

  it("partial (still streaming) directives are not directives yet", () => {
    expect(chatFigure("{{figure:wiring ENTP")).toBeNull();
    expect(chatFigure("{{figure:wir")).toBeNull();
    expect(chatFigure("plain prose line")).toBeNull();
    expect(DIRECTIVE.test("{{figure:wiring ENTP}} trailing words")).toBe(false);
  });
});

describe("markdown interleaving", () => {
  it("renders prose around a figure, in order", () => {
    const html = draw(
      <Markdown text={"Before the picture.\n\n{{figure:gateway-path ENTP}}\n\nAfter the picture."} />,
    );
    const before = html.indexOf("Before the picture");
    const fig = html.indexOf("chat-fig");
    const after = html.indexOf("After the picture");
    expect(before).toBeGreaterThanOrEqual(0);
    expect(fig).toBeGreaterThan(before);
    expect(after).toBeGreaterThan(fig);
  });

  it("handles multiple figures in one message", () => {
    const html = draw(
      <Markdown text={"{{figure:quadra-grid}}\nwords\n{{figure:archetype-grid ENTP}}"} />,
    );
    expect(html.split("chat-fig").length - 1).toBeGreaterThanOrEqual(2);
  });

  it("a directive inside a paragraph stays plain text", () => {
    const html = draw(<Markdown text={"see {{figure:wiring ENTP}} here"} />);
    expect(html).not.toContain("chat-fig");
    expect(html).toContain("see");
  });
});
