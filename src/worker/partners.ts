/* ------------------------------------------------------------------ *
 * THE PARTNER DOOR.
 *
 * The second public page. Like the front door it is a complete,
 * self-contained document that never references the app bundle, so it
 * can be served ahead of the wall without leaking a byte of the app.
 *
 * What this page is NOT is the negotiating position. The internal terms
 * sheet (docs/PARTNERSHIP-TERMS.md) carries the partner rate card, the
 * cost premises behind it and the per-deal structures; none of that
 * belongs on a public URL, because published wholesale rates are a
 * discount floor every future partner starts from and the standalone
 * price in marketing.ts has to stay credible next to them. So the page
 * keeps the SHAPE of the deal — which is what qualifies an enquiry —
 * and quotes commercials per engagement.
 *
 * The three-axis decomposition is the load-bearing idea and the reason
 * this is a page rather than a mailto: a partner who can already see
 * which row they are in writes a far better first email, and the
 * questions at the end are the ones that email should answer.
 * ------------------------------------------------------------------ */

import { SITE_CSS, siteFooter, siteHead, siteHeader } from "./marketing";

const PARTNER_MAILTO =
  "mailto:nick@stratfieldpartners.com" +
  "?subject=Octant%20partnership" +
  "&body=" +
  encodeURIComponent(
    "Which shape looks closest (A referral / B bundled / C embedded / D white-label):\n\n" +
      "What we do, and where Octant would sit in it:\n\n" +
      "Roughly how many people would use it:\n\n",
  );

const TITLE = "Octant for partners — put the relational layer inside your offering";
const DESCRIPTION =
  "Four ways Octant can sit inside another offering — referral, bundled seats, embedded or " +
  "white-label — separated by whose brand the client sees, whose invoice they pay and whose " +
  "engineering is required.";

/** Rules this page adds on top of SITE_CSS. Nothing here overrides a shared rule. */
const PARTNERS_CSS = `
  /* Longhand, same reason as .hero in SITE_CSS: this element is
     class="wrap p-hero" and a shorthand here zeroes .wrap's gutters. */
  .p-hero { padding-top:64px; padding-bottom:40px; max-width:760px; }
  .p-hero .lede { font-size:21px; color:var(--m-ink2); }

  .axis-table { width:100%; border-collapse:collapse; margin-top:28px;
                font-family:var(--sans); font-size:15.5px; }
  .axis-table th, .axis-table td { text-align:left; padding:12px 16px 12px 0;
                                   border-bottom:1px solid var(--m-rule); vertical-align:top; }
  .axis-table th { font-size:13px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
                   color:var(--m-muted); }
  .axis-table td:first-child { font-weight:600; color:var(--m-ink); white-space:nowrap; }
  .axis-table tr:last-child td { border-bottom:none; }
  .scroller { overflow-x:auto; }
  .axis-table { min-width:34rem; }

  /* Two columns, not auto-fit: four shapes wrap 3+1 at desktop widths and the
     orphan reads as an afterthought rather than the fourth of a set. */
  .shapes { display:grid; gap:20px; margin-top:36px;
            grid-template-columns:repeat(2,minmax(0,1fr)); }
  @media (max-width:760px){ .shapes { grid-template-columns:minmax(0,1fr); } }
  .shape { background:var(--m-surface); border:1px solid var(--m-rule); border-radius:12px;
           padding:26px 24px; }
  section.alt .shape { background:var(--m-paper); }
  .shape .tag { display:inline-block; font-family:var(--sans); font-size:12px; font-weight:600;
                letter-spacing:.1em; background:var(--m-accent); color:var(--m-on);
                padding:3px 8px; border-radius:4px; margin-bottom:12px; }
  .shape h3 { font-size:21px; margin-bottom:10px; }
  .shape p { font-family:var(--sans); font-size:15.5px; line-height:1.6; color:var(--m-ink2);
             margin:0 0 12px; max-width:none; }
  .shape p:last-child { margin-bottom:0; }
  .shape .chips { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px; }
  .shape .chip { font-family:var(--sans); font-size:12.5px; line-height:1.4; padding:4px 9px;
                 background:var(--m-soft); border:1px solid var(--m-rule); border-radius:4px;
                 color:var(--m-ink2); }
  .shape .chip b { font-weight:600; color:var(--m-ink); }

  .qlist { list-style:none; padding:0; margin:32px 0 0; max-width:760px; counter-reset:q; }
  .qlist li { counter-increment:q; display:grid; grid-template-columns:2.4rem 1fr;
              padding:16px 0; border-bottom:1px solid var(--m-rule); }
  .qlist li:last-child { border-bottom:none; }
  .qlist li::before { content:counter(q); font-family:var(--sans); font-size:14px;
                      font-weight:600; color:var(--m-accent-ink); padding-top:4px; }
  .qlist p { margin:0; font-size:17.5px; }

  .rails { display:grid; gap:20px; margin-top:32px;
           grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); max-width:900px; }
  .rail { border-top:2px solid var(--m-accent); padding-top:14px; }
  .rail h3 { font-size:19px; margin-bottom:6px; }
  .rail p { font-family:var(--sans); font-size:15.5px; color:var(--m-ink2); margin:0; }
`;

export function partnersPage(origin: string): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
${siteHead({ title: TITLE, description: DESCRIPTION, origin, path: "/partners" })}
<style>${SITE_CSS}${PARTNERS_CSS}</style>
</head>
<body>

${siteHeader(false)}

<main>
  <div class="wrap p-hero">
    <p class="kicker">Partners</p>
    <h1>Octant, inside your offering.</h1>
    <p class="lede">
      If you already work with teams, founders, couples or leaders, the relational layer is
      probably the part you keep explaining by hand. Octant is that layer as software &mdash;
      and it can sit inside what you already sell, under four different arrangements.
    </p>
    <div class="cta-row">
      <a class="btn primary" href="${PARTNER_MAILTO}">Start a conversation</a>
      <a class="btn" href="#shapes">See the four shapes</a>
    </div>
  </div>

  <section class="alt" id="what">
    <div class="wrap">
      <p class="kicker">What you would be integrating</p>
      <h2>A relational instrument, not another label test.</h2>
      <p>
        Octant takes the patterns of two or more people and returns the mechanics of what
        happens <em>between</em> them &mdash; not a description of each person in isolation.
      </p>
      <div class="rails">
        <div class="rail">
          <h3>Per person</h3>
          <p>
            An eight-slot stack, four sides of the mind with the gateway into each, a growth
            gate, and what every function actually wants.
          </p>
        </div>
        <div class="rail">
          <h3>Per pair</h3>
          <p>
            The relation, <strong>two</strong> directional ease scores &mdash; A&rarr;B and
            B&rarr;A are different numbers, always &mdash; and a playbook composed from where
            one person&rsquo;s functions land in the other&rsquo;s stack.
          </p>
        </div>
        <div class="rail">
          <h3>Per group</h3>
          <p>
            A weighted directed graph: average ease, the hardest single edge, and who is
            carrying which part of the composition.
          </p>
        </div>
      </div>
      <p style="margin-top:32px">
        Sixteen patterns generate 256 ordered pairs, and the structure is derived at runtime
        rather than stored &mdash; there is no matrix to drift out of sync. Alongside it come a
        thirteen-stage course, a lexicon where every term is defined <em>and pairable</em>, a
        grounded assistant on every screen, and a printed 78-card deck generated from the same
        engine.
      </p>
      <div class="honest">
        <p>
          <strong>Where the evidence disagrees, we ship the disagreement.</strong> Octant
          carries a published survey matrix whose correlation with the model&rsquo;s own ease
          scores is negative, and shows the divergence on the page rather than smoothing it
          over. Where sourcing is thin, the page says so. A tool that only ever cited agreeing
          evidence would not deserve your clients&rsquo; trust, or yours.
        </p>
      </div>
    </div>
  </section>

  <section id="shapes">
    <div class="wrap">
      <p class="kicker">The four shapes</p>
      <h2>Three axes decide which one you are in.</h2>
      <p>
        Every arrangement below is a different answer to the same three questions:
        <strong>whose brand the client sees, whose invoice they pay, and whose engineering is
        required.</strong> Find the row where those three answers are the ones you want, and
        the rest follows.
      </p>
      <div class="scroller">
        <table class="axis-table">
          <thead>
            <tr><th>Shape</th><th>Brand seen</th><th>Who invoices</th><th>Engineering</th></tr>
          </thead>
          <tbody>
            <tr><td>A &middot; Referral</td><td>Octant</td><td>Octant</td><td>None</td></tr>
            <tr><td>B &middot; Bundled seats</td><td>Octant</td><td>You</td><td>None</td></tr>
            <tr><td>C &middot; Embedded</td><td>Both</td><td>You</td><td>Scoped build</td></tr>
            <tr><td>D &middot; White-label</td><td>Yours</td><td>You</td><td>Scoped build</td></tr>
          </tbody>
        </table>
      </div>

      <div class="shapes">
        <div class="shape">
          <span class="tag">A</span>
          <h3>Referral</h3>
          <div class="chips">
            <span class="chip">Brand <b>Octant</b></span>
            <span class="chip">Invoice <b>Octant</b></span>
            <span class="chip">Build <b>None</b></span>
          </div>
          <p>
            You introduce; your client buys directly and signs in to Octant. No commitment, no
            minimum, no support load on you, and a share of the recurring revenue for as long
            as that client stays.
          </p>
          <p>The lightest arrangement, and the one to start with if you are still testing fit.</p>
        </div>

        <div class="shape">
          <span class="tag">B</span>
          <h3>Bundled seats</h3>
          <div class="chips">
            <span class="chip">Brand <b>Octant</b></span>
            <span class="chip">Invoice <b>You</b></span>
            <span class="chip">Build <b>None</b></span>
          </div>
          <p>
            You buy seats at a wholesale rate and include them in your own package at whatever
            you charge. Still Octant-branded and your client still signs in here &mdash; but the
            relationship and the invoice are yours.
          </p>
          <p>Nothing to build. Seat minimums apply, and the rate steps down with volume.</p>
        </div>

        <div class="shape">
          <span class="tag">C</span>
          <h3>Embedded</h3>
          <div class="chips">
            <span class="chip">Brand <b>Both</b></span>
            <span class="chip">Invoice <b>You</b></span>
            <span class="chip">Build <b>Scoped</b></span>
          </div>
          <p>
            Octant runs inside your surface. Your client never experiences a second product and
            never manages a second login. This means an authenticated handoff from your identity
            system and an embed surface built to your case &mdash; real engineering on both
            sides, scoped and quoted before anyone commits.
          </p>
          <p>
            Priced as a one-time integration plus an ongoing platform and per-seat fee, because
            an embed makes us a dependency of your product and that is a different obligation
            from usage.
          </p>
        </div>

        <div class="shape">
          <span class="tag">D</span>
          <h3>White-label</h3>
          <div class="chips">
            <span class="chip">Brand <b>Yours</b></span>
            <span class="chip">Invoice <b>You</b></span>
            <span class="chip">Build <b>Scoped</b></span>
          </div>
          <p>
            Your brand, your domain, Octant invisible. Licensed annually against a floor, or as
            a share of the revenue of the offering it sits inside.
          </p>
          <p>
            The highest commitment on both sides, because it removes our ability to build a name
            from your clients entirely.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section class="alt" id="commercials">
    <div class="wrap">
      <p class="kicker">Commercials</p>
      <h2>Standalone is public. Partner terms are quoted.</h2>
      <div class="rails">
        <div class="rail">
          <h3>The software</h3>
          <p>
            Octant on its own is <strong>$25 per user / month</strong>, everything included.
            Partner rates sit below that and are set by shape and volume &mdash; tell us which
            row you are in and roughly how many people, and you get real numbers back.
          </p>
        </div>
        <div class="rail">
          <h3>Our time</h3>
          <p>
            Teaching the model, facilitated readings for your team or your clients, and
            integration advisory are priced separately from the software, always, so neither one
            hides inside the other. Available as single sessions, a block, or a monthly retainer.
          </p>
        </div>
        <div class="rail">
          <h3>What we will not do</h3>
          <p>
            Octant is not a measurement and claims no psychometric validity. It is not to be
            used as a hiring, selection or termination instrument, and any integration will say
            so where users can see it. That one is not negotiable.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section id="questions">
    <div class="wrap">
      <p class="kicker">Before you write</p>
      <h2>The questions we will ask you anyway.</h2>
      <p>
        Not a checklist and not a sequence &mdash; these are simply the places where your answer
        changes the structure. Answer any of them in your first email and we can skip a call.
      </p>
      <ol class="qlist">
        <li><p>In your delivery, is Octant something you run <strong>on</strong> clients, or something you hand <strong>to</strong> them?</p></li>
        <li><p>At renewal, whose product is the client renewing? That single answer separates A from B, C and D more cleanly than any feature comparison.</p></li>
        <li><p>If Octant were unavailable for a week, what breaks &mdash; is it a component or a garnish?</p></li>
        <li><p>Does your client need Octant&rsquo;s vocabulary, or does it need to arrive already translated into yours?</p></li>
        <li><p>What is the missing piece that would make this fit cleanly?</p></li>
      </ol>
      <div class="cta-row" style="margin-top:36px">
        <a class="btn primary" href="${PARTNER_MAILTO}">Start a conversation</a>
        <a class="btn" href="/#pricing">See the standalone product</a>
      </div>
      <p class="small muted" style="margin-top:16px">
        The four shapes are a starting decomposition, not a menu. If the axes above cut in the
        wrong place for what you are building, say so &mdash; a fifth shape is available.
      </p>
    </div>
  </section>
</main>

${siteFooter(false)}

</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Same posture as the front door: public, and cacheable only briefly.
      "cache-control": "public, max-age=300",
    },
  });
}
