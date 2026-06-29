import { getCreatureMaxEnergyFromStats, getVariantDefinition, shiftStatGrade } from "@/data/creatures";
import type { CreatureRecord, CreatureStatKey, StatGrade } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export type TrainingFocusId = "level_drill" | "stat_coaching";
export type TrainingFocus = { focusId: TrainingFocusId; name: string; category: "XP" | "Stats"; description: string; costGold: number; durationDays: number; iconPath: string; effectLabel: string };
export type TrainingAssignment = { creatureId: CreatureId; focusId: TrainingFocusId; startDayNumber: number; returnDayNumber: number; isReady: boolean; daysRemaining: number };
export type TrainingRewardSummary = { creatureName: string; focusName: string; xpBefore: number; xpAfter: number; xpToNextBefore: number; xpToNextAfter: number; levelBefore: number; levelAfter: number; leveled: boolean; statKey?: CreatureStatKey; statBefore?: number; statAfter?: number; gradeBefore?: StatGrade; gradeAfter?: StatGrade; statRoll?: number; statChance?: number; statSucceeded?: boolean; notes: string[] };
export type TrainingResult = { save: GameSave; ok: boolean; message: string; reward?: TrainingRewardSummary };

export const RHEA_FLINT = {
  npcId: "rhea_flint",
  name: "Rhea Flint",
  title: "Training Grounds Coach",
  portraitPath: "/images/npcs/town/rhea_flint_portrait.png",
  profilePath: "/images/npcs/town/rhea_flint_profile.png",
  intro: "Rhea Flint runs focused creature drills for leveling and careful stat coaching.",
} as const;

export const TRAINING_FOCI: TrainingFocus[] = [
  { focusId: "level_drill", name: "Level Drill", category: "XP", description: "Leave a creature with Rhea for a short fundamentals program focused on reliable XP gain.", costGold: 80, durationDays: 1, iconPath: "/images/ui/icons/icon_training_xp.png", effectLabel: "Takes 1 day. On return: +35 XP. Can level up if the creature reaches its XP target." },
  { focusId: "stat_coaching", name: "Stat Coaching", category: "Stats", description: "Leave a creature for a longer, focused coaching plan aimed at its weakest stat grade.", costGold: 180, durationDays: 3, iconPath: "/images/ui/icons/icon_training_stats.png", effectLabel: "Takes 3 days. On return: 18% chance to improve the lowest stat grade by one rank and add +1 to that stat." },
];

const STAT_GRADE_ORDER: StatGrade[] = ["D", "C", "B", "A", "S"];
const STAT_COACHING_CHANCE = 18;
function getCreatureXpToNext(level: number): number { return 45 + level * 30; }
function getFlagNumber(value: boolean | number | string | undefined, fallback = 0): number { const parsed = typeof value === "number" ? value : Number(value ?? fallback); return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback; }
function deterministicRoll(seed: string, modulo = 100): number { let hash = 0; for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003; return Math.abs(hash) % modulo; }
function statGradeScore(grade: StatGrade): number { return STAT_GRADE_ORDER.indexOf(grade); }
function getLowestUpgradeableStatKey(creature: CreatureRecord, seed: string): CreatureStatKey | null { const entries = Object.entries(creature.statGrades).filter((entry): entry is [CreatureStatKey, StatGrade] => entry[1] !== "S"); if (!entries.length) return null; const sorted = entries.sort((a, b) => statGradeScore(a[1]) - statGradeScore(b[1])); const lowest = statGradeScore(sorted[0][1]); const tied = sorted.filter((entry) => statGradeScore(entry[1]) === lowest); return tied[deterministicRoll(seed, tied.length)]?.[0] ?? sorted[0][0]; }
function getTrainingCountFlag(creatureId: CreatureId, focusId: TrainingFocusId): string { return `trainingGrounds_${creatureId}_${focusId}`; }
function getAssignmentFocusFlag(creatureId: CreatureId): string { return `trainingGroundsAssignment_${creatureId}`; }
function getAssignmentStartFlag(creatureId: CreatureId): string { return `trainingGroundsStartDay_${creatureId}`; }
function getAssignmentReturnFlag(creatureId: CreatureId): string { return `trainingGroundsReturnDay_${creatureId}`; }

function applyXp(creature: CreatureRecord, xpGain: number): { creature: CreatureRecord; leveled: boolean } {
  let level = creature.level;
  let xp = creature.xp + xpGain;
  let xpToNext = creature.xpToNext;
  let leveled = false;
  let stats = creature.stats;
  let maxEnergy = creature.maxEnergy;
  while (xp >= xpToNext && level < 100) { xp -= xpToNext; level += 1; xpToNext = getCreatureXpToNext(level); leveled = true; stats = { ...stats, STA: stats.STA + 1, WIL: stats.WIL + 1 }; maxEnergy = getCreatureMaxEnergyFromStats(stats, creature.variantId); }
  return { creature: { ...creature, level, xp, xpToNext, stats, maxEnergy, energy: Math.min(maxEnergy, creature.energy + (leveled ? 8 : 0)) }, leveled };
}

export function getTrainingFocus(focusId: string): TrainingFocus | null { return TRAINING_FOCI.find((focus) => focus.focusId === focusId) ?? null; }
export function getTrainingCount(save: GameSave, creatureId: CreatureId, focusId: TrainingFocusId): number { return getFlagNumber(save.flags[getTrainingCountFlag(creatureId, focusId)]); }
export function getTrainingCreatureLabel(creature: CreatureRecord): string { const variant = getVariantDefinition(creature.variantId); return `${creature.nickname} • Lv. ${creature.level} ${variant.name} • ${creature.energy}/${creature.maxEnergy} Energy`; }
export function getTrainingAssignment(save: GameSave, creatureId: CreatureId): TrainingAssignment | null { const focusId = String(save.flags[getAssignmentFocusFlag(creatureId)] ?? "") as TrainingFocusId; if (!getTrainingFocus(focusId)) return null; const startDayNumber = getFlagNumber(save.flags[getAssignmentStartFlag(creatureId)], save.dayState.dayNumber); const returnDayNumber = getFlagNumber(save.flags[getAssignmentReturnFlag(creatureId)], save.dayState.dayNumber); const daysRemaining = Math.max(0, returnDayNumber - save.dayState.dayNumber); return { creatureId, focusId, startDayNumber, returnDayNumber, daysRemaining, isReady: save.dayState.dayNumber >= returnDayNumber }; }
export function isCreatureAwayForTraining(save: GameSave, creatureId: CreatureId): boolean { return Boolean(getTrainingAssignment(save, creatureId)); }
export function getTrainingStatusLabel(save: GameSave, creatureId: CreatureId): string { const assignment = getTrainingAssignment(save, creatureId); if (!assignment) return "Available"; const focus = getTrainingFocus(assignment.focusId); if (assignment.isReady) return `${focus?.name ?? "Training"} complete — collect from Rhea`; return `${focus?.name ?? "Training"} with Rhea — ${assignment.daysRemaining} day(s) left`; }
export function getTrainingUnavailableReason(save: GameSave, creatureId: CreatureId): string | null { const assignment = getTrainingAssignment(save, creatureId); if (!assignment) return null; return getTrainingStatusLabel(save, creatureId); }
export function getTrainingReturnSummaryItems(save: GameSave): string[] { return (save.creatures ?? []).flatMap((creature) => { const assignment = getTrainingAssignment(save, creature.creatureId); if (!assignment || !assignment.isReady) return []; const focus = getTrainingFocus(assignment.focusId); return [`${creature.nickname} returns from ${focus?.name ?? "training"} today. Visit Rhea at the Training Grounds to collect the result.`]; }); }
export function getTrainingHistorySummary(save: GameSave, creatureId: CreatureId): string { return TRAINING_FOCI.map((focus) => `${focus.name}: ${getTrainingCount(save, creatureId, focus.focusId)}`).join(" • "); }

export function startTrainingGroundsAssignment(save: GameSave, creatureId: CreatureId, focusId: TrainingFocusId): TrainingResult {
  const focus = getTrainingFocus(focusId);
  if (!focus) return { save, ok: false, message: "Rhea cannot find that training plan." };
  const creature = (save.creatures ?? []).find((item) => item.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "That creature is not available for training." };
  if (isCreatureAwayForTraining(save, creatureId)) return { save, ok: false, message: `${creature.nickname} is already with Rhea. ${getTrainingStatusLabel(save, creatureId)}.` };
  if (save.currencies.gold < focus.costGold) return { save, ok: false, message: `Need ${focus.costGold} Gold for ${focus.name}.` };
  const returnDayNumber = save.dayState.dayNumber + focus.durationDays;
  const nextSave: GameSave = { ...save, updatedAt: new Date().toISOString(), currencies: { ...save.currencies, gold: save.currencies.gold - focus.costGold }, flags: { ...save.flags, m46TrainingAssignments: true, [getAssignmentFocusFlag(creatureId)]: focusId, [getAssignmentStartFlag(creatureId)]: save.dayState.dayNumber, [getAssignmentReturnFlag(creatureId)]: returnDayNumber } };
  return { save: nextSave, ok: true, message: `${creature.nickname} started ${focus.name} with Rhea. They will be unavailable for ${focus.durationDays} day(s) and return on Day ${returnDayNumber}.` };
}

export function collectTrainingGroundsAssignment(save: GameSave, creatureId: CreatureId): TrainingResult {
  const assignment = getTrainingAssignment(save, creatureId);
  const creature = (save.creatures ?? []).find((item) => item.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "That creature is not available for pickup." };
  if (!assignment) return { save, ok: false, message: `${creature.nickname} is not currently training with Rhea.` };
  if (!assignment.isReady) return { save, ok: false, message: `${creature.nickname} is still training. ${assignment.daysRemaining} day(s) left.` };
  const focus = getTrainingFocus(assignment.focusId);
  if (!focus) return { save, ok: false, message: "Rhea's training notes are missing for this assignment." };
  const attemptNumber = getTrainingCount(save, creatureId, assignment.focusId);
  let trained: CreatureRecord = { ...creature };
  let message = `${creature.nickname} returned from ${focus.name}.`;
  const notes: string[] = [];
  const reward: TrainingRewardSummary = { creatureName: creature.nickname, focusName: focus.name, xpBefore: creature.xp, xpAfter: creature.xp, xpToNextBefore: creature.xpToNext, xpToNextAfter: creature.xpToNext, levelBefore: creature.level, levelAfter: creature.level, leveled: false, notes };
  if (assignment.focusId === "level_drill") {
    const xpResult = applyXp(trained, 35);
    trained = xpResult.creature;
    reward.xpAfter = trained.xp;
    reward.xpToNextAfter = trained.xpToNext;
    reward.levelAfter = trained.level;
    reward.leveled = xpResult.leveled;
    message += xpResult.leveled ? " They gained 35 XP and leveled up." : " They gained 35 XP.";
    notes.push("+35 XP from Level Drill.");
    if (xpResult.leveled) notes.push(`Level increased from ${creature.level} to ${trained.level}.`);
  } else if (assignment.focusId === "stat_coaching") {
    const roll = deterministicRoll(`${save.saveId}_${creatureId}_${assignment.focusId}_${assignment.startDayNumber}_${attemptNumber}`, 100);
    const statKey = getLowestUpgradeableStatKey(trained, `${creatureId}_${assignment.focusId}_${assignment.startDayNumber}`);
    reward.statRoll = roll + 1;
    reward.statChance = STAT_COACHING_CHANCE;
    reward.statKey = statKey ?? undefined;
    if (statKey && roll < STAT_COACHING_CHANCE) {
      const oldGrade = trained.statGrades[statKey];
      const newGrade = shiftStatGrade(oldGrade, 1);
      const stats = { ...trained.stats, [statKey]: trained.stats[statKey] + 1 };
      const maxEnergy = getCreatureMaxEnergyFromStats(stats, trained.variantId);
      trained = { ...trained, stats, statGrades: { ...trained.statGrades, [statKey]: newGrade }, maxEnergy, energy: Math.min(maxEnergy, trained.energy + (statKey === "STA" ? 4 : 0)) };
      reward.statBefore = creature.stats[statKey];
      reward.statAfter = trained.stats[statKey];
      reward.gradeBefore = oldGrade;
      reward.gradeAfter = newGrade;
      reward.statSucceeded = true;
      message += ` Rhea improved ${statKey} from ${oldGrade} to ${newGrade} and added +1 ${statKey}.`;
      notes.push(`Roll ${roll + 1}/100 succeeded against ${STAT_COACHING_CHANCE}%.`);
      notes.push(`${statKey}: Grade ${oldGrade} → ${newGrade}, stat ${creature.stats[statKey]} → ${trained.stats[statKey]}.`);
    } else {
      reward.statSucceeded = false;
      message += ` No stat grade improved this time. Chance was ${STAT_COACHING_CHANCE}%.`;
      notes.push(`Roll ${roll + 1}/100 did not hit the ${STAT_COACHING_CHANCE}% improvement chance.`);
      notes.push(statKey ? `${statKey} was the coached lowest eligible stat.` : "No eligible stat could be improved.");
    }
  }
  const nextCreatures = (save.creatures ?? []).map((item) => item.creatureId === creatureId ? { ...trained, notes: `${trained.notes ?? ""} Training Grounds: ${notes.join(" ")}`.trim() } : item);
  const nextFlags = { ...save.flags, m46TrainingAssignments: true, m48TrainingRewardPresentation: true, [getTrainingCountFlag(creatureId, assignment.focusId)]: attemptNumber + 1, [`trainingGroundsLast_${creatureId}`]: assignment.focusId, [`trainingGroundsLastResult_${creatureId}`]: notes.join(" "), [getAssignmentFocusFlag(creatureId)]: "", [getAssignmentStartFlag(creatureId)]: 0, [getAssignmentReturnFlag(creatureId)]: 0 };
  return { save: { ...save, updatedAt: new Date().toISOString(), creatures: nextCreatures, flags: nextFlags }, ok: true, message, reward };
}
