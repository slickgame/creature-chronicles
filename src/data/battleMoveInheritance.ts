import {
  buildBredCreatureStartingMoveLoadout,
  canSpeciesLearnBattleMove,
  getBattleMoveInheritanceCandidates,
  getCreatureBattleMoveLoadout,
} from "@/data/battleLoadouts";
import { BATTLE_MOVE_COMBINATION_RECIPES } from "@/data/battleMoveRecipes";
import { getBattleMove } from "@/data/battleMoves";
import { getBattleSpeciesProfile, getBattleSpeciesTags } from "@/data/battleProfiles";
import { getRanchUpgrades } from "@/data/ranchUpgrades";
import type {
  BattleMoveCombinationCandidate,
  BattleMoveId,
  BattleMoveInheritanceCandidate,
  BattleMoveInheritancePreview,
  BattleMoveInheritanceResult,
  BattleMoveInheritanceRoll,
  BattleMoveInheritanceSource,
  ParentBattleMoveSource,
} from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { SpeciesId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export const BATTLE_MOVE_INHERITANCE_VERSION = 1;
export const MAX_DIRECT_INHERITED_MOVES = 3;
export const MAX_COMBINATION_INHERITED_MOVES = 1;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function deterministicRoll(seed: string, modulo = 100): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 10000019;
  }
  return Math.abs(hash) % Math.max(1, modulo);
}

function uniqueMoveIds(moveIds: readonly BattleMoveId[]): BattleMoveId[] {
  return Array.from(new Set(moveIds.filter(Boolean)));
}

function emptyParentSource(): ParentBattleMoveSource {
  return { learnedMoveIds: [], equippedMoveIds: [] };
}

export function getParentBattleMoveSource(creature?: CreatureRecord): ParentBattleMoveSource {
  if (!creature) return emptyParentSource();
  const loadout = getCreatureBattleMoveLoadout(creature);
  return {
    learnedMoveIds: [...loadout.learnedMoveIds],
    equippedMoveIds: [...loadout.equippedMoveIds],
  };
}

function getPairKey(a: string, b: string): string {
  return [a, b].sort().join("__");
}

export function getBattleMoveInheritanceContextBonus(
  save: GameSave,
  giver?: CreatureRecord,
  receiver?: CreatureRecord,
): { bonus: number; reasons: string[] } {
  if (!giver || !receiver) {
    return {
      bonus: 0,
      reasons: ["Move inheritance requires two tracked creature parents."],
    };
  }

  const pairKey = getPairKey(String(giver.creatureId), String(receiver.creatureId));
  const pairStreak = save.breeding?.streaks.find((record) => record.pairKey === pairKey)?.streakCount ?? 0;
  const breedingTier = Math.max(0, Math.min(4, getRanchUpgrades(save).breeding_pen_comfort ?? 0));
  const averageAffection = Math.round((giver.affection + receiver.affection) / 2);
  const familiarityBonus = Math.min(8, pairStreak * 2);
  const comfortBonus = breedingTier * 2;
  const affectionBonus = clamp(Math.floor((averageAffection - 45) / 10), 0, 5);
  const bonus = clamp(familiarityBonus + comfortBonus + affectionBonus, 0, 18);

  return {
    bonus,
    reasons: [
      `Pair familiarity contributes +${familiarityBonus}% move-inheritance chance.`,
      `Breeding Pen Comfort Tier ${breedingTier} contributes +${comfortBonus}%.`,
      `Average Affection ${averageAffection} contributes +${affectionBonus}%.`,
    ],
  };
}

function getAdjustedDirectCandidates(
  childSpeciesId: SpeciesId,
  giverSource: ParentBattleMoveSource,
  receiverSource: ParentBattleMoveSource,
  contextBonus: number,
): BattleMoveInheritanceCandidate[] {
  const nativeMoves = new Set(getBattleSpeciesProfile(childSpeciesId).defaultLearnedMoveIds);
  return getBattleMoveInheritanceCandidates(childSpeciesId, giverSource, receiverSource)
    .filter((candidate) => !nativeMoves.has(candidate.moveId))
    .map((candidate) => ({
      ...candidate,
      finalChance: clamp(candidate.finalChance + contextBonus, 0, 95),
      reasons: [
        ...candidate.reasons,
        contextBonus > 0
          ? `Pair quality adds +${contextBonus}% to this move-inheritance roll.`
          : "No pair-quality move-inheritance bonus applies.",
      ],
    }))
    .sort((left, right) => right.finalChance - left.finalChance || left.moveId.localeCompare(right.moveId));
}

function firstMatchingMove(
  source: ParentBattleMoveSource,
  allowedMoveIds: readonly BattleMoveId[],
): BattleMoveId | null {
  return allowedMoveIds.find((moveId) => source.equippedMoveIds.includes(moveId))
    ?? allowedMoveIds.find((moveId) => source.learnedMoveIds.includes(moveId))
    ?? null;
}

function recipeMatchesChild(
  childSpeciesId: SpeciesId,
  recipe: (typeof BATTLE_MOVE_COMBINATION_RECIPES)[number],
): boolean {
  const profile = getBattleSpeciesProfile(childSpeciesId);
  const childTags = getBattleSpeciesTags(childSpeciesId);
  if (recipe.blockedChildSpeciesIds?.includes(childSpeciesId)) return false;
  if (recipe.requiredChildSpeciesIds?.length && !recipe.requiredChildSpeciesIds.includes(childSpeciesId)) return false;
  if (recipe.requiredChildFamilyTags?.length && !recipe.requiredChildFamilyTags.includes(profile.family)) return false;
  if (recipe.requiredChildTags?.length && !recipe.requiredChildTags.some((tag) => childTags.includes(tag))) return false;
  return canSpeciesLearnBattleMove(childSpeciesId, recipe.outputMoveId);
}

function buildRecipeCandidate(
  childSpeciesId: SpeciesId,
  giverSource: ParentBattleMoveSource,
  receiverSource: ParentBattleMoveSource,
  contextBonus: number,
  recipe: (typeof BATTLE_MOVE_COMBINATION_RECIPES)[number],
): BattleMoveCombinationCandidate | null {
  if (!recipeMatchesChild(childSpeciesId, recipe)) return null;

  const directA = firstMatchingMove(giverSource, recipe.parentAMoveIds);
  const directB = firstMatchingMove(receiverSource, recipe.parentBMoveIds);
  const swappedA = recipe.symmetric ? firstMatchingMove(receiverSource, recipe.parentAMoveIds) : null;
  const swappedB = recipe.symmetric ? firstMatchingMove(giverSource, recipe.parentBMoveIds) : null;
  const contributingA = directA && directB ? directA : swappedA;
  const contributingB = directA && directB ? directB : swappedB;
  if (!contributingA || !contributingB) return null;

  const firstEquipped = giverSource.equippedMoveIds.includes(contributingA)
    || receiverSource.equippedMoveIds.includes(contributingA);
  const secondEquipped = giverSource.equippedMoveIds.includes(contributingB)
    || receiverSource.equippedMoveIds.includes(contributingB);
  const equippedBonus = (firstEquipped ? 5 : 0) + (secondEquipped ? 5 : 0);
  const chance = clamp(recipe.baseChance + contextBonus + equippedBonus, 1, 65);

  return {
    recipeId: recipe.recipeId,
    recipeName: recipe.name,
    outputMoveId: recipe.outputMoveId,
    outputMoveName: getBattleMove(recipe.outputMoveId).name,
    chance,
    parentAContributingMoveId: contributingA,
    parentBContributingMoveId: contributingB,
    contributingMoveNames: [getBattleMove(contributingA).name, getBattleMove(contributingB).name],
    reasons: [
      `Recipe base chance is ${recipe.baseChance}%.`,
      `Pair quality adds +${contextBonus}%.`,
      `Equipped contributing techniques add +${equippedBonus}%.`,
      `${getBattleMove(contributingA).name} and ${getBattleMove(contributingB).name} satisfy the recipe.`,
    ],
  };
}

export function getBattleMoveCombinationCandidates(
  childSpeciesId: SpeciesId,
  giverSource: ParentBattleMoveSource,
  receiverSource: ParentBattleMoveSource,
  contextBonus = 0,
): BattleMoveCombinationCandidate[] {
  return BATTLE_MOVE_COMBINATION_RECIPES
    .map((recipe) => buildRecipeCandidate(childSpeciesId, giverSource, receiverSource, contextBonus, recipe))
    .filter((candidate): candidate is BattleMoveCombinationCandidate => candidate !== null)
    .sort((left, right) => right.chance - left.chance || left.recipeId.localeCompare(right.recipeId));
}

function directMoveSource(
  moveId: BattleMoveId,
  giverSource: ParentBattleMoveSource,
  receiverSource: ParentBattleMoveSource,
): BattleMoveInheritanceSource {
  const giverKnows = giverSource.learnedMoveIds.includes(moveId) || giverSource.equippedMoveIds.includes(moveId);
  const receiverKnows = receiverSource.learnedMoveIds.includes(moveId) || receiverSource.equippedMoveIds.includes(moveId);
  if (giverKnows && receiverKnows) return "both";
  return giverKnows ? "giver" : "receiver";
}

export type RollBattleMoveInheritanceInput = {
  save: GameSave;
  childSpeciesId: SpeciesId;
  giver?: CreatureRecord;
  receiver?: CreatureRecord;
  seed: string;
};

export function rollBattleMoveInheritance(
  input: RollBattleMoveInheritanceInput,
): BattleMoveInheritanceResult {
  const giverSource = getParentBattleMoveSource(input.giver);
  const receiverSource = getParentBattleMoveSource(input.receiver);
  const context = getBattleMoveInheritanceContextBonus(input.save, input.giver, input.receiver);
  const directCandidates = getAdjustedDirectCandidates(
    input.childSpeciesId,
    giverSource,
    receiverSource,
    context.bonus,
  );
  const combinationCandidates = getBattleMoveCombinationCandidates(
    input.childSpeciesId,
    giverSource,
    receiverSource,
    context.bonus,
  );
  const directInheritedMoveIds: BattleMoveId[] = [];
  const combinationMoveIds: BattleMoveId[] = [];
  const rolls: BattleMoveInheritanceRoll[] = [];

  directCandidates.forEach((candidate, index) => {
    const roll = deterministicRoll(`${input.seed}_direct_${candidate.moveId}_${index}`, 100);
    const passed = roll < candidate.finalChance;
    const hasRoom = directInheritedMoveIds.length < MAX_DIRECT_INHERITED_MOVES;
    const inherited = passed && hasRoom;
    if (inherited) directInheritedMoveIds.push(candidate.moveId);
    rolls.push({
      moveId: candidate.moveId,
      moveName: candidate.moveName,
      source: directMoveSource(candidate.moveId, giverSource, receiverSource),
      chance: candidate.finalChance,
      roll,
      inherited,
      contributingMoveIds: [candidate.moveId],
      reasons: [
        ...candidate.reasons,
        passed && !hasRoom
          ? `The roll passed, but the ${MAX_DIRECT_INHERITED_MOVES}-move direct inheritance limit was already filled.`
          : inherited
            ? `Inheritance succeeded: roll ${roll} was below ${candidate.finalChance}.`
            : `Inheritance did not trigger: roll ${roll} was not below ${candidate.finalChance}.`,
      ],
    });
  });

  combinationCandidates.forEach((candidate, index) => {
    const roll = deterministicRoll(`${input.seed}_combination_${candidate.recipeId}_${index}`, 100);
    const passed = roll < candidate.chance;
    const hasRoom = combinationMoveIds.length < MAX_COMBINATION_INHERITED_MOVES;
    const inherited = passed && hasRoom;
    if (inherited) combinationMoveIds.push(candidate.outputMoveId);
    rolls.push({
      moveId: candidate.outputMoveId,
      moveName: candidate.outputMoveName,
      source: "combination",
      chance: candidate.chance,
      roll,
      inherited,
      recipeId: candidate.recipeId,
      contributingMoveIds: [candidate.parentAContributingMoveId, candidate.parentBContributingMoveId],
      reasons: [
        ...candidate.reasons,
        passed && !hasRoom
          ? "The recipe succeeded, but another combination technique already occupied the offspring's combination slot."
          : inherited
            ? `Combination discovered: roll ${roll} was below ${candidate.chance}.`
            : `Combination did not emerge: roll ${roll} was not below ${candidate.chance}.`,
      ],
    });
  });

  const projectedLoadout = buildBredCreatureStartingMoveLoadout(
    input.childSpeciesId,
    uniqueMoveIds([...combinationMoveIds, ...directInheritedMoveIds]),
  );
  const inheritedNames = [...combinationMoveIds, ...directInheritedMoveIds].map((moveId) => getBattleMove(moveId).name);
  const notes = [
    ...context.reasons,
    inheritedNames.length
      ? `Offspring move lineage produced: ${inheritedNames.join(", ")}.`
      : "No additional parent or combination move carried through; the offspring will use its native starting library.",
    `Starting library contains ${projectedLoadout.learnedMoveIds.length} learned moves and ${projectedLoadout.equippedMoveIds.length} equipped moves.`,
  ];

  return {
    version: BATTLE_MOVE_INHERITANCE_VERSION,
    childSpeciesId: input.childSpeciesId,
    giverCreatureId: input.giver?.creatureId,
    receiverCreatureId: input.receiver?.creatureId,
    giverMoveSnapshot: giverSource,
    receiverMoveSnapshot: receiverSource,
    directInheritedMoveIds,
    combinationMoveIds,
    projectedLoadout,
    rolls,
    notes,
  };
}

export function getBattleMoveInheritancePreview(
  save: GameSave,
  giverId: string | null,
  receiverId: string | null,
): BattleMoveInheritancePreview {
  const giver = giverId
    ? (save.creatures ?? []).find((creature) => String(creature.creatureId) === giverId)
    : undefined;
  const receiver = receiverId
    ? (save.creatures ?? []).find((creature) => String(creature.creatureId) === receiverId)
    : undefined;

  if (!giver || !receiver) {
    return {
      canProduceOffspring: false,
      reason: "Select two tracked creatures to preview parent-move and combination possibilities.",
      contextBonus: 0,
      directCandidates: [],
      combinationCandidates: [],
    };
  }

  const childSpeciesId = receiver.speciesId;
  const giverSource = getParentBattleMoveSource(giver);
  const receiverSource = getParentBattleMoveSource(receiver);
  const context = getBattleMoveInheritanceContextBonus(save, giver, receiver);
  const directCandidates = getAdjustedDirectCandidates(
    childSpeciesId,
    giverSource,
    receiverSource,
    context.bonus,
  );
  const combinationCandidates = getBattleMoveCombinationCandidates(
    childSpeciesId,
    giverSource,
    receiverSource,
    context.bonus,
  );

  return {
    childSpeciesId,
    canProduceOffspring: true,
    reason: directCandidates.length || combinationCandidates.length
      ? "These are possible move-lineage outcomes. Exact rolls occur only after a successful conception."
      : "This pairing has no additional compatible parent moves; offspring still receive a complete native starting loadout.",
    contextBonus: context.bonus,
    directCandidates,
    combinationCandidates,
  };
}
