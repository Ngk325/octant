import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ENTRIES, CATEGORIES, BY_ID, search, pairTerms, type Category, type Entry,
} from "../engine/lexicon";
import { usePublishContext } from "../chat/ChatContext";
import { FN_ROLE, FN_KEYWORD, FN_KEYWORD_GLOSS, FN_SAYS, FN_WANTS, FN_VERBS } from "../engine/functions";
import type { Fn } from "../engine/data";
import Explain from "../components/Explain";
import { Panel } from "../components/Bits";
import { lexiconFigure } from "../components/lexicon-figures";

/** Every defined term, searchable and filterable, with per-category pairing. */
export default function Lexicon() {
  const { id } = useParams();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");

  const focused = id ? BY_ID.get(id) : undefined;

  usePublishContext(
    () => ({ kind: "lexicon", term: focused?.term }),
    [focused?.id],
  );

  useEffect(() => {
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [id]);

  const results = useMemo(() => {
    const base = search(q);
    return cat === "All" ? base : base.filter((e) => e.category === cat);
  }, [q, cat]);

  /* Every category, in canonical order, every render — empty ones are simply
     not shown. The first build derived the heading list from the filtered
     results, so the page's skeleton mutated under the reader on every
     keystroke. */
  const grouped = useMemo(() => {
    const m = new Map<Category, Entry[]>();
    results.forEach((e) => m.set(e.category, [...(m.get(e.category) ?? []), e]));
    return CATEGORIES.map((c) => [c, m.get(c) ?? []] as const).filter(([, list]) => list.length > 0);
  }, [results]);

  /** Entry count per category, for the filter chips — which double as the index. */
  const counts = useMemo(() => {
    const m = new Map<Category, number>();
    ENTRIES.forEach((e) => m.set(e.category, (m.get(e.category) ?? 0) + 1));
    return m;
  }, []);

  return (
    <>
      <h1>Every term, defined</h1>
      <p className="lede">
        Each entry says it plainly first, then precisely. And where two members of a category can
        meet — two romance styles, two quadras, two functions — the entry says what happens when
        they do.
      </p>

      {/* The controls come before the focused entry: landing on a deep link
          must not bury the way to everything else below the fold. */}
      <div className="cluster" style={{ marginTop: "var(--s6)" }}>
        <input
          type="text"
          value={q}
          placeholder="Search terms and definitions…"
          aria-label="Search the lexicon"
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: "1 1 280px" }}
        />
        <span className="small muted">{results.length} of {ENTRIES.length}</span>
      </div>

      <div className="lex-nav">
        <button className={`chip${cat === "All" ? " on" : ""}`} onClick={() => setCat("All")}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip${cat === c ? " on" : ""}`} onClick={() => setCat(c)}>
            {c} · {counts.get(c) ?? 0}
          </button>
        ))}
      </div>

      {focused && <FocusedEntry entry={focused} />}

      {grouped.map(([category, entries]) => (
        <section key={category} style={{ marginBottom: "var(--s6)" }}>
          <h2 style={{ marginTop: "var(--s5)" }}>{category}</h2>
          <div className="grid g2">
            {entries.map((e) => (
              /* The anchor id and scroll margin live on the Panel itself, so a
                 deep link lands with the whole card visible — with the id on
                 an inner div, the card's own top padding and border were
                 clipped under the masthead. */
              <Panel key={e.id} className="lex-entry" id={e.id}>
                <div>
                  <h3 style={{ marginTop: 0 }}>
                    <Link to={`/lexicon/${e.id}`}>{e.term}</Link>
                  </h3>

                  <Explain plain={e.plain}>
                    <p className="small" style={{ fontStyle: "italic" }}>{e.short}</p>
                    <p style={{ marginBottom: e.inSystem ? undefined : 0 }}>{e.definition}</p>
                    {e.inSystem && (
                      <p className="small" style={{ marginBottom: 0 }}>
                        <b style={{ fontFamily: "var(--sans)" }}>In this system: </b>
                        {e.inSystem}
                      </p>
                    )}
                  </Explain>

                  {lexiconFigure(e)}
                  {e.category === "Function" && <FunctionExtras fn={e.term as Fn} />}

                  <p className="small muted" style={{ margin: 0 }}>
                    {e.seeAlso?.length ? (
                      <>
                        See also{" "}
                        {e.seeAlso.filter((s) => BY_ID.has(s)).map((s, i, arr) => (
                          <span key={s}>
                            <Link to={`/lexicon/${s}`}>{BY_ID.get(s)!.term}</Link>
                            {i < arr.length - 1 ? ", " : "."}
                          </span>
                        ))}
                      </>
                    ) : null}
                  </p>
                </div>
              </Panel>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

/** One entry in full, paired against every other member of its category. */
function FocusedEntry({ entry }: { entry: Entry }) {
  const siblings = ENTRIES.filter((e) => e.category === entry.category && pairTerms(entry.id, e.id));
  if (!siblings.length) return null;

  return (
    <Panel
      title={`${entry.term} paired with every other ${entry.category.toLowerCase()}`}
      style={{ marginTop: "var(--s5)" }}
    >
      {siblings.map((s) => {
        const p = pairTerms(entry.id, s.id)!;
        return (
          <div key={s.id} className="aspect">
            <div className="aspect-head">
              <span className="lbl">{entry.term} → {s.term}</span>
              <span className="headline">{p.headline}</span>
            </div>
            <div className="aspect-body">{p.body}</div>
          </div>
        );
      })}
      <p className="small muted" style={{ marginTop: "var(--s4)", marginBottom: 0 }}>
        Order matters where the relationship is asymmetric — reading someone is not the same as
        being read by them.
      </p>
    </Panel>
  );
}

/** The per-function depth ingested from the source batch, shown on Function entries. */
function FunctionExtras({ fn }: { fn: Fn }) {
  if (!FN_ROLE[fn]) return null;
  return (
    <div
      style={{
        margin: "0 0 var(--s3)",
        paddingTop: "var(--s3)",
        borderTop: "1px solid var(--rule)",
      }}
    >
      <p className="small" style={{ marginBottom: 4 }}>
        <b style={{ fontFamily: "var(--sans)" }}>Does: </b>{FN_ROLE[fn]}
        {" · "}
        <b style={{ fontFamily: "var(--sans)" }}>Claims: </b>{FN_KEYWORD[fn]}
        {" · "}
        <b style={{ fontFamily: "var(--sans)" }}>Wants: </b>{FN_WANTS[fn].toLowerCase()}
      </p>
      <p className="small" style={{ marginBottom: 4 }}>{FN_KEYWORD_GLOSS[fn]}</p>
      <p className="small" style={{ marginBottom: 4 }}>
        <b style={{ fontFamily: "var(--sans)" }}>Doing: </b>
        {FN_VERBS[fn].slice(0, 4).join(" · ")}
      </p>
      <p className="small" style={{ marginBottom: 0 }}>
        <b style={{ fontFamily: "var(--sans)" }}>Sounds like: </b>
        &ldquo;{FN_SAYS[fn][0]}&rdquo; &middot; &ldquo;{FN_SAYS[fn][1]}&rdquo;
      </p>
    </div>
  );
}
