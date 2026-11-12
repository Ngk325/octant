# Practice Engine Specification — All 16 Types, All Four Sides

**Status:** proposal; no new feature has shipped. **Companion:** COGNITIVE-DEVELOPMENT-RESEARCH.md, PRODUCT-EXCELLENCE-BLUEPRINT.md, QA-UAT-RELEASE-GATES.md.

## 1. What to build
Optional **Octant Practice** — an experiential exercise navigator that helps users choose when to Explore, Restore, Commit, Connect or Express. It is NOT a literal selector of neural circuitry, a clinical intervention, or a validated measurement of function strength.

Three product objectives:
1. Reduce compulsive overuse of default strengths by encouraging selective attention and sensible stopping rules.
2. Encourage learning through accessible exercises across all functions and all four modeled sides.
3. Convert insight into observable real-world choices and reflection, not more long-form reading.

User can browse without choosing a personality type, or personalize with consent using an existing type. Never force a user to adopt the model's self-description.

## 2. Derive structure; author activities
Code dependencies: `TYPES`, `stack(t)`, `sides(t)`, `gateways(t)`, `FN_PRACTICE`, `FN_WANTS`, `FN_SATISFACTION` and `FN_STARVATION`. Preserve their existing vocabulary and types.

Suggested TypeScript records (illustrative, reconcile with actual code):
```ts
type ModeId = "explore" | "restore" | "commit" | "connect" | "express";
type EvidenceClass = "model-interpretation" | "behavioral-practice" | "self-report";
type ExperienceLevel = "plain" | "picture" | "named" | "interactive" | "technical";
type Practice = {
  id: string;
  version: number;
  mode: ModeId;
  title: string;
  intent: string;
  functionTags: Fn[];
  durationMinutes: number;
  instruction: string;
  alternativeInstruction?: string;  // accessible or nonphysical option
  reflectionQuestion: string;
  evidenceClass: EvidenceClass;
  safetyNote?: string;
};
type PracticeSuggestion = {
  practiceId: string;
  forType?: MbtiType;
  relevantSide?: SideKey;
  gatewayFunction?: Fn;
  reason: string; // explicitly authored, not a psychological fact
};
type Reflection = {
  id: string;
  practiceId: string;
  practiceVersion: number;
  completedAt: string; // ISO timestamp
  completed: boolean;
  usefulness?: 1 | 2 | 3 | 4 | 5;
  note?: string; // private; never analytics
};
```

Do NOT introduce inferred measures like `seDemonPercent`, `developedSideScore`, `compatibilityProbability` or a sexual-attraction prediction.

## 3. Modes and behavioral exits
| Mode | Job | One immediate action | Stop/transition criterion |
| --- | --- | --- | --- |
| Explore | Generate/test possibilities | Time-box a few plausible options | Stop after agreed time or criteria |
| Restore | Experience continuity, body and calm | Familiar meal, walk, rest or reflective listening | End without forcing insights |
| Commit | Select and execute a line | Pick one outcome and one visible deliverable | Finish or revise on actual evidence |
| Connect | Attend to another person's stated experience | Ask, listen and reflect, without fixing | Other person consents/has room to respond |
| Express | Enjoy authentic physical or creative participation | Storytelling, music, improv, movement | Can stop willingly; expression not dependent on applause |

Not every user wants bodily practices. Provide quiet, seated, non-movement and sensory-neutral alternatives. Physical tasks have normal safety boundaries. No one must perform or disclose private experiences to "develop" a side.

## 4. Worked examples
### ENTP (derived, not a hardcoded special case)
Ego Ne Ti Fe Si; ISFJ Subconscious Si Fe Ti Ne; INTJ Unconscious Ni Te Fi Se; ESFP Superego Se Fi Te Ni.
- Default thought loop: possibilities -> evaluation -> more possibilities. Suggest `Explore` timeboxing or switch to `Restore`.
- ISFJ example: 10 minutes familiar sensory ritual; no optimization; assess presence, not function strength.
- INTJ example: choose one deliverable with externally verifiable completion and a reasonable time limit.
- ESFP example: take the stage joyfully; check whether voluntary vs reactive. This is the user's phenomenological example, NOT proof that the Superego activates.
- Relationship example: shift from decoding another person to listening, being physically present only when mutually desired; no "engineering" sexual attraction.

### INFJ (derived, not a hardcoded special case)
Ego Ni Fe Ti Se; ESTP Subconscious Se Ti Fe Ni; ENFP Unconscious Ne Fi Te Si; ISTJ Superego Si Te Fi Ne.
- Potential overuse: converging too fast on a single interpretation, or excessive responsibility for relational harmony. Do not assume a particular user exhibits either.
- Suggest alternate hypotheses when useful, practical sensory engagement if wanted, reflective reasoning and value clarity.
- Never assume Se Cave predicts physical intimacy reluctance, trauma, or romantic interest. Get explicit self-report.
- Show both constructive and defensive expressions of all four sides; avoid enforcing a universal sequence of modes.

### Every other type
Derive side membership and gateway via `sides(t)`. Select practice by user objective, function opportunities and accessibility preferences, not by assigning a fixed exercise to every type. Run parameterized tests on **all sixteen types** and four sides each. Do not add 16 separate static lesson copies unless a single authored narrative truly needs unique copy.

## 5. Screen flows
**No account required** for trying public, generic practice previews. Authenticated flow:
1. What would you like to change today? (one choice; optional custom objective)
2. A single illustrated practice suggestion, with reason and estimated effort.
3. "Try", "another option", "read why", "not for me"; choice never stigmatized.
4. Practical step with optional in-app check-in.
5. One reflection question and optional usefulness rating (skip allowed).
6. Private history: actions done, self-reported benefit, not a neurotypology meter.
7. From saved practice link to appropriate four-side illustration and technical explanation.

Accessibility: keyboard navigable, no animation required, captions and alt equivalents, readable without high sensory contrast, alternative for movement/physical exercises.

## 6. Data, privacy and retention
MVP may use existing `src/storage.ts` namespaced localStorage for *non-sensitive* activity flags only; typed validation, versioning and graceful corruption behavior required. Private notes can reveal intimate/sensitive details and should default to not persisted or to explicitly opt-in local-only persistence with clearly documented export/erase. Do not add notes to URLs, analytics or AI context. No automatic sync to Worker/KV without privacy review, authentication separation, retention plan, deletion path and consent.

If migrating to accounts later, write migration policy; respect deletion and tenant isolation. Reports require explicit sharing, never public-by-default. No raw third-party text in analytics.

## 7. Architecture
- `src/engine/practice.ts`: pure function to compose eligible practice suggestions from model, user goal and preferences.
- `src/engine/practice-data.ts`: author-reviewed practices with stable ids/version, tags and provenance.
- `src/views/Practice.tsx`: opt-in interaction.
- `src/components/PracticeCard.tsx`, `DevelopmentCompass.tsx`: presentation; do not duplicate model truth.
- `src/storage.ts` extension or separate versioned adapter: safe reflection state.
- `tests/practice.test.ts`: exhaustive all-type selection and zero-invalid-gate guarantee.
- `tests/practice-view.test.tsx`: controls, persistence, skip/delete, accessibility.
- Browser UAT with first-time novices AND experienced users before making Practice prominent.

## 8. Agent interpretation constraints
No automatic typing of others from a few sentences. Assistant can ask what a user noticed, suggest different interpretations, and display the derived model as one lens. No "she is in Fe Parent panic" or "Se Inferior is her intimate block" presented as a finding. Do not take a test's type suggestion as definitive. Avoid prescribing behavioral therapy or diagnosing anxiety.

## 9. MVP acceptance
- A novice can start and finish one practice without reading a function article.
- Every type and all its sides have at least one **available** appropriate practice; no invented strength score.
- User can opt out, select alternate activity, and delete reflection.
- Type selection updates all derived diagram labels and recommendation context with no stale previous-type data.
- For ENTP Showman example, developed/reactive comparison is voluntary/reflection-oriented rather than judgmental.
- Unit + browser E2E + manual a11y, mobile/dark-light, privacy and content reviews pass.
- Experiments compare activation/return/usefulness to baseline, not merely repeat sessions.
