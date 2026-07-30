import test from "node:test";
import assert from "node:assert/strict";

const {
  COLISEUM_ENCOUNTERS,
  COLISEUM_PROGRESS_FLAG,
  buildColiseumEnemyTeam,
  getColiseumAccess,
  getColiseumEncounterRecord,
  getColiseumNextEncounter,
  getColiseumProgress,
  recordColiseumBattleResult,
} = await import("../src/data/coliseum.ts");
const {
  BATTLE_OUTFITTER_ITEMS,
  getBattleOutfitterStock,
} = await import("@/data/battleOutfitter");
const {
  createNewGameSave,
} = await import("@/lib/save/localSave");

function createFixture() {
  const save = createNewGameSave("Coliseum Tester", 0);
  const creatures = save.creatures ?? [];
  assert.ok(creatures.length >= 2, "fixture requires starter creatures");
  const team = [creatures[0], creatures[1], { ...creatures[0], creatureId: "coliseum_third" as never, nickname: "Third" }];
  return { save: { ...save, creatures: team, creatureIds: team.map((creature) => creature.creatureId) }, team };
}

function encounter(id: string) {
  const result = COLISEUM_ENCOUNTERS.find((entry) => entry.encounterId === id);
  assert.ok(result, `missing encounter ${id}`);
  return result;
}

test("Coliseum unlocks begin with Novice and advance in prerequisite order", () => {
  const { save } = createFixture();
  const novice = encounter("novice_echo_trial");
  const bronze = encounter("bronze_pack_clash");
  assert.equal(getColiseumAccess(save, novice).unlocked, true);
  assert.equal(getColiseumAccess(save, bronze).unlocked, false);
  assert.equal(getColiseumNextEncounter(save)?.encounterId, novice.encounterId);

  const cleared = recordColiseumBattleResult(save, novice.encounterId, "player_won", 4, save.creatureIds.slice(0, 3));
  assert.equal(getColiseumAccess(cleared.save, bronze).unlocked, true);
  assert.equal(getColiseumNextEncounter(cleared.save)?.encounterId, bronze.encounterId);
});

test("first clear grants the large reward and item exactly once", () => {
  const { save } = createFixture();
  const novice = encounter("novice_echo_trial");
  const tonic = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === "field_tonic");
  assert.ok(tonic);
  const startingGold = save.currencies.gold;
  const startingGp = save.currencies.guildPoints;
  const startingTonic = getBattleOutfitterStock(save, tonic);

  const first = recordColiseumBattleResult(save, novice.encounterId, "player_won", 5, save.creatureIds.slice(0, 3));
  assert.equal(first.firstClear, true);
  assert.equal(first.save.currencies.gold, startingGold + novice.firstClearReward.gold);
  assert.equal(first.save.currencies.guildPoints, startingGp + novice.firstClearReward.guildPoints);
  assert.equal(getBattleOutfitterStock(first.save, tonic), startingTonic + 1);

  const repeat = recordColiseumBattleResult(first.save, novice.encounterId, "player_won", 3, save.creatureIds.slice(0, 3));
  assert.equal(repeat.firstClear, false);
  assert.equal(repeat.save.currencies.gold, first.save.currencies.gold + novice.repeatReward.gold);
  assert.equal(repeat.save.currencies.guildPoints, first.save.currencies.guildPoints + novice.repeatReward.guildPoints);
  assert.equal(getBattleOutfitterStock(repeat.save, tonic), startingTonic + 1, "repeat reward must not duplicate the first-clear item");
  assert.equal(getColiseumEncounterRecord(repeat.save, novice.encounterId).bestWinRounds, 3);
});

test("losses create permanent records without paying rewards", () => {
  const { save } = createFixture();
  const novice = encounter("novice_echo_trial");
  const result = recordColiseumBattleResult(save, novice.encounterId, "enemy_won", 6, save.creatureIds.slice(0, 3));
  assert.equal(result.save.currencies.gold, save.currencies.gold);
  assert.equal(result.save.currencies.guildPoints, save.currencies.guildPoints);
  assert.equal(result.progress.totalAttempts, 1);
  assert.equal(result.progress.totalLosses, 1);
  assert.equal(result.record.losses, 1);
  assert.equal(result.progress.completedEncounterIds.includes(novice.encounterId), false);
  assert.equal(result.historyEntry.rewardGold, 0);
});

test("malformed Coliseum progress safely resets instead of breaking the save", () => {
  const { save } = createFixture();
  const malformed = { ...save, flags: { ...save.flags, [COLISEUM_PROGRESS_FLAG]: "{bad-json" } };
  const progress = getColiseumProgress(malformed);
  assert.equal(progress.totalAttempts, 0);
  assert.deepEqual(progress.completedEncounterIds, []);
  assert.deepEqual(progress.history, []);
});

test("encounter enemy teams use isolated ids and configured level offsets", () => {
  const { team } = createFixture();
  const silver = encounter("silver_guard_circuit");
  const enemies = buildColiseumEnemyTeam(team, silver);
  assert.equal(enemies.length, 3);
  enemies.forEach((enemy, index) => {
    const source = [...team].reverse()[index];
    assert.notEqual(enemy.creatureId, source.creatureId);
    assert.equal(enemy.level, source.level + silver.enemyLevelOffset);
    assert.equal(enemy.originLabel, silver.opponentName);
  });
});
