# Octant upgrade — next-steps brief (for a Cowork session)

Written 2026-08-24. This is a self-contained brief: hand it to a Cowork session (or work
it by hand) with GitHub, Cloudflare, and Stripe access. It needs no context beyond what is
written here. When its tasks complete, update or retire this file rather than letting it
drift.

## Situation in four lines

1. A full review of Octant shipped on **PR #56** (draft, docs-only): audit, phased
   upgrade plan (`docs/UPGRADE-PLAN.md`), acceptance protocol, evidence, archive.
2. The owner approved the plan and chose brand **Direction A + two B-folds + a
   memorability mandate** (recorded in the plan, §P2-0).
3. Phase **P0 is implemented and validated** on **PR #57** (draft, code): hero direction
   swap, claim-pinning tests, relation-name fixes, payer sign-in path, onramp token +
   copy fixes.
4. Both PRs have been quiet drafts since 2026-08-20. Everything below is unblocked only
   by the tasks in this file.

## Task 1 — Verify the Cloudflare deploy configuration (do this first)

**Why:** during the review, docs-only pushes to side branches each produced a Workers
build the PR bot labeled "production — Deployment successful" for the `typology` Worker.
If branch pushes really deploy production, every future implementation branch is a live
deploy with no gate.

**How:** in the Cloudflare dashboard — account *Stratfield Partners* (`b45df299…b5d6`),
Workers & Pages → `typology` → Settings → Builds (see `docs/COWORK-SETUP-RUNBOOK.md` for
account details) — check which branch is configured as the production branch and whether
non-production branches build as previews or deploy to production.

**Then:** if production deploys from every branch, restrict it to `main`. Confirm by
pushing any trivial branch commit: the PR bot should now report a preview (or no) build.
Record the outcome in this file and in PR #57's thread (its description carries this as
"P0-7", the first owner action).

## Task 2 — Merge the two PRs (yes, they need to be merged)

Nothing in either PR reaches the live site or future sessions until merged: production
deploys from `main`, and the plan/protocol are invisible to fresh sessions until they are
on `main`. The two PRs touch disjoint files; this order needs no conflict resolution.

1. **PR #57 first** (`claude/octant-p0-fixes` → main, the P0 code). Optional: mark it
   ready-for-review so CodeRabbit runs a bot pass (it skips drafts), read the review,
   then merge. Merging deploys the fixes (per Task 1's configuration).
2. **PR #56 second** (`claude/octant-review-prompt-00k0hd` → main, docs only). Puts the
   plan, protocol, review, evidence archive, and this file on `main`.

## Task 3 — Disposition the two stale drafts from 2026-08-08

- **PR #38** ("Replace the dead $25/mo Stripe link"): after #57 merges, check which
  `STRIPE_LINK` is in `src/worker/marketing.ts` on `main` and verify in the Stripe
  dashboard (account: the "Octant — choose your price" product) that it is a live payment
  link. If the shipped link is still the dead one, apply #38's one-line change (fresh
  commit on a new branch — #38's base is three weeks stale); close #38 either way, with a
  comment saying what was done.
- **PR #37** ("Link /read from home + growth plan"): superseded — plan item P1-1 covers
  the /read linking with tests. Before closing, salvage `docs/GROWTH-PLAN.md` from that
  branch if wanted (save it locally or note its points in the P1 PR). Close with a
  comment pointing at P1-1.

## Task 4 — Start the P1 implementation session

P1 (marketing & conversion) runs as a Claude Code session — start it from claude.ai/code
(or ask Claude in this Cowork session to spawn it) against `Ngk325/octant` with exactly
this prompt:

> Implement phase P1 (marketing & conversion) of Octant's approved upgrade plan.
> `docs/UPGRADE-PLAN.md` on main is the work list — items P1-1 through P1-8, each with
> acceptance criteria and a verification step. Honor: (a) the owner's decision in plan
> §P2-0 — brand Direction A with two B-folds plus a memorability mandate, which for P1
> means the og:image (P1-2) is a designed flagship asset (a render of the product's most
> memorable figure, not a logo on a colored ground) and the deck visual (P1-5) gets
> hero-grade treatment; (b) P1-2 may use an interim mark — do not block on P2-1;
> (c) old PR #37 previously attempted the /read linking — implement P1-1 per the plan's
> acceptance criteria with tests, and note that #37 can be closed. Baseline gates before
> any change and before every push: npm test / typecheck / lint / build clean
> (docs/ACCEPTANCE-PROTOCOL.md §1 has expected values). Dev access: cp .dev.vars.example
> .dev.vars; npm run dev; POST /api/auth/login {"code":"let-me-in"}; signed-in / needs
> localStorage octant.onboarding.done=1. Work on branch `claude/octant-p1-marketing` off
> main; draft PR when done with each item's acceptance criteria and verification evidence;
> subscribe to the PR. Raw audit findings are in docs/review-archive/2026-08-20/findings/
> if a finding needs tracing to evidence.

*(If Task 2 hasn't happened yet, the plan is not on `main` — tell the session to fetch it
from branch `claude/octant-review-prompt-00k0hd` first.)*

## After P1

P2 (brand execution under A+) wants the logotype/mark commissioned first (plan P2-1);
P3 (copy & flow) and P4 (depth: illustrations, a11y, performance) each run as their own
session off the same pattern. The memorability mandate (plan §P2-0) allows the
illustration items (P4-15…P4-25) to be pulled forward alongside P1/P2 for visible design
wins sooner. Every implementation PR ends by running the relevant sections of
`docs/ACCEPTANCE-PROTOCOL.md`.

## Reference index

- The plan of record: `docs/UPGRADE-PLAN.md` (decision in §P2-0; brand fork table at end)
- The audit: `docs/REVIEW-2026-08-FULL.md` · QA protocol: `docs/ACCEPTANCE-PROTOCOL.md`
- Evidence: `docs/review-assets/` (curated) · `docs/review-archive/2026-08-20/` (full
  working record: prompt, raw findings, manifests, regeneration scripts)
- Ops state (Cloudflare/Google/KV): `docs/COWORK-SETUP-RUNBOOK.md`
