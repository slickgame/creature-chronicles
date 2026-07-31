import type { GameSave } from "@/types/save";

export type BuilderProjectId =
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
  costMaterials: number;
  prerequisiteIds: BuilderProjectId[];
  securityBonus?: number;
  predatorPressure?: number;
};

export type BuilderProjectStatus = "locked" | "available" | "built";

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
  builder: "/images/npcs/petra_hale_builder.svg",
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
  {
    id: "north_pasture_land",
    title: "North Pasture Deed",
    category: "land",
    description: "Clear and survey the north field so livestock habitats can be commissioned there.",
    flavor: "Petra marks a broad pasture with stone posts and a proper service trail.",
    iconPath: BUILDER_PROJECT_ASSETS.northPasture,
    costGold: 850,
    costMaterials: 12,
    prerequisiteIds: [],
    predatorPressure: 6,
  },
  {
    id: "woodline_acre_land",
    title: "Woodline Acre Deed",
    category: "land",
    description: "Secure the wooded edge of the ranch for future specialty habitats and defensive construction.",
    flavor: "The new acre is beautiful, useful, and close enough to the trees to attract unwanted attention.",
    iconPath: BUILDER_PROJECT_ASSETS.woodlineAcre,
    costGold: 1100,
    costMaterials: 18,
    prerequisiteIds: ["north_pasture_land"],
    predatorPressure: 12,
  },
  {
    id: "chicken_coop",
    title: "Chicken Coop",
    category: "habitat",
    description: "Build a secure coop reserved for a future avian livestock family.",
    flavor: "Raised roosts, nesting boxes, and buried wire make this more than a decorative shed.",
    iconPath: BUILDER_PROJECT_ASSETS.chickenCoop,
    costGold: 650,
    costMaterials: 10,
    prerequisiteIds: ["north_pasture_land"],
    predatorPressure: 18,
  },
  {
    id: "sheep_fold",
    title: "Sheep Fold",
    category: "habitat",
    description: "Build a sheltered pasture habitat reserved for a future ovine family.",
    flavor: "A dry shelter and broad grazing lane make room for a future wool-producing herd.",
    iconPath: BUILDER_PROJECT_ASSETS.sheepFold,
    costGold: 900,
    costMaterials: 15,
    prerequisiteIds: ["north_pasture_land"],
    predatorPressure: 16,
  },
  {
    id: "goat_paddock",
    title: "Goat Paddock",
    category: "habitat",
    description: "Prepare a climbing-friendly enclosure reserved for a future caprine family.",
    flavor: "Petra adds reinforced rails after correctly assuming ordinary fencing will not be enough.",
    iconPath: BUILDER_PROJECT_ASSETS.goatPaddock,
    costGold: 1050,
    costMaterials: 17,
    prerequisiteIds: ["woodline_acre_land"],
    predatorPressure: 14,
  },
  {
    id: "aviary_roost",
    title: "Aviary Roost",
    category: "habitat",
    description: "Raise a protected roost reserved for future flying and tree-dwelling creatures.",
    flavor: "A high timber frame turns the woodline into a controlled habitat instead of an open invitation.",
    iconPath: BUILDER_PROJECT_ASSETS.aviaryRoost,
    costGold: 1250,
    costMaterials: 20,
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
    costMaterials: 12,
    prerequisiteIds: [],
    securityBonus: 18,
  },
  {
    id: "watchtower",
    title: "Woodline Watchtower",
    category: "security",
    description: "Build an elevated watch post that adds permanent support to nightly patrols.",
    flavor: "From the tower, movement along the tree line is visible before it reaches the pastures.",
    iconPath: BUILDER_PROJECT_ASSETS.watchtower,
    costGold: 950,
    costMaterials: 16,
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
  return save.flags[builtFlag(projectId)] === true;
}

export function getBuilderProjectProgress(save: GameSave, projectId: BuilderProjectId): BuilderProjectProgress {
  const definition = getBuilderProject(projectId);
  const built = isBuilderProjectBuilt(save, projectId);
  const missingPrerequisites = definition.prerequisiteIds
    .filter((id) => !isBuilderProjectBuilt(save, id))
    .map(getBuilderProject);
  const materials = numberFlag(save.flags.ranchMaterialsStock);
  return {
    definition,
    status: built ? "built" : missingPrerequisites.length ? "locked" : "available",
    built,
    missingPrerequisites,
    affordable: !built && !missingPrerequisites.length && save.currencies.gold >= definition.costGold && materials >= definition.costMaterials,
  };
}

export function commissionBuilderProject(save: GameSave, projectId: BuilderProjectId): BuilderProjectResult {
  const progress = getBuilderProjectProgress(save, projectId);
  const project = progress.definition;
  if (progress.built) return { save, ok: false, projectId, message: `${project.title} is already complete.` };
  if (progress.missingPrerequisites.length) {
    return {
      save,
      ok: false,
      projectId,
      message: `Build ${progress.missingPrerequisites.map((item) => item.title).join(" and ")} first.`,
    };
  }
  const materials = numberFlag(save.flags.ranchMaterialsStock);
  if (save.currencies.gold < project.costGold || materials < project.costMaterials) {
    return {
      save,
      ok: false,
      projectId,
      message: `Petra needs ${project.costGold} Gold and ${project.costMaterials} Materials for ${project.title}.`,
    };
  }
  const nextSave: GameSave = {
    ...save,
    updatedAt: new Date().toISOString(),
    currencies: { ...save.currencies, gold: save.currencies.gold - project.costGold },
    flags: {
      ...save.flags,
      ranchMaterialsStock: materials - project.costMaterials,
      [builtFlag(projectId)]: true,
      builderProjectsCompleted: numberFlag(save.flags.builderProjectsCompleted) + 1,
      builderLastCompletedProjectId: projectId,
      builderMetPetraHale: true,
      m63BuilderYardUsed: true,
      ...(project.category === "land" ? { m63RanchLandExpanded: true } : {}),
      ...(project.category === "habitat" ? { m63FutureHabitatBuilt: true } : {}),
      ...(project.category === "security" ? { m63PermanentSecurityBuilt: true } : {}),
    },
  };
  return { save: nextSave, ok: true, projectId, message: `${project.title} completed. ${project.description}` };
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
    .filter((project) => project.category === "habitat" && isBuilderProjectBuilt(save, project.id))
    .map((project) => project.id);
}
