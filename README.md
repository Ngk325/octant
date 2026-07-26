# Octant — read the wiring

Learn how personality actually works, step by step and in plain language — then read a person,
then compose the network.

The whole model is a **pure function of sixteen `(dominant, auxiliary)` pairs** and three
involutions on the eight information elements. 256 intertype relations, 256 compatibility
scores, 256 playbooks, every OPS animal signature, every coin and every growth gate is
*derived* at runtime. There is no database, no lookup table to keep in sync, and no
possibility of the matrices drifting apart — they are computed from the same 2 KB of seed data.

```
src/engine/
  core.ts       α / β / ω involutions · stacks · quadras · relations · gates
  sides.ts      the four sides of the mind: stacks, gateways, development states
  ops.ts        OPS overlay: saviors/demons, the animal stack, coins, calculator
  octagram.ts   the Octagram: eight temple wheels, cognitive origins, four themes
  playbook.ts   per-pair composition from where the reader's functions land in the target's stack
  network.ts    n-person weighted digraph analysis
  plain.ts      the plain-language layer — one gloss for every term the system uses
  context.ts    derived grounding for the assistant
  palette.ts    per-theme palette + contrast maths, asserted in tests
  verify.ts     the structural assertions, runnable at any time
  lexicon.ts    103 term definitions + pairing logic for every category
  data.ts       GENERATED copy tables (see "Provenance")
src/worker/     Cloudflare Worker: the access wall, /api/chat proxying Gemini, assets behind both
src/learn/      the eleven-stage course
```

## Plain first, technical underneath

Every surface leads with plain English and puts the precise version one click below it, in a
disclosure labelled *The exact mechanics*. Nothing is hidden from either reader: a newcomer gets
a sentence they can act on, and can see exactly which vocabulary they are growing into.
`tests/plain.test.ts` asserts all 103 lexicon entries carry a gloss and that the plain layer does
not smuggle back the jargon it exists to replace.

## Surfaces

| Route | What it does |
|---|---|
| `/learn` · `/learn/:stage` | Eleven stages, in order, from "what is a cognitive function" to the Octagram. Each assumes only what the ones before it taught. |
| `/calculator` | Four determining coins fix the type; four confirming coins are derivable checks. Always narrows, never returns nothing. |
| `/types` | All sixteen at a glance, grouped by quadra or temperament. |
| `/type/:type` | The eight slots, all four sides of the mind built out, the OPS overlay with its subtype coins, growth gate, the Octagram wheel and theme grid, behavioural profile, and what each function actually wants. |
| `/pair/:a/:b` | Relation, **both** directional ease scores, and the composed playbook. Shareable URL. |
| `/network` | The reason this is software and not a spreadsheet: group as a weighted digraph. |
| `/matrix` | All 256 cells, colour-scaled, every cell a link into the pair reader. |
| `/lexicon` | 103 defined terms, searchable and filterable; `/lexicon/:id` shows one term paired against every other member of its category. |

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

## The four sides of the mind

`fourSides()` used to return four bare type codes. It now returns four complete sides, each with
its own four-slot stack, its gateway, what blocks that gateway, what opens it, and what a
developed versus undeveloped version of it looks like.

The derivation was already latent in `core.ts`: the same three involutions that generate the
relation table generate the sides. So each side stands in a fixed relation to the ego —

| Side | Type | Slots | Gateway | Blocked by | Relation to ego |
|---|---|---|---|---|---|
| Ego | `t` | Hero · Parent · Child · Inferior | Hero | — | Identity |
| Subconscious | `ω(d), ω(x)` | the ego stack reversed | Inferior | insecurity | **Duality** |
| Unconscious | `α(d), α(x)` | Nemesis · Critic · Trickster · Demon | Nemesis | worry | **Extinguishment** |
| Superego | `β(d), β(x)` | the shadow reversed | Demon | fear | **Super-Ego** |

— which is why the Socionics relation named *Super-Ego* and the Jungian structure named
*superego* land on the same type. The Demon sits in the Inferior slot of the unconscious and the
**Hero slot of the superego**, which is exactly why that side reads as a parasite persona.
Verified against CS Joseph's own worked INTP example in `tests/sides.test.ts`.

## The Octagram

CS Joseph's advanced layer, and the hardest material the app carries. It goes in as two
layers with a hard line between them, because the sourcing is not uniform.

**The wheel layer is derived, not looked up.** Sixteen types pair off into eight *dyads* — a
type together with its subconscious, which is its Dual — and two dyads make a *temple*, which
turns out to be exactly one orbit of the four-sides operation. So `src/engine/octagram.ts`
contains no membership table at all: `wheelOf()` and `templeOf()` compute it from
`fourSides()`. `tests/octagram.test.ts` then checks the result against CS Joseph's published
lists, and it matches **16/16 dyad memberships and 16/16 temple memberships**. That makes the
Octagram the app's fourth external validation, and the cleanest one — the published structure
is reproduced by an operator that was in the engine before the Octagram was read about.

| Temple | Wheels | Origins |
|---|---|---|
| Soul — identity and character | ENFP·ISTJ, ESTP·INFJ | Justification, Intimacy |
| Mind — knowledge and judgement | ESTJ·INFP, ENFJ·ISTP | Authority, Validation |
| Heart — desire and regard | ENTP·ISFJ, ESFP·INTJ | Satisfaction, Reverence |
| Body — action and legacy | ESFJ·INTP, ENTJ·ISFP | Discovery, Purpose |

Each wheel carries a Living Virtue above its origin and a Deadly Sin below it. Those eight
sins are the classical eight of the Evagrian tradition — wrath, lust, envy, vainglory, sloth,
pride, gluttony, greed — each paired with its traditional contrary virtue, which is a strong
internal check that the authored table was transcribed correctly.

**The theme layer is biographical and is not derived from anything.** Subconscious
development (SD/UD, set in childhood) crossed with focus (SF/UF, mutable) gives Joy, Decay,
Hope and Despair. It is a self-reported control on the type page, in exactly the same posture
as the OPS subtype coins, and the assistant is instructed never to guess it from a type.

**What is not settled is written down.** `UNSETTLED` in `octagram.ts` records three gaps,
the sharpest being that published summaries disagree about which of a wheel's two poles is the
shadow and which the aspirational; the orientation used here is cross-checked on two wheels of
eight and is presented as such rather than asserted. Three original diagrams carry the layer —
an eight-point ring, a single wheel, and the theme grid — all built from the engine, so none
of them can drift out of agreement with it.

## Externally validated

The engine derives its output rather than storing it, which makes independent published tables a
real test. Three from the source-image batch (`docs/transcripts/`), all asserted in
`tests/ingested.test.ts` — plus the Octagram partition above, asserted in `tests/octagram.test.ts`:

- **Berens' "16 Type Patterns"** agrees with `stack()` on **128/128 slots**, all sixteen types.
- **A Socionics intertype chart** agrees with `REL` on **all 256 cells**, and each of its sixteen
  labels maps onto exactly one engine code — a clean bijection. Two naming conventions differ and
  are documented rather than reconciled: that chart's *Look-a-like* is this app's Business and its
  *Comparative* is this app's Kindred.
- **An OPS slide** independently confirms the Play/Consume correction below.

And one that deliberately does **not** agree — see "The empirical counterweight".

## Two corrections to the OPS layer

The retired Python reference engine had two errors here. Both are fixed in `src/engine/ops.ts`
and asserted from first principles against the published OPS definitions in `tests/ops.test.ts`.
Neither touches the 4-bit head, so no relation, score or playbook changed.

1. **Demons used `alpha` (attitude flip) instead of `omega` (the Model A opposite)**, which put
   them in the shadow block. OPS's four functions are the ego's top four: savior `Ne/Ti` demons
   to `Si/Fe`, not `Ni/Te`. This also rewrites the CSJ-versus-OPS divergence the app draws — the
   two instruments now *overlap* at the Inferior and disagree about the Child, which CS Joseph
   treats as a delight and OPS treats as neglected.
2. **Play and Consume were transposed.** Play is `Oe+De` and Consume is `Oe+Di`, so the energy
   animals are the attitude-pure pair. Every one of the sixteen had its primary animal
   mislabelled.

`tests/reference-fixture.json` is left untouched as the record of what the Python engine
produced; `tests/engine.test.ts` documents exactly which four assertions were retired and why.

The animal stack now carries position semantics — savior pair, activated/hobby animal, and the
last/missing animal — and the coins OPS uses to get from 32 types to 512 are exposed as
**self-reported subtype coins**, defaulted to unset rather than guessed. One structural result
falls out for free: because a dominant and an auxiliary always run opposite attitudes, every
non-jumper is energy-dominant and every jumper is info-dominant, which is precisely the line
where OPS's 32 base types leave this app's 16 behind.

## Private by default

Nothing here is public. The Worker gates **every** request — the app shell, every
asset, every API route — before the static asset binding is ever reached, so an
unauthenticated visitor never receives a byte of the app. Not the HTML, not a chunk
of JS. They get a self-contained access page and nothing else.

Access is by invite code, issued by the owner:

- `ACCESS_CODES` is a list of `label:code` pairs. Adding one grants access; removing
  one revokes it. The label is how you tell people apart.
- Sessions are HMAC-signed tokens in an `HttpOnly` cookie, not rows in a table, so
  there is nothing to keep and a forged cookie needs the signing secret.
- Rotating `AUTH_SECRET` ends every session everywhere at once. That is the panic button.

Three decisions worth knowing about, because they are the parts that would bite:

1. **It fails closed.** With the secrets missing the site serves a "not configured"
   page rather than serving the app. A wall that fails open publishes the site while
   its owner believes it is private, which is worse than having no wall at all.
2. **Codes are compared as SHA-256 digests**, so neither the code nor its length
   leaks through response timing.
3. **Only failed logins count toward the brute-force brake.** Counting successes
   would lock out someone signing in on three devices while doing nothing extra
   against an attacker, who by definition only ever fails.

`tests/auth.test.ts` asserts the boundary directly: anonymous requests get no app
content, forged and tampered and expired cookies are refused, a revoked code cannot
sign in again, and a misconfigured wall refuses everyone. Setup is DEPLOY.md step 2.

## The assistant

A persistent, context-aware rail on every route, backed by Gemini through a Cloudflare Worker.
The key is a Worker secret and never reaches the browser.

What makes the answers worth having is `src/engine/context.ts`: every request carries a system
instruction assembled from the engine's own derived output for whatever is on screen — the
stack, all four sides, the OPS signature, the gate, the coins, the relation code, **both**
directions of ease and the composed playbook. Ask it about ENTP and INFJ romance and it answers
with Mirage, Nemesis Ni and Trickster Fi, not with generic type descriptions. The instruction is
built server-side, so a caller cannot edit the grounding out of the request.

## Two things the interface insists on

**Ease is directional.** Four of the sixteen relations are asymmetric — Supervisor/Supervisee
and Benefactor/Beneficiary. A single compatibility number hides that, so the pair reader always
shows both directions and names the asymmetry when it exists.

**CSJ and OPS are not reconciled.** They model a different number of psychic parts and give
different growth readings for the same type. The wiring schematic marks both faults: the CSJ
Inferior as *the cave*, and the OPS demon-animal loop as *an open circuit*. They are in
different places. That divergence is the content, not an error to smooth over.

## Reading the reading surface

The first build was, in the owner's words, terribly hard to read: 15px body text, 12.5px
secondary, 9.5px SVG labels, and a film-grain plus vignette overlay pinned at `z-index: 9999`
over the entire app, subtracting contrast from every pixel.

That is rebuilt. Paper canvas, a serif body face at 19px on a 68ch measure, a **14px floor on
every piece of text including inside SVG**, and a full dark theme. The grain is gone.
`tests/palette.test.ts` reads the tokens straight out of `tokens.css` and asserts every
foreground/background pair — ink, muted, accent, all eight function colours, all four quadra
colours and the whole ease ramp — clears WCAG AA on its own canvas in both themes, so legibility
is a test rather than a matter of taste.

## Develop

```sh
npm install
cp .dev.vars.example .dev.vars   # add a Gemini key to use the assistant locally
npm run dev        # http://localhost:5173 — serves /api/* with the Worker's own handler
npm test           # 498 tests
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

Nothing structural. The layer the original build deferred — middle-animal ordering, OPS modality
and the jumper coin — is now modelled, but as **self-reported subtype coins** rather than
derived facts, because they genuinely are not recoverable from a four-letter type. They follow
the shape the original note prescribed: a fixed 4-bit head with an extensible tail, all relation
lookups keyed to the head only, so the subtype layer modulates presentation without ever
touching the 256-cell core.

## Licence

Private. Frameworks referenced: Jung (*Psychological Types*, 1921), Beebe (*Energies and
Patterns in Psychological Type*), Myers (*Gifts Differing*), Augustinavičiūtė for quadra
structure. OPS and CS Joseph are named as interpretive lenses and attributed for vocabulary,
not cited as authority.
