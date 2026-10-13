import {createNewGameSave} from '@/lib/save/localSave';
import {normalizeCreatureChoreSkills} from '@/data/choreSkills';
import {FACILITIES,RECIPES,SITES,workPreview,resourceList,type ResourceId,type SiteId,type Stock} from '@/data/farmResources';
import {BLACKSMITH_RECIPES} from '@/data/blacksmith';
// Independent from-zero bills: no stock, reserves, talents, upgrades or meals.
// Prerequisite construction costs and delays are excluded from each row.
function rawBill(inputs:Stock):Stock {
 const raw:Stock={};
 function expand(id:ResourceId,n:number){const recipe=RECIPES.find(r=>r.id===id);if(!recipe){raw[id]=(raw[id]??0)+n;return;}const batches=Math.ceil(n/recipe.output);for(const [key,count] of Object.entries(recipe.inputs))expand(key as ResourceId,count*batches);}
 for(const [id,n] of Object.entries(inputs))expand(id as ResourceId,n);
 return raw;
}
const save=createNewGameSave('Production demand comparison',0);
const rows=[...Object.values(FACILITIES).map(f=>({name:f.name,gold:f.gold,inputs:f.inputs as Stock})),...BLACKSMITH_RECIPES.map(r=>({name:`Iona: ${r.id}`,gold:r.laborGold,inputs:r.inputs as Stock}))];
console.log('| Project / recipe | Raw bill | Gold | Novice actions / Energy | Experienced actions / Energy |');
console.log('|---|---|---:|---:|---:|');
for(const row of rows){const raw=rawBill(row.inputs);const results=[{stat:6,level:1},{stat:48,level:16}].map(t=>{const c=structuredClone(save.creatures![0]);c.abilities=[];c.stats={STR:t.stat,DEX:t.stat,STA:t.stat,CHA:t.stat,WIL:t.stat,FER:t.stat};c.choreSkills=normalizeCreatureChoreSkills(c);for(const skill of Object.values(c.choreSkills)){skill.level=t.level;skill.xp=0;}let actions=0,energy=0;for(const [id,n] of Object.entries(raw)){const site=Object.entries(SITES).find(([,s])=>s.resource===id);if(!site)throw Error(`No gathering site for ${id}`);const p=workPreview(save,site[0] as SiteId,c),count=Math.ceil(n/p.amount);actions+=count;energy+=count*p.energy;}return `${actions} / ${energy}`;});console.log(`| ${row.name} | ${resourceList(raw)} | ${row.gold} | ${results.join(' | ')} |`);}
