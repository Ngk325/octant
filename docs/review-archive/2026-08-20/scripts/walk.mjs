/* Octant full route walk: every route × {desktop 1440x900, mobile 390x844} × {light, dark}.
   Signed-out shots for / and /signin from a cookieless context; everything else signed in.
   Emits screenshots to ./shots and a manifest JSON with per-page console errors, title, h1. */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:5173";
const OUT = new URL("./shots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const SESSION_COOKIE = {
  name: "octant_session",
  value: process.env.OCTANT_COOKIE,
  domain: "localhost",
  path: "/",
  httpOnly: true,
  sameSite: "Lax",
};

const VIEWPORTS = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile", width: 390, height: 844 },
];
const THEMES = ["light", "dark"];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const manifest = [];

async function shoot(context, route, slug, viewportTag, theme) {
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
  let status = null;
  try {
    const resp = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
    status = resp ? resp.status() : null;
  } catch (e) {
    errors.push("NAV_FAIL: " + String(e).slice(0, 200));
  }
  await page.waitForTimeout(700); // fonts / animation settle
  const title = await page.title().catch(() => "");
  const h1 = await page.locator("h1").first().textContent({ timeout: 1500 }).catch(() => "");
  const url = page.url();
  const file = `${slug}-${viewportTag}-${theme}.png`;
  await page.screenshot({ path: OUT + file, fullPage: true }).catch(async () => {
    await page.screenshot({ path: OUT + file }); // fall back to viewport shot
  });
  manifest.push({ route, finalUrl: url.replace(BASE, ""), file, viewport: viewportTag, theme, status, title, h1: (h1 || "").trim(), consoleErrors: errors });
  await page.close();
}

// Discover learn stages + welcome steps + a couple of lexicon ids from the live app.
const probe = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await probe.addCookies([SESSION_COOKIE]);
const p = await probe.newPage();
await p.goto(BASE + "/learn", { waitUntil: "networkidle" });
const stageLinks = await p.$$eval('a[href^="/learn/"]', (as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
await p.goto(BASE + "/lexicon", { waitUntil: "networkidle" });
const lexLinks = await p.$$eval('a[href^="/lexicon/"]', (as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
await p.goto(BASE + "/welcome", { waitUntil: "networkidle" });
const welcomeLinks = await p.$$eval('a[href^="/welcome/"]', (as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
await p.close();
await probe.close();

const welcomeSteps = welcomeLinks.length
  ? welcomeLinks
  : Array.from({ length: 8 }, (_, i) => `/welcome/${i + 1}`);

const SIGNED_OUT = [
  ["/", "home-signedout"],
  ["/signin", "signin"],
];
const SIGNED_IN = [
  ["/", "home-signedin"],
  ["/welcome", "welcome-index"],
  ...welcomeSteps.map((r) => [r, "welcome-" + r.split("/").pop()]),
  ["/learn", "learn-index"],
  ...stageLinks.map((r) => [r, "learn-" + r.split("/").pop()]),
  ["/calculator", "calculator"],
  ["/read-someone", "read-someone"],
  ["/types", "types"],
  ["/type/ENTP", "type-entp"],
  ["/type/ISFJ", "type-isfj"],
  ["/type/INTJ", "type-intj"],
  ["/sides", "sides-index"],
  ["/sides/INTP", "sides-intp"],
  ["/bonds", "bonds"],
  ["/pair/ENTP/INFP", "pair-entp-infp"], // asymmetric ease: 34 vs 44
  ["/pair/ENFP/ISTJ", "pair-enfp-istj"], // dyad pair
  ["/network", "network"],
  ["/matrix", "matrix"],
  ["/lexicon", "lexicon-index"],
  ...(lexLinks.slice(0, 2).map((r) => [r, "lexicon-" + r.split("/").pop()])),
  ["/guide", "guide-index"],
  ["/guide/ENTP", "guide-entp"],
  ["/admin", "admin"],
];

for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    const anon = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: theme });
    for (const [route, slug] of SIGNED_OUT) await shoot(anon, route, slug, vp.tag, theme);
    await anon.close();

    const auth = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: theme });
    await auth.addCookies([SESSION_COOKIE]);
    for (const [route, slug] of SIGNED_IN) await shoot(auth, route, slug, vp.tag, theme);
    await auth.close();
  }
}

writeFileSync(OUT + "manifest.json", JSON.stringify({ generated: "session-run", stageLinks, welcomeSteps, lexLinks: lexLinks.slice(0, 5), pages: manifest }, null, 2));
console.log("pages:", manifest.length, "stages:", stageLinks.length, "welcome:", welcomeSteps.length);
console.log("errors on:", manifest.filter((m) => m.consoleErrors.length).map((m) => m.file).join(", ") || "none");
await browser.close();
