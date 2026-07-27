/* ------------------------------------------------------------------ *
 * Responsive screenshot matrix + layout assertions.
 *
 * Not a test-suite dependency — this uses whatever Playwright the
 * environment provides (a global install, or one you install yourself)
 * and is run by hand against a build:
 *
 *     npm run build
 *     npx vite preview --port 4173 &
 *     node scripts/shots.mjs [http://localhost:4173]
 *
 * For every route × width it asserts the two invariants the responsive
 * work exists to hold, then screenshots into shots/ for eyeballing:
 *
 *   1. No document-level horizontal scroll. The masthead overflow bug
 *      gave EVERY page a sideways scrollbar at 375px; anything wide must
 *      scroll inside its own container instead.
 *   2. The masthead is one line — its measured height stays at
 *      --masthead-h, which every scroll offset in the app derives from.
 *
 * `vite preview` serves the static build without the Worker, so no
 * session is needed. The access wall is server-side and is verified
 * separately (see DEPLOY.md's wrangler-dev section).
 * ------------------------------------------------------------------ */

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try {
    return require("playwright");
  } catch {
    // Fall back to a global install (e.g. /opt/node22/lib/node_modules).
    return require(require("node:child_process")
      .execSync("npm root -g", { encoding: "utf8" })
      .trim() + "/playwright");
  }
})();

const BASE = process.argv[2] ?? "http://localhost:4173";
const WIDTHS = [375, 768, 1024, 1440];
const ROUTES = [
  "/", "/learn", "/learn/functions", "/learn/octagram", "/calculator", "/types",
  "/type/ENTP", "/pair/ENTP/INFJ", "/network", "/matrix", "/lexicon",
];

mkdirSync("shots", { recursive: true });

const browser = await chromium.launch();
let failures = 0;

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });

  /* Kill every off-origin request (fonts, analytics). Two reasons: sandboxed
     environments stall external fetches, which turns any network-quiescence
     wait into a hang — and layout assertions should not depend on a CDN. */
  const origin = new URL(BASE).origin;
  await page.route("**/*", (route) =>
    route.request().url().startsWith(origin) ? route.continue() : route.abort(),
  );

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "load", timeout: 20_000 });
    await page.waitForTimeout(400); // let React paint and figures measure

    const { scrollW, innerW, mastH, mastVar } = await page.evaluate(() => ({
      scrollW: document.scrollingElement.scrollWidth,
      innerW: window.innerWidth,
      mastH: document.querySelector(".masthead")?.getBoundingClientRect().height ?? 0,
      mastVar: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--masthead-h")),
    }));

    if (scrollW > innerW) {
      failures++;
      console.error(`✗ ${width}px ${route} — horizontal scroll (${scrollW} > ${innerW})`);
    }
    if (mastH > mastVar + 2) {
      failures++;
      console.error(`✗ ${width}px ${route} — masthead ${mastH}px exceeds --masthead-h ${mastVar}px`);
    }

    const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
    await page.screenshot({ path: `shots/${slug}-${width}.png`, fullPage: false });
  }
  await page.close();
}

await browser.close();

if (failures) {
  console.error(`\n${failures} layout assertion(s) failed.`);
  process.exit(1);
}
console.log(`All ${WIDTHS.length * ROUTES.length} route×width checks passed. Screenshots in shots/.`);
