import {chromium} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const cwd=process.cwd(),out='/tmp/creature-navigation-proof',port=3160,url=`http://127.0.0.1:${port}`;
mkdirSync(out,{recursive:true});
const fixture=JSON.parse(execFileSync(process.execPath,['--no-warnings','--loader','./scripts/ts-test-loader.mjs','--input-type=module','-e',`
import{createNewGameSave}from'./tests/helpers/establishedSave.ts';
import{getStarterGoals}from'./src/data/starterGoals.ts';
import{getGoalStoryFlag}from'./src/data/chapterOneStory.ts';
import{saveGameToSlot}from'./src/lib/save/localSave.ts';
const s=createNewGameSave('Creature navigation QA',0);
for(const g of getStarterGoals(s)){s.flags['starterGoalReward_'+g.id]=true;s.flags[getGoalStoryFlag(g)]=true;}
s.flags.m24IntroSeen=true;s.flags.m24ChapterOneStoryComplete=true;
s.flags.energySnackStock=6;s.flags.affectionTreatStock=8;
s.creatures[0].nickname='Original';s.creatures[1]={...structuredClone(s.creatures[0]),creatureId:s.creatures[1].creatureId,nickname:'Return target'};
s.creatures[1].energy=35;s.creatures[1].affection=50;
console.log(JSON.stringify(saveGameToSlot(s)));`],{cwd,encoding:'utf8'}));
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{cwd,stdio:'ignore'});
let browser,page;const results=[],errors=[];
const check=(label,value=true)=>{assert.ok(value,label);results.push({label});};
try{
 for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch({executablePath:'/tmp/inventory-browser/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--single-process','--no-zygote','--disable-gpu','--disable-software-rasterizer','--disable-gpu-compositing'],headless:true});
 page=await browser.newPage({viewport:{width:1440,height:900},hasTouch:true});page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/images/**',r=>{const p=new URL(r.request().url()).pathname;return existsSync(cwd+'/public'+p)?r.continue():r.fulfill({body:readFileSync(cwd+'/public/images/ui/locations-v2/builder-yard.webp'),contentType:'image/webp'});});
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('creature_chronicles_save_slot_0')));
 async function seed(save){
  await page.goto(url);await page.evaluate(f=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('creature_chronicles_save_slot_0',JSON.stringify(f));const other=structuredClone(f);other.saveId=f.saveId+'_other';other.slotIndex=1;other.creatures[0].nickname='Other ranch';localStorage.setItem('creature_chronicles_save_slot_1',JSON.stringify(other));localStorage.setItem('creature_chronicles_active_save_id',f.saveId);},save);await page.reload();
  await page.getByRole('button',{name:'Load Game',exact:true}).click();await page.getByRole('article').filter({has:page.getByRole('heading',{name:'File 1',exact:true})}).getByRole('button',{name:'Load',exact:true}).click();const ledger=page.locator('[data-ledger-book]');if(await ledger.count())await ledger.getByRole('button',{name:'Close ranch ledger',exact:true}).click();
  await page.locator('[data-navigation-launcher]').first().click();await page.getByRole('dialog',{name:'Menu',exact:true}).getByRole('button',{name:/^Creatures/}).click();
 }
 async function choose(name){await page.getByRole('button',{name:'Choose creature',exact:true}).click();await page.getByRole('searchbox',{name:'Search creatures',exact:true}).fill(name);await page.getByRole('button',{name:'Open profile →',exact:true}).click();}
 async function tab(name,value){const picker=page.getByRole('combobox',{name:'Creature section',exact:true});if(await picker.isVisible())await picker.selectOption(value);else await page.getByRole('tab',{name,exact:true}).click();await page.locator(`[data-creature-section=${value}]`).waitFor();}
 async function returnCheck(section){await page.locator(`[data-creature-section=${section}]`).waitFor();check('Return keeps selected creature',await page.locator('[data-oa=art]').getAttribute('alt')==='Return target full body');check('Return keeps '+section,await page.locator(`[data-creature-section=${section}]`).isVisible());}
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  await page.setViewportSize(viewport);await seed(fixture);await choose('Return target');await tab('Equipment','equipment');const before=await read();
  await page.getByRole('button',{name:'Habitat',exact:true}).click();await page.locator('[data-habitat-courtyard]').waitFor();check('Habitat receives exact creature',await page.getByRole('heading',{name:'Return target',exact:true}).isVisible());
  await page.getByRole('button',{name:'Previous screen',exact:true}).click();await page.getByRole('button',{name:'Choose creature',exact:true}).waitFor();
  if(process.env.CREATURE_NAV_DIAGNOSE){console.log(JSON.stringify({viewport,art:await page.locator('[data-oa=art]').getAttribute('alt'),section:await page.locator('[data-creature-section]').getAttribute('data-creature-section')}));await page.screenshot({path:out+`/before-${viewport.width}.png`});continue;}
  await returnCheck('equipment');
  await tab('Inventory','inventory');await page.getByRole('button',{name:'Profile & Care',exact:true}).click();await page.locator('[data-profile-card-a]').waitFor();await page.keyboard.press('Escape');await returnCheck('inventory');
  await page.getByRole('button',{name:'Habitat',exact:true}).click();await page.locator('[data-habitat-courtyard]').waitFor();await page.getByRole('button',{name:'Open profile',exact:true}).click();await page.locator('[data-habitat-profile]').waitFor();await tab('Stats & Growth','stats');await page.keyboard.press('Escape');check('Habitat profile closes to same resident',await page.getByRole('heading',{name:'Return target',exact:true}).isVisible());await page.getByRole('button',{name:'Previous screen',exact:true}).click();await returnCheck('inventory');
  await page.getByRole('button',{name:'Choose creature',exact:true}).click();check('Picker search receives focus',await page.getByRole('searchbox',{name:'Search creatures',exact:true}).evaluate(e=>e===document.activeElement));await page.keyboard.press('Escape');await returnCheck('inventory');check('Picker Escape restores launcher focus',await page.getByRole('button',{name:'Choose creature',exact:true}).evaluate(e=>e===document.activeElement));
  check('Entire navigation flow read-only',JSON.stringify(await read())===JSON.stringify(before));
  for(const [label,section] of [['Overview','overview'],['Stats & Growth','stats'],['Work Skills','work'],['Talents','talents'],['Lineage','lineage'],['Inventory','inventory'],['Equipment','equipment'],['Care','care']]){await tab(label,section);check('Section reachable '+section+' '+viewport.width,await page.locator(`[data-creature-section=${section}]`).isVisible());}
  await tab('Inventory','inventory');
  await page.screenshot({path:out+`/after-${viewport.width}.png`});
  await page.locator('[data-navigation-launcher]').first().click();await page.getByRole('dialog',{name:'Menu',exact:true}).getByRole('button',{name:/^Save & Options/}).click();await page.getByRole('button',{name:'Load Game',exact:true}).click();await page.getByRole('article').filter({has:page.getByRole('heading',{name:'File 2',exact:true})}).getByRole('button',{name:'Load',exact:true}).click();
  if(await page.getByRole('button',{name:'Begin Ranch Day',exact:true}).count())await page.keyboard.press('Escape');
  await page.locator('[data-navigation-launcher]').first().click();await page.getByRole('dialog',{name:'Menu',exact:true}).getByRole('button',{name:/^Creatures/}).click();await page.locator('[data-creature-section=overview]').waitFor();check('Other save starts on its own first creature',await page.locator('[data-oa=art]').getAttribute('alt')==='Other ranch full body');check('Other save does not inherit Inventory',await page.locator('[data-creature-section=overview]').isVisible());
 }
 check('No runtime errors',errors.length===0);writeFileSync(out+'/results.json',JSON.stringify({checks:results.length,results,errors},null,2));console.log(JSON.stringify({checks:results.length,out}));
}catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});console.error(e);process.exitCode=1;}finally{await browser?.close();server.kill();}
