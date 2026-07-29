import test from "node:test";
import assert from "node:assert/strict";

const {
  buildBattleAiPlan,
  getBattleAiDifficultyLabel,
} = await import("@/data/battleAi");
const {
  createBattleState,
  resolveBattleRound,
  validateBattleAction,
} = await import("@/data/battleEngine");
const {
  normalizeBattleMoveLoadout,
} = await import("@/data/battleLoadouts");
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

function createThreeVsThree(battleId = "ai-regression") {
  const save = createNewGameSave("AI Tester", 0);
  const creatures = save.creatures ?? [];
  assert.ok(creatures.length >= 2, "AI fixture requires two starter creatures");
  const playerCreatures = [
    cloneCreature(creatures[0], "ai_player_1", "Player One"),
    cloneCreature(creatures[1], "ai_player_2", "Player Two"),
    cloneCreature(creatures[0], "ai_player_3", "Player Three"),
  ];
  const enemyCreatures = [
    cloneCreature(creatures[1], "ai_enemy_1", "Enemy One"),
    cloneCreature(creatures[0], "ai_enemy_2", "Enemy Two"),
    cloneCreature(creatures[1], "ai_enemy_3", "Enemy Three"),
  ];
  return createBattleState({ battleId, playerCreatures, enemyCreatures });
}

function equip(state: ReturnType<typeof createThreeVsThree>, actorId: string, moveIds: string[]) {
  const actor = state.combatants[actorId];
  state.combatants[actorId] = {
    ...actor,
    currentBattleEnergy: actor.maxBattleEnergy,
    cooldowns: {},
    loadout: {
      learnedMoveIds: [...moveIds],
      equippedMoveIds: [...moveIds],
      version: 1,
    },
  };
}

function playerStrikeActions(state: ReturnType<typeof createThreeVsThree>) {
  const targetIds = state.teams.enemy.combatantIds;
  return state.teams.player.combatantIds.map((actorId, index) => ({
    actorId,
    moveId: "strike",
    targetIds: [targetIds[index % targetIds.length]],
  }));
}

test("all AI difficulties produce deterministic legal actions for every living enemy", () => {
  for (const difficulty of ["basic", "tactical", "champion"] as const) {
    const firstState = createThreeVsThree(`ai-${difficulty}`);
    const secondState = structuredClone(firstState);
    const first = buildBattleAiPlan(firstState, "enemy", difficulty);
    const second = buildBattleAiPlan(secondState, "enemy", difficulty);
    assert.deepEqual(first, second);
    assert.equal(first.actions.length, 3);
    assert.equal(first.decisions.length, 3);
    assert.equal(getBattleAiDifficultyLabel(difficulty).length > 0, true);
    first.actions.forEach((action) => {
      assert.equal(firstState.combatants[action.actorId].sideId, "enemy");
      assert.equal(validateBattleAction(firstState, action).valid, true);
    });
  }
});

test("tactical AI prioritizes a critical ally when a strong heal is equipped", () => {
  const state = createThreeVsThree("ai-heal");
  const healerId = state.teams.enemy.combatantIds[0];
  const injuredId = state.teams.enemy.combatantIds[1];
  equip(state, healerId, ["strike", "mend_wounds"]);
  state.combatants[injuredId] = {
    ...state.combatants[injuredId],
    currentHp: Math.max(1, Math.floor(state.combatants[injuredId].maxHp * 0.15)),
  };

  const plan = buildBattleAiPlan(state, "enemy", "tactical");
  const healerDecision = plan.decisions.find((decision) => decision.actorId === healerId);
  assert.ok(healerDecision);
  assert.equal(healerDecision.action.moveId, "mend_wounds");
  assert.deepEqual(healerDecision.action.targetIds, [injuredId]);
  assert.ok(healerDecision.reasons.some((reason) => reason.includes("critical")));
});

test("tactical damage AI targets a legal finishing opportunity", () => {
  const state = createThreeVsThree("ai-finisher");
  const weakTargetId = state.teams.player.combatantIds[2];
  state.teams.enemy.combatantIds.forEach((actorId) => equip(state, actorId, ["strike"]));
  state.combatants[weakTargetId] = {
    ...state.combatants[weakTargetId],
    currentHp: 1,
  };

  const plan = buildBattleAiPlan(state, "enemy", "tactical");
  assert.ok(plan.actions.length > 0);
  assert.ok(plan.actions.every((action) => action.targetIds[0] === weakTargetId));
});

test("champion AI coordinates team buffs instead of redundantly repeating them", () => {
  const state = createThreeVsThree("ai-coordination");
  state.teams.enemy.combatantIds.forEach((actorId) => equip(state, actorId, ["strike", "rally"]));

  const plan = buildBattleAiPlan(state, "enemy", "champion");
  const rallyCount = plan.actions.filter((action) => action.moveId === "rally").length;
  assert.ok(rallyCount <= 1, `champion AI should not queue duplicate Rally actions, received ${rallyCount}`);
});

test("AI honors Taunt target enforcement", () => {
  const state = createThreeVsThree("ai-taunt");
  const actorId = state.teams.enemy.combatantIds[0];
  const tauntSourceId = state.teams.player.combatantIds[1];
  equip(state, actorId, ["strike"]);
  state.combatants[actorId] = {
    ...state.combatants[actorId],
    statuses: [{
      status: "taunted",
      duration: 2,
      sourceCombatantId: tauntSourceId,
      stacks: 1,
      maxStacks: 1,
    }],
  };

  const plan = buildBattleAiPlan(state, "enemy", "champion");
  const decision = plan.decisions.find((entry) => entry.actorId === actorId);
  assert.ok(decision);
  assert.deepEqual(decision.action.targetIds, [tauntSourceId]);
});

test("player actions and planned enemy actions resolve one complete six-action round", () => {
  const state = createThreeVsThree("ai-full-round");
  const aiPlan = buildBattleAiPlan(state, "enemy", "tactical");
  const resolved = resolveBattleRound(state, [
    ...playerStrikeActions(state),
    ...aiPlan.actions,
  ]);
  assert.equal(resolved.result.actions.length, 6);
  assert.equal(new Set(resolved.result.actions.map((action) => action.actorId)).size, 6);
  assert.equal(resolved.state.roundNumber, 2);
});
