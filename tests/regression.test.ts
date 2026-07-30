import test from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.has(key) ? this.values.get(key)! : null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }
}

const storage = new MemoryStorage();
(globalThis as unknown as { window: { localStorage: MemoryStorage } }).window = { localStorage: storage };

const {
  createNewGameSave,
  loadSaveFromSlot,
  saveGameToSlot,
} = await import("@/lib/save/localSave");
const {
  getBreedingPreview,
  getPairKey,
  performBreedingAttempt,
} = await import("../src/data/breeding.ts");
const {
  getBreedingSceneImagePath,
} = await import("../src/data/breedingSceneImages.ts");
const {
  useBreedingSupportItem,
} = await import("../src/data/breedingItems.ts");
const {
  CURRENT_SAVE_SCHEMA_VERSION,
} = await import("../src/lib/save/saveReliabilityRanchDay.ts");

const CONTROLLED_STATS = { STR: 6, DEX: 6, STA: 6, CHA: 6, WIL: 6, FER: 6 } as const;

function controlledSave(slotIndex = 0) {
  const base = createNewGameSave("Regression Breeder", slotIndex);
  const firstTwo = (base.creatures ?? []).slice(0, 2);
  assert.equal(firstTwo.length, 2, "fixture requires at least two starter creatures");
  const pairIds = new Set(firstTwo.map((creature) => String(creature.creatureId)));
  const save = {
    ...base,
    creatures: (base.creatures ?? []).map((creature) => pairIds.has(String(creature.creatureId))
      ? {
          ...creature,
          stats: { ...CONTROLLED_STATS },
          abilities: [],
          affection: 0,
          energy: 999,
          hearts: 5,
          maxHearts: 5,
        }
      : creature),
    breeding: {
      ...(base.breeding ?? { hearts: 0, maxHearts: 0, attempts: [], streaks: [] }),
      attempts: [],
      streaks: [],
    },
    pregnancies: [],
    eggs: [],
    eggIds: [],
    flags: {
      ...base.flags,
      ranchBreedingComfortBonusToday: 0,
      breedingFertilityTonics: 0,
      breedingFertilityTonicArmed: 0,
      energySnackStock: 0,
    },
  };
  return {
    save,
    giverId: String(firstTwo[0].creatureId),
    receiverId: String(firstTwo[1].creatureId),
  };
}

function pregnancyFor(save: ReturnType<typeof createNewGameSave>, giverId: string, receiverId: string) {
  const giver = (save.creatures ?? []).find((creature) => String(creature.creatureId) === giverId)!;
  const receiver = (save.creatures ?? []).find((creature) => String(creature.creatureId) === receiverId)!;
  return {
    pregnancyId: "pregnancy_regression" as never,
    createdAtDayNumber: save.dayState.dayNumber,
    createdAt: new Date(0).toISOString(),
    daysRemaining: 2,
    totalDays: 3,
    status: "pregnant" as const,
    giver: {
      participantId: giverId,
      creatureId: giver.creatureId,
      displayName: giver.nickname,
      familyLabel: "Test Giver",
      kind: "creature" as const,
    },
    receiver: {
      participantId: receiverId,
      creatureId: receiver.creatureId,
      displayName: receiver.nickname,
      familyLabel: "Test Receiver",
      kind: "creature" as const,
    },
    inheritance: {
      projectedSpeciesId: receiver.speciesId,
      projectedVariantId: receiver.variantId,
      projectedStats: { ...receiver.stats },
      projectedStatGrades: { ...receiver.statGrades },
      projectedAbilities: [],
      statRollNotes: [],
      abilityRollNotes: [],
      geneticsNotes: [],
      lineageRisk: "none" as const,
      lineageRiskLabel: "No Risk",
      lineageNotes: [],
      lineageTraits: [],
      suggestedName: "Regression Offspring",
    },
  };
}

test("breeding scene selection is deterministic for the same seed", () => {
  const first = getBreedingSceneImagePath("feline", "canine", "pairing", undefined, "stable-seed");
  const second = getBreedingSceneImagePath("feline", "canine", "pairing", undefined, "stable-seed");
  const outcomeFirst = getBreedingSceneImagePath("feline", "canine", "outcome", "failed", "stable-outcome");
  const outcomeSecond = getBreedingSceneImagePath("feline", "canine", "outcome", "failed", "stable-outcome");
  assert.equal(first, second);
  assert.equal(outcomeFirst, outcomeSecond);
  assert.ok(first.startsWith("/images/"));
  assert.ok(outcomeFirst.startsWith("/images/"));
});

test("controlled breeding chance and Energy cost use the live formulas", () => {
  const { save, giverId, receiverId } = controlledSave();
  const preview = getBreedingPreview(save, giverId, receiverId);
  assert.ok(preview);
  assert.equal(preview.baseChance, 12);
  assert.equal(preview.affectionBonus, 0);
  assert.equal(preview.streakBonus, 0);
  assert.equal(preview.abilityBonus, -8, "Tier-0 Breeding Pen applies the live -8% comfort penalty");
  assert.equal(preview.pregnancyChance, 10, "12 base + 4 FER + 2 CHA - 8 Tier-0 penalty");
  assert.equal(preview.energyDiscount, -18, "2 STA discount plus the live Tier-0 -20 efficiency penalty");
  assert.equal(preview.energyCost, 53, "35 base Energy minus a -18 net discount");
});

test("pair familiarity adds 3 percent per failure and caps at 15 percent", () => {
  const fixture = controlledSave();
  const pairKey = getPairKey(fixture.giverId, fixture.receiverId);
  const withFour = {
    ...fixture.save,
    breeding: {
      ...fixture.save.breeding!,
      streaks: [{
        pairKey,
        participantAId: fixture.giverId,
        participantBId: fixture.receiverId,
        streakCount: 4,
        lastAttemptDayNumber: fixture.save.dayState.dayNumber,
        lastOutcome: "failed" as const,
      }],
    },
  };
  const fourPreview = getBreedingPreview(withFour, fixture.giverId, fixture.receiverId);
  assert.ok(fourPreview);
  assert.equal(fourPreview.streakBonus, 12);
  assert.equal(fourPreview.pregnancyChance, 22);

  const overCap = {
    ...withFour,
    breeding: {
      ...withFour.breeding!,
      streaks: [{ ...withFour.breeding!.streaks[0], streakCount: 9 }],
    },
  };
  const cappedPreview = getBreedingPreview(overCap, fixture.giverId, fixture.receiverId);
  assert.ok(cappedPreview);
  assert.equal(cappedPreview.streakBonus, 15);
  assert.equal(cappedPreview.pregnancyChance, 25);
});

test("an already-pregnant receiver cannot create another pregnancy", () => {
  const fixture = controlledSave();
  const save = {
    ...fixture.save,
    pregnancies: [pregnancyFor(fixture.save, fixture.giverId, fixture.receiverId)],
  };
  const preview = getBreedingPreview(save, fixture.giverId, fixture.receiverId);
  assert.ok(preview);
  assert.equal(preview.receiverPregnant, true);
  assert.equal(preview.receiverCanBecomePregnant, false);
  assert.equal(preview.pregnancyChance, 0);
  assert.match(preview.pregnancyBlockedReason ?? "", /already pregnant/i);
});

test("player-receiver sessions can never create player pregnancy outcomes", () => {
  storage.clear();
  const fixture = controlledSave();
  const preview = getBreedingPreview(fixture.save, fixture.giverId, "player");
  assert.ok(preview);
  assert.equal(preview.receiverCanBecomePregnant, false);
  assert.equal(preview.pregnancyChance, 0);
  assert.match(preview.pregnancyBlockedReason ?? "", /cannot become pregnant/i);

  const result = performBreedingAttempt(fixture.save, fixture.giverId, "player");
  assert.ok(result);
  assert.equal(result.attempt.outcome, "failed");
  assert.equal(result.attempt.receiverWasPregnant, false);
  assert.equal(
    (result.save.pregnancies ?? []).some((pregnancy) => pregnancy.receiver.participantId === "player"),
    false,
  );
  saveGameToSlot(result.save);
});

test("Energy Snack consumes exactly one item and records one use", () => {
  const fixture = controlledSave();
  const save = {
    ...fixture.save,
    currencies: {
      ...fixture.save.currencies,
      energy: fixture.save.currencies.maxEnergy - 20,
    },
    flags: { ...fixture.save.flags, energySnackStock: 2 },
  };
  const result = useBreedingSupportItem(save, "energy_snack", {
    source: "inventory",
    targetId: "player",
  });
  assert.equal(result.ok, true);
  assert.equal(result.save.currencies.energy, save.currencies.energy + 12);
  assert.equal(Number(result.save.flags.energySnackStock), 1);
  assert.equal(result.save.itemUseHistory?.length, 1);
  assert.equal(result.save.itemUseHistory?.[0].itemId, "energy_snack");

  const fullEnergy = {
    ...save,
    currencies: { ...save.currencies, energy: save.currencies.maxEnergy },
  };
  const blocked = useBreedingSupportItem(fullEnergy, "energy_snack", {
    source: "inventory",
    targetId: "player",
  });
  assert.equal(blocked.ok, false);
  assert.equal(Number(blocked.save.flags.energySnackStock), 2);
  assert.equal(blocked.save.itemUseHistory?.length ?? 0, 0);
});

test("save persistence preserves schema, inventory history, and breeding state", () => {
  storage.clear();
  const fixture = controlledSave(1);
  const itemSave = {
    ...fixture.save,
    currencies: {
      ...fixture.save.currencies,
      energy: fixture.save.currencies.maxEnergy - 20,
    },
    flags: { ...fixture.save.flags, energySnackStock: 2 },
  };
  const used = useBreedingSupportItem(itemSave, "energy_snack", {
    source: "inventory",
    targetId: "player",
  });
  assert.equal(used.ok, true);
  const saved = saveGameToSlot(used.save);
  const loaded = loadSaveFromSlot(saved.slotIndex);
  assert.ok(loaded);
  assert.equal(loaded.saveId, saved.saveId);
  assert.equal(loaded.schemaVersion, CURRENT_SAVE_SCHEMA_VERSION);
  assert.equal(Number(loaded.flags.energySnackStock), 1);
  assert.equal(loaded.itemUseHistory?.length, 1);
  assert.equal(loaded.breeding?.attempts.length, saved.breeding?.attempts.length);
  assert.deepEqual(loaded.creatureIds, (loaded.creatures ?? []).map((creature) => creature.creatureId));
  assert.deepEqual(loaded.eggIds, (loaded.eggs ?? []).map((egg) => egg.eggId));
});
