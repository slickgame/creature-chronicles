import { applyEggAtelierHatchEffects } from "@/data/eggAtelier";
import { hatchEgg } from "@/data/nursery";
import { QUICKHATCH_CATALYST_STOCK_FLAG } from "@/data/chapterOneGuidedTutorial";
import type { CreatureRecord } from "@/types/creature";
import type { EggId } from "@/types/ids";
import type { ItemUseRecord } from "@/types/items";
import type { GameSave } from "@/types/save";

export const QUICKHATCH_CATALYST = {
  itemId: "quickhatch_catalyst" as const,
  name: "Quickhatch Catalyst",
  rarity: "Epic" as const,
  iconPath: "/images/ui/icons/icon_hatch.png",
  description: "A one-time crystal prepared by Veyra for the first guided egg.",
  exactEffect: "Consumes one catalyst, finishes the selected egg immediately, and hatches it while preserving its recorded genetics and move inheritance.",
} as const;

export type QuickhatchResult = {
  save: GameSave;
  creature: CreatureRecord | null;
  ok: boolean;
  message: string;
};

function flagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function getQuickhatchCatalystCount(save: GameSave): number {
  return flagNumber(save.flags[QUICKHATCH_CATALYST_STOCK_FLAG]);
}

export function useTutorialQuickhatchCatalyst(
  save: GameSave,
  eggId: EggId,
): QuickhatchResult {
  const stock = getQuickhatchCatalystCount(save);
  if (stock <= 0) {
    return { save, creature: null, ok: false, message: "No Quickhatch Catalyst is available." };
  }
  if (save.flags.chapterOneQuickhatchCatalystUsed === true) {
    return { save, creature: null, ok: false, message: "The guided Quickhatch Catalyst has already been used." };
  }
  const egg = (save.eggs ?? []).find((record) => record.eggId === eggId);
  if (!egg) return { save, creature: null, ok: false, message: "That egg is no longer in the Nursery." };
  if (egg.status === "hatched") {
    return { save, creature: null, ok: false, message: "That egg has already hatched." };
  }

  const preparedSave: GameSave = {
    ...save,
    eggs: (save.eggs ?? []).map((record) =>
      record.eggId === eggId
        ? {
            ...record,
            daysRemaining: 0,
            status: "ready" as const,
            statRollNotes: [
              ...(record.statRollNotes ?? []),
              "Veyra's tutorial Quickhatch Catalyst completed incubation immediately.",
            ],
          }
        : record,
    ),
  };
  const hatchResult = hatchEgg(preparedSave, eggId);
  if (!hatchResult) {
    return {
      save,
      creature: null,
      ok: false,
      message: "The egg could not hatch. Check that its habitat has an open space.",
    };
  }
  const atelierResult = applyEggAtelierHatchEffects(preparedSave, hatchResult, eggId);
  const usedAt = new Date().toISOString();
  const record: ItemUseRecord = {
    itemUseId: `item_use_quickhatch_${save.dayState.dayNumber}_${Date.now()}`,
    itemId: QUICKHATCH_CATALYST.itemId,
    itemName: QUICKHATCH_CATALYST.name,
    rarity: QUICKHATCH_CATALYST.rarity,
    source: "inventory",
    dayNumber: save.dayState.dayNumber,
    usedAt,
    targetKind: "egg",
    targetId: String(eggId),
    targetName: egg.suggestedName || `${egg.rarity} Egg`,
    effectSummary: `Finished incubation and hatched ${atelierResult.creature.nickname}.`,
  };
  const nextSave: GameSave = {
    ...atelierResult.save,
    itemUseHistory: [record, ...(atelierResult.save.itemUseHistory ?? [])].slice(0, 100),
    flags: {
      ...atelierResult.save.flags,
      [QUICKHATCH_CATALYST_STOCK_FLAG]: Math.max(0, stock - 1),
      chapterOneQuickhatchCatalystUsed: true,
      chapterOneGuidedEggHatched: true,
      chapterOneQuickhatchCreatureId: String(atelierResult.creature.creatureId),
      chapterOneQuickhatchEggId: String(eggId),
      chapterOneQuickhatchUsedAt: usedAt,
      itemUseHistoryEnabled: true,
      m7InventoryItemUsed: true,
    },
  };
  return {
    save: nextSave,
    creature: atelierResult.creature,
    ok: true,
    message: `${QUICKHATCH_CATALYST.name} consumed. ${atelierResult.creature.nickname} hatched immediately with recorded genetics and moves intact.`,
  };
}
