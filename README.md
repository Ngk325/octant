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
  lexicon.ts    88 term definitions + pairing logic for every category
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
| `/lexicon` | 88 defined terms, searchable and filterable; `/lexicon/:id` shows one term paired against every other member of its category. |

## The lexicon

Every term the system uses is defined, sourced and **pairable**. A definition alone is not much
use — what matters is what happens when two of them meet. So each category that can pair does:
Infantile against Caregiver, Alpha against Gamma, Play against Blast, Ne against Si, Hero against
Trickster, and so on for all sixteen ordered combinations in each.

Terms appear inline throughout the app as dotted underlines; clicking one shows the short
definition and links to the full entry. The pair reader carries an **Aspect by aspect** section
that walks all sixteen comparable dimensions of two types — quadra, temperament, interaction
style, romance style, animal, gate, Hero and Inferior functions, and each of the eight coins —
and prints the pairing text for that specific combination.

Where the structure determines the answer (quadras, animals, functions, archetypes) the pairing
is derived and the specifics interpolated. Where the flavour is the content (romance styles,
interaction styles) all sixteen ordered pairs are authored, because reading someone is not the
same as being read by them.

## Complement and Catalyst

Two derived fields that the original workbook conflated into one:

- **Complement** — Dual + Activity. Supplies your **Inferior**, the function you fear. Restful.
- **Catalyst** — the two types whose Hero is your **Nemesis**. Supplies the function you are
  consciously reaching for and reflexively arguing with. Stimulating, slightly abrasive.
  Structurally this always resolves to your Extinguishment and Mirage partners.

An ENTP wants convergence, but convergence is Ni, and Ni is the Nemesis — which is why INTJ and
INFJ feel compelling rather than comfortable, and why the old "Sidekicks" column kept reaching
for them.

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
npm test           # 32 tests: engine port fidelity, lexicon integrity, catalysts
npm run build      # → dist/
```

## Deploy

**Cloudflare Workers with Static Assets.** See **[DEPLOY.md](./DEPLOY.md)** for the full
runbook. Short version:

```sh
npm run cf:login     # Cloudflare OAuth, once
npm run deploy       # build + wrangler deploy
```

Or connect the repo in the dashboard (Workers & Pages → Create → Workers → Import a repository)
for build-and-deploy on every push.

Workers rather than Pages because Pages' Git integration cannot be added after project creation,
Cloudflare now routes new projects to Workers, and adding an API later needs no migration.
`not_found_handling: "single-page-application"` in `wrangler.jsonc` is what makes deep links like
`/pair/ENTP/ENFJ` survive a hard refresh.

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
