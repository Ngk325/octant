import { quadra } from "../engine/core";
import { type Member, type analyse } from "../engine/network";
import { usePalette } from "./Theme";
import TypeMolecule from "./glyphs/TypeMolecule";

/** The group as a ring, every pair joined by a line coloured and weighted by ease. */
export default function NetworkRing({ members, report }: {
  members: Member[];
  report: ReturnType<typeof analyse>;
}) {
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

      {/* Each node is the member's molecule on a quadra-ringed backing disc.
          The molecule nests as an inner <svg> positioned by the wrapping
          transform; the outer svg's role="img" makes it presentational. */}
      {pos.map(({ m, x, y }) => (
        <g key={m.id}>
          <circle cx={x} cy={y} r="25" fill="var(--surface)" stroke={p.quadra(quadra(m.type))} strokeOpacity="0.55" strokeWidth="2" />
          <g transform={`translate(${x - 22}, ${y - 22})`}>
            <TypeMolecule type={m.type} size={44} labels={false} />
          </g>
          <text x={x} y={y - 32} textAnchor="middle" fill="var(--ink)" fontFamily="Inter, sans-serif" fontSize="15">
            {m.name}
          </text>
          <text x={x} y={y + 40} textAnchor="middle" fill="var(--muted)" fontFamily="'IBM Plex Mono', monospace" fontSize="14">
            {m.type}
          </text>
        </g>
      ))}
    </svg>
  );
}
