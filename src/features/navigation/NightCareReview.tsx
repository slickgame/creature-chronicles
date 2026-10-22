"use client";
import {useMemo,useState} from 'react';
import {useGameContext} from '@/state/GameProvider';
import {useNavigation} from './NavigationContext';
import {GameDialog} from '@/features/ui/GameDialog';
import {PagedItems} from '@/features/ui/PagedItems';
import {getNightCareReview} from '@/data/nightCareReview';
import {FarmCareBook} from '@/features/resources/FarmCareBook';
import {CycleShell,CycleIcon,CycleSummary,CycleResidents,CycleResidentDetails,CycleText,cycleStyles as s} from './DayCycleLedger';
const TABS=['Tonight','Food','Recovery','Timers'];
type Destination='food'|'supplies'|'builder'|'training'|'nursery'|'office';
export function NightCareReview({onClose,onSleep}:{onClose:()=>void;onSleep:(creatureId?:string)=>void}){
 const game=useGameContext(),nav=useNavigation(),save=game.currentSave;
 const review=useMemo(()=>save?getNightCareReview(save):null,[save]);
 const [tab,setTab]=useState(()=>TABS.includes(nav.nightReturn?.tab??'')?nav.nightReturn!.tab:'Tonight');
 const [entry,setEntry]=useState(()=>{const i=save?.creatures?.findIndex(c=>c.creatureId===nav.nightReturn?.entryKey)??-1;return i>=0?i:nav.nightReturn?.entry??0;});
 const [timerEntry,setTimerEntry]=useState(()=>Math.max(0,review?.timers.findIndex(t=>t.title===nav.nightReturn?.timerKey)??0)),[focus,setFocus]=useState<'list'|'selected'>('list');
 const [foodStation,setFoodStation]=useState(false),[notes,setNotes]=useState<string[]|null>(null);
 if(!review||!save)return null;
 const creatureIndex=Math.min(entry,Math.max(0,review.creatures.length-1)),crew=review.creatures[creatureIndex];
 const timerIndex=Math.min(timerEntry,Math.max(0,review.timers.length-1)),timer=review.timers[timerIndex];
 const ready=review.timers.filter(t=>t.ready).length;
 const warnings=[review.shortage?`Short by ${review.shortage} food units. Reduced recovery applies to creatures without enough food. Use the Feeding Station to review allocations.`:'',review.taxDue?`${review.tax} Gold tax is due tonight. You have ${review.gold} Gold. Monthly taxes are collected when you sleep; insufficient Gold can end the run.`:''].filter(Boolean);
 const care=[crew?.away?'Away with Rhea. Home recovery and feeding do not apply. Collect completed training at the Training Grounds.':'Projected with food coverage, recovery talents and ranch condition included.',review.conditionPenalty?`Ranch condition causes a ${review.conditionPenalty}% recovery penalty in this projection. Ranch repairs can improve it.`:'There is no ranch-condition recovery penalty in this projection.','This is a projection from the current ranch. Overnight events can affect the final result. The Morning Report shows the saved outcome.','Work rewards are already in storage. Food is consumed at sleep; construction, training, pregnancy and egg timers advance.'];
 const visit=(destination:Destination)=>{
  if(destination==='food'){setFoodStation(true);return;}
  nav.setNightReturn({screen:game.appScreen,tab,entry:creatureIndex,entryKey:crew?.before.creatureId,timerKey:timer?.title});nav.open(null);
  if(destination==='builder'){window.localStorage.setItem('creature-chronicles-open-builder-yard','1');game.goToTown();return;}
  ({supplies:game.goToSupplyDepot,training:game.goToTrainingGrounds,nursery:game.goToNursery,office:game.goToRanchOffice})[destination]();
 };
 const selectTab=(t:string)=>{setTab(t);setFocus('list');};
 const tabs=<nav className={s.tabs} aria-label="Night review pages">{TABS.map(t=><button key={t} aria-pressed={tab===t} onClick={()=>selectTab(t)}>{t}</button>)}</nav>;
 const summary=<CycleSummary fed={review.creaturesFed} eating={review.creaturesEating} covered={review.covered} required={review.required} energy={`${save.currencies.energy} → ${review.playerEnergy} / ${review.playerMaxEnergy}`} timers={ready} timerText={review.timers.length?`${review.timers.length-ready} still in progress`:'No active timers'} onFood={()=>selectTab('Food')} onEnergy={()=>setNotes([`Player Energy: ${save.currencies.energy} → ${review.playerEnergy} / ${review.playerMaxEnergy}. The current food projection is included.`,...care.slice(1)])} onTimers={()=>selectTab('Timers')}/>;
 return <><CycleShell title="End Ranch Day" date={`Day ${save.dayState.dayNumber} → Day ${review.nextDay}`} onClose={onClose} tabs={tabs} summary={summary}
 notice={warnings.length?<div className={s.notice}><span>{warnings.length} warning{warnings.length===1?'':'s'} before sleep{review.shortage?` · Food short by ${review.shortage}`:''}{review.taxDue?' · Tax due':''}</span><button onClick={()=>setNotes(warnings)}>Review warnings</button></div>:undefined}
 footer={<><CycleIcon name="evening"/><button data-primary data-tutorial-id="ranch-end-day" onClick={()=>onSleep(crew?.before.creatureId)}>Sleep & Advance Day</button><button aria-label="Keep playing at the ranch" onClick={onClose}>Keep Playing</button><small>Advance to Day {review.nextDay}</small></>}>
 <nav className={s.focusTabs} aria-label={tab==='Timers'?'Timer view':'Resident view'}><button aria-pressed={focus==='list'} onClick={()=>setFocus('list')}>{tab==='Timers'?'Timers':'Residents'}</button><button aria-pressed={focus==='selected'} onClick={()=>setFocus('selected')}>{tab==='Timers'?'Selected timer':'Selected creature'}</button></nav>
 <div className={s.split}>
 {tab==='Timers'?<><section className={s.timerList} data-shown={focus==='list'} aria-label="Overnight timers"><h2>Ready after sleep</h2>{review.timers.length?<PagedItems label="Care timers" rowHeight={84} initialItemIndex={timerIndex} items={review.timers.map((t,i)=><button key={t.title+i} className={s.timerRow} aria-pressed={timerIndex===i} onClick={()=>{setTimerEntry(i);setFocus('selected');}}><CycleIcon name="timer"/><span><b>{t.title}</b><small>{t.ready?'Ready by tomorrow':'Still in progress tomorrow'}</small></span></button>)}/>:<p>No construction, training or nursery timers to review.</p>}</section><section className={s.timerDetails} data-shown={focus==='selected'} aria-label="Selected overnight timer">{timer?<><h2>{timer.title}</h2><p className={timer.ready?s.good:''}>{timer.ready?'Ready by tomorrow morning':'Still in progress tomorrow'}</p><p>{timer.detail}</p><div className={s.timerActions}><button onClick={()=>setNotes([timer.detail,'Construction fees are already paid. Sleep advances the clock without charging them again.'])}>Timer details</button><button onClick={()=>visit(timer.destination)}>Open {timer.destination==='builder'?'Petra’s work orders':timer.destination==='training'?'Training Grounds':'Nursery'}</button></div></>:<><h2>No active timers</h2><p>There is nothing in these timer groups to advance.</p><div className={s.timerActions}><button onClick={()=>visit('builder')}>Visit Petra</button><button onClick={()=>visit('nursery')}>Visit Nursery</button></div></>}</section></>:<><div className={s.roster} data-shown={focus==='list'}><CycleResidents key={tab} rows={review.creatures} selectedId={crew?.before.creatureId??''} save={save} onSelect={i=>{setEntry(i);setFocus('selected');}}/></div><div className={s.roster} data-shown={focus==='selected'}><CycleResidentDetails key={tab+crew?.before.creatureId} resident={crew} save={save} mode={tab==='Food'?'Meal':'Recovery'} care={care} foodNote={`Shared inventory feeds at sleep. Reserved and excluded food stays protected. Raw ingredients: ${review.ingredientFeeding?'on':'off'}.`} onFood={()=>visit('food')}/></div></>}
 </div>
 </CycleShell>
 {notes&&<GameDialog fullScreen title="Night review details" onClose={()=>setNotes(null)}><div className={s.screen}><article className={s.window}><header className={s.header}><button onClick={()=>setNotes(null)}>Back to review</button><h1>Night review details</h1></header><CycleText label="Night review notes" paragraphs={notes}/><footer className={s.footer} data-tools><button onClick={()=>visit('food')}>Feeding Station</button><button onClick={()=>visit('office')}>Ranch repairs</button><button onClick={()=>visit('supplies')}>Pella · Rations</button>{crew?.away&&<button onClick={()=>visit('training')}>Visit Rhea</button>}</footer></article></div></GameDialog>}
 {foodStation&&<GameDialog fullScreen title="Feeding Station" onClose={()=>setFoodStation(false)}><FarmCareBook initialSection="Feeding" onBack={()=>setFoodStation(false)}/></GameDialog>}</>;
}
