"use client";

import {useEffect,useState} from 'react';
import type {BreedingAttemptRecord} from '@/types/breeding';
import {useGameContext} from '@/state/GameProvider';
import {useNavigation} from '@/features/navigation/NavigationContext';
import {GameDialog} from '@/features/ui/GameDialog';
import {getAttemptCareRecords} from '@/data/breedingLedgerCare';
import {SavedScenesFolioA} from './SavedScenesFolioA';
import {CompleteRecordLedgerC} from './CompleteRecordLedgerC';
import {InheritanceTargetOutcomeCard} from './InheritanceTargetOutcome';
import s from './BreedingResultJournalB.module.css';

export type ResultHeartSnapshot={giver:{before:number;after:number};receiver:{before:number;after:number}};
type Props={result:BreedingAttemptRecord;hearts:ResultHeartSnapshot|null;sceneMode:'full'|'quick';canBreedAgain:boolean;breedAgainReason:string|null;onBreedAgain:()=>void;onKeepGiverChooseReceiver:()=>void;onChangePair:()=>void;onClose:()=>void};
const asset='/images/ui/breeding-result-journal-b/';
function Icon({name}:{name:string}){return <img className={s.icon} src={`${asset}${name}.svg`} alt=""/>;}
export function BreedingResultJournalB({result:a,hearts,sceneMode,canBreedAgain,breedAgainReason,onBreedAgain,onKeepGiverChooseReceiver,onChangePair,onClose}:Props){
 const game=useGameContext(),nav=useNavigation(),save=game.currentSave;
 const targetOutcome=a.inheritanceTargetOutcome;
 const [short,setShort]=useState(false),[focus,setFocus]=useState('Result'),[record,setRecord]=useState(Boolean(nav.breedingResultReturn?.recordOpen&&nav.breedingResultReturn.attemptId===a.attemptId)),[scenes,setScenes]=useState(false);
 useEffect(()=>{const update=()=>setShort(innerHeight<(targetOutcome?760:650));const frame=requestAnimationFrame(update);addEventListener('resize',update);return()=>{cancelAnimationFrame(frame);removeEventListener('resize',update)}},[targetOutcome]);
 const blocked=Boolean(a.pregnancyBlockedReason),success=a.outcome==='pregnancy'&&!blocked;
 const kind=blocked?'blocked':success?'success':'failed';
 const outcome=blocked?'Pregnancy blocked':success?'Pregnancy recorded':'No pregnancy';
 const focused=short||a.giverName.length+a.receiverName.length>36;
 const care=save?getAttemptCareRecords(save,a):[];
 const rows=[{id:a.giverId,name:a.giverName,before:a.giverEnergyBefore,after:a.giverEnergyAfter,heart:hearts?.giver},{id:a.receiverId,name:a.receiverName,before:a.receiverEnergyBefore,after:a.receiverEnergyAfter,heart:hearts?.receiver}];
 const xp=(id:string)=>{const event=a.progressionEvents.find(e=>e.participantId===id);return event?event.kind==='player'?a.breederXpGain:a.xpGain:null;};
 const resourceTable=<div className={s.tableFrame}><table className={s.table} aria-label="Recorded resource changes"><colgroup><col/><col/><col/><col/></colgroup><thead><tr><th>Parent</th><th>Energy</th><th>Hearts</th><th>XP</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><th scope="row">{r.name}</th><td>{r.before} → {r.after}</td><td>{r.heart?`${r.heart.before} → ${r.heart.after}`:`−${a.heartCost}`}</td><td>{xp(r.id)===null?'—':`+${xp(r.id)}`}</td></tr>)}</tbody></table></div>;
 function openLedger(){if(!save)return;nav.setBreedingLedger({saveId:save.saveId,tab:'attempts',entry:a.attemptId,query:'',outcome:'all',participant:'all',role:'either',newest:true,small:false,treeId:'',returning:false});window.dispatchEvent(new Event('creature-chronicles:open-breeding-ledger'));}
 function openNursery(){if(!save||!care[0])return;nav.setBreedingResultReturn({saveId:save.saveId,attemptId:a.attemptId,hearts,returning:true,recordOpen:record});nav.setBreedingLedger(value=>value?{...value,returning:false}:null);nav.setNurserySelection({saveId:save.saveId,tab:care[0].tab,id:care[0].id,small:false});game.goToNursery();}
 return <><GameDialog title="Attempt recorded" fullScreen onClose={onClose}><main className={s.shell} data-breeding-book="attempt-result" data-result-journal-b data-focused={focused} data-focus={focus} data-long-names={a.giverName.length+a.receiverName.length>36} data-outcome={kind}><article className={s.book}>
 <header className={s.header}><button onClick={onClose}>◀ Back to pair</button></header>
 <div className={s.title}><h1>Attempt recorded</h1><img src={`${asset}ornament.svg`} alt=""/></div>
 {focused&&<nav className={s.focusTabs} aria-label="Result sections">{['Result','Resource changes'].map(v=><button key={v} aria-pressed={v===focus} onClick={()=>setFocus(v)}>{v}</button>)}</nav>}
 {(!focused||focus==='Result')?<section className={s.outcome} aria-label="Recorded outcome"><div className={s.banner} style={{backgroundImage:`url('${asset}banner-${kind}.svg')`}}><strong>{outcome}</strong></div><img className={s.seal} src={`${asset}seal.webp`} alt=""/></section>:null}
 <section className={s.identity}>{(!focused||focus==='Result')&&<h2>{a.giverName} × {a.receiverName}</h2>}<p>{focused&&focus==='Resource changes'?`${outcome} · `:''}Day {a.dayNumber} · Chance used {a.pregnancyChance}%</p></section>
 {targetOutcome&&(!focused||focus==='Result')&&<div className={s.targetOutcome}><InheritanceTargetOutcomeCard outcome={targetOutcome}/></div>}
 {(!focused||focus==='Resource changes')?<section className={s.changes} aria-label="Saved changes">{resourceTable}<div className={s.progress}><span><Icon name="heart"/>Familiarity {a.streakBefore} → {a.streakAfter}</span><span><Icon name="star"/>Breeder XP +{a.breederXpGain}</span></div>{!hearts&&<small>Hearts shows the recorded cost; before/after was not saved.</small>}</section>:<div className={s.paidSummary}><strong>{a.energyCost} Energy · {a.heartCost} Heart{a.heartCost===1?'':'s'}</strong><span>Paid per parent · Resource changes shows the saved values.</span></div>}
 {success&&!care.length&&<p className={s.unavailable}>The linked care record is no longer available.</p>}
 <footer className={s.footer}><div className={s.actions}><button onClick={()=>setScenes(true)}><Icon name="film"/>View scenes</button><button onClick={()=>setRecord(true)}><Icon name="record"/>Complete record</button><button onClick={openLedger}><Icon name="book"/>Open Ledger</button>{success?<button data-primary disabled={!care.length} onClick={openNursery}><Icon name="nursery"/>Open Nursery</button>:<button data-primary onClick={onClose}>Back to pair</button>}</div><small>Results saved</small></footer>
 </article></main></GameDialog>
 {record&&<CompleteRecordLedgerC result={a} hearts={hearts} initialTab={nav.breedingResultReturn?.recordOpen&&nav.breedingResultReturn.attemptId===a.attemptId?'Next Actions':undefined} onClose={()=>setRecord(false)} actions={<><button disabled={!canBreedAgain} onClick={onBreedAgain}>Review another attempt</button>{!canBreedAgain&&<p>{breedAgainReason??'Review the current pair in the pen.'}</p>}<button onClick={onKeepGiverChooseReceiver}>Keep giver, choose new receiver</button><button onClick={onChangePair}>Change pair</button><button onClick={openLedger}>Open Ledger</button>{success&&<button disabled={!care.length} onClick={openNursery}>Open Nursery</button>}{success&&!care.length&&<p>The linked care record is no longer available.</p>}<button onClick={()=>setScenes(true)}>View scenes</button>{care.length>0&&<small>{care.map(c=>`${c.name} · ${c.stage}`).join(' · ')}</small>}</>}/>}
 {scenes&&<SavedScenesFolioA result={a} initialScene={sceneMode==='full'?'process':'outcome'} returnLabel={record?'Back to record':'Back to result'} onClose={()=>setScenes(false)}/>}
 </>;
}
