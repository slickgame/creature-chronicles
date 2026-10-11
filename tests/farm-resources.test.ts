import test from "node:test";
import assert from "node:assert/strict";
import { createNewGameSave } from "@/lib/save/localSave";
import { getFarmState, assignResourceWorker, processResourceDay, tradeResource, craftResource, commissionFacility, reserveResource, serveMeal, mealBonus, overnightChoreCost, actSupplyOrder, type ResourceId, type FarmResult } from "@/data/farmResources";
import { assignCreatureToRanchJob, processRanchJobsForNewDay } from "@/data/ranchJobs";
import { commissionBuilderProject } from "@/data/builderProjects";
import { projectRanchDay } from "@/data/ranch-day/ranchDayLifecycle";
import { normalizeRanchDaySave, enterEveningReview } from "@/data/ranch-day/ranchDayState";
import type { GameSave } from "@/types/save";
const ok=(r:FarmResult)=>{assert.equal(r.ok,true,r.message);return r.save;};
function fresh(){const s=createNewGameSave("Production",0);s.currencies.gold=5000;return s;}
function buy(s:GameSave,id:ResourceId,n:number){return ok(tradeResource(s,id,n));}
function next(s:GameSave){return {...s,dayState:{...s.dayState,dayNumber:s.dayState.dayNumber+1}};}
function night(s:GameSave){s=normalizeRanchDaySave(s,"active"); const r=projectRanchDay(enterEveningReview({...s,ranchDay:{...s.ranchDay!,phase:"active"}}));assert.ok(r);return r.save;}

test("gathering survives serialization, resolves once, and conflicts with chores in both directions",()=>{
 let s=fresh();const id=s.creatures![0].creatureId;
 s=ok(assignResourceWorker(s,"woodlot",id));assert.equal(assignCreatureToRanchJob(s,"field_hauling",id).ok,false);
 s=JSON.parse(JSON.stringify(s));s=processResourceDay(next(s));assert.equal(getFarmState(s).stock.wood,4);
 assert.deepEqual(processResourceDay(s),s);
 s=ok(assignResourceWorker(s,"woodlot",id));s=assignCreatureToRanchJob(s,"field_hauling",id).save;
 assert.equal(assignResourceWorker(s,"woodlot",id).ok,false);
});
test("actual overnight production commits once without minting generic Materials",()=>{
 let s=fresh();s=ok(assignResourceWorker(s,"iron_deposit",s.creatures![0].creatureId));
 s=night(s);assert.equal(getFarmState(s).stock.iron_ore,2);assert.equal(s.flags.ranchMaterialsProducedToday,0);
 const again=processRanchJobsForNewDay(s).save;assert.equal(getFarmState(again).stock.iron_ore,2);
});
test("injured and tired helpers cannot gather, and dairy rejects non-bovines",()=>{
 const s=fresh(),c=s.creatures![0];c.energy=0;assert.equal(assignResourceWorker(s,"woodlot",c.creatureId).ok,false);
 c.energy=c.maxEnergy;c.injuredUntilDayNumber=s.dayState.dayNumber+1;assert.equal(assignResourceWorker(s,"woodlot",c.creatureId).ok,false);
 delete c.injuredUntilDayNumber;assert.equal(assignResourceWorker(s,"dairy",c.creatureId).ok,false);
});
test("full wood-to-iron-to-nails chain and shared construction crew",()=>{
 let s=fresh();s=buy(s,"wood",20);s=buy(s,"wood",20);s=buy(s,"stone",20);s=buy(s,"stone",20);s=buy(s,"iron_ore",8);
 s=ok(commissionFacility(s,"quarry"));assert.equal(commissionBuilderProject(s,"north_pasture_land").ok,false);assert.equal(commissionFacility(s,"sawmill").ok,false);
 s=processResourceDay(next(s));assert.equal(getFarmState(s).facilities.quarry,true);
 s=ok(commissionFacility(s,"sawmill"));s=processResourceDay(next(s));s=ok(craftResource(s,"planks",4));assert.equal(getFarmState(s).stock.planks,8);
 s=ok(commissionFacility(s,"kiln"));s=processResourceDay(next(s));s=ok(craftResource(s,"charcoal",2));
 s=ok(commissionFacility(s,"furnace"));s=processResourceDay(next(s));s=ok(craftResource(s,"iron",4));
 s=ok(commissionFacility(s,"forge"));s=processResourceDay(next(s));s=ok(craftResource(s,"nails",2));assert.equal(getFarmState(s).stock.nails,8);
 assert.equal(craftResource(s,"iron",1).ok,false);
 const old=commissionBuilderProject(fresh(),"north_pasture_land"); // needs legacy Materials
 let funded={...fresh(),flags:{...fresh().flags,ranchMaterialsStock:100}};funded=commissionBuilderProject(funded,"north_pasture_land").save;
 assert.equal(commissionFacility(funded,"quarry").ok,false);assert.equal(old.ok,false);
});
test("reserve controls block sales, recipes, construction, and deliveries without charging",()=>{
 let s=buy(fresh(),"wood",10);s=ok(reserveResource(s,"wood",10));const before=JSON.stringify(s);
 assert.equal(tradeResource(s,"wood",1,true).ok,false);assert.equal(craftResource(s,"planks").ok,false);assert.equal(commissionFacility(s,"quarry").ok,false);
 s=ok(actSupplyOrder(s,"timber"));assert.equal(actSupplyOrder(s,"timber").ok,false);
 assert.equal(JSON.stringify(reserveResource(JSON.parse(before),"wood",-1).save),before);
});
test("delivery only consumes on confirmation and pays once",()=>{
 let s=buy(fresh(),"wood",8);const gold=s.currencies.gold,gp=s.currencies.guildPoints;
 s=ok(actSupplyOrder(s,"timber"));assert.equal(getFarmState(s).stock.wood,8);s=ok(actSupplyOrder(s,"timber"));
 assert.equal(getFarmState(s).stock.wood,0);assert.equal(s.currencies.gold,gold+100);assert.equal(s.currencies.guildPoints,gp+3);
 assert.equal(actSupplyOrder(s,"timber").ok,false);
});
test("meals consume once, cap recovery, and expire after the intended overnight",()=>{
 let s=fresh();for(const id of ["wheat","vegetables","eggs","milk","meat"] as ResourceId[])s=buy(s,id,5);
 s=ok(craftResource(s,"breakfast",2));const c=s.creatures![0];c.energy=c.maxEnergy-5;
 s=ok(serveMeal(s,"breakfast",c.creatureId));assert.equal(s.creatures![0].energy,c.maxEnergy);assert.equal(serveMeal(s,"breakfast",c.creatureId).ok,false);
 s=ok(craftResource(s,"breeders_bowl"));const other=s.creatures![1].creatureId;s=ok(serveMeal(s,"breeders_bowl",other));assert.equal(mealBonus(s,other,"breeders_bowl"),true);assert.equal(mealBonus(next(s),other,"breeders_bowl"),false);
 s=ok(craftResource(s,"stew"));const worker=s.creatures![2].creatureId;s=ok(serveMeal(s,"stew",worker));assert.equal(overnightChoreCost(next(s),worker,20),17);assert.equal(overnightChoreCost(next(next(s)),worker,20),20);
});
test("malformed quantities and locked recipes cannot create items or money",()=>{
 const s=fresh();for(const n of [-1,0,NaN,Infinity,1.5,21]){assert.equal(tradeResource(s,"wood",n).ok,false);assert.equal(craftResource(s,"planks",n).ok,false);}
 assert.equal(craftResource(s,"iron").ok,false);assert.equal(commissionFacility(s,"forge").ok,false);
});

test("breeder meal affects real preview once per pair and expires next day",async()=>{
 const {getBreedingPreview}=await import("@/data/breedingCore");
 let s=fresh();s.creatures=s.creatures!.map(c=>({...c,affection:0,abilities:[],stats:{STR:1,DEX:1,STA:1,CHA:1,WIL:1,FER:1}}));
 const a=s.creatures[0].creatureId,b=s.creatures[1].creatureId;
 const baseline=getBreedingPreview(s,a,b);assert.ok(baseline);
 for(const id of ["eggs","milk","vegetables"] as ResourceId[])s=buy(s,id,2);
 s=ok(craftResource(s,"breeders_bowl",2));s=ok(serveMeal(s,"breeders_bowl",a));
 assert.equal(getBreedingPreview(s,a,b)!.pregnancyChance,baseline.pregnancyChance+10);
 s=ok(serveMeal(s,"breeders_bowl",b));assert.equal(getBreedingPreview(s,a,b)!.pregnancyChance,baseline.pregnancyChance+10);
 assert.equal(getBreedingPreview(next(s),a,b)!.pregnancyChance,baseline.pregnancyChance);
});

test("completed production facilities count for Petra’s requests, not merely commissioned ones",async()=>{
 const {getPetraRequests}=await import("@/data/locationInteractions");
 let s=buy(fresh(),"wood",6);s.flags.petraRequest0Claimed=true;s.flags.petraRequest1Accepted=true;
 s=ok(commissionFacility(s,"quarry"));assert.equal(getPetraRequests(s)[1].ready,false);
 s=processResourceDay(next(s));assert.equal(getPetraRequests(s)[1].ready,true);
});
