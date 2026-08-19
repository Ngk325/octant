import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { readStored, writeStored } from "../storage";
import { quadra, stack, gate, complements, catalysts, frictions } from "../engine/core";
import { soloRomance, pairRomance } from "../engine/romance";
import {
  ops, coins, SAVIOR_STATE, DEMON_STATE, SAVIOR_MARKERS, DEMON_MARKERS, ANIMAL_LABEL,
  type Subtype, type Animal,
} from "../engine/ops";
import {
  FN_ROLE, FN_KEYWORD, FN_KEYWORD_GLOSS, FN_SAYS, FN_WANTS,
  FN_SATISFACTION, FN_STARVATION, FN_PRACTICE,
} from "../engine/functions";
import { sides, SIDE_ORDER } from "../engine/sides";
import { powersOf } from "../engine/powers";
import {
  wheelOf, templeOf, themeFor, poleFor, UNSETTLED,
  type Development, type Focus,
} from "../engine/octagram";
import {
  TYPES, ARCHETYPE, GROUP, INTERACTION_STYLE, VIRTUE_VICE,
  BEHAVIOURAL, COIN_LABELS, DETERMINING, FN_LONG, FN_SHADOW, SLOT_NAMES,
  type MbtiType,
} from "../engine/data";
import {
  FN_PLAIN, SLOT_PLAIN, GATE_PLAIN, COIN_PLAIN, CONCEPT_PLAIN, typePlain, powersPlain,
} from "../engine/plain";
import { typeElsewhere, archetypeAliases, romanceElsewhere } from "../engine/translation";
import { usePalette } from "../components/Theme";
import { usePublishContext } from "../chat/ChatContext";
import WiringSchematic from "../components/WiringSchematic";
import FourSidesDiagram from "../components/FourSidesDiagram";
import DoorRow from "../components/DoorRow";
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
import ArchetypeSeal from "../components/glyphs/ArchetypeSeal";
import FnIcon from "../components/glyphs/FnIcon";

/* ==================================================================== *
 * ONE TYPE, READ IN FULL — the "A type" section.
 *
 * This is the restructured reader (formerly previewed at /a-type-v2).
 * It is a RESEQUENCE of the page it replaced, not a redesign: every
 * component, token and engine call is that page's. What changed is the
 * order, and the transitions the order made wrong.
 *
 * The page it replaced is kept, unrouted and unreachable, in
 * `TypeReaderLegacy.tsx` — see the header there.
 *
 * Order, and why:
 *   1  slots        foundational — defines every noun below it
 *   2  powers       a lens on slots 1 and 8, so it must follow them
 *   3  sides        the next mechanic on the same eight functions
 *   4  exchange     a second reading of the ego block
 *   5  growth       the payoff; needs the cave, the sides AND the overlay
 *   6  octagram     a second layer on top of the whole type
 *   7  self-report  both self-reported layers, together, out of the way
 *   8  fit          other-facing, once the self is complete
 *   9  reference    notation and other systems' vocabulary, last
 *
 * Every anchor id the previous page carried is kept — including #octagram,
 * which learn/curriculum.tsx links into — so nothing that deep-links into
 * /type/:type broke in the swap.
 * ==================================================================== */

/* The page's outline, and therefore its anchor nav — one array, so the two
   cannot drift apart. Nine h2 sections, one nav entry each: the previous
   page mixed h2s and h3s in this row, which advertised "Your switches" and
   "Your theme" as peers of "Growth". */
const SECTIONS = [
  ["slots", "The eight seats"],
  ["powers", "Superpowers & kryptonite"],
  ["sides", "Four sides of the mind"],
  ["exchange", "The exchange overlay"],
  ["growth", "Growth"],
  ["octagram", "The Octagram"],
  ["self-report", "What you set yourself"],
  ["fit", "Who you fit"],
  ["reference", "Reference"],
] as const;

/** One type, read in full: slots, four sides, the exchange overlay, growth, the Octagram, and fit. */
interface OctCoins { development?: Development; focus?: Focus }

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;

/**
 * The stored coins for one type. Every field is validated against its allowed
 * values, not just JSON-parsed — a record that is valid JSON but carries a
 * `sensory: "ZZZ"` or a `development: "banana"` would otherwise restore into
 * state and drive the overlay from a value the UI can never have produced.
 * Anything malformed, at the record level or the field level, reads as unset.
 *
 * Unchanged `coins.<type>` key across the restructure, on purpose: these are
 * one person's answers about themselves, and nobody should have to give them
 * again because the page around them was resequenced.
 */
function loadCoins(t: MbtiType): { sub: Subtype; oct: OctCoins } {
  try {
    const raw = readStored(`coins.${t}`);
    if (!raw) return { sub: {}, oct: {} };
    const parsed = JSON.parse(raw) as unknown;
    if (!isObj(parsed)) return { sub: {}, oct: {} };

    const rawSub = isObj(parsed.sub) ? parsed.sub : {};
    const sub: Subtype = {};
    if (rawSub.jumper === true) sub.jumper = true;
    const secondSavior = oneOf(rawSub.secondSavior, ["Play", "Sleep", "Blast", "Consume"] as const);
    if (secondSavior) sub.secondSavior = secondSavior;
    const lead = oneOf(rawSub.lead, ["double-savior", "second-savior"] as const);
    if (lead) sub.lead = lead;
    const sensory = oneOf(rawSub.sensory, ["M", "F"] as const);
    if (sensory) sub.sensory = sensory;
    const decider = oneOf(rawSub.decider, ["M", "F"] as const);
    if (decider) sub.decider = decider;

    const rawOct = isObj(parsed.oct) ? parsed.oct : {};
    const oct: OctCoins = {};
    const development = oneOf(rawOct.development, ["SD", "UD"] as const);
    if (development) oct.development = development;
    const focus = oneOf(rawOct.focus, ["SF", "UF"] as const);
    if (focus) oct.focus = focus;

    return { sub, oct };
  } catch {
    /* a corrupt record is an unset one */
    return { sub: {}, oct: {} };
  }
}

export default function TypeReader() {
  const { type } = useParams();
  const nav = useNavigate();
  const p = usePalette();
  const t = (TYPES.includes(type as MbtiType) ? type : "ENTP") as MbtiType;

  /* The subtype coins are self-reported facts about ONE person, so they must
     not survive a switch to a different type — otherwise reading ENTP with
     "sensory: masculine" set and then clicking through to INFJ silently
     attributes your answer to a type you never answered for. React keeps this
     component mounted across /type/X → /type/Y, so the swap is
     explicit. They persist per type in localStorage, keyed by the type. */
  const [sub, setSub] = useState<Subtype>(() => loadCoins(t).sub);
  /* The Octagram coins are kept SEPARATE from the exchange ones rather than
     bolted onto Subtype. The two layers are not reconciled anywhere else in this
     app and merging their self-report into one object would quietly imply they are. */
  const [oct, setOct] = useState<OctCoins>(() => loadCoins(t).oct);
  const [subFor, setSubFor] = useState<MbtiType>(t);
  if (subFor !== t) {
    setSubFor(t);
    const stored = loadCoins(t);
    setSub(stored.sub);
    setOct(stored.oct);
  }

  useEffect(() => {
    /* Write only when there is something to remember or something to forget —
       otherwise every first visit litters storage with empty records. */
    const any = Object.keys(sub).length > 0 || Object.keys(oct).length > 0;
    if (any || readStored(`coins.${subFor}`)) {
      writeStored(`coins.${subFor}`, JSON.stringify({ sub, oct }));
    }
  }, [sub, oct, subFor]);

  const st = stack(t);
  const o = ops(t, sub);
  const wheel = wheelOf(t);
  const temple = templeOf(t);
  const g = gate(t);
  const s = sides(t);
  const c = coins(t);
  const [virtue] = VIRTUE_VICE[t];
  const b = BEHAVIOURAL[t];
  const powers = powersOf(t);

  /* The three role-name alternates the header prints unsourced. The reference
     section drops exactly these rows rather than printing the same three names
     a second time with their systems attached — owner's call, recorded in the
     PR. Filtered by term rather than by system so it cannot fall out of step
     with translation.ts. */
  const aliasNames = new Set(archetypeAliases(t));

  usePublishContext(() => ({ kind: "type", type: t }), [t]);

  return (
    <>
      <div className="cluster" style={{ gap: "var(--s4)", marginTop: "var(--s5)" }}>
        <TypePicker label="Read" value={t} onChange={(x) => nav(`/type/${x}`)} />
        <span className="chip">
          <i className="dot" style={{ background: p.quadra(quadra(t)) }} />
          <Term>{quadra(t)}</Term> Camp
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--s5)", flexWrap: "wrap" }}>
        <TypeMolecule type={t} size={96} />
        <h1 style={{ margin: 0 }}>{t}</h1>
        {/* the archetype seal stands opposite the name, exactly like the card */}
        <span style={{ marginLeft: "auto" }}>
          <ArchetypeSeal type={t} size={84} />
        </span>
      </div>
      <p className="lede">{typePlain(t, st[0], st[1], st[3])}</p>

      {/* Three epithets, not one. A single label boxes a reader in, and the
          spread is itself informative — someone who does not see themselves in
          the first often does in the third. */}
      <p className="lede" style={{ margin: "var(--s2) 0 0", color: "var(--ink-2)" }}>
        {ARCHETYPE[t].join(" · ")}
      </p>

      {/* More color, still unsourced. In this build these three names appear
          ONCE — here — and the reference section no longer reprints them with
          their systems attached. */}
      <p className="small muted" style={{ margin: "var(--s1) 0 0" }}>
        Also pictured as {archetypeAliases(t).join(" · ")}
      </p>

      <p className="small muted">
        <Term>{GROUP[t]}</Term> · <Term>{INTERACTION_STYLE[t].split(" (")[0]}</Term> ·{" "}
        <Term>{soloRomance(t).animal}</Term> in romance
      </p>

      <SectionNav items={SECTIONS} />

      {/* ------------------------------------------------ slots
          First, because every section under it names these eight positions.
          The page this replaced opened on Superpowers & kryptonite, whose own
          copy had to say "the eight-slot stack BELOW already carries" — a
          forward reference in the page's first sentence. */}
      <h2 id="slots" className="sec">The eight seats</h2>

      <Explain
        big
        plain={`Eight habits of mind, in ${t}'s order of strength. The top four feel like "me". The bottom four run anyway, and feel like things that happen to you.`}
      >
        <p>
          The full eight-slot stack, generated from the (dominant, auxiliary) pair by the{" "}
          <Term id="stack-map">three moves</Term> — flip a function's attitude, swap it for its
          opposite element, or do both. Slots 1–4 are the ego block; 5–8 are the shadow.
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
            Two regions are marked, because this model carries two readings of the same stack: one
            puts the growth point at the <b>Cave</b> alone, the other marks <b>Delight</b>{" "}
            <i>and</i> <b>Cave</b> as its flinches. They agree on seat 4 and disagree about seat 3,
            which the first treats as a delight and the second treats as neglected. Neither is
            corrected into the other — Growth below shows the two side by side. The dashed arcs pair
            each ego slot with its shadow mirror: same capacity, facing the other way.
          </>
        }
      >
        <WiringSchematic type={t} showCorrespondence />
      </Figure>

      {/* The two blocks as two labeled RANK-ORDERED columns. Each column IS a
          rank order, and the columns are the ego/shadow split the schematic
          draws. */}
      <div className="grid g2" style={{ alignItems: "start" }}>
        {[
          { label: "The ego block — seats 1–4, “me”", slots: [0, 1, 2, 3] },
          { label: "The shadow block — seats 5–8, “what happens to me”", slots: [4, 5, 6, 7] },
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

      {/* ------------------------------------------------ powers
          Second, not first: this is one question asked of seat 1 and one asked
          of seat 8, both of which now exist on the page before it runs. */}
      <h2 id="powers" className="sec">Superpowers &amp; kryptonite</h2>

      <Explain
        big
        plain={powersPlain(t, powers.superpower.fn, powers.kryptonite.fn)}
      >
        <p>
          Not new facts about {t} — the Lead and Dread slots the stack above already gave you, read
          through one question each: what runs so strong it looks involuntary, and what one setting
          undoes it.
        </p>
      </Explain>

      <div className="grid g2" style={{ marginTop: "var(--s5)" }}>
        <Panel title={<span className="cluster"><FnTag fn={powers.superpower.fn} size="var(--t-lg)" /> Superpower</span>}>
          <div className="cluster" style={{ marginBottom: "var(--s3)" }}>
            <span className="chip">{powers.superpower.role}</span>
            <span className="chip">wants {powers.superpower.wants.toLowerCase()}</span>
          </div>
          <p style={{ marginTop: 0 }}>{powers.superpower.what}</p>
          <p className="small muted" style={{ margin: 0 }}>
            Backed up by <FnTag fn={powers.superpower.ally} /> — the Support that keeps the Lead from
            running alone.
          </p>
        </Panel>

        <Panel title={<span className="cluster"><FnTag fn={powers.kryptonite.fn} size="var(--t-lg)" /> Kryptonite</span>}>
          <div className="note warn" style={{ marginBottom: "var(--s3)" }}>
            <span className="small">{powers.kryptonite.shadow}</span>
          </div>
          <Row stacked k="Avoid triggering" v={<span className="small">{powers.kryptonite.vice}</span>} />
          <Row stacked k="Under stress" v={<span className="small">{powers.kryptonite.stressResponse}</span>} />
          <Row stacked k="Deal breaker" v={<span className="small">{powers.kryptonite.dealBreaker}</span>} />
        </Panel>
      </div>

      {/* ------------------------------------------------ four sides */}
      <h2 id="sides" className="sec">Four sides of the mind</h2>

      <Explain
        big
        plain="You are not one type — you are four. Split those eight seats into groups of four and each group is itself one of the sixteen. You move between them all day."
      >
        <p>
          The four sides are derived from the same three moves that generate the relation table.
          Which is why each side stands in a fixed relation to the ego: the subconscious is your{" "}
          <Term id="rel-du">Counterpart</Term>, the unconscious your <Term id="rel-ex">Damper</Term>{" "}
          partner, and the superego your <Term id="rel-se">Standoff</Term> partner — three of the
          sixteen relations Who you fit sets out further down. The relation and the structural side
          land on the same type because they are the same operator.
        </p>
      </Explain>

      {/* Promoted from the foot of this section to its head: it is a constraint
          on everything the section (and Growth after it) tells you to go and
          do, and at the bottom it read as a footnote to work already done. */}
      <p className="note warn">
        Before any of it: you cannot stay outside the ego for long. Running another side costs
        energy, and when the mind tires it drops you back into the ego whether or not you were
        finished. Prolonged stress, exhaustion or substances are what keep someone parked somewhere
        else.
      </p>

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
        label="Four doors, compared."
        caption={
          <>
            Access is a comparison: open, ajar, cracked, barred. Each lintel names the seat of
            your own stack that opens that side.
          </>
        }
      >
        <div className="cluster" style={{ justifyContent: "center" }}>
          <DoorRow type={t} />
        </div>
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

      <p className="small">
        <Link to={`/sides/${t}`}>The full field guide →</Link> — how to assess, enter, operate,
        avoid and interact with each side, worked in this much more depth for {t} specifically.
      </p>

      {/* Each side's deep working now sits inside the same disclosure the rest
          of the app uses for its technical layer. Nothing is dropped — the
          eight rows and both notes are all still here — but the section stops
          being forty rows of detail standing between the reader and Growth. */}
      {SIDE_ORDER.map((k) => {
        const side = s[k];
        return (
          <Panel
            key={k}
            title={`${side.name} — ${side.type}`}
            style={{ marginBottom: "var(--s4)" }}
          >
            <Row k="Way in" v={<span><FnTag fn={side.gateway.fn} />{k !== "ego" && <span className="small"> — your {side.gateway.egoSlot}</span>}</span>} />

            <Explain plain={side.plain} label="The full working">
              <p>{side.what}</p>

              <Row k="How to tell you're here" v={<span className="small">{side.assess}</span>} stacked />
              <Row k="What holds it shut" v={<span className="small">{side.blockedBy}</span>} stacked />
              <Row k="What opens it" v={<span className="small">{side.opensWith}</span>} stacked />
              <Row k="Deliberately" v={<span className="small">{side.atWill}</span>} stacked />
              <Row k="If you never do" v={<span className="small">{side.forced}</span>} stacked />
              <Row k="Dealing with it in someone else" v={<span className="small">{side.interact}</span>} stacked />
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
            </Explain>
          </Panel>
        );
      })}

      {/* ------------------------------------------------ ops
          The overlay's MECHANICS stay here, ahead of Growth, which reads one
          of its two growth accounts off them. The self-reported switches that
          used to interrupt this section have moved to "What you set yourself". */}
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
          Each current is one way of looking at the world bolted to one way of deciding, and it is
          the <i>direction</i> of each that names it. An <Term id="observer">observer</Term> and a{" "}
          <Term id="decider">decider</Term> both facing outward is Charge; both facing inward is
          Settle — the two that move <b>energy</b>. One of each way round moves{" "}
          <b>information</b>: inward observer with outward decider is Broadcast, outward observer
          with inward decider is Absorb. Positions 1 and 4 fall out of the type: the double-anchor
          current is always in the anchor pair and the double-flinch current is always last. The two
          in between need a switch you set.
        </p>
      </Explain>

      <Figure
        label={`Current stack · `}
        caption={
          o.unset.length
            ? <>Still open: {o.unset.join(", ")}. These are self-reported switches, not derivable from a four-letter type — set them under <a href="#exchange-switches">What you set yourself</a> below and the code completes.</>
            : <>Fully coined. This is the complete notation for the reading you have set.</>
        }
      >
        <AnimalStack sig={o} />
      </Figure>

      {/* ------------------------------------------------ growth
          Unmoved in sequence (5th of 9 here, 5th of 9 there) but now the
          section every foundation before it was building toward, rather than
          something the switches digression interrupted. */}
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

      {/* ------------------------------------------------ octagram
          Keeps "Where this app stops": an honesty note belongs beside the
          claims it qualifies, not filed under Reference at the foot of the
          page. The theme PICKER has moved on; the wheel still reflects it. */}
      <h2 id="octagram" className="sec">The Octagram</h2>

      <Explain big plain={CONCEPT_PLAIN.octagram}>
        <p>
          Two layers. The wheel layer is structural and derived here rather than looked up: your{" "}
          <Term id="temple-wheel">wheel</Term> is you and your <Term id="subconscious">subconscious</Term>,
          which is your <Term id="rel-du">Counterpart</Term>, and your <Term id="temple">temple</Term> is your
          full four-sides orbit. Both fall out of the same three moves the rest of the engine
          runs on, 16 of 16, with no lookup table anywhere. The theme layer is biographical, so it
          is set under What you set yourself rather than computed.
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
              already carries the words; this carries what they mean. */}
          <Panel title="Reading the wheel">
            <Row stacked k={`Origin — ${wheel.origin}`} v={<span className="small">{wheel.originPlain}</span>} />
            <Row stacked k={`Living virtue — ${wheel.livingVirtue}`} v={<span className="small">{wheel.virtuePlain}</span>} />
            <Row stacked k={`Deadly sin — ${wheel.deadlySin}`} v={<span className="small">{wheel.sinPlain}</span>} />
          </Panel>
        </div>
      </div>

      <Panel title="Where this app stops" style={{ marginTop: "var(--s4)" }}>
        <p className="small" style={{ marginTop: 0 }}>
          The Octagram is recent and unevenly published. Rather than filling the gaps with
          plausible-sounding material, they are written down:
        </p>
        {UNSETTLED.map((u) => (
          <Row key={u.what} stacked k={u.what} v={<span className="small">{u.why}</span>} />
        ))}
      </Panel>

      {/* ------------------------------------------------ self-report
          The page's two sets of controls, together. Both are explicitly not
          derived, both are advanced, and before the restructure they sat three
          sections apart — each having to establish the same posture from
          scratch, in the middle of a derived section. */}
      <h2 id="self-report" className="sec">What you set yourself</h2>

      <Explain
        big
        plain="Two things on this page cannot be read off four letters: which way round some of your currents run, and what your childhood did to you. Those are questions, not results — answer them if you know, leave them if you do not."
      >
        <p>
          Both layers are held in the same posture: self-reported, never inferred, and load-bearing
          for nothing else. Nothing set here changes a single relation, score or playbook, and
          nothing above it was derived from an answer given here. They are kept together — and last
          — so that the derived reading above stands on its own.
        </p>
      </Explain>

      <h3 id="exchange-switches" className="sec">Your switches</h3>
      <Panel title="Subtype switches — self-reported, not derived">
        <p className="small">
          The full overlay reaches 512 readings by adding switches this app&rsquo;s sixteen-type core
          does not carry. Set them if you know yours; they refine the current stack in{" "}
          <a href="#exchange">The exchange overlay</a> above and nothing else.
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

      <h3 id="theme" className="sec">Your theme</h3>
      <Panel title="Self-reported, not derived">
        <Explain
          plain="Two questions about your life rather than your wiring. Nobody can read these off a four-letter type, which is the whole reason the layer exists: two people of the same type with different childhoods end up in different places."
        >
          <p style={{ margin: 0 }}>
            Development is described as set early and largely fixed; focus is mutable and is what
            the growth section above is actually about. Picking a square also marks the pole it
            leans toward on <a href="#octagram">your wheel</a>.
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

      {/* ------------------------------------------------ fit
          Other-facing, after the self is complete. The coin signature that
          used to close this section has gone to Reference: it is notation
          about how the type is fixed, not about who suits it. */}
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
            Headwind and Standoff. Their strongest move lands on your most defended spot. Not
            enemies — just expensive.
          </p>
          <Links list={frictions(t)} from={t} />
        </Panel>
      </div>

      {/* Romance is not a fourth static archetype bolted onto the type —
          it runs through the same Complement/Catalyst/Cave mechanics as the
          rest of this section, just asked with the partner's Lead and Animal
          in the frame. See engine/romance.ts. */}
      <Panel title="In romance" style={{ marginTop: "var(--s4)" }}>
        <p className="small" style={{ marginTop: 0 }}>{soloRomance(t).text}</p>
        <p className="small muted" style={{ marginBottom: 0 }}>
          {pairRomance(t, complements(t)[0]).text}
        </p>
      </Panel>

      {/* The behavioural profile, minus the three fields Kryptonite above
          already renders from the same source (stress response, deal breaker,
          vice) — before the restructure they were printed twice on this page. */}
      <Panel title="Working with them" style={{ marginTop: "var(--s4)" }}>
        <div className="grid g2">
          <div>
            <Row k="Motivation" v={b.motivation} stacked />
            <Row k="Decides by" v={b.decisionStyle} stacked />
          </div>
          <div>
            <Row k="Speaks" v={b.commsStyle} stacked />
            <Row k="Flaw" v={b.commsFlaw} stacked />
          </div>
        </div>
        <p className="small" style={{ marginTop: "var(--s4)", marginBottom: 0 }}>
          Appeal to <b>{virtue}</b>. What to avoid, how they go under pressure and what ends it are
          in <a href="#powers">Superpowers &amp; kryptonite</a> above.
        </p>
      </Panel>

      {/* ------------------------------------------------ reference
          Notation and other people's vocabulary, last. Nobody reads their own
          type page for either, and both were sitting inside "Who you fit". */}
      <h2 id="reference" className="sec">Reference</h2>

      <Panel title="Coin signature">
        <p className="small">
          Four of these fix the type; the other four are derivable checks. Violet ones are the
          determining coins — they are what the four letters at the top actually encode.
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
            else&rsquo;s vocabulary, you can find your footing. The three role-names at the top of
            the page are the other alternates, printed there without their systems.
          </p>
          {[...typeElsewhere(t), ...romanceElsewhere(t)]
            .filter((e) => !aliasNames.has(e.term))
            .map((e) => (
              <Row
                key={`${e.system}-${e.term}`}
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
