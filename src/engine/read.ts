import { COIN_OPTIONS } from "./ops";

/* ------------------------------------------------------------------ *
 * A SECOND FRONT DOOR ONTO THE SAME COINS.
 *
 * The calculator asks eight direct statements a reader agrees or
 * disagrees with about themselves. That is precise, but it is useless
 * for typing someone else in conversation: nobody answers "do you
 * check decisions against your own values or the group's?" honestly,
 * and most people have never heard the question in those terms.
 *
 * This module is the same instrument asked a different way — six
 * everyday scenes to watch for or bring up casually, phrased so the
 * axis being tested never shows up in the words. Four fix the type
 * outright (the same four DETERMINING coins the calculator uses);
 * two are confirming cross-checks. The scoring is untouched: answers
 * still flow through calculate() in ops.ts, so this can only ever
 * change how the reader is invited to answer, never what an answer
 * is worth. A second scoring path here would be a second thing that
 * could quietly disagree with the first.
 *
 * Litigated once and worth saying plainly: an indirect cue is a
 * correlate, not the axis itself. A messy desk can be a busy month
 * rather than Gather; a quick verdict can be politeness rather than
 * Decider. Weaker evidence than the calculator's direct self-report,
 * which is already the weakest evidence in typology. Treat the result
 * as a place to start reading, not a place to stop.
 * ------------------------------------------------------------------ */

export interface ReadPrompt {
  /** Which coin (index into COIN_OPTIONS / DETERMINING / CONFIRMING) this scores against. */
  coin: number;
  /** What to actually do or notice — never a trait word the subject could recognise. */
  cue: string;
  /** The two everyday answer patterns, in the same order as COIN_OPTIONS[coin]. */
  poles: [string, string];
}

/**
 * Six prompts: four determining (coins 0, 2, 3, 4), two confirming (coins 1, 5).
 * tests/read-someone.test.ts pins that set against DETERMINING/CONFIRMING in
 * data.ts so a coin can't quietly drop out from under it.
 */
export const READ_PROMPTS: ReadPrompt[] = [
  {
    coin: 2, // Organize vs Gather
    cue: "Picture their room, desk or inbox on an ordinary day.",
    poles: [
      "Settled. Things have a place, and they'd notice if that place got disturbed.",
      "In motion. There's always something new piled on, and that doesn't bother them.",
    ],
  },
  {
    coin: 5, // Initiating vs Responding
    cue: "Picture them walking into a party where they know almost no one.",
    poles: [
      "They're the one who starts talking to a stranger first.",
      "They hang back, get a read on the room, and ease in once they're oriented.",
    ],
  },
  {
    coin: 4, // Sensing vs iNtuition
    cue: "Let a conversation drift somewhere unplanned and see where they take it.",
    poles: [
      "Specifics — a real story, a concrete detail, something that actually happened.",
      "A tangent — a pattern they've noticed, a “what if,” somewhere hypothetical.",
    ],
  },
  {
    coin: 3, // Thinking vs Feeling
    cue: "Bring up a falling-out between two people you both know, and ask what happened.",
    poles: [
      "They walk you through the sequence — who did what, and where it went wrong.",
      "They walk you through what each person needed to hear, and how everyone can come out okay.",
    ],
  },
  {
    coin: 0, // Observer vs Decider
    cue: "Ask about something in their life that's still unresolved.",
    poles: [
      "They call it a work in progress — genuinely open to it changing.",
      "They already have a take on it, and explain it more than question it.",
    ],
  },
  {
    coin: 1, // Identity vs Tribe
    cue: "Ask about a time the group was heading somewhere they didn't love.",
    poles: [
      "They quietly adjusted and let it go — not their fight unless it crossed a line.",
      "They said something, and tried to bring people around.",
    ],
  },
];

/** The coin value one side of a prompt scores as. Keeps the page from hand-indexing COIN_OPTIONS. */
export const readPoleValue = (p: ReadPrompt, side: 0 | 1): string => COIN_OPTIONS[p.coin][side];
