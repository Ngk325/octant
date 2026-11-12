# Cognitive Development Research — From Inquiry to All-Type Product Requirements

**Status:** research synthesis / design inputs, not clinical science. **Prepared:** 2026-11-13. Public GitHub: original interpersonal scenario anonymized; preserve conceptual questions, not individual identities. Source: longitudinal conversation with product owner. Not a verbatim transcript, and its examples are *not* validated information about another person.

## 1. The originating question chain (retain for future product work)

1. An ENTP describes an INFJ acquaintance saying their conversations feel like "neurons firing." They experience strong intellectual excitement but not the same physical, romantic or sexual reciprocation. **Question:** What does cerebral chemistry mean, and why needn't it predict intimacy?
2. **Question:** In the CS Joseph interpretive model, how do each type's optimistic Hero/Child and pessimistic Parent/Inferior positions shape conversations, psychological confidence and defensiveness? The original language invoked "social engineering"; product-safe framing is understanding differences, not bypassing boundaries.
3. **Question:** What happens when a person becomes defensive or withdraws? How to respond without debate, pressure, controlling pursuit or over-reading silence? How to distinguish an authentic boundary from a request for time, without claiming to know motives?
4. **Question:** How should someone decide to move on from a nonreciprocal romantic situation without using scarcity/withdrawal tactics to manufacture desire? What happens if someone later becomes affectionate?
5. **Question:** How can a connection's intellectual novelty remain meaningful after commitment? How do couples shift from decoding each other toward shared experiences?
6. **Question:** How do the Four Sides change the interpretation of **ENTP's ESFP Superego**, especially the original "Showman / Firestarter" idea? Is the developed expression happily performative rather than simply reactive? User reports a joyful, voluntary sense of another version of the self "taking the stage," alongside recognition of previous reactive forms.
7. **Question:** Does asking the other person to *articulate their experience/reasoning* engage an ENTP's Ti Parent with an INFJ's Ti Child? How does ENTP Ne Hero perceive possibilities, and how does Ti Parent then check/compute them? What is INFJ Ni Hero vs Ti Child, and what does Fe Parent add?
8. **Question:** How might ENTP Si Inferior and Se Demon relate *conceptually* to INFJ Se Inferior in embodied experiences? Can comfort, receptive sensory presence and playful expressiveness make a shared experience easier without implying sexual interest or overriding boundaries?
9. **Question:** After maturing strong Ne/Ti Ego capacities, how can an ENTP reduce constant ideation/analysis and develop Si continuity, Ni commitment, Te follow-through, Fi values and Se embodiment? Can cognitive modes be used intentionally rather than constantly?
10. **Product question:** How can Octant generalize these insights to all 16 types, describe developed vs undeveloped sides across all four configurations, and turn typology into exercises rather than exhaustive reading?
11. **Design question:** How can a visual-first, layered, polycentric Octant teach concepts with illustrations, experiential examples, PDFs, practitioner tools and QA/UAT?

This progression is the research backbone. Do not reframe it as a universal path, psychological diagnosis, or claim about a third party's intentions.

## 2. Shared terms and structural mapping

Conventional eight-function position labels, with Octant equivalents from `SLOT_NAMES` in the actual engine (read, do not hardcode display labels): 1 Hero/Lead, 2 Parent/Support, 3 Child/Delight, 4 Inferior/Cave, 5 Nemesis/Doubt, 6 Critic/Scold, 7 Trickster/Blind spot, 8 Demon/Dread. Use the engine's current names in public UI. Optimistic Hero/Child and pessimistic Parent/Inferior are **one author's interpretive polarity**, not a validated measurement of personality.

Example model configurations from the convention discussed:
- ENTP Ego **Ne–Ti–Fe–Si**, Subconscious **ISFJ Si–Fe–Ti–Ne**, Unconscious **INTJ Ni–Te–Fi–Se**, Superego **ESFP Se–Fi–Te–Ni**.
- INFJ Ego **Ni–Fe–Ti–Se**, Subconscious **ESTP Se–Ti–Fe–Ni**, Unconscious **ENFP Ne–Fi–Te–Si**, Superego **ISTJ Si–Te–Fi–Ne**.
These are worked pedagogical examples, not separate persons or switching mechanisms verified in brain science. Production MUST derive `sides(type)` for all 16 rather than duplicate this table.

### Function-level vocabulary
| Function | Provisional plain description | Application (as behavior, not diagnosis) |
| --- | --- | --- |
| Ne | Opens possible interpretations, futures and alternatives | Idea generation with an exit condition |
| Ni | Converges on a meaningful interpretation or direction | Selecting a line to commit to |
| Ti | Evaluates internal reasoning and definitions | Deliberate checking vs unnecessary rumination |
| Te | Chooses externally checkable tasks and results | Finish a defined deliverable |
| Fe | Attends to interpersonal harmony and shared context | Ask/validate rather than assume |
| Fi | Clarifies personal preference, values and authenticity | Choose something because it matters personally |
| Si | Familiar experience, continuity, body memory, maintenance | Repetition, restoration, routine, sensory observation |
| Se | Immediate physical presence, action, expression | Dancing, movement, sensory experiences, physical craft |

These are shorthand within the Octant model; confirm precise language against `functions.ts`, `plain.ts`, `DESIGN-SYSTEM.md`, and original sources before production.

## 3. How Ne–Ti overuse can feel
- Ne quickly notices opportunity or many plausible stories.
- Ti attempts to reconcile, test and refine them.
- Analysis generates more Ne branches; user returns to Ti; a loop persists after the decision value has fallen.
- **Developmental goal:** intentionally stop, choose an action, rest, or embody an experience. This is useful behavior regardless of whether the model explains its origin.
- Suggested intervention: three checks — (1) Does this need thinking now? (2) Would more analysis change my next action? (3) What could I experience if I set this aside?
- Ne–Ti should become *available on demand*, not deliberately degraded or forcibly suppressed.

## 4. Ni Hero vs Ti Child; Ti Parent vs Ti Child
Hypothetical relationship exchange:
- "I sense something unusual about our conversations." could be interpreted as **Ni** converging on meaning, but it is just one utterance.
- "Maybe it is because you open alternatives I had not considered." could be **Ti** offering an explanation.
- "I feel safe sharing this with you." involves an explicit **relational self-report**, which cannot be inferred merely from type.
- ENTP Ne notices *potential*. ENTP Ti tests what follows. The dangerous inference is: strong intellectual connection **therefore** romance should follow. It does not.
- A healthy logical question is curiosity ("What do you think creates that experience?"), not a demand that the person reconcile their feelings with the questioner's theory.
- Typology cannot tell if someone's statement is "really" Ni or Ti; one utterance can express several processes.

## 5. Si Inferior, Se Demon, Se Inferior: useful and harmful translations
- Model-specific speculation: ENTP Si Cave may be sensitive to receiving comfortable/familiar sensory experiences; INFJ Se Cave may be tentative around spontaneous physical engagement; ENTP Se Dread and ESFP Superego might, when constructively expressed, support enjoyable embodied spontaneity.
- Practical, type-independent behavior: express a preference ("I like holding hands") **if mutually welcomed**; offer choices; ask before contact; attend to signs and explicit words; welcome a "no" without interrogation; create comfort without expectation.
- IMPORTANT: physical hesitation **might** reflect lack of attraction, consent, timing, identity, values, culture, health, experience or other factors; attributing it to a function is not supported.
- Do not claim anatomical signals (relaxed/tensed body) reliably identify true vs false romantic motives.
- Never teach "engineering" desire, manipulating fear of loss, making people provide physical intimacy, or bypassing refusal.
- Relationship content should distinguish **intellectual connection**, **emotional connection**, **romantic interest** and **physical/sexual desire** as separate dimensions; none guarantees another.

## 6. The healthy Showman insight — preserve exactly in product research
A product owner reports *subjectively* that an ESFP-like "Showman" state feels distinct from their usual ENTP Ego, enjoyable and happily performative. They also report past reactive/unhealthy expression, and consciously work on recognizing the difference. This is meaningful qualitative data about **their experience**, not evidence that a distinct cognitive stack literally took control.

**Constructive expression:** voluntary, playful, expressive, physically present, joyful, able to stop, not dependent on applause. Examples: performing a story, dance, improv, making a shared moment memorable.

**Reactive expression:** becomes provocative, attention-seeking, combative, compulsive or boundary-pushing because a desired response is missing; difficulty stopping; regret afterward. Examples are hypotheses, not clinical assessment.

**Key distinction:** "performing from joy" vs "performing from need." Do not equate performance, sexuality or extroversion with dysregulation. Do not claim every entertaining ENTP is "in their Superego": Ne/Fe confidence can create similar behavior.

**Design:** two-sided state card with examples, *What I notice*, *What I'm needing*, *What helps me regulate*, *What would healthy expression look like?*; no simplistic green/red moral score. User selects and reflects, assistant never infers automatic state from a chat.

## 7. Four-side training for a generalized product
Original ENTP example, transformed into **type-neutral competencies**:
| Mode | Function emphasis in worked ENTP | User-visible skill | Practice |
| --- | --- | --- | --- |
| Explore | Ne + Ti | Generate and evaluate options intentionally | Set a 20-minute idea window; write one decision or stop |
| Restore | Si + Fe | Enjoy familiar sensory experience and connection | 10-minute phone-free routine or receptive listening |
| Commit | Ni + Te | Choose a direction; produce an external result | One outcome + next visible deliverable + 72-hour mini sprint |
| Express | Se + Fi | Participate, move and express authentic preference | Improv, live storytelling, dance, physical art |
For a non-ENTP, **do not copy these type/side assignments**. Mode names describe human jobs; link functions/side-specific gateways from `sides(t)` plus `FN_PRACTICE` and author-reviewed interpretation. A person's preferences override any type's recommended exercise.

### Full eight-function development repertoire
- Ne: exploration bounded to a purpose; optional divergent ideation exercise.
- Ni: choose a direction, articulate future consequence, revisit actual results.
- Te: deliver an observable result, measure a practical outcome.
- Ti: evaluate an argument with an explicit stopping rule.
- Fe: listen to an answer, address a group's actual needs respectfully.
- Fi: identify personal values and make an independent preference choice.
- Si: maintain familiarity, continuity and rest without making it productivity optimization.
- Se: practice present embodied experience, physical craft, play and performance with autonomy.

### All-type derivation requirements
1. For each `type` in `TYPES`, compute `stack(type)` and `sides(type)`.
2. For each of four sides use the actual side's `slots`, `gateway.fn`, `blockedBy`, `opensWith`, `developed`, `undeveloped`, and `atWill`. No manually curated 16x4 mapping.
3. Each function practice has goal, physical/cognitive demand, estimated duration, contraindication/alternative where relevant, self-report reflection, evidence class, version and provenance.
4. Personalize by goal and a user's actual preferences, not by fixed assumptions about personality. Offer opt-out and accessibility-equivalent options.
5. Distinguish *practice completed* from *function developed*. A record is behavior and self-report, not a psychometric score.
6. Interactive four-side diagram: start at Ego (default), optionally explore the other three without promising real mental-state control. Developed/reactive views are user-selected, not inferred.

## 8. Concrete interview and scenario bank
- "I find our conversations energizing; I am unsure if we want the same kind of relationship. What have we actually each said?"
- "When do I ask for an explanation from curiosity, and when am I trying to prove inconsistency?"
- "I have five interesting projects. What result do I commit to, and what do I stop exploring?"
- "During dinner my mind starts designing a new business. Can I capture the idea and return to the meal?"
- "I want to express my playful, performative side. Am I enjoying myself or attempting to induce a reaction?"
- "Can I let a good idea pass without treating it as a command?"
- "What is one small repeatable experience I would enjoy without optimizing?"
- "What would I want if no one applauded?"
Use in demo content only as anonymized composite situations; do not reuse verbatim private conversation or suggest that a real third person has been classified.

## 9. Evidence/provenance and publication policy
- **Structural:** engine-derived `stack`, `sides`, pair and wheel results. Validity: internally deterministic, externally tested against specific published typology tables; does NOT validate personality typing as a scientific construct.
- **Interpretive:** function motivations, optimistic/pessimistic slots, developed/undeveloped four sides; authored framework, may be useful for reflection.
- **Observed:** actual described actions (e.g., a person declined an invitation); context-specific.
- **Self-report:** a person's declared internal experience; cannot be attributed by outside analysis.
- **Empirical:** third-party survey/academic evidence, with attribution and methodology; do not conflate with internal theoretical predictions.

Maintain a visible "lens, not a measurement" posture. If uncertain, reduce claims. If future research disputes model claims, preserve traceability and discuss limits rather than silently declaring compatibility.

## 10. Required pedagogical diagrams and acceptance tests
1. Ne branching / Ni convergence; user explains distinction.
2. Ti reasoning vs Ni interpretation; users do NOT conclude one predicts desire.
3. Position comparison: optimistic/pessimistic hypothesis, labels separated from behavioral facts.
4. Eight functions redealt into four sides; diagram data equals `sides(t)` for 16 types.
5. Developed/reactive Superego example, plus user choice not to identify with either label.
6. Si/Se sensory examples with explicit consent boundaries; content reviewed for manipulation risks.
7. Explore/Restore/Commit/Express generalized to all types; no type receives only one developmental path.
8. Actual practice log, not invented "function strength" percent.

## 11. Related references and boundaries
- Existing implementation: `src/engine/functions.ts`, `sides.ts`, `plain.ts`, `src/views/Sides.tsx`, `src/components/FourSidesDiagram.tsx`.
- Documentation: README.md, `docs/DESIGN-SYSTEM.md`, `docs/DESIGN-CATALOGUE.md`, `docs/QA-REVIEW.md`; prior review in PR #56.
- Public product copy respects `tests/attribution.test.ts`; provenance discussions belong in reviewed translation/research surfaces.
- This is not a therapeutic protocol, model of consent, diagnosis of relationship behavior, or substitute for evidence-based clinical care.

## 12. Research priorities before claiming validated benefit
Moderated interviews across several types and experience levels; comprehension of illustration; measure whether bounded analysis exercises reduce user-reported rumination relative to a neutral alternative; report uncertainty/sample bias; verify accessibility of physical-practice equivalents; test if development language stigmatizes self-report or implies type-based destiny. Ensure all metrics are privacy-respecting, opt-in where personal information is involved.
