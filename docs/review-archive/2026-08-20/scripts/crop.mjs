import { chromium } from 'playwright';
const COOKIE = 'eyJsIjoiZGV2IiwiayI6ImNvZGUiLCJjIjoiYTNlZTc4NmI1NzA3YzI3ZCIsImUiOjE3ODk4MDgyNjF9.AGDec1UEnwu0lXILgzPPz_PvjAxJNY-xHNPsgyp-ucw';
const OUT = '/tmp/claude-0/-home-user-octant/9226adb3-21b5-57f0-8777-75de8a014f78/scratchpad/crops';
import { mkdirSync } from 'fs';
mkdirSync(OUT, { recursive: true });

// args: name url viewport theme scrollY clipH selector localStorage
const jobs = JSON.parse(process.argv[2]);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const j of jobs) {
  const vp = j.vp === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  const ctx = await browser.newContext({
    viewport: vp,
    deviceScaleFactor: 2,
    colorScheme: j.theme || 'light',
  });
  await ctx.addCookies([{ name: 'octant_session', value: COOKIE, domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();
  if (j.ls) {
    await page.addInitScript((ls) => { for (const [k,v] of Object.entries(ls)) localStorage.setItem(k,v); }, j.ls);
  }
  await page.goto('http://localhost:5173' + j.url, { waitUntil: 'networkidle', timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(700);
  if (j.theme) {
    await page.evaluate((t)=>document.documentElement.setAttribute('data-theme',t), j.theme);
    await page.waitForTimeout(200);
  }
  if (j.sel) {
    const el = await page.$(j.sel);
    if (el) { await el.screenshot({ path: `${OUT}/${j.name}.png` }); await ctx.close(); continue; }
  }
  if (j.scrollY) { await page.evaluate((y)=>window.scrollTo(0,y), j.scrollY); await page.waitForTimeout(200); }
  const clip = j.clipH ? { x: 0, y: 0, width: vp.width, height: j.clipH } : undefined;
  await page.screenshot({ path: `${OUT}/${j.name}.png`, clip });
  await ctx.close();
}
await browser.close();
console.log('done');
