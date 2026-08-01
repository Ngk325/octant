# Octant — QA review

Prepared for technical diligence, 2026-08-01. Written for a reader deciding whether to license
or acquire this codebase — someone who does not already trust it and should not have to. It
records what was found, what was fixed in this pass, what was left as an accepted risk and why,
and the manual checks a human should run before each deploy given there is no end-to-end suite.

Verification state at the time of writing, on the review branch
(`claude/octant-typology-review-ftpvoz`):

| Gate | Result |
|---|---|
| `npm test` | **832 passing, 29 files, 0 failing** (two projects: `unit` + `workers`) |
| `npm run typecheck` | clean |
| `npm run lint` (Biome) | 0 errors (7 in-source suppressions, each with a stated reason) |
| `npm run build` | clean · one JS chunk, **558 KB / 178 KB gzip** |

The "540 tests" the README carried for eighteen commits is retired: nothing in the repo
asserted the count, so it drifted silently. This document is now the single dated source for it,
and DEPLOY/README point here rather than pinning a number that will rot.

---

## 1 · Findings

Severity is operational: what breaks in practice, not how it reads. Every "fixed" row is a
commit on the review branch with tests; every line reference is against that branch.

| # | Sev | Finding | File · where | What breaks in practice | Status |
|---|---|---|---|---|---|
| H1 | High | `/api/chat` trusted the client `context` object entirely — no validation, unlike every other field | `worker/chat.ts` (was `:213`) | A `type:"XXXX"` crashed `typeFacts` outside the handler's try/catch → bare 500; a 500-member array inflated the system prompt without bound; free text rode arbitrary lines into the instruction | **Fixed** — `parseContext` validates kind/type/stage, caps members at 16, strips control chars, 400s the malformed; `tests/chat-context.test.ts` |
| H2 | High | Rate limiting per-isolate only | `worker/auth.ts`, `worker/chat.ts` | Workers discard isolates freely, so both brakes reset constantly — a brake, not a wall, as the comments admitted | **Fixed** — Cloudflare rate-limit bindings (GA, free), fail-open; `tests/ratelimit.test.ts`. In-memory brakes kept as dev fallback |
| H3 | High | Chat history scoped by label; bare codes all label `"guest"` | `worker/chatlog.ts:125` | Two people on unlabelled codes could list and read each other's transcripts; and `recordExchange` reassigned ownership to the last writer, so a known threadId was a takeover | **Fixed** — sessions carry a code-digest identity; first writer owns the record; `tests/chatlog.test.ts` |
| H4 | High | No React error boundary | (absent) | A throw in any view blanked the whole document; six render-reachable `!` assertions exist | **Fixed** — route + rail boundaries with a readable fallback; `tests/error-boundary.test.tsx` |
| H5 | High | No CI, no linter, no formatter | (absent) | Every drift in §4 of the findings report happened because nothing watched | **Fixed** — GitHub Actions (typecheck/lint/test/build), Biome linter |
| H6 | High | Security headers on gate pages only | `worker/auth.ts:322` | App shell, assets and API responses carried no CSP, HSTS, referrer or permissions policy | **Fixed** — one header layer at the router exit, CSP hashing the two inline scripts; `tests/headers.test.ts` |
| M1 | Med | Dev server re-implemented the router, partially | `vite.config.ts` | Google, admin and history routes were untestable in `npm run dev`; two routers that disagree breed bugs | **Fixed** — dev loads the Worker's own default export; verified against a running server |
| M2 | Med | Transcript sweep O(all threads) per chat message; no cron | `worker/chatlog.ts:206` | Full KV scan per message against the 100k-reads/day free tier; and the last session of a quiet spell never mailed | **Fixed** — hourly cron `scheduled` handler; sweep off the request path |
| M3 | Med | No test booted the real Workers runtime | (absent) | `run_worker_first`, real KV and `waitUntil` unproven by `npm test` | **Fixed** — `tests/workers/` via `@cloudflare/vitest-pool-workers` |
| M4 | Med | 25 MB of binaries committed at root | repo root | Every clone carried a 24 MB zip + 770 KB docx referenced by one line | **Fixed** (HEAD) — removed with retrieval commands in `classification-report.md`; history not rewritten (accepted risk AR-1) |
| M5 | Med | Accessibility stopped at colour | several components | Malformed ARIA tables, edge data trapped in `role=img`, unfocusable scroll regions, score-only matrix cells | **Fixed** — `tests/a11y.test.ts` |
| M6 | Med | Test-surface soft spots | `tests/` | ~110 of the suite asserts file text, not behaviour; two test names overclaimed; six fixture `ops` fields dead | **Documented** (§4); the overclaims are named for future cleanup, not silently patched |
| M7 | Med | One 558 KB JS chunk, no asset cache policy | build | Under `run_worker_first` every asset load is a billed invocation with revalidation-only caching | **Accepted** (AR-2) with a recommendation; measured, not guessed |
| L1 | Low | "Evagrian eight" sins claim unverifiable | `octagram.ts:34`, `README`, test | The data is right (40/40 vs public diagrams); the historical label was wrong | **Fixed** — wording corrected, direct check substituted |
| L2 | Low | Failed logout presented as success | `App.tsx:74` | `.finally()` redirected regardless of the server's answer | **Fixed** — redirect only on `res.ok` |
| L3 | Low | Chat error bodies named internals to readers | `worker/chat.ts:83` | 401/403/404 messages named `GEMINI_API_KEY` and a source file to every signed-in user | **Fixed** — readers pointed at the owner; specifics to the log |
| L4 | Low | Small doc pointers wrong | `.dev.vars.example`, `GOOGLE-SETUP.md` | A wrong step number; a reference to a non-existent file; Resend advice the runbook contradicts | **Fixed** |

Everything above H-through-L is fixed or explicitly accepted. Nothing critical was found: no
auth bypass, no secret leak, no injection reaching an interpreter, no data-loss path.

---

## 2 · The wall, adversarially tested

Run against the real Worker router on a running server (`npm run dev`, which since M1 executes
the deployed `fetch`), and again inside `workerd` in `tests/workers/wall.test.ts`. Each row is
what was actually attempted and the observed result.

| Attempt | Expected | Observed | Where |
|---|---|---|---|
| Anonymous `GET /` | 200 marketing, **no app markup** | 200; `grep` for `id="root"`, `/assets/`, `/src/main` → 0 hits | live + `tests/marketing.test.ts` |
| Anonymous `GET /type/ENTP` (deep link) | 401, asset store never touched | 401; `tests/workers` asserts `ASSETS.fetch` uncalled | live + workers |
| Anonymous `POST /api/chat` | 401 JSON, not the HTML gate | 401 `{"error":"Not signed in."}` | live + `tests/auth.test.ts` |
| Forged cookie (junk signature) | 401 | 401 | live + workers |
| Tampered cookie (valid payload shape, wrong HMAC) | 401 | 401 | live + `tests/auth.test.ts` |
| Expired cookie (past `exp`) | 401 | 401 | `tests/auth.test.ts` |
| Revoked code replay (code removed from `ACCESS_CODES`) | 401 on next login; existing session dies only on secret rotation | matches; documented in DEPLOY | `tests/auth.test.ts` |
| Blocked Google user with a still-valid cookie | 403 on next non-asset request | 403 "No access" through real KV | `tests/workers`, `tests/google-auth.test.ts` |
| `/api/admin/users` as a non-owner (valid code session) | 403 | 403 | live + `tests/google-auth.test.ts` |
| Signed approve/deny link, tampered | 400, nothing changes | 400 | live + `tests/google-auth.test.ts` |
| Signed approve/deny link, expired (past 7-day TTL) | rejected | rejected | `tests/google-auth.test.ts` |
| Signed link naming user A, opened by whoever | can only ever affect A; GET shows, POST decides | confirmed (mail-scanner-safe two-tap) | `tests/google-auth.test.ts` |
| `GET /api/admin/act?t=forged` | 400 "no longer valid" | 400 | live |
| Marketing `/` probed for app markup | none present | none | `tests/marketing.test.ts` |
| Security headers on a document response | CSP + HSTS + XFO + nosniff + referrer | all present; CSP hashes both inline scripts | live + `tests/headers.test.ts` |
| Malformed chat context past the wall | 400, no 500 | 400 | live + `tests/chat-context.test.ts` |

**The one thing this cannot prove**, stated plainly: that Cloudflare's edge routes every request
through the Worker rather than serving an asset directly. That is the `run_worker_first: true`
property, and it is provable only against the deployed platform. It is asserted as a config value
(`tests/auth.test.ts` JSON-parses `wrangler.jsonc`) and belongs on the regression checklist (§6)
as a `wrangler dev` / deployed `curl` probe. A mock cannot stand in for it, and this document does
not pretend otherwise.

---

## 3 · Engine verification

Every external validation was re-run on the review branch. All hold; none drifted.

| Validation | Claim | Result | Asserted in |
|---|---|---|---|
| Berens "16 Type Patterns" | `stack()` matches published table | **128/128 slots** | `tests/ingested.test.ts` |
| Socionics intertype chart | `REL` matches all cells, clean 16-label bijection | **256/256** | `tests/ingested.test.ts` |
| Second (MBTI-notation) chart | independent transcription agrees | **256/256** | `tests/ingested.test.ts` |
| Octagram dyads/temples | derived membership vs published lists | **16/16 + 16/16** | `tests/octagram.test.ts` |
| Octagram wheels (new) | authored fields vs the eight public diagrams | **40/40** | research-verified; table asserted for internal consistency |
| Empirical counterweight | model DISAGREES with survey (r ≈ −0.15) | holds, negative as intended | `tests/ingested.test.ts` |
| `verify()` structural assertions | model self-consistency | returns `[]` | `tests/engine.test.ts` |
| Port fidelity | all 256 relations/scores/playbooks vs fixture | character-for-character | `tests/engine.test.ts` |

**No headline drift.** The one correction the review forced is editorial, not structural: the
sins list was mislabelled "Evagrian" (L1). The numbers it decorates were and remain right.

---

## 4 · Coverage map

The useful column is the last one. "Asserted" means a test fails if it breaks; "by inspection"
means a human read it and nothing guards it mechanically; "untested" means neither.

| Area | Asserted | By inspection only | Untested |
|---|---|---|---|
| Engine derivation (relations, scores, stacks, sides, ops, gates, playbooks) | All of it, against fixture + external tables | — | — |
| Octagram wheels/themes | membership derived; authored fields for internal consistency; theme grid | per-type pole *meaning* (members-only source, in `UNSETTLED`) | — |
| Access wall | handler logic + real-runtime behaviour (forged/tampered/expired/blocked/revoked) | — | Edge `run_worker_first` routing (platform-only; §2, §6) |
| Google OAuth | state/PKCE/aud/email_verified guards, approval lifecycle | — | **The token-exchange leg**: `completeGoogleSignIn` is only tested on paths that bail before the network call. The Google token endpoint, id-token decode and claim extraction are unexercised |
| Chat proxy | validation, retry, rate limit, error mapping, streaming reframe (happy path) | — | Real Gemini request shape/URL/headers (fetch is stubbed everywhere) |
| Transcript log | append, dedup, TTL, ownership, sweep, mail-on-refusal | — | Real Resend endpoint/auth header (captured but not asserted) |
| Header layer | presence, CSP hashes, HSTS conditionality, passthrough | — | Whether a browser actually enforces the CSP (declaration is tested, not enforcement) |
| Accessibility | ARIA table structure, sr-only edge data, focusable figures, matrix labels, colour contrast | keyboard *operability* of the whole app in a real AT | Screen-reader announcement in an actual reader (NVDA/VoiceOver) |
| Front end | SSR smoke renders of every diagram/glyph/onboarding screen; error boundary in jsdom | click/state flows on most views (calculator answering IS tested; others rendered only) | Full interaction e2e — there is no Playwright suite; `scripts/shots.mjs` exists but is not wired to CI |
| Styles | token contrast, breakpoint discipline (as CSS *source text*) | rendered cascade/specificity | Rendered layout — the source-text tests prove declarations exist, not that they take effect |

Two test names still overclaim their bodies and are called out here rather than quietly patched,
in the posture the suite already uses for its retired assertions: `tests/engine.test.ts`'s
"...coin pole..." test checks no coin pole, and `tests/lexicon.test.ts`'s final
Counterpart-on-the-Cave test is near-vacuous (its guard is always true). Six of eight fixture
`ops` fields are dead data. None of these is a correctness risk; all are cleanup.

---

## 5 · Known limitations and accepted risks

Each with its reasoning, in the same posture the code uses for `UNSETTLED`.

- **AR-1 · Clone weight.** The 24 MB photo zip and the docx were removed from HEAD but remain in
  git history, so a fresh clone still transfers them once. Rewriting history would fix that and
  break every existing clone and PR ref. The owner chose not to rewrite. Retrieval commands are
  in `docs/classification-report.md`. *Accepted: a one-time transfer cost against never breaking
  an existing checkout.*
- **AR-2 · `run_worker_first` billing.** Every asset request is a billed Worker invocation, and
  the single 558 KB chunk is not split. At invite-only scale (a handful of readers) this is a
  rounding error against 100k free invocations/day. If the app opens up, the fix is a `_headers`
  file giving fingerprinted assets a long immutable TTL — which keeps the wall intact, because
  the browser cache is per-already-authenticated-user — plus watching the invocation graph. Not
  done now because it optimises a cost that does not yet exist. *Accepted with a documented
  trigger.*
- **AR-3 · The two instruments are not reconciled.** CSJ and the OPS overlay model a different
  number of psychic parts and give different growth readings for the same type. The app marks
  both faults rather than smoothing them. *This is content, not a defect.*
- **AR-4 · Octagram pole meaning is unsourced.** The geometry is public and matched 40/40; the
  per-type moral reading of each pole lives behind a membership wall this app has not paid. The
  app asserts the geometry and declines the reading, recorded in `UNSETTLED`. *Deliberate: it is
  the one place the product would have to guess, and it does not.*
- **AR-5 · Self-reported stays self-reported.** OPS subtype and Octagram development/focus coins
  default unset and are never derived from a four-letter type. They now persist per type in
  localStorage (owner's decision), which is the app's first per-visitor state and its only one.
- **AR-6 · Rate-limit bindings fail open.** On a binding error a request is allowed. The wall's
  digest comparison is the real defence and a limiter outage must not lock the owner out. *A
  considered trade, not an oversight.*
- **AR-7 · Chat provider is single-vendor.** The app runs on Gemini while the owner's other work
  is on Claude. A provider interface was scoped (~80 lines of `chat.ts`) and deferred: it would
  be an abstraction with one implementation until a second backend is actually wanted. *Deferred
  by decision, priced honestly.*
- **AR-8 · OAuth token exchange is untested** (see §4). The guards around it are covered; the
  network leg is not, because it would require mocking Google's token endpoint. Live sign-in has
  been exercised manually. *Recommended for a future test pass; low risk given the surrounding
  guards.*
- **AR-9 · The transcript log is a non-atomic read-modify-write on KV.** `recordExchange` reads
  the record, checks ownership, appends and writes back; KV has no compare-and-swap, so two
  writes to the *same* thread id at the *same* instant can lose a turn or flip the transient
  owner. The blast radius is small and bounded: it needs two requests colliding on one
  client-chosen thread id in the same moment. For the same user (a duplicated tab) the worst case
  is a lost log line; for two *different* users it additionally requires guessing each other's
  UUID thread id, which the ownership check otherwise refuses. No cross-user *read* results — a
  raced write cannot make a record readable by someone the id was not shared with. The correct
  fix — serialising per-thread writes through a Durable Object — is a real architectural change
  (a new binding, a new failure surface) and is **held for the owner's decision** rather than
  slipped into this pass; at invite-only scale the race is close to unreachable. *Accepted, with
  the DO migration named as the fix if transcript integrity ever needs to be a guarantee.*

---

## 6 · Regression checklist — before each deploy

There is no e2e suite, so a human runs these. The automated gate (`npm test && npm run lint &&
npm run typecheck && npm run build`, all green) is assumed done first.

**Against `wrangler dev` (the real asset router) — the checks `npm run dev` cannot make:**

1. `curl -s -o /dev/null -w "%{http_code}" http://localhost:8788/type/ENTP` → **401**.
2. `curl` a real hashed asset path (`ls dist/assets/index-*.js`) → **401**. A 200 here means
   `run_worker_first` is not holding — the whole wall is off. This is the single most important
   manual check.
3. `curl -s http://localhost:8788/ | grep -c 'id="root"'` → **0** (anonymous `/` leaks no app).

**Against the deployed URL, signed in with a real code:**

4. Deep-link `/pair/ENTP/ENFJ` in a fresh tab (not via nav) loads the reader — SPA fallback.
5. `/type/ENTP`: set an OPS coin, reload → it persists; navigate to `/type/INFJ` → it does **not**
   appear there.
6. `/network` with three people renders the ring; a screen reader (or the DOM) shows the per-edge
   list, not just the average.
7. The assistant answers on `/pair/…` with the specific relation and both ease directions, not a
   generic description.
8. Response headers on a document carry the CSP and it does not block the app (check the browser
   console for CSP violations after a full page interaction).

**Email path (needs `RESEND_API_KEY` + a verified `NOTIFY_FROM`):**

9. A first-time Google sign-in lands on the waiting page **and** the owner receives the
   approve/deny mail. If no mail: `NOTIFY_FROM` is almost certainly still the shared default —
   the single most common deploy failure, documented in `docs/GOOGLE-SETUP.md`.
10. Approving from the emailed link lets that person in on their next reload.
11. Ending a chat (close the tab, or wait for the hourly cron) mails the transcript to the owner.

**Secrets sanity:**

12. Scan the built bundle for every server-only secret shape, not just the Gemini key —
    `npm run build && grep -rE "AIza|AQ\.|GOCSPX-|re_[A-Za-z0-9]|ACCESS_CODES|AUTH_SECRET|GEMINI_API_KEY|GOOGLE_CLIENT_SECRET" dist/` → **nothing**.
    (`GOCSPX-` is the Google client-secret prefix, `re_` the Resend key prefix.)

If any of 1–3 fails, do not ship — the security boundary is compromised. 4–12 are correctness and
feature checks; a failure there is a bug, not a breach.
