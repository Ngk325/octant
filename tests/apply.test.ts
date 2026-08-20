import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import worker, { type Env } from "../src/worker/index";
import { APPLY_PATH } from "../src/worker/apply";
import { issueSession } from "../src/worker/auth";
import {
  APPLICATION_REQUIRED_FROM, getUser, preapprove, recordSignIn, setStatus, type KVNamespace,
} from "../src/worker/users";

/* ------------------------------------------------------------------ *
 * ASKING FOR ACCESS.
 *
 * Four rules this suite exists to hold:
 *
 *   1. Nobody reaches the app without answering. Not through an asset,
 *      not through an API route, not by walking straight to /apply and
 *      posting nothing.
 *   2. Nobody who joined BEFORE the form existed is sent back to fill it
 *      in. "All new users are gated" is not "every reader is ambushed on
 *      their next page load".
 *   3. A payer answers, and does not wait. Approving is the owner's
 *      attention; a payment bought the product, not the queue.
 *   4. The owner hears once, when there is something to read — and what
 *      they hear carries the answers.
 * ------------------------------------------------------------------ */

const SECRET = "a-long-random-signing-key-for-tests";
const ORIGIN = "https://octant.example";
const NOW = () => Date.now();

function memoryKV(): KVNamespace & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    get: async (k) => store.get(k) ?? null,
    put: async (k, v) => void store.set(k, v),
    delete: async (k) => void store.delete(k),
    list: async ({ prefix = "" } = {}) => ({
      keys: [...store.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })),
      list_complete: true,
    }),
  };
}

interface Sent { to: string[]; subject: string; html: string; text: string }
let sent: Sent[];
let USERS: ReturnType<typeof memoryKV>;
let ENV: Env;

beforeEach(() => {
  sent = [];
  USERS = memoryKV();
  ENV = {
    AUTH_SECRET: SECRET,
    ACCESS_CODES: "tester:code-for-tests",
    USERS,
    OWNER_EMAIL: "owner@example.com",
    NOTIFY_FROM: "Octant <octant@verified.example>",
    RESEND_API_KEY: "re_test",
    GOOGLE_CLIENT_ID: "id.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: "secret",
    ASSETS: { fetch: async () => new Response("APP-SHELL", { status: 200 }) },
  } as unknown as Env;
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

const ANSWERS = {
  purpose: "Read a team I'm part of",
  context: "My team",
  familiarity: "New to it",
  hoping: "Stop guessing why two of my leads grate on each other.",
  found: "A friend sent the link",
};

const googleCookie = async (email: string, name = "Jane") =>
  `octant_session=${await issueSession(name, "google", email, SECRET, NOW())}`;

const codeCookie = async () =>
  `octant_session=${await issueSession("tester", "code", undefined, SECRET, NOW(), "abc123")}`;

const get = (path: string, cookie?: string) =>
  worker.fetch(new Request(`${ORIGIN}${path}`, cookie ? { headers: { cookie } } : undefined), ENV);

const apply = (cookie: string, fields: Record<string, string> = ANSWERS) =>
  worker.fetch(
    new Request(`${ORIGIN}${APPLY_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields),
    }),
    ENV,
  );

/** A signed-in Google visitor who has not answered anything yet. */
async function newcomer(email = "jane@example.com") {
  await recordSignIn(ENV, email, "Jane", NOW());
  return googleCookie(email);
}

describe("the route both files have to agree on", () => {
  it("is the same string the wall hardcodes", () => {
    // auth.ts cannot import APPLY_PATH — that would make the wall depend on
    // the page it holds people at — so the two are pinned to each other here.
    const wall = readFileSync(join(__dirname, "..", "src", "worker", "auth.ts"), "utf8");
    expect(APPLY_PATH).toBe("/apply");
    expect(wall).toContain(`url.pathname === "${APPLY_PATH}"`);
    expect(wall).toContain(`location: "${APPLY_PATH}"`);
  });
});

describe("nobody reaches the app without answering", () => {
  it("sends a signed-in newcomer to the form instead of the app", async () => {
    const res = await get("/type/ENTP", await newcomer());
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(APPLY_PATH);
    expect(await res.text()).not.toContain("APP-SHELL");
  });

  it("refuses an API call with JSON, so the app's own fetches fail cleanly", async () => {
    const res = await get("/api/chat/history", await newcomer());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Application required." });
  });

  it("will not accept a blank submission", async () => {
    const res = await apply(await newcomer(), {});
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("Please answer");
    expect(sent).toHaveLength(0);
  });

  it("will not accept a choice that was never offered", async () => {
    const res = await apply(await newcomer(), { ...ANSWERS, context: "Something I typed myself" });
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("Please choose one of the options");
    expect((await getUser(ENV, "jane@example.com"))?.application).toBeUndefined();
  });

  it("gives back what they already typed when one answer is missing", async () => {
    const res = await apply(await newcomer(), { ...ANSWERS, hoping: "" });
    const html = await res.text();
    // A form that empties itself on one bad field is a form people abandon.
    expect(html).toContain("A friend sent the link");
    expect(html).toContain('value="Read a team I&#39;m part of" checked');
  });

  it("turns away a request with no session at all", async () => {
    const res = await apply("");
    expect(res.status).not.toBe(200);
    expect(sent).toHaveLength(0);
  });
});

describe("a good application", () => {
  it("records the answers, acknowledges them, and tells the owner — once", async () => {
    const res = await apply(await newcomer());
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/");

    expect((await getUser(ENV, "jane@example.com"))?.application).toMatchObject(ANSWERS);
    expect(sent.map((m) => m.to[0]).sort())
      .toEqual(["jane@example.com", "owner@example.com"]);
  });

  it("acknowledges the applicant without promising when", async () => {
    await apply(await newcomer());
    const ack = sent.find((m) => m.to[0] === "jane@example.com")!;
    expect(ack.subject).toBe("Octant — we have your request");
    expect(ack.text).toContain("a person reads every one of them");
  });

  it("gives the owner the answers and a decision", async () => {
    await apply(await newcomer());
    const owner = sent.find((m) => m.to[0] === "owner@example.com")!;
    expect(owner.subject).toContain("asking for access");
    expect(owner.text).toContain(ANSWERS.hoping);
    expect(owner.text).toContain("Approve:");
  });

  it("leaves them waiting, on a page that says so", async () => {
    const cookie = await newcomer();
    await apply(cookie);
    const res = await get("/type/ENTP", cookie);
    expect(res.status).toBe(403);
    expect(await res.text()).toContain("Your request is in");
  });

  it("lets them in the moment the owner approves, with no second form", async () => {
    const cookie = await newcomer();
    await apply(cookie);
    await setStatus(ENV, "jane@example.com", "approved", NOW());
    const res = await get("/type/ENTP", cookie);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("APP-SHELL");
  });
});

describe("signing in is not asking", () => {
  it("says nothing to the owner until somebody actually applies", async () => {
    await newcomer();
    // A visitor who signs in and wanders off did not ask for anything, and an
    // alert carrying only a display name is not something you can decide on.
    expect(sent).toHaveLength(0);
    expect(await getUser(ENV, "jane@example.com")).toMatchObject({ status: "pending" });
  });
});

describe("a payer answers, and does not wait", () => {
  it("is let straight through, and the owner gets an FYI with their answers", async () => {
    await preapprove(ENV, "payer@example.com", NOW());
    await recordSignIn(ENV, "payer@example.com", "Pat", NOW());
    const cookie = await googleCookie("payer@example.com", "Pat");

    // Paid, so already approved — and still sent to the form.
    const held = await get("/type/ENTP", cookie);
    expect(held.headers.get("location")).toBe(APPLY_PATH);

    await apply(cookie);
    const res = await get("/type/ENTP", cookie);
    expect(res.status).toBe(200);

    const ack = sent.find((m) => m.to[0] === "payer@example.com")!;
    expect(ack.subject).toBe("Octant — you're in");
    const owner = sent.find((m) => m.to[0] === "owner@example.com")!;
    expect(owner.text).toContain("Revoke:");
    expect(owner.text).not.toContain("Approve:");
    expect(owner.text).toContain(ANSWERS.hoping);
  });
});

describe("an invite code opens the door as far as the form", () => {
  it("asks a code holder for an address, since the code never carried one", async () => {
    const res = await get(APPLY_PATH, await codeCookie());
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('name="email"');
    expect(html).toContain("this is how the owner reaches you");
  });

  it("refuses an application with no address behind it", async () => {
    const res = await apply(await codeCookie(), ANSWERS);
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("We need an address");
    expect(sent).toHaveLength(0);
  });

  it("creates a record from the address they give, and reissues the session carrying it", async () => {
    const res = await apply(await codeCookie(), {
      ...ANSWERS, email: "Coded@Example.com", name: "Cody",
    });
    expect(res.status).toBe(303);
    // Normalised, like everywhere else that touches an address.
    expect(await getUser(ENV, "coded@example.com")).toMatchObject({
      name: "Cody", status: "pending", application: ANSWERS,
    });

    const reissued = res.headers.get("set-cookie") ?? "";
    expect(reissued).toContain("octant_session=");
    const next = await get("/type/ENTP", reissued.split(";")[0]);
    // Findable now — so they are held at the waiting page, not asked again.
    expect(next.status).toBe(403);
    expect(await next.text()).toContain("Your request is in");
  });

  it("leaves a codes-only deployment exactly as it was", async () => {
    // No USERS binding means nowhere to record an application and nowhere to
    // store an approval. Refusing here would lock out a whole deployment.
    ENV = { ...ENV, USERS: undefined, GOOGLE_CLIENT_ID: undefined } as unknown as Env;
    const res = await get("/type/ENTP", await codeCookie());
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("APP-SHELL");
  });
});

describe("nobody who joined earlier is sent back", () => {
  it("leaves an account that predates the form alone", async () => {
    const before = APPLICATION_REQUIRED_FROM - 86_400_000;
    await recordSignIn(ENV, "old@example.com", "Old Hand", before);
    await setStatus(ENV, "old@example.com", "approved", before);
    const res = await get("/type/ENTP", await googleCookie("old@example.com", "Old Hand"));
    expect(res.status).toBe(200);
  });

  it("leaves a code session minted before the form alone for the rest of its life", async () => {
    // Sessions carry an issued-at only since the form existed; its absence is
    // what marks one as handed out under the old rules.
    const res = await get("/type/ENTP", `octant_session=${await legacyCodeSession()}`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("APP-SHELL");
  });
});

/**
 * A session token exactly as issueSession minted them before `iat` existed.
 * Rebuilt by hand rather than kept as a fixture, so it stays signed by the
 * test's own secret and cannot rot into an expired string.
 */
async function legacyCodeSession(): Promise<string> {
  const { sign } = await import("../src/worker/crypto");
  const exp = Math.floor(Date.now() / 1000) + 30 * 86_400;
  const body = JSON.stringify({ l: "tester", k: "code", c: "abc123", e: exp });
  const payload = btoa(body).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${payload}.${await sign(payload, SECRET)}`;
}
