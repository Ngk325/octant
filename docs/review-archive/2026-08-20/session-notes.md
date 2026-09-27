# Session evidence log — 2026-08-20 (my own inline verification)

## Gates (run this session)
- npm test → 1225 passed / 47 files / 0 failing (QA-REVIEW 2026-08-01 recorded 832/29 → +393 tests, +18 files)
- npm run typecheck → clean (exit 0)
- npm run lint → 0 errors, 5 warnings: src/styles/base.css:121,122,123 noImportantStyles (FIXABLE); src/styles/components.css:394,483 noDescendingSpecificity. QA-REVIEW recorded "0 errors (7 in-source suppressions)" — warnings not mentioned then.
- npm run build → clean, dist/assets/index-*.js 632.30 KB / 197.14 KB gzip, single chunk + 22.86 KB CSS. QA-REVIEW recorded 558/178. Vite chunk-size warning (>500KB) now firing.
- Toolchain: node v22.22.2, npm 10.9.7.

## Access
- cp .dev.vars.example .dev.vars; npm run dev; the REAL worker runs in dev (vite.config.ts devApi plugin, src/worker/index.ts whole router). Access wall active in dev.
- POST /api/auth/login {"code":"let-me-in"} → 200 {"ok":true,"label":"dev"} + octant_session HttpOnly cookie (30d).
- Signed-in `/` requires localStorage octant.onboarding.done=1 (src/App.tsx:182, key prefix "octant." src/storage.ts:12) else redirect /welcome.
- /admin with code session: API refuses non-owners (owner = google session only).

## Routes (source of truth src/App.tsx:106-203 + worker)
- README route table omits: /bonds (App.tsx:192), /guide + /guide/:type (App.tsx:198-199). Worker-side signed-out surfaces README table also omits: /partners, /compare, /compare/:slug (mbti, socionics, big-five — src/worker/compare.ts COMPARE_SLUGS), /onramp funnel (src/worker/onramp.ts, GET one route, state in query).
- Signed-out `/` = server-rendered SaaS landing (src/worker/marketing.ts, 861 lines): hero "Compatibility runs in two directions", CTAs /onramp + #pricing, proof band (16/256/27%/128-128/r −0.15), problem/product/uses/how/pricing/about. Pricing $25/user·mo via Stripe payment link (marketing.ts:39-42); Business mailto nick@stratfieldpartners.com. Brand owner: Stratfield Partners LLC.
- Signed-in `/` = React orientation page (src/views/Home.tsx) — different surface, same claims.

## Mechanical claims verified this session
1. catalysts() → relations EX + MG for all 16 types (npx tsx over src/engine/core.ts:122; EX="Damper", MG="Loose fit" src/engine/data.ts:100,110) — README claim HOLDS.
2. Lexicon: tests pin 103 entries (tests/plain.test.ts:30, history 99→100→101→103 documented in comment). README "Plain first" section says "all 100 lexicon entries" — STALE. README tree line "103 term definitions" correct.
3. STAGES.length = 15 (npx tsx over src/learn/curriculum.tsx). Marketing "fifteen-stage course" CORRECT; README says "thirteen-stage course" and "/learn Thirteen stages" — STALE ×2. Home.tsx uses {STAGES.length} so signed-in home is drift-proof.
4. Octagram: tests/octagram.test.ts "dyads derived match published eight", "temples match published four", "CS Joseph's published eight deadly sins" — 207 tests across octagram/sides/calculator/engine.test files passed this session (vitest run, 4 files).
5. calculate() (src/engine/ops.ts) maps over TYPES and scores — structurally cannot return empty; "always narrows, never returns nothing" HOLDS. UI verified interactively: after 8 answers → "Your type ISTJ", "Still possible: 1 of 16 left", "Closest fits" ranked 4/4·1/4 etc., disagreement callout "You said Control; ISTJ is usually Movement. Not an error." (flow-calc-after-8.png)
6. Asymmetric ease pairs: 64 of 256 ordered pairs differ by direction (npx tsx; e.g. ENTP/INFP 34 vs 44). Marketing proof band says 27% — 64/240 non-identity ordered pairs = 26.7% ≈ 27% ✓ (or 64/256=25% — check which denominator marketing means; 27% suggests 64/240... VERIFY: agents to check tests/marketing.test.ts pin).
7. data.ts total 23,420 bytes incl. authored copy — "~2 KB genuine seed" claim needs the seed-subset arithmetic (delegated to integrity agent).
8. Marketing proof band 27% (marketing.ts:608): measured 64 asymmetric ordered pairs = 32 unordered of 120 = 26.7% → "27%" is a fair rounding, VERIFIED, but hard-coded — NOT pinned by tests/marketing.test.ts (which covers serving/leaks/metadata only, not the numeric claims). Same for 128/128 and r −0.15 in the band.
9. tests/marketing.test.ts:55 says "softens only the two public pages" while worker index.ts serves /, /partners, /compare/*, /onramp anonymously — wording vs reality to reconcile (agents).

## Visual walk
- Coverage: walk1 (44 pages × desktop/mobile × light/dark), walk2 (9 signed-out marketing pages × 4), walk3 (real signed-in home × 4), flow-calc interactive probe. Manifests: shots/manifest.json, manifest2.json, manifest3.json, flow-calc-log.json.
- CAVEAT for all shots: Google Fonts (fonts.googleapis.com) is BLOCKED by the sandbox → all screenshots render fallback stacks (Newsreader→Georgia, Inter→system-ui, IBM Plex Mono→monospace). Do not judge letterforms. Separately a REAL finding: fonts are hotlinked from Google with no self-host/fallback strategy = FOUC risk + availability dependency + EU privacy consideration.
- Full-page screenshots of sticky masthead pages show the masthead mid-image — capture artifact, not a bug.
- Page heights (desktop, light): lexicon-ni/ne 35,097px; lexicon-index 33,928px; type pages ~16,860px (≈19 screens); sides 7,035; home-signedout 5,281; matrix 5,067; pair ~4,500; partners 4,483.
- Console errors: none on app routes (walk1 first batches); ERR_CONNECTION_RESET on partners/compare = the Google Fonts block (sandbox artifact).
- axe-core (7 pages, desktop light): home-signedout 0 violations; home-app 0; onramp: landmark-one-main + region (moderate); calculator: dlitem serious ×10 + heading-order; type-entp: dlitem serious ×84, color-contrast serious ×6 (.gpath-step .muted.small), aria-allowed-role ×2, heading-order; matrix: dlitem ×6 + empty-table-header; learn-stage: dlitem ×32, aria-allowed-role, heading-order. Systemic pattern: dt/dd used without dl wrapper (rows), contradicts a11y.test.tsx confidence; color-contrast failures despite palette.test.ts AA assertions (assertions cover tokens, not composed use like muted-on-soft backgrounds).

## Product facts for the plan
- Physical deck: 78 cards generated from the engine (docs/CARDS.md, src/cards/, npm run cards) — tests/cards.test.ts asserts suit sizes + re-derives grid vs ease(). Latest commit "The front door speaks the deck's language" (fe2ef49).
- Vocabulary mid-revision: DESIGN-SYSTEM notes live proposal renaming ~60 terms (savior→anchor, Duality→Counterpart, Octagram→the Rose). Illustrations must carry meaning in geometry, not labels.
- Design doctrine: "quiet paper, precise geometry, colour that always means something"; 5-property grammar (hue=element N violet/S amber/T teal/F rose; direction=attitude; size=rank ratio 1/.78/.56/.42; vertical=order; opacity=certainty); 8 primitives; 15 mechanisms with stated gaps (§3: elements-never-drawn-as-system, re-sorting shown static, adjacency not shown, network hairball >6, seasons want illustration).
- tokens.css: Newsreader/Inter/IBM Plex Mono; 14px floor; light #FDFCFA / dark #141310; accent #4C4899; AA asserted in tests/palette.test.ts; breakpoints contract tested by tests/styles.test.ts.
- wrangler.jsonc: run-every-request-through-worker (billable per asset; documented tradeoff, 429 failure mode at scale).
- docs hierarchy: REVIEW-FINDINGS (2026-08-01, superseded snapshot; 776 tests then) → QA-REVIEW (2026-08-01, 832) → now 1225.
