export const meta = {
  name: 'octant-source-audits',
  description: 'Source-based perspective audits: marketing, copy/voice, supporting (a11y/perf/security), content integrity',
  phases: [{ title: 'Audit' }],
}

const EVIDENCE = `
EVIDENCE DISCIPLINE (non-negotiable): every finding must cite a file:line you actually read this session, a command output you ran, or a named screenshot file. Never quote README/docs numbers as fact — reproduce them or mark "unverified". No finding without a location. Severity scale: P0 blocker / P1 major / P2 minor / P3 polish. Audit through three audience lenses and tag each finding with the lens(es) it hurts: "newcomer" (no typology background; needs comprehension, trust, reason to sign up), "enthusiast" (knows MBTI/socionics; needs credibility, depth, differentiation), "partner" (coach/team/licensee; needs professionalism, pricing clarity, diligence-grade trust).
The repo is /home/user/octant. A dev server runs at http://localhost:5173 with the real Worker (access wall active). To make authenticated requests: curl -s http://localhost:5173/<path> -H 'Cookie: octant_session=eyJsIjoiZGV2IiwiayI6ImNvZGUiLCJjIjoiYTNlZTc4NmI1NzA3YzI3ZCIsImUiOjE3ODk4MDgyNjF9.AGDec1UEnwu0lXILgzPPz_PvjAxJNY-xHNPsgyp-ucw'. You may run read-only commands (grep, curl GET, npx vitest run, npx tsx for engine introspection). Do NOT modify any file in the repo.
Return JSON via StructuredOutput.`

const SCHEMA = {
  type: 'object',
  required: ['score', 'scoreRationale', 'strongestThing', 'findings', 'notes'],
  properties: {
    score: { type: 'number', description: '1-10 for this perspective' },
    scoreRationale: { type: 'string', description: 'one paragraph justifying the score' },
    strongestThing: { type: 'string', description: 'the strongest thing to preserve, with evidence' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'title', 'detail', 'evidence', 'lenses', 'recommendation'],
        properties: {
          severity: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
          title: { type: 'string' },
          detail: { type: 'string' },
          evidence: { type: 'string', description: 'file:line refs, command outputs, or screenshot filenames' },
          lenses: { type: 'array', items: { type: 'string', enum: ['newcomer', 'enthusiast', 'partner'] } },
          recommendation: { type: 'string', description: 'what to change, concrete' },
        },
      },
    },
    notes: { type: 'string', description: 'anything the synthesizer should know: verified claims, unverified claims, drift found' },
  },
}

phase('Audit')
const SHOTS = '/tmp/claude-0/-home-user-octant/9226adb3-21b5-57f0-8777-75de8a014f78/scratchpad/shots'

const results = await parallel([
  () => agent(`You are auditing MARKETING & POSITIONING for Octant, an invite-only typology instrument (React 19 + Cloudflare Worker). ${EVIDENCE}

Scope: the signed-out marketing surface and everything that sells.
- Read src/views/Home.tsx (both signed-out marketing and signed-in states), index.html (title/meta/og), src/worker/marketing.ts, tests/marketing.test.ts (what marketing promises are pinned by tests), src/views/Welcome.tsx (onboarding as part of the conversion funnel), src/worker/onramp.ts, src/worker/leads.ts, src/worker/stripe.ts (how payment/approval actually works), docs/CARDS.md, docs/PARTNERSHIP-TERMS.md, docs/partner-rate-card.html.
- Look at these screenshots (Read the image files): ${SHOTS}/home-signedout-desktop-light.png, ${SHOTS}/home-signedout-desktop-dark.png, ${SHOTS}/signin-desktop-light.png, ${SHOTS}/home-signedin-desktop-light.png.
- Questions to answer with evidence: Is the value proposition legible in 10 seconds for each lens? Is the crown-jewel differentiator ("derived, not stored" — bidirectional 256-pair scores from ~2KB seed) surfaced above the fold or buried? What trust/proof signals exist (test counts, provenance, honest-asterisk culture) and are any marketed? What CTAs exist and where do they lead — is there ANY path for a visitor without an invite code (waitlist, lead capture, pricing)? Does the signed-out page differ for mobile? What does the funnel landing → /signin → /welcome → first aha actually feel like and where does it leak? Are partner-facing materials (rate card, terms) consistent with the public page's claims?
Produce 8-15 findings, each concrete.`, { label: 'audit:marketing', schema: SCHEMA }),

  () => agent(`You are auditing COPY & VOICE for Octant. ${EVIDENCE}

Scope: the words everywhere. The project doctrine is "plain first, technical underneath" — every surface leads plain English with exact mechanics one disclosure below (README, src/engine/plain.ts, src/components/Explain.tsx, tests/plain.test.ts).
- Read: src/engine/plain.ts, src/engine/functions.ts, src/engine/data.ts (authored copy), src/learn/curriculum.tsx (the 13-stage course copy — sample at least 4 stages including stage 1 and the last), src/views/Home.tsx, src/views/Welcome.tsx, src/views/Calculator.tsx, src/views/Read.tsx, src/views/TypeReader.tsx (sample), docs/VOCABULARY.md, src/engine/lexicon.ts (sample gloss quality).
- Questions: Is the plain-first doctrine actually upheld — find specific places where jargon leaks into first-contact copy (count unexplained terms-of-art in the first screen of key views). Is tone consistent across marketing vs onboarding vs course vs instrument surfaces (quote contrasting examples)? Microcopy quality on buttons, empty states, errors (grep for error strings, empty-state strings in views). Reading level of the marketing hero vs the course. British vs American spelling consistency (grep for colour/color, behaviour/behavior in USER-FACING strings — distinguish from CSS property names). Terminology drift against docs/VOCABULARY.md (spot-check 10 terms). Does the copy anywhere overclaim vs the code's honest-asterisk culture?
Produce 8-15 findings.`, { label: 'audit:copy', schema: SCHEMA }),

  () => agent(`You are auditing SUPPORTING DIMENSIONS for Octant: accessibility (code side), performance, and platform/security posture. Leaner than the main perspectives but real. ${EVIDENCE}

- Accessibility (code side): read tests/a11y.test.tsx and assess what it actually covers vs the app surface (compare against the component list in src/components/ — the app is SVG-diagram-heavy: WiringSchematic, OctagramWheel, NetworkRing, FourSidesDiagram, etc.). Grep for aria-label, role=, alt=, <title> in src/components and src/views; identify SVG figures with no accessible name. Check keyboard operability signals (tabIndex, onKeyDown) in interactive components (TypePicker, Calculator coins, Matrix cells, mobile nav — see tests/mobile-nav.test.ts).
- Performance: the production build is a single 632KB JS chunk (197KB gzip), built this session; vite.config.ts has no manualChunks/code-splitting and src/App.tsx imports all views statically (verify). Assess route-level lazy-loading opportunity concretely (which views are heaviest — check file sizes of views+engine+curriculum). Note wrangler.jsonc "run_worker_first: every asset request is a billable Worker invocation" tradeoff (read the comment). Font loading strategy (index.html, src/styles/base.css). Any render-blocking or waterfall issues visible in source.
- Security posture (do NOT pentest, source review only): src/worker/headers.ts (CSP quality — grep unsafe-inline etc.), auth.ts session design (already reviewed in docs/QA-REVIEW.md — reconcile, don't re-litigate; note anything that CHANGED since or that the QA review flagged as accepted risk that now matters more), ratelimit posture (tests/ratelimit.test.ts), admin gating (src/worker/admin.ts owner check), stripe webhook verification (src/worker/stripe.ts).
- Reconcile with docs/QA-REVIEW.md and docs/REVIEW-FINDINGS.md: list which of their still-open items remain open (verify 3-5 of them against current source), and what has drifted since 2026-08-01 (measured this session: tests 832→1225, bundle 558KB→632KB, lint now 5 warnings at src/styles/base.css:121-123 noImportantStyles, src/styles/components.css:394,483 noDescendingSpecificity).
Produce 10-18 findings across the three areas, each tagged with which area it belongs to in the title (e.g. "[a11y] ...", "[perf] ...", "[security] ...", "[docs-drift] ...").`, { label: 'audit:supporting', schema: SCHEMA }),

  () => agent(`You are auditing CONTENT INTEGRITY for Octant: does what the words claim match what the code does? ${EVIDENCE}

Already verified this session (do not redo, cite as given): (1) catalysts() resolves to exactly relations EX="Damper" and MG="Loose fit" for all 16 types — matches README; (2) tests pin lexicon at 103 entries (tests/plain.test.ts:30) but README's "Plain first" section says "asserts all 100 lexicon entries" — stale drift; (3) octagram tests (dyads/temples derived, match published sets, CS Joseph's eight sins) pass — 207 tests across octagram/sides/calculator/engine files passed this session; (4) calculate() in src/engine/ops.ts ranks all 16 types so it never returns empty — "always narrows" holds structurally; (5) full suite 1225 tests / 47 files passing, typecheck clean, lint 0 errors 5 warnings, build clean 632KB/197KB gzip single chunk.

Your job — verify the REMAINING mechanical claims:
- README's route table vs src/App.tsx routes: the table omits /bonds and /guide + /guide/:type (confirmed present in App.tsx lines 192,198-199). Read README fully and find any OTHER claims that drifted (numbers, file lists, module descriptions vs src/engine/ contents).
- The "about 2 KB of genuine seed data" claim: read src/engine/data.ts (23,420 bytes total) and determine what portion is actual seed (the structural constants) vs authored copy vs frozen score tables; is "~2 KB" defensible? Show your arithmetic.
- The "Dread sits in the Cave slot of the unconscious and the Lead slot of the superego" claim: verify directly with npx tsx against src/engine/sides.ts fourSides().
- "ease() reads a hand-set 16-value score ramp": find it in the source and confirm.
- The empirical counterweight: read src/engine/empirical.ts — does the survey matrix actually disagree with the model (compute correlation or count sign disagreements vs ease() via npx tsx)? The README stakes credibility on this being "a deliberate third thing".
- docs/DESIGN-SYSTEM.md's claims about what illustrations encode: spot-check 3 claims against actual components (e.g. does colour always mean something — check src/engine/palette.ts semantics vs decorative use).
- The thirteen-stage course claim: count stages in src/learn/curriculum.tsx (grep for stage boundaries; 16 "title:" hits exist — how many stages really?).
- Check index.html title/meta description claims against what the app does.
Produce 8-15 findings. In "notes", give a table of every claim checked: claim → verified/drifted/unverifiable + evidence.`, { label: 'audit:integrity', schema: SCHEMA }),
])

return {
  marketing: results[0],
  copy: results[1],
  supporting: results[2],
  integrity: results[3],
}
