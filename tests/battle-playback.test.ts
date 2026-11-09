import assert from "node:assert/strict";
import test from "node:test";
import { createBattleState, resolveBattleTurn } from "@/data/battleEngine";
import { buildBattlePlaybackEvents, buildBattlePresentationEvents } from "@/data/battlePresentation";
import type { BattleMoveId, BattlePlaybackFrame } from "@/types/battle";
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
    { ...base, kind: "damage", targetIds: [first], label: "-18 HP", guardImpact: "held" },
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
    { targetId: first, kind: "damage", label: "-18 HP", guardImpact: "held", statusOutcome: { status: "slowed", result: "applied" } },
    { targetId: second, kind: "damage", label: "-14 HP", knockedOut: true },
    { targetId: third, kind: "miss", label: "Miss" },
  ]);
  assert.equal(recovery.label, "-5 HP · Bleed");
  assert.equal(recovery.targetOutcomes, undefined);
});

test("grouped damage keeps a guard impact on its target and off the group itself", () => {
  const { frames, first, second, third } = thunderTreadFrames();
  const [attack, miss, firstHit, lastHit] = frames;
  const sequence = [attack, miss, { ...firstHit, guardImpact: undefined }, { ...lastHit, guardImpact: "held" as const }];
  const [, result] = buildBattlePlaybackEvents(sequence, { staggerMultiTarget: true });
  assert.equal(result.guardImpact, undefined);
  assert.deepEqual(result.targetOutcomes?.map(outcome => [outcome.targetId, outcome.guardImpact]), [
    [first, undefined], [second, "held"], [third, undefined],
  ]);
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

test("guard impact follows resolved damage and stays off misses and round recovery", () => {
  const [player, enemy] = createNewGameSave("Guard impact", 0).creatures!;
  const state = createBattleState({
    battleId: "guard-impact-playback",
    playerCreatures: [{ ...player, creatureId: "guard-impact-attacker", nickname: "Attacker" }],
    enemyCreatures: [{ ...enemy, creatureId: "guard-impact-defender", nickname: "Defender" }],
  });
  const [actorId] = state.teams.player.combatantIds;
  const [targetId] = state.teams.enemy.combatantIds;
  const actor = state.combatants[actorId];
  const target = state.combatants[targetId];
  actor.loadout = { ...actor.loadout, learnedMoveIds: ["strike", "guard_break"], equippedMoveIds: ["strike", "guard_break"] };
  actor.battleStats.accuracy = 1000;
  target.battleStats.evasion = 0;

  function resolve(moveId: BattleMoveId, remaining = [actorId, targetId]) {
    const result = resolveBattleTurn(state, remaining, { actorId, moveId, targetIds: [targetId] });
    assert.ok(result);
    return result;
  }

  const unguarded = resolve("strike").frames.find(frame => frame.kind === "damage");
  assert.ok(unguarded);
  assert.equal(unguarded.guardImpact, undefined);

  target.statuses = [{ status: "guarded", duration: 2, amount: 35 }];
  const held = resolve("strike");
  const heldDamage = buildBattlePlaybackEvents(held.frames).find(event => event.kind === "damage");
  assert.ok(heldDamage?.state);
  assert.equal(heldDamage.guardImpact, "held");
  assert.equal(heldDamage.state.combatants[targetId].statuses[0]?.status, "guarded");
  assert.ok(held.state.combatants[targetId].currentHp > unguarded.state.combatants[targetId].currentHp);

  const broken = resolve("guard_break");
  const brokenDamage = buildBattlePlaybackEvents(broken.frames).find(event => event.kind === "damage");
  assert.ok(brokenDamage?.state);
  assert.equal(brokenDamage.guardImpact, "broken");
  assert.ok(!brokenDamage.state.combatants[targetId].statuses.some(stack => stack.status === "guarded"));
  assert.match(broken.result.log.join("\n"), /Guarded status was broken/);

  const legacyDamage = buildBattlePresentationEvents(state, broken.state, broken.result).find(event => event.kind === "damage");
  assert.ok(legacyDamage);
  assert.equal(legacyDamage.guardImpact, undefined);

  target.battleStats.evasion = 1000;
  const missed = resolve("guard_break");
  assert.deepEqual(missed.frames.map(frame => [frame.kind, frame.guardImpact]), [["attack", undefined], ["miss", undefined]]);
  assert.deepEqual(missed.state.combatants[targetId].statuses, target.statuses);

  target.battleStats.evasion = 0;
  target.statuses.push({ status: "bleed", duration: 1 });
  const recovery = resolve("strike", [actorId]).frames.find(frame => frame.roundEndEffect?.kind === "bleed");
  assert.ok(recovery);
  assert.equal(recovery.guardImpact, undefined);
  assert.ok(recovery.state.combatants[targetId].statuses.some(stack => stack.status === "guarded"));
});
