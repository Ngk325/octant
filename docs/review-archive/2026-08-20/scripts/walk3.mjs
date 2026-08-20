/* Third walk: the REAL signed-in home (orientation page) with onboarding.done set,
   in all four viewport/theme combos. */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:5173";
const OUT = new URL("./shots/", import.meta.url).pathname;
const COOKIE = {
  name: "octant_session",
  value: process.env.OCTANT_COOKIE,
  domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax",
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const manifest = [];
for (const vp of [{ tag: "desktop", width: 1440, height: 900 }, { tag: "mobile", width: 390, height: 844 }]) {
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: theme });
    await ctx.addCookies([COOKIE]);
    await ctx.addInitScript(() => localStorage.setItem("octant.onboarding.done", "1"));
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
    await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(700);
    const file = `home-app-${vp.tag}-${theme}.png`;
    await page.screenshot({ path: OUT + file, fullPage: true });
    manifest.push({ route: "/ (signed-in, onboarded)", file, viewport: vp.tag, theme, title: await page.title(), h1: (await page.locator("h1").first().textContent().catch(() => "")) ?? "", consoleErrors: errors });
    await page.close();
    await ctx.close();
  }
}
writeFileSync(OUT + "manifest3.json", JSON.stringify({ pages: manifest }, null, 2));
console.log("done", manifest.length);
await browser.close();
