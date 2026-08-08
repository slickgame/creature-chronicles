import assert from "node:assert/strict";
import test from "node:test";
import {
  getCreatureCareerRecord,
  normalizeCreatureCareerSave,
  recordCreatureBattleCareer,
  recordCreatureBreedingCareer,
  recordCreatureGuildCareer,
  recordCreatureWorkCareer,
} from "../src/data/creatureCareerRecords";
import type { CreatureRecord } from "../src/types/creature";
import type { CreatureId, SaveId } from "../src/types/ids";
import type { GameSave } from "../src/types/save";

const creatureId = "creature_test_career" as CreatureId;

function creature(): CreatureRecord {
  return {
    creatureId,
    ownerSaveId: "save_test",
    speciesId: "species_feline" as CreatureRecord["speciesId"],
    variantId: "variant_feline_common" as CreatureRecord["variantId"],
    habitatId: "habitat_feline" as CreatureRecord["habitatId"],
    nickname: "Mira",
    level: 4,
    xp: 0,
    xpToNext: 100,
    stats: { STR: 10, DEX: 10, STA: 10, CHA: 10, WIL: 10, FER: 10 },
    statGrades: { STR: "C", DEX: "C", STA: "C", CHA: "C", WIL: "C", FER: "C" },
    abilities: [],
    energy: 40,
    maxEnergy: 40,
    hearts: 4,
    maxHearts: 4,
    affection: 20,
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

function save(): GameSave {
  return {
    version: "test",
    saveId: "save_test" as SaveId,
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
      stats: { STR: 10, DEX: 10, STA: 10, CHA: 10, WIL: 10, FER: 10 },
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
    flags: {},
  };
}

test("career migration creates a zeroed record for every creature", () => {
  const normalized = normalizeCreatureCareerSave(save());
  const record = getCreatureCareerRecord(normalized, creatureId);
  assert.equal(record.battlesEntered, 0);
  assert.equal(record.offspringCount, 0);
  assert.equal(normalized.flags.creatureCareersMigrated, true);
});

test("battle events accumulate structured lifetime statistics", () => {
  const updated = recordCreatureBattleCareer(save(), {
    eventKey: "battle:one:creature_test_career",
    creatureId,
    dayNumber: 12,
    outcome: "victory",
    damageDealt: 84,
    healingDone: 12,
    alliesProtected: 2,
    knockouts: 1,
  });
  const record = getCreatureCareerRecord(updated, creatureId);
  assert.equal(record.battlesEntered, 1);
  assert.equal(record.victories, 1);
  assert.equal(record.damageDealt, 84);
  assert.equal(record.healingDone, 12);
  assert.equal(record.alliesProtected, 2);
  assert.equal(record.knockouts, 1);
});

test("event keys prevent duplicate career credit", () => {
  const event = {
    eventKey: "guild:one:creature_test_career",
    creatureId,
    dayNumber: 12,
    featured: true,
  } as const;
  const once = recordCreatureGuildCareer(save(), event);
  const twice = recordCreatureGuildCareer(once, event);
  const record = getCreatureCareerRecord(twice, creatureId);
  assert.equal(record.guildRequestsCompleted, 1);
  assert.equal(record.featuredGuildRequestsCompleted, 1);
});

test("work and breeding events feed future ambition metrics", () => {
  let updated = recordCreatureWorkCareer(save(), {
    eventKey: "work:day12:creature_test_career",
    creatureId,
    dayNumber: 12,
    daysWorked: 1,
    resourcesProduced: 7,
  });
  updated = recordCreatureBreedingCareer(updated, {
    eventKey: "birth:one:parent:creature_test_career",
    creatureId,
    dayNumber: 12,
    role: "parent",
    offspringRarity: "Epic",
  });
  const record = getCreatureCareerRecord(updated, creatureId);
  assert.equal(record.daysWorked, 1);
  assert.equal(record.resourcesProduced, 7);
  assert.equal(record.offspringCount, 1);
  assert.equal(record.epicOffspringCount, 1);
});
