import type { OpsSignature } from "../engine/ops";
import { ANIMAL_DOES, ANIMAL_KIND } from "../engine/ops";
import { usePalette } from "./Theme";
import AnimalGlyph from "./glyphs/AnimalGlyph";

const ROLE_LABEL: Record<string, string> = {
  savior: "Savior",
  activated: "Hobby",
  last: "Missing",
  open: "Undecided",
};

/**
 * The four animals in stack order. Positions 1 and 4 are derived; the two in
 * between need a coin the reader sets, so they are drawn as genuinely open
 * rather than quietly guessed at.
 */
export default function AnimalStack({ sig }: { sig: OpsSignature }) {
  const p = usePalette();

  return (
    <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {sig.animals.map((a) => {
        const open = a.role === "open";
        return (
          <li
            key={a.animal}
            style={{
              display: "grid",
              gridTemplateColumns: "34px 64px 1fr",
              gap: "var(--s3)",
              padding: "var(--s3) 0",
              borderBottom: "1px solid var(--rule)",
              marginBottom: 0,
              opacity: a.role === "last" ? 0.85 : 1,
            }}
          >
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: open ? "transparent" : "var(--surface-2)",
                border: open ? "1px dashed var(--rule-strong)" : "1px solid var(--rule)",
                fontFamily: "var(--sans)",
                fontSize: "var(--t-sm)",
                fontWeight: 600,
                color: open ? "var(--muted)" : "var(--ink)",
              }}
            >
              {a.position ?? "?"}
            </span>

            {/* The glyph repeats what the text says (arrows in, arrows out,
                the closed loop), so assistive tech only needs it once. */}
            <span aria-hidden="true" style={{ alignSelf: "center", opacity: open ? 0.55 : 1 }}>
              <AnimalGlyph animal={a.animal} />
            </span>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                <b style={{ fontFamily: "var(--serif)", fontSize: "var(--t-lg)", fontWeight: 500 }}>
                  {a.animal}
                </b>
                <span className="mono" style={{ fontSize: "var(--t-sm)" }}>
                  <b style={{ color: p.fn(a.obs), fontWeight: 500 }}>{a.obs}</b>
                  {" + "}
                  <b style={{ color: p.fn(a.dec), fontWeight: 500 }}>{a.dec}</b>
                </span>
                <span className="chip" style={{ fontSize: "var(--t-xs)" }}>
                  {ANIMAL_KIND[a.animal]}
                </span>
                <span
                  className="chip"
                  style={{
                    fontSize: "var(--t-xs)",
                    color: a.role === "last" ? "var(--warn)" : undefined,
                  }}
                >
                  {ROLE_LABEL[a.role]}
                </span>
              </div>
              <p className="small" style={{ margin: "4px 0 0" }}>{ANIMAL_DOES[a.animal]}</p>
              <p className="small muted" style={{ margin: "3px 0 0" }}>{a.note}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
