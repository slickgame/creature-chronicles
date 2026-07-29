import { BATTLE_MOVE_COMBINATION_RECIPES } from "@/data/battleMoveRecipes";
import { BATTLE_MOVES, BATTLE_MOVES_BY_ID } from "@/data/battleMoves";
import { BATTLE_SPECIES_PROFILES } from "@/data/battleProfiles";
import {
  MAX_EQUIPPED_BATTLE_MOVES,
  MAX_LEARNED_BATTLE_MOVES,
  getBattleMoveLoadoutIssues,
  getCreatureBattleMoveLoadout,
} from "@/data/battleLoadouts";
import type { BattleEffectTarget, BattleMove, BattleMoveCategory, BattleMoveId } from "@/types/battle";
import type { GameSave } from "@/types/save";

export type BattleMoveAuditSeverity = "error" | "warning";
export type BattleMoveAuditScope = "move" | "species" | "recipe" | "creature" | "catalog";

export type BattleMoveAuditIssue = {
  issueId: string;
  severity: BattleMoveAuditSeverity;
  scope: BattleMoveAuditScope;
  subjectId: string;
  message: string;
};

export type BattleMoveAuditReport = {
  moveCount: number;
  speciesProfileCount: number;
  recipeCount: number;
  ownedCreatureCount: number;
  physicalCount: number;
  specialCount: number;
  supportCount: number;
  statusCount: number;
  healingCount: number;
  universalCount: number;
  speciesCount: number;
  combinationCount: number;
  errorCount: number;
  warningCount: number;
  issues: BattleMoveAuditIssue[];
};

function issue(
  severity: BattleMoveAuditSeverity,
  scope: BattleMoveAuditScope,
  subjectId: string,
  code: string,
  message: string,
): BattleMoveAuditIssue {
  return {
    issueId: `${scope}:${subjectId}:${code}`,
    severity,
    scope,
    subjectId,
    message,
  };
}

function expectedEffectTargets(move: BattleMove): BattleEffectTarget[] {
  if (move.targetType === "self") return ["self"];
  if (move.targetType === "single_enemy" || move.targetType === "single_ally") return ["target", "self"];
  if (move.targetType === "all_enemies") return ["enemies", "self"];
  if (move.targetType === "all_allies") return ["allies", "self"];
  return ["field", "self"];
}

function auditMove(move: BattleMove): BattleMoveAuditIssue[] {
  const issues: BattleMoveAuditIssue[] = [];
  if (!move.id.trim()) issues.push(issue("error", "move", move.id || "missing-id", "missing-id", "Move id is empty."));
  if (!move.name.trim()) issues.push(issue("error", "move", move.id, "missing-name", "Move name is empty."));
  if (!move.description.trim()) issues.push(issue("warning", "move", move.id, "missing-description", "Move description is empty."));
  if (!move.tags.length) issues.push(issue("error", "move", move.id, "missing-tags", "Move has no gameplay tags."));
  if (!move.effects.length) issues.push(issue("error", "move", move.id, "missing-effects", "Move has no effect payload."));
  if (!Number.isFinite(move.power) || move.power < 0) issues.push(issue("error", "move", move.id, "invalid-power", "Power must be a finite nonnegative number."));
  if (!Number.isFinite(move.accuracy) || move.accuracy < 1 || move.accuracy > 100) issues.push(issue("error", "move", move.id, "invalid-accuracy", "Accuracy must be between 1 and 100."));
  if (!Number.isFinite(move.battleEnergyCost) || move.battleEnergyCost < 0) issues.push(issue("error", "move", move.id, "invalid-energy", "Battle Energy cost must be nonnegative."));
  if (!Number.isFinite(move.cooldown) || move.cooldown < 0) issues.push(issue("error", "move", move.id, "invalid-cooldown", "Cooldown must be nonnegative."));
  if (!Number.isFinite(move.priority) || move.priority < -5 || move.priority > 5) issues.push(issue("warning", "move", move.id, "priority-range", "Priority is outside the recommended -5 to +5 range."));
  if (!move.definitionVersion) issues.push(issue("warning", "move", move.id, "missing-version", "Move definition version is missing."));
  if (!move.aiHints?.length) issues.push(issue("warning", "move", move.id, "missing-ai-hints", "Move has no AI-use hints."));
  if (!move.scalingStat) issues.push(issue("warning", "move", move.id, "missing-scaling", "Move scaling stat is not declared."));
  if (!move.resistedBy) issues.push(issue("warning", "move", move.id, "missing-resistance", "Move resisted-by stat is not declared."));

  const hasDamage = move.effects.some((effect) => effect.type === "damage");
  const hasHealing = move.effects.some((effect) => effect.type === "heal");
  if ((move.category === "physical" || move.category === "special") && (!hasDamage || move.power <= 0)) {
    issues.push(issue("error", "move", move.id, "damage-payload", "Damaging moves require positive power and a damage effect."));
  }
  if (move.category === "healing" && !hasHealing) {
    issues.push(issue("error", "move", move.id, "healing-payload", "Healing moves require a heal effect."));
  }
  if ((move.category === "support" || move.category === "status" || move.category === "healing") && hasDamage) {
    issues.push(issue("warning", "move", move.id, "hybrid-category", "Non-damage category includes a damage payload; confirm this hybrid is intentional."));
  }

  const allowedTargets = expectedEffectTargets(move);
  move.effects.forEach((effect, index) => {
    if (effect.target && !allowedTargets.includes(effect.target)) {
      issues.push(issue("error", "move", move.id, `effect-target-${index}`, `${effect.type} targets ${effect.target}, which is incompatible with ${move.targetType}.`));
    }
    if (effect.chance !== undefined && (effect.chance < 0 || effect.chance > 100)) {
      issues.push(issue("error", "move", move.id, `effect-chance-${index}`, `${effect.type} chance must be between 0 and 100.`));
    }
    if (effect.duration !== undefined && effect.duration < 0) {
      issues.push(issue("error", "move", move.id, `effect-duration-${index}`, `${effect.type} duration cannot be negative.`));
    }
    if ((effect.type === "apply_status" || effect.type === "cleanse_status") && !effect.status) {
      issues.push(issue("error", "move", move.id, `effect-status-${index}`, `${effect.type} requires a status id.`));
    }
    if ((effect.type === "buff_stat" || effect.type === "debuff_stat") && !effect.stat) {
      issues.push(issue("error", "move", move.id, `effect-stat-${index}`, `${effect.type} requires a battle stat.`));
    }
  });

  if (move.sourceType === "combination" && !move.combinationRecipeIds?.length) {
    issues.push(issue("error", "move", move.id, "missing-combination-recipe", "Combination move has no recipe id."));
  }
  return issues;
}

function auditCatalogDuplicates(): BattleMoveAuditIssue[] {
  const issues: BattleMoveAuditIssue[] = [];
  const ids = new Set<string>();
  const filenames = new Set<string>();
  BATTLE_MOVES.forEach((move) => {
    if (ids.has(move.id)) issues.push(issue("error", "catalog", move.id, "duplicate-id", `Duplicate move id: ${move.id}.`));
    ids.add(move.id);
    const normalizedName = move.name.trim().toLowerCase();
    if (filenames.has(normalizedName)) issues.push(issue("warning", "catalog", move.id, "duplicate-name", `Duplicate move display name: ${move.name}.`));
    filenames.add(normalizedName);
  });
  return issues;
}

function auditSpeciesProfiles(): BattleMoveAuditIssue[] {
  const issues: BattleMoveAuditIssue[] = [];
  BATTLE_SPECIES_PROFILES.forEach((profile) => {
    const subject = String(profile.speciesId);
    const allReferenced = [
      profile.signatureMoveId,
      ...profile.speciesMoveIds,
      ...profile.universalCompatibilityMoveIds,
      ...profile.defaultLearnedMoveIds,
      ...profile.defaultEquippedMoveIds,
    ];
    allReferenced.forEach((moveId) => {
      if (!BATTLE_MOVES_BY_ID[moveId]) issues.push(issue("error", "species", subject, `missing-${moveId}`, `Profile references missing move ${moveId}.`));
    });
    if (!profile.speciesMoveIds.includes(profile.signatureMoveId)) {
      issues.push(issue("error", "species", subject, "signature-pool", "Signature move is not included in the species move pool."));
    }
    if (profile.defaultLearnedMoveIds.length > MAX_LEARNED_BATTLE_MOVES) {
      issues.push(issue("error", "species", subject, "learned-limit", `Default learned library exceeds ${MAX_LEARNED_BATTLE_MOVES}.`));
    }
    if (profile.defaultEquippedMoveIds.length > MAX_EQUIPPED_BATTLE_MOVES) {
      issues.push(issue("error", "species", subject, "equipped-limit", `Default equipped loadout exceeds ${MAX_EQUIPPED_BATTLE_MOVES}.`));
    }
    profile.defaultEquippedMoveIds.forEach((moveId) => {
      if (!profile.defaultLearnedMoveIds.includes(moveId)) issues.push(issue("error", "species", subject, `unlearned-${moveId}`, `Default equipped move ${moveId} is not learned.`));
    });
    const hasFallback = profile.defaultEquippedMoveIds.some((moveId) => {
      const move = BATTLE_MOVES_BY_ID[moveId];
      return move && move.battleEnergyCost === 0 && move.cooldown === 0;
    });
    if (!hasFallback) issues.push(issue("error", "species", subject, "no-fallback", "Default loadout has no zero-cost, zero-cooldown fallback move."));
  });
  return issues;
}

function auditRecipes(): BattleMoveAuditIssue[] {
  const issues: BattleMoveAuditIssue[] = [];
  const ids = new Set<string>();
  BATTLE_MOVE_COMBINATION_RECIPES.forEach((recipe) => {
    if (ids.has(recipe.recipeId)) issues.push(issue("error", "recipe", recipe.recipeId, "duplicate-id", "Duplicate combination recipe id."));
    ids.add(recipe.recipeId);
    const output = BATTLE_MOVES_BY_ID[recipe.outputMoveId];
    if (!output) issues.push(issue("error", "recipe", recipe.recipeId, "missing-output", `Output move ${recipe.outputMoveId} does not exist.`));
    else if (output.sourceType !== "combination") issues.push(issue("error", "recipe", recipe.recipeId, "output-source", "Recipe output is not marked as a combination move."));
    [...recipe.parentAMoveIds, ...recipe.parentBMoveIds].forEach((moveId) => {
      if (!BATTLE_MOVES_BY_ID[moveId]) issues.push(issue("error", "recipe", recipe.recipeId, `missing-parent-${moveId}`, `Parent move ${moveId} does not exist.`));
    });
    if (!recipe.parentAMoveIds.length || !recipe.parentBMoveIds.length) issues.push(issue("error", "recipe", recipe.recipeId, "missing-parent-side", "Both parent move groups must contain at least one move."));
    if (recipe.baseChance < 0 || recipe.baseChance > 100) issues.push(issue("error", "recipe", recipe.recipeId, "invalid-chance", "Base combination chance must be between 0 and 100."));
  });
  return issues;
}

function auditOwnedCreatures(save?: GameSave): BattleMoveAuditIssue[] {
  if (!save) return [];
  return (save.creatures ?? []).flatMap((creature) => {
    const raw = creature.battleMoveLoadout ?? {};
    const loadoutIssues = getBattleMoveLoadoutIssues(creature.speciesId, raw);
    const normalized = getCreatureBattleMoveLoadout(creature);
    const normalizedFallback = normalized.equippedMoveIds.some((moveId) => {
      const move = BATTLE_MOVES_BY_ID[moveId];
      return move && move.battleEnergyCost === 0 && move.cooldown === 0;
    });
    return [
      ...loadoutIssues.map((message, index) => issue("warning", "creature", String(creature.creatureId), `loadout-${index}`, message)),
      ...(!normalizedFallback ? [issue("error", "creature", String(creature.creatureId), "normalized-fallback", "Normalized loadout has no always-usable move.")] : []),
    ];
  });
}

function countCategory(category: BattleMoveCategory): number {
  return BATTLE_MOVES.filter((move) => move.category === category).length;
}

export function auditBattleMoveFoundation(save?: GameSave): BattleMoveAuditReport {
  const issues = [
    ...auditCatalogDuplicates(),
    ...BATTLE_MOVES.flatMap(auditMove),
    ...auditSpeciesProfiles(),
    ...auditRecipes(),
    ...auditOwnedCreatures(save),
  ];
  return {
    moveCount: BATTLE_MOVES.length,
    speciesProfileCount: BATTLE_SPECIES_PROFILES.length,
    recipeCount: BATTLE_MOVE_COMBINATION_RECIPES.length,
    ownedCreatureCount: save?.creatures?.length ?? 0,
    physicalCount: countCategory("physical"),
    specialCount: countCategory("special"),
    supportCount: countCategory("support"),
    statusCount: countCategory("status"),
    healingCount: countCategory("healing"),
    universalCount: BATTLE_MOVES.filter((move) => move.sourceType === "universal").length,
    speciesCount: BATTLE_MOVES.filter((move) => move.sourceType === "species").length,
    combinationCount: BATTLE_MOVES.filter((move) => move.sourceType === "combination").length,
    errorCount: issues.filter((entry) => entry.severity === "error").length,
    warningCount: issues.filter((entry) => entry.severity === "warning").length,
    issues,
  };
}

export function getMoveIdsByCategory(category: BattleMoveCategory): BattleMoveId[] {
  return BATTLE_MOVES.filter((move) => move.category === category).map((move) => move.id);
}
