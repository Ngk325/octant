import { chromium } from 'playwright';
const COOKIE='eyJsIjoiZGV2IiwiayI6ImNvZGUiLCJjIjoiYTNlZTc4NmI1NzA3YzI3ZCIsImUiOjE3ODk4MDgyNjF9.AGDec1UEnwu0lXILgzPPz_PvjAxJNY-xHNPsgyp-ucw';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
for (const url of ['/matrix','/type/entp','/lexicon','/network','/calculator']) {
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
  await ctx.addCookies([{name:'octant_session',value:COOKIE,domain:'localhost',path:'/'}]);
  const p=await ctx.newPage();
  await p.addInitScript(()=>localStorage.setItem('octant.onboarding.done','1'));
  await p.goto('http://localhost:5173'+url,{waitUntil:'networkidle'}).catch(()=>{});
  await p.waitForTimeout(500);
  const r=await p.evaluate(()=>({docW:document.documentElement.scrollWidth, winW:window.innerWidth, bodyOverflow: document.body.scrollWidth}));
  console.log(url, 'docScrollW', r.docW, 'winW', r.winW, r.docW>r.winW?'*** H-SCROLL ***':'ok');
  await ctx.close();
}
await b.close();
