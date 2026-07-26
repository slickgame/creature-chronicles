import * as core from "./localSave";
import { normalizeTrackedCreatureGenerations } from "@/data/generationMigration";
import type { GameSave } from "@/types/save";

export * from "./localSave";

export function createNewGameSave(
  playerName: string,
  slotIndex: number,
): GameSave {
  return normalizeTrackedCreatureGenerations(
    core.createNewGameSave(playerName, slotIndex),
  );
}

export function saveGameToSlot(save: GameSave): GameSave {
  return core.saveGameToSlot(normalizeTrackedCreatureGenerations(save));
}

export function loadSaveFromSlot(slotIndex: number): GameSave | null {
  const save = core.loadSaveFromSlot(slotIndex);
  return save ? normalizeTrackedCreatureGenerations(save) : null;
}

export function loadAllSaves(): Array<GameSave | null> {
  return core
    .loadAllSaves()
    .map((save) => (save ? normalizeTrackedCreatureGenerations(save) : null));
}
