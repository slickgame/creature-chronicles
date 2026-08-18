import { addCreatureMemory } from "@/data/creatureMemories";
import { getTownUpgradeEffects } from "@/data/upgrades";
import {
  TOWN_NPCS,
  getNextTrustThreshold,
  getNpcTrustRecord,
  getTrustTierLabel,
} from "@/data/townNpcs";
import type { ContractId, CreatureId } from "@/types/ids";
import type {
  GuildContract,
  GuildContractCategory,
  GuildContractRequirement,
  GuildContractTier,
} from "@/types/guild";
import type { GameSave } from "@/types/save";
import type { TownNpcId } from "@/types/townNpc";

const TRUST_CONTRACT_PREFIX = "guild_trust_";
const SELENE_CHAIN_PREFIX = "guild_personal_selene_lineage_";

const SELENE_STAGE_FLAGS = [
  "guildSeleneLineageStage1",
  "guildSeleneLineageStage2",
  "guildSeleneLineageStage3",
] as const;

type TrustRequestSpec = {
  npcId: TownNpcId;
  category: GuildContractCategory;
  title: string;
  description: string;
  requirement: GuildContractRequirement;
  serviceEnergyCost: number;
  serviceXpReward: number;
  serviceAffectionReward: number;
};

const TRUST_REQUEST_SPECS: readonly TrustRequestSpec[] = [
  {
    npcId: "tamsin_vale",
    category: "general",
    title: "Tamsin's Placement Socialization Visit",
    description: "Tamsin needs a steady creature to help a nervous new placement settle into a household routine. The creature returns after the supervised visit.",
    requirement: { kind: "stat_minimum", stat: "CHA", minimum: 6, label: "Send any creature with CHA 6+ for placement support." },
    serviceEnergyCost: 13,
    serviceXpReward: 16,
    serviceAffectionReward: 4,
  },
  {
    npcId: "pella_mosswick",
    category: "service",
    title: "Pella's Depot Rush Delivery",
    description: "Pella has a time-sensitive supply run and wants a reliable creature that can keep moving without damaging the cargo.",
    requirement: { kind: "stat_minimum", stat: "STA", minimum: 6, label: "Send any creature with STA 6+ for depot service." },
    serviceEnergyCost: 14,
    serviceXpReward: 17,
    serviceAffectionReward: 3,
  },
  {
    npcId: "petra_hale",
    category: "service",
    title: "Petra's Bridge Brace Crew",
    description: "Petra needs temporary muscle for a supervised brace-and-haul job at a town footbridge.",
    requirement: { kind: "stat_minimum", stat: "STR", minimum: 7, label: "Send any creature with STR 7+ for construction service." },
    serviceEnergyCost: 16,
    serviceXpReward: 19,
    serviceAffectionReward: 3,
  },
  {
    npcId: "mara_vell",
    category: "service",
    title: "Mara's Priority Guild Audit",
    description: "Mara needs a presentable creature to accompany a short circuit of member businesses while she closes out a difficult ledger week.",
    requirement: { kind: "stat_minimum", stat: "CHA", minimum: 6, label: "Send any creature with CHA 6+ for Guild service." },
    serviceEnergyCost: 14,
    serviceXpReward: 18,
    serviceAffectionReward: 3,
  },
  {
    npcId: "veyra",
    category: "restoration",
    title: "Veyra's Wetland Recovery Survey",
    description: "Veyra is checking a recovering marsh edge and wants a calm creature that will not panic around unfamiliar scents and footing.",
    requirement: { kind: "stat_minimum", stat: "WIL", minimum: 6, label: "Send any creature with WIL 6+ for restoration service." },
    serviceEnergyCost: 12,
    serviceXpReward: 17,
    serviceAffectionReward: 5,
  },
  {
    npcId: "selene_virell",
    category: "lineage",
    title: "Selene's Atelier Lineage Observation",
    description: "Selene wants a fertile ranch creature for a non-breeding observation session so she can compare local lineage notes against her clinic records.",
    requirement: { kind: "stat_minimum", stat: "FER", minimum: 6, label: "Send any creature with FER 6+ for lineage observation." },
    serviceEnergyCost: 12,
    serviceXpReward: 18,
    serviceAffectionReward: 5,
  },
  {
    npcId: "rhea_flint",
    category: "service",
    title: "Rhea's Advanced Drill Demonstration",
    description: "Rhea needs a quick learner to demonstrate safe footwork and reaction drills for a visiting training group.",
    requirement: { kind: "stat_minimum", stat: "DEX", minimum: 7, label: "Send any creature with DEX 7+ for a training demonstration." },
    serviceEnergyCost: 16,
    serviceXpReward: 22,
    serviceAffectionReward: 3,
  },
  {
    npcId: "daria_voss",
    category: "security",
    title: "Daria's Outfitter Field Trial",
    description: "Daria wants a proven creature to wear-test a nonlethal field kit during a supervised security exercise.",
    requirement: { kind: "stat_minimum", stat: "STR", minimum: 7, label: "Send any creature with STR 7+ for an outfitter field trial." },
    serviceEnergyCost: 17,
    serviceXpReward: 22,
    serviceAffectionReward: 3,
  },
  {
    npcId: "maribel_quince",
    category: "registry",
    title: "Maribel's Permit Route Inspection",
    description: "Maribel needs a composed creature beside her while she checks a line of permits and property markers around town.",
    requirement: { kind: "stat_minimum", stat: "CHA", minimum: 7, label: "Send any creature with CHA 7+ for registry service." },
    serviceEnergyCost: 14,
    serviceXpReward: 18,
    serviceAffectionReward: 3,
  },
  {
    npcId: "kaida_thorn",
    category: "security",
    title: "Kaida's Ranger Trail Sweep",
    description: "Kaida is running a supervised trail sweep and wants a steady creature that can stay focused while the patrol checks signs of recent activity.",
    requirement: { kind: "stat_minimum", stat: "WIL", minimum: 7, label: "Send any creature with WIL 7+ for ranger service." },
    serviceEnergyCost: 17,
    serviceXpReward: 22,
    serviceAffectionReward: 3,
  },
] as const;

type SeleneChainStage = {
  stage: 1 | 2 | 3;
  tier: GuildContractTier;
  title: string;
  description: string;
  requirement: GuildContractRequirement;
  serviceEnergyCost: number;
  serviceXpReward: number;
  serviceAffectionReward: number;
  goldReward: number;
  guildPointReward: number;
  nurseryKits: number;
};

const SELENE_CHAIN: readonly SeleneChainStage[] = [
  {
    stage: 1,
    tier: "silver",
    title: "Selene's Lineage Calibration",
    description: "Selene is ready to compare your ranch records against her private lineage ledger. She needs one fertile creature for a careful, non-breeding clinic assessment.",
    requirement: { kind: "stat_minimum", stat: "FER", minimum: 7, label: "Send any creature with FER 7+ for Selene's calibration." },
    serviceEnergyCost: 14,
    serviceXpReward: 20,
    serviceAffectionReward: 5,
    goldReward: 240,
    guildPointReward: 20,
    nurseryKits: 1,
  },
  {
    stage: 2,
    tier: "silver",
    title: "Selene's Quiet Incubation Rotation",
    description: "The first calibration revealed a gap in Selene's stress-response notes. She wants a calm creature to assist through a long incubation rotation and help validate the new protocol.",
    requirement: { kind: "stat_minimum", stat: "WIL", minimum: 7, label: "Send any creature with WIL 7+ for the incubation rotation." },
    serviceEnergyCost: 15,
    serviceXpReward: 23,
    serviceAffectionReward: 6,
    goldReward: 270,
    guildPointReward: 22,
    nurseryKits: 1,
  },
  {
    stage: 3,
    tier: "gold",
    title: "Selene's Heritage Ledger Trial",
    description: "Selene is ready to finish the private study. A Rare-or-better creature will let her validate the final heritage ledger and establish a standing consultation arrangement with your ranch.",
    requirement: { kind: "rarity", rarity: "Rare", label: "Send any Rare or Epic creature for the Heritage Ledger trial." },
    serviceEnergyCost: 20,
    serviceXpReward: 32,
    serviceAffectionReward: 7,
    goldReward: 425,
    guildPointReward: 36,
    nurseryKits: 2,
  },
] as const;

function flagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function isTownNpcId(value: string): value is TownNpcId {
  return Object.prototype.hasOwnProperty.call(TOWN_NPCS, value);
}

function trustTierForLevel(level: number): GuildContractTier {
  return level >= 4 ? "gold" : "silver";
}

function serviceDurationForTier(tier: GuildContractTier): number {
  return tier === "gold" ? 3 : tier === "silver" ? 2 : 1;
}

function rewardForTrustRequest(save: GameSave, tier: GuildContractTier, level: number) {
  const effects = getTownUpgradeEffects(save);
  const baseGold = tier === "gold" ? 340 : 205;
  const baseGp = tier === "gold" ? 28 : 17;
  const relationshipGold = level >= 5 ? 60 : level >= 3 ? 25 : 0;
  const relationshipGp = level >= 5 ? 4 : level >= 3 ? 2 : 0;
  return {
    gold: Math.round(((baseGold + relationshipGold) * effects.guildGoldRewardMultiplier) / 5) * 5,
    gp: Math.max(1, baseGp + relationshipGp + effects.guildBonusGp),
  };
}

function buildTrustRequest(save: GameSave, spec: TrustRequestSpec, level: number): GuildContract {
  const tier = trustTierForLevel(level);
  const rewards = rewardForTrustRequest(save, tier, level);
  const npc = TOWN_NPCS[spec.npcId];
  return {
    contractId: `${TRUST_CONTRACT_PREFIX}${save.dayState.weekNumber}_${spec.npcId}` as ContractId,
    weekNumber: save.dayState.weekNumber,
    tier,
    type: "service_creature",
    category: spec.category,
    requesterId: spec.npcId,
    requesterName: npc.name,
    trustTarget: npc.name,
    status: "available",
    title: spec.title,
    description: spec.description,
    requirement: spec.requirement,
    goldReward: rewards.gold,
    guildPointReward: rewards.gp,
    serviceEnergyCost: spec.serviceEnergyCost + (tier === "gold" ? 2 : 0),
    serviceXpReward: spec.serviceXpReward + (tier === "gold" ? 8 : 0),
    serviceAffectionReward: spec.serviceAffectionReward + (level >= 5 ? 1 : 0),
    serviceDurationDays: serviceDurationForTier(tier),
    createdAtDayNumber: save.dayState.dayNumber,
    expiresAtWeekNumber: save.dayState.weekNumber + 1,
  };
}

function buildSeleneStage(save: GameSave, stage: SeleneChainStage): GuildContract {
  const effects = getTownUpgradeEffects(save);
  const npc = TOWN_NPCS.selene_virell;
  return {
    contractId: `${SELENE_CHAIN_PREFIX}${stage.stage}` as ContractId,
    weekNumber: save.dayState.weekNumber,
    tier: stage.tier,
    type: "service_creature",
    category: "lineage",
    requesterId: "selene_virell",
    requesterName: npc.name,
    trustTarget: npc.name,
    status: "available",
    title: stage.title,
    description: stage.description,
    requirement: stage.requirement,
    goldReward: Math.round((stage.goldReward * effects.guildGoldRewardMultiplier) / 5) * 5,
    guildPointReward: stage.guildPointReward + effects.guildBonusGp,
    serviceEnergyCost: stage.serviceEnergyCost,
    serviceXpReward: stage.serviceXpReward,
    serviceAffectionReward: stage.serviceAffectionReward,
    serviceDurationDays: serviceDurationForTier(stage.tier),
    createdAtDayNumber: save.dayState.dayNumber,
    expiresAtWeekNumber: save.dayState.weekNumber + 1,
  };
}

function completedSeleneStageCount(save: GameSave): number {
  if (save.flags[SELENE_STAGE_FLAGS[2]]) return 3;
  if (save.flags[SELENE_STAGE_FLAGS[1]]) return 2;
  if (save.flags[SELENE_STAGE_FLAGS[0]]) return 1;
  return 0;
}

export function getSelenePersonalQuestStage(save: GameSave): 0 | 1 | 2 | 3 | 4 {
  const trust = getNpcTrustRecord(save, "selene_virell");
  if (trust.points < 50) return 0;
  const completed = completedSeleneStageCount(save);
  return completed >= 3 ? 4 : ((completed + 1) as 1 | 2 | 3);
}

function getTrustRequestCandidates(save: GameSave) {
  return TRUST_REQUEST_SPECS
    .map((spec) => ({ spec, record: getNpcTrustRecord(save, spec.npcId) }))
    .filter(({ record }) => record.level >= 2)
    .sort((left, right) => {
      const leftScore = (stableHash(`${save.saveId}:${save.dayState.weekNumber}:${left.spec.npcId}`) % 10000) + Math.max(0, left.record.level - 2) * 850;
      const rightScore = (stableHash(`${save.saveId}:${save.dayState.weekNumber}:${right.spec.npcId}`) % 10000) + Math.max(0, right.record.level - 2) * 850;
      return rightScore - leftScore || left.spec.npcId.localeCompare(right.spec.npcId);
    });
}

export function getGuildTrustBonusContractCount(save: GameSave): number {
  const candidates = getTrustRequestCandidates(save);
  if (!candidates.length) return 0;
  return Math.min(candidates.length, candidates.some(({ record }) => record.level >= 3) ? 3 : 2);
}

/**
 * Adds a small rotating set of relationship-backed requests after the ordinary
 * weekly board is generated. These never replace base contracts. Higher Trust
 * makes a request more likely to be selected, improves its rewards, and turns
 * Favored/Confidant requests into Gold work.
 */
export function applyGuildTrustContractPools(save: GameSave): GameSave {
  if (!save.guild) return save;

  let contracts = [...save.guild.contracts];
  const desiredTrustRequests = getGuildTrustBonusContractCount(save);
  const currentTrustRequests = contracts.filter(
    (contract) =>
      String(contract.contractId).startsWith(TRUST_CONTRACT_PREFIX) &&
      contract.weekNumber === save.dayState.weekNumber &&
      contract.status !== "expired",
  );

  if (currentTrustRequests.length < desiredTrustRequests) {
    const existingIds = new Set(contracts.map((contract) => String(contract.contractId)));
    for (const candidate of getTrustRequestCandidates(save)) {
      if (contracts.filter((contract) => String(contract.contractId).startsWith(TRUST_CONTRACT_PREFIX) && contract.weekNumber === save.dayState.weekNumber && contract.status !== "expired").length >= desiredTrustRequests) break;
      const next = buildTrustRequest(save, candidate.spec, candidate.record.level);
      if (!existingIds.has(String(next.contractId))) {
        contracts.push(next);
        existingIds.add(String(next.contractId));
      }
    }
  }

  const seleneStage = getSelenePersonalQuestStage(save);
  if (seleneStage >= 1 && seleneStage <= 3) {
    const stage = SELENE_CHAIN[seleneStage - 1];
    const stageId = `${SELENE_CHAIN_PREFIX}${stage.stage}`;
    if (!contracts.some((contract) => String(contract.contractId) === stageId)) {
      contracts.push(buildSeleneStage(save, stage));
    }
  }

  if (contracts.length === save.guild.contracts.length && contracts.every((contract, index) => contract === save.guild?.contracts[index])) {
    return save;
  }

  return {
    ...save,
    guild: { ...save.guild, contracts },
    flags: {
      ...save.flags,
      guildTrustContractPools: true,
      guildSelenePersonalChain: getNpcTrustRecord(save, "selene_virell").points >= 50,
    },
  };
}

export type GuildRequesterProgression = {
  npcId: TownNpcId;
  tierLabel: string;
  points: number;
  level: number;
  currentUnlock: string;
  nextThreshold: number | null;
  pointsToNext: number | null;
  nextUnlock: string | null;
  requestPoolStatus: string;
};

export function getGuildRequesterProgression(save: GameSave, contract: GuildContract): GuildRequesterProgression | null {
  if (!isTownNpcId(contract.requesterId)) return null;
  const record = getNpcTrustRecord(save, contract.requesterId);
  const definition = TOWN_NPCS[contract.requesterId];
  const nextThreshold = getNextTrustThreshold(record.points);
  const nextLevel = Math.min(5, record.level + 1);
  let requestPoolStatus = record.level >= 2
    ? "Personal Guild request pool active. Higher Trust increases its priority and rewards."
    : `Personal Guild requests unlock at Familiar (${Math.max(0, 20 - record.points)} Trust to go).`;

  if (contract.requesterId === "selene_virell") {
    const stage = getSelenePersonalQuestStage(save);
    if (stage === 0) requestPoolStatus += " Selene's personal lineage chain unlocks at Trusted (50 Trust).";
    else if (stage === 4) requestPoolStatus += " Selene's lineage chain is complete; Lineage Consultation is active.";
    else requestPoolStatus += ` Selene personal chain: Stage ${stage}/3 is available on the Request Board.`;
  }

  return {
    npcId: contract.requesterId,
    tierLabel: getTrustTierLabel(record.level),
    points: record.points,
    level: record.level,
    currentUnlock: definition.trustUnlocks[record.level] ?? "Guild relationship established",
    nextThreshold,
    pointsToNext: nextThreshold == null ? null : Math.max(0, nextThreshold - record.points),
    nextUnlock: record.level >= 5 ? null : definition.trustUnlocks[nextLevel] ?? null,
    requestPoolStatus,
  };
}

export type GuildTrustCompletionResult = {
  save: GameSave;
  message: string;
};

/** Applies one-time authored rewards for the Selene lineage chain. */
export function applyGuildTrustContractCompletion(
  save: GameSave,
  contract: GuildContract,
  creatureId: CreatureId,
): GuildTrustCompletionResult {
  const contractId = String(contract.contractId);
  if (!contractId.startsWith(SELENE_CHAIN_PREFIX)) return { save, message: "" };
  const stageNumber = Number(contractId.slice(SELENE_CHAIN_PREFIX.length));
  const stage = SELENE_CHAIN.find((entry) => entry.stage === stageNumber);
  if (!stage) return { save, message: "" };
  const flag = SELENE_STAGE_FLAGS[stage.stage - 1];
  if (save.flags[flag]) return { save, message: "" };

  const existingKits = flagNumber(save.flags.nurserySupplyKits);
  const capstone = stage.stage === 3;
  let nextSave: GameSave = {
    ...save,
    flags: {
      ...save.flags,
      [flag]: true,
      nurserySupplyKits: existingKits + stage.nurseryKits,
      guildSelenePersonalChain: true,
      ...(capstone
        ? {
            seleneLineageConsultationUnlocked: true,
            guildSeleneLineageChainComplete: true,
          }
        : {}),
    },
  };

  const creature = (save.creatures ?? []).find((entry) => entry.creatureId === creatureId);
  const creatureName = creature?.nickname ?? contract.submittedCreatureName ?? "A ranch creature";
  nextSave = addCreatureMemory(nextSave, {
    creatureId,
    category: "guild",
    importance: capstone ? "major" : "notable",
    title: capstone ? "Selene's Heritage Ledger completed" : `${stage.title} completed`,
    description: capstone
      ? `${creatureName} completed Selene's Heritage Ledger trial. Dr. Selene Virell now offers the ranch a permanent Lineage Consultation benefit at the Egg Atelier.`
      : `${creatureName} completed ${stage.title}. Selene added ${stage.nurseryKits} Nursery Supply Kit${stage.nurseryKits === 1 ? "" : "s"} to the ranch account and opened the next part of her private lineage study.`,
    dayNumber: save.dayState.dayNumber,
    sourceKey: `guild-selene-lineage-stage:${stage.stage}`,
    tags: ["guild", "selene", "lineage", `stage-${stage.stage}`],
  });
  nextSave = applyGuildTrustContractPools(nextSave);

  const nextStageText = capstone
    ? " Lineage Consultation is now permanently active at the Egg Atelier."
    : ` Selene's next personal lineage request is now available.`;
  return {
    save: nextSave,
    message: ` Selene personal quest ${stage.stage}/3 complete. +${stage.nurseryKits} Nursery Supply Kit${stage.nurseryKits === 1 ? "" : "s"}.${nextStageText}`,
  };
}

export function isGuildTrustContract(contract: GuildContract): boolean {
  const id = String(contract.contractId);
  return id.startsWith(TRUST_CONTRACT_PREFIX) || id.startsWith(SELENE_CHAIN_PREFIX);
}
