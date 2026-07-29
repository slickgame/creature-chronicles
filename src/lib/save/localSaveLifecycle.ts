import * as core from "./localSave";
import { normalizeBreedingRecords } from "@/data/breedingRecordsMigration";
import { normalizeCreatureManagementMetadata } from "@/data/creatureManagement";
import { normalizeTrackedCreatureGenerations } from "@/data/generationMigration";
import { normalizeRanchDaySave } from "@/data/ranch-day/ranchDayState";
import type { RanchDayPhase } from "@/types/ranchDay";
import type { GameSave } from "@/types/save";

export * from "./localSave";

function normalizeSave(save: GameSave, missingPhase: RanchDayPhase = "active"): GameSave {
  return normalizeRanchDaySave(
    normalizeBreedingRecords(
      normalizeCreatureManagementMetadata(
        normalizeTrackedCreatureGenerations(save),
      ),
    ),
    missingPhase,
  );
}

export function createNewGameSave(
  playerName: string,
  slotIndex: number,
): GameSave {
  return normalizeSave(core.createNewGameSave(playerName, slotIndex), "morning");
}

export function saveGameToSlot(save: GameSave): GameSave {
  return core.saveGameToSlot(normalizeSave(save, save.ranchDay?.phase ?? "active"));
}

export function loadSaveFromSlot(slotIndex: number): GameSave | null {
  const save = core.loadSaveFromSlot(slotIndex);
  return save ? normalizeSave(save, save.ranchDay?.phase ?? "active") : null;
}

export function loadAllSaves(): Array<GameSave | null> {
  return core.loadAllSaves().map((save) => (save ? normalizeSave(save, save.ranchDay?.phase ?? "active") : null));
}
