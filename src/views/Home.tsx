import { usePublishContext } from "../chat/ChatContext";
import { Panel, Tile } from "../components/Bits";
import { STAGES } from "../learn/curriculum";

/** The orientation page: what this is, and the ways in. */
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

      <h2>Where to go</h2>

      {/* Navigation is TILES — the whole card is the link, and each card has
          exactly one heading. The first build had a muted eyebrow AND an h3
          per card, with only the h3 text clickable, plus a separate button
          row naming the same three destinations twenty pixels above. */}
      <div className="grid g-auto">
        <Tile to="/learn">
          <h3 style={{ margin: "0 0 var(--s2)" }}>The course →</h3>
          <p className="small" style={{ margin: 0 }}>
            New to this? {STAGES.length} stages from &ldquo;what is a cognitive function&rdquo;
            to composing a whole team. Plain language first, the technical version underneath.
          </p>
        </Tile>

        <Tile to="/calculator">
          <h3 style={{ margin: "0 0 var(--s2)" }}>Find your type →</h3>
          <p className="small" style={{ margin: 0 }}>
            Eight either-or questions. Four decide it, four cross-check it, and you watch the
            field narrow as you answer.
          </p>
        </Tile>

        <Tile to="/type/ENTP">
          <h3 style={{ margin: "0 0 var(--s2)" }}>A type, in full →</h3>
          <p className="small" style={{ margin: 0 }}>
            The eight slots, all four sides of the mind, the exchange overlay, the growth gate and who
            you fit with — with the plain reading on top of each.
          </p>
        </Tile>

        <Tile to="/pair/ENTP/INFJ">
          <h3 style={{ margin: "0 0 var(--s2)" }}>A pair →</h3>
          <p className="small" style={{ margin: 0 }}>
            What the relationship actually is, how easy it is in <i>each</i> direction, and a
            playbook for handling them well.
          </p>
        </Tile>

        <Tile to="/types">
          <h3 style={{ margin: "0 0 var(--s2)" }}>All sixteen →</h3>
          <p className="small" style={{ margin: 0 }}>
            Every wiring at a glance, grouped by quadra or temperament.
          </p>
        </Tile>
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
        <Panel title="Two readings, not blended">
          <p className="small">
            The same stack supports two readings of where a person grows, and they mark a different
            number of psychic parts. Where they diverge you get both, labelled — not an average that
            quietly hides the disagreement.
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
