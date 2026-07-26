import { TYPES, quadra, type MbtiType } from "../engine/core";
import { QUADRA_COLOR } from "../engine/palette";

export default function TypePicker({
  label, value, onChange,
}: { label: string; value: MbtiType; onChange: (t: MbtiType) => void }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span className="eyebrow" style={{ marginBottom: 0 }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <i className="dot" style={{ background: QUADRA_COLOR[quadra(value)] }} />
        <select value={value} onChange={(e) => onChange(e.target.value as MbtiType)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t} · {quadra(t)}</option>
          ))}
        </select>
      </span>
    </label>
  );
}
