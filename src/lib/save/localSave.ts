import { MVP_VERSION, STARTING_PLAYER_STATE } from "@/data/gameConstants";
import { createStarterCreatures, createStarterHabitats } from "@/data/creatures";
import { formatGameDate } from "@/lib/formatters";
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

export function createNewGameSave(playerName: string, slotIndex: number): GameSave {
  const now = new Date().toISOString();
  const cleanName = playerName.trim() || "New Breeder";
  const saveId = `save_${slotIndex}_${Date.now()}`;
  const creatures = createStarterCreatures(saveId);
  const habitats = createStarterHabitats();

  return {
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
    flags: {
      m1SaveCreated: true,
      m3StarterCreaturesCreated: true,
      ranchUnlocked: true,
      felineHabitatUnlocked: true,
      canineHabitatUnlocked: true,
      breedingUnlocked: false,
      marketUnlocked: false,
      guildUnlocked: false,
    },
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

    if (!parsedSave.creatures || !parsedSave.habitats) {
      const creatures = createStarterCreatures(parsedSave.saveId);
      const habitats = createStarterHabitats();

      return {
        ...parsedSave,
        creatureIds: parsedSave.creatureIds.length > 0 ? parsedSave.creatureIds : creatures.map((creature) => creature.creatureId),
        habitatIds: parsedSave.habitatIds.length > 0 ? parsedSave.habitatIds : habitats.map((habitat) => habitat.habitatId),
        creatures: parsedSave.creatures ?? creatures,
        habitats: parsedSave.habitats ?? habitats,
        flags: {
          ...parsedSave.flags,
          m3StarterCreaturesCreated: true,
          felineHabitatUnlocked: true,
          canineHabitatUnlocked: true,
        },
      };
    }

    return parsedSave;
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