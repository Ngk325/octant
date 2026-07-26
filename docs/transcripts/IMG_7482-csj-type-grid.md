# IMG_7482 — CS Joseph "Type Grid"
**Group C · photographed printed page · © CSJ Ventures LLC 2021, 2022 · confidence: high**

> **Rights note.** This page is copyrighted commercial material. The grid's contents are
> **described here rather than reproduced** — no table of its cells, labels or figures. What the
> app uses from it is structural (which axes exist, and the fact that its archetype names were
> already present in this codebase), and the app's own prose is written independently.
> Source: CS Joseph, *Type Grid*, © CSJ Ventures LLC 2021–2022, csjoseph.life.

## What the page is

A single-page wall chart laying the sixteen types on two axes:

- **Columns — "Your Worldview"**: the four Keirsey temperaments (SJ, SP, NT, NF), each annotated
  with an approximate share of the population.
- **Rows — "Your Expression"**: four interaction styles, which CS Joseph names Structure, Starter,
  Finisher and Background. Each row is annotated with a three-part decomposition combining a
  directing/informing axis, an initiating/responding axis, and an outcome/progression axis.

Every cell names one type and gives it a fantasy-archetype label. A legend at the foot introduces
the Four Sides of the Mind as a 2×2 of Ego, Subconscious, Unconscious and Superego.

## What this app takes from it

**Nothing new was ingested.** Two findings, both checked against the code:

1. **The sixteen archetype names were already in the app**, as the last entry of each
   `ARCHETYPE[t]` string in `data.ts`. Verified for all sixteen in `tests/ingested.test.ts`.
   This transcript's value was identifying *whose* names those are, so they can be attributed.
2. **The row axis is the app's existing interaction-style field under different names**, and the
   grid's outcome/progression axis is the app's coin 8 (Control/Movement) under a different name.
   Both confirmed by derivation, not by copying.

Not taken: the population figures and the temperament attribute triples. Those fall in the
A3–A5 naming-and-detail group held back by agreement, and are in any case the page's own content
rather than structure.
