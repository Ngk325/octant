import { TYPES, quadra, type MbtiType } from "../engine/core";
import { ARCHETYPE } from "../engine/data";
import { usePalette } from "./Theme";
import ArchetypeSeal from "./glyphs/ArchetypeSeal";

/**
 * A labelled type selector.
 *
 * Each option reads `ENTP · Prospector` — the type's own role name, not its
 * camp. The camp label answered a question nobody choosing a type is asking:
 * "Alpha" means nothing until you have read the quadra material, so the one
 * piece of help attached to the most-used control in the app was help only
 * for people who did not need it. The role name says something about the type
 * itself, which is what a reader is picking between.
 *
 * The camp is still here as the dot's colour, where it costs no reading and
 * groups the list visually.
 */
export default function TypePicker({
  label, value, onChange,
}: { label: string; value: MbtiType; onChange: (t: MbtiType) => void }) {
  const p = usePalette();
  return (
    <label className="field">
      <span>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ArchetypeSeal type={value} size={28} />
        <i className="dot" style={{ background: p.quadra(quadra(value)) }} title={`${quadra(value)} camp`} />
        <select value={value} onChange={(e) => onChange(e.target.value as MbtiType)}>
          {TYPES.map((t) => (
            /* The first of the three epithets. A dropdown row has space for
               one, and the type page shows all three. */
            <option key={t} value={t}>{t} · {ARCHETYPE[t][0]}</option>
          ))}
        </select>
      </span>
    </label>
  );
}
