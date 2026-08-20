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
export const MARK = (size: number, stroke = "currentColor", accent = "#4C4899") => `
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
    `<rect x="14" y="14" width="36" height="36" rx="5" stroke="#4C4899" stroke-width="4"/>` +
    `<rect x="14" y="14" width="36" height="36" rx="5" stroke="#4C4899" stroke-width="4" opacity=".5" transform="rotate(45 32 32)"/>` +
    `<circle cx="32" cy="32" r="7" fill="#4C4899"/></svg>`,
  );

/** Stripe payment link — Octant Individual, $25 per user / month, quantity adjustable. */
export const STRIPE_LINK = "https://buy.stripe.com/6oU7sM4Tnd4PdyU1nocfK00";
const BUSINESS_MAILTO =
  "mailto:nick@stratfieldpartners.com?subject=Octant%20for%20our%20team";

/* ------------------------------------------------------------------ *
 * The deck's one mark, restated for this self-contained page: a
 * two-letter element code in a filled disc, four ripples on the
 * diagonals with crests breaking outward for e and inward for i.
 * Verbatim geometry from the print deck and the app's FnDisc; the hues
 * come from the --m-* element variables so both themes hold.
 * ------------------------------------------------------------------ */
function disc(fn: string, size: number): string {
  const out = fn[1] === "e";
  const R = 15, C = 22.5;
  const arcR = out ? R * 1.22 : R * 1.3;
  const span = out ? 0.42 : 0.4;
  const tipR = out ? R * 1.5 : R * 1.04;
  const hue = `var(--m-${fn.toLowerCase()})`;
  const P = (r: number, a: number) => `${(C + r * Math.cos(a)).toFixed(1)} ${(C + r * Math.sin(a)).toFixed(1)}`;
  let ripples = "";
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    ripples += `<path d="M ${P(arcR, a - span)} A ${arcR.toFixed(1)} ${arcR.toFixed(1)} 0 0 1 ${P(arcR, a + span)}" stroke="${hue}" stroke-width="1.3" stroke-opacity=".45" fill="none" stroke-linecap="round"/>`;
    ripples += `<path d="M ${P(arcR, a - 0.13)} L ${P(tipR, a)} L ${P(arcR, a + 0.13)} Z" fill="${hue}" fill-opacity=".55"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 45 45" aria-hidden="true">${ripples}
  <circle cx="22.5" cy="22.5" r="15" fill="${hue}"/>
  <text x="22.5" y="23.2" text-anchor="middle" dominant-baseline="central" font-family="Inter,system-ui,sans-serif" font-size="14.6" font-weight="700" fill="var(--m-paper)">${fn}</text></svg>`;
}

/** The alphabet band: eight named discs in their four families, one caption. */
const ALPHABET = `
<div class="alphabet" role="img" aria-label="The eight elements in their four families: Ne and Ni, Se and Si, Te and Ti, Fe and Fi — indigo intuition, sienna sensing, verdigris thinking, madder feeling. Ripples break outward on the e forms and inward on the i forms.">
  ${(["NeNi", "SeSi", "TeTi", "FeFi"] as const)
    .map((fam) => `<span class="fam">${disc(fam.slice(0, 2), 44)}${disc(fam.slice(2), 44)}</span>`)
    .join("\n  ")}
</div>
<p class="alphabet-cap">The eight elements every reading is spelled in &mdash; indigo N, sienna S, verdigris T, madder F &middot; ripples break out for e, in for i.</p>`;

/** The two-stacks-with-arrows hero drawing — the product's core idea, inline. */

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

/** Four beads sized by rank, crossed bonds — one mind as a molecule. The
 * beads carry a real stack's own element hues (ENTP: Ne, Ti, Fe, Si), the
 * same convention every molecule in the app draws with. */
const GLYPH_SELF = `
<svg viewBox="0 0 96 64" fill="none" aria-hidden="true">
  <line x1="34" y1="22" x2="64" y2="50" stroke="var(--m-muted)" stroke-width="2" opacity=".5"/>
  <line x1="66" y1="26" x2="36" y2="50" stroke="var(--m-muted)" stroke-width="2" opacity=".5"/>
  <circle cx="34" cy="22" r="11" fill="var(--m-ne)"/>
  <circle cx="66" cy="26" r="8.6" fill="var(--m-ti)"/>
  <circle cx="36" cy="50" r="6.2" fill="var(--m-fe)"/>
  <circle cx="64" cy="50" r="4.6" fill="var(--m-si)"/>
</svg>`;

/* The hero shows an actual reading rather than an illustration of one. Both
 * scores are ease() output for this pair and both descriptions are that
 * relation's own REL_DEF gloss, so the panel cannot drift away from what the
 * app would say on /pair/ENTP/INFP. It is HTML and not SVG on purpose: the
 * text reflows on a phone, stays selectable and is read out in order. */
const HERO_READING = `
<div class="reading" role="figure" aria-label="A worked reading of the ENTP and INFP pair, scored in both directions">
  <div class="reading-top">
    <span class="mono rlabel">Worked example</span>
    <span class="rdiscs" aria-hidden="true">${disc("Ne", 32)}${disc("Fi", 32)}</span>
    <span class="mono rpair">ENTP &middot; INFP</span>
  </div>

  <div class="dir">
    <div class="dir-head">
      <span class="mono way">ENTP &rarr; INFP</span>
      <span class="rel">Examined</span>
      <span class="mono val">44</span>
    </div>
    <div class="meter" aria-hidden="true"><span style="width:44%"></span></div>
    <p>Your leading function lands on their Blind spot; you can flatten them without noticing.</p>
  </div>

  <div class="dir">
    <div class="dir-head">
      <span class="mono way">INFP &rarr; ENTP</span>
      <span class="rel">Examiner</span>
      <span class="mono val">34</span>
    </div>
    <div class="meter" aria-hidden="true"><span style="width:34%"></span></div>
    <p>Their leading function lands on your Blind spot; their casual remarks land as verdicts.</p>
  </div>

  <p class="reading-foot">
    Same two people. Ten points apart, and only one of them can feel it.
  </p>
</div>`;

const TITLE = "Octant — compatibility runs in two directions";
const DESCRIPTION =
  "A single compatibility score is a fiction. Octant scores every relationship in both " +
  "directions separately, derives all 256 ordered pairs from one small piece of structure " +
  "rather than a lookup table, and shows the derivation behind every number.";

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
    --m-ink:#241F19; --m-ink2:#4C463D; --m-muted:#6B6459;
    --m-rule:#E3DED4; --m-accent:#4C4899; --m-accent-ink:#373474;
    --m-accent-soft:#ECEBF7; --m-on:#fff; --m-rose:#983E4A;
    /* The Pigment palette's eight elements — the deck's own hues, both
       themes, so every drawing on this page speaks the product's colour
       language: indigo N, raw sienna S, verdigris T, madder F. */
    --m-ne:#4C4899; --m-ni:#373474; --m-se:#855723; --m-si:#694521;
    --m-te:#326758; --m-ti:#244C43; --m-fe:#983E4A; --m-fi:#762E37;
    --serif:"Newsreader",Georgia,"Times New Roman",serif;
    --sans:"Inter",system-ui,-apple-system,sans-serif;
    --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --m-paper:#141310; --m-surface:#1D1B17; --m-soft:#24211C;
      --m-ink:#EDE9E1; --m-ink2:#B6AFA3; --m-muted:#8E8779;
      --m-rule:#2E2A24; --m-accent:#A8A6D3; --m-accent-ink:#C6C4E8;
      --m-accent-soft:#1F2033; --m-on:#241F19; --m-rose:#DAA0A7;
      --m-ne:#A8A6D3; --m-ni:#8986BB; --m-se:#D0AE80; --m-si:#B9946A;
      --m-te:#81BBA8; --m-ti:#67A290; --m-fe:#DAA0A7; --m-fi:#C18189;
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
  /* Longhand, deliberately: this element is class="wrap top-inner", and a
     padding shorthand here has the same specificity as .wrap's and wins by
     order -- which silently zeroed the 24px side padding and ran the masthead
     flush to both screen edges at every width. */
  .top-inner { display:flex; align-items:center; gap:24px;
               padding-top:14px; padding-bottom:14px; }
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

  /* ---- the compact menu ------------------------------------------- *
   * CSS only, on purpose. The CSP pins script-src to 'self' plus three
   * named sha256 hashes (headers.ts), so a menu built on JS would mean a
   * fourth pinned hash for a disclosure widget the platform already
   * provides. <details>/<summary> is focusable and toggles on Enter and
   * Space with no script at all.
   *
   * Below the breakpoint the inline links are hidden and reappear stacked
   * in the panel -- they are never simply removed, which is what the old
   * hide-sm nav did: Product, Who it's for and Partners were display:none
   * on a phone with nothing to open in their place.
   * ------------------------------------------------------------------ */
  .mmenu { display:none; position:static; }
  .mmenu > summary {
    display:flex; align-items:center; justify-content:center;
    width:44px; height:44px; margin-left:4px; border-radius:8px;
    color:var(--m-ink); cursor:pointer; list-style:none;
    border:1px solid var(--m-rule); background:var(--m-surface);
  }
  .mmenu > summary::-webkit-details-marker { display:none; }
  .mmenu > summary::marker { content:""; }
  .mmenu > summary:hover { border-color:var(--m-muted); }
  .mmenu > summary:focus-visible { outline:2px solid var(--m-accent); outline-offset:2px; }
  /* The bars become an X while open, so the control reports its own state. */
  .mmenu[open] > summary .bar-t { transform:translateY(6px) rotate(45deg); }
  .mmenu[open] > summary .bar-b { transform:translateY(-6px) rotate(-45deg); }
  .mmenu[open] > summary .bar-m { opacity:0; }
  .mmenu > summary svg path { transform-origin:center; transition:transform .18s ease, opacity .18s ease; }
  @media (prefers-reduced-motion: reduce) {
    .mmenu > summary svg path { transition:none; }
  }
  .mmenu-panel {
    position:absolute; left:0; right:0; top:100%;
    display:flex; flex-direction:column;
    background:var(--m-paper); border-bottom:1px solid var(--m-rule);
    box-shadow:0 12px 28px rgba(26,23,20,.10);
    max-height:calc(100vh - 68px); overflow-y:auto;
    padding:8px 0 12px;
  }
  .mmenu-panel a {
    font-family:var(--sans); font-size:17px; font-weight:500; color:var(--m-ink);
    text-decoration:none; padding:14px 24px; min-height:48px;
    display:flex; align-items:center; border-bottom:1px solid var(--m-rule);
  }
  .mmenu-panel a:last-child { border-bottom:none; }
  .mmenu-panel a:hover { background:var(--m-soft); }

  /* One breakpoint for the swap. Six items need more room than 640px. */
  @media (max-width:860px){
    nav.mnav a:not(.btn) { display:none; }
    .mmenu { display:block; }
  }

  /* Longhand: this is class="wrap hero", so a padding shorthand would beat
     .wrap's side gutters by order and run the hero flush to both edges. */
  .hero { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);
          gap:48px; align-items:center; padding-top:72px; padding-bottom:56px; }
  @media (max-width:900px){ .hero { grid-template-columns:minmax(0,1fr); padding-top:48px; } }
  .hero .lede { font-size:22px; color:var(--m-ink2); }
  .cta-row { display:flex; gap:12px; flex-wrap:wrap; margin-top:28px; align-items:center; }
  @media (max-width:560px){
    /* Side-by-side buttons below ~560px leave a target too narrow to hit
       cleanly, and the labels wrap mid-phrase. Stack them full width. */
    .cta-row .btn { flex:1 1 100%; text-align:center; padding:14px 22px; }
  }
  .cta-note { font-family:var(--sans); font-size:14px; color:var(--m-muted); flex-basis:100%; }
  .art { background:var(--m-surface); border:1px solid var(--m-rule); border-radius:14px;
         padding:20px; box-shadow:0 1px 2px rgba(26,23,20,.05), 0 12px 32px rgba(26,23,20,.06); }
  .art svg { width:100%; height:auto; display:block; }

  /* ---- the worked reading, and the proof band ---------------------- *
   * Violet is spent here and almost nowhere else now: the scores, the
   * meters and the proof figures are the reading, and everything around
   * them sits in warm neutral so the accent still means something.
   * ------------------------------------------------------------------ */
  .mono { font-family:var(--mono); font-variant-numeric:tabular-nums; }

  .reading { background:var(--m-surface); border:1px solid var(--m-rule); border-radius:14px;
             padding:22px 24px 20px;
             box-shadow:0 1px 2px rgba(26,23,20,.05), 0 12px 32px rgba(26,23,20,.06); }
  .reading-top { display:flex; align-items:center; justify-content:space-between; gap:12px;
                 padding-bottom:14px; border-bottom:1px solid var(--m-rule); }
  .rdiscs { display:flex; gap:6px; margin-left:auto; }
  .rdiscs svg { display:block; }
  .reading-top .rpair { margin-left:0; }

  /* ---- the alphabet band ------------------------------------------- *
   * The deck's eight named discs, family by family, under the hero: the
   * product's entire colour language declared before the first section
   * asks anyone to read it.
   * ------------------------------------------------------------------ */
  .alphabet { display:flex; flex-wrap:wrap; gap:12px 28px; justify-content:center;
              padding:18px 0 0; }
  .alphabet .fam { display:flex; gap:8px; flex:0 0 auto; }
  .alphabet svg { display:block; }
  .alphabet-cap { text-align:center; font-family:var(--sans); font-size:13.5px;
                  color:var(--m-muted); margin:12px auto 18px; max-width:none; }
  .rlabel { font-size:11px; font-weight:500; letter-spacing:.12em; text-transform:uppercase;
            color:var(--m-muted); }
  .rpair { font-size:13px; font-weight:600; color:var(--m-ink); letter-spacing:.04em; }

  .dir { padding:16px 0 4px; border-bottom:1px solid var(--m-rule); }
  .dir:last-of-type { border-bottom:none; }
  .dir-head { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
  .dir-head .way { font-size:12.5px; font-weight:500; color:var(--m-ink2); letter-spacing:.02em; }
  .dir-head .rel { font-family:var(--sans); font-size:13px; font-weight:600; color:var(--m-ink); }
  .dir-head .val { margin-left:auto; font-size:26px; font-weight:500; color:var(--m-accent);
                   letter-spacing:-.02em; line-height:1; }
  .meter { height:4px; border-radius:2px; background:var(--m-soft); margin:10px 0 10px; overflow:hidden; }
  .meter span { display:block; height:100%; background:var(--m-accent); border-radius:2px; }
  .dir p { font-family:var(--sans); font-size:14.5px; line-height:1.55; color:var(--m-ink2);
           margin:0 0 4px; max-width:none; }
  .reading-foot { font-family:var(--sans); font-size:13.5px; color:var(--m-muted);
                  margin:14px 0 0; padding-top:14px; border-top:1px solid var(--m-rule); max-width:none; }

  .proof { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:22px 20px;
           padding:26px 0 30px; border-top:1px solid var(--m-rule); }
  .proof-item .pv { display:block; font-family:var(--mono); font-variant-numeric:tabular-nums;
                    font-size:26px; font-weight:500; letter-spacing:-.02em; color:var(--m-accent); }
  .proof-item .pk { display:block; font-family:var(--sans); font-size:13px; line-height:1.45;
                    color:var(--m-ink2); margin-top:6px; }

  @media (max-width:560px){
    .reading { padding:18px 18px 16px; }
    .dir-head .val { font-size:23px; }
    .proof { gap:18px 16px; padding:22px 0 24px; }
    .proof-item .pv { font-size:22px; }
  }

  section { padding:56px 0; }
  section.alt { background:var(--m-surface); border-top:1px solid var(--m-rule);
                border-bottom:1px solid var(--m-rule); }
  .kicker { font-family:var(--sans); font-size:14px; font-weight:600; letter-spacing:.04em;
            text-transform:uppercase; color:var(--m-accent-ink); margin-bottom:10px; }
  .cols { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px; margin-top:32px; }
  /* Four cards in an auto-fit grid wrap 3+1 at desktop widths and strand the
     fourth on a row of its own. Pin any four-up set to a square instead. */
  .cols-2 { grid-template-columns:repeat(2,minmax(0,1fr)); }
  @media (max-width:760px){ .cols-2 { grid-template-columns:minmax(0,1fr); } }

  /* ---- the router -------------------------------------------------- *
   * The audience section used to be four co-equal pitches, which asked
   * the reader to work out which one they were. These are destinations:
   * breadth lives in the navigation now, not in the argument.
   * ------------------------------------------------------------------ */
  .router { display:grid; gap:0; margin-top:32px; border-top:1px solid var(--m-rule); }
  .route { display:flex; align-items:flex-start; gap:18px; padding:22px 4px;
           border-bottom:1px solid var(--m-rule); text-decoration:none; color:inherit; }
  .route:hover { background:var(--m-surface); }
  .route:focus-visible { outline:2px solid var(--m-accent); outline-offset:-2px; }
  .route .glyph { flex:0 0 auto; height:40px; width:40px; display:block; }
  .route .glyph svg { height:100%; width:auto; display:block; }
  .route-body { display:block; flex:1 1 auto; }
  .route-t { display:block; font-family:var(--sans); font-size:17px; font-weight:600;
             color:var(--m-ink); margin-bottom:4px; }
  .route-d { display:block; font-family:var(--sans); font-size:14.5px; line-height:1.55;
             color:var(--m-ink2); }
  .route-go { flex:0 0 auto; align-self:center; font-size:12.5px; font-weight:500;
              color:var(--m-accent-ink); white-space:nowrap; }
  @media (max-width:560px){
    .route { gap:14px; padding:18px 2px; flex-wrap:wrap; }
    .route .glyph { height:30px; width:30px; }
    .route-go { width:100%; align-self:flex-start; padding-left:44px; }
  }
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
<meta name="twitter:description" content="${o.description}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..500&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">`;
}

/** The sticky masthead. On the front page the section links are bare anchors. */
export function siteHeader(home: boolean): string {
  const at = home ? "" : "/";
  const links = [
    [`${at}#product`, "Product"],
    [`${at}#uses`, "Who it&rsquo;s for"],
    [`${at}#pricing`, "Pricing"],
    ["/compare", "Compared"],
    ["/partners", "Partners"],
    ["/signin", "Sign in"],
  ];
  const inline = links.map(([h, t]) => `<a href="${h}">${t}</a>`).join("\n      ");
  const stacked = links.map(([h, t]) => `<a href="${h}">${t}</a>`).join("\n        ");
  return `<header class="top">
  <div class="wrap top-inner">
    <a class="brand" href="/">${MARK(30)} Octant</a>
    <nav class="mnav" aria-label="Site">
      ${inline}
      <a class="btn primary" href="${home ? "#pricing" : "/#pricing"}">Get started</a>
    </nav>
    <details class="mmenu">
      <summary aria-label="Open menu" title="Menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path class="bar-t" d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path class="bar-m" d="M3 12h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path class="bar-b" d="M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </summary>
      <nav class="mmenu-panel" aria-label="Site, compact">
        ${stacked}
      </nav>
    </details>
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
        <a href="/compare">Compared</a>
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
      <h1>Compatibility runs in two directions.</h1>
      <p class="lede">
        A single compatibility score is a fiction. Most relationships are easier from one side
        than the other, and the person on the heavier side rarely knows it is happening. Octant
        scores every direction separately &mdash; and shows the derivation behind each number.
      </p>
      <div class="cta-row">
        <a class="btn primary" href="/onramp">Take the two-minute read</a>
        <a class="btn" href="#pricing">Pricing &mdash; $25/user&middot;mo</a>
        <span class="cta-note">Free, no account. Eight either-or questions, no scoring you can fail.</span>
      </div>
    </div>

    ${HERO_READING}
  </div>

  <div class="wrap">
    ${ALPHABET}
    <div class="proof">
      <div class="proof-item"><span class="pv">16</span><span class="pk">patterns generate every reading</span></div>
      <div class="proof-item"><span class="pv">256</span><span class="pk">ordered pairs, each scored twice</span></div>
      <div class="proof-item"><span class="pv">27%</span><span class="pk">of pairs differ by direction</span></div>
      <div class="proof-item"><span class="pv">128/128</span><span class="pk">agreement with an independent published table</span></div>
      <div class="proof-item"><span class="pv">r &minus;0.15</span><span class="pk">the survey matrix that disagrees, shipped anyway</span></div>
    </div>
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
      <div class="cols cols-2">
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
            A built-in fifteen-stage course takes you from &ldquo;what is a habit of mind&rdquo;
            to reading whole groups, every concept drawn as a diagram, plus an assistant that
            answers questions from the instrument&rsquo;s own model — not from internet folklore.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section id="uses">
    <div class="wrap">
      <p class="kicker">Where to start</p>
      <h2>One instrument. Four things people point it at.</h2>
      <p>
        The reading is the same mechanism every time. What changes is who you put into it &mdash;
        so pick the one you actually came for.
      </p>
      <div class="router">
        <a class="route" href="/onramp">
          <span class="glyph">${GLYPH_SELF}</span>
          <span class="route-body">
            <span class="route-t">Yourself</span>
            <span class="route-d">Eight either-or questions find your pattern. Then the four sides,
            the fear your life is quietly organised around, and the door your growth goes through.</span>
          </span>
          <span class="route-go mono">Free &rarr;</span>
        </a>
        <a class="route" href="#pricing">
          <span class="glyph">${GLYPH_PAIR}</span>
          <span class="route-body">
            <span class="route-t">One relationship</span>
            <span class="route-d">The same argument, every time, with the same person? Read the
            pairing in both directions and get a playbook for handling them well.</span>
          </span>
          <span class="route-go mono">Pricing &rarr;</span>
        </a>
        <a class="route" href="#pricing">
          <span class="glyph">${GLYPH_TEAM}</span>
          <span class="route-body">
            <span class="route-t">A team, a family, a founding trio</span>
            <span class="route-d">The group as a weighted directed graph: average ease, the hardest
            single direction, who absorbs corrections nobody means to issue.</span>
          </span>
          <span class="route-go mono">Pricing &rarr;</span>
        </a>
        <a class="route" href="/partners">
          <span class="glyph">${GLYPH_COACH}</span>
          <span class="route-body">
            <span class="route-t">Your own clients</span>
            <span class="route-d">Coaches, practitioners and consultants who want the relational
            layer inside what they already sell, under one of four arrangements.</span>
          </span>
          <span class="route-go mono">Partners &rarr;</span>
        </a>
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
            <li>The complete fifteen-stage course</li>
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
