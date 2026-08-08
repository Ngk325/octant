import { useMemo, useState } from "react";
import { Link } from "react-router";
import { quadra } from "../engine/core";
import { calculate, COIN_OPTIONS } from "../engine/ops";
import { COIN_LABELS, DETERMINING } from "../engine/data";
import { COIN_PLAIN } from "../engine/plain";
import { usePalette } from "../components/Theme";
import { usePublishContext } from "../chat/ChatContext";
import { calcSummary } from "../engine/context";
import Explain from "../components/Explain";
import { ChoiceCard, Panel } from "../components/Bits";
import FnIcon from "../components/glyphs/FnIcon";
import SelfTribeCone from "../components/glyphs/SelfTribeCone";
import TypeMolecule from "../components/glyphs/TypeMolecule";

const PROMPTS: [string, string][] = [
  ["I take things in first and make up my mind later.",
   "I make up my mind first and gather the details later."],
  ["I settle on my own reasons and values first, then go looking for the group's.",
   "I read the group's reasons and values first, then work out my own."],
  ["Answers come from working over what I already know. I gather more afterwards.",
   "Answers come from gathering new material first. I organise it afterwards."],
  ["I work out the reasons for something, then what matters.",
   "I work out what matters, then the reasons."],
  ["I want the concrete, provable thing first. Connections come after.",
   "I see the connections first. The concrete thing comes after."],
  ["I move first — I start conversations and change the subject easily.",
   "I wait — I like to finish a thought, and I take time to process."],
  ["I say exactly what I mean, in fewer words.",
   "I give context and background, and leave the other person room to choose."],
  ["I focus on the outcome, and will slow down to get it exactly right.",
   "I focus on progress, and would rather keep moving and fix things later."],
];

/**
 * The glyph a choice card leads with, when its pole is something the glyph
 * language can draw. Decorative only — the prompt is the choice, so the
 * pictures are hidden from assistive tech.
 *
 * `i` is the ZERO-BASED index into COIN_OPTIONS, so it is one less than the
 * coin number the page prints and the Explain block above argues about. The
 * parameter used to be called `coin`, which read as the one-based number and
 * drew a review asking for `coinGlyph(i + 1, …)` — that slides every pair
 * onto the neighbouring question and puts the self/tribe cone against
 * Observer-vs-Decider. Both numbers are given per branch below, and
 * tests/calculator.test.tsx pins each pair to its question.
 *
 * Two rules, because the coins ask two different things. Where the pair IS
 * an attitude the mark runs inward → outward; where it is an element the
 * outward member of each family stands in for the family, since attitude is
 * not what is being asked.
 */
function coinGlyph(i: number, side: 0 | 1): React.JSX.Element | null {
  /* i=1 · coin 2 — self-calibrated vs tribe-calibrated, the F pair standing
     in for both deciders. */
  if (i === 1) {
    return (
      <span style={{ display: "block", width: 104 }}>
        <SelfTribeCone fn={side === 0 ? "Fi" : "Fe"} />
      </span>
    );
  }
  /* i=2 · coin 3 — the observer's attitude. */
  if (i === 2) return <FnIcon fn={side === 0 ? "Si" : "Se"} size={44} />;
  /* i=3 · coin 4 — the decider's element. */
  if (i === 3) return <FnIcon fn={side === 0 ? "Te" : "Fe"} size={44} />;
  /* i=4 · coin 5 — the observer's element. */
  if (i === 4) return <FnIcon fn={side === 0 ? "Se" : "Ne"} size={44} />;
  /* Coins 1, 6, 7 and 8 ask about sequencing and delivery, which the glyph
     language has no honest mark for. The prompt stands alone. */
  return null;
}

/** Eight either-or questions. Four decide the type; four cross-check it. */
export default function Calculator() {
  const [answers, setAnswers] = useState<(string | null)[]>(Array(8).fill(null));
  const result = useMemo(() => calculate(answers), [answers]);
  const answered = answers.filter(Boolean).length;
  const p = usePalette();
  /** Is this one of the four coins that actually fixes the type? */
  const isDetermining = (i: number) => (DETERMINING as readonly number[]).includes(i);

  usePublishContext(() => ({ kind: "calculator", ...calcSummary(result) }), [result]);

  /** Toggle an answer. Choosing the same pole again clears it, so nothing is unanswerable. */
  const set = (i: number, v: string) =>
    setAnswers((a) => a.map((x, j) => (j === i ? (x === v ? null : v) : x)));

  return (
    <>
      <h1>Find your type</h1>

      <Explain
        big
        plain="Eight either-or questions. There is no right answer and no scoring you can fail — pick whichever sounds more like an ordinary day for you. Four of the eight actually decide it; the other four are a cross-check."
      >
        <p>
          Coin 3 gives the anchor observer's attitude and coin 5 gives its element, so the two
          together name that function exactly. Coin 4 gives the anchor decider's element. Coin 2
          would give the decider's attitude, but it carries nothing new: the two anchors must run
          opposite attitudes, so coin 3 has already fixed it. What is still missing is which of the
          two anchors leads, and that is coin 1. Coins <b>1, 3, 4 and 5</b> — the four highlighted
          below — are therefore the deciding set, and four independent bits fix one of sixteen. The
          other four are kept because disagreement between self-report and structure is itself
          informative.
        </p>
      </Explain>

      <div className="grid g-side" style={{ marginTop: "var(--s6)", alignItems: "start" }}>
        <div className="stack-v">
          {COIN_OPTIONS.map(([A, B], i) => (
            <Panel key={i}>
              <p style={{ fontSize: "var(--t-lg)", marginBottom: "var(--s2)" }}>
                {i + 1}. {COIN_PLAIN[i]}
              </p>
              <p className="small muted" style={{ marginBottom: "var(--s4)", display: "flex", gap: "var(--s2)", alignItems: "center", flexWrap: "wrap" }}>
                {COIN_LABELS[i]}
                <span className={`chip${isDetermining(i) ? " on" : ""}`}>
                  {isDetermining(i) ? "decides your type" : "cross-check"}
                </span>
              </p>

              <div className="grid g2" style={{ gap: "var(--s3)" }}>
                {([[A, PROMPTS[i][0], 0], [B, PROMPTS[i][1], 1]] as const).map(([val, prompt, side]) => {
                  const glyph = coinGlyph(i, side);
                  return (
                    <ChoiceCard key={val} selected={answers[i] === val} onClick={() => set(i, val)}>
                      {glyph && (
                        <span
                          aria-hidden="true"
                          style={{ display: "flex", justifyContent: "center", marginBottom: "var(--s3)" }}
                        >
                          {glyph}
                        </span>
                      )}
                      {prompt}
                    </ChoiceCard>
                  );
                })}
              </div>
            </Panel>
          ))}
        </div>

        <div className="stack-v" style={{ position: "sticky", top: "calc(var(--masthead-h) + var(--s5))" }}>
          {result.best && (
            <Panel title="Your type">
              <div className="cluster" style={{ gap: "var(--s4)", alignItems: "center" }}>
                <TypeMolecule type={result.best} size={56} />
                <span className="score" style={{ fontSize: "var(--t-3xl)" }}>{result.best}</span>
                <Link to={`/type/${result.best}`} className="btn primary">Read it →</Link>
              </div>
              <p className="small" style={{ marginTop: "var(--s3)", marginBottom: 0 }}>
                {result.status === "resolved" && "Everything you said lines up."}
                {result.status === "friction" && "Decided on the four that matter — with some disagreement below."}
                {result.status === "tie" && "Two types fit what you have answered equally well. Try the remaining questions."}
              </p>

              {result.conflicts.length > 0 && (
                <div className="note warn" style={{ marginTop: "var(--s4)" }}>
                  {result.conflicts.map((c) => (
                    <p key={c.index} className="small" style={{ marginBottom: "var(--s2)" }}>
                      You said <b>{c.said}</b>; {result.best} is usually <b>{c.predicted}</b>.
                    </p>
                  ))}
                  <p className="small" style={{ margin: 0 }}>
                    Not an error. Either one of the four deciding answers is worth revisiting, or
                    this is a real gap between how you read yourself and how the wiring runs.
                  </p>
                </div>
              )}
            </Panel>
          )}

          <Panel title="Still possible">
            <div className="cluster" style={{ marginBottom: "var(--s3)" }}>
              {answered > 0 && (
                <button type="button" className="btn ghost" style={{ marginLeft: "auto", order: 2 }}
                        onClick={() => setAnswers(Array(8).fill(null))}>
                  Clear all
                </button>
              )}
              {result.field.map((t) => (
                <Link key={t} to={`/type/${t}`} className="chip mono">
                  <i className="dot" style={{ background: p.quadra(quadra(t)) }} />
                  {t}
                </Link>
              ))}
            </div>
            <p className="small" style={{ margin: 0 }}>
              {result.field.length} of 16 left · {result.determiningAnswered} of 4 deciding
              questions answered.
            </p>
          </Panel>

          <Panel title="Closest fits">
            {result.ranked.slice(0, 5).map((r) => (
              <div key={r.type} className="row">
                <dt style={{ fontFamily: "var(--mono)" }}>
                  <Link to={`/type/${r.type}`}>{r.type}</Link>
                </dt>
                <dd className="small">
                  {r.determining}/4 deciding · {r.confirming}/4 cross-check
                </dd>
              </div>
            ))}
          </Panel>

          <p className="small muted">
            Self-report is the weakest evidence in typology. If the result feels wrong, read two or
            three of the closest fits rather than trusting the number.
          </p>
        </div>
      </div>

      {/* The feedback loop, kept alive on phones. Below 900px the results
          column renders after all eight questions, which silently killed the
          one thing this page is for — answer, watch the field narrow. The
          dock pins the current state to the bottom of the screen instead. */}
      {answered > 0 && (
        <div className="calc-dock" role="status">
          {result.best ? (
            <>
              <span>
                Best fit so far: <b className="mono">{result.best}</b>
              </span>
              <Link to={`/type/${result.best}`} className="btn primary">Read it →</Link>
            </>
          ) : (
            <span>
              {result.field.length} of 16 left · {result.determiningAnswered}/4 deciding answered
            </span>
          )}
        </div>
      )}
    </>
  );
}
