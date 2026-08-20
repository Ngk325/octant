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

/**
 * What somebody said about themselves when they asked for access.
 *
 * It lives on the User record rather than in a namespace of its own, unlike
 * the chat logs or the onramp leads. Those are content that happens to be
 * about a person; this is the evidence the owner decides on. Splitting it
 * off would mean two reads on the one path that must stay cheap — the gate
 * runs on every non-asset request — and a decision page that can load the
 * person but not the reason.
 *
 * Every field is a string, including the choices: apply.ts writes the
 * option's own label rather than a code, so the owner's email and the
 * decision page read as English without a lookup table that could drift
 * away from the form.
 */
export interface Application {
  purpose: string;
  context: string;
  familiarity: string;
  hoping: string;
  /** Optional on the form — the only one that may be empty. */
  found: string;
  at: number;
}

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
  /** What they told us when they applied. Absent until they do. */
  application?: Application;
}

/**
 * Applications did not exist before this. Anybody whose record predates it
 * already joined under the old rules and is not sent back to fill in a form
 * — the gate would otherwise ambush every existing reader on their next page
 * load, which is not what "all NEW users are gated" asked for.
 *
 * A date, not a flag, because it needs no migration and no per-user
 * bookkeeping: the record already knows when its person first arrived.
 */
export const APPLICATION_REQUIRED_FROM = Date.parse("2026-08-20T00:00:00Z");

/**
 * Whether this person still owes an application.
 *
 * The owner never does — they are approved on sight precisely because
 * nobody exists yet to approve them, and a form standing between the owner
 * and their own /admin page is a lockout waiting to happen.
 *
 * Note what this does NOT consult: status. Someone auto-approved by payment
 * still answers the questions; they simply do not wait afterwards. That is
 * the difference between skipping the queue and skipping the questions.
 */
export const needsApplication = (user: User): boolean =>
  !user.application && !user.owner && user.firstSeen >= APPLICATION_REQUIRED_FROM;

const KEY = (email: string) => `user:${normalise(email)}`;
const PREAPPROVE_KEY = (email: string) => `preapproved:${normalise(email)}`;
/** Long enough for someone to get around to signing in after paying; not indefinite. */
const PREAPPROVE_TTL_SECONDS = 30 * 24 * 60 * 60;

/** Emails are case-insensitive in practice; store and compare one way only. */
export const normalise = (email: string) => email.trim().toLowerCase();

/**
 * Mark an email as pre-approved — set by the Stripe webhook (stripe.ts) the
 * moment payment clears, ahead of any sign-in. A separate key, not a `USERS`
 * record: nothing is known about this person yet except that they paid.
 */
export async function preapprove(env: UserEnv, email: string, now: number): Promise<void> {
  if (!env.USERS) return;
  await env.USERS.put(PREAPPROVE_KEY(email), String(now), { expirationTtl: PREAPPROVE_TTL_SECONDS });
}

/** Whether a pre-approval marker exists, without consuming it. */
async function hasPreapproval(env: UserEnv, email: string): Promise<boolean> {
  if (!env.USERS) return false;
  return (await env.USERS.get(PREAPPROVE_KEY(email))) !== null;
}

/**
 * Clear a pre-approval marker. Only called from recordSignIn AFTER the
 * approved user record has already been durably written — so if this
 * delete itself fails, or a concurrent sign-in raced this one, the marker
 * simply survives for a harmless re-consume next time (writing "approved"
 * again is a no-op). The alternative order — delete first, write second —
 * can lose a paying customer's only approval marker if the write fails in
 * between, stranding them `pending` with no way back in but the owner's
 * manual approval. This module has no compare-and-swap primitive to make
 * the whole thing atomic (KV has none; that would need a Durable Object),
 * so this ordering is the cheap way to make the failure mode "consumed
 * twice, harmlessly" rather than "consumed and lost".
 */
async function clearPreapproval(env: UserEnv, email: string): Promise<void> {
  if (!env.USERS) return;
  await env.USERS.delete(PREAPPROVE_KEY(email));
}

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
 * A non-owner who already paid (a `preapproved:` marker from the Stripe
 * webhook, consumed here) is approved the same way, on sight. Everyone else
 * starts `pending` and sees nothing until told otherwise.
 *
 * Returns the record, whether this was the first time, and whether
 * preapproval is what did it — together they decide which email (if any)
 * the owner gets.
 */
export async function recordSignIn(
  env: UserEnv, email: string, name: string, now: number,
): Promise<{ user: User; isNew: boolean; wasPreapproved: boolean }> {
  const existing = await getUser(env, email);
  const owner = isOwner(env, email);

  if (existing) {
    // A visitor who signed in BEFORE paying is stuck `pending` unless this
    // checks again here: preapproval is only ever consumed once, and the
    // webhook has no way to know an account already exists. Only a `pending`
    // record is eligible — never re-check for `blocked` (a deliberate no
    // from the owner must not be silently overridden by a later payment).
    const wasPreapproved = !owner && existing.status === "pending" &&
      (await hasPreapproval(env, email));
    const user: User = {
      ...existing,
      name: name || existing.name,
      lastSeen: now,
      // A promotion to owner is honoured on sight; a demotion is not silently
      // applied, because losing OWNER_EMAIL should not lock you out of /admin.
      owner: existing.owner || owner,
      status: owner || wasPreapproved ? "approved" : existing.status,
      decidedAt: owner || wasPreapproved ? now : existing.decidedAt,
    };
    await put(env, user);
    if (wasPreapproved) await clearPreapproval(env, email);
    return { user, isNew: false, wasPreapproved };
  }

  const wasPreapproved = !owner && (await hasPreapproval(env, email));
  const user: User = {
    email: normalise(email),
    name: name || normalise(email),
    status: owner || wasPreapproved ? "approved" : "pending",
    firstSeen: now,
    lastSeen: now,
    owner: owner || undefined,
    decidedAt: owner || wasPreapproved ? now : undefined,
  };
  await put(env, user);
  if (wasPreapproved) await clearPreapproval(env, email);
  return { user, isNew: true, wasPreapproved };
}

/**
 * Store what somebody said when they applied.
 *
 * Goes through recordSignIn first rather than writing a record directly, so
 * that one function stays the only place that decides a new arrival's
 * starting status. That matters most for the two people who do not wait: the
 * owner, and somebody the Stripe webhook already pre-approved. Both are
 * approved on sight there, and both still answer the questions here.
 *
 * It also means a code holder — who has no record at all until this moment,
 * because a code is stateless — gets one built by the same rules as everyone
 * else, from the address they just typed.
 */
export async function recordApplication(
  env: UserEnv, email: string, name: string, application: Application, now: number,
): Promise<{ user: User; isNew: boolean; wasPreapproved: boolean } | null> {
  if (!env.USERS) return null;
  const { user, isNew, wasPreapproved } = await recordSignIn(env, email, name, now);
  const next: User = { ...user, application };
  await put(env, next);
  return { user: next, isNew, wasPreapproved };
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
