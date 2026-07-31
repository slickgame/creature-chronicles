import type { GameSave } from "@/types/save";

export const PORTABLE_SAVE_FORMAT = "creature-chronicles-portable-save";
export const PORTABLE_SAVE_FORMAT_VERSION = 1;
export const PORTABLE_SAVE_FILE_EXTENSION = ".ccsave";

export type PortableSaveEnvelopeV1 = {
  format: typeof PORTABLE_SAVE_FORMAT;
  formatVersion: typeof PORTABLE_SAVE_FORMAT_VERSION;
  createdAt: string;
  sourceGameVersion: string;
  sourceSlotIndex: number;
  playerName: string;
  ranchName: string;
  payload: GameSave;
  checksum: string;
};

export type PortableSaveInspection = {
  ok: boolean;
  message: string;
  verified: boolean;
  legacyJson: boolean;
  save: GameSave | null;
  playerName: string;
  ranchName: string;
  dayNumber: number;
  creatureCount: number;
  eggCount: number;
  sourceSlotIndex: number;
};

function checksumText(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function looksLikeSave(value: unknown): value is GameSave {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<GameSave>;
  return Boolean(
    record.saveId &&
    Number.isInteger(record.slotIndex) &&
    record.player &&
    typeof record.player.name === "string" &&
    record.currencies &&
    record.dayState &&
    Array.isArray(record.creatures),
  );
}

function describeSave(save: GameSave, verified: boolean, legacyJson: boolean, message: string): PortableSaveInspection {
  return {
    ok: true,
    message,
    verified,
    legacyJson,
    save,
    playerName: save.player.name,
    ranchName: save.player.ranchName,
    dayNumber: save.dayState.dayNumber,
    creatureCount: save.creatures?.length ?? save.creatureIds?.length ?? 0,
    eggCount: save.eggs?.filter((egg) => egg.status !== "hatched").length ?? save.eggIds?.length ?? 0,
    sourceSlotIndex: save.slotIndex,
  };
}

function failure(message: string): PortableSaveInspection {
  return {
    ok: false,
    message,
    verified: false,
    legacyJson: false,
    save: null,
    playerName: "",
    ranchName: "",
    dayNumber: 0,
    creatureCount: 0,
    eggCount: 0,
    sourceSlotIndex: 0,
  };
}

export function serializePortableSave(save: GameSave): string {
  const payloadText = JSON.stringify(save);
  const envelope: PortableSaveEnvelopeV1 = {
    format: PORTABLE_SAVE_FORMAT,
    formatVersion: PORTABLE_SAVE_FORMAT_VERSION,
    createdAt: new Date().toISOString(),
    sourceGameVersion: String(save.version ?? "unknown"),
    sourceSlotIndex: save.slotIndex,
    playerName: save.player.name,
    ranchName: save.player.ranchName,
    payload: save,
    checksum: checksumText(payloadText),
  };
  return JSON.stringify(envelope);
}

export function inspectPortableSave(rawText: string): PortableSaveInspection {
  const text = rawText.trim();
  if (!text) return failure("Paste a travel save code or choose a .ccsave/.json file first.");

  try {
    const parsed = JSON.parse(text) as unknown;
    if (looksLikeSave(parsed)) {
      return describeSave(
        parsed,
        false,
        true,
        "Legacy save JSON recognized. It can be imported, but it does not include a travel-file checksum.",
      );
    }

    if (!parsed || typeof parsed !== "object") return failure("This file is not a Creature Chronicles travel save.");
    const envelope = parsed as Partial<PortableSaveEnvelopeV1>;
    if (envelope.format !== PORTABLE_SAVE_FORMAT) return failure("Unrecognized travel save format.");
    if (envelope.formatVersion !== PORTABLE_SAVE_FORMAT_VERSION) {
      return failure(`Unsupported travel save version ${String(envelope.formatVersion)}.`);
    }
    if (!looksLikeSave(envelope.payload)) return failure("The travel file does not contain valid save data.");
    if (typeof envelope.checksum !== "string") return failure("The travel file is missing its integrity checksum.");

    const actualChecksum = checksumText(JSON.stringify(envelope.payload));
    if (actualChecksum !== envelope.checksum) {
      return failure("The travel save is incomplete or was altered. Export it again before importing.");
    }

    return describeSave(
      envelope.payload,
      true,
      false,
      `Verified travel save created ${envelope.createdAt ? new Date(envelope.createdAt).toLocaleString("en-US") : "recently"}.`,
    );
  } catch {
    return failure("The pasted text or selected file is not valid JSON.");
  }
}

export function preparePortableSaveForSlot(rawText: string, targetSlotIndex: number): { save: GameSave | null; inspection: PortableSaveInspection } {
  const inspection = inspectPortableSave(rawText);
  if (!inspection.ok || !inspection.save) return { save: null, inspection };
  if (!Number.isInteger(targetSlotIndex) || targetSlotIndex < 0) {
    return { save: null, inspection: failure("Choose a valid destination save slot.") };
  }

  const importedAt = new Date().toISOString();
  return {
    inspection,
    save: {
      ...inspection.save,
      slotIndex: targetSlotIndex,
      updatedAt: importedAt,
      flags: {
        ...inspection.save.flags,
        m64PortableSaveTransfer: true,
        portableSaveImportedAt: importedAt,
        portableSaveOriginalSlotIndex: inspection.sourceSlotIndex,
        portableSaveChecksumVerified: inspection.verified,
      },
    },
  };
}

export function getPortableSaveFilename(save: GameSave): string {
  const safePlayer = (save.player.name || "rancher").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return `${safePlayer || "rancher"}-day-${save.dayState.dayNumber}${PORTABLE_SAVE_FILE_EXTENSION}`;
}
