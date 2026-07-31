import {
  BUILDER_PROJECT_ASSETS,
  BUILDER_PROJECTS,
  getBuilderPredatorPressure,
  getBuilderProject,
  getBuilderProjectProgress as getBuilderProjectProgressBase,
  getBuilderSecurityBonus,
  getBuiltFutureHabitatIds,
  isBuilderProjectBuilt,
  type BuilderProjectCategory,
  type BuilderProjectDefinition,
  type BuilderProjectId,
  type BuilderProjectProgress,
  type BuilderProjectResult,
  type BuilderProjectStatus,
} from "./builderProjects";
import type { GameSave } from "@/types/save";

export {
  BUILDER_PROJECT_ASSETS,
  BUILDER_PROJECTS,
  getBuilderPredatorPressure,
  getBuilderProject,
  getBuilderSecurityBonus,
  getBuiltFutureHabitatIds,
  isBuilderProjectBuilt,
};
export type {
  BuilderProjectCategory,
  BuilderProjectDefinition,
  BuilderProjectId,
  BuilderProjectProgress,
  BuilderProjectResult,
  BuilderProjectStatus,
};

export type BuilderProjectEffectiveCost = {
  gold: number;
  materials: number;
  discountPercent: number;
};

export type BuilderProjectPatronProgress = BuilderProjectProgress & {
  effectiveCostGold: number;
  effectiveCostMaterials: number;
  discountPercent: number;
};

function numberFlag(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function builtFlag(projectId: BuilderProjectId): string {
  return `builderProject_${projectId}_built`;
}

export function getBuilderProjectEffectiveCost(
  save: GameSave,
  projectId: BuilderProjectId,
): BuilderProjectEffectiveCost {
  const project = getBuilderProject(projectId);
  const discountPercent = Math.min(50, numberFlag(save.flags.chapterThreePatronBuilderDiscountPercent));
  const multiplier = 1 - discountPercent / 100;
  return {
    gold: Math.max(1, Math.ceil(project.costGold * multiplier)),
    materials: Math.max(1, Math.ceil(project.costMaterials * multiplier)),
    discountPercent,
  };
}

export function getBuilderProjectProgress(
  save: GameSave,
  projectId: BuilderProjectId,
): BuilderProjectPatronProgress {
  const base = getBuilderProjectProgressBase(save, projectId);
  const cost = getBuilderProjectEffectiveCost(save, projectId);
  const materials = numberFlag(save.flags.ranchMaterialsStock);
  return {
    ...base,
    affordable: !base.built
      && !base.missingPrerequisites.length
      && save.currencies.gold >= cost.gold
      && materials >= cost.materials,
    effectiveCostGold: cost.gold,
    effectiveCostMaterials: cost.materials,
    discountPercent: cost.discountPercent,
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
  if (save.currencies.gold < progress.effectiveCostGold || materials < progress.effectiveCostMaterials) {
    return {
      save,
      ok: false,
      projectId,
      message: `Petra needs ${progress.effectiveCostGold} Gold and ${progress.effectiveCostMaterials} Materials for ${project.title}.`,
    };
  }
  const discountMessage = progress.discountPercent > 0
    ? ` The patron charter reduced both costs by ${progress.discountPercent}%.`
    : "";
  const nextSave: GameSave = {
    ...save,
    updatedAt: new Date().toISOString(),
    currencies: { ...save.currencies, gold: save.currencies.gold - progress.effectiveCostGold },
    flags: {
      ...save.flags,
      ranchMaterialsStock: materials - progress.effectiveCostMaterials,
      [builtFlag(projectId)]: true,
      builderProjectsCompleted: numberFlag(save.flags.builderProjectsCompleted) + 1,
      builderLastCompletedProjectId: projectId,
      builderMetPetraHale: true,
      m63BuilderYardUsed: true,
      ...(project.category === "land" ? { m63RanchLandExpanded: true } : {}),
      ...(project.category === "habitat" ? { m63FutureHabitatBuilt: true } : {}),
      ...(project.category === "security" ? { m63PermanentSecurityBuilt: true } : {}),
      ...(progress.discountPercent > 0 ? { m69BuilderPatronDiscountUsed: true } : {}),
    },
  };
  return {
    save: nextSave,
    ok: true,
    projectId,
    message: `${project.title} completed. ${project.description}${discountMessage}`,
  };
}
