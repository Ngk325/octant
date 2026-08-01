import { useState, useId } from "react";
import { Link } from "react-router";
import { lookup, BY_ID, type Entry } from "../engine/lexicon";

/**
 * Inline glossary term. Click reveals the plain-language gloss first, then the
 * short technical definition, then a link to the full entry. Falls back to
 * plain text if the term is not in the lexicon.
 */
export default function Term({
  id, children, className,
}: { id?: string; children: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [flip, setFlip] = useState(false);
  const popId = useId();
  const entry: Entry | undefined = id ? BY_ID.get(id) : lookup(children);
  if (!entry) return <span className={className}>{children}</span>;

  return (
    /* The close-on-blur lives on the WRAPPER, not on the button. On the button
       it fired the moment focus moved to the "Full entry" link inside the
       popover, so a keyboard user could open the popover and never reach the
       link — it vanished on the very Tab that would have got there. Checking
       relatedTarget means the popover only closes when focus leaves the whole
       term, and Escape closes it deliberately. */
    // biome-ignore lint/a11y/noStaticElementInteractions: onBlur here is focus BOOKKEEPING, not interaction — the button inside is the interactive element, and the comment above says why the handler must sit on the wrapper.
    <span
      className="term-wrap"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        e.stopPropagation();
        setOpen(false);
        e.currentTarget.querySelector("button")?.focus();
      }}
    >
      <button
        type="button"
        className={`term${className ? ` ${className}` : ""}`}
        aria-expanded={open}
        aria-controls={popId}
        onClick={(e) => {
          /* The popover hangs from the trigger's left edge by default, which
             pushes it off-screen for a term near the right margin — measured
             here, and flipped to hang from the right edge instead. */
          const rect = e.currentTarget.getBoundingClientRect();
          const popWidth = Math.min(340, window.innerWidth * 0.8);
          setFlip(rect.left + popWidth > window.innerWidth - 8);
          setOpen((o) => !o);
        }}
      >
        {children}
        {/* The affordance was a 1px dashed border in --rule-strong: a pale
            hairline on warm paper that nobody read as "this is clickable", so
            every definition already attached to a term went undiscovered.
            aria-hidden because the button already announces the term and its
            expanded state — a spoken "question mark" after every piece of
            vocabulary would be worse than no marker at all. */}
        <span className="term-q" aria-hidden="true">?</span>
      </button>
      {open && (
        /* A disclosure, not a tooltip: it holds a link, and the trigger carries
           aria-expanded. role="tooltip" would contradict both. */
        // biome-ignore lint/a11y/useSemanticElements: no semantic inline element means "labelled group"; the comment above records why this is not role=tooltip either.
        <span className={`term-pop${flip ? " flip" : ""}`} id={popId} role="group" aria-label={`About ${entry.term}`}>
          <span className="small muted" style={{ display: "block", marginBottom: 4 }}>
            {entry.category}
          </span>
          <b>{entry.term}</b>
          {entry.plain && (
            <span style={{ display: "block", margin: "6px 0" }}>{entry.plain}</span>
          )}
          <span className="small muted" style={{ display: "block", margin: "4px 0 10px" }}>
            {entry.short}
          </span>
          <Link to={`/lexicon/${entry.id}`} className="chip">
            Full entry →
          </Link>
        </span>
      )}
    </span>
  );
}
