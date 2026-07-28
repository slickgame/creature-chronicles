import {
  ENERGY_SNACK_RESTORE_AMOUNT,
  getSupplyDepotItem,
  getSupplyDepotPrice,
} from "@/data/supplyDepot";
import type { GameSave } from "@/types/save";
import {
  buildCurrentSaveBalanceScenario as buildBaseCurrentScenario,
  getBreedingBalancePreset,
} from "./breedingBalancePresets";

export { getBreedingBalancePreset };

function getFlagCount(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function buildCurrentSaveBalanceScenario(
  save: GameSave,
  giverId: string,
  receiverId: string,
) {
  const scenario = buildBaseCurrentScenario(save, giverId, receiverId);
  if (!scenario) return null;
  const snack = getSupplyDepotItem("energy_snack");
  const tonic = getSupplyDepotItem("fertility_tonic");
  const previewIncludedTonic = getFlagCount(save.flags.breedingFertilityTonics) > 0
    ? scenario.fertilityTonicBonus
    : 0;
  return {
    ...scenario,
    facilityChanceBonus: Math.max(0, scenario.facilityChanceBonus - previewIncludedTonic),
    energySnackRestore: ENERGY_SNACK_RESTORE_AMOUNT,
    energySnackPrice: snack ? getSupplyDepotPrice(save, snack) : scenario.energySnackPrice,
    fertilityTonicPrice: tonic ? getSupplyDepotPrice(save, tonic) : scenario.fertilityTonicPrice,
  };
}
