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
