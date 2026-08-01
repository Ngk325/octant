// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "../src/components/ErrorBoundary";

/* ------------------------------------------------------------------ *
 * The one test that needs a browser DOM: error boundaries only exist in
 * a real client render (renderToStaticMarkup just re-throws), and the
 * defect this guards was precisely a blank document — so the assertion
 * is that a throw leaves READABLE markup behind, not silence.
 * ------------------------------------------------------------------ */

function Bomb(): never {
  throw new Error("the lexicon regex returned null");
}

describe("ErrorBoundary", () => {
  let host: HTMLDivElement;
  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    /* React logs the caught error loudly; the catching IS the test. */
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    host.remove();
    vi.restoreAllMocks();
  });

  it("turns a render throw into a readable page instead of a blank one", async () => {
    await act(async () => {
      createRoot(host).render(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      );
    });
    expect(host.textContent).toContain("hit a fault");
    expect(host.querySelector('[role="alert"]')).toBeTruthy();
    expect(host.querySelector('a[href="/"]')).toBeTruthy();
  });

  it("does not render the raw exception text to the reader", async () => {
    /* The message can carry a member's name, an internal path, or a fragment
       of input; it belongs in the console (componentDidCatch), not on screen. */
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      createRoot(host).render(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      );
    });
    expect(host.textContent).not.toContain("the lexicon regex returned null");
    // But the detail DID reach the log for the owner.
    const logged = spy.mock.calls.some((args) =>
      args.some((a) => a instanceof Error && a.message === "the lexicon regex returned null"),
    );
    expect(logged).toBe(true);
  });

  it("names the region it guards, so the rail's fault reads as the rail's", async () => {
    await act(async () => {
      createRoot(host).render(
        <ErrorBoundary label="assistant">
          <Bomb />
        </ErrorBoundary>,
      );
    });
    expect(host.textContent).toContain("This assistant hit a fault");
  });

  it("renders children untouched when nothing throws", async () => {
    await act(async () => {
      createRoot(host).render(
        <ErrorBoundary>
          <p>all quiet</p>
        </ErrorBoundary>,
      );
    });
    expect(host.textContent).toBe("all quiet");
  });
});
