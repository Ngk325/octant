import { catalysts, complements, ease, isExtraverted, isObserver, omega, quadra, relation, stack, type MbtiType, type Quadra } from "../engine/core";
import {
  ARCHETYPE, BEHAVIOURAL, FN_FULL, FN_LONG, FN_SHADOW, INTERACTION_STYLE,
  REL_DEF, REL_NAME, REL_SCORE, RECIPROCAL, SLOT_COST, SLOT_EFFECT, SLOT_NAMES, SLOT_TAGS,
  TYPES, VIRTUE_VICE, type Fn, type RelCode, type SlotName,
} from "../engine/data";
import { FN_KEYWORD, FN_KEYWORD_GLOSS, FN_ROLE, FN_SAYS, FN_STARVATION, FN_WANTS } from "../engine/functions";
import { wheelOf, wheels, type Wheel } from "../engine/octagram";
import { SIDE_ORDER, sides, type SideKey } from "../engine/sides";
import { powersOf } from "../engine/powers";
import { correlation } from "../engine/empirical";

/* ------------------------------------------------------------------ *
 * THE DECK
 *
 * Seventy-six cards, and none of them carries a fact the engine does not.
 * Everything a card says is read off the engine that already renders /type,
 * /pair and /lexicon — the stacks, the relation codes, the ease ramp, the
 * Octagram wheels — so a card cannot disagree with the app it came from.
 * The authored additions are declared where they sit: SUIT_ABOUT (what each
 * suit is for), SIDE_COPY and SEAT_SENSE (one plain line per side and per
 * seat, because the engine's own copy there is written per type and a card
 * is not), and REL_TRANSLATE (a vocabulary map, not new claims — the
 * engine's relation copy speaks the app's lexicon and a card has only the
 * deck's own seat names to speak with).
 *
 * Rendering lives in render.ts and art.ts; this module is pure data and
 * is asserted card-by-card in tests/cards.test.ts.
 * ------------------------------------------------------------------ */

export type Suit = "type" | "function" | "attitude" | "quadra" | "side" | "bond" | "relation" | "wheel" | "front";

/** What the art generator draws behind the text. Every variant is seeded by the card id. */
export type ArtSpec =
  | { kind: "circuit"; fns: Fn[]; t: MbtiType }
  | { kind: "element"; fn: Fn }
  | { kind: "decode"; letters: string; fns: Fn[]; seats: string[] }
  | { kind: "seat"; depth: number; fn: Fn | null }
  | { kind: "rosette"; fns: Fn[] }
  | { kind: "door"; index: number; gate: SlotName }
  | { kind: "channel"; score: number; fns: Fn[] }
  | { kind: "star"; fns: Fn[] }
  | { kind: "mark"; fns: Fn[] }
  | { kind: "bond"; fns: Fn[] }
  | { kind: "mesh"; fns: [Fn, Fn, Fn, Fn] };

/** A labelled paragraph on the lower half of a card. */
export interface CardBlock { label: string; text: string }

/** A small coloured tag. `note` turns the row into a labelled strip rather than loose pills. */
export interface Chip { text: string; fn?: Fn; dim?: boolean; note?: string }

export interface Card {
  /** Stable, unique, and the seed for this card's generative art. */
  id: string;
  suit: Suit;
  /** Display name of the suit, as printed in the card's header. */
  suitLabel: string;
  /** Position within the suit, and how many are in it: "3/16". */
  n: number;
  of: number;
  title: string;
  subtitle: string;
  /** One sentence, plain, directly under the title. */
  lede: string;
  chips: Chip[];
  blocks: CardBlock[];
  /** Runs the blocks as an inline list rather than stacked pairs — for card faces that are mostly list. */
  dense?: boolean;
  footer: string;
  art: ArtSpec;
}

/** AUTHORED: what each suit is for, printed on the key card and nowhere else. */
const SUIT_ABOUT: Record<Exclude<Suit, "front">, string> = {
  function: "one mental tool each. Start here.",
  attitude: "what each position does; any tool can sit in any seat.",
  type: "the sixteen orders they come in. Find yours.",
  side: "the four modes one person runs in.",
  quadra: "types who trust the same four tools.",
  bond: "the eight pairings that work, by element.",
  relation: "how two types meet, scored for ease, 0 to 100.",
  wheel: "the long arc — what a pair is for.",
};

/** AUTHORED: per-side copy, because the engine writes its side text per type and a card is not. */
const SIDE_COPY: Record<SideKey, { lede: string; blocked: string; opens: string; produces: string }> = {
  ego: {
    lede: "The you that shows up without being asked — and about a quarter of you.",
    blocked: "Nothing. This door is already open, which is the problem with it.",
    opens: "Default operation. You are here unless something pushed you out.",
    produces: "Competence, reputation, and order imposed on chaos.",
  },
  subconscious: {
    lede: "Runs on the element you are most afraid of, and rests you when it does.",
    blocked: "Insecurity — the Cave is the door, so entry runs through what you are afraid of being bad at.",
    opens: "Low stakes and no audience — play, not performance.",
    produces: "Rest, humour, and the range the ego cannot reach alone.",
  },
  unconscious: {
    lede: "The side you argue from — stimulating, abrasive, never quite yours.",
    blocked: "Worry. The Doubt is the door, and it reads every approach as a test of competence.",
    opens: "A problem the ego has visibly failed at, taken up deliberately rather than in panic.",
    produces: "Correction, and a second opinion you did not have to ask anyone for.",
  },
  // Two faces, not one. The first printing was valley-only ("never usefully"),
  // which contradicted the engine's own superego copy — sides.ts calls it "the
  // one side actually built for real power, earned last", destructive by
  // default and convertible once the other three sides are grown. The
  // published eight-slot literature the app draws on says the same of this
  // slot's archetype: destructive undeveloped, generative integrated.
  // Seized in the valleys; entered at the peaks.
  superego: {
    lede: "Led by your worst tool, it reads as someone else: parasite in valleys, power at peaks.",
    blocked: "Fear — rightly. The door opens two ways.",
    opens: "Seized, by itself, when the other three sides fail — or entered on purpose once they are grown.",
    produces: "Ungoverned, damage and the sense someone else was driving; governed, raw power on purpose.",
  },
};

/**
 * AUTHORED IN FORM ONLY: the engine's relation copy names seats in the app's
 * lexicon vocabulary — "mobilising function" is the Delight, "vulnerable
 * function" the Blind spot, "base/creative channel" the Lead/Support axes.
 * The deck teaches none of those words, so its quotes of REL_DEF pass through
 * this map first. Each equivalence is structural and asserted in
 * tests/cards.test.ts, mirroring src/engine/translation.ts for print.
 */
const REL_TRANSLATE: [RegExp, string][] = [
  [/mobilising function/g, "Delight"],
  [/vulnerable function/g, "Blind spot"],
  [/your most defended weakness/g, "your Blind spot"],
  [/Shares the Counterpart base channel but not the creative one/g,
    "Your Leads share an axis, as a Counterpart's do; your Supports do not"],
  [/Shares the Counterpart creative channel only/g, "Only your Supports share an axis"],
  [/Same elements, every position and attitude rearranged/g, "Same four letters, every position and attitude rearranged"],
  [/Same functions, every attitude flipped/g, "Same four letters, every attitude flipped"],
  [/You perceive the same thing and then do different things with it/g,
    "You start from the same tool and do different things with it"],
];

/** Engine relation copy, restated in the vocabulary this deck actually teaches. */
export const deckify = (text: string): string =>
  REL_TRANSLATE.reduce((t, [from, to]) => t.replace(from, to), text);

/** The eight slots, in stack order, with the attitude each one carries. */
const slotIndex = (s: SlotName) => SLOT_NAMES.indexOf(s);

/**
 * AUTHORED: one plain line per seat, for the same reason as SIDE_COPY — the
 * engine's seat copy (SLOT_EFFECT, SLOT_COST) answers "what happens when you
 * aim at it" and "what running it costs", and neither says what the seat IS.
 * The first printing opened every Seat card with its cross-side mapping
 * instead, which leant on four Side names the deck had not defined yet.
 */
const SEAT_SENSE: Record<SlotName, string> = {
  "Lead": "The seat you live from: what sits here runs first, and without being asked.",
  "Support": "The responsible second move — it aims and steadies whatever the Lead starts.",
  "Delight": "The seat that plays. Whatever sits here is light, warm, and easy to reach.",
  "Cave": "The seat you guard. Real ability lives here, but it bruises, so it works in private.",
  "Doubt": "The first shadow seat — the second opinion you argue with instead of trusting.",
  "Scold": "The shadow's critic. A borrowed edge: sharp in bursts, corrosive if lived in.",
  "Blind spot": "The seat you cannot watch. It sounds fluent and is not, and you will not notice.",
  "Dread": "The last seat: it swings without your permission — until, developed last, on purpose.",
};

/** Which side a numbered ego seat belongs to, and where the same tool sits in the mirrored side. */
function seatPlacement(i: number): string {
  const mirror = i < 4 ? 3 - i : 11 - i;
  const here = i < 4 ? "ego" : "unconscious";
  const there = i < 4 ? "subconscious" : "superego";
  return `In the four Sides: seat ${i + 1} of the ${here}, the ${["Lead", "Support", "Delight", "Cave"][i < 4 ? mirror : mirror - 4]} of the ${there}`;
}

/**
 * Slots i and i+4 always hold the same element with the attitude flipped —
 * stack() builds the shadow block by applying alpha to the ego block, so this
 * holds for all sixteen types without a table. Asserted in tests/cards.test.ts.
 */
function seatTwin(i: number): string {
  const [a, b] = i < 4 ? [i, i + 4] : [i - 4, i];
  // No "facing out / facing in" here: which way the pair faces depends on the
  // type (INTP's Lead faces in), and a type-agnostic card may not pick one.
  return `Seats ${a + 1} and ${b + 1} hold the same tool facing opposite ways — the ${SLOT_NAMES[a]} and the ${SLOT_NAMES[b]} are one letter, turned.`;
}

/**
 * As many whole sentences as fit in `max` characters, never a mid-sentence cut.
 * The engine's copy is written for a screen with room to breathe; a card is
 * 63mm wide, so several fields arrive here longer than the safe area allows.
 * Budgets are per suit and tuned against the renderer's own overflow probe
 * (scripts/build-cards.mjs), which fails the build if any card overruns.
 */
export function fit(text: string, max: number): string {
  if (text.length <= max) return text;
  const parts = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  let out = "";
  for (const p of parts) {
    if ((out + p).trim().length > max) break;
    out += p;
  }
  out = out.trim();
  if (out) return out;
  // No whole sentence fits, so keep whole clauses instead. Splitting on the
  // dash, semicolon and comma (separators retained) means the result is always
  // a complete thought rather than a phrase cut off mid-breath.
  const bits = parts[0].split(/(\s+[—–]\s+|;\s+|,\s+)/);
  let head = bits[0];
  for (let i = 1; i < bits.length; i += 2) {
    const next = head + bits[i] + (bits[i + 1] ?? "");
    if (next.length > max) break;
    head = next;
  }
  head = head.trim().replace(/[,;:]$/, "");
  return /[.!?]$/.test(head) ? head : `${head}.`;
}

/** The type whose Wiring one of this type's sides runs, by its relation code. */
const sideType = (t: MbtiType, code: RelCode): MbtiType => TYPES.find((p) => relation(t, p) === code)!;

const join = (xs: string[]) => xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

/* ------------------------------- suits ------------------------------- */

function typeCards(): Card[] {
  return TYPES.map((t, i) => {
    const st = stack(t);
    const b = BEHAVIOURAL[t];
    const { superpower, kryptonite } = powersOf(t);
    const [virtue, vice] = VIRTUE_VICE[t];
    const w = wheelOf(t);
    return {
      id: `type-${t}`,
      suit: "type", suitLabel: "Wiring", n: i + 1, of: TYPES.length,
      title: t,
      subtitle: ARCHETYPE[t].join(" · "),
      lede: `${INTERACTION_STYLE[t]} the room, in it for ${b.motivation.toLowerCase()}.`,
      chips: st.map((fn, k) => ({ text: fn, note: SLOT_NAMES[k], fn, dim: k > 3 })),
      blocks: [
        {
          label: "Superpower",
          text: `${superpower.fn} — ${superpower.role.toLowerCase()}, after ${superpower.wants.toLowerCase()}. ${st[1]} aims it.`,
        },
        {
          label: "Kryptonite",
          text: `${kryptonite.fn} from the shadow — ${lower(fit(FN_SHADOW[kryptonite.fn], 60))}`,
        },
        {
          label: "Company",
          // complements() returns [Counterpart, Spark] in that order — asserted in
          // tests/cards.test.ts, since this line names them positionally.
          text: `Rests with ${complements(t)[0]}, your Counterpart, and ${complements(t)[1]}, your Spark. Sharpens against ${join(catalysts(t))}.`,
        },
        {
          label: "Your four sides — pull those Wirings",
          // The four sides of this type ARE four types: its own (ego), its
          // Counterpart's (subconscious), its Damper's (unconscious) and its
          // Standoff's (superego) — derived from the same involutions as the
          // relation table, asserted in tests/cards.test.ts. This is the line
          // that lets a reader pull the door cards the Side suit points at.
          text: `${t} ego · ${sideType(t, "DU")} subconscious · ${sideType(t, "EX")} unconscious · ${sideType(t, "SE")} superego`,
        },
      ],
      footer: `Camp ${quadra(t)} · ${w.origin} wheel of the ${w.temple} temple · virtue ${virtue}, vice ${vice}`,
      art: { kind: "circuit", fns: st, t },
    };
  });
}

const FN_ORDER: Fn[] = ["Ne", "Ni", "Se", "Si", "Te", "Ti", "Fe", "Fi"];

function functionCards(): Card[] {
  return FN_ORDER.map((fn, i) => {
    const leads = TYPES.filter((t) => stack(t)[0] === fn);
    return {
      id: `function-${fn}`,
      suit: "function", suitLabel: "Element", n: i + 1, of: 8,
      title: fn,
      subtitle: FN_FULL[fn],
      lede: fit(FN_LONG[fn], 142),
      chips: [{ text: FN_ROLE[fn], fn }, { text: `wants ${FN_WANTS[fn]}`, fn }, { text: FN_KEYWORD[fn], fn, dim: true }],
      blocks: [
        { label: `Claims ${FN_KEYWORD[fn]}`, text: fit(FN_KEYWORD_GLOSS[fn], 110) },
        { label: "Sounds like", text: FN_SAYS[fn].map((q) => `“${q}”`).join("  ") },
        { label: "Starved", text: fit(FN_STARVATION[fn], 140) },
      ],
      footer: `Leads in ${leads.join(" and ")}`,
      art: { kind: "element", fn },
    };
  });
}

/**
 * A Seat card is titled by the seat's NAME — Lead, Support, Delight, Cave and
 * their shadow four — the same names the Wiring strip prints, so the two suits
 * index each other. The attitude a seat carries (Power, Responsibility, ...)
 * rides in the subtitle and the first chip; and on the two seats the Wirings
 * single out, the card says so in the lede: the Lead's Power is the
 * Superpower, and the Dread's Hate is the Kryptonite.
 */
function attitudeCards(): Card[] {
  return SLOT_NAMES.map((slot, i) => ({
    id: `attitude-${slot.replace(/\s+/g, "-").toLowerCase()}`,
    suit: "attitude" as const, suitLabel: "Seat", n: i + 1, of: 8,
    title: slot,
    // "Blindspot" is the engine's tag key; print gives it the title's spacing.
    subtitle: `seat ${i + 1} of 8 — carries ${SLOT_TAGS[i].replace("Blindspot", "Blind spot")}`,
    lede: `${SEAT_SENSE[slot]}${
      i === 0 ? " Its Power is the Superpower the Wirings print."
      : i === 7 ? " Its Hate is the Wirings' Kryptonite."
      : " Any tool can sit here; your wiring says which."}`,
    chips: [{ text: i < 4 ? "conscious" : "shadow", dim: i >= 4 }],
    blocks: [
      { label: "Aim here and you address", text: sentence(SLOT_EFFECT[slot]) },
      { label: "Running it yourself costs", text: sentence(fit(SLOT_COST[slot], 88)) },
      { label: "Its shadow twin", text: seatTwin(i) },
    ],
    footer: seatPlacement(i),
    art: { kind: "seat", depth: i, fn: null },
  }));
}

const QUADRA_ORDER: Quadra[] = ["Alpha", "Beta", "Gamma", "Delta"];

function quadraCards(): Card[] {
  return QUADRA_ORDER.map((q, i) => {
    const members = TYPES.filter((t) => quadra(t) === q);
    const ego = [...new Set(members.flatMap((t) => stack(t).slice(0, 4)))];
    const shadow = [...new Set(members.flatMap((t) => stack(t).slice(4)))];
    // Derived, because the first printing of this footer was wrong: it claimed
    // in-camp pairs were Twin, Opposite hand, Cousin or Colleague, and Cousin
    // and Colleague are in fact cross-camp relations. Read it off the engine.
    const inCamp = [...new Set(members.flatMap((x) => members.filter((y) => y !== x).map((y) => relation(x, y))))]
      .sort((x, y) => REL_SCORE[y] - REL_SCORE[x]);
    const floor = Math.min(...inCamp.map((c) => REL_SCORE[c]));
    return {
      id: `quadra-${q.toLowerCase()}`,
      suit: "quadra" as const, suitLabel: "Camp", n: i + 1, of: 4,
      title: q,
      subtitle: ego.join(" · "),
      lede: "Four types built from the same four elements, so they want the same things and miss the same things.",
      chips: ego.map((fn) => ({ text: fn, fn })),
      blocks: [
        { label: "Members", text: members.join(" · ") },
        { label: "Values", text: `${capitalise(join(ego.map((f) => `${FN_WANTS[f].toLowerCase()} (${f})`)))} — in whatever order the wiring seats them.` },
        { label: "Undervalues", text: `${capitalise(join(shadow.map((f) => `${FN_KEYWORD[f].toLowerCase()} (${f})`)))} — fluent in the four above, defensive about these four.` },
      ],
      footer: `In-camp pairs are only ${join(inCamp.map((c) => REL_NAME[c]))} — the floor is ease ${floor}`,
      art: { kind: "rosette", fns: ego },
    };
  });
}

function sideCards(): Card[] {
  const s = sides("ENTP");
  return SIDE_ORDER.map((key, i) => {
    const side = s[key];
    const copy = SIDE_COPY[key];
    return {
      id: `side-${key}`,
      suit: "side" as const, suitLabel: "Side", n: i + 1, of: 4,
      title: side.name,
      subtitle: `gateway: the ${side.gateway.egoSlot}`,
      lede: copy.lede,
      chips: side.slots.map((sl) => ({
        text: sl.role === sl.egoSlot ? sl.role : `${sl.role} = your ${sl.egoSlot}`,
        dim: i > 0,
      })),
      blocks: [
        { label: "Blocked by", text: copy.blocked },
        { label: "Opens with", text: copy.opens },
        { label: "Produces", text: copy.produces },
      ],
      // The pull rule: each side runs the Wiring of a type the reader can find.
      // The ego is the Twin (your own card); the others are named, per type, in
      // the Wiring suit's "Your four sides" block — so the loop closes both ways.
      footer: `This side runs your ${REL_NAME[side.relationToEgo]}'s Wiring — pull that card · your seats ${side.slots.map((sl) => slotIndex(sl.egoSlot) + 1).join("·")}`,
      art: { kind: "door", index: i, gate: side.gateway.egoSlot },
    };
  });
}

/* ------------------------------- bonds ------------------------------- */

/**
 * BONDS — the high-compatibility pairings, stated by element rather than by type.
 *
 * Every other pair surface in this app names four-letter types. That is the
 * wrong altitude for the question "who works well with whom", because the
 * answer is not about types at all: it is about which element answers which.
 * The suit has two halves of four:
 *
 *   AXIS bonds — Lead meets Lead across `omega`, the axis opposite. The
 *   strongest signal in the model: bondFacts() sweeps all 240 ordered
 *   cross-type pairs, groups them by (lead, lead), and finds the four axis
 *   pairings averaging 93 of 100 — against 64 for same-lead, 54 for
 *   attitude-flip, 40 for element-swap — producing only Counterpart and
 *   Near fit.
 *
 *   SPARK bonds — Lead meets Support, crosswise, on both axes at once. Each
 *   camp's two axes admit exactly one mesh, realised twice (once outward,
 *   once inward). sparkFacts() verifies the whole structure by sweep: both
 *   crossings holding is exactly the Spark relation (92 in both directions),
 *   and one crossing alone is exactly Upstream (54) or Downstream (48).
 *
 * Nothing here is asserted — every number a Bond card prints is recomputed
 * from the engine, and tests/cards.test.ts fails if they ever disagree.
 */
export interface BondFacts {
  a: Fn;
  b: Fn;
  /** Mean ease across every ordered pair of types whose Leads are these two. */
  mean: number;
  /** The relations these two Leads actually produce, best first. */
  rels: RelCode[];
  /** How far above the next-best class of lead pairing this one sits. */
  overNext: number;
}

/** The four axis pairings, with their ease read off the engine. */
export function bondFacts(): BondFacts[] {
  const cell = new Map<string, number[]>();
  for (const a of TYPES) {
    for (const b of TYPES) {
      if (a === b) continue;
      const k = `${stack(a)[0]}|${stack(b)[0]}`;
      (cell.get(k) ?? cell.set(k, []).get(k)!).push(ease(a, b));
    }
  }
  const meanOf = (k: string) => {
    const xs = cell.get(k)!;
    return xs.reduce((s, x) => s + x, 0) / xs.length;
  };
  // The best pairing class that is NOT the axis opposite, so a card can say how
  // much daylight there is rather than just claiming the top spot.
  const next = Math.max(
    ...[...cell.keys()].filter((k) => {
      const [f, g] = k.split("|") as [Fn, Fn];
      return omega[f] !== g;
    }).map(meanOf),
  );

  const done = new Set<Fn>();
  const out: BondFacts[] = [];
  for (const a of FN_ORDER) {
    const b = omega[a];
    if (done.has(a)) continue;
    done.add(a).add(b);
    const rels = [...new Set(
      TYPES.flatMap((x) => TYPES.filter((y) => x !== y && stack(x)[0] === a && stack(y)[0] === b).map((y) => relation(x, y))),
    )].sort((p, q) => REL_SCORE[q] - REL_SCORE[p]);
    out.push({ a, b, mean: meanOf(`${a}|${b}`), rels, overNext: meanOf(`${a}|${b}`) - next });
  }
  return out;
}

function bondCards(): Card[] {
  const facts = bondFacts();
  const of = facts.length + sparkFacts().length;
  const axis = facts.map((f, i) => {
    const { a, b } = f;
    return {
      id: `bond-${a}-${b}`,
      suit: "bond" as const, suitLabel: "Bond", n: i + 1, of,
      title: `${a} · ${b}`,
      subtitle: `one axis: ${FN_FULL[a]} and ${FN_FULL[b]}`,
      lede: `Each of these two is exactly what the other does not do, so the pair covers ground neither reaches alone. The strongest kind of pairing there is.`,
      // (The Spark bonds, next, run the same two axes crosswise for 92.)
      // Two chips, not three: the ease number is already in the footer, and a
      // third pill tipped the longest pairings onto a second chip row, which the
      // print probe measured as an overrun on Te·Fi and Ni·Se.
      chips: [
        { text: FN_WANTS[a], note: `${a} wants`, fn: a },
        { text: FN_WANTS[b], note: `${b} wants`, fn: b },
      ],
      blocks: [
        { label: `${a} brings`, text: sentence(fit(FN_KEYWORD_GLOSS[a], 44)) },
        { label: `${b} brings`, text: sentence(fit(FN_KEYWORD_GLOSS[b], 44)) },
        {
          label: "Why it works",
          text: `Whoever leads ${a} carries ${b} in the Cave — the seat they fear being bad at — and the reverse. Each raises what the other skipped.`,
        },
      ],
      footer: `Leads meet only as ${join(f.rels.map((c) => REL_NAME[c]))} · mean ease ${Math.round(f.mean)}, ${Math.round(f.overNext)} above every other Lead pairing`,
      art: { kind: "bond", fns: [a, b] } as ArtSpec,
    };
  });
  return [...axis, ...sparkCards(facts.length, of)];
}

/** One camp's crosswise mesh: its two axes, and the two type pairs that realise it. */
export interface SparkFacts {
  quadra: Quadra;
  /** The camp's observer axis and decider axis, outward pole first. */
  obs: [Fn, Fn];
  dec: [Fn, Fn];
  /** The two realisations, [a, b] with a leading the observer axis's pole. */
  outward: [MbtiType, MbtiType];
  inward: [MbtiType, MbtiType];
  /** Ease of every realised pair, both directions — asserted identical. */
  ease: number;
}

/**
 * The four crosswise meshes, one per camp, read off the engine. A mesh holds
 * when each Lead is answered by the other's SUPPORT rather than their Lead:
 * within a camp that picks out the two same-attitude pairs, and the sweep in
 * tests/cards.test.ts confirms the general fact this suit prints — both
 * crossings at once is exactly Spark, one alone is Upstream or Downstream.
 */
export function sparkFacts(): SparkFacts[] {
  return QUADRA_ORDER.map((q) => {
    const members = TYPES.filter((t) => quadra(t) === q);
    const pairs: [MbtiType, MbtiType][] = [];
    for (const x of members) {
      for (const y of members) {
        if (x < y && relation(x, y) === "AC") pairs.push([x, y]);
      }
    }
    const shared = [...new Set(members.flatMap((t) => stack(t).slice(0, 2)))];
    const obs = shared.filter(isObserver).sort((x) => (isExtraverted(x) ? -1 : 1)) as [Fn, Fn];
    const dec = shared.filter((f) => !isObserver(f)).sort((x) => (isExtraverted(x) ? -1 : 1)) as [Fn, Fn];
    /** The pair whose leads face the given way, observer-lead first. */
    const facing = (outward: boolean) => {
      const p = pairs.find(([x]) => isExtraverted(stack(x)[0]) === outward)!;
      return (isObserver(stack(p[0])[0]) ? p : [p[1], p[0]]) as [MbtiType, MbtiType];
    };
    const outward = facing(true);
    const inward = facing(false);
    const scores = new Set([outward, inward].flatMap(([x, y]) => [ease(x, y), ease(y, x)]));
    if (scores.size !== 1) throw new Error(`spark ease is not uniform in ${q}`);
    return { quadra: q, obs, dec, outward, inward, ease: [...scores][0] };
  });
}

function sparkCards(offset: number, of: number): Card[] {
  return sparkFacts().map((f, i) => {
    const [o1, o2] = f.obs;
    const [d1, d2] = f.dec;
    return {
      id: `bond-spark-${f.quadra.toLowerCase()}`,
      suit: "bond" as const, suitLabel: "Bond", n: offset + i + 1, of,
      title: `${o1} · ${o2} × ${d1} · ${d2}`,
      subtitle: `the ${f.quadra} camp's two axes, meshed crosswise`,
      lede: "Lead does not meet Lead here: each Lead is answered by the other's Support.",
      chips: [
        { text: `outward: ${stack(f.outward[0])[0]} with ${stack(f.outward[1])[0]}` },
        { text: `inward: ${stack(f.inward[0])[0]} with ${stack(f.inward[1])[0]}`, dim: true },
      ],
      blocks: [
        {
          label: "The mesh",
          text: "Each Lead is answered by the Support standing behind the other's Lead — both crossings at once.",
        },
        {
          label: "Half a mesh tilts",
          text: `One crossing alone tilts the pair — ${REL_NAME.BR} ${REL_SCORE.BR}, ${REL_NAME.BE} ${REL_SCORE.BE}. Both at once is ${REL_NAME.AC}.`,
        },
        {
          label: "Against the axis bond",
          text: `A Counterpart rests; a Spark runs — each feeds the other's Delight, and it tires if never stepped out of.`,
        },
      ],
      footer: `Ease ${f.ease} both ways · the only relation where both crossings hold · ${f.outward.join(" · ")}, ${f.inward.join(" · ")}`,
      art: { kind: "mesh", fns: [stack(f.outward[0])[0], stack(f.outward[0])[1], stack(f.outward[1])[0], stack(f.outward[1])[1]] },
    };
  });
}

/** Relations, richest first, so the deck reads from Counterpart down to Headwind. */
const REL_ORDER = (Object.keys(REL_SCORE) as RelCode[]).sort((a, b) => REL_SCORE[b] - REL_SCORE[a]);

function relationCards(): Card[] {
  return REL_ORDER.map((code, i) => {
    const a: MbtiType = "ENTP";
    const b = TYPES.find((t) => relation(a, t) === code)!;
    const symmetric = RECIPROCAL[code] === code;
    return {
      id: `relation-${code}`,
      suit: "relation" as const, suitLabel: "Channel", n: i + 1, of: 16,
      title: REL_NAME[code],
      subtitle: `${code} · ease ${REL_SCORE[code]}`,
      lede: fit(deckify(REL_DEF[code]), 140),
      // Only the symmetric channels get a chip; on an asymmetric one the same
      // fact is the worked example below, and saying it twice costs a line the
      // longer definitions need.
      chips: symmetric ? [{ text: "reads the same from both chairs" }] : [],
      blocks: [
        {
          label: "Worked example",
          text: symmetric
            ? `ENTP and ${b} each see ${/^[AEIOU]/.test(REL_NAME[code]) ? "an" : "a"} ${REL_NAME[code]} in the other. Both directions score ${REL_SCORE[code]}.`
            : `ENTP sees ${b} as ${REL_NAME[code]}, and scores it ${ease(a, b)}. ${b} sees ENTP as ${REL_NAME[RECIPROCAL[code]]}, and scores it ${ease(b, a)}.`,
        },
        {
          label: "Where it sits",
          text: `Rank ${i + 1} of 16 on the ease ramp${i > 0 ? `, under ${REL_NAME[REL_ORDER[i - 1]]}` : ", at the top"}${i < 15 ? ` and over ${REL_NAME[REL_ORDER[i + 1]]}` : " and at the bottom"}.`,
        },
        { label: "Reading it", text: symmetric ? "Symmetric: whatever you feel here, they are feeling too." : "Asymmetric: these are not the same chair, and the quieter chair notices less." },
      ],
      footer: `One of ${symmetric ? "twelve symmetric" : "four asymmetric"} channels · 16 of 256 cells`,
      art: { kind: "channel", score: REL_SCORE[code], fns: [stack(a)[0], stack(b)[0]] },
    };
  });
}

function wheelCards(): Card[] {
  return wheels().map((w: Wheel, i) => ({
    id: `wheel-${w.pair[0]}`,
    suit: "wheel" as const, suitLabel: "Wheel", n: i + 1, of: 8,
    title: w.origin,
    subtitle: `${w.pair.join(" · ")} — the ${w.temple} temple`,
    lede: fit(w.originPlain, 112),
    chips: [{ text: `Virtue: ${w.livingVirtue}` }, { text: `Sin: ${w.deadlySin}`, dim: true }],
    blocks: [
      { label: `Living virtue — ${w.livingVirtue}`, text: fit(w.virtuePlain, 88) },
      { label: `Deadly sin — ${w.deadlySin}`, text: fit(w.sinPlain, 88) },
      { label: `Poles — ${w.shadowPole} / ${w.aspirationalPole}`, text: `${fit(w.shadowPlain, 70)} Against: ${lower(fit(w.aspirationalPlain, 64))}` },
    ],
    footer: "The sin is not always bad, nor the virtue always good — both are positions on the same wheel",
    art: { kind: "star", fns: [...stack(w.pair[0]).slice(0, 2), ...stack(w.pair[1]).slice(0, 2)] },
  }));
}

/**
 * The four cards someone opening the box reads first, in this order:
 * what this is, the alphabet it is written in, how four letters pick a
 * stack, and how to read one card.
 *
 * The first build opened with "computed from sixteen (lead, support) pairs and
 * three involutions on eight elements" — true, and useless to anyone who has
 * not already read the app. A deck has to teach its own vocabulary from a
 * standing start, so nothing on these cards uses a term the cards
 * themselves have not defined. The decoder is the third, not the last,
 * because it answers the first question anyone arriving with "I'm an INTJ"
 * actually has — how those letters become the row every Wiring card draws.
 */
function frontMatter(): Card[] {
  const suits = deckSuits();
  const total = suits.reduce((s, x) => s + x.count, 0);
  // The decoder's worked example. INTJ, because it exercises the harder
  // (introvert) branch of the derivation; every value below is read off
  // stack(), so the card cannot disagree with the engine.
  const ex: MbtiType = "INTJ";
  const ext = stack(ex);
  return [
    {
      id: "front-title",
      suit: "front", suitLabel: "Start here", n: 1, of: 4,
      title: "Octant",
      subtitle: "how a person is wired, in eight parts",
      lede: "Everyone runs the same eight mental tools. What differs is the order you trust them in — and that order is what this deck lays out.",
      chips: [],
      blocks: [
        {
          label: "The eight tools",
          text: "Four take the world in — Ne, Ni, Se, Si. Four decide about it — Te, Ti, Fe, Fi. The next card names them.",
        },
        {
          label: "The eight seats",
          text: "The seats are fixed, 1 through 8: the first four you use knowingly, the last four run in the background. Which tool takes which seat is your type — one of sixteen.",
        },
        {
          label: "Where to start",
          text: "Elements first, then your own Wiring and its four Sides. Bonds and Channels take two people; Wheels are the long arc.",
        },
      ],
      footer: `${total} cards · octant · read the wiring`,
      art: { kind: "mark", fns: FN_ORDER },
    },
    {
      id: "front-elements",
      suit: "front", suitLabel: "Start here", n: 2, of: 4,
      title: "The eight elements",
      subtitle: "the alphabet every other card is spelled in",
      dense: true,
      lede: "Capital letter names the family — N intuition, S sensing, T thinking, F feeling. Small letter is its attitude, the way it faces: e outward, i inward.",
      chips: [],
      blocks: FN_ORDER.map((fn) => ({ label: fn, text: `${FN_ROLE[fn].toLowerCase()} — wants ${FN_WANTS[fn].toLowerCase()}.` })),
      footer: "Hues: violet N, amber S, teal T, rose F · filled conscious, hollow shadow · ripple e out, i in",
      art: { kind: "mark", fns: FN_ORDER },
    },
    {
      id: "front-decode",
      suit: "front", suitLabel: "Start here", n: 3, of: 4,
      title: "The four letters",
      subtitle: "how a code like INTJ picks the seats",
      dense: true,
      lede: "Two of the four letters point at your strongest tool, and the rest of the stack follows. Worked here for INTJ — trace your own the same way.",
      chips: [],
      blocks: [
        { label: "I or E", text: `which way the strongest tool faces. ${ex} starts with I: inward.` },
        { label: "J or P", text: "the tool shown to the world — deciding for J, perceiving for P. Extraverts show their strongest; introverts their second." },
        { label: "The middle two", text: `the two tools in play. ${ex} shows its decider, so the perceiver leads: ${ext[0]} first, ${ext[1]} second, facing out.` },
        { label: "The mirror", text: `the next two seats oppose the first two — ${ext[2]} against ${ext[1]}, ${ext[3]} against ${ext[0]}. Seats 5–8 are these four, turned.` },
      ],
      footer: `Worked: ${ex} → ${ext.slice(0, 4).map((fn, k) => `${fn} ${SLOT_NAMES[k]}`).join(", ")} · every Wiring card prints all eight`,
      art: { kind: "decode", letters: ex, fns: ext.slice(0, 4), seats: [...SLOT_NAMES.slice(0, 4)] },
    },
    {
      id: "front-key",
      suit: "front", suitLabel: "Start here", n: 4, of: 4,
      title: "How to read a card",
      subtitle: `${total} cards, ${suits.length} suits`,
      dense: true,
      lede: "Every card draws its fact, names each element it draws, then says it plainly before the detail.",
      chips: [],
      blocks: suits.map((s) => ({ label: `${s.label} — ${s.count}`, text: SUIT_ABOUT[s.suit] })),
      footer: `The ease ramp is the model's own; a survey disagrees (r = ${correlation(TYPES).toFixed(2)}) — the app shows both`,
      art: { kind: "mark", fns: FN_ORDER },
    },
  ];
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** A fragment from one of the engine's tables, promoted to a sentence of its own. */
const sentence = (s: string) => {
  const t = capitalise(s.trim());
  return /[.!?”)]$/.test(t) ? t : `${t}.`;
};
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** The seven playing suits, in deck order, with their sizes — derived from the deck itself. */
export function deckSuits(): { suit: Exclude<Suit, "front">; label: string; count: number }[] {
  const order: Exclude<Suit, "front">[] = ["function", "attitude", "type", "side", "quadra", "bond", "relation", "wheel"];
  const built = [...typeCards(), ...functionCards(), ...attitudeCards(), ...quadraCards(), ...sideCards(), ...bondCards(), ...relationCards(), ...wheelCards()];
  return order.map((suit) => {
    const cards = built.filter((c) => c.suit === suit);
    return { suit, label: `${cards[0].suitLabel}s`, count: cards.length };
  });
}

/** The whole deck, in print order: front matter, then the seven suits. */
export function deck(): Card[] {
  return [
    ...frontMatter(),
    ...functionCards(),
    ...attitudeCards(),
    ...typeCards(),
    ...sideCards(),
    ...quadraCards(),
    ...bondCards(),
    ...relationCards(),
    ...wheelCards(),
  ];
}
