import {projectRanchDay} from './ranch-day/ranchDayLifecycle';
import {enterEveningReview} from './ranch-day/ranchDayState';
import {getFarmState,FACILITIES, type Stock} from './farmResources';
import {getBuilderWorkOrder,getBuilderProject} from './builderProjects';
import {getTrainingAssignment,isCreatureAwayForTraining} from './trainingGrounds';
import {getCurrentMonthFinalizedTax} from './taxes';
import type {GameSave} from '@/types/save';
const number=(n:unknown)=>Math.max(0,Number(n)||0);
/** Same detached overnight projection used by the ledger. Never commits transactions or rewards. */
export function getNightCareReview(save:GameSave){
 const projected=projectRanchDay(enterEveningReview(structuredClone(save)))!.save;
 const required=number(projected.flags.ranchFeedRequiredToday),covered=number(projected.flags.ranchFeedConsumedToday);
 const farm=getFarmState(save),nextDay=save.dayState.dayNumber+1,order=getBuilderWorkOrder(save);
 const meals = JSON.parse(String(projected.flags.ranchFeedingMealsToday ?? '[]')) as {creatureId:string;required:number;covered:number;used:Stock;legacyUsed:number}[];
 const creatures=(save.creatures??[]).map(before=>{
  const after=projected.creatures?.find(c=>c.creatureId===before.creatureId)??before;
  return {before,after,away:isCreatureAwayForTraining(save,before.creatureId),meal:meals.find(m=>m.creatureId===before.creatureId)};
 });
 const timers:{title:string;detail:string;ready:boolean;destination:'builder'|'training'|'nursery'}[]=[];
 if(order)timers.push({title:getBuilderProject(order.projectId).title,detail:`Already paid · Ready Ranch Day ${order.readyDay}`,ready:order.readyDay<=nextDay,destination:'builder'});
 if(farm.project)timers.push({title:FACILITIES[farm.project.id].name,detail:`Already paid · Ready Ranch Day ${farm.project.readyDay}`,ready:farm.project.readyDay<=nextDay,destination:'builder'});
 for(const c of save.creatures??[]){const training=getTrainingAssignment(save,c.creatureId),after=getTrainingAssignment(projected,c.creatureId);if(training)timers.push({title:`${c.nickname} · Training`,detail:training.isReady?'Ready now · Collect from Rhea':after?.isReady?'Ready after sleep · Collect from Rhea':`${after?.daysRemaining??training.daysRemaining} day(s) remaining after sleep`,ready:!!after?.isReady,destination:'training'});}
 const eggsNow=(save.eggs??[]).filter(e=>e.status==='ready').length,eggsAfter=(projected.eggs??[]).filter(e=>e.status==='ready').length;
 if(save.eggs?.length||save.pregnancies?.length)timers.push({title:'Egg nursery',detail:`${eggsNow} ready now · ${eggsAfter} projected ready after sleep. Pregnancy and incubation timers advance.`,ready:eggsAfter>0,destination:'nursery'});
 return {nextDay,required,covered,creaturesFed:meals.filter(m=>m.covered>=m.required).length,creaturesEating:meals.length,shortage:Math.max(0,required-covered),legacyUsed:number(projected.flags.ranchLegacyFeedConsumedToday),rations:farm.stock.rations??0,reservedRations:farm.reserves.rations??0,ingredientFeeding:!!farm.ingredientFeeding,creatures,timers,playerEnergy:projected.currencies.energy,playerMaxEnergy:projected.currencies.maxEnergy,conditionPenalty:number(projected.flags.ranchConditionEnergyPenaltyToday),tax:getCurrentMonthFinalizedTax(save),taxDue:save.dayState.dayOfMonth>=30,gold:save.currencies.gold};
}
