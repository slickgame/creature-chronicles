import * as core from "./battleEngine";
import { getCreatureBattleMoveLoadout } from "@/data/battleLoadouts";
import type { BattleMoveLoadout } from "@/types/battle";
import type { CreatureId } from "@/types/ids";

export * from "./battleEngine";

export function createBattleState(input: core.CreateBattleStateInput) {
  const playerLoadouts = input.playerCreatures.reduce(
    (loadouts, creature) => ({
      ...loadouts,
      [creature.creatureId]: input.playerLoadouts?.[creature.creatureId] ?? getCreatureBattleMoveLoadout(creature),
    }),
    {} as Partial<Record<CreatureId, BattleMoveLoadout>>,
  );
  const enemyLoadouts = input.enemyCreatures.reduce(
    (loadouts, creature) => ({
      ...loadouts,
      [creature.creatureId]: input.enemyLoadouts?.[creature.creatureId] ?? getCreatureBattleMoveLoadout(creature),
    }),
    {} as Partial<Record<CreatureId, BattleMoveLoadout>>,
  );
  return core.createBattleState({
    ...input,
    playerLoadouts,
    enemyLoadouts,
  });
}
