"use client";
import {useEffect,useId,useState} from 'react';
import type {EquipmentChangeSnapshot} from '@/data/equipmentChangeSnapshot';
import {equipmentStats} from '@/data/equipmentEnhancement';
import {EQUIPMENT_SLOT_LABELS} from '@/data/battleOutfitter';
import {GameDialog} from '@/features/ui/GameDialog';
import {ForgeIcon} from '@/features/builder/ForgeWindow';
import {EquipmentStatIcon} from './EquipmentStatIcon';
import {UpgradeItemArt} from './UpgradeItemArt';
import a from './EquipmentAssignment.module.css';
import s from './EquipmentTransferWindow.module.css';

type Viewport={compact:boolean;short:boolean;capacity:number};
const viewport=():Viewport=>typeof window==='undefined'?{compact:false,short:false,capacity:8}:{compact:innerWidth<=900||innerHeight<=550,short:innerHeight<=550,capacity:innerHeight<=550?3:innerWidth<=900?4:8};
function CreatureChanges({snapshot,donor,completed,viewport:vp}:{snapshot:EquipmentChangeSnapshot;donor:boolean;completed:boolean;viewport:Viewport}){
 const [expanded,setExpanded]=useState(false),[page,setPage]=useState(0),[setPageIndex,setSetPage]=useState(0);
 const tableId=useId(),rows=snapshot.rows.filter(r=>r.delta),capacity=expanded?vp.capacity:3,pages=Math.max(1,Math.ceil(rows.length/capacity)),index=Math.min(page,pages-1);
 const sets=snapshot.sets.current.flatMap(before=>{const after=snapshot.sets.after.find(s=>s.id===before.id);return after&&after.count!==before.count?[{before,after}]:[];}).sort((a,b)=>(a.after.activations-a.before.activations)-(b.after.activations-b.before.activations));
 const setCapacity=vp.compact&&!vp.short?1:2,setPages=Math.max(1,Math.ceil(sets.length/setCapacity)),setIndex=Math.min(setPageIndex,setPages-1),lost=sets.filter(s=>s.after.activations<s.before.activations);
 return <section className={s.changes} data-transfer-creature={donor?'donor':'recipient'} data-expanded={expanded} aria-label={`${snapshot.name} changes`}>
  <div className={s.creature}><img src={snapshot.portrait} alt=""/><div><h3>{snapshot.name} · {donor?(completed?'Previous wearer':'Current wearer'):'Recipient'}</h3><p>{EQUIPMENT_SLOT_LABELS[snapshot.slot]}: {snapshot.before?.item.name??'Empty'} → {snapshot.after?.item.name??'Empty'}</p></div></div>
  <div className={s.statHeading}><h3>Battle stat changes</h3>{rows.length>3&&<button aria-expanded={expanded} aria-controls={tableId} onClick={()=>{setExpanded(!expanded);setPage(0);}}>{expanded?'Minimize stats':`View all ${rows.length} changes`}</button>}</div>
  <table id={tableId}><thead><tr><th>Stat</th><th>{completed?'Before':'Current'}</th><th>{completed?'Saved':'After'}</th><th>Change</th></tr></thead><tbody>{rows.slice(index*capacity,(index+1)*capacity).map(row=><tr key={row.key}><th><EquipmentStatIcon name={row.key}/>{row.label}</th><td>{row.current}</td><td>{row.after}</td><td data-delta={Math.sign(row.delta)}>{row.delta>0?'+':''}{row.delta}</td></tr>)}</tbody></table>{!rows.length&&<p>No battle stat changes.</p>}
  {expanded&&pages>1&&<div className={s.pager} aria-label={`${snapshot.name} stat pages`}><button aria-label="Previous transfer stats" disabled={!index} onClick={()=>setPage(index-1)}>‹</button><span>{index+1}/{pages}</span><button aria-label="Next transfer stats" disabled={index+1>=pages} onClick={()=>setPage(index+1)}>›</button></div>}
  {!expanded&&<div className={s.sets}><div className={s.setHeading}><strong>Set changes</strong>{setPages>1&&<div className={s.pager}><button aria-label="Previous transfer set" disabled={!setIndex} onClick={()=>setSetPage(setIndex-1)}>‹</button><small>{setIndex+1}/{setPages}</small><button aria-label="Next transfer set" disabled={setIndex+1>=setPages} onClick={()=>setSetPage(setIndex+1)}>›</button></div>}</div>{sets.slice(setIndex*setCapacity,(setIndex+1)*setCapacity).map(({before,after})=><div className={s.setRow} key={before.id}><img src={`/images/ui/forge-slate-v2/sets/sculpted/${before.id}.webp`} alt=""/><span><strong>{before.name} {before.count}/{before.required} → {after.count}/{after.required}</strong><small>{after.activations<before.activations?'Bonus lost':after.activations>before.activations?'Bonus gained':after.activations?'Active':'Incomplete set'}</small></span></div>)}{!sets.length&&<p>No set counts change.</p>}</div>}
  {!!lost.length&&<p className={s.warning} role="status">{lost.map(({before})=>`${before.name} bonus ${completed?'lost':'will be lost'}.`).join(' ')}</p>}
 </section>;
}
export function EquipmentTransferWindow({donor,recipient,completed=false,blocker,confirmDisabled=false,note,onClose,onConfirm}:{donor:EquipmentChangeSnapshot;recipient:EquipmentChangeSnapshot;completed?:boolean;blocker?:string|null;confirmDisabled?:boolean;note?:string;onClose:()=>void;onConfirm?:()=>void}){
 const [vp,setViewport]=useState(viewport),[tab,setTab]=useState<'donor'|'recipient'>('donor'),[ready,setReady]=useState(!completed);
 useEffect(()=>{const resize=()=>setViewport(viewport());addEventListener('resize',resize);return()=>removeEventListener('resize',resize);},[]);
 useEffect(()=>{if(!completed)return;const timer=setTimeout(()=>setReady(true),250);return()=>clearTimeout(timer);},[completed]);
 const item=recipient.after??donor.before,title=completed?'Equipment transferred':'Transfer equipment?';
 return <GameDialog fullScreen title={title} onClose={onClose}><main className={a.shell}><section className={`${a.book} ${s.book}`} data-equipment-transfer data-completed={completed} data-compact={vp.compact}>
  <header className={a.heading}><div><h2>{title}</h2><p>{completed?`Moved ${item?.item.name} from ${donor.name} to ${recipient.name}.`:`Move ${item?.item.name} from ${donor.name} to ${recipient.name}?`}</p></div><button aria-label={`Close ${title}`} onClick={onClose}><ForgeIcon name="close"/></button></header>
  {item&&<div className={s.item}><div><UpgradeItemArt art={item.item.iconPath} stats={equipmentStats(item.item,item.copy)} slot={item.item.equipmentSlot}/></div><span><h3>{item.item.name} +{item.copy.level}</h3><p>{EQUIPMENT_SLOT_LABELS[recipient.slot]} · {equipmentStats(item.item,item.copy).rarity} · Power {equipmentStats(item.item,item.copy).powerGrade}</p><small>Upgrades preserved · No Gold cost</small></span></div>}
  {vp.compact&&<div className={s.tabs} aria-label="Transfer creatures"><button aria-pressed={tab==='donor'} onClick={()=>setTab('donor')}>{donor.name} · Wearer</button><button aria-pressed={tab==='recipient'} onClick={()=>setTab('recipient')}>{recipient.name} · Recipient</button></div>}
  <div className={s.columns}><div hidden={vp.compact&&tab!=='donor'}><CreatureChanges snapshot={donor} donor completed={completed} viewport={vp}/></div><div hidden={vp.compact&&tab!=='recipient'}><CreatureChanges snapshot={recipient} donor={false} completed={completed} viewport={vp}/></div></div>
  <p className={s.inventory}><EquipmentStatIcon name="inventory"/><span>{recipient.before?`${recipient.before.item.name} ${completed?'returned':'returns'} to inventory with its upgrades intact.`:`${recipient.name} ${completed?'equipped':'equips'} into an empty ${EQUIPMENT_SLOT_LABELS[recipient.slot]} slot.`}{note&&<small>{note}</small>}</span></p>
  {blocker&&<p className={s.warning} role="alert">{blocker}</p>}
  <footer>{!completed&&<button onClick={onClose}>Cancel</button>}<span>Both loadouts {completed?'saved':'update'} together</span><button disabled={completed?!ready:!!blocker||confirmDisabled} onClick={completed?onClose:onConfirm}>{completed?'Continue':'Confirm transfer'}</button></footer>
 </section></main></GameDialog>;
}
