# Octant — comprehensive upgrade plan

Derived from `REVIEW-2026-08-FULL.md` (2026-08-20). Review-only: nothing here is
implemented; every item is specified so a future session can implement and *prove* it.

**Item schema.** Every item carries: ID · perspective (and audience lens it serves) ·
severity/impact · effort (S ≤ half a day, M ≤ 2 days, L > 2 days) · dependencies ·
**acceptance criteria** (observable, binary) · **verification** (the exact command, route,
or test). An item missing any field does not ship.

**Phases.** P0 fix-before-anything → P1 marketing & conversion → P2 brand decision +
visual system → P3 copy & flow → P4 depth & polish. Every item lives in exactly one phase.
Within a phase, order is priority order.

**The one rule that outlives this plan** (it is also item P0-2): *every number or
mechanical claim on a public surface is either rendered from the engine at build/run time,
or pinned by a test that recomputes it.* Almost every finding in the review is a symptom
of not having this rule.

---

## P0 — Fix before anything

| | |
|---|---|
| **P0-1 · Fix the hero worked example (direction swap)** | perspective: marketing+copy · lens: all three · severity: **P0** · effort: **S** · deps: none |
| Problem | `HERO_READING` (`src/worker/marketing.ts:137-173`) attaches 44/"Examined"/the blind-spot gloss to ENTP→INFP and 34/"Examiner" to INFP→ENTP; engine, app, and public `/read/entp-and-infp` all say the opposite (REVIEW §5 MKT-1). |
| Acceptance | The hero panel's two rows each show the score, relation name, and gloss the engine assigns that direction; the panel is either rendered from `ease()`/`relation()`/`REL_NAME` or pinned by test. |
| Verification | New test in `tests/marketing.test.ts`: render `marketingPage()`, for each hero row assert the displayed score equals `ease()` for the direction its label names and the relation name matches `REL_NAME[relation(...)]`. Manual: `curl -s localhost:5173/ \| grep -A2 'ENTP'` matches engine output. |

| | |
|---|---|
| **P0-2 · The derived-or-pinned rule for public numbers** | perspective: integrity · lens: enthusiast+partner · severity: P1 (systemic) · effort: **M** · deps: none |
| Problem | Hand-written numbers drift: "thirteen-stage" ×2 README + partner terms (15 shipped), "14" in PLATFORM-BACKPORT, "100 lexicon entries" (103), "27%" unpinned, "different numbers, always" (false for 73%), "each scored twice" (REVIEW §5 MKT-5, §7 INT-1/3/7, §6 COP-8). |
| Acceptance | (a) All six drifted claims corrected in place; (b) a new `tests/claims.test.ts` pins every numeric claim on the marketing page and in README's headline section by recomputing it from the engine (stage count, lexicon count, asymmetric-pair fraction with its denominator stated, 256/128-128/r−0.15 already pinned elsewhere — reference them); (c) PARTNERSHIP-TERMS reworded to the engine's own truth ("for the four asymmetric relations the two directions are different numbers"). |
| Verification | `npx vitest run tests/claims.test.ts` green; `grep -rn "thirteen-stage\|all 100 lexicon" README.md docs/PARTNERSHIP-TERMS.md` → no matches; the test fails if `STAGES.length` and README's stated count ever diverge again. |

| | |
|---|---|
| **P0-3 · Retire the six pre-rename relation names in `REL_FRAME`** | perspective: copy · lens: all three · severity: P1 · effort: **S** · deps: none |
| Problem | Every pair page opens "Identity./Activity./Mirror./Business./Super-Ego./Conflict." two lines above the shipped names Twin/Spark/Opposite hand/Colleague/Standoff/Headwind (`data.ts:257-274` vs `:96-113`; also `curriculum.tsx:681`) — REVIEW §6 COP-2. |
| Acceptance | `REL_FRAME[c]` opens with `REL_NAME[c]` for all 16 codes (derive the lead-in programmatically or rewrite the six); `curriculum.tsx:681` says "Headwind". |
| Verification | New assertion (extend `tests/lexicon.test.ts` or vocab test): for every RelCode, `REL_FRAME[c].startsWith(REL_NAME[c])`. Visual: `/pair/ENTP/ISFJ` shows one name, twice. |

| | |
|---|---|
| **P0-4 · Give paying customers a true sign-in path** | perspective: marketing/flow · lens: newcomer+partner · severity: P1 · effort: **S** · deps: none |
| Problem | Pricing promises "straight in"; `/signin` says "you will wait until they approve you," unconditionally, with no already-paid path (REVIEW §5 MKT-2). |
| Acceptance | When Stripe + Google are configured, `/signin` shows a "Just subscribed? Sign in with Google using the email you paid with — payment unlocks your account automatically" path; the owner-approval sentence renders only for the non-payer path. |
| Verification | Extend `tests/marketing.test.ts` or `tests/auth.test.ts`: gate page with Stripe+Google env carries the paid-path copy; without them, it doesn't. Manual: curl `/signin` under both configs. |

| | |
|---|---|
| **P0-5 · Close the onramp token replay** | perspective: security · lens: (funnel integrity) · severity: P1 · effort: **M** · deps: none |
| Problem | `seal({t: now})` binds nothing, not single-use, 1-hour TTL: one token → unlimited Octant-branded emails to arbitrary addresses + KV write burn (`onramp.ts:63-98`, `leads.ts:78-101`) — REVIEW §8 SUP-1. |
| Acceptance | A start token can cause at most one lead capture + one email; replay with a different address is refused; a rate limiter (or nonce record) covers the public funnel path. |
| Verification | New worker tests: same token + second email → 4xx and no `sendMail`; existing funnel walk still completes. `npx vitest run tests/onramp.test.ts` (extended). |

| | |
|---|---|
| **P0-6 · Make the onramp's three promises true** | perspective: marketing/flow · lens: newcomer · severity: P1 · effort: **S** (copy) or **M** (4-coin variant) · deps: none |
| Problem | "Eight either-or questions" → two; email step titled "See your directional reading" delivers none (REVIEW §5 MKT-3). |
| Acceptance | Either (copy path) the CTA note says what the funnel is ("a free two-minute teaser — two of the eight questions") and the email step is titled by what it sends; or (product path) the funnel asks the four determining coins and the done step shows a genuinely narrowed result. Promise and delivery match either way. |
| Verification | Read `/onramp` steps 1→11 against the hero note: every promise made is delivered on-screen. Pin the CTA note string in `tests/marketing.test.ts`. |

| | |
|---|---|
| **P0-7 · Verify (and if real, fix) production-deploys-from-any-branch** | perspective: platform · severity: P0-if-confirmed · effort: **S** · deps: dashboard access |
| Problem | Two docs-only pushes to a non-default branch each produced a Cloudflare build labeled "production — deployment successful" (REVIEW §8, observation). |
| Acceptance | Workers Builds deploys production from `main` only; branch pushes build previews (or nothing). |
| Verification | Push a trivial branch commit → the bot reports a preview (or no) build; production build id unchanged in the dashboard. |

## P1 — Marketing & conversion

| | |
|---|---|
| **P1-1 · Link the free proof** | marketing · newcomer+enthusiast · P1 · **S** · deps: none |
| Problem | 136 public engine-derived `/read` pages linked from nowhere human-facing (MKT-4). |
| Acceptance | "Sample readings" in nav + footer; "See a real pair reading, free →" under the hero panel and on the onramp done step; all four links resolve to `/read` surfaces. |
| Verification | `tests/marketing.test.ts`: rendered page contains `href="/read` in nav, footer, hero; onramp done step contains it. Click-through manual check. |

| | |
|---|---|
| **P1-2 · Social and tab identity: og:image, twitter card, favicons** | marketing+brand · newcomer · P1 · **M** · deps: P2-2 for the mark (interim asset acceptable) |
| Problem | No og:image/twitter:image anywhere; app has no favicon at all; marketing favicon is a data:URI scrapers can't use (MKT-6, BRD-4). |
| Acceptance | `/og.png` (1200×630, hero-diagram render) served and referenced with `twitter:card=summary_large_image` on every public page; `.ico`+SVG+PNG favicon set served by both marketing and app; `index.html` carries the icon links. |
| Verification | `tests/marketing.test.ts` asserts og:image + twitter:image in `siteHead()`; curl `/og.png` → 200 image/png; browser tab shows the mark on `/` and in-app. |

| | |
|---|---|
| **P1-3 · Say the crown-jewel claim in public** | marketing · enthusiast · P2 · **S** · deps: P0-2 (the number must be pinned) |
| Problem | "256 scores from ~2 KB seed, no database, cannot drift" lives only in the confidential partner doc (MKT-8). |
| Acceptance | One proof-band slot carries the concrete claim with a measured seed figure; the figure is asserted by a test that measures the actual seed tables. |
| Verification | `tests/claims.test.ts` measures seed byte-size within a stated tolerance; band string pinned. |

| | |
|---|---|
| **P1-4 · A checkable validation note** | marketing · enthusiast+partner · P2 · **S** · deps: none |
| Problem | Strongest trust signals cite deliberately unnamed sources; `/compare` already names systems, so the seal is already deliberately broken where useful (MKT-9). |
| Acceptance | A public "Validation" section (on `/compare` or its own anchor) names the ingested sources and the test files that reproduce each agreement (128/128, two 256/256 charts, 40/40 wheels, r −0.15). |
| Verification | Page renders the four validations with source names; `tests/attribution.test.ts` amended to allowlist exactly this surface, so the naming seal stays intact everywhere else. |

| | |
|---|---|
| **P1-5 · Show the deck** | marketing+brand · all three · P2 · **M** · deps: none |
| Problem | The 78-card printed deck — the most distinctive, unfakeable brand asset — is described in prose and shown nowhere (BRD-8). |
| Acceptance | A rendered deck visual (cards fanned/gridded, from `npm run cards` output or a styled render) appears on the marketing page and partner page. |
| Verification | Visual check both pages, light+dark; the image is served locally (no external host). |

| | |
|---|---|
| **P1-6 · Rewrite the newcomer's first ten seconds** | marketing+copy · newcomer · P2 · **S** · deps: P0-1 |
| Problem | Hero panel leans on undefined jargon; the lede reads ~6 grades harder than the product's own plain layer and leads with "derivation" (MKT-10, COP-10). |
| Acceptance | A plain line inside the panel ("Two people, one relationship, scored from each side"); the alphabet caption drops the pigment vocabulary; hero lede opens with the plain claim (the product's own register: "Most relationships are easier for one person than the other. The one having the harder time usually can't tell."). |
| Verification | Flesch-Kincaid of the lede ≤ grade 7 (scripted check, recorded in the PR); jargon terms in the panel each either defined in-place or removed. |

| | |
|---|---|
| **P1-7 · One flagship phrase on both doors** | marketing · newcomer · P3 · **S** · deps: none |
| Problem | Public door sells "compatibility runs in two directions"; the app a convert enters says "read the wiring" (MKT-11). |
| Acceptance | One phrase chosen; the other surface either adopts it or leads with it (signed-in Home's first band = the directional claim is the minimal fix). |
| Verification | `index.html` title, `marketing.ts` title, and Home hero reviewed together; the buyer's promise is visible on the first signed-in screen. |

| | |
|---|---|
| **P1-8 · Adversarial pass over the grown public surface** | security · (trust) · P2 · **M** · deps: P0-5 |
| Problem | QA-REVIEW's attack table predates `/onramp`, `/read`, Stripe, Google, admin links; `auth.ts:8` still claims "Nothing is public" (SUP-2). |
| Acceptance | A dated addendum to QA-REVIEW §2 covering every unauthenticated route; `auth.ts` header corrected to "Nothing of the instrument is public." |
| Verification | The addendum lists each public route with its abuse cases and disposition; findings filed or fixed. |

## P2 — Brand: decision, then execution

**P2-0 (the decision).** The review presents three directions (REVIEW §10): **A · Sharpen
the instrument** (refine; recommended), **B · Ink and element** (evolve), **C · New
coordinates** (rebrand). The recommendation is **A with two B-folds** (true logotype +
hardened mark; element hues promoted to the hero color roles). The owner picks; the fork
table at the end of this file maps every item below to its fate under each direction.
Items P2-1…P2-9 are specified for direction A+.

| ID | Item | Sev | Eff | Acceptance criteria | Verification |
|---|---|---|---|---|---|
| P2-1 | **Logotype + hardened mark.** Draw "Octant" once as a fixed SVG lockup; redesign the mark to encode eight/octant (the current two-squares-plus-dot reads as a settings glyph — `marketing.ts:21-27`) | P1 | M | One canonical SVG lockup + mark, exported at fixed sizes; legible at 22 px; distinct from a crosshair at a glance; both themes | Asset files exist under `/public/brand/` (or equivalent); side-by-side legibility check at 22/30/64 px in both themes recorded in the PR |
| P2-2 | **Put the mark in the app.** The signed-in masthead carries the mark + lockup (today: bare body-serif text, `App.tsx:121-123`) | P1 | S | Every signed-in screen shows the mark; wordmark no longer re-set as live text | Screenshot masthead desktop+mobile, both themes; container-query behavior at 1399/1239 px unchanged (`tests/styles.test.ts` still green) |
| P2-3 | **Self-host the type.** Newsreader/Inter/IBM Plex Mono as subset WOFF2; drop the Google hosts from CSP (BRD-3, SUP-12) | P1 | M | No request to fonts.googleapis/gstatic on any page; CSP no longer lists them; fallback stacks unchanged | Network panel on `/` and `/type/ENTP` → zero third-party font requests; `tests/headers.test.ts` asserts the tightened CSP |
| P2-4 | **One palette everywhere.** Reconcile the rate card (#5B32A8→#4C4899, ink to shipped) and rewrite DESIGN-SYSTEM/BRIEF palette tables to the shipped `palette.ts` values (BRD-5/6, INT-2) | P1 | S | No hex in docs/ that isn't shipped; rate card matches `/partners` | `grep -rn "5B32A8\|6B3BC4\|C9A0FF\|5FE0D6\|FF8FB0" docs/ src/` → only palette.ts-matching values remain (or a test asserts DESIGN-SYSTEM's table against palette.ts) |
| P2-5 | **Drop the glassmorphism.** Marketing masthead `backdrop-filter:blur(10px)` (`marketing.ts:244`) replaced with a solid/95%-opaque paper treatment per doctrine (BRD-7) | P2 | S | No backdrop-filter on any surface; masthead still legible over scrolled content | `grep -rn backdrop-filter src/` → none; visual scroll check |
| P2-6 | **Element hues as the hero (B-fold).** Where marketing needs an accent moment, prefer the four element hues doing semantic work over decorative violet; violet chrome retained for interactive affordances | P2 | M | A stranger's screenshot of any marketing section shows color only where it means something | Design pass recorded against DESIGN-SYSTEM §1's "never use hue for decoration" rule |
| P2-7 | **Compositional grid.** One alignment language across marketing (left editorial) and app home (centered today) (BRD-9) | P2 | M | A stated rule in DESIGN-SYSTEM ("hero surfaces center; document surfaces left", or one choice everywhere), applied to home/app/types | Screenshots before/after; the rule written down |
| P2-8 | **Masthead controls join the glyph language.** Replace `?`, `☾`, `⏻`, `≡` text glyphs with drawn icons from the product's own geometry (BRD-10) | P3 | S | Four icons, one style, aria-labels retained | Visual + `tests/a11y.test.tsx` label assertions still green |
| P2-9 | **Brand asset kit for partners.** Exported mark/lockup/palette/usage one-pager fetchable from `/partners` (BRD-12) | P3 | S | A partner can download the kit without asking | Link on `/partners` → asset bundle |

## P3 — Copy & flow overhaul

| ID | Item | Sev | Eff | Acceptance criteria | Verification |
|---|---|---|---|---|---|
| P3-1 | **Finish the renames, per surface.** One collective noun for the grouping (recommend Camp, already in the plain layer); "currents" wherever Charge/Settle/Broadcast/Absorb appear; "coins" vs "switches" settled one way (COP-4/5) | P1 | M | No surface shows old+new terms for one concept in the same viewport; VOCABULARY.md status block records each decision | `grep -rn "quadra\|Clubs" src/views src/learn` reviewed against the decision; extend the vocab test to ban the retired terms in user-facing strings |
| P3-2 | **FN_LONG register rewrite.** Replace "absolute moral truth / flawless / Simulates the multiverse" with the lexicon's precise register; superlatives reserved for FN_SHADOW (COP-6) | P2 | M | FN_LONG reads as mechanics, not hype; renders on type page, deck, and /read | Editorial diff reviewed; deck rebuild (`npm run cards`) reflects it |
| P3-3 | **One dialect.** British (the voice's dominant dialect); sweep American strays including "Organize vs Gather" over "I organise" (COP-7) | P2 | S | No word appears in both dialects in user-facing strings; choice recorded in VOCABULARY.md | A spelling-variant check over authored string tables (scripted, can live in tests) |
| P3-4 | **Home tiles join the plain-first doctrine.** Rewrite ~6 jargon blurbs or wrap in `Term`; extend the plain-layer jargon test to tile copy (COP-9) | P2 | S | A newcomer's first signed-in screen contains no undefined term-of-art | Extended `tests/plain.test.ts` covers Home tile strings |
| P3-5 | **Vocabulary hygiene sweep.** "Blindspot"→"Blind spot" at source (delete the deck patch); "Hate" reconsidered or documented; "iNtuition"→"Intuition"; "Intraverted" documented in VOCABULARY or retired; superpower/kryptonite singular + documented (COP-11/12/13) | P3 | S | Every term on a shipped surface appears in VOCABULARY.md; SLOT_TAGS consistent with SLOT_NAMES | `grep Blindspot src/` → none; deck patch removed; VOCABULARY entries exist |

**Display & navigation** (from REVIEW §9):

| ID | Item | Sev | Eff | Acceptance criteria | Verification |
|---|---|---|---|---|---|
| P3-6 | **Sticky wayfinding on the tall pages.** Type/sides/lexicon/learn get an in-page nav that docks under the masthead once the top instance scrolls off (reuse the `.persp-bar` sticky pattern), with scroll-spy state and back-to-top (DIS-1) | P1 | M | On `/type/ENTP` at any scroll depth, the section nav is visible and marks the current section; same for lexicon filters | Scripted scroll probe at 25/50/75% depth shows the nav; screenshots in PR |
| P3-7 | **Desktop nav must survive the chat rail.** Default the rail closed on first desktop visit (launcher invites it), or keep a compact tab set visible independent of rail state (DIS-2) | P1 | S–M | A first-run 1440 px visitor sees horizontal navigation without opening the hamburger | Fresh-profile screenshot at 1440/1536 px shows tabs |
| P3-8 | **Fix the masthead two-row band.** Tabs need ~1430 px but collapse only below 1239 px container width; at 1300–1500 px the masthead is 111 px against a 64 px token, hiding deep-linked anchors (DIS-3) | P1 | S | Masthead is one row at every viewport ≥ 640 px; deep-linked section headings land fully visible | Viewport sweep 1240–1600 px: `mastheadHeight === 64`; anchor probe lands heading below masthead; extend `tests/styles.test.ts` to assert the collapse threshold ≥ the tab row's measured width |
| P3-9 | Left-align Home's multi-line explanatory prose (keep the centered H1 gesture) (DIS-7) | P3 | S | No multi-line paragraph on Home is centered | Visual diff |
| P3-10 | Reserve bottom padding for the floating launcher (the `.main:has(.calc-dock)` pattern) so it stops occluding chips/figures on mobile (DIS-8) | P3 | S | Launcher never overlaps interactive or figure content at 390 px | Mobile screenshots of type + lexicon bottoms |

*Flow items from the pending flow audit will extend this phase.* [PENDING-FLOW]

## P4 — Depth & polish

| ID | Item | Sev | Eff | Acceptance criteria | Verification |
|---|---|---|---|---|---|
| P4-1 | **Fix the systemic `dt/dd` markup** (84 nodes on one type page; calculator, matrix, learn) — wrap row layouts in `dl` or change elements | P1 | M | axe reports zero dlitem violations on the seven protocol pages | `ACCEPTANCE-PROTOCOL.md` §5 axe pass |
| P4-2 | **Fix composed contrast** (.gpath-step muted-small ×6) and extend `tests/palette.test.ts` to composed pairs actually used (muted-on-soft, muted-on-sunk) | P1 | S | axe zero serious contrast violations; the new pairs asserted | axe pass + extended palette test |
| P4-3 | **Skip link** (16 tab stops before content today; `.sr-only` + `:focus-visible` already exist) | P2 | S | First Tab reveals "Skip to content"; Enter lands focus in `<main>` | Keyboard walk recorded; a11y test asserts the link |
| P4-4 | **Announce SPA navigation** — focus main (tabIndex −1) or aria-live announcer on route change (`App.tsx:66-77`) | P2 | S | Tab-bar navigation announces the new page to AT | Manual AT check + unit test on the effect |
| P4-5 | **Chat log becomes a log** — `role="log"` on `.rail-log`; verify streaming doesn't spam | P2 | S | Completed replies are announced once | Manual AT check |
| P4-6 | **Onramp fieldset/legend + landmarks** (axe: landmark-one-main, region; radios unbound to their question) | P2 | S | axe clean on `/onramp`; each step's question is the group's legend | axe pass |
| P4-7 | **WiringSchematic sr-only seats** — apply the NetworkRing pattern (per-seat list) to the flagship figure | P3 | S | The eight seat assignments reachable by AT | `tests/a11y.test.tsx` extended |
| P4-8 | **Route-level code-splitting + bundle budget.** `React.lazy` TypeReader/Guide/Matrix/Admin behind existing boundaries; a size assertion so growth is seen (632 KB today, +13%/3wk unwatched) | P2 | M | Initial chunk materially smaller; a test fails if the main chunk exceeds budget | `npm run build` output + the budget test |
| P4-9 | **Asset cache policy under run_worker_first** (QA-REVIEW AR-2; its "if this ever opens up" trigger has fired) — immutable max-age on `/assets/*` | P3 | S | Fingerprinted assets carry `cache-control: public, max-age=31536000, immutable` | curl -D on an asset; `tests/headers.test.ts` extended |
| P4-10 | **QA docs truth pass.** Dated gates addendum (or generated table); secrets-scan item 12 re-scoped to value shapes; triage the five still-open QA-REVIEW items | P2 | S | QA-REVIEW (or successor) matches measured reality; the scan passes on a clean build | Run the protocol §1 + §6; item 12 grep → nothing |
| P4-11 | **Dev serves security headers.** Apply `withSecurityHeaders` to Vite's HTML responses in the dev middleware so CSP breakage surfaces before deploy | P3 | S | `curl -D localhost:5173/type/ENTP` (authed) shows the CSP | curl check in the protocol |
| P4-12 | **Move `TypeReaderLegacy.tsx` out of src/views** (40 KB dead code; correctly tree-shaken; diligence noise) | P3 | S | src/views contains only live views | grep import census; build unchanged |
| P4-13 | **`escapeHtml` in `signInProblem`** (replace the ad-hoc `<>&` strip, `index.ts:362`) | P3 | S | The one interpolation uses the shared escaper | Code review + existing auth tests |
| P4-14 | **README + design-doc truth pass.** Route table adds /bonds, /guide (+ the public surface); engine map adds the 5 missing modules; "no stored matrix" clause gets its one-clause caveat; "no emoji" rule scoped to name /guide as the exception; `Learn.tsx:182` comment fixed (INT-4/5/6/8/9) | P2 | S | README describes the app that ships | Re-run the §7 claim table: claims 6, 7, 12 flip to VERIFIED |

*Illustration and display items from the pending audits will extend this phase.* [PENDING-VISUAL]

---

## The brand fork — what changes under A / B / C

| Item | A · Sharpen (recommended) | B · Ink and element | C · New coordinates |
|---|---|---|---|
| P2-1 mark/logotype | As specified | As specified (mark may adopt the structural motif) | Replaced by new-identity design; **L** |
| P2-2 mark in app | As specified | As specified | After C's mark exists |
| P2-3 self-host type | As specified | Extended: + display face pipeline | Replaced: all-new pairing |
| P2-4 palette reconcile | As specified | As specified, then accent demoted to ink (tokens + marketing chrome) | Dropped — superseded by full re-derivation of `palette.ts` + `palette.test.ts` + every diagram + deck + dark mode; **L** |
| P2-5 backdrop-blur | As specified | As specified | As specified |
| P2-6 hue hierarchy | As specified (moment-level) | Core of the direction: hues become the only color; chrome goes ink | Re-decided in the new system |
| P2-7 composition | As specified | Extended: structural motif (slot column / molecule) as page frame | New layout language |
| P2-8 masthead icons | As specified | As specified | New icon language |
| P1-2 og/favicons | Interim mark acceptable, then P2-1 asset | Same | Blocked on C's mark |
| P1-5 deck visual | Photograph/render existing deck | Same | Deck art itself redrawn (**adds L**) |
| P3/P4 items | Unaffected | Unaffected | Unaffected in content; re-skinned |

Direction C additionally forces: re-derivation of every WCAG pair on both canvases,
regeneration of the 78-card deck art, redraw of ~30 figure components' hue constants, and
re-validation of `tests/palette.test.ts` — the review found no evidence this cost buys
anything the three audiences want (REVIEW §10).

## What NOT to change

REVIEW §13 in full — the derived engine and its verification culture; the empirical
counterweight; the plain-first infrastructure; the honest microcopy register; the
single-exit security architecture; the deck; the MutualLanding diagram; the
dev-runs-the-real-Worker architecture. Any plan item that would weaken one of these is
wrong even if it closes a finding.

[PENDING: display/illustrations/flow items merge + final phase ordering pass]
