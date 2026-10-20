import {getRanchPlanner,type PlannerDestination} from './ranchPlanner';
import {deriveCreatureMoods} from './ranch-day/ranchDayMood';
import type {GameSave} from '@/types/save';
export const LEDGER_SECTIONS=['Priorities','Brief','Event','Goals','Records','Moods'] as const;
export type LedgerSection=typeof LEDGER_SECTIONS[number];
export type LedgerEntry={key:string;title:string;detail:string;note?:string;attention?:boolean;destination?:PlannerDestination|'collection';action?:string;choiceId?:string;creatureId?:string};
/** Every record remains reachable; no UI limit truncates the underlying lists. */
export function getRanchLedgerBook(save:GameSave):Record<LedgerSection,LedgerEntry[]>{
 const planner=getRanchPlanner(save),day=save.ranchDay,brief=day?.morningBrief,event=day?.event;
 return {
 // Town training has its own screen. Cleanliness joins only when implemented.
 Priorities:planner.rows.filter(r=>r.id!=='training').sort((a,b)=>Number(b.attention)-Number(a.attention)).map(r=>({key:r.id,title:r.title,detail:r.detail,note:r.status,attention:r.attention,destination:r.destination,action:r.action.replace('Open Office','Ranch repairs')})),
 Brief:brief?[...brief.warnings.map((detail,i)=>({key:'warning-'+i,title:'Warning',detail,attention:true})),...brief.highlights.map((detail,i)=>({key:'highlight-'+i,title:'Highlight',detail})),...brief.nextSteps.map((detail,i)=>({key:'step-'+i,title:'Next step',detail}))]:[],
 Event:event?(event.resultText?[{key:event.eventId,title:event.title,detail:event.resultText,note:'Resolved · This event cannot pay again.'}]:event.choices.map(c=>({key:event.eventId+":"+c.choiceId,title:c.label,detail:c.description,note:c.requirementLabel,choiceId:c.choiceId}))):[],
 Goals:(day?.goals??[]).map(g=>({key:g.goalId,title:g.label,detail:g.description,note:`${g.progress} / ${g.target} · ${g.complete?'Complete':'In progress'} · ${g.rewardLabel}${g.rewardClaimed?' · Claimed':''}`})),
 Records:[...(day?.activities??[])].reverse().map(a=>({key:a.activityId,title:a.type.replaceAll('-',' '),detail:a.label,note:`Ranch Day ${a.dayNumber}`})),
 Moods:deriveCreatureMoods(save).map(m=>({key:m.creatureId,title:`${m.creatureName} · ${m.mood}`,detail:m.reason,creatureId:m.creatureId,destination:'collection',action:'Creature roster'})),
 };
}
