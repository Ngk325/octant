import type { ReactNode } from "react";
import { Link } from "react-router";
import { stack, quadra, omega, TYPES, REL, ease } from "../engine/core";
import { bondFacts, sparkFacts } from "../engine/bonds";
import { ops, ANIMAL_LABEL, DEMON_MARKERS } from "../engine/ops";
import { sides, SIDE_ORDER } from "../engine/sides";
import { powersOf } from "../engine/powers";
import { wheelOf, templeOf } from "../engine/octagram";
import { playbook } from "../engine/playbook";
import {
  FN_PLAIN, SLOT_PLAIN, CONCEPT_PLAIN, REL_PLAIN, QUADRA_PLAIN, powersPlain,
} from "../engine/plain";
import { FN_ROLE, FN_KEYWORD, FN_SAYS } from "../engine/functions";
import { SLOT_NAMES, FN_FULL, BEHAVIOURAL, SLOT_COST, type Fn, type MbtiType } from "../engine/data";
import Explain from "../components/Explain";
import Figure from "../components/Figure";
import WiringSchematic from "../components/WiringSchematic";
import DerivationTree from "../components/glyphs/DerivationTree";
import FnIcon from "../components/glyphs/FnIcon";
import SelfTribeCone from "../components/glyphs/SelfTribeCone";
import AnimalGlyph from "../components/glyphs/AnimalGlyph";
import SideDoor from "../components/glyphs/SideDoor";
import SeatFigure from "../components/glyphs/SeatFigure";
import TypeMolecule from "../components/glyphs/TypeMolecule";
import LettersToStack from "../components/LettersToStack";
import FourSidesDiagram from "../components/FourSidesDiagram";
import AnimalStack from "../components/AnimalStack";
import OctagramMap from "../components/OctagramMap";
import OctagramWheel from "../components/OctagramWheel";
import ThemeSeasons from "../components/ThemeSeasons";
import { Panel, Row, FnTag } from "../components/Bits";
import { AxisBondFigure, SparkMeshFigure } from "../components/BondFigure";
import Term from "../components/Term";
import QuadraFunctionGrid from "../components/QuadraFunctionGrid";
import RelationLanding from "../components/RelationLanding";
import DivergingEase from "../components/DivergingEase";

/* ------------------------------------------------------------------ *
 * The course.
 *
 * Sixteen stages, each one assuming only what the previous ones taught. The
 * rule for every stage: a plain-language explanation you could give to
 * someone in a pub comes first, the machinery goes inside "the exact
 * mechanics", and there is always something on screen to look at.
 * ------------------------------------------------------------------ */

export interface Stage {
  slug: string;
  title: string;
  blurb: string;
  /** Rendered with the reader's chosen example type. */
  body: (t: MbtiType) => ReactNode;
  /** A question the reader should be able to answer before moving on. */
  check: ReactNode;
}

const FNS: Fn[] = ["Ne", "Ni", "Se", "Si", "Te", "Ti", "Fe", "Fi"];

/** The course, in order. Each stage assumes only what the ones before it taught. */
export const STAGES: Stage[] = [
  {
    slug: "functions",
    title: "Eight habits of mind",
    blurb: "The whole system is built from eight of these. Everyone has all eight.",
    body: () => (
      <>
        <Explain big plain={CONCEPT_PLAIN.function}>
          <p>
            Eight cognitive functions: four perceiving (Ne, Ni, Se, Si) and four judging
            (Te, Ti, Fe, Fi), each in an extraverted or intraverted attitude. This app treats them
            as the eight information elements, and the whole model is three moves over them.
          </p>
        </Explain>

        <p>
          Four of them are ways of <b>taking things in</b>. Four are ways of{" "}
          <b>making up your mind</b>. That is the only split that matters yet.
        </p>

        <div className="grid g2" style={{ marginTop: "var(--s5)" }}>
          <Panel title="Taking things in">
            {FNS.slice(0, 4).map((f) => (
              <Row key={f} stacked k={<><Term>{f}</Term> · {FN_FULL[f]}</>} v={<span className="small">{FN_PLAIN[f]}</span>} />
            ))}
          </Panel>
          <Panel title="Making up your mind">
            {FNS.slice(4).map((f) => (
              <Row key={f} stacked k={<><Term>{f}</Term> · {FN_FULL[f]}</>} v={<span className="small">{FN_PLAIN[f]}</span>} />
            ))}
          </Panel>
        </div>

        <h3>Why eight, and not seven or nine</h3>
        <Explain plain="Eight is not a number someone picked. It falls out of three yes-or-no questions asked one after another.">
          <p>
            After the function-tree derivation in the source material: consciousness resolves as
            yes/no; that resolution is either involuntary (observing) or willed (deciding); each
            splits by what it attends to; and each of those runs either outward or inward.
            Two × two × two = eight.
          </p>
        </Explain>

        <Figure
          minWidth={648}
          label="Three splits, eight results."
          caption="Read downward. Each level is one binary choice, and the eight at the bottom are every combination of them — which is why the list is exactly this long."
        >
          <DerivationTree />
        </Figure>

        <h3>Where a function points</h3>
        <Explain plain="The e/i letter is not shyness — it is where the function checks its answers. Inward-facing functions answer to the self; outward-facing ones answer to the world.">
          <p>
            The clearest case is the deciders: <Term>Fi</Term> checks a decision against its own
            values, <Term>Fe</Term> against the room&rsquo;s. The same beam-versus-fan applies to
            every pair.
          </p>
        </Explain>

        <Figure
          label="One beam, or the whole room."
          caption={
            <>
              <b>Fi</b> holds one point alone — its own calibration. <b>Fe</b> casts a fan over
              everyone present and reads them. Neither is better; they are different instruments
              pointed different ways.
            </>
          }
        >
          <div className="cluster" style={{ gap: "var(--s6)", justifyContent: "center" }}>
            <div style={{ width: 160, textAlign: "center" }}>
              <SelfTribeCone fn="Fi" />
              <span className="small muted">Fi — the self&rsquo;s values</span>
            </div>
            <div style={{ width: 160, textAlign: "center" }}>
              <SelfTribeCone fn="Fe" />
              <span className="small muted">Fe — the tribe&rsquo;s values</span>
            </div>
          </div>
        </Figure>

        <h3>What each one sounds like</h3>
        <p>
          The fastest way to spot these in real life is not to analyse someone — it is to notice
          what they say.
        </p>

        <div className="grid g2">
          {FNS.map((f) => (
            <div key={f} style={{ display: "flex", gap: "var(--s3)", alignItems: "flex-start" }}>
              <FnIcon fn={f} size={44} />
              <div className="row stacked" style={{ flex: 1, minWidth: 0 }}>
                <dt>
                  <Term>{f}</Term> · {FN_ROLE[f]} · {FN_KEYWORD[f]}
                </dt>
                <dd className="small">
                  &ldquo;{FN_SAYS[f][0]}&rdquo; &middot; &ldquo;{FN_SAYS[f][1]}&rdquo;
                </dd>
              </div>
            </div>
          ))}
        </div>

        <p className="note" style={{ marginTop: "var(--s5)" }}>
          Nobody is missing any of these. If they were, the rest of the system would not work —
          the interesting part is not <i>which</i> you have, it is what <i>order</i> they run in.
        </p>
      </>
    ),
    check: "Without scrolling up: which four are about taking things in, and which four are about deciding?",
  },

  {
    slug: "order",
    title: "The order is the type",
    blurb: "Same eight habits, different running order. That order is what a 'type' is.",
    body: (t) => {
      return (
        <>
          <Explain big plain={CONCEPT_PLAIN.stack}>
            <p>
              The eight-seat stack is generated, not listed. Given a dominant and an auxiliary,
              the other six seats follow by applying the three moves — so sixteen pairs
              produce sixteen complete stacks with no lookup table.
            </p>
          </Explain>

          <p>
            Here is <b>{t}</b>. The top one is effortless and slightly overused. The bottom one
            barely runs at all.
          </p>

          <Figure
            minWidth={660}
            label="Read top to bottom."
            caption={
              <>
                Strongest at the top, weakest at the bottom. Seats 1–4 feel like &ldquo;me&rdquo;;
                seats 5–8 feel like things that happen to you. Everything else in this course is
                about those eight rows.
              </>
            }
          >
            <WiringSchematic type={t} showCorrespondence />
          </Figure>

          <h3>How four letters become that order</h3>
          <Explain plain="If you already know your four letters, here is how they turn into the stack above — one step at a time.">
            <p>
              The four-letter code does not name your functions directly. It names an attitude, a
              perceiving preference, a judging preference, and which of the two you show outwardly
              — and those four facts pin down the whole stack.
            </p>
          </Explain>

          <Figure
            label={`Worked through for ${t}.`}
            caption="Change the type at the top of the page and this rederives. Note the third step: the last letter describes what you show people, not what you lead with — which is why so many descriptions of J and P types get this backwards."
          >
            <LettersToStack type={t} />
          </Figure>

          <Figure
            label="The same order, worn as a face."
            caption={
              <>
                Every type in this app carries this mark: its four ego functions as beads,
                biggest first. Once you can read one molecule you can read all sixteen at a
                glance — the size says the rank, the colour says the function, and the ripples
                say which way it faces: crests breaking outward for e, inward for i.
              </>
            }
          >
            <div style={{ display: "flex", justifyContent: "center" }}>
              <TypeMolecule type={t} size={120} />
            </div>
          </Figure>

          <p>
            Change the top two and you get a different one of the sixteen. That is all a type is:
            an order.
          </p>
        </>
      );
    },
    check: "What is at the top of your stack, and what is at the bottom?",
  },

  {
    slug: "ego",
    title: "Your top four",
    blurb: "Lead, Support, Delight, Cave — the four you experience as yourself.",
    body: (t) => {
      const st = stack(t);
      return (
        <>
          <Explain big plain={CONCEPT_PLAIN.ego}>
            <p>
              The ego block. Slots 1–4 carry the archetypes Lead, Support, Delight and
              Cave; the Cave is simultaneously the weakest conscious function
              and the one carrying the most developmental charge.
            </p>
          </Explain>

          <div className="grid g2" style={{ marginTop: "var(--s5)" }}>
            {SLOT_NAMES.slice(0, 4).map((name, i) => (
              <Panel key={name} title={`${i + 1}. ${name}`}>
                <p style={{ fontSize: "var(--t-base)", marginBottom: "var(--s2)" }}>
                  {SLOT_PLAIN[name]}
                </p>
                <p className="small muted" style={{ margin: 0 }}>
                  For {t}: <b className="mono">{st[i]}</b> — {FN_PLAIN[st[i]].split(".")[0]}.
                </p>
              </Panel>
            ))}
          </div>

          <p className="note warn" style={{ marginTop: "var(--s5)" }}>
            The <b>Cave</b> is the one to remember. It is the thing you most want to be good
            at and quietly fear you are not — and almost everything about growth, later in this
            course, runs through it.
          </p>
        </>
      );
    },
    check: "Which of your top four do you avoid because it feels like work rather than fun?",
  },

  {
    slug: "shadow",
    title: "Your bottom four",
    blurb: "Doubt, Scold, Blind spot, Dread — the ones that run without your permission.",
    body: (t) => {
      const st = stack(t);
      return (
        <>
          <Explain
            big
            plain="The bottom four still run. They just do not feel like you doing something — they feel like something happening to you. This is where worry, cynicism, blind spots and your worst behaviour live."
          >
            <p>
              The shadow block. Each shadow seat is the attitude-flip of its ego counterpart:
              the Doubt is the Lead&rsquo;s function in the opposite attitude, and so on down.
              They are not lesser functions, they are the same functions running unsupervised.
            </p>
          </Explain>

          <Figure
            label="Seat 5, located."
            caption="The Doubt is seat 1's twin: the same tool, facing the other way. Every shadow seat pairs off across the divide like this — 1 with 5, 2 with 6, 3 with 7, 4 with 8."
          >
            <SeatFigure depth={4} />
          </Figure>

          <div className="grid g2" style={{ marginTop: "var(--s5)" }}>
            {SLOT_NAMES.slice(4).map((name, i) => (
              <Panel key={name} title={`${i + 5}. ${name}`}>
                <p style={{ fontSize: "var(--t-base)", marginBottom: "var(--s2)" }}>
                  {SLOT_PLAIN[name]}
                </p>
                <p className="small muted" style={{ margin: 0 }}>
                  For {t}: <b className="mono">{st[i + 4]}</b>
                </p>
              </Panel>
            ))}
          </div>

          <p style={{ marginTop: "var(--s5)" }}>
            The useful one to spot in yourself is the <b>Blind spot</b>. You genuinely cannot see
            it, and the tell is that you will bluff fluency rather than admit it.
          </p>
        </>
      );
    },
    check: "Can you think of a time you confidently agreed to something you did not actually understand?",
  },

  {
    slug: "powers",
    title: "Superpower and kryptonite",
    blurb: "The same two seats from the last two stages — Lead and Dread — asked one question each.",
    body: (t) => {
      const { superpower, kryptonite } = powersOf(t);
      return (
        <>
          <Explain big plain={powersPlain(t, superpower.fn, kryptonite.fn)}>
            <p>
              No new data — this is the Lead from &ldquo;Your top four&rdquo; and the Dread from
              &ldquo;Your bottom four&rdquo;, read through one question each: what runs so strong
              it looks involuntary, and what one setting undoes it. If you can find someone&rsquo;s
              Lead and Dread, you already know both.
            </p>
          </Explain>

          <div className="grid g2" style={{ marginTop: "var(--s5)" }}>
            <Panel title="Superpower">
              <div style={{ display: "flex", gap: "var(--s3)", alignItems: "center", marginBottom: "var(--s2)" }}>
                <FnIcon fn={superpower.fn} size={44} />
                <div>
                  <b className="mono" style={{ fontSize: "var(--t-lg)" }}>{superpower.fn}</b>
                  <p className="small muted" style={{ margin: 0 }}>{superpower.role} · wants {superpower.wants.toLowerCase()}</p>
                </div>
              </div>
              <p style={{ marginBottom: 0 }}>{superpower.what}</p>
            </Panel>

            <Panel title="Kryptonite">
              <div style={{ display: "flex", gap: "var(--s3)", alignItems: "center", marginBottom: "var(--s2)" }}>
                <FnIcon fn={kryptonite.fn} size={44} />
                <div>
                  <b className="mono" style={{ fontSize: "var(--t-lg)" }}>{kryptonite.fn}</b>
                  <p className="small muted" style={{ margin: 0 }}>{t}&rsquo;s Dread — rarely on</p>
                </div>
              </div>
              <p style={{ marginBottom: 0 }}>{kryptonite.shadow}</p>
            </Panel>
          </div>

          <p className="note warn" style={{ marginTop: "var(--s5)" }}>
            Same asymmetry either way you look: the Lead is overused because it works, so it
            crowds out the other seven. The Dread is underused because it is undeveloped, so on
            the rare occasion life forces it open, nothing has been practised there — it comes out
            as the worst version of that function rather than a usable one.
          </p>
        </>
      );
    },
    check: "Without looking: what is your worked example's superpower, and what is its kryptonite?",
  },

  {
    slug: "four-sides",
    title: "Four sides of the mind",
    blurb: "Those eight seats are really four types. You are all four of them.",
    body: (t) => {
      const s = sides(t);
      return (
        <>
          <Explain
            big
            plain="Split those eight seats into four groups of four, and each group is itself one of the sixteen types. So you are not one type. You are four, and you move between them."
          >
            <p>
              The four sides. The subconscious is the ego stack reversed; the
              unconscious is the shadow block read forwards; the superego is the shadow reversed.
              Because the three moves that generate the relation table also generate the
              sides, each side stands in a fixed relation to the ego — your subconscious is
              literally your <Term id="rel-du">Counterpart</Term>, your unconscious your{" "}
              <Term id="rel-ex">Damper</Term> partner, and your superego your{" "}
              <Term id="rel-se">Standoff</Term> partner.
            </p>
          </Explain>

          <Figure
            label="The same eight functions, sorted four ways."
            caption={
              <>
                Look at what moves. Your <b>Cave</b> is the subconscious&rsquo;s Lead, and your{" "}
                <b>Dread</b> is the superego&rsquo;s Lead. The thing you are worst at is the thing
                another side of you leads with — which is exactly why those sides feel like
                someone else.
              </>
            }
          >
            <FourSidesDiagram type={t} />
          </Figure>

          <Figure
            label="Four doors, one gateway seat each."
            caption={
              <>
                Every side is entered through one seat of your own stack — named on each
                door&rsquo;s lintel. The ego stands open; the subconscious is ajar behind
                insecurity; the unconscious cracked behind worry; the superego barred, and best
                left so until the others are developed.
              </>
            }
          >
            <div className="cluster" style={{ gap: "var(--s5)", alignItems: "flex-end", justifyContent: "center" }}>
              {SIDE_ORDER.map((k) => (
                <div key={k} style={{ textAlign: "center" }}>
                  <SideDoor side={k} gate={s[k].gateway.egoSlot} />
                  <span className="small muted">{s[k].name}</span>
                </div>
              ))}
            </div>
          </Figure>

          <div className="grid g2">
            {SIDE_ORDER.filter((k) => k !== "ego").map((k) => (
              <Panel key={k} title={s[k].name}>
                <Row k="Way in" v={<b className="mono">{s[k].gateway.fn}</b>} />
                <Row k="What blocks it" v={<span className="small">{s[k].blockedBy.split(".")[0]}</span>} />
                <Row k="What it pays" v={<span className="small">{s[k].produces}</span>} />
              </Panel>
            ))}
          </div>

          <p className="small">
            This is the concept. <Link to={`/sides/${t}`}>The full field guide</Link> works
            through how to assess, enter, operate, avoid and interact with each of these four —
            in far more depth than fits here, especially for the superego.
          </p>
        </>
      );
    },
    check: "Which of the four sides do you think you spend the most time in besides your ego?",
  },

  {
    slug: "growth",
    title: "Gateways, and the two crises",
    blurb: "Each side has one door, and each door is guarded by something unpleasant.",
    body: (t) => {
      const s = sides(t);
      return (
        <>
          <Explain big plain={CONCEPT_PLAIN.gateway}>
            <p>
              Four gateway functions: Lead into the ego, Cave into the subconscious, Doubt
              into the unconscious, Dread into the superego. Development is the deliberate
              conversion of a gateway from a defended position into an aspirational one.
            </p>
          </Explain>

          <p>
            The order matters. You do not get to skip to the interesting one.
          </p>

          {SIDE_ORDER.filter((k) => k !== "ego").map((k) => (
            <Panel key={k} title={`Into the ${s[k].name.toLowerCase()} — through ${s[k].gateway.fn}`} style={{ marginBottom: "var(--s4)" }}>
              <p style={{ fontSize: "var(--t-base)" }}>{s[k].plain}</p>
              <Row k="Blocked by" v={<span className="small">{s[k].blockedBy}</span>} stacked />
              <Row k="Opens with" v={<span className="small">{s[k].opensWith}</span>} stacked />
              <Row k="If you do not" v={<span className="small">{s[k].forced}</span>} stacked />
            </Panel>
          ))}

          <p className="note warn">
            The two crises are the same mechanism. A <b>midlife crisis</b> is the subconscious
            being forced open because it was never opened on purpose; a{" "}
            <b>three-quarter-life crisis</b> is the unconscious doing the same thing later. Both
            are avoidable, and the way to avoid them is boring: get good at the thing you are
            afraid of, slowly, on purpose.
          </p>
        </>
      );
    },
    check: "What is your Cave function, and what would practising it deliberately actually look like this week?",
  },

  {
    slug: "exchange",
    title: "The exchange overlay",
    blurb: "A second reading of the same four functions: two you trust, two you do not.",
    body: (t) => {
      const o = ops(t);
      return (
        <>
          <Explain
            big
            plain="This overlay looks at the same top four functions and asks a different question: which two do you trust so completely you never think about them, and which two make you nervous?"
          >
            <p>
              It splits the ego block into two <Term id="savior">anchors</Term> and two{" "}
              <Term id="flinch">flinches</Term>. The flinches are the axis opposites of the
              anchors, which places them at Delight and Cave — the overlay does not reach
              into the shadow block at all.
            </p>
          </Explain>

          <div className="grid g2" style={{ marginTop: "var(--s5)" }}>
            <Panel title={`Anchors — ${o.saviorObs} and ${o.saviorDec}`}>
              <p style={{ fontSize: "var(--t-base)", margin: 0 }}>{CONCEPT_PLAIN.savior}</p>
            </Panel>
            <Panel title={`Flinches — ${o.demonObs} and ${o.demonDec}`}>
              <p style={{ fontSize: "var(--t-base)", margin: 0 }}>{CONCEPT_PLAIN.demon}</p>
            </Panel>
          </div>

          <h3>The four animals</h3>
          <Explain plain={CONCEPT_PLAIN.animal}>
            <p>
              Each current pairs one observer attitude with one decider attitude.{" "}
              <b>Charge</b> (Oe+De) and <b>Settle</b> (Oi+Di) move energy;{" "}
              <b>Broadcast</b> (Oi+De) and <b>Absorb</b> (Oe+Di) move information.
            </p>
          </Explain>

          <Figure
            label="What each current does with the world."
            caption={
              <>
                Arrows in = taking in; arrows out = sharing; the loop = processing alone.{" "}
                <b>Absorb</b> takes in more than it shares, <b>Broadcast</b> shares more than it
                takes in, <b>Charge</b> is live exchange, <b>Settle</b> is the closed loop.
              </>
            }
          >
            <div className="cluster" style={{ gap: "var(--s5)", alignItems: "flex-end", justifyContent: "center" }}>
              {(["Consume", "Blast", "Play", "Sleep"] as const).map((a) => (
                <div key={a} style={{ width: 118, textAlign: "center" }}>
                  <AnimalGlyph animal={a} />
                  <span className="small muted">{ANIMAL_LABEL[a]}</span>
                </div>
              ))}
            </div>
          </Figure>

          <Figure
            label="Your animals, in order."
            caption={
              <>
                The first and last are fixed by your type. The middle two are genuinely open —
                that ordering is its own switch, so this app leaves it blank rather than guessing.
                Set it on the type page if you know yours.
              </>
            }
          >
            <AnimalStack sig={o} />
          </Figure>

          <p className="note">
            The two readings are <b>not</b> reconciled here, on purpose. They count the parts of
            a mind differently and give different growth advice for the same person. Where they
            disagree, this app shows both rather than averaging them into a single number that
            hides the disagreement.
          </p>
        </>
      );
    },
    check: "Which of your two anchors do you reach for first when something goes wrong?",
  },

  {
    slug: "quadras",
    title: "Clubs and temperaments",
    blurb: "Four groups of four who share a sense of humour and an unspoken rulebook.",
    body: (t) => (
      <>
        <Explain big plain={CONCEPT_PLAIN.quadra}>
          <p>
            A quadra is the set of four types sharing the same four ego functions in any
            arrangement. Members share valued elements, so what one finds obvious the others do
            not need explained.
          </p>
        </Explain>

        <Figure
          label="Four value clubs over eight functions."
          caption={
            <>
              Yours is picked out. Read down the columns: two quadras sharing a function pair —
              Alpha and Delta on <b>Ne/Si</b>, Alpha and Beta on <b>Ti/Fe</b> — feel adjacent;
              two sharing nothing feel opposite. The feeling of &ldquo;my people&rdquo; has a
              structure.
            </>
          }
        >
          <QuadraFunctionGrid highlight={quadra(t)} />
        </Figure>

        <div className="grid g2" style={{ marginTop: "var(--s5)" }}>
          {(["Alpha", "Beta", "Gamma", "Delta"] as const).map((q) => (
            <Panel key={q} title={<><Term>{q}</Term>{quadra(t) === q ? " — yours" : ""}</>}>
              <p style={{ fontSize: "var(--t-base)", margin: 0 }}>{QUADRA_PLAIN[q]}</p>
            </Panel>
          ))}
        </div>

        <p style={{ marginTop: "var(--s5)" }}>
          This is the cheapest useful prediction in the whole system: people in your quadra will
          feel easy in a way you cannot quite account for, and people in the opposite one will
          feel like hard work even when everyone is being perfectly nice.
        </p>
      </>
    ),
    check: "Think of a group where you felt instantly at home. Any guess which quadra it was?",
  },

  {
    slug: "relations",
    title: "When two wirings meet",
    blurb: "Sixteen ways two people can fit — and it is not the same number in both directions.",
    body: (t) => (
      <>
        <Explain
          big
          plain="Line up two stacks and look at where each person's strongest function lands in the other's. That landing spot predicts almost everything about how the pair feels."
        >
          <p>
            Each of the sixteen relation codes is one of sixteen operators applied to the
            (dominant, auxiliary) pair. That gives 256 ordered relations, and every ease score
            and playbook in this app is computed from them.
          </p>
        </Explain>

        <p>
          If your strongest function lands on their <b>Delight</b>, they light up. If it lands on
          their <b>Cave</b>, they get defensive. Same behaviour from you, opposite result —
          and you will not be able to tell which is happening without knowing the wiring.
        </p>

        <Figure
          minWidth={480}
          label="The landing, drawn."
          caption={
            <>
              {t} being read by INFJ — the pair the button below opens. The arrows are INFJ&rsquo;s
              Lead and Support arriving in {t}&rsquo;s stack; the lit rows are where they land.
              Every one of the 256 relations is this same picture with different landing spots.
            </>
          }
        >
          <RelationLanding a={t} b="INFJ" />
        </Figure>

        <Panel title="Three worth knowing" style={{ marginTop: "var(--s5)" }}>
          <Row stacked k={<Term id="rel-du">Counterpart</Term>} v={<span className="small">{REL_PLAIN.DU}</span>} />
          <Row stacked k={<Term id="rel-sr">Examiner</Term>} v={<span className="small">{REL_PLAIN.SR}</span>} />
          <Row stacked k={<Term id="rel-cf">Conflict</Term>} v={<span className="small">{REL_PLAIN.CF}</span>} />
        </Panel>

        <p className="note warn" style={{ marginTop: "var(--s5)" }}>
          <b>{CONCEPT_PLAIN.directional}</b> Four of the sixteen relations are asymmetric, so a
          single compatibility number would hide the most useful thing on the page. Every pair in
          this app shows both directions.
        </p>

        <p>
          <Link to={`/pair/${t}/INFJ`} className="btn">Open a pair reading →</Link>
        </p>
      </>
    ),
    check: "Why can a relationship feel easy to one person and like hard work to the other?",
  },

  {
    slug: "bonds",
    title: "The pairings that work",
    blurb: "Strip the four letters away and only eight pairings are left — four bonds, four meshes.",
    body: (t) => {
      const lead = stack(t)[0];
      const partner = omega[lead];
      const spark = sparkFacts().find((f) => f.quadra === quadra(t))!;
      const meshFns = [...stack(spark.outward[0]).slice(0, 2), ...stack(spark.outward[1]).slice(0, 2)] as [Fn, Fn, Fn, Fn];
      return (
        <>
          <Explain
            big
            plain="Who works well with whom is not really about types. It is about which tool answers which — and there are only eight pairings of tools that work. Everything the last stage scored well is one of them, wearing four letters."
          >
            <p>
              Sweep all 240 ordered pairs of distinct types and group them by which two Leads
              meet: the four axis pairings — Lead meets Lead across an axis — average{" "}
              {Math.round(bondFacts()[0].mean)} of 100, far above every other class. The other
              shape that works runs crosswise: each Lead answered by the other person&rsquo;s
              Support, which is exactly the Spark relation, and exactly one such mesh exists per
              Camp.
            </p>
          </Explain>

          <Figure
            label="Your Lead's own bond."
            caption={
              <>
                Your Lead is <FnTag fn={lead} disc />, so the tool that answers it is{" "}
                <FnTag fn={partner} disc /> — each is exactly what the other does not do.
                Whoever leads {lead} carries {partner} in the Cave, and the reverse: each
                raises what the other skipped. This holds for anyone who leads {lead},
                whatever their other letters.
              </>
            }
          >
            <AxisBondFigure a={lead} b={partner} />
          </Figure>

          <Figure
            label="Your Camp's one mesh."
            caption={
              <>
                Lead does not meet Lead here — the lines cross: each Lead is answered by the{" "}
                <i>other</i> side&rsquo;s Support. Both crossings at once is the Spark relation
                (ease {spark.ease} both ways); one crossing alone tilts the pair into Upstream
                or Downstream. A Counterpart rests; a Spark runs.
              </>
            }
          >
            <SparkMeshFigure fns={meshFns} />
          </Figure>

          <p>
            <Link to="/bonds" className="btn">All eight, with the numbers →</Link>
          </p>
        </>
      );
    },
    check: "Your best pairings share one mechanism. Is it your Lead being answered — and by what?",
  },

  {
    slug: "groups",
    title: "More than two",
    blurb: "A team is a weighted graph. That makes questions a grid cannot answer into arithmetic.",
    body: (t) => (
      <>
        <Explain
          big
          plain="Once you can score any two people in both directions, a group of six is just thirty numbers. That turns vague questions — who is struggling, who is quietly holding it together — into something you can actually compute."
        >
          <p>
            An n-person group is a weighted directed graph over the ease matrix. The network view
            reports mean ease, the weakest and strongest directed edges, Examiner chains, and
            which single addition would most raise the mean.
          </p>
        </Explain>

        <p>
          The one to watch for is an <b>Examiner chain</b>: an asymmetric edge where one person
          keeps landing corrections they do not know they are issuing. It is the most common
          cause of a team where one person is quietly always slightly wrong.
        </p>

        {(() => {
          const sup = TYPES.find((x) => REL[t][x] === "SR")!;
          return (
            <Figure
              label="One asymmetric edge, drawn."
              caption={
                <>
                  {sup} examines {t}: the same relationship costs the two of them different
                  amounts, and the diverging bars are that fact. In a group view every line
                  carries two of these numbers — the graph is made of edges like this one.
                </>
              }
            >
              <DivergingEase
                toward={ease(t, sup)}
                from={ease(sup, t)}
                labels={[`${t} being around ${sup}`, `${sup} being around ${t}`]}
              />
            </Figure>
          );
        })()}

        <p className="note">
          A last word before you go and use this on people. This is a lens, not a measurement.
          It describes how wiring tends to mesh — not who is capable, who is good, or who to
          hire, date or forgive. If you find yourself using it to make a decision that deserves
          more than a lens, use more than a lens.
        </p>

        <p style={{ marginTop: "var(--s5)" }}>
          <Link to="/network" className="btn primary">Compose a group →</Link>
        </p>
      </>
    ),
    check: "Who in a group you are part of might be on the receiving end of an Examiner edge?",
  },

  {
    slug: "octagram",
    title: "The Octagram — the wheels",
    blurb: "The advanced layer begins: what your wiring has been chasing, and the wheel it shares.",
    body: (t) => {
      const w = wheelOf(t);
      const temple = templeOf(t);
      return (
        <>
          <Explain big plain={CONCEPT_PLAIN.octagram}>
            <p>
              Everything up to here has been structural: the same sixteen wirings for everybody,
              derived from four bits. The Octagram adds the two things structure cannot give you —
              a lifelong <Term id="cognitive-origin">cognitive origin</Term>, and the mark a
              particular upbringing left on how that origin gets pursued. It is the hardest
              material in the app, so it gets two stages: this one is the structure, the next is
              the childhood.
            </p>
          </Explain>

          <p className="note">
            Read these two last, and read them lightly. This layer is newer and less settled than
            anything before it, and the app says explicitly where the sourcing runs thin rather
            than smoothing over it.
          </p>

          <h3>One: eight wheels, not sixteen</h3>
          <p>
            You do not get your own origin. You share one with your{" "}
            <Term id="subconscious">subconscious</Term> — the type you become when you develop
            through your <Term id="inferior">Cave</Term>, which is also your{" "}
            <Term id="rel-du">Counterpart</Term>. Sixteen types, paired off, make eight. Two of those
            wheels make a <Term id="temple">temple</Term>, and a temple turns out to be exactly the
            four sides of one mind: your ego, your subconscious, your unconscious and your superego
            are all in it. That is why the picture has eight points and four arcs.
          </p>

          <p>
            Yours is the <b>{temple.name}</b> temple — {temple.plain.toLowerCase()} The other three
            types in it are the three you already met as your four sides:{" "}
            {temple.types.filter((x) => x !== t).join(", ")}.
          </p>

          <Figure
            minWidth={560}
            label="The Octagram."
            caption="Eight origins around the ring, two per temple. Your temple is picked out. Nothing in this diagram is a lookup table — the eight pairs and the four groups are computed from the four-sides operation, and they match the published ones exactly."
          >
            <OctagramMap highlight={t} />
          </Figure>

          <h3>Two: what a wheel says</h3>
          <p>
            The thing you want sits in the middle. Straight up is the honest way to get it — and
            it is always the expensive way, usually involving giving somebody else some of what you
            are short of. Straight down is the counterfeit: faster, convincing, and it leaves you
            hungrier. Left and right are not good and bad. They are the two ways people actually
            drift, and which one you drift toward was decided a long time ago.
          </p>

          <Figure
            label={`${t}'s wheel: ${w.origin}.`}
            caption={`${w.pair.join(" and ")} share this one. ${w.originPlain}`}
          >
            <OctagramWheel wheel={w} />
          </Figure>

          <div className="grid g2" style={{ marginTop: "var(--s5)" }}>
            <Panel title={`Living virtue — ${w.livingVirtue}`}>
              <p className="small" style={{ margin: 0 }}>{w.virtuePlain}</p>
            </Panel>
            <Panel title={`Deadly sin — ${w.deadlySin}`}>
              <p className="small" style={{ margin: 0 }}>{w.sinPlain}</p>
            </Panel>
          </div>

          <p style={{ marginTop: "var(--s4)" }}>
            The eight sins are worth a second look: <b>Wrath, Lust, Envy, Vainglory, Sloth, Pride,
            Gluttony, Greed</b> — the classical eight, one per wheel, each paired with its
            traditional contrary virtue. That is not a coincidence anyone has to take on trust; it
            is a check. A garbled table would not land on that set.
          </p>
        </>
      );
    },
    check:
      "What is your origin, and can you name a time you reached for the counterfeit version of it instead?",
  },

  {
    slug: "octagram-theme",
    title: "The Octagram — your childhood",
    blurb: "The second layer: what being fed or denied early did to how you chase what you want.",
    body: (t) => {
      const w = wheelOf(t);
      return (
        <>
          <Explain
            big
            plain="The wheel said what you want and the honest way to get it. This layer says what your particular childhood did to how you go about it — and no four-letter type can tell you that."
          >
            <p>
              Two switches, and neither is readable off the type. They are self-reported in the same
              posture as the subtype switches: nothing here changes a relation, a score or a
              playbook.
            </p>
          </Explain>

          <p>
            The first is{" "}
            <Term id="subconscious-development">development</Term>: was the subconscious side of
            you fed when you were small, or denied? It is set early and it mostly stays put. The
            second is <Term id="octagram-focus">focus</Term>: which half of you is doing the work
            right now. That one moves, and moving it is what the whole growth stage was about.
          </p>

          <Figure
            label="The four themes."
            caption="Development down the side, focus across the top. Everyone has lived in all four. None of them is a verdict — the winter one least of all."
          >
            <ThemeSeasons />
          </Figure>

          <p>
            Development also decides which side of the wheel you drift toward: fed early and you
            lean to the <Term id="aspirational-pole">aspirational pole</Term>, denied and you lean
            to the <Term id="shadow-pole">shadow pole</Term>. Both are distortions of the same
            want. Being given what you needed is not the same as coming out undamaged — it just
            damages differently.
          </p>

          <div className="grid g2" style={{ marginTop: "var(--s4)" }}>
            <Panel title={`Shadow pole — ${w.shadowPole}`}>
              <p className="small" style={{ margin: 0 }}>{w.shadowPlain}</p>
            </Panel>
            <Panel title={`Aspirational pole — ${w.aspirationalPole}`}>
              <p className="small" style={{ margin: 0 }}>{w.aspirationalPlain}</p>
            </Panel>
          </div>

          <p className="note warn" style={{ marginTop: "var(--s5)" }}>
            <b>What this app does not know.</b> The wheel memberships are derived and verified. The
            origins, virtues and sins are well sourced. Which of the two poles is the shadow and
            which the aspirational is <i>not</i> equally certain — published summaries disagree, and
            only two wheels of eight could be cross-checked. It is presented rather than asserted,
            and the gap is written down in the code alongside two others.
          </p>

          <p style={{ marginTop: "var(--s5)" }}>
            <Link to={`/type/${t}#octagram`} className="btn primary">
              See {t}&rsquo;s full Octagram →
            </Link>
          </p>
        </>
      );
    },
    check:
      "Which of the four themes are you living in right now — and which pole of your wheel does your development lean you toward?",
  },

  {
    slug: "borrowed-wiring",
    title: "Borrowed wiring",
    blurb:
      "Knowing where you land in someone else's stack is half of this skill. Running a function that isn't natively yours is the other half — and it is not free.",
    body: (t) => {
      const st = stack(t);
      const s = sides(t);
      const b = BEHAVIOURAL[t];
      return (
        <>
          <Explain
            big
            plain="Everything so far described your own wiring. This stage turns it outward: reading someone else on purpose, and — the harder half — running a function that is not natively yours."
          >
            <p>
              The app already composes a full approach for every one of the 256 ordered pairs,
              from where your Lead and Support land in the other stack. That composition is not
              new machinery — it is the same landing operation from the relations stage, read as
              instruction instead of description.
            </p>
          </Explain>

          <h3>One: reading — the paragraph the app already writes</h3>
          <Figure
            minWidth={480}
            label="The same picture as the relations stage, now with the paragraph it produces."
            caption={
              <>
                INFJ reading {t} — the same pairing as before. The arrows are INFJ&rsquo;s Lead and
                Support arriving in {t}&rsquo;s stack; the panel below is composed from exactly
                this picture.
              </>
            }
          >
            <RelationLanding a={t} b="INFJ" />
          </Figure>

          <Panel title="What the app writes from that picture">
            <p style={{ margin: 0 }}>{playbook("INFJ", t)}</p>
          </Panel>

          <Panel title={`${t}, read`} style={{ marginTop: "var(--s4)" }}>
            <Row stacked k="What moves them" v={<span className="small">{b.persuasionTrigger}</span>} />
            <Row stacked k="How to build rapport" v={<span className="small">{b.rapportBuilder}</span>} />
            <Row stacked k="How to earn trust" v={<span className="small">{b.trustBuilder}</span>} />
            <Row stacked k="Under disagreement" v={<span className="small">{b.conflictStyle}</span>} />
          </Panel>

          <p className="note warn" style={{ marginTop: "var(--s5)" }}>
            <b>This is the most ethically loaded page in the course.</b> Everything above is the
            difference between rapport and manipulation, and the difference was never the
            technique — it is whether the other person would still choose it if they could see
            what you were doing. Use this to understand people. The moment you are hiding your
            reasoning from the person you are reading, you have crossed the line.
          </p>

          <h3>Two: performing — what it costs to run someone else&rsquo;s function</h3>
          <p>
            Every function you have is already sitting at one of your own eight seats. Performing
            one that sits near the top costs almost nothing, because it is already close to who
            you are. Performing one near the bottom is a real, measurable strain.
          </p>

          <div className="grid g2" style={{ marginTop: "var(--s4)" }}>
            {SLOT_NAMES.map((name, i) => (
              <Panel key={name} title={`${name} — ${st[i]}`}>
                <p className="small" style={{ margin: 0 }}>{SLOT_COST[name]}</p>
              </Panel>
            ))}
          </div>

          <p className="note warn">
            <b>Sustain the last one and you are not performing any more.</b> Your{" "}
            <Term id="superego">superego</Term> is exactly this mechanism, run too long: its Lead
            is your own Dread. {s.superego.undeveloped} What starts as an act stops being one.
          </p>

          <h3>Spotting a performance in someone else</h3>
          <p className="small">
            The tell is rarely the function itself — it is what the person says about doing it.
          </p>
          <div className="grid g2">
            {DEMON_MARKERS.map((m) => (
              <Row
                key={m.name}
                stacked
                k={<span><b>{m.name}</b> — &ldquo;{m.says}&rdquo;</span>}
                v={<span className="small">{m.note}</span>}
              />
            ))}
          </div>

          <p className="note">
            None of this second half is sourced against the ingested material the way the rest of
            the course is. It is written for this stage, presented as a reasoned extension of what
            the engine already computes — not as settled fact.
          </p>
        </>
      );
    },
    check:
      "Name a function you can already perform even though it isn't your own Lead. Which of your own eight seats does it sit in — and what would it actually cost to keep running it for a whole day?",
  },
];

/** Position of a stage by slug, or 0 if it is not a real stage. */
export const stageIndex = (slug?: string) =>
  Math.max(0, STAGES.findIndex((s) => s.slug === slug));
