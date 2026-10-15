import assert from 'node:assert/strict';
import test from 'node:test';
import {HABITAT_PURCHASES} from '@/data/ranchHabitats';
import {simulateEquineFirstWeek} from '../scripts/equine-first-week.ts';
import {createNewGameSave} from '@/lib/save/localSave';
import {grantFarmResources} from '@/data/farmResources';
import {commissionBuilderProject,processBuilderConstruction,getBuilderWorkOrder} from '@/data/builderProjects';
import {getHabitatSite} from '@/data/ranchHabitatSites';
test('eight actual starting stat rolls cover food, exact costs and guided three-creature routes without repeat orders',()=>{
 const clock=Date.now;assert.deepEqual(simulateEquineFirstWeek('adoption-first',0),simulateEquineFirstWeek('adoption-first',0));assert.equal(Date.now,clock);
 for(let seed=0;seed<8;seed++)for(const route of ['solo','adoption-first','habitat-first'] as const)for(const withoutGoalGold of [false,true])for(const family of (route==='habitat-first'?['lapine','feline','canine','bovine'] as const:['lapine'] as const)){
  const r=simulateEquineFirstWeek(route,seed,withoutGoalGold,family);assert.equal(r.initialResidents,1);assert.deepEqual(r.initialFamilies,['equine']);
  assert.equal(r.startGold-r.adoptionFee-r.habitatFee+r.deliveryGold+r.rewardGold,r.endGold);assert.ok(r.endGold>=0);assert.ok(r.deliveryGold<=100);
  for(const day of r.rows){assert.equal(day.foodShortage,0,`${route} seed ${seed} day ${day.day}`);assert.ok(day.gold>=0);assert.ok(day.minEnergy>=0);assert.ok(day.actions.filter(a=>a.includes('No Gold charged')).length<=3);}
  if(route==='solo'){assert.equal(r.adoptionFee,0);assert.equal(r.threeCreatureDay,null);}else{assert.ok(r.adoptionFee>=700);assert.ok(r.threeCreatureDay&&r.threeCreatureDay<=(route==='adoption-first'?3:withoutGoalGold&&family==='bovine'?7:4),JSON.stringify(r));}
  if(withoutGoalGold)assert.equal(r.rewardGold,0);
  assert.equal(r.habitatFee,route==='habitat-first'?HABITAT_PURCHASES[family].gold:0);
 }
});
test('site illustrations follow persisted planned, paid construction and completion states without granting ownership',()=>{
 const s=grantFarmResources(createNewGameSave('Stages',0),{wood:20});const before=structuredClone(s);
 assert.equal(getHabitatSite(s,'equine').state,'owned');assert.equal(getHabitatSite(s,'feline').state,'planned');assert.match(getHabitatSite(s,'feline').art,/planned/);assert.deepEqual(s,before);
 const paid=commissionBuilderProject(s,'unlock_feline_habitat');assert.equal(paid.ok,true);const site=getHabitatSite(paid.save,'feline');assert.equal(site.state,'building');assert.match(site.art,/building/);assert.equal(site.readyDay,getBuilderWorkOrder(paid.save)!.readyDay);assert.equal(paid.save.habitats!.length,1);
 const done=processBuilderConstruction({...paid.save,dayState:{...paid.save.dayState,dayNumber:site.readyDay!}}).save;assert.equal(getHabitatSite(done,'feline').state,'owned');assert.match(getHabitatSite(done,'feline').art,/feline/);assert.equal(getHabitatSite(done,'canine').state,'planned');
});
