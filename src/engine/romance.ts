import { stack, gate, complements, catalysts } from "./core";
import { ops, ANIMAL_LABEL, ANIMAL_DOES } from "./ops";
import type { MbtiType, Fn } from "./data";

/* ------------------------------------------------------------------ *
 * ROMANTIC DYNAMICS — derived, not assigned.
 *
 * Octant does not hold a table of static romantic archetypes — no
 * fixed "Victim / Playful / Aggressor / Caregiver" four-box assigned
 * one per type, borrowed or relabelled from elsewhere. Instead romance
 * runs through three things this engine already computes for other
 * reasons:
 *
 *   - the Cave (the feared, growth-charged slot) and the Doubt (the
 *     slot a person is consciously reaching for) — see core.ts gate()
 *   - Complements and Catalysts — the two types whose Lead lands
 *     exactly on those two slots — see core.ts complements()/catalysts()
 *   - the Animal — how a type's saviors move (Play/Sleep/Blast/Consume)
 *     — see ops.ts
 *
 * A solo reading (one type, no partner) comes from a type's own Lead,
 * Animal and Cave. A pair reading names the actual mechanism between
 * two specific types — Dual, Activity, Catalyst, or none of those —
 * rather than describing every pair as if it were the strongest case.
 * ------------------------------------------------------------------ */

export interface SoloRomance {
  lead: Fn;
  animal: string;
  animalDoes: string;
  cave: Fn;
  fear: string;
  /** This type's Dual — the type whose Lead lands exactly on its Cave. */
  dual: MbtiType;
  /** This type's Activity partner — one move off the Cave, a lighter version. */
  activity: MbtiType;
  text: string;
}

/** How one type moves in romance on its own — no partner required. */
export function soloRomance(t: MbtiType): SoloRomance {
  const st = stack(t);
  const lead = st[0];
  const cave = st[3];
  const animal = ops(t).doubleSavior;
  const animalLabel = ANIMAL_LABEL[animal];
  const animalDoes = ANIMAL_DOES[animal];
  const { fear } = gate(t);
  const [dual, activity] = complements(t);

  const text =
    `${t} leads with ${lead}. In romance this moves as ${animalLabel} energy: ${animalDoes} ` +
    `The real vulnerability sits at the Cave (${cave}) — the structural fear behind it is ` +
    `${fear.toLowerCase()}. A partner whose own Lead is ${cave} meets that most directly: ` +
    `that is ${dual}, this type's Dual. ${activity} (its Activity partner) supplies a lighter, ` +
    `less exact version of the same relief.`;

  return { lead, animal: animalLabel, animalDoes, cave, fear, dual, activity, text };
}

export type RomanceMechanism = "dual" | "activity" | "catalyst" | "other";

export interface PairRomance {
  mechanism: RomanceMechanism;
  text: string;
}

/**
 * How `b` lands on `a`, romantically — one direction. Call it both ways for
 * a pair, the same way ease and playbooks are read in both directions
 * elsewhere: the mechanism is not guaranteed to be the same from `a`'s side
 * as from `b`'s.
 */
export function pairRomance(a: MbtiType, b: MbtiType): PairRomance {
  const aStack = stack(a);
  const cave = aStack[3];
  const doubt = aStack[4];
  const bLead = stack(b)[0];
  const bAnimalDoes = ANIMAL_DOES[ops(b).doubleSavior];
  const { fear } = gate(a);

  const [dual, activity] = complements(a);

  if (b === dual) {
    return {
      mechanism: "dual",
      text:
        `${b} leads with ${bLead} — exactly ${a}'s Cave. ${bAnimalDoes} That lands as the most ` +
        `direct relief available for ${a}'s structural fear (${fear.toLowerCase()}): restful ` +
        `rather than effortful, because ${b} is not performing ${bLead}, it is simply where ` +
        `they live.`,
    };
  }

  if (b === activity) {
    return {
      mechanism: "activity",
      text:
        `${b} leads with ${bLead} — one move off ${a}'s Cave (${cave}) rather than sitting on it ` +
        `exactly. ${bAnimalDoes} Real relief, lighter and more occasional than a Dual pairing: ` +
        `stimulating in a good way, not yet foundational.`,
    };
  }

  if (catalysts(a).includes(b)) {
    return {
      mechanism: "catalyst",
      text:
        `${b} leads with ${bLead} — exactly ${a}'s Doubt, the thing ${a} is consciously reaching ` +
        `for rather than defended about. ${bAnimalDoes} Stimulating and a little abrasive rather ` +
        `than restful: ${a} is drawn toward it, not soothed by it.`,
    };
  }

  return {
    mechanism: "other",
    text:
      `${b}'s Lead (${bLead}) does not land on ${a}'s Cave (${cave}) or Doubt (${doubt}) — ` +
      `romance here is not carried by a growth-edge mechanic. Whatever pull exists comes from ` +
      `the relation and ease between them, not from ${b} relieving or stimulating a specific ` +
      `structural spot in ${a}.`,
  };
}
