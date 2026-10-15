import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from './helpers/establishedSave';
import {getEggReadiness} from '@/data/nurseryCare';
import {hatchEgg,removeEgg} from '@/data/nursery';
import type {EggRecord} from '@/types/save';
function fixture(){
 const save=createNewGameSave('Care',0),c=save.creatures![0];
 const parent={participantId:c.creatureId,creatureId:c.creatureId,kind:'creature' as const,displayName:c.nickname,familyLabel:'Test'};
 const egg:EggRecord={eggId:'egg_care' as never,ownerSaveId:save.saveId,createdAtDayNumber:0,createdAt:'test',daysRemaining:0,totalDays:3,status:'ready',rarity:'Common',speciesId:c.speciesId,variantId:c.variantId,habitatId:c.habitatId,parents:{giver:parent,receiver:parent},projectedStats:c.stats,projectedStatGrades:c.statGrades,projectedAbilities:c.abilities,statRollNotes:[],abilityRollNotes:[],lineageRisk:'none',lineageRiskLabel:'No Risk',lineageNotes:[],lineageTraits:[],suggestedName:'Clover'};
 save.eggs=[egg];save.eggIds=[egg.eggId];return{save,egg};
}
test('visible hatch readiness matches the actual reducer for every blocker without modifying the save',()=>{
 for(const state of ['open','incubating','hatched','locked','missing','full'] as const){
  const {save,egg}=fixture();if(state==='incubating'){egg.status='incubating';egg.daysRemaining=2;}if(state==='hatched')egg.status='hatched';
  if(state==='missing')save.habitats=save.habitats!.filter(h=>h.habitatId!==egg.habitatId);
  if(state==='locked')save.habitats=save.habitats!.map(h=>h.habitatId===egg.habitatId?{...h,unlocked:false}:h);
  if(state==='full')save.habitats=save.habitats!.map(h=>h.habitatId===egg.habitatId?{...h,capacity:h.creatureIds.length}:h);
  const before=structuredClone(save),preview=getEggReadiness(save,egg);assert.deepEqual(save,before);assert.equal(preview.canHatch,state==='open');assert.equal(!!hatchEgg(save,egg.eggId),preview.canHatch,state);assert.equal(!!preview.blocker,!preview.canHatch);
 }
});
test('hatching records one child and donation grants exact Gold/GP only once',()=>{
 const {save,egg}=fixture();const result=hatchEgg(save,egg.eggId,'Clover')!;assert.equal(result.save.creatures!.length,save.creatures!.length+1);assert.equal(result.save.birthHistory!.length,1);assert.equal(result.creature.nickname,'Clover');assert.equal(getEggReadiness(result.save,result.save.eggs![0]).canHatch,false);assert.equal(hatchEgg(result.save,egg.eggId),null);assert.deepEqual(removeEgg(result.save,egg.eggId,'donate'),result.save);
 const donated=removeEgg(save,egg.eggId,'donate');assert.equal(donated.currencies.gold,save.currencies.gold+75);assert.equal(donated.currencies.guildPoints,save.currencies.guildPoints+1);assert.deepEqual(removeEgg(donated,egg.eggId,'donate'),donated);
});
