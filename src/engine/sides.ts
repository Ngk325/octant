import { alpha, beta, omega, stack, fromPair, relation, type MbtiType } from "./core";
import { DOM_AUX, SLOT_NAMES, type Fn, type RelCode, type SlotName } from "./data";

/* ------------------------------------------------------------------ *
 * THE FOUR SIDES OF THE MIND
 *
 * A type is only a quarter of a person. The eight-slot stack is not one
 * stack — it is four four-slot stacks, each
 * of which is itself one of the sixteen types, and each of which has a
 * single function as its door.
 *
 * The derivation is already latent in core.ts: the three involutions
 * that generate the relation table also generate the sides.
 *
 *   Subconscious = omega(d), omega(x)   -> your COUNTERPART (relation code DU)
 *   Unconscious  = alpha(d), alpha(x)   -> your DAMPER partner (relation code EX)
 *   Superego     = beta(d),  beta(x)    -> your STANDOFF partner (relation code SE)
 *
 * That is not a coincidence and it is not decoration. REL_OPS.DU, .EX
 * and .SE in core.ts are literally the same three operators. The four
 * sides are four relations you hold with yourself, which is why the
 * relation carried by code SE and the structural side named "superego"
 * land on the same type. Asserted in tests/sides.test.ts.
 *
 * Each side's own Lead is the gateway into it:
 *   Ego          <- Lead   (open by default)
 *   Subconscious <- Cave   (blocked by insecurity)
 *   Unconscious  <- Doubt  (blocked by worry)
 *   Superego     <- Dread  (blocked by fear, and best kept shut)
 *
 * The dread function sits in the Cave slot of the unconscious and in
 * the LEAD slot of the superego. That single fact is why the superego
 * reads as a parasite persona rather than as another part of you: the
 * thing you like least is the thing it is best at.
 * ------------------------------------------------------------------ */

export type SideKey = "ego" | "subconscious" | "unconscious" | "superego";

/** The role a function plays *within its own side*, not within the ego. */
export type SideRole = "Lead" | "Support" | "Delight" | "Cave";
const SIDE_ROLES: SideRole[] = ["Lead", "Support", "Delight", "Cave"];

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
  /** How to tell you are in it right now — the self-assessment. */
  assess: string;
  /** Reaching it deliberately. */
  atWill: string;
  /** Reaching it involuntarily, because you did not do it deliberately. */
  forced: string;
  /** How to recognise this side running in someone else, and what actually helps. */
  interact: string;
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

/** The Cave, felt from inside. The subconscious door. */
const CAVE_INSECURITY: Record<Fn, string> = {
  Ne: "that you have missed the option everyone else can see, and that your one plan is about to be exposed as naive",
  Ni: "that you have no idea where any of this is going, and that everyone else is working from a map you were never given",
  Se: "that you cannot handle the room as it actually is — that you will be too slow, too clumsy, too late",
  Si: "that you cannot keep anything running — that the upkeep, the routine and the follow-through will find you out",
  Te: "that you cannot actually produce, and that when someone finally measures the output there will not be any",
  Ti: "that your reasoning does not hold, and that someone who thinks properly will take it apart in one question",
  Fe: "that the room has quietly decided against you, and that you are the only person who has not been told",
  Fi: "that there is nothing underneath — that if you stopped performing there would be no one there with values of their own",
};

/** The Cave, aspired to rather than defended. */
const CAVE_ASPIRATION: Record<Fn, string> = {
  Ne: "letting one unproven possibility stand without demanding precedent for it",
  Ni: "committing to a single line and letting it run long enough to arrive",
  Se: "meeting the present as it is rather than as the model predicted",
  Si: "honouring continuity — letting a structure stand long enough to compound",
  Te: "building the machinery that lets what you value actually scale",
  Ti: "testing whether a thing is true, not only whether it moves",
  Fe: "letting the work land with people before you count it as finished",
  Fi: "locating the value the whole enterprise was supposedly for",
};

/** The Doubt, felt from inside. The unconscious door. */
const DOUBT_WORRY: Record<Fn, string> = {
  Ne: "what if there is a possibility here I have not accounted for",
  Ni: "what if this is heading somewhere I will not be able to reverse",
  Se: "what if I am not watching closely enough and it happens right in front of me",
  Si: "what if I am repeating something that has already gone badly once",
  Te: "what if none of this is actually working and I am the last to know",
  Ti: "what if the reasoning has a hole in it that I put there myself",
  Fe: "what if I have already lost the room and nobody is going to say so",
  Fi: "what if I am doing something I would not be able to defend",
};

/** The Dread, felt from inside. The superego door — the one to leave shut. */
const DREAD_FEAR: Record<Fn, string> = {
  Ne: "possibility itself becomes threat: every open branch reads as a way this ends badly",
  Ni: "certainty of collapse — the vision arrives whole, and it is apocalyptic",
  Se: "the body is turned against the situation; destruction becomes the fastest available move",
  Si: "the record becomes an indictment, replayed in detail and used as evidence against yourself",
  Te: "efficiency turned on people — control for its own sake, and nobody is a person any more",
  Ti: "logic sharpened into a scalpel and used to dismantle a person rather than a problem",
  Fe: "the room's mood becomes a weapon, and you play it deliberately",
  Fi: "moral outrage with no off-switch and no proportion",
};

/**
 * The superego, caught from outside while it is running. Not the fear that opens the door —
 * the observable tell once it is through it, the thing a friend would notice before the
 * person running it would say it out loud. Used both to assess it in yourself and to
 * recognise it in someone else.
 */
export const DREAD_TELLS: Record<Fn, string> = {
  Ne: "they start narrating every branch as a trap, and the options multiply instead of narrow — nothing you say lands as reassurance, it only feeds the next branch",
  Ni: "they deliver a verdict, not a worry — flat, total, already decided, and stated as fact rather than offered as fear",
  Se: "the room gets physically smaller: voice, posture and movement all sharpen toward whoever or whatever is in front of them, a body that has decided to act before the mind has caught up",
  Si: "they start reciting your record back to you, in order, with dates — a ledger being read aloud, not a complaint",
  Te: "people stop being colleagues and start being line items; warmth reads as static and gets edited out along with everything else that is not throughput",
  Ti: "the argument gets very precise and very personal at the same time — it has stopped trying to be right and started trying to leave a mark",
  Fe: "the room's mood is being played like an instrument, deliberately, and they are watching for the reaction rather than feeling anything themselves",
  Fi: "\"I'm just being honest\" arrives escorted by contempt, and the moral high ground is being used as a weapon rather than held as a position",
};

/**
 * What actually de-escalates the superego, function by function. Aimed at whoever is
 * dealing with it — including the person running it, addressing themselves. Reasoning with
 * it on its own terms is what every wrong answer here has in common.
 */
export const DREAD_DEESCALATE: Record<Fn, string> = {
  Ne: "Do not offer a counter-branch — that is fuel. Narrow the field to one concrete next step, nothing hypothetical.",
  Ni: "Do not argue with the verdict directly. Ask what one specific thing would have to be true for it to be wrong — reintroducing a single variable breaks the totality.",
  Se: "Give the body somewhere to go. A genuine physical outlet, or a real physical exit, does more than any sentence will.",
  Si: "Do not defend the whole record — contest one date. A single factual correction breaks the ledger's authority faster than an apology does.",
  Te: "Hand them one measurable task with a clear finish line. The persona wants throughput; give it something legitimate to produce.",
  Ti: "Do not meet precision with precision — that is the game it wants. Name the move out loud: 'that was aimed at me, not at the problem.'",
  Fe: "Refuse to supply the reaction it is fishing for. Flat, low affect starves it faster than matching the mood or visibly withdrawing.",
  Fi: "Do not argue the ethics. Ask what it would cost the other person if this judgment turned out to be wrong — proportion is what is missing, not sincerity.",
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

  // Which ego-slot indices supply each side's Lead..Cave, in order.
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

  const cave = st[3], doubt = st[4], dread = st[7];

  const ego: Side = {
    ...build("ego"),
    plain:
      "The you that shows up without being asked. It is what a type test measures, and it is " +
      "about a quarter of you.",
    what:
      `The conscious four: ${st[0]} Lead, ${st[1]} Support, ${st[2]} Delight, ${st[3]} Cave. ` +
      "This is the side that has a reputation, holds down a job and answers to your name.",
    blockedBy: "Nothing — this door is already open. That is the problem with it.",
    opensWith: "Default operation. You are here unless something has pushed you out.",
    assess:
      "Nothing to detect — this is where every day starts and where you land the moment " +
      `nothing else is holding you. The one thing worth checking is whether you have overstayed: ` +
      `${st[0]} running on problems it was never built for, ${st[3]} never touched.`,
    atWill:
      `Leading with ${st[0]} and backing it with ${st[1]} is effortless, which is exactly why ` +
      "it gets overused: the Lead is reached for even on problems it is wrong for.",
    forced:
      "You are returned here automatically. When any other side tires the mind out, it drops " +
      "you back into the ego whether or not you were finished.",
    interact:
      "The version of someone most people already know, so there is nothing special to look " +
      `for. The one useful read: notice when their ${st[0]} is running on habit rather than fit, ` +
      `and ask for their ${st[1]} instead of more ${st[0]}.`,
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
      `Your ego stack turned upside down: ${cave} leads and ${st[0]} sits last. Structurally it is ` +
      "your Counterpart — the type whose wiring completes yours — which is why it is both the most " +
      "restful side and the hardest to get to.",
    blockedBy: `Insecurity. Specifically the fear ${CAVE_INSECURITY[cave]}.`,
    opensWith:
      `Humility, and then practice. The Cave ${cave} has to be converted from something you ` +
      `defend into something you aspire to: ${CAVE_ASPIRATION[cave]}.`,
    assess:
      "It feels like relief rather than effort: the function you usually defend goes quiet and " +
      "something closer to play runs it instead. If it arrives all at once, late and uninvited " +
      "rather than as a door you walked through on purpose, that is the forced version below, not " +
      "the developed one.",
    atWill:
      `When ${cave} is aspirational rather than defensive you can step into this side deliberately, ` +
      "and it is genuinely restorative — this is where play, wonder and contentment live.",
    forced:
      "If you do not do it on purpose, the mind does it for you. That involuntary version is the " +
      "midlife crisis, and it typically arrives somewhere between 38 and 48.",
    interact:
      "Someone in their subconscious is unusually easy to be around — soft, curious, undefended. " +
      "Treat the openness as rare rather than as an invitation to test it: it is not the same as " +
      "having no boundaries, it is a boundary lowered on purpose, or from exhaustion.",
    produces: "Humility, happiness, and the capacity to be delighted by something again.",
    developed:
      `${cave} is used without flinching. There is a childlike quality that is not childishness, ` +
      "and success starts to feel like something rather than merely reading as something.",
    undeveloped:
      `${cave} stays a raw nerve, defended by the Lead. Externally everything may be working; ` +
      "internally nothing lands. This is the reading behind midlife crisis and the divorces that " +
      "cluster around it.",
  };

  const unconscious: Side = {
    ...build("unconscious"),
    plain:
      "The competent stranger who takes over in an emergency. It is reached by walking into what " +
      "you worry about instead of around it, and what it pays out is wisdom.",
    what:
      `The shadow four in their own order: ${doubt} Lead, ${st[5]} Support, ${st[6]} Delight, ` +
      `${dread} Cave. Structurally it is your Damper partner — same functions as the ` +
      "ego, every attitude flipped.",
    blockedBy: `Worry. The Doubt ${doubt} runs the loop: "${DOUBT_WORRY[doubt]}".`,
    opensWith:
      "Failure, taken on the chin rather than explained away. The Doubt is the villain in your " +
      "own story — its job is to hand you obstacles, and the obstacles are the curriculum.",
    assess:
      "You are here when a problem your ego could not solve suddenly has a different set of moves " +
      "available — usually right after a failure you actually absorbed instead of explaining away. " +
      "It feels like being someone slightly more capable for a while, and it does not last.",
    atWill:
      `Deliberately engaging ${doubt} instead of routing around it opens a genuinely different set ` +
      "of moves. People report it as becoming someone else briefly, and usually someone more capable.",
    forced:
      "If it is not developed on purpose it gets forced later — the three-quarter-life crisis, " +
      "which is the same mechanism as the midlife one, arriving for the other side.",
    interact:
      "Someone in their unconscious is more resourceful and less predictable than their everyday " +
      "self, and worse company for reassurance. Hand them the actual problem rather than comfort — " +
      "this side wants to be used, not soothed.",
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
      "Usually the worst version of you, and it is competent — but it is the one side actually " +
      "built for real power, earned last rather than taken first. It runs on the function you " +
      "trust least, and it only takes the wheel when the other three have failed.",
    what:
      `The shadow four reversed: your Dread ${dread} is this side's LEAD. Structurally it is your ` +
      "Standoff partner — the relation the system already rates as fascinating at distance and " +
      "abrasive up close. Here it is not another person. It is you.",
    blockedBy: `Fear and anxiety, which is appropriate. The Dread ${dread}, ungoverned: ${DREAD_FEAR[dread]}.`,
    opensWith:
      "The failure of the other three. It activates when the ego cannot cope, the subconscious is " +
      "undeveloped and the unconscious was never opened.",
    assess:
      `Ask whether a friend would recognise this in you: ${DREAD_TELLS[dread]}. If the honest ` +
      "answer is yes, you are not overreacting to yourself — that is an accurate read of what is " +
      "currently driving.",
    atWill:
      "Going here directly, before the other three are developed, is the expedient route and it is " +
      "a bad trade — power now against the ego it intends to replace later.",
    forced:
      "Sustained stress, exhaustion, or anything that keeps you out of the ego long enough. It is " +
      "the side that shows up in the version of an argument you cannot afterwards account for.",
    interact:
      `What actually helps: ${DREAD_DEESCALATE[dread]} Reasoning with it, matching its intensity, ` +
      "or waiting it out in the same room all cost more than they fix — this is the one side where " +
      "leaving the room is a legitimate strategy, not a defeat.",
    produces:
      "Raw power. Destructive by default — roughly ninety-five percent of it — and convertible " +
      "only after the other three sides are genuinely developed.",
    developed:
      `The Dread ${dread} becomes usable on purpose and stops being a tripwire. This is last, not ` +
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
