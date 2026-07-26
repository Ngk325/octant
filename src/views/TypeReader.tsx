import { useNavigate, useParams } from "react-router-dom";
import {
  TYPES, quadra, stack, ops, gate, coins, fourSides, complements, catalysts, frictions,
  type MbtiType,
} from "../engine/core";
import {
  ARCHETYPE, GROUP, SOCIONICS, INTERACTION_STYLE, ROMANCE, VIRTUE_VICE,
  BEHAVIOURAL, COIN_LABELS, DETERMINING, FN_LONG, FN_SHADOW, SLOT_NAMES,
} from "../engine/data";
import { FN_COLOR, QUADRA_COLOR } from "../engine/palette";
import WiringSchematic from "../components/WiringSchematic";
import TypePicker from "../components/TypePicker";
import { Panel, Row } from "../components/Bits";
import Term from "../components/Term";

export default function TypeReader() {
  const { type } = useParams();
  const nav = useNavigate();
  const t = (TYPES.includes(type as MbtiType) ? type : "ENTP") as MbtiType;

  const st = stack(t), o = ops(t), g = gate(t), c = coins(t);
  const [, sub, unc, sup] = fourSides(t);
  const [virtue, vice] = VIRTUE_VICE[t];
  const b = BEHAVIOURAL[t];

  return (
    <>
      <div style={{ display: "flex", gap: 18, alignItems: "flex-end", flexWrap: "wrap", marginTop: 26 }}>
        <TypePicker label="Read" value={t} onChange={(x) => nav(`/type/${x}`)} />
        <span className="chip">
          <i className="dot" style={{ background: QUADRA_COLOR[quadra(t)] }} />
          <Term>{quadra(t)}</Term> quadra
        </span>
        <span className="chip">{SOCIONICS[t]}</span>
        <span className="chip">{o.primary}-primary</span>
      </div>

      <h1>{t}</h1>
      <p className="lede">{ARCHETYPE[t]} · <Term>{GROUP[t]}</Term> · <Term>{INTERACTION_STYLE[t].split(" (")[0]}</Term></p>

      <div className="grid g-side" style={{ marginTop: 22, alignItems: "start" }}>
        <Panel title="The wiring">
          <WiringSchematic type={t} />
          <p className="small" style={{ marginTop: 14 }}>
            The dashed break is where the two instruments disagree. CS&nbsp;Joseph puts the fault at the
            Inferior ({st[3]}); OPS puts it on the {o.demon} loop ({o.demonObs}&nbsp;+&nbsp;{o.demonDec}),
            which sits in the shadow block. Neither reading is corrected into the other.
          </p>
        </Panel>

        <div className="grid" style={{ gap: 14 }}>
          <Panel title="Growth gate">
            <h2><Term>{g.gate}</Term></h2>
            <Row k="Fear" v={g.fear} />
            <Row k="The cave" v={g.cave} />
            <Row k="The treasure" v={g.treasure} />
            <p className="note" style={{ marginTop: 12, marginBottom: 0 }}>
              CSJ says: {csjVector(st[3])} OPS says: {opsVector(o.demon)}
            </p>
          </Panel>

          <Panel title="OPS signature — energy overlay, not the stack">
            <Row k="Saviors" v={<span className="mono">{o.saviorObs} · {o.saviorDec}</span>} />
            <Row k="Demons" v={<span className="mono">{o.demonObs} · {o.demonDec}</span>} />
            <Row k="Primary animal" v={<Term>{o.primary}</Term>} />
            <Row k="Demon animal" v={<Term>{o.demon}</Term>} />
            <Row k="Middles" v={<span className="small">{o.middles.join(" / ")} — order deferred</span>} />
            <Row k="Animal stack" v={<span className="mono">{o.stack}</span>} />
          </Panel>

          <Panel title="Four sides of the mind">
            <Row k="Ego" v={<span className="mono">{t}</span>} />
            <Row k="Subconscious" v={<span className="mono">{sub}</span>} />
            <Row k="Unconscious" v={<span className="mono">{unc}</span>} />
            <Row k="Superego" v={<span className="mono">{sup}</span>} />
          </Panel>
        </div>
      </div>

      <div className="grid g3" style={{ marginTop: 14 }}>
        <Panel title="Structural fit">
          <Row k={<Term id="complement">Complements</Term>}
               v={<Links list={complements(t)} />} />
          <Row k={<Term id="catalyst">Catalysts</Term>}
               v={<Links list={catalysts(t)} />} />
          <Row k="Frictions" v={<Links list={frictions(t)} />} />
          <p className="small" style={{ marginTop: 10 }}>
            Complements (Dual + Activity) supply your Inferior {st[3]} — restful. Catalysts lead
            with your Nemesis {st[4]} — stimulating, and something you argue with. Frictions are
            Conflict + Super-Ego. All three derived, none curated.
          </p>
        </Panel>

        <Panel title="Behavioural profile">
          <Row k="Motivation" v={b.motivation} />
          <Row k="Decides by" v={b.decisionStyle} />
          <Row k="Speaks" v={b.commsStyle} />
          <Row k="Under stress" v={b.stressResponse} />
          <Row k="Deal breaker" v={b.dealBreaker} />
          <Row k="Flaw" v={b.commsFlaw} />
        </Panel>

        <Panel title="Coin signature">
          {c.map((v, i) => (
            <Row key={i}
              k={COIN_LABELS[i].split(" vs ")[0].slice(0, 12)}
              v={<span className="mono" style={{
                color: (DETERMINING as readonly number[]).includes(i) ? "#c9a0ff" : "#6f7987",
              }}>{v}</span>} />
          ))}
          <p className="small" style={{ marginTop: 10 }}>
            Violet coins determine the type. The rest are derivable checks.
          </p>
        </Panel>
      </div>

      <Panel title="The eight slots" style={{ marginTop: 14 }}>
        <div className="grid g2">
          {st.map((fn, i) => (
            <div key={fn} className="row" style={{ alignItems: "flex-start" }}>
              <dt style={{ color: FN_COLOR[fn], minWidth: 74 }}>
                <Term>{SLOT_NAMES[i]}</Term> <Term>{fn}</Term>
              </dt>
              <dd style={{ textAlign: "left", fontSize: 12.5, color: "#aab3c0" }}>
                {i < 4 ? FN_LONG[fn] : FN_SHADOW[fn]}
              </dd>
            </div>
          ))}
        </div>
      </Panel>

      <p className="small" style={{ marginTop: 20 }}>
        Virtue to appeal to: <b style={{ color: "#e7eaef" }}>{virtue}</b> · vice to avoid triggering:{" "}
        <b style={{ color: "#e7eaef" }}>{vice}</b> · romance style: <Term>{ROMANCE[t]}</Term>.
      </p>
    </>
  );
}

function Links({ list }: { list: MbtiType[] }) {
  return (
    <span style={{ display: "inline-flex", gap: 6 }}>
      {list.map((x) => (
        <a key={x} href={`/type/${x}`} className="chip">{x}</a>
      ))}
    </span>
  );
}

const csjVector = (inf: string) =>
  ({ Si: "honour continuity; let structures stand long enough to compound.",
     Ni: "commit to one path and let it run.",
     Se: "meet the present as it is, not as the model predicts.",
     Ne: "let one unproven possibility stand without demanding precedent.",
     Te: "build the structure that lets the values scale.",
     Ti: "test whether it is true, not only whether it moves.",
     Fe: "let the work land with people before it counts.",
     Fi: "locate the value the whole thing is supposedly for." } as Record<string, string>)[inf];

const opsVector = (demon: string) =>
  demon === "Blast"
    ? "converge on a single line and drive it out instead of proliferating options."
    : "loosen the line; let something play without vetting it first.";
