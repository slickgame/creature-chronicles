import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from './helpers/establishedSave';
import {getRanchLedgerBook,LEDGER_SECTIONS} from '@/data/ranchLedgerBook';
import {resolveDailyRanchEventChoice} from '@/data/ranch-day/ranchDayEvents';
import {getFarmState} from '@/data/farmResources';

test('ledger retains every brief, goal, activity and mood without mutating the save',()=>{
 const s=createNewGameSave('Records',0);s.ranchDay!.morningBrief={generatedAt:'test',previousDayNumber:1,currentDayNumber:2,dateLabel:'Day 2',warnings:['Short food','Repair fence'],highlights:['Egg ready'],nextSteps:['Collect training','Visit Nursery'],moodSummary:[],resourceFlow:{starting:s.ranchDay!.startingResources,ending:s.ranchDay!.startingResources,goldChange:0,feedChange:0,materialChange:0,energyChange:0}};
 s.ranchDay!.activities=Array.from({length:100},(_,i)=>({activityId:'a'+i,dayNumber:1,type:'care',label:'Activity '+i,createdAt:'test'}));const before=structuredClone(s),book=getRanchLedgerBook(s);assert.deepEqual(s,before);assert.deepEqual(Object.keys(book),[...LEDGER_SECTIONS]);
 assert.equal(book.Brief.length,5);assert.equal(book.Brief[0].detail,'Short food');assert.equal(book.Records.length,100);assert.equal(book.Records[0].detail,'Activity 99');assert.equal(book.Records[99].detail,'Activity 0');assert.equal(book.Goals.length,s.ranchDay!.goals.length);assert.equal(book.Moods.length,s.creatures!.length);assert.ok(book.Priorities.every(r=>!!r.destination));assert.equal(new Set(book.Priorities.map(r=>r.key)).size,book.Priorities.length);assert.equal(book.Priorities.find(r=>r.title==='Food tonight')?.key,'feed');
});
test('event pages keep exact choice descriptions, then show one saved result and cannot pay twice',()=>{
 const s=createNewGameSave('Supplier',1);s.ranchDay!.event={eventId:'supplier',dayNumber:1,eventType:'supplier',title:'Supplier',description:'Buy rations',choices:[{choiceId:'buy-feed',label:'Buy 5 rations',description:'Pay 35 Gold for 5 Balanced rations',requirementLabel:'35 Gold'},{choiceId:'decline',label:'Decline',description:'Keep Gold'}]};
 const before=getRanchLedgerBook(s);assert.equal(before.Event.length,2);assert.equal(before.Event[0].choiceId,'buy-feed');assert.equal(before.Event[0].detail,s.ranchDay!.event.choices[0].description);
 const bought=resolveDailyRanchEventChoice(s,'buy-feed');assert.equal(bought.ok,true);assert.equal(bought.save.currencies.gold,s.currencies.gold-35);assert.equal((getFarmState(bought.save).stock.rations??0)-(getFarmState(s).stock.rations??0),5);
 const after=getRanchLedgerBook(bought.save);assert.equal(after.Event.length,1);assert.equal(after.Event[0].detail,bought.save.ranchDay!.event!.resultText);assert.equal(after.Event[0].choiceId,undefined);const repeat=resolveDailyRanchEventChoice(bought.save,'buy-feed');assert.equal(repeat.ok,false);assert.deepEqual(repeat.save,bought.save);
});
test('empty sections remain explicit and all priority rows are available after morning starts',()=>{
 const s=createNewGameSave('Empty',2);s.creatures=[];s.creatureIds=[];s.ranchDay!.goals=[];s.ranchDay!.activities=[];s.ranchDay!.event=undefined;s.ranchDay!.morningBrief=undefined;
 const b=getRanchLedgerBook(s);for(const tab of ['Brief','Event','Goals','Records','Moods'] as const)assert.deepEqual(b[tab],[]);assert.equal(b.Priorities.length,6);
});
