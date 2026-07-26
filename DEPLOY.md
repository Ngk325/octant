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
node --version     # need 18+, 20+ preferred
git --version
```

Working directory is the repo root — the folder containing `package.json` and `wrangler.jsonc`.

---

## 1 · Install and verify locally

```sh
npm install
npm test          # expect: 423 passed
npm run build     # expect: dist/ written, no TypeScript errors
```

**Do not proceed if `npm test` fails.** The suite is not cosmetic: it asserts the engine
reproduces its verified reference exactly, including all 256 playbooks character for character,
and that every lexicon cross-reference and every aspect pairing resolves. It also asserts the
four-sides derivation, the OPS animal definitions, and that every colour in the design system
clears WCAG AA on its own canvas in both themes. A failure means the data model or the reading
surface is wrong, not that a test is flaky.

### The assistant's API key

`/api/chat` is served by a Worker (`src/worker/index.ts`) that proxies Gemini. The key is a
**secret** — never a `var`, never in the client bundle, never committed.

```sh
cp .dev.vars.example .dev.vars     # local only; .dev.vars is gitignored
# put your key in it, then:
npm run dev                        # Vite serves /api/* with the same handler the Worker runs
npx wrangler dev                   # or run the real Worker + assets locally
```

For production, once per environment:

```sh
npx wrangler secret put GEMINI_API_KEY
```

Verify the key never ships: `npm run build && grep -r "GEMINI\|AIza\|AQ\." dist/` must find
nothing. Without the secret set, the app still works everywhere else — the rail simply reports
itself unconfigured.

**Rate limiting.** `handleChat` throttles per IP, but only within a single Worker isolate, so it
slows a runaway client rather than a determined one. Before pointing real traffic at this,
add a KV namespace and move the counter there.

Optional smoke check:

```sh
npm run dev       # http://localhost:5173
```

Visit `/calculator`, `/type/ENTP`, `/pair/ENTP/ENFJ`, `/network`, `/matrix`, `/lexicon`.
Confirm deep links survive a hard refresh.

---

## 2 · 🔑 HUMAN — create the GitHub repository

The initial commit already exists in this repo. Create an **empty** repository at
<https://repo.new> — no README, no `.gitignore`, no licence, or the first push will conflict.

Suggested name: `stratfield-typology`. Private is fine; Workers Builds can read private repos
once authorised.

---

## 3 · 🔑 HUMAN — push

```sh
git remote add origin https://github.com/<YOUR-USERNAME>/stratfield-typology.git
git branch -M main
git push -u origin main
```

If the machine has no stored GitHub credential this will prompt. Use the GitHub CLI
(`gh auth login`) or an SSH remote — whichever the account already uses. Do not paste a personal
access token into a chat window or a script.

Verify: `git ls-remote origin` returns a `refs/heads/main` line.

---

## 4 · Choose a deploy path

Two options. **B is the better long-term setup**; A is faster if you just want it live now.

### A · Direct deploy from this machine

```sh
npm run cf:login     # 🔑 HUMAN — opens a browser for Cloudflare OAuth
npm run cf:whoami    # confirms the authenticated account
npm run deploy       # builds, then wrangler deploy
```

`npm run deploy` prints the live URL, of the form
`https://stratfield-typology.<your-subdomain>.workers.dev`.

To redeploy after any change: `npm run deploy`. Nothing is automatic.

### B · Git-connected continuous deployment (recommended)

Every push to `main` builds and deploys itself, and pull requests get preview URLs.

1. 🔑 **HUMAN** — Cloudflare dashboard → **Workers & Pages** → **Create** → **Workers** →
   **Import a repository**.
2. Authorise the Cloudflare GitHub app for the account or org, then pick
   `stratfield-typology`.
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

## 5 · Verify the deployment

Against the live URL:

- `/` redirects to `/calculator`
- `/pair/ENTP/ENFJ` loads **directly**, not just via in-app navigation — this is the SPA
  fallback working. If it 404s, `not_found_handling` in `wrangler.jsonc` is not being applied.
- `/lexicon/duality` scrolls to the Duality entry and shows its pairings
- `/network` renders the ring with three seeded people

---

## 6 · Custom domain (optional)

🔑 **HUMAN** — Workers & Pages → the Worker → **Settings** → **Domains & Routes** → **Add**
→ **Custom domain**. The zone must already be on the Cloudflare account; DNS is created
automatically.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `wrangler deploy` says not authenticated | No OAuth session | `npm run cf:login` |
| Deep link 404s on live site, works locally | Assets config not applied | Confirm `not_found_handling: "single-page-application"` in `wrangler.jsonc`, redeploy |
| Build fails in CI, passes locally | Node version drift | Set `NODE_VERSION` to `20` in the Worker's build environment variables |
| `git push` rejected, non-fast-forward | Repo was created with a README | `git pull --rebase origin main`, then push |
| Tests fail after editing `src/engine/data.ts` | That file is generated | Revert it. It is verified against a fixture and is not meant to be hand-edited |

---

## What not to change without understanding it

- **`src/engine/data.ts`** — generated, and asserted against `tests/reference-fixture.json`.
- **`src/engine/core.ts`** — the α/β/ω operators. Every relation, score, animal and coin in the
  application derives from them. A one-character change here silently rewrites all 256 cells;
  the test suite is what catches it.
- **`REL_SCORE`** in `data.ts` — the ease ladder. Editing it is legitimate and intended (it is a
  modelling choice, not a measurement), but it moves every number in the matrix and the network
  view at once.
