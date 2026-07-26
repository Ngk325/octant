import { type ReactNode } from "react";

/**
 * The plain-first pattern, used on every surface.
 *
 * Plain English leads. The precise technical text is one click beneath it and
 * is never removed, never paraphrased, and never gated behind a mode switch —
 * so a newcomer and someone who has done the reading get the same page, and
 * the newcomer can see exactly which vocabulary they are growing into.
 */
export default function Explain({
  plain,
  big,
  label = "The exact mechanics",
  children,
  open,
}: {
  /** One or two sentences, no jargon. */
  plain: ReactNode;
  /** Use at the top of a page, where the plain line is the lede. */
  big?: boolean;
  label?: string;
  /** The technical layer. Omit it and this is just a plain paragraph. */
  children?: ReactNode;
  open?: boolean;
}) {
  return (
    <div className="explain">
      <p className={`plain${big ? " big" : ""}`}>{plain}</p>
      {children != null && (
        <details className="mech" open={open}>
          <summary>{label}</summary>
          <div className="mech-body">{children}</div>
        </details>
      )}
    </div>
  );
}
