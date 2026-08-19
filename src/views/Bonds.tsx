import { Link } from "react-router";
import { bondFacts, sparkFacts } from "../engine/bonds";
import { FN_FULL, REL_NAME, REL_SCORE, type Fn } from "../engine/data";
import { FN_KEYWORD_GLOSS, FN_WANTS } from "../engine/functions";
import { stack } from "../engine/core";
import { usePublishContext } from "../chat/ChatContext";
import Explain from "../components/Explain";
import Term from "../components/Term";
import { FnTag, Panel, Row } from "../components/Bits";
import { AxisBondFigure, SparkMeshFigure } from "../components/BondFigure";

/**
 * BONDS — element-level compatibility, the deck's one genuinely new
 * surface, backported. Every other pair page in this app names
 * four-letter types; this one answers "who works well with whom" at the
 * altitude the answer actually lives at: which element answers which.
 * Every number here is recomputed from the engine (src/engine/bonds.ts),
 * never asserted.
 */
export default function Bonds() {
  const axis = bondFacts();
  const sparks = sparkFacts();

  usePublishContext(() => ({ kind: "bonds" }), []);

  return (
    <>
      <h1>Bonds</h1>
      <p className="lede">
        Who works well with whom is not really about types. It is about which tool answers
        which — and at that altitude there are only eight pairings that work: four axis bonds,
        where Lead meets Lead across an axis, and four spark meshes, where Lead meets Support
        crosswise. Every type pairing the app scores well is one of these wearing four letters.
      </p>

      <Explain
        big
        plain={
          "A bond is a pairing of two tools, not two people. Any two people who carry these " +
          "two tools at the top of their stacks get the pairing's benefit, whatever their four " +
          "letters are — which is why this page names tools, never types."
        }
      >
        <p>
          This sits between the <Link to="/lexicon/stack-map">involution structure</Link> and
          the <Link to="/pair/ENTP/INFJ">pair reader</Link>: structure says which elements
          oppose, the pair reader scores two whole types, and Bonds is the layer in between —
          the element-level mechanism the type-level scores reduce to.
        </p>
      </Explain>

      <h2 className="sec">The four axis bonds</h2>
      <p>
        Lead meets Lead across the axis. Each of these two is exactly what the other does not
        do, so the pair covers ground neither reaches alone — the strongest kind of pairing
        there is. Sweeping all 240 ordered pairs of distinct types: the four axis pairings
        average {Math.round(axis[0].mean)} of 100; no other class of Lead pairing comes within{" "}
        {Math.round(axis[0].overNext)} of them.
      </p>

      <div className="grid g2" style={{ marginTop: "var(--s5)" }}>
        {axis.map((f) => (
          <Panel key={f.a} title={<span><FnTag fn={f.a} disc /> · <FnTag fn={f.b} disc /></span>}>
            <p className="small muted" style={{ margin: "0 0 var(--s3)" }}>
              one axis: {FN_FULL[f.a]} and {FN_FULL[f.b]}
            </p>
            <AxisBondFigure a={f.a} b={f.b} />
            <Row k={<span><FnTag fn={f.a} /> brings</span>} v={<span className="small">{FN_KEYWORD_GLOSS[f.a]}</span>} stacked />
            <Row k={<span><FnTag fn={f.b} /> brings</span>} v={<span className="small">{FN_KEYWORD_GLOSS[f.b]}</span>} stacked />
            <Row
              k="Why it works"
              v={
                <span className="small">
                  Whoever leads {f.a} carries {f.b} in the Cave — the seat they fear being bad
                  at — and the reverse. Each raises what the other skipped. {f.a} wants{" "}
                  {FN_WANTS[f.a].toLowerCase()}; {f.b} wants {FN_WANTS[f.b].toLowerCase()}.
                </span>
              }
              stacked
            />
            <Row
              k="In the relation table"
              v={
                <span className="small">
                  Leads meet only as{" "}
                  {f.rels.map((c, i) => (
                    <span key={c}>
                      {i > 0 && " or "}
                      <Term id={`rel-${c.toLowerCase()}`}>{REL_NAME[c]}</Term>
                    </span>
                  ))}
                  {" "}· mean ease {Math.round(f.mean)} of 100
                </span>
              }
              stacked
            />
          </Panel>
        ))}
      </div>

      <h2 className="sec">The four spark meshes</h2>
      <p>
        Lead does not meet Lead here: each Lead is answered by the <i>other</i> person&rsquo;s
        Support. Each <Term id="quadra">Camp</Term>&rsquo;s two axes admit exactly one such
        mesh, realised twice — once with both Leads facing outward, once with both facing in.
        Both crossings at once is exactly the{" "}
        <Term id="rel-ac">{REL_NAME.AC}</Term> relation, ease {REL_SCORE.AC} in both
        directions. One crossing alone tilts the pair:{" "}
        <Term id="rel-br">{REL_NAME.BR}</Term> {REL_SCORE.BR} or{" "}
        <Term id="rel-be">{REL_NAME.BE}</Term> {REL_SCORE.BE}, depending on which half holds.
      </p>

      <div className="grid g2" style={{ marginTop: "var(--s5)" }}>
        {sparks.map((f) => {
          const [o1, o2] = f.obs;
          const [d1, d2] = f.dec;
          const meshFns = [...stack(f.outward[0]).slice(0, 2), ...stack(f.outward[1]).slice(0, 2)] as [Fn, Fn, Fn, Fn];
          return (
            <Panel
              key={f.quadra}
              title={
                <span>
                  <FnTag fn={o1} /> · <FnTag fn={o2} /> × <FnTag fn={d1} /> · <FnTag fn={d2} />
                </span>
              }
            >
              <p className="small muted" style={{ margin: "0 0 var(--s3)" }}>
                the <Term>{f.quadra}</Term> Camp&rsquo;s two axes, meshed crosswise
              </p>
              <SparkMeshFigure fns={meshFns} />
              <Row
                k="Realised by"
                v={
                  <span className="small">
                    outward: <b className="mono">{f.outward.join(" · ")}</b> — inward:{" "}
                    <b className="mono">{f.inward.join(" · ")}</b>
                  </span>
                }
                stacked
              />
              <Row
                k="Against the axis bond"
                v={
                  <span className="small">
                    A Counterpart rests; a Spark runs — each feeds the other&rsquo;s Delight,
                    and it tires if never stepped out of. Ease {f.ease} both ways.
                  </span>
                }
                stacked
              />
            </Panel>
          );
        })}
      </div>

      <p className="note" style={{ marginTop: "var(--s5)" }}>
        Every claim on this page is a sweep, not an assertion: the axis means, the mesh
        equivalence and the half-mesh tilts are recomputed from the engine on every build, and
        the test suite fails if the <Link to="/matrix">matrix</Link> ever disagrees with them.
      </p>
    </>
  );
}
