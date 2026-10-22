import {getBuilderWorkOrder,getBuilderProject} from './builderProjects';
import {getFarmState,FACILITIES,type Stock} from './farmResources';
import {getTrainingAssignment,isCreatureAwayForTraining} from './trainingGrounds';
import type {CreatureRecord} from '@/types/creature';
import type {GameSave} from '@/types/save';

export type CycleMeal={creatureId:string;required:number;covered:number;used:Stock;legacyUsed:number};
export type CycleResident={before:CreatureRecord;after:CreatureRecord;away:boolean;meal?:CycleMeal;isNew?:boolean;missing?:boolean};
export type CycleTimer={title:string;detail:string;ready:boolean};

/** Read the completed night. Never project another day or reallocate food for a receipt. */
export function getMorningCycleReport(before:GameSave,after:GameSave){
 let meals:CycleMeal[]=[];
 try{const stored=JSON.parse(String(after.flags.ranchFeedingMealsToday??'[]'));if(Array.isArray(stored))meals=stored;}catch{/* Older saves may not have recorded meal allocations. */}
 const afterById=new Map((after.creatures??[]).map(c=>[c.creatureId,c]));
 const mealById=new Map(meals.map(m=>[m.creatureId,m]));
 const beforeIds=new Set((before.creatures??[]).map(c=>c.creatureId));
 const residents:CycleResident[]=(before.creatures??[]).map(c=>({before:c,after:afterById.get(c.creatureId)??c,missing:!afterById.has(c.creatureId),away:isCreatureAwayForTraining(before,c.creatureId),meal:mealById.get(c.creatureId)}));
 for(const c of after.creatures??[])if(!beforeIds.has(c.creatureId))residents.push({before:c,after:c,isNew:true,away:isCreatureAwayForTraining(after,c.creatureId),meal:mealById.get(c.creatureId)});
 const timers:CycleTimer[]=[];
 const oldOrder=getBuilderWorkOrder(before),order=getBuilderWorkOrder(after);
 if(oldOrder&&!order&&oldOrder.readyDay<=after.dayState.dayNumber)timers.push({title:getBuilderProject(oldOrder.projectId).title,detail:'Construction completed overnight. Its fee was already paid.',ready:true});
 if(order)timers.push({title:getBuilderProject(order.projectId).title,detail:`In progress · Ready Ranch Day ${order.readyDay}`,ready:false});
 const oldProject=getFarmState(before).project,project=getFarmState(after).project;
 if(oldProject&&!project&&oldProject.readyDay<=after.dayState.dayNumber)timers.push({title:FACILITIES[oldProject.id].name,detail:'Construction completed overnight. Its fee was already paid.',ready:true});
 if(project)timers.push({title:FACILITIES[project.id].name,detail:`In progress · Ready Ranch Day ${project.readyDay}`,ready:false});
 for(const c of after.creatures??[]){const training=getTrainingAssignment(after,c.creatureId);if(training)timers.push({title:`${c.nickname} · Training`,detail:training.isReady?'Ready now · Collect from Rhea':`${training.daysRemaining} day(s) remaining · With Rhea`,ready:training.isReady});}
 const eggsReady=(after.eggs??[]).filter(e=>e.status==='ready').length,eggsIncubating=(after.eggs??[]).filter(e=>e.status==='incubating').length,pregnancies=(after.pregnancies??[]).filter(p=>p.status==='pregnant').length;
 if(eggsReady||eggsIncubating||pregnancies)timers.push({title:'Nursery',detail:`${eggsReady} egg(s) ready · ${eggsIncubating} incubating · ${pregnancies} active pregnancy timer(s)`,ready:eggsReady>0});
 return {residents,timers,meals,creaturesFed:Number(after.flags.ranchCreaturesFedToday??meals.filter(m=>m.covered>=m.required).length),creaturesEating:Number(after.flags.ranchCreaturesEatingToday??meals.length),covered:Number(after.flags.ranchFeedConsumedToday??0),required:Number(after.flags.ranchFeedRequiredToday??0)};
}

/** Complete, word-bound chunks fit the paged log even on short phone screens. */
export function cycleTextPages(paragraphs:string[],limit=150){
 const pages:string[]=[];
 for(const paragraph of paragraphs){let chunk='';for(const word of paragraph.split(/\s+/).filter(Boolean)){if(chunk&&chunk.length+word.length+1>limit){pages.push(chunk);chunk='';}chunk+=(chunk?' ':'')+word;}if(chunk)pages.push(chunk);}
 return pages;
}
