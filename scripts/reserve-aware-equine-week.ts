import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createNewGameSave} from '@/lib/save/localSave';
import {applyStarterGoalRewards} from '@/data/starterGoals';
import {getFoodBudget} from '@/data/economyBudget';
import {getFarmState,workResourceSite,workerBlocker,craftResource,reserveResource,commissionFacility,actSupplyOrder,tradeResource,RESOURCES,type Stock,type SiteId} from '@/data/farmResources';
import {commissionBuilderProject,getBuilderWorkOrder} from '@/data/builderProjects';
import {isHabitatUnlocked} from '@/data/ranchHabitats';
import {projectRanchDay} from '@/data/ranch-day/ranchDayLifecycle';
import {enterEveningReview} from '@/data/ranch-day/ranchDayState';
import {purchaseBattleOutfitterItem,assignBattleOutfitterEquipment,BATTLE_OUTFITTER_ITEMS} from '@/data/battleOutfitter';
import {getEquipmentCopies,enhanceEquipment} from '@/data/equipmentInstances';
import {STARTER_SET_PLANS} from './starter-set-loadouts';
import type {GameSave} from '@/types/save';

type Route='care'|'production'|'canine-habitat';
const routes:Route[]=['care','production','canine-habitat'];
const construction=(route:Route)=>route==='production'?{gold:420,inputs:{wood:14,stone:4}}:route==='canine-habitat'?{gold:300,inputs:{wood:6}}:{gold:0,inputs:{}};
/** Explicit market fallback, not an assumption that all construction inputs must be bought. */
function reserves(save:GameSave,route:Route){
 const plan=construction(route),farm=getFarmState(save),food=getFoodBudget(save,7);
 const materials=Object.entries(plan.inputs).reduce((g,[key,n])=>g+Math.max(0,n-Math.max(0,(farm.stock[key as keyof Stock]??0)-(farm.reserves[key as keyof Stock]??0)))*RESOURCES[key as keyof typeof RESOURCES].price,0);
 const repairFallbackGold=Math.max(0,2-(farm.stock.wood??0))*RESOURCES.wood.price;
 return {foodGold:food.topUpGold,constructionGold:plan.gold,materialFallbackGold:materials,repairFallbackGold,total:food.topUpGold+plan.gold+materials+repairFallbackGold};
}
function run(route:Route,seed:number,noGoalGold:boolean,planIndex=0,level=0){
 const now=Date.now;Date.now=()=>1800000000000+seed*1000;
 try{
 let save=createNewGameSave('Single-equine reserve audit',0);save.flags.m24IntroSeen=true;let goalGold=0,deliveryGold=0,foodGold=0,constructionGold=0,gearGold=0;
 assert.equal(save.creatures?.length,1);assert.equal(save.creatures[0].speciesId,'species_equine');assert.deepEqual(save.habitats?.filter(h=>h.unlocked).map(h=>h.family),['equine']);
 const starter=save.creatures[0].creatureId,startGold=save.currencies.gold,original=JSON.stringify(save);
 const reward=(next:GameSave)=>{const rewarded=applyStarterGoalRewards(next),gain=rewarded.currencies.gold-next.currencies.gold;goalGold+=noGoalGold?0:gain;return noGoalGold?{...rewarded,currencies:{...rewarded.currencies,gold:next.currencies.gold}}:rewarded;};
 const apply=(r:{ok:boolean;save:GameSave;message:string})=>{assert.ok(r.ok,r.message);save=reward(r.save);};
 save=reward(save);apply(reserveResource(save,'wood',2));
 const reserve=reserves(save,route),plan=STARTER_SET_PLANS[planIndex];
 // Price on a separate funded copy; this wallet is never used for the actual seven-day route.
 let priced=structuredClone(save);priced.currencies.gold=100000;
 for(const id of plan.items){let result=purchaseBattleOutfitterItem(priced,id);assert.ok(result.ok,result.message);priced=result.save;const copy=getEquipmentCopies(priced,id).find(c=>!c.owner)!;for(let n=0;n<level;n++){result=enhanceEquipment(priced,copy.id,n,()=>0.5);assert.ok(result.ok,result.message);priced=result.save;}}
 const cost=100000-priced.currencies.gold,afterReserve=save.currencies.gold-cost-reserve.total;
 if(afterReserve<0)return {route,seed,noGoalGold,plan:plan.name,level,startGold,cost,reserve,afterReserve,afterReserveWith200Buffer:afterReserve-200,accepted:false,shortfall:-afterReserve};
 const slots=new Set<string>();
 for(const id of plan.items){const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===id)!;assert.ok(!slots.has(item.equipmentSlot!));slots.add(item.equipmentSlot!);const before=save.currencies.gold;apply(purchaseBattleOutfitterItem(save,id));const copy=getEquipmentCopies(save,id).find(c=>!c.owner)!;for(let n=0;n<level;n++)apply(enhanceEquipment(save,copy.id,n,()=>0.5));apply(assignBattleOutfitterEquipment(save,starter,id,copy.id));gearGold+=before-save.currencies.gold;}
 assert.equal(gearGold,cost);
 const rows=[];let minPreSleepEnergy=Infinity,commissionDay:number|null=null,quarryDay:number|null=null,sawmillDay:number|null=null;
 for(let day=1;day<=7;day++){
  const begin=save.currencies.gold,goalBefore=goalGold,actions:string[]=[];let workEnergy=0;
  const sites:SiteId[]=['wheat_field','garden',route==='production'&&getFarmState(save).facilities.quarry&&(getFarmState(save).stock.stone??0)<4?'quarry':'woodlot'];
  for(const site of sites){const c=save.creatures![0],reason=workerBlocker(save,c,site);if(reason){actions.push(`Skipped ${site}: ${reason}`);continue;}const energy=c.energy,gold=save.currencies.gold;const result=workResourceSite(save,site,starter);assert.ok(result.ok,result.message);assert.equal(result.save.currencies.gold,gold);workEnergy+=energy-result.save.creatures![0].energy;apply(result);actions.push(result.message);}
  if(route==='production'){
   const farm=getFarmState(save);
   if(!farm.project&&!getBuilderWorkOrder(save)){
    const id=!farm.facilities.quarry?'quarry':!farm.facilities.sawmill?'sawmill':null;
    if(id){const before=save.currencies.gold,r=commissionFacility(save,id);if(r.ok){constructionGold+=before-r.save.currencies.gold;apply(r);actions.push(`Commission ${id}`);if(id==='quarry')quarryDay=day;else sawmillDay=day;}}
   }
  }
  if(route==='canine-habitat'&&!isHabitatUnlocked(save,'canine')&&!getBuilderWorkOrder(save)){
   const before=save.currencies.gold,r=commissionBuilderProject(save,'unlock_canine_habitat');if(r.ok){constructionGold+=before-r.save.currencies.gold;apply(r);commissionDay=day;actions.push('Commission canine habitat');}
  }
  for(let n=0;n<4&&getFoodBudget(save,2).shortage>0;n++){const r=craftResource(save,'rations',1,save.creatures![0].creatureId);if(!r.ok)break;apply(r);actions.push('Cook four rations');}
  const shortage=getFoodBudget(save,1).shortage;
  if(shortage){let remaining=shortage;while(remaining){const qty=Math.min(20,remaining),before=save.currencies.gold;apply(tradeResource(save,'rations',qty,false));foodGold+=before-save.currencies.gold;remaining-=qty;}actions.push(`Buy ${shortage} fallback rations`);}
  const farm=getFarmState(save),needed=route==='production'?(!farm.facilities.quarry?14:!farm.facilities.sawmill?8:0):route==='canine-habitat'&&!isHabitatUnlocked(save,'canine')?6:0;
  if(day>=4&&farm.orders.timber!=='completed'&&((farm.stock.wood??0)-(farm.reserves.wood??0))>=8+needed){if(!farm.orders.timber)apply(actSupplyOrder(save,'timber'));const before=save.currencies.gold;apply(actSupplyOrder(save,'timber'));deliveryGold+=save.currencies.gold-before;actions.push('One timber delivery');}
  const food=getFoodBudget(save,1),energy=save.creatures![0].energy;minPreSleepEnergy=Math.min(minPreSleepEnergy,energy);assert.equal(food.shortage,0);assert.ok((getFarmState(save).stock.wood??0)>=2,'Repair reserve must remain intact');
  const beforeNight=save.currencies.gold,night=projectRanchDay(enterEveningReview(save));assert.ok(night);const overnightGain=night.save.currencies.gold-beforeNight;assert.ok(overnightGain>=0,'No monthly tax falls in this horizon');goalGold+=noGoalGold?0:overnightGain;save=noGoalGold?{...night.save,currencies:{...night.save.currencies,gold:beforeNight}}:night.save;
  rows.push({day,gold:save.currencies.gold,goldChange:save.currencies.gold-begin,rewardGold:goalGold-goalBefore,foodNeed:food.nightlyNeed,foodShortage:food.shortage,workEnergy,preSleepEnergy:energy,nextMorningEnergy:save.creatures![0].energy,nightEvents:night.result.summaryItems,foodFallback:getFoodBudget(save,7).topUpGold,stock:getFarmState(save).stock,actions});
 }
 assert.equal(save.creatures?.length,1);assert.ok(save.currencies.gold>=0);assert.equal(save.currencies.gold,startGold+goalGold+deliveryGold-foodGold-constructionGold-gearGold,'Exact Gold ledger');
 if(route==='production'){assert.ok(getFarmState(save).facilities.quarry);assert.ok(getFarmState(save).facilities.sawmill);}
 if(route==='canine-habitat')assert.ok(isHabitatUnlocked(save,'canine'));
 // Retain a genuine initial snapshot for independent repeatability checks, never persist a game save.
 assert.ok(original.includes('species_equine'));
 return {route,seed,noGoalGold,plan:plan.name,level,startGold,cost,reserve,afterReserve,afterReserveWith200Buffer:afterReserve-200,accepted:true,goalGold,deliveryGold,foodGold,constructionGold,endGold:save.currencies.gold,weekTwoFoodGold:getFoodBudget(save,7).topUpGold,minPreSleepEnergy,commissionDay,quarryDay,sawmillDay,rows};
 }finally{Date.now=now;}
}
export function auditReserveAwareEquineWeek(){
 const rows=routes.flatMap(route=>[0,1,2].flatMap(seed=>[false,true].flatMap(noGold=>STARTER_SET_PLANS.flatMap((p,index)=>(p.items.length?[0,3]:[0]).map(level=>run(route,seed,noGold,index,level))))));
 return {method:'Actual one-equine/one-habitat start, 1200 Gold; three timestamp seeds; three work actions per day for seven days, actual Energy blockers/recovery/feeding, two Wood reserved; actual one-time starter/daily goals and one timber order at most. Alternative route plans: care only, Quarry+Sawmill, canine habitat (no canine adoption). Upfront equipment is admitted only after protecting seven-night stock-only food fallback plus the full construction Gold, market replacement value of missing unreserved inputs, and missing two-Wood repair stock. Starting legacy Feed is counted by the real food planner. The material fallback is a conservative reserve, not actual spending: actual construction gathers resources. No borrowed future income; no infinite wallet in actual routes. Fixed 0.5 enhancement RNG is a reproducible example, not an expected roll. No battles, battle income, breeding, adoption, sales, training or bonus meals. No discretionary incident responses or injected incidents; normal overnight security processing is retained; Farm gear grants no direct work benefit; Gold-dependent daily-goal eligibility can change reward stocks, so every admitted loadout is simulated independently. No-goal-Gold sensitivity retains one-time non-Gold rewards and claim flags; it is not a zero-reward/zero-stock stress test. Day1 through Day8 morning only; no monthly tax bill assumed.',rows};
}
export function summarizeReserveAudit(report:ReturnType<typeof auditReserveAwareEquineWeek>){
 const range=(values:number[])=>values.length?[Math.min(...values),Math.max(...values)]:null;
 const keys=[...new Set(report.rows.map(r=>`${r.route}:${r.plan}:${r.level}`))];
 return {method:report.method,totalDecisions:report.rows.length,admittedRoutes:report.rows.filter(r=>r.accepted).length,rows:keys.map(key=>{
  const cases=report.rows.filter(r=>`${r.route}:${r.plan}:${r.level}`===key),first=cases[0],accepted=cases.filter(r=>r.accepted);
  return {route:first.route,plan:first.plan,level:first.level,cost:first.cost,reserve:first.reserve,afterReserve:first.afterReserve,afterReserveWith200Buffer:first.afterReserveWith200Buffer,cases:cases.length,admitted:accepted.length,normalEndGold:range(accepted.filter(r=>!r.noGoalGold).map(r=>r.endGold!)),noGoalGoldEnd:range(accepted.filter(r=>r.noGoalGold).map(r=>r.endGold!)),minPreSleepEnergy:range(accepted.map(r=>r.minPreSleepEnergy!))};
 })};
}
if(process.argv[1]?.endsWith('reserve-aware-equine-week.ts')){const full=auditReserveAwareEquineWeek(),report=process.argv.includes('--summary')?summarizeReserveAudit(full):full;const json=JSON.stringify(report,null,2),output=process.argv.slice(2).find(arg=>arg!=='--summary');if(output)writeFileSync(output,json+'\n');else console.log(json);console.error(`PASS ${full.rows.length} reserve decisions; ${full.rows.filter(r=>r.accepted).length} complete seven-day routes`);}
