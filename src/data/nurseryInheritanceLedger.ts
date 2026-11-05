import {buildBredCreatureStartingMoveLoadout} from './battleLoadouts';
import {BATTLE_MOVES_BY_ID} from '@/data/battleMoves';
import {getCombinationMoveContributors} from './battleMoveInheritance';
import {getVariantDefinition} from './creatures';
import {nurseryIdentity} from './nurseryPresentation';
import type {BirthRecord,EggRecord,PregnancyRecord,ParentSnapshot} from '@/types/save';
import type {CreatureAbility,CreatureRecord,CreatureStats,StatGrades} from '@/types/creature';
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

/** Present the moves the hatch transaction actually gave this creature. */
export function getHatchlingMoveDetails(egg: EggRecord, creature: CreatureRecord) {
  const inheritance = egg.battleMoveInheritance;
  const baseline = buildBredCreatureStartingMoveLoadout(creature.speciesId);
  const loadout = creature.battleMoveLoadout ?? inheritance?.projectedLoadout ?? baseline;
  const { direct, combinations } = moveFields(inheritance);
  const parents = {
    giver: egg.parents.giver.displayName,
    receiver: egg.parents.receiver.displayName,
  };
  const groups = {
    'Inherited from parents': [] as HatchlingMoveDetail[],
    'Breeding combinations': [] as HatchlingMoveDetail[],
    'Species starting moves': [] as HatchlingMoveDetail[],
    'Source unrecorded': [] as HatchlingMoveDetail[],
  };
  for (const id of unique(loadout.learnedMoveIds)) {
    const move = BATTLE_MOVES_BY_ID[id];
    const roll = inheritance?.rolls?.find(result => result.moveId === id && result.inherited);
    const row: HatchlingMoveDetail = {
      id,
      name: move?.name ?? id,
      description: move?.description,
      equipped: loadout.equippedMoveIds.includes(id),
    };
    if (combinations.includes(id)) {
      const inputs = roll?.source === 'combination' ? roll.contributingMoveIds : [];
      if (inputs.length === 2) {
        const [first, second] = inputs;
        const roles = getCombinationMoveContributors(first, second, inheritance?.giverMoveSnapshot, inheritance?.receiverMoveSnapshot);
        const firstName = BATTLE_MOVES_BY_ID[first]?.name ?? first;
        const secondName = BATTLE_MOVES_BY_ID[second]?.name ?? second;
        row.source = roles
          ? `${parents[roles[0]]}: ${firstName} + ${parents[roles[1]]}: ${secondName}`
          : `${firstName} + ${secondName}`;
      } else {
        row.source = 'Combination recipe';
      }
      groups['Breeding combinations'].push(row);
    } else if (direct.includes(id)) {
      row.source = roll?.source === 'both' ? `${parents.giver} and ${parents.receiver}`
        : roll?.source === 'giver' || roll?.source === 'receiver' ? parents[roll.source]
        : 'Parent source unrecorded';
      groups['Inherited from parents'].push(row);
    } else if (baseline.learnedMoveIds.includes(id)) {
      groups['Species starting moves'].push(row);
    } else {
      groups['Source unrecorded'].push(row);
    }
  }
  return { groups, hasInheritanceRecord: Boolean(inheritance) };
}

type HatchlingMoveDetail = {
  id: string;
  name: string;
  description?: string;
  equipped: boolean;
  source?: string;
};
