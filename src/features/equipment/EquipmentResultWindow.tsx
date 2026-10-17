"use client";
import {useEffect,useId,useState} from 'react';
import type {EquipmentChangeSnapshot} from '@/data/equipmentChangeSnapshot';
import {EQUIPMENT_SLOT_LABELS} from '@/data/battleOutfitter';
import {equipmentStats} from '@/data/equipmentEnhancement';
import {GameDialog} from '@/features/ui/GameDialog';
import {ForgeIcon} from '@/features/builder/ForgeWindow';
import {UpgradeItemArt} from './UpgradeItemArt';
import {EquipmentStatIcon} from './EquipmentStatIcon';
import a from './EquipmentAssignment.module.css';
import s from './EquipmentResultWindow.module.css';

export function EquipmentResultWindow({snapshot,completed=false,blocker,onClose,onConfirm}:{snapshot:EquipmentChangeSnapshot;completed?:boolean;blocker?:string|null;onClose:()=>void;onConfirm?:()=>void}){
 const [continueReady,setContinueReady]=useState(!completed);
 useEffect(()=>{if(!completed)return;const timer=setTimeout(()=>setContinueReady(true),250);return()=>clearTimeout(timer);},[completed]);
 const [expanded,setExpanded]=useState(false),[page,setPage]=useState(0),[setPageIndex,setSetPage]=useState(0),[tab,setTab]=useState<'equipment'|'changes'>('changes');
 // These dialogs mount after a user action; initialize from the current viewport to avoid a desktop first frame on phones.
 const [viewport,setViewport]=useState(()=>typeof window==='undefined'?{mobile:false,short:false,capacity:4}:{mobile:innerWidth<=700||innerHeight<=550,short:innerHeight<=550,capacity:innerHeight<=550?3:innerWidth<=700?4:innerHeight>=850?8:4});
 const tableId=useId();
 useEffect(()=>{const resize=()=>setViewport({mobile:innerWidth<=700||innerHeight<=550,short:innerHeight<=550,capacity:innerHeight<=550?3:innerWidth<=700?4:innerHeight>=850?8:4});const frame=requestAnimationFrame(resize);addEventListener('resize',resize);return()=>{cancelAnimationFrame(frame);removeEventListener('resize',resize);};},[]);
 const rows=snapshot.rows.filter(r=>r.delta!==0),capacity=expanded?viewport.capacity:3,pages=Math.max(1,Math.ceil(rows.length/capacity)),index=Math.min(page,pages-1);
 const sets=snapshot.sets.current.flatMap(before=>{const after=snapshot.sets.after.find(p=>p.id===before.id);return after&&after.count!==before.count?[{before,after}]:[];}).sort((a,b)=>(a.after.activations-a.before.activations)-(b.after.activations-b.before.activations));
 const setCapacity=viewport.mobile&&!viewport.short?1:2,setPages=Math.max(1,Math.ceil(sets.length/setCapacity)),setIndex=Math.min(setPageIndex,setPages-1);
 const lost=sets.filter(c=>c.after.activations<c.before.activations);
 const removing=snapshot.kind==='remove',title=completed?(removing?'Equipment removed':'Equipment equipped'):'Remove equipment?';
 const inventory=removing?`${snapshot.before?.item.name??'Equipment'} ${completed?'saved':'returns'} to inventory.`:snapshot.before?`${snapshot.before.item.name} returned to inventory.`:'Equipped into an empty slot.';
 const art=(gear:EquipmentChangeSnapshot['before'],label:string)=><article><h3>{label}</h3>{gear?<><UpgradeItemArt art={gear.item.iconPath} stats={equipmentStats(gear.item,gear.copy)} slot={gear.item.equipmentSlot}/><strong>{gear.item.name}</strong><small>{EQUIPMENT_SLOT_LABELS[snapshot.slot]} · {equipmentStats(gear.item,gear.copy).rarity} · +{gear.copy.level}</small></>:<><div className={s.empty}><img src={`/images/ui/forge-slate-v2/categories/${snapshot.slot}.webp`} alt=""/></div><strong>Empty</strong><small>{EQUIPMENT_SLOT_LABELS[snapshot.slot]} slot{completed?'':' after removal'}</small></>}</article>;
 return <GameDialog fullScreen title={title} onClose={onClose}><main className={a.shell}><section className={`${a.book} ${s.book}`} data-equipment-result data-stat-capacity={viewport.capacity} data-compact={viewport.mobile} data-completed={completed} data-expanded={expanded}>
 <header className={a.heading}><div><h2>{title}</h2><p>{completed?`${snapshot.name}’s ${EQUIPMENT_SLOT_LABELS[snapshot.slot]} slot has been updated.`:`Remove this equipment from ${snapshot.name}?`}</p></div><button aria-label={`Close ${title}`} onClick={onClose}><ForgeIcon name="close"/></button></header>
 {viewport.mobile&&<nav className={a.tabs} aria-label="Equipment result sections"><button aria-pressed={tab==='equipment'} onClick={()=>setTab('equipment')}>Equipment</button><button aria-pressed={tab==='changes'} onClick={()=>setTab('changes')}>Changes</button></nav>}
 <div className={s.layout}>
 <section className={s.loadout} hidden={viewport.mobile&&tab!=='equipment'} aria-label="Equipment result loadout"><div className={s.creature}>{snapshot.portrait&&<img src={snapshot.portrait} alt=""/>}<div><strong>{snapshot.name}</strong><small>Lv. {snapshot.level} · {snapshot.family}</small><span>{EQUIPMENT_SLOT_LABELS[snapshot.slot]} slot</span></div></div><div className={s.gearPair}>{art(snapshot.before,completed?'Previous equipment':'Currently equipped')}<b>→</b>{art(snapshot.after,completed?'Saved loadout':'After removal')}</div></section>
 <section className={s.impact} hidden={viewport.mobile&&tab!=='changes'} aria-label="Saved equipment changes" data-expanded={expanded}>
 <div className={s.stats}><div className={s.statHeading}><h3>Battle stat changes</h3>{rows.length>3&&<button aria-expanded={expanded} aria-controls={tableId} onClick={()=>{setExpanded(!expanded);setPage(0);}}>{expanded?'Minimize stats':`View all ${rows.length} changes`}</button>}</div><p className={s.summary}>{rows.filter(r=>r.delta>0).length} increases · {rows.filter(r=>r.delta<0).length} decreases · Includes set bonuses</p>
 <table id={tableId}><thead><tr><th>Stat</th><th>{completed?'Before':'Current'}</th><th>{completed?'Saved':'After'}</th><th>Change</th></tr></thead><tbody>{rows.slice(index*capacity,(index+1)*capacity).map(r=><tr key={r.key}><th><EquipmentStatIcon name={r.key}/>{r.label}</th><td>{r.current}</td><td>{r.after}</td><td data-delta={Math.sign(r.delta)}>{r.delta>0?'+':''}{r.delta}</td></tr>)}</tbody></table>{!rows.length&&<p>No battle stat changes.</p>}
 {expanded&&pages>1&&<nav className={a.pager} aria-label="Result stat pages"><button aria-label="Previous result stats" disabled={!index} onClick={()=>setPage(index-1)}>‹</button><span>{index+1} / {pages}</span><button aria-label="Next result stats" disabled={index+1>=pages} onClick={()=>setPage(index+1)}>›</button></nav>}</div>
 {!expanded&&<section className={s.sets} aria-label="Result set changes"><div className={s.setHeading}><h3>Set status</h3>{setPages>1&&<nav aria-label="Result set pages"><button aria-label="Previous result set" disabled={!setIndex} onClick={()=>setSetPage(setIndex-1)}>‹</button><span>{setIndex+1}/{setPages}</span><button aria-label="Next result set" disabled={setIndex+1>=setPages} onClick={()=>setSetPage(setIndex+1)}>›</button></nav>}</div>{sets.slice(setIndex*setCapacity,(setIndex+1)*setCapacity).map(({before,after})=><div key={before.id}><img src={`/images/ui/forge-slate-v2/sets/sculpted/${before.id}.webp`} alt=""/><span><strong>{before.name} {before.count}/{before.required} → {after.count}/{after.required}</strong><small>{after.activations<before.activations?'Bonus lost':after.activations>before.activations?'Bonus gained':after.activations?'Active':'Incomplete set'} · {before.description}</small></span></div>)}{!sets.length&&<p>No set counts change.</p>}</section>}
 {lost.length>0&&<p className={s.warning} role="status">{lost.map(c=>`${c.before.name} bonus ${completed?'lost':'will be lost'} (${c.before.activations} → ${c.after.activations} active groups).`).join(' ')}</p>}
 </section></div>
 <p className={s.inventory}><EquipmentStatIcon name="inventory"/><span><strong>{inventory}</strong><small>Upgrades preserved · No Gold cost</small></span></p>
 {blocker&&<p className={s.warning} role="alert">{blocker}</p>}
 <footer>{!completed&&<button onClick={onClose}>Cancel</button>}<span>{snapshot.name} · {EQUIPMENT_SLOT_LABELS[snapshot.slot]}</span><button disabled={completed?!continueReady:!!blocker} onClick={completed?onClose:onConfirm}>{!completed&&<EquipmentStatIcon name="inventory"/>}{completed?'Continue':'Confirm removal'}</button></footer>
 </section></main></GameDialog>;
}
