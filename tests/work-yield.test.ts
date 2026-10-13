import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGameSave } from '@/lib/save/localSave';
import { normalizeCreatureChoreSkills } from '@/data/choreSkills';
import { SITES, workPreview, workResourceSite, getFarmState, grantFarmResources, serveMeal, workerBlocker, type SiteId } from '@/data/farmResources';

function fixture() {
 const save=createNewGameSave('Work calculation',0);
 const c=save.creatures![0];
 c.abilities=[];c.stats={STR:6,DEX:6,STA:6,CHA:6,WIL:6,FER:6};c.energy=100;
 const skills=normalizeCreatureChoreSkills(c);
 for(const skill of Object.values(skills)){skill.level=1;skill.xp=0;}
 c.choreSkills=skills;
 return {save,c};
}
test('site stats affect yield, endurance affects Energy, and bonuses remain bounded',()=>{
 const {save,c}=fixture();
 for(const site of Object.keys(SITES) as SiteId[]){
  const base=workPreview(save,site,c);
  const expert={...c,stats:{STR:48,DEX:48,STA:48,CHA:48,WIL:48,FER:48}};
  const high=workPreview(save,site,expert);
  assert.equal(high.amount,base.amount+4,site);assert.equal(high.energy,base.energy-4,site);
  const capped=workPreview(save,site,{...expert,stats:{STR:999,DEX:999,STA:999,CHA:999,WIL:999,FER:999}});
  assert.equal(capped.amount,high.amount);assert.equal(capped.energy,high.energy);
 }
 const dex={...c,stats:{...c.stats,DEX:42}};
 assert.ok(workPreview(save,'garden',dex).amount>workPreview(save,'garden',c).amount);
 assert.equal(workPreview(save,'woodlot',dex).amount,workPreview(save,'woodlot',c).amount);
});
test('matching practice and talents improve work; irrelevant practice does not',()=>{
 const {save,c}=fixture();const base=workPreview(save,'woodlot',c);
 c.choreSkills!.hauling.level=16;
 const practiced=workPreview(save,'woodlot',c);assert.equal(practiced.amount,base.amount+3);assert.equal(practiced.energy,base.energy-3);
 assert.equal(workPreview(save,'garden',c).details.skillBonus,0);
 c.abilities=[{id:'work_saddle',name:'Work Saddle',grade:'S',source:'variant',description:''}];
 const talented=workPreview(save,'woodlot',c);assert.ok(talented.amount>practiced.amount);assert.ok(talented.energy<practiced.energy);assert.ok(talented.energy>=8);
});
test('every legal collection grants exactly its preview, charges only Energy, and grants work XP',()=>{
 for(const site of Object.keys(SITES) as SiteId[]){
  const {save,c}=fixture();c.variantId='variant_cow' as typeof c.variantId;c.sex='female';
  save.flags.farmResourcesV1=JSON.stringify({...getFarmState(save),facilities:{quarry:true}});
  const p=workPreview(save,site,c),before=JSON.stringify(save);const r=workResourceSite(save,site,c.creatureId);
  assert.ok(r.ok,r.message);assert.equal(getFarmState(r.save).stock[SITES[site].resource],p.amount);
  assert.equal(r.save.creatures![0].energy,c.energy-p.energy);assert.equal(r.save.currencies.gold,save.currencies.gold);
  assert.equal(JSON.stringify(save),before);assert.ok(r.save.creatures![0].choreSkills);
  const tired={...c,energy:p.energy-1};assert.ok(workerBlocker({...save,creatures:[tired]},tired,site));
 }
});
test('stew applies after reductions, never below 8; eligibility and no overnight assignment remain',()=>{
 const f=fixture(),c=f.c;let save=f.save;save=grantFarmResources(save,{stew:1});
 const before=workPreview(save,'iron_deposit',c);save=serveMeal(save,'stew',c.creatureId).save;
 assert.equal(workPreview(save,'iron_deposit',c).energy,Math.max(8,Math.ceil(before.energy*.85)));
 assert.ok(workerBlocker(save,c,'dairy'));assert.ok(workerBlocker(save,c,'quarry'));
 const r=workResourceSite(save,'woodlot',c.creatureId);assert.ok(r.ok);assert.deepEqual(getFarmState(r.save).assignments,{});
});
