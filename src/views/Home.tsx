import { Link } from "react-router";
import { TYPES, ease, type MbtiType } from "../engine/core";
import type { Fn } from "../engine/data";
import { usePublishContext } from "../chat/ChatContext";
import { Tile } from "../components/Bits";
import { STAGES } from "../learn/curriculum";
import TypeMolecule from "../components/glyphs/TypeMolecule";
import FnDisc from "../components/glyphs/FnDisc";
import FnIcon from "../components/glyphs/FnIcon";
import ArchetypeSeal from "../components/glyphs/ArchetypeSeal";
import SideDoor from "../components/glyphs/SideDoor";
import MutualLanding from "../components/MutualLanding";
import TwoReadings from "../components/TwoReadings";
import { person, arrowhead } from "../components/glyphs/geometry";

/** The eight elements as four families, outward member first. */
const FAMILIES: [Fn, Fn][] = [["Ne", "Ni"], ["Se", "Si"], ["Te", "Ti"], ["Fe", "Fi"]];

/**
 * The first ordered pair whose ease differs by direction, searched rather
 * than hard-coded — the figure below exists to show the asymmetry, so its
 * example must actually have one.
 */
function asymmetricPair(): readonly [MbtiType, MbtiType] {
  for (const a of TYPES) for (const b of TYPES) if (a !== b && ease(a, b) !== ease(b, a)) return [a, b];
  return ["ENTP", "ENTP"];
}

/** The orientation page: what this is, and the ways in. */
export default function Home() {
  usePublishContext(() => ({ kind: "home" }), []);
  const [ea, eb] = asymmetricPair();

  return (
    <>
      {/* The hero reads centred — a landing, not a document. Body copy keeps
          its measure; it just stops hugging the left rail. */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ maxWidth: "16ch", marginInline: "auto" }}>Read the wiring.</h1>

        <p className="lede" style={{ marginInline: "auto" }}>
          People are not random. Most of what looks like personality is a running order — eight
          habits of mind, sorted differently in each of us, meshing with each other in ways that
          are predictable once you can see them. This is a tool for seeing them.
        </p>

        {/* The eight habits themselves, before any prose earns them: the deck's
            named discs, ripples breaking outward for e and inward for i. Each
            family holds together, so a narrow screen wraps between families
            rather than through one. */}
        <div className="cluster" style={{ gap: "var(--s2) var(--s5)", margin: "var(--s6) 0", justifyContent: "center" }}>
          {FAMILIES.map(([out, inw]) => (
            <span key={out} style={{ display: "flex", gap: "var(--s2)", flex: "0 0 auto" }}>
              <FnDisc fn={out} size={46} />
              <FnDisc fn={inw} size={46} />
            </span>
          ))}
        </div>

        <p className="prose" style={{ marginInline: "auto" }}>
          Everything here is <b>derived</b>. Sixteen wirings produce 256 relationships, both
          directions of every one, four sides of every mind and a growth path for each — all
          computed from the same small piece of structure rather than looked up in a table.
          Nothing can quietly disagree with anything else.
        </p>
      </div>

      <h2 style={{ textAlign: "center" }}>Where to go</h2>

      {/* Navigation is TILES — the whole card is the link, and each card has
          exactly one heading. The first build had a muted eyebrow AND an h3
          per card, with only the h3 text clickable, plus a separate button
          row naming the same three destinations twenty pixels above.

          The groups follow the deck's reading ladder (the frame card):
          one mind first — elements, seats, wirings, sides — then what
          happens between minds: camps, bonds, channels. */}
      <p className="small muted" style={{ margin: "0 auto var(--s3)", letterSpacing: "0.04em", textAlign: "center" }}>
        WAYS IN
      </p>
      <div className="grid g-auto" style={{ maxWidth: 880, marginInline: "auto" }}>
        <Tile to="/learn">
          <span aria-hidden="true" style={{ display: "block", marginBottom: "var(--s3)" }}>
            <LadderGlyph />
          </span>
          <h3 style={{ margin: "0 0 var(--s2)" }}>The course →</h3>
          <p className="small" style={{ margin: 0 }}>
            New to this? {STAGES.length} stages from &ldquo;what is a cognitive function&rdquo;
            to composing a whole team. Plain language first, the technical version underneath.
          </p>
        </Tile>

        <Tile to="/calculator">
          <span aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: "var(--s2)", marginBottom: "var(--s3)" }}>
            <FnIcon fn="Ne" size={32} />
            <span className="small muted">or</span>
            <FnIcon fn="Ni" size={32} />
          </span>
          <h3 style={{ margin: "0 0 var(--s2)" }}>Find your type →</h3>
          <p className="small" style={{ margin: 0 }}>
            Eight either-or questions. Four decide it, four cross-check it, and you watch the
            field narrow as you answer.
          </p>
        </Tile>

        <Tile to="/read-someone">
          <span aria-hidden="true" style={{ display: "block", marginBottom: "var(--s3)" }}>
            <ReadGlyph />
          </span>
          <h3 style={{ margin: "0 0 var(--s2)" }}>Read someone →</h3>
          <p className="small" style={{ margin: 0 }}>
            The same four coins, asked a different way — six ordinary things to notice about
            someone else instead of eight statements they'd have to answer about themselves.
          </p>
        </Tile>
      </div>

      <p className="small muted" style={{ margin: "var(--s5) auto var(--s3)", letterSpacing: "0.04em", textAlign: "center" }}>
        ONE MIND
      </p>
      <div className="grid g-auto" style={{ maxWidth: 880, marginInline: "auto" }}>
        <Tile to="/type/ENTP">
          <span aria-hidden="true" style={{ display: "block", marginBottom: "var(--s3)" }}>
            <TypeMolecule type="ENTP" size={40} />
          </span>
          <h3 style={{ margin: "0 0 var(--s2)" }}>A type, in full →</h3>
          <p className="small" style={{ margin: 0 }}>
            The eight seats, all four sides of the mind, the exchange overlay, the growth gate and who
            you fit with — with the plain reading on top of each.
          </p>
        </Tile>

        <Tile to="/sides">
          {/* the ladder's two ends: the door you live behind, and the one kept barred */}
          <span aria-hidden="true" style={{ display: "flex", gap: "var(--s3)", marginBottom: "var(--s3)" }}>
            <SideDoor side="ego" gate="Lead" />
            <SideDoor side="superego" gate="Dread" />
          </span>
          <h3 style={{ margin: "0 0 var(--s2)" }}>Four sides →</h3>
          <p className="small" style={{ margin: 0 }}>
            You are four types, not one. The field guide to each — how to tell you&rsquo;re in
            it, how to enter on purpose, and what happens if you never do.
          </p>
        </Tile>

        <Tile to="/types">
          <span aria-hidden="true" style={{ display: "flex", gap: "var(--s2)", marginBottom: "var(--s3)" }}>
            {(["ENTP", "INFJ", "ISTJ", "ESFP"] as const).map((t) => <ArchetypeSeal key={t} type={t} size={38} />)}
          </span>
          <h3 style={{ margin: "0 0 var(--s2)" }}>All sixteen →</h3>
          <p className="small" style={{ margin: 0 }}>
            Every wiring at a glance, grouped by quadra or temperament — each with its own seal.
          </p>
        </Tile>
      </div>

      <p className="small muted" style={{ margin: "var(--s5) auto var(--s3)", letterSpacing: "0.04em", textAlign: "center" }}>
        THEN TWO, AND A ROOM
      </p>
      <div className="grid g-auto" style={{ maxWidth: 880, marginInline: "auto" }}>
        <Tile to="/bonds">
          <span aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: "var(--s2)", marginBottom: "var(--s3)" }}>
            <FnDisc fn="Ne" size={44} />
            <svg width="26" height="16" viewBox="0 0 26 16" aria-hidden="true" style={{ flex: "0 0 auto" }}>
              <line x1="2" y1="5" x2="21" y2="5" stroke="var(--ink-2)" strokeOpacity="0.55" strokeWidth="1.5" />
              <path d={arrowhead(24, 5, 1, 0, 5)} fill="var(--ink-2)" fillOpacity="0.55" />
              <line x1="5" y1="11" x2="24" y2="11" stroke="var(--ink-2)" strokeOpacity="0.55" strokeWidth="1.5" />
              <path d={arrowhead(2, 11, -1, 0, 5)} fill="var(--ink-2)" fillOpacity="0.55" />
            </svg>
            <FnDisc fn="Si" size={44} />
          </span>
          <h3 style={{ margin: "0 0 var(--s2)" }}>Bonds →</h3>
          <p className="small" style={{ margin: 0 }}>
            The eight pairings that work, by element rather than by type — four axis bonds,
            four spark meshes, every number recomputed from the engine.
          </p>
        </Tile>

        <Tile to="/pair/ENTP/INFJ">
          <span aria-hidden="true" style={{ display: "flex", gap: "var(--s2)", marginBottom: "var(--s3)" }}>
            <TypeMolecule type="ENTP" size={36} />
            <TypeMolecule type="INFJ" size={36} />
          </span>
          <h3 style={{ margin: "0 0 var(--s2)" }}>A pair →</h3>
          <p className="small" style={{ margin: 0 }}>
            What the relationship actually is, how easy it is in <i>each</i> direction, and a
            playbook for handling them well.
          </p>
        </Tile>

        <Tile to="/network">
          <span aria-hidden="true" style={{ display: "block", marginBottom: "var(--s3)" }}>
            <CrowdGlyph />
          </span>
          <h3 style={{ margin: "0 0 var(--s2)" }}>A group →</h3>
          <p className="small" style={{ margin: 0 }}>
            A team as a weighted graph: who is struggling, who quietly holds the room together,
            and what one more person would change.
          </p>
        </Tile>
      </div>

      {/* ------------------------------------------------------------ *
       * The two claims, taught rather than boxed: each gets an open,
       * centred band — the figure first and full-width, one paragraph
       * of language under it. No cards; the picture is the container.
       * ------------------------------------------------------------ */}
      <h2 style={{ textAlign: "center", marginTop: "var(--s8)" }}>Two things this app insists on</h2>

      <section style={{ margin: "var(--s6) 0 var(--s8)" }}>
        <p className="small muted" style={{ textAlign: "center", letterSpacing: "0.04em", margin: "0 auto var(--s4)" }}>
          1 · EASE RUNS BOTH WAYS
        </p>

        {/* Wider than a phone by necessity — two whole stacks — so it pans
            inside its own scroll region rather than stretching the page. */}
        {/* biome-ignore lint/a11y/useSemanticElements: a scroll region is not a form group — fieldset has no place here. */}
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: the tabstop IS the point — it is how a keyboard pans the drawing. */}
        <div style={{ overflowX: "auto" }} tabIndex={0} role="group" aria-label="Diagram: both directions of one meeting">
          <div style={{ minWidth: 620, maxWidth: 760, marginInline: "auto" }}>
            <MutualLanding a={ea} b={eb} />
          </div>
        </div>

        <p style={{ maxWidth: "var(--measure)", marginInline: "auto", textAlign: "center", marginTop: "var(--s4)" }}>
          When two people meet, each one&rsquo;s strongest tools <b>land somewhere specific</b> in
          the other&rsquo;s stack — and the two landings are not mirror images. Above, a real
          pair: where the arrows land high, the meeting is restful; where they land in the
          shadow, it costs something. That is why {ea} and {eb} walk away from the same
          conversation carrying different numbers — and why a single compatibility score would
          be a fiction. Every reading in this app shows both directions.
        </p>
      </section>

      <section style={{ margin: "0 0 var(--s7)" }}>
        <p className="small muted" style={{ textAlign: "center", letterSpacing: "0.04em", margin: "0 auto var(--s4)" }}>
          2 · TWO READINGS, NOT BLENDED
        </p>

        {/* biome-ignore lint/a11y/useSemanticElements: a scroll region is not a form group — fieldset has no place here. */}
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: the tabstop IS the point — it is how a keyboard pans the drawing. */}
        <div style={{ overflowX: "auto" }} tabIndex={0} role="group" aria-label="Diagram: the two growth readings, disagreeing">
          <div style={{ minWidth: 440, maxWidth: 560, marginInline: "auto" }}>
            <TwoReadings />
          </div>
        </div>

        <p style={{ maxWidth: "var(--measure)", marginInline: "auto", textAlign: "center", marginTop: "var(--s4)" }}>
          The same stack supports two readings of where a person grows, and they mark a
          different number of psychic parts. Where they diverge you get both, labelled — not an
          average that quietly hides the disagreement.
        </p>
      </section>

      <p className="note" style={{ marginTop: "var(--s7)" }}>
        A lens, not a measurement. Typology describes how wiring tends to mesh. It does not
        measure ability, predict outcomes, diagnose anything, or tell you who to hire, date or
        forgive — and it is at its worst when used to decide something about a person before
        you have met them.
      </p>

      <p className="small muted" style={{ textAlign: "center" }}>
        New here? <Link to="/welcome">Retake the two-minute orientation →</Link>
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Two tile marks, local on purpose: rule 5 of the glyph language says
 * people are geometry — a head circle over a shoulder arc — and these
 * are that rule applied to this page's two people-shaped destinations,
 * not concepts the catalogue owns. Both are decorative (the tile text
 * says everything they say), so they ride inside aria-hidden spans.
 * ------------------------------------------------------------------ */

/** The course: stages climbed one dot at a time, the last one reached. */
function LadderGlyph() {
  const steps = [34, 28, 22, 16, 10].map((y, i) => ({ x: 12 + i * 16, y }));
  const last = steps[steps.length - 1];
  return (
    <svg width="86" height="42" viewBox="0 0 86 42" aria-hidden="true" style={{ display: "block" }}>
      {steps.slice(0, -1).map((s, i) => (
        <line
          key={i}
          x1={s.x} y1={s.y} x2={steps[i + 1].x} y2={steps[i + 1].y}
          stroke="var(--ink-2)" strokeOpacity="0.45" strokeWidth="1.5"
        />
      ))}
      {steps.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={i === steps.length - 1 ? 5 : 3.5}
          fill={i === steps.length - 1 ? "var(--accent)" : "var(--ink-2)"}
          fillOpacity={i === steps.length - 1 ? 1 : 0.55}
        />
      ))}
      <circle cx={last.x} cy={last.y} r="8.5" fill="none" stroke="var(--accent)" strokeOpacity="0.4" strokeWidth="1.5" />
    </svg>
  );
}

/** Reading someone: one person, sightline across to another. */
function ReadGlyph() {
  const a = person(16, 36, 6.5);
  const b = person(70, 36, 6.5);
  return (
    <svg width="86" height="42" viewBox="0 0 86 42" aria-hidden="true" style={{ display: "block" }}>
      <circle {...a.head} fill="var(--ink)" />
      <path d={a.shoulders} fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      <line x1="28" y1="22" x2="52" y2="22" stroke="var(--ink-2)" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="2 3" />
      <path d={arrowhead(57, 22, 1, 0, 5)} fill="var(--ink-2)" fillOpacity="0.6" />
      <circle {...b.head} fill="none" stroke="var(--ink)" strokeWidth="2.5" />
      <path d={b.shoulders} fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/** A group: a row of people, the middle one carrying the room. */
function CrowdGlyph() {
  const people = [person(14, 36, 5.5), person(43, 36, 6.5), person(72, 36, 5.5)];
  return (
    <svg width="86" height="42" viewBox="0 0 86 42" aria-hidden="true" style={{ display: "block" }}>
      {people.map((p, i) => (
        <g key={i} opacity={i === 1 ? 1 : 0.55}>
          <circle {...p.head} fill="var(--ink)" />
          <path d={p.shoulders} fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      <line x1="20" y1="30" x2="36" y2="28" stroke="var(--ink-2)" strokeOpacity="0.5" strokeWidth="1.5" />
      <line x1="50" y1="28" x2="66" y2="30" stroke="var(--ink-2)" strokeOpacity="0.5" strokeWidth="1.5" />
    </svg>
  );
}
