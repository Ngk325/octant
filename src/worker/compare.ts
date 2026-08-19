/* ------------------------------------------------------------------ *
 * THE COMPARISON LAYER.
 *
 * Every other public surface keeps to Octant's own vocabulary and names
 * no third-party system -- a deliberate rule, and it stays deliberate.
 * These pages are the one exception, and they exist for two reasons.
 *
 * The first is comprehension: "how is this different from MBTI" is the
 * question every visitor arrives with, and a page that will not name the
 * thing being compared makes the reader do the work.
 *
 * The second is discovery: those names are the only terms anyone
 * actually searches, and the main narrative deliberately never uses one.
 *
 * The rule these pages live under: each names what the other system does
 * WELL and says plainly where it is stronger than Octant. The
 * psychometric-validity concession to Hogan and Gallup is not a
 * throwaway -- conceding the axis Octant does not compete on is what
 * makes the axis it does compete on believable. A comparison page that
 * only flattered us would be exactly the marketing this product exists
 * to be an alternative to.
 * ------------------------------------------------------------------ */

import { SITE_CSS, siteFooter, siteHead, siteHeader } from "./marketing";

interface Comparison {
  slug: string;
  name: string;
  title: string;
  description: string;
  /** One line under the h1. */
  standfirst: string;
  /** What the other system is, in its own terms and fairly. */
  what: string;
  /** Where it is genuinely stronger. Never empty -- see the header note. */
  stronger: string;
  /** The structural difference, in Octant's terms. */
  differs: Array<{ h: string; p: string }>;
  /** Who should pick which. */
  pick: { them: string; us: string };
}

const COMPARISONS: Comparison[] = [
  {
    slug: "mbti",
    name: "MBTI",
    title: "Octant vs MBTI — what the four letters leave out",
    description:
      "MBTI sorts people into sixteen types. Octant derives what happens between two of them, " +
      "scored separately in each direction. An honest comparison, including where MBTI is stronger.",
    standfirst:
      "Both use sixteen types and four letters. They are answering different questions, and the " +
      "difference is entirely about what happens after the label.",
    what:
      "MBTI sorts a person into one of sixteen types across four dichotomies, and hands back a " +
      "description of that type. It is by far the most widely understood vocabulary for talking " +
      "about personality at work &mdash; if you say &ldquo;INFP&rdquo; in a meeting, people know roughly " +
      "what you mean. That shared language is a real asset and Octant borrows the same four-letter " +
      "codes precisely because of it.",
    stronger:
      "MBTI has institutional infrastructure Octant has nothing like: certified practitioners, " +
      "decades of organisational familiarity, and published materials in dozens of languages. If " +
      "what you need is a common vocabulary that a room of forty people will already recognise, " +
      "that is a genuine advantage and it is not close.",
    differs: [
      {
        h: "The label is where MBTI finishes and where Octant starts",
        p: "A type description cannot tell you why one colleague energises you and another exhausts " +
          "you doing the same job. That answer is in the pair, not the person. Octant derives all " +
          "256 ordered pairs and gives each one a relation, a score and a playbook.",
      },
      {
        h: "Compatibility is directional here",
        p: "MBTI compatibility material, where it exists at all, is symmetric: one number for a " +
          "pair. Octant scores A reading B and B reading A separately, and 27% of pairs come out " +
          "different. The person on the heavier side is usually the one who cannot tell.",
      },
      {
        h: "Nothing is looked up",
        p: "Octant computes every relation from three operations on eight elements, so no two " +
          "claims can quietly contradict each other. There is no table to maintain and none to " +
          "drift.",
      },
    ],
    pick: {
      them: "You need a shared vocabulary across a large organisation, or certified facilitation.",
      us: "You need to know what happens between two specific people, and why.",
    },
  },
  {
    slug: "socionics",
    name: "Socionics",
    title: "Octant vs Socionics — the same relations, computed rather than tabulated",
    description:
      "Socionics has modelled intertype relations for decades. Octant derives the same 256-cell " +
      "structure from first principles and agrees with published charts on every cell.",
    standfirst:
      "This is the closest relative Octant has, and the comparison is less about disagreement than " +
      "about where the tables come from.",
    what:
      "Socionics is the one tradition that has taken intertype relations seriously for decades. It " +
      "names sixteen relations &mdash; duality, supervision, benefit and the rest &mdash; and it is where the " +
      "insight that some relations are inherently asymmetric actually comes from. Octant does not " +
      "claim to have discovered that; it claims to have computed it.",
    stronger:
      "Socionics has a far larger body of written material, a living community arguing about edge " +
      "cases, and considerably more depth on information metabolism than Octant exposes. If you want " +
      "the theory rather than an instrument, the literature is there and Octant is not a substitute " +
      "for it.",
    differs: [
      {
        h: "Derived, not tabulated",
        p: "Socionics relation charts are published tables. Octant computes the same structure from " +
          "three involutions on eight elements &mdash; and then checks itself: two independently-keyed " +
          "published charts agree with the engine on all 256 cells each.",
      },
      {
        h: "It is software, not a framework",
        p: "Group composition as a weighted directed graph, per-pair playbooks, and a course that " +
          "teaches the model from scratch. The theory is the input, not the product.",
      },
      {
        h: "One vocabulary, kept in plain English first",
        p: "Every term is defined and pairable, with the precise version one click below the plain " +
          "one. Socionics terminology is famously steep, and that steepness is a real barrier.",
      },
    ],
    pick: {
      them: "You want the theory itself, and a community to argue it with.",
      us: "You want the relations computed, checked and applied to actual people.",
    },
  },
  {
    slug: "big-five",
    name: "the Big Five",
    title: "Octant vs the Big Five — measurement and mechanism are different jobs",
    description:
      "The Big Five is the best-validated model in personality psychology. Octant does not compete " +
      "on validity and says so. Here is what each one is actually for.",
    standfirst:
      "This is the comparison where Octant concedes the most, and the concession is the honest part.",
    what:
      "The Big Five &mdash; openness, conscientiousness, extraversion, agreeableness, neuroticism &mdash; is " +
      "the most rigorously validated model in personality psychology. It is trait-based and " +
      "continuous rather than type-based, it predicts real outcomes with measurable effect sizes, " +
      "and it survives the replication scrutiny that most of this field does not.",
    stronger:
      "On psychometric validity the Big Five wins outright, and so do instruments built on it such " +
      "as Hogan. Octant is not a validated psychometric measure, does not claim to be, and should " +
      "not be used where one is required &mdash; hiring and selection above all. If your question is " +
      "&ldquo;how much of this trait does this person have, and what does it predict&rdquo;, the " +
      "answer is a Big Five instrument and it is not Octant.",
    differs: [
      {
        h: "Measurement versus mechanism",
        p: "A Big Five profile tells you where someone sits on five continua. It does not tell you " +
          "what will happen when this particular person works with that particular person. Octant " +
          "answers only the second question.",
      },
      {
        h: "It will show you its working",
        p: "Octant derives every claim and displays the derivation. That is a different kind of " +
          "credibility from statistical validation &mdash; weaker in one direction, stronger in another, " +
          "and worth being precise about rather than blurring.",
      },
      {
        h: "Octant publishes evidence against itself",
        p: "A published survey matrix correlates with the model&rsquo;s own ease scores at " +
          "r &minus;0.15 &mdash; a negative relationship &mdash; and Octant ships it and shows the divergence " +
          "rather than quietly leaving it out.",
      },
    ],
    pick: {
      them: "You need a validated measure, or you are making a consequential decision about someone.",
      us: "You need to understand a specific relationship, and you want to check the reasoning.",
    },
  },
];

export const COMPARE_SLUGS = COMPARISONS.map((c) => c.slug);

const CSS = `
  .cmp-hero { padding-top:56px; padding-bottom:8px; max-width:760px; }
  .cmp-hero .lede { font-size:20px; color:var(--m-ink2); }
  .cmp-body { max-width:760px; }
  .cmp-body h3 { font-size:20px; margin:0 0 8px; }
  .block { padding:26px 0; border-bottom:1px solid var(--m-rule); }
  .block:last-child { border-bottom:none; }
  .block p { font-family:var(--sans); font-size:16px; line-height:1.65; color:var(--m-ink2); }
  .block p:last-child { margin-bottom:0; }
  .fair { border-left:3px solid var(--m-accent); background:var(--m-accent-soft);
          border-radius:0 10px 10px 0; padding:20px 24px; margin:8px 0 0; }
  .fair p { color:var(--m-ink); margin:0; }
  .fair .fair-k { font-family:var(--mono); font-size:11px; font-weight:500; letter-spacing:.12em;
                  text-transform:uppercase; color:var(--m-accent-ink); display:block; margin-bottom:8px; }
  .pick { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px; margin-top:8px; }
  .pick div { border-top:2px solid var(--m-rule); padding-top:14px; }
  .pick .pick-h { font-family:var(--mono); font-size:11px; font-weight:500; letter-spacing:.12em;
                  text-transform:uppercase; color:var(--m-muted); display:block; margin-bottom:8px; }
  .pick p { font-family:var(--sans); font-size:15.5px; line-height:1.6; color:var(--m-ink2); margin:0; }
  .cmp-index { display:grid; gap:0; margin-top:32px; border-top:1px solid var(--m-rule); max-width:760px; }
  .cmp-index a { display:flex; align-items:baseline; gap:16px; padding:20px 4px;
                 border-bottom:1px solid var(--m-rule); text-decoration:none; color:inherit; }
  .cmp-index a:hover { background:var(--m-surface); }
  .cmp-index .ci-t { font-family:var(--sans); font-size:17px; font-weight:600; color:var(--m-ink); }
  .cmp-index .ci-d { font-family:var(--sans); font-size:14.5px; color:var(--m-ink2); flex:1 1 auto; }
  .cmp-index .ci-go { font-family:var(--mono); font-size:12.5px; color:var(--m-accent-ink); }
  @media (max-width:560px){ .cmp-index a { flex-wrap:wrap; gap:6px; } }
`;

const shell = (origin: string, path: string, title: string, description: string, main: string) =>
  new Response(
    `<!doctype html>
<html lang="en">
<head>
${siteHead({ title, description, origin, path })}
<style>${SITE_CSS}${CSS}</style>
</head>
<body>

${siteHeader(false)}

<main>
${main}
</main>

${siteFooter(false)}

</body>
</html>`,
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    },
  );

/** The index at /compare. */
export function comparePage(origin: string): Response {
  const rows = COMPARISONS.map(
    (c) => `    <a href="/compare/${c.slug}">
      <span class="ci-t">${c.name}</span>
      <span class="ci-d">${c.standfirst}</span>
      <span class="ci-go">Read &rarr;</span>
    </a>`,
  ).join("\n");

  return shell(
    origin,
    "/compare",
    "Octant compared — MBTI, Socionics and the Big Five",
    "How Octant differs from the systems it is most often compared to, including where each of " +
      "them is genuinely stronger.",
    `  <div class="wrap cmp-hero">
    <p class="kicker">Compared</p>
    <h1>How Octant differs.</h1>
    <p class="lede">
      Octant describes itself in its own vocabulary everywhere else on this site. These pages are
      the exception, because &ldquo;how is this different from the one I already know&rdquo; is a
      fair question and it deserves a straight answer.
    </p>
  </div>

  <div class="wrap">
    <div class="cmp-index">
${rows}
    </div>
    <div class="fair" style="max-width:760px;margin-top:32px">
      <span class="fair-k">The rule these pages follow</span>
      <p>
        Each one says where the other system is stronger, and means it. Octant is not a validated
        psychometric instrument and does not compete on that axis &mdash; conceding the ground we
        do not hold is the only thing that makes the ground we do hold worth believing.
      </p>
    </div>
  </div>`,
  );
}

/** One comparison at /compare/:slug. Returns null for an unknown slug. */
export function comparisonPage(origin: string, slug: string): Response | null {
  const c = COMPARISONS.find((x) => x.slug === slug);
  if (!c) return null;

  const diffs = c.differs
    .map(
      (d) => `      <div class="block">
        <h3>${d.h}</h3>
        <p>${d.p}</p>
      </div>`,
    )
    .join("\n");

  return shell(
    origin,
    `/compare/${c.slug}`,
    c.title,
    c.description,
    `  <div class="wrap cmp-hero">
    <p class="kicker"><a href="/compare" style="color:inherit;text-decoration:none">Compared</a></p>
    <h1>Octant and ${c.name}.</h1>
    <p class="lede">${c.standfirst}</p>
  </div>

  <div class="wrap cmp-body">
    <div class="block">
      <h3>What ${c.name} is</h3>
      <p>${c.what}</p>
    </div>

    <div class="block">
      <h3>Where ${c.name} is stronger</h3>
      <div class="fair">
        <span class="fair-k">Said plainly</span>
        <p>${c.stronger}</p>
      </div>
    </div>

${diffs}

    <div class="block">
      <h3>Which one you want</h3>
      <div class="pick">
        <div>
          <span class="pick-h">Choose ${c.name}</span>
          <p>${c.pick.them}</p>
        </div>
        <div>
          <span class="pick-h">Choose Octant</span>
          <p>${c.pick.us}</p>
        </div>
      </div>
    </div>

    <div class="block">
      <div class="cta-row" style="margin-top:0">
        <a class="btn primary" href="/onramp">Take the two-minute read</a>
        <a class="btn" href="/compare">Other comparisons</a>
      </div>
    </div>
  </div>`,
  );
}
