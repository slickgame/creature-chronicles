import {getVariantDefinition} from './creatures';
import {nurseryIdentity} from './nurseryPresentation';
import type {BirthRecord,EggRecord,PregnancyRecord,ParentSnapshot} from '@/types/save';
import type {CreatureAbility,CreatureStats,StatGrades} from '@/types/creature';
import type {BattleMoveInheritanceResult,BattleMoveLoadout} from '@/types/battle';

export type NurseryInheritanceTab='Stats & Grades'|'Talents'|'Combat Moves'|'Lineage';
export type NurseryInheritanceModel={
 id:string;name:string;stage:'Pregnancy'|'Egg'|'Hatched';status:string;rarity:string;
 species:string;type:string;art:string;parents:{giver:ParentSnapshot;receiver:ParentSnapshot};
 stats:CreatureStats|null;grades:StatGrades;talents:CreatureAbility[];
 direct:string[];combinations:string[];library:string[];equipped:string[];movesRecorded:boolean;
 moveRecord?:BattleMoveInheritanceResult;lineageRisk:string;traits:string[];
 notes:{title:string;lines:string[]}[];
};
const unique=(ids:readonly string[])=>Array.from(new Set(ids));
function moveFields(record?:BattleMoveInheritanceResult,loadout?:BattleMoveLoadout,inherited?:string[],combined?:string[]){
 const combinations=unique(record?.combinationMoveIds??combined??[]);
 const direct=unique(record?.directInheritedMoveIds??inherited??[]).filter(id=>!combinations.includes(id));
 const starting=record?.projectedLoadout??loadout;
 return {direct,combinations,library:unique(starting?.learnedMoveIds??[]),equipped:unique(starting?.equippedMoveIds??[]),movesRecorded:Boolean(record||starting||inherited||combined),moveRecord:record};
}
export function pregnancyInheritanceModel(p:PregnancyRecord):NurseryInheritanceModel{
 const i=p.inheritance,identity=nurseryIdentity({speciesId:i.projectedSpeciesId,variantId:i.projectedVariantId});
 return {id:String(p.pregnancyId),name:i.suggestedName||`${p.receiver.displayName}'s offspring`,stage:'Pregnancy',status:p.status==='delivered'?'Egg delivered':`Delivery in ${p.daysRemaining} day${p.daysRemaining===1?'':'s'}`,rarity:getVariantDefinition(i.projectedVariantId).rarity,...identity,
 parents:{giver:p.giver,receiver:p.receiver},stats:i.projectedStats,grades:i.projectedStatGrades,talents:[...(i.projectedAbilities??[])],...moveFields(i.battleMoveInheritance),lineageRisk:i.lineageRiskLabel||'No recorded lineage assessment',traits:[...(i.lineageTraits??[])],
 notes:[{title:'Stat inheritance',lines:[...(i.statRollNotes??[])]},{title:'Talent inheritance',lines:[...(i.abilityRollNotes??[])]},{title:'Genetics',lines:[...(i.geneticsNotes??[])]},{title:'Lineage',lines:[...(i.lineageNotes??[])]},{title:'Combat moves',lines:[...(i.battleMoveInheritance?.notes??[])]}]};
}
export function eggInheritanceModel(e:EggRecord):NurseryInheritanceModel{
 return {id:String(e.eggId),name:e.suggestedName||'Unnamed egg',stage:e.status==='hatched'?'Hatched':'Egg',status:e.status==='ready'?'Ready to hatch':e.status==='hatched'?'Hatched':`${e.daysRemaining} day${e.daysRemaining===1?'':'s'} remaining`,rarity:e.rarity,...nurseryIdentity(e),parents:e.parents,stats:e.projectedStats,grades:e.projectedStatGrades,talents:[...(e.projectedAbilities??[])],...moveFields(e.battleMoveInheritance),lineageRisk:e.lineageRiskLabel||'No recorded lineage assessment',traits:[...(e.lineageTraits??[])],
 notes:[{title:'Stat inheritance',lines:[...(e.statRollNotes??[])]},{title:'Talent inheritance',lines:[...(e.abilityRollNotes??[])]},{title:'Genetics',lines:[...(e.geneticsNotes??[])]},{title:'Lineage',lines:[...(e.lineageNotes??[])]},{title:'Combat moves',lines:[...(e.battleMoveInheritance?.notes??[])]}]};
}
export function birthInheritanceModel(b:BirthRecord,egg?:EggRecord):NurseryInheritanceModel{
 const source=egg?.eggId===b.eggId?egg:undefined;
 return {id:b.birthId,name:b.nickname,stage:'Hatched',status:`Hatched on Day ${b.hatchedAtDayNumber}`,rarity:b.rarity,...nurseryIdentity(b),parents:b.parents,stats:source?.projectedStats??null,grades:b.inheritedStatGrades,talents:[...(b.inheritedAbilities??[])],...moveFields(undefined,b.startingBattleMoveLoadout,b.inheritedMoveIds,b.combinationMoveIds),lineageRisk:b.lineageRiskLabel||'No recorded lineage assessment',traits:[...(b.lineageTraits??[])],
 notes:source?eggInheritanceModel(source).notes:[{title:'Birth record',lines:[`Hatched on Ranch Day ${b.hatchedAtDayNumber}.`,...(!source?['Original numeric birth stats were not retained in this record. Saved inherited grades are shown.']:[])]}]};
}
