import { seal } from "./crypto";
import { escapeHtml } from "./html";
import { sendMail, type MailEnv } from "./mail";
import type { Application, User } from "./users";

/* ------------------------------------------------------------------ *
 * "SOMEBODY IS ASKING" — the email to the owner.
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
 * This fires when somebody APPLIES (apply.ts), not when they sign in.
 * The old sign-in alert carried a Google display name and an address and
 * nothing else, which is not enough to decide anything — and said nothing
 * further when they went on to explain themselves. One email, at the
 * moment there is something to read.
 *
 * Everything here is best-effort. A failed send must never break an
 * application: the person still lands on the waiting page, the record is
 * still written, and /admin still shows them. Losing the notification
 * is an inconvenience; losing the application would be a bug.
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
 * Somebody applied. This REPLACES the old sign-in alert as the moment the
 * owner hears about a new person, and the move is the point: an email at
 * sign-in carried a display name and an address, which is not enough to
 * decide anything, and there was no second email when they said more.
 *
 * A visitor who signs in and never finishes the form is therefore silent
 * here — they did not ask for anything. /admin still lists them, so nobody
 * is lost; they are simply not an interruption.
 *
 * Two shapes, same email. Somebody the Stripe webhook already approved gets
 * the FYI version — only a revoke link, because approving an open account is
 * meaningless — while everyone else gets the decision.
 */
export async function notifyOwnerOfApplication(
  env: NotifyEnv, origin: string, user: User,
  ack: { sent: boolean; reason?: string }, now: number,
): Promise<{ sent: boolean; reason?: string }> {
  /* Read off the record, NOT off "was this sign-in a preapproval". By the
     time somebody finishes the form, the payment that opened their account
     happened on an earlier request and its marker is long consumed — asking
     the sign-in would report false and mail the owner an Approve button for
     an account that is already open. */
  const alreadyIn = user.status === "approved" && !user.owner;
  if (!env.RESEND_API_KEY) return { sent: false, reason: "no RESEND_API_KEY" };
  const to = env.NOTIFY_EMAIL || env.OWNER_EMAIL;
  if (!to) return { sent: false, reason: "no OWNER_EMAIL" };
  if (!env.AUTH_SECRET) return { sent: false, reason: "no AUTH_SECRET" };

  const approve = alreadyIn
    ? null
    : await actionLink(origin, user.email, "approve", env.AUTH_SECRET, now);
  const block = await actionLink(origin, user.email, "block", env.AUTH_SECRET, now);
  const ackLine = ack.sent
    ? "They have been told it landed."
    : `They could NOT be acknowledged (${ack.reason ?? "unknown"}) — as far as they know, nothing happened.`;

  return sendMail(env, {
    to: [to],
    subject: alreadyIn
      ? `Octant — ${user.name} paid, and told us why`
      : `Octant — ${user.name} is asking for access`,
    html: applicationEmail(user, approve, block, ackLine, alreadyIn, origin),
    text:
      `${user.name} <${user.email}> ${alreadyIn
        ? "paid, so their account is already open. Here is what they said."
        : "asked for access. They see nothing until you decide."}\n\n` +
      answerLines(user.application) +
      (approve ? `\nApprove: ${approve}\nDeny:    ${block}\n` : `\nRevoke: ${block}\n`) +
      `\n${ackLine}\n\nOr manage everyone at ${origin}/admin\n`,
  }, "notify");
}

/** The answers as plain text, in the order they were asked. */
const answerLines = (a: Application | undefined) =>
  a
    ? `What brought them: ${a.purpose}\n` +
      `Who it is for:     ${a.context}\n` +
      `Familiarity:       ${a.familiarity}\n` +
      `Hoping it does:    ${a.hoping}\n` +
      (a.found ? `Found us via:      ${a.found}\n` : "")
    : "They answered nothing — this record predates the application form.\n";

/** The same answers as escaped table rows. Every value here was typed by the applicant. */
const answerRows = (a: Application | undefined) =>
  a
    ? ([
        ["What brought them", a.purpose],
        ["Who it is for", a.context],
        ["Familiarity", a.familiarity],
        ["Hoping it does", a.hoping],
        ["Found us via", a.found],
      ] as [string, string][])
        .filter(([, value]) => value)
        .map(([label, value]) => `
          <tr>
            <td style="padding:6px 16px 6px 0;color:#6B6459;font-size:14px;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>
            <td style="padding:6px 0;vertical-align:top;white-space:pre-wrap">${escapeHtml(value)}</td>
          </tr>`).join("")
    : "";






const applicationEmail = (
  user: User, approve: string | null, block: string, ackLine: string,
  alreadyIn: boolean, origin: string,
) => `
<div style="font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#241F19;max-width:560px">
  <p style="font:600 20px/1.3 Georgia,serif;margin:0 0 4px">${
    alreadyIn ? "Paid, in already — and here is why they came" : "Somebody is asking for access"
  }</p>
  <p style="color:#4C463D;margin:0 0 20px">${
    alreadyIn
      ? "Payment cleared, so their account is open. Nothing to approve — but now you know what they are here for."
      : "They can see nothing until you decide."
  }</p>

  <div style="border:1px solid #E3DED4;border-radius:8px;padding:16px;margin-bottom:24px">
    <div style="font-weight:600">${escapeHtml(user.name)}</div>
    <div style="color:#4C463D;font-size:15px;margin-bottom:12px">${escapeHtml(user.email)}</div>
    <table style="border-collapse:collapse;font-size:15px">${answerRows(user.application)}</table>
  </div>

  ${approve ? `<a href="${approve}" style="display:inline-block;background:#4C4899;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:500;margin-right:8px">Approve</a>` : ""}
  <a href="${block}" style="display:inline-block;background:#fff;color:#AA2A1E;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:500;border:1px solid #E3DED4">${
    approve ? "Deny" : "Revoke access"
  }</a>

  <p style="color:#4C463D;font-size:14px;margin-top:24px">${escapeHtml(ackLine)}</p>
  <p style="color:#4C463D;font-size:14px;margin-top:28px;padding-top:16px;border-top:1px solid #E3DED4">
    These links expire in seven days. You can also change anyone's access at any
    time from <a href="${origin}/admin" style="color:#4C4899">${origin}/admin</a>.
  </p>
</div>`;
