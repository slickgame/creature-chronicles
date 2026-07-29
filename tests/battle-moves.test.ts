import test from "node:test";
import assert from "node:assert/strict";

const {
  auditBattleMoveFoundation,
} = await import("../src/data/battleMoveAudit.ts");
const {
  BATTLE_MOVE_COMBINATION_RECIPES,
} = await import("../src/data/battleMoveRecipes.ts");
const {
  BATTLE_MOVES,
  BATTLE_MOVES_BY_ID,
} = await import("../src/data/battleMoves.ts");
const {
  BATTLE_SPECIES_PROFILES,
} = await import("../src/data/battleProfiles.ts");
const {
  MAX_EQUIPPED_BATTLE_MOVES,
  MAX_LEARNED_BATTLE_MOVES,
  REQUIRED_BASIC_BATTLE_MOVE_ID,
  canSpeciesLearnBattleMove,
  equipBattleMove,
  getCreatureBattleMoveLoadout,
  learnBattleMove,
  normalizeBattleMoveLoadout,
} = await import("../src/data/battleLoadouts.ts");
const {
  createBattleState,
} = await import("../src/data/battleEngine.ts");
const {
  createNewGameSave,
  saveGameToSlot,
} = await import("../src/lib/save/localSave.ts");

function firstCreature() {
  const save = createNewGameSave("Move Test", 0);
  const creature = save.creatures?.[0];
  assert.ok(creature);
  return { save, creature };
}

test("battle move catalog contains all five gameplay categories and complete metadata", () => {
  const categories = new Set(BATTLE_MOVES.map((move) => move.category));
  assert.deepEqual([...categories].sort(), ["healing", "physical", "special", "status", "support"]);
  assert.equal(new Set(BATTLE_MOVES.map((move) => move.id)).size, BATTLE_MOVES.length);
  for (const move of BATTLE_MOVES) {
    assert.ok(move.description.length > 0, `${move.id} needs a description`);
    assert.ok(move.tags.length > 0, `${move.id} needs tags`);
    assert.ok(move.effects.length > 0, `${move.id} needs effects`);
    assert.ok(move.definitionVersion && move.definitionVersion >= 1, `${move.id} needs a definition version`);
    assert.ok(move.scalingStat, `${move.id} needs scaling metadata`);
    assert.ok(move.resistedBy, `${move.id} needs resistance metadata`);
    assert.ok(move.aiHints?.length, `${move.id} needs AI-use hints`);
  }
});

test("battle move audit reports no catalog, species, recipe, or normalized-loadout errors", () => {
  const save = createNewGameSave("Move Audit", 0);
  const report = auditBattleMoveFoundation(save);
  assert.equal(report.errorCount, 0, report.issues.map((entry) => `${entry.issueId}: ${entry.message}`).join("\n"));
  assert.ok(report.moveCount >= 30);
  assert.equal(report.speciesProfileCount, 5);
  assert.ok(report.recipeCount >= 3);
});

test("every species profile has legal learned moves and an always-usable equipped fallback", () => {
  for (const profile of BATTLE_SPECIES_PROFILES) {
    assert.ok(profile.defaultLearnedMoveIds.length <= MAX_LEARNED_BATTLE_MOVES);
    assert.ok(profile.defaultEquippedMoveIds.length <= MAX_EQUIPPED_BATTLE_MOVES);
    assert.ok(profile.defaultLearnedMoveIds.includes(profile.signatureMoveId));
    for (const moveId of profile.defaultLearnedMoveIds) {
      assert.ok(BATTLE_MOVES_BY_ID[moveId], `${profile.speciesId} references ${moveId}`);
      assert.equal(canSpeciesLearnBattleMove(profile.speciesId, moveId), true);
    }
    assert.ok(profile.defaultEquippedMoveIds.every((moveId) => profile.defaultLearnedMoveIds.includes(moveId)));
    assert.ok(profile.defaultEquippedMoveIds.some((moveId) => {
      const move = BATTLE_MOVES_BY_ID[moveId];
      return move.battleEnergyCost === 0 && move.cooldown === 0;
    }));
  }
});

test("new and save-normalized creatures persist legal learned and equipped move libraries", () => {
  const save = createNewGameSave("Persistent Moves", 0);
  for (const creature of save.creatures ?? []) {
    assert.ok(creature.battleMoveLoadout);
    const loadout = getCreatureBattleMoveLoadout(creature);
    assert.ok(loadout.learnedMoveIds.length <= MAX_LEARNED_BATTLE_MOVES);
    assert.ok(loadout.equippedMoveIds.length <= MAX_EQUIPPED_BATTLE_MOVES);
    assert.ok(loadout.learnedMoveIds.includes(REQUIRED_BASIC_BATTLE_MOVE_ID));
    assert.ok(loadout.equippedMoveIds.every((moveId) => loadout.learnedMoveIds.includes(moveId)));
  }

  const creature = save.creatures?.[0];
  assert.ok(creature);
  const damaged = {
    ...save,
    creatures: [{
      ...creature,
      battleMoveLoadout: {
        learnedMoveIds: ["missing_move", "strike", "strike"],
        equippedMoveIds: ["missing_move"],
      },
    }, ...(save.creatures ?? []).slice(1)],
  };
  const repaired = saveGameToSlot(damaged);
  const repairedCreature = repaired.creatures?.[0];
  assert.ok(repairedCreature?.battleMoveLoadout);
  assert.ok(!repairedCreature.battleMoveLoadout.learnedMoveIds.includes("missing_move"));
  assert.ok(repairedCreature.battleMoveLoadout.learnedMoveIds.includes("strike"));
  assert.ok(repairedCreature.battleMoveLoadout.equippedMoveIds.some((moveId) => {
    const move = BATTLE_MOVES_BY_ID[moveId];
    return move.battleEnergyCost === 0 && move.cooldown === 0;
  }));
});

test("move learning and equipping respect compatibility and library limits", () => {
  const { creature } = firstCreature();
  const base = normalizeBattleMoveLoadout(creature.speciesId, {
    learnedMoveIds: ["strike", "pounce", "defend"],
    equippedMoveIds: ["strike", "pounce"],
  });
  const learned = learnBattleMove(creature.speciesId, base, "will_bolt");
  assert.equal(learned.ok, true);
  assert.ok(learned.loadout.learnedMoveIds.includes("will_bolt"));
  const equipped = equipBattleMove(creature.speciesId, learned.loadout, "will_bolt");
  assert.equal(equipped.ok, true);
  assert.ok(equipped.loadout.equippedMoveIds.includes("will_bolt"));

  const full = normalizeBattleMoveLoadout(creature.speciesId, {
    learnedMoveIds: BATTLE_SPECIES_PROFILES.find((profile) => profile.speciesId === creature.speciesId)?.defaultLearnedMoveIds,
  });
  assert.equal(full.learnedMoveIds.length, MAX_LEARNED_BATTLE_MOVES);
  const rejected = learnBattleMove(creature.speciesId, full, "will_bolt");
  assert.equal(rejected.ok, false);
});

test("battle initialization consumes the creature's persisted equipped loadout", () => {
  const save = createNewGameSave("Persistent Battle", 0);
  const player = save.creatures?.[0];
  const enemy = save.creatures?.[1];
  assert.ok(player && enemy);
  const customPlayer = {
    ...player,
    battleMoveLoadout: normalizeBattleMoveLoadout(player.speciesId, {
      learnedMoveIds: ["strike", "pounce", "will_bolt"],
      equippedMoveIds: ["will_bolt", "strike"],
    }),
  };
  const state = createBattleState({
    battleId: "persistent_loadout_test",
    playerCreatures: [customPlayer],
    enemyCreatures: [enemy],
  });
  const combatant = Object.values(state.combatants).find((entry) => entry.sideId === "player");
  assert.ok(combatant);
  assert.deepEqual(combatant.loadout.equippedMoveIds.slice(0, 2), ["will_bolt", "strike"]);
});

test("combination recipes reference real parent and output moves", () => {
  for (const recipe of BATTLE_MOVE_COMBINATION_RECIPES) {
    assert.ok(BATTLE_MOVES_BY_ID[recipe.outputMoveId]);
    assert.equal(BATTLE_MOVES_BY_ID[recipe.outputMoveId].sourceType, "combination");
    assert.ok(recipe.parentAMoveIds.every((moveId) => BATTLE_MOVES_BY_ID[moveId]));
    assert.ok(recipe.parentBMoveIds.every((moveId) => BATTLE_MOVES_BY_ID[moveId]));
    assert.ok(BATTLE_MOVES_BY_ID[recipe.outputMoveId].combinationRecipeIds?.includes(recipe.recipeId));
  }
});
