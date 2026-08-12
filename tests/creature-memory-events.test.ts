import assert from "node:assert/strict";
import test from "node:test";
import {
  recordBattleMemory,
  recordBirthMemories,
  recordGuildRequestMemory,
} from "../src/data/creatureMemoryEvents";
import { getCreatureMemories } from "../src/data/creatureMemories";
import type { BirthRecord, GameSave } from "../src/types/save";

function createSave(): GameSave {
  return {
    version: "test",
    saveId: "save_test",
    slotIndex: 0,
    createdAt: "2026-08-02T00:00:00.000Z",
    updatedAt: "2026-08-02T00:00:00.000Z",
    player: {
      playerId: "player_test",
      name: "Tester",
      ranchName: "Test Ranch",
      breederRank: 1,
      breederXp: 0,
      breederXpToNext: 100,
      ranchRank: 1,
      stats: { STR: 5, DEX: 5, STA: 5, CHA: 5, WIL: 5, FER: 5 },
      statGrades: { STR: "C", DEX: "C", STA: "C", CHA: "C", WIL: "C", FER: "C" },
      hearts: 3,
      maxHearts: 3,
    },
    currencies: { gold: 0, guildPoints: 0, energy: 10, maxEnergy: 10 },
    dayState: { dayNumber: 12, weekday: "Mon", month: 1, dayOfMonth: 12, weekNumber: 2 },
    settings: { musicVolume: 1, sfxVolume: 1, textSpeed: "normal", devMode: false },
    creatureIds: ["parent_a", "parent_b", "child"],
    eggIds: [],
    habitatIds: [],
    creatures: [
      { creatureId: "parent_a", nickname: "Aster" },
      { creatureId: "parent_b", nickname: "Bramble" },
      { creatureId: "child", nickname: "Clover" },
    ] as GameSave["creatures"],
    flags: {},
  };
}

const birth: BirthRecord = {
  birthId: "birth_child",
  eggId: "egg_child",
  creatureId: "child",
  hatchedAtDayNumber: 12,
  hatchedAt: "2026-08-02T12:00:00.000Z",
  nickname: "Clover",
  rarity: "Rare",
  speciesId: "species_feline",
  variantId: "variant_feline",
  parents: {
    giver: {
      participantId: "parent_a",
      creatureId: "parent_a",
      displayName: "Aster",
      familyLabel: "Feline",
      kind: "creature",
    },
    receiver: {
      participantId: "parent_b",
      creatureId: "parent_b",
      displayName: "Bramble",
      familyLabel: "Feline",
      kind: "creature",
    },
  },
  inheritedStatGrades: { STR: "C", DEX: "C", STA: "C", CHA: "C", WIL: "C", FER: "C" },
  inheritedAbilities: [],
  lineageRisk: "none",
  lineageRiskLabel: "No known risk",
  lineageTraits: [],
};

test("birth memories are written for child and creature parents", () => {
  const save = recordBirthMemories(createSave(), birth);
  assert.equal(getCreatureMemories(save, "child").length, 1);
  assert.equal(getCreatureMemories(save, "parent_a")[0]?.title, "Aster became a parent");
  assert.equal(getCreatureMemories(save, "parent_b")[0]?.title, "Bramble became a parent");

  const repeated = recordBirthMemories(save, birth);
  assert.equal(getCreatureMemories(repeated, "child").length, 1);
  assert.equal(getCreatureMemories(repeated, "parent_a").length, 1);
});

test("battle memories record participation, first victory, and notable performance once", () => {
  const input = {
    creatureId: "parent_a" as const,
    battleId: "battle_001",
    encounterName: "Opening Scrimmage",
    outcome: "victory" as const,
    dayNumber: 12,
    knockouts: 3,
    protectedAllies: 4,
  };
  const save = recordBattleMemory(createSave(), input);
  const memories = getCreatureMemories(save, "parent_a");
  assert.equal(memories.length, 4);
  assert.ok(memories.some((memory) => memory.tags?.includes("first")));
  assert.ok(memories.some((memory) => memory.tags?.includes("guardian")));

  const repeated = recordBattleMemory(save, input);
  assert.equal(getCreatureMemories(repeated, "parent_a").length, 4);
});

test("guild request memories are duplicate-safe", () => {
  const input = {
    creatureId: "parent_b" as const,
    requestId: "request_001",
    requestTitle: "Medicine for the Foothills",
    guildName: "Medical Guild",
    dayNumber: 12,
    wasFeatured: true,
  };
  const once = recordGuildRequestMemory(createSave(), input);
  const twice = recordGuildRequestMemory(once, input);
  assert.equal(getCreatureMemories(twice, "parent_b").length, 1);
  assert.equal(getCreatureMemories(twice, "parent_b")[0]?.importance, "major");
});
