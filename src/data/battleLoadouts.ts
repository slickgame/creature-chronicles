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
export const BATTLE_MOVE_LOADOUT_VERSION = 1;
export const REQUIRED_BASIC_BATTLE_MOVE_ID = "strike";
export const REQUIRED_DEFENSE_BATTLE_MOVE_ID = "defend";

export type BattleMoveLoadoutChangeResult = {
  ok: boolean;
  loadout: BattleMoveLoadout;
  message: string;
};

function uniqueMoveIds(moveIds: readonly BattleMoveId[]): BattleMoveId[] {
  return Array.from(new Set(moveIds.filter(Boolean)));
}

function hasAnyMatch(required: readonly string[] | undefined, available: readonly string[]): boolean {
  if (!required || required.length === 0) return false;
  return required.some((tag) => available.includes(tag));
}

function hasAllMatches(required: readonly string[] | undefined, available: readonly string[]): boolean {
  if (!required || required.length === 0) return true;
  return required.every((tag) => available.includes(tag));
}

function isAlwaysUsableMove(moveId: BattleMoveId): boolean {
  const move = BATTLE_MOVES_BY_ID[moveId];
  return Boolean(move && move.battleEnergyCost <= 0 && move.cooldown <= 0);
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
  const allTagsMatch = hasAllMatches(requirements.requiredAllTags, availableTags);
  if (!allTagsMatch) return false;
  const hasFlexibleRequirement = Boolean(
    requirements.bodyTags?.length ||
    requirements.temperamentTags?.length ||
    requirements.roleTags?.length ||
    requirements.requiredAnyTags?.length,
  );
  if (!hasFlexibleRequirement && requirements.requiredAllTags?.length) return true;
  return (
    hasAnyMatch(requirements.bodyTags, availableTags) ||
    hasAnyMatch(requirements.temperamentTags, availableTags) ||
    hasAnyMatch(requirements.roleTags, availableTags) ||
    hasAnyMatch(requirements.requiredAnyTags, availableTags)
  );
}

function ensureAlwaysUsableEquippedMove(
  learnedMoveIds: BattleMoveId[],
  equippedMoveIds: BattleMoveId[],
): BattleMoveId[] {
  if (equippedMoveIds.some(isAlwaysUsableMove)) return equippedMoveIds;
  const fallbackMoveId = learnedMoveIds.find(isAlwaysUsableMove) ?? REQUIRED_BASIC_BATTLE_MOVE_ID;
  return uniqueMoveIds([fallbackMoveId, ...equippedMoveIds]).slice(0, MAX_EQUIPPED_BATTLE_MOVES);
}

export function normalizeBattleMoveLoadout(
  speciesId: SpeciesId,
  loadout: Partial<BattleMoveLoadout> = {},
): BattleMoveLoadout {
  const profile = getBattleSpeciesProfile(speciesId);
  const hasSavedLearnedLibrary = Boolean(loadout.learnedMoveIds?.length);
  const candidateLearnedMoveIds = hasSavedLearnedLibrary
    ? [REQUIRED_BASIC_BATTLE_MOVE_ID, profile.signatureMoveId, ...(loadout.learnedMoveIds ?? [])]
    : [...profile.defaultLearnedMoveIds, REQUIRED_BASIC_BATTLE_MOVE_ID, profile.signatureMoveId, REQUIRED_DEFENSE_BATTLE_MOVE_ID];
  const learnedMoveIds = uniqueMoveIds(candidateLearnedMoveIds)
    .filter((moveId) => canSpeciesLearnBattleMove(speciesId, moveId))
    .slice(0, MAX_LEARNED_BATTLE_MOVES);

  const savedEquipped = loadout.equippedMoveIds?.length ? loadout.equippedMoveIds : profile.defaultEquippedMoveIds;
  const legalEquipped = uniqueMoveIds(savedEquipped)
    .filter((moveId) => learnedMoveIds.includes(moveId))
    .slice(0, MAX_EQUIPPED_BATTLE_MOVES);
  const equippedMoveIds = ensureAlwaysUsableEquippedMove(
    learnedMoveIds,
    legalEquipped.length > 0 ? legalEquipped : learnedMoveIds.slice(0, MAX_EQUIPPED_BATTLE_MOVES),
  );

  return {
    learnedMoveIds,
    equippedMoveIds,
    version: BATTLE_MOVE_LOADOUT_VERSION,
  };
}

export function getDefaultBattleMoveLoadout(speciesId: SpeciesId): BattleMoveLoadout {
  return normalizeBattleMoveLoadout(speciesId);
}

export function getCreatureBattleMoveLoadout(creature: CreatureRecord): BattleMoveLoadout {
  return normalizeBattleMoveLoadout(creature.speciesId, creature.battleMoveLoadout ?? {});
}

export function getCreatureDefaultBattleMoveLoadout(creature: CreatureRecord): BattleMoveLoadout {
  return getDefaultBattleMoveLoadout(creature.speciesId);
}

export function normalizeCreatureBattleMoveLoadoutRecord(creature: CreatureRecord): CreatureRecord {
  return {
    ...creature,
    battleMoveLoadout: getCreatureBattleMoveLoadout(creature),
  };
}

export function learnBattleMove(
  speciesId: SpeciesId,
  currentLoadout: Partial<BattleMoveLoadout>,
  moveId: BattleMoveId,
): BattleMoveLoadoutChangeResult {
  const loadout = normalizeBattleMoveLoadout(speciesId, currentLoadout);
  const move = BATTLE_MOVES_BY_ID[moveId];
  if (!move) return { ok: false, loadout, message: `Unknown move: ${moveId}.` };
  if (!canSpeciesLearnBattleMove(speciesId, moveId)) return { ok: false, loadout, message: `${move.name} is not compatible with this species.` };
  if (loadout.learnedMoveIds.includes(moveId)) return { ok: true, loadout, message: `${move.name} is already learned.` };
  if (loadout.learnedMoveIds.length >= MAX_LEARNED_BATTLE_MOVES) {
    return { ok: false, loadout, message: `The learned move library is full (${MAX_LEARNED_BATTLE_MOVES}/${MAX_LEARNED_BATTLE_MOVES}).` };
  }
  const next = normalizeBattleMoveLoadout(speciesId, {
    ...loadout,
    learnedMoveIds: [...loadout.learnedMoveIds, moveId],
  });
  return { ok: true, loadout: next, message: `${move.name} added to the learned move library.` };
}

export function equipBattleMove(
  speciesId: SpeciesId,
  currentLoadout: Partial<BattleMoveLoadout>,
  moveId: BattleMoveId,
  replaceMoveId?: BattleMoveId,
): BattleMoveLoadoutChangeResult {
  const loadout = normalizeBattleMoveLoadout(speciesId, currentLoadout);
  const move = BATTLE_MOVES_BY_ID[moveId];
  if (!move) return { ok: false, loadout, message: `Unknown move: ${moveId}.` };
  if (!loadout.learnedMoveIds.includes(moveId)) return { ok: false, loadout, message: `${move.name} must be learned before it can be equipped.` };
  if (loadout.equippedMoveIds.includes(moveId)) return { ok: true, loadout, message: `${move.name} is already equipped.` };

  let equippedMoveIds = loadout.equippedMoveIds;
  if (replaceMoveId) equippedMoveIds = equippedMoveIds.filter((id) => id !== replaceMoveId);
  if (equippedMoveIds.length >= MAX_EQUIPPED_BATTLE_MOVES) {
    return { ok: false, loadout, message: `The active move loadout is full (${MAX_EQUIPPED_BATTLE_MOVES}/${MAX_EQUIPPED_BATTLE_MOVES}). Choose a move to replace.` };
  }

  const next = normalizeBattleMoveLoadout(speciesId, {
    ...loadout,
    equippedMoveIds: [...equippedMoveIds, moveId],
  });
  return { ok: true, loadout: next, message: `${move.name} equipped.` };
}

export function unequipBattleMove(
  speciesId: SpeciesId,
  currentLoadout: Partial<BattleMoveLoadout>,
  moveId: BattleMoveId,
): BattleMoveLoadoutChangeResult {
  const loadout = normalizeBattleMoveLoadout(speciesId, currentLoadout);
  if (!loadout.equippedMoveIds.includes(moveId)) return { ok: true, loadout, message: `${moveId} is not equipped.` };
  const remaining = loadout.equippedMoveIds.filter((id) => id !== moveId);
  if (!remaining.some(isAlwaysUsableMove)) {
    return { ok: false, loadout, message: "At least one zero-cost, zero-cooldown move must remain equipped." };
  }
  const next = normalizeBattleMoveLoadout(speciesId, { ...loadout, equippedMoveIds: remaining });
  return { ok: true, loadout: next, message: `${getBattleMove(moveId).name} unequipped.` };
}

export function forgetBattleMove(
  speciesId: SpeciesId,
  currentLoadout: Partial<BattleMoveLoadout>,
  moveId: BattleMoveId,
): BattleMoveLoadoutChangeResult {
  const loadout = normalizeBattleMoveLoadout(speciesId, currentLoadout);
  const profile = getBattleSpeciesProfile(speciesId);
  if (moveId === REQUIRED_BASIC_BATTLE_MOVE_ID || moveId === profile.signatureMoveId) {
    return { ok: false, loadout, message: "The required basic move and native signature move cannot be forgotten." };
  }
  if (!loadout.learnedMoveIds.includes(moveId)) return { ok: true, loadout, message: `${moveId} is not learned.` };
  const next = normalizeBattleMoveLoadout(speciesId, {
    learnedMoveIds: loadout.learnedMoveIds.filter((id) => id !== moveId),
    equippedMoveIds: loadout.equippedMoveIds.filter((id) => id !== moveId),
  });
  return { ok: true, loadout: next, message: `${getBattleMove(moveId).name} forgotten.` };
}

export function getBattleMoveLoadoutIssues(speciesId: SpeciesId, raw: Partial<BattleMoveLoadout>): string[] {
  const issues: string[] = [];
  const learned = raw.learnedMoveIds ?? [];
  const equipped = raw.equippedMoveIds ?? [];
  if (learned.length > MAX_LEARNED_BATTLE_MOVES) issues.push(`Learned library exceeds ${MAX_LEARNED_BATTLE_MOVES} moves.`);
  if (equipped.length > MAX_EQUIPPED_BATTLE_MOVES) issues.push(`Equipped loadout exceeds ${MAX_EQUIPPED_BATTLE_MOVES} moves.`);
  if (new Set(learned).size !== learned.length) issues.push("Learned library contains duplicate move ids.");
  if (new Set(equipped).size !== equipped.length) issues.push("Equipped loadout contains duplicate move ids.");
  learned.forEach((moveId) => {
    if (!BATTLE_MOVES_BY_ID[moveId]) issues.push(`Unknown learned move: ${moveId}.`);
    else if (!canSpeciesLearnBattleMove(speciesId, moveId)) issues.push(`Incompatible learned move: ${moveId}.`);
  });
  equipped.forEach((moveId) => {
    if (!learned.includes(moveId)) issues.push(`Equipped move is not learned: ${moveId}.`);
  });
  if (equipped.length > 0 && !equipped.some(isAlwaysUsableMove)) issues.push("No zero-cost, zero-cooldown move is equipped.");
  return issues;
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
  if (move.learnRequirements?.requiredAllTags?.every((tag) => speciesTags.includes(tag))) return 6;
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
