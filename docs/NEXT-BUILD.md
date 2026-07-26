# Next build — Octagram and the advanced CS Joseph layer

Scoped after your note. Nothing here is built yet; this is the plan.

---

## 1 · What I had already, and what I had missed

**Developed / undeveloped: already in.** `src/engine/sides.ts` gives all four sides a `developed`
and an `undeveloped` state, surfaced on `/type/:type` and in course stage 6. But it was written
from CS Joseph's **published articles**, not his advanced material or transcripts — so it is
correct as far as it goes and shallower than what exists.

**Octagram: I had never looked at it.** Note it is **Octagram**, with an *a* — and it is CS
Joseph's own system, not a separate project. Worth saying since searching "octogram" lands on an
unrelated Quinn-based leadership instrument.

## 2 · What the Octagram actually is

Two binary coins over the four sides, giving four themes on a seasonal cycle:

| | Subconscious **focused** (SF) | Unconscious **focused** (UF) |
|---|---|---|
| Subconscious **developed** (SD) | **Joy** — summer | **Decay** — autumn |
| Subconscious **undeveloped** (UD) | **Hope** — spring | **Despair** — winter |

- **Development (SD / UD)** — whether the subconscious was nurtured in childhood. Described as
  rarely changing: "where you grew roots".
- **Focus (SF / UF)** — which side you are currently running on. Mutable.
- Everyone cycles through all four over a life; the variant names the one you sit closest to.
- `SD|UF` and `UD|UF` are described as temporary positions requiring shadow development to leave.

## 3 · The finding that makes this cheap: the Temples are already derivable

CS Joseph's four **Temples** — Soul, Heart, Mind, Body — are not new data. Computed against the
engine:

> The four-sides operation **partitions the sixteen types into exactly four closed classes of
> four**, and the class containing ENTP is `{ENTP, INTJ, ESFP, ISFJ}` — which he names the
> **Heart Temple**.

```
ENTP · ESFP · INTJ · ISFJ      ← Heart Temple (confirmed)
ENTJ · ESFJ · INTP · ISFP
ENFP · ESTP · INFJ · ISTJ
ENFJ · ESTJ · INFP · ISTP
```

Every class is closed: each member's own four sides is the same set. Already asserted in
`tests/ingested.test.ts`. So the Temple layer costs a naming table and a view — the structure is
free.

**Open:** which of Soul / Mind / Body attaches to the other three classes. Needs sourcing; the
macro gloss ("soul = ego of humanity, heart = unconscious, mind = subconscious, body = superego")
is recorded but I would not guess the assignment from it.

## 4 · Proposed shape

Same posture as the OPS subtype coins, which this exactly parallels:

```ts
// src/engine/octagram.ts
export type Development = "SD" | "UD";   // self-reported — life history, not derivable
export type Focus       = "SF" | "UF";   // self-reported — current, and mutable
export type Theme = "Joy" | "Decay" | "Hope" | "Despair";

export interface Octagram {
  development?: Development;
  focus?: Focus;
  theme?: Theme;          // derived once both coins are set
  season: string;         // summer / autumn / spring / winter
  temple: MbtiType[];     // DERIVED — free, from fourSides()
}
```

- **Temple** renders unconditionally on `/type/:type` — it is derived, so it is always true.
- **Theme** renders only when both coins are set, defaulted **unset**, labelled self-reported,
  exactly as the OPS subtype coins are. No derived type→theme mapping, ever: two people of the
  same type with different childhoods sit in different themes, which is the entire point.
- Feeds `context.ts` so the assistant can use it.

## 5 · Deepening developed / undeveloped

The current copy is one `developed` and one `undeveloped` sentence per side. The advanced material
supports more:

- what development of each side actually *looks like* at each of the four themes;
- the claim that development is set in childhood and focus is not — which changes the growth
  advice from "develop your subconscious" to "you may already have; the question is where your
  focus sits";
- how the two crises already in the app (midlife, three-quarter-life) map onto the Decay and
  Despair transitions.

That last one matters: the app currently presents both crises as failures to develop. The
Octagram frames Decay as *refinement* — "burning away all that is unnecessary" — which is a
materially different and more useful reading, and it should replace the flatter one.

## 6 · Sourcing plan

His advanced material is largely video and transcripts, so this needs a real research pass, not a
skim:

1. Season 34 ("What Is Octagram?") and Season 35 (God Functions) episode transcripts.
2. "The 8 Temple Wheels of the Octagram" — to settle the eight-vs-four question. The four themes
   are firm; whether "eight temples" means 4 temples × 2 poles, or a distinct eighth-fold layer,
   is not yet established and I will not guess.
3. "UD vs. SD Octagram" — the development coin in detail.
4. Cross-check anything that contradicts the four-sides structure already tested.

**Where transcripts are behind a paywall or member login, I cannot fetch them.** If you have them
as files, drop them in the repo the way you did the images and I will work from those directly —
that is by far the better path for material this specific.

## 7 · Open questions for you

1. **Do you have the transcripts as files?** Public pages give the shape; the detail is in the
   videos.
2. **Eight temples or four?** If you already know whether "the 8 temple wheels" is 4×2 or a
   separate layer, that saves a research pass.
3. **Should the Octagram coins be per-visitor state?** They are personal and mutable. Right now
   every self-reported coin in the app is ephemeral component state, remembered nowhere. If you
   want someone's Octagram to persist, that is the first real "user profile" in the app and worth
   deciding deliberately rather than by accident.
