import { TYPES, type MbtiType, type RelCode } from "./core";
import { SLOT_NAMES, EROTIC_ATTITUDE } from "./data";

/* ------------------------------------------------------------------ *
 * THE TRANSLATION SURFACE
 *
 * The ONE module allowed to name another typology system.
 * tests/attribution.test.ts fails the build on these names everywhere
 * else in src/ — the type reader, the lexicon, the curriculum, the
 * assistant's primer. The allowlist is this file, not a policy.
 *
 * Why it exists: people arrive already carrying vocabulary. Someone who
 * says "I'm an ILE with Ti PoLR" should be able to find their footing
 * here without us guessing what they mean, and without the rest of the
 * product reading as a repackaging of somebody else's model.
 *
 * KEYED BY STABLE CODE, NEVER BY OUR OWN LABEL. Type codes, relation
 * codes and slot indices do not change; our display names are mid-
 * rename (docs/VOCABULARY.md). Keying on codes means this table stays
 * correct through the rename with no edits, and our side of every row
 * is read live from the engine rather than duplicated here.
 * ------------------------------------------------------------------ */

/** One other system's name for something we name ourselves. */
export interface Elsewhere {
  system: string;
  term: string;
  /** Present only where the mapping needs a caveat. */
  note?: string;
}

/** How confident the mapping is. Rendered, not decorative. */
export type Fidelity = "exact" | "mapped" | "diverges";

const SOCIONICS = "Socionics";
const EXCHANGE = "Objective Personality";
const FOUR_SIDES = "CS Joseph";
const ARCHETYPES = "Beebe";
const TEMPERAMENTS = "Keirsey";
const STYLES = "Berens";
const POPULAR = "16Personalities";

/* ------------------------------ types ------------------------------ */

/** Socionics code and full name, plus role names from the popular systems. */
const TYPE_ROWS: Record<MbtiType, [code: string, full: string, popular: string, keirsey: string, grid: string]> = {
  ENTP: ["ILE", "Intuitive Logical Extravert", "Debater", "Inventor", "Rogue"],
  INTP: ["LII", "Logical Intuitive Introvert", "Logician", "Architect", "Ardent"],
  ENTJ: ["LIE", "Logical Intuitive Extravert", "Commander", "Fieldmarshal", "Marshal"],
  INTJ: ["ILI", "Intuitive Logical Introvert", "Architect", "Mastermind", "Ranger"],
  ENFP: ["IEE", "Intuitive Ethical Extravert", "Campaigner", "Champion", "Bard"],
  INFP: ["EII", "Ethical Intuitive Introvert", "Mediator", "Healer", "Mystic"],
  ENFJ: ["EIE", "Ethical Intuitive Extravert", "Protagonist", "Teacher", "Cleric"],
  INFJ: ["IEI", "Intuitive Ethical Introvert", "Advocate", "Counselor", "Paladin"],
  ESTP: ["SLE", "Sensory Logical Extravert", "Entrepreneur", "Promoter", "Gladiator"],
  ISTP: ["LSI", "Logical Sensory Introvert", "Virtuoso", "Crafter", "Artificer"],
  ESTJ: ["LSE", "Logical Sensory Extravert", "Executive", "Supervisor", "Judicator"],
  ISTJ: ["SLI", "Sensory Logical Introvert", "Logistician", "Inspector", "Archivist"],
  ESFP: ["SEE", "Sensory Ethical Extravert", "Entertainer", "Performer", "Duelist"],
  ISFP: ["ESI", "Ethical Sensory Introvert", "Adventurer", "Composer", "Druid"],
  ESFJ: ["ESE", "Ethical Sensory Extravert", "Consul", "Provider", "Cavalier"],
  ISFJ: ["SEI", "Sensory Ethical Introvert", "Defender", "Protector", "Knight"],
};

/** What other systems call this type. Powers the "known elsewhere as" row. */
export function typeElsewhere(t: MbtiType): Elsewhere[] {
  const [code, full, popular, keirsey, grid] = TYPE_ROWS[t];
  return [
    {
      system: SOCIONICS,
      term: `${code} — ${full}`,
      // Reader-facing: never name an export here. An earlier draft said "see
      // DIVERGENCES", which is a constant in this file and nothing at all to
      // somebody reading their own type page.
      note: "There are two competing letter conventions; some sources use the other one.",
    },
    { system: POPULAR, term: popular },
    { system: TEMPERAMENTS, term: keirsey },
    { system: FOUR_SIDES, term: grid },
  ];
}

/**
 * What another system calls this type's romantic style. Octant's own
 * romantic-dynamics reading is derived (Complement/Catalyst/Cave/Animal —
 * see engine/romance.ts) and is what the app answers from; this exists
 * only so a reader carrying the other vocabulary can find their footing,
 * the same posture as `typeElsewhere` above.
 */
export function romanceElsewhere(t: MbtiType): Elsewhere[] {
  return [{
    system: SOCIONICS,
    term: EROTIC_ATTITUDE[t],
    note: "An erotic-attitude label, not a romantic-dynamics reading — Octant derives that instead.",
  }];
}

/**
 * The same three role-name alternates `typeElsewhere` carries, stripped of
 * which system each came from — an explicit product decision, not an
 * oversight. Owner's call: color from other systems belongs on every type
 * page, but only the translation surface (above) names sources. Do not
 * "restore" a system label onto this list; add it to `typeElsewhere` instead
 * and let the type page keep importing this one.
 */
export function archetypeAliases(t: MbtiType): string[] {
  const [, , popular, keirsey, grid] = TYPE_ROWS[t];
  return [...new Set([popular, keirsey, grid])];
}

/* ---------------------------- relations ---------------------------- */

/** Every relation is a clean one-to-one rename. Their name, by our code. */
const RELATION_ROWS: Record<RelCode, [term: string, alias?: string]> = {
  DU: ["Duality"],
  AC: ["Activity", "Activation"],
  HD: ["Semi-Duality"],
  MG: ["Mirage", "Illusionary"],
  ID: ["Identity"],
  MI: ["Mirror"],
  KD: ["Kindred", "Look-alike, Comparative"],
  BU: ["Business", "Work relations"],
  BR: ["Benefactor", "Benefit — giver"],
  BE: ["Beneficiary", "Benefit — receiver"],
  SR: ["Supervisor", "Revisor"],
  SV: ["Supervisee", "Revisee"],
  QI: ["Quasi-Identity"],
  EX: ["Extinguishment", "Contrary, Opposite"],
  SE: ["Super-Ego", "Their Super-Ego block is two stack positions, which is a different thing entirely."],
  CF: ["Conflict"],
};

/** What other systems call this relation. */
export function relationElsewhere(code: RelCode): Elsewhere[] {
  const [term, alias] = RELATION_ROWS[code];
  return [{ system: SOCIONICS, term, note: alias }];
}

/* ------------------------------ slots ------------------------------ */

/**
 * Our slot order is the eight-archetype arrangement; Model A orders its
 * positions differently. Derived by building Model A from our own three
 * moves and comparing against stack() for all sixteen types — one
 * distinct permutation, verified in tests/translation.test.ts.
 *
 * Slot N is NOT position N for six of the eight. Do not simplify this.
 */
export const MODEL_A_POSITION = [1, 2, 6, 5, 7, 8, 4, 3] as const;

const MODEL_A_NAMES: Record<number, string> = {
  1: "Leading (Base)", 2: "Creative", 3: "Role", 4: "Vulnerable (PoLR)",
  5: "Suggestive", 6: "Mobilizing", 7: "Ignoring", 8: "Demonstrative",
};

const MODEL_A_BLOCK: Record<number, string> = {
  1: "Ego", 2: "Ego", 3: "Super-Ego", 4: "Super-Ego",
  5: "Super-Id", 6: "Super-Id", 7: "Id", 8: "Id",
};

const ARCHETYPE_NAMES = [
  "Hero / Heroine", "Good Parent", "Puer / Puella", "Anima / Animus",
  "Opposing Personality", "Senex / Witch", "Trickster", "Demonic Personality",
] as const;

/** What other systems call slot `i` (0-indexed, 0 = strongest). */
export function slotElsewhere(i: number): Elsewhere[] {
  const pos = MODEL_A_POSITION[i];
  return [
    { system: ARCHETYPES, term: ARCHETYPE_NAMES[i] },
    {
      system: SOCIONICS,
      term: `position ${pos} — ${MODEL_A_NAMES[pos]}`,
      note: `${MODEL_A_BLOCK[pos]} block. Their position ${pos}, not ${i + 1}.`,
    },
  ];
}

/* ----------------------------- concepts ----------------------------- */

/** Keyed by lexicon entry id, which is stable across the rename. */
const CONCEPT_ROWS: Record<string, Elsewhere[]> = {
  savior: [{ system: EXCHANGE, term: "Savior function" }],
  "demon-animal": [{ system: EXCHANGE, term: "Demon animal" }],
  play: [{ system: EXCHANGE, term: "Play" }],
  sleep: [{ system: EXCHANGE, term: "Sleep" }],
  blast: [{ system: EXCHANGE, term: "Blast" }],
  consume: [{ system: EXCHANGE, term: "Consume" }],
  animal: [{ system: EXCHANGE, term: "Animals" }],
  coin: [{ system: EXCHANGE, term: "Coins" }],
  "fine-coins": [{ system: EXCHANGE, term: "Modality, middle-animal order — the 512" }],

  ego: [{ system: FOUR_SIDES, term: "Ego" }],
  subconscious: [{ system: FOUR_SIDES, term: "Subconscious" }],
  unconscious: [{ system: FOUR_SIDES, term: "Unconscious" }],
  superego: [{
    system: FOUR_SIDES, term: "Superego",
    note: "Unrelated to the Super-Ego block, which is two positions rather than a whole side.",
  }],
  "four-sides": [{ system: FOUR_SIDES, term: "Four Sides of the Mind" }],
  "midlife-crisis": [{ system: FOUR_SIDES, term: "Midlife crisis" }],

  octagram: [{ system: FOUR_SIDES, term: "Octagram" }],
  temple: [{ system: FOUR_SIDES, term: "Temple" }],
  "temple-wheel": [{ system: FOUR_SIDES, term: "Temple wheel" }],
  "cognitive-origin": [{ system: FOUR_SIDES, term: "Cognitive origin" }],
  "living-virtue": [{ system: FOUR_SIDES, term: "Living virtue" }],
  "deadly-sin": [{ system: FOUR_SIDES, term: "Deadly sin" }],
  "aspirational-pole": [{ system: FOUR_SIDES, term: "Aspirational pole" }],
  "shadow-pole": [{ system: FOUR_SIDES, term: "Shadow pole" }],
  "subconscious-development": [{ system: FOUR_SIDES, term: "SD / UD" }],
  "octagram-focus": [{ system: FOUR_SIDES, term: "SF / UF" }],
  "octagram-theme": [{ system: FOUR_SIDES, term: "The four themes" }],

  quadra: [{ system: SOCIONICS, term: "Quadra" }],
  alpha: [{ system: SOCIONICS, term: "Alpha quadra" }],
  beta: [{ system: SOCIONICS, term: "Beta quadra" }],
  gamma: [{ system: SOCIONICS, term: "Gamma quadra" }],
  delta: [{ system: SOCIONICS, term: "Delta quadra" }],
  "stack-map": [{ system: SOCIONICS, term: "Model A" }],
  relation: [{ system: SOCIONICS, term: "Intertype relations" }],

  nt: [{ system: TEMPERAMENTS, term: "Rational" }],
  nf: [{ system: TEMPERAMENTS, term: "Idealist" }],
  sj: [{ system: TEMPERAMENTS, term: "Guardian" }],
  sp: [{ system: TEMPERAMENTS, term: "Artisan" }],

  "in-charge": [{ system: STYLES, term: "In Charge" }],
  "chart-the-course": [{ system: STYLES, term: "Chart the Course" }],
  "get-things-going": [{ system: STYLES, term: "Get Things Going" }],
  "behind-the-scenes": [{ system: STYLES, term: "Behind the Scenes" }],

  hero: [{ system: ARCHETYPES, term: "Hero / Heroine" }],
  parent: [{ system: ARCHETYPES, term: "Good Parent" }],
  child: [{ system: ARCHETYPES, term: "Puer / Puella" }],
  inferior: [{ system: ARCHETYPES, term: "Anima / Animus" }],
  nemesis: [{ system: ARCHETYPES, term: "Opposing Personality" }],
  critic: [{ system: ARCHETYPES, term: "Senex / Witch" }],
  trickster: [{ system: ARCHETYPES, term: "Trickster" }],
  demon: [{ system: ARCHETYPES, term: "Demonic Personality" }],
};

/** What other systems call this concept. Empty when nobody else names it. */
export const conceptElsewhere = (id: string): Elsewhere[] => CONCEPT_ROWS[id] ?? [];

/** Every lexicon id this module can translate. */
export const TRANSLATED_IDS = Object.keys(CONCEPT_ROWS);

/* ---------------------------- divergences ---------------------------- */

/**
 * The four places the mapping genuinely breaks. Rendered as warnings, not
 * footnotes — a translation table that quietly papers over these is worse
 * than no table, because it invites confident wrong conclusions.
 */
export const DIVERGENCES: { title: string; body: string }[] = [
  {
    title: "Slot order",
    body:
      "Six of eight positions move between our arrangement and theirs. The permutation is " +
      "1,2,6,5,7,8,4,3, and it is the same for all sixteen types. Anyone equating our seat 3 " +
      "with their position 3 will be wrong twice over — our Delight is their Mobilizing, and " +
      "our Blind spot is their much-discussed Vulnerable position.",
  },
  {
    title: "'Super-Ego' names three unrelated things",
    body:
      "A block of two positions in one system; an entire reversed shadow stack in another; and " +
      "one of our sixteen relations. Same word, three objects — which is a good argument for " +
      "renaming ours to Standoff.",
  },
  {
    title: "The two growth readings do not reconcile",
    body:
      "One puts the growth point at the Cave alone. The exchange overlay marks Delight and Cave " +
      "together. They agree about seat 4 and disagree about seat 3. This is not a gap we can " +
      "close — we carry both deliberately, and that is the honest position rather than a defect.",
  },
  {
    title: "Type-letter correspondence is contested",
    body:
      "We use the direct convention, matching lead and support functions: ENTP is ILE. The other " +
      "convention reads the J/P letter differently for introverts and shifts eight of the " +
      "sixteen. Material elsewhere may be using it, and the disagreement will look like an error " +
      "in our engine when it is a disagreement about notation.",
  },
];

/** Every system named anywhere in this module, for the page's own credits. */
export const SYSTEMS = [SOCIONICS, EXCHANGE, FOUR_SIDES, ARCHETYPES, TEMPERAMENTS, STYLES, POPULAR] as const;

/** Sanity helper for the page: our slot labels, in order, straight from the engine. */
export const ourSlots = () => [...SLOT_NAMES];

/** Sanity helper: our type list, straight from the engine. */
export const ourTypes = () => [...TYPES];
