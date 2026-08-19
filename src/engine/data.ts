// Originally emitted from the verified Python reference engine and checked by
// tests/engine.test.ts. TypeScript is canonical now; the Python reference is
// retired, so the computed tables below are frozen and the authored label
// tables (ARCHETYPE and friends) are edited here directly.

export const TYPES = [
  "ENTP",
  "INTP",
  "ENTJ",
  "INTJ",
  "ENFP",
  "INFP",
  "ENFJ",
  "INFJ",
  "ESTP",
  "ISTP",
  "ESTJ",
  "ISTJ",
  "ESFP",
  "ISFP",
  "ESFJ",
  "ISFJ"
] as const;
export type MbtiType = (typeof TYPES)[number];
export type Fn = "Ne" | "Ni" | "Se" | "Si" | "Te" | "Ti" | "Fe" | "Fi";
export type RelCode =
  | "ID" | "MI" | "EX" | "QI" | "DU" | "AC" | "SE" | "CF"
  | "KD" | "BU" | "HD" | "MG" | "SR" | "SV" | "BR" | "BE";

export const DOM_AUX: Record<MbtiType, [Fn, Fn]> = {
  "ENTP": [
    "Ne",
    "Ti"
  ],
  "INTP": [
    "Ti",
    "Ne"
  ],
  "ENTJ": [
    "Te",
    "Ni"
  ],
  "INTJ": [
    "Ni",
    "Te"
  ],
  "ENFP": [
    "Ne",
    "Fi"
  ],
  "INFP": [
    "Fi",
    "Ne"
  ],
  "ENFJ": [
    "Fe",
    "Ni"
  ],
  "INFJ": [
    "Ni",
    "Fe"
  ],
  "ESTP": [
    "Se",
    "Ti"
  ],
  "ISTP": [
    "Ti",
    "Se"
  ],
  "ESTJ": [
    "Te",
    "Si"
  ],
  "ISTJ": [
    "Si",
    "Te"
  ],
  "ESFP": [
    "Se",
    "Fi"
  ],
  "ISFP": [
    "Fi",
    "Se"
  ],
  "ESFJ": [
    "Fe",
    "Si"
  ],
  "ISFJ": [
    "Si",
    "Fe"
  ]
};
export const REL_NAME: Record<RelCode, string> = {
  "DU": "Counterpart",
  "AC": "Spark",
  "HD": "Near fit",
  "MG": "False fit",
  "ID": "Twin",
  "MI": "Opposite hand",
  "KD": "Cousin",
  "BU": "Colleague",
  "BR": "Upstream",
  "BE": "Downstream",
  "SV": "Examined",
  "QI": "Near-twin",
  "SR": "Examiner",
  "EX": "Damper",
  "SE": "Standoff",
  "CF": "Headwind"
};
export const REL_DEF: Record<RelCode, string> = {
  "DU": "Their wiring completes yours: your weak functions are their strong ones and vice versa. Lowest-friction pairing in the model.",
  "AC": "Energising and fast to warm, because each of you feeds the other's mobilising function. Exhausting if never stepped out of.",
  "HD": "Partial completion. Shares the Counterpart base channel but not the creative one; comfortable until the unshared half is what is needed.",
  "MG": "Relaxing and slightly unserious. Shares the Counterpart creative channel only; good for rest, poor for joint execution.",
  "ID": "Same wiring. Instant mutual understanding and perfectly shared blind spots, so no one covers the gap.",
  "MI": "Same two functions in opposite order. Agreement on what matters, persistent argument about sequence.",
  "KD": "Same leading function, different second. You perceive the same thing and then do different things with it.",
  "BU": "Same second function, different leading. Easy to work alongside, harder to be close to.",
  "BR": "Asymmetric admiration. Their leading function lands on your mobilising function, so you find them compelling and they do not quite return it.",
  "BE": "Asymmetric admiration, reversed. Your leading function lands on their mobilising function; they orbit you more than you orbit them.",
  "SV": "Asymmetric correction. Your leading function lands on their vulnerable function; you can flatten them without noticing.",
  "QI": "Same elements, every position and attitude rearranged. You look alike from outside and reach conclusions by incompatible routes.",
  "SR": "Asymmetric correction, reversed. Their leading function lands on your vulnerable function; their casual remarks land as verdicts.",
  "EX": "Same functions, every attitude flipped. Constant near-miss: you keep misreading each other's intent.",
  "SE": "Ego meets ego's understudy. Fascinating at a distance, abrasive up close.",
  "CF": "Their leading function lands directly on your most defended weakness, and yours on theirs. Maximum cognitive friction."
};
export const REL_SCORE: Record<RelCode, number> = {
  "DU": 100,
  "AC": 92,
  "HD": 86,
  "MG": 80,
  "ID": 74,
  "MI": 70,
  "KD": 64,
  "BU": 60,
  "BR": 54,
  "BE": 48,
  "SV": 44,
  "QI": 40,
  "SR": 34,
  "EX": 28,
  "SE": 20,
  "CF": 10
};
export const RECIPROCAL: Record<RelCode, RelCode> = {
  "ID": "ID",
  "MI": "MI",
  "EX": "EX",
  "QI": "QI",
  "DU": "DU",
  "AC": "AC",
  "SE": "SE",
  "CF": "CF",
  "KD": "KD",
  "BU": "BU",
  "HD": "HD",
  "MG": "MG",
  "SR": "SV",
  "SV": "SR",
  "BR": "BE",
  "BE": "BR"
};

export const FN_LONG: Record<Fn, string> = {
  "Ne": "Simulates the multiverse. Branches into dozens of 'what if' lines and watches how variables would interact before they do.",
  "Ni": "Foresees the inevitable path. Compresses masses of abstract data into a single laser-focused reading of how this ends.",
  "Se": "Kinetic mastery. Unmatched awareness of the physical field, reacting to concrete variables in real time.",
  "Si": "Preserves functional systems. Holds the body's and the institution's history, and notices the moment either drifts.",
  "Te": "Commands external resources. Reads the world as a board to be arranged into the most efficient route to the objective.",
  "Ti": "Constructs flawless internal logic. Compiles every input until the framework holds without a single contradiction.",
  "Fe": "Forges emotional consensus. Reads and then bends the emotional climate of a room toward unity.",
  "Fi": "Wields absolute moral truth. A refined internal compass that dictates what is authentic, corrupt, right, and wrong."
};
export const FN_SHADOW: Record<Fn, string> = {
  "Ne": "Paranoia about unproven possibility; worst-case branching where others see opportunity.",
  "Ni": "Apocalyptic certainty; foreseeing the collapse of everything already built.",
  "Se": "Reckless physical indulgence and destructive impulse when cornered.",
  "Si": "Obsessive replay of past damage and hyper-fixation on bodily detail.",
  "Te": "Cold, tyrannical control; efficiency turned against people.",
  "Ti": "Cutting logic deployed to dismantle a person rather than a problem.",
  "Fe": "Manipulating the room's mood as a weapon.",
  "Fi": "Moral outrage with no off-switch."
};
export const FN_INSTRUMENT: Record<Fn, string> = {
  "Ne": "throw options rather than conclusions",
  "Ni": "name where this actually ends up",
  "Se": "show them, do not tell them",
  "Si": "bring what has demonstrably held up",
  "Te": "hand them something runnable",
  "Ti": "take the argument apart cleanly",
  "Fe": "set the temperature of the room",
  "Fi": "say plainly what you value"
};
export const SLOT_EFFECT: Record<SlotName, string> = {
  "Lead": "their strongest ground — you will move fast together and share the same blind spot",
  "Support": "their sense of duty — expect it pruned and stress-tested before it is accepted",
  "Delight": "their fun side — keep it light and they will open immediately",
  "Cave": "their fear — approach it slowly or not at all",
  "Doubt": "their guard — it reads as a challenge to their competence",
  "Scold": "their cynicism — expect it audited harshly",
  "Blind spot": "something they cannot see in themselves — they will bluff fluency they do not have",
  "Dread": "the tripwire — leading with this reads as an attack"
};
/**
 * Authored for the course stage "Borrowed wiring," not sourced from the ingested
 * material like the tables around it — this is a reasoned extension of the slot
 * structure, not a transcribed fact, and it is pending the project owner's read.
 * What it costs to deliberately RUN a function sitting at each of a type's own
 * eight slots (as opposed to SLOT_EFFECT, which is what that slot means when
 * someone else's function lands on it).
 */
export const SLOT_COST: Record<SlotName, string> = {
  "Lead": "nothing to speak of — it is already who you are, not a performance",
  "Support": "little — it already backs the Lead, so it feels like an extension of yourself",
  "Delight": "little, and it is the one slot that feels like play rather than effort",
  "Cave": "real strain — it works, but it drains fast and starts to show within a day",
  "Doubt": "discomfort more than cost — like arguing yourself into a stance you do not hold",
  "Scold": "real effort — sustainable for a meeting, not a life; the edge is borrowed, not felt",
  "Blind spot": "a bluff, not a performance — convincing in short bursts, and it collapses under real pressure",
  "Dread": "the wrong question — sustain this and you are not performing any more; that is the superego"
};
export const CHILD_HOOK: Record<Fn, string> = {
  "Ne": "riff on what-ifs with nothing riding on them",
  "Ni": "let them float a hunch about where it goes",
  "Se": "do something physical together",
  "Si": "trade specifics, trivia and remembered detail",
  "Te": "let them organise something small and blunt",
  "Ti": "let them take a mechanism apart for fun",
  "Fe": "banter, and let them charm you",
  "Fi": "let a private conviction show and do not comment"
};
export const INFERIOR_GUARD: Record<Fn, string> = {
  "Ne": "do not hand them unproven possibility and ask them to trust it",
  "Ni": "do not force a commitment to one irreversible long path",
  "Se": "do not spring physical chaos or demand real-time performance",
  "Si": "do not bury them in routine, upkeep and repetition",
  "Te": "do not measure them by cold metrics or bureaucracy",
  "Ti": "do not make them defend their own logic unaided in public",
  "Fe": "do not make group approval the price of admission",
  "Fi": "do not interrogate what they personally feel"
};
export const TRICKSTER_BLIND: Record<Fn, string> = {
  "Ne": "open-ended brainstorming",
  "Ni": "long-range implication",
  "Se": "reading the physical room",
  "Si": "detail retention and upkeep",
  "Te": "external efficiency",
  "Ti": "airtight internal logic",
  "Fe": "managing group emotion",
  "Fi": "naming their own values"
};
export const REL_FRAME: Record<RelCode, string> = {
  "ID": "Identity. Same wiring, so understanding is instant and the blind spots are shared — neither of you covers the gap.",
  "DU": "Counterpart. Their wiring completes yours; this is the lowest-friction pairing in the model.",
  "AC": "Activity. Genuinely energising, and quietly draining if you never step out of it.",
  "MI": "Mirror. Same two functions, opposite order — you agree on what matters and argue about sequence.",
  "KD": "Cousin. Shared leading function: you see the same thing and then do different things with it.",
  "BU": "Business. Shared second function — easy to work alongside, harder to get close to.",
  "HD": "Near fit. Partial completion; comfortable until the half you do not share is the half that is needed.",
  "MG": "False fit. Relaxing and slightly unserious — good for rest, poor for joint execution.",
  "SE": "Super-Ego. Fascinating at a distance, abrasive up close.",
  "CF": "Conflict. Your strongest function lands on their most defended weakness, and theirs on yours.",
  "QI": "Near-twin. You look alike from outside and arrive by routes that do not translate.",
  "EX": "Damper. Same functions, every attitude flipped — a constant near-miss on intent.",
  "SR": "You supervise them. Asymmetric: your Lead lands on their blind side, so your offhand remarks arrive as verdicts. Go gentler than feels necessary.",
  "SV": "They supervise you. Asymmetric: their casual corrections land harder than they intend, and they cannot see it happening. Do not mistake the pressure for malice.",
  "BR": "You are Upstream of them. They will find you more compelling than you find them; spend that credit deliberately rather than assuming it is mutual.",
  "BE": "You are Downstream of them. You will find them more compelling than they find you; do not read the asymmetry as rejection."
};

/**
 * THREE role names per type, in this app's own voice — never one.
 *
 * A single label boxes a person in, and readers reported exactly that. Three
 * give range: someone who does not recognise themselves in "Prospector" may
 * well recognise "Provocateur", and the spread is itself informative about
 * what the type actually is.
 *
 * Each is a plain vocation noun chosen for the type's lead and support — the
 * Prospector opens seams (Ne), the Steward keeps what worked (Si), the
 * Forecaster commits to one long read (Ni). All original: none is a role name
 * belonging to another product, and none collides with a term used elsewhere
 * in this system (which rules out Anchor, Spark and Examiner, all of which
 * are now something else). Asserted in tests/ingested.test.ts.
 *
 * Labels, not inputs: nothing in the engine reads this table. What OTHER
 * systems call each type lives in engine/translation.ts.
 */
export const ARCHETYPE: Record<MbtiType, [string, string, string]> = {
  "ENTP": ["Prospector", "Provocateur", "Igniter"],
  "INTP": ["Theorist", "Cartographer", "Skeptic"],
  "ENTJ": ["Strategist", "Operator", "Closer"],
  "INTJ": ["Forecaster", "Planner", "Watchman"],
  "ENFP": ["Kindler", "Wanderer", "Enthusiast"],
  "INFP": ["Believer", "Poet", "Conscience"],
  "ENFJ": ["Shepherd", "Convener", "Rouser"],
  "INFJ": ["Diviner", "Confidant", "Seer"],
  "ESTP": ["Improviser", "Opportunist", "Daredevil"],
  "ISTP": ["Tinkerer", "Mechanic", "Marksman"],
  "ESTJ": ["Administrator", "Foreman", "Enforcer"],
  "ISTJ": ["Steward", "Registrar", "Keeper"],
  "ESFP": ["Reveller", "Showman", "Firestarter"],
  "ISFP": ["Maker", "Naturalist", "Aesthete"],
  "ESFJ": ["Host", "Caretaker", "Organiser"],
  "ISFJ": ["Custodian", "Homemaker", "Quartermaster"]
};
export const GROUP: Record<MbtiType, string> = {
  "ENTP": "Systems (NT)",
  "INTP": "Systems (NT)",
  "ENTJ": "Systems (NT)",
  "INTJ": "Systems (NT)",
  "ENFP": "Meaning (NF)",
  "INFP": "Meaning (NF)",
  "ENFJ": "Meaning (NF)",
  "INFJ": "Meaning (NF)",
  "ESTP": "Contact (SP)",
  "ISTP": "Contact (SP)",
  "ESTJ": "Order (SJ)",
  "ISTJ": "Order (SJ)",
  "ESFP": "Contact (SP)",
  "ISFP": "Contact (SP)",
  "ESFJ": "Order (SJ)",
  "ISFJ": "Order (SJ)"
};
export const INTERACTION_STYLE: Record<MbtiType, string> = {
  "ENTP": "Rallies",
  "INTP": "Steadies",
  "ENTJ": "Directs",
  "INTJ": "Navigates",
  "ENFP": "Rallies",
  "INFP": "Steadies",
  "ENFJ": "Directs",
  "INFJ": "Navigates",
  "ESTP": "Directs",
  "ISTP": "Navigates",
  "ESTJ": "Directs",
  "ISTJ": "Navigates",
  "ESFP": "Rallies",
  "ISFP": "Steadies",
  "ESFJ": "Rallies",
  "ISFJ": "Steadies"
};
/**
 * One of four borrowed erotic-attitude labels per type — Playful/Pursued/
 * Pursuing/Caring. This is NOT part of Octant's own model: Octant's own
 * romantic-dynamics reading is derived from Complement/Catalyst/Cave/Animal
 * — see engine/romance.ts, used for typeFacts()/pairFacts() and everywhere
 * the app answers about romance on its own authority. This table exists
 * only as raw data for engine/translation.ts (the one module allowed to
 * name and attribute a borrowed system) to attach a "known elsewhere as"
 * row to — never import this directly for display; import
 * romanceElsewhere() from translation.ts instead.
 */
export const EROTIC_ATTITUDE: Record<MbtiType, string> = {
  "ENTP": "Playful",
  "INTP": "Playful",
  "ENTJ": "Pursued",
  "INTJ": "Pursued",
  "ENFP": "Playful",
  "INFP": "Playful",
  "ENFJ": "Pursued",
  "INFJ": "Pursued",
  "ESTP": "Pursuing",
  "ISTP": "Pursuing",
  "ESTJ": "Caring",
  "ISTJ": "Caring",
  "ESFP": "Pursuing",
  "ISFP": "Pursuing",
  "ESFJ": "Caring",
  "ISFJ": "Caring"
};
export const VIRTUE_VICE: Record<MbtiType, [string, string]> = {
  "ENTP": [
    "Earnestness",
    "Illusion"
  ],
  "INTP": [
    "Attentiveness",
    "Apathy"
  ],
  "ENTJ": [
    "Candor",
    "Tyranny"
  ],
  "INTJ": [
    "Reverence",
    "Depravity"
  ],
  "ENFP": [
    "Charity",
    "Depravity"
  ],
  "INFP": [
    "Devotion",
    "Treachery"
  ],
  "ENFJ": [
    "Compassion",
    "Manipulation"
  ],
  "INFJ": [
    "Integrity",
    "Corruption"
  ],
  "ESTP": [
    "Modesty",
    "Arrogance"
  ],
  "ISTP": [
    "Diligence",
    "Sloth"
  ],
  "ESTJ": [
    "Altruism",
    "Greed"
  ],
  "ISTJ": [
    "Honesty",
    "Deceit"
  ],
  "ESFP": [
    "Forgiveness",
    "Vengeance"
  ],
  "ISFP": [
    "Industry",
    "Idleness"
  ],
  "ESFJ": [
    "Caring",
    "Cruelty"
  ],
  "ISFJ": [
    "Faith",
    "Fear"
  ]
};

export interface Behavioural {
  motivation: string; decisionStyle: string; commsStyle: string;
  persuasionTrigger: string; rapportBuilder: string; conflictStyle: string;
  stressResponse: string; trustBuilder: string; dealBreaker: string; commsFlaw: string;
}
export const BEHAVIOURAL: Record<MbtiType, Behavioural> = {
  "ENTP": {
    "motivation": "Innovation",
    "decisionStyle": "Logical analysis",
    "commsStyle": "Debating",
    "persuasionTrigger": "Challenge their ideas",
    "rapportBuilder": "Brainstorm together",
    "conflictStyle": "Avoidance",
    "stressResponse": "Withdrawal",
    "trustBuilder": "Consistency",
    "dealBreaker": "Micromanagement",
    "commsFlaw": "Overly blunt"
  },
  "INTP": {
    "motivation": "Understanding",
    "decisionStyle": "Objective logic",
    "commsStyle": "Precise",
    "persuasionTrigger": "Appeal to logic",
    "rapportBuilder": "Share theories",
    "conflictStyle": "Analytical",
    "stressResponse": "Isolation",
    "trustBuilder": "Logic",
    "dealBreaker": "Emotional appeals",
    "commsFlaw": "Too abstract"
  },
  "ENTJ": {
    "motivation": "Achievement",
    "decisionStyle": "Strategic",
    "commsStyle": "Direct",
    "persuasionTrigger": "Focus on efficiency",
    "rapportBuilder": "Respect their time",
    "conflictStyle": "Direct",
    "stressResponse": "Action",
    "trustBuilder": "Competence",
    "dealBreaker": "Inefficiency",
    "commsFlaw": "Impatient"
  },
  "INTJ": {
    "motivation": "Competence",
    "decisionStyle": "Analytical",
    "commsStyle": "Conceptual",
    "persuasionTrigger": "Present a vision",
    "rapportBuilder": "Acknowledge expertise",
    "conflictStyle": "Strategic",
    "stressResponse": "Planning",
    "trustBuilder": "Reliability",
    "dealBreaker": "Incompetence",
    "commsFlaw": "Condescending"
  },
  "ENFP": {
    "motivation": "Authenticity",
    "decisionStyle": "Value-driven",
    "commsStyle": "Enthusiastic",
    "persuasionTrigger": "Appeal to morals",
    "rapportBuilder": "Explore possibilities",
    "conflictStyle": "Collaborative",
    "stressResponse": "Brainstorming",
    "trustBuilder": "Authenticity",
    "dealBreaker": "Fake behaviour",
    "commsFlaw": "Rambling"
  },
  "INFP": {
    "motivation": "Harmony",
    "decisionStyle": "Idealistic",
    "commsStyle": "Empathetic",
    "persuasionTrigger": "Validate feelings",
    "rapportBuilder": "Listen deeply",
    "conflictStyle": "Empathetic",
    "stressResponse": "Emotional outbursts",
    "trustBuilder": "Validation",
    "dealBreaker": "Cruelty",
    "commsFlaw": "Passive-aggressive"
  },
  "ENFJ": {
    "motivation": "Connection",
    "decisionStyle": "Consensus",
    "commsStyle": "Expressive",
    "persuasionTrigger": "Focus on people",
    "rapportBuilder": "Show appreciation",
    "conflictStyle": "Harmonising",
    "stressResponse": "Seeking support",
    "trustBuilder": "Appreciation",
    "dealBreaker": "Selfishness",
    "commsFlaw": "Overly emotional"
  },
  "INFJ": {
    "motivation": "Meaning",
    "decisionStyle": "Intuitive",
    "commsStyle": "Insightful",
    "persuasionTrigger": "Connect on a deep level",
    "rapportBuilder": "Share a vision",
    "conflictStyle": "Insightful",
    "stressResponse": "Retreating",
    "trustBuilder": "Deep connection",
    "dealBreaker": "Superficiality",
    "commsFlaw": "Cryptic"
  },
  "ESTP": {
    "motivation": "Action",
    "decisionStyle": "Pragmatic",
    "commsStyle": "Direct",
    "persuasionTrigger": "Focus on immediate results",
    "rapportBuilder": "Be spontaneous",
    "conflictStyle": "Pragmatic",
    "stressResponse": "Action",
    "trustBuilder": "Results",
    "dealBreaker": "Boredom",
    "commsFlaw": "Too blunt"
  },
  "ISTP": {
    "motivation": "Autonomy",
    "decisionStyle": "Tactical",
    "commsStyle": "Concise",
    "persuasionTrigger": "Provide practical solutions",
    "rapportBuilder": "Give them space",
    "conflictStyle": "Tactical",
    "stressResponse": "Problem-solving",
    "trustBuilder": "Space",
    "dealBreaker": "Clinginess",
    "commsFlaw": "Uncommunicative"
  },
  "ESTJ": {
    "motivation": "Order",
    "decisionStyle": "Practical",
    "commsStyle": "Authoritative",
    "persuasionTrigger": "Use facts and data",
    "rapportBuilder": "Follow the rules",
    "conflictStyle": "Authoritative",
    "stressResponse": "Taking control",
    "trustBuilder": "Following rules",
    "dealBreaker": "Chaos",
    "commsFlaw": "Rigid"
  },
  "ISTJ": {
    "motivation": "Stability",
    "decisionStyle": "Methodical",
    "commsStyle": "Factual",
    "persuasionTrigger": "Provide evidence",
    "rapportBuilder": "Be reliable",
    "conflictStyle": "Methodical",
    "stressResponse": "Sticking to routine",
    "trustBuilder": "Evidence",
    "dealBreaker": "Unreliability",
    "commsFlaw": "Too detailed"
  },
  "ESFP": {
    "motivation": "Experience",
    "decisionStyle": "Spontaneous",
    "commsStyle": "Engaging",
    "persuasionTrigger": "Keep it fun",
    "rapportBuilder": "Be enthusiastic",
    "conflictStyle": "Spontaneous",
    "stressResponse": "Distraction",
    "trustBuilder": "Fun",
    "dealBreaker": "Negativity",
    "commsFlaw": "Scattered"
  },
  "ISFP": {
    "motivation": "Freedom",
    "decisionStyle": "Flexible",
    "commsStyle": "Gentle",
    "persuasionTrigger": "Respect their individuality",
    "rapportBuilder": "Be authentic",
    "conflictStyle": "Flexible",
    "stressResponse": "Escaping",
    "trustBuilder": "Individuality",
    "dealBreaker": "Control",
    "commsFlaw": "Too quiet"
  },
  "ESFJ": {
    "motivation": "Belonging",
    "decisionStyle": "Traditional",
    "commsStyle": "Warm",
    "persuasionTrigger": "Focus on community",
    "rapportBuilder": "Be polite and helpful",
    "conflictStyle": "Accommodating",
    "stressResponse": "Seeking reassurance",
    "trustBuilder": "Community",
    "dealBreaker": "Disloyalty",
    "commsFlaw": "Gossiping"
  },
  "ISFJ": {
    "motivation": "Security",
    "decisionStyle": "Cautious",
    "commsStyle": "Supportive",
    "persuasionTrigger": "Offer practical help",
    "rapportBuilder": "Show gratitude",
    "conflictStyle": "Supportive",
    "stressResponse": "Worrying",
    "trustBuilder": "Practical help",
    "dealBreaker": "Instability",
    "commsFlaw": "Complaining"
  }
};

export const COIN_LABELS = [
  "Observer vs Decider",
  "Identity vs Tribe",
  "Organize vs Gather",
  "Thinking vs Feeling",
  "Sensing vs iNtuition",
  "Initiating vs Responding",
  "Direct vs Informative",
  "Control vs Movement"
] as const;
export const DETERMINING = [
  0,
  2,
  3,
  4
] as const;
export const CONFIRMING = [
  1,
  5,
  6,
  7
] as const;

export const FN_FULL: Record<Fn, string> = {
  "Ne": "Extraverted Intuition",
  "Ni": "Introverted Intuition",
  "Se": "Extraverted Sensing",
  "Si": "Introverted Sensing",
  "Te": "Extraverted Thinking",
  "Ti": "Introverted Thinking",
  "Fe": "Extraverted Feeling",
  "Fi": "Introverted Feeling"
};
export const SLOT_NAMES = ["Lead","Support","Delight","Cave","Doubt","Scold","Blind spot","Dread"] as const;
export const SLOT_TAGS  = ["Power","Responsibility","Innocence","Fear","Worry","Cynicism","Blindspot","Hate"] as const;
export type SlotName = (typeof SLOT_NAMES)[number];
