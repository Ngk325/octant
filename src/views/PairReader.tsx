import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TYPES, REL, ease, stack, quadra, type MbtiType } from "../engine/core";
import { REL_NAME, REL_DEF, RECIPROCAL, DOM_AUX, SLOT_NAMES } from "../engine/data";
import { REL_PLAIN, CONCEPT_PLAIN, SLOT_PLAIN } from "../engine/plain";
import { playbook } from "../engine/playbook";
import { compareAspects } from "../engine/lexicon";
import { correlation, divergence, EMPIRICAL_SOURCE } from "../engine/empirical";
import { usePalette } from "../components/Theme";
import { usePublishContext } from "../chat/ChatContext";
import Term from "../components/Term";
import TypePicker from "../components/TypePicker";
import Explain from "../components/Explain";
import { FnTag, Panel, Row, Score, EaseBar, Tile } from "../components/Bits";

/**
 * Two types: the relation, both directional ease scores, the composed playbook, and
 * the empirical counterweight.
 */
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
                k={<span>{fn === pHero ? "Their strongest" : "Their second"} — <FnTag fn={fn} /> lands on {target}&rsquo;s <b>{slot}</b></span>}
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

      <h2>What people actually report</h2>

      <Explain
        big
        plain="Everything above is derived from how the two wirings mesh. This is what a survey of real people said about the same pairing — and the two do not always agree."
      >
        <p>
          Compatibility percentages from {EMPIRICAL_SOURCE.name}, a {EMPIRICAL_SOURCE.what},
          used under{" "}
          <a href={EMPIRICAL_SOURCE.licenceUrl} target="_blank" rel="noreferrer noopener">
            {EMPIRICAL_SOURCE.licence}
          </a>
          . Across all 256 pairs the two measures correlate
          at <b>r = {correlation(TYPES).toFixed(2)}</b> — very slightly <i>negatively</i>. That
          is a number this page computes from both datasets at render, not a claim it repeats.
          It is not a defect in either.
          They answer different questions: the survey measures who people say they get on with,
          and this app measures how the wiring meshes. People report liking people like
          themselves, so Identity pairs top the survey while the model rates them mid-table; and
          Duality pairs, which the model rates highest, sit near the bottom of the survey.
        </p>
        <p className="small muted" style={{ marginBottom: 0 }}>
          Changes: {EMPIRICAL_SOURCE.changes}
        </p>
      </Explain>

      <Panel>
        {(() => {
          const d = divergence(target, persp);
          return (
            <>
              <div className="stat" style={{ marginBottom: "var(--s4)" }}>
                <div>
                  <b style={{ color: p.ease(d.derived) }}>{d.derived}</b>
                  <div className="small">Derived — structural ease for {target}</div>
                </div>
                <div>
                  <b style={{ color: p.ease(d.survey) }}>{d.survey}%</b>
                  <div className="small">Reported — {EMPIRICAL_SOURCE.name} survey</div>
                </div>
                <div>
                  <b>{d.delta > 0 ? "+" : ""}{d.delta}</b>
                  <div className="small">
                    Gap · {d.size === "agree" ? "they agree" : d.size === "opposite" ? "near-opposite readings" : `${d.size} disagreement`}
                  </div>
                </div>
              </div>
              <p style={{ marginBottom: 0 }}>{d.reading}</p>
            </>
          );
        })()}
      </Panel>

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
            <Tile key={x} to={`/pair/${target}/${x}`} selected={x === persp} style={{ padding: "var(--s3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="mono">{x}</span>
                <span className="mono" style={{ color: p.ease(v) }}>{v}</span>
              </div>
              <div className="small muted" style={{ margin: "2px 0 6px" }}>{REL_NAME[REL[target][x]]}</div>
              <EaseBar value={v} />
            </Tile>
          );
        })}
      </div>
    </>
  );
}
