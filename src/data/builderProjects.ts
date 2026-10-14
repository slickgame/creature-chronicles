import {HABITAT_PURCHASES,isHabitatUnlocked,unlockRanchHabitat} from "./ranchHabitats";
import {FAMILY_LABELS} from "./creatures";
import type {CreatureFamily} from "@/types/creature";
import { getFarmState, canSpend, consumeFarmResources, resourceList, type Stock } from "./farmResources";
import type { GameSave } from "@/types/save";

export type BuilderProjectId =
  | "unlock_feline_habitat" | "unlock_canine_habitat" | "unlock_bovine_habitat" | "unlock_lapine_habitat"
  | "pasture_annex"
  | "nursery_extension"
  | "north_pasture_land"
  | "woodline_acre_land"
  | "chicken_coop"
  | "sheep_fold"
  | "goat_paddock"
  | "aviary_roost"
  | "reinforced_fence"
  | "watchtower";

export type BuilderProjectCategory = "land" | "habitat" | "security";

export type BuilderProjectDefinition = {
  id: BuilderProjectId;
  title: string;
  category: BuilderProjectCategory;
  description: string;
  flavor: string;
  iconPath: string;
  costGold: number;
  costResources: Stock;
  prerequisiteIds: BuilderProjectId[];
  securityBonus?: number;
  predatorPressure?: number;
  planned?: boolean;
  durationDays?: number;
  benefit?: string;
  unlockFamily?: CreatureFamily;
};

export type BuilderProjectStatus = "locked" | "available" | "built" | "building" | "planned";

export type BuilderProjectProgress = {
  definition: BuilderProjectDefinition;
  status: BuilderProjectStatus;
  built: boolean;
  missingPrerequisites: BuilderProjectDefinition[];
  affordable: boolean;
};

export type BuilderProjectResult = {
  save: GameSave;
  ok: boolean;
  message: string;
  projectId: BuilderProjectId;
};

export const BUILDER_PROJECT_ASSETS = {
  yard: "/images/buildings/town/builders_yard.svg",
  builder: "/images/ui/locations-v2/petra.webp",
  northPasture: "/images/buildings/ranch/future/north_pasture.svg",
  woodlineAcre: "/images/buildings/ranch/future/woodline_acre.svg",
  chickenCoop: "/images/buildings/ranch/future/chicken_coop.svg",
  sheepFold: "/images/buildings/ranch/future/sheep_fold.svg",
  goatPaddock: "/images/buildings/ranch/future/goat_paddock.svg",
  aviaryRoost: "/images/buildings/ranch/future/aviary_roost.svg",
  reinforcedFence: "/images/buildings/ranch/future/reinforced_fence.svg",
  watchtower: "/images/buildings/ranch/future/watchtower.svg",
} as const;

export const BUILDER_PROJECTS: BuilderProjectDefinition[] = [
  ...Object.entries(HABITAT_PURCHASES).map(([family,p])=>({id:p.projectId,title:`${FAMILY_LABELS[family as CreatureFamily]} Habitat`,category:'habitat' as const,description:`Build a sheltered home for the ${family} family. Unlocks adoption and species-specific Guild requests for this family.`,flavor:'Petra prepares a fenced plot with shelter and room to grow.',iconPath:`/images/ui/ranch-v3/${family}.webp`,costGold:p.gold,costResources:{wood:p.wood},durationDays:1,prerequisiteIds:[],unlockFamily:family as CreatureFamily,benefit:'Unlocks this creature family’s habitat with four resident spaces.'})),
  {
    id: "pasture_annex", title: "Habitat Annexes", category: "habitat",
    description: "Add a sheltered annex to each of the ranch's five existing family habitats.",
    flavor: "Five small additions give every family room to grow.",
    benefit: "+1 capacity in each existing family habitat; stacks with Ranch Office upgrades.",
    iconPath: "/images/ui/icons/icon_habitat_capacity.png",
    costGold: 1200, costResources: { planks: 10, stone: 6, nails: 8 }, durationDays: 2,
    prerequisiteIds: ["north_pasture_land"],
  },
  {
    id: "nursery_extension", title: "Nursery Extension", category: "habitat",
    description: "Build two extra egg cradles into a sheltered nursery wing.",
    flavor: "Petra leaves space around each cradle for the next generation.",
    benefit: "+2 egg capacity; stacks with Ranch Office nursery upgrades.",
    iconPath: "/images/ui/icons/icon_nursery_upgrade.png",
    costGold: 1000, costResources: { planks: 8, stone: 4, nails: 6 }, durationDays: 2,
    prerequisiteIds: ["north_pasture_land"],
  },
  {
    id: "north_pasture_land",
    title: "North Pasture Deed",
    category: "land",
    description: "Survey the north field to unlock habitat annexes, a nursery extension, and the Woodline Acre deed.",
    flavor: "Petra marks a broad pasture with stone posts and a proper service trail.",
    iconPath: BUILDER_PROJECT_ASSETS.northPasture,
    costGold: 850,
    costResources: { wood: 8, stone: 4 },
    prerequisiteIds: [],
    predatorPressure: 6,
  },
  {
    id: "woodline_acre_land",
    durationDays: 2,
    title: "Woodline Acre Deed",
    category: "land",
    description: "Secure the wooded edge of the ranch for future specialty habitats and defensive construction.",
    flavor: "The new acre is beautiful, useful, and close enough to the trees to attract unwanted attention.",
    iconPath: BUILDER_PROJECT_ASSETS.woodlineAcre,
    costGold: 1100,
    costResources: { wood: 10, stone: 6 },
    prerequisiteIds: ["north_pasture_land"],
    predatorPressure: 12,
  },
  {
    id: "chicken_coop",
    planned: true,
    title: "Chicken Coop",
    category: "habitat",
    description: "Build a secure coop reserved for a future avian livestock family.",
    flavor: "Raised roosts, nesting boxes, and buried wire make this more than a decorative shed.",
    iconPath: BUILDER_PROJECT_ASSETS.chickenCoop,
    costGold: 650,
    costResources: { planks: 4, nails: 4 },
    prerequisiteIds: ["north_pasture_land"],
    predatorPressure: 18,
  },
  {
    id: "sheep_fold",
    planned: true,
    title: "Sheep Fold",
    category: "habitat",
    description: "Build a sheltered pasture habitat reserved for a future ovine family.",
    flavor: "A dry shelter and broad grazing lane make room for a future wool-producing herd.",
    iconPath: BUILDER_PROJECT_ASSETS.sheepFold,
    costGold: 900,
    costResources: { planks: 6, stone: 4 },
    prerequisiteIds: ["north_pasture_land"],
    predatorPressure: 16,
  },
  {
    id: "goat_paddock",
    planned: true,
    title: "Goat Paddock",
    category: "habitat",
    description: "Prepare a climbing-friendly enclosure reserved for a future caprine family.",
    flavor: "Petra adds reinforced rails after correctly assuming ordinary fencing will not be enough.",
    iconPath: BUILDER_PROJECT_ASSETS.goatPaddock,
    costGold: 1050,
    costResources: { planks: 6, nails: 6 },
    prerequisiteIds: ["woodline_acre_land"],
    predatorPressure: 14,
  },
  {
    id: "aviary_roost",
    planned: true,
    title: "Aviary Roost",
    category: "habitat",
    description: "Raise a protected roost reserved for future flying and tree-dwelling creatures.",
    flavor: "A high timber frame turns the woodline into a controlled habitat instead of an open invitation.",
    iconPath: BUILDER_PROJECT_ASSETS.aviaryRoost,
    costGold: 1250,
    costResources: { planks: 8, nails: 8 },
    prerequisiteIds: ["woodline_acre_land"],
    predatorPressure: 12,
  },
  {
    id: "reinforced_fence",
    title: "Reinforced Perimeter Fence",
    category: "security",
    description: "Strengthen weak fence lines and close the easiest approaches to the ranch.",
    flavor: "Deep posts and braced gates turn the perimeter into a real obstacle.",
    iconPath: BUILDER_PROJECT_ASSETS.reinforcedFence,
    costGold: 700,
    costResources: { planks: 6, stone: 4 },
    prerequisiteIds: [],
    securityBonus: 18,
  },
  {
    id: "watchtower",
    title: "Woodline Watchtower",
    category: "security",
    description: "Build an elevated watch post that adds passive protection to the farm.",
    flavor: "From the tower, movement along the tree line is visible before it reaches the pastures.",
    iconPath: BUILDER_PROJECT_ASSETS.watchtower,
    costGold: 950,
    costResources: { planks: 8, stone: 6, nails: 8 },
    prerequisiteIds: ["woodline_acre_land", "reinforced_fence"],
    securityBonus: 24,
  },
];

const PROJECTS_BY_ID = Object.fromEntries(BUILDER_PROJECTS.map((project) => [project.id, project])) as Record<BuilderProjectId, BuilderProjectDefinition>;

function builtFlag(projectId: BuilderProjectId): string {
  return `builderProject_${projectId}_built`;
}

function numberFlag(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function getBuilderProject(projectId: BuilderProjectId): BuilderProjectDefinition {
  return PROJECTS_BY_ID[projectId];
}

export function isBuilderProjectBuilt(save: GameSave, projectId: BuilderProjectId): boolean {
  const family=PROJECTS_BY_ID[projectId]?.unlockFamily;
  return family?isHabitatUnlocked(save,family):save.flags[builtFlag(projectId)] === true;
}

export function getBuilderProjectProgress(save: GameSave, projectId: BuilderProjectId): BuilderProjectProgress {
  const definition = getBuilderProject(projectId);
  const built = isBuilderProjectBuilt(save, projectId);
  const missingPrerequisites = definition.prerequisiteIds
    .filter((id) => !isBuilderProjectBuilt(save, id))
    .map(getBuilderProject);
  return {
    definition,
    status: built ? "built" : getBuilderWorkOrder(save)?.projectId === projectId ? "building" : definition.planned ? "planned" : missingPrerequisites.length ? "locked" : "available",
    built,
    missingPrerequisites,
    affordable: !built && !definition.planned && !getBuilderWorkOrder(save) && !getFarmState(save).project && !missingPrerequisites.length && save.currencies.gold >= definition.costGold && canSpend(getFarmState(save), definition.costResources),
  };
}

export type BuilderWorkOrder = { projectId: BuilderProjectId; startedDay: number; readyDay: number; paidGold: number; paidMaterials: number; paidResources?: Stock };
const WORK_ORDER_FLAG = "builderWorkOrderV1";

export function getBuilderWorkOrder(save: GameSave): BuilderWorkOrder | null {
  try {
    const value = JSON.parse(String(save.flags[WORK_ORDER_FLAG] ?? "null")) as BuilderWorkOrder | null;
    if (!value || !PROJECTS_BY_ID[value.projectId] || isBuilderProjectBuilt(save, value.projectId)) return null;
    if (![value.startedDay, value.readyDay, value.paidGold, value.paidMaterials].every(n => Number.isSafeInteger(n) && n >= 0) || value.readyDay <= value.startedDay) return null;
    return value;
  } catch { return null; }
}

export function getBuilderProjectBenefit(project: BuilderProjectDefinition): string {
  if (project.benefit) return project.benefit;
  if (project.planned) return "Future species housing. Not available to commission yet.";
  if (project.securityBonus) return `+${project.securityBonus} Security at full condition.`;
  const unlocks = BUILDER_PROJECTS.filter(p => !p.planned && p.prerequisiteIds.includes(project.id)).map(p => p.title);
  return `Unlocks project access: ${unlocks.join(", ")}. Other prerequisites still apply.`;
}

export function commissionBuilderProject(save: GameSave, projectId: BuilderProjectId): BuilderProjectResult {
  const progress = getBuilderProjectProgress(save, projectId);
  const project = progress.definition;
  if (progress.built) return { save, ok: false, projectId, message: `${project.title} is already complete.` };
  if (project.planned) return { save, ok: false, projectId, message: "This habitat is a future plan and cannot be commissioned yet." };
  if (getFarmState(save).project || getBuilderWorkOrder(save)) return { save, ok: false, projectId, message: "Petra's crew already has a project underway." };
  if (progress.missingPrerequisites.length) return { save, ok: false, projectId, message: `Build ${progress.missingPrerequisites.map(p => p.title).join(" and ")} first.` };
  if (!progress.affordable) return { save, ok: false, projectId, message: `Petra needs ${project.costGold} Gold and ${resourceList(project.costResources)} for ${project.title}.` };
  const order: BuilderWorkOrder = { projectId, startedDay: save.dayState.dayNumber, readyDay: save.dayState.dayNumber + (project.durationDays ?? 1), paidGold: project.costGold, paidMaterials: 0, paidResources: project.costResources };
  const paidSave = consumeFarmResources(save, project.costResources).save;
  const nextSave: GameSave = {
    ...paidSave, updatedAt: new Date().toISOString(),
    currencies: { ...save.currencies, gold: save.currencies.gold - project.costGold },
    flags: { ...paidSave.flags, [WORK_ORDER_FLAG]: JSON.stringify(order), builderMetPetraHale: true, m63BuilderYardUsed: true },
  };
  return { save: nextSave, ok: true, projectId, message: `${project.title} commissioned. Completes on Ranch Day ${order.readyDay}.` };
}

/** Called at the new-day boundary. A completed order cannot grant benefits twice. */
export function processBuilderConstruction(save: GameSave): { save: GameSave; summaryItems: string[] } {
  const order = getBuilderWorkOrder(save);
  if (!order || save.dayState.dayNumber < order.readyDay) return { save, summaryItems: [] };
  const project = getBuilderProject(order.projectId);
  const nextSave: GameSave = { ...save, flags: {
    ...save.flags, [WORK_ORDER_FLAG]: "", [builtFlag(project.id)]: true,
    builderProjectsCompleted: numberFlag(save.flags.builderProjectsCompleted) + 1,
    builderLastCompletedProjectId: project.id,
    builderLastCompletionDay: save.dayState.dayNumber,
    ...(project.category === "land" ? { m63RanchLandExpanded: true } : {}),
    ...(project.category === "security" ? { m63PermanentSecurityBuilt: true } : {}),
  } };
  return { save: project.unlockFamily?unlockRanchHabitat(nextSave,project.unlockFamily):nextSave, summaryItems: [`${project.title} completed. ${getBuilderProjectBenefit(project)}`] };
}

export function getBuilderSecurityBonus(save: GameSave): number {
  return BUILDER_PROJECTS.reduce((total, project) => (
    total + (project.securityBonus && isBuilderProjectBuilt(save, project.id) ? project.securityBonus : 0)
  ), 0);
}

export function getBuilderPredatorPressure(save: GameSave): number {
  return BUILDER_PROJECTS.reduce((total, project) => (
    total + (project.predatorPressure && isBuilderProjectBuilt(save, project.id) ? project.predatorPressure : 0)
  ), 0);
}

export function getBuiltFutureHabitatIds(save: GameSave): BuilderProjectId[] {
  return BUILDER_PROJECTS
    .filter((project) => project.planned && project.category === "habitat" && isBuilderProjectBuilt(save, project.id))
    .map((project) => project.id);
}

