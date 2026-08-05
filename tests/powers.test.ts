import { describe, expect, it } from "vitest";
import { TYPES, stack } from "../src/engine/core";
import { VIRTUE_VICE, FN_SHADOW, FN_LONG, BEHAVIOURAL } from "../src/engine/data";
import { FN_ROLE, FN_WANTS } from "../src/engine/functions";
import { powersOf } from "../src/engine/powers";
import { powersPlain } from "../src/engine/plain";

/* ------------------------------------------------------------------ *
 * Superpower and kryptonite are a COMPOSITION, not a table: every field
 * has to trace back to something the stack, the function library, the
 * virtue/vice pair or the behavioural profile already says. These tests
 * assert that tracing, 16 of 16, rather than pinning fresh strings — a
 * lookup table sneaking in here would still pass a snapshot test.
 * ------------------------------------------------------------------ */

describe("powersOf", () => {
  it.each(TYPES)("%s: the superpower is exactly the Lead slot", (t) => {
    const st = stack(t);
    const { superpower } = powersOf(t);
    expect(superpower.fn).toBe(st[0]);
    expect(superpower.ally).toBe(st[1]);
    expect(superpower.role).toBe(FN_ROLE[st[0]]);
    expect(superpower.wants).toBe(FN_WANTS[st[0]]);
    expect(superpower.what).toBe(FN_LONG[st[0]]);
  });

  it.each(TYPES)("%s: the kryptonite is exactly the Dread slot", (t) => {
    const st = stack(t);
    const { kryptonite } = powersOf(t);
    expect(kryptonite.fn).toBe(st[7]);
    expect(kryptonite.shadow).toBe(FN_SHADOW[st[7]]);
    expect(kryptonite.vice).toBe(VIRTUE_VICE[t][1]);
    expect(kryptonite.stressResponse).toBe(BEHAVIOURAL[t].stressResponse);
    expect(kryptonite.dealBreaker).toBe(BEHAVIOURAL[t].dealBreaker);
  });

  it.each(TYPES)("%s: a superpower's ally is never its own function", (t) => {
    const { superpower } = powersOf(t);
    expect(superpower.ally).not.toBe(superpower.fn);
  });

  it.each(TYPES)("%s: no field is empty", (t) => {
    const { superpower, kryptonite } = powersOf(t);
    for (const v of [superpower.role, superpower.wants, superpower.what]) {
      expect(v.length).toBeGreaterThan(0);
    }
    for (const v of [kryptonite.shadow, kryptonite.vice, kryptonite.stressResponse, kryptonite.dealBreaker]) {
      expect(v.length).toBeGreaterThan(0);
    }
  });

  it("the Lead and the Dread are never the same function, for any type", () => {
    for (const t of TYPES) {
      const { superpower, kryptonite } = powersOf(t);
      expect(superpower.fn).not.toBe(kryptonite.fn);
    }
  });

  it.each(TYPES)("%s: powersPlain names the type, the Lead and the Dread", (t) => {
    const { superpower, kryptonite } = powersOf(t);
    const line = powersPlain(t, superpower.fn, kryptonite.fn);
    expect(line).toContain(t);
    expect(line.toLowerCase()).toContain("superpower");
    expect(line.toLowerCase()).toContain("kryptonite");
  });
});
