import test from "node:test";
import assert from "node:assert/strict";
import { createNewGameSave } from "./helpers/establishedSave";
import { getBreedingParticipants, performBreedingAttempt, resolveInheritanceTargetOutcome } from "@/data/breedingTutorial";
import { rollBattleMoveInheritance } from "@/data/battleMoveInheritance";
import { advanceNurseryDay, createPregnancyRecord } from "@/data/nursery";
import { createGeneralTalent } from "@/data/talents/generalTalents";
import { repairLoadedSave } from "@/lib/save/saveReliability";
import type { BattleMoveInheritanceRoll } from "@/types/battle";
import type { InheritanceTargetSelection } from "@/types/breeding";

const gradeTarget: InheritanceTargetSelection = {
  target: { kind: "talent", id: "light_footed", grade: "S" },
  label: "Light-Footed · Grade S",
  chance: 10.2,
};

function breedingFixture() {
  const save = createNewGameSave("Target outcome", 0);
  const creatures = save.creatures!.map(creature => ({
    ...creature, energy: creature.maxEnergy, hearts: creature.maxHearts,
  }));
  const [giver, receiver] = creatures;
  assert.ok(giver && receiver);
  return { save: { ...save, creatures }, giver, receiver };
}

function pregnancyFixture() {
  const fixture = breedingFixture();
  const parents = getBreedingParticipants(fixture.save);
  const giver = parents.find(participant => participant.participantId === fixture.giver.creatureId)!;
  const receiver = parents.find(participant => participant.participantId === fixture.receiver.creatureId)!;
  return {
    ...fixture,
    pregnancy: createPregnancyRecord(fixture.save, giver, receiver, "target-outcome"),
  };
}

test("target outcome uses the actual talent and grade, including mutation provenance", () => {
  const { pregnancy } = pregnancyFixture();
  const gradeB = createGeneralTalent("light_footed", "B");
  const origin = { kind: "mutation" } as const;
  const inheritance = { ...pregnancy.inheritance, projectedAbilities: [{ ...gradeB, inheritanceOrigin: origin }] };
  const result = resolveInheritanceTargetOutcome(gradeTarget, inheritance);
  assert.equal(result.status, "missed");
  assert.deepEqual(result.actualTalent, { name: gradeB.name, grade: "B", origin: "mutation" });
  assert.equal(resolveInheritanceTargetOutcome({
    ...gradeTarget, target: { kind: "talent", id: gradeB.id },
  }, inheritance).status, "passed");
  assert.equal(resolveInheritanceTargetOutcome({
    target: { kind: "grade", grade: "B" }, label: "Any Grade B talent", chance: 10,
  }, inheritance).status, "passed");
  assert.equal(resolveInheritanceTargetOutcome(gradeTarget).status, "no-conception");
});

test("move targets distinguish successful direct inheritance from a missed recipe for the same move", () => {
  const { save, giver, receiver, pregnancy } = pregnancyFixture();
  const inheritance = rollBattleMoveInheritance({
    save, giver, receiver, childSpeciesId: pregnancy.inheritance.projectedSpeciesId, seed: "target-outcome",
  });
  const direct: BattleMoveInheritanceRoll = {
    moveId: "guardian_chorus", moveName: "Guardian Chorus", source: "giver",
    chance: 25, roll: 1, inherited: true, contributingMoveIds: [], reasons: [],
  };
  const recipe: BattleMoveInheritanceRoll = {
    ...direct, source: "combination", recipeId: "recipe_guardian_chorus", roll: 90, inherited: false,
  };
  const projected = {
    ...pregnancy.inheritance,
    battleMoveInheritance: { ...inheritance, rolls: [direct, recipe] },
  };
  assert.equal(resolveInheritanceTargetOutcome({
    target: { kind: "move", id: "parent-guardian_chorus" }, label: "Guardian Chorus", chance: 25,
  }, projected).status, "passed");
  assert.equal(resolveInheritanceTargetOutcome({
    target: { kind: "move", id: "recipe-recipe_guardian_chorus" }, label: "Guardian Chorus · Combination", chance: 25,
  }, projected).status, "missed");
});

test("the final attempt outcome survives egg delivery and save repair", () => {
  const { save, giver, receiver } = breedingFixture();
  save.flags.chapterOneGuidedReplay = true;
  const result = performBreedingAttempt(save, giver.creatureId, receiver.creatureId, gradeTarget);
  assert.ok(result);
  assert.equal(result.attempt.outcome, "pregnancy");
  const outcome = result.attempt.inheritanceTargetOutcome;
  assert.ok(outcome && outcome.status !== "no-conception");
  const pregnancy = result.save.pregnancies?.find(record => record.pregnancyId === result.attempt.pregnancyId);
  assert.deepEqual(pregnancy?.inheritance.inheritanceTargetOutcome, outcome);
  assert.deepEqual(result.save.breeding?.attempts.find(record => record.attemptId === result.attempt.attemptId)?.inheritanceTargetOutcome, outcome);

  const delivered = advanceNurseryDay({
    ...result.save,
    dayState: { ...result.save.dayState, dayNumber: result.save.dayState.dayNumber + 1 },
  }).save;
  const repaired = repairLoadedSave(JSON.parse(JSON.stringify(delivered)), save.slotIndex).save;
  assert.deepEqual(repaired.eggs?.find(egg => egg.sourcePregnancyId === pregnancy?.pregnancyId)?.inheritanceTargetOutcome, outcome);
});

test("a failed conception records a distinct result with no pregnancy or egg", (t) => {
  const { save, giver, receiver } = breedingFixture();
  save.flags.chapterOneGuidedSkipped = true;
  let timestamp = 1_790_000_000_000;
  t.mock.method(Date, "now", () => timestamp);
  for (let index = 0; index < 100; index += 1) {
    const result = performBreedingAttempt(save, giver.creatureId, receiver.creatureId, gradeTarget);
    assert.ok(result);
    if (result.attempt.outcome === "failed") {
      assert.equal(result.attempt.inheritanceTargetOutcome?.status, "no-conception");
      assert.equal(result.save.breeding?.attempts.find(record => record.attemptId === result.attempt.attemptId)?.inheritanceTargetOutcome?.status, "no-conception");
      assert.equal(result.save.pregnancies?.length, 0);
      assert.equal(result.save.eggs?.length, 0);
      return;
    }
    timestamp += 37;
  }
  assert.fail("Fixture must produce at least one failed conception");
});
