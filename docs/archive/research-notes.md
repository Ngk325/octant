> **ARCHIVED 2026-08-01.** This document is a historical record, kept for the
> audit trail. It described a plan or a state that has since shipped or been
> superseded; do not work from it. The current state of what it discusses is
> in the README, `docs/QA-REVIEW.md`, and the code itself.

# Research notes — Step 3 of the ingestion instructions

Web research pass, run independently of the images (which did not arrive). Raw findings and
sources here; interpretation and proposals are kept separate, in `INGESTION-PLAN.md`, per
Guardrail 3.

---

## 3.1 · MBTI cognitive function theory — current mainstream framing

Already verified during the previous work on this repo, and the app matches mainstream framing:

- Eight functions, four perceiving (Ne, Ni, Se, Si) and four judging (Te, Ti, Fe, Fi), each in an
  extraverted or introverted attitude — Jung, *Psychological Types* (1921).
- Four-function ego stack (dominant, auxiliary, tertiary, inferior) plus a four-function shadow
  (Nemesis, Critic, Trickster, Demon) — Beebe, *Energies and Patterns in Psychological Type*.
- The app derives all eight slots from the (dominant, auxiliary) pair rather than listing them,
  and `tests/engine.test.ts` asserts the result against a verified fixture.

**Not yet verifiable:** whether `what-makes-each-cognitive-function-happy-410x1024.png` matches
mainstream framing or is a fringe/oversimplified take. That was Step 3.1's actual question and it
needs the image. `INGESTION-PLAN.md` §3.1 proposes building the satisfaction layer from
mainstream theory first, then diffing the chart against it and recording divergences rather than
silently reconciling them.

**Discrepancy already found and fixed in this repo (previous session), for the record:** the
retired Python reference engine had OPS demons using the attitude flip rather than the Model A
opposite, and had Play and Consume transposed. Both are corrected in `src/engine/ops.ts` and
asserted in `tests/ops.test.ts`.

Sources: [Jung, *Psychological Types*](https://archive.org/details/psychologicaltyp0000jung),
[Beebe's eight-function model](https://www.goodreads.com/book/show/29502956-energies-and-patterns-in-psychological-type)

---

## 3.2 · Hawkins' Map of Consciousness

**What it is.** A scale of 1–1000 developed by David R. Hawkins, mapping emotions, attitudes and
"life-views" to numeric calibration levels. Level **200 is the stated fulcrum** dividing "force"
from "power" — below 200 is described as destructive to the individual and society, above 200 as
constructive.

**Progression is logarithmic, not arithmetic.** Hawkins is explicit that 300 is not twice 150,
and that a few points represent a large change in "power". Any UI that renders these on a linear
axis will misrepresent the framework.

**Widely reproduced anchor values** (shame 20, guilt 30, apathy 50, grief 75, fear 100, desire
125, anger 150, pride 175, courage 200, neutrality 250, willingness 310, acceptance 350, reason
400, love 500, joy 540, peace 600, enlightenment 700–1000).

⚠️ **These are from secondary summaries.** The publisher's own Map of Consciousness page describes
the framework and the methodology but **does not list the individual levels**, directing readers
to Hawkins' books. Of the above, only shame 20, fear 100, courage 200, love 500 and peace 600 were
confirmed in the sources reviewed. **Before any of this ships as app content, the full table needs
checking against a Hawkins primary text.**

**Methodology — flag.** The calibrations come from applied kinesiology ("muscle testing"), which
Hawkins reports as ~250,000 calibrations over 30 years. Applied kinesiology has not demonstrated
reliability under controlled/blinded conditions. This does not disqualify the framework as a
*vocabulary* for talking about states, which is how the app would use it — but the app should say
so where a reader can see it, in the same register it already uses for OPS and CS Joseph
("interpretive lenses… not cited as authority"). See `INGESTION-PLAN.md` §3.5.

Sources: [Veritas Publishing — Map of Consciousness](https://veritaspub.com/map-of-consciousness/),
[The Map of Consciousness Explained (book record)](https://philpapers.org/rec/HAWTMO-5)

---

## 3.3 · KWML archetypes — identified with confidence

Step 3.3 asked to confirm what system this refers to before assuming a definition. **Confirmed:**

**King, Warrior, Magician, Lover** — Robert Moore (Jungian analyst) and Douglas Gillette, *King,
Warrior, Magician, Lover: Rediscovering the Archetypes of the Mature Masculine* (1990). Four
archetypes of what the authors call the mature masculine:

| Archetype | Energy |
|---|---|
| **King** | just and creative ordering; blessing, and the source of order |
| **Warrior** | aggressive but non-violent action; devotion to a cause beyond the self |
| **Magician** | initiation and transformation; detachment enabling clear sight |
| **Lover** | connection to others and the world; the pursuit and enjoyment of beauty |

Each has **shadow forms** — the framework's own structure is bipolar, with an active and a passive
shadow per archetype (tyranny/weakness, cruelty/passivity, manipulation/denial, addiction/
disconnection). Any integration should carry the shadows, not just the four positive poles;
without them the model reads as a personality quiz rather than the shadow-work tool it is.

**Two cautions for integration:**

1. **Not a partition of people.** Moore and Gillette present these as four energies every person
   carries in some balance, not four buckets to sort people into. A `type → KWML` mapping would
   misrepresent it.
2. **Naming collision in this codebase.** `lexicon.ts` already uses `Category = "Archetype"` for
   the eight Beebe slots. KWML needs a distinct category — see `INGESTION-PLAN.md` §3.4.

Sources: [Moore & Gillette (book record)](https://www.goodreads.com/book/show/91781.King_Warrior_Magician_Lover),
[full text, Internet Archive](https://archive.org/details/kwml_20200814),
[Skjellum, KWML overview](https://www.masculinity-movies.com/articles/king-warrior-magician-lover)

---

## 3.4 · 8-category water-based emotion taxonomy — NOT FOUND

Step 3.4 said to cross-check water/emotion language "against the project's existing 8-category
water-based emotion taxonomy (check the project's existing docs/code for this taxonomy's defined
categories) rather than inventing a mapping."

**It is not in this repository.** A case-insensitive sweep of `src/`, `tests/`, `README.md` and
`DEPLOY.md` for `water`, `tide`, `current`, `undercurrent`, `emotion`, `astrolabe`, `periplus`,
`codex`, `calibrat`, `hawkins`, `kwml` and `rache` returned only:

- `emotion` — inside existing Fe/Fi function definitions ("emotional consensus", "emotional
  climate"), unrelated to any taxonomy.
- `calibrat` — used in its ordinary English sense inside two lexicon definitions, unrelated to
  Hawkins.
- `current` — React/CSS identifiers only.

Everything else: zero hits.

Per Guardrail 1 and Step 3.4's own wording, I have not invented eight categories. This is
question 2 in `INGESTION-PLAN.md` §5 and is blocking for that part of the work.

---

## 3.5 · Astrolabe / Periplus / Calibration Codex / The Undercurrent

No public sources found that correspond to the framework as described in the instructions
(consciousness-mapping, integrating Hawkins calibration, KWML archetypes and an 8-category
water-based emotion taxonomy; built with Rache Brand; "The Undercurrent" as the tracker product).

The reasonable reading is that this is **original, unpublished work belonging to this project**,
which is consistent with the catalog's own note that the Group C camera photos may be early
drafts of it. That is exactly the material Guardrail 2 says to treat as provisional. Nothing
about it can be researched externally, and nothing should be reconstructed from inference —
it needs the images, and then a review pass with the author.
