import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifyOwnerOfApplication, actionLink, type NotifyEnv } from "../src/worker/notify";
import type { User } from "../src/worker/users";
import { escapeHtml } from "../src/worker/html";

/* ------------------------------------------------------------------ *
 * The owner's notification — delivery knobs, and what it carries.
 *
 * The sender was once hardcoded to Resend's shared onboarding address,
 * which Resend delivers to exactly one inbox: the address the Resend
 * ACCOUNT is registered under. When that is not OWNER_EMAIL — and here
 * it is not — every send 403s, silently. Those tests pin the fix: the
 * sender and recipient are env knobs, they default to the old
 * behaviour, and a refusal comes back as a reason instead of vanishing.
 *
 * The rest pin what the email is FOR. It fires when somebody applies,
 * not when they sign in, and it has to carry their answers — an alert
 * with a display name and an address is not something you can decide on,
 * which is the whole reason the application exists.
 * ------------------------------------------------------------------ */

const NOW = 1_800_000_000_000;
const ORIGIN = "https://octant.example";

const APPLICATION = {
  purpose: "Read a team I'm part of",
  context: "My team",
  familiarity: "New to it",
  hoping: "Stop guessing why two of my leads grate on each other.",
  found: "A friend sent the link",
  at: NOW,
};

const USER: User = {
  email: "jane@example.com", name: "Jane", status: "pending",
  firstSeen: NOW, lastSeen: NOW, application: APPLICATION,
};

/** Somebody the Stripe webhook already let in: they answer, they do not wait. */
const PAID: User = { ...USER, status: "approved" };

const BASE: NotifyEnv = {
  RESEND_API_KEY: "re_test",
  OWNER_EMAIL: "owner@example.com",
  AUTH_SECRET: "a-long-random-signing-key-for-tests",
};

const notify = (env: NotifyEnv, user: User = USER, ack: { sent: boolean; reason?: string } = { sent: true }) =>
  notifyOwnerOfApplication(env, ORIGIN, user, ack, NOW);

let sent: { url: string; body: Record<string, unknown> }[];
let respond: () => Response;

beforeEach(() => {
  sent = [];
  respond = () => new Response("{}", { status: 200 });
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    sent.push({ url, body: JSON.parse(String(init?.body)) });
    return respond();
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the notification email's delivery knobs", () => {
  it("defaults: shared sender, OWNER_EMAIL recipient", async () => {
    expect(await notify(BASE)).toEqual({ sent: true });
    expect(sent[0].body.from).toBe("Octant <onboarding@resend.dev>");
    expect(sent[0].body.to).toEqual(["owner@example.com"]);
  });

  it("NOTIFY_FROM replaces the sender; NOTIFY_EMAIL replaces the recipient", async () => {
    await notify({
      ...BASE,
      NOTIFY_FROM: "Octant <octant@verified.example>",
      NOTIFY_EMAIL: "inbox@elsewhere.example",
    });
    expect(sent[0].body.from).toBe("Octant <octant@verified.example>");
    expect(sent[0].body.to).toEqual(["inbox@elsewhere.example"]);
  });

  it("NOTIFY_EMAIL alone leaves the sender at its default", async () => {
    await notify({ ...BASE, NOTIFY_EMAIL: "inbox@elsewhere.example" });
    expect(sent[0].body.from).toBe("Octant <onboarding@resend.dev>");
    expect(sent[0].body.to).toEqual(["inbox@elsewhere.example"]);
  });

  it("a refusal comes back as a reason and is logged, never thrown", async () => {
    respond = () => new Response("nope", { status: 403 });
    expect(await notify(BASE)).toEqual({ sent: false, reason: "resend 403" });
    expect(console.error).toHaveBeenCalled();
  });

  it("declines quietly when a prerequisite is missing", async () => {
    expect(await notify({ ...BASE, RESEND_API_KEY: undefined }))
      .toEqual({ sent: false, reason: "no RESEND_API_KEY" });
    expect(await notify({ ...BASE, OWNER_EMAIL: undefined }))
      .toEqual({ sent: false, reason: "no OWNER_EMAIL" });
    expect(await notify({ ...BASE, AUTH_SECRET: undefined }))
      .toEqual({ sent: false, reason: "no AUTH_SECRET" });
    expect(sent).toHaveLength(0);
  });

  it("carries both signed links and escapes the name", async () => {
    await notify(BASE, { ...USER, name: "<script>x</script>" });
    const html = String(sent[0].body.html);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>x");
    const approve = await actionLink(ORIGIN, USER.email, "approve", BASE.AUTH_SECRET!, NOW);
    expect(String(sent[0].body.text)).toContain(approve.split("?")[0]);
  });
});

describe("what the owner is actually given to decide on", () => {
  it("carries every answer, in both the html and the text part", async () => {
    await notify(BASE);
    const answers = [
      APPLICATION.purpose, APPLICATION.context, APPLICATION.familiarity,
      APPLICATION.hoping, APPLICATION.found,
    ];
    const text = String(sent[0].body.text);
    const html = String(sent[0].body.html);
    for (const answer of answers) {
      expect(text).toContain(answer);
      // Escaped in the html half — "Read a team I'm part of" carries an
      // apostrophe, and escapeHtml turns it into an entity. Asserting the
      // raw string here would pass only for answers with no punctuation.
      expect(html).toContain(escapeHtml(answer));
    }
  });

  it("escapes the free-text answers — they are as attacker-controlled as input gets", async () => {
    await notify(BASE, {
      ...USER,
      application: { ...APPLICATION, hoping: "<img src=x onerror=alert(1)>" },
    });
    const html = String(sent[0].body.html);
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img src=x");
  });

  it("says so plainly for a record that predates the form", async () => {
    await notify(BASE, { ...USER, application: undefined });
    expect(String(sent[0].body.text)).toContain("predates the application form");
    expect(sent[0].body.subject).toContain("asking for access");
  });

  it("passes on that the applicant could not be acknowledged", async () => {
    await notify(BASE, USER, { sent: false, reason: "no NOTIFY_FROM" });
    const text = String(sent[0].body.text);
    expect(text).toContain("could NOT be acknowledged");
    expect(text).toContain("no NOTIFY_FROM");
  });
});

describe("an applicant who is already in", () => {
  it("is an FYI — a revoke link, and no approve link", async () => {
    await notify(BASE, PAID);
    expect(String(sent[0].body.subject)).toContain("paid");

    const approve = await actionLink(ORIGIN, USER.email, "approve", BASE.AUTH_SECRET!, NOW);
    const block = await actionLink(ORIGIN, USER.email, "block", BASE.AUTH_SECRET!, NOW);
    const html = String(sent[0].body.html);
    expect(html).toContain(block.split("?")[0]);
    expect(String(sent[0].body.text)).toContain("Revoke:");
    expect(String(sent[0].body.text)).not.toContain("Approve:");
    void approve;
  });

  it("still carries their answers — that is the reason to send it at all", async () => {
    await notify(BASE, PAID);
    expect(String(sent[0].body.html)).toContain(APPLICATION.hoping);
  });

  it("does not treat the owner as an already-paid stranger", async () => {
    await notify(BASE, { ...USER, status: "approved", owner: true });
    expect(String(sent[0].body.text)).toContain("Approve:");
  });
});
