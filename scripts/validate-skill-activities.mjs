import { chromium } from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const cwd = process.cwd(), out = process.env.SKILL_ACTIVITY_QA_OUTPUT || '/tmp/skill-activities-proof';
const port = 3121, url = `http://127.0.0.1:${port}`;
mkdirSync(out, { recursive: true });
const fixture = JSON.parse(readFileSync(process.env.WORK_QA_FIXTURE || '/tmp/work-ledger-fixture.json'));
fixture.flags.farmResourcesV1 = JSON.stringify({ version:1, stock:{wood:100,wheat:100,vegetables:100}, reserves:{}, assignments:{}, facilities:{sawmill:true}, lastDay:fixture.dayState.dayNumber, meals:{}, orders:{}, report:[] });
for (const c of fixture.creatures) {
  c.energy = c.maxEnergy;
  for (const id of ['crafting','cooking']) c.choreSkills[id] = {level:5,xp:94,xpToNext:95,lifetimeXp:300};
}
const routes = [
  ['Harvesting','Gathering','garden'], ['Material Gathering','Gathering','woodlot'],
  ['Husbandry','Gathering','dairy'], ['Hunting','Gathering','hunting'],
  ['Crafting','Workbench','planks'], ['Cooking','Kitchen','rations'],
];
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)], {cwd,stdio:'ignore'});
let browser, page;
const results = [], errors = [];
try {
  for (let i=0;i<100;i++) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise(r=>setTimeout(r,200)); }
  browser = await chromium.launch({executablePath:process.env.WORK_QA_CHROMIUM || '/tmp/work-skills-chromium/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--single-process','--no-zygote','--disable-gpu'],headless:true});
  page = await browser.newPage({viewport:{width:1440,height:900}});
  page.setDefaultTimeout(15000);
  page.on('pageerror', e=>errors.push(String(e)));
  // Sparse-checkout fallback for unrelated legacy art. Runtime UI and available art remain real.
  await page.route('**/images/**', r=>{const path=new URL(r.request().url()).pathname;return existsSync(cwd+'/public'+path)?r.continue():r.fulfill({body:readFileSync(cwd+'/public/images/ui/locations-v2/builder-yard.webp'),contentType:'image/webp'});});
  const read = ()=>page.evaluate(()=>localStorage.getItem('creature_chronicles_save_slot_0'));
  async function selectSection() {
    const select = page.getByRole('combobox',{name:'Creature section',exact:true});
    if (await select.isVisible()) await select.selectOption({label:'Work Skills'});
    else await page.getByRole('tab',{name:'Work Skills',exact:true}).click();
  }
  async function chooseCreature(name) {
    await page.getByRole('button',{name:'Choose creature',exact:true}).click();
    await page.getByRole('searchbox',{name:'Search creatures',exact:true}).fill(name);
    await page.getByRole('button',{name:`Select ${name}`,exact:true}).click();
    await selectSection();
  }
  async function seed() {
    await page.goto(url);
    await page.evaluate(s=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('creature_chronicles_save_slot_0',JSON.stringify(s));localStorage.setItem('creature_chronicles_active_save_id',s.saveId);},fixture);
    await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
    const ledger=page.locator('[data-ledger-book]');if(await ledger.count())await ledger.getByRole('button',{name:'Close ranch ledger',exact:true}).click();
    await page.locator('[data-navigation-launcher]').first().click();
    await page.getByRole('dialog',{name:'Menu',exact:true}).getByRole('button',{name:/^Creatures/}).click();
    await chooseCreature('Mira');
  }
  async function skill(name) {
    const root=page.locator('[data-work-ledger]');
    await root.getByRole('button',{name:'All skills',exact:true}).click();
    const previous=root.getByRole('button',{name:'Previous',exact:true});
    while(await previous.count() && await previous.isEnabled())await previous.click();
    while(!await root.getByRole('button',{name:`Select ${name}`,exact:true}).count())await root.getByRole('button',{name:'Next',exact:true}).click();
    await root.getByRole('button',{name:`Select ${name}`,exact:true}).click();
    await root.getByRole('button',{name:/View skill details/}).click();
    const details=page.getByRole('dialog',{name:`${name} · Skill details`,exact:true});
    await details.getByRole('button',{name:'Use & training',exact:true}).click();
    return details;
  }
  async function bounds(label, locator) {
    const size=page.viewportSize();
    const m=await locator.evaluate(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,w:e.clientWidth,sw:e.scrollWidth,h:e.clientHeight,sh:e.scrollHeight,bad:[...e.querySelectorAll('button,select')].filter(x=>{const r=x.getBoundingClientRect();return r.width&&r.height&&(r.right>b.right+2||r.bottom>b.bottom+2);}).map(x=>x.textContent)};});
    assert.ok(m.x>=-2&&m.y>=-2&&m.right<=size.width+2&&m.bottom<=size.height+2&&m.sw<=m.w+2&&m.sh<=m.h+2&&!m.bad.length,label+JSON.stringify(m));
    results.push({label,size,m});
  }
  await seed();
  for(const size of [{width:1440,height:900},{width:390,height:844},{width:360,height:740},{width:844,height:390}]) {
    await page.setViewportSize(size);await selectSection();
    for(const [name,section,selection] of routes) {
      const details=await skill(name), before=await read();
      assert.match(await details.getByRole('button',{name:'Open activities for Mira',exact:true}).evaluate(e=>getComputedStyle(e).borderImageSource),/primary-normal\.svg/);
      await bounds(name+' details',details);
      if(name==='Crafting' && [1440,390].includes(size.width))await page.screenshot({path:`${out}/shortcut-${size.width}.png`,animations:'disabled'});
      await details.getByRole('button',{name:'Open activities for Mira',exact:true}).click();
      const production=page.locator('[data-production-book]');
      assert.equal(await production.getByRole('combobox',{name:'Production section',exact:true}).inputValue(),section);
      assert.equal(await production.getByRole('combobox',{name:'Select recipe or location',exact:true}).inputValue(),selection);
      assert.equal(await production.getByRole('combobox',{name:'Production creature',exact:true}).inputValue(),fixture.creatures[0].creatureId);
      await bounds(name+' activity',production);
      if(name==='Husbandry') {assert.ok(await production.getByRole('button',{name:'Collect',exact:true}).isDisabled());assert.match(await production.innerText(),/female bovine/);}
      if(name==='Crafting' && [1440,390].includes(size.width))await page.screenshot({path:`${out}/activity-${size.width}.png`,animations:'disabled'});
      // Escape returns to the same details tab, while the explicit return does the same.
      if(name==='Cooking')await page.keyboard.press('Escape');else await production.getByRole('button',{name:'‹ Skill details',exact:true}).click();
      await details.waitFor();assert.equal(await details.getByRole('button',{name:'Use & training',exact:true}).getAttribute('aria-pressed'),'true');
      assert.equal(await read(),before);await details.getByRole('button',{name:'Back to Work Skills',exact:true}).click();
      assert.equal(await page.getByRole('button',{name:`Select ${name}`,exact:true}).getAttribute('aria-pressed'),'true');
    }
    for(const name of ['Breeding','Cleaning']){const details=await skill(name);assert.equal(await details.getByRole('button',{name:/Open activities/}).count(),0);await bounds(name+' planned',details);await page.keyboard.press('Escape');}
  }
  await page.setViewportSize({width:1440,height:900});
  await chooseCreature('Bruna');
  for(const [name,skillId,cost] of [['Crafting','crafting',8],['Cooking','cooking',6]]) {
    const details=await skill(name),before=JSON.parse(await read()),id=fixture.creatures[2].creatureId;
    await details.getByRole('button',{name:'Open activities for Bruna',exact:true}).click();
    const production=page.locator('[data-production-book]');
    assert.equal(await production.getByRole('combobox',{name:'Production creature',exact:true}).inputValue(),id);
    await production.getByRole('button',{name:'Review recipe',exact:true}).click();await page.waitForTimeout(300);
    await page.getByRole('dialog',{name:'Confirm recipe',exact:true}).getByRole('button',{name:'Confirm recipe',exact:true}).click();
    const receipt=page.getByRole('dialog',{name:'Production receipt',exact:true});assert.match(await receipt.innerText(),/increased from Level 5 to Level 6/);
    await receipt.getByRole('button',{name:'Return to page',exact:true}).click();
    await production.getByRole('button',{name:'‹ Skill details',exact:true}).click();
    await details.getByRole('button',{name:'Progress',exact:true}).click();assert.match(await details.innerText(),/6 \/ 20/);
    const after=JSON.parse(await read()),worker=after.creatures.find(c=>c.creatureId===id),old=before.creatures.find(c=>c.creatureId===id);
    assert.equal(worker.energy,old.energy-cost);assert.equal(worker.choreSkills[skillId].level,6);assert.deepEqual(after.creatures[0].choreSkills,before.creatures[0].choreSkills);assert.equal(after.creatures[0].energy,before.creatures[0].energy);
    results.push({label:name+' non-first worker live progress',id,level:6,cost});await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors,[]);writeFileSync(out+'/results.json',JSON.stringify({results,errors,navigationReadOnly:true,nonFirstWorker:true,liveProgress:true},null,2));console.log(JSON.stringify({checks:results.length,errors,navigationReadOnly:true,nonFirstWorker:true,liveProgress:true}));
} catch(e) {await page?.screenshot({path:out+'/failure.png'});console.error(e);process.exitCode=1;}
finally {await browser?.close();server.kill();}
