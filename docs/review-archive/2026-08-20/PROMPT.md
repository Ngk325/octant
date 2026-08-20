# The prompt that produced this review

Provenance: authored 2026-08-20 in a prior session at the owner's request ("write a
prompt to complete a full review of Octant from all perspectives…"), then executed
verbatim as the next input. Archived so the review can be re-run, extended, or audited
against its own instructions.

---

# Octant — Full-Perspective Review & Comprehensive Upgrade Plan

You are conducting a full review of the Octant codebase (`/home/user/octant`) from every
perspective, and producing a comprehensive, phased upgrade plan. This session is **review and
plan only** — do not modify application code, styles, copy, or tests. The only files you may
create are the review deliverables described at the end. Spend the majority of your time and
depth on: **marketing, copy, display, branding, visuals, illustrations, and flow.** Technical
health is audited too, but as the supporting act.

## Evidence discipline (non-negotiable)

Octant's own culture is documented honesty — the README carries an "honest asterisk" correcting
its own past overclaims, and `docs/QA-REVIEW.md` retired a stale test count because nothing
asserted it. Your review must meet that same bar:

1. **No claim without evidence.** Every finding cites a `file:line`, a command output you ran
   this session, or a screenshot you captured this session. Never quote a number from the
   README or docs as fact — reproduce it. If you cannot verify a claim, say "unverified" and
   why.
2. **No finding without a location.** "The copy is weak" is not a finding. "The `/` hero
   subheading (`src/views/Home.tsx`, line N) asks the reader to hold three unfamiliar terms
   before the first benefit statement — screenshot `home-desktop.png`" is a finding.
3. **No recommendation without an acceptance test.** Every plan item ships with written
   acceptance criteria and a concrete verification step (a command to run, a route+viewport to
   inspect, or an assertion to add). If you can't say how a future session proves the item
   done, the item isn't ready for the plan.

## Phase 0 — Baseline: prove the ground you stand on

Run and record actual outputs (not the values in `docs/QA-REVIEW.md`, which are from
2026-08-01 and may have drifted):

- `npm ci` (or `npm install` if ci fails), then `npm test`, `npm run typecheck`,
  `npm run lint`, `npm run build`. Record pass/fail counts, bundle size, and any warnings.
- Diff your measured gate results against the table in `docs/QA-REVIEW.md` and report any
  drift explicitly.
- Boot the app: `npm run dev` (Vite). The worker layer (`src/worker/`) adds an access wall,
  Google sign-in, and `/api/chat`; pure Vite dev may bypass or break these. Establish and
  document exactly how you obtained access to the signed-in surfaces (dev bypass, invite
  code path, wrangler dev, or test harness). If any surface is unreachable, review it
  statically from source and mark those findings "static review only".

## Phase 1 — Full visual walk with screenshots

Chromium is pre-installed (`/opt/pw-browsers/chromium`, Playwright configured via
`PLAYWRIGHT_BROWSERS_PATH`; do not run `playwright install`). Walk **every** route:

`/` (signed-out marketing AND signed-in app state), `/signin`, `/welcome` and each
`/welcome/:step` (all eight), `/learn` and each `/learn/:stage` (all thirteen),
`/calculator`, `/read-someone`, `/types`, `/type/:type` (at least 3 representative types),
`/sides` and `/sides/:type` (at least 1), `/pair/:a/:b` (at least 2 pairs including one
asymmetric-ease pair), `/network`, `/matrix`, `/lexicon` and `/lexicon/:id` (at least 2
terms), and `/admin` (static review if gated).

For each: capture desktop (1440×900) and mobile (390×844); capture both themes if a theme
switch exists; note load anomalies, layout breaks, overflow, contrast problems, and any
console errors. Name screenshots `<route>-<viewport>[-<theme>].png` and keep a manifest
mapping each screenshot to the findings it evidences. Keep only screenshots that evidence a
finding or establish the baseline record.

## Phase 2 — Perspective audits

Audit through three audience lenses, and say per-finding which lens it hurts:
- **Curious newcomer** — no typology background; needs comprehension, trust, and a reason to
  sign up within the first screen.
- **Typology enthusiast** — knows MBTI/socionics; needs credibility, depth, and the derived-
  model differentiator to land fast.
- **Partner / B2B** — a coach, team lead, or licensee; needs professionalism, pricing
  clarity, and diligence-grade trustworthiness (see `docs/PARTNERSHIP-TERMS.md`,
  `docs/partner-rate-card.html`, `docs/CARDS.md`).

Audit each of the following. For every one, produce: a 1–10 score with one-paragraph
justification, the strongest thing to preserve, and severity-ranked findings
(P0 blocker / P1 major / P2 minor / P3 polish).

1. **Marketing & positioning.** The signed-out `/` page and everything that sells: value
   proposition clarity, differentiation (the "derived, not stored" claim is the crown jewel —
   is it legible to each lens within 10 seconds?), proof and trust signals, calls to action,
   the sign-up funnel from landing → `/signin` → `/welcome` → first aha-moment. Also audit
   `tests/marketing.test.ts` for what marketing promises are actually pinned by tests.
2. **Copy & voice.** The "plain first, technical underneath" doctrine (README, `plain.ts`,
   `Explain.tsx`, the lexicon glosses): is it upheld everywhere, or does jargon leak?
   Consistency of tone across marketing, onboarding, course, and instrument surfaces;
   microcopy on buttons, empty states, and errors; reading level; British/American
   consistency; terminology drift against `docs/VOCABULARY.md`.
3. **Display & UI.** Layout, hierarchy, spacing, and typography against
   `src/styles/tokens.css` and `docs/DESIGN-SYSTEM.md`; information density on the heavy
   surfaces (`/type/:type`, `/matrix`, `/network`); responsive behaviour; navigation and
   wayfinding (can a user always tell where they are in the system?); dark/light parity.
4. **Branding & visual identity.** Assess the current identity ("quiet paper, precise
   geometry, colour that always means something" — `docs/DESIGN-SYSTEM.md`) as executed, not
   as documented. Then present **three explicit directions** with rationale, intended
   audience effect, and cost: (A) refine the current identity; (B) an evolution — keep the
   semantic-color doctrine, replace the surface aesthetic; (C) a full rebrand. Recommend one,
   but give the owner a real choice: for each direction describe palette intent, typographic
   direction, illustration language, and what existing equity (if any) is lost. A full
   rebrand is explicitly allowed if the audit justifies it — do not soften that finding out
   of deference to the current system.
5. **Illustrations & diagrams.** Every figure component (`WiringSchematic`, `OctagramWheel`,
   `OctagramMap`, `FourSidesDiagram`, `NetworkRing`, `GatewayPath`, `AnimalStack`,
   `DivergingEase`, `BondFigure`, glyphs, `lexicon-figures`, and the rest of
   `src/components/`): does each encode meaning per the §1 doctrine in
   `docs/DESIGN-SYSTEM.md`, or decorate? Are any mechanisms carrying text alone that need a
   picture? Are the diagrams legible at mobile widths? Check `tests/diagrams.test.tsx` and
   `tests/glyphs.test.tsx` for what is already asserted.
6. **Flow.** The three journeys end-to-end: (a) newcomer: landing → sign-in → 8-step welcome
   → first type read; (b) learner: the 13-stage course — pacing, stage lengths, drop-off
   risks, whether each stage earns the next; (c) practitioner: calculator → type page → pair
   reader → network. Where does each flow lose people? Where does it fail to hand off to the
   next surface? Is the "always narrows, never returns nothing" calculator promise upheld in
   the UI, not just the engine?
7. **Supporting audits (leaner, but real):** accessibility (contrast, keyboard, screen-reader
   labels on the SVG-heavy surfaces — check `tests/a11y.test.tsx` coverage vs reality),
   performance (bundle size, the single-chunk build, route-level code-splitting opportunity),
   content integrity (spot-check 5 mechanical claims from README/course copy against the
   engine source — e.g. derivation claims, the 40/40 Octagram match, Counterpart/Catalyst
   resolution — and confirm each in code), and platform/security posture (worker headers,
   access wall, rate limiting — verify the relevant tests exist and pass; do not pentest).

Read `docs/REVIEW-FINDINGS.md`, `docs/QA-REVIEW.md`, `docs/DESIGN-BRIEF.md`, and
`docs/DESIGN-CATALOGUE.md` first, and do not re-litigate what they already settled: cite
them, verify their still-load-bearing claims, and focus your effort on what they did not
cover or what has drifted since.

## Phase 3 — QA & acceptance-testing process

Produce, as a standing artifact (not just prose), a repeatable acceptance-test protocol for
the project: the gate commands with expected results, the route walk as a checklist with
per-route pass conditions, the manual pre-deploy checks (reconciled with the ones already
listed in `docs/QA-REVIEW.md`), and the evidence standard future sessions must meet. Run the
protocol once yourself, this session, and record the results — the protocol's first
execution is its own validation.

## Phase 4 — The upgrade plan

Synthesize everything into a phased plan:

- **Phase structure:** P0 fix-before-anything (blockers, broken promises, trust damage) →
  P1 marketing & conversion → P2 brand decision + visual system execution → P3 copy & flow
  overhaul → P4 depth & polish (illustrations, a11y, performance). Adjust phases if the
  findings demand it, but every item must live in exactly one phase.
- **Every item carries:** an ID (e.g. `P1-03`), the perspective and audience lens it serves,
  severity/impact, effort (S/M/L), dependencies on other items, **acceptance criteria**
  (observable, binary), and a **verification step** (exact command, route+viewport to
  inspect, or test to add). Items without all fields don't ship.
- **The brand fork is explicit:** the plan must show which items change under direction A vs
  B vs C, so the owner can pick a direction and immediately know the resulting work list.
- Include a short "what NOT to change" section: the things the audit found genuinely strong,
  protected from well-meaning future churn.

## Phase 5 — Self-QA before you finish

Before delivering, audit your own report against this checklist and state the result:
every finding has evidence; every number was reproduced this session; every plan item has
acceptance criteria and a verification step; every screenshot in the manifest is referenced
at least once; the three audience lenses each appear in every perspective section; the gate
results table reflects commands run this session. Fix any miss before delivering.

## Deliverables

1. `docs/REVIEW-2026-08-FULL.md` — the complete audit: baseline gates table, per-perspective
   scorecards and findings, the three brand directions, and the screenshot manifest.
2. `docs/UPGRADE-PLAN.md` — the phased plan with the full item schema and the brand fork.
3. `docs/ACCEPTANCE-PROTOCOL.md` — the repeatable QA/acceptance-test protocol from Phase 3,
   with its first execution's results.
4. Curated evidence screenshots under `docs/review-assets/` (only ones cited by a finding;
   compress them).
5. Commit these to your designated branch, push, and open a draft PR whose description is the
   executive summary: top 10 findings, the recommended brand direction and why, and the P0
   list. Also publish the full review as a private artifact page for comfortable reading.

Do not implement any of the plan. The plan itself — accurate, evidenced, and verifiable in
every mechanical detail — is the deliverable.
