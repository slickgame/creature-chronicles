import {createNewGameSave} from '@/lib/save/localSave';
import {normalizeCreatureChoreSkills} from '@/data/choreSkills';
import {SITES,workPreview,type SiteId} from '@/data/farmResources';
const save=createNewGameSave('Worker yield comparison',0);
const original=save.creatures![0];
const tiers=[{name:'Novice',stat:6,level:1},{name:'Practiced',stat:24,level:6},{name:'Experienced',stat:48,level:16}];
console.log('| Location | Novice yield / Energy | Practiced yield / Energy | Experienced yield / Energy |');
console.log('|---|---:|---:|---:|');
for(const id of Object.keys(SITES) as SiteId[]){
 const values=tiers.map(t=>{
 const c=structuredClone(original);c.abilities=[];c.stats={STR:t.stat,DEX:t.stat,STA:t.stat,CHA:t.stat,WIL:t.stat,FER:t.stat};
 c.choreSkills=normalizeCreatureChoreSkills(c);for(const skill of Object.values(c.choreSkills)){skill.level=t.level;skill.xp=0;}
 const p=workPreview(save,id,c);return `${p.amount} / ${p.energy}`;
 });
 console.log(`| ${SITES[id].name} | ${values.join(' | ')} |`);
}
