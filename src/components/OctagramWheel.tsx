import { type Wheel, type Development } from "../engine/octagram";

/**
 * One temple wheel, drawn.
 *
 * The shape is the point, and it is a cross rather than a list: the thing you
 * want sits at the centre, the honest way to get it is directly above, the
 * counterfeit is directly below, and the two sideways positions are the two
 * ways people actually drift — one if childhood fed them, one if it did not.
 *
 * Original artwork. Nothing here is traced from source material; the layout is
 * the app's own, in the app's own palette, and no text is below 14px.
 */
export default function OctagramWheel({
  wheel, development,
}: {
  wheel: Wheel;
  /** If given, the pole this person drifts toward is emphasised. */
  development?: Development;
}) {
  /* Laid out on a wide canvas so the two side labels have room to sit clear of
     the arms. The first version reused the vertical radius horizontally and the
     words ran straight through the centre ellipse. */
  const W = 760;
  const H = 320;
  const cx = W / 2;
  const cy = 150;

  const ORIGIN_RX = 78;
  const ORIGIN_RY = 46;
  const ARM_V = 84;   // vertical arm reaches this far from centre
  const ARM_H = 195;  // horizontal arm reaches this far
  const LABEL_H = 270; // side labels are centred this far out

  const lean =
    development === "SD" ? "aspirational" : development === "UD" ? "shadow" : null;

  const arms = [
    {
      key: "virtue" as const, label: "Living virtue", name: wheel.livingVirtue,
      x1: cx, y1: cy - ORIGIN_RY - 4, x2: cx, y2: cy - ARM_V,
      cap: { x: cx, y: cy - ARM_V - 36 }, nom: { x: cx, y: cy - ARM_V - 12 },
      colour: "var(--accent-ink)",
    },
    {
      key: "sin" as const, label: "Deadly sin", name: wheel.deadlySin,
      x1: cx, y1: cy + ORIGIN_RY + 4, x2: cx, y2: cy + ARM_V,
      cap: { x: cx, y: cy + ARM_V + 22 }, nom: { x: cx, y: cy + ARM_V + 46 },
      colour: "var(--danger)",
    },
    {
      key: "shadow" as const, label: "Shadow pole", name: wheel.shadowPole,
      x1: cx - ORIGIN_RX - 4, y1: cy, x2: cx - ARM_H, y2: cy,
      cap: { x: cx - LABEL_H, y: cy - 12 }, nom: { x: cx - LABEL_H, y: cy + 12 },
      colour: "var(--ink-2)",
    },
    {
      key: "aspirational" as const, label: "Aspirational pole", name: wheel.aspirationalPole,
      x1: cx + ORIGIN_RX + 4, y1: cy, x2: cx + ARM_H, y2: cy,
      cap: { x: cx + LABEL_H, y: cy - 12 }, nom: { x: cx + LABEL_H, y: cy + 12 },
      colour: "var(--ink-2)",
    },
  ];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block", margin: "0 auto" }}
      role="img"
      aria-label={
        `The ${wheel.origin} wheel, shared by ${wheel.pair.join(" and ")}. Living virtue ` +
        `${wheel.livingVirtue} above, deadly sin ${wheel.deadlySin} below, shadow pole ` +
        `${wheel.shadowPole} to one side and aspirational pole ${wheel.aspirationalPole} to the other.`
      }
    >
      <ellipse
        cx={cx} cy={cy} rx={ARM_H - 20} ry={ARM_V - 14}
        fill="none" stroke="var(--rule)" strokeWidth={1}
      />

      {arms.map((a) => {
        const on = lean === a.key;
        return (
          <g key={a.key}>
            <line
              x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
              stroke={on ? "var(--accent)" : "var(--rule-strong)"}
              strokeWidth={on ? 2 : 1}
            />
            <text
              x={a.cap.x} y={a.cap.y} textAnchor="middle"
              style={{ fontFamily: "var(--sans)", fontSize: 14, fill: "var(--muted)" }}
            >
              {a.label}
            </text>
            <text
              x={a.nom.x} y={a.nom.y} textAnchor="middle"
              style={{
                fontFamily: "var(--serif)",
                fontSize: 20,
                fontWeight: on ? 600 : 400,
                fill: on ? "var(--accent-ink)" : a.colour,
              }}
            >
              {a.name}
            </text>
            {on && (
              <text
                x={a.nom.x} y={a.nom.y + 22} textAnchor="middle"
                style={{ fontFamily: "var(--sans)", fontSize: 14, fill: "var(--accent-ink)" }}
              >
                {development === "SD" ? "where SD leans" : "where UD leans"}
              </text>
            )}
          </g>
        );
      })}

      <ellipse
        cx={cx} cy={cy} rx={ORIGIN_RX} ry={ORIGIN_RY}
        fill="var(--accent-soft)" stroke="var(--accent)"
      />
      <text
        x={cx} y={cy - 8} textAnchor="middle"
        style={{ fontFamily: "var(--sans)", fontSize: 14, fill: "var(--accent-ink)" }}
      >
        Origin
      </text>
      <text
        x={cx} y={cy + 16} textAnchor="middle"
        style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 600, fill: "var(--accent-ink)" }}
      >
        {wheel.origin}
      </text>

      <text
        x={cx} y={H - 8} textAnchor="middle"
        style={{ fontFamily: "var(--mono)", fontSize: 14, fill: "var(--muted)" }}
      >
        {wheel.pair.join(" · ")} — {wheel.temple} temple
      </text>
    </svg>
  );
}
