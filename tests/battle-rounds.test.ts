import test from "node:test";
import assert from "node:assert/strict";

const {
  advanceBattleCombatantEndOfRound,
  applyBattleStatusStack,
  createBattleState,
  resolveBattleRound,
  validateBattleAction,
} = await import("@/data/battleEngine");
const {
  getBattleMove,
} = await import("@/data/battleMoves");
const {
  normalizeBattleMoveLoadout,
} = await import("@/data/battleLoadouts");
const {
  calculateBattleMoveHitChance,
  getBattleMoveTagModifier,
} = await import("../src/data/battleRoundRules.ts");
const {
  previewBattleHealing,
} = await import("../src/data/battleStats.ts");
const {
  createNewGameSave,
} = await import("@/lib/save/localSave");

function cloneCreature(source: ReturnType<typeof createNewGameSave>["creatures"][number], id: string, nickname: string) {
  return {
    ...source,
    creatureId: id as never,
    nickname,
    battleMoveLoadout: normalizeBattleMoveLoadout(source.speciesId, source.battleMoveLoadout ?? {}),
  };
}

function createThreeVsThree(battleId = "round-regression") {
  const save = createNewGameSave("Round Tester", 0);
  const creatures = save.creatures ?? [];
  assert.ok(creatures.length >= 2, "round fixture requires two starter creatures");
  const playerCreatures = [
    cloneCreature(creatures[0], "round_player_1", "Player One"),
    cloneCreature(creatures[1], "round_player_2", "Player Two"),
    cloneCreature(creatures[0], "round_player_3", "Player Three"),
  ];
  const enemyCreatures = [
    cloneCreature(creatures[1], "round_enemy_1", "Enemy One"),
    cloneCreature(creatures[0], "round_enemy_2", "Enemy Two"),
    cloneCreature(creatures[1], "round_enemy_3", "Enemy Three"),
  ];
  return createBattleState({ battleId, playerCreatures, enemyCreatures });
}

function strikeActions(state: ReturnType<typeof createThreeVsThree>) {
  const playerTargets = state.teams.enemy.combatantIds;
  const enemyTargets = state.teams.player.combatantIds;
  return Object.values(state.combatants).map((combatant) => ({
    actorId: combatant.battleCombatantId,
    moveId: "strike",
    targetIds: [combatant.sideId === "player" ? playerTargets[combatant.slotIndex % playerTargets.length] : enemyTargets[combatant.slotIndex % enemyTargets.length]],
  }));
}

test("the same 3v3 state and action queue resolve identically", () => {
  const firstState = createThreeVsThree("deterministic-round");
  const secondState = structuredClone(firstState);
  const actions = strikeActions(firstState);
  const first = resolveBattleRound(firstState, actions);
  const second = resolveBattleRound(secondState, structuredClone(actions));
  assert.deepEqual(first, second);
  assert.equal(first.result.actions.length, 6, "every living combatant should act once");
  assert.equal(new Set(first.result.actions.map((action) => action.actorId)).size, 6);
});

test("invalid moves and targets are reported and safely normalized", () => {
  const state = createThreeVsThree("validation-round");
  const actorId = state.teams.player.combatantIds[0];
  const allyId = state.teams.player.combatantIds[1];
  const unknown = validateBattleAction(state, {
    actorId,
    moveId: "deleted_move",
    targetIds: [allyId],
  });
  assert.equal(unknown.valid, false);
  assert.ok(unknown.issues.some((issue) => issue.code === "unknown-move"));

  const invalidTarget = validateBattleAction(state, {
    actorId,
    moveId: "strike",
    targetIds: [allyId],
  });
  assert.equal(invalidTarget.valid, false);
  assert.ok(invalidTarget.issues.some((issue) => issue.code === "invalid-target"));

  const resolved = resolveBattleRound(state, [{ actorId, moveId: "deleted_move", targetIds: [allyId] }]);
  const actorAction = resolved.result.actions.find((action) => action.actorId === actorId);
  assert.ok(actorAction);
  assert.equal(actorAction.usedFallback, true);
  assert.equal(actorAction.moveId, "strike");
});

test("taunt forces single-enemy actions toward the living taunt source", () => {
  const state = createThreeVsThree("taunt-round");
  const actorId = state.teams.player.combatantIds[0];
  const requestedTargetId = state.teams.enemy.combatantIds[0];
  const tauntSourceId = state.teams.enemy.combatantIds[1];
  const actor = state.combatants[actorId];
  state.combatants[actorId] = {
    ...actor,
    statuses: [{ status: "taunted", duration: 2, sourceCombatantId: tauntSourceId, stacks: 1, maxStacks: 1 }],
  };

  const validation = validateBattleAction(state, {
    actorId,
    moveId: "strike",
    targetIds: [requestedTargetId],
  });
  assert.deepEqual(validation.normalizedTargetIds, [tauntSourceId]);
  assert.ok(validation.issues.some((issue) => issue.code === "taunt-target-enforced"));
});

test("status stacks cap, deal combined bleed damage, and tick once per round", () => {
  const state = createThreeVsThree("status-round");
  const actor = {
    ...state.combatants[state.teams.player.combatantIds[0]],
    currentBattleEnergy: 0,
  };
  let stacked = actor;
  for (let index = 0; index < 4; index += 1) {
    stacked = applyBattleStatusStack(stacked, {
      status: "bleed",
      duration: 3,
      amount: 4,
      stacks: 1,
      maxStacks: 3,
    }).combatant;
  }
  const bleed = stacked.statuses.find((status) => status.status === "bleed");
  assert.equal(bleed?.stacks, 3);
  const beforeHp = stacked.currentHp;
  const advanced = advanceBattleCombatantEndOfRound(stacked);
  assert.equal(advanced.combatant.currentHp, beforeHp - 12);
  assert.equal(advanced.combatant.statuses.find((status) => status.status === "bleed")?.duration, 2);
  assert.ok(advanced.energyRecovered > 0);

  const guardedOnce = applyBattleStatusStack(actor, { status: "guarded", duration: 1, amount: 20 }).combatant;
  const guardedTwice = applyBattleStatusStack(guardedOnce, { status: "guarded", duration: 2, amount: 30 }).combatant;
  const guarded = guardedTwice.statuses.find((status) => status.status === "guarded");
  assert.equal(guarded?.stacks, 1);
  assert.equal(guarded?.duration, 2);
  assert.equal(guarded?.amount, 30);
});

test("declared cooldowns and round Energy regeneration use exact round timing", () => {
  const state = createThreeVsThree("cooldown-round");
  const actorId = state.teams.player.combatantIds[0];
  const targetId = state.teams.enemy.combatantIds[0];
  const actor = state.combatants[actorId];
  const speciesMove = actor.loadout.equippedMoveIds
    .map((moveId) => getBattleMove(moveId))
    .find((move) => move.cooldown === 1 && move.battleEnergyCost <= actor.currentBattleEnergy);
  assert.ok(speciesMove, "fixture needs an equipped one-round cooldown move");

  const first = resolveBattleRound(state, [{ actorId, moveId: speciesMove.id, targetIds: [targetId] }]);
  assert.equal(first.state.combatants[actorId].cooldowns[speciesMove.id], 1);
  const afterFirstEnergy = first.state.combatants[actorId].currentBattleEnergy;
  assert.ok(afterFirstEnergy > actor.currentBattleEnergy - speciesMove.battleEnergyCost, "round-end regeneration should occur after paying the move cost");

  const second = resolveBattleRound(first.state, [{ actorId, moveId: speciesMove.id, targetIds: [targetId] }]);
  const secondAction = second.result.actions.find((action) => action.actorId === actorId);
  assert.equal(secondAction?.usedFallback, true);
  assert.equal(second.state.combatants[actorId].cooldowns[speciesMove.id], undefined);
});

test("move hit chance responds to Accuracy, Evasion, and precision tags", () => {
  const strike = getBattleMove("strike");
  const precise = getBattleMove("pounce");
  const baseStats = {
    maxHp: 100,
    physicalPower: 20,
    specialPower: 20,
    defense: 15,
    resistance: 15,
    speed: 20,
    accuracy: 90,
    evasion: 0,
    statusPower: 15,
    statusResist: 15,
    battleEnergy: 60,
  };
  const highChance = calculateBattleMoveHitChance({ ...baseStats, accuracy: 110 }, { ...baseStats, evasion: 0 }, precise);
  const lowChance = calculateBattleMoveHitChance({ ...baseStats, accuracy: 85 }, { ...baseStats, evasion: 25 }, strike);
  assert.ok(highChance > lowChance);
  assert.ok(highChance <= 100 && lowChance >= 5);
});

test("species move tags and healing scope produce transparent modifiers", () => {
  const pounce = getBattleMove("pounce");
  const tagPreview = getBattleMoveTagModifier("species_feline" as never, "species_bovine" as never, pounce);
  assert.ok(tagPreview.affinityTags.length > 0);
  assert.ok(tagPreview.resistanceTags.length > 0);
  assert.ok(tagPreview.notes.length >= 2);

  const mend = getBattleMove("mend_wounds");
  const stats = {
    maxHp: 100,
    physicalPower: 10,
    specialPower: 10,
    defense: 10,
    resistance: 10,
    speed: 10,
    accuracy: 95,
    evasion: 2,
    statusPower: 24,
    statusResist: 18,
    battleEnergy: 70,
  };
  const single = previewBattleHealing(stats, mend, 28);
  const team = previewBattleHealing(stats, { ...mend, targetType: "all_allies" as const }, 28);
  assert.ok(single.scalingBonus > 0);
  assert.ok(single.finalHealing > team.finalHealing);
});
