# Octant — QA, UAT, Content Integrity and Release Gates

**Status:** enforceable proposed acceptance process; supplements `docs/QA-REVIEW.md` and unmerged PR #56 `docs/ACCEPTANCE-PROTOCOL.md`. This is not a report that checks have run. **Date:** 2026-11-13.

## 1. Baseline and source of truth
Before any implementation, fetch main and PR #56 and #57. Establish main SHA, git clean state, relevant prior fixes, production/deploy settings and branch protection. Run actual tests; NEVER assume a historic pass is current. PR #56's August 2026 review recorded 1,225 tests/47 files and 632 KB JS bundle *on that branch*; these are NOT current results. Its prior acceptance protocol includes route matrix, screenshots and manual checks; use it as baseline.

Source-of-truth priority:
1. Running code and tests on identified commit.
2. Engine-derived values `src/engine/*` (internally consistent, not scientifically validated).
3. Approved authored copy with source/version/date.
4. Evidence from recorded UX/QA session.
5. Legacy docs, clearly marked if stale.
A UI string that disagrees with computed data is a bug, not an editorial preference.

## 2. Every PR must submit proof
PR template fields:
- Scope / user outcome / audience / issue IDs / expected behavior.
- Source classification for new statements: derived, authored hypothesis, empirical, self-report.
- Before and after images for desktop 1440x900, mobile 390x844, both themes.
- 30–60-second interaction capture for changed animations and interactive figures, plus static alternative.
- Automated results with command, commit SHA, date, actual counts, build/bundle sizes.
- Accessibility report (automated + manual keyboard and assistive technology).
- UAT protocol, participant count/background, tasks, pass/fail, issues, evidence, retest.
- Security/privacy impact and data-retention review, if relevant.
- Rollback strategy, deploy configuration and owner acceptance.
- Exact route+step reproduction for every unresolved defect.

## 3. Automated gates (run, don't merely prescribe)
```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
# npm run cards (when card/deck or shared PDF data changed)
```
CI should run tests on PR; add browser E2E infrastructure (Playwright or project-compatible alternative) behind a lockfile-pinned version. Never quietly weaken assertions to make a PR green.

Must test:
- Exhaustive 16 types × 4 sides: same stacks, positions, gateway and names derived from engine, no independent mapping drift.
- 256 directed pair relations; reciprocal direction and symmetric/asymmetric examples; public/SPA/PDF claims agree.
- All dynamic counts in public headlines (types, course stages, lexicon, cards) computed or pinned against engine.
- Conditional feature states across anonymous, invite, paid, blocked and owner sessions; public gate never leaks private app assets.
- Checkout paid -> access works; invoices/webhook idempotency and failure cases.
- Lead capture, token replay prevention, consent checkbox and unsubscribe; no surprise emails.
- Studio tenant isolation, report permission, deletion and revoke if implemented.
- Practice selection for any type/goal, corrupted storage, no fabricated function strength, no persistence of journal text in analytics.
- Report/PDF production: text selectable, no overflow, correct links, tagged/alt when supported, claims verified against engine.
- Semantic controls, focus order, labels, touch targets and keyboard alternative to gestures.
- Responsive and light/dark layout; reduced-motion alternatives; no uncaught browser errors.
- Builds must not deploy automatically from arbitrary feature branches.

## 4. Visual regression matrix
Target routes: signed-out landing, public /read examples, guide landing, first onboarding and last onboarding, signed-in Home, /learn index and representative stage, /calculator, /type/ENTP and two other representative types, /sides/ENTP and one different gateway, /pair/ENTP/INFJ (symmetric in legacy findings), /pair/ENTP/INFP (asymmetric), /network at 3 and 7+ people, /matrix, /lexicon, /guide, /practice prototype, Studio prototype if built.

Viewports: desktop 1440×900, mobile 390×844, intermediate tablet 768×1024; dark/light and if feasible system preference. Test browser font availability and fallback, text zoom 200%, high contrast/reduced motion. Use deterministic fixtures and fixed date/time where UI requires it. Keep approved screenshot baselines and record intentional diffs with rationale. Look for clipped labels, horizontal overflow, hidden legend, diagram ambiguities, slow hero rendering and inaccessible modal content.

## 5. Comprehension UAT — the actual missing quality dimension
Recruit at minimum a small moderated formative cohort for each key audience (novices unfamiliar with cognitive functions, enthusiasts, practitioners) before writing pages. As a starting target, 5–8 people per cohort per major design iteration, acknowledging that these small samples are qualitative and are not statistically representative. Add more participants for summative confidence.

Representative novice tasks, **without coaching**:
1. Find a meaningful entry point within 60 seconds.
2. Explain the difference between Ne and Ni using the diagram, not memorized jargon.
3. Locate four sides and correctly point out Ego versus Superego.
4. Change the type and describe what changed without confusing the sides' source mappings.
5. Read a two-person example, identify which direction each arrow describes, and state what the result *cannot* predict.

Enthusiast tasks:
1. Reveal exact mechanics and locate provenance.
2. Trace how the engine computes a four-side transformation.
3. Contrast developed vs reactive expression without assuming moral labels or disease.
4. Choose an exercise, exit endless analysis and log a behavior rather than a hypothetical trait score.

Practitioner tasks:
1. Create a mock consented session.
2. Distinguish observed behavior, participant self-report and model hypothesis.
3. Explain a pair diagram neutrally and avoid claiming romantic/sexual desire from a type.
4. Export a private draft report, review permissions and revoke access.

Owner tasks:
1. Identify outdated/unsupported public claim.
2. Block a release with a critical UAT issue.
3. Review guide conversion in aggregate, without seeing private notes.
4. Unpublish erroneous PDF/HTML and preserve a rollback trail.

For each task capture: success, time, wrong turns, unprompted verbalization, hesitation, self-reported clarity, screenshot/video consent, cognitive burden and practical usefulness. Observers should not explain terms while the task is in progress.

## 6. First target thresholds (targets, not measured results)
| Metric | Provisional pass condition |
| --- | --- |
| Find first valuable experience | >=90% task success without assistance |
| Concept comprehension | >=80% correctly paraphrase core visual |
| Core navigation and action | >=90% success |
| Derived numeric/slot mismatches | 0 |
| Severity-1 privacy/auth/payment defects | 0 |
| Serious/critical automated a11y violations | 0; additional manual assistive-tech pass required |
| Visible diagram labels/contrast | WCAG 2.2 AA where applicable; non-color alternative |
| Layout clipping/horizontal scrolling | 0 on specified target viewports |
| Broken guide links and unsearchable guide text | 0 |
| Production branch isolation | verified by dashboard/config and safe test |
These targets need explicit measured denominator, cohort, date and task. Do not convert a small qualitative study into a universal success-rate claim.

## 7. Accessibility and performance
- Design target: WCAG 2.2 AA; actual conformance requires extensive manual review, not just axe.
- Check headings/landmarks, alt text that teaches diagram content, focus indicators, keyboard access, skip to main, screen-reader page announcements, touch targets, links distinct from surrounding text, responsive zoom.
- Dynamic function diagrams must expose the same information as text and permit keyboard/touch input.
- Motion supports `prefers-reduced-motion`, with no critical explanation locked behind an animation.
- Initial performance objectives (validate using real users): LCP <= 2.5 sec, INP <= 200 ms, CLS <= 0.1 at p75. Investigate unexplained JS bundle increase >5% as described in prior protocol, but assess impact rather than enforcing arbitrary file-size budget.
- Visual polish must not reduce reader's ability to copy and quote accurate information.

## 8. Content accuracy and relational safety
Audit ALL interpretive sentences for certainty and origin:
- An interaction from two types cannot establish actual attraction, sexual interest, motives or vulnerability.
- No instructions to "bypass her defenses," withhold attention to trigger pursuit, interpret tension as falsity, or use function positions to override refusal.
- Optimistic/pessimistic function labels and Four Sides are model claims, not experimentally established brain function.
- Distinguish observable behavior from authored interpretation; avoid personality-based deterministic statements.
- Avoid false equivalence between model reliability and published empirical social science. Show transparent survey methods and differences where applicable.
- Use anonymized composite examples; do not publish private case history.

## 9. PDFs and guide release
- Generate HTML and PDF from shared content/versioned input; compare extracted public claims to engine-derived expected values.
- Visual print proof (A4/letter as appropriate), mobile zoom and tablet review; text must be live/searchable, no dense raster text. Tagged PDF / assistive technology when supported or accessible HTML counterpart.
- QR codes and embedded links must resolve to approved public URL, correct guide/version section and no private tracking tokens.
- Guide CTA makes a promise it actually fulfills; record funnel results but not sensitive reflections.
- Author signoff on every title/cover/diagram + copy edits, plus accessibility and proofreader signoff.

## 10. Severity and stop-ship rules
**S0 security/privacy:** exposure of private journal/participant data, auth bypass, uncontrolled production deployment, leakage of credentials -> STOP.
**S1 correctness/checkout:** wrong directional relation, incompatible engine/PDF derived data, broken payment access, misleading claims -> STOP.
**S1 usability:** novice unable to find path, critical diagram teaches incorrect mechanism, screen unreadable with assistive tech -> STOP for feature.
**S2 UX and editorial:** confusing explanation, low-comprehension figure, nonessential layout faults -> triage with owner; don't bulk defer.
**S3 polish:** aesthetic imperfections with no factual/accessibility impact -> backlog.
Every block has test evidence, named owner and retest date.

## 11. Release ritual
1. Reconcile upstream PRs and main SHA.
2. CI clean; integrated browser + accessibility + public surface checks.
3. UX/UAT findings reviewed with explicit pass/fail and product-owner signoff.
4. Verify Cloudflare production branch setting, env variables and preview isolation.
5. Final test subscription/payment path against safe test data and correct entitlements.
6. Record before/after screenshots and actual build size; verify DNS/HTML/PDF.
7. Deploy only after owner confirmation. Roll back rapidly if S0/S1, knowing data migrations require separate rollback policy.
8. Post-deploy smoke: public home, public guide, read page, sign-in, sample paid account, app routes, PDF deep link, analytics health.
9. Publish a release note with changed features, known limitations and monitoring.

## 12. Proof standard
"No claim without a reproducible path or actual observation." For tests, give command+SHA+output. For a UX claim, give participant task and evidence. For a technical doc, give file:line at inspected commit. Do not report a browser walk, tests, Stripe charge, PDF output or deployment as done unless actually executed.
