/* Supplementary walk: signed-out worker-rendered marketing surfaces the first walk missed.
   Same conventions; appends to the same shots dir with its own manifest2.json. */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:5173";
const OUT = new URL("./shots/", import.meta.url).pathname;

const VIEWPORTS = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile", width: 390, height: 844 },
];
const THEMES = ["light", "dark"];

const ROUTES = [
  ["/partners", "mkt-partners"],
  ["/compare", "mkt-compare"],
  ["/compare/mbti", "mkt-compare-mbti"],
  ["/compare/socionics", "mkt-compare-socionics"],
  ["/compare/big-five", "mkt-compare-bigfive"],
  ["/onramp", "mkt-onramp-1"],
  ["/onramp?step=2", "mkt-onramp-2"],
  ["/onramp?step=5", "mkt-onramp-5"],
  ["/onramp?step=11&email=probe%40example.com", "mkt-onramp-11"],
];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const manifest = [];

for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: theme });
    for (const [route, slug] of ROUTES) {
      const page = await ctx.newPage();
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
      page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
      let status = null;
      try {
        const resp = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
        status = resp ? resp.status() : null;
      } catch (e) { errors.push("NAV_FAIL: " + String(e).slice(0, 200)); }
      await page.waitForTimeout(500);
      const title = await page.title().catch(() => "");
      const h1 = await page.locator("h1").first().textContent({ timeout: 1500 }).catch(() => "");
      const file = `${slug}-${vp.tag}-${theme}.png`;
      await page.screenshot({ path: OUT + file, fullPage: true }).catch(async () => {
        await page.screenshot({ path: OUT + file });
      });
      manifest.push({ route, file, viewport: vp.tag, theme, status, title, h1: (h1 || "").trim(), consoleErrors: errors });
      await page.close();
    }
    await ctx.close();
  }
}

writeFileSync(OUT + "manifest2.json", JSON.stringify({ pages: manifest }, null, 2));
console.log("pages:", manifest.length);
console.log("errors on:", manifest.filter((m) => m.consoleErrors.length).map((m) => m.file).join(", ") || "none");
await browser.close();
