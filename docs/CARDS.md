# The deck

Seventy-eight printed cards — seventy-three in eight suits, plus five that teach the
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
| **Channels** | 17 | The suit's index — all 256 readings as a colour-scaled grid, the print twin of `/matrix` — then one card per intertype relation: its ease score, a worked example in both directions, and where it sits on the ramp. |
| **Wheels** | 8 | One Octagram wheel: its dyad, its origin, its living virtue, its deadly sin and its two poles. |

Seventy-three is not a target that was worked back from — it is what the model
has (seventy-two structural cards, plus the Channel suit's own 256-cell index).
`tests/cards.test.ts` asserts each suit's size against the structure that produces
it, and re-derives every one of the grid's cells against `ease()`.

The Seat suit and the Wiring suit index each other on purpose: a Seat card is
titled by the same name the Wiring strip prints under each element, the Lead card
says its Power is what the Wirings print as the Superpower, and the Dread card
says its Hate is the Kryptonite.

Five cards sit in front of the suits, because a deck has to teach its own
vocabulary from a standing start: **Octant** (what this is, in eight parts),
**Eight suits, one frame** (the contents page with a reason attached — what
question each suit answers and why the order matters, one suit per row),
**The eight elements** (the alphabet: each row keyed by the element's own
mark, its full name over its detail line),
**The four letters** (the decoder: how a code like INTJ picks the
seats, worked from `stack()` so it cannot disagree with the engine), and
**How to read a card** (the anatomy and the suit list). Nothing on those five
uses a term the cards themselves have not defined. The decoder answers the
first question anyone arriving with "I'm an INTJ" actually has — the app's own
`LettersToStack` walkthrough, condensed to card size.

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

## The pull loop

The Side and Wiring suits close a loop on purpose. Each Side card's footer says
whose Wiring that side runs — the ego runs your Twin's (your own), the
subconscious your Counterpart's, the unconscious your Damper's, the superego
your Standoff's — and every Wiring card's fourth block names those four types
for its own type ("ENTP ego · ISFJ subconscious · INTJ unconscious · ESFP
superego"), so a reader holding any type card can pull the three Wirings its
doors open onto. The mapping is derived from the same involutions as the
relation table and asserted per type in `tests/cards.test.ts`, including that
each side's own stack opens with the named type's (lead, support) pair.

## Spelled: Intraverted

The whole app and deck spell the inward attitude **Intraverted** (and
**Intravert**), by the owner's convention. The one module exempt is
`src/engine/translation.ts`, which exists to quote *other* systems'
vocabulary verbatim — socionics' "Logical Intuitive Introvert" stays as
socionics wrote it — and the source transcriptions under `docs/transcripts/`,
which are records, not voice.

## Renamed: Loose fit

The MG relation (socionics' Mirage) printed as **False fit**, which reads as a
warning on the fourth-easiest relation in the ramp (ease 80: relaxing,
unserious, good for rest). It is now **Loose fit** — parallel to Near fit,
which shares the Lead half of a Counterpart where Loose fit shares only the
Support half — renamed across the whole app, not just the deck.

## Derived, with declared exceptions

Three tables in `src/cards/deck.ts` are authored in some sense, and each is
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

A fourth table, `REL_TRANSLATE`, existed to translate the engine's old lexicon
vocabulary ("mobilising function", "base channel") into the deck's seat names.
The platform backport retired it: the engine's relation copy now says Delight,
Blind spot and "Leads/Supports share an axis" natively, the deck quotes
`REL_DEF` unmediated, and the structural equivalences behind that language are
still asserted per type in `tests/cards.test.ts`.

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
   `src/engine/palette.ts` (indigo intuition, sienna sensing, verdigris thinking, madder
   feeling; lighter outward, deeper inward). Composition follows the card's
   structure: a Wiring's flow field is aimed by its Lead's family and coloured by
   its own eight slots, a Seat card draws all eight bars with the
   conscious/shadow divide and an arc to its twin seat ("same tool, turned"), a
   Channel's bundle runs parallel or crosses according to its ease score and
   carries a bar of exactly that length, and a Side card draws all four doors of
   the mind — ego open, subconscious ajar, unconscious cracked, superego barred —
   with its own door in focus and the gateway seat named on the lintel.
3. **Named.** Every element the art draws prints its two letters. Colour alone
   cannot identify one — four hue families over eight elements means each hue
   appears twice, and someone opening the box has not been given a key yet.
   `fnMark()` is the single mark the whole deck is built from: filled for a
   conscious element, hollow for one in shadow, legible either way.
4. **Directed.** Attitude reads as direction, not just as a small letter: every
   disc carries four ripples on its diagonals, arcs with a pointed crest that
   breaks *outward* on an extraverted element and back *into* the disc on an
   intraverted one. The diagonals are deliberate — rows, captions, dividers and
   connecting lines all run horizontal or vertical, so the ripples never sit on
   one. The alphabet card's footer states the convention; a test asserts the
   eight-element card carries four of each.

Each Wiring also bears the **seal of its own archetypes** — sixteen original
figures keyed to the `ARCHETYPE` table (the Prospector's seams fanning from one
strike, the Watchman's dark tower on the horizon, the Keeper's key…), drawn
bold in ink with the Lead's hue as the accent, inside a ring. They are this
system's own imagery, not borrowed icons; a test asserts all sixteen are
distinct. The seal prints on the **card body**, opposite the type's name under
the head rule — two earlier drafts sat it in the art band, first as a watermark
behind the stack row (the row won; nothing survived but slivers) and then on
the band's flank (where the paper wash muted it). On clean paper it runs at
full strength, which is what a seal is for. The alphabet card uses the same
trick in miniature: each of its eight rows carries that element's own mark
(`markFor`) as a key, so the disc system and the words teach each other.

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

Three files come out of `dist-cards/`:

- **`octant-cards.pdf`** — one card per page at the bleed size, 78 pages. This is
  the file a print-on-demand house wants (MakePlayingCards, Printer Studio and
  similar all take 2.72 × 3.71in with bleed).
- **`octant-sheets.pdf`** — 9 A4 pages, nine cards to a page at trim size with
  crop marks, for cutting a proof at home.
- **`octant-back.pdf`** — the deck's back as a single bleed-size page, which is
  how print-on-demand houses take it: the eight elements named in a ring, the
  four axes drawn straight through it, centred so it does not mind being upside
  down.

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
