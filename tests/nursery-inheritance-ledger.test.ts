import test from 'node:test';
import assert from 'node:assert/strict';
import {eggInheritanceModel,birthInheritanceModel,pregnancyInheritanceModel} from '@/data/nurseryInheritanceLedger';
import type {EggRecord,BirthRecord,PregnancyRecord} from '@/types/save';
const stats={STR:4,DEX:9,STA:7,CHA:9,WIL:6,FER:6};
const grades={STR:'A',DEX:'C',STA:'A',CHA:'D',WIL:'A',FER:'B'} as const;
const parent={participantId:'parent',displayName:'Rook',familyLabel:'Canine',kind:'creature' as const};
const egg={eggId:'egg_test',speciesId:'species_feline',variantId:'variant_base_feline',suggestedName:'Melin',status:'incubating',daysRemaining:3,totalDays:3,rarity:'Common',parents:{giver:parent,receiver:{...parent,displayName:'Mira'}},projectedStats:stats,projectedStatGrades:grades,projectedAbilities:[{id:'saved',name:'Saved talent',grade:'A',source:'general',description:'Saved effect'}],statRollNotes:['A complete long note '.repeat(100)],abilityRollNotes:['Saved talent roll'],lineageNotes:[],lineageTraits:[],lineageRisk:'none',lineageRiskLabel:'No Risk'} as unknown as EggRecord;
test('older eggs distinguish missing move snapshots and preserve full notes without mutation',()=>{
 const before=JSON.stringify(egg);const model=eggInheritanceModel(egg);
 assert.equal(model.movesRecorded,false);assert.deepEqual(model.library,[]);assert.equal(model.talents[0].name,'Saved talent');assert.equal(model.notes[0].lines[0],egg.statRollNotes[0]);assert.equal(model.species,model.type);assert.equal(JSON.stringify(egg),before);
});
test('direct, combination and starting moves stay distinct and retain saved order',()=>{
 const result={directInheritedMoveIds:['strike','combo','strike'],combinationMoveIds:['combo'],projectedLoadout:{learnedMoveIds:['strike','combo','native'],equippedMoveIds:['combo'],version:1},notes:['Saved roll']} as never;
 const model=eggInheritanceModel({...egg,battleMoveInheritance:result});assert.equal(model.movesRecorded,true);assert.deepEqual(model.direct,['strike']);assert.deepEqual(model.combinations,['combo']);assert.deepEqual(model.library,['strike','combo','native']);assert.deepEqual(model.equipped,['combo']);
});
test('birth records do not fabricate numeric stats or borrow another egg’s snapshot',()=>{
 const birth={birthId:'birth_test',eggId:egg.eggId,nickname:'Melin',speciesId:egg.speciesId,variantId:egg.variantId,rarity:egg.rarity,parents:egg.parents,inheritedStatGrades:grades,inheritedAbilities:egg.projectedAbilities,inheritedMoveIds:['strike','combo'],combinationMoveIds:['combo'],hatchedAtDayNumber:4} as BirthRecord;
 assert.equal(birthInheritanceModel(birth).stats,null);assert.equal(birthInheritanceModel(birth,{...egg,eggId:'unrelated' as never}).stats,null);assert.deepEqual(birthInheritanceModel(birth,egg).stats,stats);assert.deepEqual(birthInheritanceModel(birth).direct,['strike']);assert.deepEqual(birthInheritanceModel(birth).combinations,['combo']);
});
test('pregnancy uses conception snapshots and the offspring identity',()=>{
 const pregnancy={pregnancyId:'p_test',status:'pregnant',daysRemaining:2,giver:egg.parents.giver,receiver:egg.parents.receiver,inheritance:{projectedSpeciesId:egg.speciesId,projectedVariantId:egg.variantId,projectedStats:stats,projectedStatGrades:grades,projectedAbilities:egg.projectedAbilities,suggestedName:'Melin',statRollNotes:[],abilityRollNotes:[],lineageNotes:[],lineageTraits:[],lineageRiskLabel:'No Risk'}} as unknown as PregnancyRecord;
 const before=JSON.stringify(pregnancy),model=pregnancyInheritanceModel(pregnancy);assert.equal(model.name,'Melin');assert.equal(model.stage,'Pregnancy');assert.equal(model.talents.length,1);assert.equal(JSON.stringify(pregnancy),before);
});
