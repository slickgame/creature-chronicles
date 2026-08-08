import assert from "node:assert/strict";
import test from "node:test";
import { getBreedingParticipants } from "@/data/breedingCore";
import {
  donateCreatureToGuildContract,
  ensureCurrentGuildState,
  getEligibleCreaturesForContract,
  getGuildServiceAssignment,
  getGuildServiceReturnSummaryItems,
  getGuildServiceUnavailableReason,
} from "@/data/guild";
import { createDefaultRanchJobsState, getEligibleCreaturesForJob } from "@/data/ranchJobs";
import {
  getTrainingUnavailableReason,
  isCreatureAwayForTraining,
  startTrainingGroundsAssignment,
} from "@/data/trainingGrounds";
import { createNewGameSave } from "@/lib/save/localSave";
import type { GuildContract } from "@/types/guild";

function makeServiceFixture(tier: GuildContract["tier"] = "silver") {
  let save = ensureCurrentGuildState(createNewGameSave("Guild Service Tester", 0));
  const creature = save.creatures?.[0];
  const original = save.guild?.contracts[0];
  assert.ok(creature && original && save.guild);
  const serviceContract: GuildContract = {
    ...original,
    tier,
    type: "service_creature",
    category: "service",
    status: "available",
    title: "Temporary Guild Field Assignment",
    description: "A temporary assignment used to verify timed Guild service availability.",
    requirement: { kind: "any_creature", label: "Send any creature for service." },
    serviceEnergyCost: 1,
    serviceXpReward: 5,
    serviceAffectionReward: 1,
    submittedCreatureId: undefined,
    submittedCreatureName: undefined,
    completedAtDayNumber: undefined,
    serviceDurationDays: undefined,
    serviceReturnDayNumber: undefined,
  };
  const ranchJobs = createDefaultRanchJobsState();
  ranchJobs.assignments.security_patrol = [creature.creatureId];
  save = ensureCurrentGuildState({
    ...save,
    guild: { ...save.guild, contracts: [serviceContract, ...save.guild.contracts.slice(1)] },
    ranchJobs,
  });
  const normalized = save.guild?.contracts.find((contract) => contract.contractId === serviceContract.contractId);
  assert.ok(normalized);
  return { save, creature, contract: normalized };
}

test("service contracts advertise a tier-based time away before submission", () => {
  const bronze = makeServiceFixture("bronze").contract;
  const silver = makeServiceFixture("silver").contract;
  const gold = makeServiceFixture("gold").contract;
  assert.equal(bronze.serviceDurationDays, 1);
  assert.equal(silver.serviceDurationDays, 2);
  assert.equal(gold.serviceDurationDays, 3);
  assert.match(bronze.requirement.label, /Away for 1 day\./);
  assert.match(silver.requirement.label, /Away for 2 days\./);
  assert.match(gold.requirement.label, /Away for 3 days\./);
});

test("submitted service creatures stay visible but become unavailable to ranch systems", () => {
  const { save, creature, contract } = makeServiceFixture("silver");
  assert.ok(getEligibleCreaturesForContract(save, String(contract.contractId)).some((item) => item.creatureId === creature.creatureId));

  const result = donateCreatureToGuildContract(save, String(contract.contractId), String(creature.creatureId));
  assert.equal(result.ok, true);
  assert.ok(result.save.creatures?.some((item) => item.creatureId === creature.creatureId), "service work must not remove the creature from the roster");
  assert.ok(result.save.creatureIds.includes(creature.creatureId));
  assert.equal(result.save.ranchJobs?.assignments.security_patrol.includes(creature.creatureId), false, "service departure clears an existing chore assignment");

  const assignment = getGuildServiceAssignment(result.save, creature.creatureId);
  assert.ok(assignment);
  assert.equal(assignment.daysRemaining, 2);
  assert.equal(assignment.returnDayNumber, save.dayState.dayNumber + 2);
  assert.match(result.message, /away for 2 days/i);
  assert.match(result.message, new RegExp(`Ranch Day ${assignment.returnDayNumber}`));

  const unavailableReason = getGuildServiceUnavailableReason(result.save, creature.creatureId);
  assert.match(unavailableReason ?? "", /Guild service:/);
  assert.equal(getTrainingUnavailableReason(result.save, creature.creatureId), unavailableReason);
  assert.equal(isCreatureAwayForTraining(result.save, creature.creatureId), true);
  assert.equal(getEligibleCreaturesForJob(result.save, "security_patrol").some((item) => item.creatureId === creature.creatureId), false);

  const breedingParticipant = getBreedingParticipants(result.save).find((item) => item.creatureId === creature.creatureId);
  assert.ok(breedingParticipant);
  assert.equal(breedingParticipant.canBreed, false);
  assert.match(breedingParticipant.unavailableReason ?? "", /Guild service:/);

  const trainingAttempt = startTrainingGroundsAssignment(result.save, creature.creatureId, "level_drill");
  assert.equal(trainingAttempt.ok, false);
  assert.match(trainingAttempt.message, /cannot start training while away/i);
});

test("Guild service availability returns automatically on the promised Ranch Day", () => {
  const { save, creature, contract } = makeServiceFixture("silver");
  const submitted = donateCreatureToGuildContract(save, String(contract.contractId), String(creature.creatureId));
  assert.equal(submitted.ok, true);
  const assignment = getGuildServiceAssignment(submitted.save, creature.creatureId);
  assert.ok(assignment);

  const nextDay = {
    ...submitted.save,
    dayState: { ...submitted.save.dayState, dayNumber: submitted.save.dayState.dayNumber + 1 },
  };
  assert.ok(getGuildServiceUnavailableReason(nextDay, creature.creatureId));

  const returnDay = {
    ...submitted.save,
    dayState: { ...submitted.save.dayState, dayNumber: assignment.returnDayNumber },
  };
  assert.equal(getGuildServiceUnavailableReason(returnDay, creature.creatureId), null);
  assert.equal(getTrainingUnavailableReason(returnDay, creature.creatureId), null);
  assert.ok(getGuildServiceReturnSummaryItems(returnDay).some((item) => item.includes(creature.nickname)));
});

test("an active service assignment survives a weekly Request Board refresh", () => {
  const { save, creature, contract } = makeServiceFixture("gold");
  const submitted = donateCreatureToGuildContract(save, String(contract.contractId), String(creature.creatureId));
  assert.equal(submitted.ok, true);
  const assignment = getGuildServiceAssignment(submitted.save, creature.creatureId);
  assert.ok(assignment);

  const refreshed = ensureCurrentGuildState({
    ...submitted.save,
    dayState: {
      ...submitted.save.dayState,
      dayNumber: submitted.save.dayState.dayNumber + 1,
      weekNumber: submitted.save.dayState.weekNumber + 1,
    },
  });
  const preserved = getGuildServiceAssignment(refreshed, creature.creatureId);
  assert.ok(preserved);
  assert.equal(preserved.returnDayNumber, assignment.returnDayNumber);
});
