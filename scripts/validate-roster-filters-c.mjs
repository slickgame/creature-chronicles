import { chromium } from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const cwd=process.cwd(), out='/tmp/roster-filters-c-proof', port=3131, url=`http://127.0.0.1:${port}`;
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



 fixture.creatures=Array.from({length:8},(_,i)=>({...structuredClone(fixture.creatures[0]),creatureId:i?`filter-${i}`:fixture.creatures[0].creatureId,nickname:i?`Mira ${i}`:'Mira',level:i+1,energy:i%2?10:91,isFavorite:i===1,isLocked:i===2}));
 await seed(fixture);await page.getByRole('button',{name:'Choose creature',exact:true}).click();
 const picker=page.locator('[data-creature-picker]');await picker.getByRole('searchbox').fill('');const baseline=await read();
 const open=async()=>{await picker.getByRole('button',{name:/Filters & Sort/}).click();return page.getByRole('dialog',{name:'Filters & Sort',exact:true});};
 let dlg=await open();
 for(const size of [{width:1440,height:900},{width:1280,height:720},{width:390,height:844},{width:360,height:740},{width:844,height:390},{width:390,height:500}]){
  await page.setViewportSize(size);await page.waitForTimeout(100);
  for(const section of ['Condition','Details','Sort']){
   await dlg.getByRole('button',{name:section,exact:true}).click();await bounds(section,dlg);
   check('Visible fields contained',await dlg.locator('select,input').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect(),d=e.closest('dialog').getBoundingClientRect();return r.width>0&&r.top>=d.top&&r.bottom<=d.bottom&&r.left>=d.left&&r.right<=d.right;})));
   check('Assets loaded',await dlg.locator('img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode()));return imgs.every(i=>i.naturalWidth>0);}));
   if([1440,390].includes(size.width)&&size.height!==500)await page.screenshot({path:`${out}/${section.toLowerCase()}-${size.width}.png`,animations:'disabled'});
  }
 }
 await page.setViewportSize({width:1440,height:900});await dlg.getByRole('button',{name:'Condition',exact:true}).click();await dlg.getByRole('searchbox').fill('Mira 7');check('Draft match count updates',/1 of 8 creatures match/.test(await dlg.innerText()));check('Background search unchanged',await picker.getByRole('searchbox').inputValue()==='');await dlg.getByRole('button',{name:'Cancel',exact:true}).click();check('Cancel keeps filters',await picker.getByRole('searchbox').inputValue()==='');
 dlg=await open();await dlg.getByRole('searchbox').fill('Mira 7');await dlg.getByRole('button',{name:'Show 1 creature',exact:true}).click();check('Apply updates roster',await picker.getByRole('searchbox').inputValue()==='Mira 7');
 dlg=await open();await dlg.getByRole('button',{name:'Clear filters',exact:true}).click();await page.keyboard.press('Escape');check('Escape discards clear',await picker.getByRole('searchbox').inputValue()==='Mira 7');
 dlg=await open();await dlg.getByRole('button',{name:'Clear filters',exact:true}).click();await dlg.getByRole('button',{name:'Details',exact:true}).click();await dlg.getByRole('checkbox',{name:'Favorites only'}).check();check('Favorite preview count',/1 of 8/.test(await dlg.innerText()));await dlg.getByRole('checkbox',{name:'Favorites only'}).uncheck();await dlg.getByRole('combobox',{name:'Variant',exact:true}).selectOption('variant_base_feline');await dlg.getByRole('button',{name:'Condition',exact:true}).click();await dlg.getByRole('combobox',{name:'Family',exact:true}).selectOption('canine');await dlg.getByRole('button',{name:'Details',exact:true}).click();check('Family resets variant',await dlg.getByRole('combobox',{name:'Variant',exact:true}).inputValue()==='all');check('Zero result count',/0 of 8/.test(await dlg.innerText()));
 await dlg.getByRole('button',{name:'Clear filters',exact:true}).click();await dlg.getByRole('button',{name:'Sort',exact:true}).click();await dlg.getByRole('combobox',{name:'Sort by',exact:true}).selectOption('name');check('Text sort direction descriptive',/A to Z/.test(await dlg.innerText()));await dlg.getByRole('combobox',{name:'Sort by',exact:true}).selectOption('level');await dlg.getByRole('combobox',{name:'Direction',exact:true}).selectOption('desc');await dlg.getByRole('button',{name:'Show 8 creatures',exact:true}).click();const prev=picker.getByRole('navigation',{name:'Creatures pages'}).getByRole('button',{name:'← Previous',exact:true});while(await prev.isEnabled())await prev.click();check('Sorted roster visible',await picker.getByRole('button',{name:'Select Mira 7',exact:true}).isVisible());
 check('No save writes from filtering',baseline===await read());check('No runtime exceptions',errors.length===0);writeFileSync(out+'/results.json',JSON.stringify({checks:results.length,results,errors},null,2));console.log(JSON.stringify({checks:results.length,out}));
}catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});console.error(e);process.exitCode=1;}finally{await browser?.close();server.kill();}
