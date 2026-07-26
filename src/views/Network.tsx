import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TYPES, quadra, type MbtiType } from "../engine/core";
import { analyse, type Member } from "../engine/network";
import { easeColor, QUADRA_COLOR } from "../engine/palette";
import { Panel, Row, Score } from "../components/Bits";

const SEED: Member[] = [
  { id: "1", name: "You", type: "ENTP" },
  { id: "2", name: "Second", type: "INTJ" },
  { id: "3", name: "Third", type: "ISFJ" },
];

let nextId = 4;

export default function Network() {
  const [members, setMembers] = useState<Member[]>(SEED);
  const report = useMemo(() => analyse(members), [members]);

  const update = (id: string, patch: Partial<Member>) =>
    setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  return (
    <>
      <h1>Compose the network</h1>
      <p className="lede">
        Sixteen wirings give 256 scored, directed edges. A group is a weighted digraph — so
        the questions a grid cannot answer become arithmetic: where the single point of friction
        is, who is quietly carrying the room, and which one addition would change the most.
      </p>

      <div className="grid g-side" style={{ marginTop: 22, alignItems: "start" }}>
        <Panel title="The ring">
          <Ring members={members} report={report} />
          <p className="small" style={{ marginTop: 10 }}>
            Each chord is the mean of the two directions. Thickness carries distance from
            neutral; colour carries ease. Hover a chord for the relation.
          </p>
        </Panel>

        <div className="grid" style={{ gap: 14 }}>
          <Panel title="People">
            {members.map((m) => (
              <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <i className="dot" style={{ background: QUADRA_COLOR[quadra(m.type)] }} />
                <input type="text" value={m.name} aria-label="name" style={{ flex: 1 }}
                       onChange={(e) => update(m.id, { name: e.target.value })} />
                <select value={m.type}
                        onChange={(e) => update(m.id, { type: e.target.value as MbtiType })}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button className="ghost" aria-label={`Remove ${m.name}`}
                        onClick={() => setMembers((ms) => ms.filter((x) => x.id !== m.id))}>×</button>
              </div>
            ))}
            <button style={{ marginTop: 4 }}
                    onClick={() => setMembers((ms) => [
                      ...ms, { id: String(nextId++), name: `Person ${ms.length + 1}`, type: "ENFP" },
                    ])}>
              Add a person
            </button>
          </Panel>

          <Panel title="Reading">
            <div className="stat" style={{ marginBottom: 14 }}>
              <Score value={report.meanEase} caption="Mean ease across all edges" />
              <div>
                <b style={{ fontFamily: "var(--display)", fontWeight: 300, fontSize: 27 }}>
                  {members.length}
                </b>
                <div className="small">people · {report.edges.length} directed edges</div>
              </div>
            </div>
            {report.weakest && (
              <Row k="Weakest edge" v={
                <span>
                  <Link to={`/pair/${report.weakest.from.type}/${report.weakest.to.type}`}>
                    {report.weakest.from.name} → {report.weakest.to.name}
                  </Link>
                  <span className="small"> · {report.weakest.label} ·{" "}
                    <b style={{ color: easeColor(report.weakest.ease) }}>{report.weakest.ease}</b>
                  </span>
                </span>} />
            )}
            {report.strongest && (
              <Row k="Strongest edge" v={
                <span>
                  {report.strongest.from.name} → {report.strongest.to.name}
                  <span className="small"> · {report.strongest.label} ·{" "}
                    <b style={{ color: easeColor(report.strongest.ease) }}>{report.strongest.ease}</b>
                  </span>
                </span>} />
            )}
            <Row k="Quadras" v={
              <span style={{ display: "inline-flex", gap: 6 }}>
                {report.quadras.map((q) => (
                  <span key={q.quadra} className="chip">
                    <i className="dot" style={{ background: QUADRA_COLOR[q.quadra] }} />
                    {q.quadra} ×{q.count}
                  </span>
                ))}
              </span>} />
          </Panel>

          <Panel title="Per person">
            {report.perMember.map((p) => (
              <Row key={p.member.id}
                k={p.member.name.slice(0, 14) || p.member.type}
                v={<span className="small">
                    finds the room{" "}
                    <b style={{ color: easeColor(p.received) }}>{p.received}</b>
                    {" · "}the room finds them{" "}
                    <b style={{ color: easeColor(p.given) }}>{p.given}</b>
                  </span>} />
            ))}
          </Panel>
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 14 }}>
        <Panel title="Silent hierarchy — supervision edges">
          {report.supervisionChains.length ? (
            <ul className="plain">
              {report.supervisionChains.map((s) => <li key={s}>{s}</li>)}
            </ul>
          ) : (
            <p className="small" style={{ margin: 0 }}>
              No supervision edges. Correction in this group runs symmetrically, so no one is
              absorbing verdicts nobody realises they are issuing.
            </p>
          )}
          <p className="small" style={{ marginTop: 10 }}>
            Supervision is asymmetric and invisible from the supervisor&rsquo;s side. It is the
            most common source of a group where one person is quietly always slightly wrong.
          </p>
        </Panel>

        <Panel title="Who to add">
          {report.suggestions.map((s) => (
            <Row key={s.type}
              k={s.type}
              v={<span className="small">
                  mean ease → <b style={{ color: easeColor(s.meanEase) }}>{s.meanEase}</b>
                  {"  "}<span style={{ color: s.delta >= 0 ? "#8cbe96" : "#d66a58" }}>
                    ({s.delta >= 0 ? "+" : ""}{s.delta})
                  </span>
                </span>} />
          ))}
          <p className="small" style={{ marginTop: 10 }}>
            Searched across all sixteen. This optimises for structural complement, which is not
            the same as who you would enjoy hiring.
          </p>
        </Panel>
      </div>
    </>
  );
}

function Ring({ members, report }: { members: Member[]; report: ReturnType<typeof analyse> }) {
  const S = 420, C = S / 2, R = S / 2 - 66;
  if (members.length < 2) {
    return <p className="small">Add a second person to draw the network.</p>;
  }
  const pos = members.map((m, i) => {
    const a = (i / members.length) * Math.PI * 2 - Math.PI / 2;
    return { m, x: C + R * Math.cos(a), y: C + R * Math.sin(a), a };
  });

  const pairs: { a: typeof pos[0]; b: typeof pos[0]; ease: number; label: string }[] = [];
  for (let i = 0; i < pos.length; i++) {
    for (let j = i + 1; j < pos.length; j++) {
      const ab = report.edges.find((e) => e.from.id === pos[i].m.id && e.to.id === pos[j].m.id)!;
      const ba = report.edges.find((e) => e.from.id === pos[j].m.id && e.to.id === pos[i].m.id)!;
      pairs.push({
        a: pos[i], b: pos[j],
        ease: Math.round((ab.ease + ba.ease) / 2),
        label: `${pos[i].m.name} ↔ ${pos[j].m.name}: ${ab.label} · ${ab.ease}/${ba.ease}`,
      });
    }
  }

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ display: "block", maxWidth: 460 }}
         role="img" aria-label="Network ring">
      <defs>
        <filter id="ringglow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx={C} cy={C} r={R} fill="none" stroke="#151a22" strokeWidth="1" />

      {pairs.map((p, i) => (
        <path key={i}
          d={`M ${p.a.x} ${p.a.y} Q ${C} ${C} ${p.b.x} ${p.b.y}`}
          fill="none" stroke={easeColor(p.ease)}
          strokeWidth={1 + Math.abs(p.ease - 50) / 16}
          strokeOpacity={0.62} strokeLinecap="round">
          <title>{p.label}</title>
        </path>
      ))}

      {pos.map(({ m, x, y }) => (
        <g key={m.id}>
          <circle cx={x} cy={y} r="9" fill={QUADRA_COLOR[quadra(m.type)]} filter="url(#ringglow)" />
          <circle cx={x} cy={y} r="15" fill="none" stroke={QUADRA_COLOR[quadra(m.type)]}
                  strokeOpacity="0.3" />
          <text x={x} y={y - 22} textAnchor="middle" fill="#e7eaef"
                fontFamily="Inter" fontSize="11.5">{m.name}</text>
          <text x={x} y={y + 28} textAnchor="middle" fill="#6f7987"
                fontFamily="IBM Plex Mono" fontSize="10" letterSpacing="1">{m.type}</text>
        </g>
      ))}
    </svg>
  );
}
