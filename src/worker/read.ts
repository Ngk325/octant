import { REL, ease, stack, quadra, type MbtiType } from "../engine/core";
import {
  TYPES, REL_NAME, REL_DEF, ARCHETYPE, GROUP, INTERACTION_STYLE, FN_LONG, VIRTUE_VICE,
} from "../engine/data";
import { FN_ROLE } from "../engine/functions";
import { powersOf } from "../engine/powers";
import { soloRomance } from "../engine/romance";
import { escapeHtml } from "./html";

/* ------------------------------------------------------------------ *
 * THE READINGS — the public, SEO-facing articles.
 *
 * The app itself is behind the wall; this is the one other public
 * surface besides the marketing door. Every page here is DERIVED from
 * the same engine, at request time, exactly like the app — no database,
 * no stored copy, no article table to keep in sync. Ask for any of the
 * 136 URLs and the reading is composed on the spot.
 *
 * Two rules hold the line between "content" and "the instrument":
 *
 *   1. A SLICE, not the whole reading. Each page shows the relation and
 *      what it means in general (REL_DEF, which is authored and generic),
 *      the two ease scores as a headline, and a plain reading of the
 *      asymmetry those scores describe. Not one word of the composed
 *      playbook — the per-pair instrument, "lead with your Ne…" and the
 *      rest — appears here; it stays behind the wall, reached by the CTA.
 *      Publishing it would give away the thing the app charges for.
 *   2. Fully public and crawlable. Unlike the gated pages, which carry
 *      noindex and 401 to anonymous visitors, these are meant to be found:
 *      real <title>/description/canonical/OG, a sitemap, and internal links.
 *      They ship no app bundle and no inline script, so they leak nothing
 *      and satisfy the CSP with room to spare.
 *
 * Self-contained HTML in the marketing register, because — like the front
 * door — these pages cannot load a stylesheet that lives behind the wall.
 * ------------------------------------------------------------------ */

const TYPE_SET = new Set<string>(TYPES);
const isType = (s: string): s is MbtiType => TYPE_SET.has(s);

/** All unordered pairs, alphabetical within each — one page per pair, both directions shown. */
const PAIRS: [MbtiType, MbtiType][] = (() => {
  const out: [MbtiType, MbtiType][] = [];
  const sorted = [...TYPES].sort();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) out.push([sorted[i], sorted[j]]);
  }
  return out;
})();

const pairSlug = (a: MbtiType, b: MbtiType) => `${a}-and-${b}`.toLowerCase();
const typeSlug = (t: MbtiType) => t.toLowerCase();

/** Ease as a word, so the page reads to a human, not just a number. */
const easeWord = (n: number): string =>
  n >= 85 ? "very easy" : n >= 65 ? "easy" : n >= 45 ? "workable" : n >= 25 ? "effortful" : "hard";

/** "a"/"an" for a following word — only "Alpha" among the quadras needs "an". */
const article = (word: string): string => (/^[aeiou]/i.test(word) ? "an" : "a");

/**
 * The pair reading, in plain language, derived ENTIRELY from the two ease
 * scores already on the page — never from the composed playbook. It names
 * the asymmetry (or the lack of one) and hands the reader to the CTA for the
 * how. Safe to publish: it says THAT the sides differ, never HOW to work it.
 */
const asymmetryNote = (a: MbtiType, b: MbtiType, easeA: number, easeB: number): string => {
  if (Math.abs(easeA - easeB) <= 6) {
    return `It reads about the same from both sides: ${a} finds it ${easeWord(easeA)}, and ${b} ` +
      `finds it much the same. Whatever effort the pairing takes is shared rather than carried by one of you.`;
  }
  const [easier, harder] = easeA >= easeB ? [a, b] : [b, a];
  return `It is not symmetric — see the two scores above. ${easier} has the easier time of it, while ` +
    `${harder} does more of the reaching to meet in the middle. Knowing which side you are on — and ` +
    `what that side should actually do about it — is where the full reading earns its keep.`;
};

/* -------------------------------- shell -------------------------------- */

/** SEO-complete, self-contained, theme-aware. No app bundle, no inline script. */
function shell(opts: {
  origin: string;
  path: string;
  title: string;
  description: string;
  body: string;
}): string {
  const canonical = `${opts.origin}${opts.path}`;
  const desc = escapeHtml(opts.description);
  const title = escapeHtml(opts.title);
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400..600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{color-scheme:light dark;--paper:#FDFCFA;--ink:#1A1714;--ink2:#4C463D;--rule:#E3DED4;
        --accent:#6B3BC4;--accent-ink:#4B2A8F;--surface:#fff;--soft:#F4F1EA;
        --warn:#8A5410;--warn-soft:#FBF1E0}
  @media(prefers-color-scheme:dark){:root{--paper:#141310;--ink:#EDE9E1;--ink2:#B6AFA3;--rule:#2E2A24;
        --accent:#C9A0FF;--accent-ink:#C9A0FF;--surface:#1D1B17;--soft:#211E19;
        --warn:#E0A455;--warn-soft:#2A2015}}
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);
       font:400 19px/1.65 Newsreader,Georgia,serif;-webkit-text-size-adjust:100%}
  .wrap{max-width:44rem;margin:0 auto;padding:32px 20px 72px}
  a{color:var(--accent-ink)}
  nav.crumbs{font:400 15px/1.5 Inter,system-ui,sans-serif;color:var(--ink2);margin-bottom:28px}
  nav.crumbs a{color:var(--ink2)}
  h1{font:600 40px/1.12 Newsreader,serif;margin:0 0 8px;letter-spacing:-.01em}
  h2{font:600 26px/1.2 Newsreader,serif;margin:40px 0 10px}
  .lede{font-size:21px;color:var(--ink2);margin:0 0 28px}
  p{margin:0 0 18px}
  .scores{display:flex;gap:14px;flex-wrap:wrap;margin:24px 0}
  .score{flex:1 1 180px;background:var(--soft);border:1px solid var(--rule);border-radius:12px;
         padding:16px 18px}
  .score .n{font:600 34px/1 Inter,system-ui,sans-serif;color:var(--accent-ink)}
  .score .k{font:500 14px/1.4 Inter,system-ui,sans-serif;color:var(--ink2);margin-bottom:6px;
            text-transform:uppercase;letter-spacing:.04em}
  .score .w{font:400 16px/1.4 Inter,system-ui,sans-serif;color:var(--ink2);margin-top:4px}
  blockquote{margin:0 0 18px;padding:2px 0 2px 18px;border-left:3px solid var(--accent);
             color:var(--ink);font-style:italic}
  .powers{display:flex;gap:14px;flex-wrap:wrap;margin:24px 0}
  .power{flex:1 1 220px;background:var(--soft);border:1px solid var(--rule);border-radius:12px;
         padding:16px 18px}
  .power.kryp{background:var(--warn-soft);border-color:var(--warn)}
  .power .k{font:500 14px/1.4 Inter,system-ui,sans-serif;color:var(--ink2);margin-bottom:6px;
            text-transform:uppercase;letter-spacing:.04em}
  .power .fn{font:600 20px/1 Inter,system-ui,sans-serif;color:var(--accent-ink);margin-bottom:8px}
  .power.kryp .fn{color:var(--warn)}
  .power p{margin:0;font-size:16px}
  .cta{display:block;background:var(--accent);color:#fff;text-decoration:none;border-radius:10px;
       padding:18px 22px;margin:32px 0;font:500 18px/1.4 Inter,system-ui,sans-serif}
  .cta b{font-weight:600}
  .cta .s{display:block;font-size:15px;opacity:.9;margin-top:4px}
  @media(prefers-color-scheme:dark){.cta{color:#1A1714}}
  .related{margin-top:44px;padding-top:22px;border-top:1px solid var(--rule);
           font:400 16px/1.7 Inter,system-ui,sans-serif}
  .related h2{font:600 15px/1.4 Inter,system-ui,sans-serif;text-transform:uppercase;
              letter-spacing:.04em;color:var(--ink2);margin:0 0 10px}
  .related a{margin-right:14px;white-space:nowrap;display:inline-block}
  .fine{margin-top:40px;font:400 15px/1.6 Inter,system-ui,sans-serif;color:var(--ink2)}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:18px 0}
  .grid a{background:var(--surface);border:1px solid var(--rule);border-radius:8px;padding:12px 14px;
          text-decoration:none;color:var(--ink);font:500 16px/1.3 Inter,system-ui,sans-serif}
  .grid a span{display:block;font:400 13px/1.3 Inter,system-ui,sans-serif;color:var(--ink2);margin-top:3px}
</style>
</head><body><div class="wrap">${opts.body}</div></body></html>`;
}

const crumbs = (trail: [string, string | null][]) =>
  `<nav class="crumbs">${trail
    .map(([label, href]) => (href ? `<a href="${href}">${escapeHtml(label)}</a>` : escapeHtml(label)))
    .join(" › ")}</nav>`;

const cta = (href: string, lead: string, sub: string) =>
  `<a class="cta" href="${href}"><b>${escapeHtml(lead)}</b><span class="s">${escapeHtml(sub)}</span></a>`;

const jsonLd = (obj: Record<string, unknown>) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

const htmlResponse = (html: string, status = 200) =>
  new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Deterministic public content: cache it, so repeat crawls are cheap and
      // do not each cost a Worker invocation of consequence.
      "cache-control": "public, max-age=3600",
    },
  });

/* ------------------------------ pair page ------------------------------ */

function pairPage(origin: string, a: MbtiType, b: MbtiType): Response {
  const code = REL[a][b];
  const rel = REL_NAME[code];
  const easeA = ease(a, b);
  const easeB = ease(b, a);
  const path = `/read/${pairSlug(a, b)}`;

  const body = `
${crumbs([["Octant", origin + "/"], ["Readings", "/read"], [`${a} & ${b}`, null]])}
<h1>${a} and ${b}</h1>
<p class="lede">In this model, ${b} is ${a}'s <b>${escapeHtml(rel)}</b> — and the relationship
reads differently from each side. Here is the shape of it.</p>

<p>${escapeHtml(REL_DEF[code])}</p>

<div class="scores">
  <div class="score"><div class="k">${a} experiences it as</div>
    <div class="n">${easeA}<span style="font-size:18px;color:var(--ink2)">/100</span></div>
    <div class="w">${easeWord(easeA)}</div></div>
  <div class="score"><div class="k">${b} experiences it as</div>
    <div class="n">${easeB}<span style="font-size:18px;color:var(--ink2)">/100</span></div>
    <div class="w">${easeWord(easeB)}</div></div>
</div>

<h2>The same pairing, two different jobs</h2>
<p>${escapeHtml(asymmetryNote(a, b, easeA, easeB))}</p>

${cta(
  `/pair/${a}/${b}`,
  `Read the full ${a} × ${b} reading`,
  "The complete playbook — how each of you should actually handle the other, both directions, with the four sides and the exchange overlay — is inside the instrument.",
)}

<div class="related">
  <h2>Keep reading</h2>
  <a href="/read/${typeSlug(a)}">The ${a}, wired</a>
  <a href="/read/${typeSlug(b)}">The ${b}, wired</a>
  ${relatedPairs(a, b)}
  <br><a href="/read" style="margin-top:8px">All readings →</a>
</div>

<p class="fine">Octant is a lens, not a measurement. These readings describe patterns of
wiring, never worth, and never predict a person.</p>

${jsonLd({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: `${a} and ${b}: how the pair works`,
  description: `${rel}. ${a} finds it ${easeWord(easeA)}; ${b} finds it ${easeWord(easeB)}.`,
  url: origin + path,
  isPartOf: { "@type": "Blog", name: "Octant Readings", url: origin + "/read" },
})}`;

  return htmlResponse(
    shell({
      origin,
      path,
      title: `${a} and ${b} compatibility — how the pair actually works | Octant`,
      description:
        `${a} and ${b}: ${b} is ${a}'s ${rel}. ${a} reads it as ${easeWord(easeA)} (${easeA}/100), ` +
        `${b} as ${easeWord(easeB)} (${easeB}/100). The wiring behind the fit, in plain language.`,
      body,
    }),
  );
}

/** Three other pairs worth a click: A with its easiest and hardest, and B's easiest. */
function relatedPairs(a: MbtiType, b: MbtiType): string {
  const others = (t: MbtiType) =>
    TYPES.filter((x) => x !== t).sort((x, y) => ease(t, y) - ease(t, x));
  const picks = new Set<string>();
  const links: string[] = [];
  const add = (x: MbtiType, y: MbtiType) => {
    const [p, q] = [x, y].sort() as [MbtiType, MbtiType];
    const slug = pairSlug(p, q);
    if (slug === pairSlug(a, b) || picks.has(slug)) return;
    picks.add(slug);
    links.push(`<a href="/read/${slug}">${p} & ${q}</a>`);
  };
  const oa = others(a);
  add(a, oa[0]);
  add(a, oa[oa.length - 1]);
  add(b, others(b)[0]);
  return links.join("\n  ");
}

/* ------------------------------ type page ------------------------------ */

function typePage(origin: string, t: MbtiType): Response {
  const [epithet] = ARCHETYPE[t];
  const romance = soloRomance(t);
  const st = stack(t);
  const path = `/read/${typeSlug(t)}`;
  const q = quadra(t);
  // Short handles for the prose and the meta line — the FN_LONG description is
  // set on its own line below, never spliced mid-sentence.
  const leadLabel = `${st[0]} (${FN_ROLE[st[0]]})`;
  const supportLabel = `${st[1]} (${FN_ROLE[st[1]]})`;
  const { superpower, kryptonite } = powersOf(t);
  const [virtue] = VIRTUE_VICE[t];

  const body = `
${crumbs([["Octant", origin + "/"], ["Readings", "/read"], [t, null]])}
<h1>The ${t}</h1>
<p class="lede">${escapeHtml(epithet)} — ${article(q)} ${escapeHtml(q)}-quadra
${escapeHtml(GROUP[t])} type.</p>

<p>Every ${t} runs the same wiring underneath the surface: it leads with
<b>${escapeHtml(leadLabel)}</b> and supports with <b>${escapeHtml(supportLabel)}</b>. That single
ordering is what the whole reading is derived from — how they take a room in, what they reach for
under pressure, and where they reliably misjudge themselves.</p>

<p><b>${st[0]}, leading.</b> ${escapeHtml(FN_LONG[st[0]])}<br>
<b>${st[1]}, in support.</b> ${escapeHtml(FN_LONG[st[1]])}</p>

<p>The same ordering fixes how the ${t} moves in a group
(<b>${escapeHtml(INTERACTION_STYLE[t])}</b>). It also carries into romance: ${t} moves with
<b>${escapeHtml(romance.animal)}</b> energy, and the partner whose own Lead lands exactly on
${t}'s Cave (${escapeHtml(romance.cave)}) is <b>${escapeHtml(romance.dual)}</b>, its Dual.</p>

<h2>Superpower and kryptonite</h2>
<p>The Lead above is what makes ${article(t)} ${t} extraordinary. The flip side is what undoes
them — never the same function, and rarely on.</p>
<div class="powers">
  <div class="power">
    <div class="k">Superpower</div>
    <div class="fn">${st[0]} · ${escapeHtml(FN_ROLE[st[0]])}</div>
    <p>${escapeHtml(superpower.what)}</p>
  </div>
  <div class="power kryp">
    <div class="k">Kryptonite</div>
    <div class="fn">${escapeHtml(kryptonite.dealBreaker)}</div>
    <p>Under real pressure ${article(t)} ${t} tends toward <b>${escapeHtml(kryptonite.stressResponse.toLowerCase())}</b>.
    Appeal to their <b>${escapeHtml(virtue)}</b> rather than triggering their <b>${escapeHtml(kryptonite.vice.toLowerCase())}</b>.</p>
  </div>
</div>

${cta(
  `/type/${t}`,
  `Read the full ${t} reading`,
  "The complete wiring — all eight functions, the four sides of the mind, the growth gate and the exchange overlay — is inside the instrument.",
)}

<div class="related">
  <h2>How ${t} meets others</h2>
  ${TYPES.filter((x) => x !== t)
    .sort((x, y) => ease(t, y) - ease(t, x))
    .slice(0, 4)
    .map((x) => {
      // Both the visible text and the href use the canonical alphabetical order,
      // so a link never reads "ISTJ & ENFP" while pointing at "ENFP and ISTJ".
      const [p, q] = [t, x].sort() as [MbtiType, MbtiType];
      return `<a href="/read/${pairSlug(p, q)}">${p} & ${q}</a>`;
    })
    .join("\n  ")}
  <br><a href="/read" style="margin-top:8px">All readings →</a>
</div>

<p class="fine">Octant is a lens, not a measurement. This describes a pattern of wiring, never
worth, and never predicts a person.</p>

${jsonLd({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: `The ${t}, wired`,
  description: epithet,
  url: origin + path,
  isPartOf: { "@type": "Blog", name: "Octant Readings", url: origin + "/read" },
})}`;

  return htmlResponse(
    shell({
      origin,
      path,
      title: `The ${t}, wired — how the type actually works | Octant`,
      description:
        `${epithet}. The ${t} leads with ${leadLabel} and supports with ${supportLabel}. What that ` +
        `wiring produces, in plain language — and how it meets the other fifteen.`,
      body,
    }),
  );
}

/* ------------------------------ index page ------------------------------ */

function indexPage(origin: string): Response {
  const typeCards = TYPES.map(
    (t) =>
      `<a href="/read/${typeSlug(t)}">The ${t}<span>${escapeHtml(ARCHETYPE[t][0])}</span></a>`,
  ).join("\n  ");

  const body = `
${crumbs([["Octant", origin + "/"], ["Readings", null]])}
<h1>The readings</h1>
<p class="lede">Plain-language readings of all sixteen types and how they meet — derived from the
same model that powers the instrument. A lighter way in; the full reading lives inside.</p>

<h2>The sixteen, one each</h2>
<div class="grid">
  ${typeCards}
</div>

<h2>Every pairing</h2>
<p>One hundred and twenty pairs, each read from both sides. A few to start:</p>
<div class="related">
  ${PAIRS.slice(0, 24)
    .map(([a, b]) => `<a href="/read/${pairSlug(a, b)}">${a} & ${b}</a>`)
    .join("\n  ")}
</div>
<p class="fine">Every pair has its own page — start from any type above to find the ones that
matter to you, or open the instrument to read your own.</p>

${cta("/signin", "Open the instrument", "Read your own type, any pairing in full, and compose a whole group.")}`;

  return htmlResponse(
    shell({
      origin,
      path: "/read",
      title: "The readings — all sixteen types and how they meet | Octant",
      description:
        "Plain-language readings of the sixteen types and every pairing, derived from the Octant " +
        "model. A lighter way in to how minds are wired and how they mesh.",
      body,
    }),
  );
}

/* ------------------------------ sitemap etc ------------------------------ */

function sitemap(origin: string): Response {
  const urls = [
    `${origin}/`,
    `${origin}/read`,
    ...TYPES.map((t) => `${origin}/read/${typeSlug(t)}`),
    ...PAIRS.map(([a, b]) => `${origin}/read/${pairSlug(a, b)}`),
  ];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${escapeHtml(u)}</loc></url>`).join("\n") +
    `\n</urlset>\n`;
  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=86400" },
  });
}

function robots(origin: string): Response {
  /* The app itself is gated (401 + noindex) so it cannot be indexed regardless;
     what we positively invite is the marketing door and the readings. */
  const txt = `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`;
  return new Response(txt, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" },
  });
}

/* ------------------------------ dispatcher ------------------------------ */

/**
 * The public readings surface. Returns a Response for anything it owns, or
 * null so the caller carries on to the wall. Called BEFORE requireAuth in
 * index.ts — these pages are public by design.
 */
export function handleRead(url: URL, origin: string): Response | null {
  const path = url.pathname;
  if (path === "/robots.txt") return robots(origin);
  if (path === "/sitemap.xml") return sitemap(origin);
  if (path === "/read" || path === "/read/") return indexPage(origin);
  if (!path.startsWith("/read/")) return null;

  const slug = path.slice("/read/".length).replace(/\/$/, "").toLowerCase();

  // A pair: "entp-and-infj".
  if (slug.includes("-and-")) {
    const [ra, rb] = slug.split("-and-");
    const a = (ra ?? "").toUpperCase();
    const b = (rb ?? "").toUpperCase();
    if (!isType(a) || !isType(b) || a === b) return notFound(origin);
    // Canonicalise to alphabetical order so each pair has exactly one URL.
    const [p, q] = [a, b].sort() as [MbtiType, MbtiType];
    if (`${p}-and-${q}`.toLowerCase() !== slug) {
      return new Response(null, { status: 301, headers: { location: `/read/${pairSlug(p, q)}` } });
    }
    return pairPage(origin, p, q);
  }

  // A type: "entp".
  const t = slug.toUpperCase();
  if (isType(t)) return typePage(origin, t);

  return notFound(origin);
}

function notFound(origin: string): Response {
  return htmlResponse(
    shell({
      origin,
      path: "/read",
      title: "Reading not found | Octant",
      description: "That reading does not exist.",
      body: `${crumbs([["Octant", origin + "/"], ["Readings", "/read"], ["Not found", null]])}
<h1>No such reading</h1>
<p class="lede">That is not one of the sixteen types or their pairings.</p>
<p><a href="/read">See all the readings →</a></p>`,
    }),
    404,
  );
}
