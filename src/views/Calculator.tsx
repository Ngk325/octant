import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { calculate, COIN_OPTIONS, coins, quadra, type MbtiType } from "../engine/core";
import { COIN_LABELS, DETERMINING } from "../engine/data";
import { QUADRA_COLOR, easeColor } from "../engine/palette";
import { Panel } from "../components/Bits";

const PROMPTS: [string, string][] = [
  ["Relatively balanced between self and tribe, but stuck on control versus chaos.",
   "Relatively balanced between control and chaos, but stuck on self versus tribe."],
  ["I settle on my own values and reasons first, then go looking for the group's.",
   "I read the group's values and reasons first, then work out my own."],
  ["Answers come from working over what I already know, and gathering more later.",
   "Answers come from gathering new material first, and organising it later."],
  ["I work out the reasons for something, then the priorities.",
   "I work out what matters, then the reasons."],
  ["I want the provable, concrete thing first; connections come after.",
   "I see the connections first; the concrete thing comes after."],
  ["I move first — I start conversations and change the subject easily.",
   "I wait — I like to finish a thought, and I take time to process."],
  ["I say exactly what I mean, in fewer words, and give instructions.",
   "I give context and background, and leave the other person room to choose."],
  ["I focus on the outcome, and will slow down to get it exactly right.",
   "I focus on progress, and would rather keep moving and fix things later."],
];

export default function Calculator() {
  const [answers, setAnswers] = useState<(string | null)[]>(Array(8).fill(null));
  const result = useMemo(() => calculate(answers), [answers]);
  const isDetermining = (i: number) => (DETERMINING as readonly number[]).includes(i);

  const set = (i: number, v: string) =>
    setAnswers((a) => a.map((x, j) => (j === i ? (x === v ? null : v) : x)));

  return (
    <>
      <h1>Determine the type</h1>
      <p className="lede">
        Four coins fix the type. The other four are mathematically derivable from them, so they
        cannot add evidence — but where your self-report and the structure disagree, that
        disagreement is worth seeing. Nothing here ever returns nothing.
      </p>

      <div className="grid g-side" style={{ marginTop: 22, alignItems: "start" }}>
        <div className="grid" style={{ gap: 12 }}>
          {COIN_OPTIONS.map(([A, B], i) => (
            <Panel key={i} className="tight">
              <span className="eyebrow">
                Coin {i + 1} · {COIN_LABELS[i]}
                {isDetermining(i)
                  ? <b style={{ color: "#c9a0ff" }}> · determining</b>
                  : <span style={{ color: "#4a525e" }}> · confirming</span>}
              </span>
              <div className="choice">
                <button className={`opt${answers[i] === A ? " on" : ""}`}
                        aria-pressed={answers[i] === A} onClick={() => set(i, A)}>
                  <b>{A}</b>{PROMPTS[i][0]}
                </button>
                <span className="vs">OR</span>
                <button className={`opt${answers[i] === B ? " on" : ""}`}
                        aria-pressed={answers[i] === B} onClick={() => set(i, B)}>
                  <b>{B}</b>{PROMPTS[i][1]}
                </button>
              </div>
            </Panel>
          ))}
          <button className="ghost" style={{ justifySelf: "start" }}
                  onClick={() => setAnswers(Array(8).fill(null))}>
            Clear all
          </button>
        </div>

        <div className="grid" style={{ gap: 14, position: "sticky", top: 16 }}>
          <Panel title="Surviving field">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
              {result.field.map((t) => (
                <Link key={t} to={`/type/${t}`} className="chip"
                      style={{ borderColor: result.field.length === 1 ? "#4b5f7a" : undefined }}>
                  <i className="dot" style={{ background: QUADRA_COLOR[quadra(t)] }} />
                  {t}
                </Link>
              ))}
            </div>
            <p className="small" style={{ margin: 0 }}>
              {result.field.length} of 16 remaining · {result.determiningAnswered} of 4
              determining coins answered.
            </p>
          </Panel>

          {result.best && (
            <Panel title="Result">
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span className="score" style={{ fontSize: 44 }}>{result.best}</span>
                <Link to={`/type/${result.best}`} className="chip">Read the wiring →</Link>
              </div>
              <p className="small" style={{ marginTop: 10 }}>
                {result.status === "resolved" &&
                  "Fully consistent: every confirming coin agrees with the structure."}
                {result.status === "friction" &&
                  "Resolved on the determining coins, with self-report friction below."}
                {result.status === "tie" &&
                  "Tied. Two structures fit the coins you answered equally well."}
              </p>

              {result.conflicts.length > 0 && (
                <div className="note warn" style={{ marginTop: 10 }}>
                  {result.conflicts.map((c) => (
                    <div key={c.index} style={{ marginBottom: 6 }}>
                      <b className="mono" style={{ fontSize: 11 }}>{c.label}</b><br />
                      You said <b>{c.said}</b>; {result.best} is structurally <b>{c.predicted}</b>.
                    </div>
                  ))}
                  <span className="small">
                    Not an error. Either the determining answers need revisiting, or this is a
                    genuine gap between how you read yourself and how the wiring runs.
                  </span>
                </div>
              )}
            </Panel>
          )}

          <Panel title="Ranked field">
            {result.ranked.slice(0, 6).map((r) => (
              <div key={r.type} className="row">
                <dt style={{ textTransform: "none", letterSpacing: 0 }}>
                  <Link to={`/type/${r.type}`}>{r.type}</Link>
                </dt>
                <dd>
                  <span className="small" style={{ marginRight: 10 }}>
                    {r.determining}/4 determining · {r.confirming}/4 confirming
                  </span>
                  <b className="mono" style={{ color: easeColor(Math.min(100, r.score * 2.2)) }}>
                    {r.score}
                  </b>
                </dd>
              </div>
            ))}
          </Panel>

          <p className="small">
            Coin 2 is the exact inverse of coin 3, and coin 8 is a function of coins 6 and 7.
            They are kept because answering them is informative about self-perception, not
            because the model needs them.
          </p>
        </div>
      </div>

      <details style={{ marginTop: 26 }}>
        <summary className="eyebrow" style={{ cursor: "pointer" }}>
          Why four coins are enough
        </summary>
        <p className="small" style={{ maxWidth: "70ch", marginTop: 10 }}>
          Coins 3 and 5 name the savior observer exactly (attitude and element); coins 2 and 4 name
          the savior decider. Because the two saviors must run opposite attitudes, coin 2 carries no
          information coin 3 has not already given. That leaves coin 1 — which of the two saviors
          leads — and the type is fixed. Four bits, sixteen types.
        </p>
        <table className="matrix" style={{ marginTop: 12, maxWidth: 560 }}>
          <tbody>
            {(["Observer", "Decider"] as const).map((o) => (
              <tr key={o}>
                <th style={{ textAlign: "right", paddingRight: 8 }}>{o}</th>
                {coinRow(o).map((t) => (
                  <td key={t} style={{ padding: "3px 5px", color: "#aab3c0" }}>{t}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}

function coinRow(which: "Observer" | "Decider"): MbtiType[] {
  const all: MbtiType[] = [
    "ENTP", "INTP", "ENTJ", "INTJ", "ENFP", "INFP", "ENFJ", "INFJ",
    "ESTP", "ISTP", "ESTJ", "ISTJ", "ESFP", "ISFP", "ESFJ", "ISFJ",
  ];
  return all.filter((t) => coins(t)[0] === which);
}
