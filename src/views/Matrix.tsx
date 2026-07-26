import { TYPES, REL, ease, quadra } from "../engine/core";
import { REL_NAME, REL_SCORE, REL_DEF, type RelCode } from "../engine/data";
import { easeColor, QUADRA_COLOR } from "../engine/palette";
import { Panel } from "../components/Bits";

export default function Matrix() {
  const codes = (Object.keys(REL_SCORE) as RelCode[]).sort((a, b) => REL_SCORE[b] - REL_SCORE[a]);
  return (
    <>
      <h1>The matrix</h1>
      <p className="lede">
        256 cells, all derived. Row is the target; column is the perspective. The value is ease
        for the row type, so the grid is deliberately not symmetric — supervision and benefit
        run one way.
      </p>

      <Panel style={{ marginTop: 18, overflowX: "auto" }}>
        <table className="matrix">
          <thead>
            <tr>
              <th />
              {TYPES.map((p) => (
                <th key={p} style={{ color: QUADRA_COLOR[quadra(p)] }}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPES.map((t) => (
              <tr key={t}>
                <th style={{ textAlign: "right", paddingRight: 6, color: QUADRA_COLOR[quadra(t)] }}>{t}</th>
                {TYPES.map((p) => {
                  const v = ease(t, p);
                  return (
                    <td key={p} style={{ background: easeColor(v) }}>
                      <a href={`/pair/${t}/${p}`}
                         title={`${p} is ${t}'s ${REL_NAME[REL[t][p]]} — ease ${v}`}>
                        {REL[t][p]}
                      </a>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="The sixteen relations" style={{ marginTop: 14 }}>
        <div className="grid g2">
          {codes.map((c) => (
            <div key={c} className="row" style={{ alignItems: "flex-start" }}>
              <dt style={{ minWidth: 128 }}>
                <span style={{ color: easeColor(REL_SCORE[c]) }}>{c}</span>{" "}
                {REL_NAME[c]} · {REL_SCORE[c]}
              </dt>
              <dd style={{ textAlign: "left", fontSize: 12.5, color: "#aab3c0" }}>
                {REL_DEF[c]}
              </dd>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
