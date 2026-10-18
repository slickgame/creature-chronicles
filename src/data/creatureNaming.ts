import type { GameSave } from '@/types/save';

export const CREATURE_NAME_LIMIT = 24;
export function creatureNameError(value: string): string | null {
  if (!value.trim()) return 'Enter a name.';
  if (value.trim().length > CREATURE_NAME_LIMIT) return 'Use 24 characters or fewer.';
  return null;
}
export function renameOwnedCreature(save: GameSave, creatureId: string, value: string) {
  const error = creatureNameError(value);
  if (error) return {save, ok: false, message: error};
  const creature = save.creatures?.find(c => c.creatureId === creatureId);
  if (!creature) return {save, ok: false, message: 'That creature is no longer available.'};
  const name = value.trim();
  if (creature.nickname === name) return {save, ok: true, message: 'Name unchanged.'};
  return {save: {...save,
    creatures: save.creatures!.map(c => c.creatureId === creatureId ? {...c, nickname: name} : c),
    flags: {...save.flags, m3CreatureRenamed: true, m9RenamePolishUsed: true},
  }, ok: true, message: `${creature.nickname} was renamed to ${name}.`};
}
