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

type GuildServiceReturnNotice = {
  contractId: string;
  creatureName: string;
  title: string;
  returnDayNumber: number;
};

const SERVICE_DURATION_BY_TIER: Record<GuildContractTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

const RETURN_NOTICE_FLAG_PREFIX = "guildServiceReturnNotice_";

export function getGuildServiceDurationDays(contract: Pick<GuildContract, "type" | "tier" | "serviceDurationDays">): number {
  if (contract.type !== "service_creature") return 0;
  const stored = Number(contract.serviceDurationDays ?? 0);
  if (Number.isFinite(stored) && stored > 0) return Math.max(1, Math.min(7, Math.floor(stored)));
  return SERVICE_DURATION_BY_TIER[contract.tier] ?? 1;
}

function stripDurationSuffix(label: string): string {
  return label.replace(/\s*Away for \d+\s+days?\.$/i, "").trim();
}

function getReturnNoticeFlagKey(contractId: string): string {
  return `${RETURN_NOTICE_FLAG_PREFIX}${contractId}`;
}

function getReturnNoticeFromContract(contract: GuildContract): GuildServiceReturnNotice | null {
  if (
    contract.type !== "service_creature" ||
    contract.status !== "completed" ||
    !contract.submittedCreatureName ||
    typeof contract.serviceReturnDayNumber !== "number"
  ) {
    return null;
  }
  return {
    contractId: String(contract.contractId),
    creatureName: contract.submittedCreatureName,
    title: contract.title,
    returnDayNumber: contract.serviceReturnDayNumber,
  };
}

function parseReturnNotice(value: unknown): GuildServiceReturnNotice | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value) as Partial<GuildServiceReturnNotice>;
    const returnDayNumber = Number(parsed.returnDayNumber);
    if (
      typeof parsed.contractId !== "string" ||
      typeof parsed.creatureName !== "string" ||
      typeof parsed.title !== "string" ||
      !Number.isFinite(returnDayNumber)
    ) {
      return null;
    }
    return {
      contractId: parsed.contractId,
      creatureName: parsed.creatureName,
      title: parsed.title,
      returnDayNumber: Math.max(1, Math.floor(returnDayNumber)),
    };
  } catch {
    return null;
  }
}

/**
 * Gives every service request an explicit time-away term without changing its
 * eligibility rules or rewards. Re-normalization is intentionally idempotent
 * and referentially stable once no changes are required.
 */
export function normalizeGuildServiceContract(contract: GuildContract): GuildContract {
  if (contract.type !== "service_creature") return contract;
  const serviceDurationDays = getGuildServiceDurationDays(contract);
  const baseLabel = stripDurationSuffix(contract.requirement.label);
  const durationLabel = `${serviceDurationDays} ${serviceDurationDays === 1 ? "day" : "days"}`;
  const requirementLabel = `${baseLabel} Away for ${durationLabel}.`;
  if (contract.serviceDurationDays === serviceDurationDays && contract.requirement.label === requirementLabel) return contract;
  return {
    ...contract,
    serviceDurationDays,
    requirement: {
      ...contract.requirement,
      label: requirementLabel,
    },
  };
}

/**
 * Persist compact return notices outside the rotating Request Board. This keeps
 * the Morning Brief reliable when a creature returns on the same Monday that a
 * weekly board refresh removes the completed service flyer.
 */
export function ensureGuildServiceReturnNotices(save: GameSave): GameSave {
  const notices = (save.guild?.contracts ?? [])
    .map(normalizeGuildServiceContract)
    .map(getReturnNoticeFromContract)
    .filter((notice): notice is GuildServiceReturnNotice => notice !== null);
  if (!notices.length) return save;

  let changed = false;
  let nextFlags = save.flags;
  for (const notice of notices) {
    const key = getReturnNoticeFlagKey(notice.contractId);
    if (parseReturnNotice(save.flags[key])) continue;
    if (!changed) nextFlags = { ...save.flags };
    nextFlags[key] = JSON.stringify(notice);
    changed = true;
  }
  return changed ? { ...save, flags: nextFlags } : save;
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
  const contractNotices = (save.guild?.contracts ?? [])
    .map(normalizeGuildServiceContract)
    .map(getReturnNoticeFromContract)
    .filter((notice): notice is GuildServiceReturnNotice => notice !== null && notice.returnDayNumber === dayNumber);
  const persistedNotices = Object.entries(save.flags)
    .filter(([key]) => key.startsWith(RETURN_NOTICE_FLAG_PREFIX))
    .map(([, value]) => parseReturnNotice(value))
    .filter((notice): notice is GuildServiceReturnNotice => notice !== null && notice.returnDayNumber === dayNumber);

  const unique = new Map<string, GuildServiceReturnNotice>();
  for (const notice of [...contractNotices, ...persistedNotices]) {
    unique.set(notice.contractId, notice);
  }
  return [...unique.values()].map(
    (notice) => `${notice.creatureName} returned from “${notice.title}” and is available for chores, breeding, training, and combat again.`,
  );
}
