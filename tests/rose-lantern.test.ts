import test from "node:test";
import assert from "node:assert/strict";
import { createNewGameSave } from "@/lib/save/localSave";
import { ROSE_LANTERN_STATE_FLAG, acceptRoseLanternHouseRules, acceptRoseLanternRequest, claimRoseLanternRequest, collectRoseLanternSupplyFavor, getRoseLanternActivityBlocker, getRoseLanternRequest, getRoseLanternShiftReward, getRoseLanternState, spendRoseLanternRumorToken, visitRoseLanternSalon, workRoseLanternHospitalityShift } from "@/data/roseLantern";
import type { GameSave } from "@/types/save";
function fixture() {
 const s=createNewGameSave("Rose Tester",0);
 s.dayState={...s.dayState,dayNumber:8,weekday:"Mon"};s.currencies.gold=2000;s.currencies.energy=100;
 return acceptRoseLanternHouseRules(s).save;
}
function withState(save:GameSave, patch:Partial<ReturnType<typeof getRoseLanternState>>) {
 return {...save, flags:{...save.flags,[ROSE_LANTERN_STATE_FLAG]:JSON.stringify({...getRoseLanternState(save),...patch})}};
}
function tomorrow(save:GameSave):GameSave {
 const weekdays=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] as const;
 return {...save,currencies:{...save.currencies,energy:100},dayState:{...save.dayState,dayNumber:save.dayState.dayNumber+1,weekday:weekdays[(weekdays.indexOf(save.dayState.weekday)+1)%7]}};
}

test("legacy state gains safe defaults without losing earned Trust or tokens",()=>{
 const s=fixture();s.flags[ROSE_LANTERN_STATE_FLAG]=JSON.stringify({houseRulesAccepted:true,trust:40,visits:12,rumorTokens:7});
 const state=getRoseLanternState(s);assert.equal(state.trust,40);assert.equal(state.visits,12);assert.equal(state.rumorTokens,7);assert.equal(state.requestStage,0);assert.equal(state.shifts,0);assert.deepEqual(state.topicDays,{});
 for(const malformed of ["null","bad","[]",'{"trust":-40,"topicDays":{"ranch":"bad"}}']){s.flags[ROSE_LANTERN_STATE_FLAG]=malformed;const n=getRoseLanternState(s);assert(n.trust>=0);assert.equal(n.topicDays.ranch,undefined);}
});

test("activities charge exactly once and reject insufficient resources",()=>{
 const s=fixture();const visit=visitRoseLanternSalon(s);assert(visit.ok);assert.equal(visit.save.currencies.gold,s.currencies.gold-10);assert.equal(visitRoseLanternSalon(visit.save).ok,false);
 const expected=getRoseLanternShiftReward(visit.save), shift=workRoseLanternHospitalityShift(visit.save);assert(shift.ok);assert.equal(shift.save.currencies.gold,visit.save.currencies.gold+expected);assert.equal(shift.save.currencies.energy,visit.save.currencies.energy-15);assert.equal(shift.state.shifts,1);assert.equal(workRoseLanternHospitalityShift(shift.save).ok,false);
 const poor={...s,currencies:{...s.currencies,gold:0,energy:0}};assert.equal(visitRoseLanternSalon(poor).ok,false);assert.equal(workRoseLanternHospitalityShift(poor).ok,false);assert(getRoseLanternActivityBlocker(poor,"shift"));
});

test("rumor topics cost one token, cannot repeat today, and refresh tomorrow",()=>{
 const s=withState(fixture(),{rumorTokens:8});
 const first=spendRoseLanternRumorToken(s,"guild");assert(first.ok);assert.equal(first.state.rumorTokens,7);assert.match(first.message,/Monday, Ranch Day 15/);
 const repeat=spendRoseLanternRumorToken(first.save,"guild");assert.equal(repeat.ok,false);assert.deepEqual(repeat.save,first.save);
 const restored=JSON.parse(JSON.stringify(first.save));assert.equal(spendRoseLanternRumorToken(restored,"guild").ok,false);
 const another=spendRoseLanternRumorToken(first.save,"builder");assert(another.ok);assert.equal(another.state.rumorsHeard,2);assert(another.state.history.some(s=>s.includes("Petra")));
 const next=spendRoseLanternRumorToken(tomorrow(another.save),"guild");assert(next.ok);
});

test("rumors respect venue access even when an imported save acknowledged the rules",()=>{
 const s=fixture();s.dayState.dayNumber=1;s.flags.chapterOneGuidedComplete=false;s.flags.m24ChapterOneStoryComplete=false;
 const locked=withState(s,{rumorTokens:10,trust:30});
 assert.equal(spendRoseLanternRumorToken(locked,"ranch").ok,false);assert.equal(collectRoseLanternSupplyFavor(locked).ok,false);assert.equal(acceptRoseLanternRequest(locked).ok,false);
});

test("weekly supply favors enforce Trust, token cost and Monday reset",()=>{
 const s=withState(fixture(),{rumorTokens:6,trust:14});assert.equal(collectRoseLanternSupplyFavor(s).ok,false);
 const ready=withState(s,{trust:15});const first=collectRoseLanternSupplyFavor(ready);assert(first.ok);assert.equal(first.state.rumorTokens,4);assert.equal(Number(first.save.flags.ranchFeedStock),Number(ready.flags.ranchFeedStock??0)+3);assert.equal(Number(first.save.flags.ranchMaterialsStock),Number(ready.flags.ranchMaterialsStock??0)+2);
 assert.equal(collectRoseLanternSupplyFavor(first.save).ok,false);let next=first.save;for(let i=0;i<6;i++)next=tomorrow(next);assert.equal(collectRoseLanternSupplyFavor(next).ok,false);assert.equal(collectRoseLanternSupplyFavor(tomorrow(next)).ok,true);
});

test("requests count only activities after acceptance and never claim early",()=>{
 let s=withState(fixture(),{visits:50,shifts:50,rumorsHeard:50});
 assert.equal(claimRoseLanternRequest(s).ok,false);s=acceptRoseLanternRequest(s).save;
 const q=getRoseLanternRequest(s)!;assert.deepEqual(q.progress,{visits:0,shifts:0,rumors:0,trust:1});assert.equal(q.ready,false);
 assert.equal(acceptRoseLanternRequest(s).ok,false);assert.equal(claimRoseLanternRequest(s).ok,false);
});

test("all three requests complete through real activities, pay once and unlock shift bonus",()=>{
 let s=fixture();
 for(let stage=0;stage<3;stage++){
  const accepted=acceptRoseLanternRequest(s);assert(accepted.ok);s=accepted.save;
  for(let n=0;n<15&&!getRoseLanternRequest(s)!.ready;n++){
   s=visitRoseLanternSalon(s).save;s=workRoseLanternHospitalityShift(s).save;
   if(stage===1){s=spendRoseLanternRumorToken(s,"ranch").save;s=spendRoseLanternRumorToken(s,"builder").save;}
   if(!getRoseLanternRequest(s)!.ready)s=tomorrow(s);
  }
  const q=getRoseLanternRequest(s)!;assert(q.ready);const before=s;
  const claimed=claimRoseLanternRequest(s);assert(claimed.ok);s=claimed.save;
  assert.equal(s.currencies.gold,before.currencies.gold+q.definition.gold);assert.equal(s.currencies.guildPoints,before.currencies.guildPoints+q.definition.gp);
  assert.equal(claimRoseLanternRequest(s).ok,false);
  s=tomorrow(s);
 }
 assert.equal(getRoseLanternRequest(s),null);assert.equal(getRoseLanternState(s).requestStage,3);
 const without=withState(s,{requestStage:2});assert.equal(getRoseLanternShiftReward(s),getRoseLanternShiftReward(without)+10);
 const pay=getRoseLanternShiftReward(s);const result=workRoseLanternHospitalityShift(s);assert(result.ok);assert.equal(result.save.currencies.gold-s.currencies.gold,pay);
});
