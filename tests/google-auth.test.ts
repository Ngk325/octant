import { describe, expect, it, beforeEach } from "vitest";
import {
  requireAuth, issueSession, isConfigured, googleAvailable, isAssetPath, readSession,
  type AuthEnv,
} from "../src/worker/auth";
import {
  recordSignIn, setStatus, getUser, listUsers, normalise, isOwner, preapprove,
  type KVNamespace, type User,
} from "../src/worker/users";
import { handleAdmin } from "../src/worker/admin";
import { seal, unseal } from "../src/worker/crypto";
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

/**
 * An in-memory KV good enough to be honest about: get, put, delete, and
 * list-by-prefix — INCLUDING the page limit.
 *
 * `pageSize` is tiny rather than KV's real 1000 so a pagination bug is
 * reachable in a test. A stub that returned everything in one call would
 * report a paginating implementation and a non-paginating one as identical,
 * which is the same as not testing it.
 */
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
let USERS: ReturnType<typeof memoryKV>;
let ENV: AuthEnv;

beforeEach(() => {
  USERS = memoryKV();
  ENV = {
    AUTH_SECRET: SECRET,
    USERS,
    OWNER_EMAIL: "owner@example.com",
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
    const { user } = await recordSignIn(ENV, "owner@example.com", "Owner", NOW);
    expect(user.status).toBe("approved");
    expect(user.owner).toBe(true);
    expect(isOwner(ENV, "OWNER@example.com")).toBe(true);
  });

  it("approves a preapproved (already-paid) newcomer on sight, and consumes the marker", async () => {
    await preapprove(ENV, "Jane@Example.com", NOW - 1000);
    const { user, isNew, wasPreapproved } = await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    expect(isNew).toBe(true);
    expect(wasPreapproved).toBe(true);
    expect(user.status).toBe("approved");
    expect(user.decidedAt).toBe(NOW);
    // One-shot: the marker is gone, so it cannot silently re-approve someone later.
    expect(await USERS.get("preapproved:jane@example.com")).toBeNull();
  });

  it("a preapproval never touches an EXISTING user's status", async () => {
    await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    await setStatus(ENV, "jane@example.com", "blocked", NOW);
    await preapprove(ENV, "jane@example.com", NOW + 1000);
    const { user, isNew, wasPreapproved } = await recordSignIn(ENV, "jane@example.com", "Jane", NOW + 2000);
    expect(isNew).toBe(false);
    expect(wasPreapproved).toBe(false);
    expect(user.status).toBe("blocked");
  });

  it("without a preapproval, a newcomer starts pending exactly as before", async () => {
    const { wasPreapproved, user } = await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    expect(wasPreapproved).toBe(false);
    expect(user.status).toBe("pending");
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
    await recordSignIn(ENV, "owner@example.com", "Owner", NOW);
    const after = await setStatus(ENV, "owner@example.com", "blocked", NOW);
    expect(after?.status).toBe("approved");
  });

  it("survives a corrupt record without throwing", async () => {
    USERS.store.set("user:broken@example.com", "{not json");
    expect(await getUser(ENV, "broken@example.com")).toBeNull();
    expect(await listUsers(ENV)).toEqual([]);
  });

  /* KV hands back at most 1000 keys and a cursor for the rest. Reading only the
     first page would leave someone enforced against but invisible to /admin —
     still blocked, and with no screen able to un-block them. */
  it("pages through KV rather than stopping at the first page", async () => {
    const paged = memoryKV(3);
    const env = { ...ENV, USERS: paged };
    for (let i = 0; i < 10; i++) {
      await recordSignIn(env, `p${i}@example.com`, `Person ${i}`, NOW + i);
    }
    const all = await listUsers(env);
    expect(all).toHaveLength(10);
    expect(new Set(all.map((u) => u.email)).size).toBe(10);
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

  /** What the owner's tap on the button in the confirmation page sends. */
  const confirm = (link: string) => {
    const token = new URL(link).searchParams.get("t")!;
    return new Request(`${origin}/api/admin/act`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ t: token }),
    });
  };

  /* Mail clients, link-safety scanners and chat previews fetch every URL in a
     message before a human sees it. If opening the link decided anything, the
     decision would be made by whichever scanner reached the inbox first. */
  it("decides nothing when the link is merely opened", async () => {
    await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    const link = await actionLink(origin, "jane@example.com", "approve", SECRET, NOW);

    const res = (await handleAdmin(new Request(link), ENV, { owner: false }, NOW))!;
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("Let them in?");
    expect(html).toContain("method=\"POST\"");
    expect((await getUser(ENV, "jane@example.com"))?.status).toBe("pending");
  });

  it("approves the one person it names, with no session at all", async () => {
    await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    const link = await actionLink(origin, "jane@example.com", "approve", SECRET, NOW);
    const res = (await handleAdmin(confirm(link), ENV, { owner: false }, NOW))!;
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Approved");
    expect((await getUser(ENV, "jane@example.com"))?.status).toBe("approved");
  });

  it("blocks from a deny link", async () => {
    await recordSignIn(ENV, "jane@example.com", "Jane", NOW);
    const link = await actionLink(origin, "jane@example.com", "block", SECRET, NOW);
    await handleAdmin(confirm(link), ENV, { owner: false }, NOW);
    expect((await getUser(ENV, "jane@example.com"))?.status).toBe("blocked");
  });

  /* A display name is chosen by the person being approved, and it lands in the
     owner's browser on the owner's origin — on the very page they are using to
     decide whether to trust them. It went in unescaped once. */
  it("escapes the display name instead of executing it", async () => {
    const attack = `<script>fetch('/api/admin/users')</script>`;
    await recordSignIn(ENV, "mallory@example.com", attack, NOW);
    const link = await actionLink(origin, "mallory@example.com", "approve", SECRET, NOW);

    for (const req of [new Request(link), confirm(link)]) {
      const html = await (await handleAdmin(req, ENV, { owner: false }, NOW))!.text();
      expect(html).not.toContain("<script>fetch");
      expect(html).toContain("&lt;script&gt;");
    }
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
  const asOwner = { email: "owner@example.com", owner: true };

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
    await recordSignIn(ENV, "owner@example.com", "Owner", NOW);
    const req = new Request("https://example.com/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "owner@example.com", status: "blocked" }),
    });
    expect((await handleAdmin(req, ENV, asOwner, NOW))!.status).toBe(409);
  });

  it("is closed to a signed-in non-owner", async () => {
    const res = (await handleAdmin(get("/api/admin/users"), ENV, { email: "jane@example.com", owner: false }, NOW))!;
    expect(res.status).toBe(403);
  });
});

/* `atob` returns one character per byte — Latin-1 — but everything here is
   encoded as UTF-8. Decoding without a TextDecoder mangles every name and
   address above U+007F, and a mangled email is a KV key that matches nothing:
   the person signs in successfully and is then a stranger on every request. */
describe("non-ASCII names and addresses survive the round trip", () => {
  const NAME = "José Müller 文字";
  const EMAIL = "josé@example.com";

  it("through a sealed value", async () => {
    const sealed = await seal({ email: EMAIL, action: "approve" }, SECRET, 600, NOW);
    expect(await unseal(sealed, SECRET, NOW)).toEqual({ email: EMAIL, action: "approve" });
  });

  it("through a session cookie", async () => {
    const token = await issueSession(NAME, "google", EMAIL, SECRET, NOW);
    const session = await readSession(get("/", `octant_session=${token}`), ENV, NOW);
    expect(session).toMatchObject({ label: NAME, email: EMAIL });
  });

  it("through the user list, so the record is findable again", async () => {
    const { user } = await recordSignIn(ENV, EMAIL, NAME, NOW);
    expect(user.name).toBe(NAME);
    expect((await getUser(ENV, EMAIL))?.name).toBe(NAME);
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
