# Visual experience prototype and reconciliation

Reviewed November 13, 2026 (Asia/Qatar). Base: `94f5dea1ae6a314817276a3914bb5659cbbd11ba`.
Branch: `feat/visual-four-sides-prototype`. This is a design-study implementation, not a release or completed UAT.

## Outcome and scope

The existing Four Sides field guide asks a new reader to traverse about 7,041 desktop pixels or 12,590 mobile pixels and 2,025 words. This prototype provides a shorter, selectable diagram: follow a function from the eight-slot source into the selected side, change any of the sixteen starting types, reveal vocabulary and exact mechanics when wanted, and compare voluntary/reactive interpretations. Four equal starting doors demonstrate the proposed information architecture.

The route is `/prototype/experience`, behind the existing access wall. It uses a quiet-paper shell without the assistant and loads as a separate chunk. Existing home, onboarding, field-guide routes, engine, payment and authentication logic retain their contracts. The new route is deliberately absent from primary navigation pending comprehension testing.

This slice implements the representative high-complexity Four Sides prototype, not the entire six-surface prototype programme. Guide acquisition, first-run alternatives, a redesigned type overview, directional pair prototype and practice activity remain subsequent slices. No private research anecdotes are published.

## Requirements read and precedence

Read PR #59's AGENTS.md, NEXT-THREAD-START-HERE, PRODUCT-EXCELLENCE-BLUEPRINT, COGNITIVE-DEVELOPMENT-RESEARCH, PRACTICE-ENGINE-SPEC, PDF-GUIDES-AND-PRACTITIONER-STUDIO and QA-UAT-RELEASE-GATES, plus its README addition. Read PR #56's full review, upgrade plan, acceptance protocol and next steps; inspected #57 code changes and #37/#38 diffs. Read current source/design/deck/QA documents and verified assumptions against code.

The current user mandate authorizes the prototype. It supersedes the older documentation's hold on implementation. It does not authorize merging or deploying. Direction A with the two B-folds remains the design direction. Semantic function colors come from the shipped `palette.ts`, not stale hex tables in design documents.

## Branch reconciliation

Native HTTPS Git read access succeeds for both selected repositories. PR heads #37, #38, #56, #57 and #59 were fetched without changing the base checkout. Their commits remain outside main. GitHub API access is currently network-denied, so live PR state, review state, branch protection and check-run status are unverified. A fetched PR ref alone is not proof a PR is still open.

| Work | What is present | Disposition / conflict risk |
| --- | --- | --- |
| #59 | Documentation-only handoff; no feature code | Requirements source; do not assume implemented. README also overlaps #57's corrections. |
| #56 | Historical audit, approved design decision and artifacts | Preserve as historical evidence, not current test results. No bulk merge. |
| #57 | Proposed P0 changes in marketing, onramp, auth, vocabulary, tests, config and docs | Review on current main in a separate correctness/security change. Current main adds the application gate; tests must cover it. KV nonce tracking is not an atomic cross-isolate consume: concurrent replay still needs investigation. |
| #37 | Historical marketing links to `/read`; growth plan | Salvage requirements, implement against current header/footer with tests. Avoid copying stale marketing files. |
| #38 | Replacement Stripe payment link | Main still contains `6oU7sM4Tnd4PdyU1nocfK00`; candidate is `bJe8wRebodIc9fRd0G3Je0f`. Neither link's current commercial status was verified. Confirm in Stripe before changing it. |

The user confirmed during this session that Cloudflare production deploys only from `main`, with previews disabled. This is user-provided confirmation, not a new dashboard/API observation. Local config has `run_worker_first: true`; CI checks every push/PR and does not itself deploy. No merge or deploy was performed.

## Reconciliation matrix

“Open” below means reproduced on this base by source inspection or the browser evidence. “Unverified” means retained from the historical audit without claiming a new reproduction. A prototype improvement does not resolve the corresponding production finding.

| Finding | Status on main / evidence | Existing fix | Risk and acceptance / next action |
| --- | --- | --- | --- |
| MKT-1 / COP-1: reversed hero | Open: marketing.ts literal ENTP 44 / INFP 34, opposite canonical 34 / 44 | #57 heroDir computes engine values | Pin both labeled directions and compare public/app outputs. Do not duplicate old fix. |
| FLO-1: asymmetric lesson over 80/80 | Open: Welcome.tsx step 8 and symmetric pair | No #57 Welcome change | Use a correctly qualified example; assert symmetric and asymmetric cases. |
| MKT-2 / FLO-3: paid access confusion | Open copy/config risk: gate promises owner approval; local full-KV flow redirects code users to /apply | #57 gate copy | Current application flow postdates old review. Test payment → application → approved access, plus blocked/refunded cases; no live payment claim yet. |
| MKT-3 / FLO-2: teaser promise | Open: marketing promises eight questions, email heading promises reading | #57 copy and field narrowing | Walk all steps and match literal promise to delivery. |
| SUP-1: replayable lead token | Open: onramp seals only `{t: now}` | #57 nonce + limiter | Verify sequential and concurrent replay, rate limiting, unavailable KV and email side effects. Eventual KV consistency prevents assuming atomic single use. |
| MKT-4: free readings undiscoverable | Open: no `/read` link in marketing | #37 stale implementation | Current nav, hero, footer, done-step links + link tests. |
| MKT-5 / INT-1/3/7: drifting numbers | Open: hand-authored stage/entry counts and public asymmetry claims | #57 claims tests/docs | Recompute denominators and counts, not broad literal replacement. |
| COP-2: conflicting relation names | Open: REL_FRAME uses older names | #57 data/curriculum | Test all sixteen relation openings against canonical names. |
| FLO-4: boundary field counts | Open source: done step prints raw field length | #57 validated narrowing | Empty/invalid/contradictory answers must remain meaningful. |
| DIS-1 / FLO-5: tall pages without persistent wayfinding | Open: rendered field-guide/type/lexicon census below | None | Prototype selects one concept; later preserve deep links and add navigable chapters. |
| DIS-4 / DIS-11: contrast and definition-list semantics | Open: axe on type/sides/pair/network/lexicon | None | Repair shared Row markup and composed contrast; rerun affected routes/themes. |
| DIS-6: heading structure | Open: axe on type/sides/pair/network/learn | None | Correct heading outline without relying on visual sizing. |
| ILL-8: four finished cards hide reordering | Open: existing FourSidesDiagram | This prototype only | Trace source→destination for all 16×4 combinations. Real comprehension still untested. |
| INT-2 / BRD-6 / ILL-12: palette/doc drift | Open: design docs differ from palette.ts | None | Reconcile docs to shipped semantic colors; do not independently recolor figures. |
| BRD-4 / MKT-6: missing share/tab assets | Open source: no app favicon/OG image | None | Purpose-designed exports, served links, correct metadata. |
| FLO-6/7/8: cross-navigation/course rail/context prompts | Historical findings; source locations identified, no complete interaction retest | None | TypeReader.tsx, PairReader.tsx, Learn.tsx, chat/context.ts; specific browser task tests required. |
| ILL-1/2/3/4/5/6/7/9/10/11 | Historical illustration gaps; not individually certified resolved | None | Diagram-by-diagram label floor, transcript, semantic encoding and comprehension checks. |
| COP-4..13; MKT-7..12; remaining BRD/DIS items | Historical editorial/identity/polish inventory retained, not fully re-audited | Partial #57 docs only | Follow #56 inventory after P0s. Do not mark closed from this prototype. |

## Rendered screen census and prioritized backlog

The browser walk exercised seven signed-in surfaces at desktop 1440×900 and mobile 390×844, each light/dark, with actual content visible. [Raw results](evidence/baseline-browser.json) retain per-route/theme metrics and axe counts. Fonts were blocked by network policy: captures use fallback fonts. These are current measurements, not the August audit's figures.

| Screen | Desktop height | Mobile height | Approx. desktop words | Priority / source |
| --- | ---: | ---: | ---: | --- |
| Home | 3,239 | 4,809 | 669 | P1: four equally understandable entries; views/Home.tsx |
| Type ENTP | 16,833 | 27,806 | 3,978 | P1: illustrated chapter overview, persistent wayfinding; views/TypeReader.tsx |
| Four Sides ENTP | 7,041 | 12,590 | 2,025 | P1: selectable source→side prototype here; views/Sides.tsx |
| Pair ENTP/INFP | 4,531 | 8,024 | 1,036 | P0 correctness then P1 clear perspectives and cross-links; views/PairReader.tsx |
| Network | 1,800 | 3,470 | 473 | P2: group list alternative and larger-room test; views/Network.tsx |
| Learn index | 2,081 | 3,325 | 439 | P1: value-first route into lessons; views/Learn.tsx |
| Lexicon | 33,787 | 71,391 | 8,442 | P1: filtered lookup/progressive details; views/Lexicon.tsx |

P0 next: reconcile #57, correct Welcome's symmetric teaching example, verify the active checkout and paid application path. P1 next: conduct the UAT tasks below, revise this prototype from observed failures, then extract shared experience components. P2: adapt type/pair/guide prototypes and generate one accessible guide from verified content. Studio, owner console and persisted practice follow user validation; they are not implemented here.

## Verification

- Baseline: 1,297 passed in 51 files; typecheck and build passed. Lint: zero errors, five existing warnings.
- Prototype: 1,316 passed in 52 files; typecheck and build passed. Lint: zero errors, same five warnings. New interaction tests exercise all sixteen types and all four sides, every visible assignment and gateway, plus stale-example clearing and absence of stored profile data.
- Browser: type change, side selection, voluntary/reactive toggle, vocabulary disclosure and technical details exercised at both viewports/themes. Zero page exceptions, zero axe violations in the tested states, no document overflow; diagram labels measured above 14px. [Results](evidence/prototype-browser.json). This is not a screen-reader certification or real-user UAT.
- Initial JS: 632.30 KB baseline; 632.89 KB after. Prototype is a separate 8.88 KB JS / 4.99 KB CSS chunk. Existing >500KB warning remains; no new dependency or lockfile change.
- Real local Wrangler: public home/read do not contain the app shell; protected route and API refuse anonymous requests; protected JS refuses anonymously and serves with a valid local code session; authenticated export returns the expected stack. [Results](evidence/worker-smoke.json). These asset-boundary probes use an external local codes-only config mirroring `run_worker_first`, deliberately without USERS. The repository's full local-KV configuration separately demonstrated the expected application redirect; it is not equivalent to the Vite codes-only workflow.
- Assets: generated engine data for all sixteen types exactly equals the committed assets JSON. Export/verification helpers and 29 SVG/PNG pairs generated in external setup directories, using installed librsvg/Cairo through a local adapter. No source or existing figures changed.
- Live OAuth, payment fulfillment, email, Cloudflare credentials/dashboard, production behavior and user comprehension were not validated. No release claim is made.

## Before / prototype evidence

These compare the existing field guide with the proposed experience; this is not a claim that the existing route was replaced.

| | Existing guide | Prototype |
| --- | --- | --- |
| Desktop light | [Before](evidence/before-sides-ENTP-desktop-light.png) | [Prototype](evidence/after-experience-desktop-light.png) |
| Desktop dark | [Before](evidence/before-sides-ENTP-desktop-dark.png) | [Prototype](evidence/after-experience-desktop-dark.png) |
| Mobile light | [Before](evidence/before-sides-ENTP-mobile-light.png) | [Prototype](evidence/after-experience-mobile-light.png) |
| Mobile dark | [Before](evidence/before-sides-ENTP-mobile-dark.png) | [Prototype](evidence/after-experience-mobile-dark.png) |

## Formative UAT: pending, zero participants

Use novices, enthusiasts and practitioners; start with 5–8 per cohort as a qualitative target. Obtain consent for recordings. Without coaching, ask participants to: choose an entry within 60 seconds; trace one function from starting pattern to selected side; change type and explain what changed; locate exact mechanics; distinguish authored expression from a measured state; explain what the model cannot tell them. Record task success, time, wrong turns and verbatim paraphrase with participant permission. Target ≥80% correct mechanism explanation and ≥90% task success, report denominators and limitations. These targets are not achieved results.

Manual follow-up: keyboard-only flow, 200% zoom, assistive technology and reduced-motion checks. Confirm that the source→side threads teach reordering, not literal brain switching. If users misinterpret either, revise before extracting shared components or replacing any existing screen.

## Rollback and release

Remove the isolated route/import, ExperiencePrototype view/styles and its tests to roll back. No schema, storage migration or infrastructure was introduced. Do not merge to main, deploy or claim UAT passed without the required owner and participant evidence.
