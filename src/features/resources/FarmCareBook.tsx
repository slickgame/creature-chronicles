"use client";

import { useMemo, useRef, useState } from 'react';
import { useGameContext } from '@/state/GameProvider';
import { GameDialog } from '@/features/ui/GameDialog';
import { IngredientCounter } from '@/features/builder/IngredientCounter';
import { ResourceShelf } from './ResourceShelf';
import { ProductionBook } from './ProductionBook';
import { FeedingStation } from './FeedingStation';
import { getFoodBudget } from '@/data/economyBudget';
import { getNightCareReview } from '@/data/nightCareReview';
import { getFarmSecurity } from '@/data/farmSecurity';
import { getPredatorThreatAssessment } from '@/data/predatorThreat';
import { getDailyFeedCost } from '@/data/ranchJobsPredator';
import { isCreatureAwayForTraining } from '@/data/trainingGrounds';
import { getVariantDefinition } from '@/data/creatures';
import { getResourceArt } from '@/data/resourceArt';
import { getFarmState, foodChoices, creatureDiet, AUTOMATIC_FOODS, setAutomaticFood, RESOURCES, RESOURCE_IDS, canSpend, resourceList, setIngredientFeeding, type FarmResult } from '@/data/farmResources';
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
 const [draftRaw,setDraftRaw]=useState(false),[draftExcluded,setDraftExcluded]=useState<string[]>([]);
 const policySnapshot=useRef('');
 const tonight=useMemo(()=>save?getNightCareReview(save):null,[save]);
 if(!save||!tonight)return null;
 const farm=getFarmState(save),budget=getFoodBudget(save),security=getFarmSecurity(save),threat=getPredatorThreatAssessment(save);
 const creatures=save.creatures??[];
 const count=section==='Feeding'?1+creatures.length:section==='Budget'?7:2;
 const current=Math.min(page,count-1),creature=section==='Feeding'&&current>0?creatures[current-1]:null;
 const away=creature?isCreatureAwayForTraining(save,creature.creatureId):false;
 const meal=creature?tonight.creatures.find(row=>row.before.creatureId===creature.creatureId)?.meal:undefined;
 const food=AUTOMATIC_FOODS[Math.min(AUTOMATIC_FOODS.length-1,Math.max(0,detail-1))];
 const foodName=food==='legacy_feed'?'Older Feed':RESOURCES[food].name;
 const kits=Math.max(0,Math.floor(Number(save.flags.ranchRepairKits)||0));
 const repairCost=kits?'1 Repair Kit':resourceList(RANCH_REPAIR_RESOURCES);
 const repairable=security.condition<100&&(kits>0||canSpend(farm,RANCH_REPAIR_RESOURCES));
 const afterCondition=Math.min(100,security.condition+RANCH_REPAIR_DAMAGE_AMOUNT);
 const afterSecurity=Math.floor(security.maximum*afterCondition/100)+(security.guard?.bonus??0);
 const title=section==='Feeding'?(creature?creature.nickname:'Tonight’s feeding'):section==='Budget'?`Night ${current+1} of 7`:current===0?'Fortifications':'Guard Dog';
 const art=creature?getVariantDefinition(creature.variantId).profilePath:section==='Security'?'/images/ui/atelier-v1/patrol.webp':getResourceArt('rations')!;
 const rules=section==='Security'?[...threat.blockers,...threat.reasons,...security.candidates.map((c,i)=>`${c.name}: Grade ${c.grade}, +${c.bonus} Security. ${i===0?'Active strongest bonus.':'Not added; strongest bonus only.'}`),'Only the strongest resident canine Guard Dog contributes. Working or resting does not disable it; away trainees do not contribute.','Fortification protection scales with current condition. Repairs use a Repair Kit first; otherwise they consume 2 unreserved Wood + 1 Stone. No Gold or Energy upkeep.']:['The Feeding Station manages shared inventory; no food transfer is needed. When raw ingredients are enabled, restricted diets eat first and omnivores follow. Balanced rations and older Feed cover remaining needs.','Each ration or compatible ingredient covers one food unit. Food permissions affect only automatic feeding. Reserves also protect supplies from recipes, construction and sales. Prepared bonus meals are served manually.','Away trainees eat with Rhea. Only underfed creatures receive hunger recovery and affection penalties. Ranch condition and talents still apply; player recovery retains the ranch-wide food rule.','The seven-night forecast repeats today’s resident needs against current stock. It assumes no gathering, rewards, births, arrivals, training returns or other spending. Top-up requires Balanced rations to be allowed; Trade prices are estimates.'];
 function show(next:typeof popup){busy.current=false;setDetail(0);if(next==='feeding'){setDraftRaw(!!farm.ingredientFeeding);setDraftExcluded(farm.excludedFoods??[]);policySnapshot.current=JSON.stringify(save);}setPopup(next);}
 function confirmPolicy(){if(!save)return;if(policySnapshot.current!==JSON.stringify(save)){setMessage('Your ranch changed. Review feeding permissions again.');setPopup('receipt');return;}apply(current=>{let result=setIngredientFeeding(current,draftRaw);for(const id of AUTOMATIC_FOODS)result=setAutomaticFood(result.save,id,!draftExcluded.includes(id));return {...result,message:'Feeding permissions saved. Food stays in shared inventory until sleep.'};});}
 function apply(action:(save:GameSave)=>FarmResult){if(!save||busy.current)return;busy.current=true;const result=action(save);let text=result.message;if(result.ok){const persisted=saveCurrentGame(result.save),g=persisted.currencies.gold-result.save.currencies.gold,gp=persisted.currencies.guildPoints-result.save.currencies.guildPoints;const a=getFarmState(persisted).stock,b=getFarmState(result.save).stock;const bonus=Object.fromEntries(RESOURCE_IDS.map(id=>[id,(a[id]??0)-(b[id]??0)]).filter(([,n])=>Number(n)>0));const reward=[g?`${g} Gold`:'',gp?`${gp} GP`:'',resourceList(bonus)].filter(Boolean);if(reward.length)text+=` Goal rewards: ${reward.join(' + ')}.`;}setMessage(text);setPopup('receipt');}
 const legacy = <main className={s.screen} data-farm-care-book>
  <header><button onClick={onBack}>‹ Resources</button><h1>{section==='Budget'?'Food planning':section==='Feeding'?'Feeding Station':section}</h1><select aria-label="Care section" value={section} onChange={e=>{setSection(e.target.value as Section);setPage(0);}}><option>Feeding</option><option>Security</option><option>Budget</option></select></header>
  <section className={s.sheet}>
   <div className={s.pager}><button disabled={current===0} onClick={()=>setPage(current-1)}>Previous page</button><span>{current+1} / {count}</span><button disabled={current+1===count} onClick={()=>setPage(current+1)}>Next page</button></div>
   <div className={s.body}><img src={art} alt={creature?creature.nickname:''}/><div><small>DAY {save.dayState.dayNumber} · {title}</small><h2>{title}</h2>
    {section==='Feeding'?(creature?<><p className={s.metric}>{away?'Away at training':`${meal?.covered??0} / ${meal?.required??getDailyFeedCost(creature)} food units planned`}</p><p>{creatureDiet(creature)} · {foodChoices(creature).map(id=>RESOURCES[id].name).join(', ')}</p><p>{away?'Eats with Rhea; excluded from ranch feeding.':`Planned meal: ${[meal&&resourceList(meal.used),meal?.legacyUsed?`${meal.legacyUsed} older Feed`:''].filter(Boolean).join(' + ')||'No food allocated'}.`}</p>{!away&&<p>{meal&&meal.covered>=meal.required?'Fully fed':`Short by ${(meal?.required??getDailyFeedCost(creature))-(meal?.covered??0)} food units`}. Food is consumed only when you sleep.</p>}</>:<><p className={s.metric}>Creatures fed: {tonight.creaturesFed}/{tonight.creaturesEating}</p><p>{tonight.covered} / {tonight.required} food units covered</p><p>{tonight.shortage?`Short by ${tonight.shortage} food units. Check each creature’s planned meal.`:'Current supplies cover tonight.'}</p><p>Uses shared inventory automatically at sleep. No transfer needed.</p></>):section==='Budget'?<><p className={s.metric}>{budget.days[current].covered} / {budget.days[current].required} covered</p><p>Night {current+1} shortage: {budget.days[current].shortage} food units.</p><p>Seven-night total: <b>{budget.shortage} rations short · {budget.topUpGold} Gold</b> at Trade prices.</p><p>{budget.topUpAllowed?`Gold after full top-up: ${save.currencies.gold-budget.topUpGold>=0?save.currencies.gold-budget.topUpGold:`short by ${budget.topUpGold-save.currencies.gold}`}.`:'Allow Balanced rations before using this top-up estimate.'}</p><p className={s.note}>Current stock only; forecast assumptions in Details.</p></>:current===0?<><p className={s.metric}>{security.total} Security</p><p>Condition <b>{security.condition}%</b> · Fortifications {security.fortifications} / {security.maximum}</p><p>Guard Dog +{security.guard?.bonus??0} · Predator incident chance {threat.eventChance}%</p><p>{security.condition===100?'No repairs needed.':`Repair: ${repairCost}. Restores up to ${RANCH_REPAIR_DAMAGE_AMOUNT} condition.`}</p>{!repairable&&security.condition<100&&<p>Need a Repair Kit or unreserved repair materials.</p>}</>:<><p className={s.metric}>{security.guard?`${security.guard.name} · +${security.guard.bonus}`:'No eligible Guard Dog'}</p><p>{security.guard?`Grade ${security.guard.grade} · strongest resident bonus active.`:'Fortifications still protect the farm.'}</p><p>{security.candidates.length} eligible candidate{security.candidates.length===1?'':'s'}. Bonuses never stack.</p><p>Working and resting keep the bonus active. Away trainees do not contribute.</p></>}
   </div></div>
   <footer><button onClick={()=>show('rules')}>Details</button><button onClick={()=>setRoute('storage')}>Storage & reserves</button>{section==='Security'?<><button disabled={!repairable} onClick={()=>show('repair')}>Review repair</button><button onClick={()=>{onBack();goToTown();}}>Visit Town</button></>:<><button onClick={()=>{setProductionSection('Kitchen');setRoute('kitchen');}}>Cook rations</button><button onClick={()=>setRoute('rations')}>Buy rations</button>{section==='Feeding'&&<button onClick={()=>show('feeding')}>Feeding setting</button>}</>}</footer>
  </section>
  {popup&&<GameDialog title={popup==='repair'?'Confirm repairs':popup==='feeding'?'Feeding permissions':popup==='receipt'?'Farm receipt':'Farm details'} onClose={()=>setPopup(null)}><div className={s.popup}>
   {popup==='rules'?<><p>{rules[detail]}</p><div className={s.pager}><button disabled={detail===0} onClick={()=>setDetail(detail-1)}>Previous detail</button><span>{detail+1} / {rules.length}</span><button disabled={detail===rules.length-1} onClick={()=>setDetail(detail+1)}>Next detail</button></div></>:popup==='repair'?<><p>Use <b>{repairCost}</b>. No Gold or Energy charge.</p><p>Condition {security.condition}% → {afterCondition}%. Security {security.total} → {afterSecurity}.</p><p>{kits?`${kits} Repair Kits owned; kits are used before materials.`:`Wood: ${farm.stock.wood??0} owned / ${farm.reserves.wood??0} reserved. Stone: ${farm.stock.stone??0} owned / ${farm.reserves.stone??0} reserved.`}</p><div className={s.pager}><button onClick={()=>setPopup(null)}>Cancel repair</button><button disabled={!repairable} onClick={()=>apply(repairRanchDamage)}>Confirm repair</button></div></>:popup==='feeding'?<><label>Feeding permission<select aria-label="Feeding permission" value={detail} onChange={e=>setDetail(Number(e.target.value))}><option value={0}>Raw ingredient feeding</option>{AUTOMATIC_FOODS.map((id,i)=><option key={id} value={i+1}>{id==='legacy_feed'?'Older Feed':RESOURCES[id].name}</option>)}</select></label><p><label><input type="checkbox" checked={detail===0?draftRaw:!draftExcluded.includes(food)} onChange={e=>detail===0?setDraftRaw(e.target.checked):setDraftExcluded(list=>e.target.checked?list.filter(id=>id!==food):[...list,food])}/>{detail===0?' Allow diet-compatible raw ingredients':` Allow ${foodName}`}</label></p><p>{detail===0?'Raw foods are saved for recipes unless enabled.':'Excluding a food protects it from automatic feeding only.'} Reserves stay protected. No food is consumed until sleep.</p>{detail>0&&food!=='rations'&&food!=='legacy_feed'&&!draftRaw&&<p>Enable raw ingredient feeding to use this food.</p>}<div className={s.pager}><button onClick={()=>setPopup(null)}>Cancel setting</button><button onClick={confirmPolicy}>Confirm setting</button></div></>:<><p role="status">{message}</p><button onClick={()=>setPopup(null)}>Return to page</button></>}
  </div></GameDialog>}
  {route==='storage'&&<GameDialog fullScreen title="Supplies and reserves" onClose={()=>setRoute(null)}><ResourceShelf initialMode="Storage" onBack={()=>setRoute(null)}/></GameDialog>}
  {route==='kitchen'&&<GameDialog fullScreen title="Kitchen" onClose={()=>setRoute(null)}><ProductionBook section={productionSection} initialSelection="rations" onSection={setProductionSection} onBack={()=>setRoute(null)}/></GameDialog>}
  {route==='rations'&&<IngredientCounter resourceId="rations" needed={Math.max(1,section==='Budget'?budget.shortage:tonight.shortage)} onClose={()=>setRoute(null)}/>}
 </main>;
 return section==='Feeding'?<FeedingStation key={save.saveId} onBack={onBack} onSection={setSection}/>:legacy;
}
