# PDF Guide Publishing, Acquisition, Practitioner Studio and Owner Console

**Status:** proposed product architecture. **Date:** 2026-11-13. No features implemented by this document.

## 1. Why PDFs
The original exploration produced illustrated ENTP–INFJ cognitive wiring, Four Sides, Showman and embodied-intimacy guide concepts; the owner found generic text-heavy PDFs bland and explicitly preferred the established `octant-cards.pdf` editorial/geometric language. Instead of treating PDFs as throwaway downloads, use them as **shareable, visual entry points** to a corresponding interactive Octant experience. Never include private anecdotes without consent.

Octant already has deterministic card-generation infrastructure: `src/cards/deck.ts`, `render.ts`, `art.ts`, `scripts/build-cards.mjs`, `docs/CARDS.md`; it generates a vector deck and print sheets. Extend, don't copy this logic. Reuse derived data and the design system.

## 2. First guide collection
| Guide | Target | Interactive counterpart | Qualification |
| --- | --- | --- | --- |
| Eight Ways a Mind Works | beginners | /learn/functions and 8-function interactive figure | theoretical typology framework, no claims of neural measurement |
| The Four Sides of You | curious/self-development | /sides/:type + re-sorting animation | model-derived positions; developed/reactive interpretation |
| When Two Minds Meet | relationships/friends/teams | /pair/:a/:b and directional figure | mutual interpretation, explicit uncertainty, no reading sexual desire |
| Beyond Your Default Mind | personal growth | /practice and mode navigator | observable habits instead of function-strength percentages |
| The Showman Within | expressive growth enthusiasts | Superego developed/reactive exploration | voluntary joyful vs reactive performance is a user insight, not validated causation |
| Practitioner Session Companion | coaches/facilitators | Studio session with consent | explicit observed / reported / interpreted labeling |

Guide titles are creative starting points; brand/content approval before public release. Later generate guides on each cognitive function, all 16 types, pairings and group dynamics without hand-storing contradictory mappings.

## 3. Rendering/publishing pipeline
**One content source** -> HTML page, accessible PDF, social share image and interactive route deep links. Store structured chapters with stable IDs; engine values computed by build-time generator or rendered from engine, no manually copied scores, stage counts or four-side positions. Claim snapshot tests read both HTML and PDF text and compare relevant outputs with engine functions.

Suggested source (illustrative):
```ts
type Guide = {
  slug: string; version: string; title: string;
  audience: "novice" | "enthusiast" | "practitioner";
  chapters: { id:string; title:string; plain:string; figureId:string;
    alt:string; detail:string; practiceId?:string; deepLink:string }[];
  attribution: { class:"derived"|"authored"|"empirical"|"self-report"; source?:string }[];
  canonicalUrl:string; lastReviewedAt:string;
};
```
PDF accessibility requirements: searchable live text, logical headings and reading order, alt for critical charts, embedded hyperlinks/QR to corresponding pages, contrast, tagged PDF when tooling permits, print-safe margins, selectable body copy and accessible HTML alternative. Do not place dense copy as a raster generated image; render text with layout engine. Export a print PDF and optional smaller screen reading version if justified.

Existing `octant-cards.pdf` is NOT the same as a guide; publishing needs new chapter layouts, TOC and screen-friendly pagination. No secrets/auth tokens in PDF links or QR codes. Each guide needs version/date, model caveat, source/revision link.

## 4. Public funnel and distribution
Public `/guides` catalogue and `/guides/:slug` SEO-friendly readable landing page, with meaningful unauthenticated excerpt and one interaction. Main CTA: "Try this with your own wiring" -> relevant public demo/quiz; separate optional email to save/receive results; then sign-in or subscribe as appropriate. Avoid email gating of promised free value, and ensure sign-in/payment fulfillment is verified.

Cross-channel: shareable social figures, web search, newsletters, partner referrals, podcast visuals, downloadable practitioner worksheets, linkable public read pages. Guide copy should never promise unsupported numerical compatibility or psychological diagnosis.

Current public funnel `src/worker/onramp.ts` uses query-string state and has a prior replay-token finding; PR #57 may address it. Verify before introducing more lead capture. Prior PR #56 found discoverability and checkout/access problems. Do not increase traffic to a broken conversion funnel.

Instrumentation: `guide_view`, `pdf_open`, `chapter_view`, `deep_link_open`, `interactive_complete`, `signup_started`, `signup_completed`, `subscribed`, `guide_shared`, with campaign/source and guide version but without sensitive journal text. Consent controls, retention and privacy review required.

## 5. Practitioner Studio
A separate protected route/space oriented around **actual work**, not the general type reader:
- **Sessions:** create appointment/session plan; define question, objective, consent scope, participants.
- **Profiles:** optional self-reported type, source, assessment date, confidence, participant permission, deletion request. Never automatically type a non-consenting third party as fact.
- **People & pairs:** visually compare directional function landings and distinguish theoretical model and what the people themselves say.
- **Observations:** separate **observed fact**, **direct self-report**, **model hypothesis** and **experiment/outcome**. These fields remain distinct in API, UI, report and assistant context.
- **Session flow:** objective -> opening question -> illustrated concept -> alternative interpretations -> participant choices -> action/practice -> follow-up.
- **Resources:** guide library and tailored exercises.
- **Reports:** client-ready, consented, dated PDF with versioned model references, observations and hypotheses clearly labeled; review before send/export.
- **Follow-up:** optional user-led reminders and reflective feedback; never automated emotional manipulation.

### Example practitioner session
Objective: understand why a pair experiences stimulating dialogue while differing about romantic intimacy.
Observation: one says conversations are stimulating; another has declined further physical affection (if voluntarily disclosed).
Hypotheses: intellectual connection may or may not be romantic; typology offers possible communication differences but cannot diagnose desire.
Intervention: ask each person directly what relationship they want, respect physical autonomy, explore compatibility, document their answers.
Output: no prediction of sex, consent, deception or pressure. The practitioner must not engineer hidden desires.

Another example: ENTP founder asks how to stop endless brainstorming and finish work. Show Ne and Ti as hypothesis, establish behavior baseline, choose bounded Explore and Commit practices, review external outcomes.

## 6. Owner Console
Keep separate from practitioner client data and end-user app. Required panels:
- Product funnel, cohort conversion, public reading/PDF contribution; show sample sizes and date windows.
- UX comprehension failures, user feedback, confusing vocabulary, feature dropoffs, reported accessibility problems.
- Editorial provenance queue: each authored claim and guide review status, version and approval.
- QA release dashboard: branch/commit SHA, test gates, visual diffs, manual UAT, blocker list, owner approval, production status.
- Guide publishing workflow: draft, review, snapshot tests, proof PDF, approval, publish, rollback.
- Practitioner pilot outcomes (aggregate/deidentified unless explicitly authorized), feedback on session usability and report generation.
- Costs and reliability metrics for Workers, email, AI, PDF generation and storage.
- Access and privacy audit log, deletion request queue if accounts store sensitive data.

## 7. Suggested Cloudflare fit (evaluate, don't automatically provision)
Current project uses Cloudflare Worker with static assets and KV in some flows, plus Stripe and an AI chat proxy. For public guides, static Worker assets and build-time generation are likely sufficient. If per-user private Studio records become necessary, evaluate **D1** for structured access-controlled metadata and **R2** for report/PDF objects, with appropriate encryption/retention and authorization. Do not create services or expose data until requirements and cost/security are reviewed. Cloudflare analytics may support aggregate funnel events. For preview builds: production deploy branch main, previews were disabled as of 2026-11-13 (recheck before PR).

## 8. Practitioner and publication quality gates
- Each image/diagram teaches a specific concept, not decorative pseudo-science.
- Each PDF is accurate against live engine; clickable links/QRs resolve; no text clipped; displays well on mobile and paper; accessible HTML equivalent available.
- Every export and every shared report is reviewed/consented; tenant isolation tested if practitioner accounts are introduced.
- Public guides' explanation and prompts explicitly disallow mind reading or changing others' sexual boundaries.
- Marketing CTA delivers its literal promise; checkout-to-account access tested end-to-end.
- One guide pilot must demonstrate actual discovery -> insight -> interaction before scaling to a library.

## 9. MVP experiment
Build one guide: **The Four Sides of You**. Source from computed `sides(type)` and a five-band concept page. Produce PDF/HTML/QR, test novice comprehension and links, release to a small audience, then measure meaningful activation and completion. Only then commission dozens of guides.
