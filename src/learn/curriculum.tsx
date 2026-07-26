import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { stack, quadra } from "../engine/core";
import { ops } from "../engine/ops";
import { sides, SIDE_ORDER } from "../engine/sides";
import { wheelOf, templeOf } from "../engine/octagram";
import { FN_PLAIN, SLOT_PLAIN, CONCEPT_PLAIN, REL_PLAIN, QUADRA_PLAIN } from "../engine/plain";
import { FN_ROLE, FN_KEYWORD, FN_SAYS } from "../engine/functions";
import { SLOT_NAMES, FN_FULL, type Fn, type MbtiType } from "../engine/data";
import Explain from "../components/Explain";
import Figure from "../components/Figure";
import WiringSchematic from "../components/WiringSchematic";
import FunctionTree from "../components/FunctionTree";
import LettersToStack from "../components/LettersToStack";
import FourSidesDiagram from "../components/FourSidesDiagram";
import AnimalStack from "../components/AnimalStack";
import OctagramMap from "../components/OctagramMap";
import OctagramWheel from "../components/OctagramWheel";
import ThemeSeasons from "../components/ThemeSeasons";
import { Panel, Row } from "../components/Bits";
import Term from "../components/Term";

/* ------------------------------------------------------------------ *
 * The course.
 *
 * Ten stages, each one assuming only what the previous ones taught. The
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
            Jung&rsquo;s eight cognitive functions: four perceiving (Ne, Ni, Se, Si) and four
            judging (Te, Ti, Fe, Fi), each in an extraverted or introverted attitude. This app
            treats them as the eight information elements, and the whole model is three
            involutions over them.
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
          label="Three splits, eight results."
          caption="Read downward. Each level is one binary choice, and the eight at the bottom are every combination of them — which is why the list is exactly this long."
        >
          <FunctionTree />
        </Figure>

        <h3>What each one sounds like</h3>
        <p>
          The fastest way to spot these in real life is not to analyse someone — it is to notice
          what they say.
        </p>

        <div className="grid g2">
          {FNS.map((f) => (
            <div key={f} className="row stacked">
              <dt>
                <Term>{f}</Term> · {FN_ROLE[f]} · {FN_KEYWORD[f]}
              </dt>
              <dd className="small">
                &ldquo;{FN_SAYS[f][0]}&rdquo; &middot; &ldquo;{FN_SAYS[f][1]}&rdquo;
              </dd>
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
              The eight-slot stack is generated, not listed. Given a dominant and an auxiliary,
              the other six slots follow by applying the three involutions — so sixteen pairs
              produce sixteen complete stacks with no lookup table.
            </p>
          </Explain>

          <p>
            Here is <b>{t}</b>. The top one is effortless and slightly overused. The bottom one
            barely runs at all.
          </p>

          <Figure
            label="Read top to bottom."
            caption={
              <>
                Strongest at the top, weakest at the bottom. Slots 1–4 feel like &ldquo;me&rdquo;;
                slots 5–8 feel like things that happen to you. Everything else in this course is
                about those eight rows.
              </>
            }
          >
            <WiringSchematic type={t} />
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
    blurb: "Hero, Parent, Child, Inferior — the four you experience as yourself.",
    body: (t) => {
      const st = stack(t);
      return (
        <>
          <Explain big plain={CONCEPT_PLAIN.ego}>
            <p>
              The ego block, in Beebe&rsquo;s terms. Slots 1–4 carry the archetypes Hero, Parent,
              Child and Inferior; the Inferior is simultaneously the weakest conscious function
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
            The <b>Inferior</b> is the one to remember. It is the thing you most want to be good
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
    blurb: "Nemesis, Critic, Trickster, Demon — the ones that run without your permission.",
    body: (t) => {
      const st = stack(t);
      return (
        <>
          <Explain
            big
            plain="The bottom four still run. They just do not feel like you doing something — they feel like something happening to you. This is where worry, cynicism, blind spots and your worst behaviour live."
          >
            <p>
              The shadow block. Each shadow slot is the attitude-flip of its ego counterpart:
              the Nemesis is the Hero&rsquo;s function in the opposite attitude, and so on down.
              They are not lesser functions, they are the same functions running unsupervised.
            </p>
          </Explain>

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
            The useful one to spot in yourself is the <b>Trickster</b>. It is a genuine blind
            spot, and the tell is that you will bluff fluency rather than admit you cannot see it.
          </p>
        </>
      );
    },
    check: "Can you think of a time you confidently agreed to something you did not actually understand?",
  },

  {
    slug: "four-sides",
    title: "Four sides of the mind",
    blurb: "Those eight slots are really four types. You are all four of them.",
    body: (t) => {
      const s = sides(t);
      return (
        <>
          <Explain
            big
            plain="Split those eight slots into four groups of four, and each group is itself one of the sixteen types. So you are not one type. You are four, and you move between them."
          >
            <p>
              CS Joseph&rsquo;s four sides. The subconscious is the ego stack reversed; the
              unconscious is the shadow block read forwards; the superego is the shadow reversed.
              Because the three involutions that generate the relation table also generate the
              sides, each side stands in a fixed relation to the ego — your subconscious is
              literally your <Term id="rel-du">Dual</Term>, your unconscious your{" "}
              <Term id="rel-ex">Extinguishment</Term> partner, and your superego your{" "}
              <Term id="rel-se">Super-Ego</Term> partner.
            </p>
          </Explain>

          <Figure
            label="The same eight functions, sorted four ways."
            caption={
              <>
                Look at what moves. Your <b>Inferior</b> is the subconscious&rsquo;s Hero, and your{" "}
                <b>Demon</b> is the superego&rsquo;s Hero. The thing you are worst at is the thing
                another side of you leads with — which is exactly why those sides feel like
                someone else.
              </>
            }
          >
            <FourSidesDiagram type={t} />
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
              Four gateway functions: Hero into the ego, Inferior into the subconscious, Nemesis
              into the unconscious, Demon into the superego. Development is the deliberate
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
    check: "What is your Inferior function, and what would practising it deliberately actually look like this week?",
  },

  {
    slug: "ops",
    title: "The OPS overlay",
    blurb: "A second instrument reading the same four functions: two you trust, two you do not.",
    body: (t) => {
      const o = ops(t);
      return (
        <>
          <Explain
            big
            plain="Objective Personality looks at the same top four functions and asks a different question: which two do you trust so completely you never think about them, and which two make you nervous?"
          >
            <p>
              OPS splits the ego block into two <Term id="savior">saviors</Term> and two{" "}
              <Term id="demon-fn">demons</Term>. The demons are the Model A opposites of the
              saviors, which places them at the tertiary and inferior — OPS does not reach into
              the shadow block at all.
            </p>
          </Explain>

          <div className="grid g2" style={{ marginTop: "var(--s5)" }}>
            <Panel title={`Saviors — ${o.saviorObs} and ${o.saviorDec}`}>
              <p style={{ fontSize: "var(--t-base)", margin: 0 }}>{CONCEPT_PLAIN.savior}</p>
            </Panel>
            <Panel title={`Demons — ${o.demonObs} and ${o.demonDec}`}>
              <p style={{ fontSize: "var(--t-base)", margin: 0 }}>{CONCEPT_PLAIN.demon}</p>
            </Panel>
          </div>

          <h3>The four animals</h3>
          <Explain plain={CONCEPT_PLAIN.animal}>
            <p>
              Each animal pairs one observer attitude with one decider attitude.{" "}
              <b>Play</b> (Oe+De) and <b>Sleep</b> (Oi+Di) are the energy animals;{" "}
              <b>Blast</b> (Oi+De) and <b>Consume</b> (Oe+Di) are the information animals.
            </p>
          </Explain>

          <Figure
            label="Your animals, in order."
            caption={
              <>
                The first and last are fixed by your type. The middle two are genuinely open —
                OPS treats that ordering as its own coin, so this app leaves it blank rather than
                guessing. Set it on the type page if you know yours.
              </>
            }
          >
            <AnimalStack sig={o} />
          </Figure>

          <p className="note">
            CS Joseph and OPS are <b>not</b> reconciled here, on purpose. They count the parts of
            a mind differently and give different growth advice for the same person. Where they
            disagree, this app shows both rather than averaging them into something neither would
            recognise.
          </p>
        </>
      );
    },
    check: "Which of your two saviors do you reach for first when something goes wrong?",
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
          If your strongest function lands on their <b>Child</b>, they light up. If it lands on
          their <b>Inferior</b>, they get defensive. Same behaviour from you, opposite result —
          and you will not be able to tell which is happening without knowing the wiring.
        </p>

        <Panel title="Three worth knowing" style={{ marginTop: "var(--s5)" }}>
          <Row stacked k={<Term id="rel-du">Duality</Term>} v={<span className="small">{REL_PLAIN.DU}</span>} />
          <Row stacked k={<Term id="rel-sr">Supervision</Term>} v={<span className="small">{REL_PLAIN.SR}</span>} />
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
    slug: "groups",
    title: "More than two",
    blurb: "A team is a weighted graph. That makes questions a grid cannot answer into arithmetic.",
    body: () => (
      <>
        <Explain
          big
          plain="Once you can score any two people in both directions, a group of six is just thirty numbers. That turns vague questions — who is struggling, who is quietly holding it together — into something you can actually compute."
        >
          <p>
            An n-person group is a weighted directed graph over the ease matrix. The network view
            reports mean ease, the weakest and strongest directed edges, supervision chains, and
            which single addition would most raise the mean.
          </p>
        </Explain>

        <p>
          The one to watch for is a <b>supervision chain</b>: an asymmetric edge where one person
          keeps landing corrections they do not know they are issuing. It is the most common
          cause of a team where one person is quietly always slightly wrong.
        </p>

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
    check: "Who in a group you are part of might be on the receiving end of a supervision edge?",
  },

  {
    slug: "octagram",
    title: "The Octagram",
    blurb: "The advanced layer: what your wiring has been chasing, and what your childhood did to how you chase it.",
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
              material in the app, so this stage does one layer at a time.
            </p>
          </Explain>

          <p className="note">
            Read this stage last, and read it lightly. It is newer and less settled than anything
            before it, and the app says explicitly where the sourcing runs thin rather than
            smoothing over it.
          </p>

          <h3>One: eight wheels, not sixteen</h3>
          <p>
            You do not get your own origin. You share one with your{" "}
            <Term id="subconscious">subconscious</Term> — the type you become when you develop
            through your <Term id="inferior">Inferior</Term>, which is also your{" "}
            <Term id="rel-du">Dual</Term>. Sixteen types, paired off, make eight. Two of those
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

          <h3>Three: what your childhood did</h3>
          <p>
            Two coins, and neither is readable off a four-letter type. The first is{" "}
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
      "What is your origin, and can you name a time you reached for the counterfeit version of it instead?",
  },
];

/** Position of a stage by slug, or 0 if it is not a real stage. */
export const stageIndex = (slug?: string) =>
  Math.max(0, STAGES.findIndex((s) => s.slug === slug));
