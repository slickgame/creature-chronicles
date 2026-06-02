import {
  buildStats,
  getBaseMaxHearts,
  getCreatureMaxEnergyFromStats,
  getSpeciesDefinition,
  getVariantDefinition,
  rollCreatureAbilities,
  rollStatGrades,
} from "@/data/creatures";
import { createDefaultGuildState, ensureCurrentGuildState } from "@/data/guild";
import { createDefaultMarketState, ensureCurrentMarketState } from "@/data/market";
import { getNurseryCapacity } from "@/data/ranchUpgrades";
import { DEFAULT_RANCH_UPGRADES, applyRanchUpgradeEffectsToHabitats } from "@/data/ranchUpgrades";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId, EggId, HabitatId, VariantId } from "@/types/ids";
import type { EggRecord, GameSave, ParentSnapshot } from "@/types/save";

export type DevActionResult = { save: GameSave; ok: boolean; message: string };

const DEV_PARENT: ParentSnapshot = {
  participantId: "dev_ledger",
  displayName: "Dev Ledger",
  familyLabel: "Debug Source",
  kind: "player",
};

function getCreatureXpToNext(level: number): number {
  return 45 + level * 30;
}

function getHabitatForVariant(save: GameSave, variantId: VariantId) {
  const variant = getVariantDefinition(variantId);
  return (save.habitats ?? []).find((habitat) => habitat.family === variant.family) ?? null;
}

export function grantDevResources(save: GameSave, resources: Partial<{ gold: number; guildPoints: number; energy: number }>): DevActionResult {
  const gold = resources.gold ?? 0;
  const guildPoints = resources.guildPoints ?? 0;
  const energy = resources.energy ?? 0;
  return {
    save: {
      ...save,
      updatedAt: new Date().toISOString(),
      currencies: {
        ...save.currencies,
        gold: Math.max(0, save.currencies.gold + gold),
        guildPoints: Math.max(0, save.currencies.guildPoints + guildPoints),
        energy: Math.max(0, Math.min(save.currencies.maxEnergy, save.currencies.energy + energy)),
      },
      flags: { ...save.flags, m12DevResourcesUsed: true },
    },
    ok: true,
    message: `Dev resources applied: ${gold >= 0 ? "+" : ""}${gold} Gold, ${guildPoints >= 0 ? "+" : ""}${guildPoints} GP, ${energy >= 0 ? "+" : ""}${energy} Energy.`,
  };
}

export function createDevCreature(save: GameSave, variantId: VariantId): DevActionResult {
  const variant = getVariantDefinition(variantId);
  const species = getSpeciesDefinition(variant.speciesId);
  const habitat = getHabitatForVariant(save, variantId);
  if (!habitat) return { save, ok: false, message: "No matching habitat exists for that variant." };
  if (habitat.creatureIds.length >= habitat.capacity) return { save, ok: false, message: `${habitat.name} is full. Upgrade capacity or remove a creature first.` };

  const now = new Date().toISOString();
  const creatureId = `creature_dev_${Date.now()}_${variant.variantId}` as CreatureId;
  const level = 1;
  const seed = `${save.saveId}_${creatureId}_dev`;
  const statGrades = rollStatGrades(seed, variant.rarity);
  const stats = buildStats(species.baseStats, variant.statAdjustments, statGrades);
  const maxEnergy = getCreatureMaxEnergyFromStats(stats, variant.variantId);
  const maxHearts = getBaseMaxHearts(species.speciesId, variant.variantId);
  const creature: CreatureRecord = {
    creatureId,
    ownerSaveId: save.saveId,
    speciesId: species.speciesId,
    variantId: variant.variantId,
    habitatId: habitat.habitatId,
    nickname: `Test ${variant.name}`,
    level,
    xp: 0,
    xpToNext: getCreatureXpToNext(level),
    stats,
    statGrades,
    abilities: rollCreatureAbilities(seed, species.speciesId, variant.variantId, true),
    energy: maxEnergy,
    maxEnergy,
    hearts: maxHearts,
    maxHearts,
    affection: 50,
    generation: 1,
    shiny: false,
    cosmeticVariant: null,
    origin: "unknown",
    originLabel: "Dev Tool",
    isLocked: false,
    createdAt: now,
    notes: "Generated from the M12 Dev Tools panel.",
  };

  return {
    save: {
      ...save,
      updatedAt: now,
      creatureIds: [...save.creatureIds, creature.creatureId],
      creatures: [...(save.creatures ?? []), creature],
      habitats: (save.habitats ?? []).map((item) => item.habitatId === habitat.habitatId ? { ...item, creatureIds: [...item.creatureIds, creature.creatureId] } : item),
      flags: { ...save.flags, m12DevCreatureAdded: true },
    },
    ok: true,
    message: `${creature.nickname} added to ${habitat.name}.`,
  };
}

export function createDevEgg(save: GameSave, variantId: VariantId, ready = true): DevActionResult {
  const activeEggs = (save.eggs ?? []).filter((egg) => egg.status !== "hatched").length;
  const capacity = getNurseryCapacity(save);
  if (activeEggs >= capacity) return { save, ok: false, message: `Nursery is full (${activeEggs}/${capacity}). Upgrade egg slots or remove an egg first.` };

  const variant = getVariantDefinition(variantId);
  const species = getSpeciesDefinition(variant.speciesId);
  const habitat = getHabitatForVariant(save, variantId);
  const now = new Date().toISOString();
  const eggId = `egg_dev_${Date.now()}_${variant.variantId}` as EggId;
  const seed = `${save.saveId}_${eggId}_dev`;
  const projectedStatGrades = rollStatGrades(seed, variant.rarity);
  const projectedStats = buildStats(species.baseStats, variant.statAdjustments, projectedStatGrades);
  const projectedAbilities = rollCreatureAbilities(seed, species.speciesId, variant.variantId, true);

  const egg: EggRecord = {
    eggId,
    ownerSaveId: save.saveId,
    createdAtDayNumber: save.dayState.dayNumber,
    createdAt: now,
    daysRemaining: ready ? 0 : 2,
    totalDays: 2,
    status: ready ? "ready" : "incubating",
    rarity: variant.rarity,
    speciesId: species.speciesId,
    variantId: variant.variantId,
    habitatId: (habitat?.habitatId ?? `habitat_${variant.family}`) as HabitatId,
    parents: { giver: DEV_PARENT, receiver: DEV_PARENT },
    projectedStats,
    projectedStatGrades,
    projectedAbilities,
    statRollNotes: [`Dev egg generated as ${ready ? "ready to hatch" : "incubating"}.`],
    abilityRollNotes: ["Abilities generated from species, variant, and general pools for testing."],
  };

  return {
    save: {
      ...save,
      updatedAt: now,
      eggIds: [...save.eggIds, egg.eggId],
      eggs: [egg, ...(save.eggs ?? [])],
      flags: { ...save.flags, m12DevEggAdded: true },
    },
    ok: true,
    message: `${variant.name} test egg added to Nursery (${ready ? "ready" : "incubating"}).`,
  };
}

export function resetDevMarket(save: GameSave): DevActionResult {
  const nextSave = ensureCurrentMarketState({ ...save, market: createDefaultMarketState(save), flags: { ...save.flags, m12MarketReset: true } });
  return { save: { ...nextSave, updatedAt: new Date().toISOString() }, ok: true, message: "Weekly market reset with current upgrade effects." };
}

export function resetDevGuild(save: GameSave): DevActionResult {
  const nextSave = ensureCurrentGuildState({ ...save, guild: createDefaultGuildState(save), flags: { ...save.flags, m12GuildReset: true } });
  return { save: { ...nextSave, updatedAt: new Date().toISOString() }, ok: true, message: "Guild contracts reset with current upgrade effects." };
}

export function resetDevRanchUpgrades(save: GameSave): DevActionResult {
  const resetSave = applyRanchUpgradeEffectsToHabitats({
    ...save,
    updatedAt: new Date().toISOString(),
    ranchUpgrades: { ...DEFAULT_RANCH_UPGRADES },
    flags: { ...save.flags, m12RanchUpgradesReset: true },
  });
  return { save: resetSave, ok: true, message: "Ranch upgrades reset and base capacities reapplied." };
}
