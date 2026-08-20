/* axe-core pass over key pages, light theme desktop. Writes axe-results.json. */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:5173";
const AXE = readFileSync(new URL("./node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const COOKIE = {
  name: "octant_session", value: process.env.OCTANT_COOKIE,
  domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax",
};

const PAGES = [
  ["/", "home-signedout", false],
  ["/onramp", "onramp", false],
  ["/", "home-app", true],
  ["/calculator", "calculator", true],
  ["/type/ENTP", "type-entp", true],
  ["/matrix", "matrix", true],
  ["/learn/functions", "learn-stage", true],
];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const results = [];
for (const [route, slug, auth] of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  if (auth) {
    await ctx.addCookies([COOKIE]);
    await ctx.addInitScript(() => localStorage.setItem("octant.onboarding.done", "1"));
  }
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(600);
  await page.evaluate(AXE);
  const r = await page.evaluate(async () => {
    const res = await window.axe.run(document, { resultTypes: ["violations"] });
    return res.violations.map((v) => ({
      id: v.id, impact: v.impact, help: v.help,
      nodes: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
      count: v.nodes.length,
    }));
  });
  results.push({ route, slug, auth, violations: r });
  await ctx.close();
}
writeFileSync(new URL("./axe-results.json", import.meta.url).pathname, JSON.stringify(results, null, 2));
for (const r of results) {
  console.log(`\n== ${r.slug} (${r.route}) — ${r.violations.length} violation types`);
  for (const v of r.violations) console.log(`  [${v.impact}] ${v.id} ×${v.count} — ${v.help} — e.g. ${v.nodes[0]}`);
}
await browser.close();
