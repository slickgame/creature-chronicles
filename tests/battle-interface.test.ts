import test from "node:test";
import assert from "node:assert/strict";
import { getBattleLogEventCategory, getBattleMenuCategory, getBattleMenuOptions, getBattleOrderPreview, getBattleRoundOrderShift, getBattleSlowedOrderForecast, recordBattleOrderShift, recordBattleRoundStart, updateBattleCooldownNotices } from "../src/data/battleInterface.ts";
import { createBattleState, previewBattleAction, resolveBattleRound, resolveBattleTurn } from "@/data/battleEngine";
import { getBattleMove } from "@/data/battleMoves";
import { useRevivalSalve } from "@/data/battleOutfitterIntegration";
import { buildBattlePlaybackEvents } from "@/data/battlePresentation";
import { buildBattleUiAction } from "@/data/battleUi";
import { createNewGameSave } from "@/lib/save/localSave";
function fixture() {
  const save = createNewGameSave("Battle menu", 0);
  const clone = (id:string) => ({...save.creatures[0], creatureId:id as never, nickname:id});
  const state = createBattleState({battleId:"menu-test",playerCreatures:[clone("p1"),clone("p2"),clone("p3")],enemyCreatures:[clone("e1"),clone("e2"),clone("e3")]});
  for(const c of Object.values(state.combatants)) {
    c.loadout={learnedMoveIds:["strike","defend","first_aid","resonant_bark"],equippedMoveIds:["strike","defend","first_aid","resonant_bark"],version:1};
    c.currentBattleEnergy=100;
  }
  return state;
}
test("move categories partition attacks, protection and recovery including hybrids",()=>{
  assert.equal(getBattleMenuCategory(getBattleMove("strike")),"Attack");
  assert.equal(getBattleMenuCategory(getBattleMove("defend")),"Support");
  assert.equal(getBattleMenuCategory(getBattleMove("evasive_step")),"Support");
  assert.equal(getBattleMenuCategory(getBattleMove("focus")),"Recovery");
  assert.equal(getBattleMenuCategory(getBattleMove("first_aid")),"Recovery");
  assert.equal(getBattleMenuCategory({...getBattleMove("first_aid"),effects:[{type:"damage"},{type:"heal"}]}),"Attack");
});
test("all four equipped moves remain inspectable with no target and unavailable moves explain each restriction",()=>{
  const state=fixture(),id=state.teams.player.combatantIds[0];
  state.combatants[id].cooldowns.resonant_bark=2;
  state.combatants[id].currentBattleEnergy=0;
  const before=structuredClone(state),options=getBattleMenuOptions(state,id,null);
  assert.equal(options.length,4);
  assert(options.every(o=>!o.usable&&o.reasons.includes("Choose a target.")));
  const bark=options.find(o=>o.move.id==="resonant_bark")!;
  assert(bark.reasons.some(r=>r.includes("Cooldown: 2")));
  assert(bark.reasons.some(r=>r.includes("Battle Energy")));
  assert.deepEqual(state,before);
  for(const target of [{kind:"combatant",combatantId:id},{kind:"combatant",combatantId:state.teams.enemy.combatantIds[0]},{kind:"field"}] as const){
    const options=getBattleMenuOptions(state,id,target);
    assert.equal(options.length,4);
    for(const o of options) assert.equal(o.usable,!!buildBattleUiAction(state,id,o.move.id,target));
  }
});

test("move badges keep target, cooldown, and energy blockers in order with complete reasons", () => {
  const state = fixture();
  const [actorId] = state.teams.player.combatantIds;
  const [tauntSourceId, otherEnemyId] = state.teams.enemy.combatantIds;
  const actor = state.combatants[actorId];
  actor.loadout.equippedMoveIds = ["strike", "defend", "unyielding_aura"];
  actor.cooldowns.unyielding_aura = 1;
  actor.currentBattleEnergy = 8;
  const option = (moveId: string, target: Parameters<typeof getBattleMenuOptions>[2]) =>
    getBattleMenuOptions(state, actorId, target).find(entry => entry.move.id === moveId)!;
  const enemy = { kind: "combatant", combatantId: otherEnemyId } as const;
  const self = { kind: "combatant", combatantId: actorId } as const;

  const aura = option("unyielding_aura", enemy);
  assert.deepEqual(aura.blockers, [
    { kind: "target", label: "Select ally", detail: "Select a all allies target." },
    { kind: "cooldown", label: "1 round left", detail: "Cooldown: 1 round." },
    { kind: "energy", label: "Need 16 BE", detail: "Need 16 Battle Energy." },
  ]);
  assert.deepEqual(aura.reasons, aura.blockers.map(blocker => blocker.detail));
  assert.equal(aura.usable, false);
  assert.deepEqual(option("unyielding_aura", self).blockers, aura.blockers.slice(1));
  assert.equal(option("unyielding_aura", null).blockers[0].label, "Choose target");
  assert.equal(option("defend", enemy).blockers[0].label, "Select self");
  assert.equal(option("strike", self).blockers[0].label, "Select enemy");
  assert.equal(option("strike", enemy).usable, true);
  assert.deepEqual(option("strike", enemy).blockers, []);

  actor.statuses = [{ status: "taunted", duration: 1, sourceCombatantId: tauntSourceId }];
  assert.deepEqual(option("strike", enemy).blockers, [
    { kind: "target", label: "Taunt target", detail: `Taunted: select ${state.combatants[tauntSourceId].name}.` },
  ]);
});

test("order preview matches engine weighted speed and seeded ties without exposing enemy priorities",()=>{
  const state=fixture(),ids=state.teams.player.combatantIds;
  for(const c of Object.values(state.combatants)) c.battleStats.speed=40;
  state.combatants[ids[0]].battleStats.speed=10;
  const actions=Object.values(state.combatants).map(c=>({actorId:c.battleCombatantId,moveId:c.battleCombatantId===ids[0]?"defend":"strike",targetIds:[c.battleCombatantId===ids[0]?ids[0]:state.teams[c.sideId==="player"?"enemy":"player"].combatantIds[c.slotIndex]]}));
  const queue=new Map(actions.map(a=>[a.actorId,a]));
  const preview=getBattleOrderPreview(state,queue);
  assert.notEqual(preview[0].actorId,ids[0],"a small priority bonus cannot outrun a much faster creature");
  assert.deepEqual(preview.map(p=>p.actorId),resolveBattleRound(state,actions).result.actions.map(a=>a.actorId));
  for(const id of state.teams.enemy.combatantIds) queue.set(id,{actorId:id,moveId:"defend",targetIds:[id]});
  assert.deepEqual(getBattleOrderPreview(state,queue),preview,"enemy requested moves must not leak into the estimate");
  state.combatants[ids[2]].isFainted=true;
  assert(!getBattleOrderPreview(state,queue).some(p=>p.actorId===ids[2]));
});

test("opening order shifts compare shared creatures and ignore empty slots from knockouts or revivals", () => {
  const previous = ["briar", "knocked-out", "lilt", "moss"];
  const unchanged = ["briar", "revived", "lilt", "moss"];
  const noShift = getBattleRoundOrderShift(previous, unchanged, 4);
  assert.equal(noShift, undefined);
  const state = fixture();
  assert.equal(recordBattleOrderShift(state, noShift), state);
  assert.deepEqual(getBattleRoundOrderShift(previous, ["briar", "revived", "moss", "lilt"], 4), {
    roundNumber: 4,
    before: ["briar", "lilt", "moss"],
    after: ["briar", "moss", "lilt"],
  });
});

test("round log boundaries include recovery, omit terminal phantom rounds, and resume on revival", () => {
  const initial = fixture();
  const [playerId, ...otherPlayers] = initial.teams.player.combatantIds;
  const [enemyId] = initial.teams.enemy.combatantIds;
  initial.combatants[playerId].currentBattleEnergy = 0;
  const started = recordBattleRoundStart(initial, 0);
  assert.deepEqual(started.roundLogBoundaries, [{ roundNumber: 1, logIndex: 0 }]);
  assert.equal(recordBattleRoundStart(started), started);
  assert.equal(started.log, initial.log);

  const turn = resolveBattleTurn(started, [playerId], { actorId: playerId, moveId: "defend", targetIds: [playerId] });
  assert(turn);
  assert(turn.state.log.some(line => line.includes("regenerates")));
  const second = recordBattleRoundStart(turn.state);
  assert.deepEqual(second.roundLogBoundaries, [
    { roundNumber: 1, logIndex: 0 },
    { roundNumber: 2, logIndex: turn.state.log.length },
  ]);
  assert.equal(second.log, turn.state.log);

  for (const actorId of otherPlayers) {
    second.combatants[actorId].isFainted = true;
    second.combatants[actorId].currentHp = 0;
  }
  second.combatants[playerId].currentHp = 1;
  second.combatants[enemyId].battleStats.accuracy = 1000;
  const finalTurn = resolveBattleTurn(second, [enemyId], { actorId: enemyId, moveId: "strike", targetIds: [playerId] });
  assert(finalTurn);
  assert.equal(finalTurn.state.outcome, "enemy_won");
  assert.equal(finalTurn.state.roundNumber, 3);
  assert.equal(recordBattleRoundStart(finalTurn.state), finalTurn.state);
  assert.equal(finalTurn.state.roundLogBoundaries, second.roundLogBoundaries);
  const knockoutIndex = finalTurn.state.log.indexOf("p1 fainted.");
  assert(knockoutIndex >= second.roundLogBoundaries![1].logIndex);
  assert.equal(getBattleLogEventCategory(finalTurn.state, knockoutIndex), "knockouts");
  assert.equal(getBattleLogEventCategory(finalTurn.state, knockoutIndex - 1), undefined);

  const save = createNewGameSave("Revival round", 0);
  const stockedSave = { ...save, flags: { ...save.flags, battleItem_revivalSalves: 1 } };
  const revived = useRevivalSalve(stockedSave, finalTurn.state, playerId);
  assert(revived.ok);
  const resumed = recordBattleRoundStart(revived.state, finalTurn.state.log.length);
  assert.deepEqual(resumed.roundLogBoundaries?.at(-1), { roundNumber: 3, logIndex: finalTurn.state.log.length });
  assert.match(resumed.log[resumed.roundLogBoundaries!.at(-1)!.logIndex], /revived with a Revival Salve/);
});

test("Slowed compares next-round slots and Speed without modifying the live round", () => {
  const state = fixture();
  const [willow, briar, rowan] = state.teams.player.combatantIds;
  const [moss, bramble, lilt] = state.teams.enemy.combatantIds;
  state.roundNumber = 3;
  const speeds = new Map([[willow, 42], [briar, 39], [rowan, 33], [lilt, 25], [moss, 22], [bramble, 4]]);
  for (const [id, speed] of speeds) {
    state.combatants[id].battleStats.speed = speed;
    state.combatants[id].currentHp = state.combatants[id].maxHp = 1000;
  }
  state.combatants[briar].battleStats.accuracy = 1000;
  state.combatants[briar].battleStats.statusPower = 1000;
  state.combatants[briar].loadout.equippedMoveIds = ["strike", "checking_blow"];
  state.combatants[rowan].statuses = [{ status: "exhausted", duration: 1, amount: 10 }];
  const action = { actorId: briar, moveId: "checking_blow", targetIds: [lilt] };
  const before = structuredClone(state);
  const openingOrder = getBattleOrderPreview(state, new Map()).map(entry => entry.actorId);
  const effects = previewBattleAction(state, action);
  const result = getBattleSlowedOrderForecast(state, effects);
  assert(result);
  assert.equal(result.roundNumber, 4);
  assert.deepEqual(result.targets, [{ actorId: lilt, requiresHit: true, hitChance: 100, effectChance: 95 }]);
  assert.deepEqual(result.baseline.map(entry => entry.actorId), [willow, briar, rowan, lilt, moss, bramble]);
  assert.deepEqual(result.baseline[3], { actorId: lilt, slot: 4, speed: 25 });
  assert.deepEqual(result.slowed[4], { actorId: lilt, slot: 5, speed: 19 });
  const turn = resolveBattleTurn(state, [briar], action);
  assert(turn);
  const settledOrder = getBattleOrderPreview(turn.state, new Map());
  assert.deepEqual(result.slowed.map(({ actorId, speed }) => ({ actorId, score: speed })),
    settledOrder.map(({ actorId, score }) => ({ actorId, score })));
  const nextOrder = settledOrder.map(entry => entry.actorId);
  const shift = getBattleRoundOrderShift(openingOrder, nextOrder, turn.state.roundNumber);
  assert.deepEqual(shift, {
    roundNumber: 4,
    before: [willow, briar, lilt, rowan, moss, bramble],
    after: [willow, briar, rowan, moss, lilt, bramble],
  });
  const logIndex = turn.state.log.length;
  const loggedState = recordBattleOrderShift(recordBattleRoundStart(turn.state), shift);
  assert.deepEqual(loggedState.roundLogBoundaries, [{ roundNumber: 4, logIndex }]);
  assert.deepEqual(loggedState.orderShiftLog, [{
    logIndex,
    roundNumber: 4,
    moves: [{ actorId: rowan, from: 4, to: 3 }, { actorId: moss, from: 5, to: 4 }, { actorId: lilt, from: 3, to: 5 }],
  }]);
  assert.deepEqual(loggedState.log.slice(0, logIndex), turn.state.log);
  assert.equal(loggedState.log[logIndex], "Round 4 · Order shift · p3 4 → 3 · e1 5 → 4 · e3 3 → 5");
  assert.equal(getBattleLogEventCategory(loggedState, logIndex), "order-shifts");
  assert.equal(recordBattleOrderShift(loggedState, shift), loggedState);

  const nextTurn = resolveBattleTurn(loggedState, nextOrder, { actorId: willow, moveId: "defend", targetIds: [willow] });
  assert(nextTurn);
  assert.equal(nextTurn.state.orderShiftLog, loggedState.orderShiftLog);
  assert.deepEqual(nextTurn.state.log.slice(logIndex, logIndex + 2), [loggedState.log[logIndex], "p1 uses Defend."]);
  const appliedIndex = nextTurn.state.log.findIndex(line => line === "e3 is slowed; the effect was applied.");
  assert(appliedIndex >= 0 && appliedIndex < logIndex);
  assert.equal(getBattleLogEventCategory(nextTurn.state, appliedIndex), "status-changes");
  assert.equal(getBattleLogEventCategory(nextTurn.state, logIndex + 2), "status-changes");
  const restored = JSON.parse(JSON.stringify(nextTurn.state)) as typeof nextTurn.state;
  assert.equal(getBattleLogEventCategory(restored, appliedIndex), "status-changes");
  assert.equal(getBattleLogEventCategory(restored, logIndex), "order-shifts");
  assert.deepEqual(state, before);
});

test("a resisted secondary effect stays in the full log without a status change", () => {
  const state = fixture();
  const [actorId] = state.teams.player.combatantIds;
  const [targetId] = state.teams.enemy.combatantIds;
  const actor = state.combatants[actorId];
  actor.battleStats.accuracy = 1000;
  actor.battleStats.statusPower = 0;
  actor.loadout.equippedMoveIds = ["strike", "checking_blow"];
  state.combatants[targetId].battleStats.statusResist = 1000;
  const action = { actorId, moveId: "checking_blow", targetIds: [targetId] };

  for (let seed = 0; seed < 20; seed += 1) {
    const attempt = resolveBattleTurn({ ...state, battleId: `resisted-effect-${seed}` }, [actorId, targetId], action);
    assert(attempt);
    const resistedIndex = attempt.state.log.findIndex(line => line.includes("resisted the secondary effect"));
    if (resistedIndex < 0) continue;
    assert.equal(getBattleLogEventCategory(attempt.state, resistedIndex), undefined);
    assert.deepEqual(attempt.state.logEventCategories, {});
    return;
  }
  assert.fail("Expected at least one resisted Checking Blow across the chosen seeds");
});

test("Slowed uses projected stack and recovery rules and excludes both direct and bleed knockouts", () => {
  const state = fixture();
  const [actorId, , bleedId] = state.teams.player.combatantIds;
  const [slowedId, directId, otherId] = state.teams.enemy.combatantIds;
  const target = state.combatants[slowedId];
  target.battleStats.speed = 25;
  target.statuses = [{ status: "slowed", duration: 1 }];
  state.combatants[directId].currentHp = 1;
  state.combatants[bleedId].currentHp = 1;
  state.combatants[bleedId].statuses = [{ status: "bleed", duration: 1, amount: 5 }];
  const action = { actorId, moveId: "thunder_tread", targetIds: [slowedId, directId, otherId] };
  const forecast = getBattleSlowedOrderForecast(state, previewBattleAction(state, action));
  assert(forecast);
  assert.deepEqual(new Set(forecast.targets.map(entry => entry.actorId)), new Set([slowedId, otherId]));
  assert.equal(forecast.baseline.find(entry => entry.actorId === slowedId)?.speed, 25);
  assert.equal(forecast.slowed.find(entry => entry.actorId === slowedId)?.speed, 13);
  for (const row of [forecast.baseline, forecast.slowed]) {
    assert(!row.some(entry => entry.actorId === directId || entry.actorId === bleedId));
  }

  target.statuses = [{ status: "slowed", duration: 2, stacks: 2 }];
  const checkingBlow = { actorId, moveId: "checking_blow", targetIds: [slowedId] };
  const refresh = getBattleSlowedOrderForecast(state, previewBattleAction(state, checkingBlow));
  assert(refresh);
  assert.deepEqual(refresh.baseline, refresh.slowed);

  target.statuses.push({ status: "bleed", duration: 1, amount: target.currentHp });
  assert.equal(getBattleSlowedOrderForecast(state, previewBattleAction(state, checkingBlow)), null);
  assert.equal(getBattleSlowedOrderForecast(state, previewBattleAction(state, { ...checkingBlow, targetIds: [directId] })), null);
});

test("playback snapshots show each hit separately and use IDs with duplicate names", ()=>{
  const state=fixture(),target=state.teams.enemy.combatantIds[0];
  for(const c of Object.values(state.combatants)) {
    c.name="Same name";c.currentHp=c.maxHp=2000;c.currentBattleEnergy=c.maxBattleEnergy;
    c.battleStats.accuracy=1000;c.battleStats.evasion=0;c.battleStats.speed=c.sideId==="player"?100:1;
  }
  const before=structuredClone(state);
  const actions=Object.values(state.combatants).map(c=>({actorId:c.battleCombatantId,moveId:c.sideId==="player"?"strike":"defend",targetIds:[c.sideId==="player"?target:c.battleCombatantId]}));
  const resolved=resolveBattleRound(state,actions);
  const events=buildBattlePlaybackEvents(resolved.frames);
  assert.equal(events[0].kind,"attack");
  assert.equal(events[0].state!.combatants[target].currentHp,2000);
  const hits=events.filter(e=>e.kind==="damage"&&e.targetIds[0]===target);
  assert.equal(hits.length,3);
  assert(hits[0].state!.combatants[target].currentHp>hits[1].state!.combatants[target].currentHp);
  assert(hits[1].state!.combatants[target].currentHp>hits[2].state!.combatants[target].currentHp);
  assert.deepEqual(events.at(-1)!.state!.combatants,resolved.state.combatants);
  assert.deepEqual(state,before,"resolution and playback do not mutate input");
});

test("target preview matches damage after guard modifiers and healing caps without mutation",()=>{
  const state=fixture(),actor=state.teams.player.combatantIds[0],target=state.teams.enemy.combatantIds[0];
  state.combatants[actor].battleStats.speed=1000;state.combatants[actor].battleStats.accuracy=1000;
  state.combatants[target].statuses=[{status:"guarded",duration:2,amount:25}];
  state.combatants[target].battleStats.evasion=0;
  const action={actorId:actor,moveId:"strike",targetIds:[target]};
  const before=structuredClone(state),projection=previewBattleAction(state,action)[0];
  const result=resolveBattleRound(state,[action]);
  const impact=result.frames.find(f=>f.kind==="damage"&&f.actorId===actor)!;
  assert(projection.description.includes(`→ ${impact.state.combatants[target].currentHp}`));
  assert.equal(projection.hitChance,100);
  assert.deepEqual(state,before);
  state.combatants[actor].currentHp=state.combatants[actor].maxHp-3;
  assert.match(previewBattleAction(state,{actorId:actor,moveId:"first_aid",targetIds:[actor]})[0].description,/Restore 3 HP/);
  state.combatants[actor].currentBattleEnergy=state.combatants[actor].maxBattleEnergy;
  const recovery=previewBattleAction(state,{actorId:actor,moveId:"evasive_step",targetIds:[actor]}).find(p=>p.description.includes('BE'))!;
  assert.match(recovery.description,/Restore 4 BE/,'recovery preview accounts for the move cost first');
});

test("playback separates bleed, recovery and KO, and skipped actors do not spend energy",()=>{
  const state=fixture(),id=state.teams.player.combatantIds[0];
  for(const c of Object.values(state.combatants)) {c.currentHp=c.maxHp=1000;c.currentBattleEnergy=10;}
  state.combatants[id].currentHp=2;
  state.combatants[id].statuses=[{status:"bleed",duration:2,amount:5},{status:"stun",duration:2}];
  const actions=Object.values(state.combatants).map(c=>({actorId:c.battleCombatantId,moveId:"defend",targetIds:[c.battleCombatantId]}));
  const result=resolveBattleRound(state,actions);
  const skip=result.frames.find(f=>f.actorId===id)!;
  assert.match(skip.label,/stunned/);assert.equal(skip.state.combatants[id].currentBattleEnergy,10);
  assert.equal(skip.skipReason, "stun");
  const bleed=result.frames.find(f=>!f.actorId&&f.kind==="damage"&&f.targetIds[0]===id)!;
  assert.equal(bleed.state.combatants[id].currentHp,0);
  assert(result.frames.some(f=>f.kind==="knockout"&&f.targetIds[0]===id));
  assert(result.frames.some(f=>!f.actorId&&f.kind==="energy"));
});

test("an individual Stun skip has a dedicated playback cue and leaves the next living turn intact", () => {
  const before = fixture();
  const [actorId, faintedId, nextActorId] = before.teams.player.combatantIds;
  const actor = before.combatants[actorId];
  actor.statuses = [{ status: "stun", duration: 1 }];
  before.combatants[faintedId].isFainted = true;
  before.combatants[faintedId].currentHp = 0;
  const turn = resolveBattleTurn(before, [actorId, faintedId, nextActorId], {
    actorId, moveId: "first_aid", targetIds: [nextActorId],
  });
  assert.ok(turn);
  assert.equal(turn.result.actions[0].success, false);
  assert.equal(turn.result.actions[0].skipReason, "stun");
  assert.deepEqual(turn.remaining, [nextActorId]);
  assert.equal(turn.state.roundNumber, before.roundNumber);
  assert.deepEqual(turn.state.combatants[actorId], actor);
  const [event, ...rest] = buildBattlePlaybackEvents(turn.frames, { staggerMultiTarget: true });
  assert.deepEqual(rest, []);
  assert.equal(event.kind, "status");
  assert.equal(event.skipReason, "stun");
  assert.equal(event.actorId, actorId);
  assert.deepEqual(event.targetIds, [actorId]);
  assert.equal(event.label, `${actor.name} is stunned and cannot act.`);
  assert.equal(event.durationMs, 900);
});

test("cooldown notices use round advancement even when full BE produces no recovery frame", () => {
  const before = fixture();
  const [ownerId] = before.teams.player.combatantIds;
  const [enemyId] = before.teams.enemy.combatantIds;
  for (const actor of Object.values(before.combatants)) {
    actor.currentBattleEnergy = actor.maxBattleEnergy;
    actor.currentHp = actor.maxHp = 1000;
  }
  before.combatants[ownerId].cooldowns = { first_aid: 1, defend: 2, evasive_step: 1 };
  before.combatants[enemyId].cooldowns = { first_aid: 1 };
  const pending = new Map([[ownerId, ["resonant_bark"]]]);
  const turn = resolveBattleTurn(before, [ownerId], { actorId: ownerId, moveId: "strike", targetIds: [enemyId] });
  assert.ok(turn);
  assert.equal(turn.state.roundNumber, before.roundNumber + 1);
  assert.ok(turn.frames.every(frame => !frame.roundEndEffect));
  assert.deepEqual(updateBattleCooldownNotices(pending, before, turn.state, ownerId),
    new Map([[ownerId, ["first_aid"]]]));
  assert.deepEqual(updateBattleCooldownNotices(pending, before, { ...turn.state, roundNumber: before.roundNumber }, ownerId),
    new Map());
  assert.deepEqual(pending.get(ownerId), ["resonant_bark"]);
});

test("cooldown notices survive skipped and unrelated turns, then clear on a playable turn or battle reset", () => {
  const before = fixture();
  const [ownerId, allyId, faintedId] = before.teams.player.combatantIds;
  const [enemyId] = before.teams.enemy.combatantIds;
  before.combatants[ownerId].statuses = [{ status: "stun", duration: 1 }];
  before.combatants[ownerId].cooldowns = { strike: 1 };
  before.combatants[faintedId].isFainted = true;
  before.combatants[faintedId].currentHp = 0;
  before.combatants[enemyId].currentHp = before.combatants[enemyId].maxHp = 1000;
  const pending = new Map([
    [ownerId, ["strike", "first_aid", "evasive_step"]],
    [allyId, ["defend"]],
    [faintedId, ["defend"]],
    [enemyId, ["first_aid"]],
  ]);
  const skip = resolveBattleTurn(before, [ownerId, allyId, enemyId]);
  assert.ok(skip && !skip.result.actions[0].success);
  const afterSkip = updateBattleCooldownNotices(pending, before, skip.state, null);
  assert.deepEqual(afterSkip, new Map([[ownerId, ["first_aid"]], [allyId, ["defend"]]]));
  const allyTurn = resolveBattleTurn(skip.state, skip.remaining, { actorId: allyId, moveId: "strike", targetIds: [enemyId] });
  assert.ok(allyTurn);
  const afterAlly = updateBattleCooldownNotices(afterSkip, skip.state, allyTurn.state, allyId);
  assert.deepEqual(afterAlly, new Map([[ownerId, ["first_aid"]]]));
  const playable = structuredClone(allyTurn.state);
  playable.combatants[ownerId].statuses = [];
  const ownerTurn = resolveBattleTurn(playable, [ownerId, ...allyTurn.remaining], {
    actorId: ownerId, moveId: "defend", targetIds: [ownerId],
  });
  assert.ok(ownerTurn?.result.actions[0].success);
  assert.deepEqual(updateBattleCooldownNotices(afterAlly, playable, ownerTurn.state, ownerId), new Map());
  assert.deepEqual(updateBattleCooldownNotices(afterAlly, allyTurn.state, { ...allyTurn.state, outcome: "player_won" }, null), new Map());
  assert.deepEqual(updateBattleCooldownNotices(afterAlly, allyTurn.state, { ...allyTurn.state, battleId: "new-battle" }, null), new Map());
});
