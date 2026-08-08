import {
  getCreatureCareerRecord,
  getCreatureCareerState,
} from "@/data/creatureCareerRecords";
import { ensureCurrentGuildState } from "@/data/guild";
import { getRetirementEligibility } from "@/data/creatureRetirement";
import { TOWN_NPCS, getNpcTrustRecord, getTrustLevel } from "@/data/townNpcs";
import type { ContractId, CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";
import type { TownNpcId } from "@/types/townNpc";
import { CREATURE_CAREER_VERSION } from "@/types/career";

export type LegacyDevActionResult = {
  save: GameSave;
  ok: boolean;
  message: string;
};

export const GUILD_TRUST_TEST_NPC_IDS: readonly TownNpcId[] = [
  "mara_vell",
  "veyra",
  "selene_virell",
  "maribel_quince",
  "kaida_thorn",
  "tamsin_vale",
  "pella_mosswick",
  "petra_hale",
  "rhea_flint",
  "daria_voss",
] as const;

export const GUILD_TRUST_TEST_PRESETS = [
  { points: 20, label: "Familiar" },
  { points: 50, label: "Trusted" },
  { points: 90, label: "Favored" },
  { points: 140, label: "Confidant" },
] as const;

function findActiveCreature(save: GameSave, creatureId: CreatureId) {
  return (save.creatures ?? []).find((creature) => creature.creatureId === creatureId) ?? null;
}

function personalTrustContractMatchesNpc(contractId: string, npcId: TownNpcId): boolean {
  return contractId.startsWith("guild_trust_") && contractId.endsWith(`_${npcId}`);
}

function setNpcTrustExactly(save: GameSave, npcId: TownNpcId, points: number): GameSave {
  const safePoints = Math.max(0, Math.floor(points));
  const current = getNpcTrustRecord(save, npcId);
  const level = getTrustLevel(safePoints);
  const contracts = save.guild?.contracts.filter(
    (contract) => !personalTrustContractMatchesNpc(String(contract.contractId), npcId),
  );
  const withTrust: GameSave = {
    ...save,
    updatedAt: new Date().toISOString(),
    townNpcTrust: {
      ...(save.townNpcTrust ?? {}),
      [npcId]: {
        ...current,
        npcId,
        points: safePoints,
        level,
        introduced: true,
        lastChangedDayNumber: save.dayState.dayNumber,
      },
    },
    guild: save.guild && contracts ? { ...save.guild, contracts } : save.guild,
    flags: {
      ...save.flags,
      [`trust_${npcId}`]: safePoints,
      [`trustLevel_${npcId}`]: level,
      guildTrustDevPresetUsed: true,
      guildTrustDevLastNpcId: npcId,
      guildTrustDevLastPoints: safePoints,
    },
  };
  return ensureCurrentGuildState(withTrust);
}

export function prepareGuildTrustPreset(
  save: GameSave,
  npcId: TownNpcId,
  points: number,
): LegacyDevActionResult {
  const npc = TOWN_NPCS[npcId];
  if (!npc) return { save, ok: false, message: "Choose a valid Guild requester first." };
  const nextSave = setNpcTrustExactly(save, npcId, points);
  const record = getNpcTrustRecord(nextSave, npcId);
  const personalCount = (nextSave.guild?.contracts ?? []).filter((contract) =>
    personalTrustContractMatchesNpc(String(contract.contractId), npcId),
  ).length;
  return {
    save: nextSave,
    ok: true,
    message: `${npc.name} is now ${record.points} Trust (Lv. ${record.level}). ${record.points >= 20 ? `${personalCount} relationship-backed personal request${personalCount === 1 ? "" : "s"} can now appear on this week's board.` : "Personal requests remain locked until 20 Trust."}`,
  };
}

/**
 * Puts a requester at 18 Trust and injects one harmless Bronze service request.
 * Completing it normally awards +2 Trust, crossing into Familiar and exercising
 * the real relationship-deepened message, Chronicle entry, and personal pool.
 */
export function prepareGuildTrustThresholdTest(
  save: GameSave,
  npcId: TownNpcId,
): LegacyDevActionResult {
  const npc = TOWN_NPCS[npcId];
  if (!npc) return { save, ok: false, message: "Choose a valid Guild requester first." };
  let nextSave = setNpcTrustExactly(save, npcId, 18);
  if (!nextSave.guild) return { save: nextSave, ok: false, message: "Guild state is not available on this save." };

  const contractId = `guild_dev_trust_threshold_${nextSave.dayState.dayNumber}_${npcId}` as ContractId;
  const existing = nextSave.guild.contracts.filter((contract) => String(contract.contractId) !== String(contractId));
  nextSave = ensureCurrentGuildState({
    ...nextSave,
    guild: {
      ...nextSave.guild,
      contracts: [
        {
          contractId,
          weekNumber: nextSave.dayState.weekNumber,
          tier: "bronze",
          type: "service_creature",
          category: "general",
          requesterId: npcId,
          requesterName: npc.name,
          trustTarget: npc.name,
          status: "available",
          title: `${npc.name}'s Familiarity Test`,
          description: `A low-risk Guild service request used by the home QA lab to test ${npc.name}'s New Contact → Familiar relationship transition through the normal completion flow.`,
          requirement: { kind: "any_creature", label: "Send any available creature." },
          goldReward: 25,
          guildPointReward: 2,
          serviceEnergyCost: 1,
          serviceXpReward: 1,
          serviceAffectionReward: 1,
          serviceDurationDays: 1,
          createdAtDayNumber: nextSave.dayState.dayNumber,
          expiresAtWeekNumber: nextSave.dayState.weekNumber + 1,
        },
        ...existing,
      ],
    },
    flags: {
      ...nextSave.flags,
      guildTrustDevThresholdTestReady: true,
      guildTrustDevThresholdContractId: String(contractId),
    },
  });

  return {
    save: nextSave,
    ok: true,
    message: `${npc.name} is set to 18 Trust. Open Guild Hall → Request Board and complete “${npc.name}'s Familiarity Test.” Its normal +2 Bronze Trust reward should trigger Familiar, a Relationship Deepened notice, and a new personal request.`,
  };
}

export function prepareSeleneLineageQuestStage(
  save: GameSave,
  stage: 1 | 2 | 3,
): LegacyDevActionResult {
  let nextSave = setNpcTrustExactly(save, "selene_virell", Math.max(50, getNpcTrustRecord(save, "selene_virell").points));
  const stageOneComplete = stage >= 2;
  const stageTwoComplete = stage >= 3;
  const contracts = (nextSave.guild?.contracts ?? []).filter(
    (contract) => !String(contract.contractId).startsWith("guild_personal_selene_lineage_"),
  );
  nextSave = ensureCurrentGuildState({
    ...nextSave,
    guild: nextSave.guild ? { ...nextSave.guild, contracts } : nextSave.guild,
    flags: {
      ...nextSave.flags,
      guildSeleneLineageStage1: stageOneComplete,
      guildSeleneLineageStage2: stageTwoComplete,
      guildSeleneLineageStage3: false,
      guildSeleneLineageChainComplete: false,
      seleneLineageConsultationUnlocked: false,
      guildSelenePersonalChain: true,
      guildTrustDevSeleneStage: stage,
    },
  });
  const contract = nextSave.guild?.contracts.find(
    (entry) => String(entry.contractId) === `guild_personal_selene_lineage_${stage}`,
  );
  return {
    save: nextSave,
    ok: Boolean(contract),
    message: contract
      ? `Selene personal lineage Stage ${stage}/3 is now posted: “${contract.title}”. ${stage === 1 ? "It requires FER 7+." : stage === 2 ? "It requires WIL 7+." : "The capstone requires a Rare or Epic creature."}`
      : `Could not prepare Selene lineage Stage ${stage}.`,
  };
}

export function prepareLegacyRetirementCandidate(
  save: GameSave,
  creatureId: CreatureId,
): LegacyDevActionResult {
  const creature = findActiveCreature(save, creatureId);
  if (!creature) {
    return { save, ok: false, message: "Choose an active creature before preparing a retirement test." };
  }
  if ((save.creatures ?? []).length <= 1) {
    return {
      save,
      ok: false,
      message: "Add a second active creature first. Retirement correctly refuses to remove the final ranch creature.",
    };
  }

  const nextSave: GameSave = {
    ...save,
    updatedAt: new Date().toISOString(),
    creatures: (save.creatures ?? []).map((entry) =>
      entry.creatureId === creatureId
        ? {
            ...entry,
            level: Math.max(20, entry.level),
            isLocked: false,
          }
        : entry,
    ),
    flags: {
      ...save.flags,
      legacyDevRetirementPresetUsed: true,
      legacyDevLastPreparedCreatureId: String(creatureId),
    },
  };

  const eligibility = getRetirementEligibility(nextSave, creatureId);
  if (!eligibility.eligible) {
    return {
      save: nextSave,
      ok: true,
      message: `Retirement level preset applied to ${creature.nickname}. Remaining live-system blocker: ${eligibility.reasons.join(" ")}`,
    };
  }

  return {
    save: nextSave,
    ok: true,
    message: `${creature.nickname} is now ready for a normal retirement-flow test from the Legacy creature profile.`,
  };
}

export function prepareLegacyHallCandidate(
  save: GameSave,
  creatureId: CreatureId,
): LegacyDevActionResult {
  const retirementPreset = prepareLegacyRetirementCandidate(save, creatureId);
  if (!retirementPreset.ok) return retirementPreset;

  const creature = findActiveCreature(retirementPreset.save, creatureId);
  if (!creature) {
    return { save: retirementPreset.save, ok: false, message: "Prepared creature is no longer active." };
  }

  const state = getCreatureCareerState(retirementPreset.save);
  const current = getCreatureCareerRecord(retirementPreset.save, creatureId);
  const dayNumber = retirementPreset.save.dayState.dayNumber;
  const preparedRecord = {
    ...current,
    version: CREATURE_CAREER_VERSION,
    creatureId,
    lastUpdatedDayNumber: Math.max(current.lastUpdatedDayNumber, dayNumber),
    battlesEntered: Math.max(current.battlesEntered, 24),
    victories: Math.max(current.victories, 20),
    knockouts: Math.max(current.knockouts, 8),
    damageDealt: Math.max(current.damageDealt, 3000),
  };

  const nextSave: GameSave = {
    ...retirementPreset.save,
    updatedAt: new Date().toISOString(),
    creatureCareers: {
      version: CREATURE_CAREER_VERSION,
      recordsByCreatureId: {
        ...state.recordsByCreatureId,
        [String(creatureId)]: preparedRecord,
      },
      appliedEventKeys: state.appliedEventKeys,
    },
    flags: {
      ...retirementPreset.save.flags,
      legacyDevHallPresetUsed: true,
      legacyDevLastPreparedCreatureId: String(creatureId),
    },
  };

  const eligibility = getRetirementEligibility(nextSave, creatureId);
  return {
    save: nextSave,
    ok: true,
    message: eligibility.hallEligible
      ? `${creature.nickname} is Hall-eligible and retirement-ready unless another live-system blocker is listed in the panel.`
      : `${creature.nickname} received the Hall test career preset, but Hall eligibility did not resolve as expected.`,
  };
}
