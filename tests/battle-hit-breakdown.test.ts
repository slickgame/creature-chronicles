import assert from "node:assert/strict";
import test from "node:test";
import { createBattleState, getEffectiveBattleStats, previewBattleAction, resolveBattleTurn } from "@/data/battleEngine";
import { getBattleMove } from "@/data/battleMoves";
import { calculateBattleMoveHitChance, getBattleMoveHitChanceBreakdown } from "@/data/battleRoundRules";
import { createNewGameSave } from "./helpers/establishedSave.ts";

function createHitFixture() {
  const [attacker, defender] = createNewGameSave("Hit forecast", 0).creatures;
  const state = createBattleState({
    battleId: "hit-chance-forecast",
    playerCreatures: [{ ...attacker, creatureId: "hit-forecast-attacker", nickname: "Attacker" }],
    enemyCreatures: [
      { ...defender, creatureId: "hit-forecast-defender", nickname: "Defender" },
      { ...defender, creatureId: "hit-forecast-second", nickname: "Second" },
    ],
  });
  const [actorId] = state.teams.player.combatantIds;
  const [targetId, secondTargetId] = state.teams.enemy.combatantIds;
  const actor = state.combatants[actorId];
  const target = state.combatants[targetId];
  const moveIds = ["strike", "focused_stare", "protective_lunge", "defend"];
  actor.loadout = { ...actor.loadout, learnedMoveIds: moveIds, equippedMoveIds: moveIds };
  return { state, actor, actorId, target, targetId, secondTargetId };
}

test("status-only moves share one hit breakdown without merging the conditional effect chance", () => {
  const { state, actor, actorId, target, targetId } = createHitFixture();
  Object.assign(actor.battleStats, { accuracy: 106, statusPower: 50 });
  Object.assign(target.battleStats, { evasion: 20, statusResist: 70 });
  const action = { actorId, targetIds: [targetId], moveId: "focused_stare" };
  const before = structuredClone(state);
  const [mark, slow] = previewBattleAction(state, action);
  const breakdown = mark.hitBreakdown;
  assert.ok(breakdown);
  assert.deepEqual([breakdown.baseAccuracy, breakdown.attackerAccuracy, breakdown.targetEvasion], [92, 106, 20]);
  assert.deepEqual(breakdown.modifiers.map(({ kind, points, before, after }) => [kind, points, before, after]), [
    ["accuracy", 7, 92, 99],
    ["evasion", -13, 99, 86],
    ["precision", 5, 86, 91],
    ["status-matchup", -7, 91, 84],
  ]);
  assert.equal(breakdown.unclampedChance, 84);
  assert.equal(breakdown.hitChance, calculateBattleMoveHitChance(getEffectiveBattleStats(actor), getEffectiveBattleStats(target), getBattleMove(action.moveId)));
  assert.equal(mark.effectChance, 100);
  assert.equal(slow.hitBreakdown, breakdown);
  assert.equal(slow.hitChance, 84);
  assert.equal(slow.statusApplication?.effectChance, 25);
  assert.equal(slow.statusApplication?.requiresHit, true);
  assert.equal(mark.damageBreakdown, undefined);
  assert.deepEqual(state, before);
});

test("hit breakdown shows neutral stats and the engine's lower and upper bounds", () => {
  const { state, actor, actorId, target, targetId, secondTargetId } = createHitFixture();
  const move = getBattleMove("strike");
  const neutral = getBattleMoveHitChanceBreakdown({ ...actor.battleStats, accuracy: 90 }, { ...target.battleStats, evasion: 0 }, move);
  assert.equal(neutral.hitChance, 95);
  assert.deepEqual(neutral.modifiers.map(({ kind, points }) => [kind, points]), [["accuracy", 0], ["evasion", 0]]);
  const high = getBattleMoveHitChanceBreakdown({ ...actor.battleStats, accuracy: 1000 }, { ...target.battleStats, evasion: 0 }, move);
  assert.deepEqual([high.unclampedChance, high.hitChance], [505, 100]);
  assert.deepEqual(high.modifiers.at(-1), { kind: "bounds", label: "Hit chance limit", points: -405, before: 505, after: 100 });

  actor.battleStats.accuracy = 1;
  target.battleStats.evasion = 1000;
  const action = { actorId, targetIds: [targetId], moveId: "strike" };
  const [preview] = previewBattleAction(state, action);
  assert.deepEqual([preview.hitBreakdown?.unclampedChance, preview.hitChance], [-595, 5]);
  assert.equal(preview.hitBreakdown?.modifiers.at(-1)?.kind, "bounds");
  const resolved = resolveBattleTurn(state, [actorId, targetId, secondTargetId], action);
  assert.ok(resolved?.frames.some(frame => frame.kind === "miss" && frame.targetIds[0] === targetId));
  assert.ok(resolved?.result.log.some(line => line.includes(`(${preview.hitChance}% hit chance)`)));

  const cappedMatchup = getBattleMoveHitChanceBreakdown(
    { ...actor.battleStats, accuracy: 90, statusPower: 1000 },
    { ...target.battleStats, evasion: 0, statusResist: 1 },
    getBattleMove("focused_stare"),
  );
  assert.equal(cappedMatchup.modifiers.find(modifier => modifier.kind === "status-matchup")?.points, 15);
});

test("hit breakdown follows each legal enemy and stays off friendly effects", () => {
  const { state, actor, actorId, target, targetId, secondTargetId } = createHitFixture();
  actor.battleStats.accuracy = 90;
  target.battleStats.evasion = 0;
  const second = state.combatants[secondTargetId];
  second.battleStats.evasion = 20;
  second.statuses = [{ status: "slowed", duration: 1 }];
  const areaRows = previewBattleAction(state, { actorId, targetIds: [targetId], moveId: "thunder_tread" });
  assert.deepEqual(areaRows.filter(row => row.effectType === "damage").map(row => [row.targetId, row.hitBreakdown?.targetEvasion, row.hitChance]), [
    [targetId, 0, 86], [secondTargetId, 17, 75],
  ]);

  const [attack, selfGuard] = previewBattleAction(state, { actorId, targetIds: [targetId], moveId: "protective_lunge" });
  assert.ok(attack.hitBreakdown && attack.requiresHit);
  assert.equal(selfGuard.targetId, actorId);
  assert.deepEqual([selfGuard.requiresHit, selfGuard.hitChance, selfGuard.hitBreakdown], [false, 100, undefined]);

  Object.assign(target, { currentHp: 0, isFainted: true });
  const [fallback] = previewBattleAction(state, { actorId, targetIds: [targetId], moveId: "strike" });
  assert.equal(fallback.targetId, secondTargetId);
  assert.equal(fallback.hitBreakdown?.targetEvasion, 17);
});
