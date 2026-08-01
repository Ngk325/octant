import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { STAGES } from "../learn/curriculum";
import { TYPES, type MbtiType } from "../engine/data";
import { usePublishContext } from "../chat/ChatContext";
import { Panel } from "../components/Bits";
import Figure from "../components/Figure";
import { readStored, writeStored } from "../storage";
import EightSet from "../components/glyphs/EightSet";
import TypeMolecule from "../components/glyphs/TypeMolecule";

const DONE_KEY = "learn.done";
const TYPE_KEY = "learn.type";

/** Completed stages, tolerating anything unexpected in storage rather than throwing. */
const readDone = (): string[] => {
  try {
    const v = JSON.parse(readStored(DONE_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
};

/** The course. Renders the index or one stage, and remembers progress locally. */
export default function Learn() {
  const { stage } = useParams();
  const nav = useNavigate();
  const [done, setDone] = useState<string[]>(readDone);
  const [example, setExample] = useState<MbtiType>(() => {
    try {
      const v = readStored(TYPE_KEY);
      return TYPES.includes(v as MbtiType) ? (v as MbtiType) : "ENTP";
    } catch {
      return "ENTP";
    }
  });

  useEffect(() => {
    writeStored(TYPE_KEY, example);
  }, [example]);

  /* Persisting from an effect, not from inside the setDone updater. React may
     call a state updater more than once for a single dispatch, so writing to
     localStorage in there is a side effect in a function that must stay pure. */
  useEffect(() => {
    writeStored(DONE_KEY, JSON.stringify(done));
  }, [done]);

  const i = STAGES.findIndex((s) => s.slug === stage);
  const current = i >= 0 ? STAGES[i] : null;

  usePublishContext(
    () =>
      current
        ? { kind: "learn", stage: i + 1, title: current.title }
        : { kind: "learn", stage: 0, title: "Course index" },
    [current?.slug, i],
  );

  /** Mark a stage complete. Persistence happens in an effect, not here. */
  const markDone = (slug: string) =>
    setDone((d) => (d.includes(slug) ? d : [...d, slug]));

  if (!current) return <Index done={done} example={example} setExample={setExample} />;

  const prev = i > 0 ? STAGES[i - 1] : null;
  const next = i < STAGES.length - 1 ? STAGES[i + 1] : null;

  return (
    <>
      <nav className="learn-rail" aria-label="Course progress">
        {STAGES.map((s, n) => (
          <Link
            key={s.slug}
            to={`/learn/${s.slug}`}
            className={`learn-step${s.slug === current.slug ? " on" : done.includes(s.slug) ? " done" : ""}`}
          >
            <span className="n">{done.includes(s.slug) && s.slug !== current.slug ? "✓" : n + 1}</span>
            {s.title}
          </Link>
        ))}
      </nav>

      <p className="small muted" style={{ margin: "0 0 var(--s2)" }}>
        Stage {i + 1} of {STAGES.length}
      </p>

      <h1>{current.title}</h1>

      <ExampleControl example={example} setExample={setExample} />

      {current.body(example)}

      <div className="check">
        <p>Before you move on</p>
        <p style={{ marginBottom: 0 }}>{current.check}</p>
      </div>

      <div className="learn-nav">
        {prev ? (
          <Link to={`/learn/${prev.slug}`} className="btn">← {prev.title}</Link>
        ) : (
          <Link to="/learn" className="btn">← All stages</Link>
        )}
        {next ? (
          <button type="button"
            className="btn primary"
            onClick={() => {
              markDone(current.slug);
              nav(`/learn/${next.slug}`);
            }}
          >
            {next.title} →
          </button>
        ) : (
          <button type="button"
            className="btn primary"
            onClick={() => {
              markDone(current.slug);
              nav("/learn");
            }}
          >
            Finish the course →
          </button>
        )}
      </div>
    </>
  );
}

/**
 * The worked-example control. This is the most consequential input on the
 * course — it rewires every figure in every stage — so it renders as a real
 * labelled control on both the index and each stage, not a small select
 * hidden above the heading.
 */
function ExampleControl({ example, setExample }: {
  example: MbtiType;
  setExample(t: MbtiType): void;
}) {
  return (
    <p className="note" style={{ display: "flex", gap: "var(--s3)", alignItems: "center", flexWrap: "wrap" }}>
      {/* The control said every diagram is drawn for this type and then showed
          no picture of it. The molecule answers "which one am I looking at?"
          at a glance, and changes under the reader when they change the
          select — decorative, so the select still carries the label. */}
      <span aria-hidden="true" style={{ display: "flex", flex: "0 0 auto" }}>
        <TypeMolecule type={example} size={44} labels={false} />
      </span>
      <label className="small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <b style={{ fontFamily: "var(--sans)" }}>Worked example</b>
        <select value={example} onChange={(e) => setExample(e.target.value as MbtiType)} aria-label="Example type">
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <span className="small muted">
        Every diagram in the course is drawn for this type. Set it to yours.
      </span>
    </p>
  );
}

/** The course contents page, with progress. */
function Index({ done, example, setExample }: {
  done: string[];
  example: MbtiType;
  setExample(t: MbtiType): void;
}) {
  const complete = done.length >= STAGES.length;
  return (
    <>
      <h1>Learn this from scratch</h1>
      <p className="lede">
        {STAGES.length} stages, in order, each one assuming only what the ones before it taught.
        Plain English first; the precise version is always one click underneath, so you can see
        the vocabulary you are growing into rather than being handed it.
      </p>

      {/* What the whole course is about, before stage one names any of it.
          The index was the one page in the course with no picture on it —
          thirteen text cards under a text lede, which read as a table of
          contents for something you could not yet see. */}
      <Figure
        label="What you are learning to read"
        caption="Eight habits of mind, in four families. Each family has one version that faces
                 outward and one that faces inward. Everything else in the course is built from
                 these eight and the order they come in."
        minWidth={320}
      >
        <EightSet size={34} />
      </Figure>

      <ExampleControl example={example} setExample={setExample} />

      <p>
        <Link to={`/learn/${STAGES[0].slug}`} className="btn primary">
          {done.length ? "Continue" : "Start at the beginning"} →
        </Link>
        {complete && <span className="chip" style={{ marginLeft: 12 }}>All {STAGES.length} done</span>}
      </p>

      <div className="grid g2" style={{ marginTop: "var(--s6)" }}>
        {STAGES.map((s, n) => (
          <Panel key={s.slug}>
            <div style={{ display: "flex", gap: "var(--s3)", alignItems: "baseline" }}>
              <span className="mono muted" style={{ fontSize: "var(--t-sm)" }}>
                {String(n + 1).padStart(2, "0")}
              </span>
              <h3 style={{ margin: 0, fontSize: "var(--t-lg)" }}>
                <Link to={`/learn/${s.slug}`}>{s.title}</Link>
              </h3>
              {done.includes(s.slug) && <span className="chip" style={{ marginLeft: "auto" }}>✓</span>}
            </div>
            <p className="small" style={{ margin: "var(--s2) 0 0" }}>{s.blurb}</p>
          </Panel>
        ))}
      </div>
    </>
  );
}
