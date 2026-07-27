# Octant — the complete visual catalogue

Every concept in the product, its illustration, and what is missing.

Companion to `DESIGN-SYSTEM.md`, which sets the grammar (what hue, size,
direction and opacity each encode) and specifies fifteen mechanisms. This
file is the exhaustive version: **all 71 lexicon terms plus every surface**,
each with a status and a spec.

Names throughout are the locked vocabulary in `VOCABULARY.md`. Old term in
grey where it helps.

---

## The coverage problem

| | Count |
|---|---|
| Lexicon terms | **71** |
| Terms with an illustration **where the reader looks them up** | **10** |
| — the eight functions (icon + verbs, via `FunctionExtras`) | 8 |
| — `stack-map`, `last current` (the whole figure registry) | 2 |
| **Terms with nothing** | **61** |

Roughly twenty good diagrams ship, but they live on the type, pair and
learn pages. Open the lexicon — the place a confused reader goes — and
almost every entry is a wall of prose.

**That gap is the single biggest cause of "too technical".** It is not
that the writing is too dense; it is that a term has no picture at the
moment the reader needs one.

---

## Worked critique: the eight slots

The figure flagged in review, and a good example of the general fault.

**What is on screen, per row:** slot number · slot name · a keyword
(`Power`, `Innocence`, `Fear`) · a coloured bead · the function code ·
the function's full name · a plain gloss · an overlay marker. Plus dashed
arcs sweeping off to the left, and a correspondence formula underneath.

**Eight pieces of information per row, in four competing label systems.**

Specific failures:

1. **`the cave` and `demon` stack on slot 4** and read as one phrase —
   "the cave demon". They are two independent markers from two different
   readings. Nothing separates them.
2. **The dashed arcs curve into empty space.** They are supposed to join
   1↔5, 2↔6, 3↔7, 4↔8, but they exit left and never visibly arrive. They
   read as decoration, and the formula below has to explain in text what
   the drawing failed to show.
3. **The overlay markers float** at the right margin with no rule, tick
   or bracket tying them to their row.
4. **The shadow rows are dimmed but not simplified.** They carry the same
   full label set as the front four, so the visual weight contradicts the
   stated hierarchy.
5. **Two vocabularies collide** — slot names (`Hero`, `Child`) and
   overlay names (`savior`, `demon`) — with nothing to say they are
   different readings of the same row.

**The fix is not a redraw, it is a split.** One figure, one job:

| Figure | Shows | Nothing else |
|---|---|---|
| **A · The order** | Eight rows, rank by size, element by hue, front four solid / back four quiet | No overlay, no arcs, no keywords |
| **B · The mirror** | Only the four pairings, as one motion — same element, attitude flipped | No overlay, no glosses |
| **C · The overlay** | The same eight rows with two Anchors and two Flinches marked | No arcs, no keywords |

Three simple figures beat one complete one. This is the pattern for the
whole product: **progressive disclosure, not compression.**

---

## Page shape: simple at the top, technical at the bottom

Every reading page follows one curve. This is a layout rule, not a
writing preference — the design has to make the altitude visible.

| Band | Contains | Visual register |
|---|---|---|
| **1 · Plain** | One sentence a stranger understands. No vocabulary. | Large serif, generous space, one hero figure |
| **2 · Picture** | The mechanism, drawn. Minimal labels. | Full-width figure, quiet caption |
| **3 · Named** | The same idea with the vocabulary attached, each term a `?` | Body prose, inline term chips |
| **4 · Interactive** | Reader sets something and the figure responds | Panel, distinct surface |
| **5 · Technical** | Codes, derivations, the exact mechanics | Mono, reduced contrast, collapsible |

Bands 4 and 5 should be **visibly deeper** — a different surface tint, a
rule, or a collapsed disclosure. A reader must be able to tell where the
page stops being for them without reading it.

**Design needed:** a band-transition treatment. One motif that says "it
gets more technical from here" and works four times on a page without
becoming wallpaper.

---

## The catalogue

Status: ✅ shipped · ◐ exists but needs work · ○ nothing

### Functions — the eight elements

| Term | Status | Notes |
|---|---|---|
| `Ne Ni Se Si Te Ti Fe Fi` | ✅ | `FnIcon` — eight original marks, outward-facing move out, inward-facing move in |
| **Attitude** (the e/i distinction itself) | ○ | **Needed.** The single most reused idea in the model and it has no mark of its own. One figure: the same element facing out, then in. Everything else inherits it |
| **Observer / Decider** | ○ | **Needed.** The other axis. Taking in vs acting on — two postures |
| Self/tribe calibration | ✅ | `SelfTribeCone` — narrow beam to one held point vs wide fan over a crowd |
| The eight as a set | ○ | **Needed.** Four families × two directions in one figure, so the symmetry is visible at a glance |

### The stack

| Term | Status | Notes |
|---|---|---|
| Lead · Support · Delight · Cave | ◐ | In `WiringSchematic`; see critique above. Needs figure A |
| Doubt · Scold · Blind spot · Dread | ◐ | Same |
| **the front four / the back four** | ○ | **Needed.** The block split as one shape, not eight rows |
| **The mirror** (1↔5, 2↔6, 3↔7, 4↔8) | ◐ | Arcs exist and fail. Needs figure B — the flip as one motion |
| Archetype grid | ✅ | `ArchetypeGrid` — aware × optimistic 2×2 |
| Four letters → stack | ✅ | `LettersToStack` + `DerivationTree` |
| Type identity | ✅ | `TypeMolecule` — four beads by rank, crossed bonds, all sixteen distinct |

### The three moves

| Term | Status | Notes |
|---|---|---|
| **flip · swap · turn** | ◐ | `InvolutionTable` is a table of mono tags. **Highest-value missing figure.** Three operations as three visual transformations on one bead, then a composition. This is the "nothing is looked up" claim |
| Stack map | ◐ | Registry figure exists |

### The four sides

| Term | Status | Notes |
|---|---|---|
| Front · Reach · Reserve · Guard | ✅ | `FourSidesDiagram` — four cards, each cell double-labelled |
| **The re-sorting** | ○ | **Needed.** Eight beads dealt into four hands. The diagram shows the result; the mechanism is the dealing |
| **The doors** | ✅ | `SideDoor` — arch with keystone bead; open / ajar / closed / barred |
| Door order | ✅ | `GatewayPath` — ordered path, last step in the danger colour |
| **First / Second reckoning** | ○ | **Needed.** The most human moment in the model and it is prose. A door opening the wrong way |
| Gate + the four gates | ○ | **Needed.** Four structural fears; currently text only |

### The exchange overlay

| Term | Status | Notes |
|---|---|---|
| Anchor · Flinch | ✅ | `SaviorDemonGrid` — one 2×2, two axes |
| **The behavioural tells** (3 per side) | ○ | **Needed.** The part a reader can check against their own week |
| Charge · Settle · Broadcast · Absorb | ✅ | `AnimalGlyph` — arrows in/out/both/loop around one person |
| **Energy vs information** | ○ | **Needed.** Two of the four are a different *kind* and nothing in the drawing says so |
| Current stack | ✅ | `AnimalStack` — open middle positions drawn genuinely open |
| last current | ✅ | Registry figure |
| switch · fine switches | ○ | **Needed.** A binary with a determined/free distinction |
| the two readings | ○ | **Needed.** Two accounts of one stack, unreconciled — the honesty posture, undrawn |

### Relations

| Term | Status | Notes |
|---|---|---|
| The mechanism | ✅ | `RelationLanding` — **the best figure in the product.** Judge new work against it |
| Ease, both directions | ✅ | `DivergingEase` — two bars from a shared centre |
| **The sixteen, individually** | ○ | **Needed, 16 marks.** Each relation as one small glyph — Counterpart, Twin, Upstream/Downstream, Headwind. Currently a name and a paragraph. Should be derivable from where the arrows land |
| Complement · Catalyst | ○ | **Needed.** Restful vs stimulating, as two contrasting arrivals |
| Groups | ◐ | `NetworkRing` hairballs above ~six people. Open problem — propose a form |

### Camps and temperaments

| Term | Status | Notes |
|---|---|---|
| Hearth · Forge · Market · Field | ◐ | `QuadraFunctionGrid` is a table. **Needed:** four places, each instantly a different kind of room — and their adjacency, which is real and currently invisible |
| Systems · Meaning · Order · Contact | ○ | **Needed.** Four organising principles |
| Directs · Navigates · Rallies · Steadies | ○ | **Needed.** Four ways of moving a group — postures, not icons |
| Playful · Caring · Pursuing · Pursued | ○ | **Needed.** Two complementary pairs. Warm, never clinical, never a verdict |

### The Rose

| Term | Status | Notes |
|---|---|---|
| the Rose | ✅ | `OctagramMap` — eight wheels, four house arcs |
| wheel · origin · True north · Counterfeit | ✅ | `OctagramWheel` — the cross |
| **Fed drift / Starved drift** | ◐ | Drawn at full confidence. **The least certain part of the model** — the drawing must admit it |
| House | ◐ | Arcs behind the ring. Deserves its own figure: four types that are each other's four sides |
| season · the four seasons | ◐ | `ThemeSeasons` 2×2 exists. **Needed:** the four as pure geometry — sprouting strata, full fan, falling beads, bare lattice. Never literal trees or snowflakes |
| Fed / Starved · focus | ○ | **Needed.** Two independent axes, one fixed in childhood, one movable now |

---

## New surfaces

### Onboarding — the foundation gate

A reader currently lands in a fully-loaded application. **The single
biggest cause of abandonment.** Before entering, they should pass through
the minimum that makes everything else legible.

Six screens. One idea each, one figure each, no vocabulary until it is
earned:

| # | Idea | Figure | Reader can then |
|---|---|---|---|
| 1 | Eight ways of paying attention | The eight as a set | Name the two halves |
| 2 | Facing out or facing in | The attitude mark | Say what `Ne` vs `Ni` changes |
| 3 | Everyone has all eight, in an order | The order (figure A) | Say why the order is the type |
| 4 | Your best and your sore spot | Lead and Cave, highlighted | Name their own Cave |
| 5 | Two people meeting | `RelationLanding`, simplified to one arrow | Predict restful vs costly |
| 6 | It runs both ways | `DivergingEase` | Say why one number would lie |

**Design needed:** a screen template (figure-dominant, one sentence, one
control), a progress indicator that reads as *building* rather than
*remaining*, and a completion moment that hands the reader their first
real page.

Rules: skippable but re-enterable; never a quiz with wrong answers; each
screen must survive being the only one someone reads.

### The translation surface

Public-facing, and the one place other systems may be named. A reader
arriving with vocabulary from elsewhere finds their footing.

**Design needed:** a two-column mapping treatment — ours on the left,
prominent; theirs on the right, quieter and clearly secondary. Plus a
**divergence mark** for the four places the mapping genuinely breaks,
which must read as "careful here", not "error".

### Term help — the `?`

Every named term needs a `?` that opens a definition. That is ~71
triggers, so the affordance must be nearly weightless.

**Design needed:** the trigger at rest, hovered and open; a popover
template with room for one line of plain language, one figure, and a link
to the full entry. Must work on touch, and must not reflow the paragraph
it sits in.

### Interactive elements

Where a reader setting something teaches more than reading:

| Where | Interaction |
|---|---|
| The stack | Pick a type, watch the eight rows re-sort from the previous type |
| The three moves | Apply flip / swap / turn to a bead and watch it travel |
| The four sides | Drag the split point; four hands re-deal |
| Relations | Move one person's Lead down the other's stack and watch ease respond |
| Ease | Toggle direction and see the asymmetry appear |

**Design needed:** one consistent "this responds to you" affordance,
distinct from a link and from a form control, plus its resting,
hover, active and disabled states.

---

## Consistency rules

Beyond `DESIGN-SYSTEM.md` §1, these are what a catalogue this size needs
to stay coherent:

1. **One figure, one job.** If a caption needs "and also", it is two
   figures. The eight-slot diagram is the standing counter-example.
2. **A term's mark is the same everywhere.** Whatever `Cave` looks like
   in the lexicon is what it looks like in onboarding, on the type page
   and in the assistant. 71 terms cannot afford variants.
3. **Marks nest.** A relation glyph is built from stack marks; a stack
   mark is built from element marks. A reader who learns the small
   pieces can read the big ones without being taught again.
4. **Uncertainty is visible.** Anything self-reported, unset or
   low-confidence looks different from anything derived. The model's
   honesty is a design requirement, not a copy decision.
5. **Every figure states its phone behaviour.** Reflow, scroll inside its
   own container, or a stated minimum width — chosen deliberately.

---

## Priority

**First — unlocks the model**
1. The three moves, as motion
2. The eight-slot split (figures A, B, C)
3. Attitude, as its own mark
4. The elements as one set

**Second — unlocks the product**
5. Onboarding screen template and its six figures
6. The `?` popover system
7. Band-transition treatment for page altitude

**Third — completes the catalogue**
8. The sixteen relation marks
9. Camps, temperaments, interaction styles, romance (16 marks)
10. Energy vs information; the behavioural tells; the two readings
11. Seasons as geometry; uncertainty in the wheel
12. Groups above six people — open problem

Delivery, acceptance and the visual grammar: `DESIGN-SYSTEM.md` §1, §5, §6.
