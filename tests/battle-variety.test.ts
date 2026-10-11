import test from "node:test";
import assert from "node:assert/strict";
const { createNewGameSave } = await import("@/lib/save/localSave");
const { TACTICAL_MANUAL_MOVES } = await import("@/data/battleMoves");
const { BATTLE_OUTFITTER_ITEMS, getBattleOutfitterStock } = await import("@/data/battleOutfitter");
const { getCreatureBattleMoveLoadout, canSpeciesLearnBattleMove } = await import("@/data/battleLoadouts");
const { teachBattleMoveWithFocusManual } = await import("../src/data/battleMoveTraining.ts");
const { createBattleState, resolveBattleRound, validateBattleAction } = await import("@/data/battleEngine");
const { COLISEUM_C2_ENCOUNTERS, getColiseumC2Encounter, getColiseumC2Access, recordColiseumC2BattleResult, createColiseumPerformance, buildAuthoredColiseumEnemyTeam } = await import("../src/data/coliseumC2.ts");
const { buildBattleAiPlan } = await import("../src/data/battleAi.ts");

test("all new techniques are teachable with one manual, without changing equipped moves", () => {
 for (const move of TACTICAL_MANUAL_MOVES) {
  const save = createNewGameSave("Trainer", 0);
  const manual = BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId==="focus_manual")!;
  const c = save.creatures[0];
  c.battleMoveLoadout = { ...getCreatureBattleMoveLoadout(c), learnedMoveIds: ["strike"], equippedMoveIds: ["strike"] };
  save.flags[manual.flagKey] = 2;
  for (const species of ["feline","canine","bovine","lapine","equine"]) assert(canSpeciesLearnBattleMove(`species_${species}` as never, move.id));
  const result = teachBattleMoveWithFocusManual(save,c.creatureId,move.id);
  assert.equal(result.ok,true);
  assert.equal(getBattleOutfitterStock(result.save,manual),1);
  const learned = getCreatureBattleMoveLoadout(result.save.creatures[0]);
  assert(learned.learnedMoveIds.includes(move.id));
  assert.deepEqual(learned.equippedMoveIds,["strike"]);
  const duplicate = teachBattleMoveWithFocusManual(result.save,c.creatureId,move.id);
  assert.equal(duplicate.ok,false);
  assert.equal(getBattleOutfitterStock(duplicate.save,manual),1);
 }
});

function fixture(moveId: string) {
 const save = createNewGameSave("Tactics",0);
 const team=save.creatures.slice(0,3);
 const enemies=buildAuthoredColiseumEnemyTeam(save.saveId,getColiseumC2Encounter("bronze_redfang_exhibition")!);
 const state=createBattleState({battleId:`tactics-${moveId}`,playerCreatures:team,enemyCreatures:enemies});
 const actorId=state.teams.player.combatantIds[0], allyId=state.teams.player.combatantIds[1], enemyId=state.teams.enemy.combatantIds[0];
 const actor=state.combatants[actorId];
 actor.loadout={...actor.loadout, learnedMoveIds:["strike",moveId],equippedMoveIds:["strike",moveId]};
 actor.currentBattleEnergy=actor.maxBattleEnergy;
 return {state,actorId,allyId,enemyId};
}

test("Clear Head removes only its named debuffs, restores energy, and enters cooldown",()=>{
 const {state,actorId,allyId}=fixture("clear_head");
 const ally=state.combatants[allyId]; ally.currentBattleEnergy=0;
 ally.statuses=[{status:"bleed",duration:3},{status:"marked",duration:3},{status:"slowed",duration:3}];
 const action={actorId,moveId:"clear_head",targetIds:[allyId]};
 assert.equal(validateBattleAction(state,action).valid,true);
 const result=resolveBattleRound(state,[action]);
 const healed=result.state.combatants[allyId];
 assert(!healed.statuses.some(s=>s.status==="bleed"||s.status==="marked"));
 assert(healed.statuses.some(s=>s.status==="slowed"));
 assert(healed.currentBattleEnergy>=6);
 assert.equal(result.state.combatants[actorId].cooldowns.clear_head,2);
 assert.equal(validateBattleAction(result.state,action).valid,false);
});

test("Covering Guard applies before ordinary attacks and protects an ally",()=>{
 const {state,actorId,allyId,enemyId}=fixture("covering_guard");
 const result=resolveBattleRound(state,[{actorId,moveId:"covering_guard",targetIds:[allyId]},{actorId:enemyId,moveId:"strike",targetIds:[allyId]}]);
 const actions=result.result.actions;
 assert(actions.findIndex(a=>a.actorId===actorId)<actions.findIndex(a=>a.actorId===enemyId));
 assert(actions.find(a=>a.actorId===actorId)?.log.some(s=>s.includes("guarded")));
 assert.equal(result.state.combatants[actorId].cooldowns.covering_guard,2);
});

test("Piercing Echo damages and removes Guarded on a successful hit",()=>{
 let hit=false;
 for(let n=0;n<30&&!hit;n++){
  const {state,actorId,enemyId}=fixture("piercing_echo"); state.battleId=`pierce-${n}`;
  state.combatants[enemyId].statuses=[{status:"guarded",amount:35,duration:3}];
  const before=state.combatants[enemyId].currentHp;
  const r=resolveBattleRound(state,[{actorId,moveId:"piercing_echo",targetIds:[enemyId]}]);
  const action=r.result.actions.find(a=>a.actorId===actorId)!;
  if(action.missedTargetIds?.includes(enemyId))continue;
  assert(r.state.combatants[enemyId].currentHp<before);
  assert(!r.state.combatants[enemyId].statuses.some(s=>s.status==="guarded"));hit=true;
 }
 assert(hit);
});

test("exhibitions unlock alongside the next division, pay once, and preserve normal progression",()=>{
 for(const exhibition of COLISEUM_C2_ENCOUNTERS.filter(e=>e.optional)){
  let save=createNewGameSave("Exhibition",0);
  const ids=save.creatures.slice(0,3).map(c=>c.creatureId), perf=createColiseumPerformance(ids);
  assert.equal(getColiseumC2Access(save,exhibition).unlocked,false);
  for(const encounter of COLISEUM_C2_ENCOUNTERS.filter(e=>!e.optional)){
   save=recordColiseumC2BattleResult(save,encounter.encounterId,"player_won",4,ids,perf,`unlock-${encounter.encounterId}`).save;
   if(exhibition.prerequisiteEncounterIds.includes(encounter.encounterId))break;
  }
  assert.equal(getColiseumC2Access(save,exhibition).unlocked,true);
  const before=save.currencies.gold;
  const first=recordColiseumC2BattleResult(save,exhibition.encounterId,"player_won",4,ids,perf,"exhibition-first");
  assert.equal(first.firstClear,true);assert.equal(first.save.currencies.gold-before,exhibition.firstClearReward.gold);
  const duplicate=recordColiseumC2BattleResult(first.save,exhibition.encounterId,"player_won",4,ids,perf,"exhibition-first");
  assert.equal(duplicate.duplicate,true);assert.deepEqual(duplicate.save,first.save);
  const repeat=recordColiseumC2BattleResult(first.save,exhibition.encounterId,"player_won",4,ids,perf,"exhibition-repeat");
  assert.equal(repeat.firstClear,false);
  const state=createBattleState({battleId:exhibition.encounterId,playerCreatures:save.creatures.slice(0,3),enemyCreatures:buildAuthoredColiseumEnemyTeam(save.saveId,exhibition)});
  const plan=buildBattleAiPlan(state,"enemy",exhibition.aiDifficulty);
  for(const action of plan.actions)assert.equal(validateBattleAction(state,action).valid,true);
 }
 for(const e of COLISEUM_C2_ENCOUNTERS.filter(e=>!e.optional))assert(!e.prerequisiteEncounterIds.some(id=>getColiseumC2Encounter(id)?.optional));
});


test("Checking Blow can inflict Slow and obeys its energy and cooldown restrictions",()=>{
 let slowed=false;
 for(let n=0;n<40&&!slowed;n++){
  const {state,actorId,enemyId}=fixture("checking_blow");state.battleId=`check-${n}`;
  const action={actorId,moveId:"checking_blow",targetIds:[enemyId]};
  const result=resolveBattleRound(state,[action]);
  assert.equal(result.state.combatants[actorId].cooldowns.checking_blow,2);
  slowed=result.state.combatants[enemyId].statuses.some(s=>s.status==="slowed");
  state.combatants[actorId].currentBattleEnergy=0;
  assert.equal(validateBattleAction(state,action).valid,false);
 }
 assert(slowed);
});
