"use client";

import { useMemo, useRef, useState } from 'react';
import { useGameContext } from '@/state/GameProvider';
import { GameDialog } from '@/features/ui/GameDialog';
import { IngredientCounter } from '@/features/builder/IngredientCounter';
import { ResourceShelf } from './ResourceShelf';
import { ProductionBook } from './ProductionBook';
import { getFoodBudget } from '@/data/economyBudget';
import { getNightCareReview } from '@/data/nightCareReview';
import { getFarmSecurity } from '@/data/farmSecurity';
import { getPredatorThreatAssessment } from '@/data/predatorThreat';
import { getDailyFeedCost } from '@/data/ranchJobsPredator';
import { isCreatureAwayForTraining } from '@/data/trainingGrounds';
import { getVariantDefinition } from '@/data/creatures';
import { getResourceArt } from '@/data/resourceArt';
import { getFarmState, foodChoices, RESOURCES, RESOURCE_IDS, canSpend, resourceList, setIngredientFeeding, type FarmResult } from '@/data/farmResources';
import { repairRanchDamage, RANCH_REPAIR_RESOURCES, RANCH_REPAIR_DAMAGE_AMOUNT } from '@/data/ranchUpgrades';
import type { GameSave } from '@/types/save';
import s from './FarmCareBook.module.css';

type Section = 'Feeding' | 'Security' | 'Budget';
export function FarmCareBook({ initialSection, onBack }: { initialSection: Section; onBack: () => void }) {
 const {currentSave:save,saveCurrentGame,goToTown}=useGameContext();
 const [section,setSection]=useState(initialSection),[page,setPage]=useState(0),[detail,setDetail]=useState(0);
 const [popup,setPopup]=useState<'rules'|'repair'|'feeding'|'receipt'|null>(null);
 const [route,setRoute]=useState<'storage'|'rations'|'kitchen'|null>(null);
 const [productionSection,setProductionSection]=useState<'Gathering'|'Kitchen'|'Workbench'>('Kitchen');
 const [message,setMessage]=useState('');const busy=useRef(false);
 const tonight=useMemo(()=>save?getNightCareReview(save):null,[save]);
 if(!save||!tonight)return null;
 const farm=getFarmState(save),budget=getFoodBudget(save),security=getFarmSecurity(save),threat=getPredatorThreatAssessment(save);
 const creatures=save.creatures??[];
 const count=section==='Feeding'?1+creatures.length:section==='Budget'?7:2;
 const current=Math.min(page,count-1),creature=section==='Feeding'&&current>0?creatures[current-1]:null;
 const away=creature?isCreatureAwayForTraining(save,creature.creatureId):false;
 const kits=Math.max(0,Math.floor(Number(save.flags.ranchRepairKits)||0));
 const repairCost=kits?'1 Repair Kit':resourceList(RANCH_REPAIR_RESOURCES);
 const repairable=security.condition<100&&(kits>0||canSpend(farm,RANCH_REPAIR_RESOURCES));
 const afterCondition=Math.min(100,security.condition+RANCH_REPAIR_DAMAGE_AMOUNT);
 const afterSecurity=Math.floor(security.maximum*afterCondition/100)+(security.guard?.bonus??0);
 const title=section==='Feeding'?(creature?creature.nickname:'Tonight’s feeding'):section==='Budget'?`Night ${current+1} of 7`:current===0?'Fortifications':'Guard Dog';
 const art=creature?getVariantDefinition(creature.variantId).profilePath:section==='Security'?'/images/ui/atelier-v1/patrol.webp':getResourceArt('rations')!;
 const rules=section==='Security'?[...threat.blockers,...threat.reasons,...security.candidates.map((c,i)=>`${c.name}: Grade ${c.grade}, +${c.bonus} Security. ${i===0?'Active strongest bonus.':'Not added; strongest bonus only.'}`),'Only the strongest resident canine Guard Dog contributes. Working or resting does not disable it; away trainees do not contribute.','Fortification protection scales with current condition. Repairs use a Repair Kit first; otherwise they consume 2 unreserved Wood + 1 Stone. No Gold or Energy upkeep.']:['Balanced rations are used first. If raw-ingredient feeding is enabled, species-compatible unreserved ingredients come next; legacy Feed covers the rest.','Each ration or compatible ingredient covers one food unit. Reserves protect supplies. Prepared meals are served manually, never consumed by nightly feeding.','Away trainees are excluded. If food runs short, existing reduced overnight recovery rules apply.','The seven-night forecast repeats today’s resident needs against current stock. It assumes no gathering, rewards, births, arrivals, training returns or other spending. Top-up uses Trade prices; Pella’s bundles may be cheaper.'];
 function show(next:typeof popup){busy.current=false;setDetail(0);setPopup(next);}
 function apply(action:(save:GameSave)=>FarmResult){if(!save||busy.current)return;busy.current=true;const result=action(save);let text=result.message;if(result.ok){const persisted=saveCurrentGame(result.save),g=persisted.currencies.gold-result.save.currencies.gold,gp=persisted.currencies.guildPoints-result.save.currencies.guildPoints;const a=getFarmState(persisted).stock,b=getFarmState(result.save).stock;const bonus=Object.fromEntries(RESOURCE_IDS.map(id=>[id,(a[id]??0)-(b[id]??0)]).filter(([,n])=>Number(n)>0));const reward=[g?`${g} Gold`:'',gp?`${gp} GP`:'',resourceList(bonus)].filter(Boolean);if(reward.length)text+=` Goal rewards: ${reward.join(' + ')}.`;}setMessage(text);setPopup('receipt');}
 return <main className={s.screen} data-farm-care-book>
  <header><button onClick={onBack}>‹ Resources</button><h1>{section==='Budget'?'Food planning':section}</h1><select aria-label="Care section" value={section} onChange={e=>{setSection(e.target.value as Section);setPage(0);}}><option>Feeding</option><option>Security</option><option>Budget</option></select></header>
  <section className={s.sheet}>
   <div className={s.pager}><button disabled={current===0} onClick={()=>setPage(current-1)}>Previous page</button><span>{current+1} / {count}</span><button disabled={current+1===count} onClick={()=>setPage(current+1)}>Next page</button></div>
   <div className={s.body}><img src={art} alt={creature?creature.nickname:''}/><div><small>DAY {save.dayState.dayNumber} · {title}</small><h2>{title}</h2>
    {section==='Feeding'?(creature?<><p className={s.metric}>{away?'Away at training':`${getDailyFeedCost(creature)} food units nightly`}</p><p>{away?'Excluded from tonight’s ranch feeding.':'Balanced rations first; legacy Feed covers any remainder.'}</p><p>Raw ingredient priority: {foodChoices(creature).map(id=>RESOURCES[id].name).join(' → ')}.</p><p>Raw ingredients: {farm.ingredientFeeding?'enabled':'saved for recipes'}.</p></>:<><p className={s.metric}>{tonight.covered} / {tonight.required} food units covered</p><p>{tonight.shortage?`${tonight.shortage} more rations needed tonight.`:'Current supplies cover tonight.'}</p><p>{creatures.filter(c=>!isCreatureAwayForTraining(save,c.creatureId)).length} residents fed · {creatures.filter(c=>isCreatureAwayForTraining(save,c.creatureId)).length} away.</p><p>Raw ingredients: <b>{farm.ingredientFeeding?'enabled':'saved for recipes'}</b></p></>):section==='Budget'?<><p className={s.metric}>{budget.days[current].covered} / {budget.days[current].required} covered</p><p>Night {current+1} shortage: {budget.days[current].shortage} food units.</p><p>Seven-night total: <b>{budget.shortage} rations short · {budget.topUpGold} Gold</b> at Trade prices.</p><p>Gold after full top-up: {save.currencies.gold-budget.topUpGold>=0?save.currencies.gold-budget.topUpGold:`short by ${budget.topUpGold-save.currencies.gold}`}.</p><p className={s.note}>Current stock only; forecast assumptions in Details.</p></>:current===0?<><p className={s.metric}>{security.total} Security</p><p>Condition <b>{security.condition}%</b> · Fortifications {security.fortifications} / {security.maximum}</p><p>Guard Dog +{security.guard?.bonus??0} · Predator incident chance {threat.eventChance}%</p><p>{security.condition===100?'No repairs needed.':`Repair: ${repairCost}. Restores up to ${RANCH_REPAIR_DAMAGE_AMOUNT} condition.`}</p>{!repairable&&security.condition<100&&<p>Need a Repair Kit or unreserved repair materials.</p>}</>:<><p className={s.metric}>{security.guard?`${security.guard.name} · +${security.guard.bonus}`:'No eligible Guard Dog'}</p><p>{security.guard?`Grade ${security.guard.grade} · strongest resident bonus active.`:'Fortifications still protect the farm.'}</p><p>{security.candidates.length} eligible candidate{security.candidates.length===1?'':'s'}. Bonuses never stack.</p><p>Working and resting keep the bonus active. Away trainees do not contribute.</p></>}
   </div></div>
   <footer><button onClick={()=>show('rules')}>Details</button><button onClick={()=>setRoute('storage')}>Storage & reserves</button>{section==='Security'?<><button disabled={!repairable} onClick={()=>show('repair')}>Review repair</button><button onClick={()=>{onBack();goToTown();}}>Visit Town</button></>:<><button onClick={()=>{setProductionSection('Kitchen');setRoute('kitchen');}}>Cook rations</button><button onClick={()=>setRoute('rations')}>Buy rations</button>{section==='Feeding'&&<button onClick={()=>show('feeding')}>Feeding setting</button>}</>}</footer>
  </section>
  {popup&&<GameDialog title={popup==='repair'?'Confirm repairs':popup==='feeding'?'Raw ingredient feeding':popup==='receipt'?'Farm receipt':'Farm details'} onClose={()=>setPopup(null)}><div className={s.popup}>
   {popup==='rules'?<><p>{rules[detail]}</p><div className={s.pager}><button disabled={detail===0} onClick={()=>setDetail(detail-1)}>Previous detail</button><span>{detail+1} / {rules.length}</span><button disabled={detail===rules.length-1} onClick={()=>setDetail(detail+1)}>Next detail</button></div></>:popup==='repair'?<><p>Use <b>{repairCost}</b>. No Gold or Energy charge.</p><p>Condition {security.condition}% → {afterCondition}%. Security {security.total} → {afterSecurity}.</p><p>{kits?`${kits} Repair Kits owned; kits are used before materials.`:`Wood: ${farm.stock.wood??0} owned / ${farm.reserves.wood??0} reserved. Stone: ${farm.stock.stone??0} owned / ${farm.reserves.stone??0} reserved.`}</p><div className={s.pager}><button onClick={()=>setPopup(null)}>Cancel repair</button><button disabled={!repairable} onClick={()=>apply(repairRanchDamage)}>Confirm repair</button></div></>:popup==='feeding'?<><p>{farm.ingredientFeeding?'Save raw ingredients for recipes?':'Allow species-compatible raw ingredients after Balanced rations each night?'}</p><p>Reserves stay protected. Prepared meals are never used automatically. This changes tonight’s feeding policy; it does not consume food now.</p><div className={s.pager}><button onClick={()=>setPopup(null)}>Cancel setting</button><button onClick={()=>apply(s=>setIngredientFeeding(s,!farm.ingredientFeeding))}>Confirm setting</button></div></>:<><p role="status">{message}</p><button onClick={()=>setPopup(null)}>Return to page</button></>}
  </div></GameDialog>}
  {route==='storage'&&<GameDialog fullScreen title="Supplies and reserves" onClose={()=>setRoute(null)}><ResourceShelf initialMode="Storage" onBack={()=>setRoute(null)}/></GameDialog>}
  {route==='kitchen'&&<GameDialog fullScreen title="Kitchen" onClose={()=>setRoute(null)}><ProductionBook section={productionSection} initialSelection="rations" onSection={setProductionSection} onBack={()=>setRoute(null)}/></GameDialog>}
  {route==='rations'&&<IngredientCounter resourceId="rations" needed={Math.max(1,section==='Budget'?budget.shortage:tonight.shortage)} onClose={()=>setRoute(null)}/>}
 </main>;
}
