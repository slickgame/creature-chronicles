import test from "node:test";
import assert from "node:assert/strict";
import { createNewGameSave, saveGameToSlot } from "../src/lib/save/localSave.ts";
import { acceptGuildContract, ensureCurrentGuildState, donateCreatureToGuildContract } from "../src/data/guild.ts";
import { completeGuildCommission, getGuildCommissionProgress } from "../src/data/guildCommissions.ts";
import { processRanchJobsForNewDay } from "../src/data/ranchJobsPredator.ts";
import { recordColiseumC2BattleResult, createColiseumPerformance } from "../src/data/coliseumC2.ts";
function fresh() { return ensureCurrentGuildState(createNewGameSave("Missions", 0)); }
function contract(save:ReturnType<typeof fresh>, type:string) { const c=save.guild!.contracts.find(c=>c.type===type);assert.ok(c);return c; }

test("weekly boards guarantee three new categories and a safe creature service, without reshuffling saves",()=>{
 const s=fresh();assert.equal(s.guild!.contracts.length,6);
 for(const t of ["delivery","chore_commission","battle_bounty","service_creature"]) assert.ok(contract(s,t));
 assert.deepEqual(ensureCurrentGuildState(s).guild,s.guild);
 const legacy={...s,guild:{...s.guild!,contracts:s.guild!.contracts.filter(c=>!c.objective)}};
 const upgraded=ensureCurrentGuildState(legacy);assert.ok(legacy.guild.contracts.every(c=>upgraded.guild!.contracts.some(n=>n.contractId===c.contractId)));
 assert.deepEqual(ensureCurrentGuildState(upgraded).guild,upgraded.guild);
 const next=ensureCurrentGuildState({...s,dayState:{...s.dayState,weekNumber:2,dayNumber:8}});
 assert.notEqual(contract(next,"delivery").title,contract(s,"delivery").title);assert.notEqual(contract(next,"chore_commission").title,contract(s,"chore_commission").title);
});
test("deliveries recheck stock, consume exact amounts and pay once with no creature removal",()=>{
 let s=fresh();const c=contract(s,"delivery");s.flags.ranchFeedStock=5;
 assert.equal(completeGuildCommission(s,c.contractId).ok,false);
 s=acceptGuildContract(s,c.contractId).save;const before=JSON.stringify(s);
 assert.equal(completeGuildCommission({...s,flags:{...s.flags,ranchFeedStock:4}},c.contractId).ok,false);
 const result=completeGuildCommission(s,c.contractId);assert.ok(result.ok);assert.equal(JSON.stringify(s),before);
 assert.equal(result.save.flags.ranchFeedStock,0);assert.deepEqual(result.save.creatures,s.creatures);
 assert.equal(result.save.currencies.gold-s.currencies.gold,c.goldReward);assert.equal(result.save.currencies.guildPoints-s.currencies.guildPoints,c.guildPointReward+10);
 assert.equal(completeGuildCommission(result.save,c.contractId).ok,false);
 assert.equal(donateCreatureToGuildContract(s,c.contractId,s.creatures![0].creatureId).ok,false);
});
test("only completed matching chore shifts after acceptance count, and a repeated day cannot add progress",()=>{
 let s=fresh();const c=contract(s,"chore_commission");assert.equal(c.objective?.kind,"chore");if(c.objective?.kind!=="chore")return;
 const job=c.objective.jobId;s.flags[`guildChoreCompletions_${job}`]=20;s=acceptGuildContract(s,c.contractId).save;
 const ids=s.creatures!.slice(0,3).map(c=>c.creatureId);s.creatures=s.creatures!.map((c,i)=>({...c,energy:i===2?0:c.maxEnergy}));
 s.ranchJobs={...s.ranchJobs!,lastProcessedDayNumber:0,assignments:{security_patrol:[],comfort_care:[],stable_production:[],garden_tending:[],field_hauling:[],[job]:ids}};
 s.flags.ranchFeedStock=100;
 const done=processRanchJobsForNewDay(s).save;assert.equal(getGuildCommissionProgress(done,contract(done,"chore_commission"))?.current,2);
 const repeated=processRanchJobsForNewDay(done).save;assert.equal(getGuildCommissionProgress(repeated,contract(repeated,"chore_commission"))?.current,2);
 const reward=completeGuildCommission(done,c.contractId);assert.ok(reward.ok);
 const persisted=saveGameToSlot(reward.save);assert.equal(contract(persisted,"chore_commission").status,"completed");
});
test("bounties count new recorded victories, not old wins, losses or duplicate result IDs",()=>{
 let s=fresh();const c=contract(s,"battle_bounty");s.flags.guildBattleWins=7;s=acceptGuildContract(s,c.contractId).save;
 const ids=s.creatures!.slice(0,3).map(c=>c.creatureId);const performance=createColiseumPerformance(ids);
 const loss=recordColiseumC2BattleResult(s,"novice_opening_scrimmage","enemy_won",5,ids,performance,"mission-loss").save;
 assert.equal(getGuildCommissionProgress(loss,contract(loss,"battle_bounty"))?.current,0);
 const win=recordColiseumC2BattleResult(loss,"novice_opening_scrimmage","player_won",4,ids,performance,"mission-win").save;
 assert.equal(getGuildCommissionProgress(win,contract(win,"battle_bounty"))?.current,1);
 const twice=recordColiseumC2BattleResult(win,"novice_opening_scrimmage","player_won",4,ids,performance,"mission-win").save;
 assert.equal(getGuildCommissionProgress(twice,contract(twice,"battle_bounty"))?.current,1);assert.ok(completeGuildCommission(twice,c.contractId).ok);
});
test("expired requests cannot pay, and completed requests do not reappear on refresh",()=>{
 let s=fresh();const c=contract(s,"delivery");s.flags.ranchFeedStock=50;s=acceptGuildContract(s,c.contractId).save;
 assert.equal(completeGuildCommission({...s,dayState:{...s.dayState,weekNumber:c.expiresAtWeekNumber}},c.contractId).ok,false);
 const result=completeGuildCommission(s,c.contractId);assert.ok(result.ok);
 const normalized=ensureCurrentGuildState(result.save);assert.equal(contract(normalized,"delivery").status,"completed");
 assert.equal(normalized.guild!.contracts.filter(x=>x.contractId===c.contractId).length,1);
});
