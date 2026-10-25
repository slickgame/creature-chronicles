"use client";

import {useEffect,useState,type ReactNode} from 'react';
import type {BreedingParticipant,BreedingPreview} from '@/types/breeding';
import type {NurseryPage} from '@/features/nursery/NurseryBook';
import {GameDialog} from '@/features/ui/GameDialog';
import {DetailButton} from '@/features/ui/DetailButton';
import s from './ChanceJournalB.module.css';

export type ChanceJournalProps={giver:BreedingParticipant|null;receiver:BreedingParticipant|null;preview:BreedingPreview|null;onClose:()=>void;rows:[string,number][];blockedReasons:string[];status:string;message:string;pages:NurseryPage[];onReview:()=>void};
const asset='/images/ui/chance-journal-b/';
const hints:Record<string,string>={
 'Base chance':'The starting pregnancy chance supplied by the current breeding preview.',
 'Pair familiarity':'The current pair’s familiarity contribution. Attempt rewards shows the recorded streak.',
 'Affection':'The affection contribution calculated for these selected parents.',
 'Combined Fertility':'Combined permanent Fertility contributes to the current pregnancy check.',
 'Combined Charm':'Combined permanent Charm contributes to the current pregnancy check.',
 'Talents, facility & daily effects':'The combined contribution from active talents, facility and daily effects in the current preview.',
 '90% chance cap':'Pregnancy chance is capped at 90%. This adjustment removes any amount above that limit.',
};
function Icon({name}:{name:string}){return <img className={s.icon} src={`${asset}${name}.svg`} alt=""/>}
function RecordDialog({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
 return <GameDialog title={title} fullScreen onClose={onClose}><main className={s.recordShell}><article className={s.record}><header><button onClick={onClose}>← Back to Chance Details</button><h2>{title}</h2></header><div className={s.recordBody}>{children}</div></article></main></GameDialog>;
}
function Help({label,hint,children,iconOnly=false,trigger}:{label:string;hint:string;children?:ReactNode;iconOnly?:boolean;trigger?:ReactNode}){
 const[open,setOpen]=useState(false);
 return <><DetailButton className={iconOnly?s.info:trigger?s.factorHelp:s.help} tooltipClassName={s.tooltip} aria-label={label} hint={hint} onClick={()=>setOpen(true)}>{!iconOnly&&(trigger??label)}<span aria-hidden="true">i</span></DetailButton>{open&&<RecordDialog title={label} onClose={()=>setOpen(false)}>{children??<p>{hint}</p>}</RecordDialog>}</>;
}
function Parent({parent,role}:{parent:BreedingParticipant|null;role:string}){
 const[failed,setFailed]=useState(''),[open,setOpen]=useState(false);
 const source=parent?.kind==='creature'&&parent.profilePath&&failed!==parent.profilePath?parent.profilePath:null;
 return <div className={s.parent}>{source?<button className={s.art} aria-label={`View ${parent?.displayName} full profile`} onClick={()=>setOpen(true)}><img src={source} alt={`${parent?.displayName} profile`} onError={()=>setFailed(source)}/></button>:<div className={s.noArt}>{parent?.displayName??`Choose ${role.toLowerCase()}`}</div>}<div className={s.name}><strong>{parent?.displayName??`Choose ${role.toLowerCase()}`}</strong> · {role}</div>{open&&source&&<RecordDialog title={`${parent?.displayName} full profile`} onClose={()=>setOpen(false)}><div className={s.fullArt}><img src={source} alt={`${parent?.displayName} complete full-body profile`}/></div></RecordDialog>}</div>;
}
function ResourceTable({giver,receiver,preview}:{giver:BreedingParticipant|null;receiver:BreedingParticipant|null;preview:BreedingPreview|null}){
 const parents=[giver,receiver].filter((p):p is BreedingParticipant=>!!p);
 return preview&&giver&&receiver?<table className={s.costTable}><thead><tr><th>Parent</th><th>Energy</th><th>Hearts</th></tr></thead><tbody>{parents.map(p=><tr key={p.participantId}><th scope="row">{p.displayName}</th><td><Icon name="energy"/>{p.energy} → {Math.max(0,p.energy-preview.energyCost)}</td><td><Icon name="heart"/>{p.hearts} → {Math.max(0,p.hearts-preview.heartCost)}</td></tr>)}</tbody></table>:<p className={s.empty}>Choose both parents to see exact costs.</p>;
}
export function ChanceJournalB({giver,receiver,preview,onClose,rows,blockedReasons,status,message,pages,onReview}:ChanceJournalProps){
 const[small,setSmall]=useState(false),[view,setView]=useState<'Chance'|'Readiness & costs'>('Chance'),[issuePage,setIssuePage]=useState(0),[capacity,setCapacity]=useState(3);
 const stale=message.startsWith('The pair or costs changed');
 const issues=[...new Set([...blockedReasons,...(preview?.pregnancyBlockedReason?[preview.pregnancyBlockedReason]:[]),...(stale?[message]:[])])];
 const attention=issues.length>1||stale||!!preview?.pregnancyBlockedReason;
 const focused=small||attention;
 useEffect(()=>{const update=()=>{setSmall(innerHeight<800||(innerWidth<=700&&innerHeight<810));setCapacity(innerHeight<=600?2:3)};const id=requestAnimationFrame(update);addEventListener('resize',update);return()=>{cancelAnimationFrame(id);removeEventListener('resize',update)}},[]);
 useEffect(()=>{if(!attention)return;const id=requestAnimationFrame(()=>setView('Readiness & costs'));return()=>cancelAnimationFrame(id)},[attention]);
 const issuePages=Math.ceil(issues.length/capacity),safePage=Math.min(issuePage,Math.max(0,issuePages-1));
 const showChance=!focused||view==='Chance',showCosts=!focused||view==='Readiness & costs';
 const notes=pages.filter(p=>p.key==='summary'||p.key.startsWith('blocked-')||p.key.startsWith('note-'));
 const progress=pages.filter(p=>p.key==='progress');
 const factorIcon=(label:string)=>label==='Base chance'?'dice':label==='Pair familiarity'||label==='Affection'?'heart-ink':label==='Combined Fertility'?'fertility':label==='Combined Charm'?'star':label.includes('cap')?'cap':'effects';
 const okay=!!preview&&preview.canAttempt&&!preview.pregnancyBlockedReason&&!issues.length;
 const readinessRecord=<><h3>Current readiness</h3><p>{status}</p>{issues.map((reason,i)=><p className={s.warning} key={i}>{reason}</p>)}{notes.map(p=><section key={p.key}><h3>{p.title}</h3>{p.content}</section>)}</>;
 return <GameDialog title="Chance Details" fullScreen onClose={onClose}><main className={s.shell} data-breeding-book="chance-readiness" data-focused={focused} data-view={view}><article className={s.book}>
 <header className={s.header}><button onClick={onClose}>← Back</button><span aria-hidden="true">⟶</span><h1>Chance Details</h1></header>
 {focused&&<nav className={s.tabs} aria-label="Chance details sections">{(['Chance','Readiness & costs'] as const).map(v=><button key={v} aria-pressed={view===v} onClick={()=>setView(v)}>{v}</button>)}</nav>}
 <div className={s.body}>
 {!focused&&<section className={s.scene} aria-label="Selected parents"><Parent parent={giver} role="Giver"/><Parent parent={receiver} role="Receiver"/></section>}
 <section className={s.chance} aria-label="Final pregnancy chance"><h2>Pregnancy chance</h2><strong>{preview?`${preview.pregnancyChance}%`:'—'}</strong></section>
 {showChance&&<section className={s.factors}><h2>Chance contributions</h2>{rows.length?<table><tbody>{rows.map(([label,n])=><tr key={label}><th scope="row"><Help label={label} hint={hints[label]??'Contribution supplied by the current breeding preview.'} trigger={<><Icon name={factorIcon(label)}/>{label}</>}><p>{hints[label]??'Contribution supplied by the current breeding preview.'}</p><p>Current contribution: <strong>{n>0?'+':''}{n}%</strong></p>{label==='Talents, facility & daily effects'&&preview?.abilityTriggers.length?<ul>{preview.abilityTriggers.map((text,i)=><li key={i}>{text}</li>)}</ul>:null}</Help></th><td data-sign={n>0?'positive':n<0?'negative':'zero'}>{n>0?'+':''}{n}%</td></tr>)}</tbody></table>:<p className={s.empty}>Choose a giver and receiver to see their chance contributions.</p>}</section>}
 <section className={s.status} data-warning={!okay||undefined} aria-label="Pair readiness"><Icon name={okay?'ready':'warning'}/><div><strong>{stale?message:status}</strong><p>Pregnancy and inheritance use separate checks.</p></div><Help label="Readiness details" hint={issues.length?`${issues.length} readiness issue${issues.length===1?'':'s'}. ${issues[0]}`:'View the complete current readiness notes. Viewing never rolls an outcome.'} iconOnly>{readinessRecord}</Help></section>
 {showCosts&&issues.length>1&&<section className={s.issues} aria-label="Readiness issues">{issues.slice(safePage*capacity,(safePage+1)*capacity).map((reason,i)=><p key={i}>{reason}</p>)}{issuePages>1&&<nav aria-label="Readiness issue groups"><button disabled={!safePage} onClick={()=>setIssuePage(safePage-1)}>‹ Previous</button><span>{safePage+1} / {issuePages}</span><button disabled={safePage+1===issuePages} onClick={()=>setIssuePage(safePage+1)}>Next ›</button></nav>}</section>}
 {showCosts&&<section className={s.costs}><h2>After attempt</h2><ResourceTable {...{giver,receiver,preview}}/></section>}
 {showCosts&&<div className={s.links}><Help label="Readiness notes" hint="Read the complete readiness notes and resource cost details for this pair.">{readinessRecord}<section><h3>Exact resource costs</h3><ResourceTable {...{giver,receiver,preview}}/>{preview&&<p>Cost each: {preview.energyCost} Energy · {preview.heartCost} Hearts. Energy discount: {preview.energyDiscount}.</p>}{pages.filter(p=>p.key.startsWith('cost-')).map(p=><section key={p.key}><h3>{p.title}</h3>{p.content}</section>)}</section></Help><Help label="Attempt rewards" hint="View the current creature XP, Breeder XP and pair streak. Browsing spends nothing.">{progress.length?progress.map(p=><section key={p.key}><h3>{p.title}</h3>{p.content}</section>):<p>No attempt progression is available until both parents are selected.</p>}</Help></div>}
 </div>
 <footer className={s.footer}><button data-primary disabled={!preview?.canAttempt} onClick={onReview}>Review attempt</button><small>Viewing spends nothing. Review before confirming.</small></footer>
 </article></main></GameDialog>;
}
