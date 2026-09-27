# Octant — acceptance-test protocol

A repeatable protocol for proving a build is fit to ship, written during the 2026-08-20 full
review (`docs/REVIEW-2026-08-FULL.md`). It reconciles with `docs/QA-REVIEW.md` §6 (the
2026-08-01 regression checklist) rather than replacing it: §6's numbered checks are carried
here verbatim by reference, with two corrections noted below. **This document's own first
execution is recorded at the bottom** — a protocol that has never been run is a hope, not a
protocol.

The evidence standard, for every future run of this protocol and every claim in any review
document: **no claim without a command you ran or a file:line you read this session; no
number quoted from another document.** Numbers drift — this review found the README, the
partner terms, and QA-REVIEW itself each carrying counts the code had outgrown.

---

## 1 · Automated gates

Run all four; record actual outputs, not "passed".

| Gate | Command | Pass condition |
|---|---|---|
| Tests | `npm test` | 0 failing, both projects (`unit` + `workers`) |
| Types | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | 0 errors; warnings recorded, count not growing |
| Build | `npm run build` | exit 0; JS bundle size recorded and compared to the last recorded run |

The bundle size is a gate with a memory: it grew 558 KB → 632 KB (+13%) in the three weeks
between QA-REVIEW and this review with nothing watching it. Record the number every run;
treat +5% with no named cause as a failure to investigate, and note that Vite's own
chunk-size warning (500 KB) is now firing on every build.

## 2 · Access for manual checks

- `cp .dev.vars.example .dev.vars`, then `npm run dev`. The dev server runs the **real
  Worker** — whole router, access wall included (`vite.config.ts` `devApi()`), so signed-out
  behaviour is honestly testable locally.
- Sign in: `curl -i -X POST localhost:5173/api/auth/login -H 'content-type: application/json'
  -d '{"code":"let-me-in"}'` → `octant_session` cookie (dev code from `.dev.vars.example`).
- The signed-in `/` renders onboarding until `localStorage["octant.onboarding.done"]="1"`
  (`src/App.tsx:182`); set it (or click through `/welcome`) before checking the home surface.
- Security-boundary checks 1–3 of QA-REVIEW §6 must run against `wrangler dev` (the real
  asset router), not `npm run dev` — unchanged from QA-REVIEW.

## 3 · Route walk

Walk every route below at 1440×900 and 390×844, light and dark (the app resolves
`prefers-color-scheme` into `data-theme` before first paint). Automated capture of all four
combinations per route is ~10 lines of Playwright; the 2026-08-20 run's scripts live in the
review branch's evidence bundle.

**Global pass conditions, every route:** HTTP 200 (or the documented gate response), zero
console errors, no horizontal page scroll at 390 px, dark theme fully converted (no
light-theme remnant panels).

| Route(s) | Additional pass condition |
|---|---|
| `/` signed-out | Marketing page serves (not the app shell); hero headline + primary CTA visible without scrolling at 1440×900; worked-example directions match `ease()`/`relation()` for the pair shown |
| `/partners`, `/compare`, `/compare/{mbti,socionics,big-five}` | Serve anonymously; footer/nav links resolve |
| `/onramp` (steps 1→11) | Each step advances and Back preserves answers; the step-11 email gate's promise matches what the done step delivers |
| `/read`, `/read/:pair` | Serve anonymously; the two directional scores match `ease()` for that ordered pair |
| `/signin` | Anonymous 200; signed-in visitor redirects home; wrong code refuses without lockout of the right one |
| `/welcome`, `/welcome/1..8` | Eight steps, skippable, completing sets the flag and lands on `/` |
| `/` signed-in (onboarded) | Orientation page, not the welcome redirect |
| `/learn`, `/learn/:stage` ×15 | Stage count on index equals `STAGES.length`; every stage renders; prev/next hand off in order |
| `/calculator` | Answering all 8 coins yields a type + "1 of 16 left" narrowing + ranked closest fits; partial answers still rank; a contradictory answer produces the "Not an error" disagreement note, not silence |
| `/read-someone` | Six observation prompts render; scoring resolves through the same `calculate()` |
| `/types` | 16 tiles, group-by toggle works |
| `/type/:type` (spot-check 3) | All sections render; OPS coins persist per-type on reload and do not leak across types |
| `/sides`, `/sides/:type` | Four sides render with per-function detail |
| `/bonds` | Renders; every number matches the engine (asserted by `tests/bonds.test.tsx`) |
| `/pair/:a/:b` (incl. one asymmetric pair, e.g. ENTP/INFP) | Both directional scores shown; Swap ⇄ reverses them; scores match `ease()` each way |
| `/network` | Three people render a ring plus the per-edge list (not just the average) |
| `/matrix` | 256 cells, every cell a link into `/pair` |
| `/lexicon`, `/lexicon/:id` | 103 entries; search and category filters narrow; pairing tables render |
| `/guide`, `/guide/:type` | Renders for a signed-in reader |
| `/admin` (non-owner session) | Refusal page, not a crash and not a blank |

## 4 · Claim spot-checks (content integrity)

Every release that touches marketing copy, README, or `data.ts` re-verifies the numeric
claims nearest the change. The full claim table from the 2026-08-20 review is in
`REVIEW-2026-08-FULL.md` §7; the standing rule:

- Any number printed on a public surface (proof band, partner docs, README) must either be
  **computed at render time from the engine** (as `Home.tsx` does with `STAGES.length`) or
  **pinned by a test** that recomputes it (as `tests/cards.test.ts` does for the deck).
  The hero worked-example swap this review found (P0) is what the absence of that rule costs.

## 5 · Accessibility pass

- `axe-core` against at least: signed-out `/`, `/onramp`, signed-in `/`, `/calculator`,
  `/type/:type`, `/matrix`, one `/learn` stage. Pass: no **serious/critical** violations.
  (First execution found two systemic ones — `dt/dd` outside `dl` across all "row" layouts,
  and `.gpath-step` muted-small text below AA — see REVIEW §8.)
- Keyboard: tab from the address bar to the first content interaction on `/` and
  `/calculator`; count the stops (a skip link is currently absent — 16 stops before content).
- One SPA navigation (tab bar) with a screen reader or the accessibility tree open: the new
  page must be announced (currently silent — REVIEW §8).

## 6 · Corrections to QA-REVIEW §6, carried forward

1. **§6 item 12 (secrets grep) false-positives on every clean build**: the Admin UI's help
   copy legitimately contains the strings `ACCESS_CODES` and `AUTH_SECRET`
   (`src/worker/admin.ts`). Scope the grep to secret *value shapes* only:
   `grep -rE "AIza|AQ\.|GOCSPX-|re_[A-Za-z0-9]{16}" dist/` → nothing.
2. **§6 assumes only two public pages.** The public surface is now `/`, `/signin`,
   `/partners`, `/compare/*`, `/onramp`, `/read/*`, plus `/api/auth/*` and the Stripe
   webhook. Check 3's "anonymous `/` leaks no app markup" extends to each of them:
   `curl -s localhost:8788/<route> | grep -c 'id="root"'` → 0 for every public route.

---

## First execution — 2026-08-20, review branch `claude/octant-review-prompt-00k0hd`

**§1 gates:** tests **1225/1225 passing, 47 files** · typecheck **clean** · lint **0 errors,
5 warnings** (`base.css:121-123` noImportantStyles ×3; `components.css:394,483`
noDescendingSpecificity) · build **clean**, `index-B4qwz5m7.js` **632,308 B / 195 KB gzip**
single chunk + 22.9 KB CSS. All four commands run this session. Baseline drift vs QA-REVIEW
(2026-08-01): tests 832→1225, bundle 558→632 KB, lint warnings 0→5.

**§2 access:** dev server + code login + onboarding flag — all as documented above (each
verified this session; the `.dev.vars` bootstrap message and `App.tsx:182` redirect are how
the two non-obvious steps were discovered).

**§3 route walk:** 44 app/gate routes + 9 signed-out marketing routes + `/read` ×2 walked by
script at all four viewport/theme combinations (206+ screenshots, manifests preserved with
the review evidence). **Zero console errors on every app route.** (The only console noise
anywhere was `fonts.googleapis.com` failing — the review sandbox blocks it; noted as an
environment artifact, though the runtime Google-Fonts dependency itself is REVIEW finding
DIS-7.) Interactive checks run: calculator 8-answer click-through (narrowing verified,
screenshots `flow-calc-after-{1,4,8}.png`), onramp steps 1/2/5/11. Not exercised this run:
`wrangler dev` boundary checks 1–3 (wrangler unavailable in the sandbox — **must run before
next deploy**), email path (§6 items 9–11, needs Resend), OPS coin persistence (§3 type-page
condition; covered by `tests/coin-persistence.test.tsx` but not manually re-checked).

**§4 claims:** 14-claim table executed — 9 verified, 4 drifted (README ×3, partner terms ×1),
1 defensible-with-caveat; full table in REVIEW §7.

**§5 axe:** 7 pages scanned; 2 systemic serious violations found (dt/dd, contrast), plus
moderate landmark/heading-order issues on onramp/calculator/learn — REVIEW §8.

**Verdict of first execution:** the protocol is runnable end-to-end in one session; the
boundary checks that need `wrangler dev` and the email path are the only steps this
environment could not reach.
