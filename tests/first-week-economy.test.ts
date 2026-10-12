import { tradeResource, getFarmState, workResourceSite, craftResource } from "@/data/farmResources";
import test from "node:test";
import assert from "node:assert/strict";
import { createNewGameSave } from "@/lib/save/localSave";
import { assignCreatureToRanchJob } from "@/data/ranchJobs";
import { projectRanchDay } from "@/data/ranch-day/ranchDayLifecycle";
import { normalizeRanchDaySave, enterEveningReview } from "@/data/ranch-day/ranchDayState";
import { commissionBuilderProject } from "@/data/builderProjects";
import { purchaseBattleOutfitterItem } from "@/data/battleOutfitterC3";
import { purchaseSupplyDepotItem } from "@/data/supplyDepot";
import { applyStarterGoalRewards, getStarterGoals } from "@/data/starterGoals";
import type { GameSave } from "@/types/save";
function night(save:GameSave) {
 const s=normalizeRanchDaySave(save,"active");
 const next=projectRanchDay(enterEveningReview({...s,ranchDay:{...s.ranchDay!,phase:"active"}}));
 assert.ok(next);return next.save;
}
test("new ranch provisions cover the first two nights without production or shopping",()=>{
 let s=createNewGameSave("Learning ranch",0);
 assert.equal(s.currencies.gold,1200);assert.equal(s.flags.ranchFeedStock,14);assert.equal(s.flags.ranchMaterialsStock,4);
 for(let d=0;d<2;d++){s=night(s);assert.equal(s.flags.ranchFeedConsumedToday,s.flags.ranchFeedRequiredToday);}
});
test("a balanced starter crew supports first construction and shopping without Guild or battle income",()=>{
 const totals=[];
 for(let sample=0;sample<12;sample++){
  let s=createNewGameSave(`Week ${sample}`,0);
  for(let d=0;d<7;d++){
   for(const site of ['garden','wheat_field'] as const) s=workResourceSite(s,site,s.creatures![0].creatureId).save;
   s=craftResource(s,'rations',2).save;s=night(s);assert.equal(s.flags.ranchFeedConsumedToday,s.flags.ranchFeedRequiredToday);
  }
  totals.push(s.currencies.gold);
  assert.ok(s.currencies.gold<2300,"passive chores should not recreate the old starting windfall");
  const feed=purchaseSupplyDepotItem(s,"feed_bundle");assert.equal(feed.ok,true);s=feed.save;
  for(const [id,n] of [["wood",10],["stone",5]] as const){const supplies=tradeResource(s,id,n);assert.equal(supplies.ok,true);s=supplies.save;}
  const order=commissionBuilderProject(s,"north_pasture_land");assert.equal(order.ok,true);s=order.save;
  for (const item of ["training_grips", "padded_harness"]) { const gear=purchaseBattleOutfitterItem(s,item);assert.equal(gear.ok,true);s=gear.save; }
  assert.ok(s.currencies.gold>=250,"leave enough for starter gear and a reserve");
  assert.ok((getFarmState(s).stock.wood??0)>=2 && (getFarmState(s).stock.stone??0)>=1,"retain exact repair supplies");
 }
 console.log('12 fresh first-week chore budgets:',Math.min(...totals),'to',Math.max(...totals),'Gold');
});
test("starter milestones still pay resources and GP once, with reduced Gold and no wallet reset",()=>{
 const base=createNewGameSave("Existing ranch",0);
 const save={...base,currencies:{...base.currencies,gold:9999},flags:{...base.flags,m7GuildContractCompleted:true}};
 const goal=getStarterGoals(save).find(g=>g.id==="guild")!;assert.equal(goal.reward.gold,150);assert.equal(goal.reward.guildPoints,5);
 const paid=applyStarterGoalRewards(save);assert.ok(paid.currencies.gold>=10149);
 const again=applyStarterGoalRewards(paid);assert.equal(again,paid);
 const oldPaid={...save,flags:{...save.flags,starterGoalReward_guild:true}};
 assert.equal(getStarterGoals(oldPaid).find(g=>g.id==="guild")!.rewardClaimed,true);
});
