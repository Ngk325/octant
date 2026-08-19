# Octant — read the wiring

Learn how personality actually works, step by step and in plain language — then read a person,
then compose the network.

The whole model is a **pure function of sixteen `(dominant, auxiliary)` pairs** and three
involutions on the eight information elements. 256 intertype relations, 256 compatibility
scores, 256 playbooks, every exchange-overlay signature, every coin and every growth gate is
*derived* at runtime from about 2 KB of genuine seed data. There is no database and no stored
matrix to keep in sync — the structural tables cannot drift apart, because they are computed.

One honest asterisk on that claim, because this README used to overstate it: the *structure*
is derived; the *numbers and words* attached to it are authored. `ease()` reads a hand-set
16-value score ramp, one coin reads an authored 8-type set, and `data.ts` is mostly authored
copy keyed by derived structure. The empirical survey matrix is a deliberate third thing —
see "The empirical counterweight".

```
src/engine/
  core.ts       the three involutions · stacks · quadras · relations · gates
  sides.ts      the four sides of the mind: stacks, gateways, development states
  ops.ts        the exchange overlay: anchors/flinches, the current stack, coins, calculator
  read.ts       the same coins, asked indirectly — for typing someone else in conversation
  octagram.ts   the Octagram: eight temple wheels, cognitive origins, four themes
  playbook.ts   per-pair composition from where the reader's functions land in the target's stack
  network.ts    n-person weighted digraph analysis
  empirical.ts  the survey matrix that deliberately DISAGREES with the model
  functions.ts  authored per-function copy: roles, wants, satisfactions, practices
  plain.ts      the plain-language layer — one gloss for every term the system uses
  translation.ts  cross-system name tables (the one module allowed to name sources)
  context.ts    derived grounding for the assistant
  palette.ts    per-theme palette + contrast maths, asserted in tests
  verify.ts     structural assertions, run by the test suite
  lexicon.ts    103 term definitions + pairing logic for every category
  data.ts       seed + frozen score tables + authored copy (see "Provenance")
src/worker/     Cloudflare Worker: access wall, Google sign-in + approval, admin,
                /api/chat proxying Gemini, transcript logging, security headers
src/learn/      the thirteen-stage course
```

## Plain first, technical underneath

Every surface leads with plain English and puts the precise version one click below it, in a
disclosure labelled *The exact mechanics*. Nothing is hidden from either reader: a newcomer gets
a sentence they can act on, and can see exactly which vocabulary they are growing into.
`tests/plain.test.ts` asserts all 100 lexicon entries carry a gloss and that the plain layer does
not smuggle back the jargon it exists to replace.

## Surfaces

| Route | What it does |
|---|---|
| `/` | Marketing page for the signed-out; the app (or onboarding, first visit) for the signed-in. |
| `/signin` | The gate as its own page: invite code, and Google when configured. |
| `/welcome` · `/welcome/:step` | Eight onboarding screens, shown once, skippable, before the full app. |
| `/learn` · `/learn/:stage` | Thirteen stages, in order, from "what is a cognitive function" to reading and borrowing another type's wiring. |
| `/calculator` | Four determining coins fix the type; four confirming coins are derivable checks. Always narrows, never returns nothing. |
| `/read-someone` | The same instrument for typing someone else: six ordinary things to ask or notice in conversation, none of them naming the axis they test. Scores through the same `calculate()` as the calculator. |
| `/types` | All sixteen at a glance, grouped by quadra or temperament. |
| `/type/:type` | The eight slots, all four sides, the exchange overlay with its subtype coins, growth gate, the Octagram wheel and theme grid, behavioural profile, and what each function wants. |
| `/sides` · `/sides/:type` | The field guide the type reader only summarises: how to assess, enter, operate, avoid and interact with each of the four sides, worked per-function where it matters — heaviest on the superego, where the developed pole is easiest to lose sight of. |
| `/pair/:a/:b` | Relation, **both** directional ease scores, and the composed playbook. Shareable URL. |
| `/network` | The reason this is software and not a spreadsheet: group as a weighted digraph. |
| `/matrix` | All 256 cells, colour-scaled, every cell a link into the pair reader. |
| `/lexicon` | 103 defined terms, searchable and filterable; `/lexicon/:id` pairs one term against every other member of its category. |
| `/admin` | The owner's door: approve, block and reset Google sign-ins. Unlisted; the API refuses non-owners. |

## The lexicon

Every term the system uses is defined, sourced and **pairable**. A definition alone is not much
use — what matters is what happens when two of them meet. So each category that can pair does:
Infantile against Caregiver, Alpha against Gamma, Play against Blast, and so on for all sixteen
ordered combinations in each. Where the structure determines the answer the pairing is derived;
where the flavour is the content (romance styles, interaction styles) all sixteen ordered pairs
are authored, because reading someone is not the same as being read by them.

## Counterpart and Catalyst

Two derived fields that the original workbook conflated into one:

- **Counterpart** — Counterpart + Spark. Supplies your **Cave**, the function you fear. Restful.
- **Catalyst** — the two types whose Lead is your **Doubt**. Supplies the function you are
  consciously reaching for and reflexively arguing with. Stimulating, slightly abrasive.
  Structurally this always resolves to your Damper and Loose-fit partners.

An ENTP wants convergence, but convergence is introverted intuition, and that is the Doubt —
which is why INTJ and INFJ feel compelling rather than comfortable, and why the old
"Sidekicks" column kept reaching for them.

## The four sides of the mind

`fourSides()` returns four complete sides, each with its own four-slot stack, its gateway, what
blocks that gateway, what opens it, and what a developed versus undeveloped version looks like.
The same three involutions that generate the relation table generate the sides:

| Side | Slots | Gateway | Blocked by | Relation to ego |
|---|---|---|---|---|
| Ego | Lead · Support · Delight · Cave | Lead | — | Twin |
| Subconscious | the ego stack reversed | Cave | insecurity | **Counterpart** |
| Unconscious | Doubt · Scold · Blind spot · Dread | Doubt | worry | **Damper** |
| Superego | the shadow reversed | Dread | fear | **Standoff** |

The Dread sits in the Cave slot of the unconscious and the **Lead slot of the superego**, which
is exactly why that side reads as a parasite persona. Verified against the source's own worked
INTP example in `tests/sides.test.ts`.

## The Octagram

The advanced layer, and the hardest material the app carries. It goes in as two layers with a
hard line between them, because the sourcing is not uniform.

**The wheel layer is structurally derived.** Sixteen types pair off into eight *dyads* — a type
together with its subconscious, which is its Counterpart — and two dyads make a *temple*, which
is exactly one orbit of the four-sides operation. `wheelOf()` and `templeOf()` compute
membership from `fourSides()`; no membership table exists. The authored surface — each wheel's
origin, Living Virtue, Deadly Sin and two poles — matches the source's eight published wheel
diagrams on **40/40 fields**, and the derived membership matches the published lists **16/16
dyads and 16/16 temples**. That makes the Octagram the app's strongest external validation:
the published structure is reproduced by an operator that was in the engine before the
Octagram was read about.

| Temple | Wheels | Origins |
|---|---|---|
| Soul — identity and character | ENFP·ISTJ, ESTP·INFJ | Justification, Intimacy |
| Mind — knowledge and judgement | ESTJ·INFP, ENFJ·ISTP | Authority, Validation |
| Heart — desire and regard | ENTP·ISFJ, ESFP·INTJ | Satisfaction, Reverence |
| Body — action and legacy | ESFJ·INTP, ENTJ·ISFP | Discovery, Purpose |

The eight sins on the wheels are a recognisable descendant of the old eight-sin tradition —
not, as this README once claimed, "the classical Evagrian eight" (that list has sadness and no
envy; the correction is documented in `octagram.ts`). The check that matters is direct: the
table matches the published diagrams.

**The theme layer is biographical and is not derived from anything.** Subconscious development
(SD/UD, set in childhood and rarely changing) crossed with focus (SF/UF, mutable) gives Joy,
Decay, Hope and Despair. Decay is carried as the source states it — refinement, "burning away
all that is unnecessary", not simple decline. The coins are self-reported controls on the type
page, and the assistant is instructed never to guess them from a type.

**What is not settled is written down.** `UNSETTLED` in `octagram.ts` records the real gaps:
the per-type *meaning* of the poles (members-only material this app has not seen), the
temple-interaction claims (single summary, uncorroborated), and how focus meets the wheel.
Where sourcing is thin, the app says so on the page.

## Externally validated

The engine derives its output rather than storing it, which makes independent published tables
a real test. Asserted in `tests/ingested.test.ts` and `tests/octagram.test.ts`:

- **Berens' "16 Type Patterns"** agrees with `stack()` on **128/128 slots**.
- **A Socionics intertype chart** agrees with `REL` on **all 256 cells** — a clean bijection of
  its sixteen labels onto the engine's codes. A second, independently-keyed chart also agrees
  on all 256.
- **The Octagram partition** above: 16/16 + 16/16 membership, 40/40 authored fields.
- **An OPS slide** independently confirms the Play/Consume correction below.

And one table that deliberately does **not** agree — see next section.

## The empirical counterweight

`empirical.ts` carries a published survey matrix (CC BY 4.0, attribution preserved in the
bundle) whose correlation with the model's ease scores is **negative** (r ≈ −0.15), and the
app shows the divergence rather than smoothing it over. A model that only ever cited evidence
agreeing with it would not deserve the reader's trust.

## Two corrections to the exchange overlay

The retired Python reference engine had two errors here. Both are fixed in `src/engine/ops.ts`
and asserted from first principles in `tests/ops.test.ts`. Neither touches the 4-bit head, so
no relation, score or playbook changed.

1. **Flinches used the attitude-flip instead of the axis opposite**, which put them in the
   shadow block. The overlay's four functions are the ego's top four.
2. **Play and Consume were transposed**, so every type's primary current was mislabelled.

`tests/reference-fixture.json` is left untouched as the record of what the Python engine
produced. Six fixture comparisons were retired in the process (this README once said four —
the count is now taken from the git history, not memory); `tests/engine.test.ts` documents the
two errors behind them.

## Private by default

Nothing here is public except the front door. The Worker gates **every** request — the app
shell, every asset, every API route — before the static asset binding is ever reached. An
unauthenticated visitor gets the marketing page at `/`, the gate everywhere else, and never a
byte of the app.

Two ways in:

- **Invite codes** (`ACCESS_CODES`, `label:code` pairs). Stateless; sessions are HMAC-signed
  cookies. Since 2026-08 each session also carries a digest-prefix identity of its code, so two
  codes sharing a label are still two people.
- **Google sign-in with owner approval.** A first sign-in creates a `pending` record in KV and
  emails the owner two signed one-decision links (approve/deny) that work from a phone without
  signing in. `/admin` is the full console. Blocked means blocked on the next page load.

The decisions that would bite if you didn't know them:

1. **It fails closed.** Missing secrets serve a "not configured" page, never the app.
2. **Codes are compared as SHA-256 digests**, so neither the code nor its length leaks through
   response timing.
3. **Only failed logins count toward the in-memory brake**; the cross-isolate rate-limit
   binding above it counts attempts, with its ceiling set where only brute force reaches it
   (`wrangler.jsonc` says why).
4. **Rotating `AUTH_SECRET` ends every session everywhere at once.** That is the panic button.
5. **Every response carries the security-header layer** (`src/worker/headers.ts`): CSP allowing
   exactly two inline scripts by hash, HSTS, nosniff, referrer and permissions policies.

`tests/auth.test.ts` asserts the boundary against the handlers; `tests/workers/` asserts it
again **inside the real Workers runtime** — real crypto, real KV, forged cookies, blocked
users. What only a deployed probe can prove (`run_worker_first` edge routing) is a manual
checklist in `docs/QA-REVIEW.md`.

## The assistant

A persistent, context-aware rail on every route, backed by Gemini through the Worker. The key
is a Worker secret and never reaches the browser.

What makes the answers worth having is `src/engine/context.ts`: every request carries a system
instruction assembled server-side from the engine's own derived output for whatever is on
screen. A caller cannot edit the grounding out of the request — and since 2026-08 cannot smuggle
arbitrary instruction text *in* either: the client's context object is validated against what
the views actually publish (`parseContext` in `chat.ts`), free text is bounded and stripped,
and the primer names screen text as data, not instructions.

Conversations are logged to KV (90-day TTL) and **mailed to the owner** when a session ends —
beacon, reset, or the hourly cron sweep for sessions that just stopped. The rail tells readers
this. History is served back to each person, scoped to their own identity.

## Reading the reading surface

Paper canvas, a serif body face at 19px on a 68ch measure, a **14px floor on every piece of
text including inside SVG**, and a full dark theme. `tests/palette.test.ts` reads the tokens
straight out of `tokens.css` and asserts every foreground/background pair clears WCAG AA on its
own canvas in both themes. Structure is tested too (`tests/a11y.test.ts`): ARIA tables contain
real cells, scrollable figures are keyboard-reachable, and facts that lived only in hover
tooltips also exist as text a screen reader announces. A render throw shows a readable fallback
page, not a blank document (`ErrorBoundary`, tested in jsdom).

## The deck

Seventy-seven printed cards plus a matching back, generated from the engine rather
than written for it: eight Elements, eight Seats, sixteen Wirings, four Sides,
four Camps, eight Bonds, sixteen Channels and eight Wheels, with five cards that
teach the deck its own vocabulary before the suits start — a frame card that
says what each suit is for, and a decoder that walks four letters to a stack.
Each card carries a generative composition seeded by its own id and coloured
from the app's function palette — a Channel's bundle crosses or runs parallel
according to its ease score, a Side's door stands open by exactly as much as
that side is reachable, a Wiring bears the bold seal of its own archetypes
opposite its name — and every element the art draws prints its two letters and
ripples with its attitude (crests breaking outward for e, inward for i), because
four hue families over eight elements means colour alone cannot name one.

**Bonds** are the one surface here that does not name a type, in two derived
halves. The axis bonds: `bondFacts()` sweeps all 240 ordered cross-type pairs and
finds the four axis-opposite lead pairings (Ne·Si, Se·Ni, Te·Fi, Ti·Fe) averaging
93 of 100, 29 clear of the next class. The Spark bonds: `sparkFacts()` proves that
each Lead being answered by the other's *Support* — both crossings at once — is
exactly the Spark relation at 92, while one crossing alone is only Upstream (54)
or Downstream (48). Both claims are about elements, so they hold for any two
types carrying them.

```sh
npm run cards      # → dist-cards/octant-cards.pdf (bleed size, one card per page)
                   #   dist-cards/octant-sheets.pdf (A4 proof sheets, crop marks)
```

Standard poker trim, 63 x 88mm inside a 69.09 x 94.23mm page. Vector all the way
into the PDF, no image files anywhere in the repo, and the build fails if any
card's text overruns its safe area — a browser measures every one.
**[docs/CARDS.md](./docs/CARDS.md)** is the full spec.

## Develop

```sh
npm install
cp .dev.vars.example .dev.vars   # add a Gemini key to use the assistant locally
npm run dev        # http://localhost:5173 — the REAL Worker router, wall and all
npm test           # the full suite: unit + Workers-runtime projects
npm run lint       # Biome, linter only — the formatter is off on purpose
npm run typecheck
npm run build      # → dist/
```

The dev server runs the Worker's own default export and hands asset requests back to Vite, so
every route *handler* — Google, admin, chat history — behaves locally exactly as deployed, and
the wall fails closed without `.dev.vars`. One thing dev cannot reproduce: because Vite plays
the asset store, it does not exercise Cloudflare's `run_worker_first` edge routing — only
`wrangler dev` or the deployed URL proves that assets go through the wall (DEPLOY.md has the
probes). CI (`.github/workflows/ci.yml`) runs typecheck, lint, tests and build on every push.

## Deploy

**Cloudflare Workers with Static Assets.** See **[DEPLOY.md](./DEPLOY.md)** for the full
runbook. Short version:

```sh
npm run cf:login     # Cloudflare OAuth, once
npm run deploy       # build + wrangler deploy
```

Or connect the repo in the dashboard for build-and-deploy on every push to `main` (non-`main`
branches build previews).

`not_found_handling: "single-page-application"` in `wrangler.jsonc` is what makes deep links
like `/pair/ENTP/ENFJ` survive a hard refresh, and `run_worker_first: true` is the entire
security property of the wall — the comment on it in `wrangler.jsonc` is required reading
before touching that file.

## Provenance

`src/engine/data.ts` began as output generated from a Python reference engine verified against
the spreadsheet build; `tests/reference-fixture.json` captures that engine's complete output,
and `tests/engine.test.ts` asserts the TypeScript port reproduces its structural claims. That
handover is complete: **TypeScript is canonical**, and the authored tables in `data.ts` are
edited directly — regenerating it is not part of the build and has not been for some time.

## Deliberately deferred

- A pluggable chat-model provider (the Gemini specifics are ~80 lines of `chat.ts`; the
  abstraction waits until a second provider is actually wanted — owner's call, 2026-08).
- History rewrite to shrink clones (~25 MB of removed-but-remembered binaries; see
  `docs/classification-report.md` for retrieval and reasoning).
- The remaining vocabulary passes (camps, the Octagram's product name) —
  `docs/VOCABULARY.md` tracks what shipped and what did not.

## Licence

Private. Frameworks referenced: Jung (*Psychological Types*, 1921), Beebe (*Energies and
Patterns in Psychological Type*), Myers (*Gifts Differing*), Augustinavičiūtė for quadra
structure. OPS and CS Joseph are named as interpretive lenses and attributed for vocabulary,
not cited as authority.
