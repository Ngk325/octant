import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";
import { usePalette } from "./Theme";

/** A titled box. The app's only container primitive. */
export function Panel({ title, children, style, className, id }: {
  title?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  /** Anchor id — put deep-link targets on the card, not inside it, so the whole card scrolls into view. */
  id?: string;
}) {
  return (
    <section className={`card${className ? ` ${className}` : ""}`} style={style} id={id}>
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </section>
  );
}

/** A key/value row. `stacked` puts the value under the key for long text. */
export function Row({ k, v, stacked }: { k: ReactNode; v: ReactNode; stacked?: boolean }) {
  return (
    <div className={`row${stacked ? " stacked" : ""}`}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

/** A horizontal ease score, coloured by the same ramp the matrix uses. */
export function EaseBar({ value }: { value: number }) {
  const p = usePalette();
  return (
    <div className="bar" role="img" aria-label={`ease ${value} out of 100`}>
      <i style={{ width: `${value}%`, background: p.ease(value) }} />
    </div>
  );
}

/** A large number with a caption under it. */
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
export function FnTag({ fn, size, children }: {
  fn: string;
  /** Font size override, e.g. "var(--t-lg)" where the tag is a heading. */
  size?: string;
  children?: ReactNode;
}) {
  const p = usePalette();
  return (
    <b className="mono" style={{ color: p.fn(fn as never), fontWeight: 500, fontSize: size }}>
      {children ?? fn}
    </b>
  );
}

/**
 * A clickable card. The app's only linkable-tile primitive — the first build
 * hand-rolled this shell four times with four different padding/radius/shadow
 * combinations, which is how a design system stops being one.
 */
export function Tile({ to, selected, style, children }: {
  to: string;
  selected?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={`tile${selected ? " on" : ""}`} style={style}>
      {children}
    </Link>
  );
}

/**
 * A selectable answer card — a real control, not a `.btn` stretched into one.
 * The calculator's answers are two multi-line paragraphs a person chooses
 * between; a button primitive built for one inline line fought that layout at
 * every step.
 */
export function ChoiceCard({ selected, disabled, onClick, children }: {
  selected: boolean;
  disabled?: boolean;
  onClick(): void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`choice${selected ? " on" : ""}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
