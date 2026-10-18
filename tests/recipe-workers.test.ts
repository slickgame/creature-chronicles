import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGameSave } from './helpers/establishedSave.ts';
import { normalizeCreatureChoreSkills, getChoreSkillXpToNext } from '@/data/choreSkills';
import { craftResource, recipePreview, grantFarmResources, getFarmState, reserveResource, RECIPES, workPreview, workResourceSite, type SiteId } from '@/data/farmResources';
import { getVariantDefinition } from '@/data/creatures';
import { startTrainingGroundsAssignment } from '@/data/trainingGrounds';

function fixture() {
  const save = grantFarmResources(createNewGameSave('Recipe workers', 0), { wood:100, wheat:100, vegetables:100, eggs:100, milk:100, meat:100, iron_ore:100, charcoal:100, iron:100 });
  const state = getFarmState(save);state.facilities={quarry:true,sawmill:true,kiln:true,furnace:true,forge:true};
  save.flags.farmResourcesV1=JSON.stringify(state);
  for(const c of save.creatures!){c.energy=100;c.abilities=[];c.choreSkills=normalizeCreatureChoreSkills(c);for(const skill of Object.values(c.choreSkills)){skill.level=1;skill.xp=0;skill.xpToNext=35;skill.lifetimeXp=0;}}
  return save;
}
test('every recipe requires a worker and persists exactly quoted materials, Energy and matching XP',()=>{
  for(const recipe of RECIPES){
    const save=fixture(),c=save.creatures![1],before=structuredClone(save),q=recipePreview(save,recipe.id,2,c)!;
    const rejected=craftResource(save,recipe.id,2);assert.equal(rejected.ok,false);assert.equal(rejected.save,save);
    const r=craftResource(save,recipe.id,2,c.creatureId);assert.ok(r.ok,r.message);assert.deepEqual(save,before);
    const persisted=JSON.parse(JSON.stringify(r.save)),worker=persisted.creatures[1];
    assert.equal(worker.energy,c.energy-q.energy);assert.equal(worker.choreSkills[q.skillId].lifetimeXp,q.xp);
    assert.equal(getFarmState(persisted).stock[recipe.id],(getFarmState(save).stock[recipe.id]??0)+q.output);
    for(const [id,n]of Object.entries(q.cost))assert.equal(getFarmState(persisted).stock[id as keyof typeof q.cost],getFarmState(save).stock[id as keyof typeof q.cost]!-n!);
    assert.deepEqual(persisted.creatures[0],save.creatures![0]);assert.deepEqual(worker.stats,c.stats);assert.equal(worker.xp,c.xp);assert.equal(persisted.currencies.gold,save.currencies.gold);
    for(const skill of Object.keys(c.choreSkills!))if(skill!==q.skillId)assert.deepEqual(worker.choreSkills[skill],c.choreSkills![skill as keyof typeof c.choreSkills]);
    assert.match(r.message,/XP/);
  }
});
test('proficiency tiers reduce recipe Energy, leave ratios unchanged and cap at mastery',()=>{
  for(const id of ['planks','breakfast'] as const){const s=fixture(),c=s.creatures![0],base=recipePreview(s,id,1,c)!;
    for(const [level,discount]of [[1,0],[6,1],[11,2],[16,3],[20,3]]){c.choreSkills![base.skillId].level=level;c.choreSkills![base.skillId].xpToNext=getChoreSkillXpToNext(level);const q=recipePreview(s,id,1,c)!;assert.equal(q.energy,base.energy-discount);assert.equal(q.output,base.output);}
    const r=craftResource(s,id,1,c.creatureId);assert.ok(r.ok);assert.equal(r.save.creatures![0].choreSkills![base.skillId].level,20);assert.equal(r.save.creatures![0].choreSkills![base.skillId].xp,0);
  }
});
test('level-ups carry XP forward and bulk work costs and rewards scale by batch',()=>{
  const s=fixture(),c=s.creatures![0];c.choreSkills!.cooking.level=5;c.choreSkills!.cooking.xpToNext=getChoreSkillXpToNext(5);c.choreSkills!.cooking.xp=getChoreSkillXpToNext(5)-1;
  const q=recipePreview(s,'rations',1,c)!,bulk=recipePreview(s,'rations',5,c)!;assert.equal(bulk.energy,5*q.energy);assert.equal(bulk.xp,5*q.xp);
  const r=craftResource(s,'rations',1,c.creatureId);assert.ok(r.ok);const after=r.save.creatures![0];assert.equal(after.choreSkills!.cooking.level,6);assert.equal(after.choreSkills!.cooking.xp,q.xp-1);assert.match(r.message,/increased from Level 5 to Level 6/);assert.equal(recipePreview(r.save,'rations',1,after)!.energy,q.energy-1);
});
test('invalid quantities, absent workers, exhaustion, injury, facilities and reserves reject without mutation',()=>{
  for(const scenario of ['energy','injury','facility','reserves','missing'] as const){let s=fixture();const c=s.creatures![0];if(scenario==='energy')c.energy=0;if(scenario==='injury')c.injuredUntilDayNumber=s.dayState.dayNumber;if(scenario==='facility'){const state=getFarmState(s);delete state.facilities.furnace;s.flags.farmResourcesV1=JSON.stringify(state);}if(scenario==='reserves')s=reserveResource(s,'iron_ore',100).save;
    const before=structuredClone(s);const r=craftResource(s,'iron',1,scenario==='missing'?'not-a-worker':c.creatureId);assert.equal(r.ok,false);assert.equal(r.save,s);assert.deepEqual(s,before);
  }
  const s=fixture(),c=s.creatures![0];for(const n of [0,-1,21,1.5,NaN,Infinity])assert.equal(craftResource(s,'rations',n,c.creatureId).ok,false);
});
test('workers away at training cannot cook or craft, including completed but uncollected training',()=>{
  const s=fixture();s.currencies.gold=5000;const id=s.creatures![0].creatureId;
  const training=startTrainingGroundsAssignment(s,id,'level_drill');assert.ok(training.ok,training.message);
  for(const day of [training.save.dayState.dayNumber,training.save.dayState.dayNumber+10]){const away={...training.save,dayState:{...training.save.dayState,dayNumber:day}},before=structuredClone(away);for(const recipe of ['planks','rations'] as const){const r=craftResource(away,recipe,1,id);assert.equal(r.ok,false);assert.match(r.message,/training/i);assert.deepEqual(away,before);}}
});
test('all gathering professions level independently and use proficiency for output and Energy',()=>{
  for(const site of ['garden','wheat_field','woodlot','quarry','iron_deposit','dairy','hunting'] as SiteId[]){const s=fixture(),c=s.creatures!.find(c=>getVariantDefinition(c.variantId).family==='bovine')!;c.sex='female';const q=workPreview(s,site,c),skill=site==='hunting'?'hunting':site==='dairy'?'production':['garden','wheat_field'].includes(site)?'harvesting':'hauling';c.choreSkills![skill].level=16;c.choreSkills![skill].xpToNext=getChoreSkillXpToNext(16);const trained=workPreview(s,site,c);assert.equal(trained.amount,q.amount+3);assert.equal(trained.energy,q.energy-3);const r=workResourceSite(s,site,c.creatureId);assert.ok(r.ok);assert.match(r.message,/XP/);assert.equal(r.save.creatures!.find(x=>x.creatureId===c.creatureId)!.choreSkills![skill].lifetimeXp,trained.xp);}
});
