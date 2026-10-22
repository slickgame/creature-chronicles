import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from './helpers/establishedSave';
import {advanceRanchDay} from '@/data/ranch-day/ranchDayLifecycle';
import {enterEveningReview} from '@/data/ranch-day/ranchDayState';
import {grantFarmResources} from '@/data/farmResources';
import {getMorningCycleReport,cycleTextPages} from '@/data/dayCycleReport';
import {commissionBuilderProject} from '@/data/builderProjects';

test('morning receipt reads actual saved outcomes and meals without projecting or mutating',()=>{
 const before=grantFarmResources(createNewGameSave('Receipt',0),{rations:30});before.flags.ranchFeedStock=0;before.creatures![0].energy=12;
 const after=advanceRanchDay(enterEveningReview(before))!.save;
 after.creatures![0].energy=17;after.creatures![0].hearts=2;
 const snapshot=JSON.stringify([before,after]),receipt=getMorningCycleReport(before,after);
 assert.equal(receipt.residents[0].before.energy,12);assert.equal(receipt.residents[0].after.energy,17);assert.equal(receipt.residents[0].after.hearts,2);
 assert.deepEqual(receipt.meals,JSON.parse(String(after.flags.ranchFeedingMealsToday)));
 assert.equal(receipt.creaturesFed,after.flags.ranchCreaturesFedToday);assert.equal(JSON.stringify([before,after]),snapshot);
});
test('morning roster retains missing residents and labels genuinely new residents',()=>{
 const before=createNewGameSave('Roster',1),after=structuredClone(before),original=after.creatures!.shift()!;
 after.creatures!.push({...original,creatureId:'new_resident',nickname:'New arrival'});
 const report=getMorningCycleReport(before,after);
 assert.equal(report.residents.find(r=>r.before.creatureId===original.creatureId)?.missing,true);
 assert.equal(report.residents.find(r=>r.after.creatureId==='new_resident')?.isNew,true);
});
test('actual completed construction is distinguished from still-active timers',()=>{
 let before=grantFarmResources(createNewGameSave('Construction',2),{wood:100,stone:20,rations:30});before.currencies.gold=5000;
 before=commissionBuilderProject(before,'north_pasture_land').save;
 const after=advanceRanchDay(enterEveningReview(before))!.save,report=getMorningCycleReport(before,after);
 assert.ok(report.timers.some(t=>t.title==='North Pasture Deed'&&t.ready&&t.detail.includes('completed overnight')));
});
test('complete long log text survives paging, and legacy empty receipts are safe',()=>{
 const paragraphs=Array.from({length:12},(_,i)=>`Entry ${i}: `+'A complete detailed overnight result. '.repeat(16));
 assert.equal(cycleTextPages(paragraphs).join(' ').replace(/\s+/g,' ').trim(),paragraphs.join(' ').replace(/\s+/g,' ').trim());
 assert.ok(cycleTextPages(paragraphs).every(p=>p.length<=150));
 const before=createNewGameSave('Empty',3);before.creatures=[];before.creatureIds=[];before.flags.ranchFeedingMealsToday='invalid';
 assert.deepEqual(getMorningCycleReport(before,before).residents,[]);assert.deepEqual(getMorningCycleReport(before,before).meals,[]);
});
