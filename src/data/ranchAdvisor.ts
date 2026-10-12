import { getFarmSecurity } from "./farmSecurity";
import { getPredatorThreatAssessment } from "./predatorThreat";
import { getFarmState } from "./farmResources";
import { getVariantDefinition } from "@/data/creatures";
import { getRanchJobs, RANCH_JOB_IDS } from "@/data/ranchJobs";
import type { CreatureFamily, CreatureRecord } from "@/types/creature";
import type { RanchJobId } from "@/types/ranchJobs";
import type { GameSave } from "@/types/save";

export type RanchAdvisorAction = "chores" | "nursery" | "town" | "office" | "breeding" | "collection" | null;
export type RanchAdvisorSeverity = "urgent" | "warning" | "suggestion" | "info";
export type RanchAdvisorPriority = { id: string; severity: RanchAdvisorSeverity; title: string; body: string; action: RanchAdvisorAction; actionLabel: string; jobId?: RanchJobId; helperName?: string };
export type RanchAdvisorCrewLesson = { family: CreatureFamily; role: string; lesson: string; exampleName?: string };
export type RanchAdvisorPlan = { advisor: typeof RANCH_ADVISOR; greeting: string; focus: string; priorities: RanchAdvisorPriority[]; crewLessons: RanchAdvisorCrewLesson[] };

export const RANCH_ADVISOR = {
  name: "Veyra Bramble",
  title: "Ranch Advisor",
  identity: "Adult story advisor",
  portraitPath: "/images/npcs/veyra/veyra-approved.webp",
  storyHook: "Veyra keeps the early ranch running and becomes story-relevant later.",
  voiceLine: "Let me turn the ranch noise into a short list. We handle risk first, then food, materials, eggs, and growth.",
} as const;

const CREW_LESSONS: Array<{ family: CreatureFamily; role: string; lesson: string }> = [
  { family: "canine", role: "Security", lesson: "Canines can inherit Guard Dog. Only the strongest resident bonus applies, without Energy cost." },
  { family: "feline", role: "Comfort", lesson: "Felines can gather ingredients and materials. Compare talents and Energy before working." },
  { family: "bovine", role: "Production", lesson: "Female bovines can produce Milk at the dairy." },
  { family: "lapine", role: "Garden / Nursery", lesson: "Bunnies help with garden support and later become important for nursery and fertility-focused lines." },
  { family: "equine", role: "Hauling", lesson: "Equines can work the woodlot and mine. Repair fortifications with supplies when needed." },
];

function getFlagNumber(value: boolean | number | string | undefined, fallback = 0): number { const parsed = typeof value === "number" ? value : Number(value ?? fallback); return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback; }
function isCreatureInjured(creature: CreatureRecord, dayNumber: number): boolean { return typeof creature.injuredUntilDayNumber === "number" && creature.injuredUntilDayNumber >= dayNumber; }
function getDailyFeedCost(creature: CreatureRecord): number { const variant = getVariantDefinition(creature.variantId); const familyBaseCost = variant.family === "bovine" || variant.family === "equine" ? 2 : 1; const rareCost = variant.rarity === "Rare" || variant.rarity === "Epic" ? 1 : 0; return familyBaseCost + rareCost; }
function getAssignedIds(save: GameSave): Set<string> { const jobs = getRanchJobs(save); return new Set(RANCH_JOB_IDS.flatMap((jobId) => jobs.assignments[jobId] ?? [])); }
function isJobAssigned(save: GameSave, jobId: RanchJobId): boolean { return Boolean((getRanchJobs(save).assignments[jobId] ?? []).length); }
function findFamilyHelper(save: GameSave, family: CreatureFamily, assignedIds = getAssignedIds(save)): CreatureRecord | null { return (save.creatures ?? []).filter((creature) => !assignedIds.has(creature.creatureId) && !isCreatureInjured(creature, save.dayState.dayNumber) && getVariantDefinition(creature.variantId).family === family).sort((a, b) => b.energy - a.energy || b.level - a.level || a.nickname.localeCompare(b.nickname))[0] ?? null; }
function pushPriority(priorities: RanchAdvisorPriority[], priority: RanchAdvisorPriority) { if (!priorities.some((item) => item.id === priority.id)) priorities.push(priority); }

export function getRanchAdvisorPlan(save: GameSave): RanchAdvisorPlan {
  const priorities: RanchAdvisorPriority[] = [];
  const assignedIds = getAssignedIds(save);
  const farm = getFarmState(save);
  const feedStock = getFlagNumber(save.flags.ranchFeedStock) + Math.max(0,(farm.stock.rations ?? 0)-(farm.reserves.rations ?? 0));
  const feedRequired = (save.creatures ?? []).reduce((total, creature) => total + getDailyFeedCost(creature), 0);
  const materialsStock = Math.max(0,(farm.stock.wood ?? 0)-(farm.reserves.wood ?? 0));
  const ranchDamage = getFlagNumber(save.flags.ranchDamage);
  const taxDue = getFlagNumber(save.flags.taxCurrentMonthDue);
  const taxDaysUntilDue = getFlagNumber(save.flags.taxDaysUntilDue, 30);
  const taxStatus = String(save.flags.taxStatus ?? "pending");
  const readyEggCount = (save.eggs ?? []).filter((egg) => egg.status === "ready").length;
  const incubatingEggCount = (save.eggs ?? []).filter((egg) => egg.status === "incubating").length;
  const availableMarketListings = (save.market?.listings ?? []).filter((listing) => listing.status === "available").length;
  const marketNeedsRefresh = save.market?.weekNumber !== save.dayState.weekNumber;
  const lowEnergyCreature = (save.creatures ?? []).filter((creature) => !isCreatureInjured(creature, save.dayState.dayNumber) && creature.energy < Math.max(18, creature.maxEnergy * 0.35)).sort((a, b) => (a.energy / Math.max(1, a.maxEnergy)) - (b.energy / Math.max(1, b.maxEnergy)))[0] ?? null;
  const canine = findFamilyHelper(save, "canine", assignedIds);
  const feline = findFamilyHelper(save, "feline", assignedIds);
  const bovine = findFamilyHelper(save, "bovine", assignedIds);
  const lapine = findFamilyHelper(save, "lapine", assignedIds);
  const equine = findFamilyHelper(save, "equine", assignedIds);

  if (getPredatorThreatAssessment(save).eventChance > 0) pushPriority(priorities, { id: "security", severity: "warning", title: "Review farm protection", body: `Security is ${getFarmSecurity(save).total}. Fortifications and the strongest resident Guard Dog protect the farm.`, action: "chores", actionLabel: "Farm Security" });
  if (feedStock < feedRequired * 2) pushPriority(priorities, { id: "feed", severity: feedStock < feedRequired ? "urgent" : "warning", title: "Prepare nightly food", body: `Usable rations/Feed: ${feedStock}; daily need: ${feedRequired}. Gather ingredients and cook rations, or enable ingredient feeding.`, action: "chores", actionLabel: "Farm Management" });
  if (ranchDamage >= 20) pushPriority(priorities, { id: "repair", severity: "warning", title: "Repair fortifications", body: `Condition is ${100-ranchDamage}%. Use a repair kit or 2 Wood + 1 Stone to restore 20 condition.`, action: "chores", actionLabel: "Farm Security" });
  if (materialsStock < 3) pushPriority(priorities, { id: "wood", severity: "suggestion", title: "Gather a timber reserve", body: "Work at the Woodlot for crafting and repair supplies. Only Energy is spent.", action: "chores", actionLabel: "Work locations" });
  if (readyEggCount > 0) pushPriority(priorities, { id: "ready-eggs", severity: "urgent", title: "Hatch Ready Egg", body: `${readyEggCount} egg${readyEggCount === 1 ? " is" : "s are"} ready. Hatch before adding more nursery pressure.`, action: "nursery", actionLabel: "Open Nursery" });
  else if (incubatingEggCount > 0) pushPriority(priorities, { id: "incubating-eggs", severity: "info", title: "Nursery Timer Running", body: `${incubatingEggCount} egg${incubatingEggCount === 1 ? " is" : "s are"} incubating. Security and ranch condition still matter because danger can disturb eggs.`, action: "nursery", actionLabel: "Check Nursery" });
  if (availableMarketListings > 0 || marketNeedsRefresh) pushPriority(priorities, { id: "market", severity: "info", title: "Inspect Market Listings", body: marketNeedsRefresh ? "The market should refresh for the current week. Check listings before spending upgrades." : `${availableMarketListings} market listing${availableMarketListings === 1 ? " is" : "s are"} available. Early abilities are rare, so look mostly for grades and family needs.`, action: "town", actionLabel: "Go to Town" });
  if ((taxDue > 0 && taxDaysUntilDue <= 7) || taxStatus === "warning") pushPriority(priorities, { id: "tax", severity: taxDaysUntilDue <= 3 || taxStatus === "warning" ? "urgent" : "warning", title: "Prepare for Tax Day", body: `Lady Vesper's posted tax is ${taxDue} Gold with ${taxDaysUntilDue} day${taxDaysUntilDue === 1 ? "" : "s"} left. Avoid spending into a default.`, action: "office", actionLabel: "Open Office" });
  if (ranchDamage >= 50) pushPriority(priorities, { id: "repair", severity: "urgent", title: "Repair Damage Soon", body: `Ranch damage is ${ranchDamage}/100. Repairs should happen before the recovery penalty gets worse.`, action: "office", actionLabel: "Open Office" });
  if (lowEnergyCreature) pushPriority(priorities, { id: "low-energy", severity: "warning", title: "Rest Tired Creatures", body: `${lowEnergyCreature.nickname} is low on energy (${lowEnergyCreature.energy}/${lowEnergyCreature.maxEnergy}). Avoid extra work until recovery improves.`, action: "collection", actionLabel: "Open Collection", helperName: lowEnergyCreature.nickname });

  const focus = priorities[0]?.title ?? "Ranch is stable today";
  const crewLessons = CREW_LESSONS.map((lesson) => ({ ...lesson, exampleName: findFamilyHelper(save, lesson.family, new Set())?.nickname }));
  return { advisor: RANCH_ADVISOR, greeting: priorities.length ? RANCH_ADVISOR.voiceLine : "Nothing is screaming today. Use the calm to build feed, materials, and quality.", focus, priorities: priorities.slice(0, 8), crewLessons };
}
