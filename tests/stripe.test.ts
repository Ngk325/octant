import { describe, expect, it, beforeEach } from "vitest";
import { handleStripeWebhook, verifyStripeSignature, type StripeEnv } from "../src/worker/stripe";
import { getUser, type KVNamespace } from "../src/worker/users";
import worker, { type Env } from "../src/worker/index";

/* ------------------------------------------------------------------ *
 * STRIPE — a scaffold, tested as one.
 *
 * Nothing here talks to Stripe; it asserts the two guarantees the
 * scaffold has to hold before a real webhook secret ever reaches it:
 *
 *   1. Fails closed. No secret configured, no request gets through —
 *      same posture as every other "not configured" path in this Worker.
 *   2. The signature is checked against the RAW body, not a re-serialised
 *      one, and a forged or stale header is rejected before any event
 *      handling runs.
 * ------------------------------------------------------------------ */

function memoryKV(): KVNamespace & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    async get(k) { return store.get(k) ?? null; },
    async put(k, v) { store.set(k, v); },
    async delete(k) { store.delete(k); },
    async list({ prefix = "" } = {}) {
      return { keys: [...store.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
  };
}

const SECRET = "whsec_test_secret";
const NOW = 1_800_000_000_000;

async function sign(payload: string, secret: string, tSeconds: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${tSeconds}.${payload}`));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `t=${tSeconds},v1=${hex}`;
}

let USERS: ReturnType<typeof memoryKV>;
let ENV: StripeEnv;

beforeEach(() => {
  USERS = memoryKV();
  ENV = { STRIPE_WEBHOOK_SECRET: SECRET, USERS };
});

const post = (body: string, header: string | null) =>
  new Request("https://octant.example/api/stripe/webhook", {
    method: "POST",
    headers: header ? { "stripe-signature": header } : {},
    body,
  });

describe("signature verification", () => {
  it("accepts a correctly signed, fresh payload", async () => {
    const body = JSON.stringify({ type: "ping" });
    const header = await sign(body, SECRET, Math.floor(NOW / 1000));
    expect(await verifyStripeSignature(body, header, SECRET, NOW)).toBe(true);
  });

  it("rejects a body altered after signing", async () => {
    const header = await sign(JSON.stringify({ type: "ping" }), SECRET, Math.floor(NOW / 1000));
    expect(await verifyStripeSignature(JSON.stringify({ type: "pong" }), header, SECRET, NOW)).toBe(false);
  });

  it("rejects the wrong secret", async () => {
    const body = JSON.stringify({ type: "ping" });
    const header = await sign(body, "whsec_someone_else", Math.floor(NOW / 1000));
    expect(await verifyStripeSignature(body, header, SECRET, NOW)).toBe(false);
  });

  it("rejects a timestamp outside the replay tolerance", async () => {
    const body = JSON.stringify({ type: "ping" });
    const stale = await sign(body, SECRET, Math.floor(NOW / 1000) - 3600);
    expect(await verifyStripeSignature(body, stale, SECRET, NOW)).toBe(false);
  });

  it("rejects a missing or malformed header", async () => {
    expect(await verifyStripeSignature("{}", null, SECRET, NOW)).toBe(false);
    expect(await verifyStripeSignature("{}", "not-a-real-header", SECRET, NOW)).toBe(false);
  });
});

describe("the webhook endpoint", () => {
  it("fails closed with no signing secret configured", async () => {
    const res = await handleStripeWebhook(post("{}", null), { USERS }, NOW);
    expect(res.status).toBe(503);
  });

  it("refuses a payload with a bad signature", async () => {
    const res = await handleStripeWebhook(post(JSON.stringify({ type: "ping" }), "t=1,v1=deadbeef"), ENV, NOW);
    expect(res.status).toBe(400);
  });

  it("checkout.session.completed pre-grants access and remembers the customer", async () => {
    const body = JSON.stringify({
      type: "checkout.session.completed",
      data: { object: {
        customer: "cus_123",
        customer_details: { email: "Payer@Example.com", name: "Payer Person" },
      } },
    });
    const header = await sign(body, SECRET, Math.floor(NOW / 1000));
    const res = await handleStripeWebhook(post(body, header), ENV, NOW);
    expect(res.status).toBe(200);

    const user = await getUser(ENV, "payer@example.com");
    expect(user).toMatchObject({ email: "payer@example.com", name: "Payer Person", status: "approved" });
  });

  it("customer.subscription.deleted revokes access for the customer it maps to", async () => {
    const checkout = JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { customer: "cus_456", customer_email: "quitter@example.com" } },
    });
    await handleStripeWebhook(
      post(checkout, await sign(checkout, SECRET, Math.floor(NOW / 1000))), ENV, NOW,
    );
    expect((await getUser(ENV, "quitter@example.com"))?.status).toBe("approved");

    const cancelled = JSON.stringify({
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_456", status: "canceled" } },
    });
    const res = await handleStripeWebhook(
      post(cancelled, await sign(cancelled, SECRET, Math.floor(NOW / 1000) + 10)), ENV, NOW + 10_000,
    );
    expect(res.status).toBe(200);
    expect((await getUser(ENV, "quitter@example.com"))?.status).toBe("blocked");
  });

  it("a cancellation for an unknown customer id is a no-op, not an error", async () => {
    const body = JSON.stringify({ type: "customer.subscription.deleted", data: { object: { customer: "cus_ghost" } } });
    const res = await handleStripeWebhook(post(body, await sign(body, SECRET, Math.floor(NOW / 1000))), ENV, NOW);
    expect(res.status).toBe(200);
  });

  it("acknowledges and ignores an event type it does not handle", async () => {
    const body = JSON.stringify({ type: "invoice.paid", data: { object: {} } });
    const res = await handleStripeWebhook(post(body, await sign(body, SECRET, Math.floor(NOW / 1000))), ENV, NOW);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });
});

describe("wired into the router, ahead of the wall", () => {
  it("POST /api/stripe/webhook needs no session — Stripe is calling, not a browser", async () => {
    const fullEnv = {
      AUTH_SECRET: "s", ACCESS_CODES: "tester:code", USERS,
      ASSETS: { fetch: async () => new Response("APP-SHELL") },
    } as unknown as Env;
    // No STRIPE_WEBHOOK_SECRET on this env: the point is that the route is
    // reached pre-wall at all (503, not 401 from the session gate).
    const res = await worker.fetch(
      new Request("https://octant.example/api/stripe/webhook", { method: "POST", body: "{}" }), fullEnv,
    );
    expect(res.status).toBe(503);
  });
});
