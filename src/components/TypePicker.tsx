import { TYPES, quadra, type MbtiType } from "../engine/core";
import { usePalette } from "./Theme";

/** A labelled type selector, quadra-coloured. */
export default function TypePicker({
  label, value, onChange,
}: { label: string; value: MbtiType; onChange: (t: MbtiType) => void }) {
  const p = usePalette();
  return (
    <label className="field">
      <span>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <i className="dot" style={{ background: p.quadra(quadra(value)) }} />
        <select value={value} onChange={(e) => onChange(e.target.value as MbtiType)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t} · {quadra(t)}</option>
          ))}
        </select>
      </span>
    </label>
  );
}
