import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  notifyOwnerOfSignup, notifyOwnerOfScholarship, notifyApplicantOfScholarshipDecision,
  actionLink, type NotifyEnv,
} from "../src/worker/notify";
import type { User } from "../src/worker/users";
import type { ScholarshipRequest } from "../src/worker/scholarship";

/* ------------------------------------------------------------------ *
 * The notification's delivery knobs.
 *
 * The sender was once hardcoded to Resend's shared onboarding address,
 * which Resend delivers to exactly one inbox: the address the Resend
 * ACCOUNT is registered under. When that is not OWNER_EMAIL — and here
 * it is not — every send 403s, silently. These tests pin the fix: the
 * sender and recipient are env knobs, they default to the old
 * behaviour, and a refusal comes back as a reason instead of vanishing.
 * ------------------------------------------------------------------ */

const NOW = 1_800_000_000_000;
const USER: User = {
  email: "jane@example.com", name: "Jane", status: "pending",
  firstSeen: NOW, lastSeen: NOW,
};

const BASE: NotifyEnv = {
  RESEND_API_KEY: "re_test",
  OWNER_EMAIL: "owner@example.com",
  AUTH_SECRET: "a-long-random-signing-key-for-tests",
};

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
    const out = await notifyOwnerOfSignup(BASE, "https://example.com", USER, NOW);
    expect(out).toEqual({ sent: true });
    expect(sent[0].body.from).toBe("Octant <onboarding@resend.dev>");
    expect(sent[0].body.to).toEqual(["owner@example.com"]);
  });

  it("NOTIFY_FROM replaces the sender; NOTIFY_EMAIL replaces the recipient", async () => {
    const env: NotifyEnv = {
      ...BASE,
      NOTIFY_FROM: "Octant <octant@verified.example>",
      NOTIFY_EMAIL: "inbox@elsewhere.example",
    };
    await notifyOwnerOfSignup(env, "https://example.com", USER, NOW);
    expect(sent[0].body.from).toBe("Octant <octant@verified.example>");
    expect(sent[0].body.to).toEqual(["inbox@elsewhere.example"]);
  });

  it("NOTIFY_EMAIL alone leaves the sender at its default", async () => {
    await notifyOwnerOfSignup(
      { ...BASE, NOTIFY_EMAIL: "inbox@elsewhere.example" }, "https://example.com", USER, NOW,
    );
    expect(sent[0].body.from).toBe("Octant <onboarding@resend.dev>");
    expect(sent[0].body.to).toEqual(["inbox@elsewhere.example"]);
  });

  it("a refusal comes back as a reason and is logged, never thrown", async () => {
    respond = () => new Response("nope", { status: 403 });
    const out = await notifyOwnerOfSignup(BASE, "https://example.com", USER, NOW);
    expect(out).toEqual({ sent: false, reason: "resend 403" });
    expect(console.error).toHaveBeenCalled();
  });

  it("declines quietly when a prerequisite is missing", async () => {
    expect(await notifyOwnerOfSignup({ ...BASE, RESEND_API_KEY: undefined }, "https://x.example", USER, NOW))
      .toEqual({ sent: false, reason: "no RESEND_API_KEY" });
    expect(await notifyOwnerOfSignup({ ...BASE, OWNER_EMAIL: undefined }, "https://x.example", USER, NOW))
      .toEqual({ sent: false, reason: "no OWNER_EMAIL" });
    expect(sent).toHaveLength(0);
  });

  it("the mail body carries both signed links and escapes the name", async () => {
    const attack: User = { ...USER, name: "<script>x</script>" };
    await notifyOwnerOfSignup(BASE, "https://example.com", attack, NOW);
    const html = String(sent[0].body.html);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>x");
    const approve = await actionLink("https://example.com", USER.email, "approve", BASE.AUTH_SECRET!, NOW);
    expect(String(sent[0].body.text)).toContain(approve.split("?")[0]);
  });
});

const SCHOLARSHIP: ScholarshipRequest = {
  email: "applicant@example.com", name: "Amara", country: "Accra, Ghana",
  reason: "I'm between jobs right now.", status: "pending", submittedAt: NOW,
};

describe("the scholarship notifications", () => {
  it("tells the owner, with the situation and reason reflected and signed decision links", async () => {
    const out = await notifyOwnerOfScholarship(BASE, "https://example.com", SCHOLARSHIP, NOW);
    expect(out).toEqual({ sent: true });
    expect(sent[0].body.to).toEqual(["owner@example.com"]);
    expect(String(sent[0].body.subject)).toContain("Amara");
    expect(String(sent[0].body.html)).toContain("Accra, Ghana");
    expect(String(sent[0].body.html)).toContain("between jobs");

    const approve = await actionLink("https://example.com", SCHOLARSHIP.email, "approve_scholarship", BASE.AUTH_SECRET!, NOW);
    const deny = await actionLink("https://example.com", SCHOLARSHIP.email, "deny_scholarship", BASE.AUTH_SECRET!, NOW);
    expect(String(sent[0].body.text)).toContain(approve.split("?")[0]);
    expect(String(sent[0].body.text)).toContain(deny.split("?")[0]);
  });

  it("escapes a hostile reason instead of executing it", async () => {
    const attack = { ...SCHOLARSHIP, reason: "<script>x</script>" };
    await notifyOwnerOfScholarship(BASE, "https://example.com", attack, NOW);
    const html = String(sent[0].body.html);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>x");
  });

  it("declines quietly when a prerequisite is missing, same as the sign-up notice", async () => {
    expect(await notifyOwnerOfScholarship({ ...BASE, RESEND_API_KEY: undefined }, "https://x.example", SCHOLARSHIP, NOW))
      .toEqual({ sent: false, reason: "no RESEND_API_KEY" });
  });

  it("tells the applicant they were approved, with a sign-in link", async () => {
    const out = await notifyApplicantOfScholarshipDecision(BASE, "https://example.com", SCHOLARSHIP, true);
    expect(out).toEqual({ sent: true });
    expect(sent[0].body.to).toEqual(["applicant@example.com"]);
    expect(String(sent[0].body.subject)).toContain("approved");
    expect(String(sent[0].body.html)).toContain("https://example.com/signin");
  });

  it("tells the applicant when the answer is no, without saying access was revoked", async () => {
    const out = await notifyApplicantOfScholarshipDecision(BASE, "https://example.com", SCHOLARSHIP, false);
    expect(out).toEqual({ sent: true });
    expect(String(sent[0].body.html)).not.toContain("/signin");
  });
});
