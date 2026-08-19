import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/* ------------------------------------------------------------------ *
 * THE POSITIONING RULE, ENFORCED
 *
 * Octant is presented as one model, derived here. Nothing that ships
 * credits, name-drops or borrows the vocabulary of another typology
 * system or author — not the marketing page, not the type reader, not
 * the lexicon, and not the primer the assistant answers from.
 *
 * This walks everything under src/, which is exactly what gets bundled.
 * docs/ and tests/ are deliberately NOT scanned: the transcripts are the
 * internal record of what the engine was derived from and checked
 * against, they are never served, and tests/ingested.test.ts still
 * validates the engine's maths against them.
 * ------------------------------------------------------------------ */

const SRC = join(__dirname, "..", "src");

/**
 * Two exemptions, and they are exemptions rather than a softening of the
 * rule. Everything else — the type reader, the lexicon, the curriculum,
 * the marketing page and the assistant primer — stays banned, and
 * anything wanting to show a translation imports from the translation
 * surface rather than repeating a name locally.
 *
 *   engine/translation.ts — exists to name other systems so a reader
 *   arriving with someone else's vocabulary can find their footing.
 *
 *   worker/compare.ts — the comparison layer (owner's call, 2026-08).
 *   "How is this different from the one I already know" is the question
 *   every visitor arrives with, and the rest of the site deliberately
 *   never uses the words they would search. Confining that to one module
 *   is what keeps it from leaking into the main narrative: these pages
 *   name MBTI, Socionics and the Big Five, and every other public
 *   surface still may not.
 */
const ALLOWED = new Set(["engine/translation.ts", "worker/compare.ts"]);

/**
 * `OPS` is matched case-sensitively with word boundaries on purpose. That
 * catches it in prose ("the OPS overlay") while ignoring the internal
 * identifiers `REL_OPS`, `OpsSignature` and `engine/ops` — `_` is a word
 * character, and the other two differ in case. Those are module plumbing,
 * not content, so they are allowed to keep their names.
 */
const BANNED: [label: string, pattern: RegExp][] = [
  ["CS Joseph", /CS ?Joseph/i],
  ["csjoseph", /csjoseph/i],
  ["CSJ", /\bCSJ\b/],
  ["Objective Personality", /Objective Personality/i],
  ["OPS", /\bOPS\b/],
  ["Socionics", /socionics/i],
  ["Model A", /\bModel A\b/],
  ["MBTI", /\bMBTI\b/],
  ["Myers", /\bMyers/i],
  ["Briggs", /\bBriggs/i],
  ["Jung", /\bJung/i],
  ["Beebe", /\bBeebe/i],
  ["Keirsey", /\bKeirsey/i],
  ["Berens", /\bBerens/i],
  ["Augustinavičiūtė", /Augustinavi/i],
];

/** Every file under src/, recursively. */
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const FILES = walk(SRC).filter((f) => !ALLOWED.has(f.slice(SRC.length + 1).replace(/\\/g, "/")));

describe("nothing that ships names another system or author", () => {
  it("finds a source tree to scan at all", () => {
    // Guards against the walk silently returning nothing and the suite
    // then passing for the wrong reason.
    expect(FILES.length).toBeGreaterThan(20);
  });

  it("exempts exactly these two files, and both exist", () => {
    // A shrinking scan is the failure mode to catch: if the allowlist ever
    // grows quietly, the guard stops guarding without any test going red.
    // Adding a file here has to be a deliberate edit to this line, which is
    // the point -- the comparison layer was added in 2026-08 by exactly that
    // route rather than by the ban quietly ceasing to bite.
    expect([...ALLOWED]).toEqual(["engine/translation.ts", "worker/compare.ts"]);
    for (const rel of ALLOWED) {
      expect(readFileSync(join(SRC, rel), "utf8").length, rel).toBeGreaterThan(0);
    }
  });

  it.each(FILES.map((f) => [f.slice(SRC.length + 1), f] as const))(
    "src/%s",
    (rel, full) => {
      const text = readFileSync(full, "utf8");
      for (const [label, pattern] of BANNED) {
        const hit = text.match(pattern);
        const line = hit
          ? text.slice(0, hit.index).split("\n").length
          : 0;
        expect(hit, `src/${rel}:${line} mentions "${label}"`).toBeNull();
      }
    },
  );
});
