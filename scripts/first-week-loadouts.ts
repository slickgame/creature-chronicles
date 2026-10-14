import {createNewGameSave} from '@/lib/save/localSave';
import {createStarterCreatures} from '@/data/creatures';
import {workResourceSite,craftResource,commissionFacility,actSupplyOrder,getFarmState} from '@/data/farmResources';
import {enterEveningReview,createRanchDayState} from '@/data/ranch-day/ranchDayState';
import {projectRanchDay} from '@/data/ranch-day/ranchDayLifecycle';
import {getFoodBudget} from '@/data/economyBudget';
import {BATTLE_OUTFITTER_ITEMS,purchaseBattleOutfitterItem,assignBattleOutfitterEquipment,type BattleOutfitterItemId} from '@/data/battleOutfitter';
import {enhancementCost} from '@/data/equipmentEnhancement';
import {getEquipmentCopies,enhanceEquipment} from '@/data/equipmentInstances';
import {createBattleState,resolveBattleRound} from '@/data/battleEngine';
import {applyBattleOutfitterLoadouts} from '@/data/battleOutfitterIntegration';
import {buildBattleAiPlan} from '@/data/battleAi';
import {COLISEUM_C2_ENCOUNTERS,buildAuthoredColiseumEnemyTeam,applyAuthoredColiseumEquipment} from '@/data/coliseumC2';
import {equipmentAuditRandom} from './equipment-battle-balance';
import type {GameSave} from '@/types/save';
const COMMON:BattleOutfitterItemId[]=['training_grips','padded_harness','linen_headband','practice_wraps','keepsake_charm'];
export const WEEK_LOADOUTS=[
 {name:'Farm first',members:0,items:[] as BattleOutfitterItemId[],level:0},
 {name:'One weapon +3',members:1,items:['training_grips'] as BattleOutfitterItemId[],level:3},
 {name:'Three weapons +3',members:3,items:['training_grips'] as BattleOutfitterItemId[],level:3},
 {name:'Three weapons +6',members:3,items:['training_grips'] as BattleOutfitterItemId[],level:6},
 {name:'One common set +3',members:1,items:COMMON,level:3},
 {name:'Three common sets +0',members:3,items:COMMON,level:0},
 {name:'Three common sets +3',members:3,items:COMMON,level:3},
 {name:'Three common sets +6',members:3,items:COMMON,level:6},
];
export function buildFirstWeekFarm(){
 let save=createNewGameSave('First-week loadout audit',0);save.saveId='first-week-loadout-audit' as GameSave['saveId'];save.creatures=createStarterCreatures(save.saveId);save.ranchDay=createRanchDayState(save);
 const startingFood=getFoodBudget(save),startGold=save.currencies.gold,days=[];let deliveryGold=0,constructionGold=0;
 const apply=(r:{save:GameSave;ok:boolean;message:string})=>{if(!r.ok)throw Error(r.message);save=r.save;};
 for(let day=1;day<=7;day++){
  const before=save.currencies.gold;
  for(const [index,site] of (['wheat_field','garden',day===5?'quarry':'woodlot'] as const).entries())apply(workResourceSite(save,site,save.creatures![index].creatureId));
  apply(craftResource(save,'rations',2));
  if(day===2){apply(actSupplyOrder(save,'timber'));const g=save.currencies.gold;apply(actSupplyOrder(save,'timber'));deliveryGold+=save.currencies.gold-g;}
  if(day===3||day===6){const g=save.currencies.gold;apply(commissionFacility(save,day===3?'quarry':'sawmill'));constructionGold+=g-save.currencies.gold;}
  const beforeNight=save.currencies.gold,tonight=getFoodBudget(save,1),projected=projectRanchDay(enterEveningReview(save));if(!projected)throw Error('Day projection failed');save=projected.save;
  days.push({day,overnightGold:save.currencies.gold-beforeNight,gold:save.currencies.gold,goldChange:save.currencies.gold-before,shortage:tonight.shortage,required:Number(save.flags.ranchFeedRequiredToday),covered:Number(save.flags.ranchFeedConsumedToday),rations:getFarmState(save).stock.rations??0});
 }
 return {save,startingFood,startGold,deliveryGold,constructionGold,otherGold:save.currencies.gold-startGold-deliveryGold+constructionGold,days,food:getFoodBudget(save)};
}
export function runFirstWeekLoadouts(samples=24){
 const farm=buildFirstWeekFarm(),rows=[];
 for(const plan of WEEK_LOADOUTS){
  const cost=plan.members*plan.items.reduce((sum,id)=>{const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===id)!;let gold=item.costGold;for(let n=0;n<plan.level;n++)gold+=enhancementCost(item,n);return sum+gold;},0);
  const balance=farm.save.currencies.gold-cost,afterFood=balance-farm.food.topUpGold;
  const dayOneAfterPlan=farm.startGold-farm.startingFood.topUpGold-farm.constructionGold-cost;
  const withoutGoalGold=farm.startGold+farm.deliveryGold-farm.constructionGold-cost-farm.food.topUpGold;
  if(afterFood<0){rows.push({name:plan.name,cost,balance,afterFood,dayOneAfterPlan,withoutGoalGold,accepted:false,reason:balance<0?'Not enough Gold':'Leaves less than seven-night food fallback',battles:[]});continue;}
  const saves=Array.from({length:samples},(_,seed)=>{
   let save=structuredClone(farm.save);const rng=equipmentAuditRandom('typical',1729+seed*7919);
   const apply=(r:{save:GameSave;ok:boolean;message:string})=>{if(!r.ok)throw Error(r.message);save=r.save;};
   for(const creature of save.creatures!.slice(0,plan.members))for(const id of plan.items){
    apply(purchaseBattleOutfitterItem(save,id));const copy=getEquipmentCopies(save,id).find(c=>!c.owner)!;
    for(let n=0;n<plan.level;n++)apply(enhanceEquipment(save,copy.id,n,rng));
    apply(assignBattleOutfitterEquipment(save,creature.creatureId,id,copy.id));
   }
   if(save.currencies.gold!==balance)throw Error('Planned and actual gear cost differ');return save;
  });
  const battles=COLISEUM_C2_ENCOUNTERS.slice(0,4).map(encounter=>{
   let wins=0,losses=0,timeouts=0,rounds=0;
   for(let seed=0;seed<samples;seed++){
    const save=saves[seed];let state=applyBattleOutfitterLoadouts(save,applyAuthoredColiseumEquipment(createBattleState({battleId:`week_${encounter.encounterId}_${seed}`,playerCreatures:save.creatures!.slice(0,3),enemyCreatures:buildAuthoredColiseumEnemyTeam(save.saveId,encounter)}),encounter));let count=0;
    while(state.outcome==='ongoing'&&count<60){state=resolveBattleRound(state,[...buildBattleAiPlan(state,'player','tactical').actions,...buildBattleAiPlan(state,'enemy',encounter.aiDifficulty).actions]).state;count++;}
    rounds+=count;if(state.outcome==='player_won')wins++;else if(state.outcome==='enemy_won')losses++;else timeouts++;
   }
   return {encounter:encounter.name,samples,wins,losses,timeouts,averageRounds:Math.round(rounds/samples*10)/10};
  });
  rows.push({name:plan.name,cost,balance,afterFood,dayOneAfterPlan,withoutGoalGold,accepted:true,reason:'Food fallback covered after construction',battles});
 }
 return {method:'Seven farm days, three work actions/day, eight rations/day, one timber delivery, Quarry day 3, Sawmill day 6; no gear until day 8. No mission income, sales, training, births or combat growth. Reserve a further seven nights of stock-only food at Trade prices. Tactical AI, isolated encounter comparisons, seeded actual equipment rolls; no encounter unlocks or rewards simulated. Not human win probabilities.',startGold:farm.startGold,startingFood:farm.startingFood,deliveryGold:farm.deliveryGold,constructionGold:farm.constructionGold,otherGold:farm.otherGold,endGold:farm.save.currencies.gold,food:farm.food,days:farm.days,facilities:getFarmState(farm.save).facilities,rows};
}
if(process.argv[1]?.endsWith('first-week-loadouts.ts'))console.log(JSON.stringify(runFirstWeekLoadouts(),null,2));
