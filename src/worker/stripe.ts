import { sameDigest } from "./crypto";
import { markLeadConverted, type LeadsEnv } from "./leads";
import { preapprove, type UserEnv } from "./users";

/* ------------------------------------------------------------------ *
 * PAYMENT -> AUTOMATIC ACCESS
 *
 * The static Stripe Payment Link (marketing.ts) already fires the same
 * `checkout.session.completed` webhook a full Checkout Session integration
 * would — no need to move off it. This route only ever marks an email
 * preapproved; the owner still hears about it, but only once the person
 * actually signs in and there is a name/account to report on (see
 * index.ts's Google-callback branch, which picks notifyOwnerOfApprovedSignup
 * over notifyOwnerOfSignup when the marker this sets is what let them in).
 *
 * No Stripe SDK, no Stripe API key, no outbound call to Stripe at all —
 * signature verification is a local HMAC-SHA256 computation.
 * ------------------------------------------------------------------ */

export interface StripeEnv extends UserEnv, LeadsEnv {
  STRIPE_WEBHOOK_SECRET?: string;
}

const enc = new TextEncoder();

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify Stripe's `Stripe-Signature` header by hand, per Stripe's own
 * documented manual-verification steps: split on `,` then `=` to get `t`
 * (timestamp) and `v1` (signature), HMAC-SHA256 the string `${t}.${rawBody}`
 * with the endpoint's signing secret, compare in constant time, and reject
 * anything outside a clock-skew tolerance (5 minutes, matching Stripe's own
 * library default).
 */
export async function verifyStripeSignature(
  rawBody: string, header: string, secret: string, now: number, toleranceSeconds = 300,
): Promise<boolean> {
  const parts: Record<string, string> = {};
  for (const kv of header.split(",")) {
    const eq = kv.indexOf("=");
    if (eq < 0) continue;
    parts[kv.slice(0, eq).trim()] = kv.slice(eq + 1).trim();
  }
  const t = Number(parts.t);
  const v1 = parts.v1;
  if (!t || !v1) return false;
  if (Math.abs(now / 1000 - t) > toleranceSeconds) return false;
  const expected = await hmacSha256Hex(`${t}.${rawBody}`, secret);
  return v1.length === expected.length && sameDigest(v1, expected);
}

interface CheckoutSessionCompleted {
  type: string;
  data?: { object?: { customer_details?: { email?: string | null } | null } };
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/**
 * `POST /api/stripe/webhook` — public by necessity (a webhook carries no
 * session); the real gate is signature verification, not auth. Returns null
 * for any other path/method so it can sit in index.ts's public dispatch
 * block unconditionally, same contract as handleRead/handleOnramp.
 */
export async function handleStripeWebhook(
  request: Request, env: StripeEnv, now: number,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/stripe/webhook") return null;
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return json({ error: "Stripe webhook is not configured." }, 503);
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return json({ error: "Missing signature." }, 400);

  const rawBody = await request.text();
  if (!(await verifyStripeSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET, now))) {
    return json({ error: "Invalid signature." }, 400);
  }

  let event: CheckoutSessionCompleted;
  try {
    event = JSON.parse(rawBody) as CheckoutSessionCompleted;
  } catch {
    return json({ error: "Malformed body." }, 400);
  }

  // Ack and ignore anything but a completed checkout — the endpoint must not
  // error on event types it doesn't care about, in case the Stripe dashboard
  // is ever configured to send "all events."
  if (event.type !== "checkout.session.completed") return json({ received: true }, 200);

  const email = event.data?.object?.customer_details?.email;
  if (!email) {
    console.error("stripe: checkout.session.completed with no customer email");
    return json({ received: true }, 200);
  }

  try {
    await preapprove(env, email, now);
    await markLeadConverted(env, email, now);
  } catch (err) {
    console.error("stripe: webhook processing failed", String(err));
  }

  return json({ received: true }, 200);
}
