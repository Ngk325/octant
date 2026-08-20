# Octant — full-perspective review, 2026-08-20

A complete audit of Octant from every perspective, weighted toward marketing, copy, display,
branding, visuals, illustrations, and flow, conducted on branch
`claude/octant-review-prompt-00k0hd` at `3e2297a`. Companion documents:
**`UPGRADE-PLAN.md`** (the phased plan derived from these findings) and
**`ACCEPTANCE-PROTOCOL.md`** (the repeatable QA protocol, first executed during this review).

**Evidence discipline.** Every claim below was verified this session by running a command,
reading a file, or opening a screenshot — never by quoting another document. Where a claim
could not be verified it is marked so. Screenshots referenced by name live in the review
evidence bundle; the curated subset cited by findings is in `docs/review-assets/`. Two
capture caveats apply to every screenshot: the review sandbox blocks `fonts.googleapis.com`,
so all screenshots render fallback typefaces (Georgia/system-ui/monospace), and full-page
captures of sticky-masthead pages show the masthead mid-image. Neither is an app bug;
neither was treated as one.

**Prior reviews.** `REVIEW-FINDINGS.md` (2026-08-01, self-marked historical) and
`QA-REVIEW.md` (2026-08-01, the live QA document) were read first; nothing they settled is
re-litigated here. Where their claims are load-bearing they were re-verified — and §8 records
that QA-REVIEW itself has drifted in the three weeks since it was written.

---

## 1 · Executive summary

**The product under the paint is in unusually good shape.** 1225 tests pass; the engine's
showpiece claims verify to the decimal (the empirical counterweight really is r = −0.154;
the Octagram tables really do match the published sources; "always narrows" really holds,
in the UI as well as the engine); the copy doctrine ("plain first, technical underneath")
is enforced by components and tests, not aspiration; and the security architecture is
single-exit and honest about its failure modes. The strongest assets — the derived-not-stored
engine, the both-directions thesis, the enforced honesty culture, the 78-card deck generated
from the same engine — are genuinely differentiating and must be protected (§13).

**The one P0 is a direct hit on the brand's central promise.** The marketing hero's
"worked example" — the first proof a visitor sees — attaches both scores, both relation
names, and both glosses to the wrong directions. The engine, the signed-in app, and the
site's own public `/read/entp-and-infp` page all agree ENTP experiences this pair as 34 and
INFP as 44; the hero says the opposite, under a code comment claiming it "cannot drift."
For a product whose headline is "nothing can quietly contradict anything else," the front
door contradicting the product two clicks away is the exact failure the positioning stakes
itself against. It is a one-line fix and a one-test prevention (§5, MKT-1).

**The pattern behind most findings is a single disease: hand-written numbers.** The hero
swap, "thirteen-stage course" (three documents; the code ships fifteen), "100 lexicon
entries" (103), "27%" with no test, "different numbers, always" (false for 73% of pairs),
QA-REVIEW's stale gates, the documented brand palette that ships nowhere — every one is
authored prose drifting from computed truth in a codebase whose entire thesis is that
derived things cannot drift. The upgrade plan's deepest item is therefore not a fix but a
rule: **every number on a public surface is either rendered from the engine or pinned by a
test** (UPGRADE-PLAN, P0-2).

**Scores** (1–10, justifications in each section):

| Perspective | Score | Headline |
|---|---|---|
| Marketing & positioning | 6.5 | Sharp wedge, real funnel — flagship example is wrong, best free proof unlinked |
| Copy & voice | 7 | Doctrine enforced by tests; renames half-landed, register cracks at the edges |
| Display & UI | [PENDING-VISUAL] | |
| Branding & identity | [PENDING-VISUAL] | |
| Illustrations & diagrams | [PENDING-VISUAL] | |
| Flow | [PENDING-VISUAL] | |
| Supporting (a11y · perf · security · docs) | 7.5 | Floor far above typical; systemic dt/dd + contrast misses; bundle unwatched |
| Content integrity | 7.5 | Engine claims verify exactly; prose counts drift everywhere |

**Top 10 findings across all perspectives** (full detail in the sections cited):

1. **MKT-1 (P0)** Hero worked example: directions swapped vs engine, app, and own /read page — §5
2. **MKT-2 (P1)** Paying customers hit a sign-in gate that says they must wait for owner approval — §5
3. **MKT-3 (P1)** Hero promises "eight questions, free"; /onramp delivers two behind an email gate titled "See your directional reading" that shows no reading — §5
4. **MKT-4 (P1)** The 136 public engine-derived /read pages — the best free proof — are linked from nowhere — §5
5. **COP-2 (P1)** Every pair page opens with the old relation name ("Conflict.") two lines above the shipped name ("Headwind") — §6
6. **SUP-1 (P1)** Onramp lead token is replayable: one token can direct Octant-branded mail at arbitrary addresses — §8
7. **INT-2 (P1)** The documented brand palette (DESIGN-SYSTEM/BRIEF) ships nowhere in the app — §7
8. **INT-1 (P1)** Partner terms overclaim "different numbers, always" — false for 73% of pairs — §7
9. **INT-3 (P1)** Course stage count wrong in three documents (13/14 vs 15 shipped) — §7
10. **SUP-5/6 (P2)** No skip link; silent SPA navigation; chat replies never announced — systemic AT gaps — §8

[PENDING-VISUAL: top-10 to be re-ranked once display/branding/illustrations/flow findings land]

---

## 2 · Baseline — gates run this session

| Gate | Result (2026-08-20) | QA-REVIEW (2026-08-01) | Drift |
|---|---|---|---|
| `npm test` | **1225 passed / 47 files / 0 failed** | 832 / 29 | +393 tests, +18 files |
| `npm run typecheck` | clean | clean | — |
| `npm run lint` | **0 errors, 5 warnings** — `base.css:121-123` noImportantStyles ×3, `components.css:394,483` noDescendingSpecificity | "0 errors (7 suppressions)" | 5 new warnings |
| `npm run build` | clean — `index-B4qwz5m7.js` **632,308 B / 195 KB gzip**, single chunk; Vite >500 KB warning firing | 558 KB / 178 KB | **+13% in 3 weeks** |

Toolchain: node v22.22.2, npm 10.9.7. The dependency set is current (React 19, Vite 8,
TypeScript 6, Biome 2, Wrangler 4) — this review found no dependency-upgrade work to
schedule; the "upgrade" this project needs is not its stack.

## 3 · Access, honestly obtained

The dev server runs the **real Worker** — whole router, access wall included
(`vite.config.ts` `devApi()`), so every signed-out behaviour in this review was observed
against production code paths. Access: `cp .dev.vars.example .dev.vars`, `npm run dev`,
`POST /api/auth/login {"code":"let-me-in"}` → session cookie. The signed-in `/` renders
onboarding until `localStorage["octant.onboarding.done"]="1"` (`src/App.tsx:182`). `/admin`
under a code session shows the API's owner-only refusal (correct behaviour; reviewed
statically). Not reachable in this sandbox: `wrangler dev` (the §6 boundary checks 1–3 of
QA-REVIEW must still be run before the next deploy) and the Resend email path.

## 4 · The route walk

44 app/gate routes + 9 signed-out marketing routes + 2 `/read` pages were walked by script
at 1440×900 and 390×844, light and dark — 206+ full-page screenshots, plus an interactive
calculator click-through (`flow-calc-after-{1,4,8}.png`) and onramp steps 1/2/5/11.
Manifests (`manifest.json`, `manifest2.json`, `manifest3.json`, `flow-calc-log.json`)
record per-page status, title, h1, and console errors.

**Result: zero real console errors and zero non-200s across all 160 walked app pages.**
Every logged error was the sandbox's `fonts.googleapis.com` block (an environment artifact —
though the runtime Google-Fonts dependency is itself finding SUP-12). The README route
table's omissions surfaced by the walk (live `/bonds`, `/guide`, and the whole signed-out
`/partners`, `/compare/*`, `/onramp`, `/read/*` surface) are INT-4 and §5 context.

Page-height census (desktop, light, full page): lexicon term pages ≈ **35,100 px** (~39
viewport-screens), lexicon index ≈ 33,900 px, type pages ≈ **16,860 px** (~19 screens),
sides ≈ 7,000 px, signed-out home 5,281 px, matrix 5,067 px, pair ≈ 4,500 px. Density and
wayfinding on the three tallest surfaces are assessed in §9 [PENDING-VISUAL].

---

## 5 · Marketing & positioning — score 6.5/10

**What's strong, and must not be lost:** the wedge claim ("a single compatibility score is
a fiction") is sharp, differentiated, and stated identically across landing page, onramp,
nurture emails, and partner docs; pricing is consistent to the dollar across five surfaces;
a real no-invite path exists (free `/onramp` → Stripe $25 → webhook auto-preapproval,
verified in `stripe.ts`); and the proof band's two hardest claims are *actually reproduced
by the test suite* (`tests/ingested.test.ts:55-58` derives the 128/128; `:214` asserts
r ≈ −0.154 — 61/61 passing this session). Marketing that advertises its own disconfirming
evidence and pins it in CI is a category rarity. The partner materials
(`/partners`, `PARTNERSHIP-TERMS.md`, the rate card) are diligence-grade: four arrangements
on three clean axes, honest commercials, "the questions we will ask you anyway."

**Findings:**

| ID | Sev | Finding | Evidence anchor |
|---|---|---|---|
| MKT-1 | **P0** | **Hero worked example swapped.** `HERO_READING` (hardcoded, `marketing.ts:137-173`, under a comment claiming it "cannot drift") attaches 44/"Examined"/the blind-spot gloss to ENTP→INFP and 34/"Examiner" to INFP→ENTP. Engine (run this session): `ease(ENTP,INFP)=34`, `relation(ENTP,INFP)=SR`="Examiner"; INFP's lead Fi lands in ENTP's Blind spot (seat 7), ENTP's lead Ne in INFP's Support. The site's own public `/read/entp-and-infp` and the signed-in home diagram both print ENTP 34 / INFP 44. Every element of both hero rows belongs to the other row. | `marketing.ts:137-173`; engine runs; `read-pair-desktop-light.png`; `home-app-desktop-light.png`; `home-signedout-desktop-light.png` |
| MKT-2 | P1 | **Payer hits an owner-approval wall.** Pricing card: "Payment unlocks your account automatically — sign in with Google right after and you're straight in" (`marketing.ts:807-810`; `stripe.ts:124-152` really does preapprove). The `/signin` gate a payer lands on says: "This is a private instrument… If you sign in with Google you will wait until they approve you" — unconditional copy, no "already paid?" path. | `signin-desktop-light.png`; curl this session |
| MKT-3 | P1 | **Onramp promise gap.** Hero note: "Free, no account. Eight either-or questions." The funnel asks **two** real coins (`onramp.ts:131-136`), plus a Likert hook and segmentation; the email step titled "See your directional reading" (`onramp.ts:359`) requires an email and the done step shows no directional reading — only "one of about N of sixteen" + a $25 CTA. Three promises broken in sequence on the page that attacks competitors for overpromising. | `onramp.ts:50-52,131-136,359,366,384-393`; `mkt-onramp-*.png` |
| MKT-4 | P1 | **Best free proof unlinked.** `/read` serves 136+ public, crawlable, engine-derived pair/type readings with real directional scores — and no human-facing surface links it: zero references in nav, footer, hero, or onramp done page. It exists only for crawlers via sitemap.xml. | `read.ts:10-36,445-467`; grep `"/read` in `marketing.ts` → none |
| MKT-5 | P2 | **"27%" unpinned and un-derivable from the stated universe.** Band says "256 ordered pairs, each scored twice" then "27% of pairs differ." Measured: 64/256 = 25.0%; 64/240 (self-pairs excluded, never stated) = 26.7%. Two of the band's five numbers are test-pinned; this one is not. Also "each scored twice" double-counts — each ordered pair is scored once. | `marketing.ts:606-611`; engine sweep this session |
| MKT-6 | P2 | **No og:image / twitter:image on any public page** — the visually distinctive product shares as bare text; favicon is a data:URI most scrapers can't use. | `marketing.ts:487-506`; grep → none |
| MKT-7 | P2 | Partner terms say "thirteen-stage course" in a document declaring its numbers "fixed until 31 Dec 2026"; the product ships fifteen. | `PARTNERSHIP-TERMS.md:4,35` |
| MKT-8 | P2 | The crown-jewel concrete claim (256 scores from ~2 KB seed, no database, cannot drift) appears only in the confidential partner doc; the public page waters it down to "one small piece of structure." | `PARTNERSHIP-TERMS.md:43-45` vs `marketing.ts:656-664` |
| MKT-9 | P2 | The strongest trust signals cite deliberately unnamed sources ("an independent published table") — unfalsifiable to outsiders — while `/compare` already names MBTI/Socionics/Big Five, so the naming seal is already deliberately broken elsewhere. | `marketing.ts:9-12,606-611`; `/compare` |
| MKT-10 | P3 | Hero proof panel spends the newcomer's first ten seconds on undefined jargon ("Examined," "Blind spot," "indigo N, sienna S…"). | `marketing.ts:71-77,142-173` |
| MKT-11 | P3 | Two flagship taglines: public door sells "compatibility runs in two directions"; the app a convert enters is titled "read the wiring." | `marketing.ts:175` vs `index.html:6` |
| MKT-12 | P3 | Partner rate card uses accent `#5B32A8`; every other surface `#4C4899`. The one artifact partners forward internally is the one in a different violet. | `partner-rate-card.html:25,139,224` |

## 6 · Copy & voice — score 7/10

**What's strong:** the plain-first doctrine is *infrastructure*, not intention — all 103
lexicon entries carry a jargon-free gloss asserted by `tests/plain.test.ts` (including a
regex ban on borrowed vocabulary inside the plain layer); the `Explain` component
guarantees the technical layer is never removed or gated; error and empty-state microcopy
is humane and honest ("the fault is in the software, not in anything you did"; the
calculator's "Not an error." disagreement note); and the compare pages concede real ground
on purpose (they tell hiring buyers to use Big Five instruments). Measured registers:
marketing hero ≈ grade 10.7, app home lede ≈ 4.8, course plain gloss ≈ 4.1.

**Findings:**

| ID | Sev | Finding |
|---|---|---|
| COP-1 | P1 | The hero worked-example swap, restated from the copy side: the panel is only coherent under an unstated convention that contradicts every in-app surface's labeling ("A being around B"). Same fix as MKT-1. |
| COP-2 | P1 | **`REL_FRAME` — the first sentence of every composed playbook — still opens with six pre-rename relation names** ("Identity.", "Activity.", "Mirror.", "Business.", "Super-Ego.", "Conflict."). On a pair page the reader sees "Conflict. Your strongest function lands…" two lines above an Explain saying the relationship's name is "Headwind." "Super-Ego" is exactly the borrowed vocabulary `VOCABULARY.md` exists to keep out; it slips the attribution test because that test bans authors, not relation names. (`data.ts:257-274` vs `data.ts:96-113`; `curriculum.tsx:681` has the same slip.) |
| COP-3 | P1 | The onramp promise gap, copy side (see MKT-3): the CTA note, the step title, and the delivery must be made to tell one truth. |
| COP-4 | P2 | Three collective nouns for one grouping live simultaneously: "quadra" (Home, course body), "Camp" (type page, plain gloss, bonds stage), "Clubs" (course stage title). |
| COP-5 | P2 | Half-landed renames: "The four animals" heading over body copy teaching "currents" in the same viewport (`curriculum.tsx:541,545-547`); "coins" (Calculator, Home, Read) vs "switches" (type page). |
| COP-6 | P2 | `FN_LONG`'s hype register ("absolute moral truth," "flawless internal logic," "Simulates the multiverse") breaks the honest-asterisk voice inside the mechanics layer — rendered on the type page, the deck, and public /read pages. |
| COP-7 | P2 | Dialect mix in user-facing copy, including both dialects of one word on one calculator card ("I organise it afterwards" under the label "Organize vs Gather"). The authored voice is predominantly British; the strays are American. |
| COP-8 | P2 | Proof-band number phrasing muddles its own universe (see MKT-5); the course states the same facts correctly — reuse its phrasing. |
| COP-9 | P2 | Home's tile blurbs leak ~6 unexplained terms-of-art ("exchange overlay," "growth gate," "spark meshes," "coins") without the `Term`/`Explain` layer — the one first-contact surface that skips the doctrine. `plain.test.ts`'s jargon ban covers only the plain layer's own strings, which is exactly how this leaked. |
| COP-10 | P2 | The public hero lede reads ~6 grades harder than the product's own plain layer, and leads with "derivation" — the most technical noun available — before any plain claim. |
| COP-11 | P3 | "iNtuition" (borrowed MBTI mnemonic styling) and "Intraverted" (33×, deliberate but documented nowhere — not even in VOCABULARY.md, whose rule is "if a word is not in this file, it is not in the product"). |
| COP-12 | P3 | `SLOT_TAGS`: "Blindspot" beside `SLOT_NAMES`' "Blind spot" — the deck already patches it with `.replace()`, proving it's known — and "Hate," the product's harshest word, appears in no vocabulary decision. |
| COP-13 | P3 | "Superpower and kryptonite" (course) vs "Superpowers & kryptonite" (type page nav); neither word is in the locked vocabulary, and "kryptonite" is borrowed pop-IP in a product that removed "Victim" and "demon" for less. |

## 7 · Content integrity — score 7.5/10

Every load-bearing *engine* claim executed verified exactly, often to the decimal. The
drift is all in authored prose. The full claim table:

| # | Claim | Verdict | Evidence (this session) |
|---|---|---|---|
| 1 | Catalyst always resolves to Damper + Loose fit | **VERIFIED** 16/16 | `catalysts()` sweep → only EX, MG |
| 2 | "All 100 lexicon entries" (README:46) | **DRIFTED** — 103 | runtime count; `plain.test.ts:30`; README says 103 correctly twice elsewhere |
| 3 | Octagram: dyads/temples derived, match published lists; 8 published sins | **VERIFIED** | `octagram.test.ts` (207 tests across 4 engine files run directly) |
| 4 | Calculator "always narrows, never returns nothing" | **VERIFIED** — engine and UI | `calculate()` ranks all 16; interactive click-through: "1 of 16 left," ranked fits, disagreement note |
| 5 | Suite/gates | **VERIFIED** | §2 |
| 6 | README route table complete | **DRIFTED** — omits `/bonds`, `/guide`(+`/:type`); whole signed-out surface undocumented | `App.tsx:192,198-199` |
| 7 | README engine map complete | **DRIFTED** — omits bonds.ts, emoji.ts, romance.ts, powers.ts, learnGrounding.ts (5 of 21) | `ls src/engine` |
| 8 | "~2 KB of genuine seed data" | **DEFENSIBLE** — measured seed spans 1,720–2,248 B depending on inclusion; file total 23,420 B is 87% authored copy, exactly as the README's own asterisk says | byte spans in `data.ts` |
| 9 | Dread in unconscious-Cave AND superego-Lead | **VERIFIED** 16/16 both | `sides()` sweep; `verify.ts:65-68` |
| 10 | `ease()` reads a hand-set 16-value ramp | **VERIFIED** | `core.ts:101-102`; `REL_SCORE` 16 literals |
| 11 | Empirical counterweight r ≈ −0.15 | **VERIFIED** — r = −0.1540; DU survey-mean 7.4 vs derived 100; 132/256 median-split disagreements | computed from `empirical.ts` |
| 12 | "Thirteen-stage course" | **DRIFTED ×3** — 15 shipped; README:38,56 + PARTNERSHIP-TERMS:35 say 13, PLATFORM-BACKPORT:171 says 14; marketing/partners pages and `Home.tsx` (dynamic) are correct | `STAGES.length` |
| 13 | index.html title/meta claims | **VERIFIED** | 16/256/four-sides all confirmed |
| 14 | "27% of pairs differ by direction" | **VERIFIED-WITH-CAVEAT** — true only as 64/240 (26.7%); on the band's own stated 256 base it is 25.0%; unpinned | engine sweep |

**Findings** (beyond the table): INT-1 (P1) partner terms' "different numbers, **always**"
is false for 73% of pairs — the engine's own doc comment states the truth correctly;
INT-2 (P1) the **documented brand palette ships nowhere** — DESIGN-SYSTEM/BRIEF specify
"N violet `#6B3BC4` / S amber / T teal / F rose" while the app ships indigo/sienna/
verdigris/madder (`palette.ts` FN_COLOR), and no doc hex appears in any src file;
INT-3 (P1) the stage-count drift (claim 12); INT-4/5 (P2) the README's two coverage gaps
(claims 6–7); INT-6 (P2) DESIGN-SYSTEM's absolute "no emoji" rule vs the shipped emoji
guide at `/guide`; INT-7/8/9 (P3) the "100 entries" line, the "no stored matrix" clause
(RECIPROCAL and REL_SCORE are stored frozen tables, asserted-not-derived), and the
"thirteen text cards" comment in `Learn.tsx:182`.

## 8 · Supporting audits — score 7.5/10

**Accessibility.** The floor is far above typical — all 21 SVG-bearing components carry
`role="img"`+label or `aria-hidden` (audited individually); NetworkRing pairs its figure
with a tested sr-only per-edge list. But axe-core (7 pages, this session) found two
systemic serious violations the unit suite cannot see: **`dt/dd` outside `dl`** across all
"row" layouts (84 nodes on one type page; also calculator, matrix, learn) and
**`.gpath-step` muted-small text below AA** (6 nodes) — the palette test asserts token
pairs, not composed use. Structural gaps: **no skip link** (16 tab stops before content;
`.sr-only` and `:focus-visible` utilities already exist), **silent SPA navigation** (no
focus move, no live region — `App.tsx:66-77` scrolls only), **chat replies never announced**
(`.rail-log` has no `role="log"`), onramp radios lack fieldset/legend, and the flagship
WiringSchematic flattens eight seat assignments to a one-sentence label while the codebase's
own better pattern (NetworkRing) sits unused beside it.

**Performance.** One 632 KB chunk, all 16 views statically imported, no `React.lazy`
anywhere, bundle +13% in three weeks with no size budget watching it. Honest split
assessment: lazy-load the four route-isolated heavies (TypeReader, Guide, Matrix, Admin)
and stop — the invocation economics of `run_worker_first` argue against over-chunking.
Assets ship with no cache-control under run_worker_first (QA-REVIEW's AR-2; its own
documented trigger — "if this ever opens up" — has arguably fired now that a public funnel
exists). Fonts: three Google-hosted families on the critical path of every page including
the anonymous funnel; self-hosting is also the named path to a tighter CSP.

**Security posture** (source review; no pentest). One P1: **the onramp lead-capture token
is replayable** — `seal({t: now})` binds nothing, lives an hour, is not single-use; one aged
token can direct Octant-branded Resend mail at unlimited arbitrary addresses and burn the
KV free-tier write budget (`onramp.ts:63-98`, `leads.ts:78-101`; the in-source comment
acknowledges the shape but only the single-request version). Also: QA-REVIEW's adversarial
pass predates the entire public surface (auth.ts still says "Nothing is public" while
index.ts exposes ~9 unauthenticated routes); the dev server serves the SPA shell without
the security-header layer, so app CSP breakage is invisible until deployed; minor: an
ad-hoc `<>&` strip where `escapeHtml` exists. Examined and found sound (deliberately not
findings): Stripe webhook verification, session HMAC discipline, admin owner-gating,
export-token digest comparison, the codeId identity fix.

**Docs drift.** QA-REVIEW's gates all stale within three weeks (§2); its secrets-scan
item 12 now false-positives on every clean build (Admin UI help copy legitimately contains
`AUTH_SECRET`/`ACCESS_CODES` as strings — scope the grep to value shapes); five of its
open items verified still open, none regressed; `TypeReaderLegacy.tsx` (40 KB, imported by
nothing, correctly tree-shaken) is diligence noise in src/views.

---

## 9 · Display & UI — score [PENDING-VISUAL]

[PENDING-VISUAL-DISPLAY]

## 10 · Branding & visual identity — score 7.5/10

**The current identity, as executed** (not as documented): one system, genuinely coherent
across both surfaces — marketing and app share the exact same paper (`#FDFCFA`/`#141310`),
the same semantic element palette and accent violet (`#4C4899` = Ne), the same
Newsreader/Inter/IBM Plex Mono stack, the same eight-disc alphabet band, the same diagrams,
holding in dark mode (`home-signedout-desktop-light.png` beside `home-app-desktop-light.png`
and their `-dark` twins). The divergences are all at the *brand-asset* layer: the MARK()
glyph appears on marketing but on **no signed-in screen** (the app masthead is the bare word
in body serif); the mark itself reads as a crosshair/settings glyph and encodes neither
"eight" nor "octant" (`marketing.ts:21-27`); **the app ships no favicon at all**
(`index.html` has no `rel=icon` — verified) and **no og:image exists anywhere**; the partner
rate card runs a third accent (`#5B32A8`); the marketing masthead uses
`backdrop-filter:blur(10px)` (`marketing.ts:244`) against the doctrine's own "no
glassmorphism"; the documented brand palette ships nowhere (INT-2); and composition drifts
(marketing left-aligned editorial, app home centered, types index left). Net: **a strong,
disciplined system wearing an unfinished, three-times-drifting brand.**

**Strongest thing:** the semantic-color system as one coherent instrument in both themes —
hue always means an element across discs, molecules, ease heatmap, and octagram, nothing
depends on color alone, all WCAG-locked by `tests/palette.test.ts`. This is the identity's
actual substance and every direction below preserves its doctrine.

### The three directions

| | **A · Sharpen the instrument** (refine) | **B · Ink and element** (evolve) | **C · New coordinates** (rebrand) |
|---|---|---|---|
| Thesis | Keep "quiet paper, precise geometry"; *finish* it — one system across all surfaces, plus the missing assets (true logotype + hardened mark, favicon, og:image, self-hosted type, one reconciled palette) | Keep the semantic-color doctrine exactly; replace the surface: element hues become the ONLY color (chrome/buttons/links go ink, retiring the fifth "brand violet"), plus a display face and a structural motif (the eight-slot column / molecule as recurring frame) | New palette (brighter, screen-native), new type pairing, new wordmark, redrawn glyph language. The honest third option — maximum memorability at maximum risk |
| Palette | Unchanged; reconcile rate card + design docs to shipped values | Hues kept (re-locked if paper shifts); accent demoted to ink | Wholesale replacement; every value re-derived against WCAG on both canvases |
| Type | Stack unchanged, self-hosted WOFF2; "Octant" drawn once as a fixed SVG lockup | Newsreader stays for reading; adds a display face for identity work; self-hosted | New pairing + purpose-drawn logotype |
| Illustration | Unchanged; add brand renders (og:image from the hero diagram; the deck photographed/rendered for marketing) | Same primitives promoted to framing — recognize an Octant screen by its skeleton | New language; everything redrawn |
| Equity lost | Essentially none | Moderate — the violet chrome signal and some "quiet warmth" | Large — WCAG-locked palette + tests, tuned dark mode, deck art, both surfaces' recognition |
| Effort | M | M | L |
| Audience | Newcomer: removes "is this finished?" doubt, keeps the calm · Enthusiast: rewards the rigor, surfaces the deck · Partner: settled identity + drop-in assets | Newcomer: bolder, higher activation energy · Enthusiast: biggest payoff · Partner: good, later | Newcomer: freshest, loses trust cues · Enthusiast: high risk of "pop-quiz brand" reading · Partner: asset churn |

**Recommendation: A, folding in two moves from B** — commission the true logotype +
hardened mark, and let the four element hues read as the hero color system. The evidence
says the *system* is an 8.5 and the deficits are all finishing-layer; the rational move is
to finish, not restart. C is documented as viable (the doctrine survives any hue set) but
nothing in the audit argues for paying its cost. The plan's brand fork (UPGRADE-PLAN §Brand
fork) shows exactly which items change under each direction.

**Findings:** BRD-1 (P1) mark absent from the entire signed-in app; BRD-2 (P1) the mark
reads generic and encodes nothing; BRD-3 (P1) type identity hotlinked from Google with no
self-host — a single external point of failure for the whole brand (`index.html:11`,
`marketing.ts:504-506`, `read.ts:102-104`); BRD-4 (P1) no app favicon, no og:image anywhere;
BRD-5 (P2) third accent in the rate card; BRD-6 (P2) documented palette ships nowhere
(=INT-2); BRD-7 (P2) backdrop-blur vs own doctrine; BRD-8 (P2) **the 78-card deck — the
most distinctive brand asset — is invisible in marketing** (mentioned in prose, never
shown); BRD-9 (P2) composition/alignment not unified; BRD-10 (P3) masthead controls are
terse Unicode glyphs (?, ☾, ⏻, ≡) outside the product's own glyph language; BRD-11 (P3) no
canonical logo lockup (wordmark re-set live, shifts by viewport); BRD-12 (P3) no exported
brand-asset source a partner can fetch.

## 11 · Illustrations & diagrams — score [PENDING-VISUAL]

[PENDING-VISUAL-ILLUSTRATIONS]

## 12 · Flow — score [PENDING-VISUAL]

[PENDING-VISUAL-FLOW]

---

## 13 · What NOT to change

Protected from well-meaning churn, with the evidence that earned each its place:

1. **The derived engine and its verification culture.** 1225 tests; structure computed
   from ~2 KB of seed; external validations (128/128, two 256/256 charts, 40/40 Octagram
   fields) reproduced in CI. This is the moat.
2. **The empirical counterweight.** r = −0.154, shipped and marketed. Almost nobody in
   this category ships disconfirming evidence; it is the single most partner-credible fact.
3. **The plain-first infrastructure.** `Explain`/`Term`, 103 glosses, jargon bans in tests.
   Extend it (to tiles, to marketing); never bypass it.
4. **The honest microcopy register.** Error copy, "Not an error." disagreement notes,
   "A lens, not a measurement" on every surface where it matters, compare pages that
   concede ground. This voice *is* the brand.
5. **The single-exit security architecture** and its documented tradeoffs
   (run_worker_first with the cost stated; walls that fail closed).
6. **The deck** — 78 cards generated from the same engine, tests asserting suit sizes and
   re-deriving all 256 grid cells. A physical brand asset competitors cannot fake.
7. **The MutualLanding diagram** (both-directions landing figure) — the thesis in one
   picture, used on home and pair pages. [PENDING-VISUAL: §11 confirms/expands]
8. **The dev-runs-the-real-Worker architecture** (`devApi()`) — the reason this review
   could verify signed-out behaviour honestly on localhost.

## 14 · Evidence bundle

- `docs/review-assets/` — curated screenshots cited by findings (subset of the 206+).
- Scratch evidence (session-local, referenced by name throughout): full shot set at all
  four viewport/theme combinations, `manifest{,2,3}.json`, `flow-calc-log.json`,
  `axe-results.json`, engine-sweep outputs, the four per-perspective audit JSONs.
- First execution of `ACCEPTANCE-PROTOCOL.md` — recorded at its foot.

[PENDING-VISUAL: final screenshot-manifest cross-check in §15 self-QA]

## 15 · Self-QA of this review

[PENDING: completed after visual sections merge]
