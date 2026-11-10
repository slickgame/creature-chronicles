import { createBattleState, getBattleOrderPreview } from "@/data/battleEngine";
import {
  applyBattleOutfitterLoadouts,
  applyEquipmentOpeningPassives,
  applyTeamTacticsOpeningEffect,
} from "@/data/battleOutfitterIntegration";
import {
  applyAuthoredColiseumEquipment,
  buildAuthoredColiseumEnemyTeam,
  type ColiseumC2EncounterDefinition,
} from "@/data/coliseumC2";
import {
  applyColiseumC4Carryover,
  applyColiseumC4Modifiers,
  type ColiseumC4CarryoverMap,
  type ColiseumC4ModifierId,
} from "@/data/coliseumC4";
import type { BattleCombatant, BattleCombatantId } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

type ColiseumOpeningInput = {
  save: GameSave;
  encounter: ColiseumC2EncounterDefinition;
  team: CreatureRecord[];
  playerTeamName: string;
  challenge?: {
    modifierIds: ColiseumC4ModifierId[];
    carryover?: ColiseumC4CarryoverMap;
  };
};

export type ColiseumOpeningVitals = Pick<BattleCombatant,
  "currentHp" | "maxHp" | "currentBattleEnergy" | "maxBattleEnergy"
>;

export type ColiseumOpeningOrderEntry = Pick<BattleCombatant, "sourceCreatureId" | "name" | "sideId"> & {
  actorId: BattleCombatantId;
  speed: number;
  variantId: CreatureRecord["variantId"];
};

export function createColiseumAttemptKey(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createColiseumBattleId(prefix: string, save: GameSave, attemptKey: string): string {
  return `${prefix}_${save.saveId}_${save.dayState.dayNumber}_${attemptKey}`;
}

export function buildColiseumOpening(
  { save, encounter, team, playerTeamName, challenge }: ColiseumOpeningInput,
  battleId: string,
) {
  const enemies = buildAuthoredColiseumEnemyTeam(save.saveId, encounter);
  const base = createBattleState({
    battleId,
    playerCreatures: team,
    enemyCreatures: enemies,
    playerTeamName,
    enemyTeamName: encounter.opponentName,
  });
  const equipped = applyAuthoredColiseumEquipment(applyBattleOutfitterLoadouts(save, base), encounter);
  if (!challenge) return { state: equipped, enemies };

  const modified = applyColiseumC4Modifiers(equipped, challenge.modifierIds);
  const restored = applyColiseumC4Carryover(modified, challenge.carryover);
  return { state: applyEquipmentOpeningPassives(save, restored), enemies };
}

export function getColiseumOpeningPreview(
  input: ColiseumOpeningInput,
  battleId: string,
  tacticsArmed: boolean,
): { vitals: ReadonlyMap<CreatureId, ColiseumOpeningVitals>; order: readonly ColiseumOpeningOrderEntry[] } {
  const { state, enemies } = buildColiseumOpening(input, battleId);
  const opening = tacticsArmed ? applyTeamTacticsOpeningEffect(state) : state;
  const vitals = new Map(opening.teams.player.combatantIds.map((id) => {
    const { sourceCreatureId, currentHp, maxHp, currentBattleEnergy, maxBattleEnergy } = opening.combatants[id];
    return [sourceCreatureId, { currentHp, maxHp, currentBattleEnergy, maxBattleEnergy }];
  }));
  const order = input.team.length === 3 ? getBattleOrderPreview(opening, new Map()).map(({ actorId, score }) => {
    const { sourceCreatureId, name, sideId, slotIndex } = opening.combatants[actorId];
    const source = sideId === "player" ? input.team[slotIndex] : enemies[slotIndex];
    return { actorId, sourceCreatureId, name, sideId, speed: score, variantId: source.variantId };
  }) : [];
  return { vitals, order };
}
