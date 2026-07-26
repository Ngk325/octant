import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TYPES, REL, ease, stack, quadra, type MbtiType } from "../engine/core";
import { REL_NAME, REL_DEF, RECIPROCAL, DOM_AUX, SLOT_NAMES } from "../engine/data";
import { REL_PLAIN, CONCEPT_PLAIN, SLOT_PLAIN } from "../engine/plain";
import { playbook } from "../engine/playbook";
import { compareAspects } from "../engine/lexicon";
import { usePalette } from "../components/Theme";
import { usePublishContext } from "../chat/ChatContext";
import Term from "../components/Term";
import TypePicker from "../components/TypePicker";
import Explain from "../components/Explain";
import { Panel, Row, Score, EaseBar } from "../components/Bits";

export default function PairReader() {
  const { a, b } = useParams();
  const nav = useNavigate();
  const p = usePalette();
  const [allAspects, setAllAspects] = useState(false);

  const target = (TYPES.includes(a as MbtiType) ? a : "ENTP") as MbtiType;
  const persp = (TYPES.includes(b as MbtiType) ? b : "INFJ") as MbtiType;

  usePublishContext(() => ({ kind: "pair", a: target, b: persp }), [target, persp]);

  const code = REL[target][persp];
  const easeTarget = ease(target, persp);
  const easePersp = ease(persp, target);
  const symmetric = RECIPROCAL[code] === code;

  const tStack = stack(target);
  const [pHero, pParent] = DOM_AUX[persp];
  const landing = [pHero, pParent].map((fn) => ({ fn, slot: SLOT_NAMES[tStack.indexOf(fn)] }));

  const aspects = compareAspects(target, persp).filter((r) => r.pairing);
  const shown = allAspects ? aspects : aspects.slice(0, 6);

  return (
    <>
      <div className="cluster" style={{ gap: "var(--s5)", marginTop: "var(--s5)", alignItems: "flex-end" }}>
        <TypePicker label="Being read" value={target} onChange={(x) => nav(`/pair/${x}/${persp}`)} />
        <TypePicker label="Doing the reading" value={persp} onChange={(x) => nav(`/pair/${target}/${x}`)} />
        <button className="btn ghost" onClick={() => nav(`/pair/${persp}/${target}`)}>Swap ⇄</button>
      </div>

      <h1>{REL_NAME[code]}</h1>
      <p className="lede">{REL_PLAIN[code]}</p>

      <Explain plain={`${persp} is ${target}'s ${REL_NAME[code]}.`}>
        <p>{REL_DEF[code]}</p>
      </Explain>

      <div className="grid g-side" style={{ marginTop: "var(--s6)", alignItems: "start" }}>
        <Panel title={`How ${persp} should handle ${target}`}>
          <p style={{ fontSize: "var(--t-lg)", lineHeight: 1.55 }}>{playbook(persp, target)}</p>
        </Panel>

        <div className="stack-v">
          <Panel title="How easy is it — both ways">
            <p className="small">{CONCEPT_PLAIN.directional}</p>
            <div className="stat" style={{ margin: "var(--s4) 0" }}>
              <Score value={easeTarget} caption={`${target} being around ${persp}`} />
              <Score value={easePersp} caption={`${persp} being around ${target}`} />
            </div>
            <EaseBar value={easeTarget} />
            <div style={{ height: 8 }} />
            <EaseBar value={easePersp} />

            {!symmetric && (
              <p className="note warn" style={{ marginTop: "var(--s4)", marginBottom: 0 }}>
                <b>This one runs differently in each direction.</b> {persp} is {target}&rsquo;s{" "}
                {REL_NAME[code]}, while {target} is {persp}&rsquo;s {REL_NAME[RECIPROCAL[code]]}.
                Whoever is on the heavier side usually cannot tell it is happening.
              </p>
            )}
          </Panel>

          <Panel title={`Where ${persp}'s strengths land in ${target}`}>
            {landing.map(({ fn, slot }) => (
              <Row
                key={fn}
                stacked
                k={<span>{fn === pHero ? "Their strongest" : "Their second"} — <b className="mono" style={{ color: p.fn(fn) }}>{fn}</b> lands on {target}&rsquo;s <b>{slot}</b></span>}
                v={<span className="small">{SLOT_PLAIN[slot]}</span>}
              />
            ))}
            <Row
              k="Quadras"
              v={
                <span className="cluster" style={{ justifyContent: "flex-end" }}>
                  <span className="chip"><i className="dot" style={{ background: p.quadra(quadra(target)) }} />{quadra(target)}</span>
                  <span className="chip"><i className="dot" style={{ background: p.quadra(quadra(persp)) }} />{quadra(persp)}</span>
                </span>
              }
            />
            <Row k="Relation code" v={<span className="mono">{code} · reciprocal {RECIPROCAL[code]}</span>} />
          </Panel>
        </div>
      </div>

      <h2>Aspect by aspect</h2>
      <p className="prose">
        Every dimension the two share, and what this specific combination does with it. Order
        matters — reading someone is not the same as being read by them.
      </p>

      <Panel>
        {shown.map((r) => (
          <div key={r.aspect} className="aspect">
            <div className="aspect-head">
              <span className="lbl">
                {r.aspect}
                {r.determining === true && <b style={{ color: "var(--accent-ink)" }}> · decides the type</b>}
              </span>
              <span>
                <Term id={r.aId}>{r.aLabel}</Term>
                <span className="muted">{"  →  "}</span>
                <Term id={r.bId}>{r.bLabel}</Term>
              </span>
              <span className="headline">{r.pairing!.headline}</span>
            </div>
            <div className="aspect-body">{r.pairing!.body}</div>
          </div>
        ))}
        {aspects.length > 6 && (
          <button className="btn ghost" style={{ marginTop: "var(--s4)" }} onClick={() => setAllAspects((v) => !v)}>
            {allAspects ? "Show fewer" : `Show all ${aspects.length} aspects`}
          </button>
        )}
      </Panel>

      <h2>How {target} sits with all sixteen</h2>
      <div className="grid g-auto">
        {TYPES.map((x) => {
          const v = ease(target, x);
          return (
            <Link
              key={x}
              to={`/pair/${target}/${x}`}
              style={{
                display: "block",
                padding: "var(--s3)",
                border: "1px solid var(--rule)",
                borderRadius: "var(--radius)",
                background: x === persp ? "var(--accent-soft)" : "var(--surface)",
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="mono">{x}</span>
                <span className="mono" style={{ color: p.ease(v) }}>{v}</span>
              </div>
              <div className="small muted" style={{ margin: "2px 0 6px" }}>{REL_NAME[REL[target][x]]}</div>
              <EaseBar value={v} />
            </Link>
          );
        })}
      </div>
    </>
  );
}
