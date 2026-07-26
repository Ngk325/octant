import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { STAGES } from "../learn/curriculum";
import { TYPES, type MbtiType } from "../engine/data";
import { usePublishContext } from "../chat/ChatContext";
import { Panel } from "../components/Bits";

const DONE_KEY = "stratfield.learn.done";
const TYPE_KEY = "stratfield.learn.type";

const readDone = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(DONE_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
};

export default function Learn() {
  const { stage } = useParams();
  const nav = useNavigate();
  const [done, setDone] = useState<string[]>(readDone);
  const [example, setExample] = useState<MbtiType>(() => {
    try {
      const v = localStorage.getItem(TYPE_KEY);
      return TYPES.includes(v as MbtiType) ? (v as MbtiType) : "ENTP";
    } catch {
      return "ENTP";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(TYPE_KEY, example);
    } catch {
      /* ignore */
    }
  }, [example]);

  const i = STAGES.findIndex((s) => s.slug === stage);
  const current = i >= 0 ? STAGES[i] : null;

  usePublishContext(
    () =>
      current
        ? { kind: "learn", stage: i + 1, title: current.title }
        : { kind: "learn", stage: 0, title: "Course index" },
    [current?.slug, i],
  );

  const markDone = (slug: string) => {
    setDone((d) => {
      const next = d.includes(slug) ? d : [...d, slug];
      try {
        localStorage.setItem(DONE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  if (!current) return <Index done={done} />;

  const prev = i > 0 ? STAGES[i - 1] : null;
  const next = i < STAGES.length - 1 ? STAGES[i + 1] : null;

  return (
    <>
      <div className="learn-rail" aria-label="Course progress">
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
      </div>

      <div style={{ display: "flex", gap: "var(--s4)", alignItems: "baseline", flexWrap: "wrap" }}>
        <p className="small muted" style={{ margin: 0 }}>
          Stage {i + 1} of {STAGES.length}
        </p>
        <label className="small" style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          Examples use
          <select value={example} onChange={(e) => setExample(e.target.value as MbtiType)} aria-label="Example type">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>

      <h1>{current.title}</h1>

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
          <button
            className="btn primary"
            onClick={() => {
              markDone(current.slug);
              nav(`/learn/${next.slug}`);
            }}
          >
            {next.title} →
          </button>
        ) : (
          <button
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

function Index({ done }: { done: string[] }) {
  const complete = done.length >= STAGES.length;
  return (
    <>
      <h1>Learn this from scratch</h1>
      <p className="lede">
        Ten stages, in order, each one assuming only what the ones before it taught. Plain English
        first; the precise version is always one click underneath, so you can see the vocabulary
        you are growing into rather than being handed it.
      </p>

      <p>
        <Link to={`/learn/${STAGES[0].slug}`} className="btn primary">
          {done.length ? "Continue" : "Start at the beginning"} →
        </Link>
        {complete && <span className="chip" style={{ marginLeft: 12 }}>All ten done</span>}
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
