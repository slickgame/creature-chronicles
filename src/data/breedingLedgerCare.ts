import type { BreedingAttemptRecord } from '@/types/breeding';
import type { CreatureAbility, CreatureStats, StatGrades } from '@/types/creature';
import type { GameSave } from '@/types/save';

export type BreedingCareRecord = {
  id: string;
  tab: 'pregnancies' | 'eggs' | 'births';
  name: string;
  stage: string;
  stats?: CreatureStats;
  grades: StatGrades;
  abilities: CreatureAbility[];
  moveIds: string[];
};
/** Only explicit persisted links can associate care records with an attempt. */
export function getAttemptCareRecords(save: GameSave, attempt: BreedingAttemptRecord): BreedingCareRecord[] {
  const pregnancies = (save.pregnancies ?? []).filter(p => p.sourceAttemptId ? p.sourceAttemptId === attempt.attemptId : Boolean(attempt.pregnancyId && p.pregnancyId === attempt.pregnancyId));
  const pregnancyIds = new Set<string>(pregnancies.map(p => p.pregnancyId));
  if (attempt.pregnancyId) pregnancyIds.add(attempt.pregnancyId);
  const linked = (record: {sourceAttemptId?: string; sourcePregnancyId?: string}) => record.sourceAttemptId
    ? record.sourceAttemptId === attempt.attemptId
    : Boolean(record.sourcePregnancyId && pregnancyIds.has(record.sourcePregnancyId));
  return [
    ...pregnancies.filter(p => p.status === 'pregnant').map(p => ({id:p.pregnancyId,tab:'pregnancies' as const,name:p.inheritance.suggestedName || `${p.receiver.displayName}'s offspring`,stage:`Pregnancy · ${p.daysRemaining} days to delivery`,stats:p.inheritance.projectedStats,grades:p.inheritance.projectedStatGrades,abilities:p.inheritance.projectedAbilities,moveIds:p.inheritance.battleMoveInheritance?.projectedLoadout.learnedMoveIds??[]})),
    ...(save.eggs ?? []).filter(e => e.status !== 'hatched' && linked(e)).map(e => ({id:e.eggId,tab:'eggs' as const,name:e.suggestedName,stage:e.status === 'ready' ? 'Egg · Ready to hatch' : `Egg · ${e.daysRemaining} days incubating`,stats:e.projectedStats,grades:e.projectedStatGrades,abilities:e.projectedAbilities,moveIds:e.battleMoveInheritance?.projectedLoadout.learnedMoveIds??[]})),
    ...(save.birthHistory ?? []).filter(linked).map(b => ({id:b.birthId,tab:'births' as const,name:b.nickname,stage:`Birth · Hatched Day ${b.hatchedAtDayNumber}`,grades:b.inheritedStatGrades,abilities:b.inheritedAbilities,moveIds:b.startingBattleMoveLoadout?.learnedMoveIds??Array.from(new Set([...(b.inheritedMoveIds??[]),...(b.combinationMoveIds??[])]))})),
  ];
}
