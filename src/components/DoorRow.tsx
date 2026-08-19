import type { MbtiType } from "../engine/core";
import { sides, SIDE_ORDER, type SideKey } from "../engine/sides";
import SideDoor from "./glyphs/SideDoor";

/**
 * All four doors of the mind in a row — open, ajar, cracked, barred — each
 * lintel naming its gateway seat. Drawing the whole row is the point:
 * access is a comparison, and one door alone cannot show it. Optionally
 * dims all but one door, for pages about a single side.
 */
export default function DoorRow({ type, emphasis }: {
  type: MbtiType;
  emphasis?: SideKey;
}) {
  const s = sides(type);
  return (
    <div className="cluster" style={{ gap: "var(--s4)", alignItems: "flex-end" }}>
      {SIDE_ORDER.map((k) => (
        <div key={k} style={{ textAlign: "center", opacity: emphasis && emphasis !== k ? 0.45 : 1 }}>
          <SideDoor side={k} gate={s[k].gateway.egoSlot} />
          <span className="small muted">{s[k].name}</span>
        </div>
      ))}
    </div>
  );
}
