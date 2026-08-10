import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyStripeSignature, handleStripeWebhook, type StripeEnv } from "../src/worker/stripe";
import type { KVNamespace } from "../src/worker/users";

/* ------------------------------------------------------------------ *
 * PAYMENT -> AUTOMATIC ACCESS
 *
 * No live Stripe call anywhere in this suite — signatures are hand-
 * computed the same way Stripe documents doing it manually, and the
 * webhook handler is exercised directly against a stub KV.
 * ------------------------------------------------------------------ */

const SECRET = "whsec_test_secret";
const NOW = 1_800_000_000_000;

const sign = (body: string, t: number, secret = SECRET) =>
  createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");

function memoryKV(): KVNamespace & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    async get(k) { return store.get(k) ?? null; },
    async put(k, v) { store.set(k, v); },
    async delete(k) { store.delete(k); },
    async list({ prefix = "" } = {}) {
      const keys = [...store.keys()].filter((k) => k.startsWith(prefix)).sort();
      return { keys: keys.map((name) => ({ name })), list_complete: true };
    },
  };
}

describe("verifyStripeSignature", () => {
  const body = JSON.stringify({ type: "checkout.session.completed" });

  it("accepts a correctly-signed payload", async () => {
    const t = Math.floor(NOW / 1000);
    const header = `t=${t},v1=${sign(body, t)}`;
    expect(await verifyStripeSignature(body, header, SECRET, NOW)).toBe(true);
  });

  it("rejects a tampered body", async () => {
    const t = Math.floor(NOW / 1000);
    const header = `t=${t},v1=${sign(body, t)}`;
    expect(await verifyStripeSignature(body + "x", header, SECRET, NOW)).toBe(false);
  });

  it("rejects the wrong secret", async () => {
    const t = Math.floor(NOW / 1000);
    const header = `t=${t},v1=${sign(body, t, "whsec_wrong")}`;
    expect(await verifyStripeSignature(body, header, SECRET, NOW)).toBe(false);
  });

  it("rejects a timestamp outside the tolerance window", async () => {
    const staleT = Math.floor(NOW / 1000) - 600; // 10 minutes old
    const header = `t=${staleT},v1=${sign(body, staleT)}`;
    expect(await verifyStripeSignature(body, header, SECRET, NOW)).toBe(false);
  });

  it("rejects a malformed header", async () => {
    expect(await verifyStripeSignature(body, "garbage", SECRET, NOW)).toBe(false);
    expect(await verifyStripeSignature(body, "t=123", SECRET, NOW)).toBe(false);
  });
});

describe("handleStripeWebhook", () => {
  let USERS: ReturnType<typeof memoryKV>;
  let LEADS: ReturnType<typeof memoryKV>;
  let ENV: StripeEnv;

  beforeEach(() => {
    USERS = memoryKV();
    LEADS = memoryKV();
    ENV = { USERS, LEADS, STRIPE_WEBHOOK_SECRET: SECRET };
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  const post = (body: string, headerOverride?: string) => {
    const t = Math.floor(NOW / 1000);
    const header = headerOverride ?? `t=${t},v1=${sign(body, t)}`;
    return handleStripeWebhook(
      new Request("https://octant.example/api/stripe/webhook", {
        method: "POST", body, headers: { "stripe-signature": header },
      }),
      ENV, NOW,
    );
  };

  it("returns null for any other path", async () => {
    const res = await handleStripeWebhook(new Request("https://octant.example/onramp"), ENV, NOW);
    expect(res).toBeNull();
  });

  it("503s when the webhook secret is not configured", async () => {
    const res = await post(JSON.stringify({ type: "checkout.session.completed" }));
    // rebuild with a secret-less env to test the actual 503 path
    const bareEnv: StripeEnv = { USERS, LEADS };
    const body = JSON.stringify({ type: "checkout.session.completed" });
    const bare = await handleStripeWebhook(
      new Request("https://octant.example/api/stripe/webhook", { method: "POST", body }), bareEnv, NOW,
    );
    expect(bare?.status).toBe(503);
    expect(res?.status).not.toBe(503); // sanity: the configured env behaves differently
  });

  it("400s on a missing signature header", async () => {
    const res = await handleStripeWebhook(
      new Request("https://octant.example/api/stripe/webhook", {
        method: "POST", body: JSON.stringify({ type: "checkout.session.completed" }),
      }),
      ENV, NOW,
    );
    expect(res?.status).toBe(400);
  });

  it("400s on an invalid signature", async () => {
    const body = JSON.stringify({ type: "checkout.session.completed" });
    const res = await post(body, "t=1,v1=deadbeef");
    expect(res?.status).toBe(400);
  });

  it("acks and ignores event types other than checkout.session.completed", async () => {
    const res = await post(JSON.stringify({ type: "customer.subscription.deleted" }));
    expect(res?.status).toBe(200);
    expect(USERS.store.size).toBe(0);
  });

  it("preapproves the payer's email on a verified checkout.session.completed", async () => {
    const body = JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { customer_details: { email: "Jane@Example.com" } } },
    });
    const res = await post(body);
    expect(res?.status).toBe(200);
    expect(USERS.store.get("preapproved:jane@example.com")).toBeTruthy();
  });

  it("marks a matching lead as converted", async () => {
    LEADS.store.set("lead:jane@example.com", JSON.stringify({
      email: "jane@example.com", firstSeen: NOW, optin: true, nurture: { stage: 1, nextSendAt: NOW },
    }));
    const body = JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { customer_details: { email: "jane@example.com" } } },
    });
    await post(body);
    const lead = JSON.parse(LEADS.store.get("lead:jane@example.com")!);
    expect(lead.nurture.stopReason).toBe("converted");
  });

  it("acks without erroring when the session carries no email", async () => {
    const body = JSON.stringify({ type: "checkout.session.completed", data: { object: {} } });
    const res = await post(body);
    expect(res?.status).toBe(200);
    expect(USERS.store.size).toBe(0);
  });
});
