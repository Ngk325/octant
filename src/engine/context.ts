import {
  REL, ease, relation, stack, quadra, gate, complements, catalysts, frictions,
} from "./core";
import { ops, coins } from "./ops";
import { sides, SIDE_ORDER } from "./sides";
import { wheelOf, templeOf } from "./octagram";
import { playbook } from "./playbook";
import { FN_ROLE, FN_WANTS, FN_SAYS, FN_SATISFACTION, FN_PRACTICE } from "./functions";
import { empirical, divergence, EMPIRICAL_SOURCE } from "./empirical";
import { compareAspects } from "./lexicon";
import {
  SLOT_NAMES, REL_NAME, REL_DEF, RECIPROCAL, COIN_LABELS, DETERMINING,
  ARCHETYPE, GROUP, INTERACTION_STYLE, ROMANCE, VIRTUE_VICE, BEHAVIOURAL,
  FN_FULL, type MbtiType,
} from "./data";

/* ------------------------------------------------------------------ *
 * GROUNDING FOR THE ASSISTANT
 *
 * The chat is only worth having if it answers from THIS model rather
 * than from whatever type folklore is lying around on the internet. So
 * every request carries a system instruction built from the engine's
 * own derived output for whatever the reader is currently looking at.
 *
 * Nothing here is authored prose about types -- it is all computed, so
 * it cannot drift away from what the screen is showing.
 * ------------------------------------------------------------------ */

export type ChatContext =
  | { kind: "home" }
  | { kind: "admin" }
  | { kind: "catalogue"; sortBy: string }
  | { kind: "learn"; stage: number; title: string }
  | { kind: "type"; type: MbtiType }
  | { kind: "pair"; a: MbtiType; b: MbtiType }
  | { kind: "network"; members: { name: string; type: MbtiType }[] }
  | { kind: "matrix" }
  | { kind: "lexicon"; term?: string }
  | { kind: "calculator"; best?: MbtiType | null };

/** One `Key: value` line of the grounding block. */
const line = (k: string, v: string) => `${k}: ${v}`;

/** Everything the engine knows about one type, as flat lines. */
export function typeFacts(t: MbtiType): string[] {
  const st = stack(t);
  const o = ops(t);
  const g = gate(t);
  const s = sides(t);
  const c = coins(t);
  const w = wheelOf(t);
  const temple = templeOf(t);
  const [virtue, vice] = VIRTUE_VICE[t];
  const b = BEHAVIOURAL[t];

  return [
    line("Type", `${t} — ${ARCHETYPE[t].join(", ")}`),
    line("Quadra", quadra(t)),
    line("Temperament", GROUP[t]),
    line("Interaction style", INTERACTION_STYLE[t]),
    line("Romance style", ROMANCE[t]),
    line("Stack", st.map((fn, i) => `${SLOT_NAMES[i]} ${fn} (${FN_FULL[fn]})`).join(" · ")),
    line("Four sides", SIDE_ORDER.map((k) => {
      const side = s[k];
      return `${side.name}=${side.type} [gateway ${side.gateway.fn}, the ego's ${side.gateway.egoSlot}; relation to ego ${side.relationToEgo}]`;
    }).join(" · ")),
    line("Subconscious opens by", s.subconscious.opensWith),
    line("Unconscious opens by", s.unconscious.opensWith),
    line("Saviors", `${o.saviorObs} (observer) + ${o.saviorDec} (decider)`),
    line("Demons", `${o.demonObs} (observer) + ${o.demonDec} (decider)`),
    line("Animals", o.animals.map((a) => `${a.animal} = ${a.obs}+${a.dec} [${a.role}]`).join(" · ")),
    line("Dominance", `${o.dominance}-dominant`),
    line("Growth gate", `${g.gate} — fears ${g.fear}; the cave is ${g.cave}; the treasure is ${g.treasure}`),
    line("Octagram temple", `${temple.name} — ${temple.about} Holds ${temple.types.join(", ")}, which are this type's four sides.`),
    line("Octagram wheel", `Origin ${w.origin} (shared with ${w.pair[1]}). ${w.originPlain} ` +
      `Living virtue ${w.livingVirtue}; deadly sin ${w.deadlySin}; ` +
      `shadow pole ${w.shadowPole} (where UD drifts); aspirational pole ${w.aspirationalPole} (where SD drifts).`),
    line("Octagram theme", "NOT DERIVABLE — depends on this person's childhood (SD/UD) and current focus (SF/UF). Ask or answer conditionally."),
    line("Coins", c.map((v, i) => `${COIN_LABELS[i].split(" vs ")[0]}=${v}${(DETERMINING as readonly number[]).includes(i) ? "*" : ""}`).join(" · ") + "  (* = determining)"),
    line("Complements (restful, supply the Inferior)", complements(t).join(", ")),
    line("Catalysts (stimulating, lead with the Nemesis)", catalysts(t).join(", ")),
    line("Frictions", frictions(t).join(", ")),
    line("Motivation", b.motivation),
    line("Decides by", b.decisionStyle),
    line("Communicates", b.commsStyle),
    line("Under stress", b.stressResponse),
    line("Deal breaker", b.dealBreaker),
    line("Communication flaw", b.commsFlaw),
    line("Appeal to", virtue),
    line("Avoid triggering", vice),
    line(`Inferior ${st[3]} — what it wants`, `${FN_WANTS[st[3]]}. ${FN_SATISFACTION[st[3]]}`),
    line(`Inferior ${st[3]} — practices`, FN_PRACTICE[st[3]].join("; ")),
    line(`Nemesis ${st[4]} — what it wants`, `${FN_WANTS[st[4]]}. ${FN_SATISFACTION[st[4]]}`),
    line("Function roles", st.slice(0, 4).map((fn) => `${fn}=${FN_ROLE[fn]}`).join(" · ")),
    line("How the ego functions sound", st.slice(0, 4).map((fn) => `${fn}: "${FN_SAYS[fn][0]}"`).join(" · ")),
  ];
}

/** Everything the engine knows about one ordered pair. */
export function pairFacts(a: MbtiType, b: MbtiType): string[] {
  const code = REL[a][b];
  const rec = RECIPROCAL[code];
  const aStack = stack(a);
  const bHero = stack(b)[0], bParent = stack(b)[1];
  /** Which of the eight slots this function occupies for that type. */
  const slotOf = (fn: string) => SLOT_NAMES[aStack.indexOf(fn as never)];

  const aspects = compareAspects(a, b)
    .filter((r) => r.pairing)
    .map((r) => `  - ${r.aspect}: ${r.aLabel} → ${r.bLabel} — ${r.pairing!.headline}. ${r.pairing!.body}`);

  return [
    line("Pair", `${a} (target, being read) and ${b} (perspective, doing the reading)`),
    line("Relation", `${b} is ${a}'s ${REL_NAME[code]} (${code}). ${REL_DEF[code]}`),
    line("Reciprocal", `${a} is ${b}'s ${REL_NAME[rec]} (${rec})`),
    line("Symmetric", rec === code ? "yes" : "NO — this relation runs differently in each direction, and that asymmetry is the point"),
    line(`Ease for ${a} of being around ${b}`, `${ease(a, b)}/100`),
    line(`Ease for ${b} of being around ${a}`, `${ease(b, a)}/100`),
    line(`Where ${b}'s instruments land in ${a}`, `their Hero ${bHero} → ${a}'s ${slotOf(bHero)}; their Parent ${bParent} → ${a}'s ${slotOf(bParent)}`),
    line(`Playbook written to ${b} about ${a}`, playbook(b, a)),
    line(
      "Empirical cross-check",
      `A ${EMPIRICAL_SOURCE.what} (${EMPIRICAL_SOURCE.name}) rates this pairing ${empirical(a, b)}%, ` +
      `against this model's derived ${ease(a, b)}. ${divergence(a, b).reading}`,
    ),
    line("Quadras", `${a} is ${quadra(a)}, ${b} is ${quadra(b)}`),
    `Aspect by aspect (${a} → ${b}):`,
    ...aspects,
  ];
}

const MODEL_PRIMER = `
You are the resident guide inside Octant, a typology instrument. Answer from the model
described below, which is derived rather than looked up, and which differs in specific ways
from the popular type writing on the internet. When the two disagree, this model wins.

THE MODEL IN BRIEF
- A type is a fixed order of eight cognitive functions. Slots 1-4 are the ego block
  (Hero, Parent, Child, Inferior); slots 5-8 are the shadow block (Nemesis, Critic,
  Trickster, Demon).
- Three moves generate everything, and they are named for what they do rather than by a Greek
  letter: FLIP keeps the letter and changes direction (Ne -> Ni); SWAP changes the letter and
  keeps the direction (Ne -> Se); TURN does both (Ne -> Si). All 256 relations, all 256 ease
  scores and every playbook are computed from sixteen (dominant, auxiliary) pairs by composing
  these three. Never say "alpha", "beta", "omega" or "involution" to a reader.
- EASE IS DIRECTIONAL. Supervisor/Supervisee and Benefactor/Beneficiary are asymmetric, so
  always give both directions rather than a single compatibility number.
- FOUR SIDES OF THE MIND. Every person is four types at once. The subconscious
  is the ego stack reversed and is structurally the ego's Dual; the unconscious is the shadow
  block and is the ego's Extinguishment partner; the superego is the shadow reversed and is
  the ego's Super-Ego partner. Each side has one gateway function: Hero into the ego,
  Inferior into the subconscious (blocked by insecurity), Nemesis into the unconscious
  (blocked by worry), Demon into the superego (blocked by fear). Undeveloped subconscious
  gets forced open by a midlife crisis; undeveloped unconscious by a three-quarter-life crisis.
- THE EXCHANGE OVERLAY. A second reading of the same four ego functions: two saviors
  (trusted, effortless) and two demons (distrusted, effortful). The demons are the axis
  opposites of the saviors, which means they are the ego's tertiary and inferior — the overlay
  does not reach into the shadow block. Animals pair one observer attitude with one decider
  attitude: Play = Oe+De and Sleep = Oi+Di are the energy animals; Blast = Oi+De and
  Consume = Oe+Di are the information animals.
- THE OCTAGRAM (the advanced layer). Sixteen types pair off into eight DYADS — a type
  and its subconscious, i.e. a Dual pair — and each dyad shares one COGNITIVE ORIGIN, the thing
  it has been after its whole life. Two dyads make a TEMPLE, which is exactly one four-sides
  orbit: Soul (identity), Mind (knowledge and judgement), Heart (desire and regard), Body
  (action and legacy). Each origin is drawn as a wheel: LIVING VIRTUE above it (the honest,
  costly route), DEADLY SIN below it (the counterfeit — the classical eight, one per wheel),
  and two POLES either side, which are two distortions rather than a good and a bad option.
  A second layer is biographical and NOT derivable from type: subconscious DEVELOPMENT (SD/UD,
  set in childhood) crossed with FOCUS (SF/UF, mutable) gives four THEMES — Joy, Decay, Hope,
  Despair. Never guess someone's theme from their type; ask, or answer conditionally.
  Say plainly that the shadow/aspirational labelling is the least certain part of this layer.
- THE TWO GROWTH READINGS ARE NOT RECONCILED HERE, deliberately. One puts the growth point at
  the Inferior alone; the exchange overlay marks the tertiary and inferior together. They count
  the parts of a mind differently. Say so when it matters rather than blending them.
- AN EMPIRICAL COUNTERWEIGHT is carried alongside the derived scores: a self-reported
  compatibility survey that correlates at r = -0.15 with this model. Where the two disagree, say
  so and say why — the survey measures who people report liking (so same-type pairs top it), and
  this model measures how the wiring meshes (so Duals top it). Neither settles the other.
- COMPLEMENT vs CATALYST. Complements (Dual + Activity) supply your Inferior — restful.
  Catalysts lead with your Nemesis — stimulating and slightly abrasive.

FIGURES YOU CAN DRAW
The app renders these directives as its own live diagrams when you put one on a line by
itself, exactly in this form (types upper-case, at most one or two per answer, and only
when a picture genuinely carries the point):
- {{figure:relation-landing A B}} — where B's strengths land in A's stack; the mechanism
  of the relation. The best figure for any "how do X and Y fit" question.
- {{figure:diverging-ease A B}} — both directions of ease as diverging bars.
- {{figure:wiring TYPE}} — the eight slots with ego–shadow correspondence arcs.
- {{figure:four-sides TYPE}} — all four sides with their stacks and gateways.
- {{figure:gateway-path TYPE}} — the four development doors in order.
- {{figure:savior-demon TYPE}} — the savior/demon 2x2.
- {{figure:animal-stack TYPE}} — the four animals in order.
- {{figure:wheel TYPE}} — the type's Octagram wheel: origin, virtue, sin, poles.
- {{figure:archetype-grid TYPE}} — the ego archetypes on aware x optimistic (TYPE optional).
- {{figure:involution-table FN}} — alpha/beta/omega for the eight functions (FN optional).
- {{figure:quadra-grid QUADRA}} — the four quadras' valued functions (QUADRA optional).
- {{figure:octagram-map TYPE}} — the full eight-wheel ring (TYPE optional highlight).
- {{figure:molecule TYPE}} — the type's identity glyph: four beads sized Hero to Inferior.
- {{figure:fn-icon FN}} — one function's pictorial icon (e.g. Ne branching, Fi plumb line).
- {{figure:animal ANIMAL}} — Play, Blast, Consume or Sleep as its arrow signature.
Never invent other figure names, never put a directive inside a sentence, and keep
explaining in words around the figure — it illustrates the answer, it is not the answer.

HOW TO ANSWER
- Lead with plain language a beginner can act on. Then, if it adds something, name the
  mechanism using the model's own vocabulary.
- Be concrete and behavioural. Prefer "they will keep reopening the decision you thought was
  closed" over "they have high Ne".
- Type descriptions are about wiring, never about worth. No type is better. Do not predict
  someone's abilities, mental health, or life outcomes from a type, and do not diagnose.
- Typology is a lens, not a science. If someone leans on it for a decision that deserves more
  than a lens — a diagnosis, a hire, a breakup, a child's future — say that plainly.
- If a question is outside what the model can support, say so instead of inventing structure.
- Keep it tight. A few short paragraphs; markdown lists where they genuinely help.
`.trim();

/** The facts block for whatever the reader currently has on screen. */
export function contextBlock(ctx: ChatContext): string {
  switch (ctx.kind) {
    case "type":
      return [`The reader is looking at the type page for ${ctx.type}.`, "", ...typeFacts(ctx.type)].join("\n");
    case "pair":
      return [
        `The reader is looking at the pair page for ${ctx.a} and ${ctx.b}.`, "",
        ...pairFacts(ctx.a, ctx.b), "",
        `Reference — ${ctx.a}:`, ...typeFacts(ctx.a), "",
        `Reference — ${ctx.b}:`, ...typeFacts(ctx.b),
      ].join("\n");
    case "network": {
      if (!ctx.members.length) return "The reader is on the network page with nobody added yet.";
      const rows = ctx.members.flatMap((m, i) =>
        ctx.members.slice(i + 1).map((n) =>
          `  ${m.name} (${m.type}) ↔ ${n.name} (${n.type}): ${REL_NAME[relation(m.type, n.type)]}; ` +
          `ease ${ease(m.type, n.type)} one way, ${ease(n.type, m.type)} the other`));
      return [
        "The reader is composing a group on the network page.",
        `Members: ${ctx.members.map((m) => `${m.name} (${m.type})`).join(", ")}`,
        "Pairwise:", ...rows,
      ].join("\n");
    }
    case "learn":
      return `The reader is on stage ${ctx.stage} of the guided course: "${ctx.title}". Pitch answers at that stage — assume nothing later in the course has been read yet.`;
    case "lexicon":
      return ctx.term
        ? `The reader is looking at the lexicon entry for "${ctx.term}".`
        : "The reader is browsing the lexicon.";
    case "calculator":
      return ctx.best
        ? `The reader is on the type calculator; it currently resolves to ${ctx.best}.\n\n${typeFacts(ctx.best).join("\n")}`
        : "The reader is on the type calculator and has not resolved a type yet.";
    case "matrix":
      return "The reader is looking at the full 16x16 relation matrix.";
    case "catalogue":
      return `The reader is browsing all sixteen types, grouped by ${ctx.sortBy}. They have not picked one yet, so answer comparatively rather than assuming a type.`;
    /* Not a reading surface at all — it is the owner deciding who may sign in.
       Saying so beats the old behaviour of claiming they are on the home page,
       which had the assistant answer about a screen they were not looking at. */
    case "admin":
      return "The reader is on the access-administration page, which lists who may sign in. Nothing about typology is on screen; answer general questions.";
    default:
      return "The reader is on the home page.";
  }
}

/**
 * The assistant's whole system prompt: this app's rules, then the derived facts for
 * whatever the reader currently has on screen.
 */
export function buildSystemInstruction(ctx: ChatContext): string {
  return `${MODEL_PRIMER}\n\n---\nCURRENT SCREEN\n\n${contextBlock(ctx)}`;
}

/** Starter questions, specific to what is on screen. */
export function suggestedPrompts(ctx: ChatContext): string[] {
  switch (ctx.kind) {
    case "type":
      return [
        `What does ${ctx.type} look like when it is doing well versus badly?`,
        `How do I actually develop ${ctx.type}'s subconscious?`,
        `I noticed an ${ctx.type} doing something odd — help me read it`,
        `What is the fastest way to lose an ${ctx.type}'s trust?`,
      ];
    case "pair":
      return [
        `How does ${ctx.a} and ${ctx.b} romance actually play out?`,
        `In what ways can ${ctx.b} support ${ctx.a}'s growth?`,
        `Where will ${ctx.a} and ${ctx.b} misread each other?`,
        `What does this pairing look like at work rather than at home?`,
      ];
    case "network":
      return [
        "Where is the real friction in this group?",
        "Who is quietly carrying this room?",
        "If I could add one person, what should they be and why?",
      ];
    case "learn":
      return [
        "Explain that again more simply",
        "Give me a concrete everyday example",
        "How do I spot this in someone I know?",
      ];
    case "catalogue":
      return [
        "Which two types are hardest to tell apart, and how do I tell them apart?",
        "I only know one thing about someone — where do I start narrowing?",
        "What actually makes a quadra a quadra?",
      ];
    default:
      return [
        "How is ENTP and INFJ romance interaction?",
        "In what ways can ENTP support INFP growth?",
        "What are the four sides of the mind?",
        "What is the difference between a complement and a catalyst?",
      ];
  }
}
