import { seal } from "./crypto";
import { escapeHtml } from "./html";
import { sendMail, type MailEnv } from "./mail";
import type { User } from "./users";

/* ------------------------------------------------------------------ *
 * "SOMEBODY IS WAITING" — the email to the owner.
 *
 * Resend, because it needs no domain: it will send from its own shared
 * address straight to one inbox, which is the entire requirement here.
 *
 * The two buttons are SIGNED LINKS, not admin URLs. That matters: it
 * means approving somebody takes one tap on a phone with no sign-in,
 * while still being unforgeable — the link carries an HMAC over
 * {email, action} and expires. Anyone who cannot compute that HMAC
 * cannot approve themselves, and the link is useless a week later.
 *
 * Everything here is best-effort. A failed send must never break a
 * sign-in: the person still lands on the waiting page, the record is
 * still written, and /admin still shows them. Losing the notification
 * is an inconvenience; losing the sign-in would be a bug.
 * ------------------------------------------------------------------ */

export interface NotifyEnv extends MailEnv {
  OWNER_EMAIL?: string;
  AUTH_SECRET?: string;
  /**
   * Recipient override. Defaults to OWNER_EMAIL — and stays a SEPARATE knob
   * on purpose: OWNER_EMAIL decides who owns /admin, which is an
   * authorisation question. Where the mail lands is not. Conflating them
   * would mean mail routing cannot be fixed without handing somebody the
   * admin page.
   */
  NOTIFY_EMAIL?: string;
}

/** Long enough to survive a holiday, short enough not to linger forever. */
const ACTION_TTL_SECONDS = 7 * 24 * 60 * 60;

export type AdminAction = "approve" | "block";
export interface ActionPayload { email: string; action: AdminAction }

/** A one-tap, expiring, unforgeable link for one decision about one person. */
export async function actionLink(
  origin: string, email: string, action: AdminAction, secret: string, now: number,
): Promise<string> {
  const token = await seal<ActionPayload>({ email, action }, secret, ACTION_TTL_SECONDS, now);
  return `${origin}/api/admin/act?t=${encodeURIComponent(token)}`;
}

/**
 * Tell the owner somebody is waiting.
 *
 * Returns whether it was sent, for logging and for the tests — never throws,
 * and never blocks the sign-in it is reporting on.
 */
export async function notifyOwnerOfSignup(
  env: NotifyEnv, origin: string, user: User, now: number,
): Promise<{ sent: boolean; reason?: string }> {
  if (!env.RESEND_API_KEY) return { sent: false, reason: "no RESEND_API_KEY" };
  const to = env.NOTIFY_EMAIL || env.OWNER_EMAIL;
  if (!to) return { sent: false, reason: "no OWNER_EMAIL" };
  if (!env.AUTH_SECRET) return { sent: false, reason: "no AUTH_SECRET" };

  const approve = await actionLink(origin, user.email, "approve", env.AUTH_SECRET, now);
  const block = await actionLink(origin, user.email, "block", env.AUTH_SECRET, now);

  /* Logged, not just returned. A silent { sent: false } cost a day of
     debugging when Resend was refusing the shared sender: the sign-in
     succeeded, the KV write succeeded, and nothing anywhere said why no
     mail arrived. Observability is enabled on this Worker; use it. */
  return sendMail(env, {
    to: [to],
    subject: `Octant — ${user.name} is waiting for access`,
    html: signupEmail(user, approve, block, origin),
    text:
      `${user.name} <${user.email}> signed in to Octant and is waiting for approval.\n\n` +
      `Approve: ${approve}\nDeny:    ${block}\n\n` +
      `Or manage everyone at ${origin}/admin\n`,
  }, "notify");
}

/**
 * Tell the owner a payment already approved someone — an FYI, not a decision
 * request. Only a block link is offered: approving an already-approved
 * account is meaningless, but the owner can still act fast on fraud.
 */
export async function notifyOwnerOfApprovedSignup(
  env: NotifyEnv, origin: string, user: User, now: number,
): Promise<{ sent: boolean; reason?: string }> {
  if (!env.RESEND_API_KEY) return { sent: false, reason: "no RESEND_API_KEY" };
  const to = env.NOTIFY_EMAIL || env.OWNER_EMAIL;
  if (!to) return { sent: false, reason: "no OWNER_EMAIL" };
  if (!env.AUTH_SECRET) return { sent: false, reason: "no AUTH_SECRET" };

  const block = await actionLink(origin, user.email, "block", env.AUTH_SECRET, now);

  return sendMail(env, {
    to: [to],
    subject: `Octant — ${user.name} paid and is in already`,
    html: approvedSignupEmail(user, block, origin),
    text:
      `${user.name} <${user.email}> paid and their account was switched on automatically.\n\n` +
      `Revoke: ${block}\n\n` +
      `Or manage everyone at ${origin}/admin\n`,
  }, "notify");
}

/* Inline styles only — every mail client strips <style>, and half of them
   would mangle anything cleverer. Plain table-free HTML survives best. */
const signupEmail = (user: User, approve: string, block: string, origin: string) => `
<div style="font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1A1714;max-width:520px">
  <p style="font:600 20px/1.3 Georgia,serif;margin:0 0 4px">Somebody is waiting for access</p>
  <p style="color:#4C463D;margin:0 0 20px">They can see nothing until you decide.</p>

  <div style="border:1px solid #E3DED4;border-radius:8px;padding:16px;margin-bottom:24px">
    <div style="font-weight:600">${escapeHtml(user.name)}</div>
    <div style="color:#4C463D;font-size:15px">${escapeHtml(user.email)}</div>
  </div>

  <a href="${approve}" style="display:inline-block;background:#6B3BC4;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:500;margin-right:8px">Approve</a>
  <a href="${block}" style="display:inline-block;background:#fff;color:#AA2A1E;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:500;border:1px solid #E3DED4">Deny</a>

  <p style="color:#4C463D;font-size:14px;margin-top:28px;padding-top:16px;border-top:1px solid #E3DED4">
    These links expire in seven days. You can also change anyone's access at any
    time from <a href="${origin}/admin" style="color:#6B3BC4">${origin}/admin</a>.
  </p>
</div>`;

const approvedSignupEmail = (user: User, block: string, origin: string) => `
<div style="font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1A1714;max-width:520px">
  <p style="font:600 20px/1.3 Georgia,serif;margin:0 0 4px">Paid, and already in</p>
  <p style="color:#4C463D;margin:0 0 20px">Payment cleared, so their account switched on automatically — nothing for you to approve.</p>

  <div style="border:1px solid #E3DED4;border-radius:8px;padding:16px;margin-bottom:24px">
    <div style="font-weight:600">${escapeHtml(user.name)}</div>
    <div style="color:#4C463D;font-size:15px">${escapeHtml(user.email)}</div>
  </div>

  <a href="${block}" style="display:inline-block;background:#fff;color:#AA2A1E;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:500;border:1px solid #E3DED4">Revoke access</a>

  <p style="color:#4C463D;font-size:14px;margin-top:28px;padding-top:16px;border-top:1px solid #E3DED4">
    This link expires in seven days. You can also change anyone's access at any
    time from <a href="${origin}/admin" style="color:#6B3BC4">${origin}/admin</a>.
  </p>
</div>`;
