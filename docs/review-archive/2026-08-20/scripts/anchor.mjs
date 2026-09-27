import { chromium } from 'playwright';
const COOKIE='eyJsIjoiZGV2IiwiayI6ImNvZGUiLCJjIjoiYTNlZTc4NmI1NzA3YzI3ZCIsImUiOjE3ODk4MDgyNjF9.AGDec1UEnwu0lXILgzPPz_PvjAxJNY-xHNPsgyp-ucw';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1400,height:800},deviceScaleFactor:1});
await ctx.addCookies([{name:'octant_session',value:COOKIE,domain:'localhost',path:'/'}]);
const p=await ctx.newPage();
await p.addInitScript(()=>{ localStorage.setItem('octant.chat.open','0'); localStorage.setItem('octant.onboarding.done','1'); });
// find a section id on type page
await p.goto('http://localhost:5173/type/entp',{waitUntil:'networkidle'}).catch(()=>{});
await p.waitForTimeout(500);
const ids = await p.evaluate(()=>[...document.querySelectorAll('h2.sec[id]')].map(h=>h.id));
const target = ids[3] || ids[1] || ids[0];
await p.goto('http://localhost:5173/type/entp#'+target,{waitUntil:'networkidle'}).catch(()=>{});
await p.waitForTimeout(700);
const r = await p.evaluate((id)=>{
  const m=document.querySelector('.masthead').getBoundingClientRect();
  const h=document.getElementById(id).getBoundingClientRect();
  const cs=getComputedStyle(document.querySelector('.sec'));
  return {targetId:id, mastBottom:Math.round(m.bottom), mastH:Math.round(m.height), headingTop:Math.round(h.top), scrollMargin:cs.scrollMarginTop, hiddenBehind: Math.round(m.bottom - h.top)};
}, target);
console.log(JSON.stringify(r,null,0));
await ctx.close(); await b.close();
