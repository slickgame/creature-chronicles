import assert from "node:assert/strict";
import test from "node:test";
import { applyBattleCareerResults } from "@/data/creatureCareerTransactions";
import { getCreaturePersonalityProfile } from "@/data/creaturePersonalities";
import {
  applyBattleTeamworkMorale,
  applyBreedingRelationshipAftermath,
  applyRanchWorkRelationshipEffects,
  applyTrainingRelationshipSupport,
  getBreedingRelationshipCompatibility,
} from "@/data/creatureRelationshipGameplay";
import {
  getCreatureRelationship,
  getCreatureRelationshipKind,
  getRelationshipsForCreature,
  normalizeCreatureRelationshipSave,
  recordCreatureRelationshipEvent,
} from "@/data/creatureRelationships";
import { createNewGameSave } from "@/lib/save/localSave";
import type { CreatureId } from "@/types/ids";
import type { RanchJobResult } from "@/types/ranchJobs";
import type { GameSave } from "@/types/save";

function buildAffinity(
  save: GameSave,
  leftId: CreatureId,
  rightId: CreatureId,
  eventPrefix: string,
  events: number,
): GameSave {
  let nextSave = save;
  for (let index = 0; index < events; index += 1) {
    nextSave = recordCreatureRelationshipEvent(nextSave, {
      eventKey: `${eventPrefix}:${index}`,
      creatureIds: [leftId, rightId],
      dayNumber: save.dayState.dayNumber,
      affinityDelta: 20,
    });
  }
  return nextSave;
}

test("relationship events are symmetric and idempotent", () => {
  const save = createNewGameSave("Relationship Tester", 0);
  const [left, right] = save.creatures ?? [];
  assert.ok(left && right);
  const event = {
    eventKey: "relationship:test:shared-shift",
    creatureIds: [left.creatureId, right.creatureId] as [typeof left.creatureId, typeof right.creatureId],
    dayNumber: save.dayState.dayNumber,
    affinityDelta: 7,
  };
  const once = recordCreatureRelationshipEvent(save, event);
  const twice = recordCreatureRelationshipEvent(once, event);
  const forward = getCreatureRelationship(twice, left.creatureId, right.creatureId);
  const reverse = getCreatureRelationship(twice, right.creatureId, left.creatureId);
  assert.deepEqual(forward, reverse);
  assert.equal(forward.affinity, 7);
  assert.equal(forward.sharedEvents, 1);
});

test("battle participants build shared team history", () => {
  const save = createNewGameSave("Battle Bond Tester", 0);
  const [left, right] = save.creatures ?? [];
  assert.ok(left && right);
  const updated = applyBattleCareerResults(save, {
    battleId: "social_battle_one",
    outcome: "victory",
    dayNumber: save.dayState.dayNumber,
    participants: [{ creatureId: left.creatureId }, { creatureId: right.creatureId }],
  });
  const relationship = getCreatureRelationship(updated, left.creatureId, right.creatureId);
  assert.equal(relationship.affinity, 2);
  assert.equal(relationship.sharedEvents, 1);
  assert.equal(getRelationshipsForCreature(updated, left.creatureId).length, 1);
});

test("birth history migration seeds family bonds", () => {
  const save = createNewGameSave("Family Bond Tester", 0);
  const [child, parent] = save.creatures ?? [];
  assert.ok(child && parent);
  const withBirth = {
    ...save,
    birthHistory: [{
      birthId: "birth_family_test",
      creatureId: child.creatureId,
      hatchedAtDayNumber: 3,
      parents: {
        giver: { creatureId: parent.creatureId },
        receiver: {},
      },
    }],
  } as unknown as GameSave;
  const normalized = normalizeCreatureRelationshipSave(withBirth);
  const relationship = getCreatureRelationship(normalized, child.creatureId, parent.creatureId);
  assert.equal(relationship.family, true);
  assert.ok(relationship.affinity >= 35);
  assert.equal(getCreatureRelationshipKind(relationship), "family");
});

test("shared Ranch work applies preference and friendship satisfaction once", () => {
  const save = createNewGameSave("Work Satisfaction Tester", 0);
  const [left, right] = save.creatures ?? [];
  assert.ok(left && right);
  const bonded = buildAffinity(save, left.creatureId, right.creatureId, "work-friends", 2);
  const leftProfile = getCreaturePersonalityProfile(bonded, left.creatureId);
  const rightProfile = getCreaturePersonalityProfile(bonded, right.creatureId);
  const prepared: GameSave = {
    ...bonded,
    creaturePersonalities: {
      ...bonded.creaturePersonalities!,
      profilesByCreatureId: {
        ...bonded.creaturePersonalities!.profilesByCreatureId,
        [String(left.creatureId)]: {
          ...leftProfile,
          preferredJobIds: ["comfort_care"],
          dislikedJobId: "field_hauling",
        },
        [String(right.creatureId)]: {
          ...rightProfile,
          preferredJobIds: ["comfort_care"],
          dislikedJobId: "field_hauling",
        },
      },
    },
  };
  const results: RanchJobResult[] = [left, right].map((creature) => ({
    jobId: "comfort_care",
    jobName: "Comfort Care",
    creatureId: creature.creatureId,
    creatureName: creature.nickname,
    goldReward: 0,
    guildPointReward: 0,
    affectionReward: 0,
    energyCost: 10,
    message: `${creature.nickname} completed Comfort Care.`,
  }));
  const leftAffection = left.affection;
  const first = applyRanchWorkRelationshipEffects(
    prepared,
    results,
    prepared.dayState.dayNumber,
  );
  const second = applyRanchWorkRelationshipEffects(
    first.save,
    first.results,
    prepared.dayState.dayNumber,
  );
  const updatedLeft = first.save.creatures?.find((creature) => creature.creatureId === left.creatureId);
  const repeatedLeft = second.save.creatures?.find((creature) => creature.creatureId === left.creatureId);
  assert.equal(updatedLeft?.affection, Math.min(100, leftAffection + 2));
  assert.equal(repeatedLeft?.affection, updatedLeft?.affection);
  assert.match(first.results[0].message, /Relationship satisfaction \+2 Affection/);
  assert.equal(getCreatureRelationship(first.save, left.creatureId, right.creatureId).affinity, 41);
});

test("an established friend provides idempotent Training Grounds support", () => {
  const save = createNewGameSave("Training Support Tester", 0);
  const [trainee, supporter] = save.creatures ?? [];
  assert.ok(trainee && supporter);
  const bonded = buildAffinity(save, trainee.creatureId, supporter.creatureId, "training-friends", 2);
  const first = applyTrainingRelationshipSupport(
    bonded,
    trainee.creatureId,
    "1:level_drill",
    bonded.dayState.dayNumber,
  );
  const second = applyTrainingRelationshipSupport(
    first.save,
    trainee.creatureId,
    "1:level_drill",
    bonded.dayState.dayNumber,
  );
  const firstTrainee = first.save.creatures?.find((creature) => creature.creatureId === trainee.creatureId);
  const secondTrainee = second.save.creatures?.find((creature) => creature.creatureId === trainee.creatureId);
  assert.equal(first.support?.supporterId, supporter.creatureId);
  assert.equal(firstTrainee?.affection, Math.min(100, trainee.affection + 1));
  assert.equal(secondTrainee?.affection, firstTrainee?.affection);
  assert.equal(
    getCreatureRelationship(second.save, trainee.creatureId, supporter.creatureId).affinity,
    41,
  );
});

test("breeding compatibility combines personality and relationship history", () => {
  const save = createNewGameSave("Breeding Compatibility Tester", 0);
  const [giver, receiver] = save.creatures ?? [];
  assert.ok(giver && receiver);
  const bonded = buildAffinity(save, giver.creatureId, receiver.creatureId, "breeding-bond", 4);
  const compatibility = getBreedingRelationshipCompatibility(
    bonded,
    giver.creatureId,
    receiver.creatureId,
  );
  assert.ok(compatibility);
  assert.ok(compatibility.score >= 0);
  const updated = applyBreedingRelationshipAftermath(
    bonded,
    compatibility,
    "pregnancy",
    "attempt-compatibility-one",
    bonded.dayState.dayNumber,
  );
  assert.equal(
    updated.flags["breedingCompatibility_attempt-compatibility-one"] !== undefined,
    true,
  );
  assert.ok(
    getCreatureRelationship(updated, giver.creatureId, receiver.creatureId).affinity > 80,
  );
});

test("victorious friends receive one battle teamwork morale reward", () => {
  const save = createNewGameSave("Battle Morale Tester", 0);
  const [left, right] = save.creatures ?? [];
  assert.ok(left && right);
  const bonded = buildAffinity(save, left.creatureId, right.creatureId, "battle-friends", 2);
  const first = applyBattleTeamworkMorale(
    bonded,
    "battle-morale-one",
    [left.creatureId, right.creatureId],
    "victory",
  );
  const second = applyBattleTeamworkMorale(
    first,
    "battle-morale-one",
    [left.creatureId, right.creatureId],
    "victory",
  );
  const firstLeft = first.creatures?.find((creature) => creature.creatureId === left.creatureId);
  const secondLeft = second.creatures?.find((creature) => creature.creatureId === left.creatureId);
  assert.equal(firstLeft?.affection, Math.min(100, left.affection + 1));
  assert.equal(secondLeft?.affection, firstLeft?.affection);
  assert.equal(first.flags["battleTeamworkMoraleCount_battle-morale-one"], 2);
});
