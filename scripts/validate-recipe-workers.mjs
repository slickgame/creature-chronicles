import { chromium } from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const cwd=process.cwd(),out='/tmp/recipe-workers-proof',port=3119;
mkdirSync(out,{recursive:true});
const fixture=JSON.parse(readFileSync('/tmp/work-ledger-fixture.json'));
const farm={version:1,stock:{wood:100,wheat:100,vegetables:100,milk:100,eggs:100},reserves:{wood:2},assignments:{},facilities:{sawmill:true},lastDay:fixture.dayState.dayNumber,meals:{},orders:{},report:[]};
fixture.flags.farmResourcesV1=JSON.stringify(farm);
for(const c of fixture.creatures){c.energy=100;for(const id of ['crafting','cooking'])c.choreSkills[id]={level:5,xp:94,xpToNext:95,lifetimeXp:300};}
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{cwd,stdio:'ignore'});
let browser,page;const results=[],errors=[];
try{
 for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch({executablePath:'/tmp/work-skills-chromium/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--single-process','--no-zygote','--disable-gpu'],headless:true});
 page=await browser.newPage({viewport:{width:1440,height:900}});page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(String(e)));
 // Sparse-checkout fallback for unrelated pre-existing art; no generated UI substitutes.
 await page.route('**/images/**',r=>{const path=new URL(r.request().url()).pathname;return existsSync(cwd+'/public'+path)?r.continue():r.fulfill({body:readFileSync(cwd+'/public/images/ui/locations-v2/builder-yard.webp'),contentType:'image/webp'});});
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('creature_chronicles_save_slot_0')));
 async function open(){await page.getByRole('button',{name:'Continue',exact:true}).click();const ledger=page.locator('[data-ledger-book]');if(await ledger.count())await ledger.getByRole('button',{name:'Close ranch ledger',exact:true}).click();await page.locator('[data-navigation-launcher]').first().click();const menu=page.getByRole('dialog',{name:'Menu',exact:true});await menu.getByRole('button',{name:/^Travel/}).click();await page.getByRole('dialog',{name:'Travel',exact:true}).getByRole('button',{name:/^Ranch House/}).click();await page.getByRole('button',{name:/^Farm work & production/}).click();await page.locator('[data-production-book]').waitFor();}
 async function bounds(label,locator){const size=page.viewportSize();const m=await locator.evaluate(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,w:e.clientWidth,sw:e.scrollWidth,h:e.clientHeight,sh:e.scrollHeight,bad:[...e.querySelectorAll('button,select')].filter(x=>{const r=x.getBoundingClientRect();return r.width&&r.height&&(r.right>b.right+2||r.bottom>b.bottom+2);}).map(x=>x.textContent)};});assert.ok(m.x>=-2&&m.y>=-2&&m.right<=size.width+2&&m.bottom<=size.height+2&&m.sw<=m.w+2&&m.sh<=m.h+2&&!m.bad.length,label+JSON.stringify(m));results.push({label,size,m});}
 await page.goto(`http://127.0.0.1:${port}`);await page.evaluate(s=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('creature_chronicles_save_slot_0',JSON.stringify(s));localStorage.setItem('creature_chronicles_active_save_id',s.saveId);},fixture);await page.reload();await open();
 const root=page.locator('[data-production-book]');
 for(const size of [{width:1440,height:900},{width:390,height:844},{width:360,height:740},{width:844,height:390}]){
  await page.setViewportSize(size);
  for(const section of ['Workbench','Kitchen']){
   await root.getByRole('combobox',{name:'Production section',exact:true}).selectOption(section);
   const worker=fixture.creatures[section==='Workbench'?0:1];await root.getByRole('combobox',{name:'Production creature',exact:true}).selectOption(worker.creatureId);
   const baseline=await read();await bounds(section,root);await root.getByRole('button',{name:'Review recipe',exact:true}).click();const review=page.getByRole('dialog',{name:'Confirm recipe',exact:true});await bounds(section+' review',review);assert.match(await review.innerText(),/Energy.*XP/s);await review.getByRole('button',{name:'Cancel',exact:true}).click();assert.deepEqual(await read(),baseline);
   await root.getByRole('button',{name:'Recipe details',exact:true}).click();const detail=page.getByRole('dialog',{name:'Recipe details',exact:true});await bounds(section+' details 1',detail);await detail.getByRole('button',{name:'Next details',exact:true}).click();await bounds(section+' details 2',detail);await page.keyboard.press('Escape');assert.deepEqual(await read(),baseline);
   await page.screenshot({path:`${out}/${section.toLowerCase()}-${size.width}.png`,animations:'disabled'});
  }
 }
 await page.setViewportSize({width:1440,height:900});
 for(const [section,skill,resource,energy,xp]of [['Workbench','crafting','planks',8,11],['Kitchen','cooking','rations',6,12]]){
  await root.getByRole('combobox',{name:'Production section',exact:true}).selectOption(section);await root.getByRole('combobox',{name:'Production creature',exact:true}).selectOption(fixture.creatures[0].creatureId);const before=await read();await root.getByRole('button',{name:'Review recipe',exact:true}).click();await page.waitForTimeout(300);const review=page.getByRole('dialog',{name:'Confirm recipe',exact:true});await review.getByRole('button',{name:'Confirm recipe',exact:true}).click();const receipt=page.getByRole('dialog',{name:'Production receipt',exact:true});assert.match(await receipt.innerText(),/increased from Level 5 to Level 6/);const after=await read(),c=after.creatures[0];assert.equal(c.energy,before.creatures[0].energy-energy);assert.equal(c.choreSkills[skill].xp,xp-1);assert.equal(c.choreSkills[skill].level,6);for(const key of ['energy','stats','choreSkills','xp','level'])assert.deepEqual(after.creatures[1][key],before.creatures[1][key]);assert.equal(JSON.parse(after.flags.farmResourcesV1).stock[resource],(JSON.parse(before.flags.farmResourcesV1).stock[resource]??0)+(resource==='planks'?2:4));await page.screenshot({path:`${out}/${skill}-receipt.png`,animations:'disabled'});await receipt.getByRole('button',{name:'Return to page',exact:true}).click();results.push({label:skill+' transaction',energy,xp,level:6});
 }
 const committed=await read();await page.reload();await open();const reloaded=await read();assert.equal(reloaded.creatures[0].choreSkills.crafting.level,6);assert.equal(reloaded.creatures[0].choreSkills.cooking.level,6);assert.deepEqual(reloaded.creatures[0].choreSkills,committed.creatures[0].choreSkills);assert.equal(reloaded.creatures[0].energy,committed.creatures[0].energy);assert.deepEqual(JSON.parse(reloaded.flags.farmResourcesV1).stock,JSON.parse(committed.flags.farmResourcesV1).stock);
 assert.deepEqual(errors,[]);writeFileSync(out+'/results.json',JSON.stringify({results,errors,cancelWithoutWrite:true,reload:true},null,2));console.log(JSON.stringify({checks:results.length,errors,reload:true}));
}catch(e){await page?.screenshot({path:out+'/failure.png'});console.error(e);process.exitCode=1;}finally{await browser?.close();server.kill();}
