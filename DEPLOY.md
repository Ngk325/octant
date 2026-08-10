# DEPLOY — push, build, launch

A runbook for taking this repository from a local folder to a live URL on Cloudflare.
Follow the steps in order. Steps marked **🔑 HUMAN** require credentials and must be done by
the account owner — do not attempt to automate them or handle the tokens on their behalf.

**Hosting decision:** Cloudflare **Workers with Static Assets**, not Pages. Pages' Git
integration cannot be added to a project after creation, Cloudflare's own docs now route new
projects to Workers, and Workers leaves a path to API routes, KV and D1 without a migration.
`wrangler.jsonc` is already configured for it.

---

## 0 · Preconditions

```sh
node --version     # need 22+ (wrangler 4 and the toolchain both require it)
git --version
```

Working directory is the repo root — the folder containing `package.json` and `wrangler.jsonc`.

---

## 1 · Install and verify locally

```sh
npm install
npm test          # expect: every test green, across BOTH projects (unit + workers)
npm run lint      # expect: no errors (Biome, linter only)
npm run typecheck
npm run build     # expect: dist/ written
```

The suite's exact count grows with the code and is not pinned here — the last
reviewed number, with a date, is in `docs/QA-REVIEW.md`. What matters is zero
failures.

**Do not proceed if `npm test` fails.** The suite is not cosmetic: it asserts the engine
reproduces its verified reference exactly, including all 256 playbooks character for character,
and that every lexicon cross-reference and every aspect pairing resolves. It asserts the
four-sides derivation, the exchange-overlay definitions, and that every colour in the design
system clears WCAG AA on its own canvas in both themes. The `workers` project runs the access
wall **inside the real Workers runtime** — anonymous refusal, fail-closed, forged cookies,
blocked users against real KV. A failure means the data model, the reading surface or the
security boundary is wrong, not that a test is flaky.

Smoke check — **do step 2 first**, or the dev site will (correctly) refuse to let you in:

```sh
cp .dev.vars.example .dev.vars
npm run dev       # http://localhost:5173, access code: let-me-in
```

Visit `/calculator`, `/type/ENTP`, `/pair/ENTP/ENFJ`, `/network`, `/matrix`, `/lexicon`,
`/learn/octagram`. Confirm deep links survive a hard refresh.

---

## 2 · Secrets — the access wall and the assistant

**Read this before deploying.** The wall needs `AUTH_SECRET` **plus at least
one way in** — either an `ACCESS_CODES` entry or the Google credentials.
`AUTH_SECRET` alone, or a way-in without the signing secret, fails closed and
refuses everyone. The rest enable features that degrade cleanly when absent.
None is ever a `var`, none is ever committed, and none reaches the client
bundle.

| Secret | Required | What it does |
|---|---|---|
| `ACCESS_CODES` | **yes** | Who may in. Without it (and no Google) nobody gets past the gate — including you. |
| `AUTH_SECRET` | **yes** | Signs session cookies, OAuth state and the approve/deny links. Rotating it signs everybody out. |
| `GEMINI_API_KEY` | for the assistant | Powers `/api/chat`. Everything else works without it. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | for Google sign-in | Without both, the Google button does not render and codes are the only way in. Setup: `docs/GOOGLE-SETUP.md`. |
| `OWNER_EMAIL` | for approval + /admin | The auto-approved account and the only one `/admin` opens for. |
| `RESEND_API_KEY` | for email | Sign-up notifications, chat transcripts, and onramp lead nurture. Without it, sign-ups still record; nothing mails. |
| `NOTIFY_FROM` | in practice, yes for email | Sender on a domain verified in Resend. The shared default only delivers to the Resend account's own address — see `docs/GOOGLE-SETUP.md`. |
| `NOTIFY_EMAIL` | optional | Redirects delivery without changing who owns `/admin`. |
| `STRIPE_WEBHOOK_SECRET` | for payment auto-approval | Verifies `POST /api/stripe/webhook` actually came from Stripe (`whsec_...`, from the webhook endpoint's settings in the Stripe dashboard — not the account's API key; no Stripe SDK or API key is used anywhere in this app). Without it, the endpoint 503s and payment stays manual — the customer signs in, lands `pending`, and the owner approves them the existing way. |

The three KV namespaces (`USERS`, `CHAT_LOGS`, `LEADS`), the Analytics Engine
dataset, both rate-limit bindings and the hourly cron live in `wrangler.jsonc`
and deploy with the code — nothing to click in the dashboard, and
dashboard-only bindings would be removed by the next push anyway. All three
KV namespaces already have real ids committed; there is no creation step left
to do.

**If `LEADS` (or any KV namespace) is ever missing its id** — e.g. setting
this app up fresh in a different Cloudflare account — create it once and
paste the returned id into `wrangler.jsonc`'s `kv_namespaces` array:

```sh
npx wrangler kv namespace create LEADS
```

**Run this command at most once per account.** It does not check for an
existing namespace of the same name — running it again creates a second,
empty one, and pointing the binding at it would silently discard every
captured lead (same hazard documented for `USERS` in
`docs/COWORK-SETUP-RUNBOOK.md`).

**`PUBLIC_ORIGIN`** (in `wrangler.jsonc`'s `vars`, not a secret) should be set
to the deployed hostname, e.g. `"https://octant.example.com"`, so cron-driven
nurture email can build a working unsubscribe link. Left blank, those emails
simply omit the link.

**Setting up the Stripe webhook (🔑 HUMAN):** in the Stripe dashboard, add a
webhook endpoint pointed at `https://<your-worker-url>/api/stripe/webhook`,
subscribed to `checkout.session.completed`. Copy its signing secret and set it
below as `STRIPE_WEBHOOK_SECRET`. This is a live endpoint pointed at real
payment events — do not create it from an automated tool; it belongs in the
owner's own Stripe dashboard.

### Locally

```sh
cp .dev.vars.example .dev.vars     # gitignored; already contains a working dev code
```

Then edit `.dev.vars` to add your Gemini key. `npm run dev` and `npx wrangler dev`
both read it, and both enforce the access wall exactly as production does — the dev
site is gated too, which is the only way to actually test the thing protecting you.

### In production

Run each command, paste the value when prompted, press enter:

```sh
npx wrangler secret put ACCESS_CODES
npx wrangler secret put AUTH_SECRET
npx wrangler secret put GEMINI_API_KEY
```

For payment auto-approval, also (value from the Stripe dashboard's webhook
endpoint settings — see "Setting up the Stripe webhook" above):

```sh
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

**Generate the values first** — do not invent them by hand:

```sh
# one access code
node -e "console.log(require('crypto').randomBytes(12).toString('base64url'))"

# the signing secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

**`ACCESS_CODES` format.** Comma-separated, either bare codes or `label:code` pairs.
The label is how you tell people apart:

```
nick:Rk9xQe2mVt8L,jane:7Zp3WsNbYc1H
```

- **To grant access:** generate a code, add `name:code` to the list, re-run
  `wrangler secret put ACCESS_CODES` with the full new list, then send that person
  their code. Existing sessions are unaffected.
- **To revoke one person:** remove their entry and re-run the command. They cannot
  sign in again. Their current session survives until it expires (30 days) — if you
  need them out *now*, rotate `AUTH_SECRET` as well.
- **Panic button:** re-run `wrangler secret put AUTH_SECRET` with a fresh value.
  Every session everywhere ends immediately and everyone signs in again.

Secrets take effect on the next deploy. `npx wrangler deploy` if you are deploying
directly; push to the branch if you are on Git-connected builds.

### Verifying

```sh
npm run build && grep -rE "AIza|AQ\.|GOCSPX-|re_[A-Za-z0-9]|whsec_[A-Za-z0-9]|ACCESS_CODES|AUTH_SECRET|GEMINI_API_KEY|GOOGLE_CLIENT_SECRET|STRIPE_WEBHOOK_SECRET" dist/
```

Must find **nothing** — every secret lives in the Worker, and the Worker's code is
not the client bundle. Then, against the deployed URL:

```sh
# Anonymous "/" is the ONE public route — the marketing page (200). It must not
# contain app markup: no #root, no /assets/, no /api/chat.
curl -s https://<your-worker-url>/ | grep -c 'id="root"\|/assets/\|/api/chat'   # expect: 0
# Any other route with no session is refused.
curl -s -o /dev/null -w "%{http_code}\n" https://<your-worker-url>/type/ENTP    # expect: 401
curl -s https://<your-worker-url>/api/chat -X POST    # expect: {"error":"Not signed in."}
```

App markup in the first command, or a `200` on `/type/ENTP`, means the wall is
not doing its job — check that `AUTH_SECRET` and a way-in are set and that the
deploy that set them has actually gone out.

### Verifying the wall against the real runtime

This is the check that matters, and it is the one that was missed the first
time. `npm run dev` now runs the Worker's real router — but Vite still plays
the asset store, so dev cannot show you whether *Cloudflare's edge* would have
served an asset without invoking the Worker. `tests/workers/` proves the
handlers inside the real runtime; only `wrangler dev` (and the deployed probe
below) proves the asset routing:

```sh
cp .dev.vars.example .dev.vars    # if you have not already
npm run build
npx wrangler dev --port 8788      # in another terminal:

# "/" is the marketing carve-out (200); everything else with no session is 401.
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8788/type/ENTP           # 401

# The bundle's filename carries a content hash, so read it out of the build
# rather than guessing — a wildcard here is expanded by the shell against your
# local directory, not the server, and silently requests a path that does not
# exist. A 401 on a nonexistent path would look like a pass and prove nothing.
JS=$(ls dist/assets/index-*.js | head -1)
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8788/assets/$(basename "$JS")"   # 401
```

The asset 401 is the one that matters: it is the check that `run_worker_first`
is routing every request through the wall and not serving a chunk straight from
the asset store. `tests/workers/` cannot make this check — only the platform
can, here or on the deployed URL.

All three must be **401**. A `200` on any of them means asset requests are
reaching the asset store without passing the gate — check that
`assets.run_worker_first` in `wrangler.jsonc` is `true` and not a list of routes.
`tests/auth.test.ts` asserts that value, but only the runtime proves the effect.

**One caveat, stated rather than buried.** Past the gate, a Google session's
approval status is re-read from KV on every request *except* static assets —
see `isAssetPath()` in `src/worker/auth.ts`. Someone who is signed in and then
blocked can still fetch a JS chunk until their next page load or API call. That
is deliberate: it avoids a KV read per chunk on every cold load, and an asset is
useless without the shell, which *is* checked. If you need somebody out with no
grace at all, rotate `AUTH_SECRET` — that invalidates every session everywhere,
both kinds, immediately.

**A note on cost.** `run_worker_first: true` makes every asset request a Worker
invocation rather than a free asset hit. At invite-only scale that is
negligible; if this ever opens up, watch the invocation count in the Cloudflare
dashboard, because the documented behaviour on exceeding a plan's limit is a
`429` — the site goes down rather than the bill going up.

### If you see "Not configured"

The wall is missing `ACCESS_CODES` or `AUTH_SECRET` and is refusing everyone rather
than serving the site to the public. Set both, redeploy, reload.

### If the assistant says it is not configured

`GEMINI_API_KEY` is unset. Get a key from <https://aistudio.google.com/apikey>, then
`npx wrangler secret put GEMINI_API_KEY` and redeploy. Locally, put it in `.dev.vars`
and restart `npm run dev`.

**Rate limiting.** Two layers since 2026-08: the in-memory per-isolate brakes
(failures-only on login), plus cross-isolate rate-limit bindings declared in
`wrangler.jsonc` (30 login attempts/min/IP, 20 chat messages/min/IP). The
bindings fail open on error by design — the wall's digest comparison is the
defence, and a limiter outage must not lock the owner out. KV is deliberately
NOT used for this: 1,000 writes/day on the free tier and one write per second
per key make it the wrong tool.

---

## 3 · 🔑 HUMAN — create the GitHub repository

The initial commit already exists in this repo. Create an **empty** repository at
<https://repo.new> — no README, no `.gitignore`, no licence, or the first push will conflict.

Suggested name: `typology`. Private is fine; Workers Builds can read private repos
once authorised.

---

## 4 · 🔑 HUMAN — push

```sh
git remote add origin https://github.com/<YOUR-USERNAME>/typology.git
git branch -M main
git push -u origin main
```

If the machine has no stored GitHub credential this will prompt. Use the GitHub CLI
(`gh auth login`) or an SSH remote — whichever the account already uses. Do not paste a personal
access token into a chat window or a script.

Verify: `git ls-remote origin` returns a `refs/heads/main` line.

---

## 5 · Choose a deploy path

Two options. **B is the better long-term setup**; A is faster if you just want it live now.

### A · Direct deploy from this machine

```sh
npm run cf:login     # 🔑 HUMAN — opens a browser for Cloudflare OAuth
npm run cf:whoami    # confirms the authenticated account
npm run deploy       # builds, then wrangler deploy
```

`npm run deploy` prints the live URL, of the form
`https://typology.<your-subdomain>.workers.dev`.

To redeploy after any change: `npm run deploy`. Nothing is automatic.

### B · Git-connected continuous deployment (recommended)

Every push to `main` builds and deploys itself, and pull requests get preview URLs.

1. 🔑 **HUMAN** — Cloudflare dashboard → **Workers & Pages** → **Create** → **Workers** →
   **Import a repository**.
2. Authorise the Cloudflare GitHub app for the account or org, then pick
   `typology`.
3. Build settings:

   | Field | Value |
   |---|---|
   | Git branch | `main` |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |
   | Root directory | *(leave blank)* |

4. Save and deploy. The first build takes a couple of minutes.

Cloudflare reads `wrangler.jsonc` for the Worker name and the assets directory, so there is no
output-directory field to set.

---

## 6 · Verify the deployment

Against the live URL:

- `/` anonymous shows the marketing page (no app markup in view-source); signed in it shows
  the app — or the eight-screen onboarding on a first visit
- `/pair/ENTP/ENFJ` loads **directly**, not just via in-app navigation — this is the SPA
  fallback working. If it 404s, `not_found_handling` in `wrangler.jsonc` is not being applied.
- `/lexicon/duality` scrolls to the Duality entry and shows its pairings
- `/network` renders the ring with three seeded people

---

## 7 · Custom domain (optional)

🔑 **HUMAN** — Workers & Pages → the Worker → **Settings** → **Domains & Routes** → **Add**
→ **Custom domain**. The zone must already be on the Cloudflare account; DNS is created
automatically.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `wrangler deploy` says not authenticated | No OAuth session | `npm run cf:login` |
| Deep link 404s on live site, works locally | Assets config not applied | Confirm `not_found_handling: "single-page-application"` in `wrangler.jsonc`, redeploy |
| Build fails in CI, passes locally | Node version drift | Set `NODE_VERSION` to `22` in the Worker's build environment variables |
| `git push` rejected, non-fast-forward | Repo was created with a README | `git pull --rebase origin main`, then push |
| Tests fail after editing `src/engine/data.ts` | The structural tables are fixture-pinned; the authored copy is not | Structural edits (seed, `REL_SCORE` semantics) fail `tests/engine.test.ts` and should be reverted; authored-copy edits are legitimate and the suite is built to allow them — read the failure before assuming which kind you made |

---

## What not to change without understanding it

- **`src/engine/data.ts`** — part frozen (seed and score tables, asserted against
  `tests/reference-fixture.json`), part authored copy that is edited directly.
- **`src/engine/core.ts`** — the α/β/ω operators. Every relation, score, animal and coin in the
  application derives from them. A one-character change here silently rewrites all 256 cells;
  the test suite is what catches it.
- **`REL_SCORE`** in `data.ts` — the ease ladder. Editing it is legitimate and intended (it is a
  modelling choice, not a measurement), but it moves every number in the matrix and the network
  view at once.
