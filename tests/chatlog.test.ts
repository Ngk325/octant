import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  recordExchange, endSession, sweepIdle, validThreadId, IDLE_MS,
  listThreads, getThreadFor,
  type ChatLogEnv, type ChatLogRecord, type ChatWho,
} from "../src/worker/chatlog";
import type { KVNamespace } from "../src/worker/users";

/* ------------------------------------------------------------------ *
 * The transcript log: exchanges append, sessions mail exactly once,
 * abandoned threads get swept, and nothing here can break a chat.
 * ------------------------------------------------------------------ */

const NOW = 1_800_000_000_000;
const WHO: ChatWho = { email: "jane@example.com", label: "Jane", kind: "google" };

/** In-memory KV that also records TTLs, so retention is testable. */
function memoryKV(pageSize = 1000): KVNamespace & {
  store: Map<string, string>;
  ttls: Map<string, number | undefined>;
} {
  const store = new Map<string, string>();
  const ttls = new Map<string, number | undefined>();
  return {
    store,
    ttls,
    async get(k) { return store.get(k) ?? null; },
    async put(k, v, opts) { store.set(k, v); ttls.set(k, opts?.expirationTtl); },
    async delete(k) { store.delete(k); ttls.delete(k); },
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

let KV: ReturnType<typeof memoryKV>;
let ENV: ChatLogEnv;
let sent: { body: Record<string, unknown> }[];
let respond: () => Response;

beforeEach(() => {
  KV = memoryKV();
  ENV = {
    CHAT_LOGS: KV,
    RESEND_API_KEY: "re_test",
    OWNER_EMAIL: "owner@example.com",
    NOTIFY_FROM: "Octant <octant@verified.example>",
  };
  sent = [];
  respond = () => new Response("{}", { status: 200 });
  vi.stubGlobal("fetch", async (_url: string, init?: RequestInit) => {
    sent.push({ body: JSON.parse(String(init?.body)) });
    return respond();
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const record = (threadId: string): ChatLogRecord =>
  JSON.parse(KV.store.get(`chat:${threadId}`)!) as ChatLogRecord;

describe("thread ids", () => {
  it("accepts UUIDs and rejects anything that could be a hostile key", () => {
    expect(validThreadId(crypto.randomUUID())).toBe(true);
    expect(validThreadId("short")).toBe(false);
    expect(validThreadId("has spaces in it")).toBe(false);
    expect(validThreadId("../../etc/passwd")).toBe(false);
    expect(validThreadId(42)).toBe(false);
    expect(validThreadId(undefined)).toBe(false);
  });
});

describe("recording exchanges", () => {
  it("appends turns under one thread, with metadata and a TTL", async () => {
    await recordExchange(ENV, "thread-aaaa-1111", WHO, "type ENTP", "hi", "hello", NOW, "UA/1.0");
    await recordExchange(ENV, "thread-aaaa-1111", WHO, "pair ENTP·INFJ", "more", "sure", NOW + 1000);

    const rec = record("thread-aaaa-1111");
    expect(rec.turns.map((t) => t.text)).toEqual(["hi", "hello", "more", "sure"]);
    expect(rec.contexts).toEqual(["type ENTP", "pair ENTP·INFJ"]);
    expect(rec.who.email).toBe("jane@example.com");
    expect(rec.ua).toBe("UA/1.0");
    expect(rec.started).toBe(NOW);
    expect(rec.updated).toBe(NOW + 1000);
    expect(KV.ttls.get("chat:thread-aaaa-1111")).toBe(90 * 24 * 60 * 60);
  });

  it("does not duplicate an unchanged context label", async () => {
    await recordExchange(ENV, "thread-aaaa-2222", WHO, "type ENTP", "a", "b", NOW);
    await recordExchange(ENV, "thread-aaaa-2222", WHO, "type ENTP", "c", "d", NOW + 1);
    expect(record("thread-aaaa-2222").contexts).toEqual(["type ENTP"]);
  });

  it("is a no-op without the binding, and never throws on KV failure", async () => {
    await recordExchange({}, "thread-aaaa-3333", WHO, "x", "a", "b", NOW);
    const broken: ChatLogEnv = {
      CHAT_LOGS: { ...KV, put: async () => { throw new Error("kv down"); } },
    };
    await expect(
      recordExchange(broken, "thread-aaaa-4444", WHO, "x", "a", "b", NOW),
    ).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});

describe("ending a session", () => {
  it("mails the transcript once, with metadata and escaped turns", async () => {
    await recordExchange(ENV, "thread-bbbb-1111", WHO, "type ENTP", "<script>hi</script>", "answer", NOW);
    await endSession(ENV, "thread-bbbb-1111", NOW + 5000);

    expect(sent).toHaveLength(1);
    const mail = sent[0].body;
    expect(mail.from).toBe("Octant <octant@verified.example>");
    expect(mail.to).toEqual(["owner@example.com"]);
    expect(String(mail.subject)).toContain("jane@example.com");
    expect(String(mail.html)).toContain("&lt;script&gt;hi&lt;/script&gt;");
    expect(String(mail.html)).not.toContain("<script>hi");
    expect(String(mail.text)).toContain("[USER] <script>hi</script>");
    expect(String(mail.html)).toContain("type ENTP");

    expect(record("thread-bbbb-1111").mailed).toBe(NOW + 5000);

    // The beacon, the reset button and the sweep can all fire — one email.
    await endSession(ENV, "thread-bbbb-1111", NOW + 9000);
    expect(sent).toHaveLength(1);
  });

  it("NOTIFY_EMAIL overrides the recipient", async () => {
    await recordExchange(ENV, "thread-bbbb-2222", WHO, "x", "a", "b", NOW);
    await endSession({ ...ENV, NOTIFY_EMAIL: "inbox@elsewhere.example" }, "thread-bbbb-2222", NOW);
    expect(sent[0].body.to).toEqual(["inbox@elsewhere.example"]);
  });

  it("keeps the record un-mailed when Resend refuses, so the sweep can retry", async () => {
    respond = () => new Response("nope", { status: 403 });
    await recordExchange(ENV, "thread-bbbb-3333", WHO, "x", "a", "b", NOW);
    await endSession(ENV, "thread-bbbb-3333", NOW);
    expect(record("thread-bbbb-3333").mailed).toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it("sends nothing for an unknown or empty thread", async () => {
    await endSession(ENV, "thread-bbbb-4444", NOW);
    expect(sent).toHaveLength(0);
  });
});

describe("the idle sweep", () => {
  it("mails only threads that are idle and un-mailed, across KV pages", async () => {
    const paged = memoryKV(2);
    const env = { ...ENV, CHAT_LOGS: paged };
    // five threads: three idle, one fresh, one already mailed
    for (let i = 0; i < 3; i++) {
      await recordExchange(env, `thread-idle-000${i}`, WHO, "x", "q", "a", NOW - IDLE_MS - 60_000);
    }
    await recordExchange(env, "thread-live-0000", WHO, "x", "q", "a", NOW - 5_000);
    await recordExchange(env, "thread-done-0000", WHO, "x", "q", "a", NOW - IDLE_MS - 60_000);
    await endSession(env, "thread-done-0000", NOW - IDLE_MS);
    sent = [];

    await sweepIdle(env, NOW);
    expect(sent).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      expect(JSON.parse(paged.store.get(`chat:thread-idle-000${i}`)!).mailed).toBe(NOW);
    }
    expect(JSON.parse(paged.store.get("chat:thread-live-0000")!).mailed).toBeUndefined();
  });

  it("is a no-op without the binding", async () => {
    await sweepIdle({}, NOW);
    expect(sent).toHaveLength(0);
  });
});

describe("history", () => {
  const OTHER: ChatWho = { email: "other@example.com", label: "Other", kind: "google" };
  const CODE_WHO: ChatWho = { label: "invite-42", kind: "code" };

  it("lists only the caller's own threads, most recently updated first, with a preview", async () => {
    await recordExchange(ENV, "thread-hist-0001", WHO, "type ENTP", "first question", "answer", NOW);
    await recordExchange(ENV, "thread-hist-0002", WHO, "pair ENTP·INFJ", "second question", "answer", NOW + 5000);
    await recordExchange(ENV, "thread-hist-0003", OTHER, "type INFJ", "not mine", "answer", NOW + 1000);

    const mine = await listThreads(ENV, WHO);
    expect(mine.map((t) => t.threadId)).toEqual(["thread-hist-0002", "thread-hist-0001"]);
    expect(mine[0].preview).toBe("second question");
    expect(mine[0].contexts).toEqual(["pair ENTP·INFJ"]);
    expect(mine[0].turns).toBe(2);
  });

  it("matches invite-code sessions by label, not email", async () => {
    await recordExchange(ENV, "thread-hist-0004", CODE_WHO, "x", "q", "a", NOW);
    const mine = await listThreads(ENV, CODE_WHO);
    expect(mine.map((t) => t.threadId)).toEqual(["thread-hist-0004"]);
    expect(await listThreads(ENV, { label: "invite-42", kind: "code" } as ChatWho)).toHaveLength(1);
    expect(await listThreads(ENV, { label: "someone-else", kind: "code" } as ChatWho)).toHaveLength(0);
  });

  it("omits threads with no turns yet", async () => {
    await ENV.CHAT_LOGS!.put(
      "chat:thread-hist-empty",
      JSON.stringify({ who: WHO, started: NOW, updated: NOW, contexts: [], turns: [] } satisfies ChatLogRecord),
    );
    expect(await listThreads(ENV, WHO)).toHaveLength(0);
  });

  it("is a no-op without the binding", async () => {
    expect(await listThreads({}, WHO)).toEqual([]);
  });

  it("returns a thread only to the person it belongs to", async () => {
    await recordExchange(ENV, "thread-hist-0005", WHO, "x", "q", "a", NOW);
    expect((await getThreadFor(ENV, WHO, "thread-hist-0005"))?.turns).toHaveLength(2);
    expect(await getThreadFor(ENV, OTHER, "thread-hist-0005")).toBeNull();
    expect(await getThreadFor(ENV, WHO, "thread-hist-nonexistent")).toBeNull();
  });

  /* Two people using bare invite codes both carry the label "guest" — the
     label was never an identity, and matching on it let each read the
     other's transcripts. Sessions now mint a codeId (a digest prefix of the
     code) and it, not the label, decides ownership when present. */
  it("separates two same-labelled codes by their code identity", async () => {
    const guestA: ChatWho = { label: "guest", kind: "code", codeId: "aaaa000011112222" };
    const guestB: ChatWho = { label: "guest", kind: "code", codeId: "bbbb000011112222" };
    await recordExchange(ENV, "thread-hist-0006", guestA, "x", "private to A", "a", NOW);

    expect(await listThreads(ENV, guestB)).toHaveLength(0);
    expect(await getThreadFor(ENV, guestB, "thread-hist-0006")).toBeNull();
    expect((await getThreadFor(ENV, guestA, "thread-hist-0006"))?.turns).toHaveLength(2);
  });

  it("a codeId session cannot read a legacy (codeId-less) record by shared label", async () => {
    /* The pre-migration hole: two bare codes both label "guest", and a legacy
       record carries no codeId. A NEW guest session (with a codeId) must not be
       able to read that legacy record just because the labels match — that was
       the exact exposure the codeId exists to close, and it would otherwise
       persist for the 90-day record TTL. */
    const legacy: ChatWho = { label: "guest", kind: "code" }; // no codeId — pre-migration
    await recordExchange(ENV, "thread-hist-legacy1", legacy, "x", "written before the fix", "a", NOW);

    const newGuest: ChatWho = { label: "guest", kind: "code", codeId: "eeee000011112222" };
    expect(await listThreads(ENV, newGuest)).toHaveLength(0);
    expect(await getThreadFor(ENV, newGuest, "thread-hist-legacy1")).toBeNull();

    // A legacy session (also no codeId) still reaches its own legacy records —
    // unchanged prior behaviour, bounded by the 30-day session expiry.
    expect((await getThreadFor(ENV, legacy, "thread-hist-legacy1"))?.turns).toHaveLength(2);
  });

  it("keeps the first writer as owner — an append by someone else is dropped", async () => {
    const owner: ChatWho = { label: "guest", kind: "code", codeId: "cccc000011112222" };
    const intruder: ChatWho = { label: "guest", kind: "code", codeId: "dddd000011112222" };
    await recordExchange(ENV, "thread-hist-0007", owner, "x", "the secret question", "a", NOW);

    /* Before the fix this append re-assigned rec.who, after which the
       intruder owned the whole prior history. */
    await recordExchange(ENV, "thread-hist-0007", intruder, "x", "takeover", "a", NOW + 1);

    const rec = await getThreadFor(ENV, owner, "thread-hist-0007");
    expect(rec?.turns.map((t) => t.text)).toEqual(["the secret question", "a"]);
    expect(await getThreadFor(ENV, intruder, "thread-hist-0007")).toBeNull();
  });
});

describe("meta — title, summary, tags", () => {
  const geminiOk = (meta: { title: string; summary: string; tags: string[] }) => () =>
    new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(meta) }] } }],
    }), { status: 200 });

  /** Routes to Resend or Gemini by URL, so both can be exercised in one test. */
  function stubBoth(gemini: () => Response) {
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      if (url.includes("generativelanguage.googleapis.com")) return gemini();
      sent.push({ body: JSON.parse(String(init?.body)) });
      return respond();
    });
  }

  it("generates title/summary/tags once and includes them in the email only", async () => {
    stubBoth(geminiOk({ title: "ENTP vs INFJ fit", summary: "Asked how the pair holds up under stress.", tags: ["ENTP", "INFJ", "pair"] }));
    const env = { ...ENV, GEMINI_API_KEY: "g_test" };

    await recordExchange(env, "thread-meta-0001", WHO, "pair ENTP·INFJ", "how do we fit?", "here is how", NOW);
    await endSession(env, "thread-meta-0001", NOW + 1000);

    const rec = record("thread-meta-0001");
    expect(rec.meta).toEqual({
      title: "ENTP vs INFJ fit",
      summary: "Asked how the pair holds up under stress.",
      tags: ["entp", "infj", "pair"],
    });

    const mail = sent[0].body;
    expect(String(mail.subject)).toContain("ENTP vs INFJ fit");
    expect(String(mail.text)).toContain("Summary:  Asked how the pair holds up under stress.");
    expect(String(mail.text)).toContain("Tags:     entp, infj, pair");
    expect(String(mail.html)).toContain("Asked how the pair holds up under stress.");
  });

  it("never sends summary or tags back to a client asking for its own thread", async () => {
    stubBoth(geminiOk({ title: "A short title", summary: "Private internal summary.", tags: ["secret-tag"] }));
    const env = { ...ENV, GEMINI_API_KEY: "g_test" };

    await recordExchange(env, "thread-meta-0002", WHO, "x", "q", "a", NOW);
    await endSession(env, "thread-meta-0002", NOW);

    const forClient = await getThreadFor(env, WHO, "thread-meta-0002");
    expect(forClient?.meta?.title).toBe("A short title");
    expect(forClient?.meta?.summary).toBe("");
    expect(forClient?.meta?.tags).toEqual([]);

    // The title alone is fine to surface in the history list.
    const history = await listThreads(env, WHO);
    expect(history[0].preview).toBe("A short title");
  });

  it("is a no-op without a Gemini key, and never blocks mailing", async () => {
    await recordExchange(ENV, "thread-meta-0003", WHO, "x", "q", "a", NOW);
    await endSession(ENV, "thread-meta-0003", NOW);
    expect(record("thread-meta-0003").meta).toBeUndefined();
    expect(sent).toHaveLength(1);
  });

  it("degrades to no meta on a bad Gemini response, without failing the session", async () => {
    stubBoth(() => new Response("nope", { status: 500 }));
    const env = { ...ENV, GEMINI_API_KEY: "g_test" };

    await recordExchange(env, "thread-meta-0004", WHO, "x", "q", "a", NOW);
    await endSession(env, "thread-meta-0004", NOW);

    expect(record("thread-meta-0004").meta).toBeUndefined();
    expect(record("thread-meta-0004").mailed).toBe(NOW);
    expect(sent).toHaveLength(1);
  });

  it("does not regenerate meta on a later, idempotent call", async () => {
    let calls = 0;
    stubBoth(() => {
      calls++;
      return geminiOk({ title: "Once", summary: "s", tags: ["t"] })();
    });
    const env = { ...ENV, GEMINI_API_KEY: "g_test" };

    await recordExchange(env, "thread-meta-0005", WHO, "x", "q", "a", NOW);
    respond = () => new Response("nope", { status: 403 }); // mail fails, meta should still stick
    await endSession(env, "thread-meta-0005", NOW);
    expect(calls).toBe(1);
    expect(record("thread-meta-0005").meta?.title).toBe("Once");

    respond = () => new Response("{}", { status: 200 });
    await endSession(env, "thread-meta-0005", NOW + 1000);
    expect(calls).toBe(1); // meta was already there — not regenerated
  });
});
