import { getVariantDefinition } from "@/data/creatures";
import { getRanchJobs, RANCH_JOB_IDS, type } from "@/data/ranchJobs";
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
  identity: "Adult futanari ranch strategist",
  portraitPath: "/images/ui/icons/icon_breeder_level.png",
  storyHook: "Veyra keeps the early ranch running and will become story-relevant once the narrative layer arrives.",
  voiceLine: "Let me turn the ranch noise into a short list. We handle risk first, then food, materials, eggs, and growth.",
} as const;

const CREW_LESSONS: Array<{ family: CreatureFamily; role: string; lesson: string }> = [
  { family: "canine", role: "Security", lesson: "Canines are the safest early pick for Security Patrol because stamina and willpower lower danger pressure." },
  { family: "feline", role: "Comfort", lesson: "Felines fit Comfort Care, which can create tomorrow's breeding comfort bonus." },
  { family: "bovine", role: "Production", lesson: "Cows and other bovines stabilize feed production so the ranch can recover properly after sleep." },
  { family: "lapine", role: "Garden / Nursery", lesson: "Bunnies help with garden-style support and later become important for nursery and fertility-focused lines." },
  { family: "equine", role: "Hauling", lesson: "Horses are built for Field Hauling, materials, and upkeep so ranch damage does not spiral." },
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
  const feedStock = getFlagNumber(save.flags.ranchFeedStock);
  const feedRequired = (save.creatures ?? []).reduce((total, creature) => total + getDailyFeedCost(creature), 0);
  const materialsStock = getFlagNumber(save.flags.ranchMaterialsStock);
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

  if (!isJobAssigned(save, "security_patrol")) pushPriority(priorities, { id: "security", severity: "urgent", title: "Assign Security Patrol", body: canine ? `${canine.nickname} is your cleanest early security pick. An empty patrol leaves the ranch exposed to danger events.` : "Security Patrol is empty. Find or free up a canine-style guard before sleeping.", action: "chores", actionLabel: "Open Chores", jobId: "security_patrol", helperName: canine?.nickname });
  if (feedStock < Math.max(feedRequired * 2, 10) || !isJobAssigned(save, "stable_production")) pushPriority(priorities, { id: "feed", severity: feedStock < feedRequired ? "urgent" : "warning", title: "Stabilize Feed", body: bovine ? `${bovine.nickname} should help Stable Production. Feed stock is ${feedStock}, and the ranch needs about ${feedRequired} per day.` : `Feed stock is ${feedStock}. Stable Production should be staffed soon.`, action: "chores", actionLabel: "Open Chores", jobId: "stable_production", helperName: bovine?.nickname });
  if (!isJobAssigned(save, "garden_tending")) pushPriority(priorities, { id: "garden", severity: "suggestion", title: "Use the Bunny for Garden Support", body: lapine ? `${lapine.nickname} can cover Garden Tending while your production line grows. This teaches the bunny's early role without forcing breeding yet.` : "Garden Tending is empty. A lapine helper gives early support and keeps the starter crew relevant.", action: "chores", actionLabel: "Open Chores", jobId: "garden_tending", helperName: lapine?.nickname });
  if (ranchDamage >= 20 || materialsStock < 3 || !isJobAssigned(save, "field_hauling")) pushPriority(priorities, { id: "hauling", severity: ranchDamage >= 50 ? "urgent" : "warning", title: "Protect Ranch Condition", body: equine ? `${equine.nickname} should handle Field Hauling. Materials are ${materialsStock}, and ranch damage is ${ranchDamage}/100.` : `Materials are ${materialsStock}, and ranch damage is ${ranchDamage}/100. Field Hauling needs attention.`, action: "chores", actionLabel: "Open Chores", jobId: "field_hauling", helperName: equine?.nickname });
  if (!isJobAssigned(save, "comfort_care")) pushPriority(priorities, { id: "comfort", severity: "suggestion", title: "Set Up Breeding Comfort", body: feline ? `${feline.nickname} fits Comfort Care. This can create tomorrow's breeding comfort bonus before serious pairing decisions.` : "Comfort Care is empty. A calming creature can improve breeding setup tomorrow.", action: "chores", actionLabel: "Open Chores", jobId: "comfort_care", helperName: feline?.nickname });
  if (readyEggCount > 0) pushPriority(priorities, { id: "ready-eggs", severity: "urgent", title: "Hatch Ready Egg", body: `${readyEggCount} egg${readyEggCount === 1 ? " is" : "s are"} ready. Hatch before adding more nursery pressure.`, action: "nursery", actionLabel: "Open Nursery" });
  else if (incubatingEggCount > 0) pushPriority(priorities, { id: "incubating-eggs", severity: "info", title: "Nursery Timer Running", body: `${incubatingEggCount} egg${incubatingEggCount === 1 ? " is" : "s are"} incubating. Security and ranch condition still matter because danger can disturb eggs.`, action: "nursery", actionLabel: "Check Nursery" });
  if (availableMarketListings > 0 || marketNeedsRefresh) pushPriority(priorities, { id: "market", severity: "info", title: "Inspect Market Listings", body: marketNeedsRefresh ? "The market should refresh for the current week. Check listings before spending upgrades." : `${availableMarketListings} market listing${availableMarketListings === 1 ? " is" : "s are"} available. Early abilities are rare, so look mostly for grades and family needs.`, action: "town", actionLabel: "Go to Town" });
  if ((taxDue > 0 && taxDaysUntilDue <= 7) || taxStatus === "warning") pushPriority(priorities, { id: "tax", severity: taxDaysUntilDue <= 3 || taxStatus === "warning" ? "urgent" : "warning", title: "Prepare for Tax Day", body: `Lady Vesper's posted tax is ${taxDue} Gold with ${taxDaysUntilDue} day${taxDaysUntilDue === 1 ? "" : "s"} left. Avoid spending yourself into a default.`, action: "office", actionLabel: "Open Office" });
  if (ranchDamage >= 50) pushPriority(priorities, { id: "repair", severity: "urgent", title: "Repair Damage Soon", body: `Ranch damage is ${ranchDamage}/100. Repairs or hauling should happen before the recovery penalty gets worse.`, action: "office", actionLabel: "Open Office" });
  if (lowEnergyCreature) pushPriority(priorities, { id: "low-energy", severity: "warning", title: "Rest Tired Creatures", body: `${lowEnergyCreature.nickname} is low on energy (${lowEnergyCreature.energy}/${lowEnergyCreature.maxEnergy}). Avoid breeding or extra assignments until recovery improves.`, action: "collection", actionLabel: "Open Collection", helperName: lowEnergyCreature.nickname });

  const focus = priorities[0]?.title ?? "Ranch is stable today";
  const crewLessons = CREW_LESSONS.map((lesson) => ({ ...lesson, exampleName: findFamilyHelper(save, lesson.family, new Set())?.nickname }));
  return { advisor: RANCH_ADVISOR, greeting: priorities.length ? RANCH_ADVISOR.voiceLine : "Nothing is screaming today. Use the calm to build feed, materials, and breeding quality.", focus, priorities: priorities.slice(0, 8), crewLessons };
}
