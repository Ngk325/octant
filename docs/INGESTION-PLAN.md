# Photo ingestion — findings and plan

Response to `typology-photo-catalog.md` and `claudecodeinstructions.md`, revised after the images
arrived on `main` (0dafb68) and were vision-passed.

**Decisions taken (yours):** Hawkins, KWML and the emotion taxonomy are **out**. No derived mapping
from type to anything. Astrolabe / Periplus / Calibration Codex is out of scope for this app.
Everything below is written to that.

Companion documents: `classification-report.md` (all 21 images), `transcripts/` (21 — one per image, complete),
`research-notes.md` (external research; its Hawkins and KWML sections are now moot but retained
as the record of what was checked).

---

## 1 · Headline finding

**Group C turned out to be photographed third-party training material, not original notes.** The
catalog guessed these were handwritten conceptual work, possibly early Astrolabe/Periplus drafts.
They are not: eight photographs of printed pages in a ring binder — Linda Berens handouts, CS
Joseph's Type Grid, an OPS coin sheet, a "Type Logic" relations page, and a function tree from
erictb.info. The only original content is marginalia.

**Nothing in any of the 21 images contains Hawkins, KWML, or water/emotion-taxonomy material** —
so your "keep them out" instruction costs nothing here. It removes work that was never supported
by the source in the first place.

## 2 · Status against the original audit

| | Then | Now |
|---|---|---|
| Jungian functions & stacks | ✅ | ✅ — and now **independently validated**: Berens' published 16 Type Patterns table matches `stack()` on 128/128 slots |
| CS Joseph archetype names | ❓ | ✅ **already in the app**, all sixteen, as `ARCHETYPE[t]`'s 4th entry — but unattributed |
| OPS coins | ✅ | ✅ — `IMG_7589` is evidently their source; the Calculator's prompt wording is near-verbatim from it |
| "What makes each function happy" | ❌ | ❌ still missing — and the image confirms it is worth adding |
| Hawkins / KWML / emotion taxonomy | ❌ | **Dropped by your decision, and absent from the source anyway** |

## 3 · What is genuinely new and worth adding

Everything here is per-function or per-type data that extends tables the app already has. None of
it touches the derived core.

### A1 · Function satisfaction — the one gap the audit predicted
From `what-makes-each-cognitive-function-happy`. The engine has nine per-function tables and not
one answers *what does this function want*, which is exactly what the Growth surfaces need when
they tell someone to develop their Inferior.

- `FN_SATISFACTION: Record<Fn, string>` — headline + what feeds it
  (Se Experience · Si Immersion · Ne Ideas · Ni Meaning · Te Accomplishment · Ti Precision ·
  Fe Unity · Fi Individuality)
- `FN_STARVATION: Record<Fn, string>` — what chronic under-feeding looks like
- `FN_PRACTICE: Record<Fn, string[]>` — 3–4 concrete things to try this week

Surfaced on `/type/:type` under **Growth** against the Inferior and Nemesis, in each function's
lexicon entry, and in course stage 6.

### A2 · Function roles and characteristics
From `IMG_7533`, `IMG_7534`, `IMG_7535` — the richest material in the set.

- `FN_ROLE: Record<Fn, string>` — one verb each: Knowing, Creating, Empathizing, Persuading,
  Contemplating, Systemizing, Preserving, Doing. Short enough for diagram labels and chips, which
  the app currently has no good short handle for.
- `FN_VERBS: Record<Fn, string[]>` — the five verb-phrases per function.
- `FN_SAYS: Record<Fn, [string, string]>` — the two catchphrases per function ("This is what is." /
  "What's next?"). These are the single most useful thing in the whole batch for the plain layer:
  they let a reader **recognise a function in speech**, which no current table does.

### A3 · Berens Type Themes
From `IMG_7570`. Sixteen two-word themes (ENTP "Explorer Inventor", INTJ "Conceptualizer Director",
…). Adds a fourth naming system alongside the three already in `ARCHETYPE`.

### A4 · Attribution for the naming systems
`ARCHETYPE[t]` is currently four slash-separated names with no indication of provenance. With the
Type Grid confirming the 4th is CS Joseph's, this should become structured:

```ts
NAMES: Record<MbtiType, { sixteenPersonalities: string; keirsey: string; other: string; csJoseph: string; berensTheme: string }>
```

Rendered with its source next to each name. Small change, meaningful honesty improvement, and it
finally explains why the type page says "Rogue".

### A5 · Temperament detail
From `IMG_7482`. Population shares (SJ 40% · SP 30% · NT 15% · NF 15%) and the attribute triples
(SJ Concrete/Affiliative/Systematic · SP Concrete/Pragmatic/Interest · NT Abstract/Pragmatic/
Systematic · NF Abstract/Affiliative/Interest). Extends the four `Temperament` lexicon entries.

Also worth documenting: the app's coin 8 (Control/Movement) is the same axis as the grid's
Outcome/Progression, and CSJ's Structure/Starter/Finisher/Background are the same four interaction
styles the app names Berens-style. Both are alias notes in the lexicon, not new data.

### A6 · OPS savior/demon markers
From `IMG_7589`. Saviors present as **Responsible · Confidence · Obvious**; demons as
**Tidalwaves** ("I'm not responsible, someone else is") · **Fear/Pain** ("why does this keep
happening to me?") · **Peacocking** ("I secretly want to be good at this"). Sharper and more
recognisable than the current `SAVIOR_STATE`/`DEMON_STATE` prose, and directly usable in the OPS
section on `/type/:type`.

### A7 · The Function Tree — for course stage 1
From `IMG_8413`. Derives all eight functions from one root (Consciousness → Yes/No → involuntary
Observation vs willed Determination → Is/Isn't and Right/Wrong → S/N and T/F → × Environment/
Individual). Course stage 1 currently asserts "there are eight" without showing where eight comes
from; this is the missing derivation, and it matches the app's own derived-not-listed posture.

### A8 · Letters → stack, the derivation the course skips
From `INTJ (2).jpg`, which turned out not to be a profile card at all but a worked derivation:
Introvert ⇒ dominant is introverted; Judger ⇒ the introverted dominant is a *perceiving* function
⇒ Ni; the judging letter gets extraverted as the auxiliary ⇒ Te; inferior is opposite in both
nature and direction ⇒ Se; tertiary is the opposite of the auxiliary ⇒ Fi.

`stack()` takes (dominant, auxiliary) as given. Nothing in the app explains **how you get there
from four letters** — the first question anyone arriving with "I'm an INTJ" has. Course stage 2
asserts the mapping instead of deriving it. Pairs with A7: the Function Tree derives the eight
functions, this derives which two of them lead.

### A10 · The empirical compatibility matrix — as an honest counterweight
From `IMG_6099` (personalitydata.org, **CC BY 4.0** — the only item in the batch whose licence
permits reuse). A survey-derived 16×16 compatibility matrix that **disagrees with the engine**:
Pearson r = −0.154; Duality pairs the app rates 100 average **7.4%** in the survey; Identity pairs
the app rates 74 average **92.6%**.

They measure different things — self-reported liking versus structural friction, and people report
liking people like themselves. But the app already says, in its README, that where two instruments
disagree "that divergence is the content, not an error to smooth over." This is the sharpest
available instance of that, it is quantified, and it is legally reusable.

Proposal: show the empirical figure alongside the derived score on `/pair/:a/:b`, with one
paragraph on why they differ and which question each is answering. It costs one number per cell
and makes the app markedly more honest about the limits of its own model.

### A9 · `/types` roster page
Closes the "MBTI types.jpg" gap: all sixteen as cards with quadra colour, plain one-liner, hero and
inferior, gate, and the naming systems from A4.

## 4 · Deliberately not proposed

- **Hawkins, KWML, emotion taxonomy, Astrolabe/Periplus/Codex** — your call, and unsupported by the
  images regardless.
- **The ST/SF/NT/NF grouping** from `MBTI types.jpg` (Valuing / Visioning / Relating / Directing).
  Legitimate, but it is a *different* four-way split from the SJ/SP/NT/NF temperaments the app
  already carries, and running both would be exactly the kind of density the redesign set out to
  remove. One lexicon note that it exists, no more, unless you want it.
- **The "Type Logic" relation system** (`IMG_8412`). A complete third 16×16 system based on letter
  patterns rather than function operators. I would *not* ingest it: it collides head-on with the
  app's vocabulary — its **Complement** means Quasi-identity where the app's means Dual + Activity,
  near-opposite readings — and a second full relation matrix would undercut the app's central claim
  that its 256 cells are derived from one small piece of structure. Worth one lexicon entry noting
  the system exists and that its terms are false friends. Say the word if you want it properly.
- **Verbatim republication of the copyrighted tables** — see §6.

## 5 · Phasing

| Phase | Work | Blocked? |
|---|---|---|
| **A** | A1, A2, A6 — the per-function tables. Highest value, all extend existing schema | No |
| **B** | A3, A4, A5, A9 — naming systems with attribution, temperament detail, roster page | No |
| **C** | A7 + A8 — Function Tree into course stage 1, letters→stack into stage 2 | No |
| **D** | Vision-pass the remaining 12 (Group B screenshots + 3 Group A), extend the report | No |
| **E** | Provenance layer: `Reference` records tying each ingested claim to its source image | No |

Nothing is blocked any more. Phase A is where I would start.

## 6 · Two cautions

**Copyright.** `IMG_7482` is © CSJ Ventures LLC 2021–2022; the Berens sheets are commercial
training material. Transcribing to a private repo is fine; shipping the tables verbatim in a
deployed app is a different question. Recommendation: ingest the *structure* and write the prose
fresh in the app's own voice with attribution — exactly what the app already does for OPS and CS
Joseph. Your call, not mine.

**Two images are missing.** The catalog lists 23; the zip has 21. `IMG_8404.HEIC` and
`IMG_8405.HEIC` (the 2025-08-28 pair, catalogued as mislabelled JPEGs) did not survive conversion.
If they matter, they need re-exporting.

## 7 · One thing found late, awaiting your call

`IMG_0314` — sixteen handwritten four-sides whiteboards — is the only genuinely original material
in the batch, and it **agrees with the engine on every legible entry**. It also carries a
per-function keyword gloss that is not in the app and is a different handle from the Berens verbs
already ingested:

| Fn | Keyword | Fn | Keyword |
|---|---|---|---|
| Ti | Logic | Te | Rationale |
| Fi | Morals | Fe | Ethics |
| Si | Duty / Past memory | Se | Physics |
| Ni | Willpower | Ne | Metaphysics |

Per the instructions' Guardrail 2, original conceptual material is surfaced rather than merged.
Say the word and it goes in beside `FN_ROLE` as `FN_KEYWORD` — it is about ten lines.

## 8 · Open question

Only one left, and it is a scoping question rather than a blocker: **how much of the batch do you
actually want in the app?** A1, A2 and A6 are clear wins. A3–A5 add naming systems and detail that
make the app more complete but also denser — and density was the original complaint. I would take
A1, A2, A6, A7, A8, A9 and A10, and treat A3–A5 as optional. A10 in particular I think is the
single most interesting thing in the batch. Tell me if you would rather have all of it.
