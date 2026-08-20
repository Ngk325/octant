/* Interactive flow probe: calculator click-through.
   Answers the 8 coins one by one (always the FIRST choice), screenshotting after
   answers 1, 4, and 8, and recording the visible candidate count / result text.
   Verifies the "watch the field narrow" promise in the real UI. */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:5173";
const OUT = new URL("./shots/", import.meta.url).pathname;
const COOKIE = {
  name: "octant_session", value: process.env.OCTANT_COOKIE,
  domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax",
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([COOKIE]);
await ctx.addInitScript(() => localStorage.setItem("octant.onboarding.done", "1"));
const page = await ctx.newPage();
const log = [];
await page.goto(BASE + "/calculator", { waitUntil: "networkidle" });
await page.waitForTimeout(500);

const groups = page.locator("fieldset, section").filter({ has: page.locator("button.choice") });
const buttons = page.locator("button.choice");
log.push({ step: 0, choiceButtons: await buttons.count() });

for (let i = 0; i < 8; i++) {
  // Click the first unpressed choice in the i-th question pair.
  const pair = buttons.nth(i * 2); // two choices per coin, in DOM order
  await pair.click();
  await page.waitForTimeout(350);
  if (i === 0 || i === 3 || i === 7) {
    const file = `flow-calc-after-${i + 1}.png`;
    await page.screenshot({ path: OUT + file, fullPage: true });
    const body = await page.locator("main").innerText();
    log.push({ afterAnswer: i + 1, file, excerpt: body.slice(0, 1200) });
  }
}
writeFileSync(OUT + "flow-calc-log.json", JSON.stringify(log, null, 2));
console.log(JSON.stringify(log.map((l) => ({ ...l, excerpt: l.excerpt?.slice(0, 300) })), null, 2));
await browser.close();
