import { getBreedingParticipants, getBreedingPreview } from "@/data/breeding";
import type { CreatureAbility } from "@/types/creature";
import type { GameSave } from "@/types/save";
import { BREEDING_ECONOMY_CONFIG, getBreederXpToNext, getCreatureXpToNext } from "./breedingEconomyConfig";
import type {
  BalanceScenarioSource,
  BreedingEconomyScenario,
} from "./breedingEconomyTypes";

function abilityGradeMultiplier(grade: CreatureAbility["grade"]): number {
  if (grade === "S") return 1.6;
  if (grade === "A") return 1.35;
  if (grade === "B") return 1.15;
  if (grade === "C") return 1;
  if (grade === "D") return 0.8;
  return 0.65;
}

function summarizeAbilityEffects(abilities: CreatureAbility[] | undefined) {
  return (abilities ?? []).reduce(
    (summary, ability) => {
      const multiplier = abilityGradeMultiplier(ability.grade);
      const id = ability.id.toLowerCase();
      summary.chance += id.includes("fert") || id.includes("bond") || id.includes("grace") || id.includes("lucky")
        ? Math.round(3 * multiplier)
        : Math.round(1 * multiplier);
      summary.xp += id.includes("learn") || id.includes("growth") || id.includes("vigor") || id.includes("spark")
        ? Math.round(4 * multiplier)
        : Math.round(1 * multiplier);
      summary.breederXp += id.includes("loyal") || id.includes("guard") || id.includes("poise")
        ? Math.round(4 * multiplier)
        : 0;
      summary.energyDiscount += id.includes("steady") || id.includes("efficient") || id.includes("hardy")
        ? Math.round(3 * multiplier)
        : 0;
      return summary;
    },
    { chance: 0, xp: 0, breederXp: 0, energyDiscount: 0 },
  );
}

function averageTimer(values: number[], fallback: number): number {
  if (!values.length) return fallback;
  return Math.max(1, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length));
}

export function buildCurrentSaveBalanceScenario(
  save: GameSave,
  giverId: string,
  receiverId: string,
): BreedingEconomyScenario | null {
  const participants = getBreedingParticipants(save);
  const giver = participants.find((participant) => participant.participantId === giverId);
  const receiver = participants.find((participant) => participant.participantId === receiverId);
  const preview = getBreedingPreview(save, giverId, receiverId);
  if (!giver || !receiver || !preview) return null;

  const giverAbility = summarizeAbilityEffects(giver.abilities);
  const receiverAbility = summarizeAbilityEffects(receiver.abilities);
  const abilityChanceBonus = giverAbility.chance + receiverAbility.chance;
  const abilityXpBonus = giverAbility.xp + receiverAbility.xp;
  const abilityBreederXpBonus = giverAbility.breederXp + receiverAbility.breederXp;
  const abilityEnergyDiscount = giverAbility.energyDiscount + receiverAbility.energyDiscount;
  const fertilityBonus = Math.floor(((giver.stats?.FER ?? 5) + (receiver.stats?.FER ?? 5)) / 3);
  const charmBonus = Math.floor(((giver.stats?.CHA ?? 5) + (receiver.stats?.CHA ?? 5)) / 6);
  const facilityChanceBonus = Math.max(0, preview.abilityBonus - abilityChanceBonus);
  const pregnancyDays = averageTimer(
    (save.pregnancies ?? []).map((pregnancy) => pregnancy.totalDays),
    BREEDING_ECONOMY_CONFIG.defaultPregnancyDays,
  );
  const eggDays = averageTimer(
    (save.eggs ?? []).map((egg) => egg.totalDays),
    BREEDING_ECONOMY_CONFIG.defaultEggDays,
  );
  const receiverCount = Math.max(
    1,
    participants.filter(
      (participant) => participant.kind === "creature" && participant.roleTags.includes("receiver") && participant.canBreed && !participant.isPregnant,
    ).length,
  );
  const playerInvolved = giver.kind === "player" || receiver.kind === "player";

  return {
    id: `current-${giverId}-${receiverId}`,
    name: `${giver.displayName} × ${receiver.displayName}`,
    description: "Uses the live Breeding Pen preview, current stats, abilities, upgrades, resources, and pair familiarity from this save.",
    source: "current",
    seed: 260728,
    mode: "timeline",
    runs: 1000,
    timelineDays: 30,
    pairStrategy: "repeat-pair",
    receiverCount,
    receiverCanBecomePregnant: preview.receiverCanBecomePregnant,
    playerInvolved,
    baseChance: preview.baseChance,
    chanceCap: BREEDING_ECONOMY_CONFIG.pregnancyChanceCap,
    affectionBonus: preview.affectionBonus,
    fertilityBonus,
    charmBonus,
    facilityChanceBonus,
    abilityChanceBonus,
    pairStreakBonusPerFailure: BREEDING_ECONOMY_CONFIG.pairStreakBonusPerFailure,
    pairStreakBonusCap: BREEDING_ECONOMY_CONFIG.pairStreakBonusCap,
    initialStreak: preview.streakCount,
    energyCost: preview.energyCost,
    energyCostWithoutAbilities: Math.min(
      BREEDING_ECONOMY_CONFIG.baseEnergyCost,
      preview.energyCost + abilityEnergyDiscount,
    ),
    heartCost: preview.heartCost,
    creatureXpGain: preview.xpGain,
    creatureXpGainWithoutAbilities: Math.max(1, preview.xpGain - abilityXpBonus),
    breederXpGain: preview.breederXpGain,
    breederXpGainWithoutAbilities: Math.max(0, preview.breederXpGain - abilityBreederXpBonus),
    giver: {
      name: giver.displayName,
      kind: giver.kind,
      maxEnergy: giver.maxEnergy,
      maxHearts: giver.maxHearts,
      level: giver.level ?? 1,
      xp: giver.xp ?? 0,
      xpToNext: giver.xpToNext ?? (giver.kind === "player" ? getBreederXpToNext(giver.level ?? 1) : getCreatureXpToNext(giver.level ?? 1)),
    },
    receiver: {
      name: receiver.displayName,
      kind: receiver.kind,
      maxEnergy: receiver.maxEnergy,
      maxHearts: receiver.maxHearts,
      level: receiver.level ?? 1,
      xp: receiver.xp ?? 0,
      xpToNext: receiver.xpToNext ?? (receiver.kind === "player" ? getBreederXpToNext(receiver.level ?? 1) : getCreatureXpToNext(receiver.level ?? 1)),
    },
    pregnancyDays,
    eggDays,
    startingGold: save.currencies.gold,
    goldIncomePerDay: 0,
    fixedGoldSpendPerDay: 0,
    snackPolicy: "when-blocked",
    snackMaxPerDay: 4,
    energySnackRestore: BREEDING_ECONOMY_CONFIG.energySnackRestore,
    energySnackPrice: BREEDING_ECONOMY_CONFIG.energySnackPrice,
    tonicPolicy: "never",
    fertilityTonicBonus: BREEDING_ECONOMY_CONFIG.fertilityTonicBonus,
    fertilityTonicPrice: BREEDING_ECONOMY_CONFIG.fertilityTonicPrice,
  };
}

function makePreset(source: Exclude<BalanceScenarioSource, "current">): BreedingEconomyScenario {
  const presets = {
    "new-ranch": {
      name: "New Ranch",
      description: "Low affection, no familiarity, ordinary stats, no facilities, and a small two-creature receiver pool.",
      chance: { affection: 2, fertility: 3, charm: 2, facility: 0, ability: 0 },
      cost: 30,
      costWithoutAbilities: 30,
      xp: 12,
      xpWithoutAbilities: 12,
      breederXp: 18,
      breederXpWithoutAbilities: 18,
      energy: 96,
      hearts: 4,
      receiverCount: 2,
      gold: 500,
    },
    "typical-ranch": {
      name: "Typical Ranch",
      description: "Mid-affection breeders, average talents, one modest facility bonus, and four eligible receivers.",
      chance: { affection: 3, fertility: 5, charm: 3, facility: 3, ability: 3 },
      cost: 26,
      costWithoutAbilities: 29,
      xp: 16,
      xpWithoutAbilities: 13,
      breederXp: 21,
      breederXpWithoutAbilities: 18,
      energy: 112,
      hearts: 5,
      receiverCount: 4,
      gold: 1200,
    },
    "established-ranch": {
      name: "Established Ranch",
      description: "High affection, stronger stats and talents, upgraded breeding comfort, and six eligible receivers.",
      chance: { affection: 4, fertility: 7, charm: 4, facility: 7, ability: 6 },
      cost: 21,
      costWithoutAbilities: 27,
      xp: 22,
      xpWithoutAbilities: 16,
      breederXp: 27,
      breederXpWithoutAbilities: 21,
      energy: 138,
      hearts: 5,
      receiverCount: 6,
      gold: 2600,
    },
    "optimized-ranch": {
      name: "Optimized Ranch",
      description: "Strong abilities, high stats, maximum comfort assumptions, and eight eligible receivers.",
      chance: { affection: 5, fertility: 9, charm: 5, facility: 12, ability: 10 },
      cost: 14,
      costWithoutAbilities: 23,
      xp: 30,
      xpWithoutAbilities: 19,
      breederXp: 36,
      breederXpWithoutAbilities: 24,
      energy: 165,
      hearts: 6,
      receiverCount: 8,
      gold: 5000,
    },
  } as const;

  const preset = presets[source];
  return {
    id: source,
    name: preset.name,
    description: preset.description,
    source,
    seed: 260728,
    mode: "timeline",
    runs: 1000,
    timelineDays: 30,
    pairStrategy: "rotate-receivers",
    receiverCount: preset.receiverCount,
    receiverCanBecomePregnant: true,
    playerInvolved: true,
    baseChance: BREEDING_ECONOMY_CONFIG.basePregnancyChance,
    chanceCap: BREEDING_ECONOMY_CONFIG.pregnancyChanceCap,
    affectionBonus: preset.chance.affection,
    fertilityBonus: preset.chance.fertility,
    charmBonus: preset.chance.charm,
    facilityChanceBonus: preset.chance.facility,
    abilityChanceBonus: preset.chance.ability,
    pairStreakBonusPerFailure: BREEDING_ECONOMY_CONFIG.pairStreakBonusPerFailure,
    pairStreakBonusCap: BREEDING_ECONOMY_CONFIG.pairStreakBonusCap,
    initialStreak: 0,
    energyCost: preset.cost,
    energyCostWithoutAbilities: preset.costWithoutAbilities,
    heartCost: BREEDING_ECONOMY_CONFIG.playerHeartCost,
    creatureXpGain: preset.xp,
    creatureXpGainWithoutAbilities: preset.xpWithoutAbilities,
    breederXpGain: preset.breederXp,
    breederXpGainWithoutAbilities: preset.breederXpWithoutAbilities,
    giver: { name: "Breeder", kind: "player", maxEnergy: 500, maxHearts: 4, level: 1, xp: 0, xpToNext: getBreederXpToNext(1) },
    receiver: { name: "Representative Creature", kind: "creature", maxEnergy: preset.energy, maxHearts: preset.hearts, level: 1, xp: 0, xpToNext: getCreatureXpToNext(1) },
    pregnancyDays: BREEDING_ECONOMY_CONFIG.defaultPregnancyDays,
    eggDays: BREEDING_ECONOMY_CONFIG.defaultEggDays,
    startingGold: preset.gold,
    goldIncomePerDay: source === "new-ranch" ? 60 : source === "typical-ranch" ? 110 : source === "established-ranch" ? 180 : 260,
    fixedGoldSpendPerDay: 0,
    snackPolicy: "when-blocked",
    snackMaxPerDay: 4,
    energySnackRestore: BREEDING_ECONOMY_CONFIG.energySnackRestore,
    energySnackPrice: BREEDING_ECONOMY_CONFIG.energySnackPrice,
    tonicPolicy: "never",
    fertilityTonicBonus: BREEDING_ECONOMY_CONFIG.fertilityTonicBonus,
    fertilityTonicPrice: BREEDING_ECONOMY_CONFIG.fertilityTonicPrice,
  };
}

export function getBreedingBalancePreset(source: Exclude<BalanceScenarioSource, "current">): BreedingEconomyScenario {
  return makePreset(source);
}
