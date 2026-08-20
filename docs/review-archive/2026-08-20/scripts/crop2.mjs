import { chromium } from 'playwright';
const COOKIE='eyJsIjoiZGV2IiwiayI6ImNvZGUiLCJjIjoiYTNlZTc4NmI1NzA3YzI3ZCIsImUiOjE3ODk4MDgyNjF9.AGDec1UEnwu0lXILgzPPz_PvjAxJNY-xHNPsgyp-ucw';
const OUT='/tmp/claude-0/-home-user-octant/9226adb3-21b5-57f0-8777-75de8a014f78/scratchpad/crops';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
for (const w of [1680, 1440]) {
  const ctx=await b.newContext({viewport:{width:w,height:400},deviceScaleFactor:1,colorScheme:'light'});
  await ctx.addCookies([{name:'octant_session',value:COOKIE,domain:'localhost',path:'/'}]);
  const p=await ctx.newPage();
  await p.goto('http://localhost:5173/type/entp',{waitUntil:'networkidle'}).catch(()=>{});
  await p.waitForTimeout(600);
  await p.screenshot({path:`${OUT}/mast-${w}-railopen.png`, clip:{x:0,y:0,width:w,height:130}});
  await ctx.close();
}
await b.close(); console.log('ok');
