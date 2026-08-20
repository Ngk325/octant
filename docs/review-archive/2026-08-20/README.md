# Review archive — 2026-08-20

The complete working record of the full-perspective review delivered on PR #56
(`claude/octant-review-prompt-00k0hd`). The polished deliverables live one level up —
`docs/REVIEW-2026-08-FULL.md`, `docs/UPGRADE-PLAN.md`, `docs/ACCEPTANCE-PROTOCOL.md`,
`docs/review-assets/` — this directory preserves everything behind them, so future work can
re-run the review, audit a finding back to its raw evidence, or pick up exactly where this
session stopped.

**Decision record.** On 2026-08-20 the owner reviewed the deliverables and selected brand
**Direction A with the two B-folds**, adding the mandate *"more memorable designs, visuals,
illustrations"*; all other plan items were approved as written. The decision and what it
re-weights are recorded in `UPGRADE-PLAN.md` §P2-0; the fork table there retains B and C
for reference if the direction is ever revisited.

## What is here

| Path | Contents |
|---|---|
| `PROMPT.md` | The exact prompt that produced the review — re-runnable and auditable against its own instructions. |
| `session-notes.md` | The session evidence log: gates as measured, access method, every mechanical claim verified inline with its command, walk coverage, axe results, page-height census, caveats (fonts blocked → fallback typefaces in all screenshots). |
| `findings/audit-{marketing…}.json` | The five raw audit result sets (source audits bundle marketing/copy/supporting/integrity in `audit-source.json`; display, branding, illustrations, flow are separate). **Richer than the report** — every finding carries full detail, evidence refs, per-finding audience lenses, and recommendations; the report tables condense these. The branding file also holds the three direction briefs in full. |
| `manifests/manifest{,2,3}.json` | Screenshot manifests for the three walks (44 app surfaces ×4 combos; 9 signed-out marketing surfaces ×4; signed-in home ×4): route, file name, viewport, theme, HTTP status, page title, h1, and console errors per page. |
| `manifests/flow-calc-log.json` | The interactive calculator click-through record. |
| `manifests/axe-results.json` | axe-core violations for the seven audited pages. |
| `scripts/` | Everything needed to regenerate the evidence — see below. |

## Regenerating the evidence

The full-resolution screenshot set (230+ files, 142 MB) was deliberately **not** committed —
it would bloat every future clone, and it is cheaply reproducible:

```sh
cp .dev.vars.example .dev.vars && npm run dev        # real Worker, wall active
# sign in: POST /api/auth/login {"code":"let-me-in"} → octant_session cookie
cd <workdir> && npm i playwright   # browsers: use executablePath /opt/pw-browsers/chromium
OCTANT_COOKIE=<cookie> node scripts/walk.mjs         # 44 surfaces × 4 combos
node scripts/walk2.mjs                               # signed-out marketing surfaces
OCTANT_COOKIE=<cookie> node scripts/walk3.mjs        # signed-in home (onboarding done)
OCTANT_COOKIE=<cookie> node scripts/flow-calc.mjs    # calculator click-through
OCTANT_COOKIE=<cookie> node scripts/axe.mjs          # axe-core pass (npm i axe-core)
```

Probe scripts used for specific findings: `mh.mjs` + `anchor.mjs` (the DIS-3 masthead
two-row band and hidden-anchor measurements), `hscroll.mjs` (390 px horizontal-scroll
census), `ease.mjs` / `asym.mjs` (engine introspection for the direction-swap P0 and the
asymmetric-pair counts), `crop*.{mjs,py}` (finding crops), `compress.py` (the
half-scale/quantize step that produced `docs/review-assets/`).

`scripts/workflow-source-audits.js` and `scripts/workflow-visual-audits.js` are the
orchestration scripts that ran the eight perspective audits (Claude Code Workflow format);
their prompts double as the audit briefs and evidence-discipline rules each auditor worked
under.

## Caveats that travel with this evidence

- Every archived screenshot renders **fallback typefaces** (Newsreader→Georgia,
  Inter→system-ui, Plex Mono→monospace) because the review sandbox blocked Google Fonts. No
  finding rests on letterform appearance; re-run the walks on an unrestricted network for
  true-type screenshots.
- Full-page captures of sticky-masthead pages show the masthead mid-image — a capture
  artifact, not a bug.
- `wrangler dev` boundary checks, the Resend email path, `/admin`'s owner view, and the
  Cloudflare Builds configuration (the P0-7 question) were out of reach of the sandbox and
  are flagged accordingly in the report.
