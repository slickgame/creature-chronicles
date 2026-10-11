import test from "node:test";
import assert from "node:assert/strict";
import { createNewGameSave } from "@/lib/save/localSave";
import { grantFarmResources, getFarmState, reserveResource, commissionFacility } from "@/data/farmResources";
import { commissionBuilderProject, getBuilderWorkOrder, getBuilderProjectProgress } from "@/data/builderProjects";
import { repairRanchDamage, purchaseRanchUpgrade } from "@/data/ranchUpgrades";
function fresh(){const s=grantFarmResources(createNewGameSave("Construction",0),{wood:20,stone:20,planks:20,nails:20});s.currencies.gold=10000;s.currencies.guildPoints=100;return s;}
test("repairs spend exact resources, respect reserves and use kits first",()=>{
 const s=fresh();s.flags.ranchDamage=30;
 const blocked=reserveResource(s,"wood",20).save;
 assert.equal(repairRanchDamage(blocked).ok,false);
 const r=repairRanchDamage(s);assert.equal(r.ok,true);assert.equal(r.save.flags.ranchDamage,10);
 assert.equal(getFarmState(r.save).stock.wood,18);assert.equal(getFarmState(r.save).stock.stone,19);
 assert.equal(r.save.flags.ranchMaterialsStock,s.flags.ranchMaterialsStock);
 const kit=repairRanchDamage({...blocked,flags:{...blocked.flags,ranchRepairKits:1}});
 assert.equal(kit.ok,true);assert.equal(kit.save.flags.ranchRepairKits,0);assert.equal(getFarmState(kit.save).stock.wood,20);
 assert.equal(repairRanchDamage({...s,flags:{...s.flags,ranchDamage:0}}).save.flags.ranchDamage,0);
});
test("office upgrades use components and reject reserved stock without charging",()=>{
 const s=fresh();const blocked=reserveResource(s,"planks",20).save;
 assert.equal(purchaseRanchUpgrade(blocked,"ranch_chores_board").ok,false);
 const r=purchaseRanchUpgrade(s,"ranch_chores_board");assert.equal(r.ok,true);
 assert.deepEqual(r.summary?.costResources,{planks:2,stone:1});assert.equal(getFarmState(r.save).stock.planks,18);
 assert.equal(getFarmState(r.save).stock.stone,19);assert.equal(r.save.currencies.gold,9500);
 assert.equal(r.save.flags.ranchMaterialsStock,s.flags.ranchMaterialsStock);
});
test("both building systems share the crew; work order preserves exact bill through reload",()=>{
 const s=fresh();const farm=commissionFacility(s,"quarry").save;
 assert.equal(getBuilderProjectProgress(farm,"north_pasture_land").affordable,false);
 assert.equal(commissionBuilderProject(farm,"north_pasture_land").ok,false);
 const blocked=reserveResource(s,"stone",20).save;assert.equal(commissionBuilderProject(blocked,"north_pasture_land").ok,false);
 const built=commissionBuilderProject(s,"north_pasture_land").save;
 assert.equal(commissionFacility(built,"quarry").ok,false);
 assert.deepEqual(getBuilderWorkOrder(JSON.parse(JSON.stringify(built)))?.paidResources,{wood:8,stone:4});
 assert.equal(getFarmState(built).stock.wood,12);
});
