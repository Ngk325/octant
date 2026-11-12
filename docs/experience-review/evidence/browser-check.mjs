import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {writeFileSync} from 'node:fs';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const results=[];
for(const [label,width,height] of [['desktop',1440,900],['mobile',390,844]])for(const theme of ['light','dark']){
 const c=await b.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'});
 await c.request.post('http://127.0.0.1:5173/api/auth/login',{data:{code:'let-me-in'}});
 const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:5173/prototype/experience');await p.getByRole('heading',{name:'Make room for another way.'}).waitFor();
 await p.screenshot({path:`/workspace/setup-evidence/browser/after-experience-${label}-${theme}.png`,fullPage:true});
 await p.getByRole('button',{name:'04 Superego ESFP'}).click();
 await p.getByText('A Showman example.').waitFor();
 await p.getByRole('combobox',{name:'Your starting pattern'}).selectOption('INFJ');
 await p.getByRole('button',{name:'04 Superego ISTJ'}).waitFor();
 if(await p.getByText('A Showman example.').count())throw Error('stale example');
 await p.getByRole('button',{name:'Reactive',exact:true}).click();
 await p.getByRole('button',{name:'Name what I’m seeing +'}).click();
 await p.getByText('Under the picture: exact mechanics & limits').click();
 const axe=await new AxeBuilder({page:p}).analyze();
 const size=await p.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,svgTextMin:Math.min(...[...document.querySelectorAll('.xp-figure svg text')].map(x=>parseFloat(getComputedStyle(x).fontSize)*x.getBoundingClientRect().height/x.getBBox().height))}));
 if(errors.length || size.width > width || size.svgTextMin < 14 || axe.violations.some(v => ['serious','critical'].includes(v.impact))) throw Error(`Browser gate failed: ${label}/${theme}`);
 results.push({label,theme,errors,...size,violations:axe.violations.map(x=>({id:x.id,impact:x.impact,nodes:x.nodes.map(n=>n.target)}))});
 await p.screenshot({path:`/workspace/setup-evidence/browser/after-interaction-${label}-${theme}.png`,fullPage:true});await c.close();
}
await b.close();writeFileSync('/workspace/setup-evidence/browser/prototype.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
