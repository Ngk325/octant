import { describe, expect, it, beforeEach } from "vitest";
import {
  requireAuth, issueSession, isConfigured, googleAvailable, isAssetPath, readSession,
  type AuthEnv,
} from "../src/worker/auth";
import {
  recordSignIn, setStatus, getUser, listUsers, normalise, isOwner,
  type KVNamespace, type User,
} from "../src/worker/users";
import { handleAdmin } from "../src/worker/admin";
import { actionLink } from "../src/worker/notify";
import { safeReturn, startGoogleSignIn, completeGoogleSignIn } from "../src/worker/google";

/* ------------------------------------------------------------------ *
 * Google sign-in adds a second way in, and with it the thing the codes
 * never had: a decision the owner can change AFTER the fact.
 *
 * So the question these tests answer is not "can they sign in" — it is
 * "does signing in get them anything before the owner says yes", and
 * "does withdrawing it actually take effect".
 * ------------------------------------------------------------------ */

/** An in-memory KV good enough to be honest about: get, put, delete, list-by-prefix. */
function memoryKV(): KVNamespace & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    async get(k) { return store.get(k) ?? null; },
    async put(k, v) { store.set(k, v); },
    async delete(k) { store.delete(k); },
    async list({ prefix = "" } = {}) {
      return { keys: [...store.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })) };
    },
  };
}

const SECRET = "a-long-random-signing-key-for-tests";
const NOW = 1_800_000_000_000;
let USERS: ReturnType<typeof memoryKV>;
let ENV: AuthEnv;

beforeEach(() => {
  USERS = memoryKV();
  ENV = {
    AUTH_SECRET: SECRET,
    USERS,
    OWNER_EMAIL: "nick@stratfieldpartners.com",
    GOOGLE_CLIENT_ID: "test-client-id.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: "test-client-secret",
  };
});

const get = (path = "/", cookie?: string) =>
  new Request(`https://example.com${path}`, cookie ? { headers: { cookie } } : undefined);

/** The cookie a Google sign-in would have left behind. */
const sessionFor = async (user: User) =>
  `octant_session=${await issueSession(user.name, "google", user.email, SECRET, NOW)}`;

describe("the user list", () => {
  it("starts a newcomer pending, and says they are new", async () => {
    const { user, isNew } = await recordSignIn(ENV, "Jane@Example.com", "Jane", NOW);
    expect(isNew).toBe(true);
    expect(user).toMatchObject({ email: "jane@example.com", name: "Jane", status: "pending" });
  });

  it("normalises the email, so casing cannot create a second account", async () => {
    await recordSignIn(ENV, "Jane@Example.com", "Jane", NOW);
    await recordSignIn(ENV, "JANE@example.COM", "Jane", NOW + 1000);
    expect(await listUsers(ENV)).toHaveLength(1);
    expect(normalise("  JANE@Example.com ")).toBe("jane@example.com");
  });

  it("auto-approves the owner — otherwise nobody could ever approve anybody", async () => {
    const { user } = await recordSignIn(ENV, "nick@stratfieldpartners.com", "Nick", NOW);
    expect(user.status).toBe("approved");
    expect(user.owner).toBe(true);
    expect(isOwner(ENV, "NICK@stratfieldpartners.com")).toBe(true);
  });

  it("does not reset an existing decision on a later sign-in", async () => {
    await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    await setStatus(ENV, "jane@example.com", "approved", NOW);
    const { user, isNew } = await recordSignIn(ENV, "jane@example.com", "Jane", NOW + 86_400_000);
    expect(isNew).toBe(false);
    expect(user.status).toBe("approved");
    expect(user.lastSeen).toBe(NOW + 86_400_000);
  });

  /** Locking yourself out of the only account that can unlock anything. */
  it("refuses to block the owner", async () => {
    await recordSignIn(ENV, "nick@stratfieldpartners.com", "Nick", NOW);
    const after = await setStatus(ENV, "nick@stratfieldpartners.com", "blocked", NOW);
    expect(after?.status).toBe("approved");
  });

  it("survives a corrupt record without throwing", async () => {
    USERS.store.set("user:broken@example.com", "{not json");
    expect(await getUser(ENV, "broken@example.com")).toBeNull();
    expect(await listUsers(ENV)).toEqual([]);
  });
});

describe("the gate, for a Google session", () => {
  it("holds a pending person at the door — signed in, and shown nothing", async () => {
    const { user } = await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    const cookie = await sessionFor(user);

    // The session itself is valid — they ARE signed in.
    expect(await readSession(get("/", cookie), ENV, NOW)).toMatchObject({
      kind: "google", email: "jane@example.com",
    });

    const res = (await requireAuth(get("/type/ENTP", cookie), ENV, NOW))!;
    expect(res.status).toBe(403);
    const html = await res.text();
    expect(html).toContain("Waiting for approval");
    expect(html).not.toContain("<script type=\"module\"");
  });

  it("lets them in once approved", async () => {
    const { user } = await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    const cookie = await sessionFor(user);
    await setStatus(ENV, "jane@example.com", "approved", NOW);
    expect(await requireAuth(get("/type/ENTP", cookie), ENV, NOW)).toBeNull();
    expect(await requireAuth(get("/api/chat", cookie), ENV, NOW)).toBeNull();
  });

  /**
   * The whole point of the feature. The cookie is unchanged and still validly
   * signed — what changed is the owner's answer, and that has to win.
   */
  it("shuts an approved person out again the moment they are blocked", async () => {
    const { user } = await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    const cookie = await sessionFor(user);
    await setStatus(ENV, "jane@example.com", "approved", NOW);
    expect(await requireAuth(get("/", cookie), ENV, NOW)).toBeNull();

    await setStatus(ENV, "jane@example.com", "blocked", NOW);
    const res = (await requireAuth(get("/", cookie), ENV, NOW))!;
    expect(res.status).toBe(403);
    expect(await res.text()).toContain("No access");
  });

  it("gives the app's own fetches JSON, not a page", async () => {
    const { user } = await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    const cookie = await sessionFor(user);
    const res = (await requireAuth(get("/api/chat", cookie), ENV, NOW))!;
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Waiting for approval." });
  });

  it("refuses a session whose user has been deleted entirely", async () => {
    const { user } = await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    const cookie = await sessionFor(user);
    await setStatus(ENV, "jane@example.com", "approved", NOW);
    USERS.store.clear();
    expect(await requireAuth(get("/", cookie), ENV, NOW)).not.toBeNull();
  });

  /**
   * Assets skip the KV read: useless without the shell, and the shell is
   * checked. This documents the deliberate staleness rather than hiding it.
   */
  it("does not spend a KV read on every static asset", async () => {
    const { user } = await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    const cookie = await sessionFor(user);
    expect(await requireAuth(get("/assets/index-abc123.js", cookie), ENV, NOW)).toBeNull();
    expect(isAssetPath("/assets/app.js")).toBe(true);
    expect(isAssetPath("/favicon.ico")).toBe(true);
    expect(isAssetPath("/type/ENTP")).toBe(false);
    expect(isAssetPath("/")).toBe(false);
    expect(isAssetPath("/api/chat")).toBe(false);
  });

  it("still refuses a forged or expired Google session outright", async () => {
    const { user } = await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    await setStatus(ENV, "jane@example.com", "approved", NOW);
    const cookie = await sessionFor(user);
    expect(await requireAuth(get("/", cookie), { ...ENV, AUTH_SECRET: "other" }, NOW)).not.toBeNull();
    expect(await requireAuth(get("/", cookie), ENV, NOW + 31 * 86_400_000)).not.toBeNull();
  });
});

describe("configuration", () => {
  it("counts Google as a way in, so a code-free deployment still works", () => {
    expect(isConfigured({ ...ENV, ACCESS_CODES: undefined })).toBe(true);
    expect(googleAvailable(ENV)).toBe(true);
  });

  it("does not offer Google without a KV namespace to remember people in", () => {
    expect(googleAvailable({ ...ENV, USERS: undefined })).toBe(false);
    expect(isConfigured({ ...ENV, USERS: undefined, ACCESS_CODES: undefined })).toBe(false);
  });

  it("offers the Google button on the gate only when it will work", async () => {
    const withGoogle = await (await requireAuth(get("/"), ENV, NOW))!.text();
    expect(withGoogle).toContain("Continue with Google");

    const codesOnly = { AUTH_SECRET: SECRET, ACCESS_CODES: "nick:abc" };
    const without = await (await requireAuth(get("/"), codesOnly, NOW))!.text();
    expect(without).not.toContain("Continue with Google");
    expect(without).toContain("Access code");
  });
});

describe("the signed approve/deny links", () => {
  const origin = "https://example.com";

  it("approves the one person it names, with no session at all", async () => {
    await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    const link = await actionLink(origin, "jane@example.com", "approve", SECRET, NOW);
    const res = (await handleAdmin(new Request(link), ENV, { owner: false }, NOW))!;
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Approved");
    expect((await getUser(ENV, "jane@example.com"))?.status).toBe("approved");
  });

  it("blocks from a deny link", async () => {
    await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    const link = await actionLink(origin, "jane@example.com", "block", SECRET, NOW);
    await handleAdmin(new Request(link), ENV, { owner: false }, NOW);
    expect((await getUser(ENV, "jane@example.com"))?.status).toBe("blocked");
  });

  it("refuses a tampered link", async () => {
    await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    await recordSignIn(ENV, "mallory@example.com", "Mallory", NOW);
    const link = await actionLink(origin, "jane@example.com", "approve", SECRET, NOW);
    const forged = link.replace(/t=.*/, "t=" + encodeURIComponent(
      btoa(JSON.stringify({ v: { email: "mallory@example.com", action: "approve" }, e: 9e9 }))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") + ".nope"));
    const res = (await handleAdmin(new Request(forged), ENV, { owner: false }, NOW))!;
    expect(res.status).toBe(400);
    expect((await getUser(ENV, "mallory@example.com"))?.status).toBe("pending");
  });

  it("expires", async () => {
    await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    const link = await actionLink(origin, "jane@example.com", "approve", SECRET, NOW);
    const res = (await handleAdmin(new Request(link), ENV, { owner: false }, NOW + 8 * 86_400_000))!;
    expect(res.status).toBe(400);
    expect((await getUser(ENV, "jane@example.com"))?.status).toBe("pending");
  });

  /** A leaked link must not become a way to enumerate or manage everybody. */
  it("cannot be used to reach the rest of the admin surface", async () => {
    const res = (await handleAdmin(get("/api/admin/users"), ENV, { owner: false }, NOW))!;
    expect(res.status).toBe(403);
  });
});

describe("the admin API", () => {
  const asOwner = { email: "nick@stratfieldpartners.com", owner: true };

  it("lists everyone for the owner", async () => {
    await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    const res = (await handleAdmin(get("/api/admin/users"), ENV, asOwner, NOW))!;
    expect(res.status).toBe(200);
    expect((await res.json()).users).toHaveLength(1);
  });

  it("changes a status", async () => {
    await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    const req = new Request("https://example.com/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "jane@example.com", status: "approved" }),
    });
    expect((await handleAdmin(req, ENV, asOwner, NOW))!.status).toBe(200);
    expect((await getUser(ENV, "jane@example.com"))?.status).toBe("approved");
  });

  it("rejects a status it does not recognise", async () => {
    await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    const req = new Request("https://example.com/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "jane@example.com", status: "admin" }),
    });
    expect((await handleAdmin(req, ENV, asOwner, NOW))!.status).toBe(400);
  });

  it("will not block the owner even when asked directly", async () => {
    await recordSignIn(ENV, "nick@stratfieldpartners.com", "Nick", NOW);
    const req = new Request("https://example.com/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "nick@stratfieldpartners.com", status: "blocked" }),
    });
    expect((await handleAdmin(req, ENV, asOwner, NOW))!.status).toBe(409);
  });

  it("is closed to a signed-in non-owner", async () => {
    const res = (await handleAdmin(get("/api/admin/users"), ENV, { email: "jane@example.com", owner: false }, NOW))!;
    expect(res.status).toBe(403);
  });
});

describe("the OAuth flow's own checks", () => {
  it("only ever returns to a path on this site", () => {
    expect(safeReturn("/type/ENTP")).toBe("/type/ENTP");
    expect(safeReturn("https://evil.example")).toBe("/");
    expect(safeReturn("//evil.example")).toBe("/");
    expect(safeReturn("javascript:alert(1)")).toBe("/");
  });

  it("sends a signed, short-lived state and asks for the account chooser", async () => {
    const { location, cookie } = await startGoogleSignIn(
      new URL("https://example.com/"), ENV, NOW, "/matrix",
    );
    const u = new URL(location);
    expect(u.origin + u.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(u.searchParams.get("code_challenge_method")).toBe("S256");
    expect(u.searchParams.get("prompt")).toBe("select_account");
    expect(u.searchParams.get("redirect_uri")).toBe("https://example.com/api/auth/google/callback");
    expect(u.searchParams.get("state")).toBeTruthy();
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
  });

  it("refuses a callback whose state does not match the cookie", async () => {
    const { cookie } = await startGoogleSignIn(new URL("https://example.com/"), ENV, NOW);
    const res = await completeGoogleSignIn(
      new Request("https://example.com/api/auth/google/callback?code=x&state=not-the-nonce", {
        headers: { cookie: cookie.split(";")[0] },
      }), ENV, NOW,
    );
    expect(res).toMatchObject({ ok: false });
  });

  it("refuses a callback with no state cookie at all", async () => {
    const res = await completeGoogleSignIn(
      new Request("https://example.com/api/auth/google/callback?code=x&state=y"), ENV, NOW,
    );
    expect(res).toMatchObject({ ok: false });
  });

  it("reports a cancelled sign-in as cancelled, not as a failure", async () => {
    const res = await completeGoogleSignIn(
      new Request("https://example.com/api/auth/google/callback?error=access_denied"), ENV, NOW,
    );
    expect(res).toMatchObject({ ok: false, error: "Sign-in was cancelled." });
  });
});
