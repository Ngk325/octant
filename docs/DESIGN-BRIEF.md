# Octant — illustration & asset commission

A self-contained brief for a design session (human or Claude) producing
images, visuals and illustrations for **Octant**, a web instrument that
maps how people think and how those patterns mesh — both directions of
every relationship, whole-group dynamics, and a growth path for each
person. You do not need repository access: everything required to produce
correct, on-brand artwork is in this document.

**The style thesis, in one line:** quiet paper, precise geometry, colour
that always means something.

---

## 1. What Octant is

Octant describes sixteen patterns of attention and judgement — "wirings"
— and computes everything it shows from a small piece of structure: what
a person leads with, what they quietly fear, the four sides of their
mind, how any two wirings mesh in each direction, and what a whole room
of them adds up to. The product's voice is honest and unhyped ("a lens,
not a measurement"), literary rather than techy, and it never names any
third-party school, author or brand — and neither may any artwork,
caption, or filename you produce.

The audience: coaches and practitioners, founders and teams, partners
and families, and individuals reading themselves. High-intent adults who
have seen personality tooling before and are allergic to both mysticism
and dashboard-gloss.

## 2. Brand foundations

### The mark

Two rounded squares of equal size, one rotated 45°, sharing a centre —
an eight-pointed figure — with a filled centre dot in the accent colour.
Stroke-drawn, not filled; the rotated square runs at reduced opacity
(≈ 45–50%). Reproduce it exactly; do not redraw it freehand.

```svg
<svg viewBox="0 0 64 64" fill="none">
  <rect x="14" y="14" width="36" height="36" rx="5" stroke="CURRENT" stroke-width="2.5" opacity=".9"/>
  <rect x="14" y="14" width="36" height="36" rx="5" stroke="CURRENT" stroke-width="2.5" opacity=".45"
        transform="rotate(45 32 32)"/>
  <circle cx="32" cy="32" r="5.5" fill="ACCENT"/>
</svg>
```

### Colour — the public (marketing) palette

One CSS-variable set serves both themes; artwork for the public page
should reference the variables, not hardcode, so a single SVG themes
itself.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--m-paper` | `#FDFCFA` | `#141310` | page canvas |
| `--m-surface` | `#FFFFFF` | `#1D1B17` | cards |
| `--m-soft` | `#F4F1EA` | `#24211C` | soft panels |
| `--m-ink` | `#1A1714` | `#EDE9E1` | primary text |
| `--m-ink2` | `#4C463D` | `#B6AFA3` | secondary text |
| `--m-muted` | `#6B6459` | `#8E8779` | tertiary text |
| `--m-rule` | `#E3DED4` | `#2E2A24` | hairlines |
| `--m-accent` | `#6B3BC4` | `#C9A0FF` | violet accent |
| `--m-accent-ink` | `#4B2A8F` | `#DCC0FF` | accent as text |
| `--m-accent-soft` | `#F0E9FC` | `#241B33` | accent wash |
| `--m-rose` | `#C2477F` | `#E487B4` | second party / warmth |

### Colour — the app's semantic palette

Inside the app, colour is **meaning**. Four hue families, one per
element of the system; the outward-facing ("e") variant is lighter, the
inward-facing ("i") variant deeper. Never recolour these and never use
them decoratively — a violet shape *is* an intuition statement.

App canvas: light `#FDFCFA`, dark `#141310`.

| Element | e (light theme) | i (light) | e (dark theme) | i (dark) |
|---|---|---|---|---|
| N — intuition (violet) | `#6B3BC4` | `#4B2A8F` | `#C9A0FF` | `#9B7BE0` |
| S — sensing (amber) | `#8A5410` | `#6A4416` | `#FFC15E` | `#D19A5C` |
| T — thinking (teal) | `#0D6560` | `#0A4A4E` | `#5FE0D6` | `#49B3AE` |
| F — feeling (rose) | `#AE3355` | `#8A2543` | `#FF8FB0` | `#E06A8E` |

Fills and halos use the same hues at low alpha (≈ .18–.20 light theme,
≈ .38–.45 dark). Group ("quadra") colours reuse the four family hues.
Relationship-ease gradients run red → amber → green; endpoints light
`rgb(170,42,30)` → `rgb(15,95,70)`, dark `rgb(232,122,104)` →
`rgb(120,214,175)`. Every text-bearing colour above clears WCAG AA on
its own canvas — keep that true in anything you add.

### Typography & texture

- Newsreader (serif) for headings and prose voice; Inter (sans) for UI;
  IBM Plex Mono for the four-letter codes.
- **Artwork must not depend on webfonts loading.** Outline any text, or
  better, design without text.
- Texture: warm paper canvas, 1 px hairline rules, 10–14 px corner
  radii, generous whitespace, subtle shadows only. No gradients-as-
  decoration, no glassmorphism, no stock-photo realism, no emoji.
- Light and dark are both first-class. Every asset ships as a themed
  pair, a CSS-variable SVG, or a design that genuinely holds on both
  canvases.

## 3. The glyph language (extend it, don't compete with it)

The site already draws its concepts with an in-house pictorial system.
New artwork must read as more of the same family. Its six rules:

1. **Original geometry only.** Circles, wedges, arrows, layers, beams.
   Nothing traced, no clip-art, no cartoon characters.
2. **The palette above, never a substitute.** Colour is semantic.
3. **Attitude is motion.** Outward-facing concepts move outward — rays,
   fans, arrows leaving. Inward-facing ones move inward — cores, strata,
   beams held close, arrows arriving.
4. **Rank is size.** When four ranked things appear together, their
   sizes follow the fixed ratio 1 / .78 / .56 / .42, largest first.
5. **People are geometry.** A person is two strokes: a filled circle
   head and a shoulder arc below it. Crowds are rows of them at reduced
   opacity. Never faces, never bodies.
6. **Nothing hand-authored per type.** Any image naming one of the
   sixteen patterns must be derivable from its structure, not invented.

The six shipped glyphs, for reference of tone:

- **Type molecule** — a pattern drawn as four beads sized by rank,
  joined by crossed bonds; every one of the sixteen gets a distinct face.
- **Function icons** — eight abstract marks (branching node, converging
  lines, open lens, layered strata, steps to a target, ground-up
  lattice, ring of linked dots, plumb line into a core).
- **Self/tribe cones** — a narrow beam rising from one figure to a
  single held point, versus a wide fan cast over a crowd.
- **Exchange signatures** — arrows in, arrows out, both, or a closed
  loop, drawn around one figure.
- **Derivation tree** — three binary splits drawn with real edges,
  eight leaves.
- **Side doors** — four gateway arches: open, ajar, closed, barred.

## 4. The commission

Formats: **SVG master wherever the slot allows** (self-contained — no
external fonts, images or references). PNG only where platforms demand
it. Where a table says "CSS-var SVG", colour only with the variable
names from §2 so one file serves both themes.

### Priority 1 — the public face

| Asset | Slot | Size / format | Notes |
|---|---|---|---|
| Social share card | `og:image` + large twitter card for the landing page (currently none exists) | 1200×630 PNG ≤ 300 KB, plus the SVG master | Mark + wordmark "Octant", tagline "See how minds mesh.", one hero-calibre drawing from the glyph family (e.g. two molecule clusters with directed arrows between). Self-contained colours (pick the light palette); keep critical content inside a 1120×550 centre safe zone. |
| App icon set | apple-touch + PWA icons (currently only an inline favicon) | 180×180 PNG (opaque), 192×192 + 512×512 maskable PNGs, ≤ 50 KB each | The mark on `#FDFCFA`, accent `#6B3BC4`. Maskable versions keep all strokes inside the inner 80% safe circle. |
| Marketing section spots | "The instrument", "How it works", and the honesty ("a lens, not a measurement") sections of the landing page | 3 CSS-var SVGs, ≈ 460×300 viewBox each | Same construction as the existing hero (two stacks with arrows between): flat shapes, `--m-*` colours, one idea per drawing. Suggested: everything-derived (one small seed shape unfolding into many), three steps (type → read → act), and the lens (an honest instrument held up to a person, not a stamped verdict). |

### Priority 2 — inside the app

| Asset | Slot | Size / format | Notes |
|---|---|---|---|
| Learn-stage vignettes | A wide header drawing per course stage, twelve total | CSS-var SVGs, ≈ 640×200 viewBox (3.2:1) | One per stage, abstracting its idea. Stages, by route slug: `functions` (eight habits of mind), `order` (the order is the type), `ego` (your top four), `shadow` (your bottom four), `four-sides` (four sides of the mind), `growth` (gateways and the two crises), `ops` (the energy/information overlay — the four exchange signatures), `quadras` (clubs and temperaments), `relations` (when two wirings meet), `groups` (more than two), `octagram` (the wheels), `octagram-theme` (your childhood season). Use app tokens: `--ink`, `--ink-2`, `--muted`, `--rule`, `--surface`, `--canvas`, `--accent` plus the semantic hex families from §2. |
| Empty states | Group builder before a second person is added; assistant rail greeting; calculator before the first answer | 3 small CSS-var SVGs, ≈ 240×160 | Warm, quiet, one figure or a faint uncompleted ring — an invitation, not an error. |
| Not-found / error art | 404 and error boundary pages | 1 CSS-var SVG, ≈ 320×220 | A molecule with one bead rolled away from its bonds. |

### Priority 3 — the edges

| Asset | Slot | Size / format | Notes |
|---|---|---|---|
| Email header | Owner-notification and transcript emails | PNG wordmark + mark, 2× export ≈ 560×120 display, ≤ 40 KB | Email clients don't render SVG: deliver PNG on white, dark ink. Keep it a simple lockup — no illustration. |
| Pricing / about spots | Landing page pricing and about sections | 2 CSS-var SVGs, ≈ 300×200 | Small, restrained; one motif each (a single seat at a table; the mark under construction from its two squares). |
| Seasonal motifs | The four childhood "season" themes of the wheels stage | 4 CSS-var SVGs, ≈ 200×140 | Spring/summer/autumn/winter as pure geometry (sprouting strata, full fan, falling beads, bare lattice) in the four family hues — never literal trees or snowflakes. |

## 5. Hard constraints — the acceptance checklist

Every delivered asset must pass all of these. Check them yourself before
handing off:

- [ ] Original artwork. Nothing traced or adapted from existing
      diagrams, decks, or community art; no clip-art; no emoji.
- [ ] Names no third-party system, school, author or brand anywhere —
      image text, metadata, filenames included.
- [ ] Depicts no real or identifiable person. People are rule-5
      geometry only.
- [ ] Works in both themes: paired exports, CSS-var SVG, or genuinely
      theme-neutral.
- [ ] Any in-image text: never smaller than 14 px at rendered size,
      WCAG-AA against its background, and only for copy that will never
      change (the product name and tagline; nothing else).
- [ ] SVG masters are self-contained: no webfonts (text outlined), no
      linked images, no external references; raster exports meet the
      size budgets in §4.
- [ ] Colour comes only from §2. No new hues, no decorative use of the
      semantic families.

## 6. Delivery

- One folder, flat, named `octant-assets/`.
- Filenames: `octant-<slot>[-<theme>][@<size>].<ext>` — e.g.
  `octant-og.png`, `octant-icon-maskable@512.png`,
  `octant-stage-functions.svg`, `octant-empty-network.svg`. Slugs and
  slot names exactly as written in §4.
- SVG masters for everything, alongside any required PNG exports.
- A short README listing each file against its §4 row, plus anything
  that intentionally deviates from this brief and why.

Insertion (wiring assets into routes, meta tags and components) is
handled by the engineering side after delivery — nothing here requires
you to touch code.
