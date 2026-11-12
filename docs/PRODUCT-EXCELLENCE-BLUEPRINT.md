# Octant Product Excellence Blueprint
**Status:** design/product specification, not shipped. **Date:** 2026-11-13. **Owner intent:** visual-first, polycentric, progressive depth, high-integrity and professionally useful.

## 1. Product thesis and problems to solve
Octant's derived cognitive-typology engine, directional pair readings, sixteen type profiles, four-sided mappings, network analysis and original 78-card deck are distinctive. The current experience nevertheless asks readers to absorb too much terminology, dense prose and large pages; a visually coherent mechanism alone is not enough if users cannot understand it. A hard distinction: technical internal consistency is not evidence of psychometric validity.

**Goal:** a reader sees an immediately relevant insight, grasps the picture, experiences the mechanism, and optionally goes into the full derivation. Make the product useful at the moment someone has a question, not only after completing a course. No dark patterns or gamified pressure.

**North-star hypothesis:** users can explain one useful, correctly qualified insight and apply it to a real situation without assistance. Validate by UAT, not by page views.

## 2. Existing assets and prior work — preserve, reconcile
- Core derived model: `src/engine/core.ts`, `sides.ts`, `ops.ts`, `playbook.ts`, `octagram.ts`, `empirical.ts`; computed mappings must not be recoded as static tables.
- Authoring: `src/engine/functions.ts` already has roles, keywords, satisfaction, starvation and per-function practices; `sides.ts` already distinguishes developed vs undeveloped.
- Surfaces: `src/views/Home.tsx`, `Welcome.tsx`, `Learn.tsx`, `TypeReader.tsx`, `Sides.tsx`, `PairReader.tsx`, `Network.tsx`, `Lexicon.tsx`, `Guide.tsx`.
- SVG/brand: `src/components/glyphs/*`, `src/components/FourSidesDiagram.tsx`, `RelationLanding.tsx`, `src/cards/*`; design documents: `docs/DESIGN-SYSTEM.md`, `DESIGN-CATALOGUE.md`, `DESIGN-BRIEF.md`, `PLATFORM-BACKPORT.md`.
- Public: `src/worker/marketing.ts`, `onramp.ts`, `read.ts`, `leads.ts`, `stripe.ts`; 136 public readings documented in earlier review, verify on current main.
- Prior audit: PR #56 contains evidence images, full review, acceptance protocol, phased upgrade plan, approved brand Direction A with two B-folds and illustration memorability mandate. PR #57 contains fixes, not automatically merged. Existing plan is **baseline**, not superseded by this spec.
- Historical audit flagged extremely tall pages, drifted scores, misleading funnel messages, absent free-reading links, onboarding teaching error, weak navigation, mobile accessibility issues and Stripe access confusion. Reproduce on current main before marking fixed.

## 3. Audiences and primary jobs
| Persona | Job to be done | Success moment |
| --- | --- | --- |
| Curious novice | "Why do we think differently?" | Understand a visual concept in <=60 seconds, without jargon |
| Self-development enthusiast | "Which habitual strengths do I overuse and what can I practice?" | A useful behavior experiment and reflection |
| Relationship explorer | "What differs between us, from each person's perspective?" | Clear directional model plus a question to ask, avoiding mind-reading |
| Team/organization user | "How might a group communicate better?" | Shareable, explainable model with unknowns clearly labeled |
| Practitioner/coach | "Guide a conversation and produce a responsible report." | Consented session, observations, hypotheses, personalized resource |
| Owner/operator | "Control truth, quality, design, growth and publishing." | Audit queue, release confidence, conversion/learning telemetry |

## 4. Polycentric information architecture
Four equal entry points on home: **My Mind**, **Our Connection**, **Our Team**, **My Growth**. Optional fifth: **Learn the Model** for enthusiasts. No requirement to finish a linear course before reaching user value. Signed-out landing links to public demonstrations; signed-in personal dashboard remembers selected interest but should allow switching.

- **My Mind** -> type card -> one-sentence insight -> interactive 8-slot stack -> four-side explorer -> deep mechanics.
- **Our Connection** -> two-person directional figure -> everyday conversation example -> distinct self reports -> detailed playbook with evidence labels.
- **Our Team** -> input participants with permission -> overview -> directed graph and list view -> scenarios and downloadable facilitation prompts.
- **My Growth** -> choose today's behavioral objective -> suggested function/mode practice -> action -> optional reflection -> trend over time.
- **Learn the Model** -> 13+ stages computed from live `STAGES.length`, visual lessons, glossary, derivation disclosure. Do not hardcode counts.

Explicit persistent cross-navigation: type -> sides -> practice; pair -> each type -> communication prompts; public PDF -> public demo -> relevant app area. Consistent back/swap controls, location breadcrumbs and mobile skip links.

## 5. Five-band concept experience (reusable component/authoring contract)
For each substantial concept:
1. **Plain:** a single concrete nontechnical claim; distinguish model interpretation from observation.
2. **Picture:** one accessible SVG diagram with one job. Semantic color means N/S/T/F; size=rank; direction=attitude; avoid decorative overload.
3. **Named:** introduce terms inline, explicit tap/keyboard accessible definitions; use `<Term>` where appropriate.
4. **Interactive:** one meaningful manipulation (change type, swap perspective, reveal a gateway, place a function, select situation).
5. **Technical:** disclosure with exact model derivation, counterexamples, provenance/uncertainty and limitations.

Default initial viewport should usually show bands 1–2 and a clear action; do not stack all five expanded. Build `ConceptExperience`, `InsightHero`, `MechanismFigure`, `TryIt`, `EvidenceLabel`, `MechanicsDisclosure` only after validating representative prototype. Component names are illustrative, not commitments.

## 6. Visual grammar and art direction
Honor the **approved Direction A + two B-folds** documented in PR #56; preserve brand mark decisions after consulting current branch. Original quiet-paper editorial style; Newsreader/Inter/IBM Plex Mono or approved equivalents; canonical semantic N violet, S amber, T teal, F rose from `src/engine/palette.ts` and CSS tokens; all visual props encode actual model mechanics. Keep print/deck and product coherent. A compelling cover must still be legible at thumbnail size; illustration must support comprehension, not merely spectacle.

High-value illustrations to prototype first:
- **Ne vs Ni:** tree of branching possibilities vs lines converging on one chosen interpretation, examples and interactive labels.
- **Ti Parent vs Ti Child:** both use logical testing, but stack position changes the interpretation and tone; show original question -> explanation -> cautious correction without asserting a particular woman's thoughts.
- **Eight functions, four sides:** eight beads re-dealt into Ego/Subconscious/Unconscious/Superego using same computed mappings.
- **Developed vs reactive modes:** two states with observable behavioral examples (not moral labels); healthy ESFP Showman: joyful, voluntary expression vs reactive provocation.
- **Directional pair:** two distinct arrows and perspectives, not a single compatibility number. Preserve symmetry when derived values are equal.
- **Actionable pathway:** brainstorm -> choose -> experience -> reflect, with an accessible static alternative.

Art must work with and without animation; respect prefers-reduced-motion, keyboard/screen reader, 390px mobile, dark/light. Never convey meaning through color alone. SVG accessible title/desc + adjacent readable transcript. Avoid images containing small, non-selectable text; use live HTML for labels.

## 7. Screen-level redesign priorities
**P0:** reconcile prior numerical/content/security/checkout errors and accessibility. Stop inaccurate marketing claims.
**P1 prototype:** public home/guide entry; 8-screen onboarding vs value-first alternative A/B; type overview; Four Sides; pair; one practice. Test before selecting.
**P2 rebuild:** public landing + guide landing, `Welcome` and signed-in `Home` with role choice; `TypeReader` sections into scannable illustrated chapters, sticky TOC, save/continue; `Sides` illustrated gates and toggled developed/reactive, not a prose wall; `PairReader` quick insight + two-way evidence + consent-aware prompts; `Learn` stage cards and small interactions; `Lexicon` visuals at lookup.
**P3 expansion:** Network responsive alternative to graph hairballs; Studio; owner portal; Practice.
**P4 optimize:** personalization, measurable comprehension, guide share previews, performance, localization where justified.

For any screen: do not strip expert accuracy to create beginner appeal. Relocate rather than delete deep data. Every new screen has empty/error/loading/access-denied states.

## 8. Interaction principles and copy
- Make one claim per scene/diagram. Show action before explanation; users choose depth.
- No "guaranteed compatibility," scientific certainty, neurologic metaphors as fact, mind reading, claims that lack evidence.
- Self report, observed behavior and model interpretation have visually distinct source labels and different data fields.
- Pair dynamics respect two people’s autonomy; never presume physical intimacy follows intellectual chemistry.
- Examples should be engaging and everyday, not product-marketing clichés. Use anonymized composite situations.
- Language: "may", "within this model", "a question worth asking", not "INFJs always".
- Have a "What this does not tell you" section on psychological and relational conclusions.
- Preserve existing third-party attribution constraint in source and tests; appropriate citations in research/provenance, not accidental vendor brands on public pages.

## 9. Measurement
Instrument privacy-respecting events: guide_landing_view, guide_read_start, guide_pdf_open, guide_interactive_launch, concept_visual_seen, concept_try_completed, insight_saved, second_concept_viewed, practice_started/completed, practitioner_report_exported, subscribe_start/success, user_feedback_submitted. Avoid collecting personal relationship narratives as analytics.

Track by source/guide/route: guide -> public demo -> activation -> repeat useful visit -> conversion -> referral. Activation means person completes a useful activity and can paraphrase insight; validate through moderated tests. Distinguish illustrative targets from achieved metrics.

## 10. Acceptance benchmarks (provisional targets, not observed facts)
- >=80% first-time novice participants explain core pictured mechanism accurately unassisted.
- >=90% key-task success among tested personas; report sample size and confidence limitations.
- No serious/critical automated accessibility issues; manual keyboard, VoiceOver/NVDA, reduced-motion evaluation.
- No model-derived numeric mismatches across public/app/PDF; all links and exports valid.
- Mobile/light/dark screenshots approved; no overflow, clipped text, unreadable diagrams.
- Checkout/email/consent/access path demonstrably functional in controlled end-to-end test before paid promotion.
- Release docs link actual artifacts, build SHA, dates, test commands, testers and disposition of defects.

## 11. Suggested implementation slices
Slice A: evidence-backed IA/prototype, no production edits.
Slice B: shared `ConceptExperience` + Ne/Ni and one four-sides example, UAT.
Slice C: home/first-run and one type page, measured.
Slice D: pair reader and guide publishing prototype with one PDF.
Slice E: Studio MVP + reports.
Slice F: Practice MVP built on `functions.ts` and `sides.ts`, expanded all-type tests.
Each slice uses its own branch, PR, screenshot evidence, acceptance checklist, rollback plan. See `QA-UAT-RELEASE-GATES.md`.
