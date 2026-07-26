# Photo ingestion & framework integration — status and plan

Response to `typology-photo-catalog.md` and `claudecodeinstructions.md`.

**Short answer: no, most of it is not in the application yet.** The MBTI/Jungian half is fully
covered and then some. The three additional frameworks the instructions name — Hawkins
calibration, KWML archetypes, and the 8-category water emotion taxonomy — are entirely absent,
and the Astrolabe / Periplus / Calibration Codex material has no representation at all.

Separately: **the 23 images did not arrive.** Only the two `.md` files were uploaded. That blocks
the transcription and classification work outright; it does not block everything else.

---

## 1 · Audit — what is and is not in the app today

| From the catalog / instructions | In the app? | Where |
|---|---|---|
| Jungian 8 cognitive functions | ✅ Complete | `data.ts` `FN_LONG`/`FN_SHADOW`/`FN_FULL`, `plain.ts` `FN_PLAIN`/`FN_HANDLE`, lexicon entries `ne`…`fi` |
| Function stacks per type | ✅ Derived, not listed | `core.ts` `stack()` — generated from three involutions |
| Shadow functions | ✅ Complete | slots 5–8, `SLOT_NAMES`/`SLOT_TAGS`, plus the four-sides build-out |
| 16-type roster ("MBTI types.jpg") | ⚠️ Partial | `/matrix` and the type pickers cover it functionally; there is no single "all 16 at a glance" browse page |
| Single-type profile card ("INTJ (2).jpg") | ✅ Exceeds it | `/type/:type` is far richer than a social-media profile card |
| **"What makes each cognitive function happy"** | ❌ **Missing** | Nine per-function tables exist; none of them is *what satisfies / nourishes this function*. See §3.1 |
| **Hawkins Map of Consciousness** | ❌ Absent | zero references in `src/`, `tests/`, or docs |
| **KWML archetypes** | ❌ Absent | zero references. Note the naming collision in §3.3 |
| **8-category water emotion taxonomy** | ❌ Absent **and undefined** | not in the repo in any form. See §4, question 2 |
| Astrolabe / Periplus / Calibration Codex | ❌ Absent | no reference anywhere |
| "The Undercurrent" tracker | ❌ Absent | no reference anywhere |
| Provenance fields on reference data | ❌ Absent | nothing in the schema records source file, capture date or confidence |
| `transcripts/`, `classification-report.md` | ⛔ Blocked | needs the images |

The instructions' Step 4.2 says *"don't create a parallel schema; extend the existing one."*
Section 3 below is written to that constraint.

---

## 2 · The blocker, precisely

`claudecodeinstructions.md` Step 1 requires a vision pass over 23 images. The catalog says
*"All 23 originals + normalized JPEG copies are included"* — they were not in this upload. The
session directory contains only the two markdown files, and a filesystem sweep found no image
files other than screenshots this session produced.

| Step | Status |
|---|---|
| 1 · Inventory & vision/OCR pass | ⛔ Blocked — no images |
| 2 · Classify against frameworks | ⛔ Blocked — depends on Step 1 |
| 3 · Research pass | ✅ Done, unblocked — see §3 and `docs/research-notes.md` |
| 4 · Integration | ⚠️ Partially plannable — schema work can start; content cannot |
| 5 · `transcripts/`, `classification-report.md` | ⛔ Blocked |
| 5 · `research-notes.md` | ✅ Delivered |

**Group C matters most and is entirely blocked.** The instructions flag those ten camera photos as
possibly the project's *own* conceptual notes, and Guardrail 2 says to treat them as provisional
and confirm before integrating. Nothing in this plan proposes merging them; §5 is where they land.

To unblock: drag the images into the chat, or commit them to the repo (e.g. `source-images/`) and
tell me the path.

---

## 3 · What can be built now, without the images

### 3.1 The function-satisfaction layer — the one real content gap in Group A

`what-makes-each-cognitive-function-happy` is the only Group A item with no counterpart in the
app. The engine has nine per-function tables and not one of them answers *what does this function
want*:

| Existing table | Answers |
|---|---|
| `FN_FULL` | what it is called |
| `FN_LONG` / `FN_PLAIN` | what it does |
| `FN_SHADOW` | how it fails |
| `FN_INSTRUMENT` | how to lead with it at someone |
| `CHILD_HOOK` | how to delight it *in the Child slot* |
| `INFERIOR_GUARD` | how not to threaten it *in the Inferior slot* |
| `TRICKSTER_BLIND` | what it cannot see |

`CHILD_HOOK` is the closest, but it is slot-conditioned — it answers "how do I open this person
up", not "what does Ti itself find nourishing wherever it sits". That distinction matters,
because satisfaction data is what makes the growth surfaces actionable: the whole four-sides
argument is *develop your Inferior*, and the app currently says which function to develop without
ever saying what that function actually enjoys.

**Proposed:**

- `FN_SATISFACTION: Record<Fn, string>` in `data.ts` — what genuinely feeds this function.
- `FN_STARVATION: Record<Fn, string>` — what it looks like when the function is chronically unfed.
- `FN_PRACTICE: Record<Fn, string[]>` — 3–4 concrete things you could do this week. This is the
  piece that turns the Growth section from a diagnosis into an instruction.
- Surfaced on `/type/:type` under **Growth** (against the Inferior and the Nemesis specifically),
  in the lexicon entry for each function, and in course stage 6 where the gateway work is taught.
- Written against mainstream function theory, and cross-checked against the reference chart once
  the image arrives — divergences noted rather than silently reconciled, matching the posture the
  app already takes on CSJ vs OPS.

This is worth doing whether or not the images turn up.

### 3.2 A `/types` roster page

Small, and it closes the "MBTI types.jpg" gap: all sixteen as cards — quadra colour, plain-language
one-liner from `typePlain()`, hero/inferior, gate. Sortable by quadra or temperament. Roughly one
view file reusing components that already exist.

### 3.3 A reference/provenance layer

Step 4.4 asks for provenance on every ingested record. Nothing in the schema supports it today.

```ts
// src/engine/references.ts
export interface Reference {
  id: string;
  sourceFile: string;              // "what-makes-each-cognitive-function-happy-410x1024.png"
  sourceType: "diagram_reference" | "screenshot_text" | "photographed_notes";
  framework: Framework[];          // the catalog's taxonomy tags
  captureDate?: string;            // EXIF, else undefined — never guessed
  confidence: "high" | "medium" | "low" | "illegible";
  transcript?: string;             // verbatim, from the vision pass
  status: "reference" | "provisional" | "canon";   // Group C starts and stays "provisional"
}
```

Lexicon `Entry` gains an optional `references?: string[]`, so any claim in the app can point at
the image it came from. That is additive — no existing entry changes.

### 3.4 The three new frameworks: a separate layer, deliberately

**This is the most important architectural call in the plan, and I want your sign-off on it.**

The app's whole value is that it is a *pure function of sixteen (dominant, auxiliary) pairs*.
Every relation, score, playbook, side and animal is computed, so nothing can drift out of sync.
Hawkins levels, KWML archetypes and an emotion taxonomy **are not derivable from a type**, and
they are not the same kind of thing:

- **Type is structure.** It does not change. It is a running order.
- **Calibration level and emotional state are states.** They change hourly. Two ENTPs can sit at
  opposite ends of the Hawkins scale, and the same ENTP can sit at both ends in one week.

So a `type → Hawkins level` mapping would be pseudo-precision, and I will not invent one. The
same goes for `type → KWML archetype`: KWML is a model of four energies every man carries, not a
four-way partition of people, and jamming it onto sixteen types would misrepresent both.

**Proposed shape** — a parallel `src/state/` layer with its own routes, its own data model, and
an explicit statement in the UI that it measures something different:

| Layer | Question it answers | Keyed to |
|---|---|---|
| `src/engine/` (existing) | *How is this person wired?* | type — fixed |
| `src/state/` (new) | *Where is this person right now?* | a reading at a point in time |

The two connect only where there is something defensible to say — e.g. "your Inferior is the
gateway to your subconscious, and its characteristic starvation state looks like *this* on the
emotional taxonomy" — and each such bridge gets written as an explicit, sourced claim, not as a
derived table. That keeps the 256-cell core untouched, exactly as the README's "fixed 4-bit head,
extensible tail" note prescribes.

**Naming collision to resolve:** the lexicon already uses `Category = "Archetype"` for the eight
Beebe slots (Hero, Parent, Child, Inferior, Nemesis, Critic, Trickster, Demon). KWML's four are
also "archetypes" and are a different thing entirely. Options: add a distinct
`"Masculine Archetype"` category, or rename the Beebe set to `"Slot"` and free the word. I lean
toward the first — renaming churns 8 entries and every `<Term>` reference for a cosmetic win.

### 3.5 Honest labelling for Hawkins

Hawkins' calibration numbers are derived from applied-kinesiology muscle testing, which has not
survived controlled testing — a fact worth stating plainly once rather than discovering later.
That is not a reason to leave it out. The app already has exactly the right posture for this in
its README: *"OPS and CS Joseph are named as interpretive lenses and attributed for vocabulary,
not cited as authority."* I would apply the same sentence to Hawkins, visibly in the UI rather
than only in the repo, and present the scale as a vocabulary for describing states rather than as
a measurement. Everything else in the app is derived and checkable; this layer would not be, and
the app should say so where a reader can see it.

---

## 4 · Phasing

| Phase | Work | Needs images? |
|---|---|---|
| **A** | Function-satisfaction layer (§3.1) + `/types` roster (§3.2) | No |
| **B** | Reference/provenance schema (§3.3), no records yet | No |
| **C** | Vision pass → `transcripts/` → `classification-report.md` | **Yes** |
| **D** | Group A reference data ingested with provenance; reference chart cross-checked against §3.1 | **Yes** |
| **E** | `src/state/` layer: Hawkins + KWML + emotion taxonomy | Needs answers to §5 |
| **F** | Group C conceptual material — review session with you, nothing merged unprompted | **Yes** + your call |

Phases A and B are unblocked and are the ones I would start on.

---

## 5 · Questions I need answered

1. **The images.** Can you re-upload them, or commit them to the repo? Everything in phases C, D
   and F depends on it, and Group C is the material the instructions care most about.

2. **The 8-category water-based emotion taxonomy — what are the eight categories?** Step 3.4 says
   to cross-check against "the project's existing docs/code for this taxonomy's defined
   categories." It is not in this repo, in any form. I am not going to invent eight water
   metaphors and present them as your framework. If it lives in another repo or a doc, point me
   at it; if it only exists in the photographed notes, this is blocked on question 1.

3. **Scope: is Astrolabe / Periplus / Calibration Codex meant to live in *this* application?**
   They are described as a consciousness-mapping framework built with Rache Brand, with "The
   Undercurrent" as a tracker product on top. A tracker is a fundamentally different application
   shape — time-series state capture, per-user history, longitudinal charts — from what this app
   is, which is a stateless structural reference. It may well belong here as a second layer
   (§3.4), or it may want to be its own thing that imports this engine. That decision changes
   phase E substantially.

4. **Do you intend any relationship between type and calibration level?** My strong
   recommendation is no derived mapping, for the reasons in §3.4 — but if you have a specific
   claim in mind (e.g. "each type's Inferior has a characteristic low-calibration failure mode"),
   that is a defensible bridge and I will build it as an authored, sourced claim rather than a
   computed table.

---

## 6 · What I have not done, and why

- **Not transcribed anything.** No images.
- **Not invented the water taxonomy.** Instructions Step 3.4 and Guardrail 1 both forbid it.
- **Not merged any Group C material.** Guardrail 2, and it does not exist here yet.
- **Not asserted Hawkins' full level table as fact.** The publisher's own page does not list the
  levels; the widely-reproduced figures (shame 20, fear 100, courage 200, love 500, peace 600)
  are in `docs/research-notes.md` with that caveat attached. Before any of it ships as app
  content it should be checked against a Hawkins primary text, not a secondary summary.
