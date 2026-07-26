import { FN_FULL, type Fn } from "../engine/data";
import { usePalette } from "./Theme";

/**
 * Where eight comes from.
 *
 * A first-principles derivation, after the "Function Tree" sheet
 * (erictb.info/typeintro.html — see docs/transcripts/IMG_8413-function-tree.md).
 * The course previously asserted "there are eight functions" and left the
 * reader to take it on trust; this shows the three binary splits that produce
 * exactly eight, which is the same derived-not-listed posture as the engine.
 */

const BRANCHES = [
  {
    mode: "Observing",
    involuntary: "The yes/no happens to you",
    question: "Is / Isn't",
    kids: [
      { axis: "Reality — what is here", letter: "S", fns: ["Se", "Si"] as Fn[] },
      { axis: "Implication — what it points to", letter: "N", fns: ["Ne", "Ni"] as Fn[] },
    ],
  },
  {
    mode: "Deciding",
    involuntary: "You will the yes/no yourself",
    question: "Right / Wrong",
    kids: [
      { axis: "Things — impersonal", letter: "T", fns: ["Te", "Ti"] as Fn[] },
      { axis: "People — personal", letter: "F", fns: ["Fe", "Fi"] as Fn[] },
    ],
  },
];

const ORIENTATION: Record<Fn, string> = {
  Se: "the environment decides what is real",
  Si: "your own record decides what is real",
  Ne: "read the implication off the world",
  Ni: "read the implication off your own patterns",
  Te: "the outside world settles what is true",
  Ti: "your own model settles what is true",
  Fe: "the room settles what is good",
  Fi: "you settle what is good",
};

/**
 * The eight functions as a tree: perceiving versus judging, then each split by attitude.
 * The orientation figure for anyone meeting the vocabulary for the first time.
 */
export default function FunctionTree() {
  const p = usePalette();

  return (
    <div>
      <div
        style={{
          textAlign: "center",
          padding: "var(--s3) var(--s4)",
          border: "1px solid var(--rule-strong)",
          borderRadius: "var(--radius)",
          maxWidth: 340,
          margin: "0 auto var(--s5)",
          background: "var(--surface-2)",
        }}
      >
        <b>Consciousness</b>
        <div className="small muted">Everything arrives as a yes or a no</div>
      </div>

      <div className="grid g2">
        {BRANCHES.map((b) => (
          <div key={b.mode}>
            <div
              style={{
                padding: "var(--s3) var(--s4)",
                border: "1px solid var(--rule)",
                borderRadius: "var(--radius)",
                marginBottom: "var(--s3)",
              }}
            >
              <b>{b.mode}</b>
              <div className="small muted">{b.involuntary}</div>
              <div className="small">
                The question becomes <b>{b.question}</b>
              </div>
            </div>

            {b.kids.map((k) => (
              <div key={k.letter} style={{ marginBottom: "var(--s3)", paddingLeft: "var(--s4)" }}>
                <div className="small" style={{ marginBottom: 4 }}>
                  <b className="mono">{k.letter}</b> — {k.axis}
                </div>
                {k.fns.map((fn) => (
                  <div
                    key={fn}
                    style={{
                      display: "flex",
                      gap: "var(--s2)",
                      alignItems: "baseline",
                      padding: "4px 0 4px var(--s3)",
                      borderLeft: `2px solid ${p.fn(fn)}`,
                      marginBottom: 2,
                    }}
                  >
                    <b className="mono" style={{ color: p.fn(fn), minWidth: 26 }}>{fn}</b>
                    <span className="small">
                      {FN_FULL[fn]} — {ORIENTATION[fn]}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <p className="small muted" style={{ marginTop: "var(--s4)", marginBottom: 0 }}>
        Two modes × two axes each × two orientations = eight. Not a list someone drew up — a count
        that falls out of three yes/no distinctions.
      </p>
    </div>
  );
}
