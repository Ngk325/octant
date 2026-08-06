import type { Fn, RelCode, MbtiType, SlotName } from "./data";
import type { Quadra } from "./core";

/* ------------------------------------------------------------------ *
 * THE PLAIN LAYER
 *
 * Same concepts, no vocabulary. Every string here is written for someone
 * who has never heard the word "cognitive function", and every one of
 * them is paired on screen with the precise technical text it stands in
 * front of -- never instead of it. Rules used throughout:
 *
 *   - second person, present tense
 *   - no term from the lexicon unless it is being defined right there
 *   - one concrete behaviour rather than one abstraction
 *   - short. If it needs a second sentence it is doing two jobs.
 * ------------------------------------------------------------------ */

/** What each function actually is, said plainly. */
export const FN_PLAIN: Record<Fn, string> = {
  Ne: "Sees what something could turn into. Throws out five ideas, likes all of them, commits to none yet.",
  Ni: "Sees where something is going to end up. Gets a strong hunch about the outcome and usually cannot show its working.",
  Se: "Sees exactly what is in front of it, right now. Notices the room, reacts in the moment, does not need to think first.",
  Si: "Remembers how things have gone before. Notices when something has drifted from the way it used to work.",
  Te: "Gets it done. Looks at a goal and works out the fastest arrangement of people, steps and resources to reach it.",
  Ti: "Works out how it fits together. Needs the reasoning to be consistent before it will accept the answer.",
  Fe: "Reads the room's mood and shifts it. Notices when someone has gone quiet and does something about it.",
  Fi: "Knows what it personally believes is right. Checks decisions against that privately, and will not be talked out of it.",
};

/** A one-word handle for each function — the thing it does, not the thing it is. */
export const FN_HANDLE: Record<Fn, string> = {
  Ne: "possibilities", Ni: "where this ends", Se: "the present moment", Si: "how it has gone before",
  Te: "getting it done", Ti: "how it fits together", Fe: "the room", Fi: "what is right",
};

/** The eight positions, said plainly. */
export const SLOT_PLAIN: Record<SlotName, string> = {
  Lead: "Your strongest move. You reach for it automatically, you are genuinely good at it, and you overuse it.",
  Support: "Your sense of duty. You are good at this too, but it feels like work rather than fun, so you skip it when tired.",
  Delight: "Your fun. You are not brilliant at it, but you love it and it is where you go to feel light.",
  Cave: "Your sore spot. You want to be good at this and you are afraid you are not. Growth lives here.",
  Doubt: "Your worry. The voice that asks what you have not thought of.",
  Scold: "Your cynicism. Where you get dismissive, usually about other people doing this badly.",
  "Blind spot": "The one you genuinely cannot see. You will bluff rather than admit it.",
  Dread: "Your worst setting. Rarely on — and when it is on, it is doing damage.",
};

/* ------------------------------------------------------------------ *
 * The same eight positions, described from OUTSIDE.
 *
 * SLOT_PLAIN is second-person, which is right on a type page: one person
 * is on screen and "you" can only mean them. The pair page has TWO people
 * on screen, and reusing the second-person copy there produced rows that
 * read "Their strongest ... Your worry" about a single function — two
 * pronouns pointing at two different people inside one line.
 *
 * `{who}` is replaced with the name of the type whose stack the slot
 * belongs to, so nothing on the pair page depends on the reader tracking
 * which of "your" and "their" is currently which.
 * ------------------------------------------------------------------ */
export const SLOT_ABOUT: Record<SlotName, string> = {
  Lead: "{who}'s strongest move. They reach for it without thinking, they are genuinely good at it, and they overuse it.",
  Support: "{who}'s sense of duty. They are good at this too, but it feels like work rather than fun, so it slips when they are tired.",
  Delight: "{who}'s fun. Not brilliant at it, but they love it — it is where they go to feel light.",
  Cave: "{who}'s sore spot. They want to be good at this and are afraid they are not. Their growth lives here.",
  Doubt: "{who}'s worry. The voice asking what they have not thought of.",
  Scold: "{who}'s cynicism. Where they get dismissive, usually about other people doing this badly.",
  "Blind spot": "The one {who} genuinely cannot see. They will bluff rather than admit it.",
  Dread: "{who}'s worst setting. Rarely on — and when it is on, it is doing damage.",
};

/** One slot described from outside, with the owner named rather than pronouned. */
export const slotAbout = (slot: string, who: string): string =>
  (SLOT_ABOUT[slot as SlotName] ?? "").replace(/\{who\}/g, who);

/** The four sides, said plainly, without any structure attached. */
export const SIDE_PLAIN: Record<string, string> = {
  ego: "Who you are on an ordinary day.",
  subconscious: "Who you wish you were. Behind your biggest insecurity.",
  unconscious: "Who you become in a crisis. Behind your worry.",
  superego: "Usually who you are at your worst. Behind your fear — but it's also the one side built for real power, once it's earned last instead of taken first.",
};

/** The sixteen relations, in one sentence each, no jargon. */
export const REL_PLAIN: Record<RelCode, string> = {
  DU: "The easiest match in the whole system. What you are bad at, they are good at, and the other way round.",
  AC: "Fun and fast. You energise each other — and you will both need a break from it.",
  HD: "Comfortable most of the time. It stops working on the specific thing you do not share.",
  MG: "Relaxing, a bit unserious. Great for downtime, bad for getting something done together.",
  ID: "Same wiring. You get each other instantly, and you are both blind to exactly the same things.",
  MI: "You want the same things and constantly argue about the order to do them in.",
  KD: "You notice the same things, then do completely different things about them.",
  BU: "Easy to work with, harder to get close to.",
  BR: "They find you more interesting than you find them. That is not your fault, but do not exploit it.",
  BE: "You find them more interesting than they find you. Do not read that as rejection — it is structural.",
  SV: "You correct them without meaning to. Your throwaway remarks land on them as judgements.",
  QI: "You look similar from outside and think in ways that do not translate to each other.",
  SR: "They correct you without meaning to. Their casual comments land on you as verdicts.",
  EX: "You keep just missing each other. Same interests, opposite instincts, constant small misreadings.",
  SE: "Interesting from a distance, irritating up close.",
  CF: "The hardest match. What you are best at is exactly what they are most defensive about, and vice versa.",
};

/** Each quadra in one jargon-free sentence. */
export const QUADRA_PLAIN: Record<Quadra, string> = {
  Alpha: "Ideas for their own sake, in a warm room. Debate is friendly and nothing has to be useful.",
  Beta: "Intensity and belief. Big feelings, a clear leader, and a cause worth arguing about.",
  Gamma: "Results and honesty. Say what you actually think, then show it worked.",
  Delta: "Craft and quiet decency. Do good work, look after your people, skip the drama.",
};

/** Each growth gate in one jargon-free sentence. */
export const GATE_PLAIN: Record<string, string> = {
  "Gate of Chaos": "You grow by letting things be unpredictable instead of pinning them down.",
  "Gate of Obligation": "You grow by finishing what you started, even after it stops being interesting.",
  "Gate of the Tribe": "You grow by letting people see you try, and risking looking incompetent.",
  "Gate of the Self": "You grow by sitting alone with yourself and finding that someone is there.",
};

/** Each coin as a question a person could actually answer about themselves. */
export const COIN_PLAIN: string[] = [
  "Do you take in information first, or make up your mind first?",
  "Do you check decisions against your own values, or against the group's?",
  "Do you work from what you already know, or go and gather more?",
  "Do you decide by reasoning, or by what matters?",
  "Do you trust the concrete thing, or the connection between things?",
  "Do you move first, or wait and process?",
  "Do you tell people plainly, or give them context and let them choose?",
  "Do you want it right, or want it moving?",
];

/** Concepts that need saying plainly before anything else makes sense. */
export const CONCEPT_PLAIN: Record<string, string> = {
  function:
    "A 'function' is just a habit of mind — one particular way of taking in the world or making " +
    "up your mind about it. There are eight. Everyone has all eight. What differs is the order.",
  stack:
    "Your 'stack' is those eight habits in your personal order of strength. The top one is " +
    "effortless. The bottom one barely runs. The order is what a type actually is.",
  ego:
    "Your top four are the ones you experience as 'me'. The bottom four run too, but they feel " +
    "like something happening to you rather than something you are doing.",
  savior:
    "Things you trust so completely you do not notice you are doing them. You shrug off criticism " +
    "here, because you already know you are fine.",
  demon:
    "Things you distrust and avoid. You get nervous, you show off, you put it off until later, and " +
    "criticism here really stings.",
  animal:
    "Pair up one way of looking at the world with one way of deciding, and you get one of four " +
    "currents. You are always running one of them.",
  gateway:
    "Each side of your mind has one function standing in the doorway. To get in, you have to be " +
    "willing to be bad at that one thing in front of people.",
  ease:
    "A number out of 100 for how easy this person is for you to be around, based purely on how the " +
    "two wirings mesh. It is not a compatibility score and it says nothing about whether you should " +
    "like them.",
  directional:
    "Ease runs in two directions and they are not always the same number. Reading someone is not the " +
    "same experience as being read by them.",
  quadra:
    "Four clubs of four types that share the same four favourite habits of mind. Inside a club, the " +
    "unspoken rules match and nobody has to explain themselves.",
  complement:
    "The two types who are good at exactly what you are afraid of. Being around them is restful.",
  catalyst:
    "The two types who lead with the thing you are consciously reaching for. Being around them is " +
    "stimulating and slightly annoying, which is the point.",

  /* --- the Octagram layer. Written to be readable cold, because the source
     material for this part is genuinely difficult and nobody should need the
     technical version first. --- */
  octagram:
    "A second layer on top of your type. Your type says how you are wired; the Octagram says what " +
    "you have been chasing your whole life with that wiring, and what your childhood did to the way " +
    "you chase it. Two people of the same type can sit in completely different places here.",
  temple:
    "One of four departments of a life: who you are, what you understand, what you want, and what " +
    "you do. Four types share each one. They are not four types who are alike — they are the four " +
    "sides of one mind, which is why they belong together.",
  wheel:
    "You and one other type share a single lifelong want. The wheel is a picture of it: the want in " +
    "the middle, the honest way to get it above, the fake version below, and the two ways people " +
    "actually go wrong out to the sides.",
  origin:
    "The one thing you have been after since before you could name it. Not a goal — you do not " +
    "finish it. It is what is underneath the goals.",
  "living-virtue":
    "The honest way to get what you are after. It is usually the harder route and it usually " +
    "involves giving somebody else some of the thing you want.",
  "deadly-sin":
    "The counterfeit. It looks like the thing you want, it is much easier to get, and it leaves you " +
    "hungrier than before.",
  "shadow-pole":
    "If you did not get what you needed as a child, this is the direction you drift. It is a " +
    "strategy that once worked, running long after the situation that needed it.",
  "aspirational-pole":
    "If you did get what you needed as a child, this is the direction you drift. Being given " +
    "something early has its own distortion, and this is what it looks like.",
  development:
    "Whether the part of you that is your opposite was fed when you were small. It is set early and " +
    "it mostly does not change. It is not a verdict — it is a starting position.",
  focus:
    "Which half of you is doing the work at the moment. Unlike the childhood part, this one moves, " +
    "and moving it is most of what growth actually is.",
  theme:
    "Where those two answers put you: the season you are living in. There are four, everyone has " +
    "been in all of them, and none of them is permanent.",
};

/* ------------------------------------------------------------------ *
 * Every lexicon entry gets one of these. Where a table above already
 * says it plainly, reuse it rather than writing it twice — the entries
 * and the app then cannot drift apart. tests/plain.test.ts asserts that
 * all 88 ids are covered.
 * ------------------------------------------------------------------ */
export const PLAIN_BY_ID: Record<string, string> = {
  /* functions */
  ne: FN_PLAIN.Ne, ni: FN_PLAIN.Ni, se: FN_PLAIN.Se, si: FN_PLAIN.Si,
  te: FN_PLAIN.Te, ti: FN_PLAIN.Ti, fe: FN_PLAIN.Fe, fi: FN_PLAIN.Fi,

  /* archetypes */
  hero: SLOT_PLAIN.Lead, parent: SLOT_PLAIN.Support, child: SLOT_PLAIN.Delight,
  inferior: SLOT_PLAIN.Cave, nemesis: SLOT_PLAIN.Doubt, critic: SLOT_PLAIN.Scold,
  trickster: SLOT_PLAIN["Blind spot"], demon: SLOT_PLAIN.Dread,

  /* quadras */
  alpha: QUADRA_PLAIN.Alpha, beta: QUADRA_PLAIN.Beta,
  gamma: QUADRA_PLAIN.Gamma, delta: QUADRA_PLAIN.Delta,

  /* animals */
  play: "Doing something out in the world with other people. Energy going out.",
  sleep: "Being alone with your own thoughts to recharge. Energy staying in.",
  blast: "Telling people things. Teaching, directing, getting something started.",
  consume: "Taking things in. Reading, researching, watching, learning before you move.",

  /* romance styles */
  infantile: "Wants to be delighted in. Flirts by playing, and would rather not be the one organising things.",
  caregiver: "Shows love by looking after you. Finds it much easier to give than to be given to.",
  aggressor: "Goes after what it wants and says so. Direct, and can read as pressure without meaning to.",
  victim: "Wants to be pursued and won. Enjoys a bit of tension, and can manufacture some if there is none.",

  /* interaction styles */
  "in-charge": "Takes the wheel. Says what happens next and expects it to happen.",
  "chart-the-course": "Wants a plan before moving. Will steer, but not until it knows where.",
  "get-things-going": "Starts things and brings people with it. High energy, light on follow-through.",
  "behind-the-scenes": "Works quietly and adjusts as it goes. Influence without standing at the front.",

  /* gates */
  "gate-of-chaos": GATE_PLAIN["Gate of Chaos"],
  "gate-of-obligation": GATE_PLAIN["Gate of Obligation"],
  "gate-of-the-tribe": GATE_PLAIN["Gate of the Tribe"],
  "gate-of-the-self": GATE_PLAIN["Gate of the Self"],

  /* temperaments */
  nt: "Wants to understand how things work, and to be competent at them.",
  nf: "Wants meaning, and to help people become who they could be.",
  sj: "Wants things to run properly, and to be someone others can rely on.",
  sp: "Wants to be good with real things in real time, and not to be boxed in.",

  /* coin poles, in COIN_POLES order */
  observer: "You take things in first and decide later.",
  decider: "You make up your mind first and gather details later.",
  identity: "You settle on your own reasons and values first, then check them against the group's.",
  tribe: "You read the group's reasons and values first, then work out your own.",
  organize: "You work from what you already know, and go looking for more afterwards.",
  gather: "You collect new material first, and sort it out afterwards.",
  thinking: "You work out the reasons first, then what matters.",
  feeling: "You work out what matters first, then the reasons.",
  sensing: "You trust the concrete thing you can point at.",
  intuition: "You trust the connection between things.",
  initiating: "You move first — start the conversation, change the subject.",
  responding: "You wait, finish the thought, and take your time.",
  direct: "You say exactly what you mean, in fewer words.",
  informative: "You give context and leave the other person room to choose.",
  control: "You want it right, and will slow down to get it right.",
  movement: "You want it moving, and will fix things as you go.",

  /* concepts */
  complement: CONCEPT_PLAIN.complement,
  catalyst: CONCEPT_PLAIN.catalyst,
  ease: CONCEPT_PLAIN.ease,
  /* This used to gloss DUALITY — "the relief of being around someone who is
     effortlessly good at the thing you are afraid of" — which is a different
     concept entirely from the entry it was attached to. */
  "dual-lighting": "This app carries two accounts of where you grow, and they disagree about one slot. Rather than split the difference and print a number neither account would recognise, it shows you both and says which is which.",
  savior: CONCEPT_PLAIN.savior,
  "demon-animal": "The current you use least. You can do it — it just costs you, so you avoid it and then resent needing it.",
  "four-sides": "You are four types, not one: the everyday you, the one you wish you were, the one who shows up in a crisis, and the one at your worst.",
  ego: CONCEPT_PLAIN.ego,
  shadow: "The bottom four habits. They still run — they just do not feel like you choosing something.",
  "stack-map": "The bit of maths underneath all of this. There are only three moves — flip a habit to face the other way, swap it for its opposite, or turn it by doing both — and from those three you can generate every type and every relationship from a very small starting point.",
  quadra: CONCEPT_PLAIN.quadra,
  animal: CONCEPT_PLAIN.animal,
  coin: "A yes-or-no question about how you are wired. Four of them are enough to pin down which of the sixteen you are.",
  relation: "What you get when you line up two people's orders and see where each one's strongest habit lands in the other.",
  gate: "The one thing you have to get better at to stop running in circles. It is always the thing you least want to do.",
  "fine-coins": "Extra detail some systems add on top of the sixteen. Useful, but not something a four-letter type can tell you — you have to report it yourself.",

  /* the other three sides */
  subconscious: SIDE_PLAIN.subconscious,
  unconscious: SIDE_PLAIN.unconscious,
  superego: SIDE_PLAIN.superego,
  "midlife-crisis":
    "Somewhere around forty, the version of you that you never became stops waiting politely. " +
    "It is not a breakdown. It is a bill arriving.",

  /* octagram */
  octagram: CONCEPT_PLAIN.octagram,
  temple: CONCEPT_PLAIN.temple,
  "temple-wheel": CONCEPT_PLAIN.wheel,
  "cognitive-origin": CONCEPT_PLAIN.origin,
  "living-virtue": CONCEPT_PLAIN["living-virtue"],
  "deadly-sin": CONCEPT_PLAIN["deadly-sin"],
  "shadow-pole": CONCEPT_PLAIN["shadow-pole"],
  "aspirational-pole": CONCEPT_PLAIN["aspirational-pole"],
  "subconscious-development": CONCEPT_PLAIN.development,
  "octagram-focus": CONCEPT_PLAIN.focus,
  "octagram-theme": CONCEPT_PLAIN.theme,

  /* relations */
  "rel-du": REL_PLAIN.DU, "rel-ac": REL_PLAIN.AC, "rel-hd": REL_PLAIN.HD, "rel-mg": REL_PLAIN.MG,
  "rel-id": REL_PLAIN.ID, "rel-mi": REL_PLAIN.MI, "rel-kd": REL_PLAIN.KD, "rel-bu": REL_PLAIN.BU,
  "rel-br": REL_PLAIN.BR, "rel-be": REL_PLAIN.BE, "rel-sv": REL_PLAIN.SV, "rel-qi": REL_PLAIN.QI,
  "rel-sr": REL_PLAIN.SR, "rel-ex": REL_PLAIN.EX, "rel-se": REL_PLAIN.SE, "rel-cf": REL_PLAIN.CF,
};

/** The Lead and the Dread, said in one line each — no jargon, same two slots as typePlain. */
export function powersPlain(t: MbtiType, hero: Fn, dread: Fn): string {
  return (
    `${t}'s superpower is ${FN_HANDLE[hero]} — the move that runs so automatically it looks involuntary. ` +
    `Their kryptonite is ${FN_HANDLE[dread]}: the one setting that is almost never on, and does real damage when it is.`
  );
}

/** How to read a type in one sentence, for the top of a type page. */
export function typePlain(t: MbtiType, hero: Fn, parent: Fn, inferior: Fn): string {
  return (
    `${t} leads with ${FN_HANDLE[hero]} and backs it with ${FN_HANDLE[parent]}. ` +
    `The sore spot — the thing they want to be good at and quietly fear they are not — is ${FN_HANDLE[inferior]}.`
  );
}
