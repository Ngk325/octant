import { useNavigate, useParams } from "react-router-dom";
import { TYPES, REL, ease, stack, quadra, type MbtiType } from "../engine/core";
import { REL_NAME, REL_DEF, RECIPROCAL, DOM_AUX, SLOT_NAMES } from "../engine/data";
import { playbook } from "../engine/playbook";
import { compareAspects } from "../engine/lexicon";
import Term from "../components/Term";
import { FN_COLOR, easeColor, QUADRA_COLOR } from "../engine/palette";
import TypePicker from "../components/TypePicker";
import { Panel, Row, Score, EaseBar } from "../components/Bits";

export default function PairReader() {
  const { a, b } = useParams();
  const nav = useNavigate();
  const target = (TYPES.includes(a as MbtiType) ? a : "ENTP") as MbtiType;
  const persp = (TYPES.includes(b as MbtiType) ? b : "ENFJ") as MbtiType;

  const code = REL[target][persp];
  const easeTarget = ease(target, persp);
  const easePersp = ease(persp, target);
  const symmetric = RECIPROCAL[code] === code;

  const tStack = stack(target);
  const [pHero, pParent] = DOM_AUX[persp];
  const landing = [pHero, pParent].map((fn) => ({
    fn, slot: SLOT_NAMES[tStack.indexOf(fn)],
  }));

  return (
    <>
      <div style={{ display: "flex", gap: 22, alignItems: "flex-end", flexWrap: "wrap", marginTop: 26 }}>
        <TypePicker label="Target — being read" value={target}
          onChange={(x) => nav(`/pair/${x}/${persp}`)} />
        <TypePicker label="Perspective — doing the reading" value={persp}
          onChange={(x) => nav(`/pair/${target}/${x}`)} />
        <button className="ghost" onClick={() => nav(`/pair/${persp}/${target}`)}>
          Swap ⇄
        </button>
      </div>

      <h1 style={{ marginBottom: 4 }}>{REL_NAME[code]}</h1>
      <p className="lede">{REL_DEF[code]}</p>

      <div className="grid g-side" style={{ marginTop: 20, alignItems: "start" }}>
        <Panel title={`Playbook — written to ${persp}, about ${target}`}>
          <p className="playbook">{playbook(persp, target)}</p>
        </Panel>

        <div className="grid" style={{ gap: 14 }}>
          <Panel title="Ease, both directions">
            <div className="stat" style={{ marginBottom: 14 }}>
              <Score value={easeTarget} caption={`How ${target} experiences ${persp}`} />
              <Score value={easePersp} caption={`How ${persp} experiences ${target}`} />
            </div>
            <EaseBar value={easeTarget} />
            <div style={{ height: 6 }} />
            <EaseBar value={easePersp} />
            {!symmetric && (
              <p className="note warn" style={{ marginTop: 14, marginBottom: 0 }}>
                Asymmetric relation. {persp} is {target}&rsquo;s {REL_NAME[code]}; in the other
                direction {target} is {persp}&rsquo;s {REL_NAME[RECIPROCAL[code]]}. A single
                compatibility number would hide that.
              </p>
            )}
          </Panel>

          <Panel title="Where the perspective's instruments land">
            {landing.map(({ fn, slot }) => (
              <Row key={fn}
                k={fn === pHero ? "Their Hero" : "Their Parent"}
                v={<span>
                    <b className="mono" style={{ color: FN_COLOR[fn] }}>{fn}</b>
                    {" → "}
                    <span className="mono">{slot}</span>
                    <span className="small"> of {target}</span>
                  </span>} />
            ))}
            <Row k="Relation code" v={<span className="mono">{code}</span>} />
            <Row k="Reciprocal" v={<span className="mono">{RECIPROCAL[code]}</span>} />
            <Row k="Quadras" v={
              <span style={{ display: "inline-flex", gap: 6 }}>
                <span className="chip">
                  <i className="dot" style={{ background: QUADRA_COLOR[quadra(target)] }} />
                  {quadra(target)}
                </span>
                <span className="chip">
                  <i className="dot" style={{ background: QUADRA_COLOR[quadra(persp)] }} />
                  {quadra(persp)}
                </span>
              </span>} />
          </Panel>
        </div>
      </div>

      <Panel title="Aspect by aspect" style={{ marginTop: 14 }}>
        <p className="small" style={{ marginTop: 0, marginBottom: 6 }}>
          Every comparable dimension, and what this specific combination does. Click any term
          for its full definition.
        </p>
        {compareAspects(target, persp).map((r) => (
          <div key={r.aspect} className="aspect">
            <div className="aspect-head">
              <span className="lbl">
                {r.aspect}
                {r.determining === true && <b style={{ color: "#c9a0ff" }}> ·det</b>}
              </span>
              <span>
                <Term id={r.aId}>{r.aLabel}</Term>
                <span style={{ color: "var(--dim)" }}>{"  →  "}</span>
                <Term id={r.bId}>{r.bLabel}</Term>
              </span>
              {r.pairing && (
                <b style={{ color: "#c9a0ff", fontFamily: "var(--mono)", fontSize: 11 }}>
                  {r.pairing.headline}
                </b>
              )}
            </div>
            {r.pairing && <div className="aspect-body">{r.pairing.body}</div>}
          </div>
        ))}
      </Panel>

      <Panel title={`How ${target} sits with all sixteen`} style={{ marginTop: 14 }}>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(158px,1fr))", gap: 8 }}>
          {TYPES.map((x) => {
            const v = ease(target, x);
            return (
              <a key={x} href={`/pair/${target}/${x}`}
                 style={{ display: "block", padding: "7px 9px", border: "1px solid var(--rule)",
                          borderRadius: 2, background: x === persp ? "#141b25" : "transparent" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span className="mono">{x}</span>
                  <span className="mono" style={{ color: easeColor(v) }}>{v}</span>
                </div>
                <div className="small" style={{ fontSize: 10.5, marginBottom: 5 }}>
                  {REL_NAME[REL[target][x]]}
                </div>
                <EaseBar value={v} />
              </a>
            );
          })}
        </div>
      </Panel>
    </>
  );
}
