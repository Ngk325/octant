import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { handleScholarship, getScholarship, type ScholarshipEnv } from "../src/worker/scholarship";
import { handleAdmin, type AdminEnv } from "../src/worker/admin";
import { getUser, preApprove, recordSignIn, setStatus, type KVNamespace } from "../src/worker/users";
import { actionLink } from "../src/worker/notify";
import worker, { type Env } from "../src/worker/index";

/* ------------------------------------------------------------------ *
 * THE SCHOLARSHIP — "nobody is turned away for lack of funds."
 *
 * Three things worth being sure of, because they are the whole feature:
 *
 *   1. The wizard is genuinely stateless — every step's answers survive
 *      only because the PREVIOUS step's form carried them forward as
 *      hidden fields, never because the server remembered anything.
 *   2. Nothing is granted by the form itself. Submitting only ever tells
 *      the owner; access exists only after `/api/admin/act` or
 *      `/api/admin/scholarships` says so, exactly like a Google sign-in.
 *   3. Approving pre-grants the account (`preApprove`) so a person who has
 *      never signed in before gets in on their FIRST Google sign-in, not
 *      their second.
 * ------------------------------------------------------------------ */

function memoryKV(pageSize = 1000): KVNamespace & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    async get(k) { return store.get(k) ?? null; },
    async put(k, v) { store.set(k, v); },
    async delete(k) { store.delete(k); },
    async list({ prefix = "", cursor } = {}) {
      const all = [...store.keys()].filter((k) => k.startsWith(prefix)).sort();
      const from = cursor ? Number(cursor) : 0;
      const slice = all.slice(from, from + pageSize);
      const done = from + slice.length >= all.length;
      return {
        keys: slice.map((name) => ({ name })),
        list_complete: done,
        cursor: done ? undefined : String(from + slice.length),
      };
    },
  };
}

const SECRET = "a-long-random-signing-key-for-tests";
const NOW = 1_800_000_000_000;
const ORIGIN = "https://octant.example";

let USERS: ReturnType<typeof memoryKV>;
let ENV: ScholarshipEnv & AdminEnv;
let sent: { url: string; body: Record<string, unknown> }[];

beforeEach(() => {
  USERS = memoryKV();
  sent = [];
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    sent.push({ url, body: JSON.parse(String(init?.body)) });
    return new Response("{}", { status: 200 });
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
  ENV = {
    AUTH_SECRET: SECRET,
    USERS,
    OWNER_EMAIL: "owner@example.com",
    RESEND_API_KEY: "re_test",
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** A step's answers, as the previous step's form would carry them forward. */
function formReq(fields: Record<string, string>, ip = "203.0.113.1"): Request {
  return new Request(`${ORIGIN}/apply`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "cf-connecting-ip": ip },
    body: new URLSearchParams(fields).toString(),
  });
}

const apply = (request: Request, now = NOW) =>
  handleScholarship(request, ENV, new URL(request.url), now);

const STEP1 = { step: "1", intent: "next", name: "Jane Doe", email: "jane@example.com" };
const STEP2 = { ...STEP1, step: "2", country: "Lagos, Nigeria" };
const STEP3 = { ...STEP2, step: "3", reason: "I'm a student and can't afford it right now." };
const STEP4 = { ...STEP3, step: "4", intent: "submit" };

describe("users.preApprove", () => {
  it("creates an approved record for an email that has never signed in", async () => {
    const env = { USERS };
    const user = await preApprove(env, "Jane@Example.com", "Jane", NOW);
    expect(user).toMatchObject({ email: "jane@example.com", name: "Jane", status: "approved" });
    expect(await getUser(env, "jane@example.com")).toMatchObject({ status: "approved" });
  });

  it("flips an existing (e.g. pending) record to approved without losing its history", async () => {
    const env = { USERS };
    await recordSignIn(env, "jane@example.com", "Jane", NOW);
    const user = await preApprove(env, "jane@example.com", "Jane", NOW + 1000);
    expect(user.status).toBe("approved");
    expect(user.firstSeen).toBe(NOW); // untouched
  });

  it("is honoured on the applicant's later Google sign-in", async () => {
    const env = { USERS };
    await preApprove(env, "jane@example.com", "Jane", NOW);
    const { user, isNew } = await recordSignIn(env, "jane@example.com", "Jane Doe", NOW + 1000);
    expect(isNew).toBe(false);
    expect(user.status).toBe("approved");
  });

  it("does not touch the owner's own status", async () => {
    const env = { USERS, OWNER_EMAIL: "owner@example.com" };
    await recordSignIn(env, "owner@example.com", "Owner", NOW);
    await setStatus(env, "owner@example.com", "approved", NOW); // already approved; explicit for clarity
    const user = await preApprove(env, "owner@example.com", "Someone else's name", NOW + 1000);
    expect(user.status).toBe("approved");
    expect(user.owner).toBe(true);
  });
});

describe("the application wizard", () => {
  it("returns null for any other path", async () => {
    const req = new Request(`${ORIGIN}/not-apply`);
    expect(await handleScholarship(req, ENV, new URL(req.url), NOW)).toBeNull();
  });

  it("GET renders the deal first — a self-serve price, not the application", async () => {
    const res = (await apply(new Request(`${ORIGIN}/apply`)))!;
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("If $25 isn");
    expect(html).toContain("buy.stripe.com");
    expect(html).toContain("Apply for a free scholarship");
    expect(html).not.toContain('name="name"');
  });

  it("is meant to be found: real title/description/canonical/OG, and no noindex", async () => {
    const html = await (await apply(new Request(`${ORIGIN}/apply`)))!.text();
    expect(html).toMatch(/<title>Octant — .{5,}<\/title>/);
    expect(html).toMatch(/<meta name="description" content=".{20,}"/);
    expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/apply">`);
    expect(html).toContain('property="og:title"');
    expect(html).not.toContain("noindex");
  });

  it("declining the deal (step 0) advances into the actual application", async () => {
    const res = (await apply(formReq({ step: "0", intent: "next" })))!;
    const html = await res.text();
    expect(html).toContain("Apply for a scholarship");
    expect(html).toContain('name="name"');
    expect(html).toContain('name="email"');
    expect(html).toContain('name="step" value="1"');
  });

  it("step 1's back button returns to the deal, not nowhere", async () => {
    const res = (await apply(formReq({ ...STEP1, intent: "back" })))!;
    const html = await res.text();
    expect(html).toContain("If $25 isn");
  });

  it("step 1 rejects a missing name and stays on step 1", async () => {
    const res = (await apply(formReq({ step: "1", intent: "next", name: "", email: "jane@example.com" })))!;
    const html = await res.text();
    expect(html).toContain("Enter your name.");
    expect(html).toContain('name="step" value="1"');
  });

  it("step 1 rejects a malformed email", async () => {
    const res = (await apply(formReq({ step: "1", intent: "next", name: "Jane", email: "not-an-email" })))!;
    expect(await res.text()).toContain("Enter a valid email address.");
  });

  it("advances step 1 -> 2, carrying name and email forward as hidden fields", async () => {
    const res = (await apply(formReq(STEP1)))!;
    const html = await res.text();
    expect(html).toContain('name="step" value="2"');
    expect(html).toContain('name="name" value="Jane Doe"');
    expect(html).toContain('name="email" value="jane@example.com"');
    expect(html).toContain("← Back");
    expect(html).toContain('name="country"');
  });

  it("step 2 requires a situation, step 3 requires a reason", async () => {
    const missingCountry = await (await apply(formReq({ ...STEP2, country: "" })))!.text();
    expect(missingCountry).toContain("Tell us where you are, or your situation.");

    const missingReason = await (await apply(formReq({ ...STEP3, reason: "" })))!.text();
    expect(missingReason).toContain("Say a little about why you");
  });

  it("back returns to the previous step with every answer intact", async () => {
    const res = (await apply(formReq({ ...STEP3, intent: "back" })))!;
    const html = await res.text();
    expect(html).toContain('name="step" value="2"');
    expect(html).toContain('value="Lagos, Nigeria"');
  });

  it("step 4 reflects every answer back, escaped", async () => {
    // Advancing FROM step 3 renders the review (step 4); constructing a step-4
    // request directly would instead hit the finalize branch (see below).
    const attack = { ...STEP3, reason: "<script>alert(1)</script>" };
    const res = (await apply(formReq(attack)))!;
    const html = await res.text();
    expect(html).toContain("Jane Doe");
    expect(html).toContain("jane@example.com");
    expect(html).toContain("Lagos, Nigeria");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Submit application");
    expect(html).toContain("Choose a price that works instead");
  });

  it("submitting stores the application and notifies the owner, never the applicant directly", async () => {
    const res = (await apply(formReq(STEP4, "198.51.100.1")))!;
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Sent");

    const req = await getScholarship(ENV, "jane@example.com");
    expect(req).toMatchObject({
      email: "jane@example.com", name: "Jane Doe", country: "Lagos, Nigeria",
      status: "pending", submittedAt: NOW,
    });

    expect(sent).toHaveLength(1);
    expect(sent[0].body.to).toEqual(["owner@example.com"]);
    expect(String(sent[0].body.subject)).toContain("Jane Doe");
    expect(String(sent[0].body.html)).toContain("Lagos, Nigeria");
  });

  it("re-applying overwrites the earlier request rather than duplicating it", async () => {
    await apply(formReq(STEP4, "198.51.100.2"));
    const second = { ...STEP4, reason: "Actually, here is more detail." };
    await apply(formReq(second, "198.51.100.3"));

    const req = await getScholarship(ENV, "jane@example.com");
    expect(req?.reason).toBe("Actually, here is more detail.");
    expect(req?.status).toBe("pending");
  });

  it("a hand-crafted POST straight to step 4 is still validated from scratch", async () => {
    const res = (await apply(formReq({ step: "4", intent: "submit", name: "", email: "", country: "", reason: "" }, "198.51.100.4")))!;
    const html = await res.text();
    expect(html).toContain('name="step" value="1"');
    expect(html).toContain("Enter your name.");
    expect(await getScholarship(ENV, "")).toBeNull();
  });

  it("throttles repeated submissions from the same connection", async () => {
    const ip = "192.0.2.50";
    for (let i = 0; i < 5; i++) {
      const res = (await apply(formReq({ ...STEP4, email: `person${i}@example.com` }, ip)))!;
      expect(res.status).toBe(200);
    }
    const sixth = (await apply(formReq({ ...STEP4, email: "person5@example.com" }, ip)))!;
    expect(sixth.status).toBe(429);
    expect(await getScholarship(ENV, "person5@example.com")).toBeNull();

    // A different connection is unaffected.
    const other = (await apply(formReq({ ...STEP4, email: "person6@example.com" }, "192.0.2.51")))!;
    expect(other.status).toBe(200);
  });
});

describe("the owner's decision", () => {
  const submit = (ip: string) => apply(formReq(STEP4, ip));

  it("the signed approve link pre-grants access and tells the applicant", async () => {
    await submit("203.0.113.10");
    const link = await actionLink(ORIGIN, "jane@example.com", "approve_scholarship", SECRET, NOW);

    const shown = (await handleAdmin(new Request(link), ENV, { owner: false }, NOW))!;
    expect(await shown.text()).toContain("Let them in?");
    expect((await getUser(ENV, "jane@example.com"))).toBeNull(); // opening the link decides nothing

    const token = new URL(link).searchParams.get("t")!;
    const confirmReq = new Request(`${ORIGIN}/api/admin/act`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ t: token }),
    });
    const decided = (await handleAdmin(confirmReq, ENV, { owner: false }, NOW))!;
    expect(await decided.text()).toContain("Approved");

    expect((await getScholarship(ENV, "jane@example.com"))?.status).toBe("approved");
    expect((await getUser(ENV, "jane@example.com"))?.status).toBe("approved");

    const toApplicant = sent.find((s) => (s.body.to as string[])?.includes("jane@example.com"));
    expect(toApplicant).toBeDefined();
    expect(String(toApplicant!.body.subject)).toContain("approved");
  });

  it("the signed deny link tells the applicant and grants nothing", async () => {
    await submit("203.0.113.11");
    const link = await actionLink(ORIGIN, "jane@example.com", "deny_scholarship", SECRET, NOW);
    const token = new URL(link).searchParams.get("t")!;
    const confirmReq = new Request(`${ORIGIN}/api/admin/act`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ t: token }),
    });
    await handleAdmin(confirmReq, ENV, { owner: false }, NOW);

    expect((await getScholarship(ENV, "jane@example.com"))?.status).toBe("denied");
    expect(await getUser(ENV, "jane@example.com")).toBeNull();
  });

  it("a link for an application that was never submitted says so", async () => {
    const link = await actionLink(ORIGIN, "ghost@example.com", "approve_scholarship", SECRET, NOW);
    const res = (await handleAdmin(new Request(link), ENV, { owner: false }, NOW))!;
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("not on the list any more");
  });

  it("/api/admin/scholarships refuses a non-owner and serves the list to the owner", async () => {
    await submit("203.0.113.12");
    const asStranger = await handleAdmin(
      new Request(`${ORIGIN}/api/admin/scholarships`), ENV, { owner: false }, NOW,
    );
    expect(asStranger!.status).toBe(403);

    const asOwner = await handleAdmin(
      new Request(`${ORIGIN}/api/admin/scholarships`), ENV, { owner: true, email: "owner@example.com" }, NOW,
    );
    const data = (await asOwner!.json()) as { requests: { email: string }[] };
    expect(data.requests.map((r) => r.email)).toContain("jane@example.com");
  });

  it("the owner can decide from the dashboard instead of the email link", async () => {
    await submit("203.0.113.13");
    const res = await handleAdmin(
      new Request(`${ORIGIN}/api/admin/scholarships`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "jane@example.com", decision: "approved" }),
      }),
      ENV, { owner: true, email: "owner@example.com" }, NOW,
    );
    expect(res!.status).toBe(200);
    expect((await getUser(ENV, "jane@example.com"))?.status).toBe("approved");
  });
});

describe("wired into the router, ahead of the wall", () => {
  const fullEnv = {
    AUTH_SECRET: SECRET,
    ACCESS_CODES: "tester:code-for-tests",
    USERS,
    OWNER_EMAIL: "owner@example.com",
    RESEND_API_KEY: "re_test",
    ASSETS: { fetch: async () => new Response("APP-SHELL", { status: 200 }) },
  } as unknown as Env;

  it("GET /apply needs no session at all", async () => {
    const res = await worker.fetch(new Request("https://octant.example/apply"), fullEnv);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("If $25 isn");
  });

  it("does not leak the app shell or bundle through /apply", async () => {
    const html = await (await worker.fetch(new Request("https://octant.example/apply"), fullEnv)).text();
    expect(html).not.toContain("APP-SHELL");
    expect(html).not.toContain("/assets/");
  });
});
