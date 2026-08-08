import assert from "node:assert/strict";
import test from "node:test";
import { getCreatureCareerRecord } from "@/data/creatureCareerRecords";
import { getCreatureMemories } from "@/data/creatureMemories";
import {
  donateCreatureToGuildContract,
  ensureCurrentGuildState,
  getEligibleCreaturesForContract,
} from "@/data/guild";
import { createNewGameSave } from "@/lib/save/localSave";

test("a live Guild submission updates Career and Memory records", () => {
  const save = ensureCurrentGuildState(createNewGameSave("Guild Legacy Tester", 0));
  const contract = save.guild?.contracts.find((candidate) =>
    getEligibleCreaturesForContract(save, String(candidate.contractId)).length > 0,
  );
  assert.ok(contract, "fixture requires one contract with an eligible starter creature");
  const creature = getEligibleCreaturesForContract(save, String(contract.contractId))[0];
  assert.ok(creature);

  const result = donateCreatureToGuildContract(save, String(contract.contractId), String(creature.creatureId));
  assert.equal(result.ok, true);
  const career = getCreatureCareerRecord(result.save, creature.creatureId);
  assert.equal(career.guildRequestsCompleted, 1);
  assert.equal(career.featuredGuildRequestsCompleted, contract.tier === "gold" ? 1 : 0);
  assert.ok(
    getCreatureMemories(result.save, creature.creatureId).some(
      (memory) => memory.sourceKey === `guild-request:${String(contract.contractId)}:${String(creature.creatureId)}`,
    ),
  );
});

test("replaying the same completed contract does not duplicate Guild Career credit", () => {
  const save = ensureCurrentGuildState(createNewGameSave("Guild Duplicate Tester", 0));
  const contract = save.guild?.contracts.find((candidate) =>
    getEligibleCreaturesForContract(save, String(candidate.contractId)).length > 0,
  );
  assert.ok(contract);
  const creature = getEligibleCreaturesForContract(save, String(contract.contractId))[0];
  assert.ok(creature);
  const first = donateCreatureToGuildContract(save, String(contract.contractId), String(creature.creatureId));
  assert.equal(first.ok, true);
  const second = donateCreatureToGuildContract(first.save, String(contract.contractId), String(creature.creatureId));
  assert.equal(second.ok, false);
  assert.equal(getCreatureCareerRecord(first.save, creature.creatureId).guildRequestsCompleted, 1);
});
