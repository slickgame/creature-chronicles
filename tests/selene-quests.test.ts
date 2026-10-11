import test from "node:test";
import assert from "node:assert/strict";
import { createNewGameSave, saveGameToSlot } from "../src/lib/save/localSave.ts";
import { acceptNpcQuest, claimNpcQuest, getNpcQuestChain, recordSeleneAppraisal } from "../src/data/npcQuests.ts";
import { performBreedingAttempt } from "../src/data/breedingTutorial.ts";
import { buyEggFromSelene, getEggAtelierServiceCost, applyAcceleratedIncubation, getEggAtelierAbilityPolishChance } from "../src/data/eggAtelier.ts";
import { hatchEgg } from "../src/data/nurseryMoveInheritanceLifecycle.ts";
import { ensureCurrentGuildState } from "../src/data/guild.ts";
function fresh() {const s=createNewGameSave("Selene",0);s.currencies.gold=5000;s.flags.chapterOneGuidedSkipped=true;s.flags.nurserySupplyKits=5;return s;}
function eggSave() {const result=buyEggFromSelene(fresh(),"common_mystery_egg");assert.ok(result.ok);return result.save;}

test("only valid recorded breeding counts, with long pre-existing history",()=>{
 let s=fresh();const [a,b]=s.creatures!;const sample=performBreedingAttempt(s,a.creatureId,b.creatureId)!;assert.ok(sample);
 s.breeding={...sample.save.breeding!,attempts:Array.from({length:50},()=>sample.attempt)};s.flags.seleneBreedingSessions=80;
 s=acceptNpcQuest(s,"selene_virell",0).save;assert.equal(getNpcQuestChain(s,"selene_virell")[0].current,0);
 const before=JSON.stringify(s);assert.equal(performBreedingAttempt(s,"missing","missing"),null);assert.equal(JSON.stringify(s),before);
 const result=performBreedingAttempt(s,a.creatureId,b.creatureId)!;assert.ok(result);assert.ok(result.save.breeding!.attempts.length>=50);
 assert.equal(result.save.flags.seleneBreedingSessions,81);assert.equal(getNpcQuestChain(result.save,"selene_virell")[0].ready,true);
 assert.ok(claimNpcQuest(result.save,"selene_virell",0).ok);
});
test("free appraisal requires the active lesson and a real unhatched egg, records once and consumes nothing",()=>{
 let s=eggSave();const egg=s.eggs![0];assert.equal(recordSeleneAppraisal(s,egg.eggId).ok,false);
 s.flags.npcQuest_selene_virell_0_claimed=true;s=acceptNpcQuest(s,"selene_virell",1).save;
 assert.equal(recordSeleneAppraisal(s,"missing").ok,false);
 assert.equal(recordSeleneAppraisal({...s,eggs:[{...egg,status:"hatched"}]},egg.eggId).ok,false);
 const before=JSON.stringify(s);const result=recordSeleneAppraisal(s,egg.eggId);assert.ok(result.ok);assert.equal(JSON.stringify(s),before);
 assert.deepEqual(result.save.eggs,s.eggs);assert.deepEqual(result.save.currencies,s.currencies);assert.equal(result.save.flags.nurserySupplyKits,s.flags.nurserySupplyKits);
 assert.equal(recordSeleneAppraisal(result.save,egg.eggId).ok,false);assert.equal(getNpcQuestChain(result.save,"selene_virell")[1].ready,true);
 const claimed=claimNpcQuest(result.save,"selene_virell",1);assert.ok(claimed.ok);assert.equal(claimed.save.currencies.gold-s.currencies.gold,75);
 assert.equal(claimNpcQuest(claimed.save,"selene_virell",1).ok,false);
});
test("hatch lesson ignores previous hatches and requires a real successful hatch",()=>{
 let s=eggSave();const egg=s.eggs![0];s.flags.npcQuest_selene_virell_1_claimed=true;s.flags.m9TotalHatched=12;s=acceptNpcQuest(s,"selene_virell",2).save;
 assert.equal(claimNpcQuest(s,"selene_virell",2).ok,false);assert.equal(hatchEgg(s,egg.eggId),null);
 s.eggs=[{...egg,status:"ready",daysRemaining:0}];const full={...s,habitats:s.habitats!.map(h=>h.habitatId===egg.habitatId?{...h,capacity:h.creatureIds.length}:h)};
 assert.equal(hatchEgg(full,egg.eggId),null);assert.equal(getNpcQuestChain(full,"selene_virell")[2].current,0);
 const hatched=hatchEgg(s,egg.eggId)!;assert.ok(hatched);assert.equal(hatched.save.flags.m9TotalHatched,13);
 assert.equal(hatchEgg(hatched.save,egg.eggId),null);assert.equal(getNpcQuestChain(hatched.save,"selene_virell")[2].ready,true);
 const claimed=claimNpcQuest(hatched.save,"selene_virell",2);assert.ok(claimed.ok);assert.equal(claimed.save.currencies.gold-hatched.save.currencies.gold,100);
 assert.deepEqual(claimed.save.creatures,hatched.save.creatures);assert.equal(claimNpcQuest(claimed.save,"selene_virell",2).ok,false);
 const loaded=saveGameToSlot(ensureCurrentGuildState({...claimed.save,dayState:{...claimed.save.dayState,weekNumber:2}}));assert.equal(getNpcQuestChain(loaded,"selene_virell")[2].claimed,true);
});
test("service perk stacks after Trust and lamp discounts without changing kits or odds",()=>{
 for(const points of [0,50,90,140])for(const lamp of [false,true]){
  const s=fresh();s.townNpcTrust={selene_virell:{npcId:"selene_virell",points,level:1,introduced:true}};s.flags.eggAtelierUpgrade_warming_lamp=lamp;
  const perk={...s,flags:{...s.flags,npcQuest_selene_virell_2_claimed:true}};
  for(const id of ["accelerated_incubation","ability_polish","stat_conditioning"] as const){
   const base=getEggAtelierServiceCost(id,s),discounted=getEggAtelierServiceCost(id,perk);
   assert.equal(discounted.gold,Math.ceil(base.gold*0.9));assert.equal(discounted.nurseryKits,base.nurseryKits);
  }
  assert.equal(getEggAtelierAbilityPolishChance(perk),getEggAtelierAbilityPolishChance(s));
 }
});
test("discounted service charges the quote exactly, consumes one kit and preserves egg ownership",()=>{
 const s=eggSave();s.flags.npcQuest_selene_virell_2_claimed=true;const egg=s.eggs![0];s.eggs=[{...egg,daysRemaining:3,totalDays:3,status:"incubating"}];
 const cost=getEggAtelierServiceCost("accelerated_incubation",s);const result=applyAcceleratedIncubation(s,egg.eggId);assert.ok(result.ok);
 assert.equal(s.currencies.gold-result.save.currencies.gold,cost.gold);assert.equal(Number(s.flags.nurserySupplyKits)-Number(result.save.flags.nurserySupplyKits),1);
 assert.equal(result.save.eggs![0].daysRemaining,2);assert.equal(result.save.eggs!.length,s.eggs.length);
});
