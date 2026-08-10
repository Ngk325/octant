/* ------------------------------------------------------------------ *
 * SHARED RESEND SENDER
 *
 * `notify.ts` (owner signup alerts) and `chatlog.ts` (transcript mail)
 * each carried their own copy of "POST to Resend, never throw, log on
 * failure" — two places for the same call to drift. This is that call,
 * once, for those two and for lead-nurture mail (leads.ts) to share.
 * ------------------------------------------------------------------ */

export interface MailEnv {
  /** Omit to run without email. Everything else still works. */
  RESEND_API_KEY?: string;
  /** Sender, e.g. `Octant <octant@your-verified-domain.com>`. Falls back to Resend's shared address. */
  NOTIFY_FROM?: string;
}

export interface MailMessage {
  to: string[];
  subject: string;
  html: string;
  text: string;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";
/** Fallback sender — Resend only delivers this to the address the account is registered under. */
export const DEFAULT_FROM = "Octant <onboarding@resend.dev>";

export interface SendMailOptions {
  /**
   * Resend's shared `onboarding@resend.dev` sender only delivers to the
   * account's own registered address — it is not able to reach arbitrary
   * third parties, even though the API call itself still reports success.
   * Set this for mail to recipients who are not the account owner (e.g.
   * captured leads); it refuses to send rather than silently no-op through
   * a sender that cannot actually reach them.
   */
  requireVerifiedSender?: boolean;
}

/**
 * Send one email via Resend. Never throws — a failed send must never break
 * whatever it was reporting on. Returns whether it went out, for logging and
 * for tests.
 */
export async function sendMail(
  env: MailEnv, msg: MailMessage, logPrefix: string, opts: SendMailOptions = {},
): Promise<{ sent: boolean; reason?: string }> {
  if (!env.RESEND_API_KEY) return { sent: false, reason: "no RESEND_API_KEY" };
  if (opts.requireVerifiedSender && !env.NOTIFY_FROM) {
    console.error(`${logPrefix}: refusing to send — no NOTIFY_FROM, and Resend's shared sender cannot reach this recipient`);
    return { sent: false, reason: "no NOTIFY_FROM" };
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from: env.NOTIFY_FROM || DEFAULT_FROM, ...msg }),
    });
    if (!res.ok) {
      console.error(`${logPrefix}: resend ${res.status}`, await res.text().catch(() => ""));
      return { sent: false, reason: `resend ${res.status}` };
    }
    return { sent: true };
  } catch {
    console.error(`${logPrefix}: network failure reaching Resend`);
    return { sent: false, reason: "network" };
  }
}
