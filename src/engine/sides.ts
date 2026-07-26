import { alpha, beta, omega, stack, fromPair, relation, type MbtiType } from "./core";
import { DOM_AUX, SLOT_NAMES, type Fn, type RelCode, type SlotName } from "./data";

/* ------------------------------------------------------------------ *
 * THE FOUR SIDES OF THE MIND
 *
 * CS Joseph's claim is that a type is only a quarter of a person. The
 * eight-slot stack is not one stack — it is four four-slot stacks, each
 * of which is itself one of the sixteen types, and each of which has a
 * single function as its door.
 *
 * The derivation is already latent in core.ts: the three involutions
 * that generate the relation table also generate the sides.
 *
 *   Subconscious = omega(d), omega(x)   -> your DUAL
 *   Unconscious  = alpha(d), alpha(x)   -> your EXTINGUISHMENT partner
 *   Superego     = beta(d),  beta(x)    -> your SUPER-EGO partner
 *
 * That is not a coincidence and it is not decoration. REL_OPS.DU, .EX
 * and .SE in core.ts are literally the same three operators. The four
 * sides are four relations you hold with yourself, which is why the
 * Socionics relation named "Super-Ego" and the Jungian structure named
 * "superego" land on the same type. Asserted in tests/sides.test.ts.
 *
 * Each side's own Hero is the gateway into it:
 *   Ego          <- Hero      (open by default)
 *   Subconscious <- Inferior  (blocked by insecurity)
 *   Unconscious  <- Nemesis   (blocked by worry)
 *   Superego     <- Demon     (blocked by fear, and best kept shut)
 *
 * The demon function sits in the Inferior slot of the unconscious and in
 * the HERO slot of the superego. That single fact is why the superego
 * reads as a parasite persona rather than as another part of you: the
 * thing you like least is the thing it is best at.
 * ------------------------------------------------------------------ */

export type SideKey = "ego" | "subconscious" | "unconscious" | "superego";

/** The role a function plays *within its own side*, not within the ego. */
export type SideRole = "Hero" | "Parent" | "Child" | "Inferior";
const SIDE_ROLES: SideRole[] = ["Hero", "Parent", "Child", "Inferior"];

/**
 * One slot within a side: the function, what it is called here, and what it is called
 * in the ego. The second name is what makes the sides legible as one mind.
 */
export interface SideSlot {
  /** The function itself. */
  fn: Fn;
  /** What it is called inside this side. */
  role: SideRole;
  /** What the same function is called in the ego's eight-slot stack. */
  egoSlot: SlotName;
}

/** The half of a side that is pure structure, derived with no authored copy. */
export interface SideStructure {
  key: SideKey;
  /** Display name. */
  name: string;
  /** The type this side is, in its own right. */
  type: MbtiType;
  /** How this side stands to the ego in the relation table. */
  relationToEgo: RelCode;
  /** This side's own four-slot stack. */
  slots: [SideSlot, SideSlot, SideSlot, SideSlot];
  /** The function you have to go through to get in. */
  gateway: { fn: Fn; egoSlot: SlotName };
}

/**
 * One of the four sides, complete: its own type and stack, its gateway, what blocks
 * and opens that gateway, and what developed and undeveloped look like.
 */
export interface Side extends SideStructure {
  /** Plain language, one sentence, no jargon. */
  plain: string;
  /** What the side is, in the system's own vocabulary. */
  what: string;
  /** What holds the door shut. */
  blockedBy: string;
  /** What opens it. */
  opensWith: string;
  /** Reaching it deliberately. */
  atWill: string;
  /** Reaching it involuntarily, because you did not do it deliberately. */
  forced: string;
  /** What you get out of it. */
  produces: string;
  developed: string;
  undeveloped: string;
}

/* ---------------------------------------------------------------- *
 * Per-function texture for the three doors. The gateway is a
 * different experience depending on which function is standing in it,
 * so none of this is generic.
 * ---------------------------------------------------------------- */

/** The Inferior, felt from inside. The subconscious door. */
const INFERIOR_INSECURITY: Record<Fn, string> = {
  Ne: "that you have missed the option everyone else can see, and that your one plan is about to be exposed as naive",
  Ni: "that you have no idea where any of this is going, and that everyone else is working from a map you were never given",
  Se: "that you cannot handle the room as it actually is — that you will be too slow, too clumsy, too late",
  Si: "that you cannot keep anything running — that the upkeep, the routine and the follow-through will find you out",
  Te: "that you cannot actually produce, and that when someone finally measures the output there will not be any",
  Ti: "that your reasoning does not hold, and that someone who thinks properly will take it apart in one question",
  Fe: "that the room has quietly decided against you, and that you are the only person who has not been told",
  Fi: "that there is nothing underneath — that if you stopped performing there would be no one there with values of their own",
};

/** The Inferior, aspired to rather than defended. */
const INFERIOR_ASPIRATION: Record<Fn, string> = {
  Ne: "letting one unproven possibility stand without demanding precedent for it",
  Ni: "committing to a single line and letting it run long enough to arrive",
  Se: "meeting the present as it is rather than as the model predicted",
  Si: "honouring continuity — letting a structure stand long enough to compound",
  Te: "building the machinery that lets what you value actually scale",
  Ti: "testing whether a thing is true, not only whether it moves",
  Fe: "letting the work land with people before you count it as finished",
  Fi: "locating the value the whole enterprise was supposedly for",
};

/** The Nemesis, felt from inside. The unconscious door. */
const NEMESIS_WORRY: Record<Fn, string> = {
  Ne: "what if there is a possibility here I have not accounted for",
  Ni: "what if this is heading somewhere I will not be able to reverse",
  Se: "what if I am not watching closely enough and it happens right in front of me",
  Si: "what if I am repeating something that has already gone badly once",
  Te: "what if none of this is actually working and I am the last to know",
  Ti: "what if the reasoning has a hole in it that I put there myself",
  Fe: "what if I have already lost the room and nobody is going to say so",
  Fi: "what if I am doing something I would not be able to defend",
};

/** The Demon, felt from inside. The superego door — the one to leave shut. */
const DEMON_FEAR: Record<Fn, string> = {
  Ne: "possibility itself becomes threat: every open branch reads as a way this ends badly",
  Ni: "certainty of collapse — the vision arrives whole, and it is apocalyptic",
  Se: "the body is turned against the situation; destruction becomes the fastest available move",
  Si: "the record becomes an indictment, replayed in detail and used as evidence against yourself",
  Te: "efficiency turned on people — control for its own sake, and nobody is a person any more",
  Ti: "logic sharpened into a scalpel and used to dismantle a person rather than a problem",
  Fe: "the room's mood becomes a weapon, and you play it deliberately",
  Fi: "moral outrage with no off-switch and no proportion",
};

const NAMES: Record<SideKey, string> = {
  ego: "Ego",
  subconscious: "Subconscious",
  unconscious: "Unconscious",
  superego: "Superego",
};

/** All four sides of one type, fully built out. */
export function sides(t: MbtiType): Record<SideKey, Side> {
  const [d, x] = DOM_AUX[t];
  const st = stack(t);

  // Which ego-slot indices supply each side's Hero..Inferior, in order.
  //   ego          1 2 3 4  — read forwards
  //   subconscious 4 3 2 1  — the ego stack reversed
  //   unconscious  5 6 7 8  — the shadow block, read forwards
  //   superego     8 7 6 5  — the shadow block reversed
  const ORDER: Record<SideKey, [number, number, number, number]> = {
    ego: [0, 1, 2, 3],
    subconscious: [3, 2, 1, 0],
    unconscious: [4, 5, 6, 7],
    superego: [7, 6, 5, 4],
  };

  const TYPE_OF: Record<SideKey, MbtiType> = {
    ego: t,
    subconscious: fromPair(omega[d], omega[x]),
    unconscious: fromPair(alpha[d], alpha[x]),
    superego: fromPair(beta[d], beta[x]),
  };

  /** Assemble one side from the ego's stack: its four slots, its own type, and its gateway. */
  const build = (key: SideKey): SideStructure => {
    const slots = ORDER[key].map((i, n) => ({
      fn: st[i],
      role: SIDE_ROLES[n],
      egoSlot: SLOT_NAMES[i],
    })) as [SideSlot, SideSlot, SideSlot, SideSlot];
    return {
      key,
      name: NAMES[key],
      type: TYPE_OF[key],
      relationToEgo: relation(t, TYPE_OF[key]),
      slots,
      gateway: { fn: slots[0].fn, egoSlot: slots[0].egoSlot },
    };
  };

  const inf = st[3], nem = st[4], dem = st[7];

  const ego: Side = {
    ...build("ego"),
    plain:
      "The you that shows up without being asked. It is what a type test measures, and it is " +
      "about a quarter of you.",
    what:
      `The conscious four: ${st[0]} Hero, ${st[1]} Parent, ${st[2]} Child, ${st[3]} Inferior. ` +
      "This is the side that has a reputation, holds down a job and answers to your name.",
    blockedBy: "Nothing — this door is already open. That is the problem with it.",
    opensWith: "Default operation. You are here unless something has pushed you out.",
    atWill:
      `Leading with ${st[0]} and backing it with ${st[1]} is effortless, which is exactly why ` +
      "it gets overused: the Hero is reached for even on problems it is wrong for.",
    forced:
      "You are returned here automatically. When any other side tires the mind out, it drops " +
      "you back into the ego whether or not you were finished.",
    produces: "Responsibility, competence, and order imposed on chaos.",
    developed:
      `${st[1]} is actually used rather than skipped, so ${st[0]} is aimed instead of merely ` +
      `fired, and ${st[2]} is enjoyed without being hidden behind.`,
    undeveloped:
      `${st[0]} inflates and does all the work; ${st[2]} becomes the escape hatch used to avoid ` +
      `${st[3]} entirely. The result reads as arrogance from outside and as exhaustion from inside.`,
  };

  const subconscious: Side = {
    ...build("subconscious"),
    plain:
      "The person you quietly wish you were. It is reached through the thing you are most " +
      "insecure about — and on the other side of that insecurity is happiness.",
    what:
      `Your ego stack turned upside down: ${inf} leads and ${st[0]} sits last. Structurally it is ` +
      "your Dual — the type whose wiring completes yours — which is why it is both the most " +
      "restful side and the hardest to get to.",
    blockedBy: `Insecurity. Specifically the fear ${INFERIOR_INSECURITY[inf]}.`,
    opensWith:
      `Humility, and then practice. The Inferior ${inf} has to be converted from something you ` +
      `defend into something you aspire to: ${INFERIOR_ASPIRATION[inf]}.`,
    atWill:
      `When ${inf} is aspirational rather than defensive you can step into this side deliberately, ` +
      "and it is genuinely restorative — this is where play, wonder and contentment live.",
    forced:
      "If you do not do it on purpose, the mind does it for you. That involuntary version is the " +
      "midlife crisis, and it typically arrives somewhere between 38 and 48.",
    produces: "Humility, happiness, and the capacity to be delighted by something again.",
    developed:
      `${inf} is used without flinching. There is a childlike quality that is not childishness, ` +
      "and success starts to feel like something rather than merely reading as something.",
    undeveloped:
      `${inf} stays a raw nerve, defended by the Hero. Externally everything may be working; ` +
      "internally nothing lands. This is the reading behind midlife crisis and the divorces that " +
      "cluster around it.",
  };

  const unconscious: Side = {
    ...build("unconscious"),
    plain:
      "The competent stranger who takes over in an emergency. It is reached by walking into what " +
      "you worry about instead of around it, and what it pays out is wisdom.",
    what:
      `The shadow four in their own order: ${nem} Hero, ${st[5]} Parent, ${st[6]} Child, ` +
      `${dem} Inferior. Structurally it is your Extinguishment partner — same functions as the ` +
      "ego, every attitude flipped.",
    blockedBy: `Worry. The Nemesis ${nem} runs the loop: "${NEMESIS_WORRY[nem]}".`,
    opensWith:
      "Failure, taken on the chin rather than explained away. The Nemesis is the villain in your " +
      "own story — its job is to hand you obstacles, and the obstacles are the curriculum.",
    atWill:
      `Deliberately engaging ${nem} instead of routing around it opens a genuinely different set ` +
      "of moves. People report it as becoming someone else briefly, and usually someone more capable.",
    forced:
      "If it is not developed on purpose it gets forced later — the three-quarter-life crisis, " +
      "which is the same mechanism as the midlife one, arriving for the other side.",
    produces: "Wisdom and maturity — the compound interest on pain you actually processed.",
    developed:
      "You can run the shadow deliberately and come back. Problems the ego cannot solve become " +
      "tractable, and the worry stops being a fence.",
    undeveloped:
      "Immaturity that does not read as immaturity from inside. The worry is obeyed, the failure " +
      "is narrated away, and the same lesson arrives again wearing a new hat.",
  };

  const superego: Side = {
    ...build("superego"),
    plain:
      "The worst version of you, and it is competent. It runs on the one function you like least, " +
      "and it only takes the wheel when the other three have failed.",
    what:
      `The shadow four reversed: your Demon ${dem} is this side's HERO. Structurally it is your ` +
      "Super-Ego partner — the relation the system already rates as fascinating at distance and " +
      "abrasive up close. Here it is not another person. It is you.",
    blockedBy: `Fear and anxiety, which is appropriate. The Demon ${dem}, ungoverned: ${DEMON_FEAR[dem]}.`,
    opensWith:
      "The failure of the other three. It activates when the ego cannot cope, the subconscious is " +
      "undeveloped and the unconscious was never opened.",
    atWill:
      "Going here directly, before the other three are developed, is the expedient route and it is " +
      "a bad trade — power now against the ego it intends to replace later.",
    forced:
      "Sustained stress, exhaustion, or anything that keeps you out of the ego long enough. It is " +
      "the side that shows up in the version of an argument you cannot afterwards account for.",
    produces:
      "Raw power. Destructive by default — roughly ninety-five percent of it — and convertible " +
      "only after the other three sides are genuinely developed.",
    developed:
      `The Demon ${dem} becomes usable on purpose and stops being a tripwire. This is last, not ` +
      "first: it is downstream of the other three, and there is no shortcut that does not cost the ego.",
    undeveloped:
      "A parasite persona. It presents as strength and behaves as corrosion, and its ambition is " +
      "not to help the ego but to replace it.",
  };

  return { ego, subconscious, unconscious, superego };
}

/** The order the sides are always presented in: ego, subconscious, unconscious, superego. */
export const SIDE_ORDER: SideKey[] = ["ego", "subconscious", "unconscious", "superego"];

/** The four gateway functions of a type, in the order you are meant to develop them. */
export function gateways(t: MbtiType): { side: SideKey; fn: Fn; egoSlot: SlotName }[] {
  const s = sides(t);
  return SIDE_ORDER.map((k) => ({ side: k, fn: s[k].gateway.fn, egoSlot: s[k].gateway.egoSlot }));
}

/** Backwards-compatible tuple: [ego, subconscious, unconscious, superego]. */
export function fourSides(t: MbtiType): [MbtiType, MbtiType, MbtiType, MbtiType] {
  const s = sides(t);
  return [s.ego.type, s.subconscious.type, s.unconscious.type, s.superego.type];
}
