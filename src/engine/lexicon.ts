import { alpha, beta, omega, quadra, gate, stack, type MbtiType } from "./core";
import { ops, coins, ANIMAL_LABEL } from "./ops";
import { PLAIN_BY_ID } from "./plain";
import {
  REL_NAME, REL_DEF, REL_SCORE, FN_FULL, COIN_LABELS,
  INTERACTION_STYLE, ROMANCE, GROUP, type Fn, type RelCode,
} from "./data";

/** The kind of thing an entry is. Drives filtering and the pairing logic. */
export type Category =
  | "Function" | "Archetype" | "Relation" | "Quadra" | "Animal"
  | "Romance Style" | "Interaction Style" | "Gate" | "Coin"
  | "Temperament" | "Concept";

/**
 * One defined term: plain gloss, short definition, full definition, and where it sits
 * in this app's own model.
 */
export interface Entry {
  id: string;
  term: string;
  category: Category;
  /** Plain English, no vocabulary. Attached from plain.ts when ENTRIES is built. */
  plain: string;
  short: string;
  definition: string;
  inSystem?: string;
  seeAlso?: string[];
}

/** What happens when two terms of the same category meet. */
export interface Pairing { headline: string; body: string }

/** Authored without `plain`; it is attached from PLAIN_BY_ID when ENTRIES is built. */
type Draft = Omit<Entry, "plain">;
/**
 * Identity helper that types an entry draft at the point of authoring, so a typo in a
 * field name fails here rather than silently producing an entry with a missing field.
 */
const E = (e: Draft) => e;

/* ══════════════════════════════ FUNCTIONS ══════════════════════════════ */
const FUNCTIONS: Draft[] = [
  E({ id: "ne", term: "Ne", category: "Function",
    short: "Extraverted Intuition — branching possibility read off the outside world.",
    definition:
      "Perceives the field of what a thing could become. Ne takes any object, person or situation and fans it into alternatives, analogies and adjacent possibilities, then keeps every branch live rather than collapsing to one. It is a perceiving function, so it gathers rather than concludes; the pleasure is in the proliferation itself. Its characteristic failure is never landing: an enormous inventory of openings and nothing carried to completion.",
    inSystem: "Extraverted observer. Pairs with an introverted decider (Ti or Fi) to form an Absorb-primary signature. Its attitude-flip is Ni; its axis opposite is Si.",
    seeAlso: ["ni", "si", "observer", "gather"] }),
  E({ id: "ni", term: "Ni", category: "Function",
    short: "Introverted Intuition — convergence on the single line a situation is already running down.",
    definition:
      "Perceives where things are heading. Ni takes a mass of impressions and compresses them into one reading of the underlying trajectory, arriving as a conviction rather than a chain of reasoning. Because the process is largely unconscious, the conclusion often cannot be shown — only asserted, and then defended after the fact. Its failure is premature certainty: the vision arrives whole and resists correction by anything the present is actually doing.",
    inSystem: "Introverted observer. Pairs with an extraverted decider (Te or Fe) to form a Broadcast-primary signature.",
    seeAlso: ["ne", "se", "observer", "organize"] }),
  E({ id: "se", term: "Se", category: "Function",
    short: "Extraverted Sensing — the physical present, read at full resolution and in real time.",
    definition:
      "Perceives what is concretely there, now. Se registers the room's actual physics — force, distance, tempo, who is about to move — and reacts inside the window rather than after it. It is the least mediated function: no model sits between the sensor and the world. Its failure is the tyranny of the immediate, where the next vivid thing displaces whatever was being built.",
    inSystem: "Extraverted observer. Its attitude-flip is Si; its axis opposite is Ni.",
    seeAlso: ["si", "ni", "observer", "gather"] }),
  E({ id: "si", term: "Si", category: "Function",
    short: "Introverted Sensing — continuity, precedent, and the body's own record.",
    definition:
      "Perceives the present against everything the same body has already met. Si holds a detailed internal register of how things have gone before — procedures that worked, foods that disagreed, the exact way this was done last time — and reads any new situation as a deviation from that record. It is what makes institutions and habits possible. Its failure is that the record becomes the authority: what is unprecedented is treated as unsafe rather than merely unfamiliar.",
    inSystem: "Introverted observer. As a Cave it produces the Gate of Obligation in ENTP and ENFP.",
    seeAlso: ["se", "ne", "observer", "organize"] }),
  E({ id: "te", term: "Te", category: "Function",
    short: "Extraverted Thinking — ordering the outside world toward a stated objective.",
    definition:
      "Decides by arranging external reality efficiently. Te asks what the measurable objective is and what sequence of resources, people and steps reaches it fastest, then imposes that sequence. It trusts what can be verified publicly — metrics, track record, results — over what can only be argued internally. Its failure is the unexamined goal: exquisite machinery driving toward an objective nobody checked was worth reaching.",
    inSystem: "Extraverted decider. Pairs with an introverted observer (Ni or Si) to form a Broadcast-primary signature.",
    seeAlso: ["ti", "fi", "decider", "tribe"] }),
  E({ id: "ti", term: "Ti", category: "Function",
    short: "Introverted Thinking — a private framework that must remain free of contradiction.",
    definition:
      "Decides by internal consistency. Ti builds a model of how something actually works and tests every new input against it, discarding whatever will not fit. Precision matters more than consensus: a definition that most people accept but that leaks under pressure is worse than useless. Its failure is that the model can become the point — refinement continues indefinitely and nothing is ever released into the world where it could be wrong.",
    inSystem: "Introverted decider. Pairs with an extraverted observer (Ne or Se) to form an Absorb-primary signature.",
    seeAlso: ["te", "fe", "decider", "identity"] }),
  E({ id: "fe", term: "Fe", category: "Function",
    short: "Extraverted Feeling — reading and then setting the emotional state of a group.",
    definition:
      "Decides by what the collective needs. Fe registers the room's mood as a fact about the world, holds itself responsible for it, and actively moves it — warming, defusing, including, escalating when escalation is what the group requires. It treats shared values as real constraints rather than preferences. Its failure is that harmony becomes the criterion: the true thing goes unsaid because saying it would cost the room.",
    inSystem: "Extraverted decider. As a Cave it produces the Gate of the Tribe in INTP and ISTP.",
    seeAlso: ["fi", "ti", "decider", "tribe"] }),
  E({ id: "fi", term: "Fi", category: "Function",
    short: "Introverted Feeling — a private register of worth that does not require agreement.",
    definition:
      "Decides by internal value. Fi holds a finely graded sense of what is right, true and worth caring about, calibrated by direct experience rather than argument, and it does not need the tribe to ratify it. This is what makes conviction possible under social pressure. Its failure is unfalsifiability: because the judgement is felt rather than reasoned, it can be neither examined nor explained, only defended or withdrawn.",
    inSystem: "Introverted decider. As a Cave it produces the Gate of the Self in ENTJ and ESTJ.",
    seeAlso: ["fe", "te", "decider", "identity"] }),
];

/* ══════════════════════════════ ARCHETYPES ══════════════════════════════ */
const ARCHETYPES: Draft[] = [
  E({ id: "hero", term: "Lead", category: "Archetype",
    short: "Slot 1. The function you are best at and most identified with.",
    definition:
      "The apex of the conscious stack: fastest, most confident, least effortful, and the one you would name if asked what you are good at. It operates optimistically and with awareness, which is exactly what makes it dangerous — it will keep going long after it should have stopped, because from the inside its competence feels total. The Support exists to brake it.",
    seeAlso: ["parent", "ego", "inferior"] }),
  E({ id: "parent", term: "Support", category: "Archetype",
    short: "Slot 2. The responsible, pessimistic filter that keeps the Lead from doing damage.",
    definition:
      "Conscious and aware like the Lead, but cautious where the Lead is expansive. The Support takes responsibility for consequences — it prunes, verifies and protects, including protecting other people from the Lead's momentum. It is the function you use when you are being careful on someone else's behalf, and it is tiring in a way the Lead is not.",
    seeAlso: ["hero", "child", "ego"] }),
  E({ id: "child", term: "Delight", category: "Archetype",
    short: "Slot 3. Playful, sincere, and easily wounded. The most direct way in.",
    definition:
      "Conscious but unaware — used with genuine delight and no maturity requirement. The Delight is where a person is most charming and least defended, which makes it the best point of contact and the cruellest place to attack. Engage someone here and they open; mock them here and the shutter comes down for good.",
    seeAlso: ["parent", "inferior", "ego"] }),
  E({ id: "inferior", term: "Cave", category: "Archetype",
    short: "Slot 4. The fear. Also the doorway to everything the type is not yet.",
    definition:
      "The gateway to the subconscious: the function a person feels chronically inadequate at and quietly organises their life to avoid. Under stress it erupts in crude, exaggerated form. Faced deliberately rather than avoided, it converts into what this model calls aspirational power — which is why every growth gate in this system is named for a Cave.",
    inSystem: "Determines the type's Gate. Their Counterpart supplies precisely this function as their Lead.",
    seeAlso: ["gate", "rel-du", "child", "shadow"] }),
  E({ id: "nemesis", term: "Doubt", category: "Archetype",
    short: "Slot 5. The Lead's attitude-flip, running as worry.",
    definition:
      "The first shadow position: aware but pessimistic, and in constant orbit around the Lead. Where the Lead is certain, the Doubt supplies the alternative reading and the reason it might not work. It is genuinely useful — it is the type's own internal opposition — but it arrives as anxiety rather than analysis, so it is usually experienced as an obstacle rather than a resource.",
    inSystem: "The two types whose Lead is your Doubt function are your Catalysts.",
    seeAlso: ["hero", "catalyst", "shadow"] }),
  E({ id: "critic", term: "Scold", category: "Archetype",
    short: "Slot 6. The senile elder. Analytical, harsh, demands proof of everything.",
    definition:
      "Shadow, aware, pessimistic. The Scold is where a person is most cuttingly evaluative of both themselves and others, and where they demand a standard of verification they would never apply to their Lead. It carries real discernment and terrible delivery.",
    seeAlso: ["parent", "shadow"] }),
  E({ id: "trickster", term: "Blind spot", category: "Archetype",
    short: "Slot 7. The blind spot you are confident you do not have.",
    definition:
      "Shadow, unaware, optimistic — the most treacherous position in the stack. The person is not merely bad here; they are unaware of being bad here, and will produce fluent-sounding output that is structurally wrong. Agreement obtained on someone's Blind spot is worth nothing, because they are not tracking the thing they think they are tracking.",
    inSystem: "Every playbook names the target's Blind spot explicitly, because it is where confirmation is least reliable.",
    seeAlso: ["child", "demon", "shadow"] }),
  E({ id: "demon", term: "Dread", category: "Archetype",
    short: "Slot 8. The lowest position. Emerges as destruction when the ego is genuinely threatened.",
    definition:
      "Shadow, unaware, pessimistic. Almost never visible, and when it appears the person is not being difficult — they are past the point of strategy. The Dread disregards every norm of its own function and operates from resentment. Cornering someone into it does not win the exchange; it ends the relationship.",
    seeAlso: ["trickster", "shadow", "inferior"] }),
];

/* ══════════════════════════════ QUADRAS ══════════════════════════════ */
/** Keyed by id, not by display term — the camp names are due to be renamed (Set D pass 3) and ids do not move; labels do. */
const QUADRA_ELEMENTS: Record<string, Fn[]> = {
  alpha: ["Ne", "Si", "Ti", "Fe"], beta: ["Se", "Ni", "Ti", "Fe"],
  gamma: ["Se", "Ni", "Te", "Fi"], delta: ["Ne", "Si", "Te", "Fi"],
};
const QUADRAS: Draft[] = [
  E({ id: "alpha", term: "Alpha", category: "Quadra",
    short: "Ne · Si · Ti · Fe. Open enquiry inside a comfortable, unhierarchical group.",
    definition:
      "ENTP, INTP, ESFJ, ISFJ. Ideas are floated for their own sake and nothing is off the table for discussion, but the emotional temperature of the group must stay warm — Fe holds the room while Ti takes the argument apart. Comfort, continuity and possibility are values; power, urgency and confrontation are not. Alpha groups generate a great deal and finish comparatively little.",
    inSystem: "Quadra membership is derived from the four functions in the ego block.",
    seeAlso: ["quadra", "gamma", "ne", "ti"] }),
  E({ id: "beta", term: "Beta", category: "Quadra",
    short: "Se · Ni · Ti · Fe. Conviction, hierarchy and intensity in the service of a vision.",
    definition:
      "ESTP, ISTP, ENFJ, INFJ. Beta reads the world as a place where force and belief decide outcomes: Ni supplies a single compelling reading of the future, Se acts on it now, Fe mobilises people around it. Loyalty, decisiveness and dramatic commitment are valued; detachment and hedging read as weakness. Beta groups cohere hard and can close to outsiders.",
    seeAlso: ["quadra", "delta", "se", "ni"] }),
  E({ id: "gamma", term: "Gamma", category: "Quadra",
    short: "Se · Ni · Te · Fi. Results, self-reliance, and loyalty earned rather than assumed.",
    definition:
      "ENTJ, INTJ, ESFP, ISFP. Gamma trusts what performs and what a person actually values, not what a group declares: Te measures, Fi judges privately, and neither defers to consensus. Long-horizon ambition sits beside blunt present-tense realism. Gamma groups are small, candid and unsentimental about people who do not deliver.",
    seeAlso: ["quadra", "alpha", "te", "fi"] }),
  E({ id: "delta", term: "Delta", category: "Quadra",
    short: "Ne · Si · Te · Fi. Competence, craft and quiet improvement of something that already works.",
    definition:
      "ENFP, INFP, ESTJ, ISTJ. Delta wants the work done properly by people who care about it: Si supplies standards, Te supplies method, Fi supplies the reason it matters, Ne keeps it from ossifying. Drama and hierarchy are unwelcome; sustained practical care is the highest value. Delta groups are durable and can be slow to admit when the thing they maintain has stopped being worth maintaining.",
    seeAlso: ["quadra", "beta", "si", "te"] }),
];

/* ══════════════════════════════ ANIMALS ══════════════════════════════ */
const ANIMALS: Draft[] = [
  E({ id: "play", term: "Charge", category: "Animal",
    short: "Both functions extraverted. Intake and output at once — the social, high-throughput current.",
    definition:
      "Everything pointed outward: gathering from the world and acting on it in the same motion. Charge is the current of engagement, appetite and visible activity. It is energising in bursts and depleting to sustain.",
    inSystem: "Always a middle current in this build. Its ordering against Settle is the deferred fine-switch layer.",
    seeAlso: ["sleep", "animal", "fine-coins"] }),
  E({ id: "blast", term: "Broadcast", category: "Animal",
    short: "Introverted observing + extraverted deciding. Directive, convergent, outcome-driven.",
    definition:
      "Energy that goes inward to read and outward to act. Broadcast forms a private conclusion and then moves the world to match it — the current of decisions announced and executed. It is the fastest route from perception to result and the least tolerant of open questions.",
    inSystem: "Every xxxJ type is Broadcast-primary; every xxxP type has Broadcast as its last current.",
    seeAlso: ["play", "animal", "demon-animal"] }),
  E({ id: "consume", term: "Absorb", category: "Animal",
    short: "Extraverted observing + introverted deciding. Interactive, exploratory, low-stakes.",
    definition:
      "Energy that goes outward to gather and inward to judge. Absorb engages the world for interest rather than outcome — trying things, seeing what happens, working out privately what it means. It is sociable without being directive, and it is the current most comfortable with an unfinished situation.",
    inSystem: "Every xxxP type is Absorb-primary; every xxxJ type has Absorb as its last current.",
    seeAlso: ["blast", "animal", "savior"] }),
  E({ id: "sleep", term: "Settle", category: "Animal",
    short: "Both functions introverted. Withdrawal into private processing.",
    definition:
      "Everything pointed inward: observing internally and deciding internally, with no external limb. Settle is where a person integrates, recovers and works things out unobserved. Starved of it, the other currents degrade.",
    inSystem: "Always a middle current in this build. Its ordering against Charge is deferred.",
    seeAlso: ["play", "animal", "fine-coins"] }),
];

/* ══════════════════════════════ ROMANCE STYLES ══════════════════════════════ */
const ROMANCE_STYLES: Draft[] = [
  E({ id: "infantile", term: "Playful", category: "Romance Style",
    short: "Relates through play. Wants delight and lightness, and resists being managed.",
    definition:
      "The Playful style approaches intimacy as shared play: teasing, novelty, silliness, and an ongoing refusal to make the relationship heavy. Care is expressed by being fun to be around and by keeping the other person entertained rather than by anticipating their needs. It wants to be enjoyed rather than looked after, and reads too much practical fussing as a loss of charge. Its blind side is logistics: a Playful partner can be genuinely devoted and still leave the shared life unadministered.",
    inSystem: "Held by the Alpha and Delta intuitives (ENTP, INTP, ENFP, INFP). Structurally complementary to Caring.",
    seeAlso: ["caregiver", "aggressor", "victim"] }),
  E({ id: "caregiver", term: "Caring", category: "Romance Style",
    short: "Relates through provision. Expresses love by noticing and supplying what is needed.",
    definition:
      "The Caring style approaches intimacy as tending: feeding, arranging, remembering, smoothing the practical world so the other person can be at ease in it. Affection is demonstrated rather than declared, and the relationship is made secure by being reliably maintained. It wants to be needed and trusted with the running of things. Its blind side is that provision can shade into control, and that a partner who never asks to be looked after can leave a Caring partner without a role.",
    inSystem: "Held by the Alpha and Delta sensors (ESTJ, ISTJ, ESFJ, ISFJ). Structurally complementary to Playful.",
    seeAlso: ["infantile", "aggressor", "victim"] }),
  E({ id: "aggressor", term: "Pursuing", category: "Romance Style",
    short: "Relates through pursuit. Direct, physical, and comfortable initiating.",
    definition:
      "The Pursuing style approaches intimacy by closing distance: claiming attention, initiating contact, making desire explicit rather than implied. It is confident about wanting and unembarrassed about showing it, and it reads hesitation as an invitation to be clearer rather than to retreat. Its blind side is calibration — the same directness that reads as thrilling to one partner reads as pressure to another, and a Pursuing partner often cannot tell the difference from the inside.",
    inSystem: "Held by the Beta and Gamma sensors (ESTP, ISTP, ESFP, ISFP). Structurally complementary to Pursued.",
    seeAlso: ["victim", "infantile", "caregiver"] }),
  E({ id: "victim", term: "Pursued", category: "Romance Style",
    short: "Relates through surrender. Drawn to strength, ambivalence and being pursued.",
    definition:
      "The Pursued style approaches intimacy by yielding to someone whose force it respects: it wants to be sought, convinced and somewhat overwhelmed, and it charges the relationship with a productive tension rather than resolving it. Complexity, ambivalence and a degree of unattainability are part of the appeal. Its blind side is that the same tension can be manufactured where it is not warranted, turning a settled relationship into a drama it did not need.",
    inSystem: "Held by the Beta and Gamma intuitives (ENTJ, INTJ, ENFJ, INFJ). Structurally complementary to Pursuing.",
    seeAlso: ["aggressor", "infantile", "caregiver"] }),
];

/* ══════════════════════════════ INTERACTION STYLES ══════════════════════════════ */
const INTERACTION_STYLES: Draft[] = [
  E({ id: "in-charge", term: "Directs", category: "Interaction Style",
    short: "Initiating + Directing. Moves first and says what to do.",
    definition:
      "Takes the lead by default and communicates in instructions rather than options. It sets the pace, assigns the work and closes the discussion, and is comfortable being accountable for having done so. It is fast and unambiguous. Its cost is that it fills the room: quieter or informing styles read the same behaviour as steamrolling and stop contributing.",
    inSystem: "ENTJ, ENFJ, ESTP, ESTJ. Derived from the Initiating and Direct switches.",
    seeAlso: ["chart-the-course", "get-things-going", "behind-the-scenes"] }),
  E({ id: "chart-the-course", term: "Navigates", category: "Interaction Style",
    short: "Responding + Directing. Waits, then tells you the plan.",
    definition:
      "Does not open the conversation, but when it speaks it speaks in conclusions. This style wants a route mapped before movement begins and is uncomfortable improvising in public. It is precise and low-noise. Its cost is that the deliberation is invisible, so others read the silence as agreement and the eventual directive as arriving from nowhere.",
    inSystem: "INTJ, INFJ, ISTP, ISTJ. Derived from the Responding and Direct switches.",
    seeAlso: ["in-charge", "behind-the-scenes", "get-things-going"] }),
  E({ id: "get-things-going", term: "Rallies", category: "Interaction Style",
    short: "Initiating + Informing. Opens the conversation and hands you the context.",
    definition:
      "Starts things, brings energy, and communicates by supplying background so the other person can choose. It is enthusiastic and inclusive and treats a decision as something to be arrived at together. Its cost is that the point can go missing: directing styles hear all context and no instruction, and conclude nothing was actually asked for.",
    inSystem: "ENTP, ENFP, ESFP, ESFJ. Derived from the Initiating and Informative switches.",
    seeAlso: ["behind-the-scenes", "in-charge", "chart-the-course"] }),
  E({ id: "behind-the-scenes", term: "Steadies", category: "Interaction Style",
    short: "Responding + Informing. Waits, then offers rather than instructs.",
    definition:
      "Neither opens nor directs. It contributes by improving what already exists, offering information sideways and leaving the other person entirely free to act on it. It is the least imposing style and often the most quietly consequential. Its cost is invisibility: the contribution is real, unattributed, and easily talked over.",
    inSystem: "INTP, INFP, ISFP, ISFJ. Derived from the Responding and Informative switches.",
    seeAlso: ["get-things-going", "chart-the-course", "in-charge"] }),
];

/* ══════════════════════════════ GATES ══════════════════════════════ */
const GATES: Draft[] = [
  E({ id: "gate-of-chaos", term: "Gate of Chaos", category: "Gate",
    short: "IxxJ. Fear of the unplanned. Opens onto freedom.",
    definition:
      "Held by INTJ, INFJ, ISTJ and ISFJ, whose Cave is Se or Ne. The type organises life so that nothing arrives unprepared for, and experiences the unforeseen as a threat to competence rather than as ordinary weather. Surrendering some control — acting without the plan finished, letting an unproven possibility stand — is what converts the fear into adaptability.",
    seeAlso: ["inferior", "gate-of-obligation", "se", "ne"] }),
  E({ id: "gate-of-obligation", term: "Gate of Obligation", category: "Gate",
    short: "ExxP. Fear of being tied down. Opens onto legacy.",
    definition:
      "Held by ENTP, ENFP, ESTP and ESFP, whose Cave is Si or Ni. The type keeps options open and exits available, and experiences commitment as a narrowing rather than a deepening. Deliberately binding yourself to one line and staying past the point where it stops being interesting is what converts the fear into something that compounds.",
    seeAlso: ["inferior", "gate-of-chaos", "si", "ni"] }),
  E({ id: "gate-of-the-tribe", term: "Gate of the Tribe", category: "Gate",
    short: "IxxP. Fear of the group's verdict. Opens onto leadership.",
    definition:
      "Held by INTP, INFP, ISTP and ISFP, whose Cave is Fe or Te. The type keeps its work private rather than risk it being judged inadequate in public, and mistakes the avoidance for preference. Stepping onto the stage — letting the model land with people, being measured externally — is what converts the fear into influence.",
    seeAlso: ["inferior", "gate-of-the-self", "fe", "te"] }),
  E({ id: "gate-of-the-self", term: "Gate of the Self", category: "Gate",
    short: "ExxJ. Fear of the empty interior. Opens onto authenticity.",
    definition:
      "Held by ENTJ, ENFJ, ESTJ and ESFJ, whose Cave is Fi or Ti. The type stays in motion partly to avoid finding out whether there is anything underneath the achievement, and reads unstructured solitude as waste. Sitting alone in the dark long enough to locate what is actually valued is what converts the fear into a self worth being.",
    seeAlso: ["inferior", "gate-of-the-tribe", "fi", "ti"] }),
];

/* ══════════════════════════════ TEMPERAMENTS ══════════════════════════════ */
const TEMPERAMENTS: Draft[] = [
  E({ id: "nt", term: "Systems (NT)", category: "Temperament",
    short: "Competence. Wants to understand the system well enough to command it.",
    definition: "ENTP, INTP, ENTJ, INTJ. Organised around mastery and models: the point of a thing is to understand its mechanism well enough to predict or command it. Status is conferred by being right and by knowing why, and competence is assumed until disproved. Impatient with claims that cannot be defended, and with process observed for its own sake.",
    seeAlso: ["nf", "sj", "sp"] }),
  E({ id: "nf", term: "Meaning (NF)", category: "Temperament",
    short: "Meaning. Wants people and work to be authentic to something.",
    definition: "ENFP, INFP, ENFJ, INFJ. Organised around significance and human potential: work is worth doing if it means something and if it leaves people better than it found them. Status is conferred by integrity rather than output. Impatient with the merely procedural, and with competence deployed toward nothing in particular.",
    seeAlso: ["nt", "sj", "sp"] }),
  E({ id: "sj", term: "Order (SJ)", category: "Temperament",
    short: "Stewardship. Wants the thing to keep working after everyone goes home.",
    definition: "ESTJ, ISTJ, ESFJ, ISFJ. Organised around duty and continuity: someone has to keep the thing running, and that someone is reasonably assumed to be you. Status is conferred by reliability over time rather than by brilliance. Impatient with novelty that has not proven itself and with people who leave the clearing-up to others.",
    seeAlso: ["sp", "nt", "nf"] }),
  E({ id: "sp", term: "Contact (SP)", category: "Temperament",
    short: "Effect. Wants contact with the real thing, now.",
    definition: "ESTP, ISTP, ESFP, ISFP. Organised around action and skill: contact with the real material, now, done well. Status is conferred by visible capability under live conditions rather than by credential or plan. Impatient with abstraction that never touches ground, and with meetings held about work instead of work.",
    seeAlso: ["sj", "nt", "nf"] }),
];

/* ══════════════════════════════ COIN POLES ══════════════════════════════ */
const COIN_POLES: [string, string, string, string][] = [
  ["observer", "Observer", "The leading function perceives rather than judges.",
   "The type's dominant function is Ne, Ni, Se or Si. Perception leads and judgement follows, so the person is comparatively balanced between self and tribe but gets stuck between control and chaos. Narrows to IxxJ or ExxP."],
  ["decider", "Decider", "The leading function judges rather than perceives.",
   "The type's dominant function is Te, Ti, Fe or Fi. Judgement leads and perception follows, so the person is comparatively balanced between control and chaos but gets stuck between self and tribe. Narrows to IxxP or ExxJ."],
  ["identity", "Identity", "The anchor decider is introverted — Ti or Fi.",
   "Personal reasons and values are settled first, and the tribe's are consulted afterwards. This is not selfishness; it is the order of operations. Structurally equivalent to the Gather pole, because anchors must run opposite attitudes."],
  ["tribe", "Tribe", "The anchor decider is extraverted — Te or Fe.",
   "The group's reasons and values are read first, and personal ones are worked out against them. Structurally equivalent to the Organize pole."],
  ["organize", "Organize", "The anchor observer is introverted — Ni or Si.",
   "Answers come from working over material already held, with new input gathered afterwards. Depth before breadth."],
  ["gather", "Gather", "The anchor observer is extraverted — Ne or Se.",
   "Answers come from collecting new material first, and organising it afterwards. Breadth before depth."],
  ["thinking", "Thinking", "The anchor decider is Te or Ti.",
   "Reasons are established before priorities: the type works out what is true or how something functions, and lets that constrain what is worth valuing. Not an absence of feeling — an order of operations, in which the judgement about worth arrives second and is expected to survive the reasoning."],
  ["feeling", "Feeling", "The anchor decider is Fe or Fi.",
   "Priorities are established before reasons. What matters constrains what is worth establishing."],
  ["sensing", "Sensing", "The anchor observer is Se or Si.",
   "Concrete, verifiable material is taken first; abstract connection is drawn from it afterwards."],
  ["intuition", "iNtuition", "The anchor observer is Ne or Ni.",
   "Abstract connection is taken first: the type registers patterns, implications and resemblances before it registers the particulars, and then goes looking for the concrete detail that confirms or breaks them. The risk is a confident structure resting on facts nobody checked."],
  ["initiating", "Initiating", "Moves toward others without waiting.",
   "Starts conversations, changes subject comfortably, acts before being invited. Maps to extraversion."],
  ["responding", "Responding", "Waits to be approached, and finishes a thought before moving.",
   "Waits to be approached and finishes a thought before moving to the next one. Responding types are not slower thinkers; they complete more of the thinking before any of it becomes audible, which initiating types routinely misread as having nothing to contribute. Maps to introversion."],
  ["direct", "Direct", "Says the thing, in fewer words, as an instruction.",
   "Communicates conclusions and expects them to be actionable. Held by the NJ, STP and STJ types."],
  ["informative", "Informative", "Supplies context and leaves the choice open.",
   "Communicates background so the other person can decide, which directing types can hear as no request having been made. Held by the NP and SF types."],
  ["control", "Control", "Optimises for the outcome being right.",
   "Will slow down to get it exactly correct. A derived coin: true when Initiating and Direct agree."],
  ["movement", "Movement", "Optimises for continued progress.",
   "Keeps things moving and repairs later. A derived coin: true when Initiating and Direct disagree."],
];
const COINS_E: Draft[] = COIN_POLES.map(([id, term, short, definition], i) =>
  E({ id, term, category: "Coin", short, definition,
      inSystem: `Coin ${Math.floor(i / 2) + 1} — ${COIN_LABELS[Math.floor(i / 2)]}. ` +
        ([0, 2, 3, 4].includes(Math.floor(i / 2)) ? "Determining." : "Confirming: derivable from the determining switches."),
      seeAlso: ["coin", "savior"] }));

/* ══════════════════════════════ CONCEPTS ══════════════════════════════ */
const CONCEPTS: Draft[] = [
  E({ id: "complement", term: "Complement", category: "Concept",
    short: "Your Counterpart and your Spark partner. They supply the function you fear.",
    definition:
      "The two types whose strengths sit exactly where your conscious stack is weakest. Your Counterpart leads with your Cave; your Spark partner leads with the function that mobilises you. Time with a Complement is restful rather than exciting: they handle, without effort or resentment, the thing you have organised your life around avoiding.",
    inSystem: "Derived as {Counterpart, Spark}. This is what the network layer optimises on, because it measures structural fit rather than felt chemistry.",
    seeAlso: ["catalyst", "rel-du", "rel-ac", "inferior"] }),
  E({ id: "catalyst", term: "Catalyst", category: "Concept",
    short: "The two types whose Lead is your Doubt. Stimulating rather than restful.",
    definition:
      "Your Doubt is your Lead's attitude-flip — the perspective you already generate internally, as worry, and reflexively argue with. The two types who lead with it hand you that perspective from outside, fully formed and unapologetic. The effect is energising and slightly abrasive: you want what they have and resist it at the same time. An ENTP wants convergence, but convergence is Ni, and Ni is the Doubt.",
    inSystem: "Derived as the two types whose dominant equals your slot 5. This always resolves to your Damper and False fit partners. It is what the original workbook's 'Sidekicks' column was reaching for.",
    seeAlso: ["complement", "nemesis", "rel-ex", "rel-mi"] }),
  E({ id: "ease", term: "Ease", category: "Concept",
    short: "A 0–100 modelling score for how one type experiences another. Directional.",
    definition:
      "A ladder over the sixteen relations, monotone in structural comfort. It is a modelling choice rather than a measurement, and it is deliberately directional: four relations are asymmetric, so the score one person gives is not the score they receive. Any single 'compatibility number' for a pair is concealing that.",
    inSystem: "Derived from the relation code, never stored separately, so the two cannot disagree.",
    seeAlso: ["rel-sr", "rel-be", "relation"] }),
  E({ id: "dual-lighting", term: "The two readings", category: "Concept",
    short: "Holding the two growth readings unreconciled, because they disagree.",
    definition:
      "One reading runs an eight-function stack across all four letters and puts the weak point at the Cave; the exchange overlay tracks two letters across four orientations and marks Delight and Cave together. They therefore locate a type's weak point in different places and prescribe different growth. Fusing them produces incoherence, so this system carries both and lets the divergence stand as content.",
    inSystem: "The wiring schematic marks the Cave as its own region and the demon-animal loop as a wider open circuit. They are in different slots.",
    seeAlso: ["inferior", "demon-animal", "savior"] }),
  E({ id: "savior", term: "Anchor", category: "Concept",
    short: "The two functions a type actually uses well — one observer, one decider.",
    definition:
      "The anchor pair is the type's dominant and auxiliary, one perceiving and one judging, always in opposite attitudes. Their combination gives the primary current. The attitude-flipped counterparts are the flinches.",
    seeAlso: ["demon-animal", "animal", "dual-lighting"] }),
  E({ id: "demon-animal", term: "Last current", category: "Concept",
    short: "The double-demon loop: the energy pattern a type is worst at sustaining.",
    definition:
      "Formed from the attitude-flips of both anchors. Because the anchors always run opposite attitudes, the last current is always Absorb or Broadcast — never a middle one — which is why every xxxP type ends on Broadcast and every xxxJ type ends on Absorb.",
    inSystem: "Rendered as the open circuit in the wiring schematic.",
    seeAlso: ["savior", "animal", "dual-lighting"] }),
  E({ id: "four-sides", term: "Four Sides of the Mind", category: "Concept",
    short: "Ego, Subconscious, Unconscious and Superego — four whole types inside one person.",
    definition:
      "The reading in which each person carries four complete type-patterns: the Ego they identify with, the Subconscious they aspire to (their Counterpart), the Unconscious that runs when the Ego is exhausted (their Damper) and the Superego they perform under threat. Useful as a reading of state rather than of identity.",
    seeAlso: ["ego", "shadow", "rel-du"] }),
  E({ id: "ego", term: "Ego", category: "Concept",
    short: "Slots 1–4. The conscious stack a person identifies with.",
    definition: "Lead, Support, Delight and Cave. Two aware positions and two unaware, two optimistic and two pessimistic. This is the part of the wiring a person will describe if asked who they are.",
    seeAlso: ["shadow", "hero", "inferior"] }),
  E({ id: "shadow", term: "Shadow", category: "Concept",
    short: "Slots 5–8. The same four functions, attitudes flipped, running mostly unwatched.",
    definition: "Doubt, Scold, Blind spot and Dread — the attitude-flips of the ego block. Rarely chosen and usually visible only under stress, but continuously operating.",
    seeAlso: ["ego", "nemesis", "trickster", "demon"] }),
  E({ id: "stack-map", term: "Stack map", category: "Concept",
    short: "The eight-position map of a type's information elements, from which every relation is derived.",
    definition:
      "Positions a type's eight information elements into four blocks. Every relation in this system is a statement about how two stack maps line up — which of my functions lands on which of yours.",
    seeAlso: ["relation", "quadra", "rel-du"] }),
  E({ id: "quadra", term: "Quadra", category: "Concept",
    short: "One of four groups of types sharing the same four ego functions, and so the same values.",
    definition:
      "Alpha, Beta, Gamma and Delta. Types within a quadra find each other's priorities self-evident because they are literally running the same four elements. Quadra membership is the single most efficient predictor of whether a group will argue about goals or only about methods.",
    seeAlso: ["alpha", "beta", "gamma", "delta"] }),
  E({ id: "animal", term: "Current", category: "Concept",
    short: "An energy pattern formed by pairing an observer attitude with a decider attitude.",
    definition:
      "Four combinations: Charge, Broadcast, Absorb and Settle. They describe where energy goes rather than what a person is good at, and are held as an overlay on the stack rather than fused with it.",
    seeAlso: ["play", "blast", "consume", "sleep"] }),
  E({ id: "coin", term: "Switch", category: "Concept",
    short: "A binary structural distinction. Four determine the type; four confirm it.",
    definition:
      "Coins 1, 3, 4 and 5 give sixteen unique signatures and fix the type exactly. Coins 2, 6, 7 and 8 are mathematically derivable from them — coin 2 is the exact inverse of coin 3, and coin 8 is a function of 6 and 7 — so they cannot add evidence. They are retained because disagreement between a person's self-report and the structure is itself informative.",
    seeAlso: ["observer", "identity", "savior"] }),
  E({ id: "relation", term: "Intertype relation", category: "Concept",
    short: "One of sixteen structural relationships between two types.",
    definition:
      "Derived from how two stack maps overlay. Twelve are symmetric and four — Examiner/Examined and Upstream/Downstream — are asymmetric, meaning the relationship is genuinely different from each side.",
    seeAlso: ["ease", "stack-map", "rel-du", "rel-cf"] }),
  E({ id: "gate", term: "Growth gate", category: "Concept",
    short: "The structural fear a type is built around, and what integrating it unlocks.",
    definition:
      "Every type's Cave function names something it quietly organises its life to avoid, and the four Cave positions across sixteen types collapse into four gates. The gate is not a flaw to be corrected; it is the specific door that only this type has to walk through, and the capability on the other side is unavailable by any other route. Naming it structurally rather than personally is what makes it actionable.",
    inSystem: "Derived from the Cave function and the type's E/I and J/P letters.",
    seeAlso: ["inferior", "gate-of-chaos", "gate-of-obligation", "gate-of-the-tribe", "gate-of-the-self"] }),
  E({ id: "fine-coins", term: "Fine switches", category: "Concept",
    short: "The deferred fine layer: middle-current ordering, modality, masculine/feminine switches.",
    definition:
      "The most contested and least stable part of the overlay. This build deliberately holds it out: the base type is exactly four bits, and the fine layer adds further independent bits on top. Modelled as a bit vector with a fixed four-bit head, the extension can attach later without touching the 256-cell core.",
    seeAlso: ["coin", "animal", "play", "sleep"] }),

  /* ── the three non-ego sides. `ego` and `shadow` had entries; these did
     not, which left the four-sides material and everything the Octagram
     builds on top of it without anywhere to look a word up. ── */

  E({ id: "subconscious", term: "Subconscious", category: "Concept",
    short: "Your ego stack reversed. The person you wish you were, and your Counterpart.",
    definition:
      "Take your four ego slots and read them backwards: your Cave becomes its Lead, your Lead becomes its Cave. The resulting type is your Counterpart, which is why being around one feels like being handed a version of yourself you cannot reach alone. The gateway is the Cave, so the way in is through your largest insecurity — you have to be visibly bad at the thing you most want to be good at. Developed, it produces humility and something the material calls happiness; undeveloped, it stays an aspiration you talk about rather than a place you go.",
    inSystem: "fourSides(t)[1]. Derived by omega — flip both attitude and element on the dominant and auxiliary. relation(t, subconscious) is always DU.",
    seeAlso: ["four-sides", "inferior", "rel-du", "unconscious", "subconscious-development"] }),

  E({ id: "unconscious", term: "Unconscious", category: "Concept",
    short: "Your shadow four in order. Who you become in a crisis.",
    definition:
      "Its Lead is your Doubt, and its stack runs Doubt, Scold, Blind spot, Dread. Access is through worry rather than choice, which is why it shows up under pressure without being invited. Developed deliberately it produces wisdom and a kind of maturity available no other way; left alone it gets forced later — the three-quarter-life crisis is this side arriving whether or not you went looking for it.",
    inSystem: "fourSides(t)[2]. Derived by alpha — flip attitude only. relation(t, unconscious) is always EX.",
    seeAlso: ["four-sides", "nemesis", "rel-ex", "subconscious", "superego"] }),

  E({ id: "superego", term: "Superego", category: "Concept",
    short: "Your shadow reversed. Usually who you are at your worst — but not only that.",
    definition:
      "Its Lead is your Dread — the single function you trust least, running the show. That is exactly why the superego reads as a parasite persona rather than as you: it is competent, it is confident, and none of it is yours. The gateway is fear. It produces power, and the material is blunt that the power is destructive until the other three sides have been developed first — roughly ninety-five percent of it, by the material's own accounting. Developed last, deliberately, and only after the other three sides are, the same power becomes usable on purpose rather than a tripwire; left undeveloped it stays the parasite persona, with an ambition of its own to replace the ego rather than serve it. The Octagram's Deadly Sins are described as this side overriding the ego's stated values.",
    inSystem: "fourSides(t)[3]. Derived by beta — swap element only. relation(t, superego) is always SE.",
    seeAlso: ["four-sides", "demon", "rel-se", "deadly-sin", "unconscious"] }),

  E({ id: "midlife-crisis", term: "Midlife crisis", category: "Concept",
    short: "The subconscious forcing its way in when it was not developed on purpose.",
    definition:
      "Described as arriving roughly between 38 and 48: the ego's usual moves keep working externally and stop landing internally, and the pressure is the subconscious demanding to be lived rather than admired. Read structurally it is not a breakdown but a deadline. The same mechanism arrives later for the unconscious, as the three-quarter-life crisis. The whole point of doing gateway work early is that both can be walked through instead of waited for.",
    inSystem: "Not computed — it is the narrative consequence of leaving the subconscious undeveloped.",
    seeAlso: ["subconscious", "inferior", "gate", "octagram-theme"] }),

  /* ── the Octagram. The most advanced material the app carries. Each entry
     says which parts this engine derives and which are authored, because the
     difference matters more here than anywhere else. ── */

  E({ id: "octagram", term: "Octagram", category: "Concept",
    short: "A second layer over the sixteen: what a type is chasing, and what nurture did to how it chases.",
    definition:
      "Where the type model describes wiring, the Octagram describes what that wiring has been reaching for and the shape a particular life has bent it into. It has two layers. The wheel layer is structural: sixteen types make eight dyads, each dyad shares one lifelong want called a Cognitive Origin, and each origin is drawn as a wheel with four surrounding positions. The theme layer is biographical: two coins, neither derivable from type, that say whether the subconscious was nurtured in childhood and which side of the mind is running the show now. Two people of the same type can sit in the same wheel and completely different themes, and that is the whole reason the layer exists.",
    inSystem:
      "Fully derived here. A dyad is a type and its subconscious, which is its Counterpart; a temple is one orbit of the four-sides operation. tests/octagram.test.ts checks all eight dyads and all four temples against the published lists — they match 16/16 with no lookup table. Only the NAMES are authored.",
    seeAlso: ["temple", "temple-wheel", "cognitive-origin", "octagram-theme", "four-sides"] }),

  E({ id: "temple", term: "Temple", category: "Concept",
    short: "One of four departments of a life — Soul, Mind, Heart, Body. Four types each.",
    definition:
      "Soul is identity and character: who somebody actually is. Mind is knowledge and judgement. Heart is desire and regard. Body is action, achievement and what is left behind. The four types in a temple are not four similar people — they are the four sides of one mind, which is why they belong together and why a temple is closed under the four-sides operation.",
    inSystem:
      "Derived, not listed. templeOf(t) returns the sorted four-sides orbit of t. Soul = {ENFP, ISTJ, ESTP, INFJ}; Mind = {ESTJ, INFP, ENFJ, ISTP}; Heart = {ENTP, ISFJ, ESFP, INTJ}; Body = {ESFJ, INTP, ENTJ, ISFP}. Each matches the published membership exactly.",
    seeAlso: ["octagram", "temple-wheel", "four-sides", "subconscious"] }),

  E({ id: "temple-wheel", term: "Temple wheel", category: "Concept",
    short: "A dyad's origin drawn as a cross: virtue above, sin below, two poles either side.",
    definition:
      "Eight wheels, two per temple. At the centre is the Cognitive Origin — the thing this dyad wants. Directly above is the Living Virtue, the honest route to it, which characteristically involves giving somebody else some of what you want. Directly below is the Deadly Sin, the counterfeit: easier to reach, resembles the origin, and leaves you hungrier. To either side are the two poles, which are not good and bad but two different distortions — the drift of a childhood that fed you and the drift of one that did not.",
    inSystem:
      "A wheel is a Counterpart pair, so wheelOf(t).pair is always [t, subconscious(t)]. Both members share one origin. The four contents are authored from source; the membership is computed.",
    seeAlso: ["cognitive-origin", "living-virtue", "deadly-sin", "shadow-pole", "rel-du"] }),

  E({ id: "cognitive-origin", term: "Cognitive origin", category: "Concept",
    short: "The one thing a dyad has been after its whole life. Eight of them.",
    definition:
      "Not a goal — you do not complete an origin; it is what sits underneath the goals. Justification (ENFP/ISTJ), Intimacy (ESTP/INFJ), Satisfaction (ENTP/ISFJ), Reverence (ESFP/INTJ), Authority (ESTJ/INFP), Validation (ENFJ/ISTP), Discovery (ESFJ/INTP), Purpose (ENTJ/ISFP). Described as emerging from the lead function and shared with the subconscious, which is why a dyad and not a type is the unit.",
    inSystem: "Authored, but the dyad each belongs to is derived. Origins for ENFP/ISTJ, ENTP/ISFJ, ENTJ/ISFP and ESFJ/INTP are corroborated across more than one published source.",
    seeAlso: ["temple-wheel", "octagram", "hero", "subconscious"] }),

  E({ id: "living-virtue", term: "Living virtue", category: "Concept",
    short: "The honest route to an origin — what the wheel claims to be.",
    definition:
      "Absolution, Chastity, Compassion, Modesty, Initiative, Humility, Generativity, Generosity. Each is the traditional contrary of its wheel's Deadly Sin, and each involves relinquishing something: forgiving the debt, spending closeness sparingly, wanting somebody else to be satisfied too. Described as what the ego temple aspires to be rather than what it reliably is.",
    inSystem: "Authored from source. The eight are exactly the classical contrary virtues, which is a strong internal check on the table.",
    seeAlso: ["deadly-sin", "temple-wheel", "cognitive-origin"] }),

  E({ id: "deadly-sin", term: "Deadly sin", category: "Concept",
    short: "The counterfeit of an origin — what the superego reaches for instead.",
    definition:
      "Wrath, Lust, Envy, Vainglory, Sloth, Pride, Gluttony, Greed: the classical eight of the Evagrian tradition, one per wheel. Each is the shortest path to something that looks like the origin. Wrath is Justification collected by force; Gluttony is Discovery consumed rather than made. Described as the superego overriding the ego's stated values, which lines up with this app's account of the superego as a persona that produces power and is destructive until the other three sides are developed.",
    inSystem: "Authored from source. Landing on the exact classical eight is why the table is trusted despite thin sourcing elsewhere.",
    seeAlso: ["living-virtue", "superego", "temple-wheel"] }),

  E({ id: "shadow-pole", term: "Shadow pole", category: "Concept",
    short: "Where somebody whose subconscious was denied in childhood drifts.",
    definition:
      "A strategy that once worked, still running long after the situation that required it. The clearest published example is the Intimacy wheel: a child in a disabling environment learns to put others on a pedestal in order to get needs met, and Idolatry is what that becomes in an adult. The pole is not a moral failing; it is an adaptation with an expiry date.",
    inSystem: "Paired with the aspirational pole. Which of a wheel's two poles is the shadow is the least certain part of the Octagram data this app carries — see the app's recorded gaps.",
    seeAlso: ["aspirational-pole", "subconscious-development", "temple-wheel"] }),

  E({ id: "aspirational-pole", term: "Aspirational pole", category: "Concept",
    short: "Where somebody whose subconscious was nurtured in childhood drifts.",
    definition:
      "The other distortion — the one that comes from having been given something early. On the Intimacy wheel it is Objectification: a child rewarded and enabled for high performance is, in effect, valued as a producer, and learns to treat people including themselves as things that perform. Having your needs met is not the same as being undamaged, and this pole is where that shows.",
    inSystem: "Paired with the shadow pole. Both are distortions of the same origin, so 'aspirational' names a direction rather than a recommendation.",
    seeAlso: ["shadow-pole", "subconscious-development", "temple-wheel"] }),

  E({ id: "subconscious-development", term: "Subconscious development (SD / UD)", category: "Concept",
    short: "Whether the subconscious was fed in childhood. Set early, and largely fixed.",
    definition:
      "SD means the subconscious side was nurtured; UD means it was denied. It is described as a fact about upbringing rather than about wiring, so it cannot be read off a four-letter type, and two people of one type routinely differ. It decides which pole of the wheel a person drifts toward, and it is half of what fixes the Octagram theme.",
    inSystem: "Not derivable. Presented as a self-reported coin, in the same posture as the subtype coins.",
    seeAlso: ["octagram-focus", "octagram-theme", "subconscious", "shadow-pole"] }),

  E({ id: "octagram-focus", term: "Focus (SF / UF)", category: "Concept",
    short: "Which half of the mind is doing the work right now. Unlike development, this moves.",
    definition:
      "SF means running out of the subconscious side, UF means running out of the shadow. This is the mutable coin, and moving it is what most of the growth material in this app is actually about — the gateway functions, the two crises, the deliberate shadow work. Where development says what you were given, focus says what you are doing with it this year.",
    inSystem: "Not derivable. Combined with development it fixes one of four themes.",
    seeAlso: ["subconscious-development", "octagram-theme", "gate", "four-sides"] }),

  E({ id: "octagram-theme", term: "Octagram theme", category: "Concept",
    short: "Joy, Decay, Hope or Despair — the season a life is currently in.",
    definition:
      "Development crossed with focus. SD|SF is Joy, the psychological summer, described as the variant most resistant to despair. SD|UF is Decay, autumn: good roots running on the shadow, and an entropic position — taking other people's ideas, rules and norms and testing them to breaking. UD|SF is Hope, spring: denied early, but in conditions that now feed you, with the direction of travel upward. UD|UF is Despair, winter: denied and still constrained, with the shadow and superego doing the work because nothing else is available. Everyone cycles through all four; none is a verdict.",
    inSystem: "Computed from the two coins by themeFor(). The coins themselves are self-reported.",
    seeAlso: ["subconscious-development", "octagram-focus", "octagram", "midlife-crisis"] }),
];

/* ══════════════════════════════ RELATIONS ══════════════════════════════ */
const RELATION_EXTRA: Partial<Record<RelCode, string>> = {
  DU: "The lowest-friction pairing available. Your Cave is their Lead and their Cave is yours, so each covers the other's fear without effort or resentment. Duals often report that nothing in particular is happening and that it is restful anyway.",
  AC: "Fast to warm and genuinely energising, because each feeds the other's mobilising function. Sustained without breaks it becomes tiring in a way neither party can quite name.",
  HD: "Shares the dual's base channel but not its creative one. Comfortable and slightly incomplete: fine until the half you do not share is the half the situation needs.",
  MG: "Shares the dual's creative channel only. Relaxing, playful and slightly unserious — good company, poor co-execution.",
  ID: "Instant mutual legibility and perfectly shared blind spots. Nobody covers the gap, and neither party can see that there is one.",
  MI: "The same two functions in opposite order. Complete agreement about what matters, permanent argument about sequence and emphasis.",
  KD: "The same leading function, different second. You perceive the world identically and then do incompatible things with it, which is more disorienting than outright disagreement.",
  BU: "The same second function. Easy to work alongside and oddly hard to get close to; the shared ground is instrumental rather than personal.",
  BR: "Their leading function lands on your mobilising function. You find them compelling and they do not quite return it — not rejection, just an asymmetry in the wiring.",
  BE: "Your leading function lands on their mobilising function. They orbit you more than you orbit them, which is worth spending deliberately rather than assuming it is mutual.",
  SR: "Their leading function lands on your vulnerable function. Casual remarks arrive as verdicts, and they genuinely cannot see it happening.",
  SV: "Your leading function lands on their vulnerable function. You can flatten them without noticing; go gentler than feels necessary.",
  QI: "The same elements, every position rearranged. You look alike from outside and arrive by routes that do not translate, so agreement is usually coincidence.",
  EX: "The same functions with every attitude flipped. A constant near-miss on intent: the words match and the meaning does not.",
  SE: "Your ego block lands on their super-ego block — the positions they are conscious of being bad at. You are effortlessly demonstrating the exact competence they feel judged for lacking, and they are doing the same to you. At distance this reads as impressive and intriguing; in sustained contact it reads as a standing rebuke neither of you intended.",
  CF: "Their leading function lands on your most defended weakness and yours on theirs. Maximum friction, and usually mutual bafflement about why.",
};
const RELATIONS: Draft[] = (Object.keys(REL_NAME) as RelCode[]).map((c) =>
  E({ id: `rel-${c.toLowerCase()}`, term: REL_NAME[c], category: "Relation",
     short: REL_DEF[c].split(".")[0] + ".",
     definition: RELATION_EXTRA[c] ?? REL_DEF[c],
     inSystem: `Code ${c}. Ease ${REL_SCORE[c]}/100. ${
       c === "SR" || c === "SV" || c === "BR" || c === "BE"
         ? "Asymmetric — the reciprocal relation is different." : "Symmetric."}`,
     seeAlso: ["relation", "ease", "stack-map"] }));

const DRAFTS: Draft[] = [
  ...FUNCTIONS, ...ARCHETYPES, ...QUADRAS, ...ANIMALS, ...ROMANCE_STYLES,
  ...INTERACTION_STYLES, ...GATES, ...TEMPERAMENTS, ...COINS_E, ...CONCEPTS, ...RELATIONS,
];

/** Every entry carries its plain-language gloss. Completeness is asserted in tests. */
export const ENTRIES: Entry[] = DRAFTS.map((d) => ({ ...d, plain: PLAIN_BY_ID[d.id] ?? "" }));

/** A stable, url-safe id from a term. */
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Canonical id -> entry, plus an alias for each entry's term name.
 *  So both /lexicon/rel-du and /lexicon/duality resolve. */
export const BY_ID = (() => {
  const m = new Map<string, Entry>();
  for (const e of ENTRIES) m.set(e.id, e);
  for (const e of ENTRIES) { const a = slugify(e.term); if (!m.has(a)) m.set(a, e); }
  return m;
})();
/** Every category present in ENTRIES, for the lexicon's filter row. */
export const CATEGORIES: Category[] = [
  "Function", "Archetype", "Relation", "Quadra", "Animal", "Romance Style",
  "Interaction Style", "Gate", "Coin", "Temperament", "Concept",
];
const slug = slugify;

/**
 * A display label -> its CANONICAL entry id.
 *
 * compareAspects used to key pairings on `slugify(label)` directly, which
 * quietly couples the pairing tables to the display text: rename "Infantile"
 * to "Playful" and every romance pairing lookup misses, so the rows vanish
 * from the pair page with nothing failing. BY_ID already registers each
 * entry's term as an alias, so resolving through it and taking `.id` back
 * gives a key that survives any number of renames.
 */
const canonicalId = (label: string): string => BY_ID.get(slugify(label))?.id ?? slugify(label);
/** Find an entry by term or alias, case-insensitively. Used by inline <Term> tags. */
export const lookup = (name: string): Entry | undefined =>
  BY_ID.get(slug(name)) ?? ENTRIES.find((e) => e.term.toLowerCase() === name.toLowerCase());

/** Free-text search across term, gloss and definition. */
export function search(q: string): Entry[] {
  const t = q.trim().toLowerCase();
  if (!t) return ENTRIES;
  return ENTRIES.filter((e) =>
    e.term.toLowerCase().includes(t) || e.short.toLowerCase().includes(t) ||
    e.plain.toLowerCase().includes(t) ||
    e.definition.toLowerCase().includes(t) || e.category.toLowerCase().includes(t));
}

/* ══════════════════════ PAIRINGS: term × term ══════════════════════ */

const ROMANCE_PAIRS: Record<string, Pairing> = {
  "infantile|infantile": { headline: "Two players, no host",
    body: "Effortless lightness and a great deal of laughing. Neither wants to be the one who books the thing, remembers the appointment or notices that the fridge is empty, so the shared practical life quietly degrades while both insist they are fine. Works beautifully if the logistics are outsourced or genuinely simple." },
  "infantile|caregiver": { headline: "Being enjoyed, being tended",
    body: "The structural complement. You bring lightness and refuse to let the relationship get heavy; they bring provision and want to be trusted with the running of things. Each supplies what the other is not built for. The failure mode is drift into parent-and-child: keep asking them what they want rather than only accepting what they give." },
  "infantile|aggressor": { headline: "Play meets pursuit",
    body: "Their directness is exciting and can tip into pressure faster than they realise, because they read your teasing as encouragement rather than as its own complete language. You will deflect with humour exactly when they want you to be plain. Say the direct thing occasionally; they cannot decode play as reliably as you assume." },
  "infantile|victim": { headline: "Lightness meets charged ambivalence",
    body: "They want tension, complexity and a degree of being pursued; you want the whole thing to stay buoyant. Your refusal to take it seriously reads to them as not wanting it enough. Neither is wrong — but you will have to let some weight into the room, and they will have to stop manufacturing storms to test whether you are still there." },
  "caregiver|infantile": { headline: "Tending someone who wants to be enjoyed",
    body: "The structural complement, from the other side. Your provision is genuinely wanted, but be careful what you are providing: they want to be delighted in, not managed. Anticipating every need can read as being handled. Let some things go unarranged and play instead." },
  "caregiver|caregiver": { headline: "Two providers, nobody receiving",
    body: "Deeply reliable and quietly exhausting. Both express love by tending, and neither is comfortable being the one tended, so care gets offered in both directions and accepted in neither. Practise receiving — accepting what they do for you is the thing they most want and least often gets." },
  "caregiver|aggressor": { headline: "Provision meets pursuit",
    body: "They initiate and claim; you supply and secure. This works well because the roles do not compete. The strain is pace: their directness can feel like a demand landing on a person who was already giving, and your steady provision can read to them as insufficiently alive. Name the wanting out loud sometimes rather than only demonstrating it." },
  "caregiver|victim": { headline: "Tending someone who wants to be won",
    body: "You want to make things safe; they are partly charged by things not being settled. Every time you resolve the tension, you remove something they were enjoying. This is workable but requires you to tolerate an unresolved edge you would instinctively smooth away." },
  "aggressor|infantile": { headline: "Pursuit meets play",
    body: "They keep it light and deflect with humour, which you can misread as either invitation or evasion. Your directness is often exactly right for them and occasionally lands as pressure — and you will not be able to tell which from the inside. Ask plainly; they will answer plainly if plainly asked." },
  "aggressor|caregiver": { headline: "Pursuit meets provision",
    body: "Complementary roles with no contest over who initiates. They will keep supplying without asking for anything, which suits you and can leave them unattended. Notice the provision explicitly. Being thanked for it is close to the whole point for them." },
  "aggressor|aggressor": { headline: "Two initiators",
    body: "Immediate, physical and completely unambiguous about wanting. Nothing goes unsaid, which is a real advantage. The risk is escalation: two people who close distance by claiming attention can turn ordinary friction into contest very quickly, because neither instinct is to yield." },
  "aggressor|victim": { headline: "The structural complement",
    body: "The pairing this axis exists to describe. You pursue; they want to be pursued and to yield to something they respect. It is charged and it works. The failure mode is that their ambivalence is real, not a game — pushing through a genuine no because it once was a yes is where this pairing does actual damage." },
  "victim|infantile": { headline: "Charge meets buoyancy",
    body: "You want tension and complexity; they will keep lifting the mood every time it deepens. Their lightness is not indifference — it is how they express care — but it can leave you feeling the relationship is unserious. Ask for the depth explicitly; they can meet it when told it is wanted." },
  "victim|caregiver": { headline: "Being won versus being kept safe",
    body: "They resolve; you charge. Their instinct is to remove every obstacle, and obstacles are part of what you are responding to. This can settle into something very stable if you stop generating tension to test them, and they accept that not everything wants smoothing." },
  "victim|aggressor": { headline: "The structural complement, from the yielding side",
    body: "The pairing this axis exists for. Their directness supplies exactly the force you respond to, and the ambivalence you bring is legible to them as invitation rather than rejection. It has the most natural charge of any romance pairing. Be aware that your ambivalence reads as a yes even when it is a no — say the no plainly." },
  "victim|victim": { headline: "Two people waiting to be won",
    body: "Both want to be sought, so nobody closes the distance and the tension never resolves into contact. Highly charged, frequently unconsummated, and prone to long ambiguous stretches that both parties find meaningful and neither finds satisfying. Someone has to move first." },
};

const INTERACTION_PAIRS: Record<string, Pairing> = {
  "in-charge|in-charge": { headline: "Two people taking the lead",
    body: "Decisions get made fast and territory gets contested. Both open and both direct, so the meeting is settled early and then re-settled. Split ownership explicitly by domain and the friction disappears." },
  "in-charge|chart-the-course": { headline: "You move; they were still mapping",
    body: "They also communicate in conclusions, so you will agree on register — but they need the route drawn before movement and you have already started. Give them the problem before the meeting rather than at it, and their directive will be better than yours." },
  "in-charge|get-things-going": { headline: "Instruction meets context",
    body: "Both of you open, so the energy is high. The mismatch is form: they supply background and expect a choice to emerge, you supply a decision. They will experience you as cutting them off; you will experience them as never getting to the point. Ask them for their recommendation explicitly — they have one." },
  "in-charge|behind-the-scenes": { headline: "The loudest and the quietest style",
    body: "The widest gap of the four. You open and direct; they do neither. Your default pace will fill every available space and their contribution — which is often the most considered in the room — never gets made. Ask them directly and then wait through the silence." },
  "chart-the-course|in-charge": { headline: "They move before you have mapped",
    body: "You share the directing register, so you will not misread each other's bluntness. But they start before the route exists, and your deliberation is invisible to them, so your eventual objection lands as obstruction. Say 'I need until Thursday' out loud rather than going quiet." },
  "chart-the-course|chart-the-course": { headline: "Two people waiting, both certain",
    body: "Neither opens, so nothing starts until something forces it. When it does, both arrive with a complete plan and no shared premise. Schedule the conversation rather than waiting for it to occur naturally." },
  "chart-the-course|get-things-going": { headline: "Deliberation meets momentum",
    body: "They open constantly and think out loud; you process privately and speak in conclusions. They will read your silence as agreement and be surprised by your eventual direction. Interject earlier than feels right — half-formed is acceptable to them." },
  "chart-the-course|behind-the-scenes": { headline: "Two responders, one directing",
    body: "Neither will start the conversation. When it happens, you will state the plan and they will improve it sideways rather than contest it, which means genuine objections go unregistered. Ask them what they would change, not whether they agree." },
  "get-things-going|in-charge": { headline: "Context meets instruction",
    body: "You open with background so they can choose; they hear no request and supply a decision. Neither is being rude. Lead with your recommendation and then give the context — they will actually listen to it in that order." },
  "get-things-going|chart-the-course": { headline: "Momentum meets deliberation",
    body: "You think out loud and they process silently, so you will fill the space and then be startled when they arrive with a fully-formed alternative. Leave gaps. Ask and then stop talking." },
  "get-things-going|get-things-going": { headline: "Two openers, all context",
    body: "Warm, fast and enormously generative. Both supply background and leave the choice open, so a great deal is discussed and remarkably little is decided. Appoint someone to close, explicitly, or nothing lands." },
  "get-things-going|behind-the-scenes": { headline: "Same language, opposite volume",
    body: "You share the informing register so nothing gets misread as an order. But you open and they do not, so you will occupy the conversation by default. Their contribution is real and will simply not be offered unless you make room and wait." },
  "behind-the-scenes|in-charge": { headline: "Offering into a directive",
    body: "They open and instruct; you offer sideways and wait to be invited. Your input often does not reach them, and they will assume you had none. State your position as a position — 'I think we should X' — rather than as information they might use." },
  "behind-the-scenes|chart-the-course": { headline: "Two responders, one with conclusions",
    body: "Neither of you starts. When they do speak they speak in directives, and your instinct will be to improve rather than object. If you disagree, say so as a disagreement; they cannot hear it as one otherwise." },
  "behind-the-scenes|get-things-going": { headline: "Same register, they fill the room",
    body: "Comfortable — you share the informing style, so nothing is experienced as pressure. But they open continuously and you do not, so you will end up the audience. They would genuinely rather hear you; take the pause." },
  "behind-the-scenes|behind-the-scenes": { headline: "Two people waiting to be asked",
    body: "Extremely low friction and extremely low initiation. Both offer rather than direct, both wait rather than open, so the relationship is easy and slow and things go unsaid for months. Ask direct questions; you will both answer them happily." },
};

const GATE_PAIRS: Record<string, Pairing> = {
  "same": { headline: "The same fear, doubled",
    body: "You are both organised around avoiding the same thing, so neither will call it. The avoidance feels like agreement rather than like avoidance, and the shared blind region goes uncovered indefinitely." },
  "gate-of-chaos|gate-of-obligation": { headline: "Control meets flight",
    body: "One fears the unplanned, the other fears being tied down. Each is doing precisely what the other most dreads: making commitments, or refusing to. This is a productive tension if named and a chronic argument if not." },
  "gate-of-chaos|gate-of-the-tribe": { headline: "The unforeseen meets the verdict",
    body: "One needs the plan to hold, the other needs to not be judged. Neither threatens the other directly, so this is a comfortable pairing that can quietly agree to keep everything both private and predictable." },
  "gate-of-chaos|gate-of-the-self": { headline: "The plan meets the empty interior",
    body: "One controls the outside to feel safe, the other stays in motion to avoid the inside. Both are highly functional and both are running. Together they can build something impressive and never once stop." },
  "gate-of-obligation|gate-of-the-tribe": { headline: "Freedom meets exposure",
    body: "One will not be tied down, the other will not be seen failing. Both avoid by withdrawing — one from commitments, one from the stage — so the pairing is easy and neither gets pushed." },
  "gate-of-obligation|gate-of-the-self": { headline: "Options meets achievement",
    body: "One keeps exits open, the other keeps producing. The mismatch is legibility: constant motion looks like commitment from one side and like avoidance from the other, and both readings are partly right." },
  "gate-of-the-tribe|gate-of-the-self": { headline: "The private and the public self",
    body: "One fears the group's judgement, the other fears finding nothing underneath the achievement. Complementary in a useful way: each holds the thing the other cannot look at, and can name it without it being threatening." },
};

const QUADRA_TEXT = {
  same: (q: string, els: Fn[]) => ({
    headline: `Same quadra — ${q}`,
    body: `You run the same four elements (${els.join(", ")}), so your priorities are mutually self-evident and you will argue about method rather than about what is worth doing. Shared values also mean a shared blind region: whatever ${q} does not value, neither of you will notice going missing.`,
  }),
  adjacent: (a: string, b: string, shared: Fn[]) => ({
    headline: `Adjacent quadras — ${a} and ${b}`,
    body: `You share ${shared.join(" and ")} but not the other axis. Half the conversation is effortless and half requires translation, which is usually more workable than it sounds: there is enough common ground to disagree productively on the rest.`,
  }),
  opposite: (a: string, b: string) => ({
    headline: `Opposite quadras — ${a} and ${b}`,
    body: `No shared elements at all. Everything one of you values is something the other's stack processes in its shadow. This does not prevent respect, but it does mean that agreement on goals will be rare and mostly coincidental — the productive move is to divide territory rather than seek consensus.`,
  }),
};

const ANIMAL_TEXT: Record<string, (a: string, b: string) => Pairing> = {
  same: (a) => ({ headline: `Both ${a}-primary`,
    body: `Identical energy pattern. You will match each other's tempo and mode of engagement without effort, and you will both be absent in exactly the same way at exactly the same times.` }),
  observer: (a, b) => ({ headline: `${a} and ${b} — shared observing`,
    body: `You take the world in the same way and act on it differently. Agreement on what is happening; disagreement about what to do. Usually the easier of the two partial overlaps, because a shared read is a shared premise.` }),
  decider: (a, b) => ({ headline: `${a} and ${b} — shared deciding`,
    body: `You judge the same way and perceive differently. You will reach compatible conclusions from incompatible evidence, which feels like agreement until the underlying premise matters.` }),
  opposite: (a, b) => ({ headline: `${a} against ${b}`,
    body: `Opposite on both axes. One of you is doing outward what the other does inward, in both perceiving and judging. Genuinely complementary coverage, and the highest tempo mismatch available — neither will find the other's default speed natural.` }),
};

/** Whether a function observes or decides — the split every function pairing turns on. */
function fnClass(a: Fn, b: Fn): "same" | "alpha" | "beta" | "omega" | "unrelated" {
  if (a === b) return "same";
  if (alpha[a] === b) return "alpha";
  if (beta[a] === b) return "beta";
  if (omega[a] === b) return "omega";
  return "unrelated";
}

/** What happens when two cognitive functions meet, derived from their kinds and attitudes. */
function functionPair(a: Fn, b: Fn): Pairing {
  switch (fnClass(a, b)) {
    case "same": return { headline: `${a} meets ${a}`,
      body: `The same function on both sides. Immediate recognition and no coverage: whatever ${FN_FULL[a]} does not attend to, neither of you will raise.` };
    case "alpha": return { headline: `${a} against ${b} — same element, opposite attitude`,
      body: `${a} and ${b} process the same information pointed in opposite directions. This is the sharpest kind of near-miss: you are talking about the same thing and will not agree on what it means. In the eight-slot stack these two are always Lead and Doubt of each other's type family.` };
    case "beta": return { headline: `${a} and ${b} — same attitude, different element`,
      body: `Both pointed the same way, drawing on different material. Compatible tempo, different subject matter — usually experienced as talking past each other rather than as conflict.` };
    case "omega": return { headline: `${a} and ${b} — the axis opposite`,
      body: `Full complement. ${b} is exactly what ${a} does not do, which is why this pairing is the Counterpart relation itself: one supplies the other's Cave directly.` };
    default: return { headline: `${a} and ${b}`,
      body: `A perceiving function meeting a judging one, or two functions with no direct structural relation. They do not compete: one supplies material, the other decides about it.` };
  }
}

/**
 * What happens when two archetype slots meet.
 *
 * Takes the full Entry rather than just the display term: the ego/shadow
 * check has to key off the STABLE id ("hero", "parent", ...), which never
 * changes, rather than the display term, which is mid-rename. Keying it off
 * the term would silently break the moment "Hero" became "Lead" — the exact
 * failure this system has already hit twice with other renamed labels.
 */
function slotPair(a: Entry, b: Entry): Pairing {
  /** The ego-block position of a slot, by its stable lexicon id. */
  const ego = (id: string) => ["hero", "parent", "child", "inferior"].includes(id);
  if (a.id === b.id) return { headline: `${a.term} meets ${a.term}`,
    body: `The same position on both sides, so the same function is being used with the same degree of awareness. Mutual recognition, and no correction available in either direction.` };
  if (ego(a.id) && ego(b.id)) return { headline: `${a.term} meets ${b.term}`,
    body: `Two conscious positions. Both parties know they are doing this, so whatever happens between these slots is negotiable — it can be discussed, adjusted and apologised for.` };
  if (!ego(a.id) && !ego(b.id)) return { headline: `${a.term} meets ${b.term}`,
    body: `Two shadow positions. Neither party is choosing this, and it usually surfaces under stress as something that seems to come from nowhere. Not negotiable in the moment; only avoidable in advance.` };
  return { headline: `${a.term} meets ${b.term}`,
    body: `A conscious position meeting a shadow one. The party using the ego slot is deliberate; the party in shadow is not. This asymmetry is where most unintended damage happens, because one side experiences a choice and the other experiences an event.` };
}

/** Pair any two lexicon terms in the same category. */
export function pairTerms(aId: string, bId: string): Pairing | null {
  const a = BY_ID.get(aId), b = BY_ID.get(bId);
  if (!a || !b || a.category !== b.category) return null;

  switch (a.category) {
    case "Romance Style":
      return ROMANCE_PAIRS[`${aId}|${bId}`] ?? null;
    case "Interaction Style":
      return INTERACTION_PAIRS[`${aId}|${bId}`] ?? null;
    case "Gate":
      if (aId === bId) return GATE_PAIRS.same;
      return GATE_PAIRS[`${aId}|${bId}`] ?? GATE_PAIRS[`${bId}|${aId}`] ?? null;
    case "Quadra": {
      const ea = QUADRA_ELEMENTS[aId], eb = QUADRA_ELEMENTS[bId];
      if (aId === bId) return QUADRA_TEXT.same(a.term, ea);
      const shared = ea.filter((f) => eb.includes(f));
      return shared.length
        ? QUADRA_TEXT.adjacent(a.term, b.term, shared)
        : QUADRA_TEXT.opposite(a.term, b.term);
    }
    case "Animal": {
      /**
       * Which way each half of a current faces: [observer outward, decider outward].
       *
       * Keyed by ID, not by term. Keying it by the display name meant renaming
       * the four currents made this lookup return undefined and the
       * destructuring below throw — the pair page lost every animal row and
       * eleven tests went red at once. Ids do not move; labels do.
       */
      const att = (id: string): [boolean, boolean] =>
        ({ play: [true, false], blast: [false, true], consume: [true, true], sleep: [false, false] } as const)[
          id as "play"] as [boolean, boolean];
      const [ao, ad] = att(aId), [bo, bd] = att(bId);
      if (aId === bId) return ANIMAL_TEXT.same(a.term, b.term);
      if (ao === bo) return ANIMAL_TEXT.observer(a.term, b.term);
      if (ad === bd) return ANIMAL_TEXT.decider(a.term, b.term);
      return ANIMAL_TEXT.opposite(a.term, b.term);
    }
    case "Function":
      return functionPair(a.term as Fn, b.term as Fn);
    case "Archetype":
      return slotPair(a, b);
    case "Temperament":
      return aId === bId
        ? { headline: `Two ${a.term}`, body: `The same organising value on both sides. Mutual legibility about what counts as a good outcome, and a shared indifference to whatever this temperament does not weigh.` }
        : { headline: `${a.term} and ${b.term}`, body: `Different organising values. Each will treat the other's central criterion as a secondary consideration, which is the most common source of two competent people concluding the other is unserious.` };
    case "Coin": {
      const idx = COIN_POLES.findIndex(([id]) => id === aId);
      const pairIdx = COIN_POLES.findIndex(([id]) => id === bId);
      if (Math.floor(idx / 2) !== Math.floor(pairIdx / 2))
        return { headline: `${a.term} and ${b.term}`, body: `Different coins — these describe unrelated axes and do not interact directly.` };
      return aId === bId
        ? { headline: `Both ${a.term}`, body: `The same pole on ${COIN_LABELS[Math.floor(idx / 2)]}. This axis will never be a source of friction, and neither of you will supply what the opposite pole would.` }
        : { headline: `${a.term} against ${b.term}`, body: `Opposite poles on ${COIN_LABELS[Math.floor(idx / 2)]}. This is one of the axes where you are structurally set up to misread each other's defaults — and one of the few where the other person genuinely covers something you do not.` };
    }
    default:
      return null;
  }
}

/* ══════════════════════ ASPECT-BY-ASPECT TYPE COMPARISON ══════════════════════ */
export interface AspectRow {
  aspect: string; aId: string; bId: string;
  aLabel: string; bLabel: string; pairing: Pairing | null; determining?: boolean;
}

/** The lexicon id for one pole of one coin. */
const coinPoleId = (v: string) =>
  COIN_POLES.find(([, term]) => term === v)?.[0] ?? slug(v);

/** Every comparable aspect of two types, with the pairing text for that combination. */
export function compareAspects(a: MbtiType, b: MbtiType): AspectRow[] {
  const rows: AspectRow[] = [];
  /**
   * Add an entry, guarding against a duplicate id — two entries with one id would make
   * one of them unreachable from every link in the app.
   */
  const push = (aspect: string, aId: string, bId: string, aLabel: string, bLabel: string, determining?: boolean) =>
    rows.push({ aspect, aId, bId, aLabel, bLabel, pairing: pairTerms(aId, bId), determining });

  push("Quadra", canonicalId(quadra(a)), canonicalId(quadra(b)), quadra(a), quadra(b));
  push("Temperament", canonicalId(GROUP[a].match(/\((\w+)\)/)![1]), canonicalId(GROUP[b].match(/\((\w+)\)/)![1]), GROUP[a], GROUP[b]);
  push("Interaction style", canonicalId(INTERACTION_STYLE[a].split(" (")[0]), canonicalId(INTERACTION_STYLE[b].split(" (")[0]),
       INTERACTION_STYLE[a], INTERACTION_STYLE[b]);
  push("Romance style", canonicalId(ROMANCE[a]), canonicalId(ROMANCE[b]), ROMANCE[a], ROMANCE[b]);
  push("Primary current", canonicalId(ops(a).primary), canonicalId(ops(b).primary),
       ANIMAL_LABEL[ops(a).primary], ANIMAL_LABEL[ops(b).primary]);
  push("Growth gate", canonicalId(gate(a).gate), canonicalId(gate(b).gate), gate(a).gate, gate(b).gate);
  push("Lead function", canonicalId(stack(a)[0]), canonicalId(stack(b)[0]), stack(a)[0], stack(b)[0]);
  push("Cave function", canonicalId(stack(a)[3]), canonicalId(stack(b)[3]), stack(a)[3], stack(b)[3]);

  const ca = coins(a), cb = coins(b);
  COIN_LABELS.forEach((label, i) => {
    push(`Coin ${i + 1} · ${label}`, coinPoleId(ca[i]), coinPoleId(cb[i]), ca[i], cb[i],
         [0, 2, 3, 4].includes(i));
  });
  return rows;
}
