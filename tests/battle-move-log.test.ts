import assert from "node:assert/strict";
import test from "node:test";
import { createBattleState, resolveBattleRound, resolveBattleTurn } from "@/data/battleEngine";
import { appendBattleLog, getBattleLogEventCategory } from "@/data/battleLog";
import type { BattleAction, BattleMoveId } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import { createNewGameSave } from "./helpers/establishedSave.ts";

function fixture(moveId: BattleMoveId) {
  const [feline, canine, bovine, lapine, equine] = createNewGameSave("Move log", 0).creatures!;
  function creature(source: CreatureRecord, nickname: string): CreatureRecord {
    return { ...source, creatureId: nickname as CreatureRecord["creatureId"], nickname };
  }
  const state = createBattleState({
    battleId: "move-log",
    playerCreatures: [creature(equine, "Briar"), creature(feline, "Rowan"), creature(canine, "Willow")],
    enemyCreatures: [creature(feline, "Moss"), creature(bovine, "Bramble"), creature(lapine, "Lilt")],
  });
  const [actorId] = state.teams.player.combatantIds;
  state.combatants[actorId].loadout.equippedMoveIds = ["strike", "defend", moveId];
  state.combatants[actorId].maxBattleEnergy = 100;
  state.combatants[actorId].currentBattleEnergy = 100;
  return state;
}

test("move log records actual damage, misses, status duration and knockout on the original target rows", () => {
  const state = fixture("thunder_tread");
  const [actorId] = state.teams.player.combatantIds;
  const [slowedId, knockoutId, missedId] = state.teams.enemy.combatantIds;
  const actor = state.combatants[actorId];
  actor.battleStats.accuracy = 1000;
  actor.battleStats.statusPower = 1000;
  state.combatants[slowedId].maxHp = state.combatants[slowedId].currentHp = 1000;
  state.combatants[knockoutId].currentHp = 1;
  state.combatants[missedId].battleStats.evasion = 10000;
  const action: BattleAction = { actorId, moveId: "thunder_tread", targetIds: [] };
  const before = structuredClone(state);
  const resolved = Array.from({ length: 20 }, (_, seed) =>
    resolveBattleTurn({ ...state, battleId: `move-log-${seed}` }, [actorId, slowedId], action))
    .find(result => result?.state.moveLog?.[0]?.targets[0].statuses[0]?.result === "applied" &&
      result.state.moveLog[0].targets[2].hit === false);
  assert.ok(resolved);
  assert.deepEqual(state, before);
  const { state: settled } = resolved;
  const [group] = settled.moveLog!;
  assert.equal(group.roundNumber, 1);
  assert.equal(group.logIndex, state.log.length);
  assert.equal(group.endLogIndex, settled.log.length);
  assert.equal(settled.log[group.logIndex], "Briar uses Thunder Tread.");
  const [slowed, knockout, missed] = group.targets;
  assert.deepEqual(group.targets.map(target => target.targetId), [slowedId, knockoutId, missedId]);
  assert.equal(slowed.hit, true);
  assert.equal(slowed.hpDelta, settled.combatants[slowedId].currentHp - state.combatants[slowedId].currentHp);
  assert.ok(slowed.hpDelta < 0);
  assert.deepEqual(slowed.statuses.map(({ status, result, duration }) => [status, result, duration]), [
    ["slowed", "applied", 2],
  ]);
  assert.ok(slowed.logIndexes.some(index => getBattleLogEventCategory(settled, index) === "status-changes"));
  assert.equal(knockout.hit, true);
  assert.equal(knockout.hpDelta, -1);
  assert.equal(knockout.knockedOut, true);
  assert.deepEqual(knockout.statuses, []);
  assert.ok(knockout.logIndexes.some(index => getBattleLogEventCategory(settled, index) === "knockouts"));
  assert.equal(missed.hit, false);
  assert.equal(missed.hpDelta, 0);
  assert.equal(missed.knockedOut, false);
  assert.deepEqual(missed.statuses, []);
  assert.equal(missed.logIndexes.length, 1);
  assert.match(settled.log[missed.logIndexes[0]], /misses Lilt/);
  assert.deepEqual(group.targets.flatMap(target => target.logIndexes).sort((left, right) => left - right),
    Array.from({ length: group.endLogIndex - group.logIndex - 1 }, (_, index) => group.logIndex + index + 1));
});

test("move log uses actual capped support deltas and keeps round-end recovery out of the group", () => {
  const state = fixture("restorative_rhythm");
  const [actorId, injuredId, healthyId] = state.teams.player.combatantIds;
  const [enemyId] = state.teams.enemy.combatantIds;
  state.combatants[actorId].currentHp -= 7;
  state.combatants[injuredId].currentHp -= 4;
  state.combatants[actorId].statuses = [{ status: "exhausted", duration: 2 }];
  state.combatants[healthyId].statuses = [{ status: "weakened", duration: 1 }];
  state.combatants[enemyId].statuses = [{ status: "bleed", duration: 1, amount: 5 }];
  const healed = resolveBattleTurn(state, [actorId], { actorId, moveId: "restorative_rhythm", targetIds: [] });
  assert.ok(healed);
  const [group] = healed.state.moveLog!;
  assert.deepEqual(group.targets.map(({ hpDelta, hpWasFull, hit, statuses }) => ({
    hpDelta,
    hpWasFull,
    hit,
    statuses: statuses.map(({ status, result }) => [status, result]),
  })), [
    { hpDelta: 7, hpWasFull: undefined, hit: undefined, statuses: [["exhausted", "cleared"]] },
    { hpDelta: 4, hpWasFull: undefined, hit: undefined, statuses: [] },
    { hpDelta: 0, hpWasFull: true, hit: undefined, statuses: [["weakened", "cleared"]] },
  ]);
  assert.ok(healed.state.log.slice(group.endLogIndex).some(line => line.includes("bleed damage")));
  assert.ok(healed.state.log.slice(group.endLogIndex).some(line => line.includes("expired")));
  assert.ok(healed.state.log.slice(group.endLogIndex).some(line => line.includes("regenerates")));

  const energyState = fixture("champion_command");
  const [energyActorId, almostFullId, fullId] = energyState.teams.player.combatantIds;
  energyState.combatants[almostFullId].currentBattleEnergy -= 3;
  const energy = resolveBattleTurn(energyState, [energyActorId, enemyId], {
    actorId: energyActorId, moveId: "champion_command", targetIds: [],
  });
  assert.ok(energy);
  assert.deepEqual(energy.state.moveLog![0].targets.map(({ targetId, battleEnergyDelta, battleEnergyWasFull }) =>
    [targetId, battleEnergyDelta, battleEnergyWasFull]), [
    [energyActorId, 12, undefined], [almostFullId, 3, undefined], [fullId, 0, true],
  ]);
});

test("round queue move groups preserve earlier rows and exclude fallback notices, skipped moves and recovery", () => {
  const state = fixture("strike");
  const [actorId, stunnedId] = state.teams.player.combatantIds;
  state.combatants[stunnedId].statuses = [{ status: "stun", duration: 1 }];
  const actions = Object.values(state.combatants).map(({ battleCombatantId }) => ({
    actorId: battleCombatantId,
    moveId: battleCombatantId === actorId ? "invalid_move" : "defend",
    targetIds: [battleCombatantId],
  }));
  const initial = appendBattleLog(state, ["An item was used."]);
  const first = resolveBattleRound(initial, actions);
  const moveLog = first.state.moveLog!;
  assert.equal(moveLog.length, 5);
  assert.equal(first.state.log[1], "An item was used.");
  assert.equal(first.state.log[2], "Round 1 begins.");
  assert.deepEqual(moveLog.map(({ actorId }) => actorId),
    first.result.actions.filter(action => action.success).map(action => action.actorId));
  assert.ok(first.state.log.some((line, index) => line.includes("stunned") &&
    moveLog.every(group => index < group.logIndex || index >= group.endLogIndex)));
  for (const [index, group] of moveLog.entries()) {
    assert.equal(first.state.log[group.logIndex], `${group.actorName} uses ${group.moveName}.`);
    assert.ok(group.endLogIndex <= (moveLog[index + 1]?.logIndex ?? first.state.log.length));
    assert.ok(first.state.log.slice(group.logIndex, group.endLogIndex).every(line => !line.includes("fallback")));
  }
  assert.ok(first.state.log.slice(moveLog.at(-1)!.endLogIndex).some(line => line.includes("expired")));
  const second = resolveBattleRound(first.state, actions);
  assert.deepEqual(second.state.moveLog?.slice(0, moveLog.length), moveLog);
  assert.ok(second.state.moveLog?.slice(moveLog.length).every(group =>
    group.roundNumber === 2 && group.logIndex > first.state.log.length));
  assert.equal(state.moveLog, undefined);
});
