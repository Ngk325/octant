import { Link, useNavigate, useParams } from "react-router";
import { sides, gateways, SIDE_ORDER, DREAD_TELLS, DREAD_DEESCALATE, type SideKey, type Side } from "../engine/sides";
import { TYPES, stack, type MbtiType } from "../engine/core";
import { usePublishContext } from "../chat/ChatContext";
import { readStored, writeStored } from "../storage";
import Explain from "../components/Explain";
import Figure from "../components/Figure";
import Term from "../components/Term";
import { Panel, Row, FnTag } from "../components/Bits";
import FourSidesDiagram from "../components/FourSidesDiagram";
import GatewayPath from "../components/GatewayPath";
import TypeMolecule from "../components/glyphs/TypeMolecule";

const TYPE_KEY = "sides.type";

const REL_TERM: Record<SideKey, { id: string; label: string } | null> = {
  ego: null,
  subconscious: { id: "rel-du", label: "Counterpart" },
  unconscious: { id: "rel-ex", label: "Damper" },
  superego: { id: "rel-se", label: "Super-Ego" },
};

/**
 * The field guide the concept pages point to but never were: for each of the four
 * sides, in the reader's own type, how to tell you're in it, how to get in on
 * purpose, how to operate once you're there, what happens if you never do, and how
 * to deal with someone else who is in it. The superego gets the most of all five,
 * because it is the one side where getting this wrong costs the most — and where
 * the popular shorthand ("who you are at your worst") quietly drops that it has a
 * developed pole at all.
 */
export default function Sides() {
  const { type: routeType } = useParams();
  const nav = useNavigate();

  const type: MbtiType = (TYPES.includes(routeType as MbtiType)
    ? (routeType as MbtiType)
    : readValidType());

  const setType = (t: MbtiType) => {
    writeStored(TYPE_KEY, t);
    nav(`/sides/${t}`, { replace: true });
  };

  const s = sides(type);
  const path = gateways(type);

  usePublishContext(() => ({ kind: "sides", type }), [type]);

  return (
    <>
      <h1>The four sides, in practice</h1>
      <p className="lede">
        The concept is one page elsewhere in the course. This is the rest of it — for each side,
        in your own wiring: how to tell you are in it, how to get in on purpose, how to operate
        once you are there, what happens if you never do, and how to deal with someone else who
        is in it. The superego gets the most detail of the four, on purpose.
      </p>

      <TypeSelect type={type} setType={setType} />

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
        <FourSidesDiagram type={type} />
      </Figure>

      <Figure
        label="One door each, in the order they open."
        caption={
          <>
            The order is not optional. Reaching the <Term id="superego">superego</Term>&rsquo;s
            door before the other three are developed is how it opens <i>you</i>, instead.
          </>
        }
      >
        <GatewayPath type={type} />
      </Figure>

      <nav className="cluster" aria-label="Jump to a side" style={{ margin: "var(--s5) 0" }}>
        {SIDE_ORDER.map((k) => (
          <a key={k} href={`#${k}`} className="chip">
            {s[k].name}
          </a>
        ))}
      </nav>

      {SIDE_ORDER.map((k, i) => (
        <SideSection key={k} side={s[k]} step={i + 1} type={type} />
      ))}

      <Panel title="Where this goes next" style={{ marginTop: "var(--s6)" }}>
        <Row
          stacked
          k="The order, worked as a path"
          v={<span className="small">
            {path.map((g, i) => `${i + 1}. ${s[g.side].name} through ${g.fn}`).join("  ·  ")}
          </span>}
        />
        <Row
          stacked
          k="The rest of this type"
          v={<span className="small">
            <Link to={`/type/${type}`}>The full {type} reader</Link> has the eight slots, the
            exchange overlay, the growth gate and the Octagram wheel this page assumes.
          </span>}
        />
        <Row
          stacked
          k="The concept, from the start"
          v={<span className="small">
            <Link to="/learn/four-sides">Four sides of the mind</Link> and{" "}
            <Link to="/learn/growth">Gateways, and the two crises</Link> in the course build up to
            this page from nothing.
          </span>}
        />
      </Panel>
    </>
  );
}

function readValidType(): MbtiType {
  const v = readStored(TYPE_KEY);
  return (TYPES.includes(v as MbtiType) ? v : "ENTP") as MbtiType;
}

function TypeSelect({ type, setType }: { type: MbtiType; setType(t: MbtiType): void }) {
  return (
    <p className="note" style={{ display: "flex", gap: "var(--s3)", alignItems: "center", flexWrap: "wrap" }}>
      <span aria-hidden="true" style={{ display: "flex", flex: "0 0 auto" }}>
        <TypeMolecule type={type} size={44} labels={false} />
      </span>
      <label className="small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <b style={{ fontFamily: "var(--sans)" }}>Your type</b>
        <select value={type} onChange={(e) => setType(e.target.value as MbtiType)} aria-label="Type">
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <span className="small muted">
        Every field below is specific to this type — the Dread that runs your superego is not the
        same function for everyone.
      </span>
    </p>
  );
}

/** One side, fully worked: the five practical facets, then developed vs undeveloped. */
function SideSection({ side, step, type }: {
  side: Side;
  step: number;
  type: MbtiType;
}) {
  const rel = REL_TERM[side.key];
  const dread = side.key === "superego" ? stack(type)[7] : null;

  return (
    <section id={side.key} className="sec" style={{ marginTop: "var(--s7)" }}>
      <h2 style={{ marginTop: 0 }}>
        <span className="mono muted" style={{ fontSize: "var(--t-sm)", marginRight: 8 }}>
          {String(step).padStart(2, "0")}
        </span>
        {side.name}
        <Link to={`/type/${side.type}`} className="chip mono" style={{ marginLeft: 10 }}>
          {side.type}
        </Link>
        {rel && (
          <span className="small muted" style={{ marginLeft: 10 }}>
            your <Term id={rel.id}>{rel.label}</Term>
          </span>
        )}
      </h2>

      <Explain big plain={side.plain}>
        <p>{side.what}</p>
      </Explain>

      {side.key === "superego" && (
        <p className="note warn">
          <b style={{ fontFamily: "var(--sans)" }}>Read this one first, and slowest.</b> It is the
          only side where going in deliberately before the other three are developed is a worse
          outcome than never going in at all. Everything below assumes the other three sides are
          getting real attention, not that this one is being skipped to.
        </p>
      )}

      <div className="grid g2" style={{ gap: "var(--s4)" }}>
        <Panel title="Assess — how to tell you're here">
          <p className="small" style={{ margin: 0 }}>{side.assess}</p>
        </Panel>
        <Panel title="Enter — the way in, on purpose">
          <p className="small" style={{ margin: 0 }}>{side.opensWith}</p>
          <Row
            k="Door"
            v={<span><FnTag fn={side.gateway.fn} />{side.key !== "ego" && <span className="small"> — your {side.gateway.egoSlot}</span>}</span>}
            stacked
          />
        </Panel>
        <Panel title="Operate — once you're there">
          <p className="small" style={{ margin: 0 }}>{side.atWill}</p>
          <Row k="What it pays out" v={<span className="small">{side.produces}</span>} stacked />
        </Panel>
        <Panel title="Avoid — the cost of never going in on purpose">
          <p className="small" style={{ margin: 0 }}>{side.forced}</p>
        </Panel>
      </div>

      <Panel title="Interact — spotting it in someone else, and what actually helps" style={{ marginTop: "var(--s4)" }}>
        <p className="small" style={{ margin: 0 }}>{side.interact}</p>
      </Panel>

      {side.key === "superego" && dread && (
        <div className="grid g2" style={{ gap: "var(--s4)", marginTop: "var(--s4)" }}>
          <Panel title={<>The specific tell, for your <FnTag fn={dread} /></>}>
            <p className="small" style={{ margin: 0 }}>{DREAD_TELLS[dread]}.</p>
          </Panel>
          <Panel title={<>What actually de-escalates <FnTag fn={dread} /></>}>
            <p className="small" style={{ margin: 0 }}>{DREAD_DEESCALATE[dread]}</p>
          </Panel>
        </div>
      )}

      <div className="note" style={{ marginTop: "var(--s4)" }} id={side.key === "superego" ? "superego-developed" : undefined}>
        <b style={{ fontFamily: "var(--sans)", fontSize: "var(--t-sm)" }}>
          Developed{side.key === "superego" ? " — the version this side is usually not given credit for" : ""}
        </b>{" "}
        <span className="small">{side.developed}</span>
      </div>
      <div className="note warn" style={{ marginTop: "var(--s2)" }}>
        <b style={{ fontFamily: "var(--sans)", fontSize: "var(--t-sm)" }}>Undeveloped</b>{" "}
        <span className="small">{side.undeveloped}</span>
      </div>

      {side.key === "superego" && (
        <p className="note" style={{ marginTop: "var(--s4)" }}>
          <b style={{ fontFamily: "var(--sans)" }}>The two versions are not the same size.</b> The
          material is blunt that most of what this side produces — the material says roughly
          ninety-five percent — is the undeveloped version, because the developed one is gated
          behind three sides of work most people never finish. That is a reason to expect the
          worst version by default, not a reason to describe the side as if the other version did
          not exist. It does — it is just earned last, never taken first.
        </p>
      )}
    </section>
  );
}
