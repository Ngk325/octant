# Runbook — finish the Octant Google sign-in setup

**For an agent with browser access and the repo checked out.** Everything in the
codebase is done, tested and deployed. What remains needs a logged-in browser
and one repo edit, which the cloud session cannot do.

Work through the tasks in order. Task 4 is already done — it is kept below
because it is the one step where doing it *again* would break something.

---

## Ground rules

1. **Never paste a secret into chat, a commit, an issue, or any file in the
   repo.** Copy from the source page, paste straight into the Cloudflare form,
   move on. If you need to confirm you have the right one, report its shape
   (`starts GOCSPX-`, `41 characters`), never its value.
2. **The one exception is the KV namespace id in Task 4.** That is an
   identifier, not a credential — useless without account access, and Cloudflare
   expects it committed. It is already in the repo on purpose.
3. If a step's UI does not match what is written here, Cloudflare or Google has
   moved it. Find the equivalent, and say so in your report rather than guessing
   at a different setting.
4. Do not change `run_worker_first`, `not_found_handling`, or anything under
   `assets` in `wrangler.jsonc`. That block is the access wall.

---

## The facts you need

| Thing | Value |
|---|---|
| Cloudflare Worker | `typology` |
| Live URL | `https://typology.stratfield-partners.workers.dev` |
| Google Cloud project | `stratfield-partners` |
| OAuth client | `Octant Worker` |
| `GOOGLE_CLIENT_ID` | `754718810816-oik5c621sgorqk71efp0rka7liagcf14.apps.googleusercontent.com` |
| `OWNER_EMAIL` | `nick@stratfieldpartners.com` |
| Repo | `Ngk325/typology`, branch `claude/personality-app-redesign-ax1rdi` (PR #3) |

---

## Task 1 · Google client secret → Cloudflare

1. Open <https://console.cloud.google.com/auth/clients?project=stratfield-partners>
2. Click the client named **Octant Worker**.
3. Copy the **Client secret** (starts `GOCSPX-`). If the panel only shows a
   masked value, use **Add secret** to mint a new one and copy that — old
   secrets keep working, so this is safe.
4. Go to the Cloudflare dashboard → **Workers & Pages** → **typology** →
   **Settings** → **Variables and Secrets** → **Add**.
   - Type: **Secret** (not Text)
   - Name: `GOOGLE_CLIENT_SECRET`
   - Value: the secret you just copied
   - **Save**

**While you are on that Google page, check one thing.** The project also
contains an older OAuth client authorised for `sdvfjzkkosqevgbyafhu.supabase.co`.
Renaming the consent screen to "Octant" changed what *that* app's users see at
sign-in too. Report whether that Supabase app looks live and user-facing. Do not
rename anything — it is the owner's call, and both options have a cost.

---

## Task 2 · Resend → Cloudflare

Skip this task entirely if the owner would rather not get emails. Everything
else works without it; they would just check `/admin` themselves.

1. Sign up at <https://resend.com>. Free tier, no card, no domain needed.
2. **API Keys** → **Create API Key**. Permission: **Sending access**.
3. Copy the key (starts `re_`) — it is shown once.
4. Cloudflare → **typology** → **Settings** → **Variables and Secrets** →
   **Add**, type **Secret**, name `RESEND_API_KEY`, paste, **Save**.

No domain verification is required. The app sends from Resend's shared
`onboarding@resend.dev` address to one inbox, which needs no DNS.

---

## Task 3 · The two remaining secrets

Same place, both as type **Secret**:

| Name | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | `754718810816-oik5c621sgorqk71efp0rka7liagcf14.apps.googleusercontent.com` |
| `OWNER_EMAIL` | `nick@stratfieldpartners.com` |

Then confirm these three are **already present** and leave them alone:
`ACCESS_CODES`, `AUTH_SECRET`, `GEMINI_API_KEY`. If any is missing, stop and
report it — the site will be serving a "Not configured" page.

---

## Task 4 · KV namespace — ✅ already done, do not repeat

**This task is complete.** The `USERS` namespace exists and its id is committed
in `wrangler.jsonc`:

```jsonc
  "kv_namespaces": [
    { "binding": "USERS", "id": "8d35bff308f84ce9b1e98b4770d21daf" }
  ],
```

**Do not run `wrangler kv namespace create USERS`.** That command does not check
whether one already exists — it makes a *second*, empty namespace with the same
name. Pointing the Worker at that one would silently discard the real user list:
everyone already approved would come back as a stranger, waiting for approval
again, with no error anywhere to say why.

All you need to do here is **confirm it is still there**:

```sh
cd <repo>
git checkout claude/personality-app-redesign-ax1rdi
git pull origin claude/personality-app-redesign-ax1rdi
grep -A2 kv_namespaces wrangler.jsonc
```

If the binding is present, this task is done — move on to Task 5. If it is
somehow missing, say so in your report rather than creating one; the id above is
the right value and belongs in `wrangler.jsonc`, never in the dashboard bindings
panel.

**Why the file and not the dashboard:** this Worker deploys from `wrangler.jsonc`
via Workers Builds, which makes that file authoritative. A binding added only in
the dashboard is removed the next time anything is pushed.

Tasks 1–3 set secrets, which apply without a deploy. If you want to force one
anyway, an empty commit is enough:

```sh
npm test          # expect 498 passed
npm run build     # expect no errors
git commit --allow-empty -m "Redeploy to pick up the new secrets"
git push origin claude/personality-app-redesign-ax1rdi
```

---

## Task 5 · Verify the deploy

Wait for the Cloudflare check on PR #3 to go green (about a minute), then:

```sh
curl -si https://typology.stratfield-partners.workers.dev/ | head -1
```

**Expected: `HTTP/2 401`.** That is correct — the wall is working and you are
not signed in. A `200` means the wall is bypassed; stop and report it.

```sh
curl -s https://typology.stratfield-partners.workers.dev/ | grep -c "Continue with Google"
```

**Expected: `1`.** A `0` means `googleAvailable()` is false — one of
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET` or the `USERS` binding
did not land. Check all four before doing anything else.

---

## Task 6 · Smoke test the real flow

In a browser:

1. Open <https://typology.stratfield-partners.workers.dev> in a **private
   window**. You should see the Octant access page with a **Continue with
   Google** button and an access-code field.
2. Click **Continue with Google** and sign in as
   `nick@stratfieldpartners.com`.
3. **Expected:** straight into the app — the owner is auto-approved by design,
   so this account never sees the waiting page.
4. Go to `/admin`. You should see yourself listed as **Has access**, tagged
   `you`, with no Block button (the owner cannot be blocked).

**To test the approval flow properly you need a second Google account**, because
the consent screen is in Testing mode and only lists one user:

1. Google Cloud → **APIs & Services** → **OAuth consent screen** → **Audience**
   → **Test users** → **Add users**. Add a second address you control.
2. In another private window, sign in with that account.
3. **Expected:** a "Waiting for approval" page and nothing else — no app shell,
   no navigation.
4. If `RESEND_API_KEY` is set, an email should arrive at
   `nick@stratfieldpartners.com` within a minute, with **Approve** and **Deny**
   buttons.
5. Click **Approve**. Then reload the second window — it should now show the app.
6. Back in `/admin` as the owner, click **Block** on that account. Reload the
   second window: it should return to a "No access" page.

If step 6 does not take effect immediately, wait up to a minute and reload.
The user list is in KV, which is eventually consistent — this is expected and
documented, not a bug.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `redirect_uri_mismatch` | The URI Google received is not byte-identical to a registered one | In the Google client, confirm `https://typology.stratfield-partners.workers.dev/api/auth/google/callback` exactly — no trailing slash, `https` not `http` |
| "Not configured" page | `AUTH_SECRET` missing, or no way in configured at all | Check `AUTH_SECRET` and `ACCESS_CODES` both exist as secrets |
| No Google button, code field only | `googleAvailable()` false | One of `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `USERS` is missing |
| "Google sign-in is not configured" JSON | Same, but you hit `/api/auth/google/start` directly | As above |
| `403` "This page is for the owner" at `/admin` | Signed in as a non-owner, or `OWNER_EMAIL` does not match the signed-in address | Check `OWNER_EMAIL` matches exactly, lowercase-insensitively |
| Access-denied screen from Google | The account is not a Test user | Add it under **Audience → Test users**, or publish the app |
| Deploy fails on the KV binding | The id is wrong or belongs to another account | Check the id against **Storage & Databases → KV** in the dashboard and report a mismatch — do not create a new namespace, that loses the user list |
| Everyone approved is suddenly pending again | The Worker is pointed at a second, empty `USERS` namespace | Restore the id in `wrangler.jsonc` to the one holding the records, and delete the empty duplicate |
| Emails never arrive | `RESEND_API_KEY` missing or wrong | Check the secret; failed sends are deliberately silent so they cannot break a sign-in |

---

## What to report back

Please include, in this order:

1. Which of Tasks 1–3 completed, and any that did not, with the error. For
   Task 4, just confirm the binding is still in `wrangler.jsonc`.
2. The two Task 5 curl results, verbatim.
3. Whether the Task 6 flow worked end to end — and if you added a second test
   account, say which one, so it can be blocked afterwards if it was a throwaway.
4. Whether the notification email arrived.
5. **The Supabase consent-screen question from Task 1** — is that older OAuth
   client live and user-facing?
6. Anything you had to do differently from these instructions.

**Do not include any secret value in the report.** Shapes and confirmations only.
