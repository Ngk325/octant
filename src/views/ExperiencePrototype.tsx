import { useState } from "react";
import { Link } from "react-router";
import { TYPES, stack, type MbtiType } from "../engine/core";
import { sides, SIDE_ORDER, type SideKey } from "../engine/sides";
import { SLOT_NAMES } from "../engine/data";
import { usePalette } from "../components/Theme";
import FnIcon from "../components/glyphs/FnIcon";
import TypeMolecule from "../components/glyphs/TypeMolecule";
import "../styles/experience-prototype.css";

const DOORS = [
  ["My Mind", "Notice your familiar ways of thinking.", "/types"],
  ["Our Connection", "See a conversation from both sides.", "/pair/ENTP/INFP"],
  ["Our Team", "Explore how a whole room works together.", "/network"],
  ["My Growth", "Try a different way of approaching today.", "#explore-sides"],
] as const;

/** Review-only experience. Structure comes from the canonical engine; no new user data is stored. */
export default function ExperiencePrototype() {
  const [type, setType] = useState<MbtiType>("ENTP");
  const [selected, setSelected] = useState<SideKey>("ego");
  const [expression, setExpression] = useState<"voluntary" | "reactive">("voluntary");
  const [terms, setTerms] = useState(false);
  const model = sides(type);
  const side = model[selected];
  const original = stack(type);
  const palette = usePalette();

  return (
    <div className="experience-prototype">
      <div className="xp-review"><span>Design study · 01</span><Link to="/">Back to Octant</Link></div>
      <header className="xp-intro"><div className="xp-intro-copy">
        <p className="xp-eyebrow">One mind. More ways to meet the moment.</p>
        <h1>Make room for<br />another way.</h1>
        <p>You have familiar habits of attention. Explore a different arrangement—and a different question to ask yourself.</p>
        <a className="xp-action" href="#explore-sides">Explore your four sides <Arrow /></a>
        </div><figure className="xp-preview">
          <div className="xp-preview-grid">{SIDE_ORDER.map(key => <div key={key}><TypeMolecule type={model[key].type} size={96} labels={false} /><strong>{model[key].name}</strong><span>{model[key].type}</span></div>)}</div>
          <figcaption>One starting pattern. Four arrangements.<br />Color identifies a capacity; size shows its rank.</figcaption>
        </figure>
      </header>

      <nav className="xp-doors" aria-label="Choose your starting point">
        {DOORS.map(([title, description, href], i) => <a href={href} key={title}>
          <span className="xp-number">0{i + 1}</span><strong>{title}</strong><span>{description}</span><Arrow />
        </a>)}
      </nav>

      <section id="explore-sides" aria-labelledby="xp-title" className="xp-explorer">
        <div className="xp-section-head">
          <div><p className="xp-eyebrow">A small experiment in perspective</p><h2 id="xp-title">The same capacities.<br />A different starting point.</h2></div>
          <label className="xp-type">Your starting pattern<select value={type} onChange={e => setType(e.target.value as MbtiType)}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
        </div>
        <p className="xp-limit">Model-derived arrangement · A lens for reflection, not a measurement of your mind.</p>

        <fieldset className="xp-side-picker">
          <legend className="sr-only">Choose a side to explore</legend>
          {SIDE_ORDER.map((key, i) => <button type="button" aria-pressed={selected === key} onClick={() => setSelected(key)} key={key}>
            <span className="xp-number">0{i + 1}</span><strong>{model[key].name}</strong><span>{model[key].type}</span>
          </button>)}
        </fieldset>

        <div className="xp-scene" aria-live="polite" aria-atomic="true">
          <div className="xp-story">
            <p className="xp-eyebrow">{side.name} · {side.type}</p>
            <h3>{selected === "ego" ? "Begin with what feels familiar." : "Let a less familiar capacity lead."}</h3>
            <p>{selected === "ego" ? "These are the four capacities your starting pattern puts first. Choose another side to see how their order changes." : `In this arrangement, ${side.gateway.fn} moves from ${side.gateway.egoSlot} in your starting pattern to Lead. Follow its thread in the picture.`}</p>
            <div className="xp-gateway"><FnIcon fn={side.gateway.fn} size={48} /><span><strong>{side.gateway.fn}</strong><br />{side.gateway.egoSlot} → Lead</span></div>
            <button className="xp-text-button" type="button" aria-expanded={terms} aria-controls="xp-terms" onClick={() => setTerms(!terms)}>{terms ? "Hide the terminology −" : "Name what I’m seeing +"}</button>
            {terms && <p id="xp-terms">A function is one capacity in the model. A slot is its position. A side is an arrangement of four functions; the gateway is the function that leads it. These labels do not establish a person’s actual state.</p>}
          </div>

          <figure className="xp-figure">
            <svg viewBox="0 0 420 380" role="img" aria-labelledby="xp-figure-title xp-figure-desc">
              <title id="xp-figure-title">{type} to {side.name}: trace the same functions into a new order</title>
              <desc id="xp-figure-desc">{side.slots.map(slot => `${slot.fn}: ${slot.egoSlot} in ${type}, ${slot.role} in ${side.type}`).join(". ")}. Full assignments are in the text below.</desc>
              {side.slots.map((slot, i) => {
                const source = original.indexOf(slot.fn);
                const y1 = 32 + source * 44;
                const y2 = 52 + i * 88;
                return <path key={slot.fn} d={`M 103 ${y1} C 210 ${y1}, 210 ${y2}, 315 ${y2}`} fill="none" stroke={palette.fn(slot.fn)} strokeWidth={i === 0 ? 3 : 1.5} />;
              })}
              {original.map((fn, i) => <g key={fn}><circle cx="88" cy={32 + i * 44} r="15" fill={palette.glow(fn)} stroke={palette.fn(fn)} opacity={i < 4 ? 1 : .55} /><text x="48" y={38 + i * 44} textAnchor="end" fill={palette.fn(fn)} fontSize="18">{fn}</text></g>)}
              {side.slots.map((slot, i) => <g key={slot.fn}><circle cx="332" cy={52 + i * 88} r={25 * [1, .78, .56, .42][i]} fill={palette.fn(slot.fn)} /><text x="370" y={58 + i * 88} fill={palette.fn(slot.fn)} fontSize="18">{slot.fn}</text></g>)}
            </svg>
            <figcaption><span>{type} · eight capacities</span><span>{side.type} · first four</span></figcaption>
          </figure>
        </div>

        <ol className="xp-assignments" aria-label="Function assignments">
          {side.slots.map(slot => <li key={slot.fn}><strong style={{color: palette.fn(slot.fn)}}>{slot.fn}</strong><span>{slot.egoSlot} <span aria-hidden="true">→</span> {slot.role}</span></li>)}
        </ol>

        <section className="xp-reflection" aria-labelledby="xp-reflection-title">
          <div><p className="xp-eyebrow">Bring it back to an ordinary day</p><h3 id="xp-reflection-title">Choice changes the experience.</h3><p>Try both descriptions. Which, if either, resembles something you have noticed? Your answer matters more than the label.</p></div>
          <div>
            <fieldset className="xp-expression">
              <legend className="sr-only">Choose an expression to reflect on</legend>
              <button type="button" aria-pressed={expression === "voluntary"} onClick={() => setExpression("voluntary")}>Voluntary</button>
              <button type="button" aria-pressed={expression === "reactive"} onClick={() => setExpression("reactive")}>Reactive</button>
            </fieldset>
            <p className="xp-evidence">Authored interpretation · not an assessment</p>
            <p aria-live="polite">{expression === "voluntary" ? side.developed : side.undeveloped}</p>
            {selected === "superego" && side.type === "ESFP" && <p><strong>A Showman example.</strong> Enjoying a story, dance or performance—and being able to stop—differs from provoking a response or pushing past someone’s boundary. This example cannot identify a mental state from a type.</p>}
            <p className="xp-question">{expression === "voluntary" ? "What could I try by choice—and stop when I choose?" : "What would help me pause before reacting?"}</p>
          </div>
        </section>

        <details className="xp-mechanics"><summary>Under the picture: exact mechanics & limits</summary>
          <p>{type} stack: {original.map((fn, i) => `${SLOT_NAMES[i]} ${fn}`).join(" · ")}. {side.name}: {side.slots.map(slot => slot.fn).join("–")}, matching {side.type}.</p>
          <p>The structure is computed by <code>sides(type)</code> and <code>stack(type)</code> in Octant’s canonical engine. The other sides apply its opposite, attitude-flip and element-swap operations. No independent type table is stored here.</p>
          <p>Internally consistent arrangements do not validate typology as neuroscience. The expression descriptions are authored interpretations; they cannot diagnose motives, identify attraction or determine another person’s boundaries.</p>
          <Link to={`/sides/${type}`}>Read the full field guide →</Link>
        </details>
      </section>
      <footer className="xp-footer">Prototype for comprehension testing · Your selections stay on this page. No practice journal or profile is saved.</footer>
    </div>
  );
}

function Arrow() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 16 16 4M4 4h12v12" stroke="currentColor" strokeWidth="1.5" /></svg>;
}
