import assert from "node:assert/strict";
import test from "node:test";
import { createBattleState, previewBattleAction, resolveBattleTurn } from "@/data/battleEngine";
import { calculateBattleSecondaryEffectChance, getBattleSecondaryEffectChanceBreakdown } from "@/data/battleRoundRules";
import { createNewGameSave } from "./helpers/establishedSave.ts";

function createEffectFixture() {
  const [feline, canine, , , equine] = createNewGameSave("Effect chance", 0).creatures;
  const state = createBattleState({
    battleId: "effect-chance-12",
    playerCreatures: [{ ...equine, creatureId: "effect-caster" }, { ...feline, creatureId: "effect-ally" }],
    enemyCreatures: [
      { ...canine, creatureId: "effect-weak", nickname: "Lower resistance" },
      { ...canine, creatureId: "effect-resistant", nickname: "Higher resistance" },
    ],
  });
  const [actorId, allyId] = state.teams.player.combatantIds;
  const [weakId, resistantId] = state.teams.enemy.combatantIds;
  const actor = state.combatants[actorId];
  const moveIds = ["thunder_tread", "calming_neigh"];
  actor.loadout = { ...actor.loadout, equippedMoveIds: moveIds, learnedMoveIds: moveIds };
  Object.assign(actor.battleStats, { accuracy: 90, statusPower: 40, specialPower: 10 });
  Object.assign(state.combatants[weakId].battleStats, { evasion: 0, statusResist: 20 });
  Object.assign(state.combatants[resistantId].battleStats, { evasion: 20, statusResist: 60 });
  return { state, actorId, allyId, weakId, resistantId };
}

test("the secondary effect calculation preserves adjustment limits, roll limits, and guaranteed effects", () => {
  const { state, actorId, weakId } = createEffectFixture();
  const attacker = state.combatants[actorId].battleStats;
  const defender = state.combatants[weakId].battleStats;
  for (const [baseChance, statusPower, statusResist, raw, adjustment, unclampedChance, expected] of [
    [10, 10, 90, -40, -20, -10, 5],
    [90, 90, 10, 40, 20, 110, 95],
  ]) {
    const breakdown = getBattleSecondaryEffectChanceBreakdown(baseChance, { statusPower, statusResist });
    assert.deepEqual(breakdown, {
      mode: "hostile", baseChance, unclampedChance, effectChance: expected, bounds: { min: 5, max: 95 },
      matchup: { statusPower, statusResist, rawAdjustment: raw, adjustment, min: -20, max: 20 },
    });
    assert.equal(calculateBattleSecondaryEffectChance({ ...attacker, statusPower }, { ...defender, statusResist }, baseChance), expected);
  }
  assert.deepEqual(getBattleSecondaryEffectChanceBreakdown(100, { statusPower: 1, statusResist: 100 }), {
    mode: "guaranteed", baseChance: 100, unclampedChance: 100, effectChance: 100,
  });
  assert.equal(getBattleSecondaryEffectChanceBreakdown(-10).effectChance, 0);
});

test("area forecasts retain a separate hit and conditional effect roll for each target", () => {
  const { state, actorId, allyId, weakId, resistantId } = createEffectFixture();
  const action = { actorId, moveId: "thunder_tread", targetIds: [weakId] };
  const before = structuredClone(state);
  const preview = previewBattleAction(state, action);
  assert.ok(preview.filter(row => row.effectType === "damage").every(row => row.effectChanceBreakdown === undefined));
  const chances = preview.filter(row => row.effectStatus === "slowed");
  assert.deepEqual(chances.map(row => [row.targetId, row.hitChance, row.requiresHit, row.effectChance, row.effectChanceBreakdown?.matchup?.adjustment]), [
    [weakId, 86, true, 40, 10], [resistantId, 73, true, 20, -10],
  ]);
  assert.deepEqual(chances.map(row => row.effectChanceBreakdown?.baseChance), [30, 30]);
  assert.deepEqual(state, before);

  const result = resolveBattleTurn(state, [actorId, allyId, weakId, resistantId], action);
  assert.ok(result);
  assert.deepEqual(result.result.actions[0].hitTargetIds, [weakId, resistantId]);
  assert.deepEqual(result.frames.flatMap(frame => frame.statusOutcome?.status === "slowed"
    ? [[frame.targetIds[0], frame.statusOutcome.result]] : []), [[weakId, "applied"], [resistantId, "failed"]]);
});

test("friendly cleanses use the authored chance without a hostile matchup or hit roll", () => {
  const { state, actorId, allyId } = createEffectFixture();
  state.combatants[actorId].battleStats.statusPower = 1000;
  state.combatants[allyId].battleStats.statusResist = 1;
  state.combatants[allyId].statuses = [{ status: "exhausted", duration: 2 }];
  const preview = previewBattleAction(state, { actorId, moveId: "calming_neigh", targetIds: [allyId] });
  const cleanse = preview.find(row => row.targetId === allyId && row.effectType === "cleanse_status");
  assert.ok(cleanse);
  assert.deepEqual(cleanse.effectChanceBreakdown, {
    mode: "friendly", baseChance: 40, unclampedChance: 40, effectChance: 40, bounds: { min: 0, max: 100 },
  });
  assert.deepEqual([cleanse.requiresHit, cleanse.hitBreakdown, cleanse.effectStatus, cleanse.cleansedStatuses], [false, undefined, "exhausted", ["exhausted"]]);
  const inspired = preview.find(row => row.targetId === allyId && row.effectType === "apply_status");
  assert.equal(inspired?.effectChance, 100);
  assert.equal(inspired?.effectChanceBreakdown, undefined);
});
