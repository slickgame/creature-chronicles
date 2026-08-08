import type { GuildContract, GuildContractTier } from "@/types/guild";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export type GuildServiceAssignment = {
  contract: GuildContract;
  creatureId: CreatureId;
  startDayNumber: number;
  returnDayNumber: number;
  daysRemaining: number;
};

const SERVICE_DURATION_BY_TIER: Record<GuildContractTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

export function getGuildServiceDurationDays(contract: Pick<GuildContract, "type" | "tier" | "serviceDurationDays">): number {
  if (contract.type !== "service_creature") return 0;
  const stored = Number(contract.serviceDurationDays ?? 0);
  if (Number.isFinite(stored) && stored > 0) return Math.max(1, Math.min(7, Math.floor(stored)));
  return SERVICE_DURATION_BY_TIER[contract.tier] ?? 1;
}

function stripDurationSuffix(label: string): string {
  return label.replace(/\s*Away for \d+\s+days?\.$/i, "").trim();
}

/**
 * Gives every service request an explicit time-away term without changing its
 * eligibility rules or rewards. Re-normalization is intentionally idempotent.
 */
export function normalizeGuildServiceContract(contract: GuildContract): GuildContract {
  if (contract.type !== "service_creature") return contract;
  const serviceDurationDays = getGuildServiceDurationDays(contract);
  const baseLabel = stripDurationSuffix(contract.requirement.label);
  const durationLabel = `${serviceDurationDays} ${serviceDurationDays === 1 ? "day" : "days"}`;
  return {
    ...contract,
    serviceDurationDays,
    requirement: {
      ...contract.requirement,
      label: `${baseLabel} Away for ${durationLabel}.`,
    },
  };
}

export function getGuildServiceAssignment(save: GameSave, creatureId: CreatureId): GuildServiceAssignment | null {
  const dayNumber = save.dayState.dayNumber;
  const matches = (save.guild?.contracts ?? [])
    .map(normalizeGuildServiceContract)
    .filter((contract) =>
      contract.type === "service_creature" &&
      contract.status === "completed" &&
      contract.submittedCreatureId === creatureId &&
      typeof contract.serviceReturnDayNumber === "number" &&
      contract.serviceReturnDayNumber > dayNumber,
    )
    .sort((left, right) => (left.serviceReturnDayNumber ?? 0) - (right.serviceReturnDayNumber ?? 0));

  const contract = matches[0];
  if (!contract || typeof contract.serviceReturnDayNumber !== "number") return null;
  const startDayNumber = contract.completedAtDayNumber ?? Math.max(1, contract.serviceReturnDayNumber - getGuildServiceDurationDays(contract));
  return {
    contract,
    creatureId,
    startDayNumber,
    returnDayNumber: contract.serviceReturnDayNumber,
    daysRemaining: Math.max(1, contract.serviceReturnDayNumber - dayNumber),
  };
}

export function isCreatureAwayOnGuildService(save: GameSave, creatureId: CreatureId): boolean {
  return Boolean(getGuildServiceAssignment(save, creatureId));
}

export function getGuildServiceUnavailableReason(save: GameSave, creatureId: CreatureId): string | null {
  const assignment = getGuildServiceAssignment(save, creatureId);
  if (!assignment) return null;
  const dayLabel = assignment.daysRemaining === 1 ? "day" : "days";
  return `Guild service: ${assignment.contract.title} — ${assignment.daysRemaining} ${dayLabel} remaining (returns Ranch Day ${assignment.returnDayNumber})`;
}

export function getGuildServiceReturnSummaryItems(save: GameSave): string[] {
  const dayNumber = save.dayState.dayNumber;
  return (save.guild?.contracts ?? [])
    .map(normalizeGuildServiceContract)
    .filter((contract) =>
      contract.type === "service_creature" &&
      contract.status === "completed" &&
      Boolean(contract.submittedCreatureName) &&
      contract.serviceReturnDayNumber === dayNumber,
    )
    .map((contract) => `${contract.submittedCreatureName} returned from “${contract.title}” and is available for chores, breeding, training, and combat again.`);
}
