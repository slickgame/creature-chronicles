import test from "node:test";
import assert from "node:assert/strict";
import { createNewGameSave } from "@/lib/save/localSave";
import { getFarmState, foodChoices, setIngredientFeeding, planIngredientFeeding, reserveResource, RESOURCE_IDS } from "@/data/farmResources";
import { createWeeklyCommissions, completeGuildCommission } from "@/data/guildCommissions";
import { ensureCurrentGuildState, acceptGuildContract } from "@/data/guild";
import { processRanchJobsForNewDay } from "@/data/ranchJobs";
function fresh() { const s=createNewGameSave("Resources",0);s.flags.farmResourcesV1=JSON.stringify({version:1,stock:Object.fromEntries(RESOURCE_IDS.map(id=>[id,100]))});return s; }
test("feeding is opt-in, diet-aware, protects reserves and leaves meals alone",()=>{
 let s=fresh();const c=s.creatures![0], food=foodChoices(c)[0];
 const needs=[{creature:c,amount:3}];assert.equal(planIngredientFeeding(s,needs).covered,0);
 s=setIngredientFeeding(s,true).save;
 for(const id of RESOURCE_IDS) s=reserveResource(s,id,id===food?98:100).save;
 const before=JSON.stringify(s), result=planIngredientFeeding(s,needs);
 assert.equal(result.covered,2);assert.deepEqual(result.used,{[food]:2});assert.equal(getFarmState(result.save).stock[food],98);
 assert.equal(getFarmState(result.save).stock.stew,100);assert.equal(JSON.stringify(s),before);
});
test("real overnight feeding consumes ingredients once and saves generic Feed",()=>{
 const base=fresh();base.flags.ranchFeedStock=100;
 const regular=processRanchJobsForNewDay(base).save;
 const fed=processRanchJobsForNewDay(setIngredientFeeding(base,true).save).save;
 assert.equal(fed.flags.ranchFeedStock,100);assert.ok(Number(regular.flags.ranchFeedStock)<100);
 assert.equal(fed.flags.ranchFoodStatus,"Fed");assert.match(String(fed.flags.ranchFeedingSummary),/Ingredients used/);
 assert.deepEqual(processRanchJobsForNewDay(fed).save,fed);
});
test("specific deliveries protect reserves, charge exact stock and cannot pay twice",()=>{
 let s=ensureCurrentGuildState(fresh());const c=s.guild!.contracts.find(c=>c.type==="delivery")!;
 assert.equal(c.objective!.kind,"delivery");if(c.objective!.kind!=="delivery")return;
 const id=c.objective!.resource;assert.ok(id!=="feed"&&id!=="materials");if(id==="feed"||id==="materials")return;
 s=acceptGuildContract(s,c.contractId).save;
 const blocked=reserveResource(s,id,100).save;assert.equal(completeGuildCommission(blocked,c.contractId).ok,false);
 const result=completeGuildCommission(s,c.contractId);assert.equal(result.ok,true);
 assert.equal(getFarmState(result.save).stock[id],100-c.objective!.amount);
 assert.equal(result.save.currencies.gold-s.currencies.gold,c.goldReward);
 assert.equal(completeGuildCommission(result.save,c.contractId).ok,false);
});
test("advanced deliveries require facilities and old accepted contracts survive migration",()=>{
 for(let i=0;i<30;i++){const s=fresh();s.saveId=String(i) as typeof s.saveId;const c=createWeeklyCommissions(s)[0];assert.ok(c.objective?.kind==="delivery"&&!['nails','planks'].includes(c.objective.resource));}
 let s=ensureCurrentGuildState(fresh());s.guild!.boardVersion=2;const c=s.guild!.contracts.find(c=>c.type==="delivery")!;c.objective={kind:"delivery",resource:"feed",amount:5};
 c.status="accepted";assert.equal(ensureCurrentGuildState(s).guild!.contracts.find(x=>x.contractId===c.contractId)?.objective?.kind,"delivery");
 assert.deepEqual(ensureCurrentGuildState(s).guild!.contracts.find(x=>x.contractId===c.contractId)?.objective,c.objective);
});
