import * as core from "./saveReliability";
import { normalizeRanchDaySave } from "@/data/ranch-day/ranchDayState";
import type { GameSave } from "@/types/save";

export * from "./saveReliability";

export const CURRENT_SAVE_SCHEMA_VERSION = 4;
export type SaveTransactionKind = core.SaveTransactionKind | "day-end";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function schemaVersion(value: unknown): number {
  if (!isRecord(value)) return 0;
  const parsed = Number(value.schemaVersion ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function checksum(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function migrateUnknownSave(raw: unknown, slotIndex: number): core.SaveMigrationResult {
  const sourceSchemaVersion = schemaVersion(raw);
  if (sourceSchemaVersion > CURRENT_SAVE_SCHEMA_VERSION) {
    return {
      save: null,
      changed: false,
      sourceSchemaVersion,
      issues: [`Save schema ${sourceSchemaVersion} is newer than supported schema ${CURRENT_SAVE_SCHEMA_VERSION}.`],
    };
  }

  const legacyCompatible = sourceSchemaVersion === CURRENT_SAVE_SCHEMA_VERSION && isRecord(raw)
    ? { ...raw, schemaVersion: core.CURRENT_SAVE_SCHEMA_VERSION }
    : raw;
  const result = core.migrateUnknownSave(legacyCompatible, slotIndex);
  if (!result.save) return { ...result, sourceSchemaVersion };
  const save = normalizeRanchDaySave({
    ...result.save,
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    flags: {
      ...result.save.flags,
      saveSchemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      m60RanchDaySchema: true,
    },
  }, "active");
  return {
    save,
    changed: result.changed || sourceSchemaVersion !== CURRENT_SAVE_SCHEMA_VERSION || !isRecord(raw) || !isRecord(raw.ranchDay),
    sourceSchemaVersion,
    issues: result.issues,
  };
}

export function repairLoadedSave(input: GameSave, slotIndex: number): core.SaveRepairResult {
  const legacyInput = { ...input, schemaVersion: core.CURRENT_SAVE_SCHEMA_VERSION };
  const result = core.repairLoadedSave(legacyInput, slotIndex);
  const save = normalizeRanchDaySave({
    ...result.save,
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    flags: {
      ...result.save.flags,
      saveSchemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      m60RanchDaySchema: true,
    },
  }, input.ranchDay ? input.ranchDay.phase : "active");
  return {
    ...result,
    save,
    changed: result.changed || input.schemaVersion !== CURRENT_SAVE_SCHEMA_VERSION || !input.ranchDay,
  };
}

export function beginSaveTransaction(save: GameSave, kind: SaveTransactionKind, dedupeKey: string): core.SaveTransactionJournal {
  return core.beginSaveTransaction(save, kind as core.SaveTransactionKind, dedupeKey);
}

export function exportSavePackage(save: GameSave): string {
  const payload = normalizeRanchDaySave({ ...save, schemaVersion: CURRENT_SAVE_SCHEMA_VERSION });
  const payloadText = JSON.stringify(payload);
  return JSON.stringify({
    format: "creature-chronicles-save-package",
    packageVersion: 1,
    exportedAt: new Date().toISOString(),
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    checksum: checksum(payloadText),
    save: payload,
  }, null, 2);
}

export function inspectSaveImport(text: string, targetSlotIndex: number): core.SaveImportReport {
  try {
    const parsed = JSON.parse(text) as unknown;
    const envelope = isRecord(parsed) && parsed.format === "creature-chronicles-save-package" ? parsed : null;
    const packageFormat: core.SaveImportReport["packageFormat"] = envelope ? "package" : isRecord(parsed) ? "legacy-json" : "unknown";
    const rawSave = envelope ? envelope.save : parsed;
    const issues: string[] = [];

    if (envelope && typeof envelope.checksum === "string") {
      const payloadText = JSON.stringify(rawSave);
      if (envelope.checksum !== checksum(payloadText)) {
        return { ok: false, save: null, issues: ["Import checksum does not match; the file may be incomplete or edited."], sourceSchemaVersion: schemaVersion(rawSave), packageFormat };
      }
    }

    const migration = migrateUnknownSave(rawSave, targetSlotIndex);
    issues.push(...migration.issues);
    if (!migration.save) return { ok: false, save: null, issues, sourceSchemaVersion: migration.sourceSchemaVersion, packageFormat };
    const repaired = repairLoadedSave(migration.save, targetSlotIndex);
    issues.push(...repaired.issues);
    return {
      ok: true,
      save: {
        ...repaired.save,
        slotIndex: targetSlotIndex,
        schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        flags: {
          ...repaired.save.flags,
          importedFromDevelopmentSavePackage: true,
          importedSavePackageFormat: packageFormat,
        },
      },
      issues,
      sourceSchemaVersion: migration.sourceSchemaVersion,
      packageFormat,
    };
  } catch {
    return { ok: false, save: null, issues: ["Import file is not valid JSON."], sourceSchemaVersion: 0, packageFormat: "unknown" };
  }
}
