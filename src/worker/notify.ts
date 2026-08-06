import { seal } from "./crypto";
import { escapeHtml } from "./html";
import type { User } from "./users";
import type { ScholarshipRequest } from "./scholarship";

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

export interface NotifyEnv {
  /** Omit to run without email. Everything else still works. */
  RESEND_API_KEY?: string;
  OWNER_EMAIL?: string;
  AUTH_SECRET?: string;
  /**
   * Sender, e.g. `Octant <octant@your-verified-domain.com>`. Defaults to
   * Resend's shared onboarding address — which Resend only delivers to the
   * address the Resend ACCOUNT is registered under. If OWNER_EMAIL is any
   * other inbox, every send 403s silently; set this to an address on a
   * domain verified in Resend.
   */
  NOTIFY_FROM?: string;
  /**
   * Recipient override. Defaults to OWNER_EMAIL — and stays a SEPARATE knob
   * on purpose: OWNER_EMAIL decides who owns /admin, which is an
   * authorisation question. Where the mail lands is not. Conflating them
   * would mean mail routing cannot be fixed without handing somebody the
   * admin page.
   */
  NOTIFY_EMAIL?: string;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";
/** Fallback sender. See NOTIFY_FROM above for why it usually is not enough. */
const DEFAULT_FROM = "Octant <onboarding@resend.dev>";
/** Long enough to survive a holiday, short enough not to linger forever. */
const ACTION_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * `approve`/`block` decide an existing Google sign-in (users.ts). The
 * `_scholarship` pair decide a request that may have no USER record yet —
 * admin.ts branches on this value to know which store to act on, so the
 * payload itself never has to carry a second "kind" field.
 */
export type AdminAction = "approve" | "block" | "approve_scholarship" | "deny_scholarship";
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

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.NOTIFY_FROM || DEFAULT_FROM,
        to: [to],
        subject: `Octant — ${user.name} is waiting for access`,
        html: signupEmail(user, approve, block, origin),
        text:
          `${user.name} <${user.email}> signed in to Octant and is waiting for approval.\n\n` +
          `Approve: ${approve}\nDeny:    ${block}\n\n` +
          `Or manage everyone at ${origin}/admin\n`,
      }),
    });
    if (!res.ok) {
      /* Logged, not just returned. A silent { sent: false } cost a day of
         debugging when Resend was refusing the shared sender: the sign-in
         succeeded, the KV write succeeded, and nothing anywhere said why no
         mail arrived. Observability is enabled on this Worker; use it. */
      console.error(`notify: resend ${res.status}`, await res.text().catch(() => ""));
      return { sent: false, reason: `resend ${res.status}` };
    }
    return { sent: true };
  } catch {
    console.error("notify: network failure reaching Resend");
    return { sent: false, reason: "network" };
  }
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

/* ------------------------------------------------------------------ *
 * "SOMEBODY IS ASKING" — the scholarship request.
 *
 * Same shape as the sign-up notice above, with one real difference: the
 * person named in it may never have touched this deployment before, so
 * approving does not flip an existing record — it creates one
 * (users.ts's `preApprove`), pre-granted for whenever they do sign in.
 * ------------------------------------------------------------------ */

/** Tell the owner an application is waiting. Best-effort, never throws. */
export async function notifyOwnerOfScholarship(
  env: NotifyEnv, origin: string, req: ScholarshipRequest, now: number,
): Promise<{ sent: boolean; reason?: string }> {
  if (!env.RESEND_API_KEY) return { sent: false, reason: "no RESEND_API_KEY" };
  const to = env.NOTIFY_EMAIL || env.OWNER_EMAIL;
  if (!to) return { sent: false, reason: "no OWNER_EMAIL" };
  if (!env.AUTH_SECRET) return { sent: false, reason: "no AUTH_SECRET" };

  const approve = await actionLink(origin, req.email, "approve_scholarship", env.AUTH_SECRET, now);
  const deny = await actionLink(origin, req.email, "deny_scholarship", env.AUTH_SECRET, now);

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: env.NOTIFY_FROM || DEFAULT_FROM,
        to: [to],
        subject: `Octant — scholarship request from ${req.name}`,
        html: scholarshipEmail(req, approve, deny, origin),
        text:
          `${req.name} <${req.email}> applied for a free scholarship.\n\n` +
          `Situation: ${req.country}\nWhy: ${req.reason}\n\n` +
          `Approve: ${approve}\nDeny:    ${deny}\n\n` +
          `Or manage requests at ${origin}/admin\n`,
      }),
    });
    if (!res.ok) {
      console.error(`notify: resend ${res.status}`, await res.text().catch(() => ""));
      return { sent: false, reason: `resend ${res.status}` };
    }
    return { sent: true };
  } catch {
    console.error("notify: network failure reaching Resend");
    return { sent: false, reason: "network" };
  }
}

const scholarshipEmail = (req: ScholarshipRequest, approve: string, deny: string, origin: string) => `
<div style="font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1A1714;max-width:520px">
  <p style="font:600 20px/1.3 Georgia,serif;margin:0 0 4px">A scholarship request is waiting</p>
  <p style="color:#4C463D;margin:0 0 20px">Free access, decided by you — nothing is granted automatically.</p>

  <div style="border:1px solid #E3DED4;border-radius:8px;padding:16px;margin-bottom:24px">
    <div style="font-weight:600">${escapeHtml(req.name)}</div>
    <div style="color:#4C463D;font-size:15px">${escapeHtml(req.email)}</div>
    <div style="margin-top:12px;color:#1A1714"><b>Situation:</b> ${escapeHtml(req.country)}</div>
    <div style="margin-top:6px;color:#1A1714"><b>Why:</b> ${escapeHtml(req.reason)}</div>
  </div>

  <a href="${approve}" style="display:inline-block;background:#6B3BC4;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:500;margin-right:8px">Approve</a>
  <a href="${deny}" style="display:inline-block;background:#fff;color:#AA2A1E;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:500;border:1px solid #E3DED4">Deny</a>

  <p style="color:#4C463D;font-size:14px;margin-top:28px;padding-top:16px;border-top:1px solid #E3DED4">
    These links expire in seven days. Approving lets them straight in the next time they sign in
    with Google using ${escapeHtml(req.email)}. You can also decide from
    <a href="${origin}/admin" style="color:#6B3BC4">${origin}/admin</a>.
  </p>
</div>`;

/** Tell the applicant what was decided. Best-effort, never throws. */
export async function notifyApplicantOfScholarshipDecision(
  env: NotifyEnv, origin: string, req: ScholarshipRequest, approved: boolean,
): Promise<{ sent: boolean; reason?: string }> {
  if (!env.RESEND_API_KEY) return { sent: false, reason: "no RESEND_API_KEY" };
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: env.NOTIFY_FROM || DEFAULT_FROM,
        to: [req.email],
        subject: approved ? "Octant — your scholarship was approved" : "Octant — about your scholarship request",
        html: scholarshipDecisionEmail(req, approved, origin),
        text: approved
          ? `Good news — your Octant scholarship was approved.\n\n` +
            `Sign in with Google using ${req.email} at ${origin}/signin and you're straight in.\n`
          : `Thanks for applying to Octant.\n\n` +
            `We can't offer a scholarship right now. You're welcome to apply again later, ` +
            `or see the paid plan at ${origin}/#pricing.\n`,
      }),
    });
    if (!res.ok) {
      console.error(`notify: resend ${res.status}`, await res.text().catch(() => ""));
      return { sent: false, reason: `resend ${res.status}` };
    }
    return { sent: true };
  } catch {
    console.error("notify: network failure reaching Resend");
    return { sent: false, reason: "network" };
  }
}

const scholarshipDecisionEmail = (req: ScholarshipRequest, approved: boolean, origin: string) => `
<div style="font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1A1714;max-width:520px">
  <p style="font:600 20px/1.3 Georgia,serif;margin:0 0 4px">
    ${approved ? "You're in" : "About your request"}
  </p>
  <p style="color:#4C463D;margin:0 0 20px">
    ${approved
      ? `Hi ${escapeHtml(req.name)} — your scholarship request was approved.`
      : `Hi ${escapeHtml(req.name)} — thank you for applying.`}
  </p>
  ${approved
    ? `<a href="${origin}/signin" style="display:inline-block;background:#6B3BC4;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:500">Sign in with Google</a>
       <p style="color:#4C463D;font-size:14px;margin-top:16px">Use ${escapeHtml(req.email)} — that's the address this was approved for.</p>`
    : `<p style="color:#4C463D">We can't offer a scholarship right now, but you're welcome to apply again later,
       or see <a href="${origin}/#pricing" style="color:#6B3BC4">the paid plan</a>.</p>`}
</div>`;
