import * as core from "./localSave";
import { normalizeBreedingRecords } from "@/data/breedingRecordsMigration";
import { normalizeCreatureChoreSkills } from "@/data/choreSkills";
import { normalizeCreatureManagementMetadata } from "@/data/creatureManagement";
import { normalizeTrackedCreatureGenerations } from "@/data/generationMigration";
import { normalizeRanchDaySave } from "@/data/ranch-day/ranchDayState";
import type { RanchDayPhase } from "@/types/ranchDay";
import type { GameSave } from "@/types/save";

export * from "./localSave";

function normalizeChoreSkillRecords(save: GameSave): GameSave {
  return {
    ...save,
    creatures: (save.creatures ?? []).map((creature) => ({
      ...creature,
      choreSkills: normalizeCreatureChoreSkills(creature),
    })),
    flags: {
      ...save.flags,
      m15RanchGuaranteedWear:
        save.flags.m15RanchGuaranteedWear === true ||
        save.flags.m15GuaranteedWear === true,
      m61ChoreSkills: true,
      m61SpeciesChoreBaselines: true,
      m61UniversalChoreAccess: true,
    },
  };
}

function normalizeSave(save: GameSave, missingPhase: RanchDayPhase = "active"): GameSave {
  return normalizeRanchDaySave(
    normalizeChoreSkillRecords(
      normalizeBreedingRecords(
        normalizeCreatureManagementMetadata(
          normalizeTrackedCreatureGenerations(save),
        ),
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
  return core.loadAllSaves().map((save) =>
    save ? normalizeSave(save, save.ranchDay?.phase ?? "active") : null,
  );
}