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

export function buildCurrentSaveBalanceScenario(
  save: GameSave,
  giverId: string,
  receiverId: string,
) {
  const scenario = buildBaseCurrentScenario(save, giverId, receiverId);
  if (!scenario) return null;
  const snack = getSupplyDepotItem("energy_snack");
  const tonic = getSupplyDepotItem("fertility_tonic");
  return {
    ...scenario,
    energySnackRestore: ENERGY_SNACK_RESTORE_AMOUNT,
    energySnackPrice: snack ? getSupplyDepotPrice(save, snack) : scenario.energySnackPrice,
    fertilityTonicPrice: tonic ? getSupplyDepotPrice(save, tonic) : scenario.fertilityTonicPrice,
  };
}
