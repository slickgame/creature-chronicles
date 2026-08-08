import * as core from "./localSaveCore";
import { normalizeBattleMoveInheritanceSave } from "@/data/battleMoveInheritanceMigration";
import { normalizeBreedingRecords } from "@/data/breedingRecordsMigration";
import { normalizeCreatureBattleMoveLoadoutRecord } from "@/data/battleLoadouts";
import { normalizeChapterOneTutorialLifecycle } from "@/data/chapterOneGuidedTutorial";
import { normalizeCreatureCareerSave } from "@/data/creatureCareerRecords";
import { normalizeCreatureChoreSkills } from "@/data/choreSkills";
import { normalizeCreatureLegacySave } from "@/data/creatureRetirement";
import { normalizeCreatureManagementMetadata } from "@/data/creatureManagement";
import { normalizeCreatureMemorySave } from "@/data/creatureMemories";
import { normalizeCreaturePersonalitySave } from "@/data/creaturePersonalities";
import { normalizeCreatureRelationshipSave } from "@/data/creatureRelationships";
import { normalizeTrackedCreatureGenerations } from "@/data/generationMigration";
import { normalizeRanchDaySave } from "@/data/ranch-day/ranchDayState";
import {
  getPortableSaveFilename,
  inspectPortableSave,
  preparePortableSaveForSlot,
  serializePortableSave,
  type PortableSaveInspection,
} from "./portableSave";
import type { RanchDayPhase } from "@/types/ranchDay";
import type { GameSave } from "@/types/save";

export * from "./localSaveCore";
export {
  getPortableSaveFilename,
  inspectPortableSave,
  serializePortableSave,
  PORTABLE_SAVE_FILE_EXTENSION,
  PORTABLE_SAVE_FORMAT,
  PORTABLE_SAVE_FORMAT_VERSION,
} from "./portableSave";

export type PortableSaveImportResult = {
  ok: boolean;
  message: string;
  save: GameSave | null;
  inspection: PortableSaveInspection;
};

function normalizeCreatureCapabilityRecords(save: GameSave): GameSave {
  const creatures = (save.creatures ?? []).map((creature) =>
    normalizeCreatureBattleMoveLoadoutRecord({
      ...creature,
      choreSkills: normalizeCreatureChoreSkills(creature),
    }),
  );
  return {
    ...save,
    creatures,
    creatureIds: creatures.map((creature) => creature.creatureId),
    flags: {
      ...save.flags,
      m15RanchGuaranteedWear:
        save.flags.m15RanchGuaranteedWear === true ||
        save.flags.m15GuaranteedWear === true,
      m61ChoreSkills: true,
      m61SpeciesChoreBaselines: true,
      m61UniversalChoreAccess: true,
      m62BattleMoveFoundation: true,
      m62PersistentMoveLoadouts: true,
      m65BattleMoveInheritance: true,
    },
  };
}

export function normalizeGameSave(
  save: GameSave,
  missingPhase: RanchDayPhase = "active",
): GameSave {
  return normalizeChapterOneTutorialLifecycle(
    normalizeCreatureLegacySave(
      normalizeCreatureRelationshipSave(
        normalizeCreaturePersonalitySave(
          normalizeCreatureCareerSave(
            normalizeCreatureMemorySave(
              normalizeRanchDaySave(
                normalizeBattleMoveInheritanceSave(
                  normalizeCreatureCapabilityRecords(
                    normalizeBreedingRecords(
                      normalizeCreatureManagementMetadata(
                        normalizeTrackedCreatureGenerations(save),
                      ),
                    ),
                  ),
                ),
                missingPhase,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

export function createNewGameSave(
  playerName: string,
  slotIndex: number,
): GameSave {
  return normalizeGameSave(core.createNewGameSave(playerName, slotIndex), "morning");
}

export function saveGameToSlot(save: GameSave): GameSave {
  return core.saveGameToSlot(normalizeGameSave(save, save.ranchDay?.phase ?? "active"));
}

export function loadSaveFromSlot(slotIndex: number): GameSave | null {
  const save = core.loadSaveFromSlot(slotIndex);
  return save ? normalizeGameSave(save, save.ranchDay?.phase ?? "active") : null;
}

export function loadAllSaves(): Array<GameSave | null> {
  return core.loadAllSaves().map((save) =>
    save ? normalizeGameSave(save, save.ranchDay?.phase ?? "active") : null,
  );
}

export function exportPortableSave(save: GameSave): string {
  return serializePortableSave(normalizeGameSave(save, save.ranchDay?.phase ?? "active"));
}

export function importPortableSaveToSlot(rawText: string, targetSlotIndex: number): PortableSaveImportResult {
  const prepared = preparePortableSaveForSlot(rawText, targetSlotIndex);
  if (!prepared.save) {
    return {
      ok: false,
      message: prepared.inspection.message,
      save: null,
      inspection: prepared.inspection,
    };
  }

  const normalized = normalizeGameSave(prepared.save, prepared.save.ranchDay?.phase ?? "active");
  const saved = core.saveGameToSlot(normalized);
  return {
    ok: true,
    message: `Imported ${saved.player.name}'s Ranch Day ${saved.dayState.dayNumber} save into File ${targetSlotIndex + 1}.`,
    save: saved,
    inspection: prepared.inspection,
  };
}