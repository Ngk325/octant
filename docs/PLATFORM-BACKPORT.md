# Platform backport — bringing the deck home

The card deck (PR #45) invented conventions, copy, imagery and one whole
concept the web app does not have. This is the plan for reflecting them back
into the platform, plus a full review of the colour scheme. Everything here
was derived from a side-by-side inventory of `src/cards/` against the app
(`src/components/`, `src/views/`, `src/learn/`, `src/styles/`).

**Ordering constraint up front:** the deck's art reads `FN_COLOR.light`
directly, so a palette change re-skins the print deck too. If a physical
proof is about to be ordered, decide Phase 0 first — or accept that the
proof will show the old colours.

---

## Phase 0 — the colour scheme (decide first)

### Why the current palette feels manufactured

The chrome is not the problem: the app already runs the deck's warm paper
(`--canvas #FDFCFA`) and a warm ink family, serif-first. The synthetic feel
is localised in the eight element hues (`src/engine/palette.ts`) and it is
measurable:

- **Wheel spacing.** The four light-theme families sit at hue 261° (N),
  33° (S), 177° (T), 343° (F) — near-perfect 90° quarters of the colour
  wheel. Equidistant hue picks are the signature of a generated categorical
  palette; pigments in nature never space themselves like that.
- **Maximal chroma.** Light saturations run 54–79% — each hue pushed to
  roughly the most saturated value its lightness allows. Te `#0D6560` is a
  process cyan, Ne `#6B3BC4` a spectral violet; no ink or dye lands there.
- **Neon dark mode.** Three of the eight dark values are at literal 100%
  saturation (`#C9A0FF`, `#FFC15E`, `#FF8FB0`) and Te `#5FE0D6` is
  glow-stick mint. This is where "unnatural" screams loudest.

### Two candidates (both already pass WCAG AA on every surface, both themes)

**A — Pigment** (recommended). Re-anchor each family to a natural colorant
and moderate the chroma: N → **indigo** (H≈243, the dye, bluer and calmer
than spectral violet), S → **raw sienna** (barely moved — S was always the
most natural family), T → **verdigris** (oxidised copper, grey-green instead
of process teal), F → **madder** (brick-rose instead of magenta-rose).

|  | Ne | Ni | Se | Si | Te | Ti | Fe | Fi |
|---|---|---|---|---|---|---|---|---|
| light | `#4C4899` | `#373474` | `#855723` | `#694521` | `#326758` | `#244C43` | `#983E4A` | `#762E37` |
| dark | `#A8A6D3` | `#8986BB` | `#D0AE80` | `#B9946A` | `#81BBA8` | `#67A290` | `#DAA0A7` | `#C18189` |

**B — Tame.** Keep today's hue identities, pull saturation into the natural
range (light S ≈ 34–55%), and de-neon dark mode. Lowest-risk option; the
palette stops shouting but keeps its exact colour vocabulary.

|  | Ne | Ni | Se | Si | Te | Ti | Fe | Fi |
|---|---|---|---|---|---|---|---|---|
| light | `#694D9D` | `#4F3979` | `#7B5324` | `#624522` | `#29605B` | `#1F4747` | `#944253` | `#763241` |
| dark | `#B9A4DA` | `#9986C1` | `#D4AF77` | `#B9946A` | `#6FB8AF` | `#5EA19A` | `#DD9DAD` | `#C37F92` |

Minimum AA across canvas/surface/surface-2: 4.73:1 (A) and 4.99:1 (B),
verified with the repo's own `contrastRatio()`.

### Mechanics of the swap

1. `src/engine/palette.ts`: `FN_COLOR` both themes; regenerate `FN_GLOW`
   from the new hexes (same alphas); review `EASE_TEXT`/`EASE_FILL` ramps for
   temperature match (they are already muted; likely keep).
2. `src/styles/tokens.css`: `--accent` currently equals old Ne — retarget to
   new Ne in both themes; check `--warn` (old Se) for consistency.
3. **Legend wording**, if A wins: every place that teaches "violet N, amber
   S, teal T, rose F" — the alphabet card footer (`src/cards/deck.ts`), the
   palette comment, `docs/CARDS.md`, README — becomes "indigo N, sienna S,
   verdigris T, madder F".
4. `tests/palette.test.ts` re-asserts contrast automatically; the deck
   rebuild (`npm run cards`) re-skins all 78 cards; regenerate proof PNGs.
5. **Ink unification** (small, do at the same time): the deck prints with
   `INK #241F19`, the app with `--ink #1A1714`. One warm ink should win —
   recommend the deck's `#241F19` app-wide (it is already
   `QUADRA_COLOR.light.Alpha`), so print and screen share one black.

---

## Phase 1 — one vocabulary (app adopts the deck's plain layer)

The app has a vocabulary-control mechanism already (`Term` +
`engine/lexicon.ts`); the deck's words go in through it, not by scattered
find-and-replace. Current divergences:

| Concept | Deck says | App says | Decision needed |
|---|---|---|---|
| slot | **seat** | slot (`SLOT_NAMES` doc, "the eight slots") | Adopt *seat* user-facing; keep `SLOT_*` identifiers internal. |
| quadra | **Camp** | quadra, unglossed | Adopt *Camp* with quadra as the technical term behind `Term`. Surfaces: Types sort control, Network "Quadras present", PairReader, TypeReader, Matrix. |
| type | **Wiring** | type | Keep both: routes/tabs stay "type" (URL stability), headers lean into Wiring — it is already the brand line ("Read the wiring"). |
| function | **tool / Element** | function | Plain layer says *tool*; `Term` gloss carries "cognitive function". |
| relation | **Channel** | relation | **Collision:** the app's lexicon already uses "channel" for the socionics base/creative channel. Resolve first: rename that lexicon usage to the deck's own translation ("Lead axis / Support axis", which REL_TRANSLATE already established), then "Channel" is free for relations. Do not adopt Channel before this. |
| — | **Bond** | (absent) | New concept — enters with the /bonds surface (Phase 3). Note the word "bond" is used for line segments inside `TypeMolecule.tsx`; rename that local variable. |

Copy backports into the lexicon plain layer: `SEAT_SENSE` (one plain line
per seat), `SIDE_COPY` (the four sides in type-agnostic voice — the superego
two-faces copy is already in `engine/sides.ts`), and the deck's REL_DEF
translations. Tests: extend the existing plain-layer jargon test so the app
never reintroduces "mobilising function" et al. on plain surfaces.

---

## Phase 2 — the deck's visual grammar becomes shared components

### 2a. FnDisc — the named, rippled disc (the deck's one mark)

New glyph component `src/components/glyphs/FnDisc.tsx`: two-letter code in a
disc, **filled = conscious, hollow ring = shadow**, four diagonal ripples
with crests breaking **outward for e, inward for i** — a straight port of
`fnMark()` + `ripple()` from `src/cards/art.ts`. The app currently has no
two-letter disc and no ripple anywhere (`FnIcon` is abstract marks;
`TypeMolecule` letters only its top two beads, and its hollow means
*intraverted*, not shadow — a semantic clash with the deck that should be
resolved in the deck's favour).

Adoption order: `WiringSchematic` stack nodes → `RelationLanding` columns →
`EightSet` → an `FnTag` disc variant. Respect the app's 14px SVG text floor.

### 2b. Seat figure — the type-agnostic seat card, on screen

New `SeatFigure` = the deck's `seat()` art as a component: eight bars
falling by awareness, CONSCIOUS/SHADOW divide, dashed twin arc captioned
"same tool, facing the other way". Today this is split across `StackOrder`
(bars) and `WiringSchematic`'s correspondence arcs. Use in the lexicon's
seat entries and course stage 4. Also: `curriculum.tsx` calls
`WiringSchematic` **without** `showCorrespondence` — turn it on; the course
currently never shows the twin picture at all.

### 2c. Doors — the openness ladder, everywhere sides are taught

`SideDoor` gains the deck's two improvements: the **gateway named as a seat
on the lintel** (today it is a keystone bead in an element hue — the deck
deliberately rejected that: which element stands in a gate varies by type),
and the explicit openness ladder (open / ajar / cracked / barred). Then put
the four-door row on the two pages that teach sides but never show it:
`/type/:type` and `/sides` (it exists only in the course, lexicon figures
and Guide today).

### 2d. Archetype seals — sixteen faces, on screen

Port `emblem()` (16 deterministic glyphs — Prospector's seams, Watchman's
tower, Keeper's key…) to `ArchetypeSeal.tsx`. The epithets appear as text in
six places and have **no imagery anywhere**. Adoption: TypeReader header
(beside the name, exactly like the card), Types tiles, Welcome, TypePicker.

### 2e. Small backports

- `LettersToStack`: adopt the decoder card's tightened step wording.
- Optional, later: the Lead-aimed flow field as a TypeReader header
  wash — the only deck art with no app counterpart. Keep it subtle; the app
  deliberately removed grain/vignette (`tokens.css:6`), so any texture must
  be structural, not noise.

---

## Phase 3 — Bonds: the missing surface

The deck's only genuinely new *concept*: element-level compatibility. The
app has nothing between `InvolutionTable` (structure) and `/pair`
(type-level).

1. **Engine lift:** move `bondFacts()` / `sparkFacts()` from
   `src/cards/deck.ts` into `src/engine/bonds.ts`; deck imports from engine
   (deck stays a pure consumer). Tests move/extend with them.
2. **Route:** `/bonds` — the four axis bonds (Lead meets Lead across omega,
   mean ease 93) and four spark meshes (Lead meets Support crosswise, 92
   both ways), with the deck's "why it works" copy and the Upstream 54 /
   Downstream 48 half-mesh fact. Tab between "Four sides" and "A pair".
3. **Course stage:** a "Bonds" stage between `relations` and `groups`
   (also fix the header comment saying thirteen stages — there are 14).
4. **Registries:** lexicon entries for Bond/Spark mesh; a `bond` chat-figure
   directive in `chat-figures.tsx`.

---

## Phase 4 — structure and navigation echo the frame card

The deck's reading ladder (Elements → Seats → Wirings → Sides → Camps →
Bonds → Channels → Wheels) is the app's implicit order already; make it
explicit: Guide sections and course stages in ladder order, and the Home
page's surface list framed the same way ("one mind first, then two").

---

## Sequencing, size, and gates

| Phase | Blocks | Size | Gate |
|---|---|---|---|
| 0 Palette + ink | proof order; deck rebuild | S (values) + M (legend sweep) | user picks A / B / keep; `tests/palette.test.ts` green; deck rebuilt |
| 1 Vocabulary | 3 (Channel collision) | M | lexicon + Term updated; jargon tests extended |
| 2 Visual grammar | — | L (2a–2d are independent) | each figure adopted on ≥1 real page; SVG text ≥14px |
| 3 Bonds | engine lift first | M | /bonds live; engine tests moved; course stage added |
| 4 Frame ordering | 1 | S | nav/course order matches ladder |

Every phase ends the same way the deck rounds did: tests green, and for
visual work, screenshots reviewed before merge.

## Decisions needed from the owner

1. **Palette:** A (Pigment — recommended), B (Tame), or keep current.
2. **Ink:** unify on `#241F19` (deck) or `#1A1714` (app).
3. **Vocabulary adoptions:** seat ✓/✗, Camp ✓/✗, tool ✓/✗, Channel (after
   collision fix) ✓/✗.
4. **Proof order timing:** before or after Phase 0.
