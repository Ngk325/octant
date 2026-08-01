# Handoff — Octant, 2026-07-28

For whoever picks this up next. This is the honest state of the project: what
the owner asked for, what actually shipped, what got dropped or only
half-done, and what is explicitly still owed. Read this before touching
`docs/VOCABULARY.md` or the design docs — several of those are stale in ways
that matter.

Repo: `/home/user/typology`. `main` is at `5690a98`, 715 tests passing,
typecheck and build clean.

> **Corrections, 2026-08-01** — this handoff was stale on arrival in four
> places, all verified against the code: §2g's onboarding shipped (eight
> screens, `src/views/Welcome.tsx`, in the same PR as this document); §2i's
> "still pending" stack and relation renames shipped (`SLOT_NAMES`,
> `REL_NAME` in `data.ts` — the camps and the Rose genuinely remain); §5's
> `pairTerms` quadra landmine was fixed in the same PR too; and the test
> count is now far past 715. Read the rest with that in mind.

---

## 1. What Octant is

A typology web app: 16 types, 256 directed pair relationships, four "sides"
of the mind, an exchange overlay, a growth path, a lexicon, an AI chat
assistant, a network/group analyser, a course (`/learn`), a public marketing
front door, Stripe payment, invite-only access wall. React + TypeScript +
Vite SPA on a Cloudflare Workers backend, Gemini for the chat proxy.

It is explicitly **our own derived model** — not a skin on any named
third-party system. That constraint is enforced by a test
(`tests/attribution.test.ts`) that scans all of `src/` for a banned-name
list and fails the build if any third-party system or author is named
outside one dedicated file (see §3).

---

## 2. Things the owner asked for that were missed, dropped, or only
   half-done — READ THIS FIRST

This is the part a handoff usually skips. Don't skip it here.

### 2a. "Give each type multiple archetype names, don't box them into one"

The owner's original ask (verbatim): *"it seems we're also missing the
various archetype names. i'd prefer we include them for each type, it helps
to add color to the type and not box them into one archetype name. i've
provided the various names across different systems - use them."*

**What actually happened:** the owner *did* provide archetype names lifted
from other published typology systems. Those got used briefly, then the
attribution scrub (§3) ruled out displaying any third-party vendor's role
names anywhere in the product. So instead of "the various names across
different systems," `ARCHETYPE` in `src/engine/data.ts` now holds **three
originally-authored epithets per type** (e.g. ENTP → Prospector / Provocateur
/ Igniter), derived internally, not sourced from what the owner handed over.

**This is a real tension, not a clean resolution.** The owner asked for named
color from existing systems; what shipped is our-own-voice color instead,
because the two requirements (use the outside names / don't display outside
IP) directly conflict. The owner has not explicitly signed off on this
substitution — it was a judgment call under the attribution constraint. If
the owner pushes back and says "no, I wanted the actual outside names, just
resolve the conflict differently" — e.g. put them behind the translation
surface (§3) rather than as the primary label — that's a real option not yet
explored. Currently only the **first** of the three epithets is user-facing
in pickers; all three show on the full type page
(`src/views/TypeReader.tsx`).

### 2b. "Visually the formatting and layout should be much better — stunning as a matter of fact... it shouldn't leave the reader confused in any way — especially visually (see screenshot)"

This landed hard and is **not resolved**. The owner said the design is
currently bad enough to confuse readers, provided a screenshot as evidence,
and asked for a stunning visual pass. What happened instead:

- A round of glyph/illustration infrastructure shipped (`src/components/
  lexicon-figures.tsx`, six SVG glyph components, geometry helpers) — this is
  scaffolding, not the visual overhaul itself.
- Two design-handoff docs were written (`docs/DESIGN-CATALOGUE.md`,
  `docs/DESIGN-BRIEF.md`) to hand to **Claude Design** / a design partner —
  per the owner: *"i am working with claude design on the elements, visuals,
  illustrations, and will provide a full suite to drop in forthcoming."*
- **No actual visual/layout redesign has shipped.** The site still runs on
  the existing design system (`docs/DESIGN-SYSTEM.md`, the first design
  pass) which the owner has already told us didn't produce a design
  framework they were happy with, and which prompted the "shit"-level
  complaint above.
- The owner is expecting **the owner's own design partner** to hand back a
  visual asset suite to drop in. That suite has not arrived as of this
  handoff. **Do not attempt a from-scratch visual redesign without checking
  whether that suite has landed** — ask the owner first, since duplicate
  effort here is likely and expensive.

### 2c. "start at the top of each page more descriptive and towards the bottom of each page get more technical... it should be logically like that from simple to complex"

**Not done as a systematic pass.** Some individual pages got clearer/plainer
language in the PR #10 cleanup (pair-page pronoun fix, `SLOT_ABOUT` plain
copy), but there was never a full page-by-page restructure to the
plain → picture → named → interactive → technical curve the owner asked
for. This is still an open, unstarted task.

### 2d. "introducing interactive elements may also help"

**Not done.** No new interactive elements were built this session beyond
what already existed (the calculator, the network builder). Flagged, not
started.

### 2e. "more ? to describe foreign terms would be helpful"

**Partially done, and diagnosed rather than blindly executed.** Investigation
found the `Term` component already had full glossary popovers — the problem
was discoverability (a 1px dashed hairline in `--rule-strong`, invisible on
the warm paper background), not absence of the feature. Fixed the CSS
affordance (`.term-q`, a visible `?` superscript). **Explicitly declined** to
blanket-wrap the ~70 remaining bare term occurrences site-wide, because that
would worsen visual clutter the owner was already complaining about (§2b) —
recorded the count in `docs/DESIGN-CATALOGUE.md` instead of acting
unilaterally. This is a real open decision for the owner: wrap them now, or
wait for the design suite to give bare terms a lighter-weight treatment.

### 2f. "in the lexicon, i don't understand (function α · flip attitude β · swap element ω · flip both)"

**Done.** `src/components/InvolutionTable.tsx` — Greek stripped, renamed to
flip / swap / turn with plain descriptions ("same letter, other direction",
etc).

### 2g. "there should be an onboarding where the user has to get through the core basic concepts... before entering the application"

> **SHIPPED (2026-08 correction).** Built at eight screens — `src/views/Welcome.tsx`,
> routed and gated in `src/App.tsx`, tested in `tests/onboarding.test.tsx`. The
> original text below described it as unbuilt and is kept as the record.

**Not built.** Only specified — six screens, in `docs/DESIGN-CATALOGUE.md`.
No route, no component, no gate logic exists yet. This is a real, sizeable
unbuilt feature, not a polish item.

### 2h. "any elements or aspects without design, put together an MD"

**Done** — `docs/DESIGN-CATALOGUE.md` and `docs/DESIGN-SYSTEM.md` were
written for this. Whether they're good enough is untested against the
owner's design partner's actual output.

### 2i. Vocabulary Set D — "make a set d with the finals... reevaluate each
   line to determine which is the best language and vocabulary set"

**Locked but only half-implemented.** `docs/VOCABULARY.md` is the finished
spec (Set D, the chosen vocabulary). Its own header says: *"Status:
approved, not yet implemented. The app still ships the old terms."* Some
terms did make it into the engine (stack renames partially, `ANIMAL_LABEL`,
`REL_NAME`), but the stack (Lead/Support/Delight/Cave/Doubt/Scold/Blind
spot/Dread), the four sides, the camps, and the Rose are all **still
pending**, deliberately held back — see §5 prerequisite.

> **PARTLY SHIPPED (2026-08 correction).** The stack names
> (`SLOT_NAMES`) and the sixteen relation names (`REL_NAME`) are now live in
> `src/engine/data.ts`. Genuinely still pending: the camps
> (Alpha/Beta/Gamma/Delta → Hearth/Forge/Market/Field), the four-sides rename,
> and the Octagram→Rose rename. `docs/VOCABULARY.md` tracks the split.

### 2j. "v4... Set D with the other established systems next to it... to
   understand the translations"

**Done as a document, not yet built into the site.** `src/engine/
translation.ts` is the one module allowed to name other systems (per the
owner's own scoping decision, §3) and exports the mapping data
(`typeElsewhere()`, `relationElsewhere()`, etc). There is **no public-facing
translation page** rendering this yet — `marketing.ts` has no reusable page
shell to build it into. Still open.

---

## 3. The attribution constraint (already fully shipped — don't re-litigate)

Owner's instruction, verbatim, twice: *"The site and content should not
mention CS Joseph, OPS, or any other copywriter material. This is our
unique model, decoded and uniquely derived from analysis of many sources."*

This is **done and enforced by test**, not a to-do:

- `tests/attribution.test.ts` scans all of `src/` for a banned list (CS
  Joseph, csjoseph, CSJ, Objective Personality, Socionics, MBTI, Myers,
  Briggs, Jung*, Beebe, Keirsey, Augustinavičiūtė, Berens, case-sensitive
  `\bOPS\b`).
- **One exception exists on purpose**, per the owner's explicit decision when
  asked where third-party names should be allowed to live: **"Translation
  surface only."** Third-party names are permitted in exactly one file,
  `src/engine/translation.ts`, plus its (not-yet-built, see §2j) page. The
  guard test asserts the allowlist has exactly one entry — if you add a
  second file to that allowlist, you're doing it wrong; fix the leak
  instead.
- `SOCIONICS` data and vendor `ARCHETYPE` names were removed/replaced (§2a).
- Curriculum route `/learn/ops` → `/learn/exchange`; stage retitled "The
  exchange overlay."
- Lexicon `source:` citation field dropped entirely from all 63 entries.

If a future request seems to want third-party names back in the main app
(not the translation surface), that directly reopens this constraint —
confirm with the owner before doing it.

---

## 4. Bug/UX fixes shipped this session (PR #10, merged)

- **429 from the model**: root-caused as likely a preview Gemini model with a
  tight quota (`gemini-3.1-pro-preview` was in use) — not fully confirmed,
  just the most likely explanation. Mitigation shipped:
  `src/worker/chat.ts` now retries once on `[429,500,502,503,504]`, honours
  `Retry-After` (capped 2000ms, default 900ms), and passes a real 429
  through to the client instead of masking it as a generic error.
  **Open: consider switching off the preview model entirely if 429s
  recur** — not done, just mitigated.
- **Processing state on submit**: chat now shows the assistant "thinking"
  while waiting on a response.
- **Pair page**: now opens with "How INFJ should handle ENTP" framing at the
  top, per request.
- **Your/Their pronoun ambiguity**: rewritten to be unambiguous about whose
  perspective is being described; the perspective picker now persists as the
  user scrolls (sticky bar), per request.

---

## 5. Known landmine for the next vocabulary pass

> **FIXED (2026-08 correction).** The `pairTerms` Quadra branch is now
> id-keyed (`QUADRA_ELEMENTS[aId]`), fixed in the same PR that added this
> handoff. The warning below stands as guidance for the *pattern* — any new
> pairing branch keyed on a display label will break the same way when that
> label is renamed — but the specific Quadra bug it describes is resolved.

`src/engine/lexicon.ts`, function `pairTerms` — its **Quadra branch is still
keyed by display label** (`a.term`), not by stable id. The **Animal branch**
had exactly this bug and it broke 11 tests silently when animal labels were
renamed (`ANIMAL_LABEL`) — same root cause as an earlier bug in
`compareAspects` that used `slugify(label)` instead of the stable id. There
is a warning comment in the file already. **Before renaming the camps**
(Alpha/Beta/Gamma/Delta → Hearth/Forge/Market/Field, part of Set D pass 3,
§2i), convert the Quadra branch to id-keying first, or it will fail the same
way, silently, again.

---

## 6. Recently merged (context for git history)

- PR #9 — attribution scrub, `SOCIONICS` removal, `ARCHETYPE` → original
  epithets (started the tension in §2a).
- PR #10 — 429 fix, thinking indicator, pair-page framing, pronoun fix,
  sticky perspective bar.
- PR #11 — Set D vocabulary locked (`docs/VOCABULARY.md`), visual catalogue
  (`docs/DESIGN-CATALOGUE.md`), translation surface (`src/engine/
  translation.ts`).
- PR #12 — type pickers show `ENTP · Prospector` (the archetype epithet)
  instead of `ENTP · Alpha` (the camp); camp demoted to a dot colour with a
  tooltip. Merged, squashed, at `5690a98`.

All squash-merged; if you need to rebase a new branch off a squashed PR's
old parent, use `git rebase --onto origin/main <old-parent>` — see git
reflog/history around PRs #9–#11 for a worked example, this bit twice this
session.

---

## 7. Suggested priority order for the next agent

1. **Ask the owner whether the design partner's asset suite has landed**
   before starting any visual work — §2b is the single biggest open
   complaint and duplicating effort here is the costliest mistake available.
2. If not landed: don't block everything on it. The onboarding gate (§2g)
   and the page-restructure pass (§2c) can proceed on the existing design
   system and be re-skinned later.
3. Fix the `pairTerms` Quadra id-keying (§5) as a small standalone PR before
   touching camp names.
4. Resolve the archetype-names tension (§2a) explicitly with the owner
   rather than assuming the current epithet substitution is accepted.
5. Then: Set D pass 3 (stack/sides/camps/Rose), interactive elements, the
   translation page, the `?` density decision.
