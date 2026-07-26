import { type ReactNode } from "react";

/**
 * An anchored page section. The heading carries the id and the `.sec` class,
 * whose scroll-margin is derived from --masthead-h — so a deep link lands with
 * the heading clear of the sticky masthead at every width, and no view ever
 * writes a scroll offset by hand again. (The first build inlined
 * `scrollMarginTop: 88` six times, and the 88 was wrong whenever the tab row
 * wrapped.)
 */
export function Section({ id, title, children }: {
  id: string;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 id={id} className="sec">{title}</h2>
      {children}
    </section>
  );
}

/**
 * The in-page anchor row for a long reading page. Data-driven so adding a
 * section to a page is a one-array edit, and the nav cannot drift out of sync
 * with the sections it points at.
 */
export function SectionNav({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <nav className="cluster" aria-label="On this page" style={{ margin: "var(--s5) 0 var(--s6)" }}>
      {items.map(([id, label]) => (
        <a key={id} href={`#${id}`} className="chip">{label}</a>
      ))}
    </nav>
  );
}
