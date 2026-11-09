import assert from "node:assert/strict";
import test from "node:test";
import { createBattleState, getBattleStatusTimingForecast, previewBattleAction, resolveBattleTurn } from "@/data/battleEngine";
import { getBattleLogEventCategory } from "@/data/battleLog";
import type { BattleStatusStack } from "@/types/battle";
import { createNewGameSave } from "./helpers/establishedSave.ts";

test("round-end playback records actual Bleed damage, expiries, and Battle Energy recovery in order", () => {
  const [caster, affected, persistent, enemy] = createNewGameSave("Recovery", 0).creatures!;
  const state = createBattleState({
    battleId: "round-end-effect-playback",
    playerCreatures: [caster, affected, persistent],
    enemyCreatures: [enemy],
  });
  const [actorId, affectedId, persistentId] = state.teams.player.combatantIds;
  const [targetId] = state.teams.enemy.combatantIds;
  state.combatants[affectedId].currentHp = 7;
  state.combatants[affectedId].currentBattleEnergy = 0;
  state.combatants[affectedId].statuses = [
    { status: "bleed", duration: 1, amount: 5, stacks: 3 },
    { status: "slowed", duration: 1 },
    { status: "weakened", stat: "physicalPower", duration: 1 },
    { status: "weakened", stat: "specialPower", duration: 2 },
  ];
  const maxBattleEnergy = state.combatants[persistentId].maxBattleEnergy;
  state.combatants[persistentId].currentBattleEnergy = maxBattleEnergy - 1;
  state.combatants[persistentId].statuses = [
    { status: "bleed", duration: 2, amount: 4, stacks: 2 },
    { status: "inspired", duration: 1 },
  ];

  const resolved = resolveBattleTurn(state, [actorId], { actorId, moveId: "strike", targetIds: [targetId] });
  assert.ok(resolved);
  const affectedFrames = resolved.frames.filter(frame => frame.targetIds.includes(affectedId));
  assert.deepEqual(affectedFrames.map(({ kind, roundEndEffect }) => [kind, roundEndEffect]), [
    ["damage", { kind: "bleed", stacks: 3, hpLost: 7 }],
    ["knockout", undefined],
    ["status", { kind: "expiry", statuses: ["bleed", "slowed"] }],
  ]);
  assert.equal(affectedFrames[0].state.combatants[affectedId].currentHp, 0);
  assert.equal(affectedFrames[0].state.combatants[affectedId].statuses[0].duration, 1);
  assert.deepEqual(affectedFrames[2].state.combatants[affectedId].statuses, [
    { status: "weakened", stat: "specialPower", duration: 1 },
  ]);
  assert.ok(resolved.result.log.some(line => line.endsWith("takes 15 bleed damage from 3 stacks.")));

  const persistentFrames = resolved.frames.filter(frame => frame.targetIds.includes(persistentId));
  assert.deepEqual(persistentFrames.map(({ kind, roundEndEffect }) => [kind, roundEndEffect]), [
    ["damage", { kind: "bleed", stacks: 2, hpLost: 8 }],
    ["status", { kind: "expiry", statuses: ["inspired"] }],
    ["energy", { kind: "energy", before: maxBattleEnergy - 1, after: maxBattleEnergy }],
  ]);
  assert.equal(persistentFrames[1].state.combatants[persistentId].currentBattleEnergy, maxBattleEnergy - 1);
  assert.equal(persistentFrames[2].state.combatants[persistentId].currentBattleEnergy, maxBattleEnergy);
  assert.equal(persistentFrames[2].state.combatants[persistentId].statuses[0].duration, 1);
  assert.equal(persistentFrames[2].label, "+1 BE · Recovery");
  assert.equal(resolved.frames.filter(frame => frame.roundEndEffect?.kind === "energy").length, 1);
  assert.equal(resolved.state.combatants[affectedId].currentBattleEnergy, 0);
  assert.ok(resolved.result.log.some(line => line.endsWith("regenerates 1 Battle Energy.")));
  assert.equal(resolved.state.roundNumber, state.roundNumber + 1);

  const { state: settled } = resolved;
  const affectedName = state.combatants[affectedId].name;
  const persistentName = state.combatants[persistentId].name;
  assert.deepEqual(settled.log.flatMap((line, index) => {
    const category = getBattleLogEventCategory(settled, index);
    return category ? [[category, line]] : [];
  }), [
    ["knockouts", `${affectedName} fainted.`],
    ["status-changes", `${affectedName}: Bleed, Slowed expired.`],
    ["status-changes", `${persistentName}: Inspired expired.`],
  ]);
  assert.equal(state.logEventCategories, undefined);
});

function createTimingFixture() {
  const [caster, defender] = createNewGameSave("Status timing", 0).creatures!;
  const state = createBattleState({
    battleId: "status-timing-20",
    playerCreatures: [{ ...caster, creatureId: "timing-caster" }],
    enemyCreatures: [{ ...defender, creatureId: "timing-defender" }],
  });
  state.roundNumber = 4;
  const [actorId] = state.teams.player.combatantIds;
  const [targetId] = state.teams.enemy.combatantIds;
  return { state, actorId, targetId };
}

test("status timing counts this round and preserves legacy duration and Bleed defaults", () => {
  const { state, targetId } = createTimingFixture();
  const target = state.combatants[targetId];
  target.currentHp = 20;
  const bleed: BattleStatusStack = { status: "bleed", duration: 2.5 };
  const short: BattleStatusStack = { status: "weakened", stat: "physicalPower", duration: 1 };
  const long: BattleStatusStack = { status: "weakened", stat: "specialPower", duration: 2 };
  const inactive: BattleStatusStack = { status: "marked", duration: 0 };
  target.statuses = [bleed, long, short, inactive];
  const before = structuredClone(state);

  assert.deepEqual(getBattleStatusTimingForecast(state, targetId, bleed), {
    expiresAfterRound: 6,
    nextBleed: { roundNumber: 4, damage: 5, hpBefore: 20, hpAfter: 15, knockedOut: false },
  });
  assert.deepEqual(getBattleStatusTimingForecast(state, targetId, { ...short }), { expiresAfterRound: 4 });
  assert.deepEqual(getBattleStatusTimingForecast(state, targetId, long), { expiresAfterRound: 5 });
  assert.equal(getBattleStatusTimingForecast(state, targetId, inactive), undefined);
  assert.deepEqual(state, before);
});

test("a move forecasts its Bleed tick from final projected HP and omits expiry on a knockout", () => {
  const { state, actorId, targetId } = createTimingFixture();
  const actor = state.combatants[actorId];
  actor.loadout = { ...actor.loadout, equippedMoveIds: ["strike", "razor_swipe"], learnedMoveIds: ["strike", "razor_swipe"] };
  Object.assign(actor.battleStats, { accuracy: 1000, statusPower: 1000, physicalPower: 30 });
  const action = { actorId, moveId: "razor_swipe", targetIds: [targetId] };
  const damage = previewBattleAction(state, action).find(row => row.effectType === "damage")?.damageBreakdown;
  assert.ok(damage);
  state.combatants[targetId].currentHp = damage.finalDamage + 2;
  const projected = previewBattleAction(state, action).find(row => row.statusApplication?.stack.status === "bleed");
  assert.equal(projected?.hpAfter, 2);
  assert.deepEqual(projected?.statusApplication?.timing, {
    nextBleed: { roundNumber: 4, damage: 2, hpBefore: 2, hpAfter: 0, knockedOut: true },
  });
  const differentSeed = previewBattleAction({ ...state, battleId: "status-timing-0" }, action).find(row => row.statusApplication);
  assert.deepEqual(differentSeed?.statusApplication?.timing, projected?.statusApplication?.timing);

  const resolved = resolveBattleTurn(state, [actorId], action);
  assert.ok(resolved);
  assert.deepEqual(resolved.frames.find(frame => frame.roundEndEffect?.kind === "bleed")?.roundEndEffect, { kind: "bleed", stacks: 1, hpLost: 2 });
  assert.equal(resolved.state.outcome, "player_won");

  state.combatants[targetId].currentHp = 1;
  assert.ok(previewBattleAction(state, action).every(row => !row.statusApplication));
});

test("ending battle during recovery allows same-round expiry but prevents a later one", () => {
  const { state, actorId, targetId } = createTimingFixture();
  const actor = state.combatants[actorId];
  const short: BattleStatusStack = { status: "inspired", duration: 1 };
  const long: BattleStatusStack = { status: "guarded", duration: 2 };
  actor.statuses = [short, long];
  const target = state.combatants[targetId];
  target.currentHp = 2;
  target.statuses = [{ status: "bleed", duration: 2 }];

  assert.deepEqual(getBattleStatusTimingForecast(state, actorId, short), { expiresAfterRound: 4 });
  assert.equal(getBattleStatusTimingForecast(state, actorId, long), undefined);

  actor.battleStats.accuracy = 1000;
  const directVictory = previewBattleAction(state, { actorId, moveId: "protective_lunge", targetIds: [targetId] });
  assert.equal(directVictory.find(row => row.effectType === "damage")?.hpAfter, 0);
  const guard = directVictory.find(row => row.statusApplication?.stack.status === "guarded")?.statusApplication;
  assert.ok(guard);
  assert.equal(guard.timing, undefined);
});
