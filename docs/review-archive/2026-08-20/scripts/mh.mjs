import { chromium } from 'playwright';
const COOKIE='eyJsIjoiZGV2IiwiayI6ImNvZGUiLCJjIjoiYTNlZTc4NmI1NzA3YzI3ZCIsImUiOjE3ODk4MDgyNjF9.AGDec1UEnwu0lXILgzPPz_PvjAxJNY-xHNPsgyp-ucw';
const OUT='/tmp/claude-0/-home-user-octant/9226adb3-21b5-57f0-8777-75de8a014f78/scratchpad/crops';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
for (const w of [1400,1500,1300]) {
  const ctx=await b.newContext({viewport:{width:w,height:500},deviceScaleFactor:1,colorScheme:'light'});
  await ctx.addCookies([{name:'octant_session',value:COOKIE,domain:'localhost',path:'/'}]);
  const p=await ctx.newPage();
  // set rail closed with correct prefix + onboarding done
  await p.addInitScript(()=>{ localStorage.setItem('octant.chat.open','0'); localStorage.setItem('octant.onboarding.done','1'); });
  await p.goto('http://localhost:5173/type/entp',{waitUntil:'networkidle'}).catch(()=>{});
  await p.waitForTimeout(600);
  const info = await p.evaluate(()=>{
    const m=document.querySelector('.masthead'); const r=m.getBoundingClientRect();
    const tabs=document.querySelector('nav.tabs'); const ts=getComputedStyle(tabs);
    const railOpen = !!document.querySelector('.rail-log');
    return {mastH: Math.round(r.height), tabsDisplay: ts.display, railOpen };
  });
  console.log('viewport', w, JSON.stringify(info));
  await p.screenshot({path:`${OUT}/mast-closed-${w}.png`, clip:{x:0,y:0,width:w,height:Math.min(160,info.mastH+40)}});
  await ctx.close();
}
await b.close();
