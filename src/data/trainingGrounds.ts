import { getCreatureMaxEnergyFromStats, getVariantDefinition, shiftStatGrade } from "@/data/creatures";
import type { CreatureRecord, CreatureStatKey, StatGrade } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export type TrainingFocusId = "level_drill" | "stat_coaching" | "focused_stat_coaching";
export type TrainingUpgradeId = "training_yard_upgrade" | "coaching_bench_upgrade" | "assistant_trainer" | "advanced_training_license";
export type TrainingFocus = { focusId: TrainingFocusId; name: string; category: "XP" | "Stats"; description: string; costGold: number; durationDays: number; iconPath: string; effectLabel: string; requiresUpgradeId?: TrainingUpgradeId; requiresTargetStat?: boolean };
export type TrainingUpgrade = { upgradeId: TrainingUpgradeId; name: string; description: string; costGold: number; iconPath: string; effectLabel: string };
export type TrainingUpgradeEffects = { maxAssignments: number; levelDrillXp: number; statCoachingChance: number; focusedTrainingUnlocked: boolean };
export type TrainingAssignment = { creatureId: CreatureId; focusId: TrainingFocusId; startDayNumber: number; returnDayNumber: number; isReady: boolean; daysRemaining: number; targetStatKey?: CreatureStatKey };
export type TrainingRewardSummary = { creatureName: string; focusName: string; xpBefore: number; xpAfter: number; xpToNextBefore: number; xpToNextAfter: number; levelBefore: number; levelAfter: number; leveled: boolean; statKey?: CreatureStatKey; statBefore?: number; statAfter?: number; gradeBefore?: StatGrade; gradeAfter?: StatGrade; statRoll?: number; statChance?: number; statSucceeded?: boolean; notes: string[] };
export type TrainingResult = { save: GameSave; ok: boolean; message: string; reward?: TrainingRewardSummary };

export const RHEA_FLINT = { npcId: "rhea_flint", name: "Rhea Flint", title: "Training Grounds Coach", portraitPath: "/images/npcs/town/rhea_flint_portrait.png", profilePath: "/images/npcs/town/rhea_flint_profile.png", intro: "Rhea Flint runs focused creature drills for leveling and careful stat coaching." } as const;

export const TRAINING_UPGRADES: TrainingUpgrade[] = [
  { upgradeId: "training_yard_upgrade", name: "Upgrade Training Yard", description: "Rebuild the yard with better lanes, safer weights, and recovery stations.", costGold: 350, iconPath: "/images/ui/icons/icon_training_xp.png", effectLabel: "Level Drill XP increases from 35 to 55." },
  { upgradeId: "coaching_bench_upgrade", name: "Upgrade Coaching Bench", description: "Adds better measurement tools and repeatable coaching routines.", costGold: 500, iconPath: "/images/ui/icons/icon_training_stats.png", effectLabel: "Stat Coaching chance increases from 18% to 25%." },
  { upgradeId: "assistant_trainer", name: "Hire Assistant Trainer", description: "An assistant coach lets Rhea supervise more than one creature at a time.", costGold: 650, iconPath: "/images/ui/icons/icon_training_whistle.png", effectLabel: "Training capacity increases from 1 creature to 2 creatures." },
  { upgradeId: "advanced_training_license", name: "Advanced Training License", description: "Unlocks targeted stat coaching for advanced improvement plans.", costGold: 850, iconPath: "/images/ui/icons/icon_stat_grade.png", effectLabel: "Unlocks Focused Stat Coaching: choose STR / DEX / STA / CHA / WIL / FER." },
];

export const TRAINING_FOCI: TrainingFocus[] = [
  { focusId: "level_drill", name: "Level Drill", category: "XP", description: "Leave a creature with Rhea for a short fundamentals program focused on reliable XP gain.", costGold: 80, durationDays: 1, iconPath: "/images/ui/icons/icon_training_xp.png", effectLabel: "Takes 1 day. On return: +35 XP, or +55 XP with the Training Yard upgrade. Can level up." },
  { focusId: "stat_coaching", name: "Stat Coaching", category: "Stats", description: "Leave a creature for a longer, focused coaching plan aimed at its weakest stat grade.", costGold: 180, durationDays: 3, iconPath: "/images/ui/icons/icon_training_stats.png", effectLabel: "Takes 3 days. On return: 18% chance, or 25% with the Coaching Bench, to improve the lowest stat grade by one rank and add +1 to that stat." },
  { focusId: "focused_stat_coaching", name: "Focused Stat Coaching", category: "Stats", description: "Choose a specific stat for Rhea to coach. It takes longer, but gives control over which stat can improve.", costGold: 260, durationDays: 4, iconPath: "/images/ui/icons/icon_stat_grade.png", effectLabel: "Requires Advanced Training License. Takes 4 days. Uses the Stat Coaching chance, but targets a chosen stat if it is not already Grade S.", requiresUpgradeId: "advanced_training_license", requiresTargetStat: true },
];

const STAT_KEYS: CreatureStatKey[] = ["STR", "DEX", "STA", "CHA", "WIL", "FER"];
const STAT_GRADE_ORDER: StatGrade[] = ["D", "C", "B", "A", "S"];
const BASE_STAT_COACHING_CHANCE = 18;
const UPGRADED_STAT_COACHING_CHANCE = 25;
const BASE_LEVEL_DRILL_XP = 35;
const UPGRADED_LEVEL_DRILL_XP = 55;
function getCreatureXpToNext(level: number): number { return 45 + level * 30; }
function getFlagNumber(value: boolean | number | string | undefined, fallback = 0): number { const parsed = typeof value === "number" ? value : Number(value ?? fallback); return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback; }
function getFlagBool(value: boolean | number | string | undefined): boolean { return value === true || value === "true" || value === 1 || value === "1"; }
function deterministicRoll(seed: string, modulo = 100): number { let hash = 0; for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003; return Math.abs(hash) % modulo; }
function statGradeScore(grade: StatGrade): number { return STAT_GRADE_ORDER.indexOf(grade); }
function getTrainingCountFlag(creatureId: CreatureId, focusId: TrainingFocusId): string { return `trainingGrounds_${creatureId}_${focusId}`; }
function getTrainingUpgradeFlag(upgradeId: TrainingUpgradeId): string { return `trainingUpgrade_${upgradeId}`; }
function getAssignmentFocusFlag(creatureId: CreatureId): string { return `trainingGroundsAssignment_${creatureId}`; }
function getAssignmentStartFlag(creatureId: CreatureId): string { return `trainingGroundsStartDay_${creatureId}`; }
function getAssignmentReturnFlag(creatureId: CreatureId): string { return `trainingGroundsReturnDay_${creatureId}`; }
function getAssignmentTargetFlag(creatureId: CreatureId): string { return `trainingGroundsTargetStat_${creatureId}`; }
function isStatKey(value: unknown): value is CreatureStatKey { return typeof value === "string" && STAT_KEYS.includes(value as CreatureStatKey); }
function getLowestUpgradeableStatKey(creature: CreatureRecord, seed: string): CreatureStatKey | null { const entries = Object.entries(creature.statGrades).filter((entry): entry is [CreatureStatKey, StatGrade] => entry[1] !== "S"); if (!entries.length) return null; const sorted = entries.sort((a, b) => statGradeScore(a[1]) - statGradeScore(b[1])); const lowest = statGradeScore(sorted[0][1]); const tied = sorted.filter((entry) => statGradeScore(entry[1]) === lowest); return tied[deterministicRoll(seed, tied.length)]?.[0] ?? sorted[0][0]; }

function applyXp(creature: CreatureRecord, xpGain: number): { creature: CreatureRecord; leveled: boolean } {
  let level = creature.level; let xp = creature.xp + xpGain; let xpToNext = creature.xpToNext; let leveled = false; let stats = creature.stats; let maxEnergy = creature.maxEnergy;
  while (xp >= xpToNext && level < 100) { xp -= xpToNext; level += 1; xpToNext = getCreatureXpToNext(level); leveled = true; stats = { ...stats, STA: stats.STA + 1, WIL: stats.WIL + 1 }; maxEnergy = getCreatureMaxEnergyFromStats(stats, creature.variantId); }
  return { creature: { ...creature, level, xp, xpToNext, stats, maxEnergy, energy: Math.min(maxEnergy, creature.energy + (leveled ? 8 : 0)) }, leveled };
}

export function getTrainingFocus(focusId: string): TrainingFocus | null { return TRAINING_FOCI.find((focus) => focus.focusId === focusId) ?? null; }
export function getTrainingUpgrade(upgradeId: string): TrainingUpgrade | null { return TRAINING_UPGRADES.find((upgrade) => upgrade.upgradeId === upgradeId) ?? null; }
export function hasTrainingUpgrade(save: GameSave, upgradeId: TrainingUpgradeId): boolean { return getFlagBool(save.flags[getTrainingUpgradeFlag(upgradeId)]); }
export function getTrainingUpgradeEffects(save: GameSave): TrainingUpgradeEffects { return { maxAssignments: hasTrainingUpgrade(save, "assistant_trainer") ? 2 : 1, levelDrillXp: hasTrainingUpgrade(save, "training_yard_upgrade") ? UPGRADED_LEVEL_DRILL_XP : BASE_LEVEL_DRILL_XP, statCoachingChance: hasTrainingUpgrade(save, "coaching_bench_upgrade") ? UPGRADED_STAT_COACHING_CHANCE : BASE_STAT_COACHING_CHANCE, focusedTrainingUnlocked: hasTrainingUpgrade(save, "advanced_training_license") }; }
export function getTrainingCount(save: GameSave, creatureId: CreatureId, focusId: TrainingFocusId): number { return getFlagNumber(save.flags[getTrainingCountFlag(creatureId, focusId)]); }
export function getTrainingCreatureLabel(creature: CreatureRecord): string { const variant = getVariantDefinition(creature.variantId); return `${creature.nickname} • Lv. ${creature.level} ${variant.name} • ${creature.energy}/${creature.maxEnergy} Energy`; }
export function getTrainingAssignment(save: GameSave, creatureId: CreatureId): TrainingAssignment | null { const focusId = String(save.flags[getAssignmentFocusFlag(creatureId)] ?? "") as TrainingFocusId; if (!getTrainingFocus(focusId)) return null; const startDayNumber = getFlagNumber(save.flags[getAssignmentStartFlag(creatureId)], save.dayState.dayNumber); const returnDayNumber = getFlagNumber(save.flags[getAssignmentReturnFlag(creatureId)], save.dayState.dayNumber); const daysRemaining = Math.max(0, returnDayNumber - save.dayState.dayNumber); const targetValue = save.flags[getAssignmentTargetFlag(creatureId)]; const targetStatKey = isStatKey(targetValue) ? targetValue : undefined; return { creatureId, focusId, startDayNumber, returnDayNumber, daysRemaining, isReady: save.dayState.dayNumber >= returnDayNumber, targetStatKey }; }
export function isCreatureAwayForTraining(save: GameSave, creatureId: CreatureId): boolean { return Boolean(getTrainingAssignment(save, creatureId)); }
export function getActiveTrainingAssignmentCount(save: GameSave): number { return (save.creatures ?? []).filter((creature) => getTrainingAssignment(save, creature.creatureId)).length; }
export function getTrainingStatusLabel(save: GameSave, creatureId: CreatureId): string { const assignment = getTrainingAssignment(save, creatureId); if (!assignment) return "Available"; const focus = getTrainingFocus(assignment.focusId); const target = assignment.targetStatKey ? ` (${assignment.targetStatKey})` : ""; if (assignment.isReady) return `${focus?.name ?? "Training"}${target} complete — collect from Rhea`; return `${focus?.name ?? "Training"}${target} with Rhea — ${assignment.daysRemaining} day(s) left`; }
export function getTrainingUnavailableReason(save: GameSave, creatureId: CreatureId): string | null { const assignment = getTrainingAssignment(save, creatureId); if (!assignment) return null; return getTrainingStatusLabel(save, creatureId); }
export function getTrainingReturnSummaryItems(save: GameSave): string[] { return (save.creatures ?? []).flatMap((creature) => { const assignment = getTrainingAssignment(save, creature.creatureId); if (!assignment || !assignment.isReady) return []; const focus = getTrainingFocus(assignment.focusId); const target = assignment.targetStatKey ? ` (${assignment.targetStatKey})` : ""; return [`${creature.nickname} returns from ${focus?.name ?? "training"}${target} today. Visit Rhea at the Training Grounds to collect the result.`]; }); }
export function getTrainingHistorySummary(save: GameSave, creatureId: CreatureId): string { return TRAINING_FOCI.map((focus) => `${focus.name}: ${getTrainingCount(save, creatureId, focus.focusId)}`).join(" • "); }

export function purchaseTrainingUpgrade(save: GameSave, upgradeId: TrainingUpgradeId): TrainingResult {
  const upgrade = getTrainingUpgrade(upgradeId);
  if (!upgrade) return { save, ok: false, message: "Rhea cannot find that Training Grounds upgrade." };
  if (hasTrainingUpgrade(save, upgradeId)) return { save, ok: false, message: `${upgrade.name} is already installed.` };
  if (save.currencies.gold < upgrade.costGold) return { save, ok: false, message: `Need ${upgrade.costGold} Gold for ${upgrade.name}.` };
  return { save: { ...save, updatedAt: new Date().toISOString(), currencies: { ...save.currencies, gold: save.currencies.gold - upgrade.costGold }, flags: { ...save.flags, m49TrainingUpgrades: true, [getTrainingUpgradeFlag(upgradeId)]: true } }, ok: true, message: `${upgrade.name} installed. ${upgrade.effectLabel}` };
}

export function startTrainingGroundsAssignment(save: GameSave, creatureId: CreatureId, focusId: TrainingFocusId, targetStatKey?: CreatureStatKey): TrainingResult {
  const focus = getTrainingFocus(focusId);
  if (!focus) return { save, ok: false, message: "Rhea cannot find that training plan." };
  const creature = (save.creatures ?? []).find((item) => item.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "That creature is not available for training." };
  if (focus.requiresUpgradeId && !hasTrainingUpgrade(save, focus.requiresUpgradeId)) return { save, ok: false, message: `${focus.name} requires ${getTrainingUpgrade(focus.requiresUpgradeId)?.name ?? "an upgrade"}.` };
  if (focus.requiresTargetStat && !targetStatKey) return { save, ok: false, message: `${focus.name} requires choosing a target stat.` };
  if (targetStatKey && creature.statGrades[targetStatKey] === "S") return { save, ok: false, message: `${creature.nickname}'s ${targetStatKey} is already Grade S.` };
  if (isCreatureAwayForTraining(save, creatureId)) return { save, ok: false, message: `${creature.nickname} is already with Rhea. ${getTrainingStatusLabel(save, creatureId)}.` };
  const effects = getTrainingUpgradeEffects(save);
  if (getActiveTrainingAssignmentCount(save) >= effects.maxAssignments) return { save, ok: false, message: `Training Grounds capacity is full (${effects.maxAssignments}/${effects.maxAssignments}). Upgrade with an Assistant Trainer to train more creatures at once.` };
  if (save.currencies.gold < focus.costGold) return { save, ok: false, message: `Need ${focus.costGold} Gold for ${focus.name}.` };
  const returnDayNumber = save.dayState.dayNumber + focus.durationDays;
  const nextSave: GameSave = { ...save, updatedAt: new Date().toISOString(), currencies: { ...save.currencies, gold: save.currencies.gold - focus.costGold }, flags: { ...save.flags, m46TrainingAssignments: true, m49TrainingUpgrades: true, [getAssignmentFocusFlag(creatureId)]: focusId, [getAssignmentStartFlag(creatureId)]: save.dayState.dayNumber, [getAssignmentReturnFlag(creatureId)]: returnDayNumber, [getAssignmentTargetFlag(creatureId)]: targetStatKey ?? "" } };
  const target = targetStatKey ? ` targeting ${targetStatKey}` : "";
  return { save: nextSave, ok: true, message: `${creature.nickname} started ${focus.name}${target} with Rhea. They will be unavailable for ${focus.durationDays} day(s) and return on Day ${returnDayNumber}.` };
}

export function collectTrainingGroundsAssignment(save: GameSave, creatureId: CreatureId): TrainingResult {
  const assignment = getTrainingAssignment(save, creatureId);
  const creature = (save.creatures ?? []).find((item) => item.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "That creature is not available for pickup." };
  if (!assignment) return { save, ok: false, message: `${creature.nickname} is not currently training with Rhea.` };
  if (!assignment.isReady) return { save, ok: false, message: `${creature.nickname} is still training. ${assignment.daysRemaining} day(s) left.` };
  const focus = getTrainingFocus(assignment.focusId);
  if (!focus) return { save, ok: false, message: "Rhea's training notes are missing for this assignment." };
  const effects = getTrainingUpgradeEffects(save);
  const attemptNumber = getTrainingCount(save, creatureId, assignment.focusId);
  let trained: CreatureRecord = { ...creature };
  let message = `${creature.nickname} returned from ${focus.name}.`;
  const notes: string[] = [];
  const reward: TrainingRewardSummary = { creatureName: creature.nickname, focusName: assignment.targetStatKey ? `${focus.name} (${assignment.targetStatKey})` : focus.name, xpBefore: creature.xp, xpAfter: creature.xp, xpToNextBefore: creature.xpToNext, xpToNextAfter: creature.xpToNext, levelBefore: creature.level, levelAfter: creature.level, leveled: false, notes };
  if (assignment.focusId === "level_drill") {
    const xpGain = effects.levelDrillXp;
    const xpResult = applyXp(trained, xpGain);
    trained = xpResult.creature;
    reward.xpAfter = trained.xp; reward.xpToNextAfter = trained.xpToNext; reward.levelAfter = trained.level; reward.leveled = xpResult.leveled;
    message += xpResult.leveled ? ` They gained ${xpGain} XP and leveled up.` : ` They gained ${xpGain} XP.`;
    notes.push(`+${xpGain} XP from Level Drill${effects.levelDrillXp > BASE_LEVEL_DRILL_XP ? " and the upgraded Training Yard" : ""}.`);
    if (xpResult.leveled) notes.push(`Level increased from ${creature.level} to ${trained.level}.`);
  } else if (assignment.focusId === "stat_coaching" || assignment.focusId === "focused_stat_coaching") {
    const roll = deterministicRoll(`${save.saveId}_${creatureId}_${assignment.focusId}_${assignment.startDayNumber}_${attemptNumber}_${assignment.targetStatKey ?? "auto"}`, 100);
    const autoStatKey = getLowestUpgradeableStatKey(trained, `${creatureId}_${assignment.focusId}_${assignment.startDayNumber}`);
    const statKey = assignment.targetStatKey && trained.statGrades[assignment.targetStatKey] !== "S" ? assignment.targetStatKey : autoStatKey;
    reward.statRoll = roll + 1; reward.statChance = effects.statCoachingChance; reward.statKey = statKey ?? undefined;
    if (statKey && roll < effects.statCoachingChance) {
      const oldGrade = trained.statGrades[statKey]; const newGrade = shiftStatGrade(oldGrade, 1); const stats = { ...trained.stats, [statKey]: trained.stats[statKey] + 1 }; const maxEnergy = getCreatureMaxEnergyFromStats(stats, trained.variantId);
      trained = { ...trained, stats, statGrades: { ...trained.statGrades, [statKey]: newGrade }, maxEnergy, energy: Math.min(maxEnergy, trained.energy + (statKey === "STA" ? 4 : 0)) };
      reward.statBefore = creature.stats[statKey]; reward.statAfter = trained.stats[statKey]; reward.gradeBefore = oldGrade; reward.gradeAfter = newGrade; reward.statSucceeded = true;
      message += ` Rhea improved ${statKey} from ${oldGrade} to ${newGrade} and added +1 ${statKey}.`;
      notes.push(`Roll ${roll + 1}/100 succeeded against ${effects.statCoachingChance}%.`);
      notes.push(`${statKey}: Grade ${oldGrade} → ${newGrade}, stat ${creature.stats[statKey]} → ${trained.stats[statKey]}.`);
    } else {
      reward.statSucceeded = false;
      message += ` No stat grade improved this time. Chance was ${effects.statCoachingChance}%.`;
      notes.push(`Roll ${roll + 1}/100 did not hit the ${effects.statCoachingChance}% improvement chance.`);
      notes.push(statKey ? `${statKey} was the coached stat.` : "No eligible stat could be improved.");
    }
  }
  const nextCreatures = (save.creatures ?? []).map((item) => item.creatureId === creatureId ? { ...trained, notes: `${trained.notes ?? ""} Training Grounds: ${notes.join(" ")}`.trim() } : item);
  const nextFlags = { ...save.flags, m46TrainingAssignments: true, m48TrainingRewardPresentation: true, m49TrainingUpgrades: true, [getTrainingCountFlag(creatureId, assignment.focusId)]: attemptNumber + 1, [`trainingGroundsLast_${creatureId}`]: assignment.focusId, [`trainingGroundsLastResult_${creatureId}`]: notes.join(" "), [getAssignmentFocusFlag(creatureId)]: "", [getAssignmentStartFlag(creatureId)]: 0, [getAssignmentReturnFlag(creatureId)]: 0, [getAssignmentTargetFlag(creatureId)]: "" };
  return { save: { ...save, updatedAt: new Date().toISOString(), creatures: nextCreatures, flags: nextFlags }, ok: true, message, reward };
}
