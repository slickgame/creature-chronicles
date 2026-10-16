"use client";
import {useEffect,useState} from 'react';
import type {compareEquipment} from '@/data/equipmentComparison';
import s from './EquipmentGallery.module.css';
/** Read-only hypothetical changes use the same wearer summary as combat and confirmation. */
export function EquipmentSetChanges({comparison,onDetails}:{comparison:ReturnType<typeof compareEquipment>|null;onDetails:()=>void}){
 const [page,setPage]=useState(0),[capacity,setCapacity]=useState(2);
 useEffect(()=>{const resize=()=>setCapacity(innerWidth<=650?1:2);const frame=requestAnimationFrame(resize);addEventListener('resize',resize);return()=>{cancelAnimationFrame(frame);removeEventListener('resize',resize);};},[]);
 const changes=comparison?.sets.current.flatMap(before=>{
  const after=comparison.sets.after.find(p=>p.id===before.id);
  return after&&after.count!==before.count?[{before,after}]:[];
 }).sort((a,b)=>(a.after.activations-a.before.activations)-(b.after.activations-b.before.activations))??[];
 const pages=Math.max(1,Math.ceil(changes.length/capacity)),index=Math.min(page,pages-1);
 return <section className={s.setChanges} aria-label="Set changes if equipped" data-equipment-set-changes>
  <div className={s.changeHeading}><strong>Set changes <small>if equipped</small></strong><button onClick={onDetails}>Set details</button></div>
  {changes.length?<div className={s.changeEntries} aria-live="polite">{changes.slice(index*capacity,index*capacity+capacity).map(({before,after})=><div className={s.changeBody} key={before.id}><img src={`/images/ui/equipment-c2/set-${before.id}.webp`} alt=""/><span><strong>{before.name} {before.count}/{before.required} → {after.count}/{after.required}</strong><small data-change={Math.sign(after.activations-before.activations)}>{after.activations<before.activations?'Bonus lost':after.activations>before.activations?'Bonus gained':after.activations?'Active':'In progress'} · {before.activations} → {after.activations} active groups</small></span></div>)}{pages>1&&<nav aria-label="Set change pages"><button aria-label="Previous set change" disabled={!index} onClick={()=>setPage(index-1)}>‹</button><span>{index+1}/{pages}</span><button aria-label="Next set change" disabled={index+1>=pages} onClick={()=>setPage(index+1)}>›</button></nav>}</div>:<p>{comparison?'No set counts change.':'Choose a creature to preview set changes.'}</p>}
 </section>;
}
