import type { Fn } from "./data";

/* ------------------------------------------------------------------ *
 * PER-FUNCTION DEPTH
 *
 * Ingested from the photo batch (see docs/transcripts/). Sources are
 * credited per table. Where the source is commercial training material
 * the *structure* is used and the prose is rewritten in this app's own
 * voice — the verbatim transcriptions stay in docs/, not in the bundle.
 * Short catchphrases are quoted directly and attributed, because they
 * are the data and cannot be paraphrased without destroying them.
 *
 * What each table answers, and why the app needed it:
 *   FN_ROLE         one word for what it DOES        — labels, chips, diagrams
 *   FN_KEYWORD      one word for the DOMAIN it claims — CS Joseph's terminology
 *   FN_VERBS        what it is actually doing        — recognising it in yourself
 *   FN_SAYS         what it sounds like out loud     — recognising it in others
 *   FN_SATISFACTION what feeds it                    — the missing half of growth advice
 *   FN_STARVATION   what happens when it is not fed
 *   FN_PRACTICE     what to actually go and do
 * ------------------------------------------------------------------ */

/** One-word handle. Short enough for a diagram label. Source: "Function Roles" (IMG_7533). */
export const FN_ROLE: Record<Fn, string> = {
  Ni: "Knowing",
  Ne: "Creating",
  Fi: "Empathizing",
  Fe: "Persuading",
  Ti: "Contemplating",
  Te: "Systemizing",
  Si: "Preserving",
  Se: "Doing",
};

/**
 * A second one-word handle, from the owner's own four-sides whiteboards
 * (docs/transcripts/IMG_0314-four-sides-whiteboards.md). CS Joseph's
 * terminology, and a genuinely different cut from FN_ROLE: FN_ROLE names what
 * the function is *doing* (Knowing, Creating), FN_KEYWORD names the *domain it
 * claims authority over* (Willpower, Metaphysics). Both are useful; neither
 * replaces the other.
 */
export const FN_KEYWORD: Record<Fn, string> = {
  Ti: "Logic",
  Te: "Rationale",
  Fi: "Morals",
  Fe: "Ethics",
  Si: "Duty",
  Se: "Physics",
  Ni: "Willpower",
  Ne: "Metaphysics",
};

/** What each keyword actually means, since several are counter-intuitive. */
export const FN_KEYWORD_GLOSS: Record<Fn, string> = {
  Ti: "Whether it holds together. Internal consistency, checked against itself rather than against the world.",
  Te: "Whether it works. Publicly checkable reasoning — evidence, method, results you can point at.",
  Fi: "What is right for me. A private standard, held whether or not anyone else shares it.",
  Fe: "What is right for us. The shared code a group runs on, and the cost of breaking it.",
  Si: "What is owed and what has held. Precedent, maintenance, the obligations that carry forward.",
  Se: "What is physically the case. Force, distance, timing — the world as it actually is right now.",
  Ni: "Where this is going, and the will to hold a line to get there. Singular focus over a long arc.",
  Ne: "What else this could be. The space of possibility above and beyond the given case.",
};

/** The five things this function is doing when it runs. Structure after Berens (IMG_7534/7535). */
export const FN_VERBS: Record<Fn, string[]> = {
  Se: ["Experiencing", "Doing", "Observing and responding", "Adapting and varying", "Present"],
  Ne: ["Inferring", "Hypothesising", "Seeing potentials", "Wondering and brainstorming", "Emergent"],
  Si: ["Recalling", "Linking", "Comparing and contrasting", "Noticing match and mismatch", "Past"],
  Ni: ["Foreseeing", "Conceptualising", "Understanding complex patterns", "Synthesising and symbolising", "Future"],
  Te: ["Being organised", "Coordinating and sequencing", "Segmenting", "Checking against criteria", "Here and now"],
  Fe: ["Being considerate", "Adjusting and accommodating", "Affirming", "Checking appropriateness", "Here and now"],
  Ti: ["Principles", "Categorising and classifying", "Analysing", "Checking consistency", "Universal"],
  Fi: ["Values", "Harmonising and clarifying", "Reconciling", "Checking congruency", "Universal"],
};

/**
 * What the function sounds like out loud — two phrases each.
 * Quoted from Berens' "Essential Characteristics" sheets (IMG_7534, IMG_7535).
 *
 * This is the single most practical table in the app for a beginner: it turns
 * an abstract eight-way taxonomy into something you can hear in a conversation.
 */
export const FN_SAYS: Record<Fn, [string, string]> = {
  Se: ["This is what is.", "What's next?"],
  Ne: ["This is what might be.", "It could be this, or this, or this…"],
  Si: ["This is how it has always been.", "This reminds me of…"],
  Ni: ["This is how it will be.", "Aha, that's it!"],
  Te: ["This is how to do it.", "People do…"],
  Fe: ["This is what we need.", "We do…"],
  Ti: ["This is why…", "It does…"],
  Fi: ["This is important.", "I (or you) do…"],
};

/** A one-word name for what this function is chasing. After Psychology Junkie's chart. */
export const FN_WANTS: Record<Fn, string> = {
  Se: "Experience",
  Si: "Immersion",
  Ne: "Ideas",
  Ni: "Meaning",
  Te: "Accomplishment",
  Ti: "Precision",
  Fe: "Unity",
  Fi: "Individuality",
};

/**
 * What actually feeds this function. Rewritten in the app's voice from the
 * structure of "What Makes Each Cognitive Function Happy" (psychologyjunkie.com).
 *
 * The app previously said which function to develop and never what that function
 * enjoys — which made every growth instruction unactionable.
 */
export const FN_SATISFACTION: Record<Fn, string> = {
  Se: "Contact with the physical world at full resolution, and having a visible effect on it. Movement, texture, speed, craft, risk — anything where the feedback is immediate and real rather than reported.",
  Si: "Depth in something familiar. Returning to the same practice until it is genuinely yours, and keeping the rituals and routines that make a life feel steady from the inside.",
  Ne: "Open questions with no obligation to answer them. New material, unexpected combinations, and the specific pleasure of not yet knowing how tomorrow goes.",
  Ni: "Sitting with something long enough that it resolves. Symbols, philosophies, long arcs — the satisfaction is the moment a mass of unrelated detail collapses into one clear reading.",
  Te: "Something measurably finished. A goal met, a mess ordered, a process made faster — the feeling of the world being more workable at the end of the day than it was at the start.",
  Ti: "Getting it exactly right for its own sake. Taking a mechanism apart, finding the inconsistency, and throwing out a belief that turned out not to hold.",
  Fe: "A room that is genuinely all right. Knowing what people actually need and being able to move the temperature — and the relief of shared purpose rather than politeness.",
  Fi: "Being unmistakably yourself. Time with your own convictions, and acting on them even where it costs something — especially where it costs something.",
};

/** What chronic under-feeding looks like from outside. Written for this app. */
export const FN_STARVATION: Record<Fn, string> = {
  Se: "Restless and slightly unreal. Living one layer removed from the room, and reaching for intensity in whatever cheap form is nearest.",
  Si: "Unmoored. Nothing has continuity, the same fixable problems keep recurring, and rest never quite counts as rest.",
  Ne: "Trapped. The walls come in, the future looks like a single narrowing corridor, and everything reads as an obligation.",
  Ni: "Reactive. Endlessly busy with the immediate and unable to say where any of it is going, or why this rather than something else.",
  Te: "Stalled. Real conviction with nothing shipped, and a growing suspicion that intentions are being mistaken for results.",
  Ti: "Muddled. Going along with reasoning you cannot actually follow, and quietly losing confidence in your own judgement.",
  Fe: "Isolated. Competent and unaccompanied, uncertain where you stand with people and unwilling to ask.",
  Fi: "Hollow. Performing well and unable to say what any of it is for, with a slow drift away from anything you would call yours.",
};

/**
 * Concrete things to try. This is the payload of the whole growth argument —
 * the app can now answer "so what do I actually do about it".
 */
export const FN_PRACTICE: Record<Fn, string[]> = {
  Se: [
    "Do something physical with a real failure mode — climbing, cooking to a deadline, a contact sport",
    "Spend an hour somewhere new with no plan and no phone",
    "Fix one physical object with your hands instead of replacing it",
  ],
  Si: [
    "Pick one practice and repeat it daily for a fortnight, badly if necessary",
    "Write down how something went, then actually read it back next time",
    "Keep one routine that exists purely because it makes the week feel steadier",
  ],
  Ne: [
    "Write ten answers to a question that only needs one, and do not evaluate them",
    "Say yes to one thing with no clear point to it",
    "Take something that works and ask what it would be if a constraint were removed",
  ],
  Ni: [
    "Take one recurring problem and ask where it ends up in five years if nothing changes",
    "Sit with a question for a whole day without googling it",
    "Write the one-sentence version of something you usually explain in ten minutes",
  ],
  Te: [
    "Pick the smallest unfinished thing and finish it today, to a visible standard",
    "Put a number on something you have only been describing",
    "Write the actual sequence of steps, then do step one",
  ],
  Ti: [
    "Take one belief you hold and try honestly to break it",
    "Explain a mechanism you use daily until you hit the part you cannot explain",
    "Ask 'why does that follow?' out loud once, in a meeting, without softening it",
  ],
  Fe: [
    "Ask one person how they are and stay for the real answer",
    "Say the warm thing you were going to leave unsaid",
    "Notice who has gone quiet in a group and do something about it",
  ],
  Fi: [
    "Write down what you actually believe about something, for nobody else to read",
    "Decline one thing purely because it is not you",
    "Say plainly what you value in a room where it is inconvenient",
  ],
};
