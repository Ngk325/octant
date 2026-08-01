import React from "react";

/* ------------------------------------------------------------------ *
 * The page that renders when a view throws.
 *
 * Without this, one throw anywhere in a render blanked the entire
 * document — no message, no way back, nothing in the console for the
 * reader to act on. Several engine call sites assert with `!` on
 * derived lookups; those assertions are correct today and tested, but
 * "tested today" is not a property of future edits, and the cost of
 * being wrong was the whole app.
 *
 * A class, because error boundaries still are: React 19 has no hook
 * equivalent for getDerivedStateFromError.
 * ------------------------------------------------------------------ */

interface Props {
  children: React.ReactNode;
  /** Names the region in the fallback, so "the assistant failed" reads differently from "the page failed". */
  label?: string;
}

interface State { failed: boolean }

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  /* The exception detail goes HERE, to the console, and nowhere the reader can
     see — the same posture the chat errors take (see upstreamMessage in
     chat.ts). A raw message can carry a network member's name, an internal
     path, or a fragment of input, and none of that belongs on screen; the
     reader gets a way forward, the owner gets the detail in the log. */
  componentDidCatch(err: unknown): void {
    console.error(`[octant] ${this.props.label ?? "view"} render failed:`, err);
  }

  render(): React.ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="sec" role="alert">
        <h2>This {this.props.label ?? "page"} hit a fault</h2>
        <p>
          Something in the drawing of this screen failed — the fault is in the software, not in
          anything you did, and nothing you entered has been lost from the rest of the app.
        </p>
        <p className="small muted">
          If it keeps happening, tell the person who runs this deployment; the technical detail is
          in the browser console.
        </p>
        <p>
          <a className="btn primary" href="/">
            Back to the start
          </a>{" "}
          <button type="button" className="btn ghost" onClick={() => window.location.reload()}>
            Reload this page
          </button>
        </p>
      </section>
    );
  }
}
