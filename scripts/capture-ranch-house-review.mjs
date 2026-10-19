import {chromium} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const cwd=process.cwd(),port=3162,url=`http://127.0.0.1:${port}`,out=cwd+'/docs/validation';
mkdirSync(out,{recursive:true});
const fixture=JSON.parse(execFileSync(process.execPath,['--no-warnings','--loader','./scripts/ts-test-loader.mjs','--input-type=module','-e',`
import{createNewGameSave}from'./tests/helpers/establishedSave.ts';
import{getStarterGoals}from'./src/data/starterGoals.ts';
import{getGoalStoryFlag}from'./src/data/chapterOneStory.ts';
import{saveGameToSlot}from'./src/lib/save/localSave.ts';
const s=createNewGameSave('Ranch House review',0);
for(const g of getStarterGoals(s)){s.flags['starterGoalReward_'+g.id]=true;s.flags[getGoalStoryFlag(g)]=true;}
s.flags.m24IntroSeen=true;s.flags.m24ChapterOneStoryComplete=true;
console.log(JSON.stringify(saveGameToSlot(s)));`],{cwd,encoding:'utf8'}));
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{cwd,stdio:'ignore'});
let browser,page;const errors=[];
try{
 for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch({executablePath:'/tmp/inventory-browser/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--single-process','--no-zygote','--disable-gpu','--disable-software-rasterizer','--disable-gpu-compositing'],headless:true});
 page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/images/**',r=>{const p=new URL(r.request().url()).pathname;return existsSync(cwd+'/public'+p)?r.continue():r.fulfill({body:readFileSync(cwd+'/public/images/ui/locations-v2/builder-yard.webp'),contentType:'image/webp'});});
 await page.goto(url);await page.evaluate(f=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('creature_chronicles_save_slot_0',JSON.stringify(f));localStorage.setItem('creature_chronicles_active_save_id',f.saveId);},fixture);await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
 if(await page.locator('[data-ledger-book]').count())await page.getByRole('button',{name:'Close ranch ledger',exact:true}).click();
 await page.getByRole('button',{name:'Open Ranch House',exact:true}).click();const house=page.locator('[data-ranch-house]');await house.waitFor();
 const before=await page.evaluate(()=>localStorage.getItem('creature_chronicles_save_slot_0'));
 for(const size of [{width:1440,height:900},{width:390,height:844}]){
  await page.setViewportSize(size);
  for(const section of ['Management','Care','Records','Rest']){await house.getByRole('button',{name:section,exact:true}).click();await page.waitForTimeout(100);await page.screenshot({path:out+`/ranch-house-before-${section.toLowerCase()}-${size.width}.jpg`,type:'jpeg',quality:92,animations:'disabled'});}
  await house.getByRole('button',{name:'Records',exact:true}).click();await house.getByRole('button',{name:/^Ranch ledger/}).click();await page.locator('[data-ledger-book]').waitFor();await page.waitForTimeout(150);await page.screenshot({path:out+`/daily-ledger-before-${size.width}.jpg`,type:'jpeg',quality:92,animations:'disabled'});await page.getByRole('button',{name:'Close ranch ledger',exact:true}).click();
 }
 const after=await page.evaluate(()=>localStorage.getItem('creature_chronicles_save_slot_0'));assert.equal(after,before);assert.equal(errors.length,0);
 writeFileSync(out+'/ranch-house-review-capture.json',JSON.stringify({viewports:['1440x900','390x844'],pages:['Management','Care','Records','Rest','Daily ledger'],readOnly:true,errors},null,2));
 console.log(JSON.stringify({captured:10,readOnly:true,errors}));
}catch(e){await page?.screenshot({path:'/tmp/ranch-house-review-failure.png'}).catch(()=>{});console.error(e);process.exitCode=1;}finally{await browser?.close();server.kill();}
