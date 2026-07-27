import { TYPES, REL, stack, omega, relation } from "./core";
import { coins, ops, ANIMAL_KIND } from "./ops";
import { sides, SIDE_ORDER } from "./sides";
import { RECIPROCAL, DETERMINING, type MbtiType } from "./data";

/** The structural assertions, runnable at any time. Empty array means the model holds. */
export function verify(): string[] {
  const problems: string[] = [];

  for (const t of TYPES) {
    const codes = TYPES.map((p) => REL[t][p]);
    if (new Set(codes).size !== 16) problems.push(`${t}: ${new Set(codes).size} distinct codes`);
    if (REL[t][t] !== "ID") problems.push(`${t}: diagonal is ${REL[t][t]}`);
    if (new Set(stack(t)).size !== 8) problems.push(`${t}: stack is not a permutation`);
    const col = TYPES.map((q) => REL[q][t]);
    if (new Set(col).size !== 16) problems.push(`column ${t}: ${new Set(col).size} distinct codes`);

    /* ---- the exchange overlay ---- */
    const o = ops(t);
    // Saviors are the ego's top two; demons are their axis opposites, which are
    // the ego's tertiary and inferior. the overlay never reaches into the shadow block.
    const top4 = new Set(stack(t).slice(0, 4));
    for (const fn of [o.saviorObs, o.saviorDec, o.demonObs, o.demonDec]) {
      if (!top4.has(fn)) problems.push(`${t}: overlay function ${fn} is outside the ego block`);
    }
    if (o.demonObs !== omega[o.saviorObs]) problems.push(`${t}: demon observer is not omega(savior)`);
    if (o.demonDec !== omega[o.saviorDec]) problems.push(`${t}: demon decider is not omega(savior)`);

    // All four animals are present exactly once.
    const animals = o.animals.map((a) => a.animal);
    if (new Set(animals).size !== 4) problems.push(`${t}: animals are not a permutation`);

    // Because dominant and auxiliary always run opposite attitudes, both saviors
    // never share one -- so the first and last animals are the two INFORMATION
    // animals, and every non-jumper type is energy-dominant. Jumpers invert this,
    // which is precisely the half of the overlay's 32 this app's 16-type core cannot hold.
    const expectPrimary = t[3] === "P" ? "Consume" : "Blast";
    if (o.doubleSavior !== expectPrimary) problems.push(`${t}: double-savior animal ${o.doubleSavior}`);
    if (ANIMAL_KIND[o.doubleDemon] !== "Information") problems.push(`${t}: last animal is not an info animal`);
    if (o.dominance !== "Energy") problems.push(`${t}: non-jumper is not energy-dominant`);
    if (!ops(t, { jumper: true }).jumper) problems.push(`${t}: jumper coin ignored`);
    if (ops(t, { jumper: true }).dominance !== "Information") {
      problems.push(`${t}: jumper is not info-dominant`);
    }

    /* ---- four sides ---- */
    const s = sides(t);
    // Each side is itself a type, and its own stack must reproduce the four
    // functions this side is built from, in order.
    for (const k of SIDE_ORDER) {
      const side = s[k];
      const own = stack(side.type).slice(0, 4);
      const claimed = side.slots.map((sl) => sl.fn);
      if (own.join() !== claimed.join()) problems.push(`${t}/${k}: slots do not match ${side.type}`);
      if (side.gateway.fn !== claimed[0]) problems.push(`${t}/${k}: gateway is not the side's Hero`);
    }
    // The three involutions that generate the relation table also generate the
    // sides, so each side stands in a fixed relation to the ego.
    const expectRel = { ego: "ID", subconscious: "DU", unconscious: "EX", superego: "SE" } as const;
    for (const k of SIDE_ORDER) {
      if (relation(t, s[k].type) !== expectRel[k]) {
        problems.push(`${t}/${k}: relation to ego is ${relation(t, s[k].type)}, expected ${expectRel[k]}`);
      }
    }
    // The Demon is the Inferior of the unconscious and the Hero of the superego.
    if (s.unconscious.slots[3].fn !== s.superego.slots[0].fn) {
      problems.push(`${t}: demon is not both unconscious Inferior and superego Hero`);
    }
  }

  for (const t of TYPES) for (const p of TYPES) {
    if (RECIPROCAL[REL[t][p]] !== REL[p][t]) problems.push(`reciprocity ${t}/${p}`);
  }

  const sigs = new Set(TYPES.map((t: MbtiType) => DETERMINING.map((i) => coins(t)[i]).join("|")));
  if (sigs.size !== 16) problems.push(`determining coins collide: ${sigs.size}`);

  return problems;
}
