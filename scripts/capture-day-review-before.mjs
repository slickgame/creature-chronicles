import {chromium} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
const cwd=process.cwd(),port=3169,url=`http://127.0.0.1:${port}`,out='/tmp/day-review-before';mkdirSync(out,{recursive:true});
const fixture=JSON.parse(execFileSync(process.execPath,['--no-warnings','--loader','./scripts/ts-test-loader.mjs','--input-type=module','-e',`import{createNewGameSave}from'./tests/helpers/establishedSave.ts';import{saveGameToSlot}from'./src/lib/save/localSaveLifecycle.ts';import{getStarterGoals}from'./src/data/starterGoals.ts';import{getGoalStoryFlag}from'./src/data/chapterOneStory.ts';import{grantFarmResources,setIngredientFeeding}from'./src/data/farmResources.ts';let s=createNewGameSave('Daily review visual QA',0);for(const g of getStarterGoals(s)){s.flags['starterGoalReward_'+g.id]=true;s.flags[getGoalStoryFlag(g)]=true;}s.flags.m24IntroSeen=true;s.flags.m24ChapterOneStoryComplete=true;s.flags.ranchFeedStock=0;s.flags.ranchDamage=0;s=setIngredientFeeding(grantFarmResources(s,{vegetables:4,wheat:2,meat:1,rations:1}),true).save;console.log(JSON.stringify(saveGameToSlot(s)));`],{cwd,encoding:'utf8'}));
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{cwd,stdio:'ignore'});
let browser,page;const missing=new Set(),errors=[];
try{
 for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/tmp/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--single-process','--no-zygote','--disable-gpu','--disable-software-rasterizer','--disable-gpu-compositing'],headless:true});
 page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/images/**',r=>{const p=new URL(r.request().url()).pathname;if(existsSync(cwd+'/public'+p))return r.continue();missing.add(p);return r.fulfill({status:404,body:''});});
 await page.goto(url);await page.evaluate(f=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('creature_chronicles_save_slot_0',JSON.stringify(f));localStorage.setItem('creature_chronicles_active_save_id',f.saveId);},fixture);await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
 const ledger=page.locator('[data-ledger-book]'),night=page.locator('[data-night-review]');await ledger.waitFor();await ledger.getByRole('button',{name:'End Ranch Day',exact:true}).click();await night.waitFor();
 for(const width of [1440,390]){await page.setViewportSize({width,height:width===390?844:900});for(const tab of ['Tonight','Recovery']){await night.getByRole('navigation',{name:'Night review pages'}).getByRole('button',{name:tab,exact:true}).click();await page.waitForTimeout(150);await page.screenshot({path:`${out}/night-${tab.toLowerCase()}-${width}.png`});}}
 await page.setViewportSize({width:1440,height:900});await night.getByRole('button',{name:'Sleep & Advance Day',exact:true}).click();await page.getByRole('button',{name:'Review Morning Brief',exact:true}).waitFor();
 for(const width of [1440,390]){await page.setViewportSize({width,height:width===390?844:900});await page.waitForTimeout(150);await page.screenshot({path:`${out}/morning-${width}.png`});}
 writeFileSync(out+'/capture.json',JSON.stringify({missing:[...missing],errors},null,2));console.log(JSON.stringify({out,missing:[...missing],errors}));
}catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});console.error(e);process.exitCode=1;}finally{await browser?.close();server.kill();}
