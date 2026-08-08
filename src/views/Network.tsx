import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { TYPES, quadra, type MbtiType } from "../engine/core";
import { ARCHETYPE } from "../engine/data";
import { analyse, type Member } from "../engine/network";
import { usePalette } from "../components/Theme";
import { usePublishContext } from "../chat/ChatContext";
import Explain from "../components/Explain";
import Figure from "../components/Figure";
import { Panel, Row, Score, Tile } from "../components/Bits";
import DivergingEase from "../components/DivergingEase";
import NetworkRing from "../components/NetworkRing";

const SEED: Member[] = [
  { id: "1", name: "You", type: "ENTP" },
  { id: "2", name: "Second", type: "INTJ" },
  { id: "3", name: "Third", type: "ISFJ" },
];

/** A whole group as a weighted digraph. */
export default function Network() {
  const [members, setMembers] = useState<Member[]>(SEED);
  const report = useMemo(() => analyse(members), [members]);
  const p = usePalette();
  /* Per-mount, and bumped OUTSIDE the state updater. A module-level counter
     incremented inside the updater is a side effect in a function React is
     free to call twice, so ids skipped in StrictMode and leaked between
     mounts. */
  const nextId = useRef(SEED.length + 1);

  usePublishContext(
    () => ({ kind: "network", members: members.map((m) => ({ name: m.name, type: m.type })) }),
    [members.map((m) => `${m.name}:${m.type}`).join("|")],
  );

  /** Patch one member of the group. */
  const update = (id: string, patch: Partial<Member>) =>
    setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  return (
    <>
      <h1>Read a whole group</h1>

      <Explain
        big
        plain="Add the people in a team, a family or a house share. Because every pair can be scored in both directions, questions that usually get argued about — who is struggling, who is quietly holding it together, who to add — become arithmetic."
      >
        <p>
          An n-person group is a weighted directed graph over the ease matrix. This view reports
          mean ease, the weakest and strongest directed edges, any Examiner chains, and which
          single addition would most raise the mean across all sixteen candidates.
        </p>
      </Explain>

      {/* The editor first, full width: it is the only input on the page, and
          it used to sit in the narrow sidebar BELOW the diagram it controls —
          on a phone you scrolled past a stale picture to change anything. */}
      <Panel title="Who is in the room" style={{ marginTop: "var(--s6)" }}>
        <div className="grid g-auto" style={{ gap: "var(--s3)" }}>
          {members.map((m) => (
            <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <i className="dot" style={{ background: p.quadra(quadra(m.type)) }} />
              <input
                type="text"
                value={m.name}
                aria-label={`Name of person ${m.id}`}
                style={{ flex: 1, minWidth: 0 }}
                onChange={(e) => update(m.id, { name: e.target.value })}
              />
              <select
                value={m.type}
                aria-label={`Type of ${m.name}`}
                onChange={(e) => update(m.id, { type: e.target.value as MbtiType })}
              >
                {/* Named the same way as every other type picker. */}
                {TYPES.map((t) => <option key={t} value={t}>{t} · {ARCHETYPE[t][0]}</option>)}
              </select>
              <button type="button"
                className="icon-btn"
                aria-label={`Remove ${m.name}`}
                onClick={() => setMembers((ms) => ms.filter((x) => x.id !== m.id))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button type="button"
          className="btn"
          style={{ marginTop: "var(--s4)" }}
          onClick={() => {
            const id = String(nextId.current++);
            setMembers((ms) => [...ms, { id, name: `Person ${ms.length + 1}`, type: "ENFP" }]);
          }}
        >
          Add a person
        </button>
      </Panel>

      {/* Readings in the wide column; the ring — a fixed-size drawing that
          cannot fill a wide column — in the narrow one. */}
      <div className="grid g-side" style={{ marginTop: "var(--s5)", alignItems: "start" }}>
        <div className="stack-v">
          <Panel title="The reading">
            <div className="stat" style={{ marginBottom: "var(--s4)" }}>
              <Score value={report.meanEase} caption="Average ease across the group" />
              <div>
                <b>{members.length}</b>
                <div className="small">people · {report.edges.length} directed links</div>
              </div>
            </div>

            {report.weakest && (
              <Row
                stacked
                k="Hardest single direction"
                v={
                  <span className="small">
                    <Link to={`/pair/${report.weakest.from.type}/${report.weakest.to.type}`}>
                      {report.weakest.from.name} → {report.weakest.to.name}
                    </Link>{" "}
                    · {report.weakest.label} · <b style={{ color: p.ease(report.weakest.ease) }}>{report.weakest.ease}</b>
                  </span>
                }
              />
            )}
            {report.strongest && (
              <Row
                stacked
                k="Easiest single direction"
                v={
                  <span className="small">
                    {report.strongest.from.name} → {report.strongest.to.name} · {report.strongest.label} ·{" "}
                    <b style={{ color: p.ease(report.strongest.ease) }}>{report.strongest.ease}</b>
                  </span>
                }
              />
            )}
            <Row
              k="Quadras present"
              v={
                <span className="cluster" style={{ justifyContent: "flex-end" }}>
                  {report.quadras.map((q) => (
                    <span key={q.quadra} className="chip">
                      <i className="dot" style={{ background: p.quadra(q.quadra) }} />
                      {q.quadra} ×{q.count}
                    </span>
                  ))}
                </span>
              }
            />
          </Panel>

          <Panel title="Person by person">
            {report.perMember.map((m) => (
              <Row
                key={m.member.id}
                stacked
                k={m.member.name || m.member.type}
                v={
                  <div style={{ maxWidth: 420 }}>
                    <DivergingEase
                      toward={m.received}
                      from={m.given}
                      labels={["finds the room", "the room finds them"]}
                    />
                  </div>
                }
              />
            ))}
          </Panel>
        </div>

        <Figure
          minWidth={440}
          label="Each line is a relationship."
          caption="Thickness is distance from neutral; colour is ease. Hover a line for the relation and both directions. The person-by-person bars carry what the averaged lines cannot: the two directions separately."
        >
          <NetworkRing members={members} report={report} />
        </Figure>
      </div>

      <div className="grid g2" style={{ marginTop: "var(--s5)" }}>
        <Panel title="Who is quietly always slightly wrong">
          <Explain plain="An Examiner-Examined link is one-way: one person keeps landing corrections they have no idea they are issuing, and the other keeps absorbing verdicts that were never meant as verdicts. It is the single most common cause of one person in a group feeling permanently in the doghouse.">
            <p style={{ margin: 0 }}>
              Examination is asymmetric and invisible from the Examiner&rsquo;s side: their Lead
              lands on the Examined&rsquo;s vulnerable function.
            </p>
          </Explain>

          {report.supervisionChains.length ? (
            <ul>
              {report.supervisionChains.map((s) => <li key={s}>{s}</li>)}
            </ul>
          ) : (
            <p className="small" style={{ margin: 0 }}>
              None here. Correction in this group runs symmetrically, so nobody is absorbing
              verdicts nobody realises they are issuing.
            </p>
          )}
        </Panel>

        <Panel title="If you could add one person">
          <div className="grid g-auto" style={{ gap: "var(--s3)" }}>
            {report.suggestions.map((s) => (
              <Tile key={s.type} to={`/type/${s.type}`} style={{ padding: "var(--s3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span className="mono">{s.type}</span>
                  <span className="small" style={{ color: s.delta >= 0 ? "var(--accent-ink)" : "var(--danger)" }}>
                    {s.delta >= 0 ? "+" : ""}{s.delta}
                  </span>
                </div>
                <div className="small muted">
                  average ease → <b style={{ color: p.ease(s.meanEase) }}>{s.meanEase}</b>
                </div>
              </Tile>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: "var(--s3)", marginBottom: 0 }}>
            Searched across all sixteen. This optimises for structural fit, which is emphatically
            not the same thing as who you should hire.
          </p>
        </Panel>
      </div>
    </>
  );
}
