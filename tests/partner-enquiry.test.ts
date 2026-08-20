import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../src/worker/index";
import { ENQUIRY_PATH, RATE_CARD_ASSET, issueEnquiryToken } from "../src/worker/enquiry";

/* ------------------------------------------------------------------ *
 * THE PARTNER ENQUIRY.
 *
 * Two rules this suite exists to hold:
 *
 *   1. The endpoint is not an open mail relay. It is a public, session-less
 *      POST that makes this Worker send a confidential attachment to an
 *      address the caller names — so a request that did not come from a
 *      rendered form must not send anything at all.
 *
 *   2. The owner always finds out. The partner send can fail in several
 *      ways (no verified sender, no PDF in the build, Resend down); every
 *      one of them still has to reach the owner's inbox, and has to SAY it
 *      failed rather than reading like a success.
 * ------------------------------------------------------------------ */

const SECRET = "a-long-random-signing-key-for-tests";
const ORIGIN = "https://octant.example";

/** One byte over enquiry.ts's "this is not a real PDF" floor. */
const FAKE_PDF = new Uint8Array(2048).fill(0x25);

interface Sent { to: string[]; subject: string; from: string; reply_to?: string; attachments?: unknown[]; text: string }
let sent: Sent[];

const assets = {
  fetch: async (req: Request) =>
    new URL(req.url).pathname === RATE_CARD_ASSET
      ? new Response(FAKE_PDF, { status: 200 })
      : new Response("APP-SHELL", { status: 200 }),
};

const baseEnv = () =>
  ({
    AUTH_SECRET: SECRET,
    ACCESS_CODES: "tester:code-for-tests",
    ASSETS: assets,
    RESEND_API_KEY: "re_test",
    NOTIFY_FROM: "Octant <octant@verified.example>",
    OWNER_EMAIL: "owner@example.com",
  }) as unknown as Env;

beforeEach(() => {
  sent = [];
  vi.stubGlobal("fetch", async (_url: string, init?: RequestInit) => {
    sent.push(JSON.parse(String(init?.body)) as Sent);
    return new Response("{}", { status: 200 });
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** A token old enough to clear the minimum completion time. */
const goodToken = (env: Env) => issueEnquiryToken(env, Date.now() - 60_000);

async function submit(env: Env, fields: Record<string, string>) {
  const body = new URLSearchParams(fields);
  return worker.fetch(
    new Request(`${ORIGIN}${ENQUIRY_PATH}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    }),
    env,
  );
}

const FILLED = {
  email: "her@partner.example",
  name: "Ada Partner",
  org: "Partner & Co",
  shape: "C · Embedded",
  people: "about 200 a year",
  seeking: "We run leadership programmes and keep drawing this by hand.",
};

describe("the partner enquiry form", () => {
  it("renders on the public /partners page, with a token and a honeypot", async () => {
    const html = await (await worker.fetch(new Request(`${ORIGIN}/partners`), baseEnv())).text();
    expect(html).toContain(`action="${ENQUIRY_PATH}"`);
    expect(html).toContain('method="post"');
    expect(html).toContain('name="_s"');
    expect(html).toContain('name="website"'); // the honeypot
    expect(html).toContain('name="email"');
  });

  it("still needs no script — the CSP pins three inline hashes and this adds no fourth", async () => {
    const html = await (await worker.fetch(new Request(`${ORIGIN}/partners`), baseEnv())).text();
    expect(html).not.toContain("<script");
  });

  it("shows the confirmation only after a real submit, and drops the form with it", async () => {
    const plain = await (await worker.fetch(new Request(`${ORIGIN}/partners`), baseEnv())).text();
    expect(plain).not.toContain("On their way");
    expect(plain).toContain(`action="${ENQUIRY_PATH}"`);

    const after = await (await worker.fetch(new Request(`${ORIGIN}/partners?sent=1`), baseEnv())).text();
    expect(after).toContain("On their way");
    // An empty form under a confirmation invites a second submit that the
    // stored record would silently swallow. Better to not offer one.
    expect(after).not.toContain(`action="${ENQUIRY_PATH}"`);
  });

  it("keeps the form on the page when the submit failed, so it can be retried", async () => {
    const html = await (await worker.fetch(new Request(`${ORIGIN}/partners?sent=0`), baseEnv())).text();
    expect(html).toContain("did not go through");
    expect(html).toContain(`action="${ENQUIRY_PATH}"`);
  });
});

describe("a good submission", () => {
  it("redirects back to the form, sends two emails, and never renders", async () => {
    const env = baseEnv();
    const res = await submit(env, { ...FILLED, _s: (await goodToken(env))! });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/partners?sent=1#enquiry");
    expect(await res.text()).toBe("");
    expect(sent).toHaveLength(2);
  });

  it("sends the partner the rate card, attached, replying to the owner", async () => {
    const env = baseEnv();
    await submit(env, { ...FILLED, _s: (await goodToken(env))! });
    const partner = sent.find((m) => m.to[0] === FILLED.email)!;
    expect(partner).toBeDefined();
    expect(partner.attachments).toHaveLength(1);
    expect((partner.attachments as { filename: string }[])[0].filename)
      .toBe("octant-partner-rate-card.pdf");
    expect(partner.reply_to).toBe("owner@example.com");
    expect(partner.text).toContain("confidential");
  });

  it("gives the owner every field the partner filled in, and replies to them", async () => {
    const env = baseEnv();
    await submit(env, { ...FILLED, _s: (await goodToken(env))! });
    const owner = sent.find((m) => m.to[0] === "owner@example.com")!;
    expect(owner.subject).toContain("Partner & Co");
    expect(owner.reply_to).toBe(FILLED.email);
    for (const value of [FILLED.email, FILLED.name, FILLED.shape, FILLED.people, FILLED.seeking]) {
      expect(owner.text).toContain(value);
    }
    // The owner's copy carries no attachment — they have the source.
    expect(owner.attachments).toBeUndefined();
  });

  it("accepts an address on its own, because that is all we actually require", async () => {
    const env = baseEnv();
    const res = await submit(env, { email: "solo@partner.example", _s: (await goodToken(env))! });
    expect(res.headers.get("location")).toBe("/partners?sent=1#enquiry");
    expect(sent).toHaveLength(2);
  });
});

describe("the endpoint refuses to be a mail relay", () => {
  it("sends nothing for a bare scripted POST with no token", async () => {
    const res = await submit(baseEnv(), { email: "victim@example.com" });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/partners?sent=0#enquiry");
    expect(sent).toHaveLength(0);
  });

  it("sends nothing for a forged token", async () => {
    await submit(baseEnv(), { email: "victim@example.com", _s: "not.a.real.token" });
    expect(sent).toHaveLength(0);
  });

  it("sends nothing for a token signed with somebody else's key", async () => {
    const other = { ...baseEnv(), AUTH_SECRET: "a-different-long-signing-key-entirely" } as Env;
    const token = (await issueEnquiryToken(other, Date.now() - 60_000))!;
    await submit(baseEnv(), { email: "victim@example.com", _s: token });
    expect(sent).toHaveLength(0);
  });

  it("sends nothing when the form was submitted faster than a person could read it", async () => {
    const env = baseEnv();
    const fresh = (await issueEnquiryToken(env, Date.now()))!;
    await submit(env, { email: "victim@example.com", _s: fresh });
    expect(sent).toHaveLength(0);
  });

  it("sends nothing for a malformed address, and says so on the page", async () => {
    const env = baseEnv();
    const res = await submit(env, { email: "not-an-address", _s: (await goodToken(env))! });
    expect(res.headers.get("location")).toBe("/partners?sent=0#enquiry");
    expect(sent).toHaveLength(0);

    const html = await (await worker.fetch(new Request(`${ORIGIN}/partners?sent=0`), env)).text();
    expect(html).toContain("did not go through");
  });

  it("sends nothing when the honeypot is filled, but does not tell the bot why", async () => {
    const env = baseEnv();
    const res = await submit(env, {
      ...FILLED, website: "http://spam.example", _s: (await goodToken(env))!,
    });
    expect(res.headers.get("location")).toBe("/partners?sent=1#enquiry");
    expect(sent).toHaveLength(0);
  });

  it("refuses to mail the card through Resend's shared sandbox sender", async () => {
    // Without NOTIFY_FROM the shared address cannot reach a third party at
    // all, though the API would report success. The partner send must be
    // skipped — and the owner must be told it was.
    const env = { ...baseEnv(), NOTIFY_FROM: undefined } as unknown as Env;
    await submit(env, { ...FILLED, _s: (await goodToken(env))! });
    expect(sent.map((m) => m.to[0])).toEqual(["owner@example.com"]);
    expect(sent[0].text).toContain("Nothing reached them");
  });
});

describe("when the rate card is missing from the build", () => {
  it("still answers the partner, and tells the owner to send it by hand", async () => {
    const env = {
      ...baseEnv(),
      ASSETS: { fetch: async () => new Response("nope", { status: 404 }) },
    } as unknown as Env;
    await submit(env, { ...FILLED, _s: (await goodToken(env))! });

    const partner = sent.find((m) => m.to[0] === FILLED.email)!;
    expect(partner.attachments).toBeUndefined();
    expect(partner.text).toContain("follows separately");

    const owner = sent.find((m) => m.to[0] === "owner@example.com")!;
    expect(owner.text).toContain("WITHOUT the rate card");
  });
});

describe("the route's position relative to the wall", () => {
  it("is reachable with no session at all", async () => {
    const res = await submit(baseEnv(), { email: "x@y.example" });
    expect(res.status).not.toBe(401);
  });

  it("bounces a GET back to the form rather than accepting one", async () => {
    const res = await worker.fetch(new Request(`${ORIGIN}${ENQUIRY_PATH}`), baseEnv());
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/partners#enquiry");
    expect(sent).toHaveLength(0);
  });

  it("leaks no app markup on the way past", async () => {
    const env = baseEnv();
    const res = await submit(env, { ...FILLED, _s: (await goodToken(env))! });
    expect(await res.text()).not.toContain("APP-SHELL");
  });

  it("still walls off every other path under /partners", async () => {
    const env = baseEnv();
    expect((await worker.fetch(new Request(`${ORIGIN}/partners/rates`), env)).status).toBe(401);
    expect((await worker.fetch(new Request(`${ORIGIN}/partnersx`), env)).status).toBe(401);
  });
});
