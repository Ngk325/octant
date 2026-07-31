import { COIN_LABELS, DETERMINING, CONFIRMING } from "../engine/data";

/**
 * The eight switches, split by the only thing that distinguishes them: four
 * fix the type and four cannot add evidence.
 *
 * The entry states this as arithmetic — coins 1, 3, 4 and 5 give sixteen
 * unique signatures, and the other four are derivable from them — and then
 * has to explain in prose why the derivable four are kept anyway. The split
 * is the whole content, so it is drawn as a split: two labelled groups, not
 * eight switches in a row with a note underneath.
 *
 * Membership comes from DETERMINING and CONFIRMING rather than from a list
 * here, so this cannot disagree with the calculator that scores them. The
 * two named derivations are annotated because they are the entry's evidence
 * for the claim: coin 2 is the exact inverse of coin 3, and coin 8 is a
 * function of 6 and 7.
 *
 * Original artwork.
 */
export default function CoinSet() {
  const determining = DETERMINING as readonly number[];

  /* Why each derivable coin is derivable, where the entry names a reason.
     Keyed by zero-based index; the two the entry does not derive explicitly
     get no annotation rather than an invented one. */
  const WHY: Record<number, string> = {
    1: "the exact inverse of switch 3",
    7: "a function of switches 6 and 7",
  };

  return (
    <div
      role="img"
      aria-label={
        `The eight switches in two groups. Switches ${determining.map((i) => i + 1).join(", ")} ` +
        `fix the type exactly. Switches ${(CONFIRMING as readonly number[]).map((i) => i + 1).join(", ")} ` +
        `are derivable from those four and cannot add evidence, but are kept because disagreement ` +
        `between self-report and structure is itself informative.`
      }
      style={{ display: "grid", gap: "var(--s4)", maxWidth: 560, fontFamily: "var(--sans)" }}
    >
      <Group
        heading="Fix the type"
        note="Four independent bits — sixteen unique signatures."
        indices={determining}
        on
      />
      <Group
        heading="Cannot add evidence"
        note="Derivable from the four above. Kept because a clash between what you say and what the structure predicts is itself worth seeing."
        indices={CONFIRMING as readonly number[]}
        why={WHY}
      />
    </div>
  );
}

function Group({ heading, note, indices, on, why }: {
  heading: string;
  note: string;
  indices: readonly number[];
  on?: boolean;
  why?: Record<number, string>;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "var(--t-xs)",
          fontWeight: 600,
          color: on ? "var(--accent-ink)" : "var(--muted)",
          marginBottom: "var(--s2)",
        }}
      >
        {heading}
      </div>
      <div style={{ display: "grid", gap: "var(--s2)" }}>
        {indices.map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--s3)",
              padding: "var(--s2) var(--s3)",
              borderRadius: "var(--radius)",
              background: on ? "var(--accent-soft)" : "var(--surface-2)",
              border: `1px solid ${on ? "var(--accent)" : "var(--rule)"}`,
            }}
          >
            <Switch on={on} />
            <span style={{ fontSize: "var(--t-sm)", color: "var(--ink)" }}>
              <b style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>{i + 1}</b>{" "}
              {COIN_LABELS[i]}
            </span>
            {why?.[i] && (
              <span style={{ fontSize: "var(--t-xs)", color: "var(--muted)", marginLeft: "auto" }}>
                {why[i]}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="small muted" style={{ margin: "var(--s2) 0 0" }}>{note}</p>
    </div>
  );
}

/**
 * A switch, drawn as one: a track with the knob at one end. Which end is
 * arbitrary — a coin has no preferred pole — so both groups draw it the same
 * way and only the emphasis differs.
 */
function Switch({ on }: { on?: boolean }) {
  const c = on ? "var(--accent)" : "var(--rule-strong)";
  return (
    <svg width="26" height="15" viewBox="0 0 26 15" aria-hidden="true" style={{ flex: "0 0 auto" }}>
      <rect x="0.75" y="0.75" width="24.5" height="13.5" rx="6.75" fill="none" stroke={c} strokeWidth="1.5" />
      <circle cx={on ? 18.5 : 7.5} cy="7.5" r="4.25" fill={c} />
    </svg>
  );
}
