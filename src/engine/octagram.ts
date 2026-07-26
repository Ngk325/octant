import { fourSides } from "./sides";
import { TYPES, type MbtiType } from "./data";

/* ------------------------------------------------------------------ *
 * THE OCTAGRAM
 *
 * CS Joseph's advanced layer, and the hardest material in this app. The
 * guiding rule for this module is the same one the rest of the engine
 * follows: SAY WHAT IS DERIVED AND SAY WHAT IS SOURCED, and never blur
 * the two.
 *
 * ── What is DERIVED (computed here, asserted in tests/octagram.test.ts)
 *
 *   1. A DYAD is a type together with its subconscious. The subconscious
 *      is the ego's Dual, so a dyad is exactly a Dual pair. Sixteen types
 *      make eight dyads — the "eight temple wheels".
 *   2. A TEMPLE is two dyads. Equivalently it is one orbit of the
 *      four-sides operation: {ego, subconscious, unconscious, superego}.
 *      That operation partitions the sixteen into exactly four closed
 *      classes of four, and those classes ARE the four temples.
 *   3. So temple and dyad membership need no lookup table anywhere.
 *
 *   This is not a coincidence the app is claiming — it is checkable, and
 *   it checks out. Published membership for all eight dyads and all four
 *   temples matches what fourSides() computes, 16/16, with no table.
 *
 * ── What is SOURCED (authored below, attributed, confidence noted)
 *
 *   The names: four temples, eight cognitive origins, and each wheel's
 *   Living Virtue, Deadly Sin and two poles.
 *
 *   Confidence is high on origins, virtues and sins. Two independent CS
 *   Joseph pages agree on the full set, and there is a strong internal
 *   check: the eight Deadly Sins are exactly the classical eight of the
 *   Evagrian/Cassian tradition (wrath, lust, envy, vainglory, sloth,
 *   pride, gluttony, greed), each paired with its traditional contrary
 *   virtue. A mis-transcribed table would not land on that by accident.
 *
 *   Confidence is LOWER on which pole is the shadow and which the
 *   aspirational. One published summary transposes the two columns
 *   relative to the others. The orientation used here — shadow = where
 *   the unconscious-developed sit, aspirational = where the
 *   subconscious-developed sit — is the one given explicitly in the
 *   dedicated ESTP/INFJ episode and on the temple-wheels page. It is
 *   cross-checked on two wheels of eight, and that limit is recorded in
 *   UNSETTLED rather than glossed over.
 *
 * Sources: csjoseph.life — "The 8 Temple Wheels of the Octagram",
 * "EgoHacking Via Cognitive Origins and the Golden Rule", "INFJ & ESTP
 * Octagram Development (Objectification vs Idolatry)", "The Four Themes
 * of the Octagram", "How ENTJ & ISFP Find Their Cognitive Origin of
 * Purpose". All prose below is written for this app.
 * ------------------------------------------------------------------ */

export type TempleName = "Soul" | "Mind" | "Heart" | "Body";

export interface Temple {
  name: TempleName;
  /** What this temple is about. */
  about: string;
  /** Plain-language version. */
  plain: string;
  /** The four types in it — derived, not listed. */
  types: MbtiType[];
}

export interface Wheel {
  /** The two types: a type and its subconscious, i.e. a Dual pair. Derived. */
  pair: [MbtiType, MbtiType];
  temple: TempleName;
  /** What this dyad is chasing its whole life. */
  origin: string;
  /** Plain-language gloss of the origin. */
  originPlain: string;
  /** What the wheel claims to be — the top of the wheel. */
  livingVirtue: string;
  virtuePlain: string;
  /** The superego's counterfeit of it — the bottom of the wheel. */
  deadlySin: string;
  sinPlain: string;
  /** The side an unconscious-developed person drifts toward. */
  shadowPole: string;
  shadowPlain: string;
  /** The side a subconscious-developed person drifts toward. */
  aspirationalPole: string;
  aspirationalPlain: string;
}

/* --------------------------- authored names --------------------------- */
/* Keyed by the extraverted member of each pair; the partner is DERIVED via
   fourSides(). Nothing here lists who is in a dyad or a temple. */

interface WheelSource extends Omit<Wheel, "pair"> {
  lead: MbtiType;
}

const WHEELS: WheelSource[] = [
  {
    lead: "ENFP", temple: "Soul", origin: "Justification",
    originPlain:
      "To be shown to have been right. Not praised — vindicated. That what you did was warranted, and that somebody can see it was.",
    livingVirtue: "Absolution",
    virtuePlain: "Letting the debt go. Deciding that what was done does not have to be paid for any further, by them or by you.",
    deadlySin: "Wrath",
    sinPlain: "Collecting the debt yourself. Justification turns into a sentence you carry out, and being right becomes a licence.",
    shadowPole: "Discrimination",
    shadowPlain: "Deciding in advance who is entitled to a fair hearing. The judgement arrives before the evidence does.",
    aspirationalPole: "Impartiality",
    aspirationalPlain: "Weighing it without a thumb on the scale — including when the answer costs you something.",
  },
  {
    lead: "ESTP", temple: "Soul", origin: "Intimacy",
    originPlain:
      "To be genuinely known and genuinely close — the real thing, not proximity and not performance.",
    livingVirtue: "Chastity",
    virtuePlain: "Not spending closeness cheaply. Keeping it for where it means something, so that it can still mean something.",
    deadlySin: "Lust",
    sinPlain: "Taking the sensation and skipping the person. It looks like the origin being fed and is exactly what starves it.",
    shadowPole: "Idolatry",
    shadowPlain: "Putting someone on a pedestal until you are in service to them. If you were not given closeness, worship is a way to earn it.",
    aspirationalPole: "Objectification",
    aspirationalPlain: "Treating people — and yourself — as things that perform. If you were rewarded for output, this is what closeness got traded for.",
  },
  {
    lead: "ENTP", temple: "Heart", origin: "Satisfaction",
    originPlain:
      "For it to be enough. For the itch to actually get scratched rather than moved somewhere else.",
    livingVirtue: "Compassion",
    virtuePlain: "Wanting other people to get theirs too. The surprising exit from a hunger that never fills: feeding somebody else's.",
    deadlySin: "Envy",
    sinPlain: "Measuring your portion against theirs. Nothing you have is enough while somebody else has more of it.",
    shadowPole: "Malevolence",
    shadowPlain: "Levelling down. If satisfaction is not available to you, making sure it is not available to them either.",
    aspirationalPole: "Fanaticism",
    aspirationalPlain: "Pouring everything into one thing and calling that contentment. Intensity standing in for enough.",
  },
  {
    lead: "ESFP", temple: "Heart", origin: "Reverence",
    originPlain:
      "To be held in real regard — respected for what you actually are, not flattered and not tolerated.",
    livingVirtue: "Modesty",
    virtuePlain: "Letting the regard be given rather than extracted. Reverence you asked for is not reverence.",
    deadlySin: "Vainglory",
    sinPlain: "Manufacturing it. Display, credentials, volume — the show of being worth regard, in place of it.",
    shadowPole: "Desecration",
    shadowPlain: "Tearing down what is revered. If regard was never given to you, proving nothing deserves it is a kind of relief.",
    aspirationalPole: "Egotism",
    aspirationalPlain: "Becoming the thing revered. If regard came easily, being its object starts to feel like the point.",
  },
  {
    lead: "ESTJ", temple: "Mind", origin: "Authority",
    originPlain:
      "For your call to be the one that counts. Not to boss people — to be genuinely in a position to decide.",
    livingVirtue: "Initiative",
    virtuePlain: "Taking the decision when it is yours to take, including when it would be easier to wait to be told.",
    deadlySin: "Sloth",
    sinPlain: "Letting it fall to somebody else, then resenting the result. Authority declined is still authority spent.",
    shadowPole: "Manifestation",
    shadowPlain: "Forcing it into being by will. If nobody handed you authority, you build it, and cannot stop building it.",
    aspirationalPole: "Credulity",
    aspirationalPlain: "Deferring to whoever holds it. If authority treated you well, trusting it feels like wisdom rather than a habit.",
  },
  {
    lead: "ENFJ", temple: "Mind", origin: "Validation",
    originPlain:
      "To be told you read it right. Confirmation from outside that your judgement is sound.",
    livingVirtue: "Humility",
    virtuePlain: "Being able to be wrong out loud. The only route to validation that is actually worth having.",
    deadlySin: "Pride",
    sinPlain: "Needing to have been right more than needing to be right. Validation defended instead of earned.",
    shadowPole: "Accommodation",
    shadowPlain: "Agreeing your way to it. If validation was scarce, becoming agreeable is the cheapest way to get some.",
    aspirationalPole: "Obstinance",
    aspirationalPlain: "Refusing to move. If validation came easily, holding the line starts to feel like integrity.",
  },
  {
    lead: "ESFJ", temple: "Body", origin: "Discovery",
    originPlain:
      "To be on the edge of something new — and to get to feel that edge again, not just remember it.",
    livingVirtue: "Generativity",
    virtuePlain: "Making the new thing rather than consuming it. Discovery that leaves something behind.",
    deadlySin: "Gluttony",
    sinPlain: "Consuming novelty instead of finding it. More input, faster, and less and less of it lands.",
    shadowPole: "Hedonism",
    shadowPlain: "Chasing the sensation of the new for its own sake, because the discovery itself was never available.",
    aspirationalPole: "Servility",
    aspirationalPlain: "Discovering on someone else's behalf. Useful, in demand, and never the one who gets to go first.",
  },
  {
    lead: "ENTJ", temple: "Body", origin: "Purpose",
    originPlain:
      "For it to be for something. A specific, visible achievement that you and other people both count as one.",
    livingVirtue: "Generosity",
    virtuePlain: "Spending what you built on something other than yourself. What makes a purpose outlast the person holding it.",
    deadlySin: "Greed",
    sinPlain: "Accumulating instead of accomplishing. The score keeps going up and nothing is finished.",
    shadowPole: "Subjugation",
    shadowPlain: "Bending people and circumstances to the goal. If purpose had to be seized, everything becomes material for it.",
    aspirationalPole: "Complacency",
    aspirationalPlain: "Coasting on a purpose already achieved. If it came, the danger is deciding it has arrived for good.",
  },
];

const TEMPLE_ABOUT: Record<TempleName, { about: string; plain: string }> = {
  Soul: {
    about: "Identity and character — who somebody actually is.",
    plain: "About being someone. What you are, underneath what you do.",
  },
  Mind: {
    about: "Knowledge and judgement — understanding, and being right about it.",
    plain: "About working things out, and about your read on things counting for something.",
  },
  Heart: {
    about: "Desire and regard — wanting, and being wanted well.",
    plain: "About caring. What you are hungry for, and how you want to be held.",
  },
  Body: {
    about: "Action in the world — what gets made, found and left behind.",
    plain: "About doing. What you go out and get, and what of it outlasts you.",
  },
};

/* ------------------------------ derived ------------------------------ */

/** The wheel a type sits on: itself and its subconscious. Derived. */
export function wheelOf(t: MbtiType): Wheel {
  const [, subconscious] = fourSides(t);
  const src = WHEELS.find((w) => w.lead === t || w.lead === subconscious)!;
  const { lead, ...rest } = src;
  return { ...rest, pair: [t, lead === t ? subconscious : lead] };
}

/** The temple a type belongs to: its full four-sides orbit. Derived. */
export function templeOf(t: MbtiType): Temple {
  const name = wheelOf(t).temple;
  return { name, ...TEMPLE_ABOUT[name], types: [...fourSides(t)].sort() };
}

/** All four temples, in the order Soul · Mind · Heart · Body. */
export function temples(): Temple[] {
  const order: TempleName[] = ["Soul", "Mind", "Heart", "Body"];
  const seen = new Map<TempleName, Temple>();
  for (const t of TYPES) {
    const temple = templeOf(t);
    if (!seen.has(temple.name)) seen.set(temple.name, temple);
  }
  return order.map((n) => seen.get(n)!);
}

/** All eight wheels, grouped by temple in the same order. */
export function wheels(): Wheel[] {
  const seen = new Set<string>();
  const out: Wheel[] = [];
  for (const src of WHEELS) {
    const w = wheelOf(src.lead);
    const key = [...w.pair].sort().join("|");
    if (!seen.has(key)) { seen.add(key); out.push(w); }
  }
  return out;
}

/* ------------------------------- themes ------------------------------- */
/* The variant layer. Two coins, NEITHER derivable from type — they are
   facts about a life, not about a wiring. Two people of the same type with
   different childhoods sit in different themes, which is the whole point of
   the layer. Source: "The Four Themes of the Octagram". */

/** Was the subconscious nurtured in childhood? Set early; described as rarely changing. */
export type Development = "SD" | "UD";
/** Which side are you running on now? Mutable. */
export type Focus = "SF" | "UF";
export type Theme = "Joy" | "Decay" | "Hope" | "Despair";

export interface ThemeInfo {
  theme: Theme;
  development: Development;
  focus: Focus;
  season: string;
  /** Plain-language description of living in this theme. */
  plain: string;
  /** What tends to move someone out of it. */
  movement: string;
}

export const THEMES: ThemeInfo[] = [
  {
    theme: "Joy", development: "SD", focus: "SF", season: "Summer",
    plain: "Your subconscious was fed early and you are living out of it now. Things have room in them — energy, appetite, the sense that more is available. Described as the variant most resistant to despair.",
    movement: "Nothing is pushing you out. The risk is assuming it is permanent and stopping the work that got you here.",
  },
  {
    theme: "Decay", development: "SD", focus: "UF", season: "Autumn",
    plain: "Good roots, but running on the shadow. This is the entropic position: taking other people's ideas, rules and social norms and testing them to the point of breaking. Genuinely useful, and hard on everyone including you.",
    movement: "Described as refinement rather than failure — burning off what was not load-bearing. It is meant to be passed through, not settled in.",
  },
  {
    theme: "Hope", development: "UD", focus: "SF", season: "Spring",
    plain: "Early life did not feed you, but you have since found conditions that do. The direction of travel is upward and you can feel it.",
    movement: "The conviction that things keep getting better is the engine here. It holds as long as the conditions do.",
  },
  {
    theme: "Despair", development: "UD", focus: "UF", season: "Winter",
    plain: "Denied early, and still constrained. This is survival — the shadow and superego are doing the work because nothing else is available.",
    movement: "Described as a position to be moved out of rather than a verdict, and the route out runs through deliberate shadow development.",
  },
];

export const themeFor = (d: Development, f: Focus): ThemeInfo =>
  THEMES.find((t) => t.development === d && t.focus === f)!;

/** Which pole a person drifts toward, given their development. */
export const poleFor = (w: Wheel, d: Development) =>
  d === "SD"
    ? { name: w.aspirationalPole, plain: w.aspirationalPlain, which: "aspirational" as const }
    : { name: w.shadowPole, plain: w.shadowPlain, which: "shadow" as const };

/* ----------------------------- honest gaps ----------------------------- */

/**
 * Recorded rather than guessed. Everything above is either derived or
 * directly sourced; these are the parts of the Octagram this app does not
 * yet represent, and saying so is better than filling them in plausibly.
 */
export const UNSETTLED: { what: string; why: string }[] = [
  {
    what: "Which pole is the shadow and which is the aspirational",
    why: "The pole PAIR for each wheel is well sourced. Their orientation is less so: one published summary transposes the two columns relative to the temple-wheels page and the dedicated ESTP/INFJ episode. This app follows the latter two — shadow = where the unconscious-developed sit, aspirational = where the subconscious-developed sit — which is stated outright for the Intimacy wheel and consistent for Justification. The other six are taken on that pattern rather than independently confirmed.",
  },
  {
    what: "How the temples influence one another",
    why: "Source describes a Cognitive Orbit (Soul/Heart, Mind/Body), a Cognitive Reflection (Soul/Mind, Body/Heart) and a Cognitive Axis (Soul/Body, Heart/Mind), tied to ego/shadow, ego/subconscious and ego/superego positions. That comes from a single summary and has not been cross-checked, so it is described in the app as reported rather than asserted.",
  },
  {
    what: "How the theme layer and the wheel layer join up",
    why: "The four themes (development x focus) and the eight wheels (temple, dyad, origin) are both Octagram material. The poles connect them — development decides which pole you drift toward — but the published account of how FOCUS interacts with the wheel is thin, and the app does not invent one.",
  },
];
