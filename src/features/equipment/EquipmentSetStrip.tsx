import {useEffect,useState} from 'react';
import type {EquipmentSetProgress} from '@/data/equipmentRules';
import {DetailButton} from '@/features/ui/DetailButton';
import s from './EquipmentGallery.module.css';
/** Counts come from the actual wearer summary, never gallery filters or inventory stock. */
export function EquipmentSetStrip({progress,creatureName,onDetails}:{progress:EquipmentSetProgress[];creatureName?:string;onDetails:()=>void}){
 const [page,setPage]=useState(0),[capacity,setCapacity]=useState(4);
 useEffect(()=>{const update=()=>setCapacity(innerWidth<=650?1:4);const id=requestAnimationFrame(update);addEventListener('resize',update);return()=>{cancelAnimationFrame(id);removeEventListener('resize',update);};},[]);
 const worn=progress.filter(p=>p.count>0),pages=Math.max(1,Math.ceil(worn.length/capacity)),index=Math.min(page,pages-1);
 return <section className={s.setStrip} aria-label="Equipped set progress" data-equipment-set-strip>
 <div className={s.setStripHeading}><strong>Equipped sets</strong><span>{creatureName??'Choose a creature'}</span></div>
 <div className={s.setStripBody}>
 <div className={s.setStripEntries}>{worn.slice(index*capacity,index*capacity+capacity).map(p=><DetailButton key={p.id} className={s.setChip} hint={`${p.name}: ${p.count}/${p.required} equipped pieces. ${p.activations?`${p.activations} active group(s).`:'In progress.'} ${p.description}`} onClick={onDetails}>
 <img src={`/images/ui/equipment-c2/set-${p.id}.webp`} alt=""/><span><strong>{p.name} <b data-set-count={p.id}>{p.count}/{p.required}</b></strong><small data-active={p.activations>0}>{p.activations?`Active${p.activations>1?` ×${p.activations}`:''}`:'In progress'}</small><em>{p.description.split(' per completed')[0]}</em></span>
 </DetailButton>)}{!worn.length&&<p className={s.setEmpty}>{creatureName?'No set pieces equipped.':'Choose a creature to view equipped sets.'}</p>}</div>
 {pages>1&&<nav className={s.setStripPager} aria-label="Set pages"><button aria-label="Previous set" disabled={!index} onClick={()=>setPage(index-1)}>‹</button><span>{index+1}/{pages}</span><button aria-label="Next set" disabled={index+1>=pages} onClick={()=>setPage(index+1)}>›</button></nav>}
 <button className={s.setDetails} onClick={onDetails}>Set details</button></div>
 </section>;
}
