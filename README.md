# Stratfield — a typology instrument

Read a person's wiring, then compose the network.

The whole model is a **pure function of sixteen `(dominant, auxiliary)` pairs** and three
involutions on the eight information elements. 256 intertype relations, 256 compatibility
scores, 256 playbooks, every OPS animal signature, every coin and every growth gate is
*derived* at runtime. There is no database, no lookup table to keep in sync, and no
possibility of the matrices drifting apart — they are computed from the same 2 KB of seed data.

```
src/engine/
  core.ts       α / β / ω involutions · stacks · quadras · relations · OPS · coins · calculator
  playbook.ts   per-pair composition from where the reader's functions land in the target's stack
  network.ts    n-person weighted digraph analysis
  palette.ts    fixed spectral palette — a function keeps its hue in every diagram
  verify.ts     the structural assertions, runnable at any time
  data.ts       GENERATED copy tables (see "Provenance")
```

## Surfaces

| Route | What it does |
|---|---|
| `/calculator` | Four determining coins fix the type; four confirming coins are derivable checks. Always narrows, never returns nothing. |
| `/type/:type` | The wiring schematic, OPS overlay held separate from the stack, growth gate, behavioural profile. |
| `/pair/:a/:b` | Relation, **both** directional ease scores, and the composed playbook. Shareable URL. |
| `/network` | The reason this is software and not a spreadsheet: group as a weighted digraph. |
| `/matrix` | All 256 cells, colour-scaled, every cell a link into the pair reader. |

## Two things the interface insists on

**Ease is directional.** Four of the sixteen relations are asymmetric — Supervisor/Supervisee
and Benefactor/Beneficiary. A single compatibility number hides that, so the pair reader always
shows both directions and names the asymmetry when it exists.

**CSJ and OPS are not reconciled.** They model a different number of psychic parts and give
different growth readings for the same type. The wiring schematic marks both faults: the CSJ
Inferior as *the cave*, and the OPS demon-animal loop as *an open circuit*. They are in
different places. That divergence is the content, not an error to smooth over.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # 24 tests, including all 256 playbooks
npm run build      # → dist/
```

## Deploy to Cloudflare Pages

Create the project via **Workers & Pages → Create application → Pages → Import an existing Git
repository**. Git integration cannot be added to an existing Pages project after the fact, so it
has to be done at creation.

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |

`public/_redirects` ships the SPA fallback (`/* /index.html 200`) so deep links like
`/pair/ENTP/ENFJ` resolve. A `wrangler.jsonc` is included if you later move to Workers Static
Assets — Cloudflare's docs now steer new projects that way, and the migration is
`npx wrangler deploy` with no code changes.

## Provenance

`src/engine/data.ts` is generated once from a Python reference engine that was verified against
the spreadsheet build. `tests/reference-fixture.json` captures that engine's complete output, and
`tests/engine.test.ts` asserts the TypeScript port reproduces it exactly — all 256 relations, all
256 scores, and all 256 playbooks character for character.

That handover is complete: **TypeScript is now canonical.** The Python reference is retired and
the spreadsheet is a derived artifact. Regenerating `data.ts` is not part of the build.

## Deliberately deferred

Middle-animal ordering (Consume/Sleep permutations), OPS modality, and the masculine/feminine
fine-coins. The base type is exactly 4 bits; the deferred layer adds further independent bits.
Model a type as a bit vector with a fixed 4-bit head and an extensible tail, and key all relation
lookups to the head only — the subtype layer then modulates presentation without ever touching
the 256-cell core.

## Licence

Private. Frameworks referenced: Jung (*Psychological Types*, 1921), Beebe (*Energies and
Patterns in Psychological Type*), Myers (*Gifts Differing*), Augustinavičiūtė for quadra
structure. OPS and CS Joseph are named as interpretive lenses and attributed for vocabulary,
not cited as authority.
