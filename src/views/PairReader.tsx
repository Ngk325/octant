import { useNavigate, useParams } from "react-router";
import { TYPES, REL, ease, stack, quadra, type MbtiType } from "../engine/core";
import { REL_NAME, REL_DEF, RECIPROCAL, DOM_AUX, SLOT_NAMES } from "../engine/data";
import { REL_PLAIN, CONCEPT_PLAIN, slotAbout } from "../engine/plain";
import { playbook } from "../engine/playbook";
import { compareAspects } from "../engine/lexicon";
import { correlation, divergence, EMPIRICAL_SOURCE } from "../engine/empirical";
import { usePalette } from "../components/Theme";
import { usePublishContext } from "../chat/ChatContext";
import Term from "../components/Term";
import TypePicker from "../components/TypePicker";
import Explain from "../components/Explain";
import { FnTag, Panel, Row, EaseBar, Tile } from "../components/Bits";
import Figure from "../components/Figure";
import DivergingEase from "../components/DivergingEase";
import RelationLanding from "../components/RelationLanding";

/**
 * Two types: the relation, both directional ease scores, the composed playbook, and
 * the empirical counterweight.
 */
export default function PairReader() {
  const { a, b } = useParams();
  const nav = useNavigate();
  const p = usePalette();

  const target = (TYPES.includes(a as MbtiType) ? a : "ENTP") as MbtiType;
  const persp = (TYPES.includes(b as MbtiType) ? b : "INFJ") as MbtiType;

  usePublishContext(() => ({ kind: "pair", a: target, b: persp }), [target, persp]);

  const code = REL[target][persp];
  const easeTarget = ease(target, persp);
  const easePersp = ease(persp, target);
  const symmetric = RECIPROCAL[code] === code;
  /* For the asymmetry note: naming who actually has the harder time beats
     restating the two relation names and leaving the reader to work it out. */
  const easier = easePersp >= easeTarget ? persp : target;
  const harder = easier === persp ? target : persp;

  const tStack = stack(target);
  const [pHero, pParent] = DOM_AUX[persp];
  const landing = [pHero, pParent].map((fn) => ({ fn, slot: SLOT_NAMES[tStack.indexOf(fn)] }));

  /* Sixteen aspects, two families. The first build rendered them as one
     undifferentiated wall with the top ten hidden behind a ghost button. */
  const aspects = compareAspects(target, persp).filter((r) => r.pairing);
  const taxonomy = aspects.filter((r) => !r.aspect.startsWith("Coin"));
  const coinRows = aspects.filter((r) => r.aspect.startsWith("Coin"));
  const decidingCoins = coinRows.filter((r) => r.determining).length;

  return (
    <>
      {/* Sticky, because the whole page is written from one side and the reader
          loses track of which side that is the moment this scrolls away. The
          labels are the sentence in the h1, not "being read"/"doing the
          reading" — which described the mechanism rather than the person. */}
      <div className="persp-bar">
        <TypePicker label="You are" value={persp} onChange={(x) => nav(`/pair/${target}/${x}`)} />
        <span className="persp-verb" aria-hidden="true">reading about</span>
        <TypePicker label="Them" value={target} onChange={(x) => nav(`/pair/${x}/${persp}`)} />
        <button type="button" className="btn ghost" onClick={() => nav(`/pair/${persp}/${target}`)}>Swap ⇄</button>
      </div>

      <h1>How {persp} should handle {target}</h1>
      <p className="lede">{REL_PLAIN[code]}</p>

      {/* The advice was the last panel on the page, in the narrow column, under
          the ease bars and the landing table. It is the thing the reader came
          for, so it now runs directly under the title. */}
      <Panel title="The short version">
        <p style={{ fontSize: "var(--t-lg)", lineHeight: 1.55, margin: 0 }}>{playbook(persp, target)}</p>
      </Panel>

      <Explain
        plain={`In this model the relationship has a name: ${persp} is ${target}'s ${REL_NAME[code]}. ${
          symmetric
            ? "It works the same way in both directions."
            : `Read the other way round it is different — ${target} is ${persp}'s ${REL_NAME[RECIPROCAL[code]]}.`
        }`}
      >
        <p>{REL_DEF[code]}</p>
      </Explain>

      {/* The mechanism first: this picture IS the relation. Everything below
          — both scores, the playbook, the aspect list — is downstream of
          where these two arrows land. */}
      <Figure
        minWidth={480}
        label="Why this pairing behaves the way it does."
        caption={
          <>
            Everything {persp} does best arrives somewhere specific in {target}, and where it
            lands is the whole relationship. {persp}&rsquo;s <FnTag fn={pHero} /> arrives at{" "}
            {target}&rsquo;s <b>{landing[0].slot}</b>; {persp}&rsquo;s <FnTag fn={pParent} /> at{" "}
            {target}&rsquo;s <b>{landing[1].slot}</b>. Land on the sore spot and you are a
            relief; land on the blind spot and neither of you can work out what just happened.
          </>
        }
      >
        <RelationLanding a={target} b={persp} />
      </Figure>

      {/* The data-dense panel takes the wide column; the one-paragraph
          playbook takes the narrow one. The first build had it backwards —
          a short quote floating in 1.35fr beside a packed sidebar. */}
      <div style={{ marginTop: "var(--s5)" }}>
        <Panel title="How easy is it — both ways">
          <p className="small">{CONCEPT_PLAIN.directional}</p>
          <div style={{ margin: "var(--s4) 0" }}>
            <DivergingEase
              toward={easeTarget}
              from={easePersp}
              labels={[`${target} being around ${persp}`, `${persp} being around ${target}`]}
            />
          </div>

          {!symmetric && (
            <p className="note warn" style={{ marginBottom: 0 }}>
              <b>This one is not the same from both sides.</b> {harder} has to work harder at it
              than {easier} does, and the person having the easier time almost never notices.
              If you are {persp}, that is worth knowing before you assume the effort is shared.
            </p>
          )}

          {/* Every name is spelled out. This row used to say "Their strongest"
              in the key and "Your worry" in the value — about the same function,
              meaning two different people, with nothing on screen to say which. */}
          {landing.map(({ fn, slot }) => (
            <Row
              key={fn}
              stacked
              k={
                <span>
                  {persp}&rsquo;s {fn === pHero ? "strongest" : "second"} — <FnTag fn={fn} /> —
                  arrives at {target}&rsquo;s <b>{slot}</b>
                </span>
              }
              v={<span className="small">{slotAbout(slot, target)}</span>}
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
          themselves, so Twin pairs top the survey while the model rates them mid-table; and
          Counterpart pairs, which the model rates highest, sit near the bottom of the survey.
        </p>
        <p className="small muted" style={{ marginBottom: 0 }}>
          Changes: {EMPIRICAL_SOURCE.changes}
        </p>
      </Explain>

      <Panel title="Derived vs. reported">
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
        Every dimension {persp} and {target} both sit on, and what this particular combination
        does with it. Each row reads <b>{target}&rsquo;s side → {persp}&rsquo;s side</b>, in that
        order. The first group is the taxonomy they share; the second is the coins the types are
        built from.
      </p>

      <Panel title="The taxonomy they share">
        {taxonomy.map((r) => <AspectLine key={r.aspect} r={r} />)}
      </Panel>

      <Panel style={{ marginTop: "var(--s4)" }}>
        <details>
          <summary
            className="card-title"
            style={{ cursor: "pointer", marginBottom: 0 }}
          >
            The coins underneath — {coinRows.length} aspects
            {decidingCoins > 0 && `, ${decidingCoins} of which decide the type`}
          </summary>
          <div style={{ marginTop: "var(--s3)" }}>
            {coinRows.map((r) => <AspectLine key={r.aspect} r={r} />)}
          </div>
        </details>
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

/** One aspect row: label, the two terms, the pairing's headline and body. */
function AspectLine({ r }: { r: ReturnType<typeof compareAspects>[number] }) {
  return (
    <div className="aspect">
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
  );
}
