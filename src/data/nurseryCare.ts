import type { EggRecord, GameSave } from '@/types/save';

/** Mirrors the existing hatch reducer's timer and exact target-habitat checks. */
export function getEggReadiness(save: GameSave, egg: EggRecord) {
  const habitat = (save.habitats ?? []).find(h => h.habitatId === egg.habitatId);
  const spaces = habitat?.unlocked ? Math.max(0, habitat.capacity - habitat.creatureIds.length) : 0;
  const blocker = egg.status === 'hatched' ? 'Already hatched.'
    : egg.status !== 'ready' ? `Incubation: ${egg.daysRemaining} day${egg.daysRemaining === 1 ? '' : 's'} remaining. Sleep advances the timer.`
    : !habitat?.unlocked ? 'This egg needs its own species habitat. Ask Petra to build it.'
    : spaces === 0 ? 'The target habitat is full. Make room or ask Petra about capacity.' : null;
  return { canHatch: blocker === null, blocker, habitat, spaces };
}
