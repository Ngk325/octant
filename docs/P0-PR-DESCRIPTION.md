<!-- Draft PR body for claude/octant-p0-fixes. Paste into the PR at
     https://github.com/Ngk325/octant/pull/new/claude/octant-p0-fixes
     (this session could push but not open PRs). Delete once the PR exists. -->

> [!IMPORTANT]
> ## Owner action first — P0-7: verify Workers Builds deploys production only from `main`
> During the review, docs-only pushes to a **non-default branch** each triggered a Cloudflare Workers build that the PR bot labeled **"production — Deployment successful"** (typology service). This session cannot see the Cloudflare dashboard, so this is unverified either way — please check before anything else:
> 1. Cloudflare dashboard → Workers & Pages → the typology Worker → **Settings → Builds**: confirm the production branch is `main` and non-`main` pushes build **previews** (or nothing).
> 2. Exact check: push a trivial commit to any non-default branch → the PR bot should report a **preview** (or no) build, and the production deployment id in the dashboard should be unchanged.
> 3. If branch pushes DO deploy production: **this branch's pushes may already be live.** Every push here was fully validated (all tests/typecheck/lint/build green before each push), but fix the Builds config before merging anything else.

Implements phase P0 of **UPGRADE-PLAN.md P0 (PR #56)** — the seven fix-before-anything items. Baseline note: `main` had advanced past the review's snapshot (1225 tests/47 files); the measured baseline here was **1297 tests / 51 files**, all green, and the branch ends at **1315 / 52**, all green.

---

### P0-1 · Hero worked example (direction swap)
`HERO_READING` showed 44/"Examined"/the blind-spot gloss on the **ENTP → INFP** row — the direction the engine scores 34/"Examiner" — and vice versa, contradicting the engine, the app, and the public `/read/entp-and-infp`.
**Change:** the panel is now rendered from the engine (`ease()`, `relation()`, `REL_NAME`, `REL_DEF`) per direction, so it cannot drift again.
**Acceptance/verification:** new test in `tests/marketing.test.ts` parses each rendered hero row and asserts its score and relation name equal the engine's output for the direction its label names. Manual: `curl localhost:5173/` shows ENTP→INFP 34/Examiner, INFP→ENTP 44/Examined — matching `/read/entp-and-infp` (34/44). ✅

### P0-2 · The derived-or-pinned rule
Six drifted public numbers fixed and pinned:
- README "thirteen-stage course" ×2 → fifteen (15 ship; `STAGES.length`)
- README "all 100 lexicon entries" → 103 (`ENTRIES.length`)
- `docs/PARTNERSHIP-TERMS.md` "thirteen-stage" → fifteen
- `docs/PARTNERSHIP-TERMS.md` "A→B and B→A are different numbers, always" → reworded to the truth: 64 of the 240 ordered cross-type pairs differ (the four asymmetric relations); the rest score the same both ways
- `docs/PLATFORM-BACKPORT.md` "there are 14" → 15
- The marketing proof band's "27%" was correct but unpinned — now pinned

**Acceptance/verification:** new `tests/claims.test.ts` recomputes each claim from the engine (stage count, lexicon count, asymmetric fraction with its denominator stated, the hero's "Ten points apart") and greps README/PARTNERSHIP-TERMS/the rendered marketing page for the pinned values; 256, 128/128 and r −0.15 are referenced to their existing pins. `grep -rn "thirteen-stage\|all 100 lexicon" README.md docs/PARTNERSHIP-TERMS.md` → no matches. ✅ (9 tests)

### P0-3 · Retire the six pre-rename relation names in `REL_FRAME`
The six frames opening "Identity. / Activity. / Mirror. / Business. / Super-Ego. / Conflict." now open with the shipped names Twin / Spark / Opposite hand / Colleague / Standoff / Headwind; the four directional frames (SR/SV/BR/BE) also now open with Examiner / Examined / Upstream / Downstream, so **all sixteen** frames open with their `REL_NAME`. `curriculum.tsx` line 681's "Conflict" label → "Headwind".
**Acceptance/verification:** new assertion in `tests/lexicon.test.ts`: `REL_FRAME[c].startsWith(REL_NAME[c] + ".")` for every RelCode. The engine fixture test (`tests/engine.test.ts`, playbook bodies vs the retired Python engine) still passes character-for-character — only opening sentences changed. ✅

### P0-4 · A true sign-in path for payers
The pricing card promises "payment unlocks your account automatically — sign in with Google right after and you're straight in", but `/signin` unconditionally said "you will wait until they approve you".
**Change:** when Stripe (webhook secret + USERS KV) and Google are both configured, the gate shows "Just subscribed? Sign in with Google using the email you paid with — payment unlocks your account automatically", and the owner-approval sentence is scoped to the non-payer path ("Not a subscriber? … without a subscription you will wait…"). Unconfigured deployments render exactly the old copy.
**Acceptance/verification:** two new tests in `tests/marketing.test.ts` render the gate under both env configurations. ✅

### P0-5 · Close the onramp token replay
`verifyStartToken` checked only signature + age on `seal({t: now})` — one honestly-earned token could be replayed with unlimited `email=` values, each triggering a lead capture + an Octant-branded email + KV writes for a full hour.
**Change:** the start token now carries a random nonce and is **single-use per address**: the first capture records which (normalised) address consumed the nonce in LEADS KV; the same address again is a harmless done-page reload (idempotent, no second send); any other address → **403, no capture, no send**. A new `ONRAMP_LIMITER` rate-limit binding (`wrangler.jsonc`, 10/min per connecting IP, same degrade-open posture as `LOGIN_LIMITER`) additionally caps capture attempts, closing the fresh-token-per-address loop. Funnel browsing never consumes the limiter.
**Acceptance/verification:** new worker tests: same token + second email → 403 and zero `sendMail` calls; limiter denial → 429 with no capture; limiter untouched by ordinary step renders; the normal funnel walk (all 12 steps, capture, idempotent reload) still completes — existing tests unchanged and green. ✅

### P0-6 · Make the onramp's promises true
Copy path chosen (extending to four coins was not small against the funnel's fixed 12-step/dot-progress structure):
- Hero CTA note: "Free, no account — a two-minute teaser: two of the eight questions, no scoring you can fail." (was "Eight either-or questions…")
- The "Yourself" route card made the same eight-for-free promise — now "Two either-or questions preview your pattern, free; the full instrument's eight find it."
- Email step retitled by what it sends: "Get your two-minute explainer." (was "See your directional reading.")
- Boundary guards: with no coins (field = 16) or invalid coins (field = 0), the step-8 interstitial and the done step now render "Your pattern is one of the sixteen." instead of "one of about 16 of the sixteen" / "0 of the sixteen"; boundary field sizes are also withheld from the explainer email, which falls back to its generic body.

**Acceptance/verification:** CTA note string pinned in `tests/marketing.test.ts`; email-step title and both boundary cases (both steps × both boundaries, plus the genuine-narrowing case) pinned in `tests/onramp.test.ts`; live check on the dev server confirms all three. ✅

### P0-7 · Deploy-config check
Owner action — see the callout at the top of this description.

---

## Validation

Baseline on `origin/main` before any change, and again before push (all commands from the repo root):

| Check | Baseline (origin/main) | This branch |
|---|---|---|
| `npm test` | 1297 passed / 51 files | **1315 passed / 52 files** |
| `npm run typecheck` | clean | clean |
| `npm run lint` | 0 errors, 5 warnings | 0 errors, 5 warnings (same pre-existing) |
| `npm run build` | ✓ built | ✓ built |

Live smoke on the real worker (`npm run dev` with `.dev.vars`): hero rows match the engine and `/read/entp-and-infp` (34/44); `/onramp?step=11` boundary and invalid-coin cases render the fallback headline; `/onramp?step=10` shows the explainer title; `/signin` under a codes-only env shows the unchanged copy.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01U86HgsNRx8AahrZSZyrfHN
