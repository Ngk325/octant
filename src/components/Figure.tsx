import type { ReactNode } from "react";

/**
 * A diagram presented as a figure inside prose, with a caption that says what
 * to look at. Diagrams in the first build were unlabelled panels of chrome; a
 * reader could not tell what they were supposed to notice.
 */
export default function Figure({
  label,
  caption,
  minWidth,
  children,
}: {
  /** Short handle, e.g. "The signal path". */
  label?: string;
  /** What the reader should take from it, in plain language. */
  caption?: ReactNode;
  /**
   * The narrowest the diagram may render, in px. Below it the figure scrolls
   * sideways instead of shrinking — which is the whole 14px-floor story for
   * SVG: a viewBox scales its text with the drawing, so without a floor a
   * phone renders the labels at five or six pixels. Set it to the viewBox
   * width so the labels never render below the size they were drawn at.
   * figure.fig already has overflow-x:auto; this is what makes it engage.
   */
  minWidth?: number;
  children: ReactNode;
}) {
  return (
    <figure className="fig">
      {minWidth ? <div style={{ minWidth }}>{children}</div> : children}
      {(label || caption) && (
        <figcaption>
          {label && <b>{label}</b>}
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
