import type { Wheel, Development } from "../engine/octagram";
import useMeasuredWidth from "./useMeasuredWidth";

/**
 * One temple wheel, drawn.
 *
 * The shape is the point, and it is a cross rather than a list: the thing you
 * want sits at the centre, the honest way to get it is directly above, the
 * counterfeit is directly below, and the two sideways positions are the two
 * ways people actually drift — one if childhood fed them, one if it did not.
 *
 * Two canvases, one meaning. The wide layout (760×320) needs at least its own
 * width to keep every label at 14px, because SVG text scales with the viewBox
 * — and this component historically sat in ~500px columns rendering its
 * labels at 9px. So the component measures its container: given less than the
 * wide canvas, it redraws on a tall canvas (440×500) with the side labels
 * pulled in beside shorter arms. Same cross, same reading, no tiny text.
 *
 * Original artwork. Nothing here is traced from source material; the layout is
 * the app's own, in the app's own palette, and no text is below 14px.
 */
export default function OctagramWheel({
  wheel, development, layout,
}: {
  wheel: Wheel;
  /** If given, the pole this person drifts toward is emphasised. */
  development?: Development;
  /** Force a canvas; omit to pick by measured container width. */
  layout?: "wide" | "tall";
}) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();

  const auto: "wide" | "tall" =
    width !== null
      ? width >= 760 ? "wide" : "tall"
      : typeof window !== "undefined" && window.innerWidth < 900 ? "tall" : "wide";
  const mode = layout ?? auto;

  return (
    <div ref={ref}>
      {mode === "wide" ? <WheelWide wheel={wheel} development={development} />
        : <WheelTall wheel={wheel} development={development} />}
    </div>
  );
}

interface Arm {
  key: "virtue" | "sin" | "shadow" | "aspirational";
  label: string;
  name: string;
  x1: number; y1: number; x2: number; y2: number;
  cap: { x: number; y: number };
  nom: { x: number; y: number };
  /** Where the "where SD/UD leans" note goes when this pole is emphasised. */
  note: { x: number; y: number };
  colour: string;
}

const describe = (wheel: Wheel) =>
  `The ${wheel.origin} wheel, shared by ${wheel.pair.join(" and ")}. Living virtue ` +
  `${wheel.livingVirtue} above, deadly sin ${wheel.deadlySin} below, shadow pole ` +
  `${wheel.shadowPole} to one side and aspirational pole ${wheel.aspirationalPole} to the other.`;

function WheelBody({
  wheel, development, W, H, cx, cy, originRx, originRy, ringRx, ringRy, arms, nameSize,
}: {
  wheel: Wheel;
  development?: Development;
  W: number; H: number; cx: number; cy: number;
  originRx: number; originRy: number; ringRx: number; ringRy: number;
  arms: Arm[];
  nameSize: number;
}) {
  const lean =
    development === "SD" ? "aspirational" : development === "UD" ? "shadow" : null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block", margin: "0 auto" }}
      role="img"
      aria-label={describe(wheel)}
    >
      <ellipse
        cx={cx} cy={cy} rx={ringRx} ry={ringRy}
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
                fontSize: nameSize,
                fontWeight: on ? 600 : 400,
                fill: on ? "var(--accent-ink)" : a.colour,
              }}
            >
              {a.name}
            </text>
            {on && (
              <text
                x={a.note.x} y={a.note.y} textAnchor="middle"
                style={{ fontFamily: "var(--sans)", fontSize: 14, fill: "var(--accent-ink)" }}
              >
                {development === "SD" ? "where SD leans" : "where UD leans"}
              </text>
            )}
          </g>
        );
      })}

      <ellipse
        cx={cx} cy={cy} rx={originRx} ry={originRy}
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

/** The original wide canvas: side labels sit clear beyond long horizontal arms. */
function WheelWide({ wheel, development }: { wheel: Wheel; development?: Development }) {
  const W = 760, H = 320, cx = W / 2, cy = 150;
  const ORIGIN_RX = 78, ORIGIN_RY = 46;
  const ARM_V = 84, ARM_H = 195, LABEL_H = 270;

  const arms: Arm[] = [
    {
      key: "virtue", label: "Living virtue", name: wheel.livingVirtue,
      x1: cx, y1: cy - ORIGIN_RY - 4, x2: cx, y2: cy - ARM_V,
      cap: { x: cx, y: cy - ARM_V - 36 }, nom: { x: cx, y: cy - ARM_V - 12 },
      note: { x: cx, y: cy - ARM_V + 10 },
      colour: "var(--accent-ink)",
    },
    {
      key: "sin", label: "Deadly sin", name: wheel.deadlySin,
      x1: cx, y1: cy + ORIGIN_RY + 4, x2: cx, y2: cy + ARM_V,
      cap: { x: cx, y: cy + ARM_V + 22 }, nom: { x: cx, y: cy + ARM_V + 46 },
      note: { x: cx, y: cy + ARM_V + 68 },
      colour: "var(--danger)",
    },
    {
      key: "shadow", label: "Shadow pole", name: wheel.shadowPole,
      x1: cx - ORIGIN_RX - 4, y1: cy, x2: cx - ARM_H, y2: cy,
      cap: { x: cx - LABEL_H, y: cy - 12 }, nom: { x: cx - LABEL_H, y: cy + 12 },
      note: { x: cx - LABEL_H, y: cy + 34 },
      colour: "var(--ink-2)",
    },
    {
      key: "aspirational", label: "Aspirational pole", name: wheel.aspirationalPole,
      x1: cx + ORIGIN_RX + 4, y1: cy, x2: cx + ARM_H, y2: cy,
      cap: { x: cx + LABEL_H, y: cy - 12 }, nom: { x: cx + LABEL_H, y: cy + 12 },
      note: { x: cx + LABEL_H, y: cy + 34 },
      colour: "var(--ink-2)",
    },
  ];

  return (
    <WheelBody
      wheel={wheel} development={development}
      W={W} H={H} cx={cx} cy={cy}
      originRx={ORIGIN_RX} originRy={ORIGIN_RY}
      ringRx={ARM_H - 20} ringRy={ARM_V - 14}
      arms={arms} nameSize={20}
    />
  );
}

/**
 * The narrow canvas. Same cross; the side labels tuck in beside shorter arms —
 * role caption above the arm, pole name below it — instead of sitting far out
 * where a phone has no room. Names step to 18px so the longest
 * ("Objectification") clears the centre ellipse; 18 ≥ the 14px floor.
 */
function WheelTall({ wheel, development }: { wheel: Wheel; development?: Development }) {
  const W = 440, H = 500, cx = W / 2, cy = 230;
  const ORIGIN_RX = 78, ORIGIN_RY = 46;
  const ARM_V = 110, ARM_H = 130, LABEL_H = 145;

  const arms: Arm[] = [
    {
      key: "virtue", label: "Living virtue", name: wheel.livingVirtue,
      x1: cx, y1: cy - ORIGIN_RY - 4, x2: cx, y2: cy - ARM_V,
      cap: { x: cx, y: cy - ARM_V - 36 }, nom: { x: cx, y: cy - ARM_V - 12 },
      note: { x: cx, y: cy - ARM_V + 10 },
      colour: "var(--accent-ink)",
    },
    {
      key: "sin", label: "Deadly sin", name: wheel.deadlySin,
      x1: cx, y1: cy + ORIGIN_RY + 4, x2: cx, y2: cy + ARM_V,
      cap: { x: cx, y: cy + ARM_V + 22 }, nom: { x: cx, y: cy + ARM_V + 46 },
      note: { x: cx, y: cy + ARM_V + 68 },
      colour: "var(--danger)",
    },
    {
      key: "shadow", label: "Shadow pole", name: wheel.shadowPole,
      x1: cx - ORIGIN_RX - 4, y1: cy, x2: cx - ARM_H, y2: cy,
      cap: { x: cx - LABEL_H, y: cy - 26 }, nom: { x: cx - LABEL_H, y: cy + 30 },
      note: { x: cx - LABEL_H, y: cy + 52 },
      colour: "var(--ink-2)",
    },
    {
      key: "aspirational", label: "Aspirational pole", name: wheel.aspirationalPole,
      x1: cx + ORIGIN_RX + 4, y1: cy, x2: cx + ARM_H, y2: cy,
      cap: { x: cx + LABEL_H, y: cy - 26 }, nom: { x: cx + LABEL_H, y: cy + 30 },
      note: { x: cx + LABEL_H, y: cy + 52 },
      colour: "var(--ink-2)",
    },
  ];

  return (
    <WheelBody
      wheel={wheel} development={development}
      W={W} H={H} cx={cx} cy={cy}
      originRx={ORIGIN_RX} originRy={ORIGIN_RY}
      ringRx={ARM_H - 20} ringRy={ARM_V - 14}
      arms={arms} nameSize={18}
    />
  );
}
