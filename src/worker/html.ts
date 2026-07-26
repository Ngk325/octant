/* ------------------------------------------------------------------ *
 * HTML ESCAPING
 *
 * Three files in this Worker build HTML from strings a person controls
 * — a Google display name, an email address, an error from Google. Each
 * used to carry its own copy of this function, which is three chances
 * for one of them to be missing a character, and exactly the kind of
 * near-duplicate that goes stale in one place only.
 *
 * There is no DOM in a Worker, so there is nothing to escape with but a
 * function like this one. It covers the five characters that matter for
 * both element text and quoted attribute values.
 * ------------------------------------------------------------------ */

/** Escape anything a person controls before it goes into HTML. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
