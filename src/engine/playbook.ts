import { REL, stack, type MbtiType } from "./core";
import {
  DOM_AUX, SLOT_NAMES, REL_FRAME, FN_INSTRUMENT, SLOT_EFFECT, CHILD_HOOK,
  INFERIOR_GUARD, TRICKSTER_BLIND, FN_SHADOW, type Fn, type SlotName,
} from "./data";

const COMPLETING = new Set(["DU", "AC", "HD", "MG"]);

/** Composed per-pair, from where the reader's Lead and Support land in the target's stack. */
export function playbook(perspective: MbtiType, target: MbtiType): string {
  const code = REL[target][perspective];
  const ts = stack(target);
  const slotOf = Object.fromEntries(ts.map((fn, i) => [fn, SLOT_NAMES[i]])) as Record<Fn, SlotName>;
  const [pLead, pSupport] = DOM_AUX[perspective];
  const [, , tDelight, tCave, , , tBlindSpot, tDread] = ts;
  const completing = COMPLETING.has(code);

  /** What it means for one person's function to land in a given slot of another's stack. */
  const effect = (slot: SlotName) =>
    slot === "Cave" && completing
      ? "their fear, and precisely what you are equipped to supply \u2014 offer it as a service, never as a requirement"
      : SLOT_EFFECT[slot];

  const parts: string[] = [REL_FRAME[code]];
  parts.push(
    `Lead with your ${pLead} (${FN_INSTRUMENT[pLead]}); in their stack it sits at ` +
    `${slotOf[pLead]}, which is ${effect(slotOf[pLead])}.`,
  );
  parts.push(`Back it with your ${pSupport}, landing on their ${slotOf[pSupport]}.`);
  if (tDelight !== pLead && tDelight !== pSupport) {
    parts.push(`Open through their Delight ${tDelight}: ${CHILD_HOOK[tDelight]}.`);
  }
  if (!(completing && (tCave === pLead || tCave === pSupport))) {
    parts.push(`Shield their Cave ${tCave} \u2014 ${INFERIOR_GUARD[tCave]}.`);
  }
  if (tBlindSpot === pLead || tBlindSpot === pSupport) {
    parts.push(
      `Because ${tBlindSpot} is your instrument and their Blind spot, they will bluff ` +
      `fluency in ${TRICKSTER_BLIND[tBlindSpot]} rather than concede it \u2014 read agreement there ` +
      `as noise. Do not corner them into Dread ${tDread}: ${FN_SHADOW[tDread].toLowerCase()}`,
    );
  } else {
    parts.push(
      `Never test them on Blind spot ${tBlindSpot} (${TRICKSTER_BLIND[tBlindSpot]}), and do not ` +
      `corner them into Dread ${tDread}: ${FN_SHADOW[tDread].toLowerCase()}`,
    );
  }
  return parts.join(" ");
}
