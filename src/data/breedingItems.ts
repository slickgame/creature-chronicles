import { getVariantDefinition } from "@/data/creatures";
import type { CreatureId } from "@/types/ids";
import type {
  BreedingSupportItemId,
  ItemRarity,
  ItemTargetKind,
  ItemUseRecord,
  ItemUseSource,
} from "@/types/items";
import type { GameSave } from "@/types/save";

export type BreedingSupportItemTarget = "player-or-creature" | "creature" | "pregnancy" | "breeding-pair";

export type BreedingSupportItemDefinition = {
  itemId: BreedingSupportItemId;
  name: string;
  category: "Energy" | "Care" | "Breeding" | "Pregnancy";
  rarity: ItemRarity;
  description: string;
  exactEffect: string;
  target: BreedingSupportItemTarget;
  stockFlag: string;
  activeFlag?: string;
  iconPath: string;
  confirmationRequired: boolean;
};

export type BreedingItemUseOptions = {
  source: ItemUseSource;
  targetId?: string;
};

export type BreedingItemUseResult = {
  save: GameSave;
  ok: boolean;
  message: string;
};

export const ENERGY_SNACK_RESTORE = 12;
export const ENERGY_MEAL_RESTORE = 30;
export const AFFECTION_TREAT_GAIN = 8;
export const RECOVERY_BALM_HEART_GAIN = 1;
export const GESTATION_TONIC_DAY_REDUCTION = 1;
export const FERTILITY_TONIC_CHANCE_BONUS = 12;
export const TRAIT_STABILIZER_STABILITY_BONUS = 12;
export const TRAIT_STABILIZER_DOWNGRADE_REDUCTION = 4;
export const TRAIT_STABILIZER_ABILITY_BONUS = 8;
export const MUTATION_CATALYST_MUTATION_BONUS = 5;
export const MUTATION_CATALYST_ABILITY_MUTATION_BONUS = 3;
export const MUTATION_CATALYST_RARE_VARIANT_BONUS = 3;

export const BREEDING_SUPPORT_ITEMS: readonly BreedingSupportItemDefinition[] = [
  {
    itemId: "energy_snack",
    name: "Energy Snack",
    category: "Energy",
    rarity: "Common",
    description: "A compact snack for restoring enough Energy to extend a ranch work session.",
    exactEffect: `Restores exactly ${ENERGY_SNACK_RESTORE} Energy to the player or one creature, up to the target's maximum.`,
    target: "player-or-creature",
    stockFlag: "energySnackStock",
    iconPath: "/images/items/supply_depot/energy_snack.png",
    confirmationRequired: false,
  },
  {
    itemId: "energy_meal",
    name: "Hearty Energy Meal",
    category: "Energy",
    rarity: "Uncommon",
    description: "A more substantial prepared meal for demanding ranch days.",
    exactEffect: `Restores exactly ${ENERGY_MEAL_RESTORE} Energy to the player or one creature, up to the target's maximum.`,
    target: "player-or-creature",
    stockFlag: "energyMealStock",
    iconPath: "/images/items/supply_depot/energy_snack.png",
    confirmationRequired: false,
  },
  {
    itemId: "fertility_tonic",
    name: "Fertility Tonic",
    category: "Breeding",
    rarity: "Uncommon",
    description: "A measured breeding support tonic that is armed before a session instead of being consumed automatically from storage.",
    exactEffect: `Arms +${FERTILITY_TONIC_CHANCE_BONUS}% pregnancy chance for the next valid breeding attempt. The effect is consumed by that attempt, whether pregnancy succeeds or fails.`,
    target: "breeding-pair",
    stockFlag: "breedingFertilityTonics",
    activeFlag: "breedingFertilityTonicArmed",
    iconPath: "/images/items/supply_depot/fertility_tonic.png",
    confirmationRequired: false,
  },
  {
    itemId: "affection_treat",
    name: "Affection Treat",
    category: "Care",
    rarity: "Common",
    description: "A favorite ranch treat used to strengthen a creature's comfort and trust.",
    exactEffect: `Adds exactly ${AFFECTION_TREAT_GAIN} Affection to one creature, up to 100.`,
    target: "creature",
    stockFlag: "affectionTreatStock",
    iconPath: "/images/items/supply_depot/feed_bundle.png",
    confirmationRequired: false,
  },
  {
    itemId: "recovery_balm",
    name: "Recovery Balm",
    category: "Care",
    rarity: "Uncommon",
    description: "A restorative balm for minor injury recovery and depleted Hearts.",
    exactEffect: `Restores ${RECOVERY_BALM_HEART_GAIN} Heart and shortens an active injury by ${GESTATION_TONIC_DAY_REDUCTION} in-game day. At least one of those effects must apply.`,
    target: "creature",
    stockFlag: "recoveryBalmStock",
    iconPath: "/images/items/supply_depot/nursery_supply_kit.png",
    confirmationRequired: false,
  },
  {
    itemId: "trait_stabilizer",
    name: "Trait Stabilizer",
    category: "Breeding",
    rarity: "Rare",
    description: "A rare pre-conception treatment intended to make inherited traits more consistent.",
    exactEffect: `Arms the next successful conception with +${TRAIT_STABILIZER_STABILITY_BONUS} inheritance stability, -${TRAIT_STABILIZER_DOWNGRADE_REDUCTION}% grade-downgrade chance, and +${TRAIT_STABILIZER_ABILITY_BONUS}% parent-ability inheritance chance. Failed attempts do not consume the armed effect.`,
    target: "breeding-pair",
    stockFlag: "traitStabilizerStock",
    activeFlag: "traitStabilizerArmed",
    iconPath: "/images/items/supply_depot/fertility_tonic.png",
    confirmationRequired: true,
  },
  {
    itemId: "mutation_catalyst",
    name: "Mutation Catalyst",
    category: "Breeding",
    rarity: "Epic",
    description: "A very rare catalyst that deliberately raises unusual inheritance outcomes.",
    exactEffect: `Arms the next successful conception with +${MUTATION_CATALYST_MUTATION_BONUS}% beneficial stat mutation chance, +${MUTATION_CATALYST_ABILITY_MUTATION_BONUS}% new-ability mutation chance, and +${MUTATION_CATALYST_RARE_VARIANT_BONUS}% rare-variant chance. Failed attempts do not consume the armed effect.`,
    target: "breeding-pair",
    stockFlag: "mutationCatalystStock",
    activeFlag: "mutationCatalystArmed",
    iconPath: "/images/items/supply_depot/fertility_tonic.png",
    confirmationRequired: true,
  },
  {
    itemId: "gestation_tonic",
    name: "Gestation Tonic",
    category: "Pregnancy",
    rarity: "Rare",
    description: "A carefully controlled tonic for shortening an established pregnancy without skipping delivery handling.",
    exactEffect: `Reduces one active pregnancy's remaining duration by exactly ${GESTATION_TONIC_DAY_REDUCTION} in-game day, but never below 1 day remaining.`,
    target: "pregnancy",
    stockFlag: "gestationTonicStock",
    iconPath: "/images/items/supply_depot/nursery_supply_kit.png",
    confirmationRequired: true,
  },
] as const;

function flagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function definition(itemId: BreedingSupportItemId): BreedingSupportItemDefinition {
  const item = BREEDING_SUPPORT_ITEMS.find((candidate) => candidate.itemId === itemId);
  if (!item) throw new Error(`Unknown breeding support item: ${itemId}`);
  return item;
}

export function getBreedingSupportItem(itemId: string): BreedingSupportItemDefinition | null {
  return BREEDING_SUPPORT_ITEMS.find((item) => item.itemId === itemId) ?? null;
}

export function getBreedingSupportItemCount(save: GameSave, itemId: BreedingSupportItemId): number {
  return flagNumber(save.flags[definition(itemId).stockFlag]);
}

export function getBreedingSupportItemActiveCount(save: GameSave, itemId: BreedingSupportItemId): number {
  const activeFlag = definition(itemId).activeFlag;
  return activeFlag ? flagNumber(save.flags[activeFlag]) : 0;
}

export function isBreedingSupportItemArmed(save: GameSave, itemId: BreedingSupportItemId): boolean {
  return getBreedingSupportItemActiveCount(save, itemId) > 0;
}

function targetFamily(save: GameSave, targetId: string | undefined) {
  const creature = (save.creatures ?? []).find((candidate) => candidate.creatureId === targetId);
  return creature ? getVariantDefinition(creature.variantId).family : undefined;
}

function historyRecord(
  save: GameSave,
  item: BreedingSupportItemDefinition,
  options: BreedingItemUseOptions,
  targetKind: ItemTargetKind,
  targetName: string | undefined,
  effectSummary: string,
): ItemUseRecord {
  const usedAt = new Date().toISOString();
  return {
    itemUseId: `item_use_${Date.now()}_${item.itemId}`,
    itemId: item.itemId,
    itemName: item.name,
    rarity: item.rarity,
    source: options.source,
    dayNumber: save.dayState.dayNumber,
    usedAt,
    targetKind,
    targetId: options.targetId,
    targetName,
    targetFamily: targetFamily(save, options.targetId),
    effectSummary,
  };
}

function withHistory(save: GameSave, record: ItemUseRecord): GameSave {
  return {
    ...save,
    updatedAt: record.usedAt,
    itemUseHistory: [record, ...(save.itemUseHistory ?? [])],
    flags: {
      ...save.flags,
      breedingItemExpansionEnabled: true,
      itemUseHistoryEnabled: true,
    },
  };
}

function spendStock(save: GameSave, item: BreedingSupportItemDefinition): GameSave {
  const stock = getBreedingSupportItemCount(save, item.itemId);
  return {
    ...save,
    flags: {
      ...save.flags,
      [item.stockFlag]: Math.max(0, stock - 1),
    },
  };
}

function useEnergyItem(
  save: GameSave,
  item: BreedingSupportItemDefinition,
  options: BreedingItemUseOptions,
  restoreAmount: number,
): BreedingItemUseResult {
  const targetId = options.targetId;
  if (!targetId) return { save, ok: false, message: `Choose the player or a creature before using ${item.name}.` };
  if (targetId === "player") {
    if (save.currencies.energy >= save.currencies.maxEnergy) {
      return { save, ok: false, message: "Player Energy is already full." };
    }
    const energy = Math.min(save.currencies.maxEnergy, save.currencies.energy + restoreAmount);
    const restored = energy - save.currencies.energy;
    const spent = spendStock(save, item);
    const effect = `Restored ${restored} Energy to ${save.player.name}.`;
    const record = historyRecord(save, item, options, "player", save.player.name, effect);
    return {
      save: withHistory({ ...spent, currencies: { ...spent.currencies, energy } }, record),
      ok: true,
      message: `Used ${item.name} on ${save.player.name} and restored ${restored} Energy.`,
    };
  }

  const creature = (save.creatures ?? []).find((candidate) => candidate.creatureId === targetId);
  if (!creature) return { save, ok: false, message: "That creature could not be found." };
  if (creature.energy >= creature.maxEnergy) {
    return { save, ok: false, message: `${creature.nickname}'s Energy is already full.` };
  }
  const energy = Math.min(creature.maxEnergy, creature.energy + restoreAmount);
  const restored = energy - creature.energy;
  const spent = spendStock(save, item);
  const effect = `Restored ${restored} Energy to ${creature.nickname}.`;
  const record = historyRecord(save, item, options, "creature", creature.nickname, effect);
  return {
    save: withHistory({
      ...spent,
      creatures: (spent.creatures ?? []).map((candidate) =>
        candidate.creatureId === creature.creatureId ? { ...candidate, energy } : candidate,
      ),
    }, record),
    ok: true,
    message: `Used ${item.name} on ${creature.nickname} and restored ${restored} Energy.`,
  };
}

function armItem(
  save: GameSave,
  item: BreedingSupportItemDefinition,
  options: BreedingItemUseOptions,
): BreedingItemUseResult {
  if (!item.activeFlag) return { save, ok: false, message: `${item.name} cannot be armed.` };
  if (flagNumber(save.flags[item.activeFlag]) > 0) {
    return { save, ok: false, message: `${item.name} is already armed.` };
  }
  const spent = spendStock(save, item);
  const effect = `${item.exactEffect} The effect is now armed.`;
  const record = historyRecord(save, item, options, "pair", "Next valid breeding pair", effect);
  return {
    save: withHistory({
      ...spent,
      flags: {
        ...spent.flags,
        [item.activeFlag]: 1,
      },
    }, record),
    ok: true,
    message: `${item.name} armed. ${item.exactEffect}`,
  };
}

export function useBreedingSupportItem(
  save: GameSave,
  itemId: BreedingSupportItemId,
  options: BreedingItemUseOptions,
): BreedingItemUseResult {
  const item = definition(itemId);
  if (getBreedingSupportItemCount(save, itemId) <= 0) {
    return { save, ok: false, message: `No ${item.name} owned.` };
  }

  if (itemId === "energy_snack") return useEnergyItem(save, item, options, ENERGY_SNACK_RESTORE);
  if (itemId === "energy_meal") return useEnergyItem(save, item, options, ENERGY_MEAL_RESTORE);
  if (itemId === "fertility_tonic" || itemId === "trait_stabilizer" || itemId === "mutation_catalyst") {
    return armItem(save, item, options);
  }

  if (itemId === "affection_treat") {
    const creature = (save.creatures ?? []).find((candidate) => candidate.creatureId === options.targetId);
    if (!creature) return { save, ok: false, message: "Choose a creature before using an Affection Treat." };
    if (creature.affection >= 100) return { save, ok: false, message: `${creature.nickname} already has maximum Affection.` };
    const affection = Math.min(100, creature.affection + AFFECTION_TREAT_GAIN);
    const gained = affection - creature.affection;
    const spent = spendStock(save, item);
    const effect = `Added ${gained} Affection to ${creature.nickname}.`;
    const record = historyRecord(save, item, options, "creature", creature.nickname, effect);
    return {
      save: withHistory({
        ...spent,
        creatures: (spent.creatures ?? []).map((candidate) =>
          candidate.creatureId === creature.creatureId ? { ...candidate, affection } : candidate,
        ),
      }, record),
      ok: true,
      message: `Used Affection Treat on ${creature.nickname}; Affection increased by ${gained}.`,
    };
  }

  if (itemId === "recovery_balm") {
    const creature = (save.creatures ?? []).find((candidate) => candidate.creatureId === options.targetId);
    if (!creature) return { save, ok: false, message: "Choose a creature before using Recovery Balm." };
    const canRestoreHeart = creature.hearts < creature.maxHearts;
    const isInjured = Boolean(
      creature.injuredUntilDayNumber && creature.injuredUntilDayNumber >= save.dayState.dayNumber,
    );
    if (!canRestoreHeart && !isInjured) {
      return { save, ok: false, message: `${creature.nickname} has full Hearts and no active injury.` };
    }
    const hearts = Math.min(creature.maxHearts, creature.hearts + RECOVERY_BALM_HEART_GAIN);
    const reducedUntil = isInjured
      ? Math.max(save.dayState.dayNumber - 1, (creature.injuredUntilDayNumber ?? save.dayState.dayNumber) - 1)
      : creature.injuredUntilDayNumber;
    const injuryCleared = isInjured && (reducedUntil ?? 0) < save.dayState.dayNumber;
    const spent = spendStock(save, item);
    const effectParts = [
      canRestoreHeart ? `restored ${hearts - creature.hearts} Heart` : null,
      isInjured ? (injuryCleared ? "cleared the remaining injury recovery" : "shortened injury recovery by 1 day") : null,
    ].filter(Boolean);
    const effect = `${creature.nickname}: ${effectParts.join(" and ")}.`;
    const record = historyRecord(save, item, options, "creature", creature.nickname, effect);
    return {
      save: withHistory({
        ...spent,
        creatures: (spent.creatures ?? []).map((candidate) =>
          candidate.creatureId === creature.creatureId
            ? {
                ...candidate,
                hearts,
                injuredUntilDayNumber: injuryCleared ? undefined : reducedUntil,
                injuryLabel: injuryCleared ? undefined : candidate.injuryLabel,
              }
            : candidate,
        ),
      }, record),
      ok: true,
      message: `Used Recovery Balm on ${creature.nickname}; ${effectParts.join(" and ")}.`,
    };
  }

  const pregnancy = (save.pregnancies ?? []).find(
    (candidate) => candidate.pregnancyId === options.targetId && candidate.status === "pregnant",
  );
  if (!pregnancy) return { save, ok: false, message: "Choose an active pregnancy before using Gestation Tonic." };
  if (pregnancy.daysRemaining <= 1) {
    return { save, ok: false, message: "That pregnancy is already due within 1 day and cannot be shortened further." };
  }
  const daysRemaining = Math.max(1, pregnancy.daysRemaining - GESTATION_TONIC_DAY_REDUCTION);
  const spent = spendStock(save, item);
  const receiverName = pregnancy.receiver.displayName;
  const effect = `Reduced ${receiverName}'s pregnancy from ${pregnancy.daysRemaining} to ${daysRemaining} days remaining.`;
  const record = historyRecord(save, item, options, "pregnancy", receiverName, effect);
  return {
    save: withHistory({
      ...spent,
      pregnancies: (spent.pregnancies ?? []).map((candidate) =>
        candidate.pregnancyId === pregnancy.pregnancyId ? { ...candidate, daysRemaining } : candidate,
      ),
    }, record),
    ok: true,
    message: `Used Gestation Tonic on ${receiverName}; pregnancy duration decreased by 1 day.`,
  };
}

export function getRecentItemUseHistory(save: GameSave, limit = 20): ItemUseRecord[] {
  return [...(save.itemUseHistory ?? [])]
    .sort((a, b) => b.usedAt.localeCompare(a.usedAt))
    .slice(0, Math.max(0, limit));
}

export function getCreatureItemTargetIds(save: GameSave): CreatureId[] {
  return (save.creatures ?? []).map((creature) => creature.creatureId);
}
