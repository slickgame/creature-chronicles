import test from "node:test";
import assert from "node:assert/strict";

const {
  BATTLE_OUTFITTER_ITEMS,
  getBattleOutfitterStock,
} = await import("@/data/battleOutfitter");
const {
  equipCreatureBattleMove,
  getBattleMoveTrainingOptions,
  teachBattleMoveWithFocusManual,
  unequipCreatureBattleMove,
} = await import("../src/data/battleMoveTraining.ts");
const {
  MAX_EQUIPPED_BATTLE_MOVES,
  getCreatureBattleMoveLoadout,
} = await import("../src/data/battleLoadouts.ts");
const {
  createNewGameSave,
} = await import("@/lib/save/localSave");

function createFixture() {
  const save = createNewGameSave("Move Trainer", 0);
  const creature = (save.creatures ?? [])[0];
  assert.ok(creature, "fixture requires a starter creature");
  return { save, creature };
}

test("Focus Manual teaches one compatible unlearned move and consumes exactly one manual", () => {
  const { save, creature } = createFixture();
  const manual = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === "focus_manual");
  assert.ok(manual);
  const stockedSave = {
    ...save,
    flags: { ...save.flags, [manual.flagKey]: 2 },
  };
  const option = getBattleMoveTrainingOptions(creature).find(
    (candidate) => candidate.teachableByFocusManual && !candidate.blockedReason,
  );
  assert.ok(option, "fixture requires a compatible unlearned manual move");

  const result = teachBattleMoveWithFocusManual(
    stockedSave,
    creature.creatureId,
    option.move.id,
  );
  assert.equal(result.ok, true);
  assert.equal(getBattleOutfitterStock(result.save, manual), 1);
  const updated = (result.save.creatures ?? []).find(
    (entry) => entry.creatureId === creature.creatureId,
  );
  assert.ok(updated);
  assert.ok(getCreatureBattleMoveLoadout(updated).learnedMoveIds.includes(option.move.id));
});

test("manual teaching rejects protected combination and event sources without consuming stock", () => {
  const { save, creature } = createFixture();
  const manual = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === "focus_manual");
  assert.ok(manual);
  const stockedSave = {
    ...save,
    flags: { ...save.flags, [manual.flagKey]: 1 },
  };
  const protectedOption = getBattleMoveTrainingOptions(creature).find(
    (candidate) => !candidate.learned && !candidate.teachableByFocusManual,
  );
  if (!protectedOption) return;

  const result = teachBattleMoveWithFocusManual(
    stockedSave,
    creature.creatureId,
    protectedOption.move.id,
  );
  assert.equal(result.ok, false);
  assert.equal(getBattleOutfitterStock(result.save, manual), 1);
});

test("learned moves can replace an equipped move while respecting the four-move limit", () => {
  const { save, creature } = createFixture();
  const manual = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === "focus_manual");
  assert.ok(manual);
  const stockedSave = {
    ...save,
    flags: { ...save.flags, [manual.flagKey]: 2 },
  };
  const teachable = getBattleMoveTrainingOptions(creature).find(
    (candidate) => candidate.teachableByFocusManual && !candidate.blockedReason,
  );
  assert.ok(teachable);
  const taught = teachBattleMoveWithFocusManual(
    stockedSave,
    creature.creatureId,
    teachable.move.id,
  );
  assert.equal(taught.ok, true);
  const taughtCreature = (taught.save.creatures ?? []).find(
    (entry) => entry.creatureId === creature.creatureId,
  );
  assert.ok(taughtCreature);
  const before = getCreatureBattleMoveLoadout(taughtCreature);
  const replaceMoveId = before.equippedMoveIds.at(-1);
  assert.ok(replaceMoveId);

  const equipped = equipCreatureBattleMove(
    taught.save,
    creature.creatureId,
    teachable.move.id,
    before.equippedMoveIds.length >= MAX_EQUIPPED_BATTLE_MOVES
      ? replaceMoveId
      : undefined,
  );
  assert.equal(equipped.ok, true);
  const equippedCreature = (equipped.save.creatures ?? []).find(
    (entry) => entry.creatureId === creature.creatureId,
  );
  assert.ok(equippedCreature);
  const after = getCreatureBattleMoveLoadout(equippedCreature);
  assert.ok(after.equippedMoveIds.includes(teachable.move.id));
  assert.ok(after.equippedMoveIds.length <= MAX_EQUIPPED_BATTLE_MOVES);
});

test("unequipping cannot remove the final zero-cost fallback action", () => {
  const { save, creature } = createFixture();
  const loadout = getCreatureBattleMoveLoadout(creature);
  const fallbackMoveId = loadout.equippedMoveIds.find((moveId) => moveId === "strike");
  assert.ok(fallbackMoveId, "fixture requires Strike as an equipped fallback");
  const result = unequipCreatureBattleMove(
    save,
    creature.creatureId,
    fallbackMoveId,
  );
  if (loadout.equippedMoveIds.some((moveId) => moveId !== fallbackMoveId && moveId === "defend")) {
    assert.equal(result.ok, true);
  } else {
    assert.equal(result.ok, false);
  }
});
