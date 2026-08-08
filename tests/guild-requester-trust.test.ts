import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  donateCreatureToGuildContract,
  ensureCurrentGuildState,
  getGuildRequesterDefinition,
  getGuildRequesterTrustReward,
  getGuildRequesterTrustSummary,
} from "@/data/guild";
import { GUILD_REQUESTERS } from "@/data/guildRequesters";
import { grantNpcTrust, TOWN_NPCS } from "@/data/townNpcs";
import { createNewGameSave } from "@/lib/save/localSave";
import type { GuildContract } from "@/types/guild";

function withContract(save: ReturnType<typeof createNewGameSave>, contract: GuildContract) {
  const synced = ensureCurrentGuildState(save);
  assert.ok(synced.guild);
  return ensureCurrentGuildState({
    ...synced,
    guild: {
      ...synced.guild,
      contracts: [contract, ...synced.guild.contracts.filter((item) => item.contractId !== contract.contractId)],
    },
  });
}

test("Guild normalization replaces placeholder roles with named town requesters", () => {
  const save = ensureCurrentGuildState(createNewGameSave("Named Requester Tester", 0));
  assert.ok(save.guild);
  const knownRequesterIds = new Set(Object.keys(GUILD_REQUESTERS));
  for (const contract of save.guild.contracts) {
    assert.ok(knownRequesterIds.has(contract.requesterId), `${contract.title} must use a named requester id`);
    assert.ok(!["Nursery Matron", "Town Clerk", "Ranger Captain", "Request Board", "Hearth Household"].includes(contract.requesterName));
    assert.equal(contract.requesterName, getGuildRequesterDefinition(contract).name);
    assert.equal(contract.trustTarget, contract.requesterName);
  }
  assert.equal(TOWN_NPCS.veyra.name, "Veyra Bramble");
});

test("legacy nursery, registry, ranger, household, and board requesters migrate deterministically", () => {
  const base = ensureCurrentGuildState(createNewGameSave("Legacy Requester Tester", 0));
  assert.ok(base.guild?.contracts[0]);
  const original = base.guild.contracts[0];
  const fixtures: Array<[string, string, GuildContract["category"], string]> = [
    ["nursery_matron", "Nursery Matron", "lineage", "selene_virell"],
    ["town_clerk", "Town Clerk", "registry", "maribel_quince"],
    ["ranger_captain", "Ranger Captain", "security", "kaida_thorn"],
    ["hearth_household", "Hearth Household", "general", "tamsin_vale"],
    ["guild_board", "Request Board", "general", "mara_vell"],
  ];

  for (const [requesterId, requesterName, category, expectedId] of fixtures) {
    const save = withContract(base, {
      ...original,
      requesterId,
      requesterName,
      trustTarget: requesterName,
      category,
      title: requesterName === "Town Clerk" ? "Town Clerk Rare Bloodline Request" : `${requesterName} Test Request`,
      description: `${requesterName} posted this older save request.`,
    });
    const migrated = save.guild?.contracts.find((item) => item.contractId === original.contractId);
    assert.ok(migrated);
    assert.equal(migrated.requesterId, expectedId);
    assert.equal(migrated.requesterName, TOWN_NPCS[expectedId as keyof typeof TOWN_NPCS].name);
    assert.doesNotMatch(migrated.title, /Nursery Matron|Town Clerk|Ranger Captain/);
  }
});

test("successful Guild completion grants personal requester Trust exactly once", () => {
  let save = ensureCurrentGuildState(createNewGameSave("Trust Completion Tester", 0));
  const creature = save.creatures?.[0];
  const original = save.guild?.contracts[0];
  assert.ok(creature && original && save.guild);
  save = withContract(save, {
    ...original,
    tier: "silver",
    type: "service_creature",
    category: "registry",
    requesterId: "town_clerk",
    requesterName: "Town Clerk",
    trustTarget: "Town",
    status: "available",
    title: "Registry Inspection Escort",
    description: "The town clerk needs a helper.",
    requirement: { kind: "any_creature", label: "Send any creature for service." },
    serviceEnergyCost: 1,
    serviceXpReward: 1,
    serviceAffectionReward: 1,
    requesterTrustAwarded: undefined,
    requesterTrustAwardedAtDayNumber: undefined,
  });

  const result = donateCreatureToGuildContract(save, String(original.contractId), String(creature.creatureId));
  assert.equal(result.ok, true);
  const completed = result.save.guild?.contracts.find((item) => item.contractId === original.contractId);
  assert.ok(completed);
  assert.equal(completed.requesterId, "maribel_quince");
  assert.equal(completed.requesterName, "Maribel Quince");
  assert.equal(completed.requesterTrustAwarded, getGuildRequesterTrustReward(completed));
  const pointsAfterCompletion = result.save.townNpcTrust?.maribel_quince?.points ?? 0;
  assert.equal(pointsAfterCompletion, completed.requesterTrustAwarded);
  assert.match(result.message, /Maribel Quince Trust \+/);

  const normalizedAgain = ensureCurrentGuildState(result.save);
  assert.equal(normalizedAgain.townNpcTrust?.maribel_quince?.points, pointsAfterCompletion);
  const duplicate = donateCreatureToGuildContract(normalizedAgain, String(original.contractId), String(creature.creatureId));
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.save.townNpcTrust?.maribel_quince?.points, pointsAfterCompletion);
});

test("older completed contracts receive one retroactive named-requester Trust award", () => {
  let save = ensureCurrentGuildState(createNewGameSave("Retroactive Trust Tester", 0));
  const original = save.guild?.contracts[0];
  assert.ok(original && save.guild);
  save = {
    ...save,
    guild: {
      ...save.guild,
      contracts: [{
        ...original,
        tier: "bronze",
        category: "security",
        requesterId: "ranger_captain",
        requesterName: "Ranger Captain",
        trustTarget: "Rangers",
        status: "completed",
        completedAtDayNumber: save.dayState.dayNumber,
        requesterTrustAwarded: undefined,
        requesterTrustAwardedAtDayNumber: undefined,
      }, ...save.guild.contracts.slice(1)],
    },
  };

  const migrated = ensureCurrentGuildState(save);
  const completed = migrated.guild?.contracts.find((item) => item.contractId === original.contractId);
  assert.ok(completed);
  assert.equal(completed.requesterId, "kaida_thorn");
  assert.equal(completed.requesterTrustAwarded, 2);
  assert.equal(migrated.townNpcTrust?.kaida_thorn?.points, 2);
  const secondPass = ensureCurrentGuildState(migrated);
  assert.equal(secondPass.townNpcTrust?.kaida_thorn?.points, 2);
});

test("personal Trust has readable relationship tiers and is visible in Request Board recommendations", () => {
  let save = ensureCurrentGuildState(createNewGameSave("Trust UI Tester", 0));
  const contract = save.guild?.contracts.find((item) => item.requesterId === "selene_virell") ?? save.guild?.contracts[0];
  assert.ok(contract);
  const requester = getGuildRequesterDefinition(contract);
  save = grantNpcTrust(save, requester.npcId, 50);
  assert.match(getGuildRequesterTrustSummary(save, contract), /Trusted/);

  const advisorSource = readFileSync("src/features/guild/GuildAmbitionAdvisor.tsx", "utf8");
  assert.match(advisorSource, /data-guild-requester-trust="true"/);
  assert.match(advisorSource, /Requester:/);
  assert.match(advisorSource, /Completion \+\{getGuildRequesterTrustReward\(contract\)\} Trust/);
});
