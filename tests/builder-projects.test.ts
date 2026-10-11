import { grantFarmResources, getFarmState } from "@/data/farmResources";
import assert from "node:assert/strict";
import test from "node:test";
import {
  commissionBuilderProject,
  getBuilderWorkOrder,
  processBuilderConstruction,
  getBuilderProjectProgress,
  getBuilderSecurityBonus,
  isBuilderProjectBuilt,
} from "@/data/builderProjects";
import { getPredatorThreatAssessment } from "@/data/predatorThreat";
import { createNewGameSave } from "@/lib/save/localSave";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

function fundedSave(): GameSave {
  const save = grantFarmResources(createNewGameSave("Builder Test", 0), {wood:200,stone:200,planks:200,nails:200});
  return {
    ...save,
    currencies: { ...save.currencies, gold: 20000 },
    flags: {
      ...save.flags,
      ranchMaterialsStock: 200,
      chapterOneGuidedComplete: true,
    },
    dayState: { ...save.dayState, dayNumber: 8 },
  };
}

function build(save: GameSave, projectId: Parameters<typeof commissionBuilderProject>[1]): GameSave {
  const result = commissionBuilderProject(save, projectId);
  assert.equal(result.ok, true, result.message);
  const order = getBuilderWorkOrder(result.save)!;
  return processBuilderConstruction({...result.save, dayState: {...result.save.dayState, dayNumber: order.readyDay}}).save;
}

test("working habitats stay locked until Petra completes their land prerequisite", () => {
  const save = fundedSave();
  const locked = getBuilderProjectProgress(save, "pasture_annex");
  assert.equal(locked.status, "locked");
  assert.deepEqual(locked.missingPrerequisites.map((item) => item.id), ["north_pasture_land"]);

  const expanded = build(save, "north_pasture_land");
  const available = getBuilderProjectProgress(expanded, "pasture_annex");
  assert.equal(available.status, "available");
  assert.equal(available.affordable, true);
});

test("commissioning deducts exact resources and starts construction without early benefits", () => {
  const save = fundedSave();
  const result = commissionBuilderProject(save, "north_pasture_land");
  assert.equal(result.ok, true);
  assert.equal(result.save.currencies.gold, save.currencies.gold - 850);
  assert.equal(result.save.flags.ranchMaterialsStock, save.flags.ranchMaterialsStock);
  assert.equal(getFarmState(result.save).stock.wood,192);
  assert.equal(getFarmState(result.save).stock.stone,196);
  assert.equal(isBuilderProjectBuilt(result.save, "north_pasture_land"), false);
  assert.equal(getBuilderProjectProgress(result.save, "north_pasture_land").status, "building");
});

test("condition-gated predator pressure stays disabled before story and attractor gates", () => {
  const save = createNewGameSave("Quiet Ranch", 0);
  const assessment = getPredatorThreatAssessment(save);
  assert.equal(assessment.eligible, false);
  assert.equal(assessment.eventChance, 0);
  assert.ok(assessment.blockers.some((item) => item.includes("Chapter 1")));
  const emptyStores = getPredatorThreatAssessment({ ...save, flags: { ...save.flags, ranchFeedStock: 0 } });
  assert.ok(emptyStores.blockers.some((item) => item.includes("livestock")));
});

test("future livestock and stored feed can expose a low-security ranch", () => {
  let save = fundedSave();
  save = build(save, "north_pasture_land");
  save = {...save, flags: {...save.flags, builderProject_chicken_coop_built: true}}; // Legacy completed habitat remains recognized.
  save = { ...save, flags: { ...save.flags, ranchFeedStock: 30, ranchSecurityScoreToday: 0 } };
  const assessment = getPredatorThreatAssessment(save);
  assert.equal(assessment.eligible, true);
  assert.ok(assessment.eventChance > 0);
  assert.ok(assessment.pressure > assessment.security);
});

test("permanent fence and watchtower security can guard an expanded ranch", () => {
  let save = fundedSave();
  save = build(save, "north_pasture_land");
  save = build(save, "woodline_acre_land");
  save = build(save, "reinforced_fence");
  save = build(save, "watchtower");
  const sourceCreatures = save.creatures ?? [];
  const creatures = Array.from({ length: 7 }, (_, index) => ({
    ...sourceCreatures[index % sourceCreatures.length],
    creatureId: `builder-threat-${index}` as CreatureId,
  }));
  save = { ...save, creatures, flags: { ...save.flags, ranchFeedStock: 0, ranchSecurityScoreToday: 0 } };
  const assessment = getPredatorThreatAssessment(save);
  assert.equal(getBuilderSecurityBonus(save), 42);
  assert.equal(assessment.eligible, false);
  assert.equal(assessment.tier, "guarded");
  assert.ok(assessment.security >= assessment.requiredSecurity);
});



test("construction rejects duplicate or competing orders without charging again",()=>{
 const save=commissionBuilderProject(fundedSave(),"reinforced_fence").save;
 for(const id of ["reinforced_fence","north_pasture_land"] as const){
  const result=commissionBuilderProject(save,id); assert.equal(result.ok,false); assert.deepEqual(result.save,save);
 }
 assert.equal(getBuilderSecurityBonus(save),0);
});

test("construction completes on its ready day and only once",()=>{
 const start=commissionBuilderProject(fundedSave(),"reinforced_fence").save;
 assert.deepEqual(processBuilderConstruction(start).save,start);
 const order=getBuilderWorkOrder(start)!;
 const ready={...start,dayState:{...start.dayState,dayNumber:order.readyDay}};
 const finished=processBuilderConstruction(ready);
 assert.equal(getBuilderSecurityBonus(finished.save),18);
 assert.equal(getBuilderWorkOrder(finished.save),null);
 assert.equal(finished.summaryItems.length,1);
 assert.deepEqual(processBuilderConstruction(finished.save),{save:finished.save,summaryItems:[]});
 assert.equal(commissionBuilderProject(finished.save,"reinforced_fence").ok,false);
});

test("planned species habitats cannot consume resources and existing buildings survive",()=>{
 const save=build(fundedSave(),"north_pasture_land");
 const result=commissionBuilderProject(save,"chicken_coop");
 assert.equal(result.ok,false);assert.deepEqual(result.save,save);
 assert.equal(getBuilderProjectProgress(save,"chicken_coop").status,"planned");
 const legacy={...save,flags:{...save.flags,builderProject_chicken_coop_built:true}};
 assert.equal(getBuilderProjectProgress(legacy,"chicken_coop").status,"built");
});

test("resource and prerequisite failures leave the save unchanged",()=>{
 for(const save of [createNewGameSave("Poor",0),fundedSave()]){
  const result=commissionBuilderProject(save,"watchtower");assert.equal(result.ok,false);assert.deepEqual(result.save,save);
 }
 const poor={...fundedSave(),currencies:{...fundedSave().currencies,gold:0}};
 assert.equal(commissionBuilderProject(poor,"reinforced_fence").ok,false);
 const noMaterials={...fundedSave(),flags:{ranchMaterialsStock:0}};
 assert.equal(commissionBuilderProject(noMaterials,"reinforced_fence").ok,false);
});

test("capacity projects add usable space and survive upgrade normalization",async()=>{
 const {getRanchUpgradeEffects,applyRanchUpgradeEffectsToHabitats}=await import("@/data/ranchUpgrades");
 let save=build(fundedSave(),"north_pasture_land");
 save={...save,ranchUpgrades:{...save.ranchUpgrades!,feline_habitat_capacity:2,nursery_egg_capacity:2}};
 const before=getRanchUpgradeEffects(save);
 save=build(save,"pasture_annex");save=build(save,"nursery_extension");
 const after=getRanchUpgradeEffects(save);
 for(const key of ["felineCapacity","canineCapacity","bovineCapacity","lapineCapacity","equineCapacity"] as const)assert.equal(after[key],before[key]+1);
 assert.equal(after.nurseryEggCapacity,before.nurseryEggCapacity+2);
 const normalized=applyRanchUpgradeEffectsToHabitats(save);
 assert.deepEqual(applyRanchUpgradeEffectsToHabitats(normalized),normalized);
 assert(normalized.habitats.every(h=>h.capacity>=5));
});

test("actual overnight flow finishes an order and announces it in the morning",async()=>{
 const {projectRanchDay}=await import("../src/data/ranch-day/ranchDayLifecycle.ts");
 const {normalizeRanchDaySave}=await import("../src/data/ranch-day/ranchDayState.ts");
 const start=normalizeRanchDaySave(commissionBuilderProject(fundedSave(),"reinforced_fence").save,"evening");
 start.ranchDay!.phase="evening";
 const result=projectRanchDay(start)!;
 assert(result);assert.equal(isBuilderProjectBuilt(result.save,"reinforced_fence"),true);
 assert(result.result.summaryItems.some(s=>s.includes("Fence completed")));
 assert(result.save.ranchDay?.morningBrief?.highlights.some(s=>s.includes("Fence completed")));
 assert.equal(isBuilderProjectBuilt(start,"reinforced_fence"),false);
});


test("two-day habitat construction completes through the day loop and updates all habitat records",async()=>{
 const {projectRanchDay}=await import("../src/data/ranch-day/ranchDayLifecycle.ts");
 const {normalizeRanchDaySave}=await import("../src/data/ranch-day/ranchDayState.ts");
 let save=build(fundedSave(),"north_pasture_land");
 save=commissionBuilderProject(save,"pasture_annex").save;
 function evening(s:GameSave){const n=normalizeRanchDaySave(s,"evening");n.ranchDay!.phase="evening";return n;}
 const first=projectRanchDay(evening(save))!;
 assert.equal(isBuilderProjectBuilt(first.save,"pasture_annex"),false);
 const second=projectRanchDay(evening(first.save))!;
 assert.equal(isBuilderProjectBuilt(second.save,"pasture_annex"),true);
 assert(second.save.habitats.every(h=>h.capacity>=5));
 assert.equal(getBuilderWorkOrder(second.save),null);
});
