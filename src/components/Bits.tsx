import type { ReactNode } from "react";
import { easeColor } from "../engine/palette";

export function Panel({ title, children, style, className }: {
  title?: string; children: ReactNode;
  style?: React.CSSProperties; className?: string;
}) {
  return (
    <section className={`panel${className ? ` ${className}` : ""}`} style={style}>
      {title && <span className="eyebrow">{title}</span>}
      {children}
    </section>
  );
}

export function Row({ k, v }: { k: ReactNode; v: ReactNode }) {
  return <div className="row"><dt>{k}</dt><dd>{v}</dd></div>;
}

export function EaseBar({ value }: { value: number }) {
  return (
    <div className="bar" aria-label={`ease ${value} of 100`}>
      <i style={{ width: `${value}%`, background: easeColor(value) }} />
    </div>
  );
}

export function Score({ value, caption }: { value: number; caption: string }) {
  return (
    <div>
      <div className="score" style={{ color: easeColor(value) }}>
        {value}<sub>/100</sub>
      </div>
      <div className="small" style={{ marginTop: 4 }}>{caption}</div>
    </div>
  );
}
