import assert from "node:assert/strict";
import test from "node:test";
import {
  addCreatureMemory,
  getChronicleEntries,
  getCreatureMemories,
  normalizeCreatureMemorySave,
} from "../src/data/creatureMemories";
import type { CreatureRecord } from "../src/types/creature";
import type { GameSave } from "../src/types/save";

function makeCreature(overrides: Partial<CreatureRecord> = {}): CreatureRecord {
  return {
    creatureId: "creature_memory_test",
    ownerSaveId: "save_memory_test",
    speciesId: "species_feline",
    variantId: "variant_feline_common",
    habitatId: "habitat_feline",
    nickname: "Mira",
    level: 12,
    xp: 0,
    xpToNext: 100,
    stats: { STR: 5, DEX: 5, STA: 5, CHA: 5, WIL: 5, FER: 5 },
    statGrades: { STR: "C", DEX: "C", STA: "C", CHA: "C", WIL: "C", FER: "C" },
    abilities: [],
    energy: 100,
    maxEnergy: 100,
    hearts: 3,
    maxHearts: 3,
    affection: 0,
    generation: 2,
    shiny: false,
    cosmeticVariant: null,
    origin: "hatched",
    originLabel: "Ranch Nursery",
    isLocked: false,
    createdAt: "2026-08-02T12:00:00.000Z",
    notes: "",
    ...overrides,
  };
}

function makeSave(): GameSave {
  const creature = makeCreature();
  return {
    version: "test",
    saveId: "save_memory_test",
    slotIndex: 0,
    createdAt: "2026-08-02T12:00:00.000Z",
    updatedAt: "2026-08-02T12:00:00.000Z",
    player: {
      playerId: "player_memory_test",
      name: "Tester",
      ranchName: "Memory Ranch",
      breederRank: 1,
      breederXp: 0,
      breederXpToNext: 100,
      ranchRank: 1,
      stats: { STR: 5, DEX: 5, STA: 5, CHA: 5, WIL: 5, FER: 5 },
      statGrades: { STR: "C", DEX: "C", STA: "C", CHA: "C", WIL: "C", FER: "C" },
      hearts: 3,
      maxHearts: 3,
    },
    currencies: { gold: 0, guildPoints: 0, energy: 100, maxEnergy: 100 },
    dayState: { dayNumber: 7, weekday: "Sun", month: 1, dayOfMonth: 7, weekNumber: 1 },
    settings: { musicVolume: 1, sfxVolume: 1, textSpeed: "normal", devMode: false },
    creatureIds: [creature.creatureId],
    eggIds: [],
    habitatIds: [],
    creatures: [creature],
    flags: {},
  };
}

test("normalization adds origin and level milestone memories", () => {
  const save = normalizeCreatureMemorySave(makeSave());
  const memories = getCreatureMemories(save, "creature_memory_test");

  assert.equal(memories.length, 2);
  assert.ok(memories.some((memory) => memory.sourceKey === "origin:creature_memory_test"));
  assert.ok(memories.some((memory) => memory.sourceKey === "level-milestone:10"));
  assert.equal(getChronicleEntries(save).length, 2);
});

test("memory source keys prevent duplicate rewards and history entries", () => {
  const first = addCreatureMemory(makeSave(), {
    creatureId: "creature_memory_test",
    category: "battle",
    importance: "notable",
    title: "First victory",
    description: "Mira won her first Coliseum battle.",
    dayNumber: 7,
    sourceKey: "battle:first-victory",
  });
  const second = addCreatureMemory(first, {
    creatureId: "creature_memory_test",
    category: "battle",
    importance: "notable",
    title: "First victory duplicate",
    description: "This should not be added.",
    dayNumber: 8,
    sourceKey: "battle:first-victory",
  });

  assert.equal(getCreatureMemories(second, "creature_memory_test").length, 1);
  assert.equal(getChronicleEntries(second).length, 1);
});

test("memories and chronicle entries sort newest first", () => {
  let save = makeSave();
  save = addCreatureMemory(save, {
    creatureId: "creature_memory_test",
    category: "ranch",
    importance: "minor",
    title: "Older",
    description: "Older memory",
    dayNumber: 2,
    sourceKey: "sort:older",
  });
  save = addCreatureMemory(save, {
    creatureId: "creature_memory_test",
    category: "achievement",
    importance: "major",
    title: "Newer",
    description: "Newer memory",
    dayNumber: 9,
    sourceKey: "sort:newer",
  });

  assert.equal(getCreatureMemories(save, "creature_memory_test")[0]?.title, "Newer");
  assert.equal(getChronicleEntries(save)[0]?.title, "Newer");
});
