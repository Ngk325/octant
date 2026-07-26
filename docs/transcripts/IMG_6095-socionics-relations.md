# IMG_6095.JPG — Socionics intertype relations chart
**Group B · diagram_reference · confidence: high**

A full 16×16 intertype relations table in Socionics notation (ENTp, ISFp, …), with row = A,
column = B, and a key. Sixteen relation labels:

| Code | Name | Code | Name |
|---|---|---|---|
| Idn | Identical | Cnt | Contrary |
| Dlt | Duality | Cnf | Conflicting |
| Act | Activity | Ego | Super-Ego |
| Mrr | Mirror | Qid | Quasi-Identical |
| Lkl | Look-a-like | Bn> / Bn< | Benefit — A is Benefactor / Beneficiary to B |
| Sdl | Semi-Duality | Sp> / Sp< | Supervision — A is Supervisor / Supervisee to B |
| Cmp | Comparative | Ill | Illusionary |

## The strongest validation in the whole batch

The engine computes its 256 relations from **three involutions over sixteen (dominant, auxiliary)
pairs**. This chart is a hand-built lookup table from a different tradition. Checked
programmatically, cell by cell:

> **256 / 256 cells agree**, and each of the sixteen chart labels maps onto **exactly one** engine
> code — a clean bijection with no ambiguity.

Asserted in `tests/ingested.test.ts`.

## Two conventions that differ, recorded rather than "corrected"

1. **`Lkl` (Look-a-like) is what this app calls Business, and `Cmp` (Comparative) is what this app
   calls Kindred.** English-language Socionics sources genuinely disagree about which of these two
   labels attaches to "same leading function" versus "same creative function". The *structure* is
   identical either way; only the name moves. The app keeps its own usage and this is documented.
2. **Direction.** The chart writes Benefit and Supervision from the actor's side ("A is Benefactor
   to B"), which is the reciprocal of `REL`'s indexing (`REL[target][perspective]` names what the
   perspective is to the target).

## Notation note

Socionics type codes are not MBTI codes. Extraverts carry over unchanged; **introverts swap the
final letter** (Socionics ISFp = MBTI ISFJ, INTj = INTP, ISTj = ISTP, INFp = INFJ, and so on). The
mapping is confirmed by the chart's own content — it gives ENTp's Dual as ISFp, and the engine
gives ENTP's Dual as ISFJ.
