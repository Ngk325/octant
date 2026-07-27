# Octant — the visual system

A handoff for a design session producing **explanatory illustration**: the
pictures that make Octant's mechanisms legible to a reader who has never
met them.

This is not an asset list. `DESIGN-BRIEF.md` is the asset list — og
images, icons, section spots — and it works for that. It did not produce
a design *framework*, because it is organised by delivery slot rather
than by idea, and a designer reading it learns what files to make but not
what a circle means. This document is organised the other way: one
section per mechanism in the system, each with the picture that has to
carry it.

You do not need repository access. Everything needed is here.

---

## 0. How to read this

**The thesis in one line:** quiet paper, precise geometry, and colour
that always means something.

Three things make an Octant illustration correct, in priority order:

1. **It encodes.** Every visual property is spoken for (§1). A shape's
   size, colour, direction and position are all carrying meaning. If you
   add a property that means nothing, you have broken the system — a
   reader who has learned that size means rank will read your decorative
   size difference as a rank claim.
2. **It is derived.** Any image naming one of the sixteen patterns must
   be computable from that pattern's structure, never invented per type.
   Sixteen hand-drawn illustrations would drift from the engine within a
   release.
3. **It passes its comprehension test.** Every mechanism below states
   what a reader must be able to answer after looking. That sentence is
   the acceptance criterion — not "does it look good".

**Design without words.** The product's vocabulary is mid-revision: a
proposal is live to rename ~60 terms (savior → anchor, Duality →
Counterpart, the Octagram → the Rose, and so on). Illustrations that
depend on labels will need reworking; illustrations that carry meaning in
geometry will not. Where a label is unavoidable, keep it to a
two-letter function code (`Ne`, `Ti`) or a number — those are not
changing.

---

## 1. The grammar

This is the part the previous brief was missing. Five visual properties,
each with exactly one job.

| Property | Encodes | Rule | Never use it for |
|---|---|---|---|
| **Hue** | Which of four elements | N violet · S amber · T teal · F rose | Emphasis, mood, decoration, branding |
| **Direction of motion** | Attitude | Outward-facing = rays, fans, arrows leaving. Inward-facing = cores, strata, beams held close, arrows arriving | Flow of time, reading order |
| **Size** | Rank within a stack | Fixed ratio `1 / .78 / .56 / .42`, strongest first | Importance, hierarchy of the page |
| **Vertical position** | Order or strength | Strongest at top, weakest below. In a wheel: honest route above, counterfeit below | Anything else — the reader will infer rank |
| **Opacity** | Certainty, or shadow-vs-ego | Full = derived and conscious. Reduced (~.4–.6) = shadow, unset, or self-reported | Aesthetic softening |

Two further rules, both absolute:

- **Nothing depends on colour alone.** Every distinction carried by hue
  is also carried by shape, position or label. The palette is
  WCAG-AA-checked against its own canvas and there is a test that fails
  the build if it stops being.
- **People are geometry.** A person is a filled circle head over a
  shoulder arc, ink-coloured. A crowd is a row of them at reduced
  opacity. Never faces, never bodies, never illustrated characters.

### Palette

App canvas: light `#FDFCFA`, dark `#141310`. Both themes are
first-class — deliver a CSS-variable SVG, or a themed pair.

| Element | e (light) | i (light) | e (dark) | i (dark) |
|---|---|---|---|---|
| N — intuition | `#6B3BC4` | `#4B2A8F` | `#C9A0FF` | `#9B7BE0` |
| S — sensing | `#8A5410` | `#6A4416` | `#FFC15E` | `#D19A5C` |
| T — thinking | `#0D6560` | `#0A4A4E` | `#5FE0D6` | `#49B3AE` |
| F — feeling | `#AE3355` | `#8A2543` | `#FF8FB0` | `#E06A8E` |

Chrome, as CSS variables: `--canvas`, `--surface`, `--surface-2`,
`--ink`, `--ink-2`, `--muted`, `--rule`, `--rule-strong`, `--accent`,
`--warn`, `--danger`.

Ease gradients run red → amber → green: light
`rgb(170,42,30)` → `rgb(15,95,70)`, dark
`rgb(232,122,104)` → `rgb(120,214,175)`.

Fills and halos: the same hues at low alpha, ≈.18–.20 light, ≈.38–.45
dark.

### Texture

Warm paper. 1px hairline rules. 6–10px corner radii. Generous
whitespace. Subtle shadows only. **No text below 14px at rendered size**
— including inside an SVG, where text scales with the viewBox and a
"small" diagram silently shrinks its labels below the floor. No
gradients-as-decoration, no glassmorphism, no photographic realism, no
emoji.

---

## 2. The primitives

Eight shapes. Everything in §3 is built from these, and a new
illustration should reach for them before inventing anything.

| Primitive | Geometry | Means |
|---|---|---|
| **Bead** | Filled circle, hue = element, size = rank | One function in someone's stack |
| **Molecule** | Four beads, sized by rank, joined by crossed bonds | One whole pattern — its "face" |
| **Slot row** | A horizontal band in a column of eight | One position, 1 strongest to 8 weakest |
| **Arrow** | Line + arrowhead, hue = the element travelling | One function arriving somewhere |
| **Person** | Head circle + shoulder arc | A person. Row of them = a crowd |
| **Door** | An arch with a keystone bead | A side of the mind, and its entry state |
| **Wheel** | A cross: centre, above, below, two sides | A want and the four ways it goes |
| **Diverging bar** | Two bars growing from a shared centre axis | A quantity that differs by direction |

---

## 3. The mechanisms

Fifteen ideas, in the order a reader meets them. Each says what is
already drawn — **do not redraw these; they ship and they are
tested** — and where the gap is.

---

### 1 · The eight elements

**The mechanism.** Four ways of taking information in and acting on it,
each facing outward or inward. That's it — eight, and everything else in
the system is these eight rearranged.

**Understood when a reader can** say what the second letter of `Ne`
changes, without being told.

**Already drawn.** `FnIcon` — eight abstract marks, one per element,
built from a single rule: outward-facing move out, inward-facing move
in. Ne branches from a node; Ni converges many lines to a point; Se is
an open lens with rays out; Si is bottom-weighted strata; Te is steps
rising to a target; Ti is a lattice built from the ground; Fe is a ring
of linked dots; Fi is a plumb line into a core.

**Gap.** The eight read well individually and have never been drawn as a
*set* — one figure showing four families × two directions, so the
symmetry is visible at a glance.

---

### 2 · Four letters become a stack

**The mechanism.** The four-letter code is not the pattern; it is the
recipe. Two of its letters pick the lead function and the rest fall out.

**Understood when a reader can** point at the letter that decided their
lead function.

**Already drawn.** `LettersToStack` works it live for any of the
sixteen. `DerivationTree` draws the branching underneath — take in vs
decide, four element families, each facing out or in — as three binary
splits with real edges and eight leaves.

**Gap.** None. This one is solid.

---

### 3 · The eight slots

**The mechanism.** One person's eight elements in a fixed order of
strength. The top four feel like *me*; the bottom four run anyway and
feel like things that happen to you.

**Understood when a reader can** name which slot they'd defend hardest
if criticised, and why that is slot 4 and not slot 8.

**Already drawn.** `WiringSchematic` — a single readable column, eight
rows, strongest at top, shadow rows at reduced opacity. Two regions get
bracket markers: the sore spot at slot 4, and the pair at slots 3–4.
Dashed arcs join each ego slot to its shadow mirror.

**Gap.** The column is honest but plain. The *emotional gradient* across
the eight — comfortable at the top, uneasy at the bottom — is currently
carried only by opacity, and it is the thing that makes the stack land.

---

### 4 · The ego–shadow mirror

**The mechanism.** Slots 5–8 are not four extra functions. They are the
same four capacities with the attitude flipped: 1↔5, 2↔6, 3↔7, 4↔8. The
shadow is not a second personality.

**Understood when a reader can** predict their slot 6 from their slot 2.

**Already drawn.** The dashed correspondence arcs in `WiringSchematic`.
`ArchetypeGrid` draws the top four as the 2×2 they secretly are — aware
or not × optimistic or not — and names each cell's shadow mirror.

**Gap.** The flip itself has never been drawn as a *motion*. An
attitude flip is one operation and it currently looks like a
coincidence of position.

---

### 5 · The three moves

**The mechanism.** Everything derived in this product is a composition
of three operations on an element: flip the attitude, swap the element,
or do both. No lookup tables anywhere.

**Understood when a reader can** believe the "nothing is looked up"
claim, because they have seen the machine.

**Already drawn.** `InvolutionTable` — three columns of mono tags, all
eight elements, each move applied.

**Gap.** It is a table, and it is the single most load-bearing claim in
the product. It deserves a figure: three operations as three visual
transformations on one bead, so the composition is watchable.

---

### 6 · Four sides of one mind

**The mechanism.** Split the eight slots into groups of four and each
group is itself one of the sixteen. A person is four patterns, moving
between them all day. The ego's weakest function is the subconscious's
strongest — which is why the other sides feel like meeting someone else.

**Understood when a reader can** explain why their worst function is
another side's best.

**Already drawn.** `FourSidesDiagram` — four cards, each with its own
four-slot stack, each cell labelled twice: what it is here, and what it
is in the ego. Each card leads with its side's molecule, so the reader
sees four different arrangements of recognisably the same beads.

**Gap.** The *re-sorting* is the mechanism and it is currently shown as
a result. Four static cards do not show eight beads being dealt into
four hands.

---

### 7 · The four doors, in order

**The mechanism.** You develop the sides in sequence, and each has
exactly one door — a function from your own top four. The last door
opens you rather than the other way round if forced early. Two named
crises are what happens when a door stays shut too long.

**Understood when a reader can** name their own next door and what it
costs to open.

**Already drawn.** `GatewayPath` draws the four as an ordered path, the
final step in the danger colour. `SideDoor` draws one side as the door
you enter it through: keystone bead = the gateway function, and the
door's state is the side's honest condition — open, ajar, closed,
barred.

**Gap.** None structurally. The two crises are named in prose and never
drawn; they are the most human moment in the whole model.

---

### 8 · The exchange overlay

**The mechanism.** A second reading of the same top four: two you trust
completely and two that make you nervous. The nervous two are the axis
opposites of the trusted two, which puts them at slots 3 and 4 — this
overlay never reaches into the shadow.

**Understood when a reader can** say which two of their top four they
show off about rather than practise.

**Already drawn.** `SaviorDemonGrid` — one 2×2, observer/decider down
one axis and trusted/nervous across the other, so it reads as one
structure with two axes rather than four separate facts.

**Gap.** The three behavioural tells for each side are prose beside the
grid. They are the part a reader can actually check against their own
week.

---

### 9 · The four currents

**The mechanism.** Pair one observer attitude with one decider attitude
and you get four patterns: two that move energy, two that move
information, each either outward or inward. They come in a stack order —
first and last derived, the middle two genuinely open until the reader
says.

**Understood when a reader can** say which two facts a current encodes
(kind, and direction) without a legend.

**Already drawn.** `AnimalGlyph` — arrows in, out, both, or a closed
loop, drawn around one person. `AnimalStack` shows the four in order,
with the open middle positions drawn as genuinely open rather than
quietly guessed.

**Gap.** Energy-versus-information is currently a label, not a visual
property. Two of these four are a different *kind* of thing from the
other two and nothing in the drawing says so.

---

### 10 · Camps

**The mechanism.** Four groups of four sharing the same four ego
functions, and therefore the same values. The best single predictor of
whether a room argues about goals or only about methods.

**Understood when a reader can** see why two camps feel adjacent and two
feel opposed.

**Already drawn.** `QuadraFunctionGrid` — four rows, the four functions
each camp's members hold. Read down a column and the shared axes appear.

**Gap.** Adjacency is derivable from the grid but not *shown*. The four
camps have a real geometry and it is currently a table.

---

### 11 · One relation

**The mechanism.** This is the whole engine in one picture. When your two
strongest functions arrive in someone else's stack, which of their eight
slots do they land on? Land on the sore spot and you are relief; land on
the blind spot and neither of you can tell what happened. All 256
relations, both ease scores and every playbook reduce to this.

**Understood when a reader can** predict whether a pairing will be
restful *before* reading the score.

**Already drawn.** `RelationLanding` — two stacks side by side, arrows
from one person's top two into the other's eight. Columns are named for
the two people, matching the pair page's sticky perspective bar.

**Gap.** None. This is the best diagram in the product. **Anything new
should be judged against it.**

---

### 12 · Ease runs both ways

**The mechanism.** Four of the sixteen relations are asymmetric. A
single compatibility number would hide the most useful fact about those
pairs, so both directions are always shown — and the person on the
easier side almost never notices.

**Understood when a reader can** tell which of the two people is doing
more work.

**Already drawn.** `DivergingEase` — two bars growing away from a shared
centre axis. This replaced two stacked bars that made the product's most
distinctive claim invisible in its own picture.

**Gap.** None.

---

### 13 · More than two

**The mechanism.** A group is not a sum of pairs; it has shape. Some
rooms have a quiet carrier, some have a fault line.

**Understood when a reader can** point at the friction in a room of five.

**Already drawn.** `NetworkRing` — members on a ring, every pair joined
by a line coloured and weighted by ease.

**Gap.** Above about six people the ring becomes a hairball. The failure
mode is known and unsolved.

---

### 14 · The Rose

**The mechanism.** A second layer: what a pattern has been chasing its
whole life, and what a particular childhood did to how it chases. Sixteen
patterns pair into eight wheels; two wheels make a house; a house is
exactly one four-sides orbit. Each wheel is a cross — the want at the
centre, the honest route directly above, the counterfeit directly below,
and two sideways drifts that are two distortions rather than a good
option and a bad one.

**Understood when a reader can** explain why the counterfeit is
tempting, not merely wrong.

**Already drawn.** `OctagramWheel` draws one wheel as that cross.
`OctagramMap` draws all eight around a ring with four arcs behind them
for the houses — the figure that makes the product's name make sense:
eight points, because a pattern and its subconscious share one.

**Gap.** The two sideways drifts are the least certain part of the whole
model and the app says so in words. Nothing in the drawing carries that
lower confidence, and it should.

---

### 15 · Seasons

**The mechanism.** Two coins, neither readable from the pattern: was the
reaching side fed in childhood, and where is attention now. Crossed,
they give four places people live. Everyone cycles through all four and
none is a verdict.

**Understood when a reader can** see that this is about their life, not
their wiring.

**Already drawn.** `ThemeSeasons` — a 2×2, development down the side and
focus across the top, using the four seasons as the mood carrier.

**Gap.** The seasons want real illustration — as pure geometry, never
literal trees or snowflakes. Sprouting strata, a full fan, falling
beads, a bare lattice.

---

## 4. What to make

Ranked by how much a reader gains. Every item is an *explanatory*
illustration; the marketing assets in `DESIGN-BRIEF.md` are separate work.

### First — the three that unlock the model

| # | Piece | Why it is first |
|---|---|---|
| 1 | **The three moves, as motion** (§5) | The "nothing is looked up" claim is the product's spine and it is currently a table of tags. Show one bead undergoing each operation, then a composition. |
| 2 | **Eight into four hands** (§6) | Four sides is the idea readers find hardest. The re-sorting must be shown happening, not shown finished. |
| 3 | **The elements as one set** (§1) | Four families × two directions in a single figure. Everything downstream depends on this reading correctly. |

### Second — the ones that make it felt

| # | Piece | Note |
|---|---|---|
| 4 | **The stack's emotional gradient** (§3) | Comfortable at top, uneasy at the bottom, carried by more than opacity. |
| 5 | **The attitude flip** (§4) | One operation, drawn as one motion, so the mirror stops looking coincidental. |
| 6 | **Energy vs information** (§9) | The four currents split into two kinds and the drawing must say which. |
| 7 | **The two crises** (§7) | The most human moment in the model, currently prose only. |
| 8 | **Four seasons** (§15) | Pure geometry in the four family hues. |

### Third — the known failures

| # | Piece | Note |
|---|---|---|
| 9 | **Camp adjacency** (§10) | Give the four camps their real geometry instead of a table. |
| 10 | **Groups above six** (§13) | The ring becomes a hairball. Open problem — propose a form. |
| 11 | **Uncertainty in the wheel** (§14) | The two drifts are the least certain thing in the model; make the drawing admit it. |

---

## 5. Acceptance

Check these yourself before handing back. Every one has bitten us.

- [ ] **Passes its comprehension test.** The sentence in §3 under
      "understood when a reader can" — not "does it look good".
- [ ] **Every visual property encodes something** from §1. No decorative
      size, hue, direction or opacity.
- [ ] **Nothing depends on colour alone.** Shape, position or label
      carries it too.
- [ ] **No text below 14px** at rendered size, including inside SVG
      where the viewBox scales it.
- [ ] **Both themes.** CSS-variable SVG, a themed pair, or genuinely
      theme-neutral. Semantic hues from §1 for meaning; `--` variables
      for chrome.
- [ ] **Self-contained SVG.** No webfonts (outline any text), no linked
      images, no external references.
- [ ] **Original geometry.** Nothing traced or adapted from existing
      diagrams, decks or community artwork. No clip-art, no emoji.
- [ ] **No third-party system, school, author or brand** named anywhere
      — including image text, metadata and filenames. There is a test
      that fails the build on fifteen specific names.
- [ ] **No real or identifiable person.** People are the §1 primitive.
- [ ] **Derived, not authored.** Anything naming one of the sixteen must
      be computable from that pattern's structure.
- [ ] **Degrades on a phone.** Say what happens below 640px: reflow,
      scroll inside its own container, or a stated minimum width.

---

## 6. Delivery

- One flat folder, `octant-figures/`.
- `octant-fig-<mechanism>.svg`, mechanism slug from the §3 heading —
  `octant-fig-three-moves.svg`, `octant-fig-four-sides.svg`.
- SVG masters for everything; PNG only where a platform demands it.
- A short README mapping each file to its §3 section, plus anything that
  deviates from this document and why.

Wiring figures into routes and components is engineering's side. Nothing
here requires touching code.
