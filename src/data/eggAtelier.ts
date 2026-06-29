import { getNpcTrustRecord, grantNpcTrust } from "@/data/townNpcs";
import type { CreatureAbility, StatGrade } from "@/types/creature";
import type { EggId } from "@/types/ids";
import type { EggRecord, GameSave } from "@/types/save";

export type EggAtelierServiceId = "accelerated_incubation" | "ability_polish";
export type EggAtelierActionResult = { save: GameSave; ok: boolean; message: string };

export const SELENE_VIRELL = {
  npcId: "selene_virell",
  name: "Dr. Selene Virell",
  title: "Egg Care & Lineage Specialist",
  buildingName: "The Egg Atelier",
  portraitPath: "/images/npcs/town/selene_virell_portrait.png",
  profilePath: "/images/npcs/town/selene_virell_profile.png",
  intro: "Selene runs the Egg Atelier as a specialist clinic for appraisal, incubation care, and small odds-based improvements to hatch outcomes.",
} as const;

const GRADE_ORDER: StatGrade[] = ["F", "D", "C", "B", "A", "S"];

function getFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function deterministicRoll(seed: string, modulo = 100): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  return Math.abs(hash) % modulo;
}

function improveAbilityGrade(grade: CreatureAbility["grade"]): CreatureAbility["grade"] {
  const index = GRADE_ORDER.indexOf(grade as StatGrade);
  return (GRADE_ORDER[Math.min(GRADE_ORDER.length - 1, Math.max(0, index) + 1)] ?? grade) as CreatureAbility["grade"];
}

export function getNurserySupplyKitCount(save: GameSave): number {
  return getFlagNumber(save.flags.nurserySupplyKits);
}

export function getEggAtelierAbilityPolishChance(save: GameSave): number {
  const trustLevel = getNpcTrustRecord(save, "selene_virell").level;
  return Math.min(42, 18 + trustLevel * 3);
}

export function getEggAtelierServiceCost(serviceId: EggAtelierServiceId, save: GameSave): { gold: number; nurseryKits: number; label: string } {
  const trustLevel = getNpcTrustRecord(save, "selene_virell").level;
  if (serviceId === "accelerated_incubation") return { gold: trustLevel >= 3 ? 50 : 75, nurseryKits: 1, label: `${trustLevel >= 3 ? 50 : 75} Gold + 1 Nursery Supply Kit` };
  return { gold: trustLevel >= 4 ? 125 : 150, nurseryKits: 1, label: `${trustLevel >= 4 ? 125 : 150} Gold + 1 Nursery Supply Kit` };
}

function canPay(save: GameSave, serviceId: EggAtelierServiceId): string | null {
  const cost = getEggAtelierServiceCost(serviceId, save);
  if (save.currencies.gold < cost.gold) return `Need ${cost.gold} Gold.`;
  if (getNurserySupplyKitCount(save) < cost.nurseryKits) return `Need ${cost.nurseryKits} Nursery Supply Kit.`;
  return null;
}

function spendServiceCost(save: GameSave, serviceId: EggAtelierServiceId): GameSave {
  const cost = getEggAtelierServiceCost(serviceId, save);
  return {
    ...save,
    currencies: { ...save.currencies, gold: save.currencies.gold - cost.gold },
    flags: { ...save.flags, nurserySupplyKits: Math.max(0, getNurserySupplyKitCount(save) - cost.nurseryKits), m38EggAtelierUsed: true },
  };
}

export function applyAcceleratedIncubation(save: GameSave, eggId: EggId): EggAtelierActionResult {
  const egg = (save.eggs ?? []).find((item) => item.eggId === eggId);
  if (!egg) return { save, ok: false, message: "Selene cannot find that egg." };
  if (egg.status === "hatched") return { save, ok: false, message: "That egg has already hatched." };
  if (egg.status === "ready" || egg.daysRemaining <= 0) return { save, ok: false, message: "That egg is already ready to hatch." };
  const paymentBlock = canPay(save, "accelerated_incubation");
  if (paymentBlock) return { save, ok: false, message: paymentBlock };

  const paidSave = spendServiceCost(save, "accelerated_incubation");
  const nextEggs = (paidSave.eggs ?? []).map((item) => {
    if (item.eggId !== eggId) return item;
    const daysRemaining = Math.max(0, item.daysRemaining - 1);
    return { ...item, daysRemaining, status: daysRemaining <= 0 ? "ready" as const : item.status, statRollNotes: [...(item.statRollNotes ?? []), "Selene's accelerated incubation reduced this egg's timer by 1 day."] };
  });
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
  const nextEggs = (paidSave.eggs ?? []).map((item) => {
    if (item.eggId !== eggId) return item;
    const firstAbility = item.projectedAbilities[0];
    const improvedGrade = firstAbility ? improveAbilityGrade(firstAbility.grade) : undefined;
    const projectedAbilities = success && firstAbility && improvedGrade && improvedGrade !== firstAbility.grade ? [{ ...firstAbility, grade: improvedGrade, description: `${firstAbility.description} Selene's polish improved this inherited ability grade before hatch.` }, ...item.projectedAbilities.slice(1)] : item.projectedAbilities;
    const note = success && firstAbility && improvedGrade !== firstAbility.grade ? `Selene's Ability Polish succeeded: ${firstAbility.name} improved from ${firstAbility.grade} to ${improvedGrade}.` : `Selene's Ability Polish did not change the inherited ability grade this time. Chance was ${chance}%.`;
    return { ...item, projectedAbilities, abilityRollNotes: [...(item.abilityRollNotes ?? []), note] };
  });
  const trustedSave = grantNpcTrust({ ...paidSave, updatedAt: new Date().toISOString(), eggs: nextEggs, eggIds: nextEggs.map((item) => item.eggId), flags: { ...paidSave.flags, m38AbilityPolishAttempts: getFlagNumber(save.flags.m38AbilityPolishAttempts) + 1, m38AbilityPolishUsed: true } }, "selene_virell", success ? 6 : 4);
  return { save: trustedSave, ok: true, message: success ? "Selene improved the egg's inherited ability grade. Selene Trust increased." : "Selene completed the polish, but the ability grade did not improve this time. Selene Trust increased." };
}

export function getEggAtelierEggLabel(egg: EggRecord): string {
  return `${egg.suggestedName || egg.eggId} • ${egg.rarity} • ${egg.status === "ready" ? "Ready" : `${egg.daysRemaining}d left`}`;
}
