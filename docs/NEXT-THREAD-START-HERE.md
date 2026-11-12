# START HERE — Octant product excellence / Codex handoff

**Prepared:** 2026-11-13  
**Repository:** https://github.com/Ngk325/octant  
**Document status:** proposed specifications committed on docs/octant-excellence-codex-handoff-2026-11, NOT implemented.  
**One-line mandate:** turn Octant from a technically rich, reading-heavy typology reference into a visually memorable, cognitively understandable, practitioner-useful instrument with reliable publishing and formal QA/UAT.

## Why this exists
A long research conversation began with a question about an ENTP man's intellectually stimulating conversations with an INFJ woman ("neurons firing") amid uncertain romantic and physical reciprocity. It expanded into the Four Sides of the Mind, optimistic/pessimistic cognitive positions, Ne-vs-Ni and Ti-Parent-vs-Ti-Child, Si-Inferior and Se-Inferior, healthy vs reactive ESFP Superego ("the joyful Showman"), and the higher-order ambition: choose when to use dominant cognition, deliberately develop neglected capacities, and measure real behavioral progress. That exposed a product gap: Octant explains the model but does not yet make it easy enough to see, experience or apply.

The product owner then emphasized:
- Content is currently too text-heavy and can overwhelm or confuse.
- Illustrations and interactive examples must teach before the technical prose begins.
- Simplified-to-detailed, polycentric, visual/descriptive architecture.
- Best-in-class UX, design, accuracy, QA and real user acceptance testing.
- Beautiful, engine-consistent PDF guides as ways into the platform.
- More engagement and conversion without artificial or manipulative tactics.
- A useful practitioner workspace and a distinct owner/product-quality console.
- Build-once sources of truth; the next coding thread must not rediscover the requirements.

## Read these files in order
1. **PRODUCT-EXCELLENCE-BLUEPRINT.md:** requirements, UX principles, IA, visual patterns, user journeys and roadmap.
2. **COGNITIVE-DEVELOPMENT-RESEARCH.md:** the original question chain, refined insights, examples, theory-vs-evidence distinctions, generalized all-type requirements.
3. **PRACTICE-ENGINE-SPEC.md:** implementation data contracts, mode engine, practice selection, privacy and tests.
4. **PDF-GUIDES-AND-PRACTITIONER-STUDIO.md:** publishing funnel, PDF technical architecture, professional workflow and metrics.
5. **QA-UAT-RELEASE-GATES.md:** quality gates, UAT plans and verification.
6. **AGENTS.md at repository root:** agent-specific execution constraints.

These new specs EXTEND existing Octant work; they do not replace it.

## Existing canonical product code and docs
- Source: src/engine/{core,sides,functions,ops,octagram,playbook,empirical}.ts
- UI: src/views/{Home,Welcome,Learn,TypeReader,Sides,PairReader,Guide}.tsx, src/components/* and src/styles/*
- Publishing: src/cards/{deck,render,art}.ts, scripts/build-cards.mjs, docs/CARDS.md
- Public routes/funnel: src/worker/{marketing,onramp,leads,read,stripe,index}.ts
- QA: tests/*, tests/workers/*, .github/workflows/ci.yml
- Background: docs/DESIGN-SYSTEM.md, DESIGN-CATALOGUE.md, DESIGN-BRIEF.md, PLATFORM-BACKPORT.md, QA-REVIEW.md and README.md
- Historical audit/approved direction on UNMERGED PR #56: https://github.com/Ngk325/octant/pull/56
- Existing P0 remediation on UNMERGED PR #57: https://github.com/Ngk325/octant/pull/57
- Older PRs #37 and #38 need disposition; refer to PR #56 docs/NEXT-STEPS.md.

## Critical release dependency / conflict reconciliation
The 2026-08-20 review in PR #56 reported:
- a reversed direction/score in the marketing hero worked example,
- an onboarding example claiming directional asymmetry for a symmetric ENTP/INFJ case,
- misleading public funnel promises,
- paying-user onboarding friction,
- a replayable onramp token,
- 136 public engine-derived readings lacking discoverable links,
- extreme reading page length, weak wayfinding, visual/accessibility gaps, design drift and stale claims.
PR #57 addresses a number of those on a separate draft branch. **Do not assume any are resolved on main**. Re-read and verify main and the latest branch diff; reconcile PRs rather than duplicating or overwriting work.

The product owner previously approved **brand Direction A + the two B-folds, with memorable illustration as a first-class mandate** (PR #56 docs/UPGRADE-PLAN.md, P2-0). Preserve this settled decision; check current state before executing.

On 2026-11-13 Cloudflare Workers Builds configuration was read directly: worker script **typology**, GitHub production branch **main**, auto-build enabled, **previews disabled**. This was a point-in-time observation and must be rechecked at release. A docs branch should not be treated as a production change.

## Required phase sequence (do not start with adding practice features)
- **Gate 0: Reality check / branch reconciliation.** Inventory live main vs PRs #56/#57/#37/#38. Resolve production deploy and checkout/access P0 risks. Record build/test baseline. Merge only with approval.
- **Gate 1: Comprehension research.** Run facilitated usability tests of 4 key tasks with novices and practitioners. Create an evidence-based pain-point list and a screen inventory.
- **Gate 2: Design prototype.** Produce high-fidelity prototype for the public guide landing, newcomer first 60 seconds, type overview, Four Sides, pair comparison, and practice. Test before deep implementation.
- **Gate 3: Experience system.** Implement reusable five-level content component and canonical accessible SVG diagrams. Do not merely bolt illustrations onto unstructured prose.
- **Gate 4: Core journeys.** Home/onboarding, type, four sides, pair, learn, and cross-navigation. Ensure novice and expert views share data.
- **Gate 5: Guides/acquisition.** Derive PDF + HTML from shared data, QR/deep links, public preview, SEO, measured guide-to-active-user funnel.
- **Gate 6: Practitioner Studio.** Consented profiles, session workspace, hypothesis-vs-observation separation, approved report exports; separate owner console.
- **Gate 7: Practice.** Optional modes and behavioral experiments for all sixteen types with evidence/consent guardrails.
- **Gate 8: UAT, performance and release.** Complete QA-UAT-RELEASE-GATES.md before any production merge.

Parallelization allowed: art direction/prototype and verified publishing can proceed with P0 remediation, but no unverified public claims or production merges.

## First Codex task, precisely
1. Fetch main and inventory all open PRs. Read docs from this branch and the audit branch #56.
2. Produce a **reconciliation matrix**: finding ID, status on main, PR containing fix, conflict risk, acceptance test, proposed disposition.
3. Produce a **screen-by-screen UX content-density audit** on actual rendered desktop and mobile routes, including a video/screenshot or equivalent artifact, then write a prioritized backlog linked to concrete source files.
4. Create a clickable prototype for the five-layer concept experience and one representative high-complexity page; run comprehension tests before rewriting the entire UI.
5. Submit a draft implementation PR with before/after screenshots, tests and UAT evidence. No automatic merge or deploy.

## Decision log
- Chosen design direction: A + 2 B-folds; illustration is a primary deliverable (recorded 2026-08-20).
- Product goal: polycentric entry, progressive complexity, meaningful outcomes over page count.
- Practice: **planned**, not built. Model types provide a metaphor, not clinical proof.
- Relationships: consent, autonomy, honesty; typology cannot diagnose sexual interest or be used to overcome a person's boundaries.
- Public GitHub: keep personal relationship anecdotes anonymized. Never add private messages, names, sensitive contact details, access tokens, or individual therapy-like journal content.
- Existing printed cards: leverage, do not discard. Design remains quiet paper, semantic function colors, original geometry.
- User asked to **hold implementation pending complete specification**. This documentation stage is not authorization to deploy UI or feature changes.

## Definition of done for the next thread
A verified backlog and accepted design prototype; engineering tasks assigned to reproducible repo locations; all facts and claims source-classified; no P0 regressions; a repeatable test/UAT gate with pass/fail evidence; useful experience for four audiences; guide funnel and practitioner Studio specified. "Beautiful" without comprehension and data integrity does not pass.
