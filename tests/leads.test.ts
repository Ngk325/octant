import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  captureLead, markLeadConverted, sendQueuedNurture, handleLeadsPublic, type LeadsEnv,
} from "../src/worker/leads";
import { seal } from "../src/worker/crypto";
import type { KVNamespace } from "../src/worker/users";

/* ------------------------------------------------------------------ *
 * LEADS — captured once per email, an explainer immediately, then a
 * short cron-driven sequence that respects the funnel's own promises:
 * everyone gets the explainer; only opted-in leads get anything further.
 * ------------------------------------------------------------------ */

const NOW = 1_800_000_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

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

let KV: ReturnType<typeof memoryKV>;
let ENV: LeadsEnv;
let sent: { to: string[]; subject: string }[];

beforeEach(() => {
  KV = memoryKV();
  ENV = { LEADS: KV, RESEND_API_KEY: "re_test", NOTIFY_FROM: "Octant <octant@verified.example>", AUTH_SECRET: "leads-test-secret" };
  sent = [];
  vi.stubGlobal("fetch", async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { to: string[]; subject: string };
    sent.push({ to: body.to, subject: body.subject });
    return new Response("{}", { status: 200 });
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const lead = (email: string) => JSON.parse(KV.store.get(`lead:${email.toLowerCase()}`)!);

describe("captureLead", () => {
  it("writes a record and sends the explainer immediately", async () => {
    await captureLead(ENV, "https://octant.example", "jane@example.com", "self", ["drain"], 4, true, NOW);
    expect(lead("jane@example.com")).toMatchObject({ email: "jane@example.com", goal: "self", optin: true });
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toEqual(["jane@example.com"]);
    expect(sent[0].subject).toContain("explainer");
  });

  it("is idempotent — a reload of the done page never sends a second explainer", async () => {
    await captureLead(ENV, "https://octant.example", "jane@example.com", "self", [], undefined, true, NOW);
    await captureLead(ENV, "https://octant.example", "jane@example.com", "self", [], undefined, true, NOW + 1000);
    expect(sent).toHaveLength(1);
  });

  it("captures a non-opted-in lead too, still sends the one explainer owed to everyone", async () => {
    await captureLead(ENV, "https://octant.example", "jane@example.com", undefined, [], undefined, false, NOW);
    expect(lead("jane@example.com").optin).toBe(false);
    expect(sent).toHaveLength(1);
  });

  it("does nothing without a LEADS binding", async () => {
    await captureLead({}, "https://octant.example", "jane@example.com", undefined, [], undefined, true, NOW);
    expect(sent).toHaveLength(0);
  });

  it("leaves the lead at stage 0 when the explainer send fails, instead of persisting stage 1 unsent", async () => {
    const env: LeadsEnv = { ...ENV, NOTIFY_FROM: undefined }; // requireVerifiedSender now refuses to send
    await captureLead(env, "https://octant.example", "jane@example.com", "self", [], undefined, true, NOW);
    expect(sent).toHaveLength(0);
    expect(lead("jane@example.com").nurture).toMatchObject({ stage: 0, nextSendAt: NOW });
  });
});

describe("sendQueuedNurture", () => {
  it("never sends to a lead who did not opt in", async () => {
    await captureLead(ENV, "https://octant.example", "jane@example.com", undefined, [], undefined, false, NOW);
    sent = [];
    await sendQueuedNurture(ENV, "https://octant.example", NOW + 30 * DAY_MS);
    expect(sent).toHaveLength(0);
  });

  it("respects nextSendAt — nothing before day 3", async () => {
    await captureLead(ENV, "https://octant.example", "jane@example.com", undefined, ["meetings"], undefined, true, NOW);
    sent = [];
    await sendQueuedNurture(ENV, "https://octant.example", NOW + DAY_MS);
    expect(sent).toHaveLength(0);
  });

  it("sends email 2 at day 3, personalized by the friction answer, then email 3 at day 10, then stops", async () => {
    await captureLead(ENV, "https://octant.example", "jane@example.com", undefined, ["meetings"], undefined, true, NOW);
    sent = [];

    await sendQueuedNurture(ENV, "https://octant.example", NOW + 3 * DAY_MS);
    expect(sent).toHaveLength(1);
    expect(lead("jane@example.com").nurture.stage).toBe(2);

    // Re-running immediately must not double-send before nextSendAt.
    await sendQueuedNurture(ENV, "https://octant.example", NOW + 3 * DAY_MS + 1000);
    expect(sent).toHaveLength(1);

    await sendQueuedNurture(ENV, "https://octant.example", NOW + 10 * DAY_MS);
    expect(sent).toHaveLength(2);
    expect(lead("jane@example.com").nurture.stage).toBe(3);

    // Sequence is complete — nothing more, ever, even far in the future.
    await sendQueuedNurture(ENV, "https://octant.example", NOW + 90 * DAY_MS);
    expect(sent).toHaveLength(2);
  });

  it("skips a lead stopped by conversion or unsubscribe", async () => {
    await captureLead(ENV, "https://octant.example", "jane@example.com", undefined, [], undefined, true, NOW);
    await markLeadConverted(ENV, "jane@example.com", NOW + DAY_MS);
    sent = [];
    await sendQueuedNurture(ENV, "https://octant.example", NOW + 30 * DAY_MS);
    expect(sent).toHaveLength(0);
  });

  it("retries the explainer for a lead stuck at stage 0 (its synchronous send failed at capture)", async () => {
    const broken: LeadsEnv = { ...ENV, NOTIFY_FROM: undefined };
    await captureLead(broken, "https://octant.example", "jane@example.com", undefined, [], undefined, false, NOW);
    expect(sent).toHaveLength(0);
    expect(lead("jane@example.com").nurture.stage).toBe(0);

    // Fixed configuration, cron runs later — even a non-opted-in lead is
    // still owed the transactional explainer.
    await sendQueuedNurture(ENV, "https://octant.example", NOW + 1000);
    expect(sent).toHaveLength(1);
    expect(sent[0].subject).toContain("explainer");
    expect(lead("jane@example.com").nurture).toMatchObject({ stage: 1, nextSendAt: NOW + 1000 + 3 * DAY_MS });
  });

  it("does not advance stage or lose the email when a follow-up send fails", async () => {
    await captureLead(ENV, "https://octant.example", "jane@example.com", undefined, ["meetings"], undefined, true, NOW);
    sent = [];

    // Simulate a Resend outage for the day-3 follow-up only.
    vi.stubGlobal("fetch", async () => new Response("boom", { status: 500 }));
    await sendQueuedNurture(ENV, "https://octant.example", NOW + 3 * DAY_MS);
    expect(sent).toHaveLength(0);
    expect(lead("jane@example.com").nurture).toMatchObject({ stage: 1, nextSendAt: NOW + 3 * DAY_MS });

    // Resend recovers; the same due lead is retried, not skipped forever.
    vi.stubGlobal("fetch", async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { to: string[]; subject: string };
      sent.push({ to: body.to, subject: body.subject });
      return new Response("{}", { status: 200 });
    });
    await sendQueuedNurture(ENV, "https://octant.example", NOW + 3 * DAY_MS + 1000);
    expect(sent).toHaveLength(1);
    expect(lead("jane@example.com").nurture.stage).toBe(2);
  });
});

describe("markLeadConverted", () => {
  it("stops the sequence and is idempotent", async () => {
    await captureLead(ENV, "https://octant.example", "jane@example.com", undefined, [], undefined, true, NOW);
    await markLeadConverted(ENV, "jane@example.com", NOW + DAY_MS);
    expect(lead("jane@example.com").nurture.stopReason).toBe("converted");
    const stoppedAt = lead("jane@example.com").nurture.stoppedAt;
    await markLeadConverted(ENV, "jane@example.com", NOW + 2 * DAY_MS);
    expect(lead("jane@example.com").nurture.stoppedAt).toBe(stoppedAt);
  });

  it("does nothing for an email with no lead record", async () => {
    await expect(markLeadConverted(ENV, "nobody@example.com", NOW)).resolves.toBeUndefined();
  });
});

describe("handleLeadsPublic / unsubscribe", () => {
  it("returns null for any other path", async () => {
    const res = await handleLeadsPublic(new Request("https://octant.example/onramp"), ENV, NOW);
    expect(res).toBeNull();
  });

  it("unsubscribes a valid, signed link and is idempotent", async () => {
    await captureLead(ENV, "https://octant.example", "jane@example.com", undefined, [], undefined, true, NOW);
    const token = await seal({ email: "jane@example.com" }, ENV.AUTH_SECRET!, 1000, NOW);
    const res = await handleLeadsPublic(
      new Request(`https://octant.example/api/leads/unsubscribe?t=${encodeURIComponent(token)}`), ENV, NOW,
    );
    expect(res?.status).toBe(200);
    expect(lead("jane@example.com").optin).toBe(false);
    expect(lead("jane@example.com").nurture.stopReason).toBe("unsubscribed");
  });

  it("rejects a missing or forged token without throwing", async () => {
    const res = await handleLeadsPublic(
      new Request("https://octant.example/api/leads/unsubscribe?t=garbage"), ENV, NOW,
    );
    expect(res?.status).toBe(400);
  });
});
