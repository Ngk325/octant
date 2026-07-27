import { Link } from "react-router-dom";
import { TYPES, REL, ease, quadra } from "../engine/core";
import { REL_NAME, REL_SCORE, REL_DEF, type RelCode } from "../engine/data";
import { REL_PLAIN } from "../engine/plain";
import { usePalette } from "../components/Theme";
import { usePublishContext } from "../chat/ChatContext";
import Explain from "../components/Explain";
import { Panel, Row } from "../components/Bits";

/** All 256 cells, colour-scaled, every cell a link into the pair reader. */
export default function Matrix() {
  const p = usePalette();
  const codes = (Object.keys(REL_SCORE) as RelCode[]).sort((a, b) => REL_SCORE[b] - REL_SCORE[a]);

  usePublishContext(() => ({ kind: "matrix" }), []);

  return (
    <>
      <h1>Every pair at once</h1>

      <Explain
        big
        plain="All 256 combinations in one grid. Find the row for one person and the column for the other, and the colour tells you how easy it is — for the person in the row."
      >
        <p>
          Row is the target, column the perspective, value is ease for the row type. The grid is
          deliberately not symmetric: supervision and benefit run one way, so cell (a, b) and
          cell (b, a) genuinely differ for four of the sixteen relations.
        </p>
      </Explain>


      <Panel style={{ marginTop: "var(--s5)" }}>
        <div className="matrix-wrap">
          <table className="matrix">
            <caption className="small muted" style={{ captionSide: "top", textAlign: "left", paddingBottom: "var(--s3)" }}>
              Ease for the row type, 0–100. Click any cell for the full reading.
            </caption>
            <thead>
              <tr>
                <th />
                {TYPES.map((x) => (
                  <th key={x} scope="col" style={{ color: p.quadra(quadra(x)) }}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TYPES.map((t) => (
                <tr key={t}>
                  <th scope="row" style={{ textAlign: "right", paddingRight: 8, color: p.quadra(quadra(t)) }}>{t}</th>
                  {TYPES.map((x) => {
                    const v = ease(t, x);
                    return (
                      <td key={x} style={{ background: p.fill(v) }}>
                        <Link
                          to={`/pair/${t}/${x}`}
                          style={{ color: p.onFill }}
                          title={`${x} is ${t}'s ${REL_NAME[REL[t][x]]} — ease ${v} for ${t}`}
                        >
                          {v}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <h2>The sixteen relations</h2>
      <p className="small muted" style={{ marginTop: "calc(var(--s3) * -1)" }}>
        Sorted by ease, highest first — the order of the scores, not of importance.
      </p>
      {/* One column on purpose: each card is a disclosure, and in a grid,
          opening one stretched its row and shifted the neighbour. */}
      <div className="stack-v" style={{ maxWidth: "var(--measure-wide)" }}>
        {codes.map((c) => (
          <Panel key={c}>
            <div className="cluster" style={{ marginBottom: "var(--s2)" }}>
              <h3 style={{ margin: 0, fontSize: "var(--t-lg)" }}>{REL_NAME[c]}</h3>
              <span className="chip mono" style={{ color: p.ease(REL_SCORE[c]) }}>{REL_SCORE[c]}</span>
              <span className="chip mono">{c}</span>
            </div>
            <Explain plain={REL_PLAIN[c]}>
              <p style={{ margin: 0 }}>{REL_DEF[c]}</p>
            </Explain>
          </Panel>
        ))}
      </div>

      <Panel title="Reading the numbers" style={{ marginTop: "var(--s5)" }}>
        <Row
          stacked
          k="The grid is asymmetric on purpose"
          v={<span className="small">
            Examination and lift run one way, so cell (a, b) and cell (b, a) genuinely differ.
            Read a row <i>and</i> its column: green across a row with red down the same column
            means that type finds everyone easy while everyone finds them hard.
          </span>}
        />
        <Row
          stacked
          k="Ease is not compatibility"
          v={<span className="small">
            A high number means low friction, not a good relationship. Some of the most valuable
            pairings in the model sit in the middle, because friction is where growth comes from.
          </span>}
        />
        <Row
          stacked
          k="Nobody is stuck with their row"
          v={<span className="small">
            These describe defaults, not ceilings. Every relation in the grid is workable once both
            people can see what it is doing.
          </span>}
        />
      </Panel>
    </>
  );
}
