import test from "node:test";
import assert from "node:assert/strict";
import { filterBreedingAttempts, getBreedingTargetFilterOptions } from "@/data/breedingRecords";
import type { BreedingAttemptRecord, InheritanceTargetOutcome } from "@/types/breeding";
import { createNewGameSave } from "./helpers/establishedSave";

function attempt(
  dayNumber: number,
  inheritanceTargetOutcome?: InheritanceTargetOutcome,
  outcome: BreedingAttemptRecord["outcome"] = "pregnancy",
): BreedingAttemptRecord {
  return {
    attemptId: `attempt_${dayNumber}` as BreedingAttemptRecord["attemptId"],
    dayNumber,
    giverId: "rowan",
    receiverId: "marlow",
    giverName: "Rowan",
    receiverName: "Marlow",
    giverFamily: "equine",
    receiverFamily: "equine",
    inheritanceTargetOutcome,
    pregnancyChance: 10,
    energyCost: 10,
    heartCost: 1,
    xpGain: 0,
    breederXpGain: 0,
    streakBefore: 0,
    streakAfter: 0,
    outcome,
    resultText: "",
    processText: "",
    outcomeFlavorText: "",
    receiverWasPregnant: false,
    giverEnergyBefore: 100,
    giverEnergyAfter: 90,
    receiverEnergyBefore: 100,
    receiverEnergyAfter: 90,
    pairingImagePath: "",
    outcomeImagePath: "",
    progressionEvents: [],
    createdAt: `2026-11-${String(dayNumber).padStart(2, "0")}T00:00:00.000Z`,
  };
}

function fixture() {
  const save = createNewGameSave("Ledger targets", 0);
  const lightFootedS = {
    target: { kind: "talent", id: "light_footed", grade: "S" },
    label: "Light-Footed · Grade S",
    chance: 10,
    status: "missed",
  } as const;
  save.breeding = {
    hearts: 0,
    maxHearts: 0,
    streaks: [],
    attempts: [
      attempt(1),
      attempt(2, {
        target: { kind: "talent", id: "light_footed" },
        label: "Light-Footed",
        chance: 20,
        status: "passed",
        actualTalent: { name: "Light-Footed", grade: "S" },
      }),
      attempt(3, lightFootedS),
      attempt(4, {
        target: { kind: "talent", id: "light_footed", grade: "B" },
        label: "Light-Footed · Grade B",
        chance: 10,
        status: "missed",
        actualTalent: { name: "Light-Footed", grade: "S" },
      }),
      attempt(5, {
        target: { kind: "grade", grade: "S" },
        label: "Any Grade S talent",
        chance: 10,
        status: "passed",
      }),
      attempt(6, {
        target: { kind: "move", id: "parent-guardian_chorus" },
        label: "Guardian Chorus",
        chance: 10,
        status: "passed",
      }),
      attempt(7, {
        target: { kind: "move", id: "recipe-recipe_guardian_chorus" },
        label: "Guardian Chorus · Combination",
        chance: 10,
        status: "missed",
      }),
      attempt(8, { ...lightFootedS, status: "no-conception" }, "failed"),
    ],
  };
  return save;
}

test("ledger target options are distinct and match the recorded breeding goal", () => {
  const save = fixture();
  const options = getBreedingTargetFilterOptions(save);
  const daysFor = (label: string) => {
    const matches = options.filter(option => option.label === label);
    assert.equal(matches.length, 1, label);
    return filterBreedingAttempts(save, { target: matches[0].value }).map(attempt => attempt.dayNumber);
  };

  assert.deepEqual(daysFor("Light-Footed · All target grades"), [8, 4, 3, 2]);
  assert.deepEqual(daysFor("Light-Footed · Any grade"), [2]);
  assert.deepEqual(daysFor("Light-Footed · Grade S"), [8, 3]);
  assert.deepEqual(daysFor("Light-Footed · Grade B"), [4]);
  assert.deepEqual(daysFor("Grade S · All targets"), [8, 5, 3]);
  assert.deepEqual(daysFor("Grade B · All targets"), [4]);
  assert.deepEqual(daysFor("Any Grade S talent"), [5]);
  assert.deepEqual(daysFor("Guardian Chorus"), [6]);
  assert.deepEqual(daysFor("Guardian Chorus · Combination"), [7]);
  assert.deepEqual(new Set(options.map(option => option.group)), new Set(["Talents", "Grades", "Moves"]));
});

test("ledger target filtering preserves legacy records and composes with existing filters", () => {
  const save = fixture();
  const target = getBreedingTargetFilterOptions(save).find(option => option.label === "Grade S · All targets");
  assert.ok(target);

  assert.deepEqual(filterBreedingAttempts(save).map(attempt => attempt.dayNumber), [8, 7, 6, 5, 4, 3, 2, 1]);
  assert.deepEqual(filterBreedingAttempts(save, { target: "none" }).map(attempt => attempt.dayNumber), [1]);
  const filters = { target: target.value, query: "rowan", creatureId: "marlow", role: "receiver", newestFirst: false } as const;
  assert.deepEqual(filterBreedingAttempts(save, { ...filters, outcome: "pregnancy" }).map(attempt => attempt.dayNumber), [3, 5]);
  assert.deepEqual(filterBreedingAttempts(save, { ...filters, outcome: "failed" }).map(attempt => attempt.dayNumber), [8]);
  assert.deepEqual(filterBreedingAttempts(save, { ...filters, role: "giver" }), []);
  assert.deepEqual(filterBreedingAttempts(save, { ...filters, query: "other" }), []);
  assert.deepEqual(save.breeding?.attempts.map(attempt => attempt.dayNumber), [1, 2, 3, 4, 5, 6, 7, 8]);
});
