import { getBreedingParticipants, getBreedingPreview } from "@/data/breeding";
import { getBattleMoveInheritancePreview } from "@/data/battleMoveInheritance";
import { getParentTalentPreview } from "@/data/genetics";
import { getBreedingSelectionBlocker } from "@/data/breedingSelectionPreview";
import type { BreedingRole } from "@/types/breeding";
import type { AbilityGrade } from "@/types/creature";
import type { GameSave } from "@/types/save";

export type InheritanceTarget =
  | { kind: "talent"; id: string; grade?: AbilityGrade }
  | { kind: "grade"; grade: AbilityGrade }
  | { kind: "move"; id: string };

export function getInheritancePartnerPreviews(save: GameSave, fixedId: string, fixedRole: BreedingRole) {
  const participants = getBreedingParticipants(save);
  const fixed = participants.find(parent => parent.participantId === fixedId);
  if (!fixed || getBreedingSelectionBlocker(fixed, fixedRole, null)) return [];
  const partnerRole = fixedRole === "giver" ? "receiver" : "giver";

  return participants.flatMap(partner => {
    if (getBreedingSelectionBlocker(partner, partnerRole, fixedId)) return [];
    const [giver, receiver] = fixedRole === "giver" ? [fixed, partner] : [partner, fixed];
    if (receiver.kind !== "creature") return [];
    const readiness = getBreedingPreview(save, giver.participantId, receiver.participantId);
    if (!readiness?.canAttempt || readiness.pregnancyBlockedReason) return [];
    const moves = getBattleMoveInheritancePreview(save, giver.participantId, receiver.participantId);
    return [{
      partner,
      talents: getParentTalentPreview(save, giver, receiver),
      moves: [
        ...moves.directCandidates.map(move => ({
          id: `parent-${move.moveId}`, name: move.moveName, chance: move.finalChance,
        })),
        ...moves.combinationCandidates.map(move => ({
          id: `recipe-${move.recipeId}`, name: `${move.outputMoveName} · Combination`, chance: move.chance,
        })),
      ],
    }];
  });
}

type PartnerPreview = ReturnType<typeof getInheritancePartnerPreviews>[number];

export function rankInheritancePartners(previews: PartnerPreview[], target: InheritanceTarget) {
  return previews.map(({ partner, moves, talents }) => {
    if (target.kind === "move") {
      return { partner, chance: moves.find(move => move.id === target.id)?.chance ?? 0 };
    }
    if (target.kind === "grade") {
      return { partner, chance: talents.anyGrade.get(target.grade) ?? 0 };
    }
    const talent = talents.candidates.find(candidate => candidate.talent.id === target.id);
    const chance = target.grade
      ? talent?.grades.find(row => row.grade === target.grade)?.chance
      : talent?.chance;
    return { partner, chance: chance ?? 0 };
  }).sort((a, b) => b.chance - a.chance || a.partner.displayName.localeCompare(b.partner.displayName)
    || a.partner.participantId.localeCompare(b.partner.participantId));
}
