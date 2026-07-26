# Octant access wall — setup state

**Status: live, enforcing, sign-in verified end to end. The notification
sender is configurable in code; one secret completes it.**

Last updated 26 Jul 2026. This file replaces the original task-list runbook —
its tasks are done, and following it verbatim creates a second KV namespace
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

**Secrets on the Worker** — none of them in this repo:

`ACCESS_CODES` · `AUTH_SECRET` · `GEMINI_API_KEY` · `GOOGLE_CLIENT_ID` ·
`GOOGLE_CLIENT_SECRET` · `OWNER_EMAIL` · `RESEND_API_KEY`

**One more to set** once this branch deploys: `NOTIFY_FROM` =
`Octant <octant@insuranceprosct.com>` — see the notification section below.

**Registered redirect URIs** on `Octant Worker`:

```
https://typology.stratfield-partners.workers.dev/api/auth/google/callback
http://localhost:8788/api/auth/google/callback
```

---

## Verified working

Checked against the live deployment on 26 Jul:

- **The wall holds.** Signed out, app routes return **401** with
  `server: cloudflare`, and no app markup or bundle is served.
- **OAuth round trip works.** No `redirect_uri_mismatch` after the fix below.
- **Owner auto-approval works.** `nick@stratfieldpartners.com` signed in and
  was written to KV as `status: approved`, `owner: true`, in one step — no
  waiting page, as designed.
- **Non-owner gating works.** `ngk325@gmail.com` signed in, was written
  `status: pending`, and gets the "Waiting for approval" page with **403** on
  both `/` and `/admin`.

Current KV contents:

```
user:nick@stratfieldpartners.com  → approved, owner: true
user:ngk325@gmail.com             → pending
```

> **You cannot verify any of this from a cloud sandbox.** Cowork containers
> sit behind an egress allowlist that returns a bare `HTTP/1.1 403` for any
> host outside it — `workers.dev` included. That 403 is the proxy, not the
> Worker; a real response carries a `cf-ray` header. Test from a browser.

---

## The notification email

No approval email had ever reached the owner. Three causes; all now addressed
in code, one secret still to set.

1. **`waitUntil` on the wrong object** — fixed in `fdfcf38`. It was read off
   the Request instead of the ExecutionContext, so every send was cancelled as
   the redirect went out.
2. **The sender address.** `notify.ts` used to hardcode
   `onboarding@resend.dev`, which Resend delivers to exactly one recipient:
   the address the Resend account is registered under (`nick@neins.co`,
   workspace NEINS). Every send to `OWNER_EMAIL` returned 403 — silently.
   The sender is now the **`NOTIFY_FROM`** env var (with `NOTIFY_EMAIL` as an
   optional recipient override, defaulting to `OWNER_EMAIL`). They are
   deliberately separate from `OWNER_EMAIL`: that one decides who owns
   `/admin`, which is an authorisation question; where the mail lands is not.
3. **Silent failure.** Non-2xx from Resend is now logged via `console.error`
   (observability is enabled on this Worker) instead of vanishing into
   `{ sent: false }`.

**To finish:** set the Cloudflare secret `NOTIFY_FROM` to
`Octant <octant@insuranceprosct.com>` — the one verified domain on the Resend
account; a direct send from it to `nick@stratfieldpartners.com` was tested on
26 Jul and came back **delivered**. Leave `OWNER_EMAIL` alone.

Why that seemingly-unrelated domain: Resend free tier. `onboarding@resend.dev`
only delivers to the Resend signup address, which is not `OWNER_EMAIL`, and
`insuranceprosct.com` is the account's one verified domain.

### The trap that will make you think it is still broken

**The notification only fires on a user's FIRST sign-in** — the call is
guarded by `if (isNew && !user.owner)`. `ngk325@gmail.com` is already in KV,
so signing in with it again will never produce an email, no matter how correct
the config is. Delete `user:ngk325@gmail.com` from the `USERS` namespace to
re-arm the test.

---

## Fixed during setup

**The production redirect URI was missing.** The `Octant Worker` client listed
only `http://localhost:8788/api/auth/google/callback` plus one invalid entry.
Every production sign-in would have failed with `redirect_uri_mismatch`.

**Chrome autofill corrupts the Google console URI fields.** It types a saved
username into the first empty URI field on the OAuth client pages, on every
load — that is where the invalid entry came from, and it recurs on both
clients in this project. **Read every field before you press Save.**

---

## Traps

**The `assets` block in `wrangler.jsonc` is the access wall.** Do not touch
`run_worker_first`, `not_found_handling`, or anything else inside it. With a
route list there instead of `true`, static assets are served without invoking
the Worker at all, and the site is public while reporting itself private.

**KV bindings belong in `wrangler.jsonc`, not the dashboard.** Workers Builds
deploys from that file, which makes it authoritative — a dashboard-only
binding vanishes on the next push. The namespace id is an identifier, not a
credential; committing it is correct.

**Do not run `wrangler kv namespace create USERS`.** It does not check for an
existing namespace — it creates a second, empty one, and pointing the Worker
at it silently discards the user list.

**KV is eventually consistent.** Approve and Block can take up to a minute.

**Consent screen is in Testing.** External, one listed test user — yet
`ngk325@gmail.com` completed sign-in without being on that list. Do not treat
Testing mode as an access control. The app's own wall is what stops people.

---

## The older Supabase OAuth client — resolved, no action needed

The project holds a second client, `stratfield-partners` (Apr 2025), whose
only redirect URI is `https://sdvfjzkkosqevgbyafhu.supabase.co/auth/v1/callback`.
Renaming the shared consent screen to "Octant" changed what that app's users
would see — but its lifetime OAuth counter reads *1 user (1 test, 0 other)*,
so there was no audience to confuse. Left unchanged.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| No approval email | `NOTIFY_FROM` unset / unverified sender, or the user is not new | Set `NOTIFY_FROM` to an address on a Resend-verified domain; delete their `user:` key to re-arm |
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
npm test          # all passing
npm run build     # tsc -b && vite build
cp .dev.vars.example .dev.vars   # local dev fails closed without this
```
