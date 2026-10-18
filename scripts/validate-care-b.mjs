import { chromium } from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const cwd=process.cwd(), out=process.env.CARE_QA_OUTPUT||'/tmp/care-b-proof', port=3131, url=`http://127.0.0.1:${port}`;
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
  const ledger=page.locator('[data-ledger-book]');if(await ledger.count())await ledger.getByRole('button',{name:'Close ranch ledger',exact:true}).click();await page.locator('[data-navigation-launcher]').first().click();await page.getByRole('dialog',{name:'Menu',exact:true}).getByRole('button',{name:/^Creatures/}).click();await page.getByRole('button',{name:'Choose creature',exact:true}).click();await page.getByRole('searchbox',{name:'Search creatures',exact:true}).fill('Mira');await page.getByRole('button',{name:'Select Mira',exact:true}).click();await page.getByRole('tab',{name:'Care',exact:true}).click();await page.waitForTimeout(100);
 }
 async function bounds(label,loc){const size=page.viewportSize();const m=await loc.evaluate(e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom,w:e.clientWidth,sw:e.scrollWidth,h:e.clientHeight,sh:e.scrollHeight,bad:[...e.querySelectorAll('button,input')].filter(x=>{const r=x.getBoundingClientRect();return r.width&&r.height&&(r.x<b.x-2||r.y<b.y-2||r.right>b.right+2||r.bottom>b.bottom+2);}).map(x=>x.textContent)}});check(`${label} ${size.width}x${size.height} ${JSON.stringify(m)}`,m.x>=-2&&m.y>=-2&&m.right<=size.width+2&&m.bottom<=size.height+2&&m.sw<=m.w+2&&m.sh<=m.h+2&&!m.bad.length);}
 async function management(){const tab=main.getByRole('button',{name:'Management',exact:true});if(await tab.isVisible())await tab.click();}
 async function removal(){await management();const next=main.getByRole('navigation',{name:'Management pages'}).getByRole('button',{name:'Next',exact:true});if(await next.isVisible()&&await next.isEnabled())await next.click();}
 async function art(){await main.locator('img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode().catch(()=>{})));});check('All visible Care art loaded',await main.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.getBoundingClientRect().width>0).every(i=>i.complete&&i.naturalWidth>0)));}
 await seed(fixture);
 for(const size of [{width:1440,height:900},{width:1280,height:720},{width:390,height:844},{width:360,height:740},{width:844,height:390}]){
  await page.setViewportSize(size);const focus=main.getByRole('button',{name:'Care',exact:true});if(await focus.isVisible())await focus.click();await page.waitForTimeout(100);const before=await read();await bounds('Care',main);await art();
  if([1440,390].includes(size.width))await page.screenshot({path:`${out}/main-${size.width}.png`,animations:'disabled'});
  await main.getByRole('button',{name:'View details',exact:false}).click();let dlg=page.getByRole('dialog',{name:'Mira · Health & care',exact:true});await bounds('Health details',dlg);await dlg.getByRole('button',{name:'Next detail',exact:true}).click();check('Exact current resource details',/Energy:/.test(await dlg.innerText()));await dlg.getByRole('button',{name:'Next detail',exact:true}).click();check('Complete creature record',/Origin:/.test(await dlg.innerText()));await page.keyboard.press('Escape');check('Health browsing read only',await read()===before);
  await management();await bounds('Management',main);await main.getByRole('button',{name:/^Rename/}).click();dlg=page.getByRole('dialog',{name:'Rename creature',exact:true});await bounds('Rename dialog',dlg);await dlg.getByRole('textbox',{name:'Creature name'}).fill('Uncommitted name');await dlg.getByRole('button',{name:'Cancel',exact:true}).click();check('Rename cancel read only',await read()===before);
  await main.getByRole('button',{name:'Lock creature',exact:true}).click();await main.getByRole('button',{name:'Unlock creature',exact:true}).waitFor();check('Closed lock art when protected',await main.getByRole('button',{name:'Unlock creature',exact:true}).locator('img').getAttribute('src')==='/images/ui/care-b/icons/lock-closed.webp');let saved=JSON.parse(await read());check('Lock persisted to exact creature',saved.creatures.find(c=>c.creatureId===fixture.creatures[0].creatureId).isLocked);
  await removal();await bounds('Transfer or release',main);if(size.width===390)await page.screenshot({path:`${out}/management-390.png`,animations:'disabled'});
  await main.getByRole('button',{name:/^Release/}).click();dlg=page.getByRole('dialog',{name:'Release Mira?',exact:true});check('Protected removal remains blocked',await dlg.getByRole('button',{name:'Release Mira',exact:true}).isDisabled());await dlg.getByRole('button',{name:'Keep creature',exact:true}).click();
  const pages=main.getByRole('navigation',{name:'Management pages'});if(await pages.isVisible())await pages.getByRole('button',{name:'Previous',exact:true}).click();await main.getByRole('button',{name:'Unlock creature',exact:true}).click();await main.getByRole('button',{name:'Lock creature',exact:true}).waitFor();check('Open lock art when unlocked',await main.getByRole('button',{name:'Lock creature',exact:true}).locator('img').getAttribute('src')==='/images/ui/care-b/icons/lock-open.webp');
  await removal();const afterUnlock=await read();for(const action of ['Release','Donate']){await main.getByRole('button',{name:new RegExp(`^${action}`)}).click();dlg=page.getByRole('dialog',{name:`${action} Mira?`,exact:true});await dlg.getByRole('button',{name:'Keep creature',exact:true}).click();check(`${action} cancel preserves save`,await read()===afterUnlock);}
  if(await pages.isVisible())await pages.getByRole('button',{name:'Previous',exact:true}).click();
 }
 // Actual seeded save states, rather than DOM text replacement.
 for(const [label,configure] of [
  ['Tired',c=>{c.energy=Math.floor(c.maxEnergy*.45);c.maxHearts=16;c.hearts=16;}],
  ['Exhausted',c=>{c.energy=1;}],
  ['Hurt',c=>{c.maxHearts=16;c.hearts=12;}],
  ['Wounded',c=>{c.injuryLabel='Wounded';c.injuredUntilDayNumber=999;}],
  ['Training',()=>{}],
 ]){
  const f=structuredClone(fixture);configure(f.creatures[0]);if(label==='Training'){const id=f.creatures[0].creatureId;f.flags[`trainingGroundsAssignment_${id}`]='level_drill';f.flags[`trainingGroundsStartDay_${id}`]=f.dayState.dayNumber;f.flags[`trainingGroundsReturnDay_${id}`]=f.dayState.dayNumber+1;}await seed(f);check(`Live ${label} state`,await main.locator('h4').innerText()===label);check(`Portrait and Care ${label} agree`,await page.locator('[data-status-tone]').innerText()===label);await art();
  if(label==='Tired'||label==='Hurt'){check('High hearts use one normalized bar',await main.getByRole('progressbar',{name:'Hearts',exact:true}).count()===1);const expected=label==='Hurt'?75:100;check('High-heart exact fill',await main.getByRole('progressbar',{name:'Hearts',exact:true}).locator('i').getAttribute('style')===`width: ${expected}%;`);}
  for(const size of [{width:1440,height:900},{width:390,height:844},{width:360,height:740},{width:844,height:390}]){await page.setViewportSize(size);await page.waitForTimeout(80);await bounds(`${label} state`,main);if(label==='Tired'&&[1440,390].includes(size.width))await page.screenshot({path:`${out}/tired-${size.width}.png`,animations:'disabled'});}
 }
 await seed(fixture);await main.getByRole('button',{name:/^Rename/}).click();await page.getByRole('textbox',{name:'Creature name'}).fill('Mira QA');await page.getByRole('button',{name:'Save name',exact:true}).click();check('Rename persists',JSON.parse(await read()).creatures.find(c=>c.creatureId===fixture.creatures[0].creatureId).nickname==='Mira QA');
 const beforeDonation=JSON.parse(await read());await main.getByRole('button',{name:/^Donate/}).click();await page.getByRole('dialog',{name:'Donate Mira QA?',exact:true}).getByRole('button',{name:'Donate Mira QA',exact:true}).click();const afterDonation=JSON.parse(await read());check('Confirmed donation removes exact creature once',!afterDonation.creatures.some(c=>c.creatureId===fixture.creatures[0].creatureId)&&afterDonation.creatures.length===beforeDonation.creatures.length-1);check('Confirmed donation retains existing rewards',afterDonation.currencies.gold>beforeDonation.currencies.gold&&afterDonation.currencies.guildPoints===beforeDonation.currencies.guildPoints+1);check('Donation preserves archived ancestry',Boolean(afterDonation.familyArchive?.records[`creature:${fixture.creatures[0].creatureId}`]));
 check('No runtime exceptions',errors.length===0);writeFileSync(`${out}/results.json`,JSON.stringify({checks:results.length,results,errors},null,2));console.log(JSON.stringify({checks:results.length,out}));
}catch(e){await page?.screenshot({path:`${out}/failure.png`}).catch(()=>{});console.error(e);process.exitCode=1;}finally{await browser?.close();server.kill();}
