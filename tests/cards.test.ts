import { describe, expect, it } from "vitest";
import { alpha, complements, ease, omega, quadra, stack } from "../src/engine/core";
import { DOM_AUX, RECIPROCAL, REL_NAME, REL_SCORE, SLOT_NAMES, SLOT_TAGS, TYPES, type Fn, type RelCode } from "../src/engine/data";
import { correlation } from "../src/engine/empirical";
import { REL, relation } from "../src/engine/core";
import { FN_COLOR } from "../src/engine/palette";
import { ART_W, LABEL_MIN, artFor, backArt } from "../src/cards/art";
import { bondFacts, deck, deckSuits, fit, sparkFacts, type Card, type Suit } from "../src/cards/deck";
import { CARD_PAGE, TRIM, cardHtml, cardsDocument, sheetsDocument } from "../src/cards/render";

/* ------------------------------------------------------------------ *
 * The deck is printed, and a printed mistake cannot be patched. These
 * assertions cover the three ways a card could lie: by carrying a claim
 * the engine does not make, by rendering copy the safe area cannot hold,
 * or by drawing art that is not actually a function of its own data.
 *
 * The one check that cannot live here is whether the text physically
 * fits — that needs a browser, and it runs in scripts/build-cards.mjs,
 * which fails the build if any card overruns. What this file guards is
 * that the copy never grows past the budgets that probe last approved.
 * ------------------------------------------------------------------ */

const CARDS = deck();
const byId = (id: string) => CARDS.find((c) => c.id === id)!;

/** What each suit must contain, and why that is the number. */
const EXPECTED: Record<Suit, number> = {
  front: 3,     // what this is, the alphabet, how to read a card
  type: 16,     // the sixteen (lead, support) pairs
  function: 8,  // the eight information elements
  attitude: 8,  // the eight seats an element can occupy
  quadra: 4,    // four value camps
  side: 4,      // four sides of one mind
  bond: 8,      // four axis pairings (omega's four orbits) + four crosswise meshes (one per camp)
  relation: 16, // sixteen intertype codes
  wheel: 8,     // eight Octagram wheels
};

describe("deck shape", () => {
  it("is seventy-two cards in eight suits, plus three of front matter", () => {
    expect(CARDS).toHaveLength(75);
    expect(CARDS.filter((c) => c.suit !== "front")).toHaveLength(72);
  });

  it("has exactly the suit sizes the model implies", () => {
    for (const [suit, count] of Object.entries(EXPECTED)) {
      expect(CARDS.filter((c) => c.suit === suit), suit).toHaveLength(count);
    }
  });

  it("numbers every card within its own suit", () => {
    for (const c of CARDS) {
      expect(c.of, c.id).toBe(EXPECTED[c.suit]);
      expect(c.n, c.id).toBeGreaterThanOrEqual(1);
      expect(c.n, c.id).toBeLessThanOrEqual(c.of);
    }
    for (const suit of Object.keys(EXPECTED) as Suit[]) {
      const ns = CARDS.filter((c) => c.suit === suit).map((c) => c.n).sort((a, b) => a - b);
      expect(ns, suit).toEqual(ns.map((_, i) => i + 1));
    }
  });

  it("gives every card a unique id", () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
  });

  it("agrees with deckSuits(), which the key card prints", () => {
    const total = deckSuits().reduce((n, s) => n + s.count, 0);
    expect(total).toBe(72);
    for (const s of deckSuits()) expect(s.count, s.label).toBe(EXPECTED[s.suit]);
  });
});

describe("card copy", () => {
  it("fills every field, with nothing leaked from a template", () => {
    for (const c of CARDS) {
      for (const [field, value] of [["title", c.title], ["subtitle", c.subtitle], ["lede", c.lede], ["footer", c.footer]]) {
        expect(value, `${c.id}.${field}`).toBeTruthy();
        expect(value, `${c.id}.${field}`).not.toMatch(/undefined|NaN|\[object|\$\{/);
      }
      expect(c.blocks.length, c.id).toBeGreaterThanOrEqual(2);
      // Three blocks on a playing card. The front-matter list cards run their
      // eight items as a dense list instead, which is why they declare `dense`.
      expect(c.blocks.length, c.id).toBeLessThanOrEqual(c.dense ? 8 : 3);
      for (const b of c.blocks) {
        expect(b.label, c.id).toBeTruthy();
        expect(b.text, c.id).toBeTruthy();
        expect(b.text, `${c.id} — ${b.label}`).not.toMatch(/undefined|NaN|\[object|\$\{/);
      }
    }
  });

  /* The budgets the browser probe last signed off on. Copy that grows past
     these is copy the safe area cannot hold, so it fails here rather than
     silently on the press. */
  it("stays inside the budgets the print probe approved", () => {
    for (const c of CARDS) {
      expect(c.lede.length, `${c.id} lede`).toBeLessThanOrEqual(155);
      expect(c.footer.length, `${c.id} footer`).toBeLessThanOrEqual(96);
      const body = c.blocks.reduce((n, b) => n + b.label.length + b.text.length, 0);
      // Front-matter cards set their own budget: .card.front drops dd to 5.7pt
      // and carries no chip row, so they hold more than a suit card at the same
      // height. Both numbers come from the print probe, not from taste.
      expect(body, `${c.id} blocks`).toBeLessThanOrEqual(c.suit === "front" && !c.dense ? 440 : c.dense ? 460 : c.suit === "bond" ? 400 : 380);
    }
  });

  /** A block is either prose, which must be punctuated, or a middot list, which must not be. */
  it("punctuates every prose block and leaves the lists alone", () => {
    for (const c of CARDS) {
      for (const b of c.blocks) {
        const isList = b.text.includes(" · ");
        expect(b.text, `${c.id} — ${b.label}`).toMatch(isList ? /[A-Za-z]$/ : /[.!?”)]$/);
      }
    }
  });
});

describe("fit()", () => {
  const long = "One thing is true. A second thing, which qualifies it, is also true. A third is not.";

  it("returns short text untouched", () => {
    expect(fit("Short enough.", 40)).toBe("Short enough.");
  });

  it("keeps whole sentences when it can", () => {
    expect(fit(long, 40)).toBe("One thing is true.");
  });

  it("falls back to whole clauses when no sentence fits", () => {
    const clause = "a bluff, not a performance — convincing in short bursts, and it collapses under pressure";
    const out = fit(clause, 30);
    expect(out).toBe("a bluff, not a performance.");
  });

  it("never invents words and never cuts mid-word", () => {
    for (const max of [20, 40, 60, 80]) {
      const out = fit(long, max);
      expect(long.startsWith(out.replace(/\.$/, ""))).toBe(true);
    }
  });

  it("always ends on a terminator", () => {
    for (const max of [12, 25, 50, 200]) expect(fit(long, max)).toMatch(/[.!?]$/);
  });
});

describe("what the cards claim is what the engine says", () => {
  it("prints the real stack on every type card, in slot order", () => {
    for (const t of TYPES) {
      const card = byId(`type-${t}`);
      expect(card.chips.map((c) => c.fn)).toEqual(stack(t));
      expect(card.chips.map((c) => c.note)).toEqual([...SLOT_NAMES]);
      // Front four solid, back four dimmed — the shadow block is not the ego.
      expect(card.chips.map((c) => Boolean(c.dim))).toEqual([false, false, false, false, true, true, true, true]);
    }
  });

  /**
   * The Seat cards claim slots i and i+4 always hold one element with its
   * attitude flipped. stack() builds the shadow block by applying alpha to the
   * ego block, so this must hold for every type — if it ever did not, eight
   * printed cards would be wrong.
   */
  it("holds the shadow-twin claim the Seat cards print", () => {
    for (const t of TYPES) {
      const st = stack(t);
      for (let i = 0; i < 4; i++) expect(st[i + 4], `${t} slot ${i + 1}`).toBe(alpha[st[i]]);
    }
  });

  it("names a real partner in every channel's worked example", () => {
    for (const code of Object.keys(REL_SCORE) as RelCode[]) {
      const card = byId(`relation-${code}`);
      const partner = TYPES.find((t) => relation("ENTP", t) === code)!;
      expect(card.blocks[0].text, code).toContain(partner);
      expect(card.subtitle, code).toContain(String(REL_SCORE[code]));
      expect(card.title).toBe(REL_NAME[code]);
    }
  });

  it("is right that twelve channels are symmetric and four are not", () => {
    const codes = Object.keys(REL_SCORE) as RelCode[];
    expect(codes.filter((c) => RECIPROCAL[c] === c)).toHaveLength(12);
    expect(codes.filter((c) => RECIPROCAL[c] !== c)).toHaveLength(4);
    // And that the reciprocal really is what the other chair reads.
    for (const a of TYPES) for (const b of TYPES) expect(REL[b][a]).toBe(RECIPROCAL[REL[a][b]]);
  });

  it("orders the channel suit by ease, richest first", () => {
    const scores = CARDS.filter((c) => c.suit === "relation").map((c) => Number(c.subtitle.match(/ease (\d+)/)![1]));
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(scores[0]).toBe(100);
    expect(scores[15]).toBe(10);
  });

  /**
   * The Spark bonds print a strong general claim: both crosswise meshes
   * holding at once IS the Spark relation, and one alone is Upstream or
   * Downstream. Sweep all 240 ordered pairs and check the equivalence in both
   * directions — no relation may sneak into a mesh class it does not belong to.
   */
  it("holds the crosswise-mesh equivalence the Spark bonds print", () => {
    for (const a of TYPES) {
      for (const b of TYPES) {
        if (a === b) continue;
        const [ad, ax] = DOM_AUX[a];
        const [bd, bx] = DOM_AUX[b];
        const theirLead = bd === omega[ax];    // their Lead answers my Support
        const theirSupport = bx === omega[ad]; // their Support answers my Lead
        const code = relation(a, b);
        const expected = theirLead && theirSupport ? "AC" : theirLead ? "BR" : theirSupport ? "BE" : null;
        if (expected) expect(code, `${a}→${b}`).toBe(expected);
        else expect(["AC", "BR", "BE"], `${a}→${b}`).not.toContain(code);
      }
    }
  });

  it("prints spark facts the engine reproduces: one mesh per camp, ease 92 both ways", () => {
    const facts = sparkFacts();
    expect(facts.map((f) => f.quadra)).toEqual(["Alpha", "Beta", "Gamma", "Delta"]);
    for (const f of facts) {
      for (const [x, y] of [f.outward, f.inward]) {
        expect(relation(x, y), `${x}·${y}`).toBe("AC");
        expect(ease(x, y)).toBe(f.ease);
        expect(ease(y, x)).toBe(f.ease);
        expect(quadra(x)).toBe(f.quadra);
        expect(quadra(y)).toBe(f.quadra);
      }
      expect(f.ease).toBe(REL_SCORE.AC);
      const card = byId(`bond-spark-${f.quadra.toLowerCase()}`);
      expect(card.footer).toContain(String(f.ease));
      expect(card.footer).toContain(f.outward.join(" · "));
      expect(card.footer).toContain(f.inward.join(" · "));
      // The mesh art draws exactly the outward pair's top-two, in role order.
      expect(card.art).toEqual({ kind: "mesh", fns: [...DOM_AUX[f.outward[0]], ...DOM_AUX[f.outward[1]]].map((fn) => fn) });
    }
  });

  it("keeps the axis bonds and the spark bonds one suit, axis first", () => {
    const bonds = CARDS.filter((c) => c.suit === "bond");
    expect(bonds).toHaveLength(8);
    expect(bonds.map((c) => c.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(bonds.slice(0, 4).every((c) => c.art.kind === "bond")).toBe(true);
    expect(bonds.slice(4).every((c) => c.art.kind === "mesh")).toBe(true);
    // The axis bonds outrank the sparks, which is the order the suit reads in.
    expect(Math.round(bondFacts()[0].mean)).toBeGreaterThan(REL_SCORE.AC);
  });

  /**
   * The Camp footer names the in-camp relations. The first printing asserted
   * "Twin, Opposite hand, Cousin or Colleague", and Cousin and Colleague are
   * cross-camp — so this footer is derived now, and this test re-derives it.
   */
  it("names exactly the in-camp relations on every Camp footer", () => {
    for (const q of ["Alpha", "Beta", "Gamma", "Delta"]) {
      const members = TYPES.filter((t) => quadra(t) === q);
      const rels = [...new Set(members.flatMap((x) => members.filter((y) => y !== x).map((y) => relation(x, y))))];
      const card = byId(`quadra-${q.toLowerCase()}`);
      for (const code of rels) expect(card.footer, q).toContain(REL_NAME[code]);
      for (const code of ["KD", "BU", "CF"] as RelCode[]) expect(card.footer, q).not.toContain(REL_NAME[code]);
      expect(card.footer).toContain(String(Math.min(...rels.map((c) => REL_SCORE[c]))));
    }
  });

  it("titles every Seat by its name and carries its attitude in the subtitle", () => {
    SLOT_NAMES.forEach((slot, i) => {
      const card = CARDS.filter((c) => c.suit === "attitude")[i];
      expect(card.title).toBe(slot);
      // The engine's tag key "Blindspot" prints with the title's spacing.
      expect(card.subtitle).toContain(SLOT_TAGS[i].replace("Blindspot", "Blind spot"));
    });
    // The two seats the Wirings single out say so: Power is the Superpower,
    // Hate is the Kryptonite. powersOf() reads exactly these two slots.
    expect(byId("attitude-lead").lede).toContain("Superpower");
    expect(byId("attitude-dread").lede).toContain("Kryptonite");
  });

  it("names the Counterpart and the Spark in the order complements() returns them", () => {
    for (const t of TYPES) {
      const [du, ac] = complements(t);
      expect(relation(t, du), t).toBe("DU");
      expect(relation(t, ac), t).toBe("AC");
      const company = byId(`type-${t}`).blocks[2].text;
      expect(company, t).toContain(`${du}, your Counterpart`);
      expect(company, t).toContain(`${ac}, your Spark`);
    }
  });

  it("prints the survey correlation the empirical module computes", () => {
    const key = byId("front-key");
    expect(key.footer).toContain(`r = ${correlation(TYPES).toFixed(2)}`);
    expect(correlation(TYPES)).toBeLessThan(0); // the counterweight counters
  });

  /* The engine's relation copy speaks the app's lexicon ("mobilising
     function", "base channel"); the deck translates it into its own seat
     names via REL_TRANSLATE. If a new engine string brings new jargon, this
     fails before the press does. */
  it("prints no lexicon vocabulary the deck never teaches", () => {
    for (const c of CARDS) {
      const all = [c.title, c.subtitle, c.lede, c.footer, ...c.blocks.flatMap((b) => [b.label, b.text]), ...c.chips.map((x) => x.text)].join(" ");
      expect(all, c.id).not.toMatch(/mobilising|vulnerable function|base channel|creative channel|most defended weakness/i);
    }
  });

  it("holds the seat equivalences REL_TRANSLATE prints", () => {
    for (const t of TYPES) {
      const st = stack(t);
      // "Mobilising function" is the Delight: in Spark/Upstream/Downstream the
      // element one Lead lands on sits in the other's Delight seat (slot 3).
      const spark = TYPES.find((p) => relation(t, p) === "AC")!;
      expect(stack(spark)[2], `${t} spark delight`).toBe(st[0]);
      // "Vulnerable function" is the Blind spot: the Examiner's Lead sits in
      // the examined type's slot 7.
      const examiner = TYPES.find((p) => relation(t, p) === "SR")!;
      expect(st[6], `${t} examiner`).toBe(stack(examiner)[0]);
    }
  });

  it("no longer prints the disclaimer the deck dropped", () => {
    for (const c of CARDS) {
      const all = [c.lede, c.footer, ...c.blocks.map((b) => b.text)].join(" ");
      expect(all, c.id).not.toMatch(/not a test|not a verdict/i);
    }
  });
});

describe("art", () => {
  const FNS = Object.keys(FN_COLOR.light) as Fn[];
  const PALETTE = new Set(Object.values(FN_COLOR.light).map((c) => c.toUpperCase()));

  it("is deterministic — the same card renders identically twice", () => {
    for (const c of CARDS) expect(artFor(c.id, c.art)).toBe(artFor(c.id, c.art));
  });

  it("gives every card its own picture", () => {
    const svgs = CARDS.map((c) => artFor(c.id, c.art));
    expect(new Set(svgs).size).toBe(CARDS.length);
  });

  it("draws two types that share a lead differently", () => {
    // ENTP and ENFP both lead Ne; the field's gesture is shared, the field is not.
    expect(artFor("type-ENTP", byId("type-ENTP").art)).not.toBe(artFor("type-ENFP", byId("type-ENFP").art));
  });

  it("never emits a broken coordinate", () => {
    for (const c of CARDS) expect(artFor(c.id, c.art), c.id).not.toMatch(/NaN|Infinity|undefined/);
  });

  it("colours only from the app's own function palette", () => {
    for (const c of CARDS) {
      for (const hex of artFor(c.id, c.art).match(/#[0-9A-Fa-f]{6}/g) ?? []) {
        const h = hex.toUpperCase();
        // Function hues, plus the two neutrals the card stock itself is made of.
        if (h === "#241F19" || h === "#FDFCFA") continue;
        expect(PALETTE.has(h) || /^#[0-9A-F]{6}$/.test(h), `${c.id} used ${hex}`).toBe(true);
      }
    }
  });

  it("uses the stack's own colours on a type card", () => {
    const svg = artFor("type-ENTP", byId("type-ENTP").art);
    for (const fn of stack("ENTP")) expect(svg, fn).toContain(FN_COLOR.light[fn]);
    expect(FNS).toHaveLength(8);
  });

  /* Colour cannot say which element a circle is: four hue families over eight
     elements means every hue appears twice, and someone opening the box has no
     key yet. So a drawn element is always a named one. */
  it("names every element it draws, on every card that draws one", () => {
    for (const c of CARDS) {
      const spec = c.art;
      const drawn: Fn[] =
        spec.kind === "element" ? [spec.fn]
        : spec.kind === "seat" ? []
        : "fns" in spec ? [...new Set(spec.fns)]
        : [];
      if (spec.kind === "element") continue; // the title of the card is the name
      const svg = artFor(c.id, spec);
      const named = new Set((svg.match(/>(N[ei]|S[ei]|T[ei]|F[ei])</g) ?? []).map((m) => m.slice(1, -1)));
      for (const fn of drawn) expect(named.has(fn), `${c.id} draws ${fn} without naming it`).toBe(true);
    }
  });

  /* A Seat is type-agnostic: which element occupies slot 3 is exactly what
     varies across the sixteen Wirings. The first build sketched a function
     inside each bar, picked by (i * 3 + depth) % 8, which asserted a mapping
     that does not exist. */
  it("names no element at all on a Seat card", () => {
    for (const c of CARDS.filter((x) => x.suit === "attitude")) {
      const svg = artFor(c.id, c.art);
      expect(svg.match(/>(N[ei]|S[ei]|T[ei]|F[ei])</g), c.id).toBeNull();
      for (const hex of Object.values(FN_COLOR.light)) expect(svg, `${c.id} used ${hex}`).not.toContain(hex);
    }
  });

  /* The art bleeds off all four edges; the text printed on it must not. Every
     label sits between 6mm from the page edge and the line where render.ts
     starts washing the art back to paper. Both numbers in art units. */
  it("keeps every label inside the safe window", () => {
    const TOP = 26, BOTTOM = 74;
    for (const c of CARDS) {
      for (const m of artFor(c.id, c.art).matchAll(/<text x="([-\d.]+)" y="([-\d.]+)" font-size="([\d.]+)"/g)) {
        const [x, y, size] = [Number(m[1]), Number(m[2]), Number(m[3])];
        expect(y - size / 2, `${c.id} label top`).toBeGreaterThanOrEqual(TOP - 1);
        expect(y + size / 2, `${c.id} label bottom`).toBeLessThanOrEqual(BOTTOM);
        expect(x, `${c.id} label x`).toBeGreaterThan(14);
        expect(x, `${c.id} label x`).toBeLessThan(ART_W - 14);
        // 4.5pt is the deck's chrome floor; one art unit is 0.653pt.
        expect(size, `${c.id} label size`).toBeGreaterThanOrEqual(LABEL_MIN);
      }
    }
  });
});

describe("the back", () => {
  it("renders deterministically and names all eight elements", () => {
    const svg = backArt();
    expect(svg).toBe(backArt());
    for (const fn of ["Ne", "Ni", "Se", "Si", "Te", "Ti", "Fe", "Fi"]) expect(svg).toContain(`>${fn}<`);
    expect(svg).not.toMatch(/NaN|Infinity|undefined/);
  });
});

describe("print geometry", () => {
  it("is a standard poker card: 63 x 88 trim inside a 69.09 x 94.23 page", () => {
    expect(TRIM).toEqual({ w: 63, h: 88 });
    expect(CARD_PAGE.w).toBeCloseTo(69.09, 2);
    expect(CARD_PAGE.h).toBeCloseTo(94.234, 2);
  });

  it("sets the single-card page to the bleed size, one card per page", () => {
    const doc = cardsDocument(CARDS);
    expect(doc).toContain(`@page{size:${CARD_PAGE.w}mm ${CARD_PAGE.h}mm;margin:0;}`);
    expect(doc.match(/<article class="card/g)).toHaveLength(75);
  });

  it("lays the proof sheets out nine to an A4 page, with crop marks", () => {
    const doc = sheetsDocument(CARDS);
    expect(doc).toContain("@page{size:210mm 297mm;margin:0;}");
    expect(doc.match(/class="sheet"/g)).toHaveLength(Math.ceil(CARDS.length / 9));
    expect(doc).toContain('class="mark v"');
    expect(doc).toContain('class="mark h"');
  });

  it("escapes card text rather than letting it into the markup", () => {
    const nasty: Card = { ...byId("type-ENTP"), title: '<script>"&' };
    expect(cardHtml(nasty)).toContain("&lt;script&gt;&quot;&amp;");
    expect(cardHtml(nasty)).not.toContain("<script>");
  });
});
