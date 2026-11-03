"use client";

import {useEffect,useState,type ReactNode} from 'react';
import type {BreedingAttemptRecord,BreedingProgressionEvent} from '@/types/breeding';
import {GameDialog} from '@/features/ui/GameDialog';
import {DetailButton} from '@/features/ui/DetailButton';
import s from './CompleteRecordLedgerC.module.css';

type Hearts={giver:{before:number;after:number};receiver:{before:number;after:number}};
type Tab='Summary'|'Costs & Growth'|'Next Actions';
type Props={result:BreedingAttemptRecord;hearts?:Hearts|null;onClose:()=>void;returnLabel?:string;actions:ReactNode;initialTab?:string;onTabChange?:(tab:Tab)=>void};
const STAT_NAMES:Record<string,string>={STR:'Strength',DEX:'Dexterity',STA:'Stamina',CHA:'Charm',WIL:'Willpower',FER:'Fertility'};
const kit='/images/ui/complete-record-ledger-c/';
const normalizeTab=(tab?:string):Tab=>tab?.toLowerCase()==='costs & growth'?'Costs & Growth':tab&&tab!=='Summary'?'Next Actions':'Summary';

export function RecordDetailsC({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
 return <GameDialog title={title} fullScreen onClose={onClose}><main className={s.shell}><article className={s.popup}><header><button onClick={onClose}>‹ Back to record</button><h2>{title}</h2></header><div className={s.popupBody}>{children}</div></article></main></GameDialog>;
}

export function CompleteRecordLedgerC({result:a,hearts,onClose,returnLabel='Back to result',actions,initialTab,onTabChange}:Props){
 const [tab,setTab]=useState<Tab>(normalizeTab(initialTab));
 const [page,setPage]=useState(0),[short,setShort]=useState(false);
 const [detail,setDetail]=useState<{title:string;content:ReactNode}|null>(null);
 const longNames=a.giverName.length+a.receiverName.length>48;
 useEffect(()=>{const query=matchMedia('(max-height:650px)'),phone=matchMedia('(max-width:700px)');const update=()=>setShort(query.matches||(phone.matches&&longNames));const frame=requestAnimationFrame(update);query.addEventListener('change',update);phone.addEventListener('change',update);return()=>{cancelAnimationFrame(frame);query.removeEventListener('change',update);phone.removeEventListener('change',update)}},[longNames]);
 const events=a.progressionEvents??[];
 const noteworthy=events.filter(e=>e.levelUps>0||Object.values(e.statGrowth).some(n=>n!==0)||Object.keys(e.gradeChanges??{}).length>0||e.abilityTriggers.length>0);
 const overviewPages=short?2:1;
 const pages=overviewPages+noteworthy.length;
 const current=Math.min(page,pages-1);
 const growth=current>=overviewPages?noteworthy[current-overviewPages]:null;
 const outcome=a.pregnancyBlockedReason?'Pregnancy blocked':a.outcome==='pregnancy'?'Pregnancy recorded':'No pregnancy';
 const rows=[{id:a.giverId,name:a.giverName,before:a.giverEnergyBefore,after:a.giverEnergyAfter,heart:hearts?.giver},{id:a.receiverId,name:a.receiverName,before:a.receiverEnergyBefore,after:a.receiverEnergyAfter,heart:hearts?.receiver}];
 const showDetail=(title:string,content:ReactNode)=>setDetail({title,content});
 function help(label:string,text:string){return <DetailButton tooltipClassName={s.tooltip} className={s.info} hint={text} aria-label={`${label} help`} onClick={()=>showDetail(label,<p>{text}</p>)}>i</DetailButton>;}
 const identity=<div className={s.identity}><h2>{a.giverName} × {a.receiverName}</h2><p>Day {a.dayNumber} · {outcome}</p></div>;
 const resourceTable=<section className={s.costs} aria-label="Recorded resource changes"><table><colgroup><col/><col/><col/><col/></colgroup><thead><tr><th>Parent</th><th>Energy {help('Energy','These are the Energy values recorded immediately before and after this attempt.')}</th><th>Hearts {help('Hearts',hearts?'Recorded Hearts immediately before and after this attempt.':'Historical Hearts before/after was not saved. The exact recorded Heart cost per parent is shown instead.')}</th><th>XP {help('XP','Saved XP awarded to each participant. Player progression uses the recorded Breeder XP award. A dash means no progression event was recorded.')}</th></tr></thead><tbody>{rows.map(r=>{const event=events.find(e=>e.participantId===r.id);return <tr key={r.id}><th scope="row">{r.name}</th><td>{r.before} → {r.after}</td><td>{r.heart?`${r.heart.before} → ${r.heart.after}`:`−${a.heartCost}`}</td><td>{event?`+${event.kind==='player'?a.breederXpGain:a.xpGain}`:'—'}</td></tr>})}</tbody></table></section>;
 function growthCard(id:string,name:string){const e=events.find(value=>value.participantId===id);return <section className={s.growthCard} key={id}><h3>{name} {e&&<span>· Level {e.levelBefore} → {e.levelAfter}</span>}{help(`${name} growth`,'This card shows the saved XP and level transition. Extra growth pages appear only when a level, stat, grade or talent event was recorded.')}</h3>{e?<><p>XP {e.xpBefore} / {e.xpToNextBefore} → {e.xpAfter} / {e.xpToNextAfter}</p><progress aria-label={`${name} recorded XP`} max={Math.max(1,e.xpToNextAfter)} value={Math.min(Math.max(0,e.xpAfter),Math.max(1,e.xpToNextAfter))}/></>:<p>No progression event recorded.</p>}</section>;}
 const growthCards=<div className={s.growthCards}>{rows.map(r=>growthCard(r.id,r.name))}</div>;
 const familiarity=<div className={s.familiarity}><span>Familiarity {help('Familiarity','The saved pair familiarity before and after this attempt. Later sessions do not rewrite this record.')}<b>{a.streakBefore} → {a.streakAfter}</b></span><span>Breeder XP {help('Breeder XP','The player Breeder XP award saved with this attempt.')}<b>+{a.breederXpGain}</b></span></div>;
 const notice=events.length===0?'No progression events recorded.':events.some(e=>e.levelUps>0)?`${events.reduce((n,e)=>n+e.levelUps,0)} level${events.reduce((n,e)=>n+e.levelUps,0)===1?'':'s'} gained in this attempt.`:'No level gained in this attempt.';
 function statRecord(e:BreedingProgressionEvent){const stats=Object.entries(e.statGrowth);const grades=Object.entries(e.gradeChanges??{});return <><div className={s.statTitle}><div className={s.statHeading}><h3>{short?'Recorded growth':`${e.displayName} · Recorded growth`}</h3>{e.abilityTriggers.length>0&&<button onClick={()=>showDetail(`${e.displayName} · Saved talent notes`,<>{e.abilityTriggers.map((text,i)=><p key={i}>{text}</p>)}</>)}>Saved talent notes ({e.abilityTriggers.length})</button>}</div><p>Level {e.levelBefore} → {e.levelAfter} · {e.levelUps} gained</p></div><table className={s.statTable}><thead><tr><th>Stat</th><th>Increase</th><th>Grade change</th></tr></thead><tbody>{stats.map(([key,n])=><tr key={key}><th>{STAT_NAMES[key]??key}</th><td>{Number(n)<0?'':'+'}{n}</td><td>{e.gradeChanges?.[key as keyof typeof e.statGrowth]??'Unchanged'}</td></tr>)}{!stats.length&&<tr><td colSpan={3}>No numeric stat increases recorded.</td></tr>}</tbody></table>{grades.filter(([key])=>!(key in e.statGrowth)).map(([key,value])=><p key={key}>{STAT_NAMES[key]??key} grade: {value}</p>)}</>;}
 const switchTab=(next:Tab)=>{setTab(next);onTabChange?.(next)};
 return <><GameDialog title="Complete record" fullScreen onClose={onClose}><main className={s.shell} data-complete-record-c data-tab={tab} data-growth-page={current} data-short={short} data-detail={Boolean(growth)} data-long={a.giverName.length+a.receiverName.length>48}><article className={s.book}>
  <header className={s.header}><button onClick={onClose}>‹ {returnLabel}</button><h1><img src={`${kit}sprig.svg`} alt=""/>Complete record<img src={`${kit}sprig.svg`} alt=""/></h1></header>
  <nav className={s.tabs} aria-label="Complete record sections">{(['Summary','Costs & Growth','Next Actions'] as Tab[]).map(value=><button key={value} aria-pressed={value===tab} onClick={()=>switchTab(value)}>{value}</button>)}</nav>
  <div className={s.spread}>
   {tab==='Costs & Growth'?(growth?<><section className={s.left}>{identity}{statRecord(growth)}</section><section className={s.right}>{growthCard(growth.participantId,growth.displayName)}{familiarity}<p className={s.notice}>Saved increases from this attempt.</p></section></>:<><section className={`${s.left} ${short&&current===1?s.hidden:''}`}>{identity}{resourceTable}<img className={s.botanical} src={`${kit}sprig.svg`} alt=""/></section><section className={`${s.right} ${short&&current===0?s.hidden:''}`}>{growthCards}{familiarity}<p className={s.notice}>{notice}</p></section></>):tab==='Summary'?<><section className={s.left}>{identity}<div className={s.outcome}><h3>{outcome}</h3><p>Recorded chance <strong>{a.pregnancyChance}%</strong></p>{a.pregnancyBlockedReason&&<button onClick={()=>showDetail('Recorded pregnancy blocker',<p>{a.pregnancyBlockedReason}</p>)}>Read recorded blocker</button>}</div><img className={s.botanical} src={`${kit}sprig.svg`} alt=""/></section><section className={s.right}><h3>Saved session record</h3>{a.resultText.length<=180?<p>{a.resultText}</p>:null}<button onClick={()=>showDetail('Complete saved result',<p>{a.resultText}</p>)}>Read complete result</button><button onClick={()=>showDetail('Saved session notes',<><h3>Attempt notes</h3><p>{a.processText}</p><h3>Outcome notes</h3><p>{a.outcomeFlavorText}</p>{a.pregnancyBlockedReason&&<p>{a.pregnancyBlockedReason}</p>}<p>Attempt ID: {a.attemptId}</p><p>Pregnancy record: {a.pregnancyId??'None'}</p><p>Recorded: {a.createdAt}</p></>)}>Saved session notes</button><small>Recorded {a.createdAt?new Date(a.createdAt).toLocaleDateString():'date unavailable'}</small></section></>:<><section className={s.left}>{identity}<h3>Next actions</h3><img className={s.botanical} src={`${kit}sprig.svg`} alt=""/></section><section className={s.right}><div className={s.actions}>{actions}</div></section></>}
  </div>
  {tab==='Costs & Growth'&&pages>1&&<nav className={s.pager} aria-label="Costs and growth pages"><button disabled={current===0} onClick={()=>setPage(value=>Math.max(0,value-1))}>‹ Previous</button><span aria-live="polite">{current+1} / {pages} · {growth?`${growth.displayName} growth`:short?(current===0?'Resources':'XP & familiarity'):'Overview'}</span><button disabled={current===pages-1} onClick={()=>setPage(value=>Math.min(pages-1,value+1))}>Next ›</button></nav>}
 </article></main></GameDialog>{detail&&<RecordDetailsC title={detail.title} onClose={()=>setDetail(null)}>{detail.content}</RecordDetailsC>}</>;
}
