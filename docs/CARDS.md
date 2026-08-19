# The deck

Seventy-five printed cards — seventy-two in eight suits, plus three that teach the
deck its own vocabulary — generated from the same engine that renders `/type`,
`/pair` and `/matrix`, with a matching card back. A card cannot disagree with the
app, because no card carries a fact of its own: the stacks, the relation codes, the
ease scores, the Octagram wheels and the four sides are all read off `src/engine/`
at build time.

```sh
npm run cards         # → dist-cards/ (two PDFs, two HTML files)
npm run cards:html    # HTML only, no browser needed
```

## What is in it

Suits run easiest first, and one mind is finished before two appear: the alphabet,
the seats it sits in, the sixteen orders it comes in, the four sides each order
runs, and only then the group and pair suits.

| Suit | Cards | What one card is |
|---|---:|---|
| **Elements** | 8 | One information element: what it claims authority over, what it sounds like out loud, what it looks like starved. |
| **Seats** | 8 | One of the eight seats, titled by its name — Lead, Support, Delight, Cave, Doubt, Scold, Blind spot, Dread — with the attitude it carries in the subtitle. |
| **Wirings** | 16 | One type: its stack in seat order, superpower, kryptonite, and who it rests with. |
| **Sides** | 4 | One of the four sides of the mind: its gateway, what blocks it, what opens it, what it produces. |
| **Camps** | 4 | One quadra: its four shared elements, its members, what it values and what it does not. |
| **Bonds** | 8 | One high-compatibility pairing, stated by element rather than by type — four axis bonds and four crosswise meshes. |
| **Channels** | 16 | One intertype relation: its ease score, a worked example in both directions, and where it sits on the ramp. |
| **Wheels** | 8 | One Octagram wheel: its dyad, its origin, its living virtue, its deadly sin and its two poles. |

Seventy-two is not a target that was worked back from — it is what the model has.
`tests/cards.test.ts` asserts each suit's size against the structure that produces it.

The Seat suit and the Wiring suit index each other on purpose: a Seat card is
titled by the same name the Wiring strip prints under each element, the Lead card
says its Power is what the Wirings print as the Superpower, and the Dread card
says its Hate is the Kryptonite.

Three cards sit in front of the suits, because a deck has to teach its own
vocabulary from a standing start: **Octant** (what this is, in eight parts), **The
eight elements** (the alphabet, with the letter system explained), and **How to
read a card** (the anatomy and the suit list). Nothing on those three uses a term
the cards themselves have not defined.

## Bonds

Every other pair surface in this app names four-letter types. That is the wrong
altitude for "who works well with whom", because the answer is not about types: it
is about which element answers which. The suit has two halves of four.

**Axis bonds — Lead meets Lead.** `bondFacts()` sweeps all 240 ordered cross-type
pairs, groups them by the two Leads, and reads the mean ease straight off `ease()`:

| Lead pairing | Mean ease | Example |
|---|---:|---|
| **Axis opposite** (`omega`) | **93** | Ne · Si, Se · Ni, Te · Fi, Ti · Fe |
| Same element | 64 | Ne · Ne |
| Attitude flip (`alpha`) | 54 | Ne · Ni |
| Element swap (`beta`) | 40 | Ne · Se |

The four axis pairings are 29 points clear of the field and are the only ones that
produce Counterpart and Near fit.

**Spark bonds — Lead meets Support, crosswise.** Each camp's two axes admit exactly
one mesh: whoever leads the observer axis's pole is answered by its other pole
sitting in the *Support* seat behind the decider lead, and vice versa. `sparkFacts()`
derives the whole structure, and the sweep behind it proves the general fact the
cards print:

| Crossings holding | Relation | Ease |
|---|---|---:|
| Both — each Lead answered by the other's Support | **Spark** | **92**, both directions |
| Only their Lead answers your Support | Upstream | 54 |
| Only their Support answers your Lead | Downstream | 48 |

One mesh per camp, realised twice — once with both leads facing outward, once
inward — which is why the second four is four cards and not eight. Every number
printed on any Bond card is recomputed from the engine; `tests/cards.test.ts`
re-derives both sweeps and fails if a card and the engine ever disagree. Because
the claims are about elements, they hold for any two types that carry them.

## Derived, with declared exceptions

Four tables in `src/cards/deck.ts` are authored in some sense, and each is
declared in place:

- `SUIT_ABOUT` — one line per suit, printed on the key card only.
- `SIDE_COPY` — four sentences per side. The engine's own side copy is written
  per type (it interpolates that type's functions), and a Side card is not about
  one type, so it could not be borrowed.
- `SEAT_SENSE` — one plain line per seat, for the same reason: the engine's seat
  copy answers "what happens when you aim at it" and "what running it costs",
  and neither says what the seat *is*. The first printing opened every Seat card
  with its cross-side mapping instead, which leant on four Side names the deck
  had not defined yet; the mapping now lives in the footer.
- `REL_TRANSLATE` — a vocabulary map, not new claims. The engine's relation copy
  speaks the app's lexicon ("mobilising function", "base channel"); the deck
  teaches none of those words, so its quotes pass through this map into the
  deck's own seat names (Delight, Blind spot, Lead, Support). Every equivalence
  in it is structural and asserted in `tests/cards.test.ts` — the "mobilising
  function" a Spark feeds *is* the Delight seat, for all sixteen types.

Everything else is composed from engine tables. Where a field is longer than 63mm
of card can hold, `fit()` keeps whole sentences — falling back to whole clauses,
never a phrase cut off mid-breath — so a trimmed card still says something true and
complete. It never truncates mid-word; that is a test.

## The art

One generative composition per card, in `src/cards/art.ts`. Two rules:

1. **Deterministic.** Every random number comes from a PRNG seeded by the card's
   id, so the deck renders byte-identically twice and a diff in the art means a
   diff in the data.
2. **Derived.** Colour is never decorative — every hue is a function's own hue from
   `src/engine/palette.ts` (violet intuition, amber sensing, teal thinking, rose
   feeling; lighter outward, deeper inward). Composition follows the card's
   structure: a Wiring's flow field is aimed by its Lead's family and coloured by
   its own eight slots, a Seat's bar height is how conscious that slot is, a
   Channel's bundle runs parallel or crosses according to its ease score and
   carries a bar of exactly that length, a Side's door stands open by exactly as
   much as that side is reachable.
3. **Named.** Every element the art draws prints its two letters. Colour alone
   cannot identify one — four hue families over eight elements means each hue
   appears twice, and someone opening the box has not been given a key yet.
   `fnMark()` is the single mark the whole deck is built from: filled for a
   conscious element, hollow for one in shadow, legible either way.

### What the art may not say

A card that is type-agnostic may not carry an element, in its marks or in its
colour. Two cards were breaking that rule and are fixed:

- A **Seat** card drew a function's gesture inside each of its eight bars, chosen
  by `(i * 3 + depth) % 8`. That put a different element in slot 3 on every card
  and asserted a slot-to-element mapping which does not exist — which element sits
  in a seat is exactly what varies across the sixteen Wirings. The bars now carry
  their number and their awareness and nothing else, and a test asserts that a Seat
  card names no element and uses no function hue.
- A **Side** card took its tint from `sides("ENTP")` — one type's stack colouring a
  card about a position every type has. Both it and the Seat card are now inked.

A **Wheel** drew `fns[i % 4]` around eight star points, naming each of its four
shared elements twice at unrelated positions. It now names four, once each.

### Fitting the band

The readable strip of a card is 300 x 46 art units — wide and short. Rings do not
fit in it: the first build's eight-element ring and four-element rosette both ran
off the top edge and faded into the paper wash at the bottom. Compositions use the
width instead — rows, columns and pairs — and every label sits inside
`[SAFE_TOP, SAFE_BOTTOM]`, which is 6mm from the page edge down to the line where
`render.ts` starts washing the art back to paper. A test parses every `<text>` the
art emits and checks its box against that window and against the 4.5pt floor.

Everything is SVG, so it stays vector all the way into the PDF and prints at the
press's resolution rather than at ours. There are no image files in this repo and
the build downloads none.

## Print specification

| | |
|---|---|
| Trim | 63 × 88 mm (2.48 × 3.46 in) — standard poker |
| Page | 69.09 × 94.23 mm (2.72 × 3.71 in), i.e. 3.045mm bleed at the sides and 3.117mm top and bottom |
| Safe area | 6.5mm in from the page edge; nothing that must survive the guillotine is outside it |
| Colour | RGB. A press wanting CMYK will convert; the palette is contrast-checked, not ink-matched |
| Text floor | 4.5pt on chrome, 6.5pt on body copy |

Two files come out of `dist-cards/`:

- **`octant-cards.pdf`** — one card per page at the bleed size. This is the file a
  print-on-demand house wants (MakePlayingCards, Printer Studio and similar all
  take 2.72 × 3.71in with bleed). 66 pages.
- **`octant-sheets.pdf`** — 9 A4 pages, nine cards to a page at trim size with crop marks, for cutting a proof at home.
- **`octant-back.pdf`** — the deck's back as a single bleed-size page, which is how print-on-demand houses take it: the eight elements named in a ring, the four axes drawn straight through it, centred so it does not mind being upside down.
  for cutting a proof at home. 8 pages.

There is no card back in either file. Print-on-demand services take the back as a
separate single image; the front-matter art (`mark`, on the title card) is the
obvious candidate and can be exported on its own from `octant-cards.html`.

## How the build checks itself

The one thing a unit test cannot answer is whether text physically fits, so the
build asks a browser. `scripts/build-cards.mjs` renders the deck with a probe
script that measures every card's content against its safe area and reports the
overruns through the document title; a non-empty report fails the build. It
measures the **bottom edge of the last element**, not `scrollHeight` — the footer
is placed with a flex `auto` margin, and an auto margin can carry content out of
its container without ever creating scrollable overflow. Measuring `scrollHeight`
silently passed cards whose footer was being guillotined.

`tests/cards.test.ts` then guards the copy budgets that probe last approved, so
copy cannot creep back past the point where it fits.

## Requirements

Node, and a Chromium that Chrome's `--print-to-pdf` lives in. The build looks for
`$CHROME_PATH` first, then the usual locations. There is no new npm dependency:
Vite, already a dev dependency, is used purely as the TypeScript loader so the deck
stays importable by the test suite rather than trapped in a build script.
