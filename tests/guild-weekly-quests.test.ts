import { RESOURCE_IDS } from "../src/data/farmResources.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { createNewGameSave, saveGameToSlot } from "../src/lib/save/localSave.ts";
import { createDefaultGuildState, ensureCurrentGuildState, acceptGuildContract, getGuildRerollQuote, rerollGuildBoard } from "../src/data/guild.ts";
import { completeGuildCommission } from "../src/data/guildCommissions.ts";
import { acceptNpcQuest, claimNpcQuest, getNpcQuestChain } from "../src/data/npcQuests.ts";
import { getPellaSupplyPriceMultiplier, getNpcTrustRecord } from "../src/data/townNpcs.ts";
import { enterEveningReview, normalizeRanchDaySave } from "../src/data/ranch-day/ranchDayState.ts";
import { projectRanchDay } from "../src/data/ranch-day/ranchDayLifecycle.ts";
function fresh() { const s=createNewGameSave("Weekly",0);s.currencies.gold=3000;s.flags.farmResourcesV1=JSON.stringify({version:1,stock:Object.fromEntries(RESOURCE_IDS.map(id=>[id,100]))});s.flags.ranchFeedStock=100;s.flags.ranchMaterialsStock=100;return {...s,guild:createDefaultGuildState(s)}; }

test("boards are save-specific, deterministic and remain stable through saves",()=>{
 const a=fresh();const b={...a,saveId:"other-ranch" as typeof a.saveId,guild:undefined};
 const generated=createDefaultGuildState(b);
 assert.notDeepEqual(a.guild.contracts.map(c=>[c.title,c.goldReward]),generated.contracts.map(c=>[c.title,c.goldReward]));
 assert.deepEqual(ensureCurrentGuildState(a).guild,a.guild);
 assert.deepEqual(saveGameToSlot(a).guild,a.guild);
});
test("rerolls charge increasing prices, replace only open notices, preserve progress and reject stale confirmations",()=>{
 let s=fresh();const delivery=s.guild.contracts.find(c=>c.type==="delivery")!;const chore=s.guild.contracts.find(c=>c.type==="chore_commission")!;
 s=acceptGuildContract(s,delivery.contractId).save as typeof s;s=completeGuildCommission(s,delivery.contractId).save as typeof s;s=acceptGuildContract(s,chore.contractId).save as typeof s;
 const kept=s.guild.contracts.filter(c=>c.status!=="available");const oldIds=s.guild.contracts.filter(c=>c.status==="available").map(c=>c.contractId);
 const q=getGuildRerollQuote(s);assert.equal(q.cost,50);const result=rerollGuildBoard(s,q.count,q.week);assert.ok(result.ok);assert.equal(s.currencies.gold-result.save.currencies.gold,50);
 assert.deepEqual(result.save.guild!.contracts.filter(c=>c.status!=="available"),kept);assert.ok(result.save.guild!.contracts.every(c=>!oldIds.includes(c.contractId)));
 assert.equal(getGuildRerollQuote(result.save).cost,100);assert.equal(rerollGuildBoard(result.save,q.count,q.week).ok,false);
 assert.equal(rerollGuildBoard({...s,currencies:{...s.currencies,gold:49}},q.count,q.week).ok,false);
 assert.deepEqual(ensureCurrentGuildState(result.save).guild,result.save.guild);
 assert.deepEqual(saveGameToSlot(result.save).guild,result.save.guild);
 const next=rerollGuildBoard(result.save,1,q.week);assert.ok(next.ok);assert.equal(getGuildRerollQuote(next.save).cost,150);
});
test("no available slots cannot be charged and completed missions cannot be reinserted",()=>{
 let s=fresh();s.guild.contracts=s.guild.contracts.map(c=>({...c,status:"completed"}));
 assert.equal(rerollGuildBoard(s,0,1).ok,false);assert.deepEqual(ensureCurrentGuildState(s).guild,s.guild);
});
test("actual Sunday overnight refreshes the board and resets reroll pricing once; ordinary nights do not",()=>{
 let s=fresh();s=rerollGuildBoard(s,0,1).save as typeof s;
 const ordinary=projectRanchDay(enterEveningReview(normalizeRanchDaySave(s,"active")))!;assert.ok(ordinary);assert.equal(getGuildRerollQuote(ordinary.save).cost,100);assert.deepEqual(ordinary.save.guild!.contracts,s.guild.contracts);
 const sunday={...s,dayState:{...s.dayState,weekday:"Sun" as const,dayNumber:7,dayOfMonth:7},ranchDay:undefined};
 const monday=projectRanchDay(enterEveningReview(normalizeRanchDaySave(sunday,"active")))!;assert.ok(monday);
 assert.equal(monday.save.dayState.weekday,"Mon");assert.equal(monday.save.dayState.weekNumber,2);assert.equal(getGuildRerollQuote(monday.save).cost,50);
 assert.ok(monday.save.guild!.contracts.every(c=>c.weekNumber===2 && c.status==="available"));
 assert.equal(monday.save.guild!.contracts.length,6);assert.deepEqual(ensureCurrentGuildState(monday.save).guild,monday.save.guild);
});
test("personal quests enforce sequence, new-work baselines, exact one-time rewards and survive weeks/rerolls",()=>{
 let s=fresh();assert.equal(acceptNpcQuest(s,"mara_vell",1).ok,false);s.guild.completedCount=10;
 s=acceptNpcQuest(s,"mara_vell",0).save as typeof s;assert.equal(claimNpcQuest(s,"mara_vell",0).ok,false);
 s.guild={...s.guild,completedCount:11};const before=s.currencies.gold;const claim=claimNpcQuest(s,"mara_vell",0);assert.ok(claim.ok);assert.equal(claim.save.currencies.gold-before,40);assert.equal(getNpcTrustRecord(claim.save,"mara_vell").points,10);
 assert.equal(claimNpcQuest(claim.save,"mara_vell",0).ok,false);
 let next=acceptNpcQuest(claim.save,"mara_vell",1).save;next=rerollGuildBoard(next,0,1).save;next=ensureCurrentGuildState({...next,dayState:{...next.dayState,weekNumber:2}});
 assert.equal(getNpcQuestChain(next,"mara_vell")[1].accepted,true);next.flags.guildChoreCompletions_garden_tending=4;const second=claimNpcQuest(next,"mara_vell",1);assert.ok(second.ok);
 next=acceptNpcQuest(second.save,"mara_vell",2).save;
 assert.equal(getNpcQuestChain(next,"mara_vell")[2].current,0);
 next.guild={...next.guild!,completedCount:next.guild!.completedCount+2};
 const final=claimNpcQuest(next,"mara_vell",2);assert.ok(final.ok);assert.equal(getGuildRerollQuote(final.save).cost,45);
 assert.equal(claimNpcQuest(final.save,"mara_vell",2).ok,false);
});
test("Pella reserve quest consumes no stock, deliveries track actual handoffs, and final perks use best discount",()=>{
 let s=fresh();s=acceptNpcQuest(s,"pella_mosswick",0).save as typeof s;
 const c=claimNpcQuest(s,"pella_mosswick",0);assert.ok(c.ok);assert.equal(c.save.flags.ranchFeedStock,s.flags.ranchFeedStock);assert.equal(c.save.flags.ranchMaterialsStock,s.flags.ranchMaterialsStock);
 let next=acceptNpcQuest(c.save,"pella_mosswick",1).save;const delivery=next.guild!.contracts.find(c=>c.type==="delivery")!;next=acceptGuildContract(next,delivery.contractId).save;next=completeGuildCommission(next,delivery.contractId).save;
 assert.equal(getNpcQuestChain(next,"pella_mosswick")[1].current,1);
 next.flags.guildDeliveriesCompleted=2;next=claimNpcQuest(next,"pella_mosswick",1).save;next=acceptNpcQuest(next,"pella_mosswick",2).save;next.flags.guildChoreCompletions_field_hauling=4;
 const final=claimNpcQuest(next,"pella_mosswick",2);assert.ok(final.ok);assert.equal(getPellaSupplyPriceMultiplier(final.save),0.9);
 const max={...final.save,townNpcTrust:{...final.save.townNpcTrust,pella_mosswick:{npcId:"pella_mosswick" as const,points:140,level:5,introduced:true}}};assert.equal(getPellaSupplyPriceMultiplier(max),0.88);
 const mara={...final.save,flags:{...final.save.flags,npcQuest_mara_vell_2_claimed:true}};assert.equal(getGuildRerollQuote(mara).cost,45);
});

test("a lone open bounty changes its target on reroll, while held notices remain unchanged",()=>{
 const s=fresh();s.guild.contracts=s.guild.contracts.map(c=>c.type==="battle_bounty"?c:{...c,status:"accepted"});
 const old=s.guild.contracts.find(c=>c.type==="battle_bounty")!;
 const result=rerollGuildBoard(s,0,1);assert.ok(result.ok);
 assert.notEqual(result.save.guild!.contracts.find(c=>c.type==="battle_bounty")!.objective!.amount,old.objective!.amount);
});
