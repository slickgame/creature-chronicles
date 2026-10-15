import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from './helpers/establishedSave';
import {getAttemptCareRecords} from '@/data/breedingLedgerCare';
import type {BreedingAttemptRecord} from '@/types/breeding';
import type {PregnancyRecord,EggRecord,BirthRecord} from '@/types/save';
function fixture(){
 const save=createNewGameSave('Archive',0),c=save.creatures![0];
 const parent={participantId:c.creatureId,creatureId:c.creatureId,displayName:c.nickname,familyLabel:'Test',kind:'creature' as const};
 const a={attemptId:'attempt_care',pregnancyId:'pregnancy_care'}as BreedingAttemptRecord;
 const pregnancy:PregnancyRecord={pregnancyId:'pregnancy_care' as never,sourceAttemptId:a.attemptId,createdAtDayNumber:0,createdAt:'test',daysRemaining:2,totalDays:3,status:'pregnant',giver:parent,receiver:parent,inheritance:{projectedSpeciesId:c.speciesId,projectedVariantId:c.variantId,projectedStats:c.stats,projectedStatGrades:c.statGrades,projectedAbilities:c.abilities,statRollNotes:[],abilityRollNotes:[],lineageRisk:'none',lineageRiskLabel:'No Risk',lineageNotes:[],lineageTraits:[],suggestedName:'Same name'}};
 const egg:EggRecord={eggId:'egg_care' as never,sourcePregnancyId:pregnancy.pregnancyId,ownerSaveId:save.saveId,createdAtDayNumber:0,createdAt:'test',daysRemaining:2,totalDays:3,status:'incubating',rarity:'Common',speciesId:c.speciesId,variantId:c.variantId,habitatId:c.habitatId,parents:{giver:parent,receiver:parent},projectedStats:c.stats,projectedStatGrades:c.statGrades,projectedAbilities:c.abilities,statRollNotes:[],abilityRollNotes:[],lineageRisk:'none',lineageRiskLabel:'No Risk',lineageNotes:[],lineageTraits:[],suggestedName:'Same name'};
 const birth:BirthRecord={birthId:'birth_care',eggId:'egg_hatched' as never,creatureId:'child_care' as never,sourceAttemptId:a.attemptId,hatchedAtDayNumber:1,hatchedAt:'test',nickname:'Same name',rarity:'Common',speciesId:c.speciesId,variantId:c.variantId,parents:egg.parents,inheritedStatGrades:c.statGrades,inheritedAbilities:c.abilities,lineageRisk:'none',lineageRiskLabel:'No Risk',lineageTraits:[]};
 save.pregnancies=[pregnancy];save.eggs=[egg];save.birthHistory=[birth];return{save,a,pregnancy,egg,birth};
}
test('care handoffs use exact IDs, never matching names or conflicting explicit attempt IDs',()=>{
 const{save,a,pregnancy,egg,birth}=fixture();
 save.pregnancies!.push({...pregnancy,pregnancyId:'different_pregnancy' as never,sourceAttemptId:'different_attempt' as never});
 save.eggs!.push({...egg,eggId:'unlinked' as never,sourcePregnancyId:undefined},{...egg,eggId:'conflict' as never,sourceAttemptId:'different_attempt' as never});
 save.birthHistory!.push({...birth,birthId:'unlinked_birth',sourceAttemptId:undefined},{...birth,birthId:'conflict_birth',sourceAttemptId:'different_attempt' as never,sourcePregnancyId:pregnancy.pregnancyId});
 const before=structuredClone(save),rows=getAttemptCareRecords(save,a);assert.deepEqual(rows.map(r=>r.id),['pregnancy_care','egg_care','birth_care']);assert.deepEqual(save,before);
});
test('delivered/hatched records cannot open the wrong Nursery section; historical births never invent stat numbers',()=>{
 const{save,a,pregnancy,egg}=fixture();pregnancy.status='delivered';egg.status='hatched';const rows=getAttemptCareRecords(save,a);assert.equal(rows.length,1);assert.equal(rows[0].tab,'births');assert.equal(rows[0].stats,undefined);assert.deepEqual(rows[0].grades,save.birthHistory![0].inheritedStatGrades);
});
test('every explicitly linked birth remains accessible even with identical parent and offspring names',()=>{
 const{save,a,birth}=fixture();save.pregnancies=[];save.eggs=[];save.birthHistory=Array.from({length:100},(_,i)=>({...birth,birthId:'birth_'+i}));const rows=getAttemptCareRecords(save,a);assert.equal(rows.length,100);assert.equal(new Set(rows.map(r=>r.id)).size,100);assert.equal(rows[99].id,'birth_99');
});
test('legacy move IDs stay distinct without claiming to reconstruct a complete starting library',()=>{
 const{save,a,birth}=fixture();birth.startingBattleMoveLoadout=undefined;birth.inheritedMoveIds=['test_direct','test_combo']as never;birth.combinationMoveIds=['test_combo']as never;const row=getAttemptCareRecords(save,a).find(r=>r.id===birth.birthId)!;assert.deepEqual(row.moveIds,['test_direct','test_combo']);
});
