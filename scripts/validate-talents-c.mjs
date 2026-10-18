import { chromium } from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const cwd=process.cwd(),out=process.env.TALENTS_QA_OUTPUT || '/tmp/talents-c-proof',port=3123,url=`http://127.0.0.1:${port}`;
mkdirSync(out,{recursive:true});
const fixture=JSON.parse(readFileSync(process.env.WORK_QA_FIXTURE || '/tmp/work-ledger-fixture.json'));
const core=['eager_learner','sound_sleeper','diligent','efficient_worker','sure_strike','thick_hide','light_footed','hot_blooded','lasting_vigor','guard_dog'];
const names=['Eager Learner','Sound Sleeper','Diligent','Efficient Worker','Sure Strike','Thick Hide','Light-Footed','Hot-Blooded','Lasting Vigor','Guard Dog'];
const talent=(id,grade='C',source='general')=>({id,name:names[core.indexOf(id)]||id,grade,source,description:'Saved record description.'});
fixture.creatures[0].abilities=[talent('eager_learner'),talent('sound_sleeper')];
// A synthetic saved-record stress case, never written into the project game content.
fixture.creatures[1].abilities=core.map(id=>talent(id,'A',id==='guard_dog'?'species':'general'));
fixture.creatures[2].abilities=[talent('tiger_instinct','B','variant'),{id:'unknown_saved_talent',name:'Saved keepsake',grade:'D',source:'future',description:'A retained unknown record. '.repeat(30)}];
fixture.creatures[3].abilities=[];
fixture.creatures[4].abilities=[talent('eager_learner','S')];
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{cwd,stdio:'ignore'});
let browser,page;const results=[],errors=[];
const check=(label,value=true)=>{assert.ok(value,label);results.push({label});};
try{
 for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch({executablePath:'/tmp/work-skills-chromium/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--single-process','--no-zygote','--disable-gpu'],headless:true});
 page=await browser.newPage({viewport:{width:1440,height:900}});page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(String(e)));
 // Only unrelated art missing in the sparse checkout gets a fallback. Talent assets must load themselves.
 await page.route('**/images/**',r=>{const p=new URL(r.request().url()).pathname;return existsSync(cwd+'/public'+p)||p.includes('/talents-c/')?r.continue():r.fulfill({body:readFileSync(cwd+'/public/images/ui/locations-v2/builder-yard.webp'),contentType:'image/webp'});});
 const read=()=>page.evaluate(()=>localStorage.getItem('creature_chronicles_save_slot_0'));
 async function section(label){const select=page.getByRole('combobox',{name:'Creature section',exact:true});if(await select.isVisible())await select.selectOption({label});else await page.getByRole('tab',{name:label,exact:true}).click();}
 async function choose(name){const size=page.viewportSize();if(size.height<=550)await page.setViewportSize({width:1440,height:900});await page.getByRole('button',{name:'Choose creature',exact:true}).click();await page.getByRole('searchbox',{name:'Search creatures',exact:true}).fill(name);await page.getByRole('button',{name:`Select ${name}`,exact:true}).click();if(size.height<=550)await page.setViewportSize(size);await section('Talents');}
 async function bounds(label,loc){const size=page.viewportSize(),m=await loc.evaluate(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,w:e.clientWidth,sw:e.scrollWidth,h:e.clientHeight,sh:e.scrollHeight,bad:[...e.querySelectorAll('button,select')].filter(x=>{const r=x.getBoundingClientRect();return r.width&&r.height&&(r.x<b.x-2||r.y<b.y-2||r.right>b.right+2||r.bottom>b.bottom+2);}).map(x=>x.textContent)}});assert.ok(m.x>=-2&&m.y>=-2&&m.right<=size.width+2&&m.bottom<=size.height+2&&m.sw<=m.w+2&&m.sh<=m.h+2&&!m.bad.length,label+JSON.stringify(m));results.push({label,size,m});}
 await page.goto(url);await page.evaluate(f=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('creature_chronicles_save_slot_0',JSON.stringify(f));localStorage.setItem('creature_chronicles_active_save_id',f.saveId);},fixture);await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();const ledger=page.locator('[data-ledger-book]');if(await ledger.count())await ledger.getByRole('button',{name:'Close ranch ledger',exact:true}).click();await page.locator('[data-navigation-launcher]').first().click();await page.getByRole('dialog',{name:'Menu',exact:true}).getByRole('button',{name:/^Creatures/}).click();await choose('Mira');
 const root=page.locator('[data-talents-ledger]');
 for(const size of JSON.parse(process.env.TALENTS_QA_VIEWPORTS || '[{"width":1440,"height":900},{"width":1280,"height":720},{"width":390,"height":844},{"width":360,"height":740},{"width":844,"height":390}]')){
  await page.setViewportSize(size);await choose('Mira');const before=await read();
  await root.getByRole('button',{name:'All',exact:true}).click();await page.waitForTimeout(150);await bounds('Register',root);
  check('Recipe scope included',/Crafting, Cooking/.test(await root.innerText()) || size.width<=850);
  if([1440,390].includes(size.width))await page.screenshot({path:`${out}/register-${size.width}.png`,animations:'disabled'});
  await root.getByRole('button',{name:'Battle',exact:true}).click();check('Empty filter',await root.getByText('No talents match this category.').isVisible());await bounds('Empty filter',root);
  await root.getByRole('button',{name:'Care',exact:true}).click();check('Care contains sleeper',await root.getByRole('button',{name:'Select Sound Sleeper',exact:true}).count()===1);
  await root.getByRole('button',{name:'Work',exact:true}).click();await root.getByRole('button',{name:'View full details ›',exact:true}).click();
  const d=page.getByRole('dialog',{name:'Eager Learner · Talent details',exact:true});await bounds('Full details',d);check('Grade C value',/10%/.test(await d.innerText()));
  await d.getByRole('button',{name:'Next detail',exact:true}).click();check('Recipe details',/Crafting, Cooking/.test(await d.innerText()));await bounds('Scope details',d);
  if([1440,390].includes(size.width))await page.screenshot({path:`${out}/details-${size.width}.png`,animations:'disabled'});
  while(await d.getByRole('button',{name:'Next detail',exact:true}).isEnabled()){await d.getByRole('button',{name:'Next detail',exact:true}).click();await bounds('Remaining detail page',d);}
  await page.keyboard.press('Escape');check('Filter restored',await root.getByRole('button',{name:'Work',exact:true}).getAttribute('aria-pressed')==='true');
  const focus=root.getByRole('button',{name:'Selected talent ›',exact:true});if(await focus.isVisible()){await focus.click();await bounds('Focused summary',root);check('Full applies-to scope',await root.getByRole('article',{name:'Selected talent',exact:true}).getByText('Harvesting, Material Gathering, Husbandry, Hunting, Crafting, Cooking',{exact:true}).isVisible());}
  const work=root.getByRole('button',{name:'View Work Skills ›',exact:true});if(await work.isVisible()){await work.click();check('Work Skills shortcut',await page.locator('[data-work-ledger]').count()===1);await section('Talents');}
  check('Browsing does not save',await read()===before);
  await choose('Rook');await root.getByRole('button',{name:'All',exact:true}).click();await page.waitForTimeout(150);const seen=new Set();
  for(let n=0;n<12;n++){for(const row of await root.locator('[data-talent-row]').all()){await row.click();seen.add(await row.getAttribute('aria-label'));}const next=root.getByRole('button',{name:'Next',exact:true});if(!await next.isEnabled())break;await next.click();await bounds('Many-talent page',root);}
  check('All ten reachable',seen.size===10);await page.locator('[data-talents-ledger] img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));check('Icon requests decoded');
  await root.getByRole('button',{name:'View full details ›',exact:true}).click();const gd=page.getByRole('dialog',{name:'Guard Dog · Talent details',exact:true});let copy=await gd.innerText();while(await gd.getByRole('button',{name:'Next detail',exact:true}).isEnabled()){await gd.getByRole('button',{name:'Next detail',exact:true}).click();copy+=' '+await gd.innerText();}check('Guard Dog real condition',/Currently contributing|Not contributing/.test(copy));await page.keyboard.press('Escape');
 }
 await page.setViewportSize({width:390,height:844});await choose('Pip');check('No talents state',await root.getByText('No talents recorded for this creature.').isVisible());await bounds('No talents',root);
 await choose('Marlow');await root.getByRole('button',{name:'View full details ›',exact:true}).click();check('Owned S grade value',/30%/.test(await page.getByRole('dialog').last().innerText()));await page.keyboard.press('Escape');
 await choose('Bruna');await root.getByRole('button',{name:'Select Saved keepsake',exact:true}).click();await root.getByRole('button',{name:'View full details ›',exact:true}).click();const unknown=page.getByRole('dialog',{name:'Saved keepsake · Talent details',exact:true});let saved='';do{await bounds('Long saved description',unknown);saved+=await unknown.innerText();const next=unknown.getByRole('button',{name:'Next detail',exact:true});if(!await next.isEnabled())break;await next.click();}while(true);check('Unknown description retained',saved.includes('A retained unknown record.'));await page.keyboard.press('Escape');
 check('Legacy generic artwork',(await root.locator('[data-talent-row] img').first().getAttribute('src')).includes('painted-r4/talents.webp'));
 await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();check('Save reload retains ten owned talents',JSON.parse(await read()).creatures[1].abilities.length===10);
 check('No browser errors',errors.length===0);writeFileSync(`${out}/results.json`,JSON.stringify({checks:results.length,results,errors},null,2));console.log(JSON.stringify({checks:results.length,errors,out}));
}catch(e){if(page)await page.screenshot({path:`${out}/failure.png`,fullPage:true});throw e;}finally{await browser?.close();server.kill();}
