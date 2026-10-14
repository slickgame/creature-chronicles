import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from "./helpers/establishedSave.ts";
import {getTeamGearPlan} from '@/data/teamGearPlan';
import {purchaseBattleOutfitterItem,assignBattleOutfitterEquipment,removeBattleOutfitterEquipment} from '@/data/battleOutfitter';
import {getEquipmentCopies,enhanceEquipment} from '@/data/equipmentInstances';
const fixture=()=>createNewGameSave('Team plan',0);
test('starter team plan has exact costs and food/construction allowance without mutations',()=>{
 const s=fixture(),ids=s.creatures!.slice(0,3).map(c=>c.creatureId),snapshot=JSON.stringify(s);
 assert.equal(getTeamGearPlan(s,ids,0).gold,165);
 const q=getTeamGearPlan(s,ids,3,420);assert.equal(q.gold,309);assert.equal(q.afterPlan,191);
 assert.equal(getTeamGearPlan(s,ids,6,420).shortage,169);assert.equal(JSON.stringify(s),snapshot);
 assert.equal(getTeamGearPlan(s,[ids[0],ids[0]],3).rows.length,1);
});
test('free blades are allocated once, upgraded equipped weapons are retained, and borrowed gear is excluded',()=>{
 let s=fixture();s.currencies.gold=10000;const ids=s.creatures!.slice(0,3).map(c=>c.creatureId);
 s=purchaseBattleOutfitterItem(s,'training_grips').save;const c=getEquipmentCopies(s,'training_grips')[0];
 for(let n=0;n<3;n++)s=enhanceEquipment(s,c.id,n,()=>0).save;
 let q=getTeamGearPlan(s,ids,3);assert.equal(q.rows[0].gold,0);assert.equal(q.rows[1].gold,103);assert.equal(q.rows[2].gold,103);
 assert.equal(q.rows.filter(r=>r.copy?.id===c.id).length,1);
 s=assignBattleOutfitterEquipment(s,ids[1],'training_grips',c.id).save;
 q=getTeamGearPlan(s,ids,0);assert.equal(q.rows[1].copy?.id,c.id);assert.equal(q.rows[1].target,3);assert.equal(q.rows[1].gold,0);assert.equal(q.gold,110);
 const other=s.creatures![3].creatureId;s=removeBattleOutfitterEquipment(s,ids[1],'weapon').save;s=assignBattleOutfitterEquipment(s,other,'training_grips',c.id).save;
 assert.equal(getEquipmentCopies(s,'training_grips')[0].owner,other);
 assert.equal(getTeamGearPlan(s,[ids[0]],3).rows[0].copy,undefined);
});
test('plan mirrors real purchase, upgrades and equip costs one teammate at a time',()=>{
 let s=fixture();s.currencies.gold=10000;const ids=s.creatures!.slice(0,3).map(c=>c.creatureId),planned=getTeamGearPlan(s,ids,3),start=s.currencies.gold;
 for(const id of ids){s=purchaseBattleOutfitterItem(s,'training_grips').save;const c=getEquipmentCopies(s,'training_grips').find(c=>!c.owner)!;for(let n=0;n<3;n++)s=enhanceEquipment(s,c.id,n,()=>0).save;s=assignBattleOutfitterEquipment(s,id,'training_grips',c.id).save;}
 assert.equal(start-s.currencies.gold,planned.gold);assert.equal(getTeamGearPlan(s,ids,3).gold,0);assert.equal(getTeamGearPlan(s,ids,6).gold,360);
});
