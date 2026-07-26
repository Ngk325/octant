import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { TYPES, quadra, type MbtiType } from "../engine/core";
import { analyse, type Member } from "../engine/network";
import { usePalette } from "../components/Theme";
import { usePublishContext } from "../chat/ChatContext";
import Explain from "../components/Explain";
import Figure from "../components/Figure";
import { Panel, Row, Score } from "../components/Bits";

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
          mean ease, the weakest and strongest directed edges, any supervision chains, and which
          single addition would most raise the mean across all sixteen candidates.
        </p>
      </Explain>

      <div className="grid g-side" style={{ marginTop: "var(--s6)", alignItems: "start" }}>
        <Figure
          label="Each line is a relationship."
          caption="Thickness is distance from neutral; colour is ease. Hover a line for the relation and both directions."
        >
          <Ring members={members} report={report} />
        </Figure>

        <div className="stack-v">
          <Panel title="Who is in the room">
            {members.map((m) => (
              <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
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
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button
                  className="icon-btn"
                  aria-label={`Remove ${m.name}`}
                  onClick={() => setMembers((ms) => ms.filter((x) => x.id !== m.id))}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              className="btn"
              style={{ marginTop: "var(--s2)" }}
              onClick={() => {
                const id = String(nextId.current++);
                setMembers((ms) => [...ms, { id, name: `Person ${ms.length + 1}`, type: "ENFP" }]);
              }}
            >
              Add a person
            </button>
          </Panel>

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
                  <span className="small">
                    finds the room <b style={{ color: p.ease(m.received) }}>{m.received}</b> · the room
                    finds them <b style={{ color: p.ease(m.given) }}>{m.given}</b>
                  </span>
                }
              />
            ))}
          </Panel>
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: "var(--s5)" }}>
        <Panel title="Who is quietly always slightly wrong">
          <Explain plain="A supervision link is one-way: one person keeps landing corrections they have no idea they are issuing, and the other keeps absorbing verdicts that were never meant as verdicts. It is the single most common cause of one person in a group feeling permanently in the doghouse.">
            <p style={{ margin: 0 }}>
              Supervision is asymmetric and invisible from the supervisor&rsquo;s side: their Hero
              lands on the supervisee&rsquo;s vulnerable function.
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
          {report.suggestions.map((s) => (
            <Row
              key={s.type}
              k={<Link to={`/type/${s.type}`} className="mono">{s.type}</Link>}
              v={
                <span className="small">
                  average ease → <b style={{ color: p.ease(s.meanEase) }}>{s.meanEase}</b>{" "}
                  <span style={{ color: s.delta >= 0 ? "var(--accent-ink)" : "var(--danger)" }}>
                    ({s.delta >= 0 ? "+" : ""}{s.delta})
                  </span>
                </span>
              }
            />
          ))}
          <p className="small muted" style={{ marginTop: "var(--s3)", marginBottom: 0 }}>
            Searched across all sixteen. This optimises for structural fit, which is emphatically
            not the same thing as who you should hire.
          </p>
        </Panel>
      </div>
    </>
  );
}

function Ring({ members, report }: { members: Member[]; report: ReturnType<typeof analyse> }) {
  const p = usePalette();
  const S = 440, C = S / 2, R = S / 2 - 72;

  if (members.length < 2) {
    return <p className="small">Add a second person to draw the group.</p>;
  }

  const pos = members.map((m, i) => {
    const a = (i / members.length) * Math.PI * 2 - Math.PI / 2;
    return { m, x: C + R * Math.cos(a), y: C + R * Math.sin(a) };
  });

  const pairs: { a: (typeof pos)[0]; b: (typeof pos)[0]; ease: number; label: string }[] = [];
  for (let i = 0; i < pos.length; i++) {
    for (let j = i + 1; j < pos.length; j++) {
      const ab = report.edges.find((e) => e.from.id === pos[i].m.id && e.to.id === pos[j].m.id)!;
      const ba = report.edges.find((e) => e.from.id === pos[j].m.id && e.to.id === pos[i].m.id)!;
      pairs.push({
        a: pos[i],
        b: pos[j],
        ease: Math.round((ab.ease + ba.ease) / 2),
        label: `${pos[i].m.name} ↔ ${pos[j].m.name}: ${ab.label} · ${ab.ease}/${ba.ease}`,
      });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      width="100%"
      style={{ display: "block", maxWidth: 470, margin: "0 auto" }}
      role="img"
      aria-label={`Group of ${members.length}, average ease ${report.meanEase} out of 100`}
    >
      <circle cx={C} cy={C} r={R} fill="none" stroke="var(--rule)" strokeWidth="1" />

      {pairs.map((pr, i) => (
        <path
          key={i}
          d={`M ${pr.a.x} ${pr.a.y} Q ${C} ${C} ${pr.b.x} ${pr.b.y}`}
          fill="none"
          stroke={p.ease(pr.ease)}
          strokeWidth={1.5 + Math.abs(pr.ease - 50) / 14}
          strokeOpacity={0.75}
          strokeLinecap="round"
        >
          <title>{pr.label}</title>
        </path>
      ))}

      {pos.map(({ m, x, y }) => (
        <g key={m.id}>
          <circle cx={x} cy={y} r="10" fill={p.quadra(quadra(m.type))} />
          <circle cx={x} cy={y} r="16" fill="none" stroke={p.quadra(quadra(m.type))} strokeOpacity="0.3" strokeWidth="2" />
          <text x={x} y={y - 24} textAnchor="middle" fill="var(--ink)" fontFamily="Inter, sans-serif" fontSize="15">
            {m.name}
          </text>
          <text x={x} y={y + 32} textAnchor="middle" fill="var(--muted)" fontFamily="'IBM Plex Mono', monospace" fontSize="14">
            {m.type}
          </text>
        </g>
      ))}
    </svg>
  );
}
