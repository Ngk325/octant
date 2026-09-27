# Octant — partnership raw materials

**Prepared for a partner evaluating whether Octant fits inside their offering.**
Terms in this document are fixed and will not move before **31 December 2026**. If a number
changes after that, you will get the changed number before you are asked to decide anything.

This is not a proposal. It is the raw material: what Octant does, what it costs, what the
integration shapes are, and which premises the prices rest on. The fit is yours to model.

---

## 1 · What the software does

Octant is a relational instrument. It takes patterns of people and returns the mechanics of
what happens *between* them.

**Inputs**

| Input | How it is obtained |
|---|---|
| A person's own pattern | Eight-coin calculator — four determining, four confirming. Always narrows, never returns nothing. |
| Someone else's pattern | Six ordinary things to ask or notice in conversation. None of them name the axis they test. |
| A group | Any set of the above, 2 to n. |
| Optional self-reported controls | Subtype coins, development state, focus. Never guessed from a type. |

**Outputs**

| Scope | What comes back |
|---|---|
| One person | Eight-slot function stack · four sides of the mind, each with its own stack, gateway, what blocks it and what opens it · exchange overlay with subtype coins · growth gate · wheel position and theme grid · behavioural profile |
| One ordered pair | Relation type · **two** directional ease scores, A→B and B→A read separately · a composed playbook derived from where the reader's functions land in the target's stack |
| A group | A weighted directed graph: average ease, the hardest single edge, composition, who carries what |
| The whole space | All 256 ordered pairs, colour-scaled, every cell a link into the pair reader |

**Supporting surfaces:** a fifteen-stage course from "what is a cognitive function" through to
reading and borrowing another pattern's wiring · a 103-term lexicon where every term is defined
*and pairable* · a context-grounded assistant on every screen · a 78-card printed deck generated
from the same engine.

**Parameters of the system**

- 16 patterns · 256 ordered pairs · 8 information elements · 3 involutions.
- The structure is **derived at runtime** from roughly 2 KB of seed data. There is no database
  and no stored matrix. The structural tables cannot drift apart, because they are computed.
- The numbers and words hung on that structure are **authored**, not derived. The distinction is
  documented in the codebase rather than blurred.
- Ease scores are 0–100 and directional, read separately from each side. For the four
  asymmetric relations the two directions are different numbers — 64 of the 240 ordered
  cross-type pairs; the rest score the same both ways, and the reading still differs.

**Validation, stated honestly**

- An independent published 16-pattern table agrees with the engine on 128/128 slots.
- Two independently-keyed intertype charts agree on all 256 cells each.
- The advanced wheel layer reproduces a published partition on 16/16 dyads, 16/16 temples,
  40/40 authored fields — using an operator that was in the engine before that source was read.
- One published survey matrix **disagrees**: correlation with the model's ease scores is
  negative (r ≈ −0.15). Octant ships that matrix and shows the divergence rather than
  smoothing it. A tool that only ever cited agreeing evidence would not deserve trust.
- Where sourcing is thin, the page says so, on the page.

**What it is not.** It is not a measurement and does not claim psychometric validity. It should
not be used as a hiring, selection, promotion or termination instrument, and any integration
will say so where users can see it. This constraint is not negotiable and is stated up front
because it is easier to design around than to discover late.

---

## 2 · The premises the prices rest on

These are the load-bearing assumptions. If one of them is wrong for your situation, the number
built on it should move.

**P1 — Marginal cost per seat is near zero.** No database, no stored matrix, everything derived
at runtime on edge compute. The only variable cost is assistant traffic, and even at heavy use
that sits in low single-digit dollars per user per month. *So every discount below is a strategy
choice, not a cost floor.* Nobody should pretend there is a hard floor where there isn't one.

**P2 — What you would be licensing is the engine, the authored copy and the course** — not
hosting. Hosting is the cheap part.

**P3 — Retail is $25 per user / month and has to stay credible.** Anyone who compares your
bundle to the public price will do that arithmetic. A partner price much below $10 makes the
direct price look like a mistake, which damages both of us.

**P4 — Nick's hours are the only genuinely non-scalable input here.** They are priced high
enough that recording them once is obviously the right move for both sides. See §5.

**P5 — There is no partner API today.** Every endpoint is session-cookie gated behind the access
wall. Referral and resale need nothing built. Embedding needs real engineering, on a real
timeline. This is the single biggest source of schedule uncertainty and it is named here rather
than discovered in month three.

---

## 3 · Standalone price

**$25 per user / month.** One plan. No tiers, no feature gates, no per-report fees. Everything
in §1 included. Cancel anytime.

This is the anchor. Every number in §4 is a stated relationship to it.

---

## 4 · Four integration shapes

The shapes differ on exactly three axes: **whose brand the client sees, whose invoice they pay,
and whose engineering is required.** Pick the row where those three answers are the ones you
want, then the price follows.

| | Brand the client sees | Who invoices | Engineering needed |
|---|---|---|---|
| **A · Referral** | Octant | Octant | None |
| **B · Bundled seats** | Octant | You | None |
| **C · Embedded** | Both | You | Real build, both sides |
| **D · White-label** | Yours | You | Real build, both sides |

### A · Referral

You introduce. Your client buys at $25 and signs in to Octant. You carry no delivery risk, no
support load, no commitment, and no minimum.

- **You receive 25% of recurring revenue**, for as long as that client stays — $6.25 per seat
  per month.
- *Why 25%:* less than a wholesale margin would give you, because you are giving up nothing.
  The discount to B is the price of optionality.

### B · Bundled seats

You buy seats and include them in your own package at whatever you charge. Still Octant-branded,
your client still signs in to Octant, but the relationship and the invoice are yours.

- **$18 per seat / month**, minimum 10 seats, monthly, cancel with 30 days' notice.
- **$15 per seat / month**, minimum 25 seats, annual commitment.
- *Why up to 40% off retail:* you take volume risk and first-line support. The seat minimum
  exists so this cannot be used as a one-seat discount door — not to make you buy more than you
  need.

### C · Embedded / co-branded

Octant runs inside your surface. Your client does not experience a second product, does not
manage a second login, and may not need to know Octant is there.

- **Integration build: $12,000 – $20,000 one-time**, scoped once we agree what "inside" means.
  Range not a number, because the range is honest and a number would not be.
- **Then $750 / month platform fee + $12 per seat / month**, annual term.
- *Why a separate platform fee:* an embed makes Octant a dependency of your product. Uptime and
  support obligations are a different thing from usage and are priced as a different thing.
- *What the build actually is:* an authenticated handoff from your identity system, an embed
  surface, and a partner API — none of which exists today (P5). Advisory hours during the build
  are inside the build fee, not billed again on top.

### D · White-label / OEM

Your brand, your domain. Octant is invisible.

- **$36,000 / year floor**, including 250 seats; **$10 per seat / month** beyond that.
- **Or 20% of attributable revenue** from the offering the bundle sits in, with that same annual
  figure as the floor.
- *Why a floor and why it is the highest number here:* white-label removes Octant's ability to
  build its own name from your clients entirely. That erasure is the thing being bought.

---

## 5 · Time — teaching, facilitation, advisory

The model behind the software takes real work to hold. Time to transfer it is priced separately
from the software, always, so neither one hides inside the other.

| | Rate |
|---|---|
| Single session, 90 minutes, live and recorded | **$450** |
| Block of six sessions, used within six months | **$2,400** ($400 each) |
| Monthly retainer | **$3,000 / month** |
| Facilitated workshop, your team or your client's, full day | **$3,500** + travel |
| Advisory during a Shape C or D build | **Included in the build fee** |

**The retainer includes:** four hours of live time per month, async questions answered inside two
business days, and first look at anything you are building on top before it ships. Three-month
minimum, monthly thereafter.

**Unused retainer hours roll forward one month and no further.** Stated so it is not a surprise.

---

## 6 · Recorded lessons

Recorded material converts a recurring cost — hours, forever, every time a new person needs the
model — into a one-time production cost plus a durable asset. That conversion is worth doing.
The only real question is who pays for it and what they get for paying.

**Option 1 — Octant funds it.** Videos live behind the standard wall. Included with every seat
under any shape above, at no additional cost to you. Consultancy hours fall toward zero as the
library fills. Timeline is Octant's to set, and is not currently committed.

**Option 2 — You fund it.** A course-length set runs **$8,000 – $15,000** to produce, depending
on length and how much is bespoke to your context. In exchange you get **category exclusivity
for twelve months** — no other partner in your vertical — and your framing baked into the
material rather than bolted on afterwards.

Option 2 is the one worth thinking about if your offering's real bottleneck is that your clients
need to understand the model, not just consult it.

---

## 7 · What is fixed and what is genuinely open

**Fixed until 31 December 2026:** every price in §3, §4, §5 and §6. The four shapes and their
three axes. The engine, its outputs and the honesty posture in §1.

**Genuinely open, and named as open rather than presented as settled:**

- The Shape C build scope and therefore its timeline. There is no partner API today (P5).
- Whether recorded lessons exist by the time you would want to launch.
- Whether any of the four shapes is the right shape. They are a starting decomposition, not a
  menu you are expected to choose from as given. A fifth shape is available if the axes in §4
  cut in the wrong place for you.

---

## 8 · Open questions

Not a checklist and not a sequence. These are the places where the answer changes the structure,
and they are the ones only you can answer.

1. In your delivery, is Octant something you run **on** clients, or something you hand **to**
   them? That determines seat count and who logs in, which determines almost everything else.
2. At renewal, whose product is the client renewing? That single answer separates A from B, C
   and D more cleanly than any feature comparison.
3. If Octant were unavailable for a week, what breaks — is it a component or a garnish? That is
   what decides whether a platform fee and an uptime obligation are worth paying for.
4. Does your client need Octant's vocabulary, or does it need to arrive already translated into
   yours? Translation is real work and it belongs in scope explicitly or not at all.
5. What fraction of your per-client price can one component take before the arithmetic stops
   working? This is the actual constraint. Every number above is negotiable against it, and you
   are the only one holding it.
6. Where does the friction sit right now — in the price, in the shape, or in the sequence?
7. What is the missing piece that would make this fit cleanly?
