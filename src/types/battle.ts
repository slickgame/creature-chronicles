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

export type BattleMoveSourceType =
  | "species"
  | "variant"
  | "universal"
  | "inherited"
  | "combination"
  | "manual"
  | "talent"
  | "coliseum"
  | "story"
  | "event";
export type BattleMoveCategory = "physical" | "special" | "support" | "status" | "healing";
export type BattleTargetType = "self" | "single_enemy" | "all_enemies" | "single_ally" | "all_allies" | "field";
export type BattleEffectTarget = "self" | "target" | "allies" | "enemies" | "field";
export type BattleMoveScalingStat = "physicalPower" | "specialPower" | "statusPower" | "none";
export type BattleMoveDefenseStat = "defense" | "resistance" | "statusResist" | "none";
export type BattleMoveAiHint =
  | "damage"
  | "finisher"
  | "heal_lowest"
  | "guard_self"
  | "guard_ally"
  | "buff_team"
  | "debuff_threat"
  | "restore_energy"
  | "cleanse"
  | "taunt"
  | "setup";

export type BattleStatusId =
  | "bleed"
  | "stun"
  | "guarded"
  | "inspired"
  | "marked"
  | "taunted"
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
  maxStacks?: number;
  note?: string;
};

export type BattleLearnRequirements = {
  speciesIds?: readonly SpeciesId[];
  familyTags?: readonly CreatureFamily[];
  bodyTags?: readonly BattleTag[];
  temperamentTags?: readonly BattleTag[];
  roleTags?: readonly BattleTag[];
  requiredAnyTags?: readonly BattleTag[];
  requiredAllTags?: readonly BattleTag[];
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
  scalingStat?: BattleMoveScalingStat;
  resistedBy?: BattleMoveDefenseStat;
  aiHints?: readonly BattleMoveAiHint[];
  definitionVersion?: number;
  combinationRecipeIds?: readonly string[];
};

export type BattleMoveCombinationRecipe = {
  recipeId: string;
  name: string;
  description: string;
  outputMoveId: BattleMoveId;
  parentAMoveIds: readonly BattleMoveId[];
  parentBMoveIds: readonly BattleMoveId[];
  symmetric: boolean;
  baseChance: number;
  requiredChildSpeciesIds?: readonly SpeciesId[];
  requiredChildFamilyTags?: readonly CreatureFamily[];
  requiredChildTags?: readonly BattleTag[];
  blockedChildSpeciesIds?: readonly SpeciesId[];
  notes: readonly string[];
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
  version?: number;
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

export type BattleMoveCombinationCandidate = {
  recipeId: string;
  recipeName: string;
  outputMoveId: BattleMoveId;
  outputMoveName: string;
  chance: number;
  parentAContributingMoveId: BattleMoveId;
  parentBContributingMoveId: BattleMoveId;
  contributingMoveNames: string[];
  reasons: string[];
};

export type BattleMoveInheritanceSource = "giver" | "receiver" | "both" | "combination";

export type BattleMoveInheritanceRoll = {
  moveId: BattleMoveId;
  moveName: string;
  source: BattleMoveInheritanceSource;
  chance: number;
  roll: number;
  inherited: boolean;
  recipeId?: string;
  contributingMoveIds: BattleMoveId[];
  reasons: string[];
};

export type BattleMoveInheritanceResult = {
  version: number;
  childSpeciesId: SpeciesId;
  giverCreatureId?: CreatureId;
  receiverCreatureId?: CreatureId;
  giverMoveSnapshot: ParentBattleMoveSource;
  receiverMoveSnapshot: ParentBattleMoveSource;
  directInheritedMoveIds: BattleMoveId[];
  combinationMoveIds: BattleMoveId[];
  projectedLoadout: BattleMoveLoadout;
  rolls: BattleMoveInheritanceRoll[];
  notes: string[];
};

export type BattleMoveInheritancePreview = {
  childSpeciesId?: SpeciesId;
  canProduceOffspring: boolean;
  reason: string;
  contextBonus: number;
  directCandidates: BattleMoveInheritanceCandidate[];
  combinationCandidates: BattleMoveCombinationCandidate[];
};

export type BattleDamagePreview = {
  baseDamage: number;
  modifierTotal: number;
  finalDamage: number;
  notes: string[];
};

export type BattleDamageModifierStep = {
  kind: "affinity" | "vulnerability" | "resistance" | "guarded" | "marked" | "pursuit-exhausted" |
    "pursuit-slowed" | "finisher" | "guard-break" | "spread" | "cap" | "minimum";
  label: string;
  operation: "additive" | "multiply" | "limit";
  /** Signed percentage. Additive steps are relative to the original species multiplier of 1. */
  percent?: number;
  /** Running estimates rounded for display. The engine does not round between modifiers. */
  damageBefore: number;
  damageAfter: number;
};

export type BattleDamageBreakdown = {
  baseDamage: number;
  modifiers: BattleDamageModifierStep[];
  modifierTotal: number;
  /** On-hit damage before limiting it to the target's remaining HP. */
  finalDamage: number;
  hpLost: number;
};

export type BattleHitChanceModifier = {
  kind: "accuracy" | "evasion" | "precision" | "status-matchup" | "bounds";
  label: string;
  /** Signed percentage points applied to the running hit chance. */
  points: number;
  before: number;
  after: number;
};

export type BattleHitChanceBreakdown = {
  baseAccuracy: number;
  attackerAccuracy: number;
  targetEvasion: number;
  modifiers: BattleHitChanceModifier[];
  unclampedChance: number;
  hitChance: number;
};

export type BattleEffectChanceBreakdown = {
  mode: "hostile" | "friendly" | "guaranteed";
  baseChance: number;
  effectChance: number;
  unclampedChance: number;
  bounds?: { min: number; max: number };
  matchup?: {
    statusPower: number;
    statusResist: number;
    /** The rounded adjustment in percentage points before its own cap. */
    rawAdjustment: number;
    adjustment: number;
    min: number;
    max: number;
  };
};

export type BattleHealingPreview = {
  baseHealing: number;
  scalingBonus: number;
  targetModifier: number;
  finalHealing: number;
  notes: string[];
};

export type BattleStatusStack = {
  status: BattleStatusId;
  duration: number;
  amount?: number;
  stat?: BattleStatKey;
  sourceCombatantId?: BattleCombatantId;
  stacks?: number;
  maxStacks?: number;
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

export type BattleActionValidationCode =
  | "battle-complete"
  | "unknown-actor"
  | "actor-fainted"
  | "unknown-move"
  | "move-not-equipped"
  | "insufficient-energy"
  | "move-on-cooldown"
  | "missing-target"
  | "invalid-target"
  | "taunt-target-enforced";

export type BattleActionValidationIssue = {
  code: BattleActionValidationCode;
  message: string;
};

export type BattleActionValidationResult = {
  valid: boolean;
  actorId: BattleCombatantId;
  moveId: BattleMoveId;
  legalTargetIds: BattleCombatantId[];
  normalizedTargetIds: BattleCombatantId[];
  issues: BattleActionValidationIssue[];
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
  skipReason?: "stun";
  log: string[];
  usedFallback?: boolean;
  validationIssues?: string[];
  hitTargetIds?: BattleCombatantId[];
  missedTargetIds?: BattleCombatantId[];
};

export type BattleRoundResult = {
  roundNumber: number;
  actions: BattleResolvedAction[];
  log: string[];
  outcome: BattleOutcome;
};

export type BattleOrderShiftReason =
  | { kind: "passed" | "passed-by"; actorId: BattleCombatantId; tied?: true }
  | {
    kind: "speed-effect";
    status: BattleStatusId;
    result: "applied" | "changed" | "cleared" | "wore-off" | "stack-wore-off";
    /** Move log entries for the verified modifier changes, in resolution order. */
    sourceMoveLogIndexes?: readonly number[];
    /** Net surviving modifier change attributed to each verified move log entry. */
    sourceMoveSpeedDeltas?: Readonly<Partial<Record<number, number>>>;
    /** Retained for records made before multiple sources were supported. */
    sourceMoveLogIndex?: number;
  };

export type BattleOrderShiftLogEntry = {
  logIndex: number;
  roundNumber: number;
  /** One-based positions among creatures present in both rounds. */
  moves: readonly {
    actorId: BattleCombatantId;
    from: number;
    to: number;
    speed?: { before: number; after: number };
    reasons?: readonly BattleOrderShiftReason[];
  }[];
};

export type BattleRoundLogBoundary = {
  roundNumber: number;
  logIndex: number;
};

export type BattleLogEventCategory = "knockouts" | "status-changes" | "order-shifts";

export type BattleMoveLogStatus = {
  status: BattleStatusId;
  result: "applied" | "stacked" | "refreshed" | "failed" | "cleared";
  duration?: number;
  stacks?: number;
  stat?: BattleStatKey;
  amount?: number;
  attemptedClear?: true;
  /** This status's contribution to Speed before and after a resolved move effect. */
  speedModifierChange?: { before: number; after: number };
};

export type BattleMoveLogTarget = {
  targetId: BattleCombatantId;
  targetName: string;
  /** Only hostile targets roll for accuracy. */
  hit?: boolean;
  hpDelta: number;
  battleEnergyDelta: number;
  hpWasFull?: true;
  battleEnergyWasFull?: true;
  knockedOut: boolean;
  statuses: readonly BattleMoveLogStatus[];
  logIndexes: readonly number[];
};

export type BattleMoveLogGroup = {
  /** The move-use line and the exclusive end of its effects in the original log. */
  logIndex: number;
  endLogIndex: number;
  roundNumber: number;
  actorId: BattleCombatantId;
  actorName: string;
  moveId: BattleMoveId;
  moveName: string;
  targets: readonly BattleMoveLogTarget[];
};

export type BattleState = {
  battleId: BattleId;
  roundNumber: number;
  outcome: BattleOutcome;
  teams: Record<BattleSideId, BattleTeam>;
  combatants: Record<BattleCombatantId, BattleCombatant>;
  log: string[];
  /** Categories keyed to the original log index, independent of round and filter selection. */
  logEventCategories?: Readonly<Partial<Record<number, Exclude<BattleLogEventCategory, "order-shifts">>>>;
  roundLogBoundaries?: readonly BattleRoundLogBoundary[];
  orderShiftLog?: readonly BattleOrderShiftLogEntry[];
  moveLog?: readonly BattleMoveLogGroup[];
};

export type BattleRoundEndEffect =
  | { kind: "bleed"; stacks: number; hpLost: number }
  | { kind: "expiry"; statuses: BattleStatusId[] }
  | { kind: "energy"; before: number; after: number };

export type BattleGuardImpact = "held" | "broken";

/** Immutable, ID-addressed display state after one resolved effect. Never stored in saves. */
export type BattlePlaybackFrame = {
  state: BattleState;
  kind: "attack" | "damage" | "heal" | "energy" | "status" | "miss" | "knockout";
  actorId?: BattleCombatantId;
  targetIds: BattleCombatantId[];
  moveId?: BattleMoveId;
  skipReason?: BattleResolvedAction["skipReason"];
  /** The state of an existing Guarded shield after a damaging move lands. */
  guardImpact?: BattleGuardImpact;
  statusOutcome?: {
    status: BattleStatusId;
    result: "applied" | "stacked" | "refreshed" | "failed" | "cleared";
  };
  roundEndEffect?: BattleRoundEndEffect;
  label: string;
};
