import type { CreatureFamily } from "@/types/creature";
import type { SpeciesId } from "@/types/ids";

export type BattleMoveId = string;
export type BattleAbilityId = string;
export type BattleTag = string;

export type BattleStatKey =
  | "maxHp"
  | "physicalPower"
  | "specialPower"
  | "defense"
  | "resistance"
  | "speed"
  | "accuracy"
  | "evasion"
  | "statusPower"
  | "statusResist"
  | "battleEnergy";

export type BattleStats = Record<BattleStatKey, number>;

export type BattleMoveSourceType = "species" | "universal" | "inherited" | "manual" | "event";
export type BattleMoveCategory = "physical" | "special" | "support" | "status" | "healing";
export type BattleTargetType = "self" | "single_enemy" | "all_enemies" | "single_ally" | "all_allies" | "field";
export type BattleEffectTarget = "self" | "target" | "allies" | "enemies" | "field";

export type BattleStatusId =
  | "bleed"
  | "stun"
  | "guarded"
  | "inspired"
  | "marked"
  | "exhausted"
  | "weakened"
  | "slowed";

export type BattleMoveEffectType =
  | "damage"
  | "guard"
  | "heal"
  | "restore_battle_energy"
  | "apply_status"
  | "cleanse_status"
  | "buff_stat"
  | "debuff_stat"
  | "mark"
  | "taunt";

export type BattleMoveEffect = {
  type: BattleMoveEffectType;
  target?: BattleEffectTarget;
  stat?: BattleStatKey;
  status?: BattleStatusId;
  amount?: number;
  chance?: number;
  duration?: number;
  note?: string;
};

export type BattleLearnRequirements = {
  speciesIds?: SpeciesId[];
  familyTags?: CreatureFamily[];
  bodyTags?: BattleTag[];
  temperamentTags?: BattleTag[];
  roleTags?: BattleTag[];
  requiredAnyTags?: BattleTag[];
  blockedSpeciesIds?: SpeciesId[];
};

export type BattleMove = {
  id: BattleMoveId;
  name: string;
  description: string;
  sourceType: BattleMoveSourceType;
  category: BattleMoveCategory;
  targetType: BattleTargetType;
  power: number;
  accuracy: number;
  battleEnergyCost: number;
  cooldown: number;
  priority: number;
  tags: BattleTag[];
  effects: BattleMoveEffect[];
  inheritable: boolean;
  rarity?: "common" | "uncommon" | "rare" | "signature" | "event";
  learnRequirements?: BattleLearnRequirements;
};

export type BattleSpeciesProfile = {
  speciesId: SpeciesId;
  family: CreatureFamily;
  roleTags: BattleTag[];
  bodyTags: BattleTag[];
  temperamentTags: BattleTag[];
  speciesTags: BattleTag[];
  affinityMoveTags: BattleTag[];
  vulnerabilityTags: BattleTag[];
  resistanceTags: BattleTag[];
  signatureMoveId: BattleMoveId;
  speciesMoveIds: BattleMoveId[];
  universalCompatibilityMoveIds: BattleMoveId[];
  defaultLearnedMoveIds: BattleMoveId[];
  defaultEquippedMoveIds: BattleMoveId[];
  battleStatBonuses: Partial<BattleStats>;
};

export type BattleMoveLoadout = {
  learnedMoveIds: BattleMoveId[];
  equippedMoveIds: BattleMoveId[];
};

export type ParentBattleMoveSource = {
  learnedMoveIds: BattleMoveId[];
  equippedMoveIds: BattleMoveId[];
};

export type BattleMoveInheritanceCandidate = {
  moveId: BattleMoveId;
  moveName: string;
  baseChance: number;
  finalChance: number;
  knownByBothParents: boolean;
  knownAsEquippedMove: boolean;
  rarityPenalty: number;
  compatibilityBonus: number;
  reasons: string[];
};

export type BattleDamagePreview = {
  baseDamage: number;
  modifierTotal: number;
  finalDamage: number;
  notes: string[];
};
