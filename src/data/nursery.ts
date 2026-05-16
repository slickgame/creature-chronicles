import {
  getSpeciesDefinition,
  getVariantDefinition,
  getVariantsForFamily,
} from "@/data/creatures";
import type { BreedingParticipant } from "@/types/breeding";
import type { CreatureAbility, CreatureRecord, CreatureStats } from "@/types/creature";
import type { CreatureId, EggId, HabitatId, PregnancyId, SaveId, SpeciesId, VariantId } from "@/types/ids";
import type { EggRecord, GameSave, InheritancePreview, ParentSnapshot, PregnancyRecord } from "@/types/save";

const FELINE_HABITAT_ID = "habitat_feline" as HabitatId;
const CANINE_HABITAT_ID = "habitat_canine" as HabitatId;

export const NURSERY_ASSETS = {
  egg: "/images/ui/icons/icon_egg.png",
  pregnancy: "/images/ui/icons/icon_pregnancy.png",
  timer: "/images/ui/icons/icon_timer_hourglass.png",
  hatch: "/images/ui/icons/icon_hatch.png",
  background: "/images/backgrounds/nursery/egg_nursery_interior.png",
} as const;

function deterministicRoll(seed: string, modulo = 100): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  }

  return Math.abs(hash) % modulo;
}

function getHabitatIdForSpecies(speciesId: SpeciesId): HabitatId {
  const species = getSpeciesDefinition(speciesId);
  return species.family === "feline" ? FELINE_HABITAT_ID : CANINE_HABITAT_ID;
}

function parentSnapshot(participant: BreedingParticipant): ParentSnapshot {
  return {
    participantId: participant.participantId,
    creatureId: participant.creatureId,
    displayName: participant.displayName,
    familyLabel: participant.familyLabel,
    kind: participant.kind,
  };
}

function averageStat(statKey: keyof CreatureStats, giver?: CreatureRecord, receiver?: CreatureRecord): number {
  const values = [giver?.stats[statKey], receiver?.stats[statKey]].filter(
    (value): value is number => typeof value === "number",
  );

  if (!values.length) {
    return 5;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildInheritedStats(seed: string, baseStats: CreatureStats, giver?: CreatureRecord, receiver?: CreatureRecord): { stats: CreatureStats; notes: string[] } {
  const notes: string[] = [];
  const statKeys = Object.keys(baseStats) as Array<keyof CreatureStats>;
  const stats = statKeys.reduce((nextStats, statKey, index) => {
    const inheritedAverage = averageStat(statKey, giver, receiver);
    const baseAnchor = Math.round((inheritedAverage + baseStats[statKey]) / 2);
    const roll = deterministicRoll(`${seed}_${statKey}_${index}`, 100);
    let variance = 0;

    if (roll <= 7) {
      variance = -2;
      notes.push(`${statKey} rolled unusually low.`);
    } else if (roll <= 24) {
      variance = -1;
    } else if (roll >= 93) {
      variance = 2;
      notes.push(`${statKey} rolled unusually high.`);
    } else if (roll >= 76) {
      variance = 1;
    }

    return {
      ...nextStats,
      [statKey]: Math.max(1, baseAnchor + variance),
    };
  }, {} as CreatureStats);

  if (!notes.length) {
    notes.push("Stats inherited normally from parent averages with minor RNG.");
  }

  return { stats, notes };
}

function pickVariant(seed: string, giver?: CreatureRecord, receiver?: CreatureRecord): VariantId {
  const receiverVariant = receiver ? getVariantDefinition(receiver.variantId) : null;
  const giverVariant = giver ? getVariantDefinition(giver.variantId) : null;
  const preferredFamily = receiverVariant?.family ?? giverVariant?.family ?? "feline";
  const variants = getVariantsForFamily(preferredFamily);
  const commonVariant = variants.find((variant) => variant.rarity === "Common") ?? variants[0];
  const rareVariants = variants.filter((variant) => variant.rarity !== "Common");
  const rareRoll = deterministicRoll(`${seed}_variant`, 100);

  if (rareRoll >= 90 && rareVariants.length) {
    return rareVariants[deterministicRoll(`${seed}_rare_variant`, rareVariants.length)].variantId;
  }

  if (receiverVariant && receiverVariant.rarity !== "Common" && rareRoll >= 82) {
    return receiverVariant.variantId;
  }

  if (giverVariant && giverVariant.rarity !== "Common" && rareRoll >= 86) {
    return giverVariant.variantId;
  }

  return commonVariant.variantId;
}

function buildInheritedAbilities(seed: string, speciesAbilities: CreatureAbility[], variantAbilities: CreatureAbility[], giver?: CreatureRecord, receiver?: CreatureRecord): { abilities: CreatureAbility[]; notes: string[] } {
  const notes: string[] = [];
  const inheritedPool = [...(giver?.abilities ?? []), ...(receiver?.abilities ?? [])];
  const chosen: CreatureAbility[] = [];
  const firstSpeciesAbility = speciesAbilities[0];
  const firstVariantAbility = variantAbilities[0];

  if (firstSpeciesAbility) chosen.push(firstSpeciesAbility);
  if (firstVariantAbility) chosen.push(firstVariantAbility);

  if (inheritedPool.length && deterministicRoll(`${seed}_ability_inherit`, 100) >= 70) {
    const inheritedAbility = inheritedPool[deterministicRoll(`${seed}_ability_pick`, inheritedPool.length)];

    if (!chosen.some((ability) => ability.id === inheritedAbility.id)) {
      chosen.push({ ...inheritedAbility, source: "future" });
      notes.push(`${inheritedAbility.name} was inherited from a parent.`);
    }
  }

  if (deterministicRoll(`${seed}_ability_mutation`, 100) >= 94) {
    const mutationPool = [...speciesAbilities, ...variantAbilities].filter(
      (ability) => !chosen.some((chosenAbility) => chosenAbility.id === ability.id),
    );

    if (mutationPool.length) {
      const mutatedAbility = mutationPool[deterministicRoll(`${seed}_ability_mutation_pick`, mutationPool.length)];
      chosen.push({ ...mutatedAbility, source: "future" });
      notes.push(`${mutatedAbility.name} appeared as a rare new ability roll.`);
    }
  }

  if (!notes.length) {
    notes.push("Abilities followed normal species and variant inheritance.");
  }

  return { abilities: chosen.slice(0, 3), notes };
}

export function createInheritancePreview(save: GameSave, giverParticipant: BreedingParticipant, receiverParticipant: BreedingParticipant, seed: string): InheritancePreview {
  const giverCreature = giverParticipant.creatureId
    ? (save.creatures ?? []).find((creature) => creature.creatureId === giverParticipant.creatureId)
    : undefined;
  const receiverCreature = receiverParticipant.creatureId
    ? (save.creatures ?? []).find((creature) => creature.creatureId === receiverParticipant.creatureId)
    : undefined;
  const projectedVariantId = pickVariant(seed, giverCreature, receiverCreature);
  const projectedVariant = getVariantDefinition(projectedVariantId);
  const projectedSpecies = getSpeciesDefinition(projectedVariant.speciesId);
  const variantAdjustedStats: CreatureStats = {
    STR: Math.max(1, projectedSpecies.baseStats.STR + (projectedVariant.statAdjustments.STR ?? 0)),
    DEX: Math.max(1, projectedSpecies.baseStats.DEX + (projectedVariant.statAdjustments.DEX ?? 0)),
    STA: Math.max(1, projectedSpecies.baseStats.STA + (projectedVariant.statAdjustments.STA ?? 0)),
    CHA: Math.max(1, projectedSpecies.baseStats.CHA + (projectedVariant.statAdjustments.CHA ?? 0)),
    WIL: Math.max(1, projectedSpecies.baseStats.WIL + (projectedVariant.statAdjustments.WIL ?? 0)),
    FER: Math.max(1, projectedSpecies.baseStats.FER + (projectedVariant.statAdjustments.FER ?? 0)),
  };
  const statResult = buildInheritedStats(seed, variantAdjustedStats, giverCreature, receiverCreature);
  const abilityResult = buildInheritedAbilities(
    seed,
    projectedSpecies.exclusiveAbilityPool,
    projectedVariant.exclusiveAbilityPool,
    giverCreature,
    receiverCreature,
  );

  return {
    projectedSpeciesId: projectedSpecies.speciesId,
    projectedVariantId: projectedVariant.variantId,
    projectedStats: statResult.stats,
    projectedAbilities: abilityResult.abilities,
    statRollNotes: statResult.notes,
    abilityRollNotes: abilityResult.notes,
  };
}

export function createPregnancyRecord(save: GameSave, giverParticipant: BreedingParticipant, receiverParticipant: BreedingParticipant, seed: string): PregnancyRecord {
  const inheritance = createInheritancePreview(save, giverParticipant, receiverParticipant, seed);
  const pregnancyId = `pregnancy_${save.dayState.dayNumber}_${Date.now()}` as PregnancyId;

  return {
    pregnancyId,
    createdAtDayNumber: save.dayState.dayNumber,
    createdAt: new Date().toISOString(),
    daysRemaining: 1,
    totalDays: 1,
    status: "pregnant",
    giver: parentSnapshot(giverParticipant),
    receiver: parentSnapshot(receiverParticipant),
    inheritance,
  };
}

function createEggFromPregnancy(save: GameSave, pregnancy: PregnancyRecord): EggRecord {
  const variant = getVariantDefinition(pregnancy.inheritance.projectedVariantId);
  const eggId = `egg_${save.dayState.dayNumber}_${Date.now()}_${pregnancy.pregnancyId}` as EggId;

  return {
    eggId,
    ownerSaveId: save.saveId,
    createdAtDayNumber: save.dayState.dayNumber,
    createdAt: new Date().toISOString(),
    daysRemaining: 2,
    totalDays: 2,
    status: "incubating",
    rarity: variant.rarity,
    speciesId: pregnancy.inheritance.projectedSpeciesId,
    variantId: pregnancy.inheritance.projectedVariantId,
    habitatId: getHabitatIdForSpecies(pregnancy.inheritance.projectedSpeciesId),
    parents: {
      giver: pregnancy.giver,
      receiver: pregnancy.receiver,
    },
    projectedStats: pregnancy.inheritance.projectedStats,
    projectedAbilities: pregnancy.inheritance.projectedAbilities,
    statRollNotes: pregnancy.inheritance.statRollNotes,
    abilityRollNotes: pregnancy.inheritance.abilityRollNotes,
  };
}

export function advanceNurseryDay(save: GameSave): { save: GameSave; summaryItems: string[] } {
  const summaryItems: string[] = [];
  const existingPregnancies = save.pregnancies ?? [];
  const existingEggs = save.eggs ?? [];
  const deliveredEggs: EggRecord[] = [];
  const nextPregnancies = existingPregnancies.map((pregnancy) => {
    if (pregnancy.status !== "pregnant") {
      return pregnancy;
    }

    const nextDaysRemaining = Math.max(0, pregnancy.daysRemaining - 1);

    if (nextDaysRemaining <= 0) {
      const egg = createEggFromPregnancy(save, pregnancy);
      deliveredEggs.push(egg);
      summaryItems.push(`${pregnancy.receiver.displayName} produced an egg.`);

      return {
        ...pregnancy,
        daysRemaining: 0,
        status: "delivered" as const,
      };
    }

    summaryItems.push(`${pregnancy.receiver.displayName}'s pregnancy timer advanced.`);
    return {
      ...pregnancy,
      daysRemaining: nextDaysRemaining,
    };
  });

  const nextEggs = [...deliveredEggs, ...existingEggs].map((egg) => {
    if (egg.status !== "incubating") {
      return egg;
    }

    const nextDaysRemaining = Math.max(0, egg.daysRemaining - 1);

    if (nextDaysRemaining <= 0) {
      summaryItems.push("An egg is ready to hatch in the nursery.");
      return {
        ...egg,
        daysRemaining: 0,
        status: "ready" as const,
      };
    }

    return {
      ...egg,
      daysRemaining: nextDaysRemaining,
    };
  });

  return {
    save: {
      ...save,
      pregnancies: nextPregnancies,
      eggs: nextEggs,
      eggIds: nextEggs.map((egg) => egg.eggId),
      flags: {
        ...save.flags,
        m5NurseryTimersAdvanced: true,
      },
    },
    summaryItems,
  };
}

function getNextCreatureId(save: GameSave): CreatureId {
  return `creature_hatched_${Date.now()}_${(save.creatures ?? []).length + 1}` as CreatureId;
}

export function hatchEgg(save: GameSave, eggId: EggId, nickname?: string): { save: GameSave; creature: CreatureRecord } | null {
  const egg = (save.eggs ?? []).find((item) => item.eggId === eggId);

  if (!egg || egg.status !== "ready") {
    return null;
  }

  const variant = getVariantDefinition(egg.variantId);
  const species = getSpeciesDefinition(egg.speciesId);
  const targetHabitat = (save.habitats ?? []).find((habitat) => habitat.habitatId === egg.habitatId);

  if (targetHabitat && targetHabitat.creatureIds.length >= targetHabitat.capacity) {
    return null;
  }

  const creatureId = getNextCreatureId(save);
  const creature: CreatureRecord = {
    creatureId,
    ownerSaveId: save.saveId,
    speciesId: species.speciesId,
    variantId: variant.variantId,
    habitatId: egg.habitatId,
    nickname: nickname?.trim() || `${variant.name} Hatchling`,
    level: 1,
    xp: 0,
    stats: egg.projectedStats,
    abilities: egg.projectedAbilities,
    energy: 100,
    maxEnergy: 100,
    hearts: 4,
    maxHearts: 4,
    affection: 35,
    generation: 2,
    shiny: false,
    cosmeticVariant: null,
    createdAt: new Date().toISOString(),
    notes: `Hatched from ${egg.parents.giver.displayName} and ${egg.parents.receiver.displayName}.`,
  };

  const nextEggs = (save.eggs ?? []).map((item) =>
    item.eggId === eggId
      ? {
          ...item,
          status: "hatched" as const,
        }
      : item,
  );

  return {
    creature,
    save: {
      ...save,
      creatures: [creature, ...(save.creatures ?? [])],
      creatureIds: [creature.creatureId, ...save.creatureIds],
      habitats: (save.habitats ?? []).map((habitat) =>
        habitat.habitatId === egg.habitatId
          ? {
              ...habitat,
              creatureIds: [creature.creatureId, ...habitat.creatureIds],
            }
          : habitat,
      ),
      eggs: nextEggs,
      eggIds: nextEggs.map((item) => item.eggId),
      flags: {
        ...save.flags,
        m5EggHatched: true,
      },
    },
  };
}

export function removeEgg(save: GameSave, eggId: EggId, mode: "release" | "donate"): GameSave {
  const nextEggs = (save.eggs ?? []).filter((egg) => egg.eggId !== eggId);

  return {
    ...save,
    eggs: nextEggs,
    eggIds: nextEggs.map((egg) => egg.eggId),
    currencies: mode === "donate"
      ? {
          ...save.currencies,
          gold: save.currencies.gold + 75,
          guildPoints: save.currencies.guildPoints + 1,
        }
      : save.currencies,
    flags: {
      ...save.flags,
      m5EggRemoved: mode,
    },
  };
}
