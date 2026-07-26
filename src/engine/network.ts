import { TYPES, REL, ease, quadra, type MbtiType } from "./core";
import { REL_NAME, type RelCode } from "./data";

export interface Member { id: string; name: string; type: MbtiType }
export interface Edge {
  from: Member; to: Member; code: RelCode; label: string; ease: number;
}
export interface NetworkReport {
  edges: Edge[];
  meanEase: number;
  perMember: { member: Member; received: number; given: number }[];
  weakest: Edge | null;
  strongest: Edge | null;
  quadras: { quadra: string; count: number }[];
  supervisionChains: string[];
  suggestions: { type: MbtiType; meanEase: number; delta: number }[];
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Directed edge from -> to reads: "how `from` experiences `to`". */
export function analyse(members: Member[]): NetworkReport {
  const edges: Edge[] = [];
  for (const a of members) {
    for (const b of members) {
      if (a.id === b.id) continue;
      const code = REL[a.type][b.type];
      edges.push({ from: a, to: b, code, label: REL_NAME[code], ease: ease(a.type, b.type) });
    }
  }
  const meanEase = mean(edges.map((e) => e.ease));

  const perMember = members.map((m) => ({
    member: m,
    received: Math.round(mean(edges.filter((e) => e.from.id === m.id).map((e) => e.ease))),
    given: Math.round(mean(edges.filter((e) => e.to.id === m.id).map((e) => e.ease))),
  }));

  const sorted = [...edges].sort((a, b) => a.ease - b.ease);
  const counts = new Map<string, number>();
  members.forEach((m) => counts.set(quadra(m.type), (counts.get(quadra(m.type)) ?? 0) + 1));

  const supervisionChains = edges
    .filter((e) => e.code === "SV")
    .map((e) => `${e.to.name} (${e.to.type}) supervises ${e.from.name} (${e.from.type})`);

  const suggestions = members.length
    ? TYPES.map((t) => {
        const cand: Member = { id: "__c", name: t, type: t };
        const withCand = analyse0([...members, cand]);
        return { type: t, meanEase: Math.round(withCand), delta: Math.round(withCand - meanEase) };
      })
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 4)
    : [];

  return {
    edges, meanEase: Math.round(meanEase), perMember,
    weakest: sorted[0] ?? null, strongest: sorted[sorted.length - 1] ?? null,
    quadras: [...counts].map(([q, count]) => ({ quadra: q, count }))
      .sort((a, b) => b.count - a.count),
    supervisionChains, suggestions,
  };
}

/** mean ease only, used for the "who should you add" search */
function analyse0(members: Member[]): number {
  const xs: number[] = [];
  for (const a of members) for (const b of members) {
    if (a.id !== b.id) xs.push(ease(a.type, b.type));
  }
  return mean(xs);
}
