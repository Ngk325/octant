import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { TYPES, isExtraverted, stack } from "../engine/core";
import { ARCHETYPE, FN_FULL, SLOT_NAMES, type Fn, type MbtiType } from "../engine/data";
import { FN_ROLE, FN_KEYWORD } from "../engine/functions";
import { SLOT_PLAIN } from "../engine/plain";
import { sides, SIDE_ORDER, type SideKey } from "../engine/sides";
import { DOOR_EMOJI, DOOR_STATE, FN_EMOJI, emojiStack } from "../engine/emoji";
import { usePublishContext } from "../chat/ChatContext";
import Explain from "../components/Explain";
import { Panel, Tile, FnTag } from "../components/Bits";
import { Section, SectionNav } from "../components/Section";
import TypePicker from "../components/TypePicker";
import FnIcon from "../components/glyphs/FnIcon";
import AttitudeMark from "../components/glyphs/AttitudeMark";
import TypeMolecule from "../components/glyphs/TypeMolecule";
import SideDoor from "../components/glyphs/SideDoor";

const FNS: Fn[] = ["Ne", "Ni", "Se", "Si", "Te", "Ti", "Fe", "Fi"];

const isType = (v: string | undefined): v is MbtiType =>
  !!v && (TYPES as readonly string[]).includes(v);

/**
 * The emoji guide: one emoji per function, laid out at four scales —
 * the eight functions on their own, grouped by attitude, every type's
 * eight-slot stack, and (drilled into one type) the same eight
 * re-read as the four sides of the mind. Every fact is read off the
 * engine; the emoji tables in engine/emoji.ts are the only new data.
 */
export default function Guide() {
  const { type } = useParams<{ type?: string }>();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [view, setView] = useState<"slots" | "sides">("slots");

  const selected = isType(type) ? type : undefined;

  usePublishContext(
    () => (selected ? { kind: "guide", type: selected } : { kind: "guide" }),
    [selected],
  );

  const query = q.trim().toLowerCase();
  const matchesFn = (f: Fn) =>
    !query ||
    f.toLowerCase().includes(query) ||
    FN_FULL[f].toLowerCase().includes(query) ||
    FN_ROLE[f].toLowerCase().includes(query) ||
    FN_KEYWORD[f].toLowerCase().includes(query) ||
    FN_EMOJI[f] === q.trim();
  const visibleFns = FNS.filter(matchesFn);

  const matchesType = (t: MbtiType) =>
    !query || t.toLowerCase().includes(query) || ARCHETYPE[t].some((a) => a.toLowerCase().includes(query));
  const visibleTypes = TYPES.filter(matchesType);

  return (
    <>
      <h1>The emoji guide</h1>

      <Explain
        big
        plain="Every cognitive function gets one emoji. Every type arranges the same eight into a different order. Search below, or drill into a type to see its stack and its four sides."
      >
        <p>
          The emoji sit alongside this app's own abstract glyphs, not in place of them — two
          readings of the same eight functions, for two kinds of reader.
        </p>
      </Explain>

      <div className="cluster" style={{ margin: "var(--s5) 0" }}>
        <input
          type="text"
          value={q}
          placeholder="Search functions, types, archetypes, or paste an emoji…"
          aria-label="Search the guide"
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: "1 1 320px" }}
        />
      </div>

      {selected && (
        <TypeDrilldown type={selected} view={view} setView={setView} onNavigate={(t) => navigate(`/guide/${t}`)} />
      )}

      <SectionNav
        items={[
          ["fns", "The eight functions"],
          ["attitude", "By attitude"],
          ["stacks", "Every type's stack"],
        ]}
      />

      <Section id="fns" title="The eight functions">
        {visibleFns.length === 0 ? (
          <p className="small muted">No function matches "{q}".</p>
        ) : (
          <div className="grid g-auto">
            {visibleFns.map((fn) => (
              <Tile key={fn} to={`/lexicon/${fn.toLowerCase()}`} style={{ padding: "var(--s4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
                  <span style={{ fontSize: "2em", lineHeight: 1 }} aria-hidden="true">{FN_EMOJI[fn]}</span>
                  <FnIcon fn={fn} size={36} />
                </div>
                <h3 className="mono" style={{ margin: "var(--s3) 0 0" }}>{fn}</h3>
                <p className="small muted" style={{ margin: "2px 0 0" }}>{FN_FULL[fn]}</p>
                <p className="small" style={{ margin: "var(--s2) 0 0" }}>
                  {FN_ROLE[fn]} · {FN_KEYWORD[fn]}
                </p>
              </Tile>
            ))}
          </div>
        )}
      </Section>

      <Section id="attitude" title="By cognitive attitude">
        <p className="small muted">
          Facing out, into the shared world with the letter "e" — or facing in, onto a private
          model, with "i".
        </p>
        <div style={{ margin: "var(--s4) 0" }}>
          <AttitudeMark />
        </div>
        <div className="grid g2">
          <AttitudeColumn title="Extraverted — facing out" fns={visibleFns.filter(isExtraverted)} />
          <AttitudeColumn title="Intraverted — facing in" fns={visibleFns.filter((f) => !isExtraverted(f))} />
        </div>
      </Section>

      <Section id="stacks" title="Every type's stack">
        <p className="small muted" style={{ marginTop: "calc(var(--s3) * -1)" }}>
          Lead through Dread, left to right, for all sixteen at once.
        </p>
        {visibleTypes.length === 0 ? (
          <p className="small muted">No type matches "{q}".</p>
        ) : (
          <StackMatrix types={visibleTypes} highlight={selected} />
        )}
      </Section>
    </>
  );
}

function AttitudeColumn({ title, fns }: { title: string; fns: Fn[] }) {
  return (
    <Panel title={title}>
      {fns.length === 0 ? (
        <p className="small muted" style={{ margin: 0 }}>No match.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {fns.map((fn, i) => (
            <li
              key={fn}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--s3)",
                padding: "var(--s3) 0",
                borderTop: i > 0 ? "1px solid var(--rule)" : undefined,
              }}
            >
              {/* fontSize alone is not enough here: colour-emoji fonts (Apple Color
                  Emoji chief among them) carry outsized internal line metrics, so an
                  enlarged bare-emoji span with no explicit line-height can inflate its
                  own row far past the text next to it — line-height pins the row to
                  the size actually declared. */}
              <span style={{ fontSize: "1.4em", lineHeight: 1 }} aria-hidden="true">{FN_EMOJI[fn]}</span>
              <FnTag fn={fn} />
              <span className="small muted">{FN_ROLE[fn]} · {FN_KEYWORD[fn]}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** The 16x8 matrix: every type's stack, in emoji, each cell a link into that type's drilldown. */
function StackMatrix({ types, highlight }: { types: MbtiType[]; highlight?: MbtiType }) {
  return (
    /* biome-ignore lint/a11y/noNoninteractiveTabindex: the table scrolls sideways inside this div; the tabstop is how a keyboard pans it. */
    <div className="matrix-wrap" tabIndex={0} role="group" aria-label="Every type's eight-seat stack, as emoji">
      <table className="matrix">
        <caption className="small muted" style={{ captionSide: "top", textAlign: "left", paddingBottom: "var(--s3)" }}>
          Click a type, or its row, to open the full stack and four sides.
        </caption>
        <thead>
          <tr>
            <th scope="col">Type</th>
            {SLOT_NAMES.map((s) => (
              <th key={s} scope="col">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {types.map((t) => {
            const st = stack(t);
            return (
              <tr key={t} style={{ background: t === highlight ? "var(--accent-soft)" : undefined }}>
                <th scope="row" style={{ textAlign: "left", fontWeight: 500 }}>
                  <Link to={`/guide/${t}`} className="mono">{t}</Link>
                </th>
                {st.map((fn, i) => (
                  <td key={i}>
                    <Link
                      to={`/guide/${t}`}
                      title={`${t}'s ${SLOT_NAMES[i]} is ${fn}`}
                      aria-label={`${t}'s ${SLOT_NAMES[i]} is ${fn}`}
                      style={{ lineHeight: 1 }}
                    >
                      {FN_EMOJI[fn]}
                    </Link>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The chosen type's stack in full: its emoji signature, then slot order or the four sides. */
function TypeDrilldown({
  type, view, setView, onNavigate,
}: {
  type: MbtiType;
  view: "slots" | "sides";
  setView: (v: "slots" | "sides") => void;
  onNavigate: (t: MbtiType) => void;
}) {
  const st = stack(type);
  const s = sides(type);

  /* Left/right cycles types, so the sixteen are one keyboard sweep and not
     sixteen separate visits to the picker — kept off text inputs so it
     never fights the search box's own cursor movement. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      const i = TYPES.indexOf(type);
      const next = TYPES[(i + (e.key === "ArrowRight" ? 1 : -1) + TYPES.length) % TYPES.length];
      onNavigate(next);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [type, onNavigate]);

  return (
    <Panel style={{ margin: "var(--s5) 0 var(--s6)" }} id={type}>
      <div className="cluster" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
          <TypeMolecule type={type} size={56} />
          <div>
            <h2 style={{ margin: 0 }}>{type}</h2>
            <p className="small muted" style={{ margin: 0 }}>{ARCHETYPE[type].join(" · ")}</p>
          </div>
        </div>
        <TypePicker label="Switch type (or ← →)" value={type} onChange={onNavigate} />
      </div>

      <p className="mono" style={{ fontSize: "var(--t-lg)", lineHeight: 1.3, margin: "var(--s4) 0" }} aria-hidden="true">
        {emojiStack(type)}
      </p>
      <p className="small muted" style={{ margin: "0 0 var(--s4)" }}>
        {type}'s stack, front four then back four — the shareable version of the row below.
      </p>

      <div className="cluster" style={{ margin: "0 0 var(--s4)" }}>
        {(["slots", "sides"] as const).map((v) => (
          <button
            type="button"
            key={v}
            className={`chip${view === v ? " on" : ""}`}
            aria-pressed={view === v}
            onClick={() => setView(v)}
          >
            {v === "slots" ? "By seat order" : "By the four sides"}
          </button>
        ))}
      </div>

      {view === "slots" ? (
        <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {st.map((fn, i) => (
            <li
              key={fn}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--s3)",
                padding: "var(--s3) 0",
                borderBottom: i < st.length - 1 ? "1px solid var(--rule)" : undefined,
                opacity: i >= 4 ? 0.75 : 1,
              }}
            >
              <span style={{ fontSize: "1.5em", lineHeight: 1, width: "1.3em", textAlign: "center" }} aria-hidden="true">
                {FN_EMOJI[fn]}
              </span>
              <FnIcon fn={fn} size={28} />
              <FnTag fn={fn} />
              <span style={{ fontWeight: 600, minWidth: "7ch" }}>{SLOT_NAMES[i]}</span>
              <span className="small muted">{SLOT_PLAIN[SLOT_NAMES[i]]}</span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="grid g2" style={{ gap: "var(--s4)" }}>
          {SIDE_ORDER.map((key: SideKey) => {
            const side = s[key];
            return (
              <Panel key={key}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
                  <SideDoor side={key} gate={side.gateway.egoSlot} />
                  <div>
                    <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ lineHeight: 1 }} aria-hidden="true">{DOOR_EMOJI[key]}</span> {side.name}
                    </h4>
                    <p className="small muted" style={{ margin: 0 }}>{DOOR_STATE[key]}</p>
                  </div>
                </div>

                <ol style={{ listStyle: "none", padding: 0, margin: "var(--s3) 0" }}>
                  {side.slots.map((slot) => (
                    <li key={slot.fn} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0" }}>
                      <span style={{ lineHeight: 1 }} aria-hidden="true">{FN_EMOJI[slot.fn]}</span>
                      <FnTag fn={slot.fn} size="var(--t-sm)" />
                      <span className="small muted">{slot.role}</span>
                    </li>
                  ))}
                </ol>

                <p className="small" style={{ margin: "0 0 var(--s3)" }}>{side.plain}</p>

                {/* The door's own name, description and archetypes — clicking through
                    opens the full type page for this side, structurally one of the
                    other fifteen types. */}
                <div className="cluster" style={{ alignItems: "center", gap: "var(--s2)" }}>
                  <TypeMolecule type={side.type} size={36} />
                  <Link to={`/type/${side.type}`} className="chip mono">{side.type}</Link>
                  <span className="small muted">{ARCHETYPE[side.type].join(" · ")}</span>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
