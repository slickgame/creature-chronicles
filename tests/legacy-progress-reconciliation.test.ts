import assert from "node:assert/strict";
import test from "node:test";
import { getCreatureCareerRecord } from "@/data/creatureCareerRecords";
import {
  getLegacyPrestige,
  reconcileLegacyExternalProgress,
} from "@/data/legacyProgressReconciliation";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId, SaveId } from "@/types/ids";
import type { GameSave } from "@/types/save";

const creatureId = "reconcile_creature" as CreatureId;

function creature(): CreatureRecord {
  return {
    creatureId,
    ownerSaveId: "reconcile_save" as SaveId,
    speciesId: "species_feline" as CreatureRecord["speciesId"],
    variantId: "variant_feline_common" as CreatureRecord["variantId"],
    habitatId: "habitat_feline" as CreatureRecord["habitatId"],
    nickname: "Mira",
    level: 5,
    xp: 0,
    xpToNext: 100,
    stats: { STR: 8, DEX: 9, STA: 7, CHA: 6, WIL: 7, FER: 5 },
    statGrades: { STR: "C", DEX: "C", STA: "C", CHA: "C", WIL: "C", FER: "C" },
    abilities: [],
    energy: 40,
    maxEnergy: 40,
    hearts: 4,
    maxHearts: 4,
    affection: 60,
    generation: 1,
    shiny: false,
    cosmeticVariant: null,
    origin: "starter",
    originLabel: "Starter",
    isLocked: false,
    createdAt: "2026-08-04T12:00:00.000Z",
    notes: "",
  };
}

function makeSave(): GameSave {
  return {
    version: "test",
    saveId: "reconcile_save" as SaveId,
    slotIndex: 0,
    createdAt: "2026-08-04T12:00:00.000Z",
    updatedAt: "2026-08-04T12:00:00.000Z",
    player: {
      playerId: "player_test" as GameSave["player"]["playerId"],
      name: "Tester",
      ranchName: "Test Ranch",
      breederRank: 1,
      breederXp: 0,
      breederXpToNext: 100,
      ranchRank: 1,
      stats: { STR: 5, DEX: 5, STA: 5, CHA: 5, WIL: 5, FER: 5 },
      statGrades: { STR: "C", DEX: "C", STA: "C", CHA: "C", WIL: "C", FER: "C" },
      hearts: 4,
      maxHearts: 4,
    },
    currencies: { gold: 0, guildPoints: 0, energy: 10, maxEnergy: 10 },
    dayState: { dayNumber: 12, weekday: "Mon", month: 1, dayOfMonth: 12, weekNumber: 2 },
    settings: { musicVolume: 1, sfxVolume: 1, textSpeed: "normal", devMode: false },
    creatureIds: [creatureId],
    eggIds: [],
    habitatIds: [],
    creatures: [creature()],
    guild: {
      version: 1,
      weekNumber: 2,
      guildRank: 1,
      completedCount: 1,
      donatedCreatureCount: 0,
      contracts: [{
        contractId: "guild_contract_2_0",
        weekNumber: 2,
        tier: "bronze",
        type: "service_creature",
        category: "service",
        requesterId: "mara_vell",
        requesterName: "Mara Vell",
        trustTarget: "Mara",
        status: "completed",
        title: "Test Shift",
        description: "Test",
        requirement: { kind: "any_creature", label: "Send any creature." },
        goldReward: 10,
        guildPointReward: 1,
        createdAtDayNumber: 10,
        expiresAtWeekNumber: 3,
        completedAtDayNumber: 11,
        submittedCreatureId: creatureId,
        submittedCreatureName: "Mira",
      }],
    } as GameSave["guild"],
    flags: {
      coliseumProgressV1: JSON.stringify({
        version: 1,
        completedEncounterIds: ["novice_echo_trial"],
        claimedFirstClearEncounterIds: ["novice_echo_trial"],
        records: {},
        totalAttempts: 1,
        totalWins: 1,
        totalLosses: 0,
        totalDraws: 0,
        history: [{
          historyId: "novice_day10_attempt1",
          encounterId: "novice_echo_trial",
          encounterName: "Novice Echo Trial",
          divisionId: "novice",
          outcome: "player_won",
          roundCount: 3,
          completedAtDayNumber: 10,
          teamCreatureIds: [creatureId],
          rewardGold: 180,
          rewardGuildPoints: 6,
          firstClear: true,
        }],
      }),
    },
  } as unknown as GameSave;
}

test("save-boundary reconciliation credits persisted Coliseum and Guild history", () => {
  const reconciled = reconcileLegacyExternalProgress(makeSave());
  const record = getCreatureCareerRecord(reconciled, creatureId);
  assert.equal(record.battlesEntered, 1);
  assert.equal(record.victories, 1);
  assert.equal(record.guildRequestsCompleted, 1);
  assert.equal(reconciled.flags.legacyExternalProgressReconciliationVersion, 1);
});

test("reconciliation is idempotent across repeated save boundaries", () => {
  const once = reconcileLegacyExternalProgress(makeSave());
  const twice = reconcileLegacyExternalProgress(once);
  const record = getCreatureCareerRecord(twice, creatureId);
  assert.equal(record.battlesEntered, 1);
  assert.equal(record.guildRequestsCompleted, 1);
});

test("Legacy Prestige reader normalizes invalid stored values", () => {
  const save = makeSave();
  save.flags.legacyPrestige = "12";
  assert.equal(getLegacyPrestige(save), 12);
  save.flags.legacyPrestige = "invalid";
  assert.equal(getLegacyPrestige(save), 0);
});
