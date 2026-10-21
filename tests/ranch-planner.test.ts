import test from "node:test";
import assert from "node:assert/strict";
import type {EggRecord} from '../src/types/save';
import {createNewGameSave as established} from './helpers/establishedSave';
import {cancelEveningReview} from '../src/data/ranch-day/ranchDayState';
import {getFarmState} from '../src/data/farmResources';
class Storage {
  values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  getItem(k: string) {
    return this.values.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.values.set(k, v);
  }
  removeItem(k: string) {
    this.values.delete(k);
  }
  key(i: number) {
    return [...this.values.keys()][i] ?? null;
  }
}
const storage = new Storage();
(globalThis as any).window = { localStorage: storage };
const { createNewGameSave } =
  await import("../src/lib/save/localSaveLifecycle.ts");
const { getRanchPlanner } = await import("../src/data/ranchPlanner.ts");
const { projectRanchDay, advanceRanchDay } =
  await import("../src/data/ranch-day/ranchDayLifecycle.ts");
const { enterEveningReview } =
  await import("../src/data/ranch-day/ranchDayState.ts");
test("opening a planner leaves the save and browser storage untouched", () => {
  const save = createNewGameSave("Planner Test", 0),
    before = JSON.stringify(save),
    stored = [...storage.values];
  getRanchPlanner(save);
  getRanchPlanner(save);
  assert.equal(JSON.stringify(save), before);
  assert.deepEqual([...storage.values], stored);
});
test("projected feed matches the actual overnight feeding result", () => {
  const save = createNewGameSave("Feed Test", 1);
  save.flags.ranchFeedStock = 1;
  const planner = getRanchPlanner(save),
    evening = enterEveningReview(save);
  const preview = projectRanchDay(evening)!,
    actual = advanceRanchDay(evening)!;
  for (const key of [
    "ranchFeedStock",
    "ranchFeedProducedToday",
    "ranchFeedRequiredToday",
    "ranchFeedConsumedToday",
  ]) {
    assert.equal(preview.save.flags[key], actual.save.flags[key], key);
  }
  assert.equal(planner.feed.required, actual.save.flags.ranchFeedRequiredToday);
  assert.equal(planner.feed.produced, actual.save.flags.ranchFeedProducedToday);
  assert.equal(
    planner.feed.shortage,
    Math.max(
      0,
      planner.feed.required - planner.feed.stock - planner.feed.produced,
    ),
  );
});
test("Day 30 tax warning derives from the calendar, not a stale flag", () => {
  const save = createNewGameSave("Tax Test", 2);
  save.dayState.dayOfMonth = 30;
  save.flags.taxDaysRemaining = 24;
  save.currencies.gold = 0;
  const planner = getRanchPlanner(save);
  assert.equal(planner.taxDays, 0);
  assert.equal(planner.rows.find((r) => r.id === "tax")?.status, "Due tonight");
  assert.equal(planner.taxShortage, planner.tax);
});

test('nursery counts current incubating and ready eggs, excluding hatched records',()=>{
 const save=established('Nursery counts',0),c=save.creatures![0];
 const parent={participantId:c.creatureId,creatureId:c.creatureId,kind:'creature' as const,displayName:c.nickname,familyLabel:'Test'};
 const egg:EggRecord={eggId:'egg_counts' as never,ownerSaveId:save.saveId,createdAtDayNumber:0,createdAt:'test',daysRemaining:1,totalDays:3,status:'incubating',rarity:'Common',speciesId:c.speciesId,variantId:c.variantId,habitatId:c.habitatId,parents:{giver:parent,receiver:parent},projectedStats:c.stats,projectedStatGrades:c.statGrades,projectedAbilities:c.abilities,statRollNotes:[],abilityRollNotes:[],lineageRisk:'none',lineageRiskLabel:'No Risk',lineageNotes:[],lineageTraits:[],suggestedName:'Clover'};
 save.eggs=[egg,{...egg,eggId:'egg_second' as never,daysRemaining:2},{...egg,eggId:'egg_ready' as never,status:'ready',daysRemaining:0},{...egg,eggId:'egg_history' as never,status:'hatched',daysRemaining:0}];
 const before=structuredClone(save),p=getRanchPlanner(save);
 assert.equal(p.incubatingEggs,2);assert.equal(p.readyEggs,1);assert.equal(p.rows.find(r=>r.id==='nursery')?.status,'2 incubating · 1 ready');assert.deepEqual(save,before);
 save.eggs=[];assert.equal(getRanchPlanner(save).rows.find(r=>r.id==='nursery')?.status,'0 incubating · 0 ready');
});

test('farm availability includes a worker who can harvest but cannot afford wood gathering',()=>{
 const save=established('Available work',0),c=save.creatures![0];
 save.creatures=[{...c,energy:20,stats:{STR:0,DEX:0,STA:0,INT:0,WIL:0,FER:0},abilities:[]}];
 const planner=getRanchPlanner(save);assert.equal(planner.unassigned,1);assert.match(planner.rows.find(r=>r.id==='chores')!.status,/gathering actions today/);assert.match(planner.rows.find(r=>r.id==='chores')!.detail,/cook food/);
});

test('morning End Ranch Day can review and cancel without consuming food or advancing the day',()=>{
 const save=createNewGameSave('Morning review',0);save.ranchDay!.phase='morning';
 const before=structuredClone(save),review=enterEveningReview(save);assert.equal(review.ranchDay!.phase,'evening');assert.equal(review.dayState.dayNumber,save.dayState.dayNumber);assert.deepEqual(review.currencies,save.currencies);
 const cancel=cancelEveningReview(review);assert.equal(cancel.dayState.dayNumber,save.dayState.dayNumber);assert.deepEqual(getFarmState(cancel).stock,getFarmState(save).stock);assert.deepEqual(cancel.currencies,save.currencies);
 const actual=advanceRanchDay(review)!;assert.equal(actual.save.dayState.dayNumber,save.dayState.dayNumber+1);assert.equal(advanceRanchDay(actual.save),null);assert.deepEqual(save,before);
});
