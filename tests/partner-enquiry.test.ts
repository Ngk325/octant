import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../src/worker/index";
import { ENQUIRY_ACT_PATH, ENQUIRY_PATH, RATE_CARD_ASSET, issueEnquiryToken } from "../src/worker/enquiry";

/* ------------------------------------------------------------------ *
 * THE PARTNER ENQUIRY, AND THE GATE IN FRONT OF THE RATE CARD.
 *
 * Three rules this suite exists to hold:
 *
 *   1. The form NEVER releases the rate card. Submitting gets you an
 *      acknowledgement; the card waits for the owner. This is the whole
 *      point of the feature and the thing a later refactor would quietly
 *      undo.
 *
 *   2. The endpoint is not a mail relay. It is a public, session-less
 *      POST that makes this Worker send mail to addresses the caller
 *      names — including the owner's — so a request that did not come
 *      from a rendered form must not send anything at all.
 *
 *   3. Opening the decision link decides nothing. Mail scanners fetch
 *      every URL in a message; the GET must only show, and the POST must
 *      be the thing that sends.
 * ------------------------------------------------------------------ */

const SECRET = "a-long-random-signing-key-for-tests";
const ORIGIN = "https://octant.example";

/** One byte over enquiry.ts's "this is not a real PDF" floor. */
const FAKE_PDF = new Uint8Array(2048).fill(0x25);

interface Sent { to: string[]; subject: string; reply_to?: string; attachments?: unknown[]; text: string; html: string }
let sent: Sent[];

const assets = {
  fetch: async (req: Request) =>
    new URL(req.url).pathname === RATE_CARD_ASSET
      ? new Response(FAKE_PDF, { status: 200 })
      : new Response("APP-SHELL", { status: 200 }),
};

/** In-memory KV, enough for the read/write this flow does. */
function kv() {
  const store = new Map<string, string>();
  return {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => void store.set(k, v),
    _store: store,
  };
}

let leads: ReturnType<typeof kv>;

const baseEnv = () =>
  ({
    AUTH_SECRET: SECRET,
    ACCESS_CODES: "tester:code-for-tests",
    ASSETS: assets,
    LEADS: leads,
    RESEND_API_KEY: "re_test",
    NOTIFY_FROM: "Octant <octant@verified.example>",
    OWNER_EMAIL: "owner@example.com",
  }) as unknown as Env;

beforeEach(() => {
  sent = [];
  leads = kv();
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

const submit = (env: Env, fields: Record<string, string>) =>
  worker.fetch(
    new Request(`${ORIGIN}${ENQUIRY_PATH}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields),
    }),
    env,
  );

const FILLED = {
  email: "her@partner.example",
  name: "Ada Partner",
  org: "Partner & Co",
  shape: "C · Embedded",
  people: "about 200 a year",
  seeking: "We run leadership programmes and keep drawing this by hand.",
};

/** Pull the two decision links back out of the owner's email. */
function linksFromOwnerMail(): { send: string; decline: string } {
  const owner = sent.find((m) => m.to[0] === "owner@example.com")!;
  const urls = [...owner.text.matchAll(new RegExp(`${ORIGIN}${ENQUIRY_ACT_PATH}\\?t=\\S+`, "g"))]
    .map((m) => m[0]);
  expect(urls).toHaveLength(2);
  return { send: urls[0], decline: urls[1] };
}

const openLink = (env: Env, href: string) => worker.fetch(new Request(href), env);

const confirmLink = (env: Env, href: string) =>
  worker.fetch(
    new Request(`${ORIGIN}${ENQUIRY_ACT_PATH}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ t: new URL(href).searchParams.get("t")! }),
    }),
    env,
  );

describe("the partner enquiry form", () => {
  it("renders on the public /partners page, with a token and a honeypot", async () => {
    const html = await (await worker.fetch(new Request(`${ORIGIN}/partners`), baseEnv())).text();
    expect(html).toContain(`action="${ENQUIRY_PATH}"`);
    expect(html).toContain('method="post"');
    expect(html).toContain('name="_s"');
    expect(html).toContain('name="website"'); // the honeypot
  });

  it("promises a read, not an autoresponder", async () => {
    const html = await (await worker.fetch(new Request(`${ORIGIN}/partners`), baseEnv())).text();
    expect(html).toContain("A person reads every one of these");
    expect(html).toContain("Ask for the rate card");
  });

  it("still needs no script — the CSP pins three inline hashes and this adds no fourth", async () => {
    const html = await (await worker.fetch(new Request(`${ORIGIN}/partners`), baseEnv())).text();
    expect(html).not.toContain("<script");
  });

  it("shows the confirmation only after a real submit, and drops the form with it", async () => {
    const plain = await (await worker.fetch(new Request(`${ORIGIN}/partners`), baseEnv())).text();
    expect(plain).not.toContain("With us.");
    expect(plain).toContain(`action="${ENQUIRY_PATH}"`);

    const after = await (await worker.fetch(new Request(`${ORIGIN}/partners?sent=1`), baseEnv())).text();
    expect(after).toContain("With us.");
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
  it("redirects back to the form and sends exactly two emails — neither carrying the card", async () => {
    const env = baseEnv();
    const res = await submit(env, { ...FILLED, _s: (await goodToken(env))! });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/partners?sent=1#enquiry");
    expect(sent).toHaveLength(2);
    // THE rule of this feature: submitting a form does not release the card.
    for (const message of sent) expect(message.attachments).toBeUndefined();
  });

  it("acknowledges the enquirer without promising a time we control", async () => {
    const env = baseEnv();
    await submit(env, { ...FILLED, _s: (await goodToken(env))! });
    const ack = sent.find((m) => m.to[0] === FILLED.email)!;
    expect(ack.subject).toBe("Octant — your partnership enquiry");
    expect(ack.text).toContain("a person is reading it");
    // The four questions are the thing worth doing during the wait.
    expect(ack.text).toContain("whose product is the client renewing");
  });

  it("gives the owner every field, both decision links, and a reply path", async () => {
    const env = baseEnv();
    await submit(env, { ...FILLED, _s: (await goodToken(env))! });
    const owner = sent.find((m) => m.to[0] === "owner@example.com")!;
    expect(owner.subject).toContain("Partner & Co");
    expect(owner.reply_to).toBe(FILLED.email);
    for (const value of [FILLED.email, FILLED.name, FILLED.shape, FILLED.people, FILLED.seeking]) {
      expect(owner.text).toContain(value);
    }
    expect(owner.text).toContain("the rate card waits for you");
    linksFromOwnerMail(); // asserts there are exactly two
  });

  it("accepts an address on its own, because that is all we actually require", async () => {
    const env = baseEnv();
    const res = await submit(env, { email: "solo@partner.example", _s: (await goodToken(env))! });
    expect(res.headers.get("location")).toBe("/partners?sent=1#enquiry");
    expect(sent).toHaveLength(2);
  });

  it("records the enquiry as undecided, and ignores a second submit", async () => {
    const env = baseEnv();
    await submit(env, { ...FILLED, _s: (await goodToken(env))! });
    expect(JSON.parse(leads._store.get(`partner:${FILLED.email}`)!).status).toBe("new");

    sent = [];
    await submit(env, { ...FILLED, _s: (await goodToken(env))! });
    expect(sent).toHaveLength(0);
  });
});

describe("the owner's one-tap decision", () => {
  async function enquire() {
    const env = baseEnv();
    await submit(env, { ...FILLED, _s: (await goodToken(env))! });
    const links = linksFromOwnerMail();
    sent = [];
    return { env, links };
  }

  it("decides nothing when the link is merely opened", async () => {
    const { env, links } = await enquire();
    const res = await openLink(env, links.send);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Send them the rate card?");
    expect(html).toContain("Partner &amp; Co"); // escaped, and it is the untrusted field
    // A link scanner opening this must not have sent anything.
    expect(sent).toHaveLength(0);
    expect(JSON.parse(leads._store.get(`partner:${FILLED.email}`)!).status).toBe("new");
  });

  it("sends the card, attached, on the POST from that page", async () => {
    const { env, links } = await enquire();
    const res = await confirmLink(env, links.send);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("on its way");

    expect(sent).toHaveLength(1);
    const card = sent[0];
    expect(card.to).toEqual([FILLED.email]);
    expect(card.subject).toBe("Octant — partner rates and terms");
    expect((card.attachments as { filename: string }[])[0].filename)
      .toBe("octant-partner-rate-card.pdf");
    expect(card.reply_to).toBe("owner@example.com");
    expect(card.text).toContain("confidential");
    expect(JSON.parse(leads._store.get(`partner:${FILLED.email}`)!).status).toBe("sent");
  });

  it("does not send twice when the link is tapped again", async () => {
    const { env, links } = await enquire();
    await confirmLink(env, links.send);
    sent = [];
    const again = await confirmLink(env, links.send);
    expect(await again.text()).toContain("Already sent");
    expect(sent).toHaveLength(0);
  });

  it("sends nothing when the owner declines, and remembers that", async () => {
    const { env, links } = await enquire();
    const res = await confirmLink(env, links.decline);
    expect(await res.text()).toContain("Left alone");
    expect(sent).toHaveLength(0);
    expect(JSON.parse(leads._store.get(`partner:${FILLED.email}`)!).status).toBe("declined");
  });

  it("still lets the owner send after declining — a decline is not a block", async () => {
    const { env, links } = await enquire();
    await confirmLink(env, links.decline);
    await confirmLink(env, links.send);
    expect(sent.map((m) => m.to[0])).toEqual([FILLED.email]);
  });

  it("refuses a decline once the card is out, because nothing can be recalled", async () => {
    const { env, links } = await enquire();
    await confirmLink(env, links.send);
    sent = [];
    expect(await (await confirmLink(env, links.decline)).text()).toContain("Already sent");
    expect(JSON.parse(leads._store.get(`partner:${FILLED.email}`)!).status).toBe("sent");
  });

  it("sends nothing for a forged or foreign-signed decision link", async () => {
    const env = baseEnv();
    const forged = `${ORIGIN}${ENQUIRY_ACT_PATH}?t=not.a.real.token`;
    expect(await (await openLink(env, forged)).text()).toContain("no longer valid");
    await confirmLink(env, forged);
    expect(sent).toHaveLength(0);
  });

  it("does not record a send that failed, so the link still works", async () => {
    const { env, links } = await enquire();
    vi.stubGlobal("fetch", async () => new Response("nope", { status: 500 }));
    const res = await confirmLink(env, links.send);
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("did not send");
    expect(JSON.parse(leads._store.get(`partner:${FILLED.email}`)!).status).toBe("new");
  });

  it("names the fix when the shared sandbox sender is all there is", async () => {
    const env = baseEnv();
    await submit(env, { ...FILLED, _s: (await goodToken(env))! });
    const links = linksFromOwnerMail();
    sent = [];
    const unverified = { ...baseEnv(), NOTIFY_FROM: undefined } as unknown as Env;
    const res = await confirmLink(unverified, links.send);
    expect(await res.text()).toContain("NOTIFY_FROM");
    expect(sent).toHaveLength(0);
  });

  it("still answers the partner when the PDF is missing, and says so on the page", async () => {
    const env = baseEnv();
    await submit(env, { ...FILLED, _s: (await goodToken(env))! });
    const links = linksFromOwnerMail();
    sent = [];
    const noPdf = {
      ...baseEnv(), ASSETS: { fetch: async () => new Response("nope", { status: 404 }) },
    } as unknown as Env;
    const res = await confirmLink(noPdf, links.send);
    expect(await res.text()).toContain("WITHOUT the rate card");
    expect(sent[0].attachments).toBeUndefined();
    expect(sent[0].text).toContain("follows separately");
  });
});

describe("the form endpoint refuses to be a mail relay", () => {
  it("sends nothing for a bare scripted POST with no token", async () => {
    const res = await submit(baseEnv(), { email: "victim@example.com" });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/partners?sent=0#enquiry");
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
});

describe("the routes' position relative to the wall", () => {
  it("takes a form POST with no session at all", async () => {
    const res = await submit(baseEnv(), { email: "x@y.example" });
    expect(res.status).not.toBe(401);
  });

  it("opens a decision link with no session at all", async () => {
    const env = baseEnv();
    await submit(env, { ...FILLED, _s: (await goodToken(env))! });
    const res = await openLink(env, linksFromOwnerMail().send);
    expect(res.status).toBe(200);
  });

  it("bounces a GET of the form target back to the form rather than accepting one", async () => {
    const res = await worker.fetch(new Request(`${ORIGIN}${ENQUIRY_PATH}`), baseEnv());
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/partners#enquiry");
    expect(sent).toHaveLength(0);
  });

  it("leaks no app markup on the way past", async () => {
    const env = baseEnv();
    const res = await submit(env, { ...FILLED, _s: (await goodToken(env))! });
    expect(await res.text()).not.toContain("APP-SHELL");
    const page = await (await openLink(env, linksFromOwnerMail().send)).text();
    expect(page).not.toContain("APP-SHELL");
    expect(page).not.toContain("/assets/");
  });

  it("still walls off every other path under /partners", async () => {
    const env = baseEnv();
    expect((await worker.fetch(new Request(`${ORIGIN}/partners/rates`), env)).status).toBe(401);
    expect((await worker.fetch(new Request(`${ORIGIN}/partnersx`), env)).status).toBe(401);
  });
});
