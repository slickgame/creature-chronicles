import test from "node:test";
import assert from "node:assert/strict";
import { createNewGameSave } from "./helpers/establishedSave.ts";
import { getBreedingParticipants } from "../src/data/breedingTutorial.ts";
import { createStrategicInheritancePreview, getStrategicGeneticsPreview, getTalentInheritanceOdds } from "../src/data/genetics.ts";
import { createGeneralTalent } from "../src/data/talents/generalTalents.ts";
import { hatchEgg } from "../src/data/nurseryMoveInheritanceLifecycle.ts";
import type { EggRecord } from "../src/types/save.ts";

function fixture() {
 const save = createNewGameSave("Lineage", 0);
 const parents = getBreedingParticipants(save).filter(p => p.kind === "creature").slice(0,2);
 parents[0].abilities = [{...createGeneralTalent("hot_blooded", "A"), inheritanceOrigin: {kind:"parent",parentName:"Old ancestor"}}];
 parents[1].abilities = [createGeneralTalent("diligent", "B")];
 return {save, parents};
}
test("preview separates conditional talent checks and does not mutate or reveal a roll",()=>{
 const {save,parents:[a,b]}=fixture();const snapshot=JSON.stringify(save);
 const general=getStrategicGeneticsPreview(save,a,b);const odds=getTalentInheritanceOdds(save,a,b);
 assert.equal(odds.first,general.abilityInheritanceChance);assert.equal(odds.second,general.secondAbilityChance);assert.equal(odds.mutation,1);
 assert.deepEqual(getTalentInheritanceOdds(save,{...a,abilities:[]},{...b,abilities:[]}),{first:0,second:0,mutation:1});
 assert.equal(getTalentInheritanceOdds(save,a,{...b,abilities:a.abilities}).second,0);
 assert.equal(JSON.stringify(save),snapshot);
});
test("each inherited result names its immediate parent and mutations have a distinct origin",()=>{
 const {save,parents:[a,b]}=fixture();let inherited=0,mutated=0;const snapshot=JSON.stringify([a,b]);
 for(let i=0;i<500;i++) {
  const result=createStrategicInheritancePreview(save,a,b,`origins-${i}`);
  for(const talent of result.projectedAbilities) {
   if(talent.inheritanceOrigin?.kind==="parent") {
    inherited++;const parent=talent.inheritanceOrigin.parentName===a.displayName?a:b;
    assert.ok([a.displayName,b.displayName].includes(talent.inheritanceOrigin.parentName!));
    assert.ok(parent.abilities!.some(t=>t.id===talent.id&&t.grade===talent.grade));
   }else {assert.equal(talent.inheritanceOrigin?.kind,"mutation");mutated++;}
  }
 }
 assert.ok(inherited>0&&mutated>0);assert.equal(JSON.stringify([a,b]),snapshot);
});
test("talent provenance survives hatching and birth history",()=>{
 const {save,parents:[a,b]}=fixture();let result=createStrategicInheritancePreview(save,a,b,"hatch-0");
 for(let i=1;!result.projectedAbilities.length&&i<100;i++) result=createStrategicInheritancePreview(save,a,b,`hatch-${i}`);
 assert.ok(result.projectedAbilities.length);
 const child=save.creatures!.find(c=>c.creatureId===b.creatureId)!;
 const egg:EggRecord={eggId:"egg_clarity" as never,ownerSaveId:save.saveId,createdAtDayNumber:1,createdAt:new Date(0).toISOString(),daysRemaining:0,totalDays:1,status:"ready",rarity:"Common",speciesId:child.speciesId,variantId:child.variantId,habitatId:child.habitatId,parents:{giver:{participantId:a.participantId,creatureId:a.creatureId,displayName:a.displayName,familyLabel:a.familyLabel,kind:"creature"},receiver:{participantId:b.participantId,creatureId:b.creatureId,displayName:b.displayName,familyLabel:b.familyLabel,kind:"creature"}},projectedStats:child.stats,projectedStatGrades:child.statGrades,projectedAbilities:result.projectedAbilities,statRollNotes:[],abilityRollNotes:result.abilityRollNotes,lineageRisk:"none",lineageRiskLabel:"No Risk",lineageNotes:[],lineageTraits:[],suggestedName:"Test Hatchling"};
 const hatched=hatchEgg({...save,eggs:[egg],eggIds:[egg.eggId]},egg.eggId)!;
 assert.ok(hatched);
 assert.deepEqual(hatched.creature.abilities.map(t=>t.inheritanceOrigin),egg.projectedAbilities.map(t=>t.inheritanceOrigin));
 assert.deepEqual(hatched.save.birthHistory!.at(-1)!.inheritedAbilities.map(t=>t.inheritanceOrigin),egg.projectedAbilities.map(t=>t.inheritanceOrigin));
});
