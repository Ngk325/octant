export const meta = {
  name: 'octant-visual-audits',
  description: 'Screenshot-based visual audits: display/UI, branding+brand directions, illustrations, flow',
  phases: [{ title: 'Audit' }],
}

const SHOTS = '/tmp/claude-0/-home-user-octant/9226adb3-21b5-57f0-8777-75de8a014f78/scratchpad/shots'

const COMMON = `
The repo is /home/user/octant. Screenshots of every route are in ${SHOTS}/ named <slug>-<viewport>-<theme>.png where viewport is desktop (1440x900) or mobile (390x844) and theme is light or dark. Read the actual PNG image files (you can Read images) — do not guess from filenames. A manifest at ${SHOTS}/manifest.json lists pages with title/h1/status/consoleErrors; manifest2.json covers signed-out marketing pages (mkt-*), manifest3.json the signed-in app home (home-app-*).
IMPORTANT CAVEAT you must state in your notes and NOT report as a bug: Google Fonts is BLOCKED by the sandbox, so EVERY screenshot renders fallback fonts (Newsreader→Georgia serif, Inter→system sans, IBM Plex Mono→monospace), NOT the real typefaces. Do not critique letterforms/font rendering. (That fonts are hotlinked from Google with no self-host IS a separate real finding, but judge it from source, not from the screenshots.) Also: full-page screenshots of pages with a sticky masthead show the masthead floating mid-image — a capture artifact, not a layout bug.
A dev server runs at http://localhost:5173 (real Worker, access wall active). Authenticated curl: add header 'Cookie: octant_session=eyJsIjoiZGV2IiwiayI6ImNvZGUiLCJjIjoiYTNlZTc4NmI1NzA3YzI3ZCIsImUiOjE3ODk4MDgyNjF9.AGDec1UEnwu0lXILgzPPz_PvjAxJNY-xHNPsgyp-ucw'. You may read source and run read-only commands. Do NOT modify any repo file.

EVIDENCE DISCIPLINE: every finding cites a screenshot filename you actually opened, and/or a file:line. Severity P0 blocker / P1 major / P2 minor / P3 polish. Tag each finding with audience lens(es): newcomer, enthusiast, partner. Return JSON via StructuredOutput.

Key facts already verified this session (cite, don't redo): 1225 tests pass; build is a single 632KB JS chunk; the marketing hero worked-example has ENTP/INFP directions SWAPPED vs the engine (P0, owned by the marketing audit — do not re-file, but you may reference it); axe-core found systemic dt/dd-without-dl (84 nodes on a type page), 6 serious color-contrast fails on .gpath-step .muted.small, plus onramp/calculator landmark+heading-order issues; README says "thirteen-stage course" but 15 stages ship; design palette in docs/DESIGN-SYSTEM.md (N #6B3BC4 violet / S #8A5410 amber / T #0D6560 teal / F #AE3355 rose) does NOT match the shipped src/engine/palette.ts FN_COLOR (Ne #4C4899, Se #855723, Te #326758, Fe #983E4A) — the documented brand palette ships nowhere.`

const SCHEMA = {
  type: 'object',
  required: ['score', 'scoreRationale', 'strongestThing', 'findings', 'notes'],
  properties: {
    score: { type: 'number' },
    scoreRationale: { type: 'string' },
    strongestThing: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'title', 'detail', 'evidence', 'lenses', 'recommendation'],
        properties: {
          severity: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
          title: { type: 'string' },
          detail: { type: 'string' },
          evidence: { type: 'string' },
          lenses: { type: 'array', items: { type: 'string', enum: ['newcomer', 'enthusiast', 'partner'] } },
          recommendation: { type: 'string' },
        },
      },
    },
    notes: { type: 'string' },
  },
}

phase('Audit')

const brandSchema = {
  type: 'object',
  required: ['score', 'scoreRationale', 'strongestThing', 'currentIdentityAssessment', 'directions', 'recommendedDirection', 'findings', 'notes'],
  properties: {
    score: { type: 'number' },
    scoreRationale: { type: 'string' },
    strongestThing: { type: 'string' },
    currentIdentityAssessment: { type: 'string', description: 'the current identity as EXECUTED (not as documented), with screenshot evidence' },
    directions: {
      type: 'array',
      description: 'exactly three: A refine, B evolve, C full rebrand',
      items: {
        type: 'object',
        required: ['id', 'name', 'thesis', 'palette', 'typography', 'illustration', 'audienceEffect', 'equityLost', 'effort', 'affectedItems'],
        properties: {
          id: { type: 'string', enum: ['A', 'B', 'C'] },
          name: { type: 'string' },
          thesis: { type: 'string' },
          palette: { type: 'string' },
          typography: { type: 'string' },
          illustration: { type: 'string' },
          audienceEffect: { type: 'string' },
          equityLost: { type: 'string' },
          effort: { type: 'string', enum: ['S', 'M', 'L'] },
          affectedItems: { type: 'string', description: 'what work changes under this direction' },
        },
      },
    },
    recommendedDirection: { type: 'string', description: 'A, B, or C, with justification tied to the three audiences and the audit evidence' },
    findings: { type: 'array', items: SCHEMA.properties.findings.items },
    notes: { type: 'string' },
  },
}

const results = await parallel([
  () => agent(`Audit DISPLAY & UI for Octant. ${COMMON}

Assess layout, hierarchy, spacing, typography SCALE (not letterforms), information density, responsive behaviour, navigation/wayfinding, and light/dark parity — from the screenshots plus src/styles/tokens.css, base.css, components.css and docs/DESIGN-SYSTEM.md.
- Open a representative spread: home-signedout-desktop-light, home-app-desktop-light, type-entp-desktop-light AND type-entp-mobile-light, matrix-desktop-light AND matrix-mobile-light, network-desktop-light, lexicon-index-desktop-light, calculator-desktop-light AND -mobile-light, pair-entp-infp-desktop-light, sides-intp-desktop-light, learn-index + a couple learn-* stages, welcome-1/-index, and the DARK variants of home, type, matrix, network, lexicon.
- Density is the headline question: measured page heights (desktop light) — lexicon pages ~34-35k px, type pages ~16.8k px (≈19 screens), sides 7k, matrix 5k. Is that wayfinding-hostile? Is there in-page nav / sticky sub-nav / a table of contents on the tall pages? Assess the masthead (12 nav tabs + 4 icon buttons per manifest) and how it collapses at the tested breakpoints (tokens.css documents 1399/1239 container queries and 1180/1100/900/700/640/480 media queries — check the mobile shots honor them: no horizontal scroll at 390px, targets not too small, vertical labels un-rotating).
- Light/dark parity: compare each -light vs -dark pair for any surface that looks unconverted, low-contrast, or where a shadow/paper texture breaks.
- Cross-check the axe color-contrast + heading-order findings visually (type-entp, calculator, learn).
Produce 10-18 findings.`, { label: 'audit:display', schema: SCHEMA }),

  () => agent(`Audit BRANDING & VISUAL IDENTITY for Octant and PROPOSE THREE DIRECTIONS. ${COMMON}

The owner has granted FULL latitude including a full rebrand if justified. Octant is one product with TWO visual identities today: (1) the signed-out SaaS marketing site (server-rendered, src/worker/marketing.ts — see mkt-*, home-signedout-* shots) and (2) the signed-in instrument (React app, warm-paper "quiet paper, precise geometry" system — see home-app-*, type-*, matrix-*, lexicon-* shots). There is also a partner rate card (docs/partner-rate-card.html) reportedly using a different accent, and a printed 78-card deck (docs/CARDS.md, src/cards/).
- FIRST assess the current identity AS EXECUTED across those surfaces: is it coherent? Where does the marketing brand and the app brand diverge (color, type feel, warmth, geometry, logo/wordmark treatment — the mark is MARK() in marketing.ts and a plain "Octant" wordmark in-app)? Open home-signedout-desktop-light, home-app-desktop-light, mkt-partners-desktop-light, type-entp-desktop-light, types-desktop-light, and at least one dark shot. Note the documented-palette-ships-nowhere fact.
- THEN produce EXACTLY THREE directions in the 'directions' array: A = refine the current "quiet paper" identity (unify marketing+app on it, fix divergences); B = evolve (keep the semantic-color doctrine — hue means cognitive element — but replace the surface aesthetic for more distinctiveness/memorability); C = full rebrand (new palette, type, illustration language, wordmark). For EACH: palette intent, typographic direction, illustration language, audience effect across newcomer/enthusiast/partner, what equity is lost, effort S/M/L, and which work items change. The semantic-color constraint (hue encodes element, WCAG-AA, nothing-depends-on-color-alone; docs/DESIGN-SYSTEM.md §1) is a real design constraint — say for each direction whether it keeps or breaks it.
- Recommend ONE direction with justification tied to the three audiences and the evidence. A logo/wordmark that is just the word set in the body serif is a real distinctiveness gap for all three lenses — weigh it.
- Also give 6-12 discrete branding findings (severity-tagged) for whichever direction is chosen: wordmark, favicon/og-image (none exists — verified), accent consistency, marketing-vs-app divergence, the deck as a brand asset, etc.`, { label: 'audit:branding', schema: brandSchema }),

  () => agent(`Audit ILLUSTRATIONS & DIAGRAMS for Octant. ${COMMON}

The design doctrine (docs/DESIGN-SYSTEM.md §1) says every visual property must ENCODE meaning: hue=element, direction=attitude, size=rank (ratio 1/.78/.56/.42), vertical position=order, opacity=certainty; nothing depends on color alone; "people are geometry" (head circle + shoulder arc, never faces). §3 lists 15 mechanisms each with a stated gap. There are ~30 figure components in src/components/ (WiringSchematic, OctagramWheel, OctagramMap, FourSidesDiagram, NetworkRing, GatewayPath, DivergingEase, BondFigure, MutualLanding, TwoReadings, ArchetypeGrid, QuadraFunctionGrid, StackOrder, InvolutionTable, plus glyphs/ and lexicon-figures) tested by tests/diagrams.test.tsx and tests/glyphs.test.tsx.
- Open the diagram-dense shots: type-entp-desktop-light (has the four-sides diagram, octagram wheel, growth gate/gateway path, wiring schematic), type-entp-mobile-light (do the diagrams survive 390px?), network-desktop-light AND network-mobile-light (the NetworkRing — §3 says it becomes a "hairball" above ~6 people; is a real group shown?), matrix-desktop + mobile (the 256-cell grid — legible? cells tappable at mobile?), pair-entp-infp-desktop (MutualLanding both-directions diagram, DivergingEase bars), home-app-desktop (MutualLanding + TwoReadings), sides-intp-desktop (FourSidesDiagram per-function), learn-* stages (diagrams teaching each concept), lexicon-index (lexicon-figures).
- For each major figure: does it satisfy its comprehension test (the §3 acceptance sentence), or is it decoration? Is any encoding property doing nothing, or contradicting the grammar? Are labels below the 14px floor at mobile (the doctrine's own concern about SVG text scaling with viewBox)? Cross-check the axe finding that figures use role=img/role=group with one-sentence labels that flatten data-rich diagrams — is the visual richness lost to AT?
- Identify mechanisms where TEXT is carrying what a picture should (§3 lists several gaps: the eight elements never drawn as ONE system, re-sorting shown static not as motion, adjacency derivable-but-not-shown, seasons want illustration). And identify any figure that is strong and must be preserved (§3 calls the quadra grid "the best diagram in the product").
Produce 10-16 findings.`, { label: 'audit:illustrations', schema: SCHEMA }),

  () => agent(`Audit FLOW (end-to-end journeys) for Octant. ${COMMON}

Three journeys:
(a) NEWCOMER: signed-out / (home-signedout-*) → sign-in (signin-*) OR the public /onramp funnel (mkt-onramp-1/-2/-5/-11 shots) → /welcome 8 steps (welcome-index, welcome-1..8 shots) → first type read. Verified already: /onramp asks only 2 of 8 coins and gates a required email titled "See your directional reading" but shows none; the /welcome overlay appears on first signed-in visit before Home. Walk the welcome-* shots in order: is the 8-step orientation paced well, skippable, and does it hand off to the app? Does the signed-out→signin→(no invite code)→dead-end path leave a newcomer stuck (a payer lands on an owner-approval gate)?
(b) LEARNER: /learn index → 15 stages (learn-* shots). Assess pacing, per-stage length (page heights vary), whether each stage earns the next, drop-off risks, and whether stage 1 assumes nothing. Is there next/prev/progress? Cite specific learn-* shots.
(c) PRACTITIONER: /calculator (calculator-* AND the interactive flow-calc-after-1/-4/-8 shots — the field-narrowing was verified working: after 8 answers → "Your type ISTJ", "1 of 16 left", ranked closest fits) → /type/:type → /pair/:a/:b → /network. Does each surface hand off to the next (links onward)? Where does a practitioner get lost in the 16.8k-px type page?
- For each journey name where it LEAKS (a step that loses people or fails to hand off to the next surface) with screenshot evidence, and whether the "always narrows, never returns nothing" promise is honored in the UI.
Produce 10-16 findings.`, { label: 'audit:flow', schema: SCHEMA }),
])

return {
  display: results[0],
  branding: results[1],
  illustrations: results[2],
  flow: results[3],
}
