# Setting up Google sign-in and email notifications

Two accounts to create. Neither costs anything. Do these before deploying the
OAuth change — the code fails closed without them, exactly like the access wall.

---

## 1 · Google OAuth client (~4 minutes)

1. Go to <https://console.cloud.google.com/projectcreate> and make a project.
   Call it anything — `octant` is fine.

2. Left menu → **APIs & Services** → **OAuth consent screen**.
   - User type: **External**. (Internal is only for Google Workspace orgs.)
   - App name: `Octant`. User support email: yours. Developer contact: yours.
   - **Scopes:** you do not need to add any. The three the app uses —
     `openid`, `email`, `profile` — are non-sensitive and need no review.
   - **Publishing status:** leave it in **Testing**, and add each person's Gmail
     address under **Test users**. In Testing mode only listed users can sign in
     at all, which is a second lock in front of your approval step.
     If you would rather not maintain that list, click **Publish app** — the
     approval step still gates everyone, so this stays private either way.

3. Left menu → **Credentials** → **Create credentials** → **OAuth client ID**.
   - Application type: **Web application**
   - Name: `Octant Worker`
   - **Authorised redirect URI** — this must match exactly, including the
     scheme and no trailing slash:

     ```
     https://<your-worker-url>/api/auth/google/callback
     ```

     Add a second one for local testing:

     ```
     http://localhost:8788/api/auth/google/callback
     ```

4. Copy the **Client ID** and **Client secret**. You will paste them in step 3
   below.

> If sign-in later fails with `redirect_uri_mismatch`, the URI in this console
> does not byte-for-byte match the one the Worker sent. That is nearly always a
> trailing slash, `http` vs `https`, or the `www.` prefix.

---

## 2 · Resend, for the notification emails (~2 minutes)

1. Sign up at <https://resend.com> — the free tier is 3,000 emails a month,
   which is roughly 3,000 times what this needs.
2. **API Keys** → **Create API Key**. Permission: **Sending access** is enough.
3. Copy the key. It starts `re_`.

You do **not** need to add a domain. Resend lets you send from its shared
`onboarding@resend.dev` address, and the app only ever emails you.

If you skip this entirely, everything still works — you just do not get told
when someone is waiting, and you check the admin page yourself instead.

---

## 3 · Set the secrets

Cloudflare dashboard → **Workers & Pages** → **typology** → **Settings** →
**Variables and Secrets**. Add each as type **Secret**:

| Name | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | from step 1.4 — ends `.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | from step 1.4 — starts `GOCSPX-` |
| `OWNER_EMAIL` | your own Google address. This is who gets approved automatically and who the admin page belongs to. |
| `RESEND_API_KEY` | from step 2.3. Omit it to run without email. |

The existing `ACCESS_CODES`, `AUTH_SECRET` and `GEMINI_API_KEY` all stay as
they are — invite codes keep working alongside Google.

---

## 4 · The KV namespace

The user list has to live somewhere. One command, once:

```sh
npx wrangler kv namespace create USERS
```

It prints an `id`. Paste it into `wrangler.jsonc` under `kv_namespaces`,
replacing `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`, then commit and push.

Or in the dashboard: **Storage & Databases** → **KV** → **Create**, name it
`USERS`, then **Workers & Pages** → **typology** → **Settings** → **Bindings**
→ **Add** → **KV namespace**, variable name `USERS`.

---

## How it behaves once set up

1. Someone opens the site and clicks **Continue with Google**.
2. They sign in and land on a *waiting for approval* page. They see nothing
   else — no app shell, no assets, no API.
3. You get an email: who it is, when, and two buttons, **Approve** and **Deny**.
   The buttons are signed links that expire in seven days, so you can approve
   from your phone without signing in.
4. Approved, they get in. Denied or later disabled, they are back to the waiting
   page on their next page load.

You can also do all of this from **/admin**, which only your `OWNER_EMAIL`
account can open.

**One caveat worth knowing.** The user list is in KV, which is eventually
consistent — a disable can take up to about a minute to reach every edge
location, and a session already loaded stays usable until its next page load.
If you ever need somebody out *instantly*, rotate `AUTH_SECRET`: that invalidates
every session everywhere at once, and everyone signs in again.
