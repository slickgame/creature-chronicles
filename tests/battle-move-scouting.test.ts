import test from "node:test";
import assert from "node:assert/strict";
import type { BattleMove } from "@/types/battle";

const { getBattleMove } = await import("@/data/battleMoves");
const { getBattleMoveScoutingHint, getBattleMoveScoutingEffects, getBattleMoveScoutingMechanics } = await import("@/data/battleMoveScouting");
const { COLISEUM_C2_ENCOUNTERS, getColiseumEnemyPreview } = await import("@/data/coliseumC2");
const { buildColiseumOpening } = await import("@/data/coliseumBattleOpening");
const { createNewGameSave } = await import("./helpers/establishedSave.ts");

test("every opponent scouts the actual normalized battle moves, including the required basic attack", () => {
  const save = createNewGameSave("Move Scouting Tester", 0);
  const team = (save.creatures ?? []).slice(0, 3);
  for (const encounter of COLISEUM_C2_ENCOUNTERS) {
    const { state } = buildColiseumOpening({ save, team, encounter, playerTeamName: "Scouting Team" }, "move-scouting-test");
    for (const row of getColiseumEnemyPreview(encounter)) {
      const combatant = Object.values(state.combatants).find(entry => entry.sourceCreatureId === row.sourceCreatureId);
      assert.ok(combatant);
      assert.deepEqual(row.moveIds, combatant.loadout.equippedMoveIds, `${encounter.name} · ${row.name}`);
      assert.deepEqual(row.moves, combatant.loadout.equippedMoveIds.map(moveId => getBattleMove(moveId).name));
      assert.ok(row.moveIds.includes("strike"));
    }
  }
});

test("move scouting uses live authored costs and base cooldowns without inventing a current cooldown", () => {
  const move = getBattleMove("checking_blow");
  assert.equal(getBattleMoveScoutingHint(move),
    `Checking Blow\n8 BE · Base cooldown 2 rounds · One Enemy\n${move.description}`);
  assert.deepEqual(getBattleMoveScoutingEffects(move), [
    { label: "Damage", details: "One Enemy · Uses power 16" },
    { label: "Slowed", details: "One Enemy · Base chance 75% · 2 rounds" },
  ]);
});

test("move scouting separates scaled healing and damage power from fixed Battle Energy", () => {
  assert.deepEqual(getBattleMoveScoutingEffects(getBattleMove("restorative_rhythm")), [
    { label: "Heal", details: "All living allies · Base healing 24" },
    { label: "Clear Exhausted", details: "All living allies" },
    { label: "Clear Weakened", details: "All living allies" },
  ]);
  assert.deepEqual(getBattleMoveScoutingEffects(getBattleMove("energy_link")), [
    { label: "Restore Battle Energy", details: "One Ally · 14 BE" },
    { label: "Inspired", details: "One Ally · 1 round" },
  ]);
  assert.match(getBattleMoveScoutingEffects(getBattleMove("hoof_strike"))[0].details, /Uses power 25/);
  assert.doesNotMatch(getBattleMoveScoutingEffects(getBattleMove("hoof_strike"))[0].details, /25 HP/);
});

test("compact scouting preserves recipients, stat, explicit effect fields and full notes", () => {
  const move: BattleMove = {
    ...getBattleMove("quick_step"),
    effects: [{ type: "buff_stat", target: "self", stat: "evasion", amount: 8,
      chance: 80, duration: 2, maxStacks: 2, note: "The complete authored note stays available." }],
  };
  assert.deepEqual(getBattleMoveScoutingEffects(move), [{
    label: "Inspired · Evasion",
    details: "Self · Amount 8 · Base chance 80% · 2 rounds · Max 2 stacks",
    note: "The complete authored note stays available.",
  }]);
});

test("grouped scouting mechanics retain tag-only rules and deduplicate repeated status definitions", () => {
  const guardBreak = getBattleMoveScoutingMechanics(getBattleMove("arena_breaker"));
  assert.match(guardBreak.find(entry => entry.label === "Scouting values")?.mechanics ?? "", /base move values.*Actual damage/);
  assert.ok(guardBreak.some(entry => entry.label === "Physical Power"));
  assert.ok(guardBreak.some(entry => entry.label === "Defense"));
  assert.match(guardBreak.find(entry => entry.label === "Guard Break")?.mechanics ?? "", /25% more damage.*removes Guarded/);
  const move: BattleMove = {
    ...getBattleMove("defend"),
    effects: [
      { type: "apply_status", target: "self", status: "guarded", amount: 25, duration: 1 },
      { type: "guard", target: "allies", duration: 1 },
      { type: "taunt", target: "enemies", duration: 1 },
    ],
  };
  const mechanics = getBattleMoveScoutingMechanics(move);
  assert.equal(mechanics.filter(entry => entry.label === "Guarded").length, 1);
  assert.ok(mechanics.some(entry => entry.label === "Taunted"));
  assert.deepEqual(getBattleMoveScoutingEffects(move).map(entry => entry.label), ["Guarded", "Guarded", "Taunted"]);
});
