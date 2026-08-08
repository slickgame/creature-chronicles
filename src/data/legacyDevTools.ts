import {
  getCreatureCareerRecord,
  getCreatureCareerState,
} from "@/data/creatureCareerRecords";
import { getRetirementEligibility } from "@/data/creatureRetirement";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";
import { CREATURE_CAREER_VERSION } from "@/types/career";

export type LegacyDevActionResult = {
  save: GameSave;
  ok: boolean;
  message: string;
};

function findActiveCreature(save: GameSave, creatureId: CreatureId) {
  return (save.creatures ?? []).find((creature) => creature.creatureId === creatureId) ?? null;
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
