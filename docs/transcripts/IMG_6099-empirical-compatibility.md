# IMG_6099.PNG — "Percentage compatibility between the 16 factor model (Myers Briggs®) types"
**Group B · diagram_reference · confidence: high**
**Source: personalitydata.org**
**Licence: Creative Commons Attribution 4.0 International (CC BY 4.0) —
<https://creativecommons.org/licenses/by/4.0/>**

A full 16×16 matrix of **empirical, survey-derived** compatibility percentages. Unlike the other
material in this batch, the licence permits reuse — including reproduction of the table itself —
provided the source is credited and the licence named. Both are done here, in
`src/engine/empirical.ts`, and on the surfaces that render the numbers.

Column/row order: ENFJ ENFP ENTJ ENTP ESFJ ESFP ESTJ ESTP INFJ INFP INTJ INTP ISFJ ISFP ISTJ ISTP

| | ENFJ | ENFP | ENTJ | ENTP | ESFJ | ESFP | ESTJ | ESTP | INFJ | INFP | INTJ | INTP | ISFJ | ISFP | ISTJ | ISTP |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **ENFJ** | 86 | 91 | 42 | 73 | 64 | 80 | 22 | 41 | 74 | 73 | 16 | 35 | 30 | 40 | 18 | 9 |
| **ENFP** | 91 | 97 | 37 | 85 | 42 | 93 | 27 | 76 | 51 | 73 | 13 | 36 | 11 | 49 | 4 | 14 |
| **ENTJ** | 42 | 37 | 91 | 81 | 53 | 51 | 87 | 74 | 25 | 13 | 46 | 47 | 29 | 6 | 66 | 41 |
| **ENTP** | 73 | 85 | 81 | 94 | 32 | 87 | 70 | 92 | 11 | 35 | 22 | 51 | 5 | 14 | 11 | 35 |
| **ESFJ** | 64 | 42 | 53 | 32 | 94 | 40 | 77 | 37 | 74 | 17 | 32 | 5 | 79 | 57 | 71 | 19 |
| **ESFP** | 80 | 93 | 51 | 87 | 40 | 70 | 39 | 75 | 43 | 58 | 22 | 39 | 12 | 58 | 8 | 26 |
| **ESTJ** | 22 | 27 | 87 | 70 | 77 | 39 | 96 | 78 | 14 | 3 | 33 | 22 | 48 | 22 | 79 | 55 |
| **ESTP** | 41 | 76 | 74 | 92 | 37 | 75 | 78 | 95 | 5 | 24 | 17 | 39 | 12 | 43 | 20 | 62 |
| **INFJ** | 74 | 51 | 25 | 11 | 74 | 43 | 14 | 5 | 95 | 85 | 65 | 50 | 85 | 58 | 53 | 23 |
| **INFP** | 73 | 73 | 13 | 35 | 17 | 58 | 3 | 24 | 85 | 97 | 70 | 84 | 46 | 78 | 21 | 49 |
| **INTJ** | 16 | 13 | 46 | 22 | 32 | 22 | 33 | 17 | 65 | 70 | 86 | 89 | 79 | 45 | 85 | 78 |
| **INTP** | 35 | 36 | 47 | 51 | 5 | 39 | 22 | 39 | 50 | 84 | 89 | 96 | 38 | 43 | 51 | 81 |
| **ISFJ** | 30 | 11 | 29 | 5 | 79 | 12 | 48 | 12 | 85 | 46 | 79 | 38 | 95 | 76 | 93 | 62 |
| **ISFP** | 40 | 49 | 6 | 14 | 57 | 58 | 22 | 43 | 58 | 78 | 45 | 43 | 76 | 97 | 47 | 76 |
| **ISTJ** | 18 | 4 | 66 | 11 | 71 | 8 | 79 | 20 | 53 | 21 | 85 | 51 | 93 | 47 | 96 | 78 |
| **ISTP** | 9 | 14 | 41 | 35 | 19 | 26 | 55 | 62 | 23 | 49 | 78 | 81 | 62 | 76 | 78 | 96 |

## Comparison against the app's derived ease matrix — computed, not eyeballed

| Measure | Result |
|---|---|
| Symmetry | **0/256 asymmetric cells.** The app's matrix is asymmetric by design |
| Pearson r vs derived ease | **−0.154** — very slightly *negative* |
| Duality pairs (app rates 100) | empirical mean **7.4%** |
| Identity pairs (app rates 74) | empirical mean **92.6%** |

Largest disagreements, derived-high / empirical-low — **all six are Duality**:
ESTJ↔INFP 100 vs 3% · ENFP↔ISTJ 100 vs 4% · ENTP↔ISFJ 100 vs 5% · ESFJ↔INTP 100 vs 5%

Largest the other way — **all Super-Ego**:
ESFP↔ENTP 20 vs 87% · ISFJ↔INTJ 20 vs 79% · ESTP↔ENFP 20 vs 76%

## Reading

The two are measuring different things, and the numbers say so loudly. The survey captures
**self-reported liking**, and people overwhelmingly report liking people similar to themselves —
hence Identity at 92.6%. Socionics duality claims complementary pairs are **structurally
low-friction**, which is not the same claim as "feels good to rate highly on a questionnaire",
and may even be in tension with it: the Dual supplies your Inferior, which is the function you
are defensive about.

This is not evidence the engine is wrong, and it is not evidence the survey is wrong. It is a
substantive, quantified disagreement between a structural model and an empirical one — precisely
the kind of thing the app's existing posture says to show rather than smooth over ("CSJ and OPS
are not reconciled… that divergence is the content, not an error to smooth over").
