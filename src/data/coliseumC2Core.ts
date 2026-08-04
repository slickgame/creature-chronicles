import {
  BATTLE_OUTFITTER_ITEMS,
  getBattleOutfitterStock,
} from "@/data/battleOutfitter";
import { getBattleMove } from "@/data/battleMoves";
import { getColiseumProgress as getLegacyColiseumProgress } from "@/data/coliseum";
import {
  buildStats,
  getBaseMaxHearts,
  getHabitatIdForFamily,
  getSpeciesDefinition,
  getVariantDefinition,
} from "@/data/creatures";
import {
  applyCreatureLevelGrowth,
  getProjectedMaxEnergyForCreature,
} from "@/data/levelGrowth";
import {
  getTalentDefinition,
  normalizeTalentInstances,
} from "@/data/talents/talentDefinitions";
import { resolveTalentEffects } from "@/data/talents/talentEngine";
import type {
  BattleMoveId,
  BattleOutcome,
  BattleRoundResult,
  BattleState,
  BattleStatKey,
  BattleStats,
} from "@/types/battle";
import type { BattleAiDifficulty } from "@/types/battleAi";
import type {
  AbilityGrade,
  CreatureAbility,
  CreatureRecord,
  CreatureStatKey,
  StatGrades,
} from "@/types/creature";
import type { CreatureId, SaveId, SpeciesId, VariantId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export const COLISEUM_C2_PROGRESS_FLAG = "coliseumProgressV2";
export const COLISEUM_C2_PROGRESS_VERSION = 2;
export const COLISEUM_C2_HISTORY_LIMIT = 40;
export const COLISEUM_C2_RESULT_LIMIT = 80;

export type ColiseumC2DivisionId = "novice" | "bronze" | "silver" | "crown";
export type ColiseumC2EncounterId =
  | "novice_opening_scrimmage"
  | "novice_support_drill"
  | "novice_echo_trial"
  | "bronze_breaker_squad"
  | "bronze_medic_line"
  | "bronze_pack_clash"
  | "silver_status_web"
  | "silver_endurance_cell"
  | "silver_guard_circuit"
  | "crown_opening_assault"
  | "crown_control_matrix"
  | "crown_tactical_finale";

export type ColiseumC2Reward = {
  gold: number;
  guildPoints: number;
  materials?: number;
  itemId?: string;
  itemQuantity?: number;
};

export type ColiseumC2RewardPoolEntry = {
  weight: number;
  reward: ColiseumC2Reward;
  label: string;
};

export type ColiseumEnemyEquipment = {
  name: string;
  bonuses: Partial<BattleStats>;
};

export type ColiseumEnemySlotDefinition = {
  slotId: string;
  nickname: string;
  variantId: VariantId;
  level: number;
  statGrades: StatGrades;
  talentGrades: Array<{ talentId: string; grade: AbilityGrade }>;
  learnedMoveIds: BattleMoveId[];
  equippedMoveIds: BattleMoveId[];
  equipment?: ColiseumEnemyEquipment;
  roleLabel: string;
};

export type ColiseumC2DivisionDefinition = {
  divisionId: ColiseumC2DivisionId;
  name: string;
  subtitle: string;
  description: string;
  order: number;
};

export type ColiseumC2EncounterDefinition = {
  encounterId: ColiseumC2EncounterId;
  divisionId: ColiseumC2DivisionId;
  name: string;
  opponentName: string;
  description: string;
  strategyLabel: string;
  aiDifficulty: BattleAiDifficulty;
  recommendedLevel: number;
  prerequisiteEncounterIds: ColiseumC2EncounterId[];
  firstClearReward: ColiseumC2Reward;
  repeatRewardPool: ColiseumC2RewardPoolEntry[];
  baseCombatXp: number;
  enemyTeam: readonly [ColiseumEnemySlotDefinition, ColiseumEnemySlotDefinition, ColiseumEnemySlotDefinition];
};

export type ColiseumEncounterRecordV2 = {
  encounterId: ColiseumC2EncounterId;
  attempts: number;
  wins: number;
  losses: number;
  draws: number;
  bestWinRounds?: number;
  lastOutcome?: BattleOutcome;
  lastRoundCount?: number;
  lastCompletedDayNumber?: number;
  lastTeamCreatureIds: CreatureId[];
};

export type ColiseumCreatureBattleRecord = {
  creatureId: CreatureId;
  battles: number;
  wins: number;
  losses: number;
  draws: number;
  totalCombatXp: number;
  damageDealt: number;
  healingDone: number;
  statusesApplied: number;
  alliesProtected: number;
  knockouts: number;
  misses: number;
  highestDivisionOrder: number;
  lastEncounterId?: ColiseumC2EncounterId;
  lastOutcome?: BattleOutcome;
  lastBattleDayNumber?: number;
};

export type ColiseumCombatPerformance = {
  creatureId: CreatureId;
  actionsTaken: number;
  damageDealt: number;
  healingDone: number;
  statusesApplied: number;
  alliesProtected: number;
  knockouts: number;
  misses: number;
};

export type ColiseumCombatPerformanceMap = Record<string, ColiseumCombatPerformance>;

export type ColiseumCreatureXpSummary = {
  creatureId: CreatureId;
  creatureName: string;
  xpGained: number;
  levelBefore: number;
  levelAfter: number;
  xpBefore: number;
  xpAfter: number;
  xpToNextAfter: number;
  statGrowth: Partial<Record<CreatureStatKey, number>>;
  notes: string[];
};

export type ColiseumHistoryEntryV2 = {
  resultId: string;
  encounterId: ColiseumC2EncounterId;
  encounterName: string;
  divisionId: ColiseumC2DivisionId;
  outcome: BattleOutcome;
  roundCount: number;
  completedAtDayNumber: number;
  teamCreatureIds: CreatureId[];
  reward: ColiseumC2Reward;
  firstClear: boolean;
  xpAwards: Array<{ creatureId: CreatureId; xp: number; levelsGained: number }>;
};

export type ColiseumProgressStateV2 = {
  version: number;
  completedEncounterIds: ColiseumC2EncounterId[];
  claimedFirstClearEncounterIds: ColiseumC2EncounterId[];
  records: Partial<Record<ColiseumC2EncounterId, ColiseumEncounterRecordV2>>;
  creatureRecords: Record<string, ColiseumCreatureBattleRecord>;
  history: ColiseumHistoryEntryV2[];
  processedResultIds: string[];
  totalAttempts: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  migratedFromC1: boolean;
};

export type ColiseumC2Result = {
  save: GameSave;
  progress: ColiseumProgressStateV2;
  record: ColiseumEncounterRecordV2;
  reward: ColiseumC2Reward;
  firstClear: boolean;
  xpSummaries: ColiseumCreatureXpSummary[];
  message: string;
  duplicate: boolean;
};

const grades = (
  STR: StatGrades["STR"],
  DEX: StatGrades["DEX"],
  STA: StatGrades["STA"],
  CHA: StatGrades["CHA"],
  WIL: StatGrades["WIL"],
  FER: StatGrades["FER"],
): StatGrades => ({ STR, DEX, STA, CHA, WIL, FER });

const rewardPool = (
  gold: number,
  guildPoints: number,
  materials: number,
  itemId?: string,
): ColiseumC2RewardPoolEntry[] => [
  {
    weight: 55,
    label: "Standard purse",
    reward: { gold, guildPoints },
  },
  {
    weight: 30,
    label: "Material purse",
    reward: { gold: Math.round(gold * 0.85), guildPoints, materials },
  },
  {
    weight: 15,
    label: "Outfitter purse",
    reward: {
      gold: Math.round(gold * 0.7),
      guildPoints,
      ...(itemId ? { itemId, itemQuantity: 1 } : { materials: materials + 2 }),
    },
  },
];

const slot = (
  slotId: string,
  nickname: string,
  variantId: string,
  level: number,
  statGrades: StatGrades,
  talentGrades: Array<{ talentId: string; grade: AbilityGrade }>,
  learnedMoveIds: BattleMoveId[],
  equippedMoveIds: BattleMoveId[],
  roleLabel: string,
  equipment?: ColiseumEnemyEquipment,
): ColiseumEnemySlotDefinition => ({
  slotId,
  nickname,
  variantId: variantId as VariantId,
  level,
  statGrades,
  talentGrades,
  learnedMoveIds,
  equippedMoveIds,
  roleLabel,
  equipment,
});

const OFFENSE_WRAP: ColiseumEnemyEquipment = {
  name: "Arena Striking Wraps",
  bonuses: { physicalPower: 5, specialPower: 3, accuracy: 2 },
};
const GUARD_COLLAR: ColiseumEnemyEquipment = {
  name: "Arena Guard Collar",
  bonuses: { maxHp: 10, defense: 4, resistance: 3 },
};
const FOCUS_LENS: ColiseumEnemyEquipment = {
  name: "Arena Focus Lens",
  bonuses: { specialPower: 4, accuracy: 3, statusPower: 4 },
};
const MEDIC_SATCHEL: ColiseumEnemyEquipment = {
  name: "Arena Medic Satchel",
  bonuses: { statusPower: 5, statusResist: 3, battleEnergy: 6 },
};
const CHAMPION_HARNESS: ColiseumEnemyEquipment = {
  name: "Champion Harness",
  bonuses: { maxHp: 14, physicalPower: 4, specialPower: 4, defense: 3, resistance: 3, accuracy: 2 },
};

export const COLISEUM_C2_DIVISIONS: readonly ColiseumC2DivisionDefinition[] = [
  { divisionId: "novice", name: "Novice Division", subtitle: "Fundamentals", description: "Three authored teams teach targeting, support timing, and balanced formation play.", order: 1 },
  { divisionId: "bronze", name: "Bronze Division", subtitle: "Role Pressure", description: "Specialized bruisers and healers punish teams that ignore enemy roles.", order: 2 },
  { divisionId: "silver", name: "Silver Division", subtitle: "Control & Endurance", description: "Status pressure and durable formations demand cleansing, focus fire, and resource planning.", order: 3 },
  { divisionId: "crown", name: "Crown Division", subtitle: "Champion Circuit", description: "High-grade Talents, tuned equipment, and Champion AI form the current PvE capstone.", order: 4 },
] as const;

export const COLISEUM_C2_ENCOUNTERS: readonly ColiseumC2EncounterDefinition[] = [
  {
    encounterId: "novice_opening_scrimmage",
    divisionId: "novice",
    name: "Opening Scrimmage",
    opponentName: "The Hearthside Three",
    description: "A balanced first authored team with one attacker, one guard, and one support creature.",
    strategyLabel: "Balanced formation",
    aiDifficulty: "basic",
    recommendedLevel: 1,
    prerequisiteEncounterIds: [],
    firstClearReward: { gold: 90, guildPoints: 3, materials: 2 },
    repeatRewardPool: rewardPool(28, 1, 1),
    baseCombatXp: 18,
    enemyTeam: [
      slot("moss", "Moss", "variant_base_feline", 1, grades("C", "B", "C", "C", "C", "D"), [{ talentId: "bright_eyes", grade: "C" }], ["strike", "defend", "pounce", "evasive_step"], ["strike", "pounce", "evasive_step", "defend"], "Skirmisher"),
      slot("bramble", "Bramble", "variant_cow", 1, grades("C", "D", "B", "C", "C", "D"), [{ talentId: "pasture_calm", grade: "C" }], ["strike", "defend", "heavy_shove", "stubborn_guard"], ["strike", "heavy_shove", "stubborn_guard", "defend"], "Tank"),
      slot("lilt", "Lilt", "variant_bunny", 1, grades("D", "B", "C", "B", "C", "B"), [{ talentId: "meadow_nest", grade: "C" }], ["strike", "defend", "quick_kick", "nesting_comfort", "first_aid"], ["strike", "quick_kick", "nesting_comfort", "first_aid"], "Support"),
    ],
  },
  {
    encounterId: "novice_support_drill",
    divisionId: "novice",
    name: "Support Drill",
    opponentName: "The Kindred Cadets",
    description: "A healing-and-guard team that demonstrates why support targets cannot be ignored.",
    strategyLabel: "Guard and recovery",
    aiDifficulty: "basic",
    recommendedLevel: 2,
    prerequisiteEncounterIds: ["novice_opening_scrimmage"],
    firstClearReward: { gold: 125, guildPoints: 4, itemId: "field_tonic", itemQuantity: 1 },
    repeatRewardPool: rewardPool(36, 1, 1, "field_tonic"),
    baseCombatXp: 22,
    enemyTeam: [
      slot("rookie_guard", "Cedar", "variant_base_canine", 2, grades("C", "C", "B", "C", "B", "D"), [{ talentId: "gentle_guard", grade: "C" }], ["strike", "defend", "bite_down", "protective_lunge", "pack_howl"], ["strike", "protective_lunge", "pack_howl", "defend"], "Protector", GUARD_COLLAR),
      slot("rookie_medic", "Dove", "variant_dream_lop", 2, grades("D", "B", "C", "B", "B", "B"), [{ talentId: "soft_lullaby", grade: "C" }], ["strike", "nesting_comfort", "soothing_pulse", "mend_wounds", "energy_link"], ["strike", "soothing_pulse", "mend_wounds", "energy_link"], "Healer", MEDIC_SATCHEL),
      slot("rookie_focus", "Rune", "variant_base_feline", 2, grades("C", "B", "C", "B", "B", "D"), [{ talentId: "soft_focus", grade: "C" }], ["strike", "focused_stare", "shadow_feint", "will_bolt", "defend"], ["strike", "focused_stare", "will_bolt", "defend"], "Controller", FOCUS_LENS),
    ],
  },
  {
    encounterId: "novice_echo_trial",
    divisionId: "novice",
    name: "Novice Division Champion",
    opponentName: "Captain Elowen's Trial Team",
    description: "The Novice champion combines pressure, guarding, and reliable recovery.",
    strategyLabel: "Novice champion balance",
    aiDifficulty: "tactical",
    recommendedLevel: 3,
    prerequisiteEncounterIds: ["novice_support_drill"],
    firstClearReward: { gold: 180, guildPoints: 6, itemId: "field_tonic", itemQuantity: 1 },
    repeatRewardPool: rewardPool(45, 1, 2, "field_tonic"),
    baseCombatXp: 28,
    enemyTeam: [
      slot("novice_ace", "Ash", "variant_tiger", 3, grades("B", "B", "C", "C", "C", "D"), [{ talentId: "tiger_instinct", grade: "B" }], ["strike", "pounce", "razor_swipe", "shadow_feint", "focused_stare"], ["strike", "pounce", "razor_swipe", "shadow_feint"], "Striker", OFFENSE_WRAP),
      slot("novice_wall", "Loam", "variant_cow", 3, grades("B", "D", "B", "C", "B", "D"), [{ talentId: "stubborn_frame", grade: "B" }], ["strike", "heavy_shove", "stubborn_guard", "calming_presence", "taunt"], ["strike", "stubborn_guard", "calming_presence", "taunt"], "Tank", GUARD_COLLAR),
      slot("novice_support", "Fable", "variant_unicorn", 3, grades("D", "C", "C", "A", "B", "C"), [{ talentId: "healing_horn", grade: "B" }], ["strike", "calming_neigh", "mend_wounds", "energy_link", "rally"], ["strike", "mend_wounds", "energy_link", "rally"], "Healer", MEDIC_SATCHEL),
    ],
  },
  {
    encounterId: "bronze_breaker_squad",
    divisionId: "bronze",
    name: "Breaker Squad",
    opponentName: "The Bronze Breakers",
    description: "A direct-damage formation built to punish slow setup and fragile supports.",
    strategyLabel: "Burst and guard break",
    aiDifficulty: "tactical",
    recommendedLevel: 4,
    prerequisiteEncounterIds: ["novice_echo_trial"],
    firstClearReward: { gold: 220, guildPoints: 8, materials: 4 },
    repeatRewardPool: rewardPool(58, 2, 2),
    baseCombatXp: 32,
    enemyTeam: [
      slot("bronze_maul", "Maul", "variant_minotaur", 4, grades("A", "D", "B", "D", "B", "D"), [{ talentId: "iron_shoulders", grade: "B" }], ["strike", "heavy_shove", "horn_check", "guard_break", "taunt"], ["strike", "heavy_shove", "horn_check", "guard_break"], "Bruiser", OFFENSE_WRAP),
      slot("bronze_hound", "Cinder", "variant_hellhound", 4, grades("B", "C", "B", "D", "B", "D"), [{ talentId: "ember_blood", grade: "B" }], ["strike", "bite_down", "chase", "resonant_bark", "guard_break"], ["strike", "bite_down", "chase", "guard_break"], "Pursuer", OFFENSE_WRAP),
      slot("bronze_charge", "Tempest", "variant_horse", 4, grades("B", "C", "B", "C", "C", "D"), [{ talentId: "strong_back", grade: "B" }], ["strike", "hoof_strike", "field_charge", "thunder_tread", "steady_trot"], ["strike", "hoof_strike", "field_charge", "thunder_tread"], "Striker", OFFENSE_WRAP),
    ],
  },
  {
    encounterId: "bronze_medic_line",
    divisionId: "bronze",
    name: "Medic Line",
    opponentName: "The Bronze Ward",
    description: "A durable healer core forces focused targeting and careful cooldown management.",
    strategyLabel: "Sustain formation",
    aiDifficulty: "tactical",
    recommendedLevel: 5,
    prerequisiteEncounterIds: ["bronze_breaker_squad"],
    firstClearReward: { gold: 260, guildPoints: 9, itemId: "focus_manual", itemQuantity: 1 },
    repeatRewardPool: rewardPool(66, 2, 3, "field_tonic"),
    baseCombatXp: 36,
    enemyTeam: [
      slot("bronze_anchor", "Granite", "variant_direwolf", 5, grades("B", "C", "A", "C", "B", "D"), [{ talentId: "pack_anchor", grade: "B" }], ["strike", "protective_lunge", "pack_howl", "resonant_bark", "taunt"], ["strike", "protective_lunge", "pack_howl", "taunt"], "Protector", GUARD_COLLAR),
      slot("bronze_medic", "Solace", "variant_unicorn", 5, grades("D", "C", "C", "A", "A", "C"), [{ talentId: "healing_horn", grade: "A" }], ["strike", "mend_wounds", "calming_neigh", "energy_link", "rally"], ["strike", "mend_wounds", "energy_link", "rally"], "Healer", MEDIC_SATCHEL),
      slot("bronze_control", "Iris", "variant_sphinx", 5, grades("D", "B", "C", "A", "A", "C"), [{ talentId: "ancient_poise", grade: "B" }], ["strike", "focused_stare", "will_bolt", "suppress", "shadow_feint"], ["strike", "focused_stare", "suppress", "will_bolt"], "Controller", FOCUS_LENS),
    ],
  },
  {
    encounterId: "bronze_pack_clash",
    divisionId: "bronze",
    name: "Bronze Division Champion",
    opponentName: "Warden Kael's Pack",
    description: "The Bronze champion uses pack buffs, pursuit attacks, and a guarded frontline.",
    strategyLabel: "Pack coordination",
    aiDifficulty: "tactical",
    recommendedLevel: 6,
    prerequisiteEncounterIds: ["bronze_medic_line"],
    firstClearReward: { gold: 300, guildPoints: 10, itemId: "focus_manual", itemQuantity: 1 },
    repeatRewardPool: rewardPool(75, 2, 3, "focus_manual"),
    baseCombatXp: 42,
    enemyTeam: [
      slot("bronze_alpha", "Varg", "variant_direwolf", 6, grades("A", "C", "A", "C", "A", "D"), [{ talentId: "alpha_bond", grade: "A" }], ["strike", "bite_down", "pack_howl", "protective_lunge", "chase", "resonant_bark"], ["bite_down", "pack_howl", "protective_lunge", "chase"], "Pack Leader", CHAMPION_HARNESS),
      slot("bronze_flanker", "Sable", "variant_tiger", 6, grades("A", "A", "B", "D", "B", "D"), [{ talentId: "apex_pounce", grade: "A" }], ["strike", "pounce", "razor_swipe", "shadow_feint", "predator_pursuit"], ["pounce", "razor_swipe", "shadow_feint", "predator_pursuit"], "Finisher", OFFENSE_WRAP),
      slot("bronze_guard", "Bastion", "variant_minotaur", 6, grades("A", "D", "A", "D", "A", "D"), [{ talentId: "labyrinth_guard", grade: "A" }], ["strike", "stubborn_guard", "heavy_shove", "taunt", "guard_break"], ["stubborn_guard", "heavy_shove", "taunt", "guard_break"], "Tank", GUARD_COLLAR),
    ],
  },
  {
    encounterId: "silver_status_web",
    divisionId: "silver",
    name: "Status Web",
    opponentName: "The Silver Hexweave",
    description: "Marks, slows, and weakening effects punish teams without cleansing or fast pressure.",
    strategyLabel: "Status control",
    aiDifficulty: "tactical",
    recommendedLevel: 7,
    prerequisiteEncounterIds: ["bronze_pack_clash"],
    firstClearReward: { gold: 360, guildPoints: 14, materials: 6 },
    repeatRewardPool: rewardPool(92, 3, 4),
    baseCombatXp: 48,
    enemyTeam: [
      slot("silver_hex", "Nyx", "variant_sphinx", 7, grades("D", "A", "C", "A", "A", "C"), [{ talentId: "royal_gaze", grade: "A" }], ["strike", "focused_stare", "suppress", "will_bolt", "shadow_feint"], ["focused_stare", "suppress", "will_bolt", "shadow_feint"], "Debuffer", FOCUS_LENS),
      slot("silver_pursuit", "Rime", "variant_direwolf", 7, grades("A", "B", "A", "C", "A", "D"), [{ talentId: "winter_coat", grade: "A" }], ["strike", "bite_down", "chase", "predator_pursuit", "pack_howl"], ["bite_down", "chase", "predator_pursuit", "pack_howl"], "Pursuer", OFFENSE_WRAP),
      slot("silver_night", "Umbra", "variant_nightmare", 7, grades("A", "A", "B", "D", "A", "D"), [{ talentId: "dark_gallop", grade: "A" }], ["strike", "hoof_strike", "thunder_tread", "suppress", "field_charge"], ["hoof_strike", "thunder_tread", "suppress", "field_charge"], "Controller", OFFENSE_WRAP),
    ],
  },
  {
    encounterId: "silver_endurance_cell",
    divisionId: "silver",
    name: "Endurance Cell",
    opponentName: "The Silver Bulwark",
    description: "A recovery-heavy wall tests whether the ranch team can sustain pressure across a long match.",
    strategyLabel: "Endurance and recovery",
    aiDifficulty: "tactical",
    recommendedLevel: 8,
    prerequisiteEncounterIds: ["silver_status_web"],
    firstClearReward: { gold: 420, guildPoints: 16, itemId: "team_tactics_kit", itemQuantity: 1 },
    repeatRewardPool: rewardPool(106, 3, 5, "team_tactics_kit"),
    baseCombatXp: 54,
    enemyTeam: [
      slot("silver_wall", "Atlas", "variant_minotaur", 8, grades("A", "D", "A", "D", "A", "D"), [{ talentId: "iron_shoulders", grade: "A" }], ["strike", "stubborn_guard", "taunt", "heavy_shove", "guard_break"], ["stubborn_guard", "taunt", "heavy_shove", "guard_break"], "Main Tank", CHAMPION_HARNESS),
      slot("silver_moon", "Luna", "variant_moon_yak", 8, grades("B", "D", "S", "B", "A", "D"), [{ talentId: "silver_coat", grade: "A" }], ["strike", "unyielding_aura", "calming_presence", "mend_wounds", "energy_link"], ["unyielding_aura", "calming_presence", "mend_wounds", "energy_link"], "Sustain Support", MEDIC_SATCHEL),
      slot("silver_dream", "Nacre", "variant_dream_lop", 8, grades("D", "A", "B", "A", "A", "B"), [{ talentId: "dream_nest", grade: "A" }], ["strike", "soothing_pulse", "mend_wounds", "nesting_comfort", "energy_link"], ["soothing_pulse", "mend_wounds", "nesting_comfort", "energy_link"], "Healer", MEDIC_SATCHEL),
    ],
  },
  {
    encounterId: "silver_guard_circuit",
    divisionId: "silver",
    name: "Silver Division Champion",
    opponentName: "Marshal Serin's Guard Circuit",
    description: "The Silver champion rotates protection, healing, and precision damage through a disciplined formation.",
    strategyLabel: "Rotating guard circuit",
    aiDifficulty: "champion",
    recommendedLevel: 9,
    prerequisiteEncounterIds: ["silver_endurance_cell"],
    firstClearReward: { gold: 480, guildPoints: 18, itemId: "team_tactics_kit", itemQuantity: 1 },
    repeatRewardPool: rewardPool(120, 3, 5, "team_tactics_kit"),
    baseCombatXp: 60,
    enemyTeam: [
      slot("silver_captain", "Serin", "variant_direwolf", 9, grades("A", "B", "S", "B", "A", "D"), [{ talentId: "pack_anchor", grade: "S" }], ["strike", "protective_lunge", "pack_howl", "guardian_chorus", "resonant_bark"], ["protective_lunge", "pack_howl", "guardian_chorus", "resonant_bark"], "Captain", CHAMPION_HARNESS),
      slot("silver_lancer", "Kestrel", "variant_nightmare", 9, grades("A", "A", "A", "D", "S", "D"), [{ talentId: "fearless_bloodline", grade: "A" }], ["strike", "hoof_strike", "field_charge", "thunder_tread", "guard_break"], ["hoof_strike", "field_charge", "thunder_tread", "guard_break"], "Lancer", OFFENSE_WRAP),
      slot("silver_oracle", "Aster", "variant_unicorn", 9, grades("D", "B", "B", "S", "S", "B"), [{ talentId: "radiant_calm", grade: "S" }], ["strike", "mend_wounds", "energy_link", "rally", "calming_neigh"], ["mend_wounds", "energy_link", "rally", "calming_neigh"], "Oracle", MEDIC_SATCHEL),
    ],
  },
  {
    encounterId: "crown_opening_assault",
    divisionId: "crown",
    name: "Crown Opening Assault",
    opponentName: "The Crown Vanguard",
    description: "A high-speed vanguard pressures the ranch team before its strongest cooldowns come online.",
    strategyLabel: "Fast opening pressure",
    aiDifficulty: "champion",
    recommendedLevel: 10,
    prerequisiteEncounterIds: ["silver_guard_circuit"],
    firstClearReward: { gold: 600, guildPoints: 22, materials: 8 },
    repeatRewardPool: rewardPool(145, 4, 6),
    baseCombatXp: 66,
    enemyTeam: [
      slot("crown_blade", "Razor", "variant_tiger", 10, grades("S", "S", "A", "D", "A", "D"), [{ talentId: "tiger_instinct", grade: "S" }], ["strike", "pounce", "razor_swipe", "shadow_feint", "predator_pursuit"], ["pounce", "razor_swipe", "shadow_feint", "predator_pursuit"], "Crown Blade", CHAMPION_HARNESS),
      slot("crown_flame", "Pyre", "variant_hellhound", 10, grades("S", "A", "A", "D", "S", "D"), [{ talentId: "ember_blood", grade: "S" }], ["strike", "bite_down", "chase", "resonant_bark", "guard_break"], ["bite_down", "chase", "resonant_bark", "guard_break"], "Crown Hound", OFFENSE_WRAP),
      slot("crown_dash", "Zephyr", "variant_antlerhare", 10, grades("B", "S", "B", "B", "A", "A"), [{ talentId: "wild_leap", grade: "S" }], ["strike", "quick_kick", "flurry_dash", "evasive_hop", "soothing_pulse"], ["quick_kick", "flurry_dash", "evasive_hop", "soothing_pulse"], "Crown Skirmisher", OFFENSE_WRAP),
    ],
  },
  {
    encounterId: "crown_control_matrix",
    divisionId: "crown",
    name: "Crown Control Matrix",
    opponentName: "The Crown Arbiters",
    description: "Champion AI coordinates marks, weakening effects, cleansing, and recovery around a guarded anchor.",
    strategyLabel: "Advanced control matrix",
    aiDifficulty: "champion",
    recommendedLevel: 11,
    prerequisiteEncounterIds: ["crown_opening_assault"],
    firstClearReward: { gold: 700, guildPoints: 26, itemId: "focus_manual", itemQuantity: 1, materials: 6 },
    repeatRewardPool: rewardPool(170, 5, 7, "focus_manual"),
    baseCombatXp: 74,
    enemyTeam: [
      slot("crown_anchor", "Monolith", "variant_moon_yak", 11, grades("A", "D", "S", "B", "S", "D"), [{ talentId: "silver_coat", grade: "S" }], ["strike", "unyielding_aura", "calming_presence", "taunt", "mend_wounds"], ["unyielding_aura", "calming_presence", "taunt", "mend_wounds"], "Anchor", CHAMPION_HARNESS),
      slot("crown_hex", "Vesper", "variant_sphinx", 11, grades("D", "S", "B", "S", "S", "B"), [{ talentId: "ancient_poise", grade: "S" }], ["strike", "focused_stare", "suppress", "will_bolt", "shadow_feint"], ["focused_stare", "suppress", "will_bolt", "shadow_feint"], "Arbiter", FOCUS_LENS),
      slot("crown_grace", "Halcyon", "variant_unicorn", 11, grades("D", "A", "A", "S", "S", "B"), [{ talentId: "healing_horn", grade: "S" }], ["strike", "mend_wounds", "energy_link", "rally", "calming_neigh"], ["mend_wounds", "energy_link", "rally", "calming_neigh"], "High Healer", MEDIC_SATCHEL),
    ],
  },
  {
    encounterId: "crown_tactical_finale",
    divisionId: "crown",
    name: "Crown Tactical Finale",
    opponentName: "Champion Aurelia's Triad",
    description: "The current Coliseum capstone uses three complementary champions with S-grade specialties and tuned equipment.",
    strategyLabel: "Champion triad",
    aiDifficulty: "champion",
    recommendedLevel: 12,
    prerequisiteEncounterIds: ["crown_control_matrix"],
    firstClearReward: { gold: 800, guildPoints: 30, itemId: "revival_salve", itemQuantity: 1, materials: 10 },
    repeatRewardPool: rewardPool(200, 6, 8, "revival_salve"),
    baseCombatXp: 84,
    enemyTeam: [
      slot("crown_final_tank", "Aurelia", "variant_minotaur", 12, grades("S", "C", "S", "C", "S", "D"), [{ talentId: "labyrinth_guard", grade: "S" }, { talentId: "iron_shoulders", grade: "S" }], ["strike", "stubborn_guard", "heavy_shove", "taunt", "guard_break", "unyielding_aura"], ["stubborn_guard", "heavy_shove", "taunt", "guard_break"], "Champion Tank", CHAMPION_HARNESS),
      slot("crown_final_damage", "Noctis", "variant_nightmare", 12, grades("S", "S", "A", "D", "S", "D"), [{ talentId: "dark_gallop", grade: "S" }, { talentId: "fearless_bloodline", grade: "S" }], ["strike", "hoof_strike", "field_charge", "thunder_tread", "suppress", "guard_break"], ["hoof_strike", "field_charge", "thunder_tread", "suppress"], "Champion Striker", CHAMPION_HARNESS),
      slot("crown_final_support", "Eidra", "variant_dream_lop", 12, grades("D", "S", "A", "S", "S", "S"), [{ talentId: "soft_lullaby", grade: "S" }, { talentId: "dream_nest", grade: "S" }], ["strike", "soothing_pulse", "mend_wounds", "energy_link", "restorative_rhythm", "nesting_comfort"], ["soothing_pulse", "mend_wounds", "energy_link", "restorative_rhythm"], "Champion Healer", CHAMPION_HARNESS),
    ],
  },
] as const;

const ENCOUNTER_IDS = new Set<string>(COLISEUM_C2_ENCOUNTERS.map((encounter) => encounter.encounterId));
const LEGACY_PRELUDES: Partial<Record<ColiseumC2EncounterId, ColiseumC2EncounterId[]>> = {
  novice_echo_trial: ["novice_opening_scrimmage", "novice_support_drill"],
  bronze_pack_clash: ["bronze_breaker_squad", "bronze_medic_line"],
  silver_guard_circuit: ["silver_status_web", "silver_endurance_cell"],
  crown_tactical_finale: ["crown_opening_assault", "crown_control_matrix"],
};

function finiteCount(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function uniqueEncounterIds(values: unknown): ColiseumC2EncounterId[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.filter((value): value is ColiseumC2EncounterId => typeof value === "string" && ENCOUNTER_IDS.has(value))));
}

function createEmptyRecord(encounterId: ColiseumC2EncounterId): ColiseumEncounterRecordV2 {
  return { encounterId, attempts: 0, wins: 0, losses: 0, draws: 0, lastTeamCreatureIds: [] };
}

function normalizeRecord(encounterId: ColiseumC2EncounterId, value: Partial<ColiseumEncounterRecordV2> | undefined): ColiseumEncounterRecordV2 {
  return {
    encounterId,
    attempts: finiteCount(value?.attempts),
    wins: finiteCount(value?.wins),
    losses: finiteCount(value?.losses),
    draws: finiteCount(value?.draws),
    bestWinRounds: typeof value?.bestWinRounds === "number" ? Math.max(1, Math.floor(value.bestWinRounds)) : undefined,
    lastOutcome: value?.lastOutcome === "player_won" || value?.lastOutcome === "enemy_won" || value?.lastOutcome === "draw" ? value.lastOutcome : undefined,
    lastRoundCount: typeof value?.lastRoundCount === "number" ? Math.max(1, Math.floor(value.lastRoundCount)) : undefined,
    lastCompletedDayNumber: typeof value?.lastCompletedDayNumber === "number" ? Math.max(1, Math.floor(value.lastCompletedDayNumber)) : undefined,
    lastTeamCreatureIds: Array.isArray(value?.lastTeamCreatureIds) ? value.lastTeamCreatureIds.filter((id): id is CreatureId => typeof id === "string") : [],
  };
}

function createEmptyCreatureRecord(creatureId: CreatureId): ColiseumCreatureBattleRecord {
  return {
    creatureId,
    battles: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalCombatXp: 0,
    damageDealt: 0,
    healingDone: 0,
    statusesApplied: 0,
    alliesProtected: 0,
    knockouts: 0,
    misses: 0,
    highestDivisionOrder: 0,
  };
}

function normalizeCreatureRecord(creatureId: CreatureId, value?: Partial<ColiseumCreatureBattleRecord>): ColiseumCreatureBattleRecord {
  const empty = createEmptyCreatureRecord(creatureId);
  return {
    ...empty,
    ...value,
    creatureId,
    battles: finiteCount(value?.battles),
    wins: finiteCount(value?.wins),
    losses: finiteCount(value?.losses),
    draws: finiteCount(value?.draws),
    totalCombatXp: finiteCount(value?.totalCombatXp),
    damageDealt: finiteCount(value?.damageDealt),
    healingDone: finiteCount(value?.healingDone),
    statusesApplied: finiteCount(value?.statusesApplied),
    alliesProtected: finiteCount(value?.alliesProtected),
    knockouts: finiteCount(value?.knockouts),
    misses: finiteCount(value?.misses),
    highestDivisionOrder: Math.min(4, finiteCount(value?.highestDivisionOrder)),
  };
}

function createEmptyProgress(): ColiseumProgressStateV2 {
  return {
    version: COLISEUM_C2_PROGRESS_VERSION,
    completedEncounterIds: [],
    claimedFirstClearEncounterIds: [],
    records: {},
    creatureRecords: {},
    history: [],
    processedResultIds: [],
    totalAttempts: 0,
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
    migratedFromC1: false,
  };
}

function migrateLegacyProgress(save: GameSave): ColiseumProgressStateV2 {
  const legacy = getLegacyColiseumProgress(save);
  const next = createEmptyProgress();
  const legacyCompleted = uniqueEncounterIds(legacy.completedEncounterIds);
  const legacyClaimed = uniqueEncounterIds(legacy.claimedFirstClearEncounterIds);
  const completed = new Set<ColiseumC2EncounterId>(legacyCompleted);
  const claimed = new Set<ColiseumC2EncounterId>(legacyClaimed);

  for (const championId of legacyCompleted) {
    for (const preludeId of LEGACY_PRELUDES[championId] ?? []) {
      completed.add(preludeId);
      claimed.add(preludeId);
    }
  }

  for (const encounterId of legacyCompleted) {
    const record = legacy.records[encounterId as keyof typeof legacy.records];
    if (record) next.records[encounterId] = normalizeRecord(encounterId, record as Partial<ColiseumEncounterRecordV2>);
  }

  next.completedEncounterIds = [...completed];
  next.claimedFirstClearEncounterIds = [...claimed];
  next.totalAttempts = finiteCount(legacy.totalAttempts);
  next.totalWins = finiteCount(legacy.totalWins);
  next.totalLosses = finiteCount(legacy.totalLosses);
  next.totalDraws = finiteCount(legacy.totalDraws);
  next.migratedFromC1 = legacy.totalAttempts > 0 || legacyCompleted.length > 0;
  return next;
}

function normalizeProgress(raw: Partial<ColiseumProgressStateV2>): ColiseumProgressStateV2 {
  const records = COLISEUM_C2_ENCOUNTERS.reduce((next, encounter) => {
    const value = raw.records?.[encounter.encounterId];
    if (value) next[encounter.encounterId] = normalizeRecord(encounter.encounterId, value);
    return next;
  }, {} as Partial<Record<ColiseumC2EncounterId, ColiseumEncounterRecordV2>>);
  const creatureRecords = Object.entries(raw.creatureRecords ?? {}).reduce((next, [creatureId, value]) => {
    next[creatureId] = normalizeCreatureRecord(creatureId as CreatureId, value);
    return next;
  }, {} as Record<string, ColiseumCreatureBattleRecord>);
  const history = Array.isArray(raw.history)
    ? raw.history.filter((entry): entry is ColiseumHistoryEntryV2 => Boolean(entry && ENCOUNTER_IDS.has(entry.encounterId))).slice(0, COLISEUM_C2_HISTORY_LIMIT)
    : [];
  return {
    version: COLISEUM_C2_PROGRESS_VERSION,
    completedEncounterIds: uniqueEncounterIds(raw.completedEncounterIds),
    claimedFirstClearEncounterIds: uniqueEncounterIds(raw.claimedFirstClearEncounterIds),
    records,
    creatureRecords,
    history,
    processedResultIds: Array.isArray(raw.processedResultIds) ? raw.processedResultIds.filter((id): id is string => typeof id === "string").slice(0, COLISEUM_C2_RESULT_LIMIT) : [],
    totalAttempts: finiteCount(raw.totalAttempts),
    totalWins: finiteCount(raw.totalWins),
    totalLosses: finiteCount(raw.totalLosses),
    totalDraws: finiteCount(raw.totalDraws),
    migratedFromC1: Boolean(raw.migratedFromC1),
  };
}

export function getColiseumC2Progress(save: GameSave): ColiseumProgressStateV2 {
  const raw = save.flags[COLISEUM_C2_PROGRESS_FLAG];
  if (typeof raw !== "string" || !raw.trim()) return migrateLegacyProgress(save);
  try {
    return normalizeProgress(JSON.parse(raw) as Partial<ColiseumProgressStateV2>);
  } catch {
    return migrateLegacyProgress(save);
  }
}

export function getColiseumC2Encounter(encounterId: string): ColiseumC2EncounterDefinition | null {
  return COLISEUM_C2_ENCOUNTERS.find((encounter) => encounter.encounterId === encounterId) ?? null;
}

export function getColiseumC2Division(divisionId: ColiseumC2DivisionId): ColiseumC2DivisionDefinition {
  const division = COLISEUM_C2_DIVISIONS.find((entry) => entry.divisionId === divisionId);
  if (!division) throw new Error(`Unknown Coliseum division: ${divisionId}`);
  return division;
}

export function getColiseumC2Access(save: GameSave, encounter: ColiseumC2EncounterDefinition): { unlocked: boolean; reason: string } {
  const progress = getColiseumC2Progress(save);
  const missing = encounter.prerequisiteEncounterIds.filter((id) => !progress.completedEncounterIds.includes(id));
  if (!missing.length) return { unlocked: true, reason: "Encounter available." };
  const names = missing.map((id) => getColiseumC2Encounter(id)?.name ?? id).join(", ");
  return { unlocked: false, reason: `Clear ${names} first.` };
}

export function getColiseumC2EncounterRecord(save: GameSave, encounterId: ColiseumC2EncounterId): ColiseumEncounterRecordV2 {
  return normalizeRecord(encounterId, getColiseumC2Progress(save).records[encounterId]);
}

export function getColiseumCreatureBattleRecord(save: GameSave, creatureId: CreatureId): ColiseumCreatureBattleRecord {
  return normalizeCreatureRecord(creatureId, getColiseumC2Progress(save).creatureRecords[String(creatureId)]);
}

export function getColiseumC2HighestDivision(save: GameSave): ColiseumC2DivisionDefinition {
  const progress = getColiseumC2Progress(save);
  const orders = COLISEUM_C2_ENCOUNTERS.filter((encounter) => progress.completedEncounterIds.includes(encounter.encounterId)).map((encounter) => getColiseumC2Division(encounter.divisionId).order);
  const highest = orders.length ? Math.max(...orders) : 1;
  return COLISEUM_C2_DIVISIONS.find((division) => division.order === highest) ?? COLISEUM_C2_DIVISIONS[0];
}

export function getColiseumC2NextEncounter(save: GameSave): ColiseumC2EncounterDefinition | null {
  const progress = getColiseumC2Progress(save);
  return COLISEUM_C2_ENCOUNTERS.find((encounter) => getColiseumC2Access(save, encounter).unlocked && !progress.completedEncounterIds.includes(encounter.encounterId)) ?? null;
}

function talent(talentId: string, grade: AbilityGrade): CreatureAbility | null {
  const definition = getTalentDefinition(talentId);
  if (!definition) return null;
  return {
    id: definition.id,
    name: definition.name,
    grade,
    source: definition.source,
    description: definition.exactDescriptionByGrade[grade],
    category: definition.category,
    tags: [...definition.tags],
    definitionVersion: definition.definitionVersion,
  };
}

function xpToNext(level: number): number {
  return 45 + Math.max(1, level) * 30;
}

function buildEnemyCreature(saveId: SaveId, encounter: ColiseumC2EncounterDefinition, definition: ColiseumEnemySlotDefinition): CreatureRecord {
  const variant = getVariantDefinition(definition.variantId);
  const species = getSpeciesDefinition(variant.speciesId);
  const creatureId = `coliseum_c2_${encounter.encounterId}_${definition.slotId}` as CreatureId;
  const levelOneStats = buildStats(species.baseStats, variant.statAdjustments, definition.statGrades);
  const maxHearts = getBaseMaxHearts(species.speciesId, variant.variantId);
  const base: CreatureRecord = {
    creatureId,
    ownerSaveId: String(saveId),
    speciesId: species.speciesId,
    variantId: variant.variantId,
    habitatId: getHabitatIdForFamily(variant.family),
    nickname: definition.nickname,
    level: 1,
    xp: 0,
    xpToNext: xpToNext(1),
    stats: levelOneStats,
    statGrades: { ...definition.statGrades },
    growthProgress: { STR: 0, DEX: 0, STA: 0, CHA: 0, WIL: 0, FER: 0 },
    abilities: normalizeTalentInstances(definition.talentGrades.map((entry) => talent(entry.talentId, entry.grade)).filter((entry): entry is CreatureAbility => Boolean(entry))),
    battleMoveLoadout: {
      learnedMoveIds: Array.from(new Set([...definition.learnedMoveIds, ...definition.equippedMoveIds])).slice(0, 8),
      equippedMoveIds: Array.from(new Set(definition.equippedMoveIds)).slice(0, 4),
      version: 1,
    },
    energy: 1,
    maxEnergy: 1,
    hearts: maxHearts,
    maxHearts,
    affection: 50,
    generation: 1,
    shiny: false,
    cosmeticVariant: null,
    origin: "unknown",
    originLabel: `${encounter.opponentName} · ${definition.roleLabel}`,
    isLocked: true,
    createdAt: "1970-01-01T00:00:00.000Z",
    notes: `${definition.roleLabel}${definition.equipment ? ` · ${definition.equipment.name}` : ""}`,
  };
  const growth = applyCreatureLevelGrowth(base, Math.max(0, definition.level - 1), [], `${encounter.encounterId}_${definition.slotId}`);
  const leveled = { ...base, level: definition.level, stats: growth.stats, growthProgress: growth.growthProgress };
  const maxEnergy = getProjectedMaxEnergyForCreature(leveled);
  return { ...leveled, maxEnergy, energy: maxEnergy, xpToNext: xpToNext(definition.level) };
}

export function buildAuthoredColiseumEnemyTeam(saveId: SaveId, encounter: ColiseumC2EncounterDefinition): CreatureRecord[] {
  return encounter.enemyTeam.map((definition) => buildEnemyCreature(saveId, encounter, definition));
}

export function applyAuthoredColiseumEquipment(state: BattleState, encounter: ColiseumC2EncounterDefinition): BattleState {
  const definitionByCreatureId = new Map(encounter.enemyTeam.map((definition) => [`coliseum_c2_${encounter.encounterId}_${definition.slotId}`, definition]));
  const log: string[] = [];
  const combatants = Object.values(state.combatants).reduce((next, combatant) => {
    if (combatant.sideId !== "enemy") {
      next[combatant.battleCombatantId] = combatant;
      return next;
    }
    const definition = definitionByCreatureId.get(String(combatant.sourceCreatureId));
    const equipment = definition?.equipment;
    if (!equipment) {
      next[combatant.battleCombatantId] = combatant;
      return next;
    }
    const battleStats: BattleStats = { ...combatant.battleStats };
    for (const [key, value] of Object.entries(equipment.bonuses)) {
      const statKey = key as BattleStatKey;
      battleStats[statKey] = Math.max(statKey === "evasion" ? 0 : 1, Math.round(battleStats[statKey] + (value ?? 0)));
    }
    const updated = {
      ...combatant,
      battleStats,
      maxHp: battleStats.maxHp,
      currentHp: battleStats.maxHp,
      maxBattleEnergy: battleStats.battleEnergy,
      currentBattleEnergy: battleStats.battleEnergy,
    };
    next[combatant.battleCombatantId] = updated;
    log.push(`${combatant.name} enters with ${equipment.name}.`);
    return next;
  }, {} as BattleState["combatants"]);
  return { ...state, combatants, log: [...state.log, ...log] };
}

export function getColiseumEnemyPreview(encounter: ColiseumC2EncounterDefinition): Array<{ name: string; variantName: string; level: number; role: string; equipment: string; moves: string[] }> {
  return encounter.enemyTeam.map((entry) => ({
    name: entry.nickname,
    variantName: getVariantDefinition(entry.variantId).name,
    level: entry.level,
    role: entry.roleLabel,
    equipment: entry.equipment?.name ?? "No equipment",
    moves: entry.equippedMoveIds.map((moveId) => getBattleMove(moveId).name),
  }));
}

export function createColiseumPerformance(teamCreatureIds: CreatureId[]): ColiseumCombatPerformanceMap {
  return teamCreatureIds.reduce((next, creatureId) => {
    next[String(creatureId)] = { creatureId, actionsTaken: 0, damageDealt: 0, healingDone: 0, statusesApplied: 0, alliesProtected: 0, knockouts: 0, misses: 0 };
    return next;
  }, {} as ColiseumCombatPerformanceMap);
}

function sumLogNumber(log: string[], pattern: RegExp): number {
  return log.reduce((total, line) => {
    const match = line.match(pattern);
    return total + (match ? finiteCount(match[1]) : 0);
  }, 0);
}

export function accumulateColiseumRoundPerformance(
  current: ColiseumCombatPerformanceMap,
  stateBefore: BattleState,
  result: BattleRoundResult,
): ColiseumCombatPerformanceMap {
  const next = Object.fromEntries(Object.entries(current).map(([key, value]) => [key, { ...value }])) as ColiseumCombatPerformanceMap;
  for (const action of result.actions) {
    const actor = stateBefore.combatants[action.actorId];
    if (!actor || actor.sideId !== "player") continue;
    const key = String(actor.sourceCreatureId);
    const performance = next[key] ?? { creatureId: actor.sourceCreatureId, actionsTaken: 0, damageDealt: 0, healingDone: 0, statusesApplied: 0, alliesProtected: 0, knockouts: 0, misses: 0 };
    performance.actionsTaken += action.success ? 1 : 0;
    performance.damageDealt += sumLogNumber(action.log, /for (\d+) damage\./i);
    performance.healingDone += sumLogNumber(action.log, /recovers (\d+) HP\./i);
    performance.statusesApplied += action.log.filter((line) => line.includes("the effect was applied") || line.includes("the effect was stacked") || line.includes("the effect was refreshed")).length;
    performance.knockouts += action.log.filter((line) => / fainted\.$/i.test(line)).length;
    performance.misses += action.missedTargetIds?.length ?? 0;
    const move = getBattleMove(action.moveId);
    if (move.effects.some((effect) => effect.type === "guard" || effect.type === "taunt")) {
      performance.alliesProtected += Math.max(1, action.targetIds.filter((targetId) => stateBefore.combatants[targetId]?.sideId === "player").length);
    }
    next[key] = performance;
  }
  return next;
}

function deterministicRoll(seed: string, modulo: number): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  return Math.abs(hash) % Math.max(1, modulo);
}

function chooseRepeatReward(encounter: ColiseumC2EncounterDefinition, seed: string): ColiseumC2Reward {
  const totalWeight = encounter.repeatRewardPool.reduce((total, entry) => total + Math.max(0, entry.weight), 0);
  let roll = deterministicRoll(seed, Math.max(1, totalWeight));
  for (const entry of encounter.repeatRewardPool) {
    roll -= Math.max(0, entry.weight);
    if (roll < 0) return { ...entry.reward };
  }
  return { ...encounter.repeatRewardPool[0].reward };
}

export function getColiseumC2RewardLabel(reward: ColiseumC2Reward): string {
  const parts = [`${reward.gold} Gold`, `${reward.guildPoints} GP`];
  if (reward.materials) parts.push(`${reward.materials} Materials`);
  if (reward.itemId && reward.itemQuantity) {
    const item = BATTLE_OUTFITTER_ITEMS.find((entry) => entry.itemId === reward.itemId);
    parts.push(`${reward.itemQuantity} ${item?.name ?? reward.itemId}`);
  }
  return parts.join(" • ");
}

export function getColiseumRepeatPoolLabel(encounter: ColiseumC2EncounterDefinition): string {
  return encounter.repeatRewardPool.map((entry) => `${entry.weight}% ${getColiseumC2RewardLabel(entry.reward)}`).join(" · ");
}

function applyReward(save: GameSave, reward: ColiseumC2Reward): GameSave {
  const flags = { ...save.flags };
  if (reward.materials) flags.ranchMaterialsStock = finiteCount(flags.ranchMaterialsStock) + reward.materials;
  if (reward.itemId && reward.itemQuantity) {
    const item = BATTLE_OUTFITTER_ITEMS.find((entry) => entry.itemId === reward.itemId);
    if (item) flags[item.flagKey] = getBattleOutfitterStock(save, item) + reward.itemQuantity;
  }
  return {
    ...save,
    currencies: {
      ...save.currencies,
      gold: save.currencies.gold + reward.gold,
      guildPoints: save.currencies.guildPoints + reward.guildPoints,
    },
    flags,
  };
}

function getGrowthBiases(creature: CreatureRecord): CreatureStatKey[] {
  return resolveTalentEffects(creature.abilities, "growth")
    .filter((effect) => effect.type === "growth-stat-bias" && effect.creatureStatKey)
    .map((effect) => effect.creatureStatKey as CreatureStatKey);
}

function getCombatXpAmount(
  encounter: ColiseumC2EncounterDefinition,
  outcome: BattleOutcome,
  creature: CreatureRecord,
  performance: ColiseumCombatPerformance | undefined,
  firstClear: boolean,
): number {
  const outcomeMultiplier = outcome === "player_won" ? 1 : outcome === "draw" ? 0.6 : 0.45;
  const overLevel = Math.max(0, creature.level - encounter.recommendedLevel);
  const levelMultiplier = overLevel >= 9 ? 0.25 : overLevel >= 5 ? 0.5 : overLevel >= 3 ? 0.75 : 1;
  const firstClearMultiplier = firstClear ? 1.2 : 1;
  const contribution = performance
    ? Math.min(12, Math.floor(performance.damageDealt / 60) + Math.floor(performance.healingDone / 45) + performance.statusesApplied * 2 + performance.alliesProtected * 2 + performance.knockouts * 3)
    : 0;
  return Math.max(4, Math.round(encounter.baseCombatXp * outcomeMultiplier * levelMultiplier * firstClearMultiplier) + contribution);
}

function applyCombatXp(creature: CreatureRecord, xpGain: number, seed: string): { creature: CreatureRecord; summary: ColiseumCreatureXpSummary } {
  const levelBefore = creature.level;
  const xpBefore = creature.xp;
  let level = creature.level;
  let xp = creature.xp + xpGain;
  let threshold = creature.xpToNext > 0 ? creature.xpToNext : xpToNext(level);
  let levelUps = 0;
  while (level < 100 && xp >= threshold) {
    xp -= threshold;
    level += 1;
    levelUps += 1;
    threshold = xpToNext(level);
  }
  const biases = getGrowthBiases(creature);
  const growth = levelUps > 0 ? applyCreatureLevelGrowth(creature, levelUps, biases, seed) : { stats: creature.stats, growthProgress: creature.growthProgress ?? { STR: 0, DEX: 0, STA: 0, CHA: 0, WIL: 0, FER: 0 }, statGrowth: {}, notes: [] };
  const projected = { ...creature, level, stats: growth.stats, growthProgress: growth.growthProgress };
  const maxEnergy = getProjectedMaxEnergyForCreature(projected);
  const updated: CreatureRecord = {
    ...projected,
    xp,
    xpToNext: threshold,
    maxEnergy,
    energy: Math.min(maxEnergy, creature.energy + levelUps * 8),
    notes: `${creature.notes ?? ""} Coliseum: +${xpGain} combat XP${levelUps ? `, +${levelUps} level${levelUps === 1 ? "" : "s"}` : ""}.`.trim(),
  };
  return {
    creature: updated,
    summary: {
      creatureId: creature.creatureId,
      creatureName: creature.nickname,
      xpGained: xpGain,
      levelBefore,
      levelAfter: level,
      xpBefore,
      xpAfter: xp,
      xpToNextAfter: threshold,
      statGrowth: growth.statGrowth,
      notes: growth.notes,
    },
  };
}

export function previewColiseumCombatXp(
  save: GameSave,
  encounter: ColiseumC2EncounterDefinition,
  outcome: BattleOutcome,
  teamCreatureIds: CreatureId[],
  performance: ColiseumCombatPerformanceMap,
): Array<{ creatureId: CreatureId; name: string; xp: number }> {
  const progress = getColiseumC2Progress(save);
  const firstClear = outcome === "player_won" && !progress.claimedFirstClearEncounterIds.includes(encounter.encounterId);
  return teamCreatureIds.flatMap((creatureId) => {
    const creature = (save.creatures ?? []).find((entry) => entry.creatureId === creatureId);
    if (!creature) return [];
    return [{ creatureId, name: creature.nickname, xp: getCombatXpAmount(encounter, outcome, creature, performance[String(creatureId)], firstClear) }];
  });
}

export function recordColiseumC2BattleResult(
  save: GameSave,
  encounterId: ColiseumC2EncounterId,
  outcome: BattleOutcome,
  roundCount: number,
  teamCreatureIds: CreatureId[],
  performance: ColiseumCombatPerformanceMap,
  resultId: string,
): ColiseumC2Result {
  const encounter = getColiseumC2Encounter(encounterId);
  if (!encounter) throw new Error(`Unknown Coliseum encounter: ${encounterId}`);
  const progress = getColiseumC2Progress(save);
  const previousRecord = normalizeRecord(encounterId, progress.records[encounterId]);
  if (progress.processedResultIds.includes(resultId)) {
    return {
      save,
      progress,
      record: previousRecord,
      reward: { gold: 0, guildPoints: 0 },
      firstClear: false,
      xpSummaries: [],
      message: "This Coliseum result was already recorded. No duplicate reward or XP was granted.",
      duplicate: true,
    };
  }

  const win = outcome === "player_won";
  const loss = outcome === "enemy_won";
  const draw = outcome === "draw";
  const firstClear = win && !progress.claimedFirstClearEncounterIds.includes(encounterId);
  const reward = win ? (firstClear ? { ...encounter.firstClearReward } : chooseRepeatReward(encounter, `${save.saveId}_${resultId}_${progress.totalAttempts + 1}`)) : { gold: 0, guildPoints: 0 };
  const rounds = Math.max(1, Math.floor(roundCount));
  const nextRecord: ColiseumEncounterRecordV2 = {
    ...previousRecord,
    attempts: previousRecord.attempts + 1,
    wins: previousRecord.wins + (win ? 1 : 0),
    losses: previousRecord.losses + (loss ? 1 : 0),
    draws: previousRecord.draws + (draw ? 1 : 0),
    bestWinRounds: win ? previousRecord.bestWinRounds ? Math.min(previousRecord.bestWinRounds, rounds) : rounds : previousRecord.bestWinRounds,
    lastOutcome: outcome,
    lastRoundCount: rounds,
    lastCompletedDayNumber: save.dayState.dayNumber,
    lastTeamCreatureIds: [...teamCreatureIds],
  };

  const xpSummaries: ColiseumCreatureXpSummary[] = [];
  const creatureRecords = { ...progress.creatureRecords };
  const divisionOrder = getColiseumC2Division(encounter.divisionId).order;
  const creatures = (save.creatures ?? []).map((creature) => {
    if (!teamCreatureIds.includes(creature.creatureId)) return creature;
    const creaturePerformance = performance[String(creature.creatureId)];
    const xpGain = getCombatXpAmount(encounter, outcome, creature, creaturePerformance, firstClear);
    const xpResult = applyCombatXp(creature, xpGain, `${resultId}_${creature.creatureId}`);
    xpSummaries.push(xpResult.summary);
    const previous = normalizeCreatureRecord(creature.creatureId, creatureRecords[String(creature.creatureId)]);
    creatureRecords[String(creature.creatureId)] = {
      ...previous,
      battles: previous.battles + 1,
      wins: previous.wins + (win ? 1 : 0),
      losses: previous.losses + (loss ? 1 : 0),
      draws: previous.draws + (draw ? 1 : 0),
      totalCombatXp: previous.totalCombatXp + xpGain,
      damageDealt: previous.damageDealt + (creaturePerformance?.damageDealt ?? 0),
      healingDone: previous.healingDone + (creaturePerformance?.healingDone ?? 0),
      statusesApplied: previous.statusesApplied + (creaturePerformance?.statusesApplied ?? 0),
      alliesProtected: previous.alliesProtected + (creaturePerformance?.alliesProtected ?? 0),
      knockouts: previous.knockouts + (creaturePerformance?.knockouts ?? 0),
      misses: previous.misses + (creaturePerformance?.misses ?? 0),
      highestDivisionOrder: Math.max(previous.highestDivisionOrder, divisionOrder),
      lastEncounterId: encounterId,
      lastOutcome: outcome,
      lastBattleDayNumber: save.dayState.dayNumber,
    };
    return xpResult.creature;
  });

  const completedEncounterIds = win && !progress.completedEncounterIds.includes(encounterId) ? [...progress.completedEncounterIds, encounterId] : [...progress.completedEncounterIds];
  const claimedFirstClearEncounterIds = firstClear ? [...progress.claimedFirstClearEncounterIds, encounterId] : [...progress.claimedFirstClearEncounterIds];
  const historyEntry: ColiseumHistoryEntryV2 = {
    resultId,
    encounterId,
    encounterName: encounter.name,
    divisionId: encounter.divisionId,
    outcome,
    roundCount: rounds,
    completedAtDayNumber: save.dayState.dayNumber,
    teamCreatureIds: [...teamCreatureIds],
    reward: { ...reward },
    firstClear,
    xpAwards: xpSummaries.map((summary) => ({ creatureId: summary.creatureId, xp: summary.xpGained, levelsGained: summary.levelAfter - summary.levelBefore })),
  };
  const nextProgress: ColiseumProgressStateV2 = {
    ...progress,
    completedEncounterIds,
    claimedFirstClearEncounterIds,
    records: { ...progress.records, [encounterId]: nextRecord },
    creatureRecords,
    history: [historyEntry, ...progress.history].slice(0, COLISEUM_C2_HISTORY_LIMIT),
    processedResultIds: [resultId, ...progress.processedResultIds].slice(0, COLISEUM_C2_RESULT_LIMIT),
    totalAttempts: progress.totalAttempts + 1,
    totalWins: progress.totalWins + (win ? 1 : 0),
    totalLosses: progress.totalLosses + (loss ? 1 : 0),
    totalDraws: progress.totalDraws + (draw ? 1 : 0),
    migratedFromC1: progress.migratedFromC1,
  };
  const rewarded = applyReward({ ...save, creatures }, reward);
  const nextSave: GameSave = {
    ...rewarded,
    updatedAt: new Date().toISOString(),
    flags: {
      ...rewarded.flags,
      [COLISEUM_C2_PROGRESS_FLAG]: JSON.stringify(nextProgress),
      coliseumProgressionStarted: true,
      coliseumCombatProgressionStarted: true,
      ...(firstClear ? { coliseumFirstClearEarned: true } : {}),
    },
  };
  const rewardLabel = win ? getColiseumC2RewardLabel(reward) : "No purse";
  const xpLabel = xpSummaries.map((summary) => `${summary.creatureName} +${summary.xpGained} XP${summary.levelAfter > summary.levelBefore ? ` (Lv. ${summary.levelAfter})` : ""}`).join(" • ");
  return {
    save: nextSave,
    progress: nextProgress,
    record: nextRecord,
    reward,
    firstClear,
    xpSummaries,
    message: `${win ? "Victory" : loss ? "Defeat" : "Draw"} recorded for ${encounter.name} in ${rounds} rounds. ${win ? firstClear ? "First-clear purse" : "Repeat purse" : "Result"}: ${rewardLabel}. Combat XP: ${xpLabel}.`,
    duplicate: false,
  };
}
