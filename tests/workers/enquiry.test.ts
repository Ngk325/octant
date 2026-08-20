import { createExecutionContext, waitOnExecutionContext, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import worker, { type Env } from "../../src/worker/index";
import { ENQUIRY_PATH, RATE_CARD_ASSET, issueEnquiryToken } from "../../src/worker/enquiry";

/* ------------------------------------------------------------------ *
 * The partner enquiry, against the real runtime.
 *
 * tests/partner-enquiry.test.ts proves the decisions against a stubbed
 * global fetch. This file is the other half, and it exercises three
 * things a node mock cannot speak for: workerd's own request.formData()
 * parsing an urlencoded body, crypto.subtle behind seal/unseal, and the
 * REAL KV binding doing the once-per-address dedupe.
 *
 * No RESEND_API_KEY is set here, so sendMail returns without touching the
 * network. That is the point: what is under test is everything up to the
 * send, in the runtime that will actually run it.
 * ------------------------------------------------------------------ */

const SECRET = "workers-test-secret-for-enquiries";

const CONFIGURED: Env = {
  ...(env as unknown as Env),
  AUTH_SECRET: SECRET,
  ACCESS_CODES: "tester:real-runtime-code",
  OWNER_EMAIL: "owner@example.test",
  ASSETS: { fetch: async () => new Response("APP-SHELL", { status: 200 }) },
};

const ctx = () => createExecutionContext();

async function post(fields: Record<string, string>) {
  const c = ctx();
  const res = await worker.fetch(
    new Request(`https://octant.test${ENQUIRY_PATH}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields),
    }),
    CONFIGURED,
    c,
  );
  await waitOnExecutionContext(c);
  return res;
}

const aged = () => issueEnquiryToken(CONFIGURED, Date.now() - 60_000);

describe("the partner enquiry, in workerd", () => {
  it("parses a real urlencoded form body and accepts a properly aged token", async () => {
    const res = await post({
      email: "runtime@partner.test",
      name: "Ada",
      seeking: "A line with an ampersand & a plus + sign, url-encoded by the browser.",
      _s: (await aged())!,
    });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/partners?sent=1#enquiry");
  });

  it("rejects a token this runtime's crypto did not sign", async () => {
    const res = await post({ email: "victim@example.test", _s: "forged.token.value" });
    expect(res.headers.get("location")).toBe("/partners?sent=0#enquiry");
  });

  it("mints a usable token into the real page", async () => {
    const c = ctx();
    const res = await worker.fetch(new Request("https://octant.test/partners"), CONFIGURED, c);
    await waitOnExecutionContext(c);
    const html = await res.text();
    const token = /name="_s" value="([^"]+)"/.exec(html)?.[1];
    expect(token).toBeTruthy();
    // Freshly minted, so it must be REFUSED — a person cannot have filled the
    // form in the time this took, and that is the whole brake.
    const submitted = await post({ email: "fast@example.test", _s: token! });
    expect(submitted.headers.get("location")).toBe("/partners?sent=0#enquiry");
  });

  it("records the address in real KV, undecided, so a second submit cannot mail twice", async () => {
    const email = `dedupe-${Math.floor(Math.random() * 1e9)}@partner.test`;
    await post({ email, _s: (await aged())! });
    const stored = await (CONFIGURED.LEADS as unknown as {
      get(k: string): Promise<string | null>;
    })?.get(`partner:${email}`);
    expect(stored).toBeTruthy();
    const record = JSON.parse(stored!);
    expect(record.email).toBe(email);
    // The gate, at rest: the form records an enquiry and decides nothing.
    expect(record.status).toBe("new");
  });

  it("keeps the rate card out of reach of an anonymous request", async () => {
    // The PDF is a static asset, and the wall covers every asset. Reaching it
    // is what enquiry.ts does from INSIDE the Worker, which is not the same
    // thing as it being fetchable from outside.
    const c = ctx();
    const res = await worker.fetch(
      new Request(`https://octant.test${RATE_CARD_ASSET}`), CONFIGURED, c,
    );
    await waitOnExecutionContext(c);
    expect(res.status).toBe(401);
    expect(await res.text()).not.toContain("APP-SHELL");
  });
});
