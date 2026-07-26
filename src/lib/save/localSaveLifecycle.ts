import * as core from "./localSave";
import { normalizeCreatureManagementMetadata } from "@/data/creatureManagement";
import { normalizeTrackedCreatureGenerations } from "@/data/generationMigration";
import type { GameSave } from "@/types/save";

export * from "./localSave";

function normalizeSave(save: GameSave): GameSave {
  return normalizeCreatureManagementMetadata(
    normalizeTrackedCreatureGenerations(save),
  );
}

export function createNewGameSave(
  playerName: string,
  slotIndex: number,
): GameSave {
  return normalizeSave(core.createNewGameSave(playerName, slotIndex));
}

export function saveGameToSlot(save: GameSave): GameSave {
  return core.saveGameToSlot(normalizeSave(save));
}

export function loadSaveFromSlot(slotIndex: number): GameSave | null {
  const save = core.loadSaveFromSlot(slotIndex);
  return save ? normalizeSave(save) : null;
}

export function loadAllSaves(): Array<GameSave | null> {
  return core.loadAllSaves().map((save) => (save ? normalizeSave(save) : null));
}
