import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { getAmbitionCompletionReward } from "@/data/creatureAmbitionEvents";
import { CREATURE_AMBITIONS } from "@/data/creatureAmbitions";

test("every ambition category grants meaningful completion rewards", () => {
  for (const ambition of CREATURE_AMBITIONS) {
    const reward = getAmbitionCompletionReward(ambition);
    assert.ok(reward.gold > 0, `${ambition.name} should reward Gold`);
    assert.ok(reward.guildPoints > 0, `${ambition.name} should reward Guild Points`);
    assert.ok(reward.prestige > 0, `${ambition.name} should reward Legacy Prestige`);
  }
});

test("ambition completion rewards are idempotent and recorded in Chronicle prose", () => {
  const source = readFileSync(new URL("../src/data/creatureAmbitionEvents.ts", import.meta.url), "utf8");
  assert.match(source, /ambitionReward:/);
  assert.match(source, /if \(save\.flags\[key\] === true\) return save/);
  assert.match(source, /legacyPrestige/);
  assert.match(source, /The ranch earned/);
});

test("Coliseum career wrapper accepts detailed telemetry", () => {
  const source = readFileSync(new URL("../src/data/legacyExternalTransactions.ts", import.meta.url), "utf8");
  assert.match(source, /telemetry\?: CareerBattleParticipant\[\]/);
  assert.match(source, /normalizeParticipants/);
  assert.match(source, /participants: normalizeParticipants/);
});
