import { REL, stack, type MbtiType } from "./core";
import {
  DOM_AUX, SLOT_NAMES, REL_FRAME, FN_INSTRUMENT, SLOT_EFFECT, CHILD_HOOK,
  INFERIOR_GUARD, TRICKSTER_BLIND, FN_SHADOW, type Fn,
} from "./data";

const COMPLETING = new Set(["DU", "AC", "HD", "MG"]);

/** Composed per-pair, from where the reader's Hero and Parent land in the target's stack. */
export function playbook(perspective: MbtiType, target: MbtiType): string {
  const code = REL[target][perspective];
  const ts = stack(target);
  const slotOf = Object.fromEntries(ts.map((fn, i) => [fn, SLOT_NAMES[i]])) as Record<Fn, string>;
  const [pHero, pParent] = DOM_AUX[perspective];
  const [, , tChild, tInf, , , tTrick, tDemon] = ts;
  const completing = COMPLETING.has(code);

  const effect = (slot: string) =>
    slot === "Inferior" && completing
      ? "their fear, and precisely what you are equipped to supply \u2014 offer it as a service, never as a requirement"
      : SLOT_EFFECT[slot];

  const parts: string[] = [REL_FRAME[code]];
  parts.push(
    `Lead with your ${pHero} (${FN_INSTRUMENT[pHero]}); in their stack it sits at ` +
    `${slotOf[pHero]}, which is ${effect(slotOf[pHero])}.`,
  );
  parts.push(`Back it with your ${pParent}, landing on their ${slotOf[pParent]}.`);
  if (tChild !== pHero && tChild !== pParent) {
    parts.push(`Open through their Child ${tChild}: ${CHILD_HOOK[tChild]}.`);
  }
  if (!(completing && (tInf === pHero || tInf === pParent))) {
    parts.push(`Shield their Inferior ${tInf} \u2014 ${INFERIOR_GUARD[tInf]}.`);
  }
  if (tTrick === pHero || tTrick === pParent) {
    parts.push(
      `Because ${tTrick} is your instrument and their Trickster, they will bluff ` +
      `fluency in ${TRICKSTER_BLIND[tTrick]} rather than concede it \u2014 read agreement there ` +
      `as noise. Do not corner them into Demon ${tDemon}: ${FN_SHADOW[tDemon].toLowerCase()}`,
    );
  } else {
    parts.push(
      `Never test them on Trickster ${tTrick} (${TRICKSTER_BLIND[tTrick]}), and do not ` +
      `corner them into Demon ${tDemon}: ${FN_SHADOW[tDemon].toLowerCase()}`,
    );
  }
  return parts.join(" ");
}
