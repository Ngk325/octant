import { useState, useId } from "react";
import { Link } from "react-router-dom";
import { lookup, BY_ID, type Entry } from "../engine/lexicon";

/**
 * Inline glossary term. Click reveals the short definition and a link to the
 * full entry. Falls back to plain text if the term is not in the lexicon.
 */
export default function Term({
  id, children, className,
}: { id?: string; children: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const popId = useId();
  const entry: Entry | undefined = id ? BY_ID.get(id) : lookup(children);
  if (!entry) return <span className={className}>{children}</span>;

  return (
    <span className="term-wrap">
      <button
        type="button"
        className={`term${className ? ` ${className}` : ""}`}
        aria-expanded={open}
        aria-controls={popId}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </button>
      {open && (
        <span className="term-pop" id={popId} role="tooltip">
          <span className="eyebrow" style={{ marginBottom: 6 }}>{entry.category}</span>
          <b>{entry.term}</b>
          <span className="small" style={{ display: "block", margin: "4px 0 8px" }}>
            {entry.short}
          </span>
          <Link to={`/lexicon/${entry.id}`} className="chip" onMouseDown={(e) => e.preventDefault()}>
            Full entry →
          </Link>
        </span>
      )}
    </span>
  );
}
