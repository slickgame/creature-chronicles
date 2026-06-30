import type { CreatureFamily } from "@/types/creature";
import type { CreatureId, SpeciesId } from "@/types/ids";

export type BattleMoveId = string;
export type BattleAbilityId = string;
export type BattleTag = string;
export type BattleCombatantId = string;
export type BattleId = string;
export type BattleSideId = "player" | "enemy";
export type BattleOutcome = "ongoing" | "player_won" | "enemy_won" | "draw";

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
  speciesIds?: readonly SpeciesId[];
  familyTags?: readonly CreatureFamily[];
  bodyTags?: readonly BattleTag[];
  temperamentTags?: readonly BattleTag[];
  roleTags?: readonly BattleTag[];
  requiredAnyTags?: readonly BattleTag[];
  blockedSpeciesIds?: readonly SpeciesId[];
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
  tags: readonly BattleTag[];
  effects: readonly BattleMoveEffect[];
  inheritable: boolean;
  rarity?: "common" | "uncommon" | "rare" | "signature" | "event";
  learnRequirements?: BattleLearnRequirements;
};

export type BattleSpeciesProfile = {
  speciesId: SpeciesId;
  family: CreatureFamily;
  roleTags: readonly BattleTag[];
  bodyTags: readonly BattleTag[];
  temperamentTags: readonly BattleTag[];
  speciesTags: readonly BattleTag[];
  affinityMoveTags: readonly BattleTag[];
  vulnerabilityTags: readonly BattleTag[];
  resistanceTags: readonly BattleTag[];
  signatureMoveId: BattleMoveId;
  speciesMoveIds: readonly BattleMoveId[];
  universalCompatibilityMoveIds: readonly BattleMoveId[];
  defaultLearnedMoveIds: readonly BattleMoveId[];
  defaultEquippedMoveIds: readonly BattleMoveId[];
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

export type BattleStatusStack = {
  status: BattleStatusId;
  duration: number;
  amount?: number;
  sourceCombatantId?: BattleCombatantId;
};

export type BattleCooldowns = Partial<Record<BattleMoveId, number>>;

export type BattleCombatant = {
  battleCombatantId: BattleCombatantId;
  sourceCreatureId: CreatureId;
  sideId: BattleSideId;
  slotIndex: number;
  name: string;
  speciesId: SpeciesId;
  level: number;
  battleStats: BattleStats;
  loadout: BattleMoveLoadout;
  currentHp: number;
  maxHp: number;
  currentBattleEnergy: number;
  maxBattleEnergy: number;
  cooldowns: BattleCooldowns;
  statuses: BattleStatusStack[];
  isFainted: boolean;
};

export type BattleTeam = {
  sideId: BattleSideId;
  name: string;
  combatantIds: BattleCombatantId[];
};

export type BattleAction = {
  actorId: BattleCombatantId;
  moveId: BattleMoveId;
  targetIds: BattleCombatantId[];
};

export type BattleResolvedAction = {
  actorId: BattleCombatantId;
  actorName: string;
  moveId: BattleMoveId;
  moveName: string;
  targetIds: BattleCombatantId[];
  targetNames: string[];
  turnScore: number;
  success: boolean;
  log: string[];
};

export type BattleRoundResult = {
  roundNumber: number;
  actions: BattleResolvedAction[];
  log: string[];
  outcome: BattleOutcome;
};

export type BattleState = {
  battleId: BattleId;
  roundNumber: number;
  outcome: BattleOutcome;
  teams: Record<BattleSideId, BattleTeam>;
  combatants: Record<BattleCombatantId, BattleCombatant>;
  log: string[];
};
