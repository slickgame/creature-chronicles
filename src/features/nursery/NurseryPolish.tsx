"use client";
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {GameDialog} from '@/features/ui/GameDialog';
import type {EggRecord} from '@/types/save';
import {nurseryIdentity} from '@/data/nurseryPresentation';
import {NurseryScene} from './NurseryScene';
import s from './NurseryScenic.module.css';
export const NURSERY_POLISH='/images/ui/nursery-scenic-a/polish-v1/';
export function eggTimerLabel(egg:EggRecord){return egg.status==='ready'?'Ready to hatch':`${egg.daysRemaining} day${egg.daysRemaining===1?'':'s'} remaining`;}
export function NurseryTimer({egg,scene=false}:{egg:EggRecord;scene?:boolean}){
 const max=Math.max(1,egg.totalDays),elapsed=Math.max(0,Math.min(max,max-egg.daysRemaining));
 return <div className={scene?s.sceneTimer:s.timer} data-nursery-timer><b>{eggTimerLabel(egg)}</b>{egg.status!=='ready'&&<><div className={s.timerTrack} role="progressbar" aria-label={scene?'Scene incubation progress':'Incubation progress'} aria-valuemin={0} aria-valuemax={max} aria-valuenow={elapsed}><span style={{width:`${elapsed/max*100}%`}}/></div><small>Advances after Sleep</small></>}</div>;
}
export function NurseryEggPicker({eggs,draft,onDraft,onCancel,onSelect,name}:{eggs:EggRecord[];draft:string;onDraft:(id:string)=>void;onCancel:()=>void;onSelect:()=>void;name:(egg:EggRecord)=>string}){
 const body=useRef<HTMLDivElement>(null),[layout,setLayout]=useState({columns:2,rows:1,compact:true}),[requestedPage,setRequestedPage]=useState<number|null>(null);
 useEffect(()=>{const el=body.current;if(!el)return;const observer=new ResizeObserver(([entry])=>{const {width,height}=entry.contentRect;if(width<=0||height<=0)return;const columns=width>=900?5:width>=650?3:2,compact=height<250,minHeight=compact?105:width<650?155:230;setLayout({columns,rows:Math.max(1,Math.min(2,Math.floor((height+10)/(minHeight+10)))),compact});});observer.observe(el);return()=>observer.disconnect();},[]);
 const capacity=layout.columns*layout.rows,pages=Math.max(1,Math.ceil(eggs.length/capacity)),page=Math.min(requestedPage??Math.floor(Math.max(0,eggs.findIndex(e=>e.eggId===draft))/capacity),pages-1);
 return <section className={s.picker}><header className={s.pickerHeader}><h1>Choose egg</h1><button aria-label="Close egg picker" onClick={onCancel}>×</button></header><div ref={body} className={s.pickerGrid} data-compact={layout.compact} style={{'--egg-columns':layout.columns,'--egg-rows':layout.rows} as CSSProperties} aria-label="Nursery eggs">{eggs.slice(page*capacity,(page+1)*capacity).map(e=>{const id=nurseryIdentity(e);return <button className={s.eggCard} key={e.eggId} aria-pressed={draft===e.eggId} onClick={()=>onDraft(e.eggId)}>{draft===e.eggId&&<img className={s.selectionMark} src={`${NURSERY_POLISH}symbols/selection-medallion.svg`} alt="Selected"/>}<img className={s.pickerEgg} src={id.art} alt=""/><span><b>{name(e)}</b><small>{id.species} · {id.type}</small><small>{eggTimerLabel(e)}</small></span></button>;})}</div><nav className={s.pager} aria-label="Nursery eggs pages"><button disabled={page===0} onClick={()=>setRequestedPage(page-1)}>← Previous</button><span aria-live="polite">{page+1} / {pages}</span><button disabled={page===pages-1} onClick={()=>setRequestedPage(page+1)}>Next →</button></nav><footer className={s.pickerFooter}><p>Previewing does not change your selection.</p><button onClick={onCancel}>Cancel</button><button data-primary onClick={onSelect}>Select egg</button></footer></section>;
}
export function NurseryHatchMoment({egg,onReveal}:{egg:EggRecord;onReveal:()=>void}){
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');if(media.matches){onReveal();return;}const handle=()=>{if(media.matches)onReveal();};media.addEventListener('change',handle);const timer=window.setTimeout(onReveal,1800);return()=>{window.clearTimeout(timer);media.removeEventListener('change',handle);};},[onReveal]);
 const id=nurseryIdentity(egg);
 return <GameDialog title="Hatching egg" onClose={onReveal} fullScreen><main className={`${s.shell} ${s.hatchMoment}`} data-nursery-hatching><header className={s.header}><h1>A new beginning</h1><button onClick={onReveal}>Skip</button></header><div className={s.hatchStage}><NurseryScene egg={id.art} alt={`${id.species} egg hatching`} hatching/></div><p role="status">Your hatchling is ready to meet you.</p></main></GameDialog>;
}
