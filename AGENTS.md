# Codex / AI agent instructions for Octant

Read this file first. This is a documentation-only handoff created 2026-11-13. Do not treat a speculative typology interpretation as a verified clinical or neurological fact.

## Mandatory reading order
1. docs/NEXT-THREAD-START-HERE.md — exact state, precedence, launch checklist and first engineering tasks.
2. docs/PRODUCT-EXCELLENCE-BLUEPRINT.md — strategic product requirements, audiences, IA, UX, visual hierarchy.
3. docs/COGNITIVE-DEVELOPMENT-RESEARCH.md — origin questions, model interpretation, four sides, developmental modes, caution on attraction/consent, all-type derivation.
4. docs/PRACTICE-ENGINE-SPEC.md — data models, modes, function-specific exercise mapping and MVP.
5. docs/PDF-GUIDES-AND-PRACTITIONER-STUDIO.md — acquisition, publishing, practitioner's workflow, owner's console.
6. docs/QA-UAT-RELEASE-GATES.md — test plan, UAT, release criteria, evidence requirements.
7. Existing current-source docs: README.md, docs/DESIGN-SYSTEM.md, docs/DESIGN-CATALOGUE.md, docs/CARDS.md, docs/QA-REVIEW.md, docs/PLATFORM-BACKPORT.md.
8. Unmerged prior work: PR #56's docs/REVIEW-2026-08-FULL.md, docs/UPGRADE-PLAN.md and docs/ACCEPTANCE-PROTOCOL.md; PR #57's P0 code changes. Do not assume either PR merged.

## Required engineering conduct
- Check git status, main SHA, open PRs, release environment, and unmerged changes before editing.
- Preserve the derived engine: source of truth is src/engine/, especially core.ts, sides.ts, functions.ts, playbook.ts, octagram.ts and empirical.ts. Never duplicate the 16 type/four-side mappings by hand. Derive them and test all 16 types.
- Preserve the existing deck's information architecture and semantic illustration grammar. No gratuitous neon redesign, stock art or conflicting hue system.
- Maintain the distinction between **model-derived structure**, **authored interpretations**, **published external empirical evidence**, and **user self-report**. Do not present typology as measured neuroscience or behavioral certainty.
- Do not infer a third person's romantic/sexual interest from type. Do not implement emotional manipulation, "bypass defenses", covert profiling, sexual escalation scripts, or pressure. Consent and autonomy must remain first-class.
- The existing project limits third-party typology attributions to its translation layer in src/; review tests/attribution.test.ts before modifying any product copy. Internal research documents can cite frameworks, but publicly shipped copy must obey the repository's established attribution policy.
- User's personal relationship inquiry is presented as an ANONYMIZED research scenario here, not material for public marketing. Do not display private anecdotes, chat transcripts or named individuals in the product.
- Code changes must be made on a new topic branch with a focused draft PR. Do not merge or deploy without owner confirmation.
- Required gates: npm run typecheck, npm run lint, npm test, npm run build, plus UAT and screenshots on mobile/desktop, light/dark. Before deployment check Cloudflare branch rules and security-sensitive user flows.
- Preserve all existing route contracts unless a migration, redirects and link tests accompany the change.

## Product mandate
Octant must become visual-first, progressive, polycentric and usable by novices, enthusiasts, practitioners and the owner. Product quality is not merely more copy, components or test counts: prove concept comprehension, successful user tasks and practical benefit. Follow the phase gates in the accompanying docs.

## Docs-only branch notice
These documents are proposals, research synthesis and execution specifications. They are not evidence that a feature shipped. If the next agent starts on main and these files are absent, read the open documentation PR and fetch its head branch. Do not silently rebuild from memory.
