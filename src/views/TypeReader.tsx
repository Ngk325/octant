import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { quadra, stack, gate, complements, catalysts, frictions } from "../engine/core";
import {
  ops, coins, SAVIOR_STATE, DEMON_STATE, SAVIOR_MARKERS, DEMON_MARKERS,
  type Subtype, type Animal,
} from "../engine/ops";
import {
  FN_ROLE, FN_KEYWORD, FN_KEYWORD_GLOSS, FN_SAYS, FN_WANTS,
  FN_SATISFACTION, FN_STARVATION, FN_PRACTICE,
} from "../engine/functions";
import { sides, SIDE_ORDER } from "../engine/sides";
import {
  wheelOf, templeOf, themeFor, poleFor, UNSETTLED,
  type Development, type Focus,
} from "../engine/octagram";
import {
  TYPES, ARCHETYPE, GROUP, SOCIONICS, INTERACTION_STYLE, ROMANCE, VIRTUE_VICE,
  BEHAVIOURAL, COIN_LABELS, DETERMINING, FN_LONG, FN_SHADOW, SLOT_NAMES,
  type MbtiType,
} from "../engine/data";
import { FN_PLAIN, SLOT_PLAIN, GATE_PLAIN, COIN_PLAIN, CONCEPT_PLAIN, typePlain } from "../engine/plain";
import { usePalette } from "../components/Theme";
import { usePublishContext } from "../chat/ChatContext";
import WiringSchematic from "../components/WiringSchematic";
import FourSidesDiagram from "../components/FourSidesDiagram";
import AnimalStack from "../components/AnimalStack";
import OctagramWheel from "../components/OctagramWheel";
import ThemeSeasons from "../components/ThemeSeasons";
import TypePicker from "../components/TypePicker";
import Explain from "../components/Explain";
import Figure from "../components/Figure";
import { Panel, Row } from "../components/Bits";
import Term from "../components/Term";

const SECTIONS = [
  ["slots", "The eight slots"],
  ["sides", "Four sides of the mind"],
  ["ops", "The OPS overlay"],
  ["growth", "Growth"],
  ["octagram", "The Octagram"],
  ["fit", "Who you fit"],
] as const;

/** One type, read in full: slots, four sides, OPS, growth, the Octagram, and fit. */
export default function TypeReader() {
  const { type } = useParams();
  const nav = useNavigate();
  const p = usePalette();
  const t = (TYPES.includes(type as MbtiType) ? type : "ENTP") as MbtiType;

  /* The subtype coins are self-reported facts about ONE person, so they must
     not survive a switch to a different type — otherwise reading ENTP with
     "sensory: masculine" set and then clicking through to INFJ silently
     attributes your answer to a type you never answered for. React keeps this
     component mounted across /type/X → /type/Y, so the reset is explicit. */
  const [sub, setSub] = useState<Subtype>({});
  /* The Octagram coins are kept SEPARATE from the OPS ones rather than bolted
     onto Subtype. The two systems are not reconciled anywhere else in this app
     and merging their self-report into one object would quietly imply they are. */
  const [oct, setOct] = useState<{ development?: Development; focus?: Focus }>({});
  const [subFor, setSubFor] = useState<MbtiType>(t);
  if (subFor !== t) {
    setSubFor(t);
    setSub({});
    setOct({});
  }

  const st = stack(t);
  const o = ops(t, sub);
  const wheel = wheelOf(t);
  const temple = templeOf(t);
  const g = gate(t);
  const s = sides(t);
  const c = coins(t);
  const [virtue, vice] = VIRTUE_VICE[t];
  const b = BEHAVIOURAL[t];

  usePublishContext(() => ({ kind: "type", type: t }), [t]);

  return (
    <>
      <div className="cluster" style={{ gap: "var(--s4)", marginTop: "var(--s5)" }}>
        <TypePicker label="Read" value={t} onChange={(x) => nav(`/type/${x}`)} />
        <span className="chip">
          <i className="dot" style={{ background: p.quadra(quadra(t)) }} />
          <Term>{quadra(t)}</Term> quadra
        </span>
        <span className="chip mono">{SOCIONICS[t]}</span>
      </div>

      <h1>{t}</h1>
      <p className="lede">{typePlain(t, st[0], st[1], st[3])}</p>

      <p className="small muted">
        {ARCHETYPE[t]} · <Term>{GROUP[t]}</Term> ·{" "}
        <Term>{INTERACTION_STYLE[t].split(" (")[0]}</Term> · <Term>{ROMANCE[t]}</Term> romance style
      </p>

      <nav className="cluster" style={{ margin: "var(--s5) 0 var(--s6)" }}>
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="chip">{label}</a>
        ))}
      </nav>

      {/* ------------------------------------------------ slots */}
      <h2 id="slots" style={{ scrollMarginTop: 88 }}>The eight slots</h2>

      <Explain
        plain={`Eight habits of mind, in ${t}'s order of strength. The top four feel like "me". The bottom four run anyway, and feel like things that happen to you.`}
      >
        <p>
          The full Beebe stack, generated from the (dominant, auxiliary) pair by the three
          involutions. Slots 1–4 are the ego block; 5–8 are the shadow.
        </p>
      </Explain>

      <Figure
        minWidth={660}
        label="Strongest at the top."
        caption={
          <>
            Two regions are marked. CS Joseph puts the growth point at the <b>Inferior</b> alone.
            OPS marks a wider pair — the tertiary <i>and</i> the inferior — as its demons. They
            agree on slot 4 and disagree about slot 3, which CS Joseph treats as a delight and OPS
            treats as neglected. Neither reading is corrected into the other.
          </>
        }
      >
        <WiringSchematic type={t} />
      </Figure>

      <div className="grid g2">
        {st.map((fn, i) => (
          <Panel key={fn} title={`${i + 1}. ${SLOT_NAMES[i]}`}>
            <div className="cluster" style={{ marginBottom: "var(--s2)" }}>
              <b className="mono" style={{ color: p.fn(fn), fontSize: "var(--t-lg)" }}>{fn}</b>
              <Term>{SLOT_NAMES[i]}</Term>
              <span className="chip">{FN_ROLE[fn]}</span>
              <span className="chip" title={FN_KEYWORD_GLOSS[fn]}>{FN_KEYWORD[fn]}</span>
            </div>
            <Explain plain={SLOT_PLAIN[SLOT_NAMES[i]]}>
              <p style={{ marginBottom: "var(--s2)" }}>
                <b>{fn}:</b> {i < 4 ? FN_LONG[fn] : FN_SHADOW[fn]}
              </p>
              <p className="small" style={{ margin: 0 }}>{FN_PLAIN[fn]}</p>
            </Explain>
            <p className="small muted" style={{ margin: "var(--s2) 0 0" }}>
              Sounds like: &ldquo;{FN_SAYS[fn][0]}&rdquo; &middot; &ldquo;{FN_SAYS[fn][1]}&rdquo;
            </p>
          </Panel>
        ))}
      </div>

      {/* ------------------------------------------------ four sides */}
      <h2 id="sides" style={{ scrollMarginTop: 88 }}>Four sides of the mind</h2>

      <Explain
        big
        plain="You are not one type — you are four. Split those eight slots into groups of four and each group is itself one of the sixteen. You move between them all day."
      >
        <p>
          CS Joseph&rsquo;s four sides, derived from the same three involutions that generate the
          relation table. Which is why each side stands in a fixed relation to the ego: the
          subconscious is your <Term id="rel-du">Dual</Term>, the unconscious your{" "}
          <Term id="rel-ex">Extinguishment</Term> partner, and the superego your{" "}
          <Term id="rel-se">Super-Ego</Term> partner. The Socionics relation and the Jungian
          structure land on the same type because they are the same operator.
        </p>
      </Explain>

      <Figure
        label="The same eight functions, sorted four ways."
        caption={
          <>
            Your <b>Inferior</b> is the subconscious&rsquo;s Hero and your <b>Demon</b> is the
            superego&rsquo;s Hero. What you are worst at is what another side of you leads with —
            which is why those sides feel like meeting someone else.
          </>
        }
      >
        <FourSidesDiagram type={t} />
      </Figure>

      {SIDE_ORDER.map((k) => {
        const side = s[k];
        return (
          <Panel
            key={k}
            title={`${side.name} — ${side.type}`}
            style={{ marginBottom: "var(--s4)" }}
          >
            <Explain plain={side.plain}>
              <p>{side.what}</p>
            </Explain>

            <Row k="Way in" v={<span><b className="mono" style={{ color: p.fn(side.gateway.fn) }}>{side.gateway.fn}</b>{k !== "ego" && <span className="small"> — your {side.gateway.egoSlot}</span>}</span>} />
            <Row k="What holds it shut" v={<span className="small">{side.blockedBy}</span>} stacked />
            <Row k="What opens it" v={<span className="small">{side.opensWith}</span>} stacked />
            <Row k="Deliberately" v={<span className="small">{side.atWill}</span>} stacked />
            <Row k="If you never do" v={<span className="small">{side.forced}</span>} stacked />
            <Row k="What it pays out" v={<span className="small">{side.produces}</span>} stacked />

            <div className="grid g2" style={{ marginTop: "var(--s4)" }}>
              <div className="note">
                <b style={{ fontFamily: "var(--sans)", fontSize: "var(--t-sm)" }}>Developed</b>
                <br />
                <span className="small">{side.developed}</span>
              </div>
              <div className="note warn">
                <b style={{ fontFamily: "var(--sans)", fontSize: "var(--t-sm)" }}>Undeveloped</b>
                <br />
                <span className="small">{side.undeveloped}</span>
              </div>
            </div>
          </Panel>
        );
      })}

      <p className="note warn">
        You cannot stay outside the ego for long. Running another side costs energy, and when the
        mind tires it drops you back into the ego whether or not you were finished. Prolonged
        stress, exhaustion or substances are what keep someone parked somewhere else.
      </p>

      {/* ------------------------------------------------ ops */}
      <h2 id="ops" style={{ scrollMarginTop: 88 }}>The OPS overlay</h2>

      <Explain
        big
        plain="A second instrument reads the same top four functions and asks a different question: which two do you trust completely, and which two make you nervous?"
      >
        <p>
          Objective Personality splits the ego block into two saviors and two demons. The demons
          are the Model A opposites of the saviors, which puts them at the tertiary and inferior —
          OPS does not reach into the shadow block at all.
        </p>
      </Explain>

      <div className="grid g2">
        <Panel title={`Saviors — ${o.saviorObs} + ${o.saviorDec}`}>
          <p style={{ fontSize: "var(--t-base)" }}>{CONCEPT_PLAIN.savior}</p>
          <p className="small muted" style={{ margin: 0 }}>{SAVIOR_STATE}</p>
        </Panel>
        <Panel title={`Demons — ${o.demonObs} + ${o.demonDec}`}>
          <p style={{ fontSize: "var(--t-base)" }}>{CONCEPT_PLAIN.demon}</p>
          <p className="small muted" style={{ margin: 0 }}>{DEMON_STATE}</p>
        </Panel>
      </div>

      <Panel title="How to tell which is which, in yourself" style={{ marginTop: "var(--s4)" }}>
        <p className="small">
          Easier than the descriptions above: listen for what you say about an area of your life.
        </p>
        <div className="grid g2" style={{ marginTop: "var(--s4)" }}>
          <div>
            <h4 style={{ marginTop: 0 }}>Savior tells</h4>
            {SAVIOR_MARKERS.map((m) => (
              <Row
                key={m.name}
                stacked
                k={<span><b>{m.name}</b> — &ldquo;{m.says}&rdquo;</span>}
                v={<span className="small">{m.note}</span>}
              />
            ))}
          </div>
          <div>
            <h4 style={{ marginTop: 0 }}>Demon tells</h4>
            {DEMON_MARKERS.map((m) => (
              <Row
                key={m.name}
                stacked
                k={<span><b>{m.name}</b> — &ldquo;{m.says}&rdquo;</span>}
                v={<span className="small">{m.note}</span>}
              />
            ))}
          </div>
        </div>
      </Panel>

      <h3>Your four animals</h3>
      <Explain plain={CONCEPT_PLAIN.animal}>
        <p>
          Play (Oe+De) and Sleep (Oi+Di) are the <b>energy</b> animals; Blast (Oi+De) and Consume
          (Oe+Di) are the <b>information</b> animals. Positions 1 and 4 fall out of the type: the
          double-savior animal is always in the savior pair and the double-demon animal is always
          last. The two in between need a coin you set.
        </p>
      </Explain>

      <Figure
        label={`Animal stack · ${o.code}`}
        caption={
          o.unset.length
            ? <>Still open: {o.unset.join(", ")}. These are self-reported coins, not derivable from a four-letter type — set them below and the code completes.</>
            : <>Fully coined. This is the complete OPS notation for the reading you have set.</>
        }
      >
        <AnimalStack sig={o} />
      </Figure>

      <Panel title="Subtype coins — self-reported, not derived">
        <p className="small">
          OPS reaches 512 types by adding coins this app&rsquo;s sixteen-type core does not carry.
          They are kept separate on purpose: nothing below changes a single relation, score or
          playbook. Set them if you know yours.
        </p>

        <div className="grid g2" style={{ marginTop: "var(--s4)" }}>
          <label className="field">
            <span>Which animal joins the savior pair?</span>
            <select
              value={sub.secondSavior ?? ""}
              onChange={(e) => setSub((v) => ({ ...v, secondSavior: (e.target.value || undefined) as Animal | undefined }))}
            >
              <option value="">Not set</option>
              {o.middles.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>

          <label className="field">
            <span>Which of the two leads?</span>
            <select
              value={sub.lead ?? ""}
              onChange={(e) => setSub((v) => ({ ...v, lead: (e.target.value || undefined) as Subtype["lead"] }))}
            >
              <option value="">Not set</option>
              <option value="double-savior">{o.doubleSavior} (both saviors)</option>
              <option value="second-savior">The other savior animal</option>
            </select>
          </label>

          <label className="field">
            <span>Sensory modality</span>
            <select value={sub.sensory ?? ""} onChange={(e) => setSub((v) => ({ ...v, sensory: (e.target.value || undefined) as "M" | "F" | undefined }))}>
              <option value="">Not set</option>
              <option value="M">Masculine — held hard, immovable</option>
              <option value="F">Feminine — held loosely, malleable</option>
            </select>
          </label>

          <label className="field">
            <span>Extraverted decider modality</span>
            <select value={sub.decider ?? ""} onChange={(e) => setSub((v) => ({ ...v, decider: (e.target.value || undefined) as "M" | "F" | undefined }))}>
              <option value="">Not set</option>
              <option value="M">Masculine — pushes outward</option>
              <option value="F">Feminine — draws inward</option>
            </select>
          </label>
        </div>

        <label className="cluster" style={{ marginTop: "var(--s4)", gap: 10 }}>
          <input
            type="checkbox"
            checked={!!sub.jumper}
            onChange={(e) => setSub((v) => ({ ...v, jumper: e.target.checked }))}
          />
          <span className="small">
            <b>Jumper</b> — saviors are the dominant and the <i>tertiary</i> rather than the
            auxiliary. OPS&rsquo;s other sixteen base types.
          </span>
        </label>

        <p className="small muted" style={{ marginTop: "var(--s3)", marginBottom: 0 }}>
          Currently <b>{o.dominance}-dominant</b>.{" "}
          {sub.jumper
            ? "Jumpers are info-dominant: both saviors share an attitude, so an energy animal is last."
            : "Every non-jumper is energy-dominant, because a dominant and an auxiliary always run opposite attitudes — which is exactly the line where OPS's 32 base types leave this app's 16 behind."}
        </p>
      </Panel>

      {/* ------------------------------------------------ growth */}
      <h2 id="growth" style={{ scrollMarginTop: 88 }}>Growth</h2>

      <Explain big plain={GATE_PLAIN[g.gate]}>
        <p>
          The growth gate is determined by the ego&rsquo;s attitude/orientation group, and its cave
          is the Inferior function — which is also the gateway into the subconscious.
        </p>
      </Explain>

      <div className="grid g2">
        <Panel title={<Term>{g.gate}</Term>}>
          <Row k="What you fear" v={g.fear} stacked />
          <Row k="The cave" v={g.cave} stacked />
          <Row k="The treasure" v={g.treasure} stacked />
        </Panel>
        <Panel title="Two readings, not reconciled">
          <Row
            k="CS Joseph says"
            v={<span className="small">{s.subconscious.opensWith}</span>}
            stacked
          />
          <Row
            k="OPS says"
            v={<span className="small">
              Stop letting {o.saviorObs} and {o.saviorDec} solve everything, and put deliberate
              hours into {o.demonObs} and {o.demonDec} — the two you keep telling yourself you
              will get to later.
            </span>}
            stacked
          />
        </Panel>
      </div>

      <Panel title={`What ${st[3]} actually wants`} style={{ marginTop: "var(--s4)" }}>
        <Explain
          plain={`Everything above says to develop your Inferior ${st[3]}. This is what that function is actually chasing — and what to go and do about it.`}
        >
          <p style={{ margin: 0 }}>
            Structure from &ldquo;What Makes Each Cognitive Function Happy&rdquo;
            (psychologyjunkie.com), rewritten here. Growth advice that names a function without
            saying what feeds it is not actionable.
          </p>
        </Explain>

        <div className="grid g2" style={{ marginTop: "var(--s4)" }}>
          {[st[3], st[4]].map((fn, n) => (
            <div key={fn}>
              <div className="cluster" style={{ marginBottom: "var(--s2)" }}>
                <b className="mono" style={{ color: p.fn(fn), fontSize: "var(--t-lg)" }}>{fn}</b>
                <span className="chip">{n === 0 ? "Inferior" : "Nemesis"}</span>
                <span className="chip">wants {FN_WANTS[fn].toLowerCase()}</span>
              </div>
              <Row stacked k="What feeds it" v={<span className="small">{FN_SATISFACTION[fn]}</span>} />
              <Row stacked k="Starved, it looks like" v={<span className="small">{FN_STARVATION[fn]}</span>} />
              <Row
                stacked
                k="Try this week"
                v={
                  <ul style={{ margin: 0, fontSize: "var(--t-sm)", color: "var(--ink-2)" }}>
                    {FN_PRACTICE[fn].map((x) => <li key={x}>{x}</li>)}
                  </ul>
                }
              />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Behavioural profile" style={{ marginTop: "var(--s4)" }}>
        <div className="grid g2">
          <div>
            <Row k="Motivation" v={b.motivation} stacked />
            <Row k="Decides by" v={b.decisionStyle} stacked />
            <Row k="Speaks" v={b.commsStyle} stacked />
          </div>
          <div>
            <Row k="Under stress" v={b.stressResponse} stacked />
            <Row k="Deal breaker" v={b.dealBreaker} stacked />
            <Row k="Flaw" v={b.commsFlaw} stacked />
          </div>
        </div>
        <p className="small" style={{ marginTop: "var(--s4)", marginBottom: 0 }}>
          Appeal to <b>{virtue}</b>. Avoid triggering <b>{vice}</b>.
        </p>
      </Panel>

      {/* ------------------------------------------------ octagram */}
      <h2 id="octagram" style={{ scrollMarginTop: 88 }}>The Octagram</h2>

      <Explain big plain={CONCEPT_PLAIN.octagram}>
        <p>
          Two layers. The wheel layer is structural and derived here rather than looked up: your{" "}
          <Term id="temple-wheel">wheel</Term> is you and your <Term id="subconscious">subconscious</Term>,
          which is your <Term id="rel-du">Dual</Term>, and your <Term id="temple">temple</Term> is your
          full four-sides orbit. Both match CS Joseph&rsquo;s published lists exactly, 16 of 16, with no
          table anywhere in the engine. The theme layer is biographical, so it is set below rather
          than computed.
        </p>
      </Explain>

      <div className="grid g-side" style={{ marginTop: "var(--s5)", alignItems: "start" }}>
        <Figure
          label={`${t}'s wheel: ${wheel.origin}.`}
          caption={`Shared with ${wheel.pair[1]}. Origin at the centre, the honest route above it, the counterfeit below, and the two ways people drift out to the sides.`}
        >
          <OctagramWheel wheel={wheel} development={oct.development} />
        </Figure>

        <div className="stack-v">
          <Panel title={`${temple.name} temple`}>
            <p style={{ fontSize: "var(--t-base)", marginTop: 0 }}>{temple.plain}</p>
            <div className="cluster" style={{ marginBottom: "var(--s3)" }}>
              {temple.types.map((x) => (
                <Link key={x} to={`/type/${x}`} className={`chip mono${x === t ? " on" : ""}`}>
                  <i className="dot" style={{ background: p.quadra(quadra(x)) }} />
                  {x}
                </Link>
              ))}
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              Those four are your ego, subconscious, unconscious and superego. A temple is not a
              group of similar people — it is one mind seen from four sides.
            </p>
          </Panel>

          <Panel title={`Origin — ${wheel.origin}`}>
            <p style={{ fontSize: "var(--t-base)", margin: 0 }}>{wheel.originPlain}</p>
          </Panel>

          <Panel title={`Living virtue — ${wheel.livingVirtue}`}>
            <p className="small" style={{ margin: 0 }}>{wheel.virtuePlain}</p>
          </Panel>

          <Panel title={`Deadly sin — ${wheel.deadlySin}`}>
            <p className="small" style={{ margin: 0 }}>{wheel.sinPlain}</p>
          </Panel>
        </div>
      </div>

      <Panel title="Your theme — self-reported, not derived" style={{ marginTop: "var(--s5)" }}>
        <Explain
          plain="Two questions about your life rather than your wiring. Nobody can read these off a four-letter type, which is the whole reason the layer exists: two people of the same type with different childhoods end up in different places."
        >
          <p style={{ margin: 0 }}>
            Development is described as set early and largely fixed; focus is mutable and is what
            the growth section above is actually about. Held in the same posture as the OPS subtype
            coins — nothing is stored, and nothing is inferred.
          </p>
        </Explain>

        <div style={{ marginTop: "var(--s4)" }}>
          <ThemeSeasons
            development={oct.development}
            focus={oct.focus}
            onPick={(d, f) =>
              setOct((v) =>
                v.development === d && v.focus === f ? {} : { development: d, focus: f })
            }
          />
        </div>

        {oct.development && oct.focus ? (
          <div className="note" style={{ marginTop: "var(--s4)" }}>
            <p style={{ marginTop: 0 }}>
              <b>{themeFor(oct.development, oct.focus).theme}</b> —{" "}
              {themeFor(oct.development, oct.focus).movement}
            </p>
            <p className="small" style={{ marginBottom: 0 }}>
              On your wheel, {oct.development} leans toward{" "}
              <b>{poleFor(wheel, oct.development).name}</b>:{" "}
              {poleFor(wheel, oct.development).plain}
            </p>
          </div>
        ) : (
          <p className="small muted" style={{ marginTop: "var(--s4)", marginBottom: 0 }}>
            Pick a square to see which pole of your wheel it leans toward. Pick it again to clear it.
          </p>
        )}
      </Panel>

      <Panel title="Where this app stops" style={{ marginTop: "var(--s4)" }}>
        <p className="small" style={{ marginTop: 0 }}>
          The Octagram is recent and unevenly published. Rather than filling the gaps with
          plausible-sounding material, they are written down:
        </p>
        {UNSETTLED.map((u) => (
          <Row key={u.what} stacked k={u.what} v={<span className="small">{u.why}</span>} />
        ))}
      </Panel>

      {/* ------------------------------------------------ fit */}
      <h2 id="fit" style={{ scrollMarginTop: 88 }}>Who you fit</h2>

      <div className="grid g3">
        <Panel title="Complements — restful">
          <p className="small">{CONCEPT_PLAIN.complement}</p>
          <Links list={complements(t)} from={t} />
          <p className="small muted" style={{ marginTop: "var(--s3)", marginBottom: 0 }}>
            They supply your Inferior <b className="mono">{st[3]}</b>.
          </p>
        </Panel>
        <Panel title="Catalysts — stimulating">
          <p className="small">{CONCEPT_PLAIN.catalyst}</p>
          <Links list={catalysts(t)} from={t} />
          <p className="small muted" style={{ marginTop: "var(--s3)", marginBottom: 0 }}>
            They lead with your Nemesis <b className="mono">{st[4]}</b>.
          </p>
        </Panel>
        <Panel title="Frictions — hard work">
          <p className="small">
            Conflict and Super-Ego. Their strongest move lands on your most defended spot. Not
            enemies — just expensive.
          </p>
          <Links list={frictions(t)} from={t} />
        </Panel>
      </div>

      <Panel title="Coin signature" style={{ marginTop: "var(--s4)" }}>
        <p className="small">
          Four of these fix the type; the other four are derivable checks. Violet ones are the
          determining coins.
        </p>
        {c.map((v, i) => (
          <Row
            key={i}
            stacked
            k={<span>{COIN_PLAIN[i]}</span>}
            v={
              <span className="mono" style={{
                color: (DETERMINING as readonly number[]).includes(i) ? "var(--accent-ink)" : "var(--muted)",
              }}>
                {v} <span className="small">· {COIN_LABELS[i]}</span>
              </span>
            }
          />
        ))}
      </Panel>
    </>
  );
}

/** A row of type chips linking into their own pages, quadra-coloured. */
function Links({ list, from }: { list: MbtiType[]; from: MbtiType }) {
  return (
    <div className="cluster">
      {list.map((x) => (
        <Link key={x} to={`/pair/${from}/${x}`} className="chip mono">{x}</Link>
      ))}
    </div>
  );
}
