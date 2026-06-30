import type {
  BattleMoveId,
  BattleMoveInheritanceCandidate,
  BattleMoveLoadout,
  ParentBattleMoveSource,
} from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { SpeciesId } from "@/types/ids";
import { BATTLE_MOVES_BY_ID, getBattleMove } from "@/data/battleMoves";
import { getBattleSpeciesProfile, getBattleSpeciesTags } from "@/data/battleProfiles";

export const MAX_LEARNED_BATTLE_MOVES = 8;
export const MAX_EQUIPPED_BATTLE_MOVES = 4;
export const REQUIRED_BASIC_BATTLE_MOVE_ID = "strike";
export const REQUIRED_DEFENSE_BATTLE_MOVE_ID = "defend";

function uniqueMoveIds(moveIds: readonly BattleMoveId[]): BattleMoveId[] {
  return Array.from(new Set(moveIds));
}

function hasAnyMatch(required: readonly string[] | undefined, available: readonly string[]): boolean {
  if (!required || required.length === 0) return false;
  return required.some((tag) => available.includes(tag));
}

export function canSpeciesLearnBattleMove(speciesId: SpeciesId, moveId: BattleMoveId): boolean {
  const move = BATTLE_MOVES_BY_ID[moveId];
  if (!move) return false;

  const profile = getBattleSpeciesProfile(speciesId);
  const requirements = move.learnRequirements;

  if (requirements?.blockedSpeciesIds?.includes(speciesId)) return false;
  if (profile.defaultLearnedMoveIds.includes(moveId) || profile.universalCompatibilityMoveIds.includes(moveId) || profile.speciesMoveIds.includes(moveId)) return true;
  if (!requirements) return move.sourceType === "universal";
  if (requirements.speciesIds?.includes(speciesId)) return true;
  if (requirements.familyTags?.includes(profile.family)) return true;

  const availableTags = getBattleSpeciesTags(speciesId);
  return (
    hasAnyMatch(requirements.bodyTags, availableTags) ||
    hasAnyMatch(requirements.temperamentTags, availableTags) ||
    hasAnyMatch(requirements.roleTags, availableTags) ||
    hasAnyMatch(requirements.requiredAnyTags, availableTags)
  );
}

export function normalizeBattleMoveLoadout(speciesId: SpeciesId, loadout: Partial<BattleMoveLoadout> = {}): BattleMoveLoadout {
  const profile = getBattleSpeciesProfile(speciesId);
  const learnedMoveIds = uniqueMoveIds([
    REQUIRED_BASIC_BATTLE_MOVE_ID,
    profile.signatureMoveId,
    ...(loadout.learnedMoveIds ?? profile.defaultLearnedMoveIds),
    REQUIRED_DEFENSE_BATTLE_MOVE_ID,
  ])
    .filter((moveId) => canSpeciesLearnBattleMove(speciesId, moveId))
    .slice(0, MAX_LEARNED_BATTLE_MOVES);

  const equippedMoveIds = uniqueMoveIds(loadout.equippedMoveIds ?? profile.defaultEquippedMoveIds)
    .filter((moveId) => learnedMoveIds.includes(moveId))
    .slice(0, MAX_EQUIPPED_BATTLE_MOVES);

  return {
    learnedMoveIds,
    equippedMoveIds: equippedMoveIds.length > 0 ? equippedMoveIds : learnedMoveIds.slice(0, MAX_EQUIPPED_BATTLE_MOVES),
  };
}

export function getDefaultBattleMoveLoadout(speciesId: SpeciesId): BattleMoveLoadout {
  return normalizeBattleMoveLoadout(speciesId);
}

export function getCreatureDefaultBattleMoveLoadout(creature: CreatureRecord): BattleMoveLoadout {
  return getDefaultBattleMoveLoadout(creature.speciesId);
}

export function getStoreBattleMoveLoadout(speciesId: SpeciesId, rarity: "common" | "rare" = "common"): BattleMoveLoadout {
  const profile = getBattleSpeciesProfile(speciesId);
  const speciesMoves = profile.speciesMoveIds.slice(0, rarity === "rare" ? 3 : 2);
  const universalMoves = profile.universalCompatibilityMoveIds.slice(0, rarity === "rare" ? 3 : 2);

  return normalizeBattleMoveLoadout(speciesId, {
    learnedMoveIds: uniqueMoveIds([REQUIRED_BASIC_BATTLE_MOVE_ID, ...speciesMoves, ...universalMoves]),
    equippedMoveIds: uniqueMoveIds([REQUIRED_BASIC_BATTLE_MOVE_ID, profile.signatureMoveId, ...speciesMoves, ...universalMoves]).slice(0, MAX_EQUIPPED_BATTLE_MOVES),
  });
}

function getMoveSourceWeight(moveId: BattleMoveId, source: ParentBattleMoveSource): number {
  if (source.equippedMoveIds.includes(moveId)) return 35;
  if (source.learnedMoveIds.includes(moveId)) return 15;
  return 0;
}

function getRarityPenalty(moveId: BattleMoveId): number {
  const move = getBattleMove(moveId);
  if (move.rarity === "rare") return -15;
  if (move.rarity === "signature") return -20;
  if (move.rarity === "event") return -30;
  return 0;
}

function getCompatibilityBonus(speciesId: SpeciesId, moveId: BattleMoveId): number {
  const move = getBattleMove(moveId);
  const profile = getBattleSpeciesProfile(speciesId);
  const speciesTags = getBattleSpeciesTags(speciesId);

  if (profile.signatureMoveId === moveId || profile.speciesMoveIds.includes(moveId)) return 15;
  if (move.tags.some((tag) => profile.affinityMoveTags.includes(tag))) return 10;
  if (move.learnRequirements?.speciesIds?.includes(speciesId)) return 10;
  if (move.learnRequirements?.familyTags?.includes(profile.family)) return 8;
  if (move.learnRequirements?.requiredAnyTags?.some((tag) => speciesTags.includes(tag))) return 6;
  return 0;
}

export function getBattleMoveInheritanceCandidates(
  childSpeciesId: SpeciesId,
  parentA: ParentBattleMoveSource,
  parentB: ParentBattleMoveSource,
): BattleMoveInheritanceCandidate[] {
  const allParentMoveIds = uniqueMoveIds([
    ...parentA.learnedMoveIds,
    ...parentA.equippedMoveIds,
    ...parentB.learnedMoveIds,
    ...parentB.equippedMoveIds,
  ]);

  return allParentMoveIds
    .map((moveId) => {
      const move = BATTLE_MOVES_BY_ID[moveId];
      if (!move || !move.inheritable || !canSpeciesLearnBattleMove(childSpeciesId, moveId)) return null;

      const parentAWeight = getMoveSourceWeight(moveId, parentA);
      const parentBWeight = getMoveSourceWeight(moveId, parentB);
      const baseChance = Math.max(parentAWeight, parentBWeight);
      const knownByBothParents = parentAWeight > 0 && parentBWeight > 0;
      const knownAsEquippedMove = parentA.equippedMoveIds.includes(moveId) || parentB.equippedMoveIds.includes(moveId);
      const bothParentBonus = knownByBothParents ? 25 : 0;
      const rarityPenalty = getRarityPenalty(moveId);
      const compatibilityBonus = getCompatibilityBonus(childSpeciesId, moveId);
      const finalChance = Math.max(0, Math.min(95, baseChance + bothParentBonus + compatibilityBonus + rarityPenalty));

      return {
        moveId,
        moveName: move.name,
        baseChance,
        finalChance,
        knownByBothParents,
        knownAsEquippedMove,
        rarityPenalty,
        compatibilityBonus,
        reasons: [
          knownAsEquippedMove ? "Known as an equipped parent move." : "Known in a parent learned move library.",
          knownByBothParents ? "Both parents know this move." : "Known by one parent.",
          compatibilityBonus > 0 ? "Child species has strong tag compatibility." : "Child species has basic compatibility.",
          rarityPenalty < 0 ? "Rare/signature inheritance penalty applies." : "No rarity penalty.",
        ],
      } satisfies BattleMoveInheritanceCandidate;
    })
    .filter((candidate): candidate is BattleMoveInheritanceCandidate => candidate !== null)
    .sort((left, right) => right.finalChance - left.finalChance);
}

export function buildBredCreatureStartingMoveLoadout(
  childSpeciesId: SpeciesId,
  inheritedMoveIds: readonly BattleMoveId[] = [],
): BattleMoveLoadout {
  const profile = getBattleSpeciesProfile(childSpeciesId);
  const learnedMoveIds = uniqueMoveIds([
    REQUIRED_BASIC_BATTLE_MOVE_ID,
    profile.signatureMoveId,
    ...inheritedMoveIds,
    ...profile.defaultLearnedMoveIds,
  ]).slice(0, MAX_LEARNED_BATTLE_MOVES);

  return normalizeBattleMoveLoadout(childSpeciesId, {
    learnedMoveIds,
    equippedMoveIds: learnedMoveIds.slice(0, MAX_EQUIPPED_BATTLE_MOVES),
  });
}
