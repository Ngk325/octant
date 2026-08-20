import { escapeHtml } from "./html";

/* ------------------------------------------------------------------ *
 * THE ONE-TAP DECISION PAGE.
 *
 * Where a signed link from an email lands. Two flows use it — approving
 * a sign-up (admin.ts) and releasing the partner rate card (enquiry.ts)
 * — and they used to be one file with a copy of this and one file about
 * to grow another, which is the same near-duplicate that produced
 * mail.ts.
 *
 * Self-contained on purpose: it is opened from a mail client by somebody
 * who is not signed in and should not have to be, so it can reference no
 * asset and no bundle.
 *
 * `title` and `body` are ESCAPED here rather than at each call site.
 * Some of what lands in `body` is attacker-controlled — a Google display
 * name, an organisation typed into a public form. It previously went in
 * raw in admin.ts, so a name of <script>…</script> executed in the
 * owner's browser, on the owner's origin, on the page they were using to
 * decide whether to trust that person.
 *
 * `extra` is the one trusted parameter: markup built by the calling
 * module, never from a request. Keeping the escaping inside means a new
 * call site is safe by default and an unsafe one has to be written on
 * purpose.
 * ------------------------------------------------------------------ */

export interface DecisionPageOptions {
  /** Trusted markup — a confirm form. Never anything from a request. */
  extra?: string;
  status?: number;
  /** Where to go next. Defaults to the admin list. */
  footer?: { href: string; label: string };
  /**
   * Label/value pairs shown above the buttons, ESCAPED here. This exists so
   * that showing somebody an application does not mean building markup out of
   * what that person typed and passing it through `extra` — which would work,
   * and would be one careless call site away from running their text on the
   * owner's origin, on the page the owner uses to decide whether to trust
   * them. Empty values are dropped rather than rendered blank.
   */
  details?: [label: string, value: string][];
}

export function decisionPage(
  title: string, body: string, ok: boolean, opts: DecisionPageOptions = {},
): Response {
  const { extra = "", status = ok ? 200 : 400, footer, details } = opts;
  const link = footer ?? { href: "/admin", label: "Manage everyone →" };
  const rows = (details ?? []).filter(([, value]) => value).map(([label, value]) => `
    <div class="row"><div class="k">${escapeHtml(label)}</div><div class="v">${escapeHtml(value)}</div></div>`).join("");
  const detailBlock = rows ? `<div class="details">${rows}</div>` : "";
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Octant — ${escapeHtml(title)}</title>
<style>
  :root{color-scheme:light dark;--paper:#FDFCFA;--ink:#241F19;--ink2:#4C463D;--rule:#E3DED4;
        --accent:#4C4899;--on:#fff;--bad:#AA2A1E;--surface:#fff}
  @media(prefers-color-scheme:dark){:root{--paper:#141310;--ink:#EDE9E1;--ink2:#B6AFA3;--rule:#2E2A24;
        --accent:#A8A6D3;--on:#241F19;--bad:#E87A68;--surface:#1D1B17}}
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--paper);
       color:var(--ink);font:400 19px/1.6 Georgia,'Times New Roman',serif}
  main{max-width:26rem}h1{font-size:30px;margin:0 0 8px}p{color:var(--ink2);margin:0}
  a{color:var(--accent)}
  button{font:500 17px/1 system-ui,sans-serif;padding:13px 22px;border:0;border-radius:6px;
         cursor:pointer;background:var(--accent);color:var(--on)}
  button.no{background:var(--surface);color:var(--bad);border:1px solid var(--rule)}
  .mark{font-size:34px;line-height:1;margin-bottom:12px}
  .details{border:1px solid var(--rule);border-radius:8px;padding:4px 16px;margin:20px 0 0;
           text-align:left;font:400 16px/1.55 system-ui,sans-serif}
  .row{padding:10px 0;border-bottom:1px solid var(--rule)}
  .row:last-child{border-bottom:0}
  .k{font-size:13px;letter-spacing:.05em;text-transform:uppercase;color:var(--ink2)}
  .v{color:var(--ink);white-space:pre-wrap;overflow-wrap:anywhere}
</style></head><body><main>
<div class="mark">${ok ? "✓" : "—"}</div>
<h1>${escapeHtml(title)}</h1><p>${escapeHtml(body)}</p>${detailBlock}${extra}
<p style="margin-top:24px"><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></p>
</main></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
}
