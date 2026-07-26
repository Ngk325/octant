# Classification report

Source: `typology-photos-normalized 2.zip`, committed to `main` (0dafb68).

**21 images present, not 23.** The catalog lists `IMG_8404.HEIC` and `IMG_8405.HEIC` (the
2025-08-28 pair); neither is in the normalized set. Worth checking whether they were dropped
during conversion — the catalog notes they were mislabelled JPEGs.

**12 of 21 vision-passed: all of Group A (4) and all of Group C (8).** The nine Group B screenshots
are pending — see the note at the end.

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
Codex content appears anywhere in the twelve images read.** Which lines up with your instruction to
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
| `IMG_0314.JPG` | B | unknown | — | ⏳ pending | Text screenshot |
| `IMG_6093.jpg` | B | unknown | — | ⏳ pending | Full-height phone screenshot |
| `IMG_6094.JPG` | B | unknown | — | ⏳ pending | Cropped excerpt |
| `IMG_6095.JPG` | B | unknown | — | ⏳ pending | Square-ish crop |
| `IMG_6097.JPG` | B | unknown | — | ⏳ pending | Landscape crop |
| `IMG_6099.PNG` | B | unknown | — | ⏳ pending | Diagram/chart |
| `screenshot_2025-12-23.png` | B | unknown | — | ⏳ pending | 3058×588 stitched capture |
| `Screenshot_20230703_081513_Photos.jpg` | B | unknown | — | ⏳ pending | 2023-07-03 08:15:13 |
| `Screenshot_20230703_081539_Photos.jpg` | B | unknown | — | ⏳ pending | 2023-07-03 08:15:39 |

---

## Two engine validations that fell out

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

## Group B — still pending

The nine Group B screenshots have not been vision-passed yet. They are the lowest-value group on
the catalog's own description (saved articles, cropped excerpts, re-shared graphics) and the least
likely to contain structured data, but they have not been ruled out — `screenshot_2025-12-23.png`
in particular (3058×588, a stitched capture) is worth a look. Nothing in the plan depends on them.

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
