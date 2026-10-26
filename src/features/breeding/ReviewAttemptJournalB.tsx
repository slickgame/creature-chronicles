"use client";

import {useEffect,useRef,useState} from 'react';
import type {BreedingParticipant,BreedingPreview} from '@/types/breeding';
import {GameDialog} from '@/features/ui/GameDialog';
import {DetailButton} from '@/features/ui/DetailButton';
import {JournalParent,JournalResourceTable,JournalRecord} from './ChanceJournalB';
import j from './ChanceJournalB.module.css';
import s from './ReviewAttemptJournalB.module.css';

export type ReviewResourceWarning={participantName:string;resource:'Hearts'|'Energy';before:number;cost:number;after:number;consequence:string};
export type ReviewAttemptProps={giver:BreedingParticipant;receiver:BreedingParticipant;preview:BreedingPreview;onClose:()=>void;onConfirm:()=>void;stale:boolean;disabled:boolean;warnings:ReviewResourceWarning[]};
function warningSummary(w:ReviewResourceWarning){
 const half=`This attempt will spend at least half of ${w.participantName}'s current Energy.`;
 return w.consequence===half?`${w.participantName} spends at least half their current Energy.`:w.consequence;
}
export function ReviewAttemptJournalB({giver,receiver,preview,onClose,onConfirm,stale,disabled,warnings}:ReviewAttemptProps){
 const[short,setShort]=useState(false),[capacity,setCapacity]=useState(4),[page,setPage]=useState(0),[help,setHelp]=useState(false),[armed,setArmed]=useState(false);
 const clicked=useRef(false);
 useEffect(()=>{const update=()=>{setShort(innerHeight<700);setCapacity(innerHeight<700?2:4)};const id=requestAnimationFrame(update);const timer=setTimeout(()=>setArmed(true),250);addEventListener('resize',update);return()=>{cancelAnimationFrame(id);clearTimeout(timer);removeEventListener('resize',update)}},[]);
 const restriction=preview.pregnancyBlockedReason??preview.blockedReason;
 const compact=short||!!restriction||stale||disabled||warnings.length>2;
 const warningCapacity=short&&(stale||restriction||disabled)?1:capacity;
 const pageCount=Math.max(1,Math.ceil(warnings.length/warningCapacity)),safePage=Math.min(page,pageCount-1);
 const kind=warnings.length&&warnings.every(w=>w.resource==='Energy')?'Energy warning':warnings.length&&warnings.every(w=>w.resource==='Hearts')?'Hearts warning':'Resource warnings';
 const confirmDisabled=disabled||stale||!preview.canAttempt||!armed;
 function confirm(){if(confirmDisabled||clicked.current)return;clicked.current=true;onConfirm()}
 return <GameDialog title="Review Attempt" fullScreen onClose={onClose}><main className={`${j.shell} ${s.review}`} data-breeding-book="attempt-review" data-compact={compact}><article className={`${j.book} ${s.book}`}>
 <header className={`${j.header} ${s.header}`}><button onClick={onClose}>← Back to pair</button><span aria-hidden="true">⟶</span><h1>Review Attempt</h1></header>
 <div className={s.body}>
 {!compact?<section className={`${j.scene} ${s.scene}`} aria-label="Selected parents"><JournalParent parent={giver} role="Giver" returnTo="Review Attempt"/><JournalParent parent={receiver} role="Receiver" returnTo="Review Attempt"/></section>:<p className={s.pairNames}>{giver.displayName} · Giver <span>×</span> {receiver.displayName} · Receiver</p>}
 <section className={`${j.chance} ${s.chance}`} aria-label="Pregnancy chance"><h2>Pregnancy chance</h2><strong>{preview.pregnancyChance}%</strong><p>Pregnancy is not guaranteed.</p></section>
 <section className={s.costs}><h2>After attempt</h2><JournalResourceTable {...{giver,receiver,preview}}/><p className={s.costEach}>Cost each: <strong>{preview.energyCost} Energy · {preview.heartCost} Heart{preview.heartCost===1?'':'s'}</strong></p></section>
 {warnings.length>0?<section className={s.warnings} aria-label="Resource warnings"><img src="/images/ui/review-attempt-journal-b/warning.svg" alt=""/><div><h2>{kind}</h2><ul>{warnings.slice(safePage*warningCapacity,(safePage+1)*warningCapacity).map((w,i)=><li key={`${w.participantName}-${w.resource}-${i}`}>{warningSummary(w)}</li>)}</ul>{pageCount>1&&<nav aria-label="Warning groups"><button disabled={!safePage} onClick={()=>setPage(safePage-1)}>‹ Previous</button><span>{safePage+1} / {pageCount} · {warnings.length} warnings</span><button disabled={safePage+1===pageCount} onClick={()=>setPage(safePage+1)}>Next ›</button></nav>}</div></section>:<section className={s.clear}><img src="/images/ui/chance-journal-b/ready.svg" alt=""/><div><h2>No resource warnings</h2><p>The current preview has no low-resource warnings.</p></div></section>}
 {(restriction||stale||disabled)&&<section className={s.restriction} aria-label="Confirmation status">{stale?<p>The pair or costs changed. Close this review and review again.</p>:restriction?<p>{restriction}</p>:<p>An action is in progress. Confirmation is unavailable.</p>}</section>}
 <div className={s.before}><p>Confirm rechecks this pair and its resources.</p><DetailButton className={j.help} tooltipClassName={j.tooltip} hint="Cancel spends nothing. Confirm rechecks this pair and its resources. Resource warnings require an extra confirmation." onClick={()=>setHelp(true)}>Before confirming <span aria-hidden="true">i</span></DetailButton></div>
 </div>
 <footer className={s.footer}><div><button onClick={onClose}>Cancel</button><button data-primary disabled={confirmDisabled} onClick={confirm}>Confirm attempt</button></div><small>Cancel spends nothing.{warnings.length?' Resource warnings need an extra confirmation.':''}</small></footer>
 </article></main>{help&&<JournalRecord title="Before confirming" returnTo="Review Attempt" onClose={()=>setHelp(false)}><p>Cancel changes nothing. Confirm rechecks this pair and its resources before the existing warning and attempt flow.</p><JournalResourceTable {...{giver,receiver,preview}}/><p>Cost each: {preview.energyCost} Energy · {preview.heartCost} Hearts. Pregnancy chance: {preview.pregnancyChance}%.</p><p>Pregnancy and inheritance use separate checks. Pregnancy is not guaranteed.</p>{warnings.map((w,i)=><section key={i}><h3>{w.participantName} · {w.resource}</h3><p>{w.before} → {w.after}. Cost: {w.cost}.</p><p>{w.consequence}</p></section>)}{restriction&&<p>{restriction}</p>}{stale&&<p>The pair or costs changed. Close this review and review again.</p>}</JournalRecord>}</GameDialog>;
}
