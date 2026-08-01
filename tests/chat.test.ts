import { afterEach, describe, expect, it, vi } from "vitest";
import { handleChat, retryDelayMs, upstreamMessage, type Env } from "../src/worker/chat";

/* ------------------------------------------------------------------ *
 * The chat proxy's failure paths.
 *
 * The reported bug was a bare "The model returned 429." on screen: the
 * old code forwarded Gemini's status code into the UI, named "the model"
 * as the culprit, and gave the reader nothing to do. Gemini's free tier
 * meters per MINUTE, so an ordinary conversation trips it and it clears
 * on its own seconds later — which makes it both the most common failure
 * and the most fixable one.
 * ------------------------------------------------------------------ */

const NOW = 1_800_000_000_000;
const ENV = { GEMINI_API_KEY: "test-key" } as unknown as Env;

/** A distinct IP per test, so the per-isolate rate limiter cannot leak across them. */
let ipSeed = 0;
const post = (body: unknown = { messages: [{ role: "user", text: "hi" }] }) =>
  new Request("https://octant.example/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": `10.0.0.${++ipSeed}` },
    body: JSON.stringify(body),
  });

/** An upstream failure with an optional Retry-After. */
const fail = (status: number, retryAfter?: string) =>
  new Response("upstream detail that must not leak", {
    status,
    headers: retryAfter ? { "retry-after": retryAfter } : {},
  });

/** A successful upstream SSE stream carrying one text part. */
const ok = (text: string) =>
  new Response(
    new ReadableStream({
      start(c) {
        const frame = JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] });
        c.enqueue(new TextEncoder().encode(`data: ${frame}\n\n`));
        c.close();
      },
    }),
    { status: 200 },
  );

/** Drive handleChat past its one retry sleep without waiting in real time. */
async function withRetry(run: () => Promise<Response>): Promise<Response> {
  vi.useFakeTimers();
  try {
    const pending = run();
    await vi.advanceTimersByTimeAsync(3_000);
    return await pending;
  } finally {
    vi.useRealTimers();
  }
}

afterEach(() => vi.unstubAllGlobals());

describe("retryDelayMs", () => {
  it("honours Retry-After in seconds", () => {
    expect(retryDelayMs(fail(429, "1"))).toBe(1000);
  });

  it("caps a long Retry-After rather than holding the request open", () => {
    expect(retryDelayMs(fail(429, "600"))).toBe(2000);
  });

  it("falls back to a short pause when the header is absent or junk", () => {
    expect(retryDelayMs(fail(429))).toBe(900);
    expect(retryDelayMs(fail(429, "soon"))).toBe(900);
    expect(retryDelayMs(fail(429, "-5"))).toBe(900);
  });
});

describe("upstreamMessage", () => {
  it("never names a status code or blames 'the model' for a quota problem", () => {
    const msg = upstreamMessage(429);
    expect(msg).not.toMatch(/429/);
    expect(msg).toMatch(/wait/i);
  });

  /* RETIRED ASSERTION, 2026-08: this test used to require GEMINI_API_KEY in
     the 401/403 message and previously the 404 named src/worker/chat.ts.
     Those strings are served to every signed-in reader, who can act on
     neither — the secret's name and the file path belong in the log, not the
     response. The corrected assertion is the inverse: the reader is pointed
     at the owner, and the internals stay out. The unconfigured-503 test
     below still requires the exact wrangler command, because the person who
     hits an unconfigured deployment IS the owner. */
  it("sends auth and model failures to the owner without naming internals", () => {
    for (const s of [401, 403, 404]) {
      expect(upstreamMessage(s)).toMatch(/owner/i);
      expect(upstreamMessage(s)).not.toMatch(/GEMINI_API_KEY|src\/worker|DEPLOY\.md/);
    }
  });

  it("tells the reader to wait on a server-side fault", () => {
    expect(upstreamMessage(503)).toMatch(/try again/i);
  });

  it("always says what to do next", () => {
    for (const s of [400, 401, 403, 404, 429, 500, 503]) {
      expect(upstreamMessage(s).length, `status ${s}`).toBeGreaterThan(30);
    }
  });
});

describe("a rate-limited upstream", () => {
  it("retries once and succeeds without the reader ever seeing an error", async () => {
    const fetchStub = vi.fn()
      .mockResolvedValueOnce(fail(429, "1"))
      .mockResolvedValueOnce(ok("an answer"));
    vi.stubGlobal("fetch", fetchStub);

    const res = await withRetry(() => handleChat(post(), ENV, {}, NOW));

    expect(fetchStub).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("an answer");
  });

  it("gives an instruction, not a status code, when the retry also fails", async () => {
    const fetchStub = vi.fn().mockResolvedValue(fail(429, "1"));
    vi.stubGlobal("fetch", fetchStub);

    const res = await withRetry(() => handleChat(post(), ENV, {}, NOW));
    const body = (await res.json()) as { error: string };

    expect(fetchStub).toHaveBeenCalledTimes(2);
    // The whole point of the fix: 429 is passed through, not flattened to 502.
    expect(res.status).toBe(429);
    expect(body.error).not.toMatch(/The model returned/);
    expect(body.error).not.toMatch(/429/);
    expect(body.error).toMatch(/wait about a minute/i);
  });
});

describe("other upstream failures", () => {
  it("does not retry a rejected API key", async () => {
    const fetchStub = vi.fn().mockResolvedValue(fail(403));
    vi.stubGlobal("fetch", fetchStub);

    const res = await handleChat(post(), ENV, {}, NOW);
    const body = (await res.json()) as { error: string };

    expect(fetchStub).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(502);
    /* Was /GEMINI_API_KEY/ — retired with the message change; see the
       upstreamMessage tests above for the reasoning. */
    expect(body.error).toMatch(/owner/i);
  });

  it("retries a 503 and reports it plainly when it persists", async () => {
    const fetchStub = vi.fn().mockResolvedValue(fail(503));
    vi.stubGlobal("fetch", fetchStub);

    const res = await withRetry(() => handleChat(post(), ENV, {}, NOW));
    const body = (await res.json()) as { error: string };

    expect(fetchStub).toHaveBeenCalledTimes(2);
    expect(body.error).toMatch(/try again/i);
  });

  it("never echoes the upstream body back to the caller", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fail(400)));

    const res = await handleChat(post(), ENV, {}, NOW);
    const body = (await res.json()) as { error: string };

    expect(body.error).not.toMatch(/upstream detail/);
  });

  it("explains how to configure the key when none is set", async () => {
    const res = await handleChat(post(), {} as Env, {}, NOW);
    const body = (await res.json()) as { error: string };

    expect(res.status).toBe(503);
    expect(body.error).toMatch(/wrangler secret put GEMINI_API_KEY/);
  });
});
