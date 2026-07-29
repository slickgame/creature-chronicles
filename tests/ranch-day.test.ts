import test from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.has(key) ? this.values.get(key)! : null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

const storage = new MemoryStorage();
(globalThis as unknown as { window: { localStorage: MemoryStorage } }).window = { localStorage: storage };

const { createNewGameSave, loadSaveFromSlot, saveGameToSlot } = await import("../src/lib/save/localSaveLifecycle.ts");
const { CURRENT_SAVE_SCHEMA_VERSION } = await import("../src/lib/save/saveReliabilityRanchDay.ts");
const { generateDailyRanchEvent, resolveDailyRanchEventChoice } = await import("../src/data/ranch-day/ranchDayEvents.ts");
const { deriveCreatureMoods } = await import("../src/data/ranch-day/ranchDayMood.ts");
const { updateDailyGoalsAndRewards } = await import("../src/data/ranch-day/ranchDayGoals.ts");
const { advanceRanchDay } = await import("../src/data/ranch-day/ranchDayLifecycle.ts");
const { enterEveningReview, normalizeRanchDaySave } = await import("../src/data/ranch-day/ranchDayState.ts");

function activeSave(slotIndex = 0) {
  const created = createNewGameSave("Ranch Day Tester", slotIndex);
  return normalizeRanchDaySave({
    ...created,
    flags: {
      ...created.flags,
      ranchFeedStock: 100,
      ranchMaterialsStock: 10,
      ranchDamage: 0,
    },
  }, "active");
}

function parentSnapshot(save: ReturnType<typeof createNewGameSave>, creatureIndex: number) {
  const creature = save.creatures![creatureIndex];
  return {
    participantId: String(creature.creatureId),
    creatureId: creature.creatureId,
    displayName: creature.nickname,
    familyLabel: "Test Family",
    kind: "creature" as const,
    speciesId: creature.speciesId,
    variantId: creature.variantId,
  };
}

function inheritance(save: ReturnType<typeof createNewGameSave>, creatureIndex: number) {
  const creature = save.creatures![creatureIndex];
  return {
    projectedSpeciesId: creature.speciesId,
    projectedVariantId: creature.variantId,
    projectedStats: { ...creature.stats },
    projectedStatGrades: { ...creature.statGrades },
    projectedAbilities: [],
    statRollNotes: [],
    abilityRollNotes: [],
    geneticsNotes: [],
    lineageRisk: "none" as const,
    lineageRiskLabel: "No Risk",
    lineageNotes: [],
    lineageTraits: [],
    suggestedName: "Timer Test",
  };
}

test("Ranch Day event selection is deterministic for a save and day", () => {
  const save = activeSave();
  const first = generateDailyRanchEvent(save);
  const second = generateDailyRanchEvent(save);
  assert.deepEqual(first, second);
  assert.equal(first.dayNumber, save.dayState.dayNumber);
  assert.equal(first.choices.length >= 2, true);
});

test("new Ranch Days generate three unique goals", () => {
  const save = activeSave();
  assert.equal(save.ranchDay?.goals.length, 3);
  assert.equal(new Set(save.ranchDay?.goals.map((goal) => goal.goalId)).size, 3);
  assert.equal(save.ranchDay?.goals.every((goal) => goal.target > 0), true);
});

test("daily goal rewards can only be claimed once", () => {
  const save = activeSave();
  const dayNumber = save.dayState.dayNumber;
  const custom = {
    ...save,
    ranchDay: {
      ...save.ranchDay!,
      goals: [{
        goalId: `${dayNumber}:keep-gold-reserve`,
        dayNumber,
        label: "Protect the ranch reserve",
        description: "Hold Gold.",
        progressLabel: "Gold held",
        target: 200,
        progress: 0,
        complete: false,
        reward: { feed: 1, materials: 1 },
        rewardLabel: "1 Feed + 1 Materials",
        rewardClaimed: false,
      }],
    },
  };
  const first = updateDailyGoalsAndRewards(custom);
  const second = updateDailyGoalsAndRewards(first);
  assert.equal(Number(first.flags.ranchFeedStock), Number(custom.flags.ranchFeedStock) + 2, "goal reward plus all-goals bonus adds 2 Feed");
  assert.equal(Number(first.flags.ranchMaterialsStock), Number(custom.flags.ranchMaterialsStock) + 1);
  assert.equal(second.flags.ranchFeedStock, first.flags.ranchFeedStock);
  assert.equal(second.flags.ranchMaterialsStock, first.flags.ranchMaterialsStock);
});

test("Ranch Day event choices resolve once and do not reroll", () => {
  const save = activeSave();
  const event = save.ranchDay!.event!;
  const choice = event.choices.find((item) => {
    const result = resolveDailyRanchEventChoice(save, item.choiceId);
    return result.ok;
  });
  assert.ok(choice);
  const resolved = resolveDailyRanchEventChoice(save, choice.choiceId);
  assert.equal(resolved.ok, true);
  assert.equal(resolved.save.ranchDay?.event?.selectedChoiceId, choice.choiceId);
  assert.deepEqual(generateDailyRanchEvent(resolved.save), generateDailyRanchEvent(save));
  const duplicate = resolveDailyRanchEventChoice(resolved.save, choice.choiceId);
  assert.equal(duplicate.ok, false);
});

test("derived creature moods are deterministic", () => {
  const save = activeSave();
  assert.deepEqual(deriveCreatureMoods(save), deriveCreatureMoods(save));
  assert.equal(deriveCreatureMoods(save).length, save.creatures?.length);
});

test("ending a Ranch Day advances pregnancy and egg timers exactly once", () => {
  const save = activeSave();
  const giver = parentSnapshot(save, 0);
  const receiver = parentSnapshot(save, 1);
  const pregnancy = {
    pregnancyId: "pregnancy_day_loop" as never,
    createdAtDayNumber: save.dayState.dayNumber,
    createdAt: new Date(0).toISOString(),
    daysRemaining: 2,
    totalDays: 3,
    status: "pregnant" as const,
    giver,
    receiver,
    inheritance: inheritance(save, 1),
  };
  const egg = {
    eggId: "egg_day_loop" as never,
    ownerSaveId: save.saveId,
    createdAtDayNumber: save.dayState.dayNumber,
    createdAt: new Date(0).toISOString(),
    daysRemaining: 3,
    totalDays: 6,
    status: "incubating" as const,
    rarity: "Common" as const,
    speciesId: save.creatures![0].speciesId,
    variantId: save.creatures![0].variantId,
    habitatId: save.habitats![0].habitatId,
    parents: { giver, receiver },
    projectedStats: { ...save.creatures![0].stats },
    projectedStatGrades: { ...save.creatures![0].statGrades },
    projectedAbilities: [],
    statRollNotes: [],
    abilityRollNotes: [],
    geneticsNotes: [],
    lineageRisk: "none" as const,
    lineageRiskLabel: "No Risk",
    lineageNotes: [],
    lineageTraits: [],
    suggestedName: "Egg Timer Test",
  };
  const evening = enterEveningReview({ ...save, pregnancies: [pregnancy], eggs: [egg], eggIds: [egg.eggId] });
  const result = advanceRanchDay(evening);
  assert.ok(result);
  assert.equal(result.save.dayState.dayNumber, save.dayState.dayNumber + 1);
  assert.equal(result.save.pregnancies?.[0].daysRemaining, 1);
  assert.equal(result.save.eggs?.find((item) => item.eggId === egg.eggId)?.daysRemaining, 2);
  assert.equal(result.save.ranchDay?.phase, "morning");
  assert.equal(advanceRanchDay(result.save), null, "a Morning phase cannot be processed again");
});

test("legacy schema saves migrate into schema 4 with an active Ranch Day", () => {
  storage.clear();
  const save = activeSave(2);
  const legacy = { ...save, schemaVersion: 3, ranchDay: undefined };
  storage.setItem("creature_chronicles_save_slot_2", JSON.stringify(legacy));
  const loaded = loadSaveFromSlot(2);
  assert.ok(loaded);
  assert.equal(loaded.schemaVersion, CURRENT_SAVE_SCHEMA_VERSION);
  assert.equal(loaded.ranchDay?.dayNumber, loaded.dayState.dayNumber);
  assert.equal(loaded.ranchDay?.phase, "active");
  const persisted = saveGameToSlot(loaded);
  assert.equal(persisted.schemaVersion, 4);
});
