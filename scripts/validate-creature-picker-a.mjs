import { chromium } from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const cwd=process.cwd(), out=process.env.PICKER_QA_OUTPUT||'/tmp/creature-picker-a-proof', port=3131, url=`http://127.0.0.1:${port}`;
mkdirSync(out,{recursive:true});
const fixture=JSON.parse(readFileSync('/tmp/work-ledger-fixture.json'));
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{cwd,stdio:'ignore'});
let browser,page;const results=[],errors=[];
const check=(label,value=true)=>{assert.ok(value,label);results.push({label});};
try{
 for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch({executablePath:'/tmp/work-skills-chromium/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--single-process','--no-zygote','--disable-gpu'],headless:true});
 page=await browser.newPage({viewport:{width:1440,height:900},hasTouch:true});page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/images/**',r=>{const p=new URL(r.request().url()).pathname;return existsSync(cwd+'/public'+p)||p.includes('/care-b/')?r.continue():r.fulfill({body:readFileSync(cwd+'/public/images/ui/locations-v2/builder-yard.webp'),contentType:'image/webp'});});
 const main=page.locator('[data-care-ledger]');
 const read=()=>page.evaluate(()=>localStorage.getItem('creature_chronicles_save_slot_0'));
 async function seed(save){
  await page.setViewportSize({width:1440,height:900});await page.goto(url);await page.evaluate(f=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('creature_chronicles_save_slot_0',JSON.stringify(f));localStorage.setItem('creature_chronicles_active_save_id',f.saveId);},save);await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
  const ledger=page.locator('[data-ledger-book]');if(await ledger.count())await ledger.getByRole('button',{name:'Close ranch ledger',exact:true}).click();await page.locator('[data-navigation-launcher]').first().click();await page.getByRole('dialog',{name:'Menu',exact:true}).getByRole('button',{name:/^Creatures/}).click();await page.getByRole('button',{name:'Choose creature',exact:true}).click();await page.getByRole('searchbox',{name:'Search creatures',exact:true}).fill(save.creatures[0].nickname);await page.getByRole('button',{name:'Open profile →',exact:true}).click();await page.getByRole('tab',{name:'Care',exact:true}).click();await page.waitForTimeout(100);
 }
 async function bounds(label,loc){const size=page.viewportSize();const m=await loc.evaluate(e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom,w:e.clientWidth,sw:e.scrollWidth,h:e.clientHeight,sh:e.scrollHeight,bad:[...e.querySelectorAll('button,input')].filter(x=>{const r=x.getBoundingClientRect();return r.width&&r.height&&(r.x<b.x-2||r.y<b.y-2||r.right>b.right+2||r.bottom>b.bottom+2);}).map(x=>x.textContent)}});check(`${label} ${size.width}x${size.height} ${JSON.stringify(m)}`,m.x>=-2&&m.y>=-2&&m.right<=size.width+2&&m.bottom<=size.height+2&&m.sw<=m.w+2&&m.sh<=m.h+2&&!m.bad.length);}
 async function management(){const tab=main.getByRole('button',{name:'Management',exact:true});if(await tab.isVisible())await tab.click();}
 async function removal(){await management();const next=main.getByRole('navigation',{name:'Management pages'}).getByRole('button',{name:'Next',exact:true});if(await next.isVisible()&&await next.isEnabled())await next.click();}
 async function art(){await main.locator('img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode().catch(()=>{})));});check('All visible Care art loaded',await main.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.getBoundingClientRect().width>0).every(i=>i.complete&&i.naturalWidth>0)));}


 fixture.creatures=Array.from({length:14},(_,i)=>({...structuredClone(fixture.creatures[0]),creatureId:i?`picker-${i}`:fixture.creatures[0].creatureId,nickname:i?`Mira ${i}`:'Mira',energy:i%3===0?20:91,isLocked:i===2,isFavorite:i===1}));
 fixture.creatures[13].nickname='ABCDEFGHIJKLMNOPQRSTUVWX';
 await seed(fixture);const baseline=await read();
 await page.getByRole('button',{name:'Choose creature',exact:true}).click();
 const picker=page.locator('[data-creature-picker]');
 await picker.getByRole('searchbox').fill('');
 const previous=picker.getByRole('navigation',{name:'Creatures pages'}).getByRole('button',{name:'← Previous',exact:true});
 while(await previous.isEnabled())await previous.click();
 await picker.getByRole('button',{name:/^Select /}).first().click();

 for(const size of [{width:1440,height:900},{width:1280,height:720},{width:390,height:844},{width:360,height:740},{width:844,height:390},{width:390,height:500}]){
  await page.setViewportSize(size);await page.waitForTimeout(200);await bounds('Picker A',picker);
  const count=await picker.locator('article[data-selected]').count();
  if(size.width===1440)check('Desktop uses spare height for at least seven rows',count>=7);
  if(size.width===390&&size.height===844)check('Phone accommodates at least four rows',count>=4);
  check('Rows and text stay contained',await picker.locator('article[data-selected]').evaluateAll(rows=>rows.every(row=>{const b=row.getBoundingClientRect();return [...row.querySelectorAll('button,strong,small')].every(el=>{const r=el.getBoundingClientRect();return !r.width||r.top>=b.top-2&&r.bottom<=b.bottom+2&&r.left>=b.left-2&&r.right<=b.right+2})})));

  check('No sex markers',!/(Female|Male|♀|♂)/.test(await picker.innerText()));
  check('Pagination visible',await picker.getByRole('navigation',{name:'Creatures pages'}).isVisible());
  if([1440,390].includes(size.width)&&size.height!==500)await page.screenshot({path:`${out}/picker-${size.width}.png`,animations:'disabled'});
 }
 await page.setViewportSize({width:1440,height:900});await picker.getByRole('searchbox').fill('Mira 7');await picker.getByRole('button',{name:'Select Mira 7',exact:true}).click();check('Preview stays in picker',await picker.isVisible());check('Preview names chosen creature',await picker.getByRole('heading',{name:'Mira 7',exact:true}).isVisible());check('Preview is read-only',baseline===await read());
 await page.getByRole('button',{name:'Back to profile',exact:true}).click();check('Cancel retains original creature',await main.getByRole('heading',{name:'Health & care',exact:true}).isVisible());check('Cancel no write',baseline===await read());check('Original profile identity retained',await page.locator('article[aria-label="Mira selected creature"]').count()===1);
 await page.getByRole('button',{name:'Choose creature',exact:true}).click();await picker.getByRole('button',{name:'Open profile →',exact:true}).click();check('Open returns Care tab',await main.isVisible());check('Open no write',baseline===await read());
 await page.getByRole('button',{name:'Choose creature',exact:true}).click();await picker.getByRole('searchbox').fill('nonexistent');check('Empty state',await picker.getByRole('heading',{name:'No creatures match'}).isVisible());await picker.getByRole('button',{name:'Clear filters',exact:true}).click();
 await picker.getByRole('button',{name:/Filters & Sort/}).click();let dlg=page.getByRole('dialog',{name:'Filters & Sort'});check('Existing filters retained',await dlg.isVisible());await page.keyboard.press('Escape');
 await picker.getByRole('button',{name:'Compare',exact:true}).click();dlg=page.getByRole('dialog',{name:'Choose Creatures to Compare'});await dlg.getByRole('button',{name:'Select Mira',exact:true}).click();await dlg.getByRole('button',{name:'Select Mira 1',exact:true}).click();await dlg.getByRole('button',{name:'Compare Creatures',exact:true}).click();check('Compare opens',await page.getByRole('dialog').isVisible());await page.keyboard.press('Escape');
 check('All browsing read-only',baseline===await read());
 await picker.getByRole('searchbox').fill('Mira 7');await picker.getByRole('button',{name:'Add favorite: Mira 7'}).first().click();check('Favorite persists',JSON.parse(await read()).creatures.find(c=>c.nickname==='Mira 7').isFavorite===true);
 await picker.getByRole('button',{name:'Lock creature: Mira 7'}).first().click();check('Lock persists',JSON.parse(await read()).creatures.find(c=>c.nickname==='Mira 7').isLocked===true);check('Unlock label updates',await picker.getByRole('button',{name:'Unlock creature: Mira 7'}).first().isVisible());
 await picker.getByRole('searchbox').fill('ABCDEFGHIJKLMNOPQRSTUVWX');
 for(const size of [{width:360,height:740},{width:844,height:390}]){await page.setViewportSize(size);await page.waitForTimeout(150);await bounds('Long name',picker);check('Long row fits',await picker.locator('article[data-selected]').evaluateAll(rows=>rows.every(row=>{const b=row.getBoundingClientRect();return [...row.querySelectorAll('button,strong,small')].every(el=>{const r=el.getBoundingClientRect();return !r.width||r.top>=b.top-2&&r.bottom<=b.bottom+2&&r.left>=b.left-2&&r.right<=b.right+2})})));}
 await picker.getByRole('searchbox').focus();await page.keyboard.press('Escape');check('Escape returns profile',await picker.count()===0);
 check('No runtime errors',errors.length===0);writeFileSync(out+'/results.json',JSON.stringify({checks:results.length,results,errors},null,2));console.log(JSON.stringify({checks:results.length,out}));
}catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});console.error(e);process.exitCode=1;}finally{await browser?.close();server.kill();}
