import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from './helpers/establishedSave';
import {getNightCareReview} from '@/data/nightCareReview';
import {advanceRanchDay} from '@/data/ranch-day/ranchDayLifecycle';
import {enterEveningReview} from '@/data/ranch-day/ranchDayState';
import {grantFarmResources,reserveResource,getFarmState} from '@/data/farmResources';
import {commissionBuilderProject} from '@/data/builderProjects';
import {startTrainingGroundsAssignment} from '@/data/trainingGrounds';

test('night food and per-creature recovery preview equal committed sleep across food and damage cases',()=>{
 for(const rations of [0,1,30])for(const damage of [0,60]){
  let s=createNewGameSave('Night',0);s.flags.ranchFeedStock=0;s.flags.ranchDamage=damage;
  s=grantFarmResources(s,{rations});s=reserveResource(s,'rations',rations>0?1:0).save;
  s.creatures=s.creatures!.map(c=>({...c,energy:12,hearts:1,affection:30}));const before=structuredClone(s);
  const review=getNightCareReview(s);assert.deepEqual(s,before);
  const actual=advanceRanchDay(enterEveningReview(s))!.save;
  assert.equal(review.required,actual.flags.ranchFeedRequiredToday);assert.equal(review.covered,actual.flags.ranchFeedConsumedToday);assert.equal(review.playerEnergy,actual.currencies.energy);
  for(const row of review.creatures){const after=actual.creatures!.find(c=>c.creatureId===row.before.creatureId)!;assert.equal(row.after.energy,after.energy);assert.equal(row.after.hearts,after.hearts);assert.equal(row.after.affection,after.affection);}
  assert.ok((getFarmState(actual).stock.rations??0)>=(getFarmState(actual).reserves.rations??0));
 }
});
test('paid building and away training timers predict actual next-day readiness without charging again',()=>{
 let s=grantFarmResources(createNewGameSave('Timers',1),{wood:100,stone:20,rations:50});s.currencies.gold=5000;
 const paid=commissionBuilderProject(s,'north_pasture_land');assert.equal(paid.ok,true);s=paid.save;
 const c=s.creatures![0],training=startTrainingGroundsAssignment(s,c.creatureId,'level_drill');assert.equal(training.ok,true);s=training.save;
 const before=JSON.stringify(s),r=getNightCareReview(s);assert.equal(JSON.stringify(s),before);
 assert.equal(r.creatures.find(row=>row.before.creatureId===c.creatureId)?.away,true);
 assert.ok(r.timers.some(t=>t.destination==='builder'&&t.ready&&t.detail.includes('Already paid')));
 assert.ok(r.timers.some(t=>t.destination==='training'));
 const actual=advanceRanchDay(enterEveningReview(s))!.save;assert.ok(actual.flags.builderProject_north_pasture_land_built);assert.equal(r.required,actual.flags.ranchFeedRequiredToday);
});
test('empty ranch and Day 30 tax use current records rather than stale UI flags',()=>{
 const s=createNewGameSave('Quiet',2);s.creatures=[];s.creatureIds=[];s.dayState.dayOfMonth=30;s.flags.taxDaysRemaining=29;
 const r=getNightCareReview(s);assert.deepEqual(r.creatures,[]);assert.equal(r.taxDue,true);assert.equal(r.required,0);assert.equal(r.shortage,0);assert.equal(r.nextDay,s.dayState.dayNumber+1);
});
