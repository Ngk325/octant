# IMG_6097.JPG — "Table of intertype relations" (MBTI notation)
**Group B · diagram_reference · confidence: high**

A second full 16×16 intertype relations table, this one keyed in **plain MBTI codes** rather than
Socionics notation — so unlike `IMG_6095` it needs no letter conversion, which makes it a cleaner
test of the relation logic itself.

Key as printed:

| Code | Name | Code | Name |
|---|---|---|---|
| Id | Identity | Ex | Extinguishment |
| Du | Duality | Se | Super-ego |
| Ac | Activation | Cf | Conflict |
| Sd | Semi-duality | Rq+ | Requester |
| Mg | Mirage | Rq− | Request recipient |
| Mr | Mirror | Sv+ | Supervisor |
| Cp | Cooperation | Sv− | Supervisee |
| Cg | Congenerity | QI | Quasi-Identity |

## Third independent validation of the engine

Checked programmatically against `REL`: **each of the sixteen labels maps onto exactly one engine
code, with zero ambiguity, in both index directions.**

```
Id→ID  Du→DU  Ac→AC  Mr→MI  Sd→HD  Mg→MG  QI→QI  Ex→EX  Se→SE  Cf→CF
Cp→BU  Cg→KD  Rq+→BR  Rq−→BE  Sv+→SV  Sv−→SR        (reading REL[A][B])
```

So the app's 256 derived cells now agree with **three** independently published tables:

| Source | What it covers | Result |
|---|---|---|
| Berens, 16 Type Patterns (`IMG_7570`) | all eight stack slots × 16 types | 128 / 128 |
| Socionics chart (`IMG_6095`) | all 256 relations | 256 / 256 |
| This table (`IMG_6097`) | all 256 relations, MBTI notation | clean bijection, no conversion needed |

## Naming notes

This sheet's **Cooperation** is the app's Business and its **Congenerity** is the app's Kindred —
the same pairing the Socionics chart labelled Look-a-like / Comparative, and the same axis on which
English-language sources disagree. Three sources, three different names for the same two
structures; the app keeps its own and the lexicon records the aliases.

`Activation` is this app's Activity. `Requester`/`Request recipient` are Benefactor/Beneficiary.
