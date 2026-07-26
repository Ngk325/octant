import { type ReactNode } from "react";

/**
 * A diagram presented as a figure inside prose, with a caption that says what
 * to look at. Diagrams in the first build were unlabelled panels of chrome; a
 * reader could not tell what they were supposed to notice.
 */
export default function Figure({
  label,
  caption,
  children,
}: {
  /** Short handle, e.g. "The signal path". */
  label?: string;
  /** What the reader should take from it, in plain language. */
  caption?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="fig">
      {children}
      {(label || caption) && (
        <figcaption>
          {label && <b>{label}</b>}
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
