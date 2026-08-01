# Review findings — phases one and two

Date: 2026-08-01. Full technical and editorial review of Octant at `c7ba39b`, before any
change is made. Everything below was verified against the working tree: the suite was run
(776 passing), the build was run (clean, 487 KB single JS chunk), and every claim carries a
file reference. Phase three (the upgrade) does not start until the owner has read this and
answered the questions at the end.

Verification state at review time: `npm test` → 776 passed / 22 files · `npm run typecheck`
→ clean · `npm run build` → clean.

---

## 1 · What was confirmed working

The things the README stakes its reputation on all hold at HEAD:

| Validation | Result |
|---|---|
| Berens 16 Type Patterns vs `stack()` | 128/128 (`tests/ingested.test.ts`) |
| Socionics intertype chart vs `REL` | 256/256, clean 16-label bijection |
| Second (MBTI-notation) intertype chart | 256/256 |
| Octagram dyads and temples vs published lists | 16/16 + 16/16 (`tests/octagram.test.ts`) |
| `verify()` structural assertions | empty — model holds |
| Access wall unit surface | anonymous → no asset fetch; forged/tampered/expired cookies refused; fail-closed 503 (`tests/auth.test.ts`) |
| **New this review:** all 8 authored wheels vs the public wheel diagrams | **40/40 fields** — origin, virtue, sin, shadow pole, aspirational pole all match the images published in "The 8 Temple Wheels of the Octagram" (csjoseph.life, Oct 2022) |
| **New this review:** crisis-to-side mapping vs public source | Matches. The app says midlife → subconscious, three-quarter-life → unconscious (`src/learn/curriculum.tsx:428-430`, `src/engine/context.ts:154`), which is exactly the public S17 E14 transcript's mapping (quarter-life → ego, midlife → subconscious/humility, three-quarter → unconscious/wisdom, meaningful death → superego/mastery). |

The review brief's own suggestion that midlife maps to the unconscious was wrong; the app
agrees with the source and should not be changed there.

---

## 2 · Findings

Severity: what breaks in practice, not how embarrassing it is. Status is a proposal —
nothing is fixed yet.

### High

**H1 · `/api/chat` trusts the client's `context` object entirely.**
`src/worker/chat.ts:213` passes `body.context` to `buildSystemInstruction` with no
validation, in a handler that carefully validates everything else (model allowlist,
message count, char count, threadId regex). Three consequences:
(a) a malformed `{kind:"type", type:"XXXX"}` throws inside `typeFacts` → unhandled 500,
outside the handler's only try/catch (`src/engine/context.ts` → `core.ts:37`);
(b) `network.members` is uncapped — `context.ts:232-235` builds n(n−1)/2 pairwise lines, so
a crafted POST inflates the system instruction without bound, burning Gemini quota
(`MAX_CHARS` guards only `messages`);
(c) free-text fields (member `name`, `learn.title`, `lexicon.term`) are interpolated into
the system instruction verbatim — the README's claim that "a caller cannot edit the
grounding out of the request" is true, but a caller can *append* arbitrary instruction text
above the conversation, which is the same capability by another door.
Proposed: validate `context` against a schema (kind discriminant, type codes against
`TYPES`, member cap, name length cap), delimit user-supplied strings in the prompt, and put
`buildSystemInstruction` inside error handling that returns structured JSON.
Status: fix in phase three (worker-correctness stream).

**H2 · Rate limiting is per-isolate and the platform now has a real answer.**
`src/worker/auth.ts:67-86` (brute-force brake) and `src/worker/chat.ts:138-149` (chat
throttle) hold Maps in module scope; Workers discard and duplicate isolates freely. The
comments are honest about this. Evaluation against the free-tier constraint:
- **Cloudflare rate-limiting binding — recommended.** GA since 2025-09-19, config-only
  (`ratelimits` in wrangler.jsonc, needs wrangler ≥ 4.36), no documented plan restriction
  or price. Per-location and eventually consistent, which is exactly the "brake, not a
  wall" posture the code already documents — but shared across isolates.
- KV — unsuitable: 1,000 writes/day free, 1 write/sec/key, eventual consistency.
- Durable Objects — works (SQLite-backed DOs are on free tier) and is the only *accurate*
  option, but is a new moving part and burns the 100k DO-requests/day budget on every
  login attempt. Not worth it at this scale.
Status: fix in phase three (binding for both brakes; keep the in-memory Map as the
zero-config dev fallback, same degradation pattern as `notify.ts`).

**H3 · Invite-code chat histories collide on the label.**
`belongsTo` (`src/worker/chatlog.ts:125-127`) scopes code-session threads by `label`, and
`parseCodes` (`src/worker/auth.ts:100-102`) defaults every bare code's label to `"guest"`.
Two people using unlabelled codes can list and read each other's transcripts via
`/api/chat/history`. Same class: `recordExchange` overwrites `rec.who` with the latest
writer (`chatlog.ts:109`), so whoever writes to a threadId last owns its whole history;
threadIds are client-chosen (`validThreadId` accepts any `[A-Za-z0-9-]{8,64}`), mitigated
only by UUID entropy in the default client.
Proposed: scope code-session threads by code digest rather than label; never let an append
re-assign an existing record's owner.
Status: fix in phase three.

**H4 · No React error boundary.**
Confirmed absent (no `componentDidCatch` / `getDerivedStateFromError` anywhere). Six
render-reachable throw sites exist, including `lexicon.ts:858`'s regex non-null assertion
and `octagram.ts:225`'s `WHEELS.find(...)!`. A throw blanks the page with no message.
Status: fix in phase three (resilience stream) — one boundary at the route level with a
fallback in the app's own typography.

**H5 · No CI, no linter, no formatter.**
No `.github/workflows`, no ESLint/Biome, no Prettier. `npm test` and `npm run typecheck`
run only when someone remembers; `scripts/shots.mjs` (the only rendered-output check) is
not even an npm script. Every docs drift in §4 happened because nothing was watching.
Status: fix in phase three, first — CI should exist *before* the dependency upgrades so
each upgrade commit is proven green.

**H6 · Security headers are one line deep.**
`x-frame-options: DENY` + `referrer-policy: no-referrer` exist only on the worker-rendered
gate pages (`auth.ts:322-332`). App shell, assets and API responses carry nothing: no CSP,
no HSTS, no referrer policy, no permissions policy. What a CSP must allow, concretely:
- `script-src`: the inline theme-resolution script in `index.html` (hash it or move it);
- `style-src`: `'unsafe-inline'` or hashes for the worker-rendered pages' inline `<style>`,
  plus `https://fonts.googleapis.com` for the app;
- `font-src`: `https://fonts.gstatic.com`;
- `connect-src 'self'` (chat streams same-origin);
- `img-src 'self' data:` (favicon is a data URI).
Self-hosting the two font families would remove the Google endpoints entirely — which also
stops leaking every authenticated reader's IP and timing to Google from behind a private
wall — and permits a strict CSP. Recommended.
Status: fix in phase three (one header layer applied to every response the Worker returns,
asserted in tests).

### Medium

**M1 · The dev server re-implements the router, in reduced form.**
Refinement of the brief's claim: `vite.config.ts` *does* load the real `handleAuth` /
`requireAuth` / `handleChat` / `marketingPage` via `ssrLoadModule` — the wall itself is not
duplicated. What it duplicates is `index.ts`'s top-level dispatch, minus the Google routes,
`/api/admin/*`, `/api/chat/history`, `/api/chat/thread/*`, and with `/api/chat/end`
stubbed. Those five surfaces are untestable in `npm run dev`.
Proposed: export a single `route(request, env, ctx)` from `src/worker/index.ts` whose
`ASSETS.fetch` is injectable; production wraps it with the real binding, the Vite plugin
wraps it with `next()`. One implementation, no drift.
Status: fix in phase three.

**M2 · Transcript sweep and history listing are O(all threads) per call.**
`sweepIdle` runs on **every** `/api/chat` message and does a full KV list plus one read per
thread (`chatlog.ts:206-224`); `listThreads` does the same per history open. KV free tier
is 100k reads/day; cost grows linearly with accumulated threads for as long as records live
(90 days). No cron trigger exists in `wrangler.jsonc`, so the sweep has no other invoker.
Proposed: sweep on a sampled basis (e.g. 1-in-N requests) or add a cron trigger; index
threads per user (prefix keys with owner digest) so listing reads only the caller's.
Status: fix in phase three (worker-correctness stream); the key-schema change must keep old
records readable or accept 90-day natural expiry, stated either way.

**M3 · No test boots the actual Workers runtime.**
Every worker test calls handlers with hand-built env objects and an `ASSETS` stub; the
suite says so itself (`tests/auth.test.ts:341-343`). `run_worker_first`,
`not_found_handling`, real KV, and `waitUntil` semantics are unproven by `npm test`.
`@cloudflare/vitest-pool-workers` 0.20.x covers exactly this but requires Vitest ^4.1 →
Vite ≥ 6, so it lands at the end of the toolchain ladder.
Status: fix in phase three (integration tests as part of the Vitest 4 commit).

**M4 · Repo weight: 25 MiB of pack for two files.**
`typology-photos-normalized 2.zip` (24 MB) and `Four Sides of the Mind.docx` (770 KB),
both added in `0dafb68`, never modified. Removing them from HEAD alone does not shrink
clones — they stay in history. Options: (a) move to a GitHub Release asset and delete from
HEAD, accepting the historical weight; (b) additionally rewrite history
(`git filter-repo`) and force-push, shrinking every future clone to <1 MB — destructive,
needs owner say-so. `docs/classification-report.md:3` references the zip and would need its
pointer updated either way. `.gitignore` is otherwise consistent with what is tracked.
Status: question for the owner (§6).

**M5 · Accessibility: strong bones, four real gaps.**
The good news first: no SVG in the app takes a click handler — every interaction is a real
button or link — and reduced-motion is handled globally in CSS. The gaps:
(a) `NetworkRing`'s per-edge `<title>` labels (relation + both ease directions) are
inside `role="img"`, which collapses the subtree — screen readers get only "Group of N,
average ease X", and the caption says "Hover a line" (mouse-only);
(b) `QuadraFunctionGrid` and `InvolutionTable` declare `role="table"`/`role="row"` with no
`role="cell"` descendants — malformed ARIA;
(c) horizontal-scroll figure containers are unreachable by keyboard (`tabIndex` appears
nowhere in `src/`);
(d) Matrix cells' accessible name is the bare score number; the relation name lives in a
`title` attribute.
Status: fix in phase three (accessibility stream), each as an assertion where possible.

**M6 · Test-surface soft spots.**
~110 of the 776 tests assert file *contents* (CSS/source regex) rather than behaviour —
legitimate but worth naming in the coverage map. Specific defects:
`tests/engine.test.ts:180`'s name promises coin poles it never checks;
`tests/lexicon.test.ts:200-206` is near-vacuous (its guard is always true and it never
tests the Counterpart claim it quotes); `tests/onboarding.test.tsx:22` hardcodes
`SCREEN_COUNT = 8` locally, so a ninth screen would not fail anything;
`tests/notify.test.ts:51` pins the default sender that
`docs/COWORK-SETUP-RUNBOOK.md:79-95` documents as the known-broken one — the test enforces
the trap. Six of eight fixture `ops` fields are dead data (see §4, "four assertions").
Status: fix the defects in phase three; name the regex-tests honestly in the QA coverage
map.

**M7 · Bundle and caching.**
One 487 KB JS chunk (158 KB gzip), no code splitting, and no cache policy: with
`run_worker_first: true` every asset request is a billed Worker invocation and assets ship
with revalidation-only caching. A `_headers` file giving fingerprinted `/assets/*` a
long immutable TTL keeps repeat loads cheap **without touching the wall** — the browser
cache is per-already-authenticated-user, and `no-store` on HTML keeps the gate decision
fresh. Free-tier maths at current scale: a handful of readers × a handful of invocations
per cold load against 100k requests/day — a rounding error, as the wrangler comment says.
Splitting the vendor chunk is optional polish, not need.
Status: `_headers` + measurement in phase three; code-splitting only if the owner wants it.

### Low

**L1 · "Evagrian" is the wrong word (the data is right, the label is not).**
The eight sins and their pairings match CS Joseph's published wheels 40/40 — the
transcription check *passes*. But the claim in `README.md:125`, `src/engine/octagram.ts:34`
and `tests/octagram.test.ts:92` that these are "the classical eight of the Evagrian
tradition" fails verification: Evagrius's logismoi include sadness and acedia and **not
envy**; envy enters with Gregory the Great, who also merged vainglory into pride. The
app's list is the Evagrian set minus sadness, plus Gregorian envy, with vainglory kept
separate — a lineage, not the classical list. Similarly only two of the eight virtue
pairings (Chastity↔Lust, Humility↔Pride) are the traditional contraries; the other six are
CSJ coinages. For a codebase whose brand is not asserting the unverifiable, the fix is a
wording correction, not a data change.
Status: fix in phase three (content stream).

**L2 · Failed logout presents as success.** `App.tsx:74-77` — `.finally()` with no status
check; the redirect fires regardless. Status: fix in phase three.

**L3 · Chat error bodies are written for the owner but served to every reader.**
`upstreamMessage` 401/403 tells any user to "check that GEMINI_API_KEY is set… DEPLOY.md
step 2"; the 404 branch names `src/worker/chat.ts` (`chat.ts:83-89`). Not a secret leak,
but internals in end-user responses. Status: fix in phase three (structured errors).

**L4 · Small doc pointers.** `.dev.vars.example:5-6` cites "DEPLOY.md step 3" for secrets
(it is step 2); `docs/GOOGLE-SETUP.md:9` references `OCTANTSETUPSTATUS.md`, which does not
exist; `GOOGLE-SETUP.md:60-62` teaches the Resend shared-sender configuration the runbook
documents as silently broken. Status: fix in phase three (docs pass).

---

## 3 · The brief's starting threads — confirmed, extended, refuted

| Thread | Verdict |
|---|---|
| Docs have drifted | **Confirmed, worse than described** — see §4. |
| Dev server reimplements the router | **Refined** — the wall is shared via `ssrLoadModule`; only the top-level dispatch is duplicated (M1). |
| Rate limiting per-isolate | **Confirmed**; recommendation is the now-GA rate-limiting binding (H2). |
| Security headers one line deep | **Confirmed**; CSP specifics enumerated (H6), plus the Google Fonts complication the brief didn't mention. |
| No CI, no linter | **Confirmed** (H5). |
| Repo weight | **Confirmed**; both files in one commit, so history rewrite is clean if wanted (M4). |
| No error boundary | **Confirmed**, with six live throw sites (H4). |
| Test-count claim | **Both numbers wrong.** README says 540; the brief estimated ~327 static blocks; static count is 349, but `it.each` expansion makes the true runtime count **776** (measured). The README undercounts by 236. `docs/HANDOFF.md`'s 715 is also stale. |
| Coverage shape | **Confirmed** — no coverage config, no runtime-boot test; `vitest-pool-workers` is viable but gated on the Vitest 4 ladder (M3). |

## 4 · Where the written record contradicts the code

The full audit is long; these are the items that would mislead a reader today.

1. **README describes the app as of PR #2 plus the Octagram.** Google sign-in with owner
   approval, `/admin`, the signed approve/deny email links, the marketing front door with
   live Stripe pricing, chat transcript logging (90-day KV TTL, mailed to the owner), and
   the eight-screen onboarding gate — roughly 130 tests' worth of shipped subsystem —
   appear nowhere in it. `README.md:188` still says access is by invite code only.
2. **README's vocabulary is a generation behind the app.** It speaks
   Hero/Parent/Child/Inferior/Nemesis/Trickster/Demon and Duality/Mirage/Business/Kindred;
   the app ships Lead/Support/Delight/Cave/Doubt/Scold/Blind spot/Dread and
   Counterpart/Near fit/Colleague/Cousin (`data.ts:96-113,666`). README's own worked
   example ("it answers with Mirage, Nemesis Ni and Trickster Fi", `README.md:220`) is
   vocabulary the assistant is explicitly instructed never to use (`context.ts:143-145`).
3. **"No lookup tables" is overstated.** `ease()` is a lookup into the authored 16-value
   `REL_SCORE` ramp (`core.ts:101`, `data.ts:132-149`); `ops.ts:323-325` hardcodes a
   `DIRECTING` set feeding coin 7; `empirical.ts:58-75` is a 16×16 matrix (deliberate — it
   is the counterweight — but unlisted in README's module map, as are `functions.ts` and
   `translation.ts`). "The same 2 KB of seed data" describes ~10% of `data.ts`; the rest
   is authored copy, which the file's own header admits is now edited directly, against
   README's "GENERATED… regenerating is not part of the build".
4. **"Four retired assertions" is wrong twice.** `tests/engine.test.ts` says "two errors";
   git history shows **six** deleted fixture comparisons (`demonObs`, `demonDec`,
   `primary`, `demon`, `middles`, `stack`), of which `middles`/`stack` were retired with
   no stated reason. README:172 says four.
5. **Test count**: 540 (README, DEPLOY) and 715 (HANDOFF) vs 776 actual.
6. **DEPLOY.md**: "`/` redirects to `/calculator`" (it renders Home, onboarding, or
   marketing depending on state); "Three secrets" (seven are live, plus two optional
   knobs); no mention of either KV namespace.
7. **`docs/NEXT-BUILD.md`** opens "Nothing here is built yet" and then describes a layer
   that is built, tested (56 octagram tests) and publicly validated. Its §6 sourcing plan
   is now largely *answered* (see §5). Disposition: archive with a date, port §7 Q3 (the
   one live question) to wherever the owner wants open questions kept.
8. **Docs disposition summary**: archive `NEXT-BUILD.md`, `research-notes.md`,
   `INGESTION-PLAN.md` (+ keep `classification-report.md` and `docs/transcripts/` as the
   provenance record); fix status headers in `VOCABULARY.md` (self-contradictory:
   "not yet implemented" vs "Shipped" both present) and `HANDOFF.md` (warns about a
   landmine fixed in the same PR that added the warning; calls the built onboarding
   "not built"); recount `DESIGN-CATALOGUE.md` (says 61 lexicon terms lack figures;
   the true undrawn set is 8); reconcile `GOOGLE-SETUP.md` with the runbook.

## 5 · Research

### Track A — platform currency (verified against npm and vendor docs, 2026-08-01)

Current: React 19.2.8 · react-router 8.3.0 (v7 line at 7.18.2; **RR8 requires React
≥ 19.2.7**) · Vite 8.2 (Rolldown/Oxc) · Vitest 4.1.10 · TypeScript 7.0.2 stable (Go-native;
6.0 is the last JS-based release and the conservative target) · Wrangler 4.118 (repo is
already on 4.114 — the brief's "3.x" was wrong; this one is nearly current).

Key chain: **`@cloudflare/vitest-pool-workers` 0.20.x needs Vitest ^4.1 → Vite ≥ 6 →
Node ≥ 20** (Wrangler wants Node ≥ 22). Real Worker integration tests therefore sit at the
top of the ladder, not the bottom.

Recommended order (each its own revertible commit):

1. **CI workflow first**, on current versions — typecheck + test + build on push/PR, so
   every subsequent step is proven. Node 22 in CI from day one.
2. **Lint + format** (Biome recommended: one tool, fast, configured to the codebase as
   written — no repo-wide churn commit).
3. **TypeScript 5.6 → 6.0** (set explicit `types`; strict already on). TS 7.0 as a
   separate trivially-revertible finisher — CLI-only typecheck qualifies for it.
4. **react-router-dom 6.26 → 6.30.4 + all v7 future flags → react-router 7.18** —
   near drop-in for a declarative SPA.
5. **React 18.3 → 19.2.8** — codemods; `useRef` argument; `act` import; @types bump.
   18.3 was designed as the stepping stone; the app has no legacy-API usage patterns
   (no propTypes/defaultProps/string refs found).
6. **Vite 5.4 → 8.2 + plugin-react 6** — the biggest behavioural change (Rolldown/Oxc);
   fall back to Vite 7.3 + plugin-react 5 if anything is rough.
7. **Vitest 2.1 → 4.1 + `@cloudflare/vitest-pool-workers`** — projects config: jsdom/node
   project for the existing suite, Workers project for new integration tests against real
   `run_worker_first` semantics.
8. Optional finishers: react-router 8, TypeScript 7.

Cloudflare platform notes that matter to this repo: `run_worker_first` now also accepts a
glob array with negations — **do not use it**; the boolean stays, exactly as the wrangler
comment insists, because a route list revives the original leak. Asset requests are free
*only* when they bypass the Worker; through `run_worker_first: true` they are billed
invocations and 429 past the free 100k/day. The rate-limiting binding is GA (H2). A
`_headers` file controls asset cache-control without code (M7).

### Track B — the domain material (public-source research, citations in the PR)

**Settled publicly** (all from csjoseph.life, primarily the Oct 2022 "8 Temple Wheels"
article and the Jul 2023 "Four Themes" article):
- **Eight wheels, two per temple** — stated verbatim and shown as eight diagrams. The
  eight-vs-four question in `NEXT-BUILD.md` §6 is closed: 4 temples × 2 wheels.
- **Wheel geometry** — center origin, top Living Virtue, bottom Deadly Sin, **left Shadow
  Pole, right Aspirational Pole**; UD sits nearer the shadow pole, SD nearer the
  aspirational pole (public UD-vs-SD transcript). The app's chosen orientation matches.
  `UNSETTLED` #1 can be upgraded from "taken on pattern" to "publicly documented", with
  one honest caveat kept: the source explicitly resists a moral reading ("your Deadly Sin
  is not always 'bad'").
- **All 40 authored wheel fields match** the public diagrams (§1).
- **Development near-fixed in childhood, focus mutable; Joy/Decay/Hope/Despair with
  seasons** — verbatim in the Four Themes article. (The word "coin" is the app's framing,
  not public CSJ vocabulary — worth one clarifying sentence.)
- **Decay as refinement** — "To 'Decay' is to burn away all that is unnecessary… the
  variant most focused on refinement" is public and verbatim. The engine already carries
  this reading (`octagram.ts:294`); `NEXT-BUILD.md` §5's ask is, in fact, mostly done.
  What remains: the per-side crisis copy in `sides.ts` can cite it, and the flat spots are
  small.
- **Crisis mapping** — public and matches the app (§1).

**Stays unsettled, honestly:**
- Per-type pole semantics (which behaviours mark each pole for each type) — members-only
  (Season 7 Part 2, the 16 Deadly Sins lectures; Season 32 per-type Octagram variants).
- The Cognitive Orbit/Reflection/Axis temple-interaction material (`UNSETTLED` #2) — no
  public cross-check found; stays as-is.
- How focus interacts with the wheel (`UNSETTLED` #3) — still thin publicly; stays.
- To settle those, the owner would need: S7p2 lecture transcripts, Season 18's full run,
  Season 32 per-type episodes, Season 34 beyond Ep. 1 (Journeyman membership), dropped
  into the repo like the image batch was.

**One correction the research forces:** the "Evagrian" label (L1).

## 6 · Questions for the owner — answers change the plan

1. **Repo history rewrite?** Moving the zip + docx to a GitHub Release and deleting from
   HEAD is safe and reversible, but clones stay 25 MiB unless history is rewritten and
   force-pushed. Rewrite (smaller forever, breaks existing clones/PR refs) or accept the
   weight (nothing breaks)?
2. **How far up the ladder?** Everything through step 7 (Vitest 4 + Worker integration
   tests) is the recommended stopping point. RR8 and TS7 are cheap finishers but add two
   more majors in one review. Full ladder, or stop at step 7?
3. **Pluggable chat provider?** Honest estimate: the Gemini specifics live in ~80 lines of
   `chat.ts` (endpoint, SSE frame shape, header). A provider interface is a day of work
   including tests, and worth it **only** if a Claude backend is actually intended soon —
   otherwise it is an abstraction with one implementation, and I would not build it yet.
   The H1 context validation is worth doing regardless and does not depend on this. Build
   it now, or note it as deferred?
4. **Persist the self-reported coins?** OPS subtype and Octagram coins are ephemeral
   component state today, reset on every reload (`NEXT-BUILD.md` §7 Q3, still the one live
   question in that file). Persisting to `localStorage` is small and stays self-reported;
   it is also the app's first per-visitor profile state, which you flagged as a deliberate
   decision. Do it, or leave ephemeral?
5. **Self-host the fonts?** Removes the only third-party request behind the wall and
   enables a strict CSP (H6). ~100 KB of woff2 in the repo. Any reason not to?

Phase three begins on your word, in this order: toolchain (CI first), security, worker
correctness, resilience/accessibility, content, docs — small commits, each with its tests.
