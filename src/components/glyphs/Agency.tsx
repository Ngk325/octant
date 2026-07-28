import { ring, arrowhead } from "./geometry";

/**
 * The front four versus the back four, redrawn as a difference in WHO
 * decides rather than in strength: four marks reached FOR (an arrow moving
 * in, toward a hand you control) against four marks that go off on their
 * own (rays bursting outward from nothing you chose). Neither row is fainter
 * because it matters less — the second row is exactly as real, just not
 * yours to time.
 */
export default function Agency({ size = 34 }: { size?: number }) {
  return (
    <div
      role="img"
      aria-label="The front four are reached for, deliberately. The back four go off on their own, without being asked."
      style={{ display: "inline-flex", flexDirection: "column", gap: "var(--s3)" }}
    >
      <Row count={4} mode="chosen" size={size} label="You reach for these" />
      <Row count={4} mode="automatic" size={size} label="These go off on their own" />
    </div>
  );
}

function Row({ count, mode, size, label }: { count: number; mode: "chosen" | "automatic"; size: number; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s5)" }} aria-hidden="true">
      <span className="small muted" style={{ width: "15ch", flex: "0 0 auto" }}>{label}</span>
      <div style={{ display: "flex", gap: "var(--s4)" }}>
        {Array.from({ length: count }, (_, i) => (
          <Mark key={i} mode={mode} size={size} />
        ))}
      </div>
    </div>
  );
}

function Mark({ mode, size }: { mode: "chosen" | "automatic"; size: number }) {
  const c = "var(--ink)";
  const cx = size / 2, cy = size / 2, r = size * 0.16;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {mode === "chosen" ? (
        <>
          <line
            x1={size * 0.02} y1={cy} x2={cx - r - 2} y2={cy}
            stroke={c} strokeWidth="2" strokeLinecap="round"
          />
          <path d={arrowhead(cx - r - 1, cy, 1, 0, 4.5)} fill={c} />
          <circle cx={cx} cy={cy} r={r} fill={c} />
        </>
      ) : (
        <>
          {ring(cx, cy, r + 6, 5).map(({ x, y }, i) => (
            <line
              key={i}
              x1={cx + (x - cx) * 0.5} y1={cy + (y - cy) * 0.5} x2={x} y2={y}
              stroke={c} strokeWidth="1.6" strokeLinecap="round" opacity=".45"
            />
          ))}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth="2" opacity=".7" />
        </>
      )}
    </svg>
  );
}
