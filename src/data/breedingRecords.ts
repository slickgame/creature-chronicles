import { getSpeciesDefinition, getVariantDefinition } from "./creatures";
import type {
  BreedingAttemptRecord,
  BreedingParticipantSnapshot,
} from "@/types/breeding";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { BirthRecord, GameSave, ParentSnapshot } from "@/types/save";

export type BreedingRecordOutcome = "pregnancy" | "failed" | "blocked";
export type BreedingRecordOutcomeFilter = "all" | BreedingRecordOutcome;

export type BreedingLedgerOverview = {
  totalAttempts: number;
  successfulPregnancies: number;
  failedAttempts: number;
  blockedSessions: number;
  liveOffspring: number;
  activePregnancies: number;
  successRate: number;
  mostSuccessfulPair: BreedingPairSummary | null;
  mostProlificCreature: CreatureBreedingSummary | null;
  longestPairStreak: BreedingPairSummary | null;
};

export type BreedingPairSummary = {
  pairKey: string;
  participantAId: string;
  participantBId: string;
  participantAName: string;
  participantBName: string;
  participantAPortrait: string;
  participantBPortrait: string;
  totalAttempts: number;
  eligibleAttempts: number;
  successfulPregnancies: number;
  failedAttempts: number;
  blockedSessions: number;
  hatchedOffspring: number;
  successRate: number;
  currentStreak: number;
  longestStreak: number;
  firstAttemptAt: string | null;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  aAsGiverAttempts: number;
  bAsGiverAttempts: number;
};

export type CreatureBreedingSummary = {
  participantId: string;
  creatureId?: CreatureId;
  displayName: string;
  portraitPath: string;
  variantName: string;
  familyLabel: string;
  isArchived: boolean;
  totalAttempts: number;
  giverAttempts: number;
  receiverAttempts: number;
  successfulPregnancies: number;
  pregnanciesCarried: number;
  hatchedOffspring: number;
  uniquePartners: number;
  eligibleAttempts: number;
  successRate: number;
  mostSuccessfulPartnerName: string | null;
  lastAttemptAt: string | null;
  currentPairStreaks: Array<{ partnerId: string; partnerName: string; streak: number }>;
};

export type FamilyTreeNode = {
  participantId: string;
  creatureId?: CreatureId;
  displayName: string;
  variantName: string;
  familyLabel: string;
  portraitPath: string;
  generation: number | null;
  shiny: boolean;
  status: "current" | "archived" | "player" | "unknown";
};

export type FocusedFamilyTree = {
  center: FamilyTreeNode;
  parents: FamilyTreeNode[];
  grandparents: FamilyTreeNode[];
  children: FamilyTreeNode[];
  siblingCount: number;
};

export function getAttemptOutcome(
  attempt: BreedingAttemptRecord,
): BreedingRecordOutcome {
  if (attempt.receiverWasPregnant || attempt.pregnancyBlockedReason) return "blocked";
  return attempt.outcome === "pregnancy" ? "pregnancy" : "failed";
}

export function getPairKey(aId: string, bId: string): string {
  return [aId, bId].sort().join("__");
}

function successRate(successes: number, eligible: number): number {
  return eligible > 0 ? Math.round((successes / eligible) * 1000) / 10 : 0;
}

function formatVariant(creature: CreatureRecord | undefined): string {
  if (!creature) return "Unknown variant";
  try {
    return getVariantDefinition(creature.variantId).name;
  } catch {
    return String(creature.variantId || "Unknown variant");
  }
}

function formatFamily(creature: CreatureRecord | undefined): string {
  if (!creature) return "Unknown family";
  try {
    return getSpeciesDefinition(creature.speciesId).name;
  } catch {
    return String(creature.speciesId || "Unknown family");
  }
}

function latestSnapshotFor(
  save: GameSave,
  participantId: string,
): BreedingParticipantSnapshot | undefined {
  const attempts = [...(save.breeding?.attempts ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  for (const attempt of attempts) {
    if (attempt.giverId === participantId && attempt.giverSnapshot) return attempt.giverSnapshot;
    if (attempt.receiverId === participantId && attempt.receiverSnapshot) return attempt.receiverSnapshot;
  }
  return undefined;
}

function parentSnapshotFor(
  save: GameSave,
  participantId: string,
): ParentSnapshot | undefined {
  for (const birth of save.birthHistory ?? []) {
    if (birth.parents.giver.participantId === participantId) return birth.parents.giver;
    if (birth.parents.receiver.participantId === participantId) return birth.parents.receiver;
  }
  for (const pregnancy of save.pregnancies ?? []) {
    if (pregnancy.giver.participantId === participantId) return pregnancy.giver;
    if (pregnancy.receiver.participantId === participantId) return pregnancy.receiver;
  }
  return undefined;
}

function participantName(save: GameSave, participantId: string): string {
  if (participantId === "player") return save.player.name;
  const creature = (save.creatures ?? []).find(
    (candidate) => candidate.creatureId === participantId,
  );
  if (creature) return creature.nickname;
  return (
    latestSnapshotFor(save, participantId)?.displayName ??
    parentSnapshotFor(save, participantId)?.displayName ??
    "Unknown participant"
  );
}

function participantPortrait(save: GameSave, participantId: string): string {
  if (participantId === "player") return "/images/ui/icons/icon_breeder_level.png";
  const creature = (save.creatures ?? []).find(
    (candidate) => candidate.creatureId === participantId,
  );
  if (creature) {
    try {
      const variant = getVariantDefinition(creature.variantId);
      return variant.portraitPath || variant.profilePath;
    } catch {
      // Fall through to historical snapshots.
    }
  }
  return (
    latestSnapshotFor(save, participantId)?.portraitPath ??
    parentSnapshotFor(save, participantId)?.portraitPath ??
    "/images/ui/icons/icon_parent_compare.png"
  );
}

function birthRecordsForAttempt(
  save: GameSave,
  attempt: BreedingAttemptRecord,
): BirthRecord[] {
  return (save.birthHistory ?? []).filter((birth) => {
    if (birth.sourceAttemptId) return birth.sourceAttemptId === attempt.attemptId;
    const sameParents =
      getPairKey(
        birth.parents.giver.participantId,
        birth.parents.receiver.participantId,
      ) === getPairKey(attempt.giverId, attempt.receiverId);
    return sameParents && attempt.outcome === "pregnancy" && birth.hatchedAtDayNumber >= attempt.dayNumber;
  });
}

export function filterBreedingAttempts(
  save: GameSave,
  options: {
    query?: string;
    creatureId?: string | null;
    outcome?: BreedingRecordOutcomeFilter;
    role?: "either" | "giver" | "receiver";
    newestFirst?: boolean;
  } = {},
): BreedingAttemptRecord[] {
  const query = options.query?.trim().toLowerCase() ?? "";
  const creatureId = options.creatureId ?? null;
  const outcome = options.outcome ?? "all";
  const role = options.role ?? "either";
  const newestFirst = options.newestFirst ?? true;

  return [...(save.breeding?.attempts ?? [])]
    .filter((attempt) => {
      if (outcome !== "all" && getAttemptOutcome(attempt) !== outcome) return false;
      if (creatureId) {
        if (role === "giver" && attempt.giverId !== creatureId) return false;
        if (role === "receiver" && attempt.receiverId !== creatureId) return false;
        if (
          role === "either" &&
          attempt.giverId !== creatureId &&
          attempt.receiverId !== creatureId
        ) return false;
      }
      if (query) {
        const text = [
          attempt.giverName,
          attempt.receiverName,
          attempt.giverSnapshot?.variantName,
          attempt.receiverSnapshot?.variantName,
          attempt.giverSnapshot?.speciesName,
          attempt.receiverSnapshot?.speciesName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) =>
      newestFirst
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    );
}

export function getBreedingPairSummaries(save: GameSave): BreedingPairSummary[] {
  const attempts = save.breeding?.attempts ?? [];
  const grouped = new Map<string, BreedingAttemptRecord[]>();
  for (const attempt of attempts) {
    const key = getPairKey(attempt.giverId, attempt.receiverId);
    grouped.set(key, [...(grouped.get(key) ?? []), attempt]);
  }

  return Array.from(grouped.entries())
    .map(([pairKey, pairAttempts]) => {
      const [participantAId, participantBId] = pairKey.split("__");
      const sorted = [...pairAttempts].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      );
      const eligible = pairAttempts.filter(
        (attempt) => getAttemptOutcome(attempt) !== "blocked",
      );
      const successes = pairAttempts.filter(
        (attempt) => getAttemptOutcome(attempt) === "pregnancy",
      );
      const failures = pairAttempts.filter(
        (attempt) => getAttemptOutcome(attempt) === "failed",
      );
      const blocked = pairAttempts.length - eligible.length;
      const current = (save.breeding?.streaks ?? []).find(
        (record) => record.pairKey === pairKey,
      )?.streakCount ?? 0;
      const longest = pairAttempts.reduce(
        (maximum, attempt) => Math.max(maximum, attempt.streakBefore, attempt.streakAfter),
        current,
      );
      const hatchedOffspring = (save.birthHistory ?? []).filter(
        (birth) =>
          getPairKey(
            birth.parents.giver.participantId,
            birth.parents.receiver.participantId,
          ) === pairKey,
      ).length;

      return {
        pairKey,
        participantAId,
        participantBId,
        participantAName: participantName(save, participantAId),
        participantBName: participantName(save, participantBId),
        participantAPortrait: participantPortrait(save, participantAId),
        participantBPortrait: participantPortrait(save, participantBId),
        totalAttempts: pairAttempts.length,
        eligibleAttempts: eligible.length,
        successfulPregnancies: successes.length,
        failedAttempts: failures.length,
        blockedSessions: blocked,
        hatchedOffspring,
        successRate: successRate(successes.length, eligible.length),
        currentStreak: current,
        longestStreak: longest,
        firstAttemptAt: sorted[0]?.createdAt ?? null,
        lastAttemptAt: sorted.at(-1)?.createdAt ?? null,
        lastSuccessAt: successes.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.createdAt ?? null,
        aAsGiverAttempts: pairAttempts.filter(
          (attempt) => attempt.giverId === participantAId,
        ).length,
        bAsGiverAttempts: pairAttempts.filter(
          (attempt) => attempt.giverId === participantBId,
        ).length,
      };
    })
    .sort(
      (a, b) =>
        b.successfulPregnancies - a.successfulPregnancies ||
        b.hatchedOffspring - a.hatchedOffspring ||
        b.successRate - a.successRate ||
        (b.lastSuccessAt ?? "").localeCompare(a.lastSuccessAt ?? ""),
    );
}

export function getCreatureBreedingSummaries(
  save: GameSave,
): CreatureBreedingSummary[] {
  const attempts = save.breeding?.attempts ?? [];
  const participantIds = new Set<string>();
  for (const attempt of attempts) {
    participantIds.add(attempt.giverId);
    participantIds.add(attempt.receiverId);
  }
  for (const creature of save.creatures ?? []) participantIds.add(creature.creatureId);
  participantIds.add("player");

  const pairSummaries = getBreedingPairSummaries(save);
  return Array.from(participantIds)
    .map((participantId) => {
      const creature = (save.creatures ?? []).find(
        (candidate) => candidate.creatureId === participantId,
      );
      const snapshot = latestSnapshotFor(save, participantId);
      const relevant = attempts.filter(
        (attempt) =>
          attempt.giverId === participantId || attempt.receiverId === participantId,
      );
      const eligible = relevant.filter(
        (attempt) => getAttemptOutcome(attempt) !== "blocked",
      );
      const successes = relevant.filter(
        (attempt) => getAttemptOutcome(attempt) === "pregnancy",
      );
      const partnerIds = new Set(
        relevant.map((attempt) =>
          attempt.giverId === participantId ? attempt.receiverId : attempt.giverId,
        ),
      );
      const offspring = (save.birthHistory ?? []).filter(
        (birth) =>
          birth.parents.giver.participantId === participantId ||
          birth.parents.receiver.participantId === participantId,
      );
      const partnerPairs = pairSummaries.filter(
        (pair) =>
          pair.participantAId === participantId || pair.participantBId === participantId,
      );
      const bestPartner = [...partnerPairs].sort(
        (a, b) =>
          b.successfulPregnancies - a.successfulPregnancies ||
          b.hatchedOffspring - a.hatchedOffspring ||
          b.successRate - a.successRate,
      )[0];

      return {
        participantId,
        creatureId: creature?.creatureId ?? snapshot?.creatureId,
        displayName:
          participantId === "player"
            ? save.player.name
            : creature?.nickname ?? snapshot?.displayName ?? "Unknown participant",
        portraitPath: participantPortrait(save, participantId),
        variantName:
          participantId === "player"
            ? "Player Breeder"
            : creature
              ? formatVariant(creature)
              : snapshot?.variantName ?? "Historical record",
        familyLabel:
          participantId === "player"
            ? "Player"
            : creature
              ? formatFamily(creature)
              : snapshot?.speciesName ?? snapshot?.family ?? "Unknown family",
        isArchived: participantId !== "player" && !creature,
        totalAttempts: relevant.length,
        giverAttempts: relevant.filter((attempt) => attempt.giverId === participantId).length,
        receiverAttempts: relevant.filter((attempt) => attempt.receiverId === participantId).length,
        successfulPregnancies: successes.length,
        pregnanciesCarried: successes.filter(
          (attempt) => attempt.receiverId === participantId,
        ).length,
        hatchedOffspring: offspring.length,
        uniquePartners: partnerIds.size,
        eligibleAttempts: eligible.length,
        successRate: successRate(successes.length, eligible.length),
        mostSuccessfulPartnerName: bestPartner
          ? participantName(
              save,
              bestPartner.participantAId === participantId
                ? bestPartner.participantBId
                : bestPartner.participantAId,
            )
          : null,
        lastAttemptAt: [...relevant].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        )[0]?.createdAt ?? null,
        currentPairStreaks: partnerPairs
          .filter((pair) => pair.currentStreak > 0)
          .map((pair) => {
            const partnerId =
              pair.participantAId === participantId
                ? pair.participantBId
                : pair.participantAId;
            return {
              partnerId,
              partnerName: participantName(save, partnerId),
              streak: pair.currentStreak,
            };
          })
          .sort((a, b) => b.streak - a.streak),
      };
    })
    .sort(
      (a, b) =>
        b.hatchedOffspring - a.hatchedOffspring ||
        b.successfulPregnancies - a.successfulPregnancies ||
        b.totalAttempts - a.totalAttempts ||
        a.displayName.localeCompare(b.displayName),
    );
}

export function getBreedingLedgerOverview(save: GameSave): BreedingLedgerOverview {
  const attempts = save.breeding?.attempts ?? [];
  const successfulPregnancies = attempts.filter(
    (attempt) => getAttemptOutcome(attempt) === "pregnancy",
  ).length;
  const failedAttempts = attempts.filter(
    (attempt) => getAttemptOutcome(attempt) === "failed",
  ).length;
  const blockedSessions = attempts.filter(
    (attempt) => getAttemptOutcome(attempt) === "blocked",
  ).length;
  const eligibleAttempts = successfulPregnancies + failedAttempts;
  const pairs = getBreedingPairSummaries(save);
  const creatures = getCreatureBreedingSummaries(save).filter(
    (summary) => summary.participantId !== "player",
  );

  return {
    totalAttempts: attempts.length,
    successfulPregnancies,
    failedAttempts,
    blockedSessions,
    liveOffspring: (save.birthHistory ?? []).length,
    activePregnancies: (save.pregnancies ?? []).filter(
      (pregnancy) => pregnancy.status === "pregnant",
    ).length,
    successRate: successRate(successfulPregnancies, eligibleAttempts),
    mostSuccessfulPair: pairs[0] ?? null,
    mostProlificCreature: creatures[0] ?? null,
    longestPairStreak:
      [...pairs].sort(
        (a, b) => b.longestStreak - a.longestStreak || b.totalAttempts - a.totalAttempts,
      )[0] ?? null,
  };
}

function nodeFromParentSnapshot(
  save: GameSave,
  snapshot: ParentSnapshot,
): FamilyTreeNode {
  return resolveFamilyTreeNode(save, snapshot.creatureId ?? snapshot.participantId, snapshot);
}

export function resolveFamilyTreeNode(
  save: GameSave,
  participantId: string,
  fallback?: ParentSnapshot,
): FamilyTreeNode {
  if (participantId === "player" || fallback?.kind === "player") {
    return {
      participantId: "player",
      displayName: save.player.name,
      variantName: "Player Parent",
      familyLabel: "Breeder",
      portraitPath: "/images/ui/icons/icon_breeder_level.png",
      generation: null,
      shiny: false,
      status: "player",
    };
  }

  const creature = (save.creatures ?? []).find(
    (candidate) => candidate.creatureId === participantId,
  );
  const birth = (save.birthHistory ?? []).find(
    (record) => record.creatureId === participantId,
  );
  const snapshot = latestSnapshotFor(save, participantId);
  const parent = fallback ?? parentSnapshotFor(save, participantId);
  if (creature) {
    return {
      participantId,
      creatureId: creature.creatureId,
      displayName: creature.nickname,
      variantName: formatVariant(creature),
      familyLabel: formatFamily(creature),
      portraitPath: participantPortrait(save, participantId),
      generation: creature.generation,
      shiny: creature.shiny,
      status: "current",
    };
  }
  if (birth || snapshot || parent) {
    return {
      participantId,
      creatureId: birth?.creatureId ?? snapshot?.creatureId ?? parent?.creatureId,
      displayName: birth?.nickname ?? snapshot?.displayName ?? parent?.displayName ?? "Archived creature",
      variantName:
        snapshot?.variantName ??
        (birth ? String(birth.variantId) : parent?.variantId ? String(parent.variantId) : "Historical variant"),
      familyLabel:
        snapshot?.speciesName ??
        parent?.familyLabel ??
        snapshot?.family ??
        "Historical family",
      portraitPath:
        snapshot?.portraitPath ?? parent?.portraitPath ?? "/images/ui/icons/icon_parent_compare.png",
      generation: null,
      shiny: Boolean(birth?.shiny ?? snapshot?.shiny ?? parent?.shiny),
      status: "archived",
    };
  }
  return {
    participantId,
    displayName: "Unrecorded Parent",
    variantName: "Historical details unavailable",
    familyLabel: "Unknown family",
    portraitPath: "/images/ui/icons/icon_parent_compare.png",
    generation: null,
    shiny: false,
    status: "unknown",
  };
}

function parentsForCreature(save: GameSave, creatureId: string): ParentSnapshot[] {
  const birth = (save.birthHistory ?? []).find(
    (record) => record.creatureId === creatureId,
  );
  if (birth) return [birth.parents.giver, birth.parents.receiver];
  const creature = (save.creatures ?? []).find(
    (candidate) => candidate.creatureId === creatureId,
  );
  return (creature?.lineage?.parentCreatureIds ?? []).map((parentId, index) => ({
    participantId: parentId,
    creatureId: parentId,
    displayName: creature?.lineage?.parentNames?.[index] ?? "Unrecorded Parent",
    familyLabel: "Historical family",
    kind: "creature" as const,
  }));
}

export function getFocusedFamilyTree(
  save: GameSave,
  creatureId: string,
): FocusedFamilyTree {
  const center = resolveFamilyTreeNode(save, creatureId);
  const parentSnapshots = parentsForCreature(save, creatureId);
  const parents = parentSnapshots.map((parent) => nodeFromParentSnapshot(save, parent));
  const grandparents = parentSnapshots.flatMap((parent) =>
    parent.creatureId
      ? parentsForCreature(save, parent.creatureId).map((grandparent) =>
          nodeFromParentSnapshot(save, grandparent),
        )
      : [],
  );
  const childBirths = (save.birthHistory ?? []).filter(
    (birth) =>
      birth.parents.giver.participantId === creatureId ||
      birth.parents.receiver.participantId === creatureId,
  );
  const children = childBirths.map((birth) =>
    resolveFamilyTreeNode(save, birth.creatureId),
  );
  const parentIds = new Set(parentSnapshots.map((parent) => parent.participantId));
  const siblingCount = (save.birthHistory ?? []).filter((birth) => {
    if (birth.creatureId === creatureId) return false;
    const siblingParentIds = [
      birth.parents.giver.participantId,
      birth.parents.receiver.participantId,
    ];
    return siblingParentIds.some((id) => parentIds.has(id));
  }).length;

  return { center, parents, grandparents, children, siblingCount };
}

export function getAttemptOffspring(
  save: GameSave,
  attempt: BreedingAttemptRecord,
): BirthRecord[] {
  return birthRecordsForAttempt(save, attempt);
}
