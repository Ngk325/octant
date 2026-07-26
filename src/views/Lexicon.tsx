import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ENTRIES, CATEGORIES, BY_ID, search, pairTerms, type Category, type Entry,
} from "../engine/lexicon";
import { Panel } from "../components/Bits";

export default function Lexicon() {
  const { id } = useParams();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");

  useEffect(() => {
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [id]);

  const results = useMemo(() => {
    const base = search(q);
    return cat === "All" ? base : base.filter((e) => e.category === cat);
  }, [q, cat]);

  const focused = id ? BY_ID.get(id) : undefined;
  const grouped = useMemo(() => {
    const m = new Map<Category, Entry[]>();
    results.forEach((e) => m.set(e.category, [...(m.get(e.category) ?? []), e]));
    return [...m.entries()].sort(
      (a, b) => CATEGORIES.indexOf(a[0]) - CATEGORIES.indexOf(b[0]));
  }, [results]);

  return (
    <>
      <h1>Lexicon</h1>
      <p className="lede">
        Every term the system uses, defined, sourced, and pairable. Where two members of a
        category can meet — two romance styles, two quadras, two functions — the entry says
        what happens when they do.
      </p>

      {focused && <FocusedEntry entry={focused} />}

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 22, flexWrap: "wrap" }}>
        <input type="text" value={q} placeholder="Search terms and definitions…"
               onChange={(e) => setQ(e.target.value)} style={{ flex: "1 1 260px" }} />
        <span className="small">{results.length} of {ENTRIES.length}</span>
      </div>

      <div className="lex-nav">
        <button className={cat === "All" ? "on" : ""} onClick={() => setCat("All")}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {grouped.map(([category, entries]) => (
        <div key={category} style={{ marginBottom: 18 }}>
          <span className="eyebrow">{category} · {entries.length}</span>
          <div className="grid g2">
            {entries.map((e) => (
              <Panel key={e.id}>
                <div className="lex-entry" id={e.id}>
                  <h3><Link to={`/lexicon/${e.id}`}>{e.term}</Link></h3>
                  <span className="small">{e.short}</span>
                  <p className="lex-def">{e.definition}</p>
                  {e.inSystem && (
                    <p className="note" style={{ marginTop: 10, marginBottom: 0, fontSize: 12.5 }}>
                      <b style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".1em" }}>
                        IN THIS SYSTEM
                      </b><br />{e.inSystem}
                    </p>
                  )}
                  <div className="lex-meta">
                    {e.source && <>Source: {e.source}. </>}
                    {e.seeAlso?.length ? (
                      <>See also{" "}
                        {e.seeAlso.filter((s) => BY_ID.has(s)).map((s, i, arr) => (
                          <span key={s}>
                            <Link to={`/lexicon/${s}`} style={{ color: "#8f9cad" }}>
                              {BY_ID.get(s)!.term}
                            </Link>{i < arr.length - 1 ? ", " : "."}
                          </span>
                        ))}
                      </>
                    ) : null}
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function FocusedEntry({ entry }: { entry: Entry }) {
  const siblings = ENTRIES.filter(
    (e) => e.category === entry.category && pairTerms(entry.id, e.id));
  if (!siblings.length) return null;
  return (
    <Panel title={`${entry.term} paired with every other ${entry.category}`}
           style={{ marginTop: 20 }}>
      {siblings.map((s) => {
        const p = pairTerms(entry.id, s.id)!;
        return (
          <div key={s.id} className="aspect">
            <div className="aspect-head">
              <span className="lbl">{entry.term} → {s.term}</span>
              <b style={{ color: "#c9a0ff", fontFamily: "var(--mono)", fontSize: 12 }}>
                {p.headline}
              </b>
            </div>
            <div className="aspect-body">{p.body}</div>
          </div>
        );
      })}
      <p className="small" style={{ marginTop: 12 }}>
        Order matters where the relationship is asymmetric — reading someone is not the same
        as being read by them.
      </p>
    </Panel>
  );
}
