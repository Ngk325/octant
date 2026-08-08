# Growth plan: getting to paying users

This is a plan, not a status report — nothing below is done except what's marked
done. It exists because two things came out of a review of the external sitemap
and the acquisition question together: the 136-page SEO surface at `/read` had
zero links from the home page, and the pricing page's "access unlocks
automatically" promise depends on a Stripe webhook that isn't wired up yet. Both
change what "get more paying users" should mean right now — the honest first move
is making sure the funnel that already exists actually works end to end, not
adding a new one on top of it.

## What's public today

| Surface | Where | Notes |
|---|---|---|
| `/` | `src/worker/marketing.ts` | Landing page: hero, product, audiences, pricing, about |
| `/apply` | `src/worker/scholarship.ts` | Free scholarship, owner-approved |
| `/signin` | `src/worker/auth.ts` | Invite code or Google sign-in |
| `/read`, `/read/:type` ×16, `/read/:pair` ×120 | `src/worker/read.ts` | Public SEO articles, derived at request time |
| `/sitemap.xml`, `/robots.txt` | `src/worker/read.ts` | Generated from the same type/pair list |

Everything else — the full instrument (`/types`, `/type/:t`, `/pair/:a/:b`,
`/network`, `/matrix`, `/lexicon`, `/learn`, …) — sits behind the auth wall by
design and should stay there; it's the paid product, not marketing surface.

**Fixed in this pass:** `/` now links to `/read` from the header nav, the footer
nav, and a low-commitment hero CTA ("browse a free reading first") — previously
the 136 reading pages were reachable only via `sitemap.xml` or a search-engine
crawl, invisible from the one page most likely to send them visitors.

## Phase 0 — Make the thing that's already sold actually work

`src/worker/stripe.ts` is explicit about this: the webhook that turns a completed
Stripe checkout into automatic access is scaffolded but not live. Until
`STRIPE_WEBHOOK_SECRET` is configured, a paying customer's access depends on the
owner noticing a Stripe notification email and approving them by hand via
`/admin` — while the pricing page tells them "access unlocks automatically,
usually within a minute."

**Action (owner, not code — needs Stripe dashboard + deploy access):**
1. In the Stripe dashboard, add a webhook endpoint at
   `<production origin>/api/stripe/webhook` subscribed to
   `checkout.session.completed` and `customer.subscription.deleted`.
2. `npx wrangler secret put STRIPE_WEBHOOK_SECRET` with the signing secret Stripe
   gives you for that endpoint.
3. Run a real small payment through the live Stripe link on `/`, confirm the
   `USERS` record is pre-approved automatically, and confirm a Google sign-in
   with that email lands in the app within the promised window.
4. Cancel/refund that test subscription and confirm `customer.subscription.deleted`
   flips the account to `blocked`.

This is the highest-leverage single item on this plan — every phase below sends
more people at a checkout flow that, until this is done, silently degrades to
"email the owner and wait."

## Phase 1 — Ship the navigability fix

Done in this change: `/read` linked from the home page's header, footer, and hero.
No further action — this phase closes once the code above merges and deploys.

## Phase 2 — Instrument the funnel

There is currently no analytics anywhere in the stack (no GA/Plausible/PostHog —
confirmed by search), and the CSP in `src/worker/headers.ts` only allows two
inline scripts by fixed hash, so a bolt-on client-side tracking snippet doesn't
fit without loosening a deliberately strict header. The Worker already sees every
request, so the natural fit is **Cloudflare Workers Analytics Engine** (or
equivalent server-side logging) recording, per request: which `/read/*` page was
hit, whether the visitor came from `/`, and whether they subsequently hit
`/apply`, `/signin`, or clicked through to the Stripe link. That answers the
questions every later phase needs:

- Which reading pages get organic traffic at all?
- What fraction of `/` visitors reach a reading page, `/apply`, or checkout?
- (Once Phase 0 lands) what fraction of Stripe clicks become paid accounts?

Until this exists, every acquisition idea below is a guess dressed as a plan.

## Phase 3 — SEO on the surface that already exists

The 120 pair pages are a real asset, not templated filler: each targets an exact
long-tail query a real person types ("ENTP and INFJ compatibility"), each page's
content is genuinely derived per-pair (ease scores, asymmetry note), and
page-to-page internal linking already exists (`relatedPairs`, breadcrumbs back to
`/read` and `/`). What was missing on the inbound side, and still is:

- Submit `sitemap.xml` to Google Search Console and Bing Webmaster Tools; verify
  the domain.
- Watch indexing coverage — with 136 URLs generated at request time, confirm none
  are being skipped or deduplicated incorrectly.
- Once Phase 1 is live, re-check indexing after the home page starts linking in —
  internal links from `/` should improve crawl priority for pages that were
  previously orphaned from it.

No new content type is proposed here yet — the move is making sure what's built
is actually found, before deciding whether to build more of it.

## Phase 4 — Targeted distribution to the stated audience

The marketing copy already names the ICP precisely: coaches/practitioners, team
leads/founders, partners/families. At $25/user/month and solo-operator scale,
paid acquisition is premature before Phases 0–2 land — CAC discipline matters
more than reach at this size. Organic-first, in order of effort:

- Founder content aimed at the coaching/typology community, making the two
  differentiated claims the product actually has: both-directions compatibility
  (most tools give one symmetric score) and whole-group graph analysis (most
  tools stop at pairs).
- Participation in existing typology communities (forums/subreddits where
  MBTI/Socionics-literate people already discuss compatibility), linking to the
  specific `/read/:pair` page that matches the question being asked, not the bare
  homepage — send topically-relevant traffic straight to matching content.

## Phase 5 — Tighten the bottom of the funnel

- **Business tier**: currently a bare `mailto:` link with no capture or tracking.
  Fine at current volume; revisit once Phase 2 shows real enquiry volume worth
  formalizing (a short form, a CRM row — not before there's a reason to).
- **Scholarship (`/apply`)**: a goodwill/advocacy channel, not a growth lever to
  engineer — approved scholarship users are the people most likely to recommend
  Octant unprompted. Nothing to build; worth remembering when prioritizing owner
  time on `/admin` approvals.

## Priority order

Phase 0 (Stripe webhook — owner action) → Phase 1 (shipped) → Phase 2
(instrumentation) → Phase 3 (SEO follow-through) → Phase 4 (distribution) →
Phase 5 (funnel bottom, revisit later). Each later phase either depends on the
one before it working, or is wasted effort spent driving traffic at a funnel
nobody can yet measure.
