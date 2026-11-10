import { createBattleState, getBattleOrderPreview, getBattleSpeedStatusModifiers } from "@/data/battleEngine";
import { getBattleStatusGlossary } from "@/data/battleGlossary";
import {
  applyBattleOutfitterLoadouts,
  applyEquipmentOpeningPassives,
  applyTeamTacticsOpeningEffect,
  getBattleOutfitterCreatureEffectSummary,
} from "@/data/battleOutfitterIntegration";
import {
  applyAuthoredColiseumEquipment,
  buildAuthoredColiseumEnemyTeam,
  type ColiseumC2EncounterDefinition,
} from "@/data/coliseumC2";
import {
  applyColiseumC4Carryover,
  applyColiseumC4Modifiers,
  getColiseumC4Modifier,
  getColiseumC4OpeningSpeedChanges,
  type ColiseumC4CarryoverMap,
  type ColiseumC4ModifierId,
} from "@/data/coliseumC4";
import { EQUIPMENT_SETS } from "@/data/equipmentRules";
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
  speedBreakdown: { base: number; contributions: readonly ColiseumOpeningSpeedContribution[] };
};

type ColiseumOpeningSpeedContribution = { label: string; amount: number };

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
  if (!challenge) return { state: equipped, enemies, base, equipped };

  const modified = applyColiseumC4Modifiers(equipped, challenge.modifierIds);
  const restored = applyColiseumC4Carryover(modified, challenge.carryover);
  return { state: applyEquipmentOpeningPassives(save, restored), enemies, base, equipped };
}

function getOpeningEquipmentSpeedChanges(
  input: ColiseumOpeningInput,
  combatant: BattleCombatant,
  equipmentDelta: number,
): ColiseumOpeningSpeedContribution[] {
  if (combatant.sideId === "enemy") {
    const equipment = input.encounter.enemyTeam[combatant.slotIndex]?.equipment;
    return equipmentDelta && equipment ? [{ label: equipment.name, amount: equipmentDelta }] : [];
  }

  const summary = getBattleOutfitterCreatureEffectSummary(input.save, combatant.sourceCreatureId);
  const setBonus = equipmentDelta - summary.speedBonus;
  if (!setBonus) return summary.speedBonuses;

  const setNames = summary.sets
    ?.filter(set => set.activations > 0 && "speed" in EQUIPMENT_SETS[set.id].rates)
    .map(set => set.name) ?? [];
  return [...summary.speedBonuses, {
    label: setNames.length ? `${setNames.join(" + ")} set` : "Equipment set bonus",
    amount: setBonus,
  }];
}

export function getColiseumOpeningPreview(
  input: ColiseumOpeningInput,
  battleId: string,
  tacticsArmed: boolean,
): { vitals: ReadonlyMap<CreatureId, ColiseumOpeningVitals>; order: readonly ColiseumOpeningOrderEntry[] } {
  const { state, enemies, base, equipped } = buildColiseumOpening(input, battleId);
  const opening = tacticsArmed ? applyTeamTacticsOpeningEffect(state) : state;
  const vitals = new Map(opening.teams.player.combatantIds.map((id) => {
    const { sourceCreatureId, currentHp, maxHp, currentBattleEnergy, maxBattleEnergy } = opening.combatants[id];
    return [sourceCreatureId, { currentHp, maxHp, currentBattleEnergy, maxBattleEnergy }];
  }));
  const modifierIds = input.challenge?.modifierIds ?? [];
  const fieldChanges = getColiseumC4OpeningSpeedChanges(modifierIds);
  const exhaustingHeat = modifierIds.includes("exhausting_heat") ? getColiseumC4Modifier("exhausting_heat").name : null;
  const order = input.team.length === 3 ? getBattleOrderPreview(opening, new Map()).map(({ actorId, score }) => {
    const combatant = opening.combatants[actorId];
    const { sourceCreatureId, name, sideId, slotIndex } = combatant;
    const source = sideId === "player" ? input.team[slotIndex] : enemies[slotIndex];
    const baseSpeed = base.combatants[actorId].battleStats.speed;
    const contributions = [
      ...getOpeningEquipmentSpeedChanges(input, combatant, equipped.combatants[actorId].battleStats.speed - baseSpeed),
      ...fieldChanges,
    ];
    for (const [status, amount] of getBattleSpeedStatusModifiers(combatant)) {
      const label = sideId === "player" && status === "exhausted" && exhaustingHeat
        ? exhaustingHeat : getBattleStatusGlossary(status).label;
      if (amount) contributions.push({ label, amount });
    }
    // Effective Speed rounds and bottoms out at 1. Reconcile the displayed parts to the same value as the queue.
    const subtotal = contributions.reduce((speed, change) => speed + change.amount, baseSpeed);
    if (subtotal !== score) {
      contributions.push({ label: subtotal < 1 ? "Speed floor" : "Speed rounding", amount: score - subtotal });
    }
    return {
      actorId, sourceCreatureId, name, sideId, speed: score, variantId: source.variantId,
      speedBreakdown: { base: baseSpeed, contributions },
    };
  }) : [];
  return { vitals, order };
}
