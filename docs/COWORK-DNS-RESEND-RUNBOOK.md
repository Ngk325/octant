# Task: verify `send.stratfieldpartners.com` in Resend, via GoDaddy DNS

**For a Cowork session. Self-contained — everything needed is below.**
Written 20 Aug 2026. Registrar is **GoDaddy**.

---

## Why this exists

Octant now sends two kinds of mail to people who are not the owner:

- an **acknowledgement** to anyone who asks for access at `/apply`, and
- the **partner rate card** to anyone the owner releases it to from `/partners`.

Both refuse to send unless the Worker secret `NOTIFY_FROM` names a sender on a
Resend-**verified** domain. This is deliberate, not a bug: Resend's shared
sandbox address (`onboarding@resend.dev`) delivers only to the address the
Resend account is registered under, while cheerfully returning success — so
without a verified sender the app would report sent mail that nobody ever got.

The only verified domain on the account today is `insuranceprosct.com`, which
belongs to a different business. Octant mail arriving from an insurance
agency's domain reads as phishing.

So: a dedicated sending subdomain, `send.stratfieldpartners.com`. A subdomain
rather than the root, so that a bounce or spam complaint from Octant cannot
damage the reputation of the domain the owner's actual work email runs on, and
so no DNS record touches anything that existing mail depends on.

**Already done:** the domain is created in Resend (id
`b36cdbbb-8b46-4134-bceb-cc7347ca0e57`), status `not_started`, region
`us-east-1`. Nothing else has been changed anywhere.

---

## Step 0 — preflight, and the one thing that would waste the whole task

**Check where `stratfieldpartners.com` actually resolves its DNS.** GoDaddy is
the registrar, which is not the same as being the nameserver. If the domain is
delegated elsewhere — Cloudflare is the common case, and the Octant Worker
already lives in a Cloudflare account — then records added in GoDaddy's DNS
panel are inert and nothing will ever verify.

```
dig +short NS stratfieldpartners.com
```

- Names ending `domaincontrol.com` → GoDaddy is authoritative. Continue.
- Anything else (`*.ns.cloudflare.com`, etc.) → **stop.** Do not add records in
  GoDaddy. Report which nameservers came back; the records need to go to that
  provider instead, and the values below are unchanged.

Also worth capturing before touching anything, so any later problem can be told
apart from something that was already there:

```
dig +short TXT stratfieldpartners.com
dig +short MX  stratfieldpartners.com
dig +short TXT send.stratfieldpartners.com
dig +short TXT resend._domainkey.send.stratfieldpartners.com
```

The last two should be empty. If either already returns something, report it
rather than overwriting — something else is using that name.

---

## Step 1 — add three records in GoDaddy

GoDaddy → **My Products** → `stratfieldpartners.com` → **DNS** → **Add New
Record**, three times.

**GoDaddy appends the domain to whatever goes in the Name field.** Enter the
names exactly as written below — short, no domain, no trailing dot. Typing the
full hostname produces `resend._domainkey.send.stratfieldpartners.com.stratfieldpartners.com`,
which is the single most common way this task fails.

### Record 1 — DKIM

| Field | Value |
|---|---|
| Type | `TXT` |
| Name | `resend._domainkey.send` |
| Value | see below — one line, no quotes, no spaces |
| TTL | 1 Hour (default is fine) |

```
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC76rXXptpYBqxqmYyBI9EXqql2n9LrYd5m6iIZdK/+49H87P9pPR1hkaaWg8tpBxXlHkeX86YzOCJswILVatf7IAyehEUBlY14cLAKzaWUSzrUTmda6ZxnCaazSPeT67a2euL0OLaLtJuIFdrbkCKzVP062ly9fARBf7tqRTz8HwIDAQAB
```

Paste it as a single unbroken line. It is 216 characters, comfortably inside
the 255-character limit for one TXT string, so it must **not** be split. Do not
add surrounding quotes — GoDaddy adds them itself, and a manually quoted value
ends up double-quoted and invalid. Check for a leading or trailing space after
pasting; that alone will fail verification.

### Record 2 — SPF, MX half

| Field | Value |
|---|---|
| Type | `MX` |
| Name | `send.send` |
| Value / Points to | `feedback-smtp.us-east-1.amazonses.com` |
| Priority | `10` |
| TTL | 1 Hour |

`send.send` is not a typo. The domain being verified is
`send.stratfieldpartners.com`, and Resend's bounce return-path adds its own
`send.` in front of it, giving `send.send.stratfieldpartners.com`.

### Record 3 — SPF, TXT half

| Field | Value |
|---|---|
| Type | `TXT` |
| Name | `send.send` |
| Value | `v=spf1 include:amazonses.com ~all` |
| TTL | 1 Hour |

Same name as record 2, deliberately. A TXT and an MX record can share a name.

### Do not touch

Anything already on the root `stratfieldpartners.com` — its existing MX, SPF or
DKIM records carry the owner's live work email. Nothing in this task requires
changing, replacing or deleting any of them. If GoDaddy offers to "replace an
existing record", the name was typed wrong; cancel and re-check it.

---

## Step 2 — confirm the records resolve

GoDaddy usually publishes within minutes, but can take up to an hour. Query a
public resolver rather than trusting the GoDaddy panel, which shows what was
saved rather than what is being served:

```
dig +short @8.8.8.8 TXT resend._domainkey.send.stratfieldpartners.com
dig +short @8.8.8.8 MX  send.send.stratfieldpartners.com
dig +short @8.8.8.8 TXT send.send.stratfieldpartners.com
```

Expected, in order: the `p=MIGf…` DKIM string; `10 feedback-smtp.us-east-1.amazonses.com.`;
`"v=spf1 include:amazonses.com ~all"`.

If a query returns nothing after an hour, re-open the record in GoDaddy and
compare the Name field character by character against this document. Do not
delete and re-add on a hunch — report what the panel shows instead.

---

## Step 3 — verify in Resend

With the Resend connector available, trigger it directly:

- `verify-domain` with id `b36cdbbb-8b46-4134-bceb-cc7347ca0e57`
- then `get-domain` with the same id to read the result back.

Verification is not instant; Resend re-checks DNS in the background. Poll
`get-domain` every few minutes rather than assuming the first read is final.

Target state: **`status: verified`**, sending enabled.

If it stalls at `pending` for more than about thirty minutes while all three
`dig` queries in step 2 return the right values, stop and report — that is a
Resend-side condition, not something more DNS edits will fix.

If the connector is not available in this session, that is fine: finish step 2
and report the `dig` output, and verification can be triggered elsewhere.

---

## Step 4 — hand back the last step (do not attempt it)

The final step needs an interactive Cloudflare login and must be run by the
owner, on their own machine:

```
npx wrangler secret put NOTIFY_FROM
# paste at the prompt:
Octant <octant@send.stratfieldpartners.com>
```

Do not attempt this from a Cowork session, and do not ask anyone to paste a
Cloudflare API token into a chat. Just include the two lines above in the
report so they are ready to copy.

Leave `OWNER_EMAIL` and `NOTIFY_EMAIL` alone. They answer different questions —
who owns `/admin`, and where mail lands — and neither is what this task changes.

---

## Report back

State plainly, in this order:

1. **Nameservers** — what `dig NS` returned, and therefore whether GoDaddy was
   the right place to work at all.
2. **Anything pre-existing** found at the two new names, if anything was.
3. **The three records** — added, or not, and any GoDaddy behaviour worth
   knowing (a value it reformatted, a warning it showed).
4. **Resolution** — the three `dig` results from step 2, pasted verbatim.
5. **Resend status** — `verified`, or exactly what `get-domain` reported and
   how long it had been that way.
6. **What is left** — the `wrangler secret put` line for the owner.

If something went wrong, say what and stop. A half-finished DNS change that is
reported accurately is recoverable in minutes; one reported as done is a
silent mail outage that only shows up when a partner says they never heard
back.

---

## Also outstanding, and NOT part of this task

`wrangler.jsonc` line 95 has `"PUBLIC_ORIGIN": ""`. `sendQueuedNurture` will
not send opt-in nurture mail without an origin, because those messages need an
unsubscribe link and it refuses to send one it cannot build a URL for — so
emails 2 and 3 of the onramp sequence have never gone out, logging
`nurture skipped — no origin/secret` hourly. The fix is one line, but the right
value depends on whether Octant is getting its own domain, so it is the owner's
call and not this task's. Mention it in the report; do not change it.
