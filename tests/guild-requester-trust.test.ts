import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  applyGuildTrustContractCompletion,
  donateCreatureToGuildContract,
  ensureCurrentGuildState,
  getGuildRequesterDefinition,
  getGuildRequesterProgression,
  getGuildRequesterTrustReward,
  getGuildRequesterTrustSummary,
  getGuildTrustBonusContractCount,
} from "@/data/guild";
import { getChronicleEntries } from "@/data/creatureMemories";
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

test("personal Trust has readable relationship tiers and is visible in Request Board request details", () => {
  let save = ensureCurrentGuildState(createNewGameSave("Trust UI Tester", 0));
  const contract = save.guild?.contracts.find((item) => item.requesterId === "selene_virell") ?? save.guild?.contracts[0];
  assert.ok(contract);
  const requester = getGuildRequesterDefinition(contract);
  save = grantNpcTrust(save, requester.npcId, 50);
  assert.match(getGuildRequesterTrustSummary(save, contract), /Trusted/);
  const progression = getGuildRequesterProgression(save, contract);
  assert.ok(progression);
  assert.equal(progression.tierLabel, "Trusted");
  assert.ok(progression.currentUnlock.length > 0);
  assert.equal(progression.nextThreshold, 90);

  const advisorSource = readFileSync("src/features/guild/GuildAmbitionAdvisor.tsx", "utf8");
  assert.match(advisorSource, /data-guild-requester-trust="true"/);
  assert.match(advisorSource, /data-guild-trust-progression="true"/);
  assert.match(advisorSource, /Current relationship benefit/);
  assert.match(advisorSource, /Next Trust unlock/);
  assert.match(advisorSource, /<small>Posted by<\/small>/);
  assert.match(advisorSource, /requesterDefinition\.portraitPath/);
  assert.match(advisorSource, /requesterDefinition\.title/);
  assert.match(advisorSource, /getGuildRequesterTrustReward/);
  assert.match(advisorSource, /Completion \+\{trustReward\} Trust/);
  assert.match(advisorSource, /data-contract-detail-modal="flyer"/);
});

test("Familiar requester Trust adds rotating personal Guild requests without replacing the weekly board", () => {
  let save = ensureCurrentGuildState(createNewGameSave("Trust Pool Tester", 0));
  const baseCount = save.guild?.contracts.length ?? 0;
  save = grantNpcTrust(save, "mara_vell", 20);
  save = ensureCurrentGuildState(save);
  assert.equal(getGuildTrustBonusContractCount(save), 1);
  const personal = save.guild?.contracts.find((contract) => String(contract.contractId).startsWith(`guild_trust_${save.dayState.weekNumber}_mara_vell`));
  assert.ok(personal);
  assert.equal(personal.requesterName, "Mara Vell");
  assert.equal(personal.type, "service_creature");
  assert.equal(personal.tier, "silver");
  assert.ok((save.guild?.contracts.length ?? 0) > baseCount);
});

test("Favored Trust upgrades an NPC personal request to Gold with stronger relationship rewards", () => {
  let save = ensureCurrentGuildState(createNewGameSave("Favored Pool Tester", 0));
  save = grantNpcTrust(save, "petra_hale", 90);
  save = ensureCurrentGuildState(save);
  const personal = save.guild?.contracts.find((contract) => String(contract.contractId).includes("petra_hale"));
  assert.ok(personal);
  assert.equal(personal.tier, "gold");
  assert.equal(personal.requesterName, "Petra Hale");
  assert.ok(personal.guildPointReward >= 30);
});

test("crossing a requester Trust tier announces the deeper relationship and records it in the Chronicle", () => {
  let save = ensureCurrentGuildState(createNewGameSave("Trust Level Up Tester", 0));
  const creature = save.creatures?.[0];
  const original = save.guild?.contracts[0];
  assert.ok(creature && original);
  save = grantNpcTrust(save, "mara_vell", 18);
  save = withContract(save, {
    ...original,
    tier: "bronze",
    type: "service_creature",
    category: "service",
    requesterId: "mara_vell",
    requesterName: "Mara Vell",
    trustTarget: "Mara Vell",
    title: "Mara Trust Threshold Test",
    description: "A small Guild job used to cross the Familiar threshold.",
    requirement: { kind: "any_creature", label: "Send any creature." },
    serviceEnergyCost: 1,
    serviceXpReward: 1,
    serviceAffectionReward: 1,
    status: "available",
    requesterTrustAwarded: undefined,
    requesterTrustAwardedAtDayNumber: undefined,
  });
  const result = donateCreatureToGuildContract(save, String(original.contractId), String(creature.creatureId));
  assert.equal(result.ok, true);
  assert.equal(result.save.townNpcTrust?.mara_vell?.level, 2);
  assert.match(result.message, /Relationship Deepened — Mara Vell/);
  assert.match(result.message, /Familiar/);
  assert.ok(getChronicleEntries(result.save).some((entry) => entry.sourceKey === "guild-requester-trust-tier:mara_vell:2"));
});

test("Trusted Selene unlocks a sequential three-stage personal lineage chain", () => {
  let save = ensureCurrentGuildState(createNewGameSave("Selene Chain Tester", 0));
  save = grantNpcTrust(save, "selene_virell", 50);
  save = ensureCurrentGuildState(save);
  const stage1 = save.guild?.contracts.find((contract) => String(contract.contractId) === "guild_personal_selene_lineage_1");
  assert.ok(stage1);
  assert.equal(stage1.requesterName, "Dr. Selene Virell");
  assert.equal(stage1.tier, "silver");
  assert.match(stage1.title, /Lineage Calibration/);

  const creature = save.creatures?.[0];
  assert.ok(creature);
  const prepared = {
    ...save,
    creatures: (save.creatures ?? []).map((entry) => entry.creatureId === creature.creatureId
      ? { ...entry, stats: { ...entry.stats, FER: Math.max(entry.stats.FER, 10) }, energy: Math.max(entry.energy, 40) }
      : entry),
  };
  const stage1Result = donateCreatureToGuildContract(prepared, String(stage1.contractId), String(creature.creatureId));
  assert.equal(stage1Result.ok, true);
  assert.equal(Boolean(stage1Result.save.flags.guildSeleneLineageStage1), true);
  assert.ok((Number(stage1Result.save.flags.nurserySupplyKits ?? 0)) >= 1);
  assert.ok(stage1Result.save.guild?.contracts.some((contract) => String(contract.contractId) === "guild_personal_selene_lineage_2"));
  assert.match(stage1Result.message, /Selene personal quest 1\/3 complete/);
});

test("Selene lineage capstone is duplicate-safe and unlocks a permanent consultation flag", () => {
  let save = ensureCurrentGuildState(createNewGameSave("Selene Capstone Tester", 0));
  save = grantNpcTrust(save, "selene_virell", 50);
  save = {
    ...save,
    flags: {
      ...save.flags,
      guildSeleneLineageStage1: true,
      guildSeleneLineageStage2: true,
    },
  };
  save = ensureCurrentGuildState(save);
  const stage3 = save.guild?.contracts.find((contract) => String(contract.contractId) === "guild_personal_selene_lineage_3");
  const creature = save.creatures?.[0];
  assert.ok(stage3 && creature);
  const first = applyGuildTrustContractCompletion(save, stage3, creature.creatureId);
  assert.equal(Boolean(first.save.flags.guildSeleneLineageStage3), true);
  assert.equal(Boolean(first.save.flags.seleneLineageConsultationUnlocked), true);
  assert.match(first.message, /Lineage Consultation/);
  const kits = Number(first.save.flags.nurserySupplyKits ?? 0);
  const second = applyGuildTrustContractCompletion(first.save, stage3, creature.creatureId);
  assert.equal(Number(second.save.flags.nurserySupplyKits ?? 0), kits);
  assert.equal(second.message, "");
});
