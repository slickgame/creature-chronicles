import { resetDevGuild, resetDevMarket, resetDevRanchUpgrades } from "@/data/devTools";
import { createDefaultRanchJobsState } from "@/data/ranchJobs";
import { SUPPLY_DEPOT_FLAGS } from "@/data/supplyDepot";
import type { GameSave } from "@/types/save";

export type SaveSystemResetId =
  | "breeding-history"
  | "nursery-active"
  | "item-history"
  | "support-items"
  | "market"
  | "guild"
  | "ranch-upgrades"
  | "ranch-jobs"
  | "reliability-diagnostics";

export type SaveSystemResetDefinition = {
  resetId: SaveSystemResetId;
  name: string;
  description: string;
  warning: string;
};

export type SaveSystemResetResult = {
  save: GameSave;
  ok: boolean;
  message: string;
};

export const SAVE_SYSTEM_RESETS: readonly SaveSystemResetDefinition[] = [
  {
    resetId: "breeding-history",
    name: "Breeding Attempts and Pair Streaks",
    description: "Clears the Breeding Ledger attempt list and pair familiarity streaks.",
    warning: "Active pregnancies, eggs, offspring, and birth history remain intact.",
  },
  {
    resetId: "nursery-active",
    name: "Active Nursery State",
    description: "Clears active pregnancies and all unhatched eggs.",
    warning: "Hatched creatures and permanent birth history remain intact.",
  },
  {
    resetId: "item-history",
    name: "Item-Use History",
    description: "Clears the Inventory Item History log.",
    warning: "Owned items and armed effects remain unchanged.",
  },
  {
    resetId: "support-items",
    name: "Breeding Support Inventory",
    description: "Removes Energy, Care, Breeding, and Pregnancy support items and clears armed effects.",
    warning: "Feed, Materials, Repair Kits, and Nursery Supply Kits remain intact.",
  },
  {
    resetId: "market",
    name: "Market Listings",
    description: "Regenerates the current Market listings.",
    warning: "Owned creatures and Gold remain unchanged.",
  },
  {
    resetId: "guild",
    name: "Guild Contracts",
    description: "Regenerates the current Guild contract board.",
    warning: "Guild Points and completed history remain unchanged where supported by the current Guild reset.",
  },
  {
    resetId: "ranch-upgrades",
    name: "Ranch Upgrades",
    description: "Returns Ranch upgrades to Tier 0 and reapplies base habitat capacity.",
    warning: "Creatures, currencies, and Town upgrades remain intact.",
  },
  {
    resetId: "ranch-jobs",
    name: "Ranch Job Board",
    description: "Clears assignments and regenerates the Ranch job state.",
    warning: "Creatures remain owned and are released from current job assignments.",
  },
  {
    resetId: "reliability-diagnostics",
    name: "Reliability Diagnostics",
    description: "Clears displayed validation warnings and recovery counters.",
    warning: "Schema versioning, backups, and duplicate prevention remain enabled.",
  },
] as const;

function withResetAudit(save: GameSave, resetId: SaveSystemResetId): GameSave {
  const now = new Date().toISOString();
  return {
    ...save,
    updatedAt: now,
    flags: {
      ...save.flags,
      lastIndividualSystemReset: resetId,
      lastIndividualSystemResetAt: now,
      individualSystemResetCount: Number(save.flags.individualSystemResetCount ?? 0) + 1,
    },
  };
}

export function resetSaveSystem(save: GameSave, resetId: SaveSystemResetId): SaveSystemResetResult {
  if (resetId === "market") return resetDevMarket(save);
  if (resetId === "guild") return resetDevGuild(save);
  if (resetId === "ranch-upgrades") return resetDevRanchUpgrades(save);

  if (resetId === "breeding-history") {
    return {
      ok: true,
      save: withResetAudit({
        ...save,
        breeding: save.breeding ? { ...save.breeding, attempts: [], streaks: [] } : save.breeding,
      }, resetId),
      message: "Breeding attempts and pair streaks reset. Pregnancies, eggs, offspring, and birth history were preserved.",
    };
  }

  if (resetId === "nursery-active") {
    return {
      ok: true,
      save: withResetAudit({
        ...save,
        pregnancies: [],
        eggs: [],
        eggIds: [],
      }, resetId),
      message: "Active pregnancies and unhatched eggs reset. Hatched creatures and birth history were preserved.",
    };
  }

  if (resetId === "item-history") {
    return {
      ok: true,
      save: withResetAudit({ ...save, itemUseHistory: [] }, resetId),
      message: "Item-use history reset. Inventory counts and armed effects were preserved.",
    };
  }

  if (resetId === "support-items") {
    return {
      ok: true,
      save: withResetAudit({
        ...save,
        flags: {
          ...save.flags,
          [SUPPLY_DEPOT_FLAGS.energySnacks]: 0,
          [SUPPLY_DEPOT_FLAGS.energyMeals]: 0,
          [SUPPLY_DEPOT_FLAGS.fertilityTonics]: 0,
          [SUPPLY_DEPOT_FLAGS.affectionTreats]: 0,
          [SUPPLY_DEPOT_FLAGS.recoveryBalms]: 0,
          [SUPPLY_DEPOT_FLAGS.traitStabilizers]: 0,
          [SUPPLY_DEPOT_FLAGS.mutationCatalysts]: 0,
          [SUPPLY_DEPOT_FLAGS.gestationTonics]: 0,
          breedingFertilityTonicArmed: 0,
          traitStabilizerArmed: 0,
          mutationCatalystArmed: 0,
        },
      }, resetId),
      message: "Breeding support inventory and armed effects reset. Ranch supplies were preserved.",
    };
  }

  if (resetId === "ranch-jobs") {
    return {
      ok: true,
      save: withResetAudit({ ...save, ranchJobs: createDefaultRanchJobsState() }, resetId),
      message: "Ranch jobs reset and all current assignments cleared.",
    };
  }

  return {
    ok: true,
    save: withResetAudit({
      ...save,
      saveReliability: {
        ...(save.saveReliability ?? {}),
        lastValidationIssues: [],
        recoveredInterruptedTransactions: 0,
        preventedDuplicateOutcomes: 0,
        repairedCollectionEntries: 0,
      },
    }, resetId),
    message: "Save reliability diagnostics reset. Schema protection and backups remain active.",
  };
}
