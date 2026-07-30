import {
  BATTLE_OUTFITTER_ITEMS,
  getBattleOutfitterStock,
  type BattleOutfitterItemId,
} from "@/data/battleOutfitter";
import {
  getCreatureBattleMoveLoadout,
  learnBattleMove,
  forgetBattleMove,
  MAX_LEARNED_BATTLE_MOVES,
  REQUIRED_BASIC_BATTLE_MOVE_ID,
} from "@/data/battleLoadouts";
import { getBattleMove } from "@/data/battleMoves";
import {
  COLISEUM_C2_ENCOUNTERS,
  getColiseumC2Division,
  getColiseumC2Encounter,
  getColiseumC2Progress,
  type ColiseumC2EncounterId,
  type ColiseumHistoryEntryV2,
} from "@/data/coliseumC2";
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
import type { BattleMoveId } from "@/types/battle";
import type {
  AbilityGrade,
  CreatureAbility,
  CreatureRecord,
  StatGrades,
} from "@/types/creature";
import type { CreatureId, VariantId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export const COLISEUM_C3_STATE_FLAG = "coliseumC3StateV1";
export const COLISEUM_C3_STATE_VERSION = 1;
export const COLISEUM_C3_HISTORY_LIMIT = 60;

export type ColiseumC3RewardKind = "equipment" | "consumable" | "technique" | "contract" | "prestige";

export type ColiseumC3ShopReward = {
  rewardId: string;
  name: string;
  kind: ColiseumC3RewardKind;
  description: string;
  costMarks: number;
  requiredEncounterId?: ColiseumC2EncounterId;
  maxPurchases?: number;
  itemId?: BattleOutfitterItemId;
  itemQuantity?: number;
  moveId?: BattleMoveId;
  contractId?: string;
};

export type ColiseumC3AwardHistory = {
  awardId: string;
  sourceResultId: string;
  encounterId?: ColiseumC2EncounterId;
  encounterName: string;
  dayNumber: number;
  marks: number;
  lootLabel: string;
  reason: "battle" | "legacy-stipend" | "purchase" | "contract";
};

export type ColiseumC3State = {
  version: number;
  marks: number;
  processedBattleResultIds: string[];
  purchaseCounts: Record<string, number>;
  techniqueManualStock: Record<string, number>;
  pendingContractIds: string[];
  recruitedContractIds: string[];
  awardHistory: ColiseumC3AwardHistory[];
  legacyStipendApplied: boolean;
};

export type ColiseumC3Result = {
  save: GameSave;
  state: ColiseumC3State;
  ok: boolean;
  changed: boolean;
  message: string;
};

export type ColiseumContractDefinition = {
  contractId: string;
  name: string;
  description: string;
  nickname: string;
  variantId: VariantId;
  level: number;
  statGrades: StatGrades;
  talents: Array<{ talentId: string; grade: AbilityGrade }>;
  learnedMoveIds: BattleMoveId[];
  equippedMoveIds: BattleMoveId[];
  cosmeticVariant: string;
  requiredEncounterId: ColiseumC2EncounterId;
};

const CHAMPION_ENCOUNTERS = new Set<ColiseumC2EncounterId>([
  "novice_echo_trial",
  "bronze_pack_clash",
  "silver_guard_circuit",
  "crown_tactical_finale",
]);

const DIVISION_MARKS: Record<number, { repeat: number; firstClearBonus: number }> = {
  1: { repeat: 2, firstClearBonus: 3 },
  2: { repeat: 3, firstClearBonus: 4 },
  3: { repeat: 4, firstClearBonus: 6 },
  4: { repeat: 6, firstClearBonus: 9 },
};

export const COLISEUM_C3_SHOP_REWARDS: ColiseumC3ShopReward[] = [
  { rewardId: "tonic_bundle", name: "Field Tonic", kind: "consumable", description: "Add one Field Tonic to Battle Outfitter stock.", costMarks: 4, itemId: "field_tonic", itemQuantity: 1 },
  { rewardId: "tactics_bundle", name: "Team Tactics Kit", kind: "consumable", description: "Add one Team Tactics Kit to Battle Outfitter stock.", costMarks: 7, requiredEncounterId: "novice_echo_trial", itemId: "team_tactics_kit", itemQuantity: 1 },
  { rewardId: "revival_bundle", name: "Revival Salve", kind: "consumable", description: "Add one Revival Salve to Battle Outfitter stock.", costMarks: 12, requiredEncounterId: "bronze_pack_clash", itemId: "revival_salve", itemQuantity: 1 },
  { rewardId: "arena_blade_wraps", name: "Arena Blade Wraps", kind: "equipment", description: "Bronze offense gear: +8 Physical Power, +3 Speed, and +3 Accuracy.", costMarks: 18, requiredEncounterId: "bronze_pack_clash", maxPurchases: 3, itemId: "arena_blade_wraps", itemQuantity: 1 },
  { rewardId: "focus_prism", name: "Focus Prism", kind: "equipment", description: "Silver offense gear: +8 Special Power, +5 Status Power, and +3 Accuracy.", costMarks: 24, requiredEncounterId: "silver_status_web", maxPurchases: 3, itemId: "focus_prism", itemQuantity: 1 },
  { rewardId: "bastion_badge", name: "Bastion Badge", kind: "equipment", description: "Silver defense gear: +18 Max HP with strong Defense and Resistance bonuses.", costMarks: 26, requiredEncounterId: "silver_guard_circuit", maxPurchases: 3, itemId: "bastion_badge", itemQuantity: 1 },
  { rewardId: "tactician_emblem", name: "Tactician Emblem", kind: "equipment", description: "Utility gear that adds Speed, support strength, status resistance, and Battle Energy.", costMarks: 28, requiredEncounterId: "silver_guard_circuit", maxPurchases: 3, itemId: "tactician_emblem", itemQuantity: 1 },
  { rewardId: "champion_harness", name: "Champion Harness", kind: "equipment", description: "One-per-save Crown utility harness with broad offensive and defensive bonuses.", costMarks: 55, requiredEncounterId: "crown_tactical_finale", maxPurchases: 1, itemId: "champion_harness", itemQuantity: 1 },
  { rewardId: "manual_arena_breaker", name: "Arena Breaker Manual", kind: "technique", description: "Teaches the Coliseum-exclusive Guard Break attack Arena Breaker to one compatible creature.", costMarks: 16, requiredEncounterId: "bronze_breaker_squad", maxPurchases: 8, moveId: "arena_breaker" },
  { rewardId: "manual_tactical_reversal", name: "Tactical Reversal Manual", kind: "technique", description: "Teaches a self-guarding, self-inspiring counter technique.", costMarks: 18, requiredEncounterId: "bronze_pack_clash", maxPurchases: 8, moveId: "tactical_reversal" },
  { rewardId: "manual_arena_medic", name: "Arena Medic Manual", kind: "technique", description: "Teaches a Coliseum healing technique that also removes Slowed and Weakened.", costMarks: 22, requiredEncounterId: "silver_endurance_cell", maxPurchases: 8, moveId: "arena_medic" },
  { rewardId: "manual_champion_command", name: "Champion Command Manual", kind: "technique", description: "Teaches the Crown formation command that inspires all allies and restores Battle Energy.", costMarks: 40, requiredEncounterId: "crown_tactical_finale", maxPurchases: 8, moveId: "champion_command" },
  { rewardId: "bronze_duelist_contract", name: "Bronze Duelist Contract", kind: "contract", description: "A one-time contract for Veyra, an arena-trained Tiger striker with Arena Breaker.", costMarks: 35, requiredEncounterId: "bronze_pack_clash", maxPurchases: 1, contractId: "bronze_duelist" },
  { rewardId: "silver_warden_contract", name: "Silver Warden Contract", kind: "contract", description: "A one-time contract for Solenne, a Moon Yak protector trained in recovery and reversal techniques.", costMarks: 60, requiredEncounterId: "silver_guard_circuit", maxPurchases: 1, contractId: "silver_warden" },
  { rewardId: "crown_champion_contract", name: "Crown Champion Contract", kind: "contract", description: "A one-time contract for Cairn, a Direwolf champion carrying Crown-exclusive techniques.", costMarks: 100, requiredEncounterId: "crown_tactical_finale", maxPurchases: 1, contractId: "crown_champion" },
  { rewardId: "champion_banner", name: "Champion Banner", kind: "prestige", description: "A permanent Ranch and Coliseum prestige flag for clearing and mastering the Crown circuit.", costMarks: 50, requiredEncounterId: "crown_tactical_finale", maxPurchases: 1 },
];

const grades = (STR: StatGrades["STR"], DEX: StatGrades["DEX"], STA: StatGrades["STA"], CHA: StatGrades["CHA"], WIL: StatGrades["WIL"], FER: StatGrades["FER"]): StatGrades => ({ STR, DEX, STA, CHA, WIL, FER });

export const COLISEUM_CREATURE_CONTRACTS: ColiseumContractDefinition[] = [
  {
    contractId: "bronze_duelist",
    name: "Bronze Duelist",
    description: "A fast Tiger striker developed through the Bronze breaker circuit.",
    nickname: "Veyra",
    variantId: "variant_tiger" as VariantId,
    level: 5,
    statGrades: grades("B", "A", "B", "C", "B", "D"),
    talents: [{ talentId: "tiger_instinct", grade: "B" }, { talentId: "apex_pounce", grade: "B" }],
    learnedMoveIds: ["strike", "defend", "pounce", "shadow_feint", "arena_breaker"],
    equippedMoveIds: ["strike", "pounce", "shadow_feint", "arena_breaker"],
    cosmeticVariant: "coliseum_bronze_duelist",
    requiredEncounterId: "bronze_pack_clash",
  },
  {
    contractId: "silver_warden",
    name: "Silver Warden",
    description: "A Moon Yak protector trained for endurance, healing, and tactical reversals.",
    nickname: "Solenne",
    variantId: "variant_moon_yak" as VariantId,
    level: 9,
    statGrades: grades("B", "C", "A", "B", "A", "C"),
    talents: [{ talentId: "silver_coat", grade: "A" }, { talentId: "calm_herd_aura", grade: "B" }],
    learnedMoveIds: ["strike", "defend", "heavy_shove", "unyielding_aura", "tactical_reversal", "arena_medic"],
    equippedMoveIds: ["strike", "unyielding_aura", "tactical_reversal", "arena_medic"],
    cosmeticVariant: "coliseum_silver_warden",
    requiredEncounterId: "silver_guard_circuit",
  },
  {
    contractId: "crown_champion",
    name: "Crown Champion",
    description: "A veteran Direwolf leader trusted with the Crown circuit's strongest formation techniques.",
    nickname: "Cairn",
    variantId: "variant_direwolf" as VariantId,
    level: 13,
    statGrades: grades("A", "B", "A", "C", "A", "C"),
    talents: [{ talentId: "alpha_bond", grade: "A" }, { talentId: "pack_anchor", grade: "A" }],
    learnedMoveIds: ["strike", "defend", "chase", "pack_howl", "resonant_bark", "arena_breaker", "champion_command"],
    equippedMoveIds: ["strike", "resonant_bark", "arena_breaker", "champion_command"],
    cosmeticVariant: "coliseum_crown_champion",
    requiredEncounterId: "crown_tactical_finale",
  },
];

function emptyState(): ColiseumC3State {
  return {
    version: COLISEUM_C3_STATE_VERSION,
    marks: 0,
    processedBattleResultIds: [],
    purchaseCounts: {},
    techniqueManualStock: {},
    pendingContractIds: [],
    recruitedContractIds: [],
    awardHistory: [],
    legacyStipendApplied: false,
  };
}

function nonNegativeInt(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? Array.from(new Set(value.filter((entry): entry is string => typeof entry === "string"))) : [];
}

function normalizeState(raw: Partial<ColiseumC3State>): ColiseumC3State {
  const validContractIds = new Set(COLISEUM_CREATURE_CONTRACTS.map((entry) => entry.contractId));
  return {
    version: COLISEUM_C3_STATE_VERSION,
    marks: nonNegativeInt(raw.marks),
    processedBattleResultIds: stringArray(raw.processedBattleResultIds).slice(0, 200),
    purchaseCounts: Object.fromEntries(Object.entries(raw.purchaseCounts ?? {}).map(([key, value]) => [key, nonNegativeInt(value)])),
    techniqueManualStock: Object.fromEntries(Object.entries(raw.techniqueManualStock ?? {}).map(([key, value]) => [key, nonNegativeInt(value)])),
    pendingContractIds: stringArray(raw.pendingContractIds).filter((id) => validContractIds.has(id)),
    recruitedContractIds: stringArray(raw.recruitedContractIds).filter((id) => validContractIds.has(id)),
    awardHistory: Array.isArray(raw.awardHistory) ? raw.awardHistory.filter((entry): entry is ColiseumC3AwardHistory => Boolean(entry && typeof entry.awardId === "string")).slice(0, COLISEUM_C3_HISTORY_LIMIT) : [],
    legacyStipendApplied: Boolean(raw.legacyStipendApplied),
  };
}

export function getColiseumC3State(save: GameSave): ColiseumC3State {
  const raw = save.flags[COLISEUM_C3_STATE_FLAG];
  if (typeof raw !== "string" || !raw.trim()) return emptyState();
  try {
    return normalizeState(JSON.parse(raw) as Partial<ColiseumC3State>);
  } catch {
    return emptyState();
  }
}

function writeState(save: GameSave, state: ColiseumC3State, additionalFlags: GameSave["flags"] = save.flags): GameSave {
  return {
    ...save,
    updatedAt: new Date().toISOString(),
    flags: {
      ...additionalFlags,
      [COLISEUM_C3_STATE_FLAG]: JSON.stringify(normalizeState(state)),
      coliseumMarksUnlocked: true,
      mColiseumC3: true,
    },
  };
}

function deterministicRoll(seed: string, modulo = 100): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  return Math.abs(hash) % Math.max(1, modulo);
}

function getItem(itemId: BattleOutfitterItemId) {
  return BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === itemId) ?? null;
}

function addItemToFlags(save: GameSave, flags: GameSave["flags"], itemId: BattleOutfitterItemId, quantity: number): { flags: GameSave["flags"]; added: number; label: string } {
  const item = getItem(itemId);
  if (!item || quantity <= 0) return { flags, added: 0, label: "" };
  const current = getBattleOutfitterStock({ ...save, flags }, item);
  const cap = item.maxStock ?? Number.MAX_SAFE_INTEGER;
  const added = Math.max(0, Math.min(quantity, cap - current));
  if (added <= 0) return { flags, added: 0, label: `${item.name} stock was already full` };
  return { flags: { ...flags, [item.flagKey]: current + added }, added, label: `+${added} ${item.name}` };
}

function getBattleMarkAward(entry: ColiseumHistoryEntryV2): number {
  if (entry.outcome !== "player_won") return 0;
  const division = getColiseumC2Division(entry.divisionId);
  const rates = DIVISION_MARKS[division.order] ?? DIVISION_MARKS[1];
  const championBonus = CHAMPION_ENCOUNTERS.has(entry.encounterId) ? division.order + 1 : 0;
  return rates.repeat + (entry.firstClear ? rates.firstClearBonus : 0) + championBonus;
}

function applyBattleLoot(save: GameSave, flags: GameSave["flags"], entry: ColiseumHistoryEntryV2): { flags: GameSave["flags"]; lootLabel: string } {
  if (entry.outcome !== "player_won") return { flags, lootLabel: "No combat loot" };
  const division = getColiseumC2Division(entry.divisionId);
  let nextFlags = flags;
  const labels: string[] = [];
  if (entry.firstClear) {
    const materials = division.order + 1;
    nextFlags = { ...nextFlags, ranchMaterialsStock: nonNegativeInt(nextFlags.ranchMaterialsStock) + materials };
    labels.push(`+${materials} Materials`);
    if (CHAMPION_ENCOUNTERS.has(entry.encounterId)) {
      const championItem: BattleOutfitterItemId = division.order === 1 ? "field_tonic" : division.order === 2 ? "team_tactics_kit" : division.order === 3 ? "focus_manual" : "revival_salve";
      const itemResult = addItemToFlags(save, nextFlags, championItem, 1);
      nextFlags = itemResult.flags;
      if (itemResult.label) labels.push(itemResult.label);
    }
  } else {
    const roll = deterministicRoll(`${entry.resultId}_c3_loot`, 100);
    if (roll < 12) {
      const itemResult = addItemToFlags(save, nextFlags, "field_tonic", 1);
      nextFlags = itemResult.flags;
      if (itemResult.label) labels.push(itemResult.label);
    } else if (roll < 21) {
      nextFlags = { ...nextFlags, ranchMaterialsStock: nonNegativeInt(nextFlags.ranchMaterialsStock) + 2 };
      labels.push("+2 Materials");
    } else if (roll < 25) {
      const itemResult = addItemToFlags(save, nextFlags, "focus_manual", 1);
      nextFlags = itemResult.flags;
      if (itemResult.label) labels.push(itemResult.label);
    }
  }
  return { flags: nextFlags, lootLabel: labels.length ? labels.join(" • ") : "No bonus loot" };
}

export function syncColiseumC3Rewards(save: GameSave): ColiseumC3Result {
  const progress = getColiseumC2Progress(save);
  let state = getColiseumC3State(save);
  let flags = { ...save.flags };
  let changed = false;
  let marksAdded = 0;
  const newHistory: ColiseumC3AwardHistory[] = [];

  if (!state.legacyStipendApplied) {
    const representedEncounters = new Set(progress.history.map((entry) => entry.encounterId));
    const legacyClears = progress.completedEncounterIds.filter((id) => !representedEncounters.has(id));
    const stipend = legacyClears.length * 2;
    if (stipend > 0) {
      state = { ...state, marks: state.marks + stipend };
      marksAdded += stipend;
      newHistory.push({
        awardId: `legacy_${save.saveId}_${legacyClears.length}`,
        sourceResultId: "legacy-stipend",
        encounterName: "Legacy Coliseum Progress",
        dayNumber: save.dayState.dayNumber,
        marks: stipend,
        lootLabel: `${legacyClears.length} migrated clears recognized`,
        reason: "legacy-stipend",
      });
    }
    state = { ...state, legacyStipendApplied: true };
    changed = true;
  }

  const processed = new Set(state.processedBattleResultIds);
  const pendingEntries = [...progress.history].reverse().filter((entry) => !processed.has(entry.resultId));
  for (const entry of pendingEntries) {
    processed.add(entry.resultId);
    const marks = getBattleMarkAward(entry);
    const loot = applyBattleLoot(save, flags, entry);
    flags = loot.flags;
    state = { ...state, marks: state.marks + marks };
    marksAdded += marks;
    newHistory.unshift({
      awardId: `battle_${entry.resultId}`,
      sourceResultId: entry.resultId,
      encounterId: entry.encounterId,
      encounterName: entry.encounterName,
      dayNumber: entry.completedAtDayNumber,
      marks,
      lootLabel: loot.lootLabel,
      reason: "battle",
    });
    changed = true;
  }

  if (!changed) return { save, state, ok: true, changed: false, message: "Coliseum Marks and loot are already synchronized." };
  state = {
    ...state,
    processedBattleResultIds: Array.from(processed).slice(-200),
    awardHistory: [...newHistory, ...state.awardHistory].slice(0, COLISEUM_C3_HISTORY_LIMIT),
  };
  const nextSave = writeState(save, state, flags);
  return {
    save: nextSave,
    state,
    ok: true,
    changed: true,
    message: marksAdded > 0 ? `Coliseum rewards synchronized: +${marksAdded} Marks${newHistory.length ? ` across ${newHistory.length} award entries` : ""}.` : "Coliseum result ledger synchronized.",
  };
}

export function getColiseumC3RewardAccess(save: GameSave, reward: ColiseumC3ShopReward): { unlocked: boolean; reason: string } {
  const progress = getColiseumC2Progress(save);
  if (reward.requiredEncounterId && !progress.completedEncounterIds.includes(reward.requiredEncounterId)) {
    return { unlocked: false, reason: `Clear ${getColiseumC2Encounter(reward.requiredEncounterId)?.name ?? reward.requiredEncounterId} first.` };
  }
  const state = getColiseumC3State(save);
  const count = state.purchaseCounts[reward.rewardId] ?? 0;
  if (reward.maxPurchases && count >= reward.maxPurchases) return { unlocked: false, reason: "Purchase limit reached." };
  return { unlocked: true, reason: "Available." };
}

export function getColiseumTechniqueStock(save: GameSave, moveId: BattleMoveId): number {
  return nonNegativeInt(getColiseumC3State(save).techniqueManualStock[moveId]);
}

export function purchaseColiseumC3Reward(save: GameSave, rewardId: string): ColiseumC3Result {
  const synced = syncColiseumC3Rewards(save);
  const workingSave = synced.save;
  let state = synced.state;
  const reward = COLISEUM_C3_SHOP_REWARDS.find((entry) => entry.rewardId === rewardId);
  if (!reward) return { save: workingSave, state, ok: false, changed: synced.changed, message: "The Marks Exchange cannot find that reward." };
  const access = getColiseumC3RewardAccess(workingSave, reward);
  if (!access.unlocked) return { save: workingSave, state, ok: false, changed: synced.changed, message: access.reason };
  if (state.marks < reward.costMarks) return { save: workingSave, state, ok: false, changed: synced.changed, message: `Need ${reward.costMarks} Coliseum Marks for ${reward.name}. Current balance: ${state.marks}.` };

  let flags = { ...workingSave.flags };
  let fulfillment = reward.name;
  if (reward.itemId && reward.itemQuantity) {
    const itemResult = addItemToFlags(workingSave, flags, reward.itemId, reward.itemQuantity);
    if (itemResult.added <= 0) return { save: workingSave, state, ok: false, changed: synced.changed, message: itemResult.label || `${reward.name} stock is full.` };
    flags = itemResult.flags;
    fulfillment = itemResult.label;
  } else if (reward.moveId) {
    state = {
      ...state,
      techniqueManualStock: {
        ...state.techniqueManualStock,
        [reward.moveId]: getColiseumTechniqueStock(workingSave, reward.moveId) + 1,
      },
    };
    fulfillment = `+1 ${getBattleMove(reward.moveId).name} Manual`;
  } else if (reward.contractId) {
    if (state.pendingContractIds.includes(reward.contractId) || state.recruitedContractIds.includes(reward.contractId)) {
      return { save: workingSave, state, ok: false, changed: synced.changed, message: "That one-time contract is already owned or recruited." };
    }
    state = { ...state, pendingContractIds: [...state.pendingContractIds, reward.contractId] };
    fulfillment = `${reward.name} added to Recruitment Hold`;
  } else if (reward.kind === "prestige") {
    flags.coliseumChampionBanner = true;
    fulfillment = "Champion Banner unlocked";
  }

  state = {
    ...state,
    marks: state.marks - reward.costMarks,
    purchaseCounts: { ...state.purchaseCounts, [reward.rewardId]: (state.purchaseCounts[reward.rewardId] ?? 0) + 1 },
    awardHistory: [{
      awardId: `purchase_${reward.rewardId}_${(state.purchaseCounts[reward.rewardId] ?? 0) + 1}_${workingSave.dayState.dayNumber}`,
      sourceResultId: reward.rewardId,
      encounterName: reward.name,
      dayNumber: workingSave.dayState.dayNumber,
      marks: -reward.costMarks,
      lootLabel: fulfillment,
      reason: "purchase",
    }, ...state.awardHistory].slice(0, COLISEUM_C3_HISTORY_LIMIT),
  };
  const nextSave = writeState(workingSave, state, flags);
  return { save: nextSave, state, ok: true, changed: true, message: `${reward.name} purchased for ${reward.costMarks} Marks. ${fulfillment}.` };
}

export function teachColiseumTechnique(
  save: GameSave,
  creatureId: CreatureId,
  moveId: BattleMoveId,
  replaceLearnedMoveId?: BattleMoveId,
): ColiseumC3Result {
  const move = getBattleMove(moveId);
  let state = getColiseumC3State(save);
  const stock = nonNegativeInt(state.techniqueManualStock[moveId]);
  if (move.sourceType !== "coliseum") return { save, state, ok: false, changed: false, message: `${move.name} is not a Coliseum-exclusive technique.` };
  if (stock <= 0) return { save, state, ok: false, changed: false, message: `No ${move.name} Manual is available.` };
  const creature = (save.creatures ?? []).find((entry) => entry.creatureId === creatureId);
  if (!creature) return { save, state, ok: false, changed: false, message: "Creature not found for Coliseum technique training." };
  let loadout = getCreatureBattleMoveLoadout(creature);
  if (loadout.learnedMoveIds.includes(moveId)) return { save, state, ok: false, changed: false, message: `${creature.nickname} already knows ${move.name}.` };
  let replacementLabel = "";
  if (loadout.learnedMoveIds.length >= MAX_LEARNED_BATTLE_MOVES) {
    if (!replaceLearnedMoveId) return { save, state, ok: false, changed: false, message: `Choose a learned move to replace before teaching ${move.name}.` };
    if (replaceLearnedMoveId === REQUIRED_BASIC_BATTLE_MOVE_ID) return { save, state, ok: false, changed: false, message: "The required basic move cannot be forgotten." };
    const forgotten = forgetBattleMove(creature.speciesId, loadout, replaceLearnedMoveId);
    if (!forgotten.ok) return { save, state, ok: false, changed: false, message: forgotten.message };
    replacementLabel = ` ${getBattleMove(replaceLearnedMoveId).name} was forgotten.`;
    loadout = forgotten.loadout;
  }
  const learned = learnBattleMove(creature.speciesId, loadout, moveId);
  if (!learned.ok) return { save, state, ok: false, changed: false, message: learned.message };
  const creatures = (save.creatures ?? []).map((entry) => entry.creatureId === creatureId ? { ...entry, battleMoveLoadout: learned.loadout } : entry);
  state = { ...state, techniqueManualStock: { ...state.techniqueManualStock, [moveId]: stock - 1 } };
  const nextSave = writeState({ ...save, creatures, creatureIds: creatures.map((entry) => entry.creatureId) }, state);
  return { save: nextSave, state, ok: true, changed: true, message: `${creature.nickname} learned ${move.name}.${replacementLabel}` };
}

function talentInstance(talentId: string, grade: AbilityGrade): CreatureAbility | null {
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

function buildContractCreature(save: GameSave, contract: ColiseumContractDefinition): CreatureRecord {
  const variant = getVariantDefinition(contract.variantId);
  const species = getSpeciesDefinition(variant.speciesId);
  const creatureId = `creature_coliseum_${contract.contractId}` as CreatureId;
  const baseStats = buildStats(species.baseStats, variant.statAdjustments, contract.statGrades);
  const maxHearts = getBaseMaxHearts(species.speciesId, variant.variantId);
  const base: CreatureRecord = {
    creatureId,
    ownerSaveId: String(save.saveId),
    speciesId: species.speciesId,
    variantId: variant.variantId,
    habitatId: getHabitatIdForFamily(variant.family),
    nickname: contract.nickname,
    level: 1,
    xp: 0,
    xpToNext: xpToNext(1),
    stats: baseStats,
    statGrades: { ...contract.statGrades },
    growthProgress: { STR: 0, DEX: 0, STA: 0, CHA: 0, WIL: 0, FER: 0 },
    abilities: normalizeTalentInstances(contract.talents.map((entry) => talentInstance(entry.talentId, entry.grade)).filter((entry): entry is CreatureAbility => Boolean(entry))),
    battleMoveLoadout: {
      learnedMoveIds: Array.from(new Set(contract.learnedMoveIds)).slice(0, 8),
      equippedMoveIds: Array.from(new Set(contract.equippedMoveIds)).slice(0, 4),
      version: 1,
    },
    energy: 1,
    maxEnergy: 1,
    hearts: maxHearts,
    maxHearts,
    affection: 55,
    generation: 1,
    shiny: false,
    cosmeticVariant: contract.cosmeticVariant,
    origin: "guild",
    originLabel: `Coliseum Contract · ${contract.name}`,
    isLocked: false,
    createdAt: new Date().toISOString(),
    notes: `${contract.description} Recruited through the Coliseum Marks Exchange.`,
  };
  const growth = applyCreatureLevelGrowth(base, Math.max(0, contract.level - 1), [], `${save.saveId}_${contract.contractId}`);
  const leveled = { ...base, level: contract.level, stats: growth.stats, growthProgress: growth.growthProgress };
  const maxEnergy = getProjectedMaxEnergyForCreature(leveled);
  return { ...leveled, xpToNext: xpToNext(contract.level), maxEnergy, energy: maxEnergy };
}

export function getColiseumContract(contractId: string): ColiseumContractDefinition | null {
  return COLISEUM_CREATURE_CONTRACTS.find((entry) => entry.contractId === contractId) ?? null;
}

export function getColiseumContractCapacity(save: GameSave, contractId: string): { canRedeem: boolean; reason: string; habitatName: string; occupied: number; capacity: number } {
  const contract = getColiseumContract(contractId);
  if (!contract) return { canRedeem: false, reason: "Unknown Coliseum contract.", habitatName: "Unknown Habitat", occupied: 0, capacity: 0 };
  const variant = getVariantDefinition(contract.variantId);
  const habitatId = getHabitatIdForFamily(variant.family);
  const habitat = (save.habitats ?? []).find((entry) => entry.habitatId === habitatId);
  if (!habitat || !habitat.unlocked) return { canRedeem: false, reason: `${variant.family} habitat is not available.`, habitatName: `${variant.family} habitat`, occupied: 0, capacity: 0 };
  const occupied = (save.creatures ?? []).filter((creature) => creature.habitatId === habitatId).length;
  const canRedeem = occupied < habitat.capacity;
  return { canRedeem, reason: canRedeem ? "Habitat space available." : `${habitat.name} is full (${occupied}/${habitat.capacity}). The contract remains in Recruitment Hold.`, habitatName: habitat.name, occupied, capacity: habitat.capacity };
}

export function redeemColiseumCreatureContract(save: GameSave, contractId: string): ColiseumC3Result {
  let state = getColiseumC3State(save);
  const contract = getColiseumContract(contractId);
  if (!contract) return { save, state, ok: false, changed: false, message: "Unknown Coliseum contract." };
  if (!state.pendingContractIds.includes(contractId)) return { save, state, ok: false, changed: false, message: `${contract.name} is not waiting in Recruitment Hold.` };
  if (state.recruitedContractIds.includes(contractId)) return { save, state, ok: false, changed: false, message: `${contract.nickname} has already joined the ranch.` };
  const capacity = getColiseumContractCapacity(save, contractId);
  if (!capacity.canRedeem) return { save, state, ok: false, changed: false, message: capacity.reason };
  const creature = buildContractCreature(save, contract);
  if ((save.creatures ?? []).some((entry) => entry.creatureId === creature.creatureId)) return { save, state, ok: false, changed: false, message: `${contract.nickname} is already present in this save.` };
  const creatures = [...(save.creatures ?? []), creature];
  const habitats = (save.habitats ?? []).map((habitat) => habitat.habitatId === creature.habitatId ? { ...habitat, creatureIds: Array.from(new Set([...habitat.creatureIds, creature.creatureId])) } : habitat);
  state = {
    ...state,
    pendingContractIds: state.pendingContractIds.filter((id) => id !== contractId),
    recruitedContractIds: [...state.recruitedContractIds, contractId],
    awardHistory: [{
      awardId: `contract_${contractId}_${save.dayState.dayNumber}`,
      sourceResultId: contractId,
      encounterName: contract.name,
      dayNumber: save.dayState.dayNumber,
      marks: 0,
      lootLabel: `${contract.nickname} joined ${capacity.habitatName}`,
      reason: "contract",
    }, ...state.awardHistory].slice(0, COLISEUM_C3_HISTORY_LIMIT),
  };
  const nextSave = writeState({ ...save, creatures, creatureIds: creatures.map((entry) => entry.creatureId), habitats, habitatIds: habitats.map((entry) => entry.habitatId) }, state);
  return { save: nextSave, state, ok: true, changed: true, message: `${contract.nickname}, the ${contract.name}, joined the ranch at level ${contract.level}.` };
}

export function getColiseumC3Summary(save: GameSave) {
  const state = getColiseumC3State(save);
  const progress = getColiseumC2Progress(save);
  return {
    marks: state.marks,
    completedEncounters: progress.completedEncounterIds.length,
    totalEncounters: COLISEUM_C2_ENCOUNTERS.length,
    pendingContracts: state.pendingContractIds.length,
    recruitedContracts: state.recruitedContractIds.length,
    techniqueManuals: Object.values(state.techniqueManualStock).reduce((sum, value) => sum + nonNegativeInt(value), 0),
    purchasedRewards: Object.values(state.purchaseCounts).reduce((sum, value) => sum + nonNegativeInt(value), 0),
  };
}
