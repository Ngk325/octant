import type { CSSProperties, ReactNode } from "react";
import { usePalette } from "./Theme";

export function Panel({ title, children, style, className }: {
  title?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <section className={`card${className ? ` ${className}` : ""}`} style={style}>
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </section>
  );
}

export function Row({ k, v, stacked }: { k: ReactNode; v: ReactNode; stacked?: boolean }) {
  return (
    <div className={`row${stacked ? " stacked" : ""}`}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

export function EaseBar({ value }: { value: number }) {
  const p = usePalette();
  return (
    <div className="bar" role="img" aria-label={`ease ${value} out of 100`}>
      <i style={{ width: `${value}%`, background: p.ease(value) }} />
    </div>
  );
}

export function Score({ value, caption }: { value: number; caption: string }) {
  const p = usePalette();
  return (
    <div>
      <div className="score" style={{ color: p.ease(value) }}>
        {value}
        <sub>/100</sub>
      </div>
      <div className="small" style={{ marginTop: 4 }}>{caption}</div>
    </div>
  );
}

/** A function name in its own colour, used inline in prose. */
export function FnTag({ fn, children }: { fn: string; children?: ReactNode }) {
  const p = usePalette();
  return (
    <b className="mono" style={{ color: p.fn(fn as never), fontWeight: 500 }}>
      {children ?? fn}
    </b>
  );
}
