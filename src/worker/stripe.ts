import { sameDigest } from "./crypto";
import { preApprove, setStatus, normalise, type UserEnv } from "./users";

/* ------------------------------------------------------------------ *
 * STRIPE — the paid side of the same door the scholarship uses.
 *
 * The marketing page already sends people to a Stripe Payment Link,
 * which is Stripe's own hosted checkout and already collects an email —
 * there is nothing to build there. What used to happen after payment was
 * manual: Stripe emails the owner, the owner remembers to open /admin and
 * approve whoever just paid. This file closes that gap the same way the
 * scholarship grant does — `preApprove` pre-provisions the USERS record,
 * so the first Google sign-in with the paying email just works.
 *
 * SCAFFOLDED, NOT YET LIVE: without `STRIPE_WEBHOOK_SECRET` this fails
 * closed at 503, the same posture as every other "not configured" path in
 * this Worker. Wiring a real deployment needs two things this repo cannot
 * supply on its own:
 *   1. `npx wrangler secret put STRIPE_WEBHOOK_SECRET` — from the Stripe
 *      dashboard, once a webhook endpoint pointing at
 *      `<origin>/api/stripe/webhook` is created for these events:
 *      `checkout.session.completed`, `customer.subscription.deleted`.
 *   2. Nothing else — this Worker never calls the Stripe API and holds no
 *      secret key, only the webhook's signing secret. It reacts to events,
 *      it does not create charges or sessions.
 *
 * No SDK: `stripe`'s Node client assumes Node's `http`, and the whole
 * verification is nine lines of Web Crypto anyone can audit. Same posture
 * as crypto.ts choosing raw HMAC over a JWT library.
 * ------------------------------------------------------------------ */

export interface StripeEnv extends UserEnv {
  /** The webhook endpoint's signing secret (starts `whsec_`). Omit to disable. */
  STRIPE_WEBHOOK_SECRET?: string;
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

/** Stripe replays a webhook for a few minutes on transient failures; wider than that is not a retry. */
const TOLERANCE_SECONDS = 5 * 60;

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** `t=169..,v1=abc..[,v1=def..]` — Stripe sends more than one v1 while rotating a signing secret. */
function parseSignatureHeader(header: string): { t?: string; v1: string[] } {
  let t: string | undefined;
  const v1: string[] = [];
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === "t") t = v;
    else if (k === "v1" && v) v1.push(v);
  }
  return { t, v1 };
}

/**
 * Verify a `Stripe-Signature` header against the RAW request body — Stripe
 * signs the exact bytes it sent, so this must run before any JSON.parse.
 * Exported for its own tests; `handleStripeWebhook` is the only real caller.
 */
export async function verifyStripeSignature(
  rawBody: string, header: string | null, secret: string, now: number,
): Promise<boolean> {
  if (!header) return false;
  const { t, v1 } = parseSignatureHeader(header);
  if (!t || v1.length === 0) return false;

  const seconds = Number(t);
  if (!Number.isFinite(seconds) || Math.abs(now / 1000 - seconds) > TOLERANCE_SECONDS) return false;

  const expected = await hmacHex(secret, `${t}.${rawBody}`);
  return v1.some((candidate) => candidate.length === expected.length && sameDigest(candidate, expected));
}

/** Where a checkout session's email actually lives — `customer_details.email` first, `customer_email` as the fallback older API versions use. */
function emailFrom(obj: Record<string, unknown>): string | undefined {
  const details = obj.customer_details;
  if (details && typeof details === "object") {
    const email = (details as Record<string, unknown>).email;
    if (typeof email === "string" && email) return email;
  }
  return typeof obj.customer_email === "string" && obj.customer_email ? obj.customer_email : undefined;
}

const nameFrom = (obj: Record<string, unknown>, fallback: string): string => {
  const details = obj.customer_details;
  if (details && typeof details === "object") {
    const name = (details as Record<string, unknown>).name;
    if (typeof name === "string" && name) return name;
  }
  return fallback;
};

/* A Stripe customer id names a person more reliably than an email alone —
   the same person's card can be attached to a changed email later — but a
   subscription-cancelled event carries only the id. This is the join. */
const CUSTOMER_KEY = (id: string) => `stripeCustomer:${id}`;

async function rememberCustomer(env: UserEnv, customerId: string, email: string): Promise<void> {
  if (env.USERS) await env.USERS.put(CUSTOMER_KEY(customerId), normalise(email));
}

async function emailForCustomer(env: UserEnv, customerId: string): Promise<string | undefined> {
  if (!env.USERS) return undefined;
  return (await env.USERS.get(CUSTOMER_KEY(customerId))) ?? undefined;
}

interface StripeEventBody { type?: unknown; data?: { object?: Record<string, unknown> } }

/**
 * `/api/stripe/webhook`. Public and pre-wall by necessity — Stripe is
 * calling this, not a signed-in browser — but every event is verified
 * against the signing secret before anything in it is trusted.
 */
export async function handleStripeWebhook(request: Request, env: StripeEnv, now: number): Promise<Response> {
  if (!env.STRIPE_WEBHOOK_SECRET || !env.USERS) {
    return json({ error: "Stripe is not configured on this deployment." }, 503);
  }

  const raw = await request.text();
  const verified = await verifyStripeSignature(
    raw, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET, now,
  );
  if (!verified) return json({ error: "Invalid signature." }, 400);

  let event: StripeEventBody;
  try {
    event = JSON.parse(raw) as StripeEventBody;
  } catch {
    return json({ error: "Malformed payload." }, 400);
  }

  const type = typeof event.type === "string" ? event.type : "";
  const obj = event.data?.object ?? {};

  if (type === "checkout.session.completed") {
    const email = emailFrom(obj);
    if (email) {
      const user = await preApprove(env, email, nameFrom(obj, email), now);
      const customerId = typeof obj.customer === "string" ? obj.customer : undefined;
      if (customerId) await rememberCustomer(env, customerId, user.email);
    }
  } else if (type === "customer.subscription.deleted") {
    const customerId = typeof obj.customer === "string" ? obj.customer : undefined;
    const email = customerId ? await emailForCustomer(env, customerId) : undefined;
    if (email) await setStatus(env, email, "blocked", now);
  }
  // Every other event type is acknowledged and ignored — Stripe stops
  // retrying once it gets a 2xx, regardless of whether we acted on it.

  return json({ received: true }, 200);
}
