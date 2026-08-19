/* ------------------------------------------------------------------ *
 * THE PUBLIC FRONT DOOR.
 *
 * Served to anonymous GET / — the one page of this deployment that is
 * meant to be read without signing in. Everything else stays behind the
 * wall: this file renders complete, self-contained HTML with no
 * reference to the app bundle, so publishing it leaks nothing.
 *
 * Positioning rules, deliberate:
 *   - No third-party system, author or trademark is named. The product
 *     is described by what it does — patterns, directed relationships,
 *     group graphs — in its own vocabulary.
 *   - The honesty posture is load-bearing copy, not a disclaimer in the
 *     footer. "A lens, not a measurement" is the answer to the standard
 *     (and correct) critique of personality tooling, and the people this
 *     page is for — coaches, team leads, people who take relationships
 *     seriously — are exactly the ones who have heard that critique.
 * ------------------------------------------------------------------ */

/** The mark: two squares at 45° making an eight-pointed figure, one centre. */
export const MARK = (size: number, stroke = "currentColor", accent = "#6B3BC4") => `
<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" aria-hidden="true">
  <rect x="14" y="14" width="36" height="36" rx="5" stroke="${stroke}" stroke-width="2.5" opacity=".9"/>
  <rect x="14" y="14" width="36" height="36" rx="5" stroke="${stroke}" stroke-width="2.5" opacity=".45"
        transform="rotate(45 32 32)"/>
  <circle cx="32" cy="32" r="5.5" fill="${accent}"/>
</svg>`;

/** The same mark as a favicon, self-contained. */
export const FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">` +
    `<rect x="14" y="14" width="36" height="36" rx="5" stroke="#6B3BC4" stroke-width="4"/>` +
    `<rect x="14" y="14" width="36" height="36" rx="5" stroke="#6B3BC4" stroke-width="4" opacity=".5" transform="rotate(45 32 32)"/>` +
    `<circle cx="32" cy="32" r="7" fill="#6B3BC4"/></svg>`,
  );

/** Stripe payment link — Octant Individual, $25 per user / month, quantity adjustable. */
export const STRIPE_LINK = "https://buy.stripe.com/6oU7sM4Tnd4PdyU1nocfK00";
const BUSINESS_MAILTO =
  "mailto:nick@stratfieldpartners.com?subject=Octant%20for%20our%20team";

/** The two-stacks-with-arrows hero drawing — the product's core idea, inline. */
const HERO_ART = (() => {
  const rowY = (i: number) => 56 + i * 24; // eight rows, inside the boxes
  const left = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const strong = i < 4;
    return `
    <circle cx="40" cy="${rowY(i)}" r="${strong ? 7 : 5}" fill="var(--m-accent)" opacity="${strong ? 1 : 0.4}"/>
    <rect x="58" y="${rowY(i) - 4}" width="${94 - i * 7}" height="8" rx="4" fill="var(--m-ink)" opacity="${strong ? 0.5 : 0.18}"/>`;
  }).join("");
  const right = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const strong = i < 4;
    const hit = i === 2 || i === 4;
    return `
    ${hit ? `<rect x="290" y="${rowY(i) - 10}" width="158" height="20" rx="6" fill="var(--m-accent)" opacity=".14"/>` : ""}
    <circle cx="318" cy="${rowY(i)}" r="${strong ? 7 : 5}" fill="var(--m-rose)" opacity="${strong ? 1 : 0.4}"/>
    <rect x="336" y="${rowY(i) - 4}" width="${94 - i * 7}" height="8" rx="4" fill="var(--m-ink)" opacity="${strong ? 0.5 : 0.18}"/>`;
  }).join("");
  return `
<svg viewBox="0 0 460 306" fill="none" role="img"
     aria-label="Two minds drawn as ordered stacks, with arrows showing where one person's strengths land in the other's pattern.">
  <g font-family="ui-sans-serif,system-ui,sans-serif" font-size="14">
    <text x="24" y="26" fill="var(--m-muted)" font-weight="600">Their mind</text>
    <text x="436" y="26" fill="var(--m-muted)" font-weight="600" text-anchor="end">Yours</text>
    <rect x="16" y="38" width="150" height="204" rx="10" fill="var(--m-soft)"/>
    ${left}
    <rect x="294" y="38" width="150" height="204" rx="10" fill="var(--m-soft)"/>
    ${right}
    <path d="M 172 ${rowY(0)} C 240 ${rowY(0)}, 236 ${rowY(2)}, 282 ${rowY(2)}" stroke="var(--m-accent)" stroke-width="2.5" fill="none"/>
    <path d="M 284 ${rowY(2)} l -9 -5 v 10 z" fill="var(--m-accent)"/>
    <path d="M 172 ${rowY(1)} C 238 ${rowY(1)}, 234 ${rowY(4)}, 282 ${rowY(4)}" stroke="var(--m-accent)" stroke-width="2.5" fill="none" opacity=".65"/>
    <path d="M 284 ${rowY(4)} l -9 -5 v 10 z" fill="var(--m-accent)" opacity=".65"/>
    <text x="230" y="272" fill="var(--m-ink)" text-anchor="middle" font-size="15">
      Where their strengths land in your pattern
    </text>
    <text x="230" y="294" fill="var(--m-muted)" text-anchor="middle" font-size="14">
      decides how the relationship feels — in each direction separately.
    </text>
  </g>
</svg>`;
})();

/* ------------------------------------------------------------------ *
 * Audience-card glyphs, echoing the app's glyph language: people are a
 * head and a shoulder arc, attention is a beam or a fan, a mind is a
 * molecule of four beads sized by rank. Self-contained copies on
 * purpose — this page ships no app code, so the drawings are restated
 * here in the marketing palette. Original artwork.
 * ------------------------------------------------------------------ */
const gPerson = (cx: number, cy: number, r: number, colour = "var(--m-ink)", w = 3.6) => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${colour}"/>
  <path d="M ${cx - r * 1.9} ${cy + r * 3.1} A ${r * 1.9} ${r * 1.9} 0 0 1 ${cx + r * 1.9} ${cy + r * 3.1}"
        stroke="${colour}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;

/** One person, one beam, one held point — the structured mirror. */
const GLYPH_COACH = `
<svg viewBox="0 0 96 64" fill="none" aria-hidden="true">
  <path d="M 48 36 L 41 12 Q 48 7, 55 12 Z" fill="var(--m-accent)" opacity=".22"/>
  <circle cx="48" cy="11" r="6" fill="var(--m-accent)"/>
  <circle cx="48" cy="11" r="2" fill="var(--m-paper)" opacity=".6"/>
  ${gPerson(48, 42, 6.5)}
</svg>`;

/** Three people, three directed lines — the group as a web. */
const GLYPH_TEAM = `
<svg viewBox="0 0 96 64" fill="none" aria-hidden="true">
  <path d="M 30 20 Q 48 8 66 20" stroke="var(--m-accent)" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M 27 34 Q 34 46 42 52" stroke="var(--m-accent)" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
  <path d="M 69 34 Q 62 46 54 52" stroke="var(--m-rose)" stroke-width="2.4" stroke-linecap="round"/>
  ${gPerson(24, 20, 5.4)}
  ${gPerson(72, 20, 5.4)}
  ${gPerson(48, 44, 5.4)}
</svg>`;

/** Two people, one arrow each way — both directions, separately. */
const GLYPH_PAIR = `
<svg viewBox="0 0 96 64" fill="none" aria-hidden="true">
  <path d="M 34 22 H 58" stroke="var(--m-accent)" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M 62 22 l -8 -4.5 v 9 z" fill="var(--m-accent)"/>
  <path d="M 62 32 H 38" stroke="var(--m-rose)" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M 34 32 l 8 -4.5 v 9 z" fill="var(--m-rose)"/>
  ${gPerson(22, 24, 5.8)}
  ${gPerson(74, 24, 5.8, "var(--m-ink)", 3.6)}
</svg>`;

/** Four beads sized by rank, crossed bonds — one mind as a molecule. */
const GLYPH_SELF = `
<svg viewBox="0 0 96 64" fill="none" aria-hidden="true">
  <line x1="34" y1="22" x2="64" y2="50" stroke="var(--m-muted)" stroke-width="2" opacity=".5"/>
  <line x1="66" y1="26" x2="36" y2="50" stroke="var(--m-muted)" stroke-width="2" opacity=".5"/>
  <circle cx="34" cy="22" r="11" fill="var(--m-accent)"/>
  <circle cx="66" cy="26" r="8.6" fill="var(--m-accent)" opacity=".75"/>
  <circle cx="36" cy="50" r="6.2" fill="var(--m-rose)" opacity=".8"/>
  <circle cx="64" cy="50" r="4.6" fill="var(--m-rose)" opacity=".55"/>
</svg>`;

const TITLE = "Octant — see how minds mesh";
const DESCRIPTION =
  "Octant maps how people think and how those patterns fit together — both directions of " +
  "every relationship, whole-team dynamics, and a growth path for each person. " +
  "For coaches, teams, and anyone who takes their relationships seriously.";

/** The complete public landing page. */

/* ------------------------------------------------------------------ *
 * THE SHARED CHROME.
 *
 * Extracted when a second public page (/partners) appeared, because the
 * alternative was a second copy of 120 lines of CSS that would drift
 * away from this one. Both public pages are complete, self-contained
 * documents with no reference to the app bundle — that property is what
 * lets them be served ahead of the wall, and it is asserted per page in
 * tests/marketing.test.ts and tests/partners.test.ts.
 *
 * `home` threads through the nav builders because the front page's links
 * are in-page anchors and every other page has to reach them through /.
 * ------------------------------------------------------------------ */

/** Every rule both public pages share. Page-specific rules are appended per page. */
export const SITE_CSS = `  :root {
    color-scheme: light dark;
    --m-paper:#FDFCFA; --m-surface:#FFFFFF; --m-soft:#F4F1EA;
    --m-ink:#1A1714; --m-ink2:#4C463D; --m-muted:#6B6459;
    --m-rule:#E3DED4; --m-accent:#6B3BC4; --m-accent-ink:#4B2A8F;
    --m-accent-soft:#F0E9FC; --m-on:#fff; --m-rose:#C2477F;
    --serif:"Newsreader",Georgia,"Times New Roman",serif;
    --sans:"Inter",system-ui,-apple-system,sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --m-paper:#141310; --m-surface:#1D1B17; --m-soft:#24211C;
      --m-ink:#EDE9E1; --m-ink2:#B6AFA3; --m-muted:#8E8779;
      --m-rule:#2E2A24; --m-accent:#C9A0FF; --m-accent-ink:#DCC0FF;
      --m-accent-soft:#241B33; --m-on:#1A1714; --m-rose:#E487B4;
    }
  }
  * { box-sizing: border-box; }
  html { overflow-x: clip; scroll-behavior: smooth; }
  body {
    margin:0; background:var(--m-paper); color:var(--m-ink);
    font:400 19px/1.65 var(--serif);
    -webkit-font-smoothing:antialiased;
  }
  .wrap { max-width:1120px; margin:0 auto; padding:0 24px; }
  h1,h2,h3 { line-height:1.15; letter-spacing:-0.015em; font-weight:500; margin:0 0 16px; }
  h1 { font-size:clamp(38px,6vw,58px); }
  h2 { font-size:clamp(28px,4vw,38px); margin-top:0; }
  h3 { font-size:22px; }
  p { margin:0 0 16px; max-width:64ch; }
  a { color:var(--m-accent-ink); }
  .sans { font-family:var(--sans); }
  .muted { color:var(--m-muted); }
  .small { font-family:var(--sans); font-size:15px; line-height:1.55; }

  header.top {
    position:sticky; top:0; z-index:10;
    background:color-mix(in srgb, var(--m-paper) 90%, transparent);
    backdrop-filter:blur(10px);
    border-bottom:1px solid var(--m-rule);
  }
  .top-inner { display:flex; align-items:center; gap:24px; padding:14px 0; }
  .brand { display:flex; align-items:center; gap:10px; text-decoration:none; color:inherit;
           font-size:22px; font-weight:500; letter-spacing:-0.02em; }
  nav.mnav { margin-left:auto; display:flex; gap:4px; align-items:center; flex-wrap:wrap; }
  nav.mnav a {
    font-family:var(--sans); font-size:15px; font-weight:500; color:var(--m-ink2);
    text-decoration:none; padding:8px 12px; border-radius:6px;
  }
  nav.mnav a:hover { background:var(--m-soft); color:var(--m-ink); }
  .btn {
    display:inline-block; font-family:var(--sans); font-size:16px; font-weight:500;
    padding:12px 22px; border-radius:8px; text-decoration:none; line-height:1.2;
    border:1px solid var(--m-rule); color:var(--m-ink);
  }
  .btn.primary { background:var(--m-accent); color:var(--m-on); border-color:var(--m-accent); }
  .btn.primary:hover { filter:brightness(1.06); }
  .btn:hover { border-color:var(--m-muted); }
  @media (max-width:640px){ .hide-sm { display:none; } }

  .hero { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);
          gap:48px; align-items:center; padding:72px 0 56px; }
  @media (max-width:900px){ .hero { grid-template-columns:minmax(0,1fr); padding-top:48px; } }
  .hero .lede { font-size:22px; color:var(--m-ink2); }
  .cta-row { display:flex; gap:12px; flex-wrap:wrap; margin-top:28px; align-items:center; }
  .cta-note { font-family:var(--sans); font-size:14px; color:var(--m-muted); flex-basis:100%; }
  .art { background:var(--m-surface); border:1px solid var(--m-rule); border-radius:14px;
         padding:20px; box-shadow:0 1px 2px rgba(26,23,20,.05), 0 12px 32px rgba(26,23,20,.06); }
  .art svg { width:100%; height:auto; display:block; }

  section { padding:56px 0; }
  section.alt { background:var(--m-surface); border-top:1px solid var(--m-rule);
                border-bottom:1px solid var(--m-rule); }
  .kicker { font-family:var(--sans); font-size:14px; font-weight:600; letter-spacing:.04em;
            text-transform:uppercase; color:var(--m-accent-ink); margin-bottom:10px; }
  .cols { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px; margin-top:32px; }
  .card { background:var(--m-surface); border:1px solid var(--m-rule); border-radius:12px; padding:24px; }
  section.alt .card { background:var(--m-paper); }
  .card h3 { margin-bottom:8px; }
  .card p { font-family:var(--sans); font-size:15.5px; line-height:1.6; color:var(--m-ink2); margin:0; }
  .card .pain { display:block; font-family:var(--sans); font-size:14px; color:var(--m-rose);
                font-weight:600; margin-bottom:6px; }
  .card .glyph { display:block; height:56px; margin-bottom:14px; }
  .card .glyph svg { height:100%; width:auto; display:block; }

  .steps { counter-reset:step; display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
           gap:20px; margin-top:32px; }
  .step { counter-increment:step; border-top:2px solid var(--m-accent); padding-top:14px; }
  .step::before { content:"0" counter(step); font-family:var(--sans); font-weight:600;
                  color:var(--m-accent-ink); display:block; margin-bottom:6px; font-size:14px; }
  .step h3 { font-size:20px; margin-bottom:6px; }
  .step p { font-family:var(--sans); font-size:15.5px; color:var(--m-ink2); margin:0; }

  .price-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
                gap:24px; margin-top:36px; max-width:760px; }
  .price { background:var(--m-surface); border:1px solid var(--m-rule); border-radius:14px;
           padding:32px 28px; display:flex; flex-direction:column; gap:0; }
  .price.featured { border-color:var(--m-accent); box-shadow:0 0 0 1px var(--m-accent); }
  .price .amount { font-size:44px; font-weight:500; letter-spacing:-0.02em; }
  .price .amount span { font-family:var(--sans); font-size:15px; color:var(--m-muted); font-weight:400; }
  .price ul { list-style:none; margin:20px 0 28px; padding:0; font-family:var(--sans);
              font-size:15.5px; line-height:1.6; color:var(--m-ink2); }
  .price li { padding-left:24px; position:relative; margin-bottom:10px; }
  .price li::before { content:"✓"; position:absolute; left:0; color:var(--m-accent-ink); font-weight:600; }
  .price .btn { margin-top:auto; text-align:center; }

  .honest { border-left:3px solid var(--m-accent); background:var(--m-accent-soft);
            border-radius:0 10px 10px 0; padding:20px 24px; margin-top:36px; max-width:760px; }
  .honest p { margin:0; font-size:17px; }

  footer { border-top:1px solid var(--m-rule); padding:40px 0 56px; margin-top:24px; }
  .foot { display:flex; gap:24px; flex-wrap:wrap; align-items:flex-start;
          font-family:var(--sans); font-size:14px; color:var(--m-muted); }
  .foot .brand { font-size:18px; }
  .foot nav { display:flex; gap:16px; flex-wrap:wrap; margin-left:auto; }
  .foot a { color:var(--m-muted); text-decoration:none; }
  .foot a:hover { color:var(--m-ink); }
  .legal { margin-top:20px; font-family:var(--sans); font-size:13.5px; color:var(--m-muted);
           max-width:80ch; line-height:1.6; }`;

/** The <head> contents, minus the <style> block. */
export function siteHead(o: {
  title: string;
  description: string;
  origin: string;
  path: string;
}): string {
  const url = `${o.origin}${o.path}`;
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${o.title}</title>
<meta name="description" content="${o.description}">
<link rel="canonical" href="${url}">
<link rel="icon" href="${FAVICON}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#FDFCFA" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#141310" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:title" content="${o.title}">
<meta property="og:description" content="${o.description}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Octant">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${o.title}">
<meta name="twitter:description" content="${o.description}">`;
}

/** The sticky masthead. On the front page the section links are bare anchors. */
export function siteHeader(home: boolean): string {
  const at = home ? "" : "/";
  return `<header class="top">
  <div class="wrap top-inner">
    <a class="brand" href="/">${MARK(30)} Octant</a>
    <nav class="mnav" aria-label="Site">
      <a href="${at}#product" class="hide-sm">Product</a>
      <a href="${at}#uses" class="hide-sm">Who it&rsquo;s for</a>
      <a href="${at}#pricing">Pricing</a>
      <a href="/partners"${home ? ' class="hide-sm"' : ""}>Partners</a>
      <a href="/signin">Sign in</a>
      <a class="btn primary" href="${home ? "#pricing" : "/#pricing"}">Get started</a>
    </nav>
  </div>
</header>`;
}

/** The footer, including the standing legal notice both pages carry. */
export function siteFooter(home: boolean): string {
  const at = home ? "" : "/";
  return `<footer>
  <div class="wrap">
    <div class="foot">
      <span class="brand">${MARK(22)} Octant</span>
      <nav aria-label="Footer">
        <a href="${at}#product">Product</a>
        <a href="${at}#uses">Who it&rsquo;s for</a>
        <a href="${at}#pricing">Pricing</a>
        <a href="${at}#about">About</a>
        <a href="/partners">Partners</a>
        <a href="/signin">Sign in</a>
      </nav>
    </div>
    <p class="legal">
      \u00a9 ${new Date().getFullYear()} Stratfield Partners LLC. All rights reserved. Octant is an
      educational and self-development instrument. It is not a medical, psychological or
      psychiatric assessment, does not provide diagnoses or treatment, and must not be used as
      the basis for employment, credit, insurance or other consequential decisions about any
      person.
    </p>
  </div>
</footer>`;
}

export function marketingPage(origin: string): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
${siteHead({ title: TITLE, description: DESCRIPTION, origin, path: "/" })}
<style>${SITE_CSS}</style>
</head>
<body>

${siteHeader(true)}

<main>
  <div class="wrap hero">
    <div>
      <h1>See how minds mesh.</h1>
      <p class="lede">
        Most of what looks like personality is a pattern — a running order of eight habits of
        mind, different in each of us, meshing with each other in ways that are predictable once
        you can see them. Octant is the instrument for seeing them.
      </p>
      <div class="cta-row">
        <a class="btn primary" href="#pricing">Start now — $25/user·mo</a>
        <a class="btn" href="#product">See how it works</a>
        <a class="btn" href="/onramp">Not sure yet? Take the two-minute quiz</a>
        <span class="cta-note">Cancel anytime. Paid access unlocks the moment checkout clears.</span>
      </div>
    </div>
    <div class="art">${HERO_ART}</div>
  </div>

  <section id="problem">
    <div class="wrap">
      <p class="kicker">The problem</p>
      <h2>Personality tools stop where the real questions start.</h2>
      <p class="muted">
        Knowing someone&rsquo;s &ldquo;type&rdquo; was never the point. The point is what happens
        when two particular patterns meet — at work, at home, in a room of six.
      </p>
      <div class="cols">
        <div class="card">
          <span class="pain">One number hides the story</span>
          <h3>Compatibility isn&rsquo;t symmetric</h3>
          <p>
            A single compatibility score is a fiction: many relationships are genuinely easy from
            one side and expensive from the other — and the person on the heavier side usually
            can&rsquo;t tell it&rsquo;s happening. Octant scores every relationship in <em>both
            directions</em> and names the asymmetry when there is one.
          </p>
        </div>
        <div class="card">
          <span class="pain">Descriptions are horoscopes</span>
          <h3>Labels don&rsquo;t explain anything</h3>
          <p>
            A paragraph about &ldquo;your type&rdquo; can&rsquo;t tell you why one colleague
            energizes you and another exhausts you doing the same job. Octant derives every
            reading from the same underlying structure, so it can show you the <em>mechanism</em> —
            where their strengths land in your pattern — not just an adjective.
          </p>
        </div>
        <div class="card">
          <span class="pain">Teams are more than pairs</span>
          <h3>Group dynamics stay invisible</h3>
          <p>
            Team workshops end with everyone knowing their letters and nothing changing. A group
            is a web of directed relationships — who quietly corrects whom, who absorbs it, who
            holds the room together. Octant draws that web and does the arithmetic on it.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section class="alt" id="product">
    <div class="wrap">
      <p class="kicker">The instrument</p>
      <h2>Everything is derived, so everything agrees.</h2>
      <p class="muted">
        Sixteen cognitive patterns generate 256 directed relationships, four sides of every mind,
        a growth path for each, and whole-group readings — all computed from one small piece of
        structure, never looked up in a table. Nothing can quietly contradict anything else, and
        every claim can show its work.
      </p>
      <div class="cols">
        <div class="card">
          <h3>Read one mind</h3>
          <p>
            The full pattern: what someone leads with, what they quietly fear, how they grow,
            what they look like at their best and their worst — in plain language first, with the
            exact mechanics one click underneath.
          </p>
        </div>
        <div class="card">
          <h3>Read a pair</h3>
          <p>
            What the relationship actually is, how easy it is in each direction, where you will
            misread each other, and a concrete playbook for handling them well.
          </p>
        </div>
        <div class="card">
          <h3>Compose a group</h3>
          <p>
            Add a team, a family, a founding trio. Get the average ease, the hardest single
            direction, the one-way correction chains — and which addition would most improve
            the room.
          </p>
        </div>
        <div class="card">
          <h3>Learn it properly</h3>
          <p>
            A built-in thirteen-stage course takes you from &ldquo;what is a habit of mind&rdquo;
            to reading whole groups, every concept drawn as a diagram, plus an assistant that
            answers questions from the instrument&rsquo;s own model — not from internet folklore.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section id="uses">
    <div class="wrap">
      <p class="kicker">Who it&rsquo;s for</p>
      <h2>Built for people whose work is other people.</h2>
      <div class="cols">
        <div class="card">
          <span class="glyph">${GLYPH_COACH}</span>
          <h3>Coaches &amp; practitioners</h3>
          <p>
            Give clients a structured mirror: why the same feedback lands on one person and
            wounds another, what their growth edge actually is, and language for patterns they
            have felt for years but never had words for.
          </p>
        </div>
        <div class="card">
          <span class="glyph">${GLYPH_TEAM}</span>
          <h3>Teams &amp; founders</h3>
          <p>
            See the friction before it has a name. Understand why two strong people keep
            colliding, who is absorbing corrections nobody means to issue, and what kind of
            person the room is missing.
          </p>
        </div>
        <div class="card">
          <span class="glyph">${GLYPH_PAIR}</span>
          <h3>Partners &amp; families</h3>
          <p>
            The same argument, every time, with the same person? Read the pairing in both
            directions and get a playbook — what to lead with, what to stop doing, and why it
            works.
          </p>
        </div>
        <div class="card">
          <span class="glyph">${GLYPH_SELF}</span>
          <h3>Anyone reading themselves</h3>
          <p>
            Eight either-or questions find your pattern. Then the interesting part: your four
            sides, the fear your life is quietly organised around, and the door your growth
            actually goes through.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section class="alt" id="how">
    <div class="wrap">
      <p class="kicker">How it works</p>
      <h2>Three steps to a reading you can act on.</h2>
      <div class="steps">
        <div class="step">
          <h3>Find the pattern</h3>
          <p>
            Eight plain either-or questions — no scoring you can fail. Four decide the pattern,
            four cross-check it, and you watch the field narrow as you answer.
          </p>
        </div>
        <div class="step">
          <h3>Read the wiring</h3>
          <p>
            Open any person, any pair. Plain English on top, precise mechanics underneath,
            diagrams for every concept — nothing asserted that can&rsquo;t be shown.
          </p>
        </div>
        <div class="step">
          <h3>Compose the room</h3>
          <p>
            Put your real team, family or partnership in, and get readings you can check against
            what you already know about them — then the ones you didn&rsquo;t see coming.
          </p>
        </div>
      </div>
      <div class="honest">
        <p>
          <strong>A lens, not a measurement.</strong> Octant describes how patterns of attention
          and judgement tend to mesh. It does not measure ability, diagnose anything, or tell you
          who to hire, date or forgive — and we say so on every surface where it matters. Tools
          that promise more than this are overpromising.
        </p>
      </div>
    </div>
  </section>

  <section id="pricing">
    <div class="wrap">
      <p class="kicker">Pricing</p>
      <h2>One plan. Everything included.</h2>
      <p class="muted">No tiers, no feature gates, no per-report fees.</p>
      <div class="price-grid">
        <div class="price featured">
          <h3 class="sans" style="font-size:17px;font-weight:600">Individual &amp; small team</h3>
          <div class="amount">$25 <span>per user / month</span></div>
          <ul>
            <li>All sixteen pattern readings, in full</li>
            <li>All 256 pair readings, both directions</li>
            <li>Group composition &amp; team graphs</li>
            <li>The complete thirteen-stage course</li>
            <li>The grounded assistant</li>
            <li>Cancel anytime</li>
          </ul>
          <a class="btn primary" href="${STRIPE_LINK}">Start now</a>
          <p class="small muted" style="margin:12px 0 0">
            Checkout via Stripe. Payment unlocks your account automatically — sign in with
            Google right after and you&rsquo;re straight in.
          </p>
        </div>
        <div class="price">
          <h3 class="sans" style="font-size:17px;font-weight:600">Business</h3>
          <div class="amount" style="font-size:34px">Let&rsquo;s talk</div>
          <ul>
            <li>Volume licensing</li>
            <li>Team onboarding &amp; facilitated readings</li>
            <li>Invoicing</li>
            <li>Priority support</li>
          </ul>
          <a class="btn" href="${BUSINESS_MAILTO}">Enquire</a>
          <p class="small muted" style="margin:12px 0 0">
            Tell us how many people and what you&rsquo;re trying to see.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section class="alt" id="about">
    <div class="wrap">
      <p class="kicker">About</p>
      <h2>Built by Stratfield Partners.</h2>
      <p>
        Octant is built and operated by <strong>Stratfield Partners LLC</strong>. We built it
        because the tools in this space kept stopping at the label — and the useful questions
        are always about what happens <em>between</em> people. The instrument is opinionated
        about honesty: where the underlying model is settled, Octant derives it and shows the
        derivation; where it is not, Octant says so on the page instead of papering over it.
      </p>
      <p class="small muted">
        Questions, business enquiries, or press: <a href="${BUSINESS_MAILTO}">nick@stratfieldpartners.com</a>
      </p>
    </div>
  </section>
</main>

${siteFooter(true)}

</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Public and cacheable, briefly — this page changes only on deploy.
      "cache-control": "public, max-age=300",
    },
  });
}
