import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { quadra, stack, gate, complements, catalysts, frictions } from "../engine/core";
import {
  ops, coins, SAVIOR_STATE, DEMON_STATE, SAVIOR_MARKERS, DEMON_MARKERS, ANIMAL_LABEL,
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
  TYPES, ARCHETYPE, GROUP, INTERACTION_STYLE, ROMANCE, VIRTUE_VICE,
  BEHAVIOURAL, COIN_LABELS, DETERMINING, FN_LONG, FN_SHADOW, SLOT_NAMES,
  type MbtiType,
} from "../engine/data";
import { FN_PLAIN, SLOT_PLAIN, GATE_PLAIN, COIN_PLAIN, CONCEPT_PLAIN, typePlain } from "../engine/plain";
import { typeElsewhere, archetypeAliases } from "../engine/translation";
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
import { FnTag, Panel, Row } from "../components/Bits";
import { SectionNav } from "../components/Section";
import Term from "../components/Term";
import LettersToStack from "../components/LettersToStack";
import GatewayPath from "../components/GatewayPath";
import SaviorDemonGrid from "../components/SaviorDemonGrid";
import RelationLanding from "../components/RelationLanding";
import TypeMolecule from "../components/glyphs/TypeMolecule";
import FnIcon from "../components/glyphs/FnIcon";

/* The page's outline, and therefore its anchor nav — one array, so the two
   cannot drift apart. The two "your …" entries are the page's interactive
   forms; they were previously buried at 60% and 85% depth with no way to
   reach them but scrolling. */
const SECTIONS = [
  ["slots", "The eight slots"],
  ["sides", "Four sides"],
  ["exchange", "The exchange overlay"],
  ["exchange-switches", "Your switches"],
  ["growth", "Growth"],
  ["octagram", "The Octagram"],
  ["theme", "Your theme"],
  ["fit", "Who you fit"],
] as const;

/** One type, read in full: slots, four sides, the exchange overlay, growth, the Octagram, and fit. */
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
  /* The Octagram coins are kept SEPARATE from the exchange ones rather than
     bolted onto Subtype. The two layers are not reconciled anywhere else in this
     app and merging their self-report into one object would quietly imply they are. */
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
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--s5)", flexWrap: "wrap" }}>
        <TypeMolecule type={t} size={96} />
        <h1 style={{ margin: 0 }}>{t}</h1>
      </div>
      <p className="lede">{typePlain(t, st[0], st[1], st[3])}</p>

      {/* Three epithets, not one. A single label boxes a reader in, and the
          spread is itself informative — someone who does not see themselves in
          the first often does in the third. */}
      <p className="lede" style={{ margin: "var(--s2) 0 0", color: "var(--ink-2)" }}>
        {ARCHETYPE[t].join(" · ")}
      </p>

      {/* More color, still unsourced — same three role-names the "Known
          elsewhere as" section cites further down, but here without which
          system named them. Our own epithets above stay what every picker
          and pair page uses; this line is this page only. */}
      <p className="small muted" style={{ margin: "var(--s1) 0 0" }}>
        Also pictured as {archetypeAliases(t).join(" · ")}
      </p>

      <p className="small muted">
        <Term>{GROUP[t]}</Term> · <Term>{INTERACTION_STYLE[t].split(" (")[0]}</Term> ·{" "}
        <Term>{ROMANCE[t]}</Term> romance style
      </p>

      <SectionNav items={SECTIONS} />

      {/* ------------------------------------------------ slots */}
      <h2 id="slots" className="sec">The eight slots</h2>

      <Explain
        plain={`Eight habits of mind, in ${t}'s order of strength. The top four feel like "me". The bottom four run anyway, and feel like things that happen to you.`}
      >
        <p>
          The full eight-slot stack, generated from the (dominant, auxiliary) pair by the three
          moves. Slots 1–4 are the ego block; 5–8 are the shadow.
        </p>
      </Explain>

      <Figure
        label={`Where ${t} comes from.`}
        caption="The four letters are not the type — they are the recipe for the ordering below."
      >
        <LettersToStack type={t} />
      </Figure>

      <Figure
        minWidth={660}
        label="Strongest at the top."
        caption={
          <>
            Two regions are marked, because this model carries two readings of the same stack.
            One puts the growth point at the <b>Cave</b> alone. The other marks a wider pair —
            <b>Delight</b> <i>and</i> <b>Cave</b> — as its flinches. They agree on slot 4 and disagree
            about slot 3, which the first treats as a delight and the second treats as neglected.
            Neither reading is corrected into the other. The dashed arcs
            pair each ego slot with its shadow mirror: same capacity, facing the other way.
          </>
        }
      >
        <WiringSchematic type={t} showCorrespondence />
      </Figure>

      {/* The two blocks as two labeled RANK-ORDERED columns. The first build
          put all eight in one 2-column grid, which sat slot 1 beside slot 2 —
          visually flattening the exact ordering the figure above asserts.
          Here each column IS a rank order, and the columns are the ego/shadow
          split the schematic draws. */}
      <div className="grid g2" style={{ alignItems: "start" }}>
        {[
          { label: "The ego block — slots 1–4, “me”", slots: [0, 1, 2, 3] },
          { label: "The shadow block — slots 5–8, “what happens to me”", slots: [4, 5, 6, 7] },
        ].map(({ label, slots }) => (
          <div key={label} className="stack-v">
            <h3 style={{ margin: "var(--s2) 0 0" }}>{label}</h3>
            {slots.map((i) => {
              const fn = st[i];
              return (
                <Panel key={fn} title={`${i + 1}. ${SLOT_NAMES[i]}`}>
                  <div className="cluster" style={{ marginBottom: "var(--s2)" }}>
                    <FnIcon fn={fn} size={36} />
                    <FnTag fn={fn} size="var(--t-lg)" />
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
              );
            })}
          </div>
        ))}
      </div>

      {/* ------------------------------------------------ four sides */}
      <h2 id="sides" className="sec">Four sides of the mind</h2>

      <Explain
        big
        plain="You are not one type — you are four. Split those eight slots into groups of four and each group is itself one of the sixteen. You move between them all day."
      >
        <p>
          The four sides are derived from the same three moves that generate the
          relation table. Which is why each side stands in a fixed relation to the ego: the
          subconscious is your <Term id="rel-du">Counterpart</Term>, the unconscious your{" "}
          <Term id="rel-ex">Damper</Term> partner, and the superego your{" "}
          <Term id="rel-se">Super-Ego</Term> partner. The relation and the structural side land on
          the same type because they are the same operator.
        </p>
      </Explain>

      <Figure
        label="The same eight functions, sorted four ways."
        caption={
          <>
            Your <b>Cave</b> is the subconscious&rsquo;s Lead and your <b>Dread</b> is the
            superego&rsquo;s Lead. What you are worst at is what another side of you leads with —
            which is why those sides feel like meeting someone else.
          </>
        }
      >
        <FourSidesDiagram type={t} />
      </Figure>

      <Figure
        label="One door each, in order."
        caption={
          <>
            Every side is entered through one function of your own ego stack, and the order is
            not optional — the superego&rsquo;s door opens <i>you</i> if you go there before the
            other three are developed. This is the same journey the Growth section below is
            about.
          </>
        }
      >
        <GatewayPath type={t} />
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

            <Row k="Way in" v={<span><FnTag fn={side.gateway.fn} />{k !== "ego" && <span className="small"> — your {side.gateway.egoSlot}</span>}</span>} />
            <Row k="What holds it shut" v={<span className="small">{side.blockedBy}</span>} stacked />
            <Row k="What opens it" v={<span className="small">{side.opensWith}</span>} stacked />
            <Row k="Deliberately" v={<span className="small">{side.atWill}</span>} stacked />
            <Row k="If you never do" v={<span className="small">{side.forced}</span>} stacked />
            <Row k="What it pays out" v={<span className="small">{side.produces}</span>} stacked />

            {/* Two notes, stacked — not a grid inside a card inside a grid.
                They are a contrast to read in sequence, not columns. */}
            <div className="note" style={{ marginTop: "var(--s4)" }}>
              <b style={{ fontFamily: "var(--sans)", fontSize: "var(--t-sm)" }}>Developed</b>{" "}
              <span className="small">{side.developed}</span>
            </div>
            <div className="note warn" style={{ marginTop: "var(--s2)" }}>
              <b style={{ fontFamily: "var(--sans)", fontSize: "var(--t-sm)" }}>Undeveloped</b>{" "}
              <span className="small">{side.undeveloped}</span>
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
      <h2 id="exchange" className="sec">The exchange overlay</h2>

      <Explain
        big
        plain="A second reading looks at the same top four functions and asks a different question: which two do you trust completely, and which two make you nervous?"
      >
        <p>
          The overlay splits the ego block into two anchors and two flinches. The flinches are the axis
          opposites of the anchors, which puts them at Delight and Cave — the overlay does
          not reach into the shadow block at all.
        </p>
      </Explain>

      <Figure
        label="One structure, two axes."
        caption={
          <>
            {CONCEPT_PLAIN.savior} {CONCEPT_PLAIN.demon} The flinches sit in the same rows as
            their anchors — same axis, everything else flipped.
          </>
        }
      >
        <SaviorDemonGrid type={t} sub={sub} />
      </Figure>

      <div className="grid g2" style={{ marginTop: "var(--s4)" }}>
        <p className="note" style={{ margin: 0 }}>
          <b style={{ fontFamily: "var(--sans)", fontSize: "var(--t-sm)" }}>Anchor state.</b>{" "}
          <span className="small">{SAVIOR_STATE}</span>
        </p>
        <p className="note warn" style={{ margin: 0 }}>
          <b style={{ fontFamily: "var(--sans)", fontSize: "var(--t-sm)" }}>Flinch state.</b>{" "}
          <span className="small">{DEMON_STATE}</span>
        </p>
      </div>

      <Panel title="How to tell which is which, in yourself" style={{ marginTop: "var(--s4)" }}>
        <p className="small">
          Easier than the descriptions above: listen for what you say about an area of your life.
        </p>
        <div className="grid g2" style={{ marginTop: "var(--s4)" }}>
          <div>
            <h4 style={{ marginTop: 0 }}>Anchor tells</h4>
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
            <h4 style={{ marginTop: 0 }}>Flinch tells</h4>
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

      <h3>Your four currents</h3>
      <Explain plain={CONCEPT_PLAIN.animal}>
        <p>
          Charge (Oe+De) and Settle (Oi+Di) move <b>energy</b>; Broadcast (Oi+De) and Absorb
          (Oe+Di) move <b>information</b>. Positions 1 and 4 fall out of the type: the
          double-anchor current is always in the anchor pair and the double-flinch current is always
          last. The two in between need a switch you set.
        </p>
      </Explain>

      <Figure
        label={`Current stack · `}
        caption={
          o.unset.length
            ? <>Still open: {o.unset.join(", ")}. These are self-reported switches, not derivable from a four-letter type — set them below and the code completes.</>
            : <>Fully coined. This is the complete notation for the reading you have set.</>
        }
      >
        <AnimalStack sig={o} />
      </Figure>

      <h3 id="exchange-switches" className="sec">Your switches</h3>
      <Panel title="Subtype switches — self-reported, not derived">
        <p className="small">
          The full overlay reaches 512 readings by adding switches this app&rsquo;s sixteen-type core
          does not carry.
          They are kept separate on purpose: nothing below changes a single relation, score or
          playbook. Set them if you know yours.
        </p>

        <div className="grid g2" style={{ marginTop: "var(--s4)" }}>
          <label className="field">
            <span>Which current joins the anchor pair?</span>
            <select
              value={sub.secondSavior ?? ""}
              onChange={(e) => setSub((v) => ({ ...v, secondSavior: (e.target.value || undefined) as Animal | undefined }))}
            >
              <option value="">Not set</option>
              {o.middles.map((m) => <option key={m} value={m}>{ANIMAL_LABEL[m]}</option>)}
            </select>
          </label>

          <label className="field">
            <span>Which of the two leads?</span>
            <select
              value={sub.lead ?? ""}
              onChange={(e) => setSub((v) => ({ ...v, lead: (e.target.value || undefined) as Subtype["lead"] }))}
            >
              <option value="">Not set</option>
              <option value="double-savior">{ANIMAL_LABEL[o.doubleSavior]} (both anchors)</option>
              <option value="second-savior">The other anchor current</option>
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
            <b>Jumper</b> — anchors are the dominant and the <i>tertiary</i> rather than the
            auxiliary. The overlay&rsquo;s other sixteen base readings.
          </span>
        </label>

        <p className="small muted" style={{ marginTop: "var(--s3)", marginBottom: 0 }}>
          Currently <b>{o.dominance}-dominant</b>.{" "}
          {sub.jumper
            ? "Jumpers are info-dominant: both anchors share an attitude, so an energy current is last."
            : "Every non-jumper is energy-dominant, because a dominant and an auxiliary always run opposite attitudes — which is exactly the line where the overlay's 32 base readings leave this app's 16 types behind."}
        </p>
      </Panel>

      {/* ------------------------------------------------ growth */}
      <h2 id="growth" className="sec">Growth</h2>

      <Explain big plain={GATE_PLAIN[g.gate]}>
        <p>
          The growth gate is determined by the ego&rsquo;s attitude/orientation group, and its cave
          is the function sitting in your Cave slot — which is also the gateway into the
          subconscious.
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
            k="Open the subconscious"
            v={<span className="small">{s.subconscious.opensWith}</span>}
            stacked
          />
          <Row
            k="Work the demons"
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
          plain={`Everything above says to develop your Cave ${st[3]}. This is what that function is actually chasing — and what to go and do about it.`}
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
                <FnTag fn={fn} size="var(--t-lg)" />
                <span className="chip">{n === 0 ? "Cave" : "Doubt"}</span>
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

      {/* ------------------------------------------------ octagram */}
      <h2 id="octagram" className="sec">The Octagram</h2>

      <Explain big plain={CONCEPT_PLAIN.octagram}>
        <p>
          Two layers. The wheel layer is structural and derived here rather than looked up: your{" "}
          <Term id="temple-wheel">wheel</Term> is you and your <Term id="subconscious">subconscious</Term>,
          which is your <Term id="rel-du">Counterpart</Term>, and your <Term id="temple">temple</Term> is your
          full four-sides orbit. Both fall out of the same three moves the rest of the engine
          runs on, 16 of 16, with no lookup table anywhere. The theme layer is biographical, so it
          is set below rather than computed.
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

          {/* One panel for the wheel's three readings — the figure beside it
              already carries the words; this carries what they mean. The
              first build stated the origin three separate times in one row. */}
          <Panel title="Reading the wheel">
            <Row stacked k={`Origin — ${wheel.origin}`} v={<span className="small">{wheel.originPlain}</span>} />
            <Row stacked k={`Living virtue — ${wheel.livingVirtue}`} v={<span className="small">{wheel.virtuePlain}</span>} />
            <Row stacked k={`Deadly sin — ${wheel.deadlySin}`} v={<span className="small">{wheel.sinPlain}</span>} />
          </Panel>
        </div>
      </div>

      <h3 id="theme" className="sec" style={{ marginTop: "var(--s5)" }}>Your theme</h3>
      <Panel title="Self-reported, not derived">
        <Explain
          plain="Two questions about your life rather than your wiring. Nobody can read these off a four-letter type, which is the whole reason the layer exists: two people of the same type with different childhoods end up in different places."
        >
          <p style={{ margin: 0 }}>
            Development is described as set early and largely fixed; focus is mutable and is what
            the growth section above is actually about. Held in the same posture as the subtype
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
      <h2 id="fit" className="sec">Who you fit</h2>

      <Explain
        big
        plain={`Fit is mechanical before it is chemical: how easy someone is for ${t} to be around depends on which of ${t}'s slots their strengths land in.`}
      >
        <p>
          The figure shows the best case — {t}&rsquo;s Counterpart, whose Lead and Support land exactly on{" "}
          {t}&rsquo;s Cave and Delight. Every pairing below is the same picture with different
          landing spots; open one to see its version.
        </p>
      </Explain>

      <Figure
        label={`The best case: ${complements(t)[0]}.`}
        caption={
          <>
            {complements(t)[0]}&rsquo;s strengths arrive on {t}&rsquo;s <b>Cave</b> and{" "}
            <b>Delight</b> — supplying the feared thing and delighting the playful one. That is
            what &ldquo;restful&rdquo; means mechanically.
          </>
        }
        minWidth={480}
      >
        <RelationLanding a={t} b={complements(t)[0]} />
      </Figure>

      <div className="grid g3" style={{ marginTop: "var(--s5)" }}>
        <Panel title="Complements — restful">
          <p className="small">{CONCEPT_PLAIN.complement}</p>
          <Links list={complements(t)} from={t} />
          <p className="small muted" style={{ marginTop: "var(--s3)", marginBottom: 0 }}>
            They supply your Cave <b className="mono">{st[3]}</b>.
          </p>
        </Panel>
        <Panel title="Catalysts — stimulating">
          <p className="small">{CONCEPT_PLAIN.catalyst}</p>
          <Links list={catalysts(t)} from={t} />
          <p className="small muted" style={{ marginTop: "var(--s3)", marginBottom: 0 }}>
            They lead with your Doubt <b className="mono">{st[4]}</b>.
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

      {/* Fit-with-others content, so it lives in the fit section — it used to
          sit under Growth, which is about the self. */}
      <Panel title="Working with them" style={{ marginTop: "var(--s4)" }}>
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

      {/* Cross-reference, so it sits at the bottom and stays closed. A reader
          who arrived from another framework needs this once; everyone else
          should never have to see another system's vocabulary on their own
          type page. Every name comes from engine/translation.ts — the one
          module allowed to hold them — so nothing is duplicated here. */}
      <Panel style={{ marginTop: "var(--s4)" }}>
        <details>
          <summary className="card-title" style={{ cursor: "pointer", marginBottom: 0 }}>
            Known elsewhere as
          </summary>
          <p className="small muted" style={{ margin: "var(--s3) 0" }}>
            Octant is one model, derived here — these are not its sources, and the names below are
            not interchangeable with ours. They are here so that if you arrived carrying somebody
            else&rsquo;s vocabulary, you can find your footing.
          </p>
          {typeElsewhere(t).map((e) => (
            <Row
              key={e.system}
              stacked
              k={<span>{e.system}</span>}
              v={
                <span className="small">
                  {e.term}
                  {e.note && <span className="muted"> — {e.note}</span>}
                </span>
              }
            />
          ))}
        </details>
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
