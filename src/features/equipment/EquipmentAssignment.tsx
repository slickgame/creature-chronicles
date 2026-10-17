"use client";
import {useEffect,useState} from 'react';
import {getBreedingParticipants} from '@/data/breeding';
import {getOwnedInventory,inventoryRecipientBlocker} from '@/data/inventoryCatalogue';
import {BATTLE_OUTFITTER_ITEMS,EQUIPMENT_SLOT_LABELS} from '@/data/battleOutfitter';
import {getEquipmentCopies,getEquippedCopy} from '@/data/equipmentInstances';
import {compareEquipment} from '@/data/equipmentComparison';
import {equipmentStats} from '@/data/equipmentEnhancement';
import type {GameSave} from '@/types/save';
import {GameDialog} from '@/features/ui/GameDialog';
import {ForgeIcon} from '@/features/builder/ForgeWindow';
import {UpgradeItemArt} from './UpgradeItemArt';
import {EquipmentStatIcon} from './EquipmentStatIcon';
import s from './EquipmentAssignment.module.css';

export function EquipmentAssignment({save,copyId,creatureId,confirmation,confirmDisabled=false,onSelect,onClose,onReview,onConfirm}:{save:GameSave;copyId:string;creatureId:string;confirmation:boolean;confirmDisabled?:boolean;onSelect:(id:string)=>void;onClose:()=>void;onReview:()=>void;onConfirm:()=>void}){
 const [search,setSearch]=useState(''),[page,setPage]=useState(0),[expanded,setExpanded]=useState(false),[statPage,setStatPage]=useState(0),[mobile,setMobile]=useState(false),[short,setShort]=useState(false),[desktopCapacity,setDesktopCapacity]=useState(5),[tab,setTab]=useState<'creature'|'equipment'|'changes'>(confirmation?'changes':'creature');
 useEffect(()=>{const resize=()=>{setMobile(innerWidth<=700||innerHeight<=550);setShort(innerHeight<=550);setDesktopCapacity(innerHeight>=850?8:5);};const frame=requestAnimationFrame(resize);addEventListener('resize',resize);return()=>{cancelAnimationFrame(frame);removeEventListener('resize',resize);};},[]);
 const copy=getEquipmentCopies(save).find(c=>c.id===copyId),item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===copy?.itemId);
 const entry=getOwnedInventory(save).find(e=>e.id===copyId);
 const participants=getBreedingParticipants(save).filter(p=>p.kind!=='player');
 const creature=save.creatures?.find(c=>c.creatureId===creatureId)??save.creatures?.[0];
 const participant=participants.find(p=>p.participantId===creature?.creatureId);
 if(!copy||!item)return null;
 const comparison=creature?compareEquipment(save,creature,item,copy.id):null;
 const rows=comparison?.rows.filter(r=>r.delta!==0)??[];
 const sets=comparison?.sets.current.flatMap(before=>{const after=comparison.sets.after.find(a=>a.id===before.id);return after&&after.count!==before.count?[{before,after}]:[];}).sort((a,b)=>(a.after.activations-a.before.activations)-(b.after.activations-b.before.activations))??[];
 const lost=sets.filter(c=>c.after.activations<c.before.activations);
 const previous=comparison?.previous,previousCopy=previous&&creature?getEquippedCopy(save,creature.creatureId,previous.itemId):undefined;
 const candidates=participants.filter(p=>p.displayName.toLowerCase().includes(search.toLowerCase()));
 const pages=Math.max(1,Math.ceil(candidates.length/2)),index=Math.min(page,pages-1);
 const statCapacity=expanded?(short?3:mobile?4:desktopCapacity):3,statPages=Math.max(1,Math.ceil(rows.length/statCapacity)),statIndex=Math.min(statPage,statPages-1);
 const blocker=!creature?'Choose a creature first.':entry?inventoryRecipientBlocker(save,entry,creature.creatureId):'This copy is no longer available.';
 const title=confirmation?'Confirm equipment':'Choose creature';
 const portrait=(p:typeof participants[number])=><><img src={p.portraitPath} alt=""/><span><strong>{p.displayName}</strong><small>Lv. {p.level??1} · {p.familyLabel}</small></span></>;
 return <GameDialog fullScreen title={title} onClose={onClose}><main className={s.shell}><section className={s.book} data-equipment-assignment data-expanded={expanded}>
 <header className={s.heading}><div><h2>{title}</h2><p>{confirmation?'Equip this item on the selected creature?':'Select a creature to preview this equipment.'}</p></div><button aria-label={`Close ${title}`} onClick={onClose}><ForgeIcon name="close"/></button></header>
 {mobile&&<nav className={s.tabs} aria-label="Equipment review sections">{(['creature','equipment','changes'] as const).map(t=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t==='creature'?'Creature':t==='equipment'?'Equipment':'Changes'}</button>)}</nav>}
 <div className={s.layout}>
 <section className={s.roster} hidden={mobile&&tab!=='creature'} aria-label="Creature roster">
 {confirmation?participant&&<div className={s.recipient}>{portrait(participant)}<p>{EQUIPMENT_SLOT_LABELS[item.equipmentSlot!]} slot</p></div>:<><input aria-label="Search creatures" placeholder="Search creatures…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/><div className={s.candidates}>{candidates.slice(index*2,index*2+2).map(p=>{const reason=entry?inventoryRecipientBlocker(save,entry,p.participantId):'Equipment unavailable';return <div key={p.participantId}><button className={s.portrait} aria-pressed={p.participantId===creature?.creatureId} disabled={!!reason} onClick={()=>{onSelect(p.participantId);setExpanded(false);setStatPage(0);}}>{portrait(p)}</button>{reason&&<small>{reason}</small>}</div>;})}{!candidates.length&&<p>No creatures match.</p>}</div>{pages>1&&<nav className={s.pager} aria-label="Creature pages"><button aria-label="Previous creatures" disabled={!index} onClick={()=>setPage(index-1)}>‹</button><span>{index+1} / {pages}</span><button aria-label="Next creatures" disabled={index+1>=pages} onClick={()=>setPage(index+1)}>›</button></nav>}</>}
 </section>
 <section className={s.gearPanel} hidden={mobile&&tab!=='equipment'} aria-label="Equipment replacement"><div className={s.gearPair}><article><h3>Currently equipped</h3>{previous&&previousCopy?<><UpgradeItemArt art={previous.iconPath} stats={equipmentStats(previous,previousCopy)} slot={previous.equipmentSlot}/><h3>{previous.name}</h3><p>{EQUIPMENT_SLOT_LABELS[previous.equipmentSlot!]} · {equipmentStats(previous,previousCopy).rarity} · +{previousCopy.level}</p></>:<p className={s.empty}>Empty slot</p>}</article><b className={s.arrow}>→</b><article><h3>Selected item</h3><UpgradeItemArt art={item.iconPath} stats={equipmentStats(item,copy)} slot={item.equipmentSlot}/><h3>{item.name}</h3><p>{EQUIPMENT_SLOT_LABELS[item.equipmentSlot!]} · {equipmentStats(item,copy).rarity} · +{copy.level}</p></article></div><p className={s.inventory}><EquipmentStatIcon name="inventory"/>{previous?`${previous.name} returns to inventory with its upgrades intact.`:'Equips into an empty slot.'}</p></section>
 <section className={s.impact} hidden={mobile&&tab!=='changes'} aria-label="Equipment changes"><div className={s.statHeading}><h3>Total battle stats</h3>{rows.length>3&&<button aria-expanded={expanded} aria-controls="equip-battle-changes" onClick={()=>{setExpanded(!expanded);setStatPage(0);}}>{expanded?'Minimize stats':`View all ${rows.length} changes`}</button>}</div><p className={s.summary}>{rows.filter(r=>r.delta>0).length} increases · {rows.filter(r=>r.delta<0).length} decreases · Item and set bonuses included</p>
 <table id="equip-battle-changes"><thead><tr><th>Stat</th><th>Current</th><th>After</th><th>Change</th></tr></thead><tbody>{rows.slice(statIndex*statCapacity,(statIndex+1)*statCapacity).map(r=><tr key={r.key}><th><EquipmentStatIcon name={r.key}/>{r.label}</th><td>{r.current}</td><td>{r.after}</td><td data-delta={Math.sign(r.delta)}>{r.delta>0?'+':''}{r.delta}</td></tr>)}</tbody></table>{!rows.length&&<p>No battle stat changes.</p>}
 {expanded&&statPages>1&&<nav className={s.pager} aria-label="Battle stat pages"><button aria-label="Previous stat changes" disabled={!statIndex} onClick={()=>setStatPage(statIndex-1)}>‹</button><span>{statIndex+1} / {statPages}</span><button aria-label="Next stat changes" disabled={statIndex+1>=statPages} onClick={()=>setStatPage(statIndex+1)}>›</button></nav>}
 {lost.length>0&&<p className={s.warning} role="status">{lost.map(c=>`${c.before.name} bonus will be lost (${c.before.activations} → ${c.after.activations} active groups).`).join(' ')}</p>}
 {!expanded&&<section className={s.sets} aria-label="Set changes"><h3>Set changes</h3>{sets.map(({before,after})=><div key={before.id}><img src={`/images/ui/forge-slate-v2/sets/sculpted/${before.id}.webp`} alt=""/><span><strong>{before.name} {before.count}/{before.required} → {after.count}/{after.required}</strong><small>{after.activations<before.activations?'Bonus lost':after.activations>before.activations?'Bonus gained':after.activations?'Active':'Incomplete set'} · {before.description}</small></span></div>)}{!sets.length&&<p>No set counts change.</p>}</section>}
 </section></div>
 {blocker&&<p className={s.warning}>{blocker}</p>}
 <footer><button onClick={onClose}>Cancel</button><span>{participant?.displayName??'No creature selected'} · No Gold cost</span><button disabled={!!blocker||(confirmation&&confirmDisabled)} onClick={confirmation?onConfirm:onReview}><EquipmentStatIcon name="equip"/>{confirmation?'Confirm equip':'Review equip'}</button></footer>
 </section></main></GameDialog>;
}
