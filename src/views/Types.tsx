import { useState } from "react";
import { TYPES, quadra, stack, gate } from "../engine/core";
import { ARCHETYPE, GROUP, type MbtiType } from "../engine/data";
import { FN_WANTS, FN_ROLE } from "../engine/functions";
import { typePlain } from "../engine/plain";
import { usePalette } from "../components/Theme";
import { usePublishContext } from "../chat/ChatContext";
import Explain from "../components/Explain";
import { FnTag, Tile } from "../components/Bits";
import TypeMolecule from "../components/glyphs/TypeMolecule";

type SortBy = "quadra" | "temperament" | "alpha";

/** All sixteen at a glance, grouped by quadra or temperament. */
export default function Types() {
  const p = usePalette();
  const [sortBy, setSortBy] = useState<SortBy>("quadra");

  usePublishContext(() => ({ kind: "catalogue", sortBy }), [sortBy]);

  const groups = groupTypes(sortBy);

  return (
    <>
      <h1>All sixteen</h1>

      <Explain
        big
        plain="Every wiring at a glance. Each card says what that person leads with, what they are quietly afraid of, and the one thing they have to get better at."
      >
        <p>
          The sixteen (dominant, auxiliary) pairs, from which every stack, relation, side and score
          in this app is computed. Nothing here is stored — it is all read off the engine.
        </p>
      </Explain>

      <div className="cluster" style={{ margin: "var(--s5) 0 var(--s6)" }}>
        <span className="small muted">Group by</span>
        {([["quadra", "Quadra"], ["temperament", "Temperament"], ["alpha", "Nothing"]] as const).map(
          ([v, label]) => (
            <button
              key={v}
              className={`chip${sortBy === v ? " on" : ""}`}
              onClick={() => setSortBy(v)}
              aria-pressed={sortBy === v}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {groups.map(([heading, list]) => (
        <section key={heading} style={{ marginBottom: "var(--s7)" }}>
          {heading && (
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "var(--s3)" }}>
              {sortBy === "quadra" && (
                <i className="dot" style={{ background: p.quadra(heading), width: 12, height: 12 }} />
              )}
              {heading}
            </h2>
          )}

          <div className="grid g-auto">
            {list.map((t) => {
              const st = stack(t);
              return (
                <Tile key={t} to={`/type/${t}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
                    <TypeMolecule type={t} size={52} />
                    <b className="mono" style={{ fontSize: "var(--t-lg)" }}>{t}</b>
                    <i
                      className="dot"
                      style={{ background: p.quadra(quadra(t)), marginLeft: "auto" }}
                      title={`${quadra(t)} quadra`}
                    />
                  </div>

                  <p className="small muted" style={{ margin: "2px 0 var(--s3)" }}>
                    {ARCHETYPE[t].split("/")[0].trim()}
                  </p>

                  <p style={{ fontSize: "var(--t-sm)", lineHeight: 1.5, marginBottom: "var(--s3)" }}>
                    {typePlain(t, st[0], st[1], st[3])}
                  </p>

                  <div style={{ borderTop: "1px solid var(--rule)", paddingTop: "var(--s2)" }}>
                    <div className="small" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span className="muted">Leads with</span>
                      <span>
                        <FnTag fn={st[0]} />{" "}
                        <span className="muted">{FN_ROLE[st[0]].toLowerCase()}</span>
                      </span>
                    </div>
                    <div className="small" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span className="muted">Sore spot</span>
                      <span>
                        <FnTag fn={st[3]} />{" "}
                        <span className="muted">wants {FN_WANTS[st[3]].toLowerCase()}</span>
                      </span>
                    </div>
                    <div className="small" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span className="muted">Grows by</span>
                      <span>{gate(t).gate.replace("Gate of ", "")}</span>
                    </div>
                  </div>
                </Tile>
              );
            })}
          </div>
        </section>
      ))}

      <p className="note">
        Sixteen is a coarse instrument. It describes how attention and judgement tend to be ordered
        — not ability, not character, and not what someone is capable of becoming.
      </p>
    </>
  );
}

/** All sixteen, grouped by the reader's chosen axis. */
function groupTypes(by: SortBy): [string, MbtiType[]][] {
  if (by === "alpha") return [["", [...TYPES].sort()]];
  if (by === "quadra") {
    return (["Alpha", "Beta", "Gamma", "Delta"] as const).map(
      (q) => [q, TYPES.filter((t) => quadra(t) === q)] as [string, MbtiType[]],
    );
  }
  const seen = [...new Set(TYPES.map((t) => GROUP[t]))];
  return seen.map((g) => [g, TYPES.filter((t) => GROUP[t] === g)] as [string, MbtiType[]]);
}
