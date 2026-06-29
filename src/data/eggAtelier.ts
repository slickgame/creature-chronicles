import { shiftStatGrade } from "@/data/creatures";
import { getNpcTrustRecord, grantNpcTrust } from "@/data/townNpcs";
import type { AbilityGrade, CreatureAbility, CreatureStatKey, CreatureStats, StatGrade, StatGrades } from "@/types/creature";
import type { EggId } from "@/types/ids";
import type { EggRecord, GameSave } from "@/types/save";

export type EggAtelierServiceId = "accelerated_incubation" | "ability_polish" | "stat_conditioning";
export type EggAtelierUpgradeId = "soft_bedding" | "warming_lamp" | "lineage_ledger" | "incubator_cradle";
export type EggAtelierActionResult = { save: GameSave; ok: boolean; message: string };
export type EggAtelierUpgradeDefinition = { upgradeId: EggAtelierUpgradeId; name: string; description: string; costGold: number; costNurseryKits: number; effectLabel: string; iconPath: string };

export const SELENE_VIRELL = {
  npcId: "selene_virell",
  name: "Dr. Selene Virell",
  title: "Egg Care & Lineage Specialist",
  buildingName: "The Egg Atelier",
  portraitPath: "/images/npcs/town/selene_virell_portrait.png",
  profilePath: "/images/npcs/town/selene_virell_profile.png",
  intro: "Selene runs the Egg Atelier as a specialist clinic for appraisal, incubation care, and small odds-based improvements to hatch outcomes.",
} as const;

export const EGG_ATELIER_UPGRADES: EggAtelierUpgradeDefinition[] = [
  { upgradeId: "soft_bedding", name: "Soft Bedding Set", description: "Layered bedding, warming cloth, and scent-safe nesting pads for calmer egg care.", costGold: 250, costNurseryKits: 1, effectLabel: "+2% success chance for Selene egg-care services.", iconPath: "/images/ui/icons/icon_soft_bedding.png" },
  { upgradeId: "warming_lamp", name: "Warming Lamp", description: "A careful lamp setup that helps Selene speed incubation without replacing the ranch nursery.", costGold: 350, costNurseryKits: 2, effectLabel: "Cheaper acceleration; current incubating eggs immediately lose 1 day.", iconPath: "/images/ui/icons/icon_warming_lamp.png" },
  { upgradeId: "lineage_ledger", name: "Lineage Ledger Desk", description: "A record desk for deeper egg appraisal notes, projected abilities, and lineage readouts.", costGold: 425, costNurseryKits: 2, effectLabel: "Unlocks expanded appraisal detail in the Egg Atelier.", iconPath: "/images/ui/icons/icon_lineage_ledger.png" },
  { upgradeId: "incubator_cradle", name: "Incubator Cradle", description: "A stabilized cradle used for stat-focused egg care and gentle hatch-outcome conditioning.", costGold: 600, costNurseryKits: 3, effectLabel: "Unlocks Stat Conditioning and improves its success odds.", iconPath: "/images/ui/icons/icon_incubator_cradle.png" },
];

const ABILITY_GRADE_ORDER: AbilityGrade[] = ["F", "D", "C", "B", "A", "S"];
const STAT_GRADE_ORDER: StatGrade[] = ["D", "C", "B", "A", "S"];

function getFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}
function getUpgradeFlag(upgradeId: EggAtelierUpgradeId): string { return `eggAtelierUpgrade_${upgradeId}`; }
function deterministicRoll(seed: string, modulo = 100): number { let hash = 0; for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003; return Math.abs(hash) % modulo; }
function improveAbilityGrade(grade: CreatureAbility["grade"]): CreatureAbility["grade"] { const index = ABILITY_GRADE_ORDER.indexOf(grade); return ABILITY_GRADE_ORDER[Math.min(ABILITY_GRADE_ORDER.length - 1, Math.max(0, index) + 1)] ?? grade; }
function statGradeScore(grade: StatGrade): number { return STAT_GRADE_ORDER.indexOf(grade); }
function getLowestUpgradeableStatKey(grades: StatGrades, seed: string): CreatureStatKey | null {
  const upgradeable = Object.entries(grades).filter((entry): entry is [CreatureStatKey, StatGrade] => entry[1] !== "S");
  if (!upgradeable.length) return null;
  const sorted = upgradeable.sort((a, b) => statGradeScore(a[1]) - statGradeScore(b[1]));
  const lowestScore = statGradeScore(sorted[0][1]);
  const tied = sorted.filter((entry) => statGradeScore(entry[1]) === lowestScore);
  return tied[deterministicRoll(seed, tied.length)]?.[0] ?? sorted[0][0];
}
function improveProjectedStat(egg: EggRecord, seed: string): { projectedStats: CreatureStats; projectedStatGrades: StatGrades; note: string } | null {
  const statKey = getLowestUpgradeableStatKey(egg.projectedStatGrades, seed);
  if (!statKey) return null;
  const oldGrade = egg.projectedStatGrades[statKey];
  const newGrade = shiftStatGrade(oldGrade, 1);
  if (newGrade === oldGrade) return null;
  return { projectedStats: { ...egg.projectedStats, [statKey]: egg.projectedStats[statKey] + 1 }, projectedStatGrades: { ...egg.projectedStatGrades, [statKey]: newGrade }, note: `Selene's Stat Conditioning improved ${statKey} from ${oldGrade} to ${newGrade} and added +1 projected ${statKey}.` };
}

export function getNurserySupplyKitCount(save: GameSave): number { return getFlagNumber(save.flags.nurserySupplyKits); }
export function hasEggAtelierUpgrade(save: GameSave, upgradeId: EggAtelierUpgradeId): boolean { return Boolean(save.flags[getUpgradeFlag(upgradeId)]); }
export function getEggAtelierUpgradeEffects(save: GameSave) { return { careSuccessBonus: hasEggAtelierUpgrade(save, "soft_bedding") ? 2 : 0, acceleratedDiscount: hasEggAtelierUpgrade(save, "warming_lamp") ? 25 : 0, appraisalLevel: hasEggAtelierUpgrade(save, "lineage_ledger") ? 2 : 1, statConditioningUnlocked: hasEggAtelierUpgrade(save, "incubator_cradle"), statConditioningBonus: hasEggAtelierUpgrade(save, "incubator_cradle") ? 8 : 0 }; }
export function getEggAtelierAbilityPolishChance(save: GameSave): number { const trustLevel = getNpcTrustRecord(save, "selene_virell").level; const effects = getEggAtelierUpgradeEffects(save); return Math.min(48, 18 + trustLevel * 3 + effects.careSuccessBonus); }
export function getEggAtelierStatConditioningChance(save: GameSave): number { const trustLevel = getNpcTrustRecord(save, "selene_virell").level; const effects = getEggAtelierUpgradeEffects(save); return Math.min(52, 16 + trustLevel * 3 + effects.careSuccessBonus + effects.statConditioningBonus); }
export function getEggAtelierServiceCost(serviceId: EggAtelierServiceId, save: GameSave): { gold: number; nurseryKits: number; label: string } {
  const trustLevel = getNpcTrustRecord(save, "selene_virell").level;
  const effects = getEggAtelierUpgradeEffects(save);
  if (serviceId === "accelerated_incubation") { const gold = Math.max(25, (trustLevel >= 3 ? 50 : 75) - effects.acceleratedDiscount); return { gold, nurseryKits: 1, label: `${gold} Gold + 1 Nursery Supply Kit` }; }
  if (serviceId === "stat_conditioning") { const gold = trustLevel >= 4 ? 110 : 140; return { gold, nurseryKits: 1, label: `${gold} Gold + 1 Nursery Supply Kit` }; }
  const gold = trustLevel >= 4 ? 125 : 150;
  return { gold, nurseryKits: 1, label: `${gold} Gold + 1 Nursery Supply Kit` };
}
function canPay(save: GameSave, serviceId: EggAtelierServiceId): string | null { const cost = getEggAtelierServiceCost(serviceId, save); if (save.currencies.gold < cost.gold) return `Need ${cost.gold} Gold.`; if (getNurserySupplyKitCount(save) < cost.nurseryKits) return `Need ${cost.nurseryKits} Nursery Supply Kit.`; return null; }
function spendServiceCost(save: GameSave, serviceId: EggAtelierServiceId): GameSave { const cost = getEggAtelierServiceCost(serviceId, save); return { ...save, currencies: { ...save.currencies, gold: save.currencies.gold - cost.gold }, flags: { ...save.flags, nurserySupplyKits: Math.max(0, getNurserySupplyKitCount(save) - cost.nurseryKits), m38EggAtelierUsed: true } }; }

export function purchaseEggAtelierUpgrade(save: GameSave, upgradeId: EggAtelierUpgradeId): EggAtelierActionResult {
  const upgrade = EGG_ATELIER_UPGRADES.find((item) => item.upgradeId === upgradeId);
  if (!upgrade) return { save, ok: false, message: "Selene cannot find that atelier upgrade." };
  if (hasEggAtelierUpgrade(save, upgradeId)) return { save, ok: false, message: `${upgrade.name} is already installed.` };
  if (save.currencies.gold < upgrade.costGold) return { save, ok: false, message: `Need ${upgrade.costGold} Gold for ${upgrade.name}.` };
  if (getNurserySupplyKitCount(save) < upgrade.costNurseryKits) return { save, ok: false, message: `Need ${upgrade.costNurseryKits} Nursery Supply Kit(s) for ${upgrade.name}.` };
  const paidSave: GameSave = { ...save, updatedAt: new Date().toISOString(), currencies: { ...save.currencies, gold: save.currencies.gold - upgrade.costGold }, flags: { ...save.flags, nurserySupplyKits: Math.max(0, getNurserySupplyKitCount(save) - upgrade.costNurseryKits), [getUpgradeFlag(upgradeId)]: true, m39EggAtelierFurniture: true } };
  const eggs = paidSave.eggs ?? [];
  const nextEggs = upgradeId === "warming_lamp" ? eggs.map((egg) => { if (egg.status !== "incubating") return egg; const daysRemaining = Math.max(0, egg.daysRemaining - 1); return { ...egg, daysRemaining, status: daysRemaining <= 0 ? "ready" as const : egg.status, statRollNotes: [...(egg.statRollNotes ?? []), "The Egg Atelier Warming Lamp reduced this egg's timer by 1 day when installed."] }; }) : eggs;
  const trustedSave = grantNpcTrust({ ...paidSave, eggs: nextEggs, eggIds: nextEggs.map((egg) => egg.eggId) }, "selene_virell", upgradeId === "incubator_cradle" ? 8 : 6);
  const extra = upgradeId === "warming_lamp" ? " Current incubating eggs were warmed by 1 day." : "";
  return { save: trustedSave, ok: true, message: `${upgrade.name} installed in the ranch egg nursery. ${upgrade.effectLabel}${extra} Selene Trust increased.` };
}

export function applyAcceleratedIncubation(save: GameSave, eggId: EggId): EggAtelierActionResult {
  const egg = (save.eggs ?? []).find((item) => item.eggId === eggId);
  if (!egg) return { save, ok: false, message: "Selene cannot find that egg." };
  if (egg.status === "hatched") return { save, ok: false, message: "That egg has already hatched." };
  if (egg.status === "ready" || egg.daysRemaining <= 0) return { save, ok: false, message: "That egg is already ready to hatch." };
  const paymentBlock = canPay(save, "accelerated_incubation");
  if (paymentBlock) return { save, ok: false, message: paymentBlock };
  const paidSave = spendServiceCost(save, "accelerated_incubation");
  const nextEggs = (paidSave.eggs ?? []).map((item) => { if (item.eggId !== eggId) return item; const daysRemaining = Math.max(0, item.daysRemaining - 1); return { ...item, daysRemaining, status: daysRemaining <= 0 ? "ready" as const : item.status, statRollNotes: [...(item.statRollNotes ?? []), "Selene's accelerated incubation reduced this egg's timer by 1 day."] }; });
  const trustedSave = grantNpcTrust({ ...paidSave, updatedAt: new Date().toISOString(), eggs: nextEggs, eggIds: nextEggs.map((item) => item.eggId), flags: { ...paidSave.flags, m38AcceleratedIncubationUsed: true } }, "selene_virell", 4);
  return { save: trustedSave, ok: true, message: "Selene reduced the selected egg timer by 1 day. Selene Trust increased." };
}

export function applyAbilityPolish(save: GameSave, eggId: EggId): EggAtelierActionResult {
  const egg = (save.eggs ?? []).find((item) => item.eggId === eggId);
  if (!egg) return { save, ok: false, message: "Selene cannot find that egg." };
  if (egg.status === "hatched") return { save, ok: false, message: "That egg has already hatched." };
  if (!egg.projectedAbilities.length) return { save, ok: false, message: "This egg has no projected inherited ability for Selene to polish." };
  const paymentBlock = canPay(save, "ability_polish");
  if (paymentBlock) return { save, ok: false, message: paymentBlock };
  const paidSave = spendServiceCost(save, "ability_polish");
  const chance = getEggAtelierAbilityPolishChance(save);
  const roll = deterministicRoll(`${egg.eggId}_selene_ability_polish_${getFlagNumber(save.flags.m38AbilityPolishAttempts)}`, 100);
  const success = roll < chance;
  const nextEggs = (paidSave.eggs ?? []).map((item) => { if (item.eggId !== eggId) return item; const firstAbility = item.projectedAbilities[0]; const improvedGrade = firstAbility ? improveAbilityGrade(firstAbility.grade) : undefined; const projectedAbilities = success && firstAbility && improvedGrade && improvedGrade !== firstAbility.grade ? [{ ...firstAbility, grade: improvedGrade, description: `${firstAbility.description} Selene's polish improved this inherited ability grade before hatch.` }, ...item.projectedAbilities.slice(1)] : item.projectedAbilities; const note = success && firstAbility && improvedGrade !== firstAbility?.grade ? `Selene's Ability Polish succeeded: ${firstAbility.name} improved from ${firstAbility.grade} to ${improvedGrade}.` : `Selene's Ability Polish did not change the inherited ability grade this time. Chance was ${chance}%.`; return { ...item, projectedAbilities, abilityRollNotes: [...(item.abilityRollNotes ?? []), note] }; });
  const trustedSave = grantNpcTrust({ ...paidSave, updatedAt: new Date().toISOString(), eggs: nextEggs, eggIds: nextEggs.map((item) => item.eggId), flags: { ...paidSave.flags, m38AbilityPolishAttempts: getFlagNumber(save.flags.m38AbilityPolishAttempts) + 1, m38AbilityPolishUsed: true } }, "selene_virell", success ? 6 : 4);
  return { save: trustedSave, ok: true, message: success ? "Selene improved the egg's inherited ability grade. Selene Trust increased." : "Selene completed the polish, but the ability grade did not improve this time. Selene Trust increased." };
}

export function applyStatConditioning(save: GameSave, eggId: EggId): EggAtelierActionResult {
  const egg = (save.eggs ?? []).find((item) => item.eggId === eggId);
  if (!egg) return { save, ok: false, message: "Selene cannot find that egg." };
  if (!hasEggAtelierUpgrade(save, "incubator_cradle")) return { save, ok: false, message: "Install the Incubator Cradle before using Stat Conditioning." };
  if (egg.status === "hatched") return { save, ok: false, message: "That egg has already hatched." };
  const paymentBlock = canPay(save, "stat_conditioning");
  if (paymentBlock) return { save, ok: false, message: paymentBlock };
  const paidSave = spendServiceCost(save, "stat_conditioning");
  const chance = getEggAtelierStatConditioningChance(save);
  const attemptNumber = getFlagNumber(save.flags.m39StatConditioningAttempts);
  const roll = deterministicRoll(`${egg.eggId}_selene_stat_conditioning_${attemptNumber}`, 100);
  const success = roll < chance;
  const nextEggs = (paidSave.eggs ?? []).map((item) => { if (item.eggId !== eggId) return item; if (!success) return { ...item, statRollNotes: [...(item.statRollNotes ?? []), `Selene's Stat Conditioning did not improve a grade this time. Chance was ${chance}%.`] }; const improved = improveProjectedStat(item, `${item.eggId}_stat_conditioning_${attemptNumber}`); if (!improved) return { ...item, statRollNotes: [...(item.statRollNotes ?? []), "Selene's Stat Conditioning found no upgradeable stat grade."] }; return { ...item, projectedStats: improved.projectedStats, projectedStatGrades: improved.projectedStatGrades, statRollNotes: [...(item.statRollNotes ?? []), improved.note] }; });
  const trustedSave = grantNpcTrust({ ...paidSave, updatedAt: new Date().toISOString(), eggs: nextEggs, eggIds: nextEggs.map((item) => item.eggId), flags: { ...paidSave.flags, m39StatConditioningAttempts: attemptNumber + 1, m39StatConditioningUsed: true } }, "selene_virell", success ? 7 : 4);
  return { save: trustedSave, ok: true, message: success ? "Selene improved one projected stat grade on the egg. Selene Trust increased." : "Selene completed Stat Conditioning, but no grade improved this time. Selene Trust increased." };
}

export function getEggAtelierEggLabel(egg: EggRecord): string { return `${egg.suggestedName || egg.eggId} • ${egg.rarity} • ${egg.status === "ready" ? "Ready" : `${egg.daysRemaining}d left`}`; }
