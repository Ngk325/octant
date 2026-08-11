# Octant — finish payment auto-approval (one command)

**Status: the Stripe webhook endpoint is live. One secret still needs to be
set on the Worker before it actually verifies anything.**

This is a handoff doc for a Cowork session (or anyone with a local shell and
Cloudflare access) to finish the one step that can't be done from a cloud
sandbox: setting a Worker secret requires `wrangler` authenticated against
the real Cloudflare account, which a sandboxed session does not have.

---

## Current state

| Thing | Value |
|---|---|
| Worker | `typology` |
| Live URL | `https://typology.stratfield-partners.workers.dev` |
| Cloudflare account | Stratfield Partners (`b45df299…b5d6`) |
| Stripe webhook endpoint | `we_1U3BvVPreyhXLkX6a7IPcJpV`, live mode, already created and enabled |
| Endpoint URL | `https://typology.stratfield-partners.workers.dev/api/stripe/webhook` |
| Subscribed events | `checkout.session.completed`, `checkout.session.async_payment_succeeded` |
| Missing secret | `STRIPE_WEBHOOK_SECRET` — not set yet, so the endpoint currently 503s |

The endpoint itself was created via the Stripe MCP connector (`PostWebhookEndpoints`)
in this session — nothing left to configure in the Stripe dashboard. The only
gap is the signing secret landing on the Worker.

**The secret value is deliberately not written in this file.** Per this repo's
own convention (see `docs/COWORK-SETUP-RUNBOOK.md`: "none of them in this
repo"), no secret value is ever committed, including in a runbook. Get it from
the Stripe dashboard: **Developers → Webhooks → the endpoint above → Reveal
signing secret.** It starts with `whsec_`.

---

## The one command

From the repo root (where `wrangler.jsonc` lives):

```sh
npx wrangler login          # only if this machine isn't already authenticated
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

Paste the `whsec_...` value when prompted. No redeploy needed — Worker
secrets take effect immediately.

---

## Verify it worked

- `POST /api/stripe/webhook` with no signature currently returns `503`
  (`src/worker/stripe.ts` — the route degrades rather than crashing when the
  secret is unset). After the secret is set, the same request instead fails
  signature verification with a `400`, not a `503` — that transition is the
  signal the secret landed.
- Real end-to-end check: complete a real (or Stripe test-mode) checkout
  through the app's Payment Link, then confirm the paying email's `USERS` KV
  record flips to `status: approved` without anyone visiting `/admin`.
- Stripe's own dashboard (Developers → Webhooks → this endpoint → recent
  deliveries) shows delivery attempts and their response codes — useful if
  something looks wrong after the secret is set.

---

## Traps

**Don't create a second webhook endpoint.** One already exists
(`we_1U3BvVPreyhXLkX6a7IPcJpV`), enabled, pointed at the right URL, with the
right two events. Re-running the Stripe MCP `PostWebhookEndpoints` call (or
clicking "Add endpoint" in the dashboard) would create a duplicate that
double-processes every payment event — check the existing endpoints list
first.

**Don't paste the secret into a commit, a chat log, or this file.** Treat it
like any other Worker secret — `wrangler secret put` is the only place it
should ever land.
