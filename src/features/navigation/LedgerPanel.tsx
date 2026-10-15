"use client";
import {useEffect,useMemo,useRef,useState} from 'react';
import {useNavigation} from './NavigationContext';
import {useGameContext} from '@/state/GameProvider';
import {GameDialog} from '@/features/ui/GameDialog';
import {RanchReview} from '@/features/ranch/RanchReview';
import {LEDGER_SECTIONS,getRanchLedgerBook,type LedgerSection} from '@/data/ranchLedgerBook';
import {canResolveDailyEventChoice,resolveDailyRanchEventChoice} from '@/data/ranch-day/ranchDayEvents';
import {beginRanchDay} from '@/data/ranch-day/ranchDayState';
import {markChapterOneTutorialSignal} from '@/data/chapterOneGuidedTutorial';
import {gameplayArt} from '@/data/creatureGameplayArt';
import s from './LedgerPanel.module.css';
export function LedgerPanel(){
 const game=useGameContext(),nav=useNavigation(),save=game.currentSave;
 const [section,setSection]=useState<LedgerSection>(()=>LEDGER_SECTIONS.includes(nav.ledgerReturn?.tab as LedgerSection)?nav.ledgerReturn!.tab as LedgerSection:save?.ranchDay?.phase==='morning'?'Brief':'Priorities');
 const [restoredKey,setRestoredKey]=useState(nav.ledgerReturn?.entryKey??null);
 const [page,setPage]=useState(nav.ledgerReturn?.entry??0),[small,setSmall]=useState(false),[review,setReview]=useState<string|null>(null),[message,setMessage]=useState('');
 const latest=useRef(save),busy=useRef(false);useEffect(()=>{latest.current=save;},[save]);
 const book=useMemo(()=>save?getRanchLedgerBook(save):null,[save]);
 if(!save||!book)return null;
 const entries=book[section],matched=entries.findIndex(e=>e.key===restoredKey),index=matched>=0?matched:Math.min(page,Math.max(0,entries.length-1)),entry=entries[index],event=save.ranchDay?.event;
 const choice=entry?.choiceId?canResolveDailyEventChoice(save,entry.choiceId):null;
 const creature=save.creatures?.find(c=>c.creatureId===entry?.creatureId)??save.creatures?.[0];
 const close=()=>{nav.setLedgerReturn(null);nav.open(null);};
 const chooseSection=(next:LedgerSection)=>{setSection(next);setRestoredKey(null);setPage(0);setMessage('');};
 const visit=(destination=entry?.destination)=>{if(!destination||!entry)return;nav.setLedgerReturn({screen:game.appScreen,tab:section,entry:index,entryKey:entry.key});nav.open(null);({nursery:game.goToNursery,chores:game.goToRanchJobs,supplies:game.goToSupplyDepot,office:game.goToRanchOffice,training:game.goToTrainingGrounds,collection:game.goToCollection})[destination]();};
 const begin=()=>{game.saveCurrentGame(markChapterOneTutorialSignal(beginRanchDay(save),save.dayState.dayNumber>1?'day-two-brief-opened':'morning-opened'));close();};
 const confirm=()=>{if(!review||!latest.current||busy.current)return;busy.current=true;try{const result=resolveDailyRanchEventChoice(latest.current,review);if(result.ok){latest.current=game.saveCurrentGame(result.save);}setMessage(result.message);setReview(null);}finally{busy.current=false;}};
 return <><GameDialog fullScreen title="Ranch ledger & morning brief" onClose={close}><main className={`${s.ledger} ${small?s.compact:''}`} data-ledger-book>
 <header><button aria-label="Close ranch ledger" onClick={close}>‹ Ranch</button><h1>Day {save.dayState.dayNumber} · Ranch ledger</h1><button aria-expanded={!small} onClick={()=>setSmall(v=>!v)}>{small?'Expand art':'Minimize art'}</button></header>
 <section className={s.workspace}><aside className={s.art}>{creature&&<img src={gameplayArt(creature)} alt={`${creature.nickname}, ranch resident`}/>}<p>{save.ranchDay?.phase==='morning'?'A new morning at the ranch':'Your ranch, at a glance'}</p></aside><article className={s.paper}>
 <nav aria-label="Ranch ledger sections">{LEDGER_SECTIONS.map(t=><button key={t} onClick={()=>chooseSection(t)} aria-pressed={section===t}>{t}</button>)}</nav>
 <h2>{section==='Brief'?'Morning brief':section==='Event'?event?.title??'Daily event':section}</h2>
 {entries.length>0?<><label>{section==='Event'&&!event?.resultText?'Available choices':'Quick select'}<select aria-label="Ledger entry" value={index} onChange={e=>{setRestoredKey(null);setPage(Number(e.target.value));setMessage('');}}>{entries.map((e,i)=><option key={e.key} value={i}>{i+1}. {e.title}</option>)}</select></label><div className={s.entry} data-attention={entry.attention}><h3>{entry.title}</h3>{section==='Event'&&!event?.resultText&&<p>{event?.description}</p>}<p>{entry.detail}</p>{entry.note&&(!choice||choice.ok)&&<p className={s.note}>{entry.note}</p>}{choice&&!choice.ok&&<p className={s.warning}>{choice.reason}</p>}</div></>:<p>{section==='Brief'?'The first morning has no previous-day report. Check Priorities and choose how to begin.':section==='Records'?'No major actions recorded today.':section==='Moods'?'No resident creatures to review.':section==='Goals'?'No daily goals are recorded for this day.':'No daily event to review.'}</p>}
 {message&&message!==entry?.detail&&<p className={s.receipt} role="status">{message}</p>}
 <div className={s.links}>{entry?.destination&&<button onClick={()=>visit()}>{entry.action} ›</button>}{section==='Priorities'&&entry?.key==='feed'&&<button onClick={()=>visit('supplies')}>Pella · Rations</button>}{entry?.choiceId&&!event?.resultText&&<button disabled={!choice?.ok} onClick={()=>setReview(entry.choiceId!)}>Review choice</button>}{section!=='Priorities'&&<button onClick={()=>chooseSection('Priorities')}>Care & source links</button>}</div>
 <div className={s.pager}><button disabled={index===0} onClick={()=>{setRestoredKey(null);setPage(index-1);setMessage('');}}>‹ Previous</button><span>{entries.length?index+1:0} / {entries.length}</span><button disabled={index>=entries.length-1} onClick={()=>{setRestoredKey(null);setPage(index+1);setMessage('');}}>Next ›</button></div>
 <footer>{save.ranchDay?.phase==='morning'?<button data-tutorial-id="ranch-begin-day" onClick={begin}>Begin Ranch Day</button>:<button data-tutorial-id="ranch-review-day" onClick={()=>{nav.setLedgerReturn(null);nav.open('end-day');}}>Review & End Day</button>}<small>{save.ranchDay?.goals.filter(g=>g.complete).length??0} / {save.ranchDay?.goals.length??0} daily goals complete</small></footer>
 </article></section></main></GameDialog>
 {review&&<RanchReview title="Review daily event choice" art="/images/ui/ranch-v3/house.webp" onClose={()=>setReview(null)} pages={[{title:event?.choices.find(c=>c.choiceId===review)?.label??'Choice',content:<><p>{event?.choices.find(c=>c.choiceId===review)?.description}</p><p>{event?.choices.find(c=>c.choiceId===review)?.requirementLabel??'No item or Gold requirement.'}</p><p>This resolves today’s event once. Reserved supplies stay protected.</p></>}]} actions={<><button onClick={()=>setReview(null)}>Cancel</button><button disabled={!canResolveDailyEventChoice(save,review).ok} onClick={confirm}>Confirm choice</button></>}/>}
 </>;
}
