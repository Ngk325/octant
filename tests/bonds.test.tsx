import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { bondFacts, sparkFacts } from "../src/engine/bonds";
import { omega, quadra, relation, stack } from "../src/engine/core";
import { REL_SCORE, TYPES } from "../src/engine/data";
import Bonds from "../src/views/Bonds";
import { ThemeProvider } from "../src/components/Theme";
import { ChatProvider } from "../src/chat/ChatContext";

/* ------------------------------------------------------------------ *
 * THE BOND LAYER — the print deck's one genuinely new surface, lifted
 * into the engine (engine/bonds.ts) and taught at /bonds. The deck-side
 * assertions (that Bond cards print these facts) stay in cards.test.ts;
 * these hold the engine functions and the view itself.
 * ------------------------------------------------------------------ */

describe("bondFacts", () => {
  const facts = bondFacts();

  it("finds exactly the four axis pairings, each across omega", () => {
    expect(facts).toHaveLength(4);
    for (const f of facts) expect(f.b).toBe(omega[f.a]);
    // one pairing per axis, no element twice
    expect(new Set(facts.flatMap((f) => [f.a, f.b])).size).toBe(8);
  });

  it("puts every axis pairing above every other class of Lead pairing", () => {
    for (const f of facts) {
      expect(f.overNext, `${f.a}·${f.b}`).toBeGreaterThan(0);
      expect(f.mean).toBeGreaterThan(REL_SCORE.AC);
    }
  });

  it("axis Leads meet only as Counterpart or Near fit", () => {
    for (const f of facts) expect([...f.rels].sort()).toEqual(["DU", "HD"]);
  });
});

describe("sparkFacts", () => {
  const facts = sparkFacts();

  it("finds one mesh per camp, ease 92 both ways, realised twice", () => {
    expect(facts.map((f) => f.quadra)).toEqual(["Alpha", "Beta", "Gamma", "Delta"]);
    for (const f of facts) {
      for (const [x, y] of [f.outward, f.inward]) {
        expect(relation(x, y), `${x}·${y}`).toBe("AC");
        expect(quadra(x)).toBe(f.quadra);
      }
      expect(f.ease).toBe(REL_SCORE.AC);
      // the outward pair's Leads face out, the inward pair's face in
      expect(stack(f.outward[0])[0].endsWith("e")).toBe(true);
      expect(stack(f.inward[0])[0].endsWith("i")).toBe(true);
    }
  });
});

describe("the /bonds view", () => {
  const html = renderToStaticMarkup(
    <MemoryRouter initialEntries={["/bonds"]}>
      <ThemeProvider>
        <ChatProvider>
          <Routes>
            <Route path="/bonds" element={<Bonds />} />
          </Routes>
        </ChatProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );

  it("teaches all eight pairings — four axis bonds, four meshes", () => {
    for (const f of bondFacts()) {
      expect(html).toContain(`${f.a} carries ${f.b} in the Cave`);
    }
    for (const f of sparkFacts()) {
      expect(html).toContain(f.outward.join(" · "));
      expect(html).toContain(f.inward.join(" · "));
    }
  });

  it("prints only derived numbers — the sweep's own means and scores", () => {
    expect(html).toContain(`mean ease ${Math.round(bondFacts()[0].mean)} of 100`);
    expect(html).toContain(`ease ${REL_SCORE.AC} in both`);
  });

  it("names tools, never a bare type as the subject — the altitude is the point", () => {
    // The realisations name types, but every panel title is elements only.
    for (const t of TYPES) expect(html).not.toContain(`<h3 class="card-title">${t}`);
  });
});
