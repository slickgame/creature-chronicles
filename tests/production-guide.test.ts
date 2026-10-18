import test from "node:test";
import assert from "node:assert/strict";
import { createNewGameSave } from "@/lib/save/localSave";
import { assignResourceWorker, workPreview, getFarmState, getProductionGuide, claimProductionGuide, processResourceDay, reserveResource, craftResource, commissionFacility, grantFarmResources, planIngredientFeeding } from "@/data/farmResources";
import { applyStarterGoalRewards } from "@/data/starterGoals";
function fresh(){const s=createNewGameSave("Production guide",0);s.currencies.gold=5000;return s;}
function next(s:ReturnType<typeof fresh>){return {...s,dayState:{...s.dayState,dayNumber:s.dayState.dayNumber+1},creatures:s.creatures?.map(c=>({...c,energy:c.maxEnergy}))};}
test("instant work creates named stock without minting generic Feed or Materials",()=>{
 let s=fresh();const feed=s.flags.ranchFeedStock,materials=s.flags.ranchMaterialsStock;
 for(const site of ['garden','woodlot'] as const)s=assignResourceWorker(s,site,s.creatures![0].creatureId).save;
 assert.ok(getFarmState(s).stock.vegetables!>0);assert.ok(getFarmState(s).stock.wood!>0);
 assert.equal(s.flags.ranchFeedStock,feed);assert.equal(s.flags.ranchMaterialsStock,materials);
});
test("rations feed any species without raw ingredient opt-in and respect reserves",()=>{
 let s=grantFarmResources(fresh(),{rations:10,vegetables:10});const needs=s.creatures!.map(creature=>({creature,amount:1}));
 let result=planIngredientFeeding(s,needs);assert.equal(result.covered,needs.length);assert.equal(getFarmState(result.save).stock.vegetables,10);
 s=reserveResource(s,'rations',10).save;result=planIngredientFeeding(s,needs);assert.equal(result.covered,0);assert.equal(getFarmState(result.save).stock.rations,10);
});
test("full guide uses actual gathering and crafting, waits for construction, rewards once after reload",()=>{
 let s=fresh();assert.equal(claimProductionGuide(s).ok,false);
 const bought=grantFarmResources(s,{wood:20,planks:20});assert.equal(getProductionGuide(bought)[0].done,false);assert.equal(getProductionGuide(bought)[2].done,false);
 let expectedWood=getFarmState(s).stock.wood??0;
 for(let i=0;i<3;i++){expectedWood+=workPreview(s,'woodlot',s.creatures![0]).amount;const result=assignResourceWorker(s,'woodlot',s.creatures![0].creatureId);assert.equal(result.ok,true);s=result.save;}
 assert.equal(getFarmState(s).stock.wood,expectedWood);
 s=reserveResource(s,'wood',2).save;s=craftResource(s,'planks',1,s.creatures![0].creatureId).save;
 assert.equal(getProductionGuide(s).filter(x=>x.done).length,3);
 s=commissionFacility(s,'quarry').save;assert.equal(getProductionGuide(s)[3].done,false);
 assert.equal(claimProductionGuide(s).ok,false);
 s=processResourceDay(next(s));s=JSON.parse(JSON.stringify(s));
 const reward=claimProductionGuide(s);assert.equal(reward.ok,true);assert.equal(reward.save.currencies.gold,s.currencies.gold+75);assert.equal(reward.save.currencies.guildPoints,s.currencies.guildPoints+5);
 assert.equal(claimProductionGuide(reward.save).ok,false);
});
test("starter reward conversion pays named supplies once without changing legacy inventory",()=>{
 const s=fresh();s.flags.m14RanchJobAssigned=true;s.flags.m14FieldHaulingMaterials=true;
 const paid=applyStarterGoalRewards(s);assert.ok((getFarmState(paid).stock.rations??0)>0);assert.ok((getFarmState(paid).stock.wood??0)>0);
 assert.equal(paid.flags.ranchMaterialsStock,s.flags.ranchMaterialsStock);assert.equal(paid.flags.ranchFeedStock,s.flags.ranchFeedStock);
 const second=applyStarterGoalRewards(paid);const third=applyStarterGoalRewards(second);assert.deepEqual(third,second);
});
