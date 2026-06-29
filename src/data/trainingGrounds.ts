import { getCreatureMaxEnergyFromStats, getVariantDefinition, shiftStatGrade } from "@/data/creatures";
import type { CreatureRecord, CreatureStatKey, StatGrade } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export type TrainingFocusId = "level_drill" | "stat_coaching" | "chore_prep" | "breeding_fitness";
export type TrainingFocus = { focusId: TrainingFocusId; name: string; category: "XP" | "Stats" | "Chores" | "Breeding"; description: string; costGold: number; energyCost: number; iconPath: string; effectLabel: string };
export type TrainingResult = { save: GameSave; ok: boolean; message: string };

export const RHEA_FLINT = {
  npcId: "rhea_flint",
  name: "Rhea Flint",
  title: "Training Grounds Coach",
  portraitPath: "/images/npcs/town/rhea_flint_portrait.png",
  profilePath: "/images/npcs/town/rhea_flint_profile.png",
  intro: "Rhea Flint runs focused creature drills for leveling, stat coaching, chore prep, and general conditioning.",
} as const;

export const TRAINING_FOCI: TrainingFocus[] = [
  { focusId: "level_drill", name: "Level Drill", category: "XP", description: "A short fundamentals session that gives creature XP without advancing the day.", costGold: 60, energyCost: 10, iconPath: "/images/ui/icons/icon_training_xp.png", effectLabel: "+35 XP. Can level up if the creature reaches its XP target." },
  { focusId: "stat_coaching", name: "Stat Coaching", category: "Stats", description: "A targeted drill for the creature's weakest projected grade. Not guaranteed, but useful for long-term improvement.", costGold: 120, energyCost: 14, iconPath: "/images/ui/icons/icon_training_stats.png", effectLabel: "32% chance to improve the lowest stat grade by one rank and add +1 to that stat." },
  { focusId: "chore_prep", name: "Chore Prep", category: "Chores", description: "Practical warmups for ranch jobs, hauling, patrols, and service contracts.", costGold: 75, energyCost: 8, iconPath: "/images/ui/icons/icon_training_chore.png", effectLabel: "+4 affection, +6 energy recovery after the session, and a visible prep note." },
  { focusId: "breeding_fitness", name: "Breeding Fitness", category: "Breeding", description: "Gentle conditioning focused on stamina, calm, and fertility readiness for future pairing plans.", costGold: 90, energyCost: 8, iconPath: "/images/ui/icons/icon_training_breeding.png", effectLabel: "+5 affection and a short-lived breeding prep flag for later integration." },
];

const STAT_GRADE_ORDER: StatGrade[] = ["D", "C", "B", "A", "S"];
function getCreatureXpToNext(level: number): number { return 45 + level * 30; }
function getFlagNumber(value: boolean | number | string | undefined): number { const parsed = typeof value === "number" ? value : Number(value ?? 0); return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0; }
function deterministicRoll(seed: string, modulo = 100): number { let hash = 0; for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003; return Math.abs(hash) % modulo; }
function statGradeScore(grade: StatGrade): number { return STAT_GRADE_ORDER.indexOf(grade); }
function getLowestUpgradeableStatKey(creature: CreatureRecord, seed: string): CreatureStatKey | null { const entries = Object.entries(creature.statGrades).filter((entry): entry is [CreatureStatKey, StatGrade] => entry[1] !== "S"); if (!entries.length) return null; const sorted = entries.sort((a, b) => statGradeScore(a[1]) - statGradeScore(b[1])); const lowest = statGradeScore(sorted[0][1]); const tied = sorted.filter((entry) => statGradeScore(entry[1]) === lowest); return tied[deterministicRoll(seed, tied.length)]?.[0] ?? sorted[0][0]; }
function getTrainingFlag(creatureId: CreatureId, focusId: TrainingFocusId): string { return `trainingGrounds_${creatureId}_${focusId}`; }

function applyXp(creature: CreatureRecord, xpGain: number): { creature: CreatureRecord; leveled: boolean } {
  let level = creature.level;
  let xp = creature.xp + xpGain;
  let xpToNext = creature.xpToNext;
  let leveled = false;
  let stats = creature.stats;
  let maxEnergy = creature.maxEnergy;
  while (xp >= xpToNext && level < 100) {
    xp -= xpToNext;
    level += 1;
    xpToNext = getCreatureXpToNext(level);
    leveled = true;
    stats = { ...stats, STA: stats.STA + 1, WIL: stats.WIL + 1 };
    maxEnergy = getCreatureMaxEnergyFromStats(stats, creature.variantId);
  }
  return { creature: { ...creature, level, xp, xpToNext, stats, maxEnergy, energy: Math.min(maxEnergy, creature.energy + (leveled ? 8 : 0)) }, leveled };
}

export function getTrainingFocus(focusId: string): TrainingFocus | null { return TRAINING_FOCI.find((focus) => focus.focusId === focusId) ?? null; }
export function getTrainingCount(save: GameSave, creatureId: CreatureId, focusId: TrainingFocusId): number { return getFlagNumber(save.flags[getTrainingFlag(creatureId, focusId)]); }
export function getTrainingCreatureLabel(creature: CreatureRecord): string { const variant = getVariantDefinition(creature.variantId); return `${creature.nickname} • Lv. ${creature.level} ${variant.name} • ${creature.energy}/${creature.maxEnergy} Energy`; }

export function applyTrainingGroundsFocus(save: GameSave, creatureId: CreatureId, focusId: TrainingFocusId): TrainingResult {
  const focus = getTrainingFocus(focusId);
  if (!focus) return { save, ok: false, message: "Rhea cannot find that training plan." };
  const creature = (save.creatures ?? []).find((item) => item.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "That creature is not available for training." };
  if (save.currencies.gold < focus.costGold) return { save, ok: false, message: `Need ${focus.costGold} Gold for ${focus.name}.` };
  if (creature.energy < focus.energyCost) return { save, ok: false, message: `${creature.nickname} needs ${focus.energyCost} Energy for ${focus.name}.` };

  const attemptNumber = getTrainingCount(save, creatureId, focusId);
  let trained: CreatureRecord = { ...creature, energy: creature.energy - focus.energyCost };
  let message = `${creature.nickname} completed ${focus.name}.`;
  const notes: string[] = [];

  if (focusId === "level_drill") {
    const xpResult = applyXp(trained, 35);
    trained = xpResult.creature;
    message += xpResult.leveled ? " They gained 35 XP and leveled up." : " They gained 35 XP.";
    notes.push("Training Grounds Level Drill completed.");
  } else if (focusId === "stat_coaching") {
    const chance = 32;
    const roll = deterministicRoll(`${save.saveId}_${creatureId}_${focusId}_${attemptNumber}`, 100);
    const statKey = getLowestUpgradeableStatKey(trained, `${creatureId}_${focusId}_${attemptNumber}`);
    if (statKey && roll < chance) {
      const oldGrade = trained.statGrades[statKey];
      const newGrade = shiftStatGrade(oldGrade, 1);
      const stats = { ...trained.stats, [statKey]: trained.stats[statKey] + 1 };
      const maxEnergy = getCreatureMaxEnergyFromStats(stats, trained.variantId);
      trained = { ...trained, stats, statGrades: { ...trained.statGrades, [statKey]: newGrade }, maxEnergy, energy: Math.min(maxEnergy, trained.energy + (statKey === "STA" ? 4 : 0)) };
      message += ` Rhea improved ${statKey} from ${oldGrade} to ${newGrade} and added +1 ${statKey}.`;
      notes.push(`Training Grounds Stat Coaching improved ${statKey} from ${oldGrade} to ${newGrade}.`);
    } else {
      message += ` No stat grade improved this time. Chance was ${chance}%.`;
      notes.push("Training Grounds Stat Coaching completed with no stat grade improvement.");
    }
  } else if (focusId === "chore_prep") {
    trained = { ...trained, affection: Math.min(100, trained.affection + 4), energy: Math.min(trained.maxEnergy, trained.energy + 6) };
    message += " They gained +4 affection and recovered 6 energy after the warmup.";
    notes.push("Training Grounds Chore Prep completed. Future chore bonus integration pending.");
  } else if (focusId === "breeding_fitness") {
    trained = { ...trained, affection: Math.min(100, trained.affection + 5) };
    message += " They gained +5 affection and a breeding fitness prep marker.";
    notes.push("Training Grounds Breeding Fitness completed. Future breeding prep integration pending.");
  }

  const nextCreatures = (save.creatures ?? []).map((item) => item.creatureId === creatureId ? { ...trained, notes: `${trained.notes ?? ""} ${notes.join(" ")}`.trim() } : item);
  const nextSave: GameSave = { ...save, updatedAt: new Date().toISOString(), currencies: { ...save.currencies, gold: save.currencies.gold - focus.costGold }, creatures: nextCreatures, flags: { ...save.flags, m45TrainingGrounds: true, [getTrainingFlag(creatureId, focusId)]: attemptNumber + 1, [`trainingGroundsLast_${creatureId}`]: focusId, [`trainingGroundsBreedingPrep_${creatureId}`]: focusId === "breeding_fitness" ? save.dayState.dayNumber + 3 : save.flags[`trainingGroundsBreedingPrep_${creatureId}`] } };
  return { save: nextSave, ok: true, message };
}
