import { getBreedingParticipants, getBreedingPreview } from "@/data/breeding";
import { getBattleMoveInheritancePreview } from "@/data/battleMoveInheritance";
import { getParentTalentPreview } from "@/data/genetics";
import { getBreedingSelectionBlocker } from "@/data/breedingSelectionPreview";
import type {
  BreedingParticipant,
  BreedingRole,
  InheritanceTarget,
  InheritanceTargetSelection,
} from "@/types/breeding";
import type { GameSave } from "@/types/save";

export type InheritanceTarget =
  | { kind: "talent"; id: string; grade?: AbilityGrade }
  | { kind: "grade"; grade: AbilityGrade }
  | { kind: "move"; id: string };

export type NamedInheritanceTarget = { target: InheritanceTarget; label: string };
export type InheritanceReviewTarget = NamedInheritanceTarget & { chance: number };

export function getInheritancePairBlocker(
  save: GameSave,
  giver: BreedingParticipant | null | undefined,
  receiver: BreedingParticipant | null | undefined,
): string | null {
  if (!giver || !receiver) return "Choose both parents to review the pairing.";
  if (receiver.kind !== "creature") return "The receiver must be a creature.";
  const blocker = getBreedingSelectionBlocker(giver, "giver", receiver.participantId)
    ?? getBreedingSelectionBlocker(receiver, "receiver", giver.participantId);
  if (blocker) return blocker;
  const readiness = getBreedingPreview(save, giver.participantId, receiver.participantId);
  if (!readiness?.canAttempt) return readiness?.blockedReason ?? "This pairing is no longer available.";
  return readiness.pregnancyBlockedReason ?? null;
}

export function getInheritancePartnerPreviews(save: GameSave, fixedId: string, fixedRole: BreedingRole) {
  const participants = getBreedingParticipants(save);
  const fixed = participants.find(parent => parent.participantId === fixedId);
  if (!fixed || getBreedingSelectionBlocker(fixed, fixedRole, null)) return [];

  return participants.flatMap(partner => {
    const [giver, receiver] = fixedRole === "giver" ? [fixed, partner] : [partner, fixed];
    if (getInheritancePairBlocker(save, giver, receiver)) return [];
    return { partner, ...getPairInheritanceOdds(save, giver, receiver) };
  });
}

function getPairInheritanceOdds(save: GameSave, giver: BreedingParticipant, receiver: BreedingParticipant) {
  const moves = getBattleMoveInheritancePreview(save, giver.participantId, receiver.participantId);
  return {
    talents: getParentTalentPreview(save, giver, receiver),
    moves: [
      ...moves.directCandidates.map(move => ({
        id: `parent-${move.moveId}`, name: move.moveName, chance: move.finalChance,
      })),
      ...moves.combinationCandidates.map(move => ({
        id: `recipe-${move.recipeId}`, name: `${move.outputMoveName} · Combination`, chance: move.chance,
      })),
    ],
  };
}

type PairInheritanceOdds = ReturnType<typeof getPairInheritanceOdds>;

function getTargetChance({ moves, talents }: PairInheritanceOdds, target: InheritanceTarget) {
  if (target.kind === "move") return moves.find(move => move.id === target.id)?.chance ?? 0;
  if (target.kind === "grade") return talents.anyGrade.get(target.grade) ?? 0;
  const talent = talents.candidates.find(candidate => candidate.talent.id === target.id);
  return (target.grade ? talent?.grades.find(row => row.grade === target.grade)?.chance : talent?.chance) ?? 0;
}

export function getInheritanceReviewTarget(
  save: GameSave,
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
  selection: NamedInheritanceTarget,
): InheritanceReviewTarget {
  return { ...selection, chance: getTargetChance(getPairInheritanceOdds(save, giver, receiver), selection.target) };
}

type PartnerPreview = ReturnType<typeof getInheritancePartnerPreviews>[number];

export function rankInheritancePartners(previews: PartnerPreview[], target: InheritanceTarget) {
  return previews.map(preview => ({ partner: preview.partner, chance: getTargetChance(preview, target) }))
    .sort((a, b) => b.chance - a.chance || a.partner.displayName.localeCompare(b.partner.displayName)
      || a.partner.participantId.localeCompare(b.partner.participantId));
}
