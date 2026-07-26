import { Link } from "react-router-dom";
import { usePublishContext } from "../chat/ChatContext";
import { Panel } from "../components/Bits";

/** The orientation page: what this is, and the two ways in. */
export default function Home() {
  usePublishContext(() => ({ kind: "home" }), []);

  return (
    <>
      <h1 style={{ maxWidth: "16ch" }}>Read the wiring.</h1>

      <p className="lede">
        People are not random. Most of what looks like personality is a running order — eight
        habits of mind, sorted differently in each of us, meshing with each other in ways that are
        predictable once you can see them. This is a tool for seeing them.
      </p>

      <p className="prose">
        Everything here is <b>derived</b>. Sixteen wirings produce 256 relationships, both
        directions of every one, four sides of every mind and a growth path for each — all
        computed from the same small piece of structure rather than looked up in a table. Nothing
        can quietly disagree with anything else.
      </p>

      <div className="cluster" style={{ gap: "var(--s3)", marginTop: "var(--s6)" }}>
        <Link to="/learn" className="btn primary">Start the course →</Link>
        <Link to="/calculator" className="btn">Find your type</Link>
        <Link to="/types" className="btn ghost">Browse all sixteen</Link>
      </div>

      <h2>Where to go</h2>

      <div className="grid g3">
        <Panel title="New to this">
          <h3 style={{ marginTop: 0 }}><Link to="/learn">The course</Link></h3>
          <p className="small">
            Ten stages from &ldquo;what is a cognitive function&rdquo; to composing a whole team.
            Plain language first, the technical version underneath.
          </p>
        </Panel>

        <Panel title="Know your type">
          <h3 style={{ marginTop: 0 }}><Link to="/type/ENTP">A type, in full</Link></h3>
          <p className="small">
            The eight slots, all four sides of the mind, the OPS overlay, the growth gate and who
            you fit with — with the plain reading on top of each.
          </p>
        </Panel>

        <Panel title="Two people">
          <h3 style={{ marginTop: 0 }}><Link to="/pair/ENTP/INFJ">A pair</Link></h3>
          <p className="small">
            What the relationship actually is, how easy it is in <i>each</i> direction, and a
            playbook for handling them well.
          </p>
        </Panel>
      </div>

      <h2>Two things this app insists on</h2>

      <div className="grid g2">
        <Panel title="Ease runs both ways">
          <p className="small">
            Four of the sixteen relations are asymmetric. A single compatibility number would hide
            the single most useful fact about those pairs, so every reading shows both directions
            and names the asymmetry when there is one.
          </p>
        </Panel>
        <Panel title="Two instruments, not blended">
          <p className="small">
            CS Joseph and Objective Personality model a different number of psychic parts and give
            different growth readings for the same person. Where they diverge you get both,
            labelled — not an average neither would recognise.
          </p>
        </Panel>
      </div>

      <p className="note" style={{ marginTop: "var(--s7)" }}>
        A lens, not a measurement. Typology describes how wiring tends to mesh. It does not
        measure ability, predict outcomes, diagnose anything, or tell you who to hire, date or
        forgive — and it is at its worst when used to decide something about a person before
        you have met them.
      </p>
    </>
  );
}
