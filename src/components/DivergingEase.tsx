import { usePalette } from "./Theme";

/**
 * Both directions of ease as one figure: two bars growing away from a shared
 * centre axis. This replaces two stacked, visually unrelated bars — which is
 * how the app's single most distinctive claim (ease is directional; a
 * relationship can be restful from one side and expensive from the other)
 * used to be invisible in its own picture.
 */
export default function DivergingEase({
  toward, from, labels,
}: {
  /** Ease for the first party — drawn growing rightward. */
  toward: number;
  /** Ease for the second party — drawn growing leftward. */
  from: number;
  /** [label for `toward`, label for `from`]. */
  labels: [string, string];
}) {
  const p = usePalette();
  return (
    <div
      className="diverge"
      role="img"
      aria-label={`${labels[0]}: ${toward} out of 100. ${labels[1]}: ${from} out of 100.`}
    >
      <DivergeRow value={from} label={labels[1]} side="left" color={p.ease(from)} />
      <div className="diverge-axis" aria-hidden="true" />
      <DivergeRow value={toward} label={labels[0]} side="right" color={p.ease(toward)} />
    </div>
  );
}

function DivergeRow({ value, label, side, color }: {
  value: number; label: string; side: "left" | "right"; color: string;
}) {
  return (
    <div className={`diverge-half ${side}`}>
      <span className="diverge-num mono" style={{ color }}>{value}</span>
      <span className="diverge-bar" aria-hidden="true">
        <i style={{ width: `${value}%`, background: color }} />
      </span>
      <span className="diverge-label small muted">{label}</span>
    </div>
  );
}
