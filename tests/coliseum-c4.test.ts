import test from "node:test";
import assert from "node:assert/strict";

const {
  createBattleState,
} = await import("@/data/battleEngine");
const {
  buildAuthoredColiseumEnemyTeam,
  createColiseumPerformance,
  getColiseumC2Progress,
  COLISEUM_C2_ENCOUNTERS,
  COLISEUM_C2_PROGRESS_FLAG,
} = await import("../src/data/coliseumC2.ts");
const {
  getColiseumC3State,
} = await import("../src/data/coliseumC3.ts");
const {
  COLISEUM_C4_MODIFIERS,
  COLISEUM_C4_STATE_FLAG,
  abandonColiseumC4Run,
  applyColiseumC4Carryover,
  applyColiseumC4Modifiers,
  buildColiseumC4Encounter,
  createColiseumC4Carryover,
  getColiseumC4Access,
  getColiseumC4DailyChallenge,
  getColiseumC4Gauntlets,
  getColiseumC4State,
  getColiseumC4Summary,
  getColiseumC4WeeklyBoss,
  isColiseumC4AidRestricted,
  recordColiseumC4BattleResult,
} = await import("../src/data/coliseumC4.ts");
const {
  createNewGameSave,
} = await import("@/lib/save/localSave");

function fixture() {
  const save = createNewGameSave("C4 Tester", 0);
  const creatures = save.creatures ?? [];
  assert.ok(creatures.length >= 3, "fixture needs three creatures");
  return {
    save,
    teamIds: creatures.slice(0, 3).map((creature) => creature.creatureId),
  };
}

function grantAllC2Clears<T extends ReturnType<typeof createNewGameSave>>(save: T): T {
  const progress = getColiseumC2Progress(save);
  const ids = COLISEUM_C2_ENCOUNTERS.map((entry) => entry.encounterId);
  return {
    ...save,
    flags: {
      ...save.flags,
      [COLISEUM_C2_PROGRESS_FLAG]: JSON.stringify({
        ...progress,
        completedEncounterIds: ids,
        claimedFirstClearEncounterIds: ids,
      }),
    },
  } as T;
}

function buildFinalState(
  save: ReturnType<typeof createNewGameSave>,
  challenge: ReturnType<typeof getColiseumC4DailyChallenge>,
  stageIndex: number,
  teamIds: ReturnType<typeof fixture>["teamIds"],
  outcome: "player_won" | "enemy_won" | "draw" = "player_won",
) {
  const encounter = buildColiseumC4Encounter(challenge, stageIndex);
  const team = teamIds.map((id) => save.creatures!.find((creature) => creature.creatureId === id)!);
  const enemies = buildAuthoredColiseumEnemyTeam(save.saveId, encounter);
  const state = createBattleState({
    battleId: `c4_test_${challenge.challengeKey}_${stageIndex}_${outcome}`,
    playerCreatures: team,
    enemyCreatures: enemies,
    playerTeamName: "C4 Test Team",
    enemyTeamName: encounter.opponentName,
  });
  return { ...state, outcome };
}

test("C4 registers nine structured rotating modifiers", () => {
  assert.equal(COLISEUM_C4_MODIFIERS.length, 9);
  assert.equal(new Set(COLISEUM_C4_MODIFIERS.map((entry) => entry.modifierId)).size, 9);
  assert.ok(COLISEUM_C4_MODIFIERS.some((entry) => entry.modifierId === "restricted_aid"));
  assert.ok(COLISEUM_C4_MODIFIERS.some((entry) => entry.tone === "benefit"));
  assert.ok(COLISEUM_C4_MODIFIERS.some((entry) => entry.tone === "hazard"));
});

test("daily and weekly rotations are deterministic for the same save and time key", () => {
  const { save } = fixture();
  const cleared = grantAllC2Clears(save);
  const dailyA = getColiseumC4DailyChallenge(cleared);
  const dailyB = getColiseumC4DailyChallenge(cleared);
  assert.deepEqual(dailyA, dailyB);
  const bossA = getColiseumC4WeeklyBoss(cleared);
  const bossB = getColiseumC4WeeklyBoss(cleared);
  assert.deepEqual(bossA, bossB);

  const tomorrow = {
    ...cleared,
    dayState: { ...cleared.dayState, dayNumber: cleared.dayState.dayNumber + 1 },
  };
  assert.notEqual(getColiseumC4DailyChallenge(tomorrow).claimKey, dailyA.claimKey);

  const nextWeek = {
    ...cleared,
    dayState: { ...cleared.dayState, dayNumber: cleared.dayState.dayNumber + 7 },
  };
  assert.notEqual(getColiseumC4WeeklyBoss(nextWeek).claimKey, bossA.claimKey);
});

test("C4 defines three three-stage gauntlets", () => {
  const { save } = fixture();
  const gauntlets = getColiseumC4Gauntlets(grantAllC2Clears(save));
  assert.equal(gauntlets.length, 3);
  gauntlets.forEach((gauntlet) => {
    assert.equal(gauntlet.mode, "gauntlet");
    assert.equal(gauntlet.encounterIds.length, 3);
    assert.ok(gauntlet.modifierIds.length >= 1);
  });
});

test("C4 access requires permanent circuit progress", () => {
  const { save } = fixture();
  const locked = getColiseumC4DailyChallenge(save);
  assert.equal(getColiseumC4Access(save, locked).unlocked, false);
  const cleared = grantAllC2Clears(save);
  const unlocked = getColiseumC4DailyChallenge(cleared);
  assert.equal(getColiseumC4Access(cleared, unlocked).unlocked, true);
});

test("C4 modifiers alter stats and opening statuses without changing the source state", () => {
  const { save, teamIds } = fixture();
  const cleared = grantAllC2Clears(save);
  const daily = getColiseumC4DailyChallenge(cleared);
  const encounter = buildColiseumC4Encounter(daily, 0);
  const base = buildFinalState(cleared, daily, 0, teamIds, "player_won");
  const playerId = base.teams.player.combatantIds[0];
  const enemyId = base.teams.enemy.combatantIds[0];
  const beforeSpeed = base.combatants[playerId].battleStats.speed;
  const beforeHp = base.combatants[playerId].maxHp;
  const modified = applyColiseumC4Modifiers(base, [
    "quickened_field",
    "fragile_ground",
    "enemy_bulwark",
    "exhausting_heat",
    "enemy_focus",
  ]);
  assert.equal(modified.combatants[playerId].battleStats.speed, beforeSpeed + 4);
  assert.ok(modified.combatants[playerId].maxHp < beforeHp);
  assert.ok(modified.combatants[playerId].statuses.some((status) => status.status === "exhausted"));
  assert.ok(modified.combatants[enemyId].statuses.some((status) => status.status === "guarded"));
  assert.equal(modified.combatants[enemyId].battleStats.accuracy, base.combatants[enemyId].battleStats.accuracy + 6);
  assert.equal(base.combatants[playerId].battleStats.speed, beforeSpeed);
  assert.equal(encounter.enemyTeam.length, 3);
  assert.equal(isColiseumC4AidRestricted(["restricted_aid"]), true);
});

test("gauntlet carryover gives partial recovery and revives fainted participants at 15 percent HP", () => {
  const { save, teamIds } = fixture();
  const cleared = grantAllC2Clears(save);
  const gauntlet = getColiseumC4Gauntlets(cleared)[0];
  const encounter = buildColiseumC4Encounter(gauntlet, 0);
  const base = buildFinalState(cleared, gauntlet, 0, teamIds, "player_won");
  const playerIds = base.teams.player.combatantIds;
  const damaged = {
    ...base,
    combatants: {
      ...base.combatants,
      [playerIds[0]]: {
        ...base.combatants[playerIds[0]],
        currentHp: Math.round(base.combatants[playerIds[0]].maxHp * 0.5),
        currentBattleEnergy: Math.round(base.combatants[playerIds[0]].maxBattleEnergy * 0.4),
      },
      [playerIds[1]]: {
        ...base.combatants[playerIds[1]],
        currentHp: 0,
        currentBattleEnergy: 0,
        isFainted: true,
      },
    },
  };
  const carryover = createColiseumC4Carryover(damaged);
  assert.equal(carryover[String(teamIds[1])].hpRatio, 0.15);
  assert.ok(carryover[String(teamIds[0])].hpRatio >= 0.79 && carryover[String(teamIds[0])].hpRatio <= 0.81);
  assert.ok(carryover[String(teamIds[0])].battleEnergyRatio >= 0.64 && carryover[String(teamIds[0])].battleEnergyRatio <= 0.66);

  const nextEncounter = buildColiseumC4Encounter(gauntlet, 1);
  const nextTeam = teamIds.map((id) => cleared.creatures!.find((creature) => creature.creatureId === id)!);
  const nextEnemies = buildAuthoredColiseumEnemyTeam(cleared.saveId, nextEncounter);
  const fresh = createBattleState({ battleId: "carryover_test", playerCreatures: nextTeam, enemyCreatures: nextEnemies });
  const applied = applyColiseumC4Carryover(fresh, carryover);
  const revived = applied.combatants[applied.teams.player.combatantIds[1]];
  assert.equal(revived.isFainted, false);
  assert.equal(revived.currentHp, Math.max(1, Math.round(revived.maxHp * 0.15)));
  assert.equal(revived.statuses.length, 0);
  assert.deepEqual(revived.cooldowns, {});
  assert.equal(encounter.enemyTeam.length, 3);
});

test("daily victory grants C3 Marks once, ordinary creature XP, and blocks duplicate result IDs", () => {
  const { save, teamIds } = fixture();
  const cleared = grantAllC2Clears(save);
  const daily = getColiseumC4DailyChallenge(cleared);
  const performance = createColiseumPerformance(teamIds);
  const finalState = buildFinalState(cleared, daily, 0, teamIds, "player_won");
  const beforeLevel = cleared.creatures![0].level;
  const beforeXp = cleared.creatures![0].xp;
  const result = recordColiseumC4BattleResult(cleared, daily, 0, "player_won", 4, teamIds, performance, "c4_daily_once", finalState);
  assert.equal(result.ok, true);
  assert.equal(result.historyEntry?.rewardTier, "full");
  assert.ok(getColiseumC3State(result.save).marks >= daily.reward.marks);
  assert.ok(getColiseumC4State(result.save).dailyClaimKeys.includes(daily.claimKey));
  const updated = result.save.creatures!.find((creature) => creature.creatureId === teamIds[0])!;
  assert.ok(updated.level > beforeLevel || updated.xp > beforeXp);

  const duplicate = recordColiseumC4BattleResult(result.save, daily, 0, "player_won", 4, teamIds, performance, "c4_daily_once", finalState);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.changed, false);
  assert.equal(getColiseumC3State(duplicate.save).marks, getColiseumC3State(result.save).marks);

  const practiceState = buildFinalState(result.save, daily, 0, teamIds, "player_won");
  const practice = recordColiseumC4BattleResult(result.save, daily, 0, "player_won", 4, teamIds, performance, "c4_daily_practice", practiceState);
  assert.equal(practice.historyEntry?.rewardTier, "none");
  assert.equal(practice.historyEntry?.marks, 0);
});

test("gauntlet stages persist a locked team, carryover, and grant the clear reward only at stage three", () => {
  const { save, teamIds } = fixture();
  let working = grantAllC2Clears(save);
  const gauntlet = getColiseumC4Gauntlets(working)[0];
  const performance = createColiseumPerformance(teamIds);

  for (let stageIndex = 0; stageIndex < 3; stageIndex += 1) {
    const finalState = buildFinalState(working, gauntlet, stageIndex, teamIds, "player_won");
    const result = recordColiseumC4BattleResult(
      working,
      gauntlet,
      stageIndex,
      "player_won",
      3 + stageIndex,
      teamIds,
      performance,
      `c4_gauntlet_stage_${stageIndex}`,
      finalState,
    );
    assert.equal(result.ok, true);
    working = result.save;
    const state = getColiseumC4State(working);
    if (stageIndex < 2) {
      assert.ok(state.activeRun);
      assert.equal(state.activeRun?.stageIndex, stageIndex + 1);
      assert.deepEqual(state.activeRun?.teamCreatureIds, teamIds);
      assert.equal(result.historyEntry?.rewardTier, "none");
    } else {
      assert.equal(state.activeRun, undefined);
      assert.equal(result.historyEntry?.rewardTier, "full");
      assert.ok(state.weeklyGauntletClaimKeys.includes(gauntlet.claimKey));
      assert.ok(result.historyEntry && result.historyEntry.marks > 0);
    }
  }
});

test("weekly boss rewards once while practice rematches still record XP", () => {
  const { save, teamIds } = fixture();
  const cleared = grantAllC2Clears(save);
  const boss = getColiseumC4WeeklyBoss(cleared);
  const performance = createColiseumPerformance(teamIds);
  const finalState = buildFinalState(cleared, boss, 0, teamIds, "player_won");
  const first = recordColiseumC4BattleResult(cleared, boss, 0, "player_won", 8, teamIds, performance, "c4_boss_first", finalState);
  assert.equal(first.historyEntry?.rewardTier, "full");
  assert.ok(getColiseumC4State(first.save).weeklyBossClaimKeys.includes(boss.claimKey));

  const rematchState = buildFinalState(first.save, boss, 0, teamIds, "player_won");
  const rematch = recordColiseumC4BattleResult(first.save, boss, 0, "player_won", 7, teamIds, performance, "c4_boss_repeat", rematchState);
  assert.equal(rematch.historyEntry?.rewardTier, "none");
  assert.ok(rematch.xpSummaries.every((entry) => entry.xpGained > 0));
});

test("active gauntlets can be abandoned without deleting completed-stage XP", () => {
  const { save, teamIds } = fixture();
  const cleared = grantAllC2Clears(save);
  const gauntlet = getColiseumC4Gauntlets(cleared)[0];
  const finalState = buildFinalState(cleared, gauntlet, 0, teamIds, "player_won");
  const stage = recordColiseumC4BattleResult(cleared, gauntlet, 0, "player_won", 4, teamIds, createColiseumPerformance(teamIds), "c4_abandon_stage", finalState);
  const xpAfterStage = stage.save.creatures!.find((creature) => creature.creatureId === teamIds[0])!.xp;
  assert.ok(getColiseumC4State(stage.save).activeRun);
  const abandoned = abandonColiseumC4Run(stage.save);
  assert.equal(abandoned.ok, true);
  assert.equal(getColiseumC4State(abandoned.save).activeRun, undefined);
  assert.equal(abandoned.save.creatures!.find((creature) => creature.creatureId === teamIds[0])!.xp, xpAfterStage);
});

test("malformed C4 save state normalizes safely", () => {
  const { save } = fixture();
  const corrupted = { ...save, flags: { ...save.flags, [COLISEUM_C4_STATE_FLAG]: "{broken" } };
  const state = getColiseumC4State(corrupted);
  assert.equal(state.version, 1);
  assert.equal(state.history.length, 0);
  assert.equal(state.activeRun, undefined);
  const summary = getColiseumC4Summary(corrupted);
  assert.equal(summary.totalC4Battles, 0);
});
