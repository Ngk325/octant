import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMail, DEFAULT_FROM, type MailEnv } from "../src/worker/mail";

/* ------------------------------------------------------------------ *
 * sendMail — the shared Resend sender.
 *
 * The one rule this suite protects: `requireVerifiedSender` must refuse to
 * send rather than silently fall back to Resend's shared sandbox address,
 * which cannot actually reach a third-party recipient even though the API
 * call itself would report success.
 * ------------------------------------------------------------------ */

const MSG = { to: ["someone@example.com"], subject: "hi", html: "<p>hi</p>", text: "hi" };

let fetchCalls: number;

beforeEach(() => {
  fetchCalls = 0;
  vi.stubGlobal("fetch", async () => {
    fetchCalls++;
    return new Response("{}", { status: 200 });
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sendMail", () => {
  it("sends without requireVerifiedSender even with no NOTIFY_FROM, falling back to the shared sender", async () => {
    const env: MailEnv = { RESEND_API_KEY: "re_test" };
    const result = await sendMail(env, MSG, "test");
    expect(result).toEqual({ sent: true });
    expect(fetchCalls).toBe(1);
  });

  it("refuses to send under requireVerifiedSender when NOTIFY_FROM is unset — never touches fetch", async () => {
    const env: MailEnv = { RESEND_API_KEY: "re_test" };
    const result = await sendMail(env, MSG, "test", { requireVerifiedSender: true });
    expect(result).toEqual({ sent: false, reason: "no NOTIFY_FROM" });
    expect(fetchCalls).toBe(0);
  });

  it("sends under requireVerifiedSender once NOTIFY_FROM is configured", async () => {
    const env: MailEnv = { RESEND_API_KEY: "re_test", NOTIFY_FROM: "Octant <octant@verified.example>" };
    const result = await sendMail(env, MSG, "test", { requireVerifiedSender: true });
    expect(result).toEqual({ sent: true });
    expect(fetchCalls).toBe(1);
  });

  it("still uses the documented shared address when nothing overrides it", async () => {
    let from = "";
    vi.stubGlobal("fetch", async (_url: string, init?: RequestInit) => {
      from = (JSON.parse(String(init?.body)) as { from: string }).from;
      return new Response("{}", { status: 200 });
    });
    const env: MailEnv = { RESEND_API_KEY: "re_test" };
    await sendMail(env, MSG, "test");
    expect(from).toBe(DEFAULT_FROM);
  });
});
