import test from "node:test";
import assert from "node:assert/strict";

const { createBattleState } = await import("@/data/battleEngine");
const {
  buildAuthoredColiseumEnemyTeam,
  createColiseumPerformance,
  getColiseumC2Progress,
  COLISEUM_C2_ENCOUNTERS,
  COLISEUM_C2_PROGRESS_FLAG,
} = await import("../src/data/coliseumC2.ts");
const {
  buildColiseumC4Encounter,
  getColiseumC4DailyChallenge,
  getColiseumC4Gauntlets,
  getColiseumC4State,
  recordColiseumC4BattleResult,
} = await import("@/data/coliseumC4");
const { createNewGameSave } = await import("@/lib/save/localSave");

type TestSave = ReturnType<typeof createNewGameSave>;
type TestCreature = NonNullable<TestSave["creatures"]>[number];
type TeamIds = TestCreature["creatureId"][];
type C4Challenge = ReturnType<typeof getColiseumC4DailyChallenge>;

function fixture() {
  const save = createNewGameSave("C4 Sequencing Tester", 0);
  const creatures = save.creatures ?? [];
  assert.ok(creatures.length >= 3, "fixture needs three creatures");
  return {
    save,
    teamIds: creatures.slice(0, 3).map((creature) => creature.creatureId),
  };
}

function grantAllC2Clears<T extends TestSave>(save: T): T {
  const progress = getColiseumC2Progress(save);
  const encounterIds = COLISEUM_C2_ENCOUNTERS.map((entry) => entry.encounterId);
  return {
    ...save,
    flags: {
      ...save.flags,
      [COLISEUM_C2_PROGRESS_FLAG]: JSON.stringify({
        ...progress,
        completedEncounterIds: encounterIds,
        claimedFirstClearEncounterIds: encounterIds,
      }),
    },
  } as T;
}

function buildFinalState(
  save: TestSave,
  challenge: C4Challenge,
  stageIndex: number,
  teamIds: TeamIds,
  battleId: string,
) {
  const encounter = buildColiseumC4Encounter(challenge, stageIndex);
  const team = teamIds.map((creatureId) => {
    const creature = save.creatures?.find((entry) => entry.creatureId === creatureId);
    assert.ok(creature, `missing fixture creature ${String(creatureId)}`);
    return creature;
  });
  const enemies = buildAuthoredColiseumEnemyTeam(save.saveId, encounter);
  const state = createBattleState({
    battleId,
    playerCreatures: team,
    enemyCreatures: enemies,
    playerTeamName: "C4 Sequencing Team",
    enemyTeamName: encounter.opponentName,
  });
  return { ...state, outcome: "player_won" as const };
}

test("an active C4 gauntlet only accepts its exact saved continuation", () => {
  const { save, teamIds } = fixture();
  const cleared = grantAllC2Clears(save);
  const gauntlet = getColiseumC4Gauntlets(cleared)[0];
  assert.ok(gauntlet);
  const performance = createColiseumPerformance(teamIds);

  const stageOneState = buildFinalState(
    cleared,
    gauntlet,
    0,
    teamIds,
    "c4_sequence_stage_one_battle",
  );
  const stageOne = recordColiseumC4BattleResult(
    cleared,
    gauntlet,
    0,
    "player_won",
    4,
    teamIds,
    performance,
    "c4_sequence_stage_one",
    stageOneState,
  );
  assert.equal(stageOne.ok, true);
  assert.equal(getColiseumC4State(stageOne.save).activeRun?.stageIndex, 1);

  const savedStateBeforeRejectedResults = stageOne.save.flags.coliseumC4StateV1;
  const creatureXpBeforeRejectedResults = stageOne.save.creatures?.map((creature) => ({
    creatureId: creature.creatureId,
    level: creature.level,
    xp: creature.xp,
  }));

  const replayState = buildFinalState(
    stageOne.save,
    gauntlet,
    0,
    teamIds,
    "c4_sequence_replay_stage_one_battle",
  );
  const replay = recordColiseumC4BattleResult(
    stageOne.save,
    gauntlet,
    0,
    "player_won",
    3,
    teamIds,
    performance,
    "c4_sequence_replay_stage_one",
    replayState,
  );
  assert.equal(replay.ok, false);
  assert.equal(replay.changed, false);
  assert.match(replay.message, /gauntlet is already active/i);
  assert.equal(replay.save.flags.coliseumC4StateV1, savedStateBeforeRejectedResults);
  assert.deepEqual(
    replay.save.creatures?.map((creature) => ({
      creatureId: creature.creatureId,
      level: creature.level,
      xp: creature.xp,
    })),
    creatureXpBeforeRejectedResults,
  );

  const daily = getColiseumC4DailyChallenge(stageOne.save);
  const dailyState = buildFinalState(
    stageOne.save,
    daily,
    0,
    teamIds,
    "c4_sequence_daily_while_gauntlet_battle",
  );
  const dailyDuringRun = recordColiseumC4BattleResult(
    stageOne.save,
    daily,
    0,
    "player_won",
    3,
    teamIds,
    performance,
    "c4_sequence_daily_while_gauntlet",
    dailyState,
  );
  assert.equal(dailyDuringRun.ok, false);
  assert.equal(dailyDuringRun.changed, false);
  assert.match(dailyDuringRun.message, /gauntlet is already active/i);
  assert.equal(dailyDuringRun.save.flags.coliseumC4StateV1, savedStateBeforeRejectedResults);

  const stageTwoState = buildFinalState(
    stageOne.save,
    gauntlet,
    1,
    teamIds,
    "c4_sequence_stage_two_battle",
  );
  const stageTwo = recordColiseumC4BattleResult(
    stageOne.save,
    gauntlet,
    1,
    "player_won",
    5,
    teamIds,
    performance,
    "c4_sequence_stage_two",
    stageTwoState,
  );
  assert.equal(stageTwo.ok, true);
  assert.equal(getColiseumC4State(stageTwo.save).activeRun?.stageIndex, 2);
});

test("a later gauntlet stage cannot be recorded without a saved run", () => {
  const { save, teamIds } = fixture();
  const cleared = grantAllC2Clears(save);
  const gauntlet = getColiseumC4Gauntlets(cleared)[0];
  assert.ok(gauntlet);
  const finalState = buildFinalState(
    cleared,
    gauntlet,
    1,
    teamIds,
    "c4_sequence_orphan_stage_battle",
  );

  const result = recordColiseumC4BattleResult(
    cleared,
    gauntlet,
    1,
    "player_won",
    4,
    teamIds,
    createColiseumPerformance(teamIds),
    "c4_sequence_orphan_stage",
    finalState,
  );

  assert.equal(result.ok, false);
  assert.equal(result.changed, false);
  assert.match(result.message, /no saved continuation/i);
  assert.equal(getColiseumC4State(result.save).history.length, 0);
});
