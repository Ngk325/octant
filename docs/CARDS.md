# The deck

Seventy-one printed cards — sixty-eight in eight suits, plus three that teach the
deck its own vocabulary — generated from the same engine that renders `/type`,
`/pair` and `/matrix`. A card cannot disagree with the app, because no card carries
a fact of its own: the stacks, the relation codes, the ease scores, the Octagram
wheels and the four sides are all read off `src/engine/` at build time.

```sh
npm run cards         # → dist-cards/ (two PDFs, two HTML files)
npm run cards:html    # HTML only, no browser needed
```

## What is in it

Suits run easiest first, so the deck can be read in print order from a standing
start: the alphabet, then the seats it sits in, then the sixteen orders it comes in.

| Suit | Cards | What one card is |
|---|---:|---|
| **Elements** | 8 | One information element: what it claims authority over, what it sounds like out loud, what it looks like starved. |
| **Seats** | 8 | One of the eight slots, by the attitude it carries — Power, Responsibility, Innocence, Fear, Worry, Cynicism, Blindspot, Hate. |
| **Wirings** | 16 | One type: its stack in slot order, superpower, kryptonite, and who it rests with. |
| **Camps** | 4 | One quadra: its four shared elements, its members, what it values and what it does not. |
| **Sides** | 4 | One of the four sides of the mind: its gateway, what blocks it, what opens it, what it produces. |
| **Bonds** | 4 | One high-compatibility pairing, stated by element rather than by type. |
| **Channels** | 16 | One intertype relation: its ease score, a worked example in both directions, and where it sits on the ramp. |
| **Wheels** | 8 | One Octagram wheel: its dyad, its origin, its living virtue, its deadly sin and its two poles. |

Sixty-eight is not a target that was worked back from — it is what the model has.
`tests/cards.test.ts` asserts each suit's size against the structure that produces it.

Three cards sit in front of the suits, because a deck has to teach its own
vocabulary from a standing start: **Octant** (what this is, in eight parts), **The
eight elements** (the alphabet, with the letter system explained), and **How to
read a card** (the anatomy and the suit list). Nothing on those three uses a term
the cards themselves have not defined.

## Bonds

Every other pair surface in this app names four-letter types. That is the wrong
altitude for "who works well with whom", because the answer is not about types: it
is about which element answers which.

`bondFacts()` sweeps all 240 ordered cross-type pairs, groups them by the two
Leads, and reads the mean ease straight off `ease()`. The sweep says:

| Lead pairing | Mean ease | Example |
|---|---:|---|
| **Axis opposite** (`omega`) | **93** | Ne · Si, Se · Ni, Te · Fi, Ti · Fe |
| Same element | 64 | Ne · Ne |
| Attitude flip (`alpha`) | 54 | Ne · Ni |
| Element swap (`beta`) | 40 | Ne · Se |

The four axis pairings are 29 points clear of the field and are the only ones that
produce Counterpart and Near fit. Each gets a card, and every number printed on it
is recomputed from the engine — `tests/cards.test.ts` re-derives the whole sweep
and fails if a card and the engine ever disagree. Because the claim is about
elements, it holds for any two types that carry them.

## Derived, with two exceptions

Two tables in `src/cards/deck.ts` are authored, and both are declared in place:

- `SUIT_ABOUT` — one line per suit, printed on the key card only.
- `SIDE_COPY` — four sentences per side. The engine's own side copy is written
  per type (it interpolates that type's functions), and a Side card is not about
  one type, so it could not be borrowed.

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
- **`octant-sheets.pdf`** — A4, nine cards to a page at trim size with crop marks,
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
