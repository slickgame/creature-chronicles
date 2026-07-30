import test from "node:test";
import assert from "node:assert/strict";

const {
  buildBattlePresentationEvents,
  getBattleMoveEffectPreset,
  getBattlePortraitConfig,
} = await import("@/data/battlePresentation");
const { getBattleMove } = await import("@/data/battleMoves");

const battleStats = {
  maxHp: 50,
  physicalPower: 10,
  specialPower: 10,
  defense: 10,
  resistance: 10,
  speed: 10,
  accuracy: 100,
  evasion: 0,
  statusPower: 10,
  statusResist: 10,
  battleEnergy: 5,
};

function combatant(id: string, name: string, sideId: "player" | "enemy", hp: number, fainted = false) {
  return {
    battleCombatantId: id,
    sourceCreatureId: `source_${id}`,
    sideId,
    slotIndex: 0,
    name,
    speciesId: sideId === "player" ? "species_canine" : "species_feline",
    level: 1,
    battleStats,
    loadout: { learnedMoveIds: ["strike"], equippedMoveIds: ["strike"] },
    currentHp: hp,
    maxHp: 50,
    currentBattleEnergy: 5,
    maxBattleEnergy: 5,
    cooldowns: {},
    statuses: [],
    isFainted: fainted,
  };
}

function state(enemyHp: number, enemyFainted = false) {
  const hero = combatant("hero", "Hero", "player", 45);
  const rival = combatant("rival", "Rival", "enemy", enemyHp, enemyFainted);
  return {
    battleId: "presentation_test",
    roundNumber: 1,
    outcome: enemyFainted ? "player_won" : "ongoing",
    teams: {
      player: { sideId: "player", name: "Ranch Team", combatantIds: ["hero"] },
      enemy: { sideId: "enemy", name: "Enemy Team", combatantIds: ["rival"] },
    },
    combatants: { hero, rival },
    log: [],
  };
}

test("portrait framing includes tuned base-species presets", () => {
  const bovine = getBattlePortraitConfig("species_bovine");
  const canine = getBattlePortraitConfig("species_canine");
  const lapine = getBattlePortraitConfig("species_lapine");
  assert.ok(bovine.frameWidth > canine.frameWidth);
  assert.ok(lapine.frameHeight > canine.frameHeight);
  assert.ok(bovine.scale < canine.scale);
});

test("move categories map to reusable presentation effects", () => {
  const strike = getBattleMove("strike");
  assert.equal(getBattleMoveEffectPreset(strike), "impact");
  assert.equal(getBattleMoveEffectPreset({ ...strike, category: "special" }), "projectile");
  assert.equal(getBattleMoveEffectPreset({ ...strike, category: "healing" }), "heal");
  assert.equal(getBattleMoveEffectPreset({ ...strike, effects: [{ type: "guard", target: "self", amount: 25 }] }), "shield");
});

test("resolved logs become ordered attack, damage, and knockout presentation events", () => {
  const before = state(12, false);
  const after = state(0, true);
  const events = buildBattlePresentationEvents(before, after, {
    roundNumber: 1,
    outcome: "player_won",
    log: ["Hero uses Strike.", "Strike hits Rival for 12 damage.", "Rival fainted."],
    actions: [{
      actorId: "hero",
      actorName: "Hero",
      moveId: "strike",
      moveName: "Strike",
      targetIds: ["rival"],
      targetNames: ["Rival"],
      turnScore: 10,
      success: true,
      log: ["Hero uses Strike.", "Strike hits Rival for 12 damage.", "Rival fainted."],
      hitTargetIds: ["rival"],
      missedTargetIds: [],
    }],
  });

  assert.deepEqual(events.map((event) => event.kind), ["attack", "damage", "knockout"]);
  assert.equal(events[1].label, "-12");
  assert.deepEqual(events[2].targetIds, ["rival"]);
});

test("missed targets receive a dedicated readable event", () => {
  const before = state(50, false);
  const events = buildBattlePresentationEvents(before, before, {
    roundNumber: 1,
    outcome: "ongoing",
    log: ["Hero uses Strike.", "Strike misses Rival (80% hit chance)."],
    actions: [{
      actorId: "hero",
      actorName: "Hero",
      moveId: "strike",
      moveName: "Strike",
      targetIds: ["rival"],
      targetNames: ["Rival"],
      turnScore: 10,
      success: true,
      log: ["Hero uses Strike.", "Strike misses Rival (80% hit chance)."],
      hitTargetIds: [],
      missedTargetIds: ["rival"],
    }],
  });
  assert.equal(events[1].kind, "miss");
  assert.equal(events[1].label, "Miss");
});
