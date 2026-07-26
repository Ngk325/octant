# Octant access wall — setup state

**Status: live, enforcing, and fully configured. One open issue: the owner
notification email has never been delivered.**

Last updated 26 Jul 2026, against `fdfcf38`. This file replaces the original
task-list runbook, which told you to create a KV namespace and register a
redirect URI that now exist — following it verbatim creates a second namespace
and silently detaches the app from its user list.

---

## Current state

| Thing | Value |
|---|---|
| Worker | `typology` |
| Live URL | `https://typology.stratfield-partners.workers.dev` |
| Cloudflare account | Stratfield Partners (`b45df299…b5d6`) |
| Google Cloud project | `stratfield-partners` |
| OAuth client | `Octant Worker` |
| KV namespace | `USERS`, id `8d35bff308f84ce9b1e98b4770d21daf` |

**Secrets on the Worker** — all seven present, none in this repo:

`ACCESS_CODES` · `AUTH_SECRET` · `GEMINI_API_KEY` · `GOOGLE_CLIENT_ID` ·
`GOOGLE_CLIENT_SECRET` · `OWNER_EMAIL` · `RESEND_API_KEY`

**Registered redirect URIs** on `Octant Worker`:

```
https://typology.stratfield-partners.workers.dev/api/auth/google/callback
http://localhost:8788/api/auth/google/callback
```

---

## Verified working

Checked against the live deployment on 26 Jul:

- **The wall holds.** Signed out, `GET /` returns **401** with `server: cloudflare`,
  and "Continue with Google" appears exactly once.
- **OAuth round trip works.** No `redirect_uri_mismatch` after the fix below.
- **Owner auto-approval works.** `nick@stratfieldpartners.com` signed in at
  21:09:48 and was written to KV as `status: approved`, `owner: true`, in one
  step — no waiting page, as designed.
- **Non-owner gating works.** `ngk325@gmail.com` signed in at 21:11:00, was
  written `status: pending`, and gets the "Waiting for approval" page with
  **403** on both `/` and `/admin`.

Current KV contents:

```
user:nick@stratfieldpartners.com  → approved, owner: true
user:ngk325@gmail.com             → pending
```

> **You cannot verify any of this from a cloud sandbox.** The Cowork container
> sits behind an egress allowlist that returns a bare `HTTP/1.1 403` for any
> host outside it — `workers.dev` and `example.com` alike. That 403 is the
> proxy, not the Worker; a real response carries a `cf-ray` header. Test from a
> browser.

---

## Open issue — the notification email

`ngk325@gmail.com` went pending at 21:11:00 and no mail arrived. Resend's
application log showed **no inbound request at all** for that sign-in.

**First cause, fixed in `fdfcf38`.** `waitUntil` was read off the `Request`
rather than the `ExecutionContext`, which the `fetch` signature never declared.
The check was always false, so every send took the fire-and-forget path and the
runtime cancelled it as the redirect went out. That commit declares `Ctx`,
threads it through `handleGoogle`, and awaits when no context is present.

**Second cause, still open.** `src/worker/notify.ts` sends from Resend's shared
testing address:

```ts
const FROM = "Octant <onboarding@resend.dev>";
```

to `env.OWNER_EMAIL` — `nick@stratfieldpartners.com`. Resend restricts
`onboarding@resend.dev` to the address the Resend account is registered under.
That account is **`nick@neins.co`** (workspace NEINS), so this send should come
back **403**, and `notifyOwnerOfSignup` swallows non-2xx into a silent
`{ sent: false }`.

The original runbook's claim that this "needs no DNS" holds only when
`OWNER_EMAIL` equals the Resend signup address. It does not.

**Options**, best first:

1. Verify a domain you own for this app in Resend and send from it — e.g.
   `octant@stratfieldpartners.com`. Correct long term, needs DNS records.
2. Send from the already-verified `insuranceprosct.com`. Works today with zero
   setup, but it is a client's domain and will look wrong in the owner's inbox.
3. Point `OWNER_EMAIL` at `nick@neins.co`. Unblocks with no DNS, but
   `OWNER_EMAIL` also decides who owns `/admin` — do not change it for mail
   routing alone.

**To retest:** the mail only fires on a user's *first* sign-in (`if (isNew…)`).
`ngk325@gmail.com` is already in KV, so signing in again will not retrigger it.
Delete that key from the `USERS` namespace to re-arm.

**While diagnosing**, surface the reason instead of dropping it — `reason`
already carries `resend <status>`, and observability is enabled on this Worker:

```ts
const r = await notifyOwnerOfSignup(...);
if (!r.sent) console.error("notify failed:", r.reason);
```

---

## Fixed during setup

**The production redirect URI was missing.** The `Octant Worker` client listed
only `http://localhost:8788/api/auth/google/callback` plus one invalid entry.
Every production sign-in would have failed with `redirect_uri_mismatch`.

**Chrome autofill corrupts the Google console URI fields.** It types a saved
username into the first empty URI field on the OAuth client pages, on every
load — that is where the invalid entry came from, and it recurs on both clients
in this project. **Read every field before you press Save on those pages.**

---

## Traps

**The `assets` block in `wrangler.jsonc` is the access wall.** Do not touch
`run_worker_first`, `not_found_handling`, or anything else inside it. With
`run_worker_first: false` or a route list, static assets are served without
invoking the Worker at all, and the site is public while reporting itself
private. The comment in that file explains the invocation-cost trade-off; read
it before deciding the cost is worth optimising away.

**KV bindings belong in `wrangler.jsonc`, not the dashboard.** Workers Builds
deploys from that file, which makes it authoritative — a binding added only via
the dashboard survives until the next push, then vanishes. The namespace id is
an identifier, not a credential; committing it is correct.

**KV is eventually consistent.** Approve and Block can take up to a minute.

**Consent screen is in Testing.** External, one listed test user — yet
`ngk325@gmail.com` completed sign-in without being on that list. Do not treat
Testing mode as an access control. The app's own wall is what stops people.

---

## The older Supabase OAuth client — resolved, no action needed

The project holds a second client, `stratfield-partners` (Apr 2025), whose only
redirect URI is `https://sdvfjzkkosqevgbyafhu.supabase.co/auth/v1/callback`.

Renaming the shared consent screen to "Octant" changed what that app's users
would see. **It cost nothing.** The consent screen's lifetime OAuth counter
reads *1 user (1 test, 0 other)* — no non-test user has ever authorised it.
There was no audience to confuse. Left unchanged.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| No approval email | Sender restriction (see above) | Send from a domain you have verified in Resend |
| `redirect_uri_mismatch` | URI not byte-identical to a registered one | Compare against the list above. Check autofill did not overwrite the field |
| "Not configured" page | `AUTH_SECRET` missing, or no way in at all | Confirm `AUTH_SECRET` and `ACCESS_CODES` both exist |
| No Google button, code field only | `googleAvailable()` false | One of `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `USERS` is missing |
| Waiting page for the owner | Signed in with the wrong Google account | Use **Switch account**. Far more likely than an `OWNER_EMAIL` fault |
| `403` at `/admin` while signed in | Not the owner, or `OWNER_EMAIL` mismatch | Compare to `OWNER_EMAIL`; case-insensitive but otherwise exact |
| Approve/Block seems ignored | KV lag | Wait a minute, reload |
| Deploy fails on the KV binding | Wrong id, or another account's | Compare to the id above; it is in the namespace's dashboard URL |
| Bare `403`, no `cf-ray` | Calling from a sandboxed environment | Not the Worker. Test from a browser |

---

## Commands

```sh
npm test          # 540 tests, all passing
npm run build     # tsc -b && vite build
cp .dev.vars.example .dev.vars   # local dev fails closed without this
```
