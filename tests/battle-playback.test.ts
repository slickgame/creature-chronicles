import assert from "node:assert/strict";
import test from "node:test";
import { createBattleState } from "@/data/battleEngine";
import { buildBattlePlaybackEvents } from "@/data/battlePresentation";
import type { BattlePlaybackFrame } from "@/types/battle";
import { createNewGameSave } from "./helpers/establishedSave.ts";

function thunderTreadFrames() {
  const creatures = createNewGameSave("Playback", 0).creatures!;
  const state = createBattleState({
    battleId: "playback-test",
    playerCreatures: [creatures[0]],
    enemyCreatures: [creatures[1], creatures[0], creatures[1]],
  });
  const [actorId] = state.teams.player.combatantIds;
  const [first, second, third] = state.teams.enemy.combatantIds;
  const base = { state, actorId, moveId: "thunder_tread" };
  const settled = { ...state, log: ["Thunder Tread resolved."] };
  const frames: BattlePlaybackFrame[] = [
    { ...base, kind: "attack", targetIds: [first, second, third], label: "Thunder Tread" },
    { ...base, kind: "miss", targetIds: [third], label: "Miss" },
    { ...base, kind: "damage", targetIds: [first], label: "-18 HP" },
    { ...base, kind: "damage", targetIds: [second], label: "-14 HP" },
    { ...base, kind: "knockout", targetIds: [second], label: "K.O." },
    { ...base, state: settled, kind: "status", targetIds: [first], label: "Slowed", statusOutcome: { status: "slowed", result: "applied" } },
    { state: settled, kind: "damage", targetIds: [first], label: "-5 HP · Bleed" },
  ];
  return { frames, settled, first, second, third };
}

test("multi-target playback groups the settled move in target order and preserves misses, knockouts, and recovery", () => {
  const { frames, settled, first, second, third } = thunderTreadFrames();
  const [attack, results, recovery, ...rest] = buildBattlePlaybackEvents(frames, { staggerMultiTarget: true });
  assert.deepEqual(rest, []);
  assert.equal(attack.state, frames[0].state);
  assert.equal(results.state, settled);
  assert.deepEqual(results.targetOutcomes, [
    { targetId: first, kind: "damage", label: "-18 HP", statusOutcome: { status: "slowed", result: "applied" } },
    { targetId: second, kind: "damage", label: "-14 HP", knockedOut: true },
    { targetId: third, kind: "miss", label: "Miss" },
  ]);
  assert.equal(recovery.label, "-5 HP · Bleed");
  assert.equal(recovery.targetOutcomes, undefined);
});

test("opt-in stagger leaves single-target and multi-hit playback beats intact", () => {
  const { frames, first } = thunderTreadFrames();
  const [attack, , damage] = frames;
  const singleTarget = [{ ...attack, targetIds: [first] }, damage];
  const repeatedHit = [...frames.slice(0, 3), damage, ...frames.slice(3)];
  for (const sequence of [singleTarget, repeatedHit]) {
    assert.deepEqual(
      buildBattlePlaybackEvents(sequence, { staggerMultiTarget: true }),
      buildBattlePlaybackEvents(sequence),
    );
  }
});
