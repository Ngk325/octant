import { useMemo, useState } from "react";
import { Link } from "react-router";
import { quadra } from "../engine/core";
import { calculate } from "../engine/ops";
import { COIN_LABELS, DETERMINING } from "../engine/data";
import { READ_PROMPTS, readPoleValue } from "../engine/read";
import { usePalette } from "../components/Theme";
import { usePublishContext } from "../chat/ChatContext";
import { calcSummary } from "../engine/context";
import Explain from "../components/Explain";
import { ChoiceCard, Panel } from "../components/Bits";
import TypeMolecule from "../components/glyphs/TypeMolecule";

/**
 * Six indirect scenes, asked or watched for in an ordinary conversation, in
 * place of the calculator's eight direct self-report statements.
 *
 * Deliberately no glyphs on the answer cards here — a glyph is a picture of
 * the very axis the wording is trying not to give away, and this page is
 * often open on a phone while the person it's about is sitting across the
 * table. The calculator gets to be explicit about what it's asking; this
 * page's whole premise is that it isn't.
 */
export default function Read() {
  const [answers, setAnswers] = useState<(string | null)[]>(Array(8).fill(null));
  const result = useMemo(() => calculate(answers), [answers]);
  const answered = answers.filter(Boolean).length;
  const p = usePalette();
  const isDetermining = (i: number) => (DETERMINING as readonly number[]).includes(i);

  usePublishContext(() => ({ kind: "read", ...calcSummary(result) }), [result]);

  /** Toggle an answer. Choosing the same pole again clears it, so nothing is unanswerable. */
  const set = (coin: number, v: string) =>
    setAnswers((a) => a.map((x, j) => (j === coin ? (x === v ? null : v) : x)));

  return (
    <>
      <h1>Read someone</h1>

      <Explain
        big
        plain="Six ordinary things to ask or notice about someone else, instead of eight statements they'd have to answer about themselves. No question here names what it's testing."
      >
        <p>
          Same instrument as the calculator, asked a different way. Four of the six are the
          <b> same four determining coins</b> the calculator uses — Observer/Decider, Organize/
          Gather, Thinking/Feeling, Sensing/iNtuition — so a full read fixes the type the same way
          a full calculator run does. The other two are confirming cross-checks. Answers score
          through the same <code>calculate()</code> the calculator uses; nothing here has its own
          separate math to drift out of step with it.
        </p>
        <p style={{ marginBottom: 0 }}>
          Worth saying plainly: an indirect cue is a correlate, not the axis. A messy desk can be
          a busy month rather than Gather; a quick verdict can be politeness rather than Decider.
          This is weaker evidence than the calculator's direct self-report, which is already the
          weakest evidence in typology — read it as a place to start, not a place to stop.
        </p>
      </Explain>

      <div className="grid g-side" style={{ marginTop: "var(--s6)", alignItems: "start" }}>
        <div className="stack-v">
          {READ_PROMPTS.map((prompt, i) => (
            <Panel key={i}>
              <p style={{ fontSize: "var(--t-lg)", marginBottom: "var(--s2)" }}>
                {i + 1}. {prompt.cue}
              </p>
              <p className="small muted" style={{ marginBottom: "var(--s4)", display: "flex", gap: "var(--s2)", alignItems: "center", flexWrap: "wrap" }}>
                {COIN_LABELS[prompt.coin]}
                <span className={`chip${isDetermining(prompt.coin) ? " on" : ""}`}>
                  {isDetermining(prompt.coin) ? "decides their type" : "cross-check"}
                </span>
              </p>

              <div className="grid g2" style={{ gap: "var(--s3)" }}>
                {([0, 1] as const).map((side) => {
                  const val = readPoleValue(prompt, side);
                  return (
                    <ChoiceCard
                      key={val}
                      selected={answers[prompt.coin] === val}
                      onClick={() => set(prompt.coin, val)}
                    >
                      {prompt.poles[side]}
                    </ChoiceCard>
                  );
                })}
              </div>
            </Panel>
          ))}
        </div>

        <div className="stack-v" style={{ position: "sticky", top: "calc(var(--masthead-h) + var(--s5))" }}>
          {result.best && (
            <Panel title="Their type">
              <div className="cluster" style={{ gap: "var(--s4)", alignItems: "center" }}>
                <TypeMolecule type={result.best} size={56} />
                <span className="score" style={{ fontSize: "var(--t-3xl)" }}>{result.best}</span>
                <Link to={`/type/${result.best}`} className="btn primary">Read it →</Link>
              </div>
              <p className="small" style={{ marginTop: "var(--s3)", marginBottom: 0 }}>
                {result.status === "resolved" && "Everything you noticed lines up."}
                {result.status === "friction" && "Decided on the four that matter — with some disagreement below."}
                {result.status === "tie" && "Two types fit what you have so far equally well. Try the remaining prompts."}
              </p>

              {result.conflicts.length > 0 && (
                <div className="note warn" style={{ marginTop: "var(--s4)" }}>
                  {result.conflicts.map((c) => (
                    <p key={c.index} className="small" style={{ marginBottom: "var(--s2)" }}>
                      You read <b>{c.said}</b>; {result.best} is usually <b>{c.predicted}</b>.
                    </p>
                  ))}
                  <p className="small" style={{ margin: 0 }}>
                    Not an error. Either one of the four deciding reads is worth revisiting, or the
                    cross-check caught a real exception.
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
              prompts answered.
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
            Read two or three of the closest fits rather than trusting the top result alone —
            indirect cues are noisier than what someone tells you about themselves directly.
          </p>
        </div>
      </div>

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
