# Classification report

Source: `typology-photos-normalized 2.zip`, added in commit `0dafb68` and removed from the
working tree in 2026-08 (it was 24 MB in every clone, referenced by nothing but this line).
It remains in git history — audit documentation (this file and
`docs/REVIEW-FINDINGS.md`) still references it by name — and you can retrieve it:

```sh
git show '0dafb68:typology-photos-normalized 2.zip' > photos.zip
git show '0dafb68:Four Sides of the Mind.docx' > four-sides.docx
```

History was deliberately NOT rewritten — clones still carry the weight, but existing
clones, PR refs and this audit trail stay intact. `docs/transcripts/` is the working
record derived from the batch; the zip is only needed to re-verify a transcription.

**21 images present, not 23.** The catalog lists `IMG_8404.HEIC` and `IMG_8405.HEIC` (the
2025-08-28 pair); neither is in the normalized set. Worth checking whether they were dropped
during conversion — the catalog notes they were mislabelled JPEGs.

**All 21 images vision-passed.** Transcripts in `transcripts/`, one per image.

---

## The headline finding

**Group C is not original conceptual material.** The catalog speculated these ten camera photos
were "likely photos of handwritten notes… possibly early drafts of the Astrolabe / Periplus /
Calibration Codex framework," and the instructions asked me to read them closely before assuming
otherwise. I did. All eight are **photographs of printed, third-party typology material** in a ring
binder — Linda Berens handouts, CS Joseph's copyrighted Type Grid, an OPS coin sheet, a "Type Logic"
relations page, and a function tree from erictb.info. The only original content is marginalia: a few
handwritten function-role labels and some circling of the photographer's own coins.

**No Hawkins, no KWML, no water-based emotion taxonomy, and no Astrolabe / Periplus / Calibration
Codex content appears anywhere in any of the 21 images.** Which lines up with your instruction to
keep those three out — the photos do not contain them in the first place.

Consequence: Guardrail 2 ("treat anything that looks like personal/original notes as provisional")
does not bind here. What does bind instead is **third-party copyright** — see the caution below.

---

## Table

| File | Group | Framework tag | Confidence | Status | Notes |
|---|---|---|---|---|---|
| `what-makes-each-cognitive-function-happy…png` | A | `mbti_cognitive_functions` | high | ✅ transcribed | Psychology Junkie infographic. Fills the one real Group A gap — see plan §A1 |
| `IMG_7533.jpg` | C | `mbti_cognitive_functions` | high | ✅ transcribed | "Function Roles" — 8 one-word verbs |
| `IMG_7534.jpg` | C | `mbti_cognitive_functions` | high | ✅ transcribed | Berens, Perceiving Processes. Verbs + characteristics + catchphrases |
| `IMG_7535.jpg` | C | `mbti_cognitive_functions` | high | ✅ transcribed | Berens, Judging Processes. Companion to 7534 |
| `IMG_7570.jpg` | C | `mbti_type_profile` | high | ✅ transcribed | Berens 16 Type Patterns + Type Themes. **Validates the engine** |
| `IMG_7482.jpg` | C | `mbti_type_profile` | high | ✅ transcribed | CS Joseph Type Grid © CSJ Ventures LLC |
| `IMG_7589.jpg` | C | `unlabeled_general_typology` (OPS) | high (marginalia: low) | ✅ transcribed | OPS coins + savior/demon markers |
| `IMG_8412.jpg` | C | `unlabeled_general_typology` | high | ✅ transcribed | "Type Logic" letter-pattern relations. **Name collision** — see below |
| `IMG_8413.jpg` | C | `mbti_cognitive_functions` | high | ✅ transcribed | erictb.info Function Tree — first-principles derivation |
| `MBTI types.jpg` | A | `mbti_type_profile` | high | ✅ transcribed | Keirsey 4×4 grid + ST/SF/NT/NF mottos. Confirms `ARCHETYPE`'s 2nd entry is Keirsey |
| `INTJ (2).jpg` | A | `mbti_cognitive_functions` | high | ✅ transcribed | **Not** a profile card — a letters→stack derivation. Fills a real course gap |
| `24c1bfb77d03d05638ceca1740d6056f.jpg` | A | `mbti_cognitive_functions` | high | ✅ transcribed | Jung derivation tree, © Julie A Hoy PhD. Beginner version of IMG_8413 |
| `IMG_0314.JPG` | B | `photographed_notes` | high | ✅ transcribed | **Sixteen four-sides whiteboards — the only original material. Confirms `sides()`** |
| `IMG_6093.jpg` | B | `unlabeled_general_typology` (OPS) | high | ✅ transcribed | OPS coin tells. ⚠️ contains a named third party — redacted |
| `IMG_6094.JPG` | B | `unlabeled_general_typology` | high | ✅ transcribed | Fourth relations table. **Uses the app's own Kindred/Business naming** |
| `IMG_6095.JPG` | B | `unlabeled_general_typology` | high | ✅ transcribed | **Socionics 16×16 relations chart. Validates all 256 engine cells** |
| `IMG_6097.JPG` | B | `unlabeled_general_typology` | high | ✅ transcribed | **Third relations table, MBTI notation. Validates all 256 cells** |
| `IMG_6099.PNG` | B | `mbti_type_profile` | high | ✅ transcribed | **Empirical 16×16 compatibility matrix**, personalitydata.org, CC BY 4.0. Contradicts the derived model — see below |
| `screenshot_2025-12-23.png` | B | `unlabeled_general_typology` (OPS) | high | ✅ transcribed | **Confirms the Play/Consume animal correction** |
| `Screenshot_20230703_081513_Photos.jpg` | B | `mbti_type_profile` | high | ✅ transcribed | Adioma/Keirsey wheel. Held back with A3–A5 |
| `Screenshot_20230703_081539_Photos.jpg` | B | `mbti_type_profile` | high | ✅ transcribed | Unsourced pop compatibility chart. ⛔ deliberately not ingested |

---

## Five engine validations that fell out

Both run against the live engine, not eyeballed:

1. **Berens' 16 Type Patterns matches `stack()` exactly — 128/128 slots, all sixteen types.** The
   app derives all eight slots from the (dominant, auxiliary) pair via three involutions rather than
   storing a table. An independently published table agreeing on every cell is meaningful external
   confirmation, and it should become a test.

2. **All sixteen CS Joseph archetype names are already in the app** — as the 4th entry of each
   `ARCHETYPE[t]` string (Rogue, Ranger, Knight, Ardent, Judicator, Gladiator, Marshal, Cleric,
   Cavalier, Duelist, Bard, Archivist, Artificer, Paladin, Druid, Mystic). Verified all sixteen.
   They are unattributed and unexplained; the app shows them as one of four slash-separated names
   with no indication of which system each comes from.

3. **A Socionics intertype chart (`IMG_6095`) agrees with the engine on all 256 cells**, and each
   of its sixteen labels maps onto exactly one engine code — a clean bijection. The engine computes
   those cells from three involutions; the chart is a hand-built table from another tradition.
   Two naming conventions differ and are documented rather than "fixed": the chart's *Look-a-like*
   is this app's Business and its *Comparative* is this app's Kindred (English Socionics sources
   genuinely disagree on those two labels), and it writes Benefit/Supervision from the actor's side.

4. **`screenshot_2025-12-23.png` independently confirms the Play/Consume correction.** The slide
   states Play = De+Oe and Consume = Di+Oe, exactly as corrected in `src/engine/ops.ts`. The fix
   was originally made from published OPS definitions found by web research; this is a second,
   independent source for the same fact, and it was in the batch all along.

5. **The sixteen whiteboards (`IMG_0314`) confirm `sides()`.** 45 of 46 legible entries match;
   the one miss is a transcription error of mine, since the function list written under that panel
   agrees with the engine. This is the owner's own working material, and it agrees with the
   derived four sides for every type.

Also already present, discovered by comparison: the app's OPS coin definitions and even the
Calculator's prompt wording derive from `IMG_7589`; and the app's coin 8 (Control/Movement) is the
same axis as the Type Grid's Outcome/Progression.

---

## ⚠️ Two cautions

**Copyright.** `IMG_7482` is © CSJ Ventures LLC 2021–2022 and the Berens sheets are commercial
training material. Transcribing them into a private repo for reference is one thing; republishing
the tables verbatim in a deployed app is another. My recommendation is to ingest the *structure*
(which functions, which axes) and write the prose fresh in the app's own voice, attributing the
source — which is what the app already does for OPS and CS Joseph. Flagging rather than deciding.

**Name collision, with opposite meanings.** `IMG_8412`'s "Type Logic" system calls `XXXy`
**Complement** and defines it as Quasi-identity. The app's `complement` means Dual + Activity —
close to the reverse. Its **Anima** is what the app calls Duality. If that sheet is ingested, the
system needs its own namespace rather than merging into the existing lexicon.

---

## The empirical matrix — a substantive disagreement worth surfacing

`IMG_6099` is a full 16×16 **survey-derived** compatibility matrix (personalitydata.org, CC BY 4.0
— the only reusable-by-licence item in the batch). Compared against the engine, computed:

- **Pearson r = −0.154.** Slightly *negatively* correlated with the app's derived ease.
- **Duality pairs: app rates 100, survey mean 7.4%.** All six largest disagreements are Duals.
- **Identity pairs: app rates 74, survey mean 92.6%.**
- The survey matrix is perfectly symmetric; the app's is asymmetric by design.

They measure different things. The survey captures self-reported *liking*, and people report
liking people like themselves. Socionics duality claims *structural low friction* — which is not
the same claim, and is arguably in tension with it, since the Dual supplies the very function you
are most defensive about. Neither is thereby wrong. But it is a quantified disagreement between a
structural and an empirical model, and the app's own stated posture is to show such divergences
rather than smooth them over. See plan §A10.

## Group B — complete, and it held the two best things in the batch

Nine screenshots, all now read. Two were more valuable than the catalog suggested:

- **`IMG_0314` is the only genuinely original material in the whole batch** — sixteen handwritten
  four-sides whiteboards, one per type. They agree with `sides()` on every legible entry, and they
  carry a function-keyword gloss (Ti Logic, Te Rationale, Fi Morals, Fe Ethics, Si Duty/Past
  memory, Se Physics, Ni Willpower, Ne Metaphysics) that is not in the app. Per Guardrail 2 it is
  surfaced for a decision rather than merged.
- **`IMG_6097` validates all 256 relations in plain MBTI notation**, needing no Socionics
  conversion at all.

Two are recorded but deliberately not ingested: the Adioma/Keirsey wheel (it is the A3–A5
naming detail held back by agreement) and an unsourced pop compatibility chart (no method, no
attribution, and it contradicts both the engine and the survey).

One carries a **named private individual's** typing; the name is redacted from the transcript and
nothing identifying is proposed for the app.


## Late Group A findings

Two of the three remaining Group A images turned out to be more useful than the catalog suggested:

- **`INTJ (2).jpg` is not a profile card.** It is a worked derivation from the four MBTI letters to
  the four-function stack. The app's `stack()` takes (dominant, auxiliary) as given and never
  explains how to get there from "I'm an INTJ" — which is the first question a newcomer has. This
  closes that gap directly, and complements the Function Tree, which derives the eight functions
  but not the letter mapping.
- **`MBTI types.jpg`** confirms `ARCHETYPE[t]`'s 2nd entry is the Keirsey name, and adds an
  ST/SF/NT/NF grouping with mottos that is *different* from the app's SJ/SP/NT/NF temperaments.
  Both are legitimate; they must not be conflated.
