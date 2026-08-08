/* ------------------------------------------------------------------ *
 * THE USER LIST
 *
 * Invite codes needed no storage — a code either matched or it did not.
 * Approving and disabling people does need storage, because the answer
 * has to outlive the request that set it.
 *
 * KV, not D1. The whole workload is "read one record by email", which is
 * exactly what a key-value store is for, and it needs no schema and no
 * migration. The price is that KV is eventually consistent: a disable
 * can take up to about a minute to reach every edge. That is stated in
 * the docs rather than hidden, and there is a hard override — rotating
 * AUTH_SECRET kills every session everywhere, immediately.
 * ------------------------------------------------------------------ */

export interface UserEnv {
  /** KV namespace holding the user list. Without it, Google sign-in is off. */
  USERS?: KVNamespace;
  /** The owner's Google address. Auto-approved, and the only account /admin opens for. */
  OWNER_EMAIL?: string;
}

/** Minimal KV surface this module uses, so tests can supply a plain object. */
export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string }): Promise<{
    keys: { name: string }[];
    list_complete?: boolean;
    cursor?: string;
  }>;
}

/**
 * `pending` is the default for anyone new, and it shows them nothing.
 * `blocked` is a deliberate no from the owner. Both are refused; they are
 * separate so the person is told which one applies, and so re-approving
 * somebody you blocked is a distinct act from approving a newcomer.
 */
export type UserStatus = "pending" | "approved" | "blocked";

export interface User {
  email: string;
  name: string;
  status: UserStatus;
  /** Epoch ms. */
  firstSeen: number;
  lastSeen: number;
  decidedAt?: number;
  /** True for OWNER_EMAIL. Cannot be blocked — see setStatus. */
  owner?: boolean;
}

const KEY = (email: string) => `user:${normalise(email)}`;

/** Emails are case-insensitive in practice; store and compare one way only. */
export const normalise = (email: string) => email.trim().toLowerCase();

export const isOwner = (env: UserEnv, email: string) =>
  !!env.OWNER_EMAIL && normalise(env.OWNER_EMAIL) === normalise(email);

/** The stored record for an email, or null. */
export async function getUser(env: UserEnv, email: string): Promise<User | null> {
  if (!env.USERS) return null;
  const raw = await env.USERS.get(KEY(email));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null; // corrupt record reads as absent rather than throwing mid-request
  }
}

/**
 * Record a sign-in, creating the user on first sight.
 *
 * The owner is approved automatically — otherwise nobody could ever approve
 * anybody, since the first person to arrive would be waiting on themselves.
 * Everyone else starts `pending` and sees nothing until told otherwise.
 *
 * Returns the record and whether this was the first time, which is what
 * decides if the owner gets an email.
 */
export async function recordSignIn(
  env: UserEnv, email: string, name: string, now: number,
): Promise<{ user: User; isNew: boolean }> {
  const existing = await getUser(env, email);
  const owner = isOwner(env, email);

  if (existing) {
    const user: User = {
      ...existing,
      name: name || existing.name,
      lastSeen: now,
      // A promotion to owner is honoured on sight; a demotion is not silently
      // applied, because losing OWNER_EMAIL should not lock you out of /admin.
      owner: existing.owner || owner,
      status: owner ? "approved" : existing.status,
    };
    await put(env, user);
    return { user, isNew: false };
  }

  const user: User = {
    email: normalise(email),
    name: name || normalise(email),
    status: owner ? "approved" : "pending",
    firstSeen: now,
    lastSeen: now,
    owner: owner || undefined,
    decidedAt: owner ? now : undefined,
  };
  await put(env, user);
  return { user, isNew: true };
}

/**
 * Approve, block or reset somebody.
 *
 * The owner cannot be blocked. Locking yourself out of the only account that
 * can unlock anything is not a state worth being able to reach — it would take
 * a secret rotation and a redeploy to recover from.
 */
export async function setStatus(
  env: UserEnv, email: string, status: UserStatus, now: number,
): Promise<User | null> {
  const user = await getUser(env, email);
  if (!user) return null;
  if (user.owner && status === "blocked") return user;
  const next: User = { ...user, status, decidedAt: now };
  await put(env, next);
  return next;
}

/**
 * Everyone on the list, newest arrival first.
 *
 * KV's `list` returns at most 1000 keys per call and hands back a cursor for
 * the rest. Reading only the first page would silently drop user 1001 from
 * /admin — they would still be enforced against on every request, but would be
 * invisible to the only screen that can un-block them. Unlikely at this scale;
 * a page nobody can reach is not the kind of bug to leave for later.
 */
export async function listUsers(env: UserEnv): Promise<User[]> {
  if (!env.USERS) return [];

  const keys: { name: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.USERS.list({ prefix: "user:", cursor });
    keys.push(...page.keys);
    cursor = page.list_complete === false ? page.cursor : undefined;
  } while (cursor);

  const users = await Promise.all(
    keys.map(async ({ name }) => {
      const raw = await env.USERS!.get(name);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as User;
      } catch {
        return null;
      }
    }),
  );
  return users.filter((u): u is User => !!u).sort((a, b) => b.firstSeen - a.firstSeen);
}

const put = async (env: UserEnv, user: User) => {
  if (env.USERS) await env.USERS.put(KEY(user.email), JSON.stringify(user));
};
