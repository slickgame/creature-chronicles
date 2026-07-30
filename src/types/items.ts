import type { CreatureFamily } from "./creature";

export type BreedingSupportItemId =
  | "energy_snack"
  | "energy_meal"
  | "fertility_tonic"
  | "affection_treat"
  | "recovery_balm"
  | "trait_stabilizer"
  | "mutation_catalyst"
  | "gestation_tonic"
  | "quickhatch_catalyst";

export type ItemRarity = "Common" | "Uncommon" | "Rare" | "Epic";
export type ItemUseSource = "inventory" | "breeding-pen" | "nursery";
export type ItemTargetKind = "player" | "creature" | "pregnancy" | "pair" | "egg" | "none";

export type ItemUseRecord = {
  itemUseId: string;
  itemId: BreedingSupportItemId;
  itemName: string;
  rarity: ItemRarity;
  source: ItemUseSource;
  dayNumber: number;
  usedAt: string;
  targetKind: ItemTargetKind;
  targetId?: string;
  targetName?: string;
  targetFamily?: CreatureFamily;
  effectSummary: string;
};
