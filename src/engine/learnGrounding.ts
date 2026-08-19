import { omega, stack } from "./core";
import { powersOf } from "./powers";
import { sides } from "./sides";
import { SLOT_NAMES, type MbtiType } from "./data";
import { CONCEPT_PLAIN, SLOT_PLAIN, powersPlain } from "./plain";

/* ------------------------------------------------------------------ *
 * COURSE GROUNDING FOR THE ASSISTANT
 *
 * A reader on a course stage should get answers about THAT lesson, not a
 * plausible-sounding reconstruction of it from the title alone. This reuses
 * the exact plain-language copy the stage itself opens with — the same
 * CONCEPT_PLAIN / SLOT_PLAIN strings curriculum.tsx renders — so the two
 * cannot drift apart, without importing curriculum.tsx's own file (which
 * pulls in the whole view-component tree) into the Worker bundle.
 *
 * Where the lesson is worked through the reader's own example type,
 * the corresponding engine call (stack, powersOf, sides) is redone here,
 * so the assistant can talk about the reader's actual worked example
 * rather than only the generic version of the lesson.
 * ------------------------------------------------------------------ */

/** The stage's own opening explainer, jargon-free — one per slug, generic (not type-specific). */
const TOPIC: Record<string, string> = {
  functions: CONCEPT_PLAIN.function,
  order: CONCEPT_PLAIN.stack,
  ego: CONCEPT_PLAIN.ego,
  shadow:
    "The bottom four still run. They just do not feel like you doing something — they feel like " +
    "something happening to you. Each shadow seat is the attitude-flip of its ego counterpart: " +
    "the Doubt is the Lead's function in the opposite attitude, and so on down the stack.",
  powers:
    "No new data — this reads the Lead and the Dread, one question each: what runs so strong it " +
    "looks involuntary, and what one setting undoes it.",
  "four-sides":
    `${CONCEPT_PLAIN.ego.split(".")[0]}. Split the eight seats into four groups of four and each ` +
    "group is itself one of the sixteen types: the subconscious is the ego stack reversed, the " +
    "unconscious is the shadow block read forwards, the superego is the shadow reversed.",
  growth:
    `${CONCEPT_PLAIN.gateway} A midlife crisis is the subconscious being forced open because it ` +
    "was never opened on purpose; a three-quarter-life crisis is the unconscious doing the same, " +
    "later. Both are avoidable by developing the relevant gateway function deliberately, before " +
    "life forces it.",
  exchange: `${CONCEPT_PLAIN.savior} ${CONCEPT_PLAIN.demon} ${CONCEPT_PLAIN.animal}`,
  quadras: CONCEPT_PLAIN.quadra,
  relations: `${CONCEPT_PLAIN.ease} ${CONCEPT_PLAIN.directional}`,
  bonds: `${CONCEPT_PLAIN.bond} ${CONCEPT_PLAIN["spark-mesh"]}`,
  groups:
    "Once you can score any two people in both directions, a group is just that many pairwise " +
    "numbers — which turns vague questions like who is struggling, or who is quietly holding a " +
    "room together, into something you can actually compute.",
  octagram: [
    CONCEPT_PLAIN.octagram, CONCEPT_PLAIN.temple, CONCEPT_PLAIN.wheel, CONCEPT_PLAIN.origin,
    CONCEPT_PLAIN["living-virtue"], CONCEPT_PLAIN["deadly-sin"],
    CONCEPT_PLAIN["shadow-pole"], CONCEPT_PLAIN["aspirational-pole"],
  ].join(" "),
  "octagram-theme": [CONCEPT_PLAIN.development, CONCEPT_PLAIN.focus, CONCEPT_PLAIN.theme].join(" "),
  "borrowed-wiring":
    "Reading someone else is the same landing operation that predicts ease and writes playbooks, " +
    "read as instruction rather than description. Performing a function that is not natively " +
    "yours costs something real, roughly in proportion to how far it sits from your own Lead — " +
    "sustain one long enough and it stops being a performance. This is meant for understanding " +
    "people, not for hiding your reasoning from the person you are reading.",
};

/** The reader's worked example, made concrete for stages that use one. */
function workedExample(slug: string, t: MbtiType): string | null {
  const st = stack(t);
  switch (slug) {
    case "order":
      return `Worked example — ${t}: top slot (Lead) is ${st[0]}, effortless; bottom slot (Dread) is ${st[7]}, barely runs.`;
    case "ego":
      return `Worked example — ${t}'s top four: ` +
        SLOT_NAMES.slice(0, 4).map((name, i) => `${name} ${st[i]} (${SLOT_PLAIN[name].split(".")[0].toLowerCase()})`).join(", ") + ".";
    case "shadow":
      return `Worked example — ${t}'s bottom four: ` +
        SLOT_NAMES.slice(4).map((name, i) => `${name} ${st[i + 4]}`).join(", ") + ".";
    case "powers": {
      const { superpower, kryptonite } = powersOf(t);
      return `Worked example — ${powersPlain(t, superpower.fn, kryptonite.fn)}`;
    }
    case "bonds":
      return `Worked example — ${t} leads ${st[0]}, so its axis bond partner is whoever leads ` +
        `${omega[st[0]]}: each is effortlessly good at the thing the other carries in the Cave.`;
    case "four-sides":
    case "growth": {
      const s = sides(t);
      return `Worked example — ${t}: subconscious (${s.subconscious.plain}) unconscious (${s.unconscious.plain}) superego (${s.superego.plain})`;
    }
    default:
      return null;
  }
}

/**
 * The grounding paragraph for one course stage, optionally worked through
 * the reader's own example type. Unknown slugs (should not happen — the
 * client only ever publishes a real one) fall back to an empty string
 * rather than throwing, so a stale slug degrades to "no extra grounding"
 * instead of a 500.
 */
export function learnGrounding(slug: string, exampleType?: MbtiType | null): string {
  const topic = TOPIC[slug];
  if (!topic) return "";
  const worked = exampleType ? workedExample(slug, exampleType) : null;
  return worked ? `${topic}\n\n${worked}` : topic;
}
