import { stack, type MbtiType } from "../engine/core";
import { SLOT_NAMES } from "../engine/data";
import { FnTag } from "./Bits";

/**
 * The two growth readings, marked on one stack and left to disagree.
 *
 * This figure exists to show a divergence, not to resolve one, which is the
 * only honest way to draw the entry it belongs to: the eight-function
 * reading puts the weak point at the Cave alone, the exchange overlay marks
 * Delight and Cave together as the demon pair, and the system carries both
 * rather than averaging them. Drawing a single reconciled "weak point" would
 * assert exactly what "The two readings" refuses to claim — so both bands
 * are drawn at equal weight, neither is styled as the correct one, and the
 * slot where they disagree is the one the eye lands on.
 *
 * The bands are derived, not authored: the ego block IS stack positions 1-4,
 * the overlay's demons ARE its tertiary and inferior (see engine/ops.ts), so
 * the disagreement is a fact about the indices rather than a claim in prose.
 *
 * Original artwork.
 */
export default function TwoReadings({ type = "ENTP" }: { type?: MbtiType }) {
  const st = stack(type).slice(0, 4);

  /* Which of the four ego slots each reading calls the weak point. */
  const READINGS = [
    {
      name: "Eight-function stack",
      how: "Four letters, eight seats",
      marks: [3],
      says: "The Cave is the weak point.",
    },
    {
      name: "Exchange overlay",
      how: "Two letters, four orientations",
      marks: [2, 3],
      says: "Delight and Cave are the demon pair, together.",
    },
  ];

  /* The slot both readings name, and the slot only one does — computed so a
     change in either band cannot leave the caption behind. */
  const agreed = SLOT_NAMES.filter((_, i) => READINGS.every((r) => r.marks.includes(i)));
  const disputed = SLOT_NAMES.filter(
    (_, i) => READINGS.some((r) => r.marks.includes(i)) && !READINGS.every((r) => r.marks.includes(i)),
  );

  const label: React.CSSProperties = {
    fontFamily: "var(--sans)",
    fontSize: "var(--t-xs)",
    color: "var(--muted)",
  };

  return (
    <div
      role="img"
      aria-label={
        `The two growth readings for ${type}, disagreeing. The eight-function stack marks ` +
        `${SLOT_NAMES[3]} as the weak point; the exchange overlay marks ${SLOT_NAMES[2]} and ` +
        `${SLOT_NAMES[3]} together. They agree on ${agreed.join(" and ")} and disagree about ` +
        `${disputed.join(" and ")}. The system carries both readings rather than merging them.`
      }
      style={{ maxWidth: 560, fontFamily: "var(--sans)" }}
    >
      {/* the four ego slots, once */}
      <div style={{ display: "grid", gridTemplateColumns: "8.5rem repeat(4, minmax(0, 1fr))", gap: "var(--s2)" }}>
        <div />
        {st.map((fn, i) => (
          <div key={SLOT_NAMES[i]} style={{ textAlign: "center" }}>
            <div style={label}>{SLOT_NAMES[i]}</div>
            <FnTag fn={fn} />
          </div>
        ))}

        {READINGS.map((r) => (
          <Band key={r.name} reading={r} label={label} />
        ))}
      </div>

      <p className="small muted" style={{ margin: "var(--s3) 0 0" }}>
        Both readings are drawn. They agree on <b>{agreed.join(" and ")}</b> and disagree
        about <b>{disputed.join(" and ")}</b>, and that disagreement is carried rather than
        settled — fusing them produces incoherence, so the divergence is the content.
      </p>
    </div>
  );
}

/** One reading's claim, as a band across the slots it marks. */
function Band({ reading, label }: {
  reading: { name: string; how: string; marks: number[]; says: string };
  label: React.CSSProperties;
}) {
  return (
    <>
      <div style={{ ...label, alignSelf: "center", paddingTop: "var(--s2)" }}>
        <div style={{ color: "var(--ink-2)", fontWeight: 600 }}>{reading.name}</div>
        <div>{reading.how}</div>
      </div>
      {SLOT_NAMES.slice(0, 4).map((slot, i) => {
        const on = reading.marks.includes(i);
        return (
          <div
            key={slot}
            style={{
              marginTop: "var(--s2)",
              padding: "var(--s2) 0",
              textAlign: "center",
              borderRadius: "var(--radius)",
              /* Neither band is the authoritative one, so both use the same
                 ink at the same strength. */
              background: on ? "var(--accent-soft)" : "var(--surface-2)",
              border: `1px solid ${on ? "var(--accent)" : "var(--rule)"}`,
              color: on ? "var(--accent-ink)" : "var(--muted)",
              fontSize: "var(--t-xs)",
              fontWeight: on ? 600 : 400,
            }}
          >
            {on ? "weak point" : "—"}
          </div>
        );
      })}
    </>
  );
}
