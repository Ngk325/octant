import { stack, type MbtiType } from "./core";
import { VIRTUE_VICE, FN_SHADOW, FN_LONG, BEHAVIOURAL, type Fn } from "./data";
import { FN_ROLE, FN_WANTS } from "./functions";

/* ------------------------------------------------------------------ *
 * SUPERPOWERS AND KRYPTONITE
 *
 * Not a new fact about anyone. The eight-slot stack already carries both
 * halves of this — the Lead (slot 1, "your strongest move... and you
 * overuse it") and the Dread (slot 8, "your worst setting... when it is
 * on, it is doing damage") are the same two slots this app has shown
 * since the first stack rendered. This module asks one question of each:
 * what runs so strong it looks involuntary, and what one setting undoes
 * it. It is a COMPOSITION, not a table — every field below is read off
 * data that already exists elsewhere (the stack, the function library,
 * the virtue/vice pair, the behavioural profile). 16 of 16, derived, no
 * lookup table of its own.
 * ------------------------------------------------------------------ */

/** The Lead, read as a strength: what it is, what it chases, who backs it up. */
export interface Superpower {
  fn: Fn;
  role: string;
  wants: string;
  what: string;
  /** The Support function — what backs the Lead up before it overreaches alone. */
  ally: Fn;
}

/** The Dread, read as a failure mode: what it looks like live, and what triggers it. */
export interface Kryptonite {
  fn: Fn;
  /** What this function looks like running from the shadow, unsupervised. */
  shadow: string;
  vice: string;
  stressResponse: string;
  dealBreaker: string;
}

export interface Powers {
  superpower: Superpower;
  kryptonite: Kryptonite;
}

/** Superpower and kryptonite for one type — both read straight off its stack. */
export function powersOf(t: MbtiType): Powers {
  const st = stack(t);
  const [, vice] = VIRTUE_VICE[t];
  const b = BEHAVIOURAL[t];
  const lead = st[0];
  const dread = st[7];
  return {
    superpower: { fn: lead, role: FN_ROLE[lead], wants: FN_WANTS[lead], what: FN_LONG[lead], ally: st[1] },
    kryptonite: { fn: dread, shadow: FN_SHADOW[dread], vice, stressResponse: b.stressResponse, dealBreaker: b.dealBreaker },
  };
}
