"use client";

import { BreedingPreset, PresetPreviewTarget, PresetSortMode, PresetValidation } from "@/lib/breeding/types";

export function BreedingPresetPanel({
  presetSlotCount,
  presetSortMode,
  setPresetSortMode,
  presetNameInput,
  setPresetNameInput,
  presetOverwriteSlot,
  setPresetOverwriteSlot,
  hasValidSelection,
  savePresetToSlot,
  favoriteCreatureIds,
  clearSavedUiData,
  sortedPresetSlots,
  getPresetAtSlot,
  validatePreset,
  getPresetScore,
  getNextEmptyPresetSlot,
  renamingPresetSlot,
  renamePresetInput,
  setRenamePresetInput,
  saveRenamePreset,
  cancelRenamePreset,
  startRenamePreset,
  getPresetParticipantLabel,
  setPresetPreviewTarget,
  movePreset,
  loadPreset,
  duplicatePreset,
  deletePreset,
}: {
  presetSlotCount: number;
  presetSortMode: PresetSortMode;
  setPresetSortMode: (mode: PresetSortMode) => void;
  presetNameInput: string;
  setPresetNameInput: (value: string) => void;
  presetOverwriteSlot: number;
  setPresetOverwriteSlot: (value: number) => void;
  hasValidSelection: boolean;
  savePresetToSlot: (slot: number) => void;
  favoriteCreatureIds: number[];
  clearSavedUiData: () => void;
  sortedPresetSlots: number[];
  getPresetAtSlot: (slot: number) => BreedingPreset | null;
  validatePreset: (preset: BreedingPreset) => PresetValidation;
  getPresetScore: (preset: BreedingPreset) => { score: number; label: string };
  getNextEmptyPresetSlot: (excludeSlot?: number) => number | null;
  renamingPresetSlot: number | null;
  renamePresetInput: string;
  setRenamePresetInput: (value: string) => void;
  saveRenamePreset: (slot: number) => void;
  cancelRenamePreset: () => void;
  startRenamePreset: (slot: number) => void;
  getPresetParticipantLabel: (type: "player" | "creature", creatureId: number | null) => string;
  setPresetPreviewTarget: (value: PresetPreviewTarget | null) => void;
  movePreset: (slot: number, direction: "up" | "down") => void;
  loadPreset: (slot: number) => void;
  duplicatePreset: (slot: number) => void;
  deletePreset: (slot: number) => void;
}) {
  return (
    <div className="rounded-2xl bg-rose-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-stone-900">Saved Presets</p>
        <button
          type="button"
          onClick={clearSavedUiData}
          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700"
        >
          Clear Saved UI Data
        </button>
      </div>

      <div className="mb-3 rounded-2xl border border-rose-200 bg-white p-3">
        <p className="mb-2 text-xs font-semibold text-stone-700">Preset Order</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPresetSortMode("custom")}
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${
              presetSortMode === "custom"
                ? "bg-rose-700 text-white"
                : "border border-rose-300 bg-white text-stone-800"
            }`}
          >
            Custom Order
          </button>
          <button
            type="button"
            onClick={() => setPresetSortMode("best_match")}
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${
              presetSortMode === "best_match"
                ? "bg-rose-700 text-white"
                : "border border-rose-300 bg-white text-stone-800"
            }`}
          >
            Best Match
          </button>
        </div>
      </div>

      <input
        type="text"
        value={presetNameInput}
        onChange={(e) => setPresetNameInput(e.target.value)}
        placeholder="Optional preset name..."
        className="mb-2 w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
      />

      <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
        <select
          value={presetOverwriteSlot}
          onChange={(e) => setPresetOverwriteSlot(Number(e.target.value))}
          className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
        >
          {Array.from({ length: presetSlotCount }, (_, i) => i + 1).map((slot) => (
            <option key={slot} value={slot}>
              Save to Slot {slot}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => savePresetToSlot(presetOverwriteSlot)}
          disabled={!hasValidSelection}
          className={`rounded-xl px-4 py-2 text-sm font-semibold shadow ${
            hasValidSelection ? "bg-rose-700 text-white" : "bg-stone-200 text-stone-500"
          }`}
        >
          Save
        </button>
      </div>

      <div className="mb-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
        Favorites and presets persist in your browser with localStorage. Favorites: {favoriteCreatureIds.length}
      </div>

      <div className="space-y-2">
        {sortedPresetSlots.map((slot) => {
          const preset = getPresetAtSlot(slot);
          const validation = preset ? validatePreset(preset) : null;
          const duplicateTargetSlot = preset ? getNextEmptyPresetSlot(slot) : null;
          const isRenaming = renamingPresetSlot === slot;
          const presetScore = preset ? getPresetScore(preset) : null;

          return (
            <div key={slot} className="rounded-2xl border border-rose-200 bg-white p-3 text-sm">
              {preset ? (
                <>
                  {isRenaming ? (
                    <div className="mb-2 space-y-2">
                      <input
                        type="text"
                        value={renamePresetInput}
                        onChange={(e) => setRenamePresetInput(e.target.value)}
                        placeholder="Preset name..."
                        className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveRenamePreset(slot)}
                          disabled={renamePresetInput.trim().length === 0}
                          className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                            renamePresetInput.trim().length > 0
                              ? "bg-rose-700 text-white"
                              : "bg-stone-200 text-stone-500"
                          }`}
                        >
                          Save Name
                        </button>
                        <button
                          type="button"
                          onClick={cancelRenamePreset}
                          className="rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-stone-900">Slot {slot}: {preset.name}</p>
                      {presetScore && (
                        <div className="rounded-full border border-stone-300 bg-stone-100 px-2 py-1 text-[11px] font-semibold text-stone-800">
                          {presetScore.label}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="mt-1 text-xs text-stone-600">
                    {getPresetParticipantLabel(preset.giverType, preset.giverCreatureId)} → {" "}
                    {getPresetParticipantLabel(preset.receiverType, preset.receiverCreatureId)}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {validation?.giverMissing && (
                      <div className="rounded-full border border-red-300 bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-900">
                        Missing giver
                      </div>
                    )}
                    {validation?.receiverMissing && (
                      <div className="rounded-full border border-red-300 bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-900">
                        Missing receiver
                      </div>
                    )}
                    {validation?.sameCreature && (
                      <div className="rounded-full border border-red-300 bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-900">
                        Invalid same-creature pair
                      </div>
                    )}
                    {validation?.familyRisk !== "none" && (
                      <div className="rounded-full border border-amber-300 bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-900">
                        {validation?.familyRisk.replace("_", " ")}
                      </div>
                    )}
                    {duplicateTargetSlot !== null && (
                      <div className="rounded-full border border-sky-300 bg-sky-100 px-2 py-1 text-[11px] font-semibold text-sky-900">
                        Duplicate → Slot {duplicateTargetSlot}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPresetPreviewTarget({ slot, preset })}
                      className="rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => movePreset(slot, "up")}
                      disabled={slot === 1 || presetSortMode !== "custom"}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                        slot > 1 && presetSortMode === "custom"
                          ? "border border-rose-300 bg-white text-stone-800"
                          : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      Move Up
                    </button>
                    <button
                      type="button"
                      onClick={() => movePreset(slot, "down")}
                      disabled={slot === presetSlotCount || presetSortMode !== "custom"}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                        slot < presetSlotCount && presetSortMode === "custom"
                          ? "border border-rose-300 bg-white text-stone-800"
                          : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      Move Down
                    </button>
                    <button
                      type="button"
                      onClick={() => loadPreset(slot)}
                      disabled={!validation?.canLoad}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                        validation?.canLoad
                          ? "border border-rose-300 bg-white text-stone-800"
                          : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => startRenamePreset(slot)}
                      className="rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicatePreset(slot)}
                      disabled={duplicateTargetSlot === null}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                        duplicateTargetSlot !== null
                          ? "border border-rose-300 bg-white text-stone-800"
                          : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => savePresetToSlot(slot)}
                      className="rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800"
                    >
                      Overwrite
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePreset(slot)}
                      className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold text-stone-900">Slot {slot}: Empty</p>
                  <p className="mt-1 text-xs text-stone-500">Save the current pair here for quick reuse.</p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
