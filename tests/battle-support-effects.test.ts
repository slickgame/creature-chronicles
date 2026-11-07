import assert from "node:assert/strict";
import test from "node:test";
import { createBattleState, previewBattleAction, resolveBattleTurn } from "@/data/battleEngine";
import { BATTLE_OUTCOME_FADE_MS, BATTLE_OUTCOME_STAGGER_MS, buildBattlePlaybackEvents } from "@/data/battlePresentation";
import type { BattleAction } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import { createNewGameSave } from "./helpers/establishedSave.ts";

test("team recovery plays back actual removals and retains no-op forecasts", () => {
  const [feline, canine, bovine, , equine] = createNewGameSave("Support", 0).creatures!;
  const caster: CreatureRecord = {
    ...equine,
    battleMoveLoadout: {
      version: 1,
      learnedMoveIds: ["strike", "restorative_rhythm"],
      equippedMoveIds: ["strike", "restorative_rhythm"],
    },
  };
  const state = createBattleState({
    battleId: "support-playback",
    playerCreatures: [caster, feline, canine],
    enemyCreatures: [bovine],
  });
  const [casterId, injuredId, fullId] = state.teams.player.combatantIds;
  const action: BattleAction = { actorId: casterId, moveId: "restorative_rhythm", targetIds: [] };
  state.combatants[casterId].currentHp -= 12;
  state.combatants[casterId].statuses = [{ status: "exhausted", duration: 2 }];
  state.combatants[injuredId].currentHp -= 8;
  state.combatants[fullId].statuses = [
    { status: "weakened", duration: 2 },
    { status: "slowed", duration: 2 },
  ];

  const preview = previewBattleAction(state, action);
  assert.equal(preview.filter(entry => entry.description === "No matching status to clear").length, 4);
  const resolved = resolveBattleTurn(state, [casterId, ...state.teams.enemy.combatantIds], action);
  assert.ok(resolved);
  const { frames, state: settled } = resolved;
  assert.deepEqual(frames.slice(1).map(({ targetIds, label, statusOutcome }) => [targetIds[0], label, statusOutcome]), [
    [casterId, "+12 HP", undefined],
    [injuredId, "+8 HP", undefined],
    [fullId, "Full HP", undefined],
    [casterId, "exhausted cleared", { status: "exhausted", result: "cleared" }],
    [fullId, "weakened cleared", { status: "weakened", result: "cleared" }],
  ]);
  assert.deepEqual(settled.combatants[fullId].statuses, [{ status: "slowed", duration: 2 }]);
  assert.equal(settled.combatants[fullId].currentHp, state.combatants[fullId].currentHp);

  const [attack, results, ...remaining] = buildBattlePlaybackEvents(frames, { staggerMultiTarget: true });
  assert.equal(attack.kind, "attack");
  assert.deepEqual(remaining, []);
  assert.equal(results.state, frames.at(-1)?.state);
  assert.equal(results.durationMs, BATTLE_OUTCOME_FADE_MS + 2 * BATTLE_OUTCOME_STAGGER_MS);
  assert.deepEqual(results.targetOutcomes?.map(({ targetId, kind, label, supportStatuses }) =>
    [targetId, kind, label, supportStatuses],
  ), [
    [casterId, "heal", "+12 HP", [{ status: "exhausted", result: "cleared" }]],
    [injuredId, "heal", "+8 HP", []],
    [fullId, "status", "", [{ status: "weakened", result: "cleared" }]],
  ]);
});
