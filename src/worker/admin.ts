import { unseal } from "./crypto";
import { decisionPage } from "./decision";
import { escapeHtml } from "./html";
import { getUser, listUsers, setStatus, type UserEnv, type UserStatus } from "./users";
import type { ActionPayload } from "./notify";

/* ------------------------------------------------------------------ *
 * ADMIN — approving, denying and disabling people.
 *
 * Two ways in, deliberately:
 *
 *   1. The signed links in the notification email. No sign-in, two taps,
 *     works from a phone at a bus stop. Safe because the link is an
 *     HMAC over {email, action} that expires — it authorises exactly
 *     one decision about exactly one person, and nothing else.
 *   2. /api/admin/users, which requires an owner session. This is the
 *     surface behind the /admin page, and it can do anything.
 *
 * The signed link deliberately cannot list users or act on somebody it
 * does not name. If one leaks, the worst case is that a stranger
 * approves or denies the one person that link was already about.
 *
 * TWO taps, not one, and that is the point. Opening the link is a GET,
 * and a GET must not change anything: mail clients, link-safety scanners
 * and chat previews fetch every URL in a message before a human sees it.
 * A one-tap approve would be decided by whichever scanner touched the
 * inbox first. So the GET only shows who it is asking about, and the
 * decision is a POST from the form on that page.
 * ------------------------------------------------------------------ */

export interface AdminEnv extends UserEnv {
  AUTH_SECRET?: string;
}

/** Who is asking, as established by the session layer. */
export interface Caller { email?: string; owner: boolean }

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const VALID: UserStatus[] = ["pending", "approved", "blocked"];

/**
 * `/api/admin/*`. Returns null when the path is not ours.
 *
 * `caller` is resolved by the session layer before this is called, so this
 * module never has to know how sessions work — only whether the person
 * holding one is the owner.
 */
export async function handleAdmin(
  request: Request, env: AdminEnv, caller: Caller, now: number,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/admin/")) return null;

  /* ---- the signed links from the email ---- */
  if (url.pathname === "/api/admin/act") {
    if (!env.AUTH_SECRET) return page("Not configured", "This deployment has no signing secret.", false);

    /* The token travels in the query string on the way in (it is a link in an
       email) and in the form body on the way back. Same token either way — the
       signature is what authorises, not where it was carried. */
    const token = request.method === "POST"
      ? (await request.formData().catch(() => null))?.get("t")?.toString() ?? ""
      : url.searchParams.get("t") ?? "";

    const payload = await unseal<ActionPayload>(token, env.AUTH_SECRET, now);
    if (!payload?.email || (payload.action !== "approve" && payload.action !== "block")) {
      return page(
        "That link is no longer valid",
        "It has expired, or it was altered in transit. Open /admin and decide there instead.",
        false,
      );
    }

    const subject = await getUser(env, payload.email);
    if (!subject) return page("Nobody by that name", "That person is not on the list any more.", false);

    /* GET: show, do not decide. See the note at the top of this file. */
    if (request.method !== "POST") {
      return page(
        payload.action === "approve" ? "Let them in?" : "Block them?",
        payload.action === "approve"
          ? `${subject.name} <${subject.email}> is waiting. Approving lets them straight in on their next visit.`
          : `${subject.name} <${subject.email}> will be blocked and will not get in.`,
        false,
        confirmForm(token, payload.action),
        200,
      );
    }

    const user = await setStatus(env, payload.email, payload.action === "approve" ? "approved" : "blocked", now);
    if (!user) return page("Nobody by that name", "That person is not on the list any more.", false);

    return payload.action === "approve"
      ? page("Approved", `${user.name} can now sign in. They will get straight in on their next visit.`, true)
      : page("Denied", `${user.name} has been blocked and will not get in.`, true);
  }

  /* ---- everything else needs an owner session ---- */
  if (!caller.owner) return json({ error: "Not permitted." }, 403);

  if (url.pathname === "/api/admin/users") {
    if (request.method === "GET") {
      return json({ users: await listUsers(env), owner: caller.email ?? null }, 200);
    }

    if (request.method === "POST") {
      let body: { email?: unknown; status?: unknown };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return json({ error: "Body must be JSON." }, 400);
      }
      const email = typeof body.email === "string" ? body.email : "";
      const status = body.status as UserStatus;
      if (!email || !VALID.includes(status)) return json({ error: "Need an email and a valid status." }, 400);

      const before = await getUser(env, email);
      if (!before) return json({ error: "No such person." }, 404);
      if (before.owner && status === "blocked") {
        return json({ error: "The owner account cannot be blocked." }, 409);
      }

      return json({ user: await setStatus(env, email, status, now) }, 200);
    }

    return json({ error: "Use GET or POST." }, 405);
  }

  return json({ error: "Not found." }, 404);
}

/* The button that actually decides. A POST, so no scanner can trip it, and
   the token rides along in the body. */
const confirmForm = (token: string, action: "approve" | "block") => `
<form method="POST" action="/api/admin/act" style="margin-top:24px">
  <input type="hidden" name="t" value="${escapeHtml(token)}">
  <button type="submit" class="${action === "approve" ? "yes" : "no"}">
    ${action === "approve" ? "Approve" : "Block"}
  </button>
</form>`;

/** The shared one-tap decision page (decision.ts), with this file's footer link. */
const page = (title: string, body: string, ok: boolean, extra = "", status = ok ? 200 : 400) =>
  decisionPage(title, body, ok, { extra, status });
