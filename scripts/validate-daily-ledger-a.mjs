import {chromium} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const cwd=process.cwd(),port=3166,url=`http://127.0.0.1:${port}`,out='/tmp/daily-ledger-a-proof';mkdirSync(out,{recursive:true});
const fixture=JSON.parse(execFileSync(process.execPath,['--no-warnings','--loader','./scripts/ts-test-loader.mjs','--input-type=module','-e',`
import{createNewGameSave}from'./tests/helpers/establishedSave.ts';import{getStarterGoals}from'./src/data/starterGoals.ts';import{getGoalStoryFlag}from'./src/data/chapterOneStory.ts';import{saveGameToSlot}from'./src/lib/save/localSave.ts';
const s=createNewGameSave('Ledger A QA',0);for(const g of getStarterGoals(s)){s.flags['starterGoalReward_'+g.id]=true;s.flags[getGoalStoryFlag(g)]=true;}s.flags.m24IntroSeen=true;s.flags.m24ChapterOneStoryComplete=true;
s.ranchDay.morningBrief={generatedAt:'test',previousDayNumber:1,currentDayNumber:2,dateLabel:'Day 2',warnings:['Check your food before ending the day.'],highlights:['Your ranch is ready for a new day.'],nextSteps:['Visit the nursery.'],moodSummary:[],resourceFlow:{starting:s.ranchDay.startingResources,ending:s.ranchDay.startingResources,goldChange:0,feedChange:0,materialChange:0,energyChange:0}};
s.ranchDay.event={eventId:'supplier',dayNumber:1,eventType:'supplier',title:'Visiting supplier',description:'A supplier offers fresh rations for the ranch.',choices:[{choiceId:'buy-feed',label:'Buy 5 rations',description:'Pay 35 Gold for 5 Balanced rations.',requirementLabel:'35 Gold'},{choiceId:'decline',label:'Decline',description:'Keep your Gold and current stock.'}]};
s.ranchDay.activities=Array.from({length:18},(_,i)=>({activityId:'qa-'+i,dayNumber:1,type:'care',label:i===17?('A complete record must remain readable at every size. '.repeat(18)):'Recorded farm action '+i,createdAt:'test'}));
console.log(JSON.stringify(saveGameToSlot(s)));`],{cwd,encoding:'utf8'}));
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{cwd,stdio:'ignore'});
let browser,page;const errors=[],results=[];const check=(label,value=true)=>{assert.ok(value,label);results.push(label);};
try{
 for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch({executablePath:'/tmp/inventory-browser/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--single-process','--no-zygote','--disable-gpu','--disable-software-rasterizer','--disable-gpu-compositing'],headless:true});
 page=await browser.newPage({viewport:{width:1440,height:900}});page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/images/**',r=>{const p=new URL(r.request().url()).pathname;return existsSync(cwd+'/public'+p)||p.includes('/daily-ledger-a/')?r.continue():r.fulfill({body:readFileSync(cwd+'/public/images/ui/locations-v2/builder-yard.webp'),contentType:'image/webp'});});
 const ledger=page.locator('[data-ledger-book]'),read=()=>page.evaluate(()=>localStorage.getItem('creature_chronicles_save_slot_0'));
 async function load(f){await page.goto(url);await page.evaluate(f=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('creature_chronicles_save_slot_0',JSON.stringify(f));localStorage.setItem('creature_chronicles_active_save_id',f.saveId);},f);await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();await ledger.waitFor();}
 async function bounds(label){const size=page.viewportSize();const bad=await ledger.evaluate(root=>{const b=root.getBoundingClientRect();return [...root.querySelectorAll('button,h1,h2,h3,p,select,footer,article')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.x<b.x-2||r.y<b.y-2||r.right>b.right+2||r.bottom>b.bottom+2||e.scrollWidth>e.clientWidth+3);}).map(e=>({text:e.textContent.slice(0,130),width:e.clientWidth,sw:e.scrollWidth,rect:e.getBoundingClientRect().toJSON()}));});check(label+' '+size.width+'x'+size.height+' '+JSON.stringify(bad),bad.length===0);}
 await load(fixture);const before=await read();
 for(const size of [{width:1440,height:900},{width:1280,height:720},{width:1920,height:720},{width:2560,height:1440},{width:390,height:844},{width:360,height:740},{width:844,height:390},{width:390,height:500}]){
  await page.setViewportSize(size);await page.waitForTimeout(80);
  for(const section of ['Priorities','Brief','Event','Goals','Records','Moods']){
   await ledger.getByRole('button',{name:section,exact:true}).click();await bounds(section);
   const detail=ledger.getByRole('region',{name:'Selected ledger entry',exact:true});
   if(await ledger.getByRole('navigation',{name:'Ledger view'}).count()){await ledger.getByRole('button',{name:'Selected entry',exact:true}).click();await bounds(section+' detail');}
   const pager=ledger.getByRole('navigation',{name:'Detail pages'});let n=0;
   while(await pager.count()&&await pager.getByRole('button',{name:'More ›',exact:true}).isEnabled()){await pager.getByRole('button',{name:'More ›',exact:true}).click();await bounds(section+' full detail '+(++n));assert.ok(n<20);}
   if([1440,390].includes(size.width)&&[900,844].includes(size.height))await page.screenshot({path:out+`/${section.toLowerCase()}-${size.width}.png`,animations:'disabled'});
   check(section+' visible full detail',await detail.isVisible());
  }
 }
 check('All browsing and paging read-only',await read()===before);
 await page.setViewportSize({width:1440,height:900});await ledger.getByRole('button',{name:'Priorities',exact:true}).click();check('Five ranch priorities, no town training',await ledger.getByRole('combobox',{name:'Ledger entry'}).locator('option').count()===5&&!await ledger.getByRole('combobox',{name:'Ledger entry'}).innerText().then(s=>s.includes('Training')));
 await ledger.getByRole('button',{name:'Minimize art',exact:true}).click();await bounds('Minimized');await ledger.getByRole('button',{name:'Expand art',exact:true}).click();
 await page.evaluate(()=>document.fonts.ready);check('Both font weights loaded',await page.evaluate(()=>document.fonts.check('400 16px LedgerTinos')&&document.fonts.check('700 24px LedgerTinos')));
 await ledger.getByRole('button',{name:'Event',exact:true}).click();await ledger.getByRole('button',{name:'Review choice',exact:true}).click();await bounds('Event review');await page.screenshot({path:out+'/event-review-1440.png'});await page.keyboard.press('Escape');check('Escape cancels review without save',await read()===before&&await ledger.getByRole('button',{name:'Review choice',exact:true}).isVisible());
 await page.setViewportSize({width:390,height:844});await ledger.getByRole('button',{name:'Review choice',exact:true}).click();await bounds('Phone event review');await page.screenshot({path:out+'/event-review-390.png'});await ledger.getByRole('button',{name:'Confirm choice',exact:true}).click();
 const paid=JSON.parse(await read());check('Event exactly once, correct Gold',paid.currencies.gold===JSON.parse(before).currencies.gold-35);check('Saved event result',!!paid.ranchDay.event.resultText&&!await ledger.getByRole('button',{name:'Review choice',exact:true}).count());await bounds('Event receipt');
 await ledger.getByRole('button',{name:'Begin Ranch Day',exact:true}).click();check('Explicit begin retains day',JSON.parse(await read()).dayState.dayNumber===paid.dayState.dayNumber&&JSON.parse(await read()).ranchDay.phase==='active');
 await page.getByRole('button',{name:'Open Ranch House',exact:true}).click();const house=page.locator('[data-ranch-house]');await house.getByRole('button',{name:'Records',exact:true}).click();await house.getByRole('button',{name:/^Ranch ledger/}).click();await ledger.waitFor();await ledger.getByRole('button',{name:'Priorities',exact:true}).click();
 await page.setViewportSize({width:1440,height:900});await ledger.getByRole('combobox',{name:'Ledger entry'}).selectOption({label:'2. Nursery'});await ledger.getByRole('button',{name:'Visit Nursery',exact:true}).click();await page.locator('[data-nursery]').waitFor();await page.getByRole('button',{name:'Previous screen',exact:true}).click();await ledger.waitFor();check('Source return restores selected entry',await ledger.getByRole('region',{name:'Selected ledger entry'}).getByRole('heading',{name:'Nursery',exact:true}).isVisible());
 await ledger.getByRole('button',{name:'Review & End Day',exact:true}).click();await page.locator('[data-night-review]').waitFor();check('Day unchanged before sleep',JSON.parse(await read()).dayState.dayNumber===paid.dayState.dayNumber);await page.getByRole('button',{name:'Keep Playing',exact:true}).click();
 // Verify the user-requested resident identity on the existing dock.
 if(await ledger.count())await page.getByRole('button',{name:'Close ranch ledger',exact:true}).click();await house.waitFor();await house.getByRole('button',{name:'Records',exact:true}).click();await house.getByRole('button',{name:/^Creature roster/}).click();await page.getByRole('button',{name:'Habitat',exact:true}).click();await page.locator('[data-habitat-courtyard]').waitFor();check('Resident name level status',await page.getByRole('region',{name:'Residents',exact:true}).locator('button[aria-pressed]').evaluateAll(items=>items.length>0&&items.every(e=>e.querySelector('strong')?.textContent&&/Level \d+/.test(e.innerText)&&e.querySelector('[data-status]')?.textContent)));await page.screenshot({path:out+'/resident-levels.png'});
 // First-morning and empty-record states have different content and controls.
 const empty=structuredClone(fixture);empty.ranchDay.morningBrief=undefined;empty.ranchDay.event=undefined;empty.ranchDay.goals=[];empty.ranchDay.activities=[];empty.creatures=[];empty.creatureIds=[];
 await load(empty);const emptyBefore=await read();
 // Loading intentionally regenerates absent daily goals/events; those empty
 // book branches are covered by the data suite rather than bypassing migration.
 for(const size of [{width:1440,height:900},{width:390,height:844},{width:390,height:500}]){await page.setViewportSize(size);await page.waitForTimeout(60);for(const section of ['Brief','Records','Moods']){await ledger.getByRole('button',{name:section,exact:true}).click();await bounds('Empty '+section);check('Empty '+section+' has priorities link',await ledger.getByRole('button',{name:'View priorities',exact:true}).isVisible());}await ledger.getByRole('button',{name:'Brief',exact:true}).click();await page.screenshot({path:out+`/first-morning-${size.width}-${size.height}.png`});}
 check('Empty sections read-only',await read()===emptyBefore);
 check('No runtime errors',errors.length===0);writeFileSync(out+'/results.json',JSON.stringify({checks:results.length,results,errors},null,2));console.log(JSON.stringify({checks:results.length,out}));
}catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});console.error(e);process.exitCode=1;}finally{await browser?.close();server.kill();}
