import type { GameSave, SaveReliabilityState } from "@/types/save";

export const CURRENT_SAVE_SCHEMA_VERSION = 3;
export const SAVE_SLOT_COUNT = 3;

const SAVE_PREFIX = "creature_chronicles_save_slot_";
const BACKUP_PREFIX = "creature_chronicles_save_backups_";
const JOURNAL_PREFIX = "creature_chronicles_save_journal_";
const MAX_BACKUPS_PER_SLOT = 2;

export type SaveBackupReason = "before-migration" | "before-import" | "manual" | "before-restore" | "damaged-save-recovery";

export type SaveBackupRecord = {
  backupId: string;
  slotIndex: number;
  createdAt: string;
  reason: SaveBackupReason;
  schemaVersion: number;
  rawJson: string;
};

export type SaveTransactionKind = "breeding-attempt" | "save-import" | "system-reset";

export type SaveTransactionJournal = {
  transactionId: string;
  saveId: string;
  slotIndex: number;
  kind: SaveTransactionKind;
  dedupeKey: string;
  startedAt: string;
  baseUpdatedAt: string;
};

export type SaveMigrationResult = {
  save: GameSave | null;
  changed: boolean;
  sourceSchemaVersion: number;
  issues: string[];
};

export type SaveRepairResult = {
  save: GameSave;
  changed: boolean;
  issues: string[];
  duplicateOutcomeCount: number;
  repairedEntryCount: number;
};

export type SaveImportReport = {
  ok: boolean;
  save: GameSave | null;
  issues: string[];
  sourceSchemaVersion: number;
  packageFormat: "package" | "legacy-json" | "unknown";
};

type UnknownRecord = Record<string, unknown>;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function asFiniteNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asPositiveInteger(value: unknown, fallback: number): number {
  return Math.max(1, Math.floor(asFiniteNumber(value, fallback)));
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function safeTimestamp(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : value;
}

function getSlotKey(slotIndex: number): string {
  return `${SAVE_PREFIX}${slotIndex}`;
}

function getBackupKey(slotIndex: number): string {
  return `${BACKUP_PREFIX}${slotIndex}`;
}

function getJournalKey(slotIndex: number): string {
  return `${JOURNAL_PREFIX}${slotIndex}`;
}

function getSchemaVersion(value: unknown): number {
  if (!isRecord(value)) return 0;
  return Math.max(0, Math.floor(asFiniteNumber(value.schemaVersion, 0)));
}

function migrateSchema0To1(source: UnknownRecord, slotIndex: number, issues: string[]): UnknownRecord {
  const now = new Date().toISOString();
  const playerSource = asRecord(source.player);
  const currenciesSource = asRecord(source.currencies);
  const daySource = asRecord(source.dayState);
  const settingsSource = asRecord(source.settings);
  const statsSource = asRecord(playerSource.stats);
  const gradesSource = asRecord(playerSource.statGrades);
  const saveId = asString(source.saveId, `recovered_save_${slotIndex}_${Date.now()}`);
  const playerName = asString(playerSource.name, "Recovered Breeder");

  if (!isRecord(source.player)) issues.push("Missing player profile was reconstructed.");
  if (!isRecord(source.currencies)) issues.push("Missing currency state was reconstructed.");
  if (!isRecord(source.dayState)) issues.push("Missing day state was reconstructed.");
  if (!isRecord(source.flags)) issues.push("Missing save flags were reconstructed.");

  return {
    ...source,
    schemaVersion: 1,
    saveId,
    slotIndex: Math.max(0, Math.floor(asFiniteNumber(source.slotIndex, slotIndex))),
    createdAt: safeTimestamp(source.createdAt, now),
    updatedAt: safeTimestamp(source.updatedAt, now),
    version: asString(source.version, "legacy"),
    player: {
      ...playerSource,
      playerId: asString(playerSource.playerId, `recovered_player_${Date.now()}`),
      name: playerName,
      ranchName: asString(playerSource.ranchName, `${playerName}'s Ranch`),
      breederRank: asPositiveInteger(playerSource.breederRank, 1),
      breederXp: Math.max(0, Math.floor(asFiniteNumber(playerSource.breederXp, 0))),
      breederXpToNext: asPositiveInteger(playerSource.breederXpToNext, 115),
      ranchRank: asPositiveInteger(playerSource.ranchRank, 1),
      stats: {
        STR: asPositiveInteger(statsSource.STR, 5),
        DEX: asPositiveInteger(statsSource.DEX, 5),
        STA: asPositiveInteger(statsSource.STA, 5),
        CHA: asPositiveInteger(statsSource.CHA, 5),
        WIL: asPositiveInteger(statsSource.WIL, 5),
        FER: asPositiveInteger(statsSource.FER, 5),
      },
      statGrades: {
        STR: asString(gradesSource.STR, "C"),
        DEX: asString(gradesSource.DEX, "C"),
        STA: asString(gradesSource.STA, "C"),
        CHA: asString(gradesSource.CHA, "C"),
        WIL: asString(gradesSource.WIL, "C"),
        FER: asString(gradesSource.FER, "C"),
      },
      hearts: Math.max(0, Math.floor(asFiniteNumber(playerSource.hearts, 4))),
      maxHearts: asPositiveInteger(playerSource.maxHearts, 4),
    },
    currencies: {
      gold: Math.max(0, Math.floor(asFiniteNumber(currenciesSource.gold, 0))),
      guildPoints: Math.max(0, Math.floor(asFiniteNumber(currenciesSource.guildPoints, 0))),
      energy: Math.max(0, Math.floor(asFiniteNumber(currenciesSource.energy, 0))),
      maxEnergy: asPositiveInteger(currenciesSource.maxEnergy, 100),
    },
    dayState: {
      dayNumber: asPositiveInteger(daySource.dayNumber, 1),
      weekday: asString(daySource.weekday, "Mon"),
      month: asPositiveInteger(daySource.month, 1),
      dayOfMonth: Math.min(30, asPositiveInteger(daySource.dayOfMonth, 1)),
      weekNumber: asPositiveInteger(daySource.weekNumber, 1),
    },
    settings: {
      musicVolume: Math.min(100, Math.max(0, asFiniteNumber(settingsSource.musicVolume, 70))),
      sfxVolume: Math.min(100, Math.max(0, asFiniteNumber(settingsSource.sfxVolume, 80))),
      textSpeed: asString(settingsSource.textSpeed, "normal"),
      devMode: settingsSource.devMode !== false,
    },
    creatureIds: asArray(source.creatureIds),
    eggIds: asArray(source.eggIds),
    habitatIds: asArray(source.habitatIds),
    creatures: asArray(source.creatures),
    habitats: asArray(source.habitats),
    flags: asRecord(source.flags),
  };
}

function migrateSchema1To2(source: UnknownRecord): UnknownRecord {
  return {
    ...source,
    schemaVersion: 2,
    pregnancies: asArray(source.pregnancies),
    eggs: asArray(source.eggs),
    birthHistory: asArray(source.birthHistory),
    itemUseHistory: asArray(source.itemUseHistory),
  };
}

function migrateSchema2To3(source: UnknownRecord): UnknownRecord {
  const reliability = asRecord(source.saveReliability);
  return {
    ...source,
    schemaVersion: 3,
    saveReliability: {
      ...reliability,
      recoveredInterruptedTransactions: Math.max(0, Math.floor(asFiniteNumber(reliability.recoveredInterruptedTransactions, 0))),
      preventedDuplicateOutcomes: Math.max(0, Math.floor(asFiniteNumber(reliability.preventedDuplicateOutcomes, 0))),
      repairedCollectionEntries: Math.max(0, Math.floor(asFiniteNumber(reliability.repairedCollectionEntries, 0))),
    },
  };
}

export function migrateUnknownSave(raw: unknown, slotIndex: number): SaveMigrationResult {
  if (!isRecord(raw)) {
    return {
      save: null,
      changed: false,
      sourceSchemaVersion: 0,
      issues: ["Save data is not a JSON object."],
    };
  }

  const issues: string[] = [];
  const sourceSchemaVersion = getSchemaVersion(raw);
  if (sourceSchemaVersion > CURRENT_SAVE_SCHEMA_VERSION) {
    return {
      save: null,
      changed: false,
      sourceSchemaVersion,
      issues: [`Save schema ${sourceSchemaVersion} is newer than supported schema ${CURRENT_SAVE_SCHEMA_VERSION}.`],
    };
  }

  let migrated: UnknownRecord = { ...raw };
  let version = sourceSchemaVersion;
  if (version < 1) {
    migrated = migrateSchema0To1(migrated, slotIndex, issues);
    version = 1;
  }
  if (version < 2) {
    migrated = migrateSchema1To2(migrated);
    version = 2;
  }
  if (version < 3) {
    migrated = migrateSchema2To3(migrated);
    version = 3;
  }

  const now = new Date().toISOString();
  const reliability = asRecord(migrated.saveReliability);
  migrated = {
    ...migrated,
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    slotIndex,
    saveReliability: {
      ...reliability,
      ...(sourceSchemaVersion < CURRENT_SAVE_SCHEMA_VERSION
        ? { lastMigrationAt: now, lastMigrationFromSchema: sourceSchemaVersion }
        : {}),
    },
  };

  return {
    save: migrated as unknown as GameSave,
    changed: sourceSchemaVersion !== CURRENT_SAVE_SCHEMA_VERSION || issues.length > 0 || Number(raw.slotIndex) !== slotIndex,
    sourceSchemaVersion,
    issues,
  };
}

function dedupeBy<T>(items: T[], keyOf: (item: T) => string | null | undefined): { items: T[]; removed: number } {
  const seen = new Set<string>();
  const output: T[] = [];
  let removed = 0;
  for (const item of items) {
    const key = keyOf(item);
    if (!key) {
      output.push(item);
      continue;
    }
    if (seen.has(key)) {
      removed += 1;
      continue;
    }
    seen.add(key);
    output.push(item);
  }
  return { items: output, removed };
}

function dedupeOutcomesBySource<T>(items: T[], sourceKey: (item: T) => string | undefined): { items: T[]; removed: number } {
  const seen = new Set<string>();
  const output: T[] = [];
  let removed = 0;
  for (const item of items) {
    const key = sourceKey(item);
    if (!key) {
      output.push(item);
      continue;
    }
    if (seen.has(key)) {
      removed += 1;
      continue;
    }
    seen.add(key);
    output.push(item);
  }
  return { items: output, removed };
}

export function repairLoadedSave(input: GameSave, slotIndex: number): SaveRepairResult {
  const issues: string[] = [];
  let duplicateOutcomeCount = 0;
  let repairedEntryCount = 0;

  const creatureResult = dedupeBy(input.creatures ?? [], (item) => String(item.creatureId ?? ""));
  repairedEntryCount += creatureResult.removed;
  const habitatResult = dedupeBy(input.habitats ?? [], (item) => String(item.habitatId ?? ""));
  repairedEntryCount += habitatResult.removed;
  const attemptResult = dedupeBy(input.breeding?.attempts ?? [], (item) => String(item.attemptId ?? ""));
  repairedEntryCount += attemptResult.removed;
  const streakResult = dedupeBy(input.breeding?.streaks ?? [], (item) => String(item.pairKey ?? ""));
  repairedEntryCount += streakResult.removed;

  const pregnancyIdResult = dedupeBy(input.pregnancies ?? [], (item) => String(item.pregnancyId ?? ""));
  const pregnancySourceResult = dedupeOutcomesBySource(pregnancyIdResult.items, (item) => item.sourceAttemptId ? String(item.sourceAttemptId) : undefined);
  duplicateOutcomeCount += pregnancyIdResult.removed + pregnancySourceResult.removed;

  const eggIdResult = dedupeBy(input.eggs ?? [], (item) => String(item.eggId ?? ""));
  const eggSourceResult = dedupeOutcomesBySource(eggIdResult.items, (item) => item.sourcePregnancyId ? String(item.sourcePregnancyId) : undefined);
  duplicateOutcomeCount += eggIdResult.removed + eggSourceResult.removed;

  const birthIdResult = dedupeBy(input.birthHistory ?? [], (item) => String(item.birthId ?? ""));
  const birthEggResult = dedupeOutcomesBySource(birthIdResult.items, (item) => item.eggId ? String(item.eggId) : undefined);
  duplicateOutcomeCount += birthIdResult.removed + birthEggResult.removed;

  const itemHistoryResult = dedupeBy(input.itemUseHistory ?? [], (item) => String(item.itemUseId ?? ""));
  repairedEntryCount += itemHistoryResult.removed;

  if (duplicateOutcomeCount > 0) issues.push(`Prevented ${duplicateOutcomeCount} duplicate pregnancy, egg, or birth outcome record(s).`);
  if (repairedEntryCount > 0) issues.push(`Removed ${repairedEntryCount} duplicate collection or history record(s).`);

  const maxEnergy = Math.max(1, Math.floor(asFiniteNumber(input.currencies?.maxEnergy, 100)));
  const playerMaxHearts = Math.max(1, Math.floor(asFiniteNumber(input.player?.maxHearts, 4)));
  const now = new Date().toISOString();
  const reliability: SaveReliabilityState = {
    ...(input.saveReliability ?? {}),
    lastValidatedAt: now,
    lastValidationIssues: issues,
    preventedDuplicateOutcomes: (input.saveReliability?.preventedDuplicateOutcomes ?? 0) + duplicateOutcomeCount,
    repairedCollectionEntries: (input.saveReliability?.repairedCollectionEntries ?? 0) + repairedEntryCount,
  };

  const save: GameSave = {
    ...input,
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    slotIndex,
    updatedAt: safeTimestamp(input.updatedAt, now),
    player: {
      ...input.player,
      hearts: Math.min(playerMaxHearts, Math.max(0, Math.floor(asFiniteNumber(input.player?.hearts, playerMaxHearts)))),
      maxHearts: playerMaxHearts,
    },
    currencies: {
      ...input.currencies,
      gold: Math.max(0, Math.floor(asFiniteNumber(input.currencies?.gold, 0))),
      guildPoints: Math.max(0, Math.floor(asFiniteNumber(input.currencies?.guildPoints, 0))),
      energy: Math.min(maxEnergy, Math.max(0, Math.floor(asFiniteNumber(input.currencies?.energy, 0)))),
      maxEnergy,
    },
    dayState: {
      ...input.dayState,
      dayNumber: asPositiveInteger(input.dayState?.dayNumber, 1),
      month: asPositiveInteger(input.dayState?.month, 1),
      dayOfMonth: Math.min(30, asPositiveInteger(input.dayState?.dayOfMonth, 1)),
      weekNumber: asPositiveInteger(input.dayState?.weekNumber, 1),
    },
    creatures: creatureResult.items,
    creatureIds: creatureResult.items.map((item) => item.creatureId),
    habitats: habitatResult.items,
    habitatIds: habitatResult.items.map((item) => item.habitatId),
    breeding: input.breeding ? {
      ...input.breeding,
      attempts: attemptResult.items,
      streaks: streakResult.items,
    } : input.breeding,
    pregnancies: pregnancySourceResult.items,
    eggs: eggSourceResult.items,
    eggIds: eggSourceResult.items.map((item) => item.eggId),
    birthHistory: birthEggResult.items,
    itemUseHistory: itemHistoryResult.items,
    saveReliability: reliability,
    flags: {
      ...(input.flags ?? {}),
      saveReliabilityEnabled: true,
      saveSchemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      ...(duplicateOutcomeCount > 0 ? { duplicateOutcomePreventionApplied: true } : {}),
    },
  };

  return {
    save,
    changed: duplicateOutcomeCount > 0 || repairedEntryCount > 0 || input.schemaVersion !== CURRENT_SAVE_SCHEMA_VERSION || input.slotIndex !== slotIndex,
    issues,
    duplicateOutcomeCount,
    repairedEntryCount,
  };
}

export function createSaveBackup(slotIndex: number, rawJson: string, reason: SaveBackupReason, schemaVersion = 0): SaveBackupRecord | null {
  if (!canUseStorage()) return null;
  const record: SaveBackupRecord = {
    backupId: `backup_${slotIndex}_${Date.now()}`,
    slotIndex,
    createdAt: new Date().toISOString(),
    reason,
    schemaVersion,
    rawJson,
  };
  const backups = listSaveBackups(slotIndex);
  const next = [record, ...backups].slice(0, MAX_BACKUPS_PER_SLOT);
  window.localStorage.setItem(getBackupKey(slotIndex), JSON.stringify(next));
  return record;
}

export function createSaveBackupFromSave(save: GameSave, reason: SaveBackupReason): SaveBackupRecord | null {
  return createSaveBackup(save.slotIndex, JSON.stringify(save), reason, save.schemaVersion ?? 0);
}

export function listSaveBackups(slotIndex: number): SaveBackupRecord[] {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(getBackupKey(slotIndex)) ?? "[]") as SaveBackupRecord[];
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.rawJson === "string") : [];
  } catch {
    return [];
  }
}

export function getSaveBackup(slotIndex: number, backupId?: string): SaveBackupRecord | null {
  const backups = listSaveBackups(slotIndex);
  if (!backupId) return backups[0] ?? null;
  return backups.find((item) => item.backupId === backupId) ?? null;
}

export function beginSaveTransaction(save: GameSave, kind: SaveTransactionKind, dedupeKey: string): SaveTransactionJournal {
  const journal: SaveTransactionJournal = {
    transactionId: `save_tx_${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    saveId: String(save.saveId),
    slotIndex: save.slotIndex,
    kind,
    dedupeKey,
    startedAt: new Date().toISOString(),
    baseUpdatedAt: save.updatedAt,
  };
  if (canUseStorage()) window.localStorage.setItem(getJournalKey(save.slotIndex), JSON.stringify(journal));
  return journal;
}

export function abortSaveTransaction(transaction: SaveTransactionJournal): void {
  if (!canUseStorage()) return;
  const current = readSaveTransaction(transaction.slotIndex);
  if (!current || current.transactionId === transaction.transactionId) {
    window.localStorage.removeItem(getJournalKey(transaction.slotIndex));
  }
}

export function readSaveTransaction(slotIndex: number): SaveTransactionJournal | null {
  if (!canUseStorage()) return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(getJournalKey(slotIndex)) ?? "null") as SaveTransactionJournal | null;
    return parsed && typeof parsed.transactionId === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function tagSaveTransaction(save: GameSave, transaction: SaveTransactionJournal, outcomeId?: string): GameSave {
  const now = new Date().toISOString();
  return {
    ...save,
    saveReliability: {
      ...(save.saveReliability ?? {}),
      lastCommittedTransactionId: transaction.transactionId,
      lastAutosaveAt: now,
      lastAutosaveReason: transaction.kind,
    },
    flags: {
      ...save.flags,
      lastCommittedSaveTransactionId: transaction.transactionId,
      lastSaveTransactionKind: transaction.kind,
      lastSaveTransactionDedupeKey: transaction.dedupeKey,
      ...(outcomeId ? { lastSaveTransactionOutcomeId: outcomeId } : {}),
    },
  };
}

export function completeSaveTransaction(save: GameSave): void {
  if (!canUseStorage()) return;
  const journal = readSaveTransaction(save.slotIndex);
  if (!journal) return;
  if (save.saveReliability?.lastCommittedTransactionId === journal.transactionId || save.flags.lastCommittedSaveTransactionId === journal.transactionId) {
    window.localStorage.removeItem(getJournalKey(save.slotIndex));
  }
}

export function recoverInterruptedTransaction(save: GameSave): { save: GameSave; recovered: boolean; message?: string } {
  const journal = readSaveTransaction(save.slotIndex);
  if (!journal) return { save, recovered: false };
  if (journal.saveId !== String(save.saveId)) {
    if (canUseStorage()) window.localStorage.removeItem(getJournalKey(save.slotIndex));
    return { save, recovered: false };
  }

  const committed = save.saveReliability?.lastCommittedTransactionId === journal.transactionId || save.flags.lastCommittedSaveTransactionId === journal.transactionId;
  if (canUseStorage()) window.localStorage.removeItem(getJournalKey(save.slotIndex));
  if (committed) return { save, recovered: false };

  const now = new Date().toISOString();
  const recoveredCount = (save.saveReliability?.recoveredInterruptedTransactions ?? 0) + 1;
  const message = `Recovered interrupted ${journal.kind.replace(/-/g, " ")} started at ${journal.startedAt}. No uncommitted outcome was applied.`;
  return {
    recovered: true,
    message,
    save: {
      ...save,
      saveReliability: {
        ...(save.saveReliability ?? {}),
        recoveredInterruptedTransactions: recoveredCount,
        lastValidatedAt: now,
        lastValidationIssues: [...(save.saveReliability?.lastValidationIssues ?? []), message].slice(-10),
      },
      flags: {
        ...save.flags,
        interruptedSaveTransactionRecovered: true,
        lastInterruptedSaveTransactionAt: now,
        interruptedSaveTransactionRecoveryCount: recoveredCount,
      },
    },
  };
}

function checksum(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function exportSavePackage(save: GameSave): string {
  const payload = {
    ...save,
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
  };
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

export function inspectSaveImport(text: string, targetSlotIndex: number): SaveImportReport {
  try {
    const parsed = JSON.parse(text) as unknown;
    const envelope = isRecord(parsed) && parsed.format === "creature-chronicles-save-package" ? parsed : null;
    const packageFormat: SaveImportReport["packageFormat"] = envelope ? "package" : isRecord(parsed) ? "legacy-json" : "unknown";
    const rawSave = envelope ? envelope.save : parsed;
    const issues: string[] = [];

    if (envelope) {
      const payloadText = JSON.stringify(rawSave);
      if (typeof envelope.checksum === "string" && envelope.checksum !== checksum(payloadText)) {
        return { ok: false, save: null, issues: ["Import checksum does not match; the file may be incomplete or edited."], sourceSchemaVersion: getSchemaVersion(rawSave), packageFormat };
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

export function getRawStoredSave(slotIndex: number): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(getSlotKey(slotIndex));
}

export function setRawStoredSave(slotIndex: number, rawJson: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(getSlotKey(slotIndex), rawJson);
}

export function clearReliabilityStorageForSlot(slotIndex: number): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(getBackupKey(slotIndex));
  window.localStorage.removeItem(getJournalKey(slotIndex));
}
