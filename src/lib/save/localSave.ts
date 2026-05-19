import { MVP_VERSION, STARTING_PLAYER_STATE } from "@/data/gameConstants";
import { createDefaultBreedingState } from "@/data/breeding";
import { createDefaultGuildState, ensureCurrentGuildState } from "@/data/guild";
import { createDefaultMarketState, ensureCurrentMarketState } from "@/data/market";
import {
  createStarterCreatures,
  createStarterHabitats,
  getSpeciesDefinition,
  getVariantDefinition,
  normalizeVariantId,
} from "@/data/creatures";
import { formatGameDate } from "@/lib/formatters";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId, SaveId, VariantId } from "@/types/ids";
import type { GameSave, SaveSlotSummary, SettingsState } from "@/types/save";

const SAVE_PREFIX = "creature_chronicles_save_slot_";
const ACTIVE_SAVE_KEY = "creature_chronicles_active_save_id";
export const SAVE_SLOT_COUNT = 3;

function getSlotKey(slotIndex: number): string {
  return `${SAVE_PREFIX}${slotIndex}`;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function createDefaultSettings(): SettingsState {
  return {
    musicVolume: 70,
    sfxVolume: 80,
    textSpeed: "normal",
    devMode: true,
  };
}

function ensureCreatureHearts(creature: CreatureRecord): CreatureRecord {
  return {
    ...creature,
    hearts: creature.hearts ?? 4,
    maxHearts: creature.maxHearts ?? 4,
  };
}

function createCreatureFromStarterTemplate(ownerSaveId: SaveId, starter: CreatureRecord): CreatureRecord {
  const variant = getVariantDefinition(starter.variantId);
  const species = getSpeciesDefinition(variant.speciesId);

  return ensureCreatureHearts({
    ...starter,
    ownerSaveId,
    speciesId: species.speciesId,
    variantId: variant.variantId,
    stats: {
      STR: Math.max(1, species.baseStats.STR + (variant.statAdjustments.STR ?? 0)),
      DEX: Math.max(1, species.baseStats.DEX + (variant.statAdjustments.DEX ?? 0)),
      STA: Math.max(1, species.baseStats.STA + (variant.statAdjustments.STA ?? 0)),
      CHA: Math.max(1, species.baseStats.CHA + (variant.statAdjustments.CHA ?? 0)),
      WIL: Math.max(1, species.baseStats.WIL + (variant.statAdjustments.WIL ?? 0)),
      FER: Math.max(1, species.baseStats.FER + (variant.statAdjustments.FER ?? 0)),
    },
    abilities: [species.exclusiveAbilityPool[0], variant.exclusiveAbilityPool[0]].filter(Boolean),
  });
}

function migrateCreatureRecord(creature: CreatureRecord, ownerSaveId: SaveId): CreatureRecord {
  if (creature.creatureId === ("creature_starter_sphinx" as CreatureId)) {
    const starter = createStarterCreatures(ownerSaveId).find(
      (item) => item.creatureId === ("creature_starter_feline" as CreatureId),
    );

    return starter ? createCreatureFromStarterTemplate(ownerSaveId, starter) : ensureCreatureHearts(creature);
  }

  if (creature.creatureId === ("creature_starter_hellhound" as CreatureId)) {
    const starter = createStarterCreatures(ownerSaveId).find(
      (item) => item.creatureId === ("creature_starter_canine" as CreatureId),
    );

    return starter ? createCreatureFromStarterTemplate(ownerSaveId, starter) : ensureCreatureHearts(creature);
  }

  const normalizedVariantId = normalizeVariantId(creature.variantId as VariantId);
  const variant = getVariantDefinition(normalizedVariantId);
  const species = getSpeciesDefinition(variant.speciesId);

  return ensureCreatureHearts({
    ...creature,
    ownerSaveId,
    speciesId: species.speciesId,
    variantId: normalizedVariantId,
  });
}

function migrateSaveForCurrentBuild(save: GameSave): GameSave {
  const starterCreatures = createStarterCreatures(save.saveId);
  const starterHabitats = createStarterHabitats();
  const sourceCreatures = save.creatures ?? starterCreatures;
  const migratedCreatures = sourceCreatures.map((creature) =>
    migrateCreatureRecord(creature, save.saveId),
  );
  const creatureIds = migratedCreatures.map((creature) => creature.creatureId);
  const habitats = (save.habitats ?? starterHabitats).map((habitat) => {
    if (habitat.family === "feline") {
      return {
        ...habitat,
        creatureIds: creatureIds.filter((creatureId) => {
          const creature = migratedCreatures.find((item) => item.creatureId === creatureId);
          return creature ? getVariantDefinition(creature.variantId).family === "feline" : false;
        }),
      };
    }

    if (habitat.family === "canine") {
      return {
        ...habitat,
        creatureIds: creatureIds.filter((creatureId) => {
          const creature = migratedCreatures.find((item) => item.creatureId === creatureId);
          return creature ? getVariantDefinition(creature.variantId).family === "canine" : false;
        }),
      };
    }

    return habitat;
  });
  const eggs = save.eggs ?? [];

  const migratedSave: GameSave = {
    ...save,
    version: MVP_VERSION,
    player: {
      ...save.player,
      hearts: save.player.hearts ?? 4,
      maxHearts: save.player.maxHearts ?? 4,
    },
    creatureIds,
    eggIds: eggs.map((egg) => egg.eggId),
    habitatIds: habitats.map((habitat) => habitat.habitatId),
    creatures: migratedCreatures,
    habitats,
    breeding: save.breeding ?? createDefaultBreedingState(),
    pregnancies: save.pregnancies ?? [],
    eggs,
    market: save.market,
    guild: save.guild,
    flags: {
      ...save.flags,
      m3StarterCreaturesCreated: true,
      m3BaseStartersMigrated: true,
      m4BreedingStateCreated: true,
      m4ParticipantHeartsMigrated: true,
      m5NurseryStateCreated: true,
      m6MarketStateCreated: true,
      m7GuildStateCreated: true,
      felineHabitatUnlocked: true,
      canineHabitatUnlocked: true,
      breedingUnlocked: true,
      nurseryUnlocked: true,
      townUnlocked: true,
      marketUnlocked: true,
      guildUnlocked: true,
    },
  };

  return ensureCurrentGuildState(ensureCurrentMarketState(migratedSave));
}

export function createNewGameSave(playerName: string, slotIndex: number): GameSave {
  const now = new Date().toISOString();
  const cleanName = playerName.trim() || "New Breeder";
  const saveId = `save_${slotIndex}_${Date.now()}`;
  const creatures = createStarterCreatures(saveId);
  const habitats = createStarterHabitats();
  const baseSave: GameSave = {
    version: MVP_VERSION,
    saveId,
    slotIndex,
    createdAt: now,
    updatedAt: now,
    player: {
      playerId: `player_${Date.now()}`,
      name: cleanName,
      ranchName: `${cleanName}'s Ranch`,
      breederRank: 1,
      ranchRank: 1,
      hearts: 4,
      maxHearts: 4,
    },
    currencies: {
      gold: STARTING_PLAYER_STATE.gold,
      guildPoints: STARTING_PLAYER_STATE.guildPoints,
      energy: STARTING_PLAYER_STATE.energy,
      maxEnergy: STARTING_PLAYER_STATE.maxEnergy,
    },
    dayState: {
      dayNumber: STARTING_PLAYER_STATE.dayNumber,
      weekday: STARTING_PLAYER_STATE.weekday,
      month: STARTING_PLAYER_STATE.month,
      dayOfMonth: STARTING_PLAYER_STATE.dayOfMonth,
      weekNumber: STARTING_PLAYER_STATE.weekNumber,
    },
    settings: createDefaultSettings(),
    creatureIds: creatures.map((creature) => creature.creatureId),
    eggIds: [],
    habitatIds: habitats.map((habitat) => habitat.habitatId),
    creatures,
    habitats,
    breeding: createDefaultBreedingState(),
    pregnancies: [],
    eggs: [],
    flags: {
      m1SaveCreated: true,
      m3StarterCreaturesCreated: true,
      m3BaseStartersMigrated: true,
      m4BreedingStateCreated: true,
      m4ParticipantHeartsMigrated: true,
      m5NurseryStateCreated: true,
      m6MarketStateCreated: true,
      m7GuildStateCreated: true,
      ranchUnlocked: true,
      townUnlocked: true,
      felineHabitatUnlocked: true,
      canineHabitatUnlocked: true,
      breedingUnlocked: true,
      nurseryUnlocked: true,
      marketUnlocked: true,
      guildUnlocked: true,
    },
  };

  return {
    ...baseSave,
    market: createDefaultMarketState(baseSave),
    guild: createDefaultGuildState(baseSave),
  };
}

export function saveGameToSlot(save: GameSave): GameSave {
  if (!canUseStorage()) {
    return save;
  }

  const updatedSave: GameSave = {
    ...save,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(getSlotKey(save.slotIndex), JSON.stringify(updatedSave));
  window.localStorage.setItem(ACTIVE_SAVE_KEY, updatedSave.saveId);

  return updatedSave;
}

export function loadSaveFromSlot(slotIndex: number): GameSave | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(getSlotKey(slotIndex));

  if (!raw) {
    return null;
  }

  try {
    const parsedSave = JSON.parse(raw) as GameSave;
    const migratedSave = migrateSaveForCurrentBuild(parsedSave);

    if (JSON.stringify(migratedSave) !== JSON.stringify(parsedSave)) {
      window.localStorage.setItem(getSlotKey(slotIndex), JSON.stringify(migratedSave));
    }

    return migratedSave;
  } catch {
    return null;
  }
}

export function loadAllSaves(): Array<GameSave | null> {
  return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => loadSaveFromSlot(index));
}

export function deleteSaveSlot(slotIndex: number): void {
  if (!canUseStorage()) {
    return;
  }

  const existing = loadSaveFromSlot(slotIndex);
  window.localStorage.removeItem(getSlotKey(slotIndex));

  if (existing) {
    const activeSaveId = window.localStorage.getItem(ACTIVE_SAVE_KEY);

    if (activeSaveId === existing.saveId) {
      window.localStorage.removeItem(ACTIVE_SAVE_KEY);
    }
  }
}

export function getActiveSaveId(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_SAVE_KEY);
}

export function setActiveSaveId(saveId: string): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(ACTIVE_SAVE_KEY, saveId);
}

export function summarizeSave(save: GameSave): SaveSlotSummary {
  return {
    saveId: save.saveId,
    slotIndex: save.slotIndex,
    playerName: save.player.name,
    ranchName: save.player.ranchName,
    dayNumber: save.dayState.dayNumber,
    dateLabel: formatGameDate(
      save.dayState.weekday,
      save.dayState.month,
      save.dayState.dayOfMonth,
    ),
    gold: save.currencies.gold,
    guildPoints: save.currencies.guildPoints,
    energy: save.currencies.energy,
    maxEnergy: save.currencies.maxEnergy,
    creatureCount: save.creatureIds.length,
    eggCount: save.eggIds.length,
    updatedAt: save.updatedAt,
  };
}

export function findFirstEmptySlot(): number | null {
  const saves = loadAllSaves();
  const index = saves.findIndex((save) => save === null);

  return index >= 0 ? index : null;
}
