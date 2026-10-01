import test from "node:test";
import assert from "node:assert/strict";
import { getBattleMenuCategory, getBattleMenuOptions, getBattleOrderPreview } from "../src/data/battleInterface.ts";
import { createBattleState, resolveBattleRound } from "@/data/battleEngine";
import { getBattleMove } from "@/data/battleMoves";
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

test("playback snapshots show each hit separately and use IDs with duplicate names", async()=>{
  const { buildBattlePlaybackEvents }=await import("@/data/battlePresentation");
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

test("target preview matches damage after guard modifiers and healing caps without mutation",async()=>{
  const { previewBattleAction }=await import("@/data/battleEngine");
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
  const bleed=result.frames.find(f=>!f.actorId&&f.kind==="damage"&&f.targetIds[0]===id)!;
  assert.equal(bleed.state.combatants[id].currentHp,0);
  assert(result.frames.some(f=>f.kind==="knockout"&&f.targetIds[0]===id));
  assert(result.frames.some(f=>!f.actorId&&f.kind==="energy"));
});
