import { catalysts, complements, ease, quadra, relation, stack, type MbtiType, type Quadra } from "../engine/core";
import {
  ARCHETYPE, BEHAVIOURAL, FN_FULL, FN_LONG, FN_SHADOW, GROUP, INTERACTION_STYLE,
  REL_DEF, REL_NAME, REL_SCORE, RECIPROCAL, SLOT_COST, SLOT_EFFECT, SLOT_NAMES, SLOT_TAGS,
  TYPES, VIRTUE_VICE, type Fn, type RelCode, type SlotName,
} from "../engine/data";
import { FN_KEYWORD, FN_KEYWORD_GLOSS, FN_ROLE, FN_SAYS, FN_STARVATION, FN_WANTS } from "../engine/functions";
import { wheelOf, wheels, type Wheel } from "../engine/octagram";
import { SIDE_ORDER, sides, type SideKey } from "../engine/sides";
import { powersOf } from "../engine/powers";

/* ------------------------------------------------------------------ *
 * THE DECK
 *
 * Sixty-six cards, and only two of them are new facts. Everything a card
 * says is read off the engine that already renders /type, /pair and
 * /lexicon — the stacks, the relation codes, the ease ramp, the Octagram
 * wheels — so a card cannot disagree with the app it came from. The two
 * authored additions are declared where they sit: SUIT_ABOUT (what each
 * suit is for) and SIDE_COPY (four sentences per side, because the
 * engine's own side copy is written per type and a card is not).
 *
 * Rendering lives in render.ts and art.ts; this module is pure data and
 * is asserted card-by-card in tests/cards.test.ts.
 * ------------------------------------------------------------------ */

export type Suit = "type" | "function" | "attitude" | "quadra" | "side" | "relation" | "wheel" | "front";

/** What the art generator draws behind the text. Every variant is seeded by the card id. */
export type ArtSpec =
  | { kind: "circuit"; fns: Fn[] }
  | { kind: "element"; fn: Fn }
  | { kind: "seat"; depth: number; fn: Fn | null }
  | { kind: "rosette"; fns: Fn[] }
  | { kind: "door"; openness: number; fns: Fn[] }
  | { kind: "channel"; score: number; fns: Fn[] }
  | { kind: "star"; fns: Fn[] }
  | { kind: "mark"; fns: Fn[] };

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
  type: "one (lead, support) pair each.",
  function: "the alphabet — four in front, four behind.",
  attitude: "the eight seats an element can sit in.",
  quadra: "four types who want the same things.",
  side: "a type is the first of the four.",
  relation: "twelve symmetric, four not.",
  wheel: "a dyad, its virtue and its sin.",
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
    blocked: "Insecurity — the Cave is the door, so entry runs through what you dread being bad at.",
    opens: "Low stakes and no audience — play, not performance.",
    produces: "Rest, humour, and the range the ego cannot reach alone.",
  },
  unconscious: {
    lede: "The side you argue from — stimulating, abrasive, never quite yours.",
    blocked: "Worry. The Doubt is the door, and it reads every approach as a test of competence.",
    opens: "A problem the ego has visibly failed at, taken up deliberately rather than in panic.",
    produces: "Correction, and a second opinion you did not have to ask anyone for.",
  },
  superego: {
    lede: "The parasite persona. Your worst element leads it, which is why it reads as someone else.",
    blocked: "Fear — the one door worth leaving shut.",
    opens: "Threat. It opens by itself, under pressure, and never usefully.",
    produces: "Damage, and afterwards the sense that someone else was driving.",
  },
};

const SIDE_OPENNESS: Record<SideKey, number> = { ego: 1, subconscious: 0.55, unconscious: 0.25, superego: 0 };

/** The eight slots, in stack order, with the attitude each one carries. */
const slotIndex = (s: SlotName) => SLOT_NAMES.indexOf(s);

/** Which side a numbered ego slot leads, and where the same function sits in the mirrored side. */
function seatPlacement(i: number): string {
  const mirror = i < 4 ? 3 - i : 11 - i;
  const here = i < 4 ? "ego" : "unconscious";
  const there = i < 4 ? "subconscious" : "superego";
  return `Slot ${i + 1} of the ${here}; the ${["Lead", "Support", "Delight", "Cave"][i < 4 ? mirror : mirror - 4]} of the ${there}.`;
}

/**
 * Slots i and i+4 always hold the same element with the attitude flipped —
 * stack() builds the shadow block by applying alpha to the ego block, so this
 * holds for all sixteen types without a table. Asserted in tests/cards.test.ts.
 */
function seatTwin(i: number): string {
  const [a, b] = i < 4 ? [i, i + 4] : [i - 4, i];
  return `Slots ${a + 1} and ${b + 1} always hold one element with its attitude flipped: the ${SLOT_NAMES[a]} facing out is the ${SLOT_NAMES[b]} facing in.`;
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
      lede: `${INTERACTION_STYLE[t]} the room, and is in it for ${b.motivation.toLowerCase()}.`,
      chips: st.map((fn, k) => ({ text: fn, note: SLOT_NAMES[k], fn, dim: k > 3 })),
      blocks: [
        {
          label: "Superpower",
          text: `${superpower.fn} — ${superpower.role.toLowerCase()}, after ${superpower.wants.toLowerCase()}. ${st[1]} aims it before it overreaches.`,
        },
        {
          label: "Kryptonite",
          text: `${kryptonite.fn} from the shadow — ${lower(fit(FN_SHADOW[kryptonite.fn], 78))} Under strain: ${b.stressResponse.toLowerCase()}.`,
        },
        {
          label: "Company",
          text: `Rests with ${join(complements(t))}. Sharpens against ${join(catalysts(t))}.`,
        },
      ],
      footer: `${quadra(t)} · ${GROUP[t]} · ${w.temple} temple · ${virtue} over ${vice}`,
      art: { kind: "circuit", fns: st },
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
        { label: "Claims authority over", text: fit(FN_KEYWORD_GLOSS[fn], 110) },
        { label: "Sounds like", text: FN_SAYS[fn].map((q) => `“${q}”`).join("  ") },
        { label: "Starved", text: fit(FN_STARVATION[fn], 140) },
      ],
      footer: `Leads in ${leads.join(" and ")}`,
      art: { kind: "element", fn },
    };
  });
}

function attitudeCards(): Card[] {
  return SLOT_NAMES.map((slot, i) => ({
    id: `attitude-${slot.replace(/\s+/g, "-").toLowerCase()}`,
    suit: "attitude" as const, suitLabel: "Seat", n: i + 1, of: 8,
    title: SLOT_TAGS[i],
    subtitle: `the ${slot} — slot ${i + 1}`,
    lede: seatPlacement(i),
    chips: [{ text: i < 4 ? "conscious" : "shadow", dim: i >= 4 }, { text: `slot ${i + 1} of 8`, dim: true }],
    blocks: [
      { label: "Aim at it and", text: `You are addressing ${SLOT_EFFECT[slot]}.` },
      { label: "Running it yourself costs", text: sentence(fit(SLOT_COST[slot], 104)) },
      { label: "Its shadow twin", text: seatTwin(i) },
    ],
    footer: `${slot} · ${SLOT_TAGS[i]}`,
    art: { kind: "seat", depth: i, fn: null },
  }));
}

const QUADRA_ORDER: Quadra[] = ["Alpha", "Beta", "Gamma", "Delta"];

function quadraCards(): Card[] {
  return QUADRA_ORDER.map((q, i) => {
    const members = TYPES.filter((t) => quadra(t) === q);
    const ego = [...new Set(members.flatMap((t) => stack(t).slice(0, 4)))];
    const shadow = [...new Set(members.flatMap((t) => stack(t).slice(4)))];
    return {
      id: `quadra-${q.toLowerCase()}`,
      suit: "quadra" as const, suitLabel: "Camp", n: i + 1, of: 4,
      title: q,
      subtitle: ego.join(" · "),
      lede: "Four types built from the same four elements, so they want the same things and miss the same things.",
      chips: ego.map((fn) => ({ text: fn, fn })),
      blocks: [
        { label: "Members", text: members.join(" · ") },
        { label: "Values", text: `${capitalise(join(ego.map((f) => FN_WANTS[f].toLowerCase())))} — in whatever order the stack puts them.` },
        { label: "Undervalues", text: `${capitalise(join(shadow.map((f) => FN_KEYWORD[f].toLowerCase())))} — fluent in the four above, defensive about these four.` },
      ],
      footer: "Inside a camp every pair is Twin, Opposite hand, Cousin or Colleague — never Headwind",
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
      footer: `Stands to the ego as ${REL_NAME[side.relationToEgo]} · slots ${side.slots.map((sl) => slotIndex(sl.egoSlot) + 1).join("·")}`,
      art: { kind: "door", openness: SIDE_OPENNESS[key], fns: side.slots.map((sl) => sl.fn) },
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
      lede: fit(REL_DEF[code], 140),
      // Only the symmetric channels get a chip; on an asymmetric one the same
      // fact is the worked example below, and saying it twice costs a line the
      // longer definitions need.
      chips: symmetric ? [{ text: "reads the same from both chairs" }] : [],
      blocks: [
        {
          label: "Worked example",
          text: symmetric
            ? `ENTP and ${b} each see a ${REL_NAME[code]} in the other. Both directions score ${REL_SCORE[code]}.`
            : `ENTP sees ${b} as ${REL_NAME[code]}, and scores it ${ease(a, b)}. ${b} sees ENTP as ${REL_NAME[RECIPROCAL[code]]}, and scores it ${ease(b, a)}.`,
        },
        {
          label: "Where it sits",
          text: `Rank ${i + 1} of 16 on the ease ramp${i > 0 ? `, under ${REL_NAME[REL_ORDER[i - 1]]}` : ", at the top"}${i < 15 ? ` and over ${REL_NAME[REL_ORDER[i + 1]]}` : " and at the bottom"}.`,
        },
        { label: "Reading it", text: symmetric ? "Symmetric: whatever you feel here, they are feeling too." : "Asymmetric: these are not the same seat, and the quieter chair notices less." },
      ],
      footer: `One of ${symmetric ? "twelve symmetric" : "four asymmetric"} channels · 16 of 256 cells`,
      art: { kind: "channel", score: REL_SCORE[code], fns: [...stack(a).slice(0, 2), ...stack(b).slice(0, 2)] },
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
    footer: "The sin is not always bad, nor the virtue always good — a wheel is a geometry, not a verdict",
    art: { kind: "star", fns: [...stack(w.pair[0]).slice(0, 2), ...stack(w.pair[1]).slice(0, 2)] },
  }));
}

function frontMatter(): Card[] {
  const suits = deckSuits();
  return [
    {
      id: "front-title",
      suit: "front", suitLabel: "Octant", n: 1, of: 2,
      title: "Octant",
      subtitle: "sixty-four cards, derived",
      lede: "Every card here is computed from sixteen (lead, support) pairs and three involutions on eight elements. Nothing is stored; it is worked out.",
      chips: suits.map((s) => ({ text: `${s.count} ${s.label}` })),
      blocks: [
        { label: "How to read it", text: "Start with an Element, find the Seat it sits in, then the Wiring that puts it there. Channels take two people; Wheels are the long arc." },
        { label: "What it is not", text: "Not a test, not a verdict. A wiring is not a ceiling, and every card describes a range rather than a person." },
      ],
      footer: "octant · read the wiring",
      art: { kind: "mark", fns: FN_ORDER },
    },
    {
      id: "front-key",
      suit: "front", suitLabel: "Octant", n: 2, of: 2,
      title: "The seven suits",
      subtitle: "what each one is for",
      dense: true,
      lede: "Colour carries the element: violet intuition, amber sensing, teal thinking, rose feeling. Lighter is outward, deeper inward.",
      chips: [],
      blocks: suits.map((s) => ({ label: `${s.label} — ${s.count}`, text: SUIT_ABOUT[s.suit] })),
      footer: "64 cards in seven suits, plus these two",
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
  const order: Exclude<Suit, "front">[] = ["type", "function", "attitude", "quadra", "side", "relation", "wheel"];
  const built = [...typeCards(), ...functionCards(), ...attitudeCards(), ...quadraCards(), ...sideCards(), ...relationCards(), ...wheelCards()];
  return order.map((suit) => {
    const cards = built.filter((c) => c.suit === suit);
    return { suit, label: `${cards[0].suitLabel}s`, count: cards.length };
  });
}

/** The whole deck, in print order: front matter, then the seven suits. */
export function deck(): Card[] {
  return [
    ...frontMatter(),
    ...typeCards(),
    ...functionCards(),
    ...attitudeCards(),
    ...quadraCards(),
    ...sideCards(),
    ...relationCards(),
    ...wheelCards(),
  ];
}
