import { createBattleState } from "@/data/battleEngine";
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
import type { BattleCombatant, BattleState } from "@/types/battle";
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

export function createColiseumBattleId(prefix: string, save: GameSave): string {
  return `${prefix}_${save.saveId}_${save.dayState.dayNumber}_${Date.now()}`;
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

export function getColiseumOpeningVitals(
  input: ColiseumOpeningInput,
  tacticsArmed: boolean,
): ReadonlyMap<CreatureId, ColiseumOpeningVitals> {
  const { state } = buildColiseumOpening(input, "coliseum_opening_preview");
  const opening: BattleState = tacticsArmed ? applyTeamTacticsOpeningEffect(state) : state;
  return new Map(opening.teams.player.combatantIds.map((id) => {
    const { sourceCreatureId, currentHp, maxHp, currentBattleEnergy, maxBattleEnergy } = opening.combatants[id];
    return [sourceCreatureId, { currentHp, maxHp, currentBattleEnergy, maxBattleEnergy }];
  }));
}
