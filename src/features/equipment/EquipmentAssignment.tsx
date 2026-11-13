"use client";
import {useEffect,useRef,useState} from 'react';
import {getBreedingParticipants} from '@/data/breeding';
import {getOwnedInventory} from '@/data/inventoryCatalogue';
import {equipmentRecipientBlocker} from '@/data/equipmentTransfer';
import {BATTLE_OUTFITTER_ITEMS,EQUIPMENT_SLOT_LABELS} from '@/data/battleOutfitter';
import {getEquipmentCopies,getEquippedCopy} from '@/data/equipmentInstances';
import {BATTLE_STAT_LABELS,compareEquipment} from '@/data/equipmentComparison';
import {equipmentStats} from '@/data/equipmentEnhancement';
import type {GameSave} from '@/types/save';
import {GameDialog} from '@/features/ui/GameDialog';
import {ForgeIcon} from '@/features/builder/ForgeWindow';
import {UpgradeItemArt} from './UpgradeItemArt';
import {EquipmentStatIcon} from './EquipmentStatIcon';
import s from './EquipmentAssignment.module.css';

export function EquipmentAssignment({save,copyId,creatureId,confirmation,confirmDisabled=false,onSelect,onClose,onReview,onConfirm}:{save:GameSave;copyId:string;creatureId:string;confirmation:boolean;confirmDisabled?:boolean;onSelect:(id:string)=>void;onClose:()=>void;onReview:()=>void;onConfirm:()=>void}){
 const drag=useRef<{id:number;y:number;top:number}|null>(null);
 const [search,setSearch]=useState(''),[page,setPage]=useState(0),[expanded,setExpanded]=useState(false),[statPage,setStatPage]=useState(0),[mobile,setMobile]=useState(()=>typeof window!=="undefined"&&(innerWidth<=700||innerHeight<=550)),[short,setShort]=useState(()=>typeof window!=="undefined"&&innerHeight<=550),[desktopCapacity,setDesktopCapacity]=useState(()=>typeof window!=="undefined"&&innerHeight>=850?8:5),[tab,setTab]=useState<'creature'|'equipment'|'changes'>(confirmation?'changes':'equipment');
 useEffect(()=>{const resize=()=>{setMobile(innerWidth<=700||innerHeight<=550);setShort(innerHeight<=550);setDesktopCapacity(innerHeight>=850?8:5);};const frame=requestAnimationFrame(resize);addEventListener('resize',resize);return()=>{cancelAnimationFrame(frame);removeEventListener('resize',resize);};},[]);
 const copy=getEquipmentCopies(save).find(c=>c.id===copyId),item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===copy?.itemId);
 const entry=getOwnedInventory(save).find(e=>e.id===copyId);
 const participants=getBreedingParticipants(save).filter(p=>p.kind!=='player');
 const creature=save.creatures?.find(c=>c.creatureId===creatureId)??save.creatures?.[0];
 const participant=participants.find(p=>p.participantId===creature?.creatureId);
 if(!copy||!item)return null;
 const comparison=creature?compareEquipment(save,creature,item,copy.id):null;
 const allRows=comparison?.rows??[];
 const rows=comparison?.rows.filter(r=>r.delta!==0)??[];
 const sets=comparison?.sets.current.flatMap(before=>{const after=comparison.sets.after.find(a=>a.id===before.id);return after&&after.count!==before.count?[{before,after}]:[];}).sort((a,b)=>(a.after.activations-a.before.activations)-(b.after.activations-b.before.activations))??[];
 const lost=sets.filter(c=>c.after.activations<c.before.activations);
 const previous=comparison?.previous,previousCopy=previous&&creature?getEquippedCopy(save,creature.creatureId,previous.itemId):undefined;
 const candidates=participants.filter(p=>p.displayName.toLowerCase().includes(search.toLowerCase()));
 const rosterCapacity=mobile?2:4;
 const pages=Math.max(1,Math.ceil(candidates.length/rosterCapacity)),index=Math.min(page,pages-1);
 const statCapacity=expanded?(short?3:mobile?4:desktopCapacity):3,statPages=Math.max(1,Math.ceil(rows.length/statCapacity)),statIndex=Math.min(statPage,statPages-1);
 const blocker=!creature?'Choose a creature first.':entry?equipmentRecipientBlocker(save,entry,creature.creatureId):'This copy is no longer available.';
 const title=confirmation?'Confirm equipment':'Choose creature';
 const portraitImage=(p:typeof participants[number])=><img key={p.participantId} src={p.portraitPath} alt="" onError={event=>{
  const img=event.currentTarget;
  if(p.profilePath && p.profilePath!==p.portraitPath && img.getAttribute('src')!==p.profilePath) img.src=p.profilePath;
  else img.hidden=true;
 }}/>;
 const portrait=(p:typeof participants[number])=><>{portraitImage(p)}<span><strong>{p.displayName}</strong><small>Lv. {p.level??1} · {p.familyLabel}</small></span></>;
 const selectedStats=equipmentStats(item,copy);
 const equippedStats=previous&&previousCopy?equipmentStats(previous,previousCopy):null;
 const gearStats=(stats:ReturnType<typeof equipmentStats>)=><dl className={s.gearStats}>
  {[stats.main,...stats.substats].map((stat,index)=><div key={`${index===0?"primary":"substat"}-${stat.key}`}>
   <dt><EquipmentStatIcon name={stat.key}/>{BATTLE_STAT_LABELS[stat.key]}{index===0&&<small>Primary</small>}</dt>
   <dd>+{stat.value}</dd>
  </div>)}
 </dl>;
 if(confirmation){
  const incomingSet=comparison?.sets.after.find(set=>set.id===selectedStats.setId);
  const gained=sets.filter(({before,after})=>after.activations>before.activations);
  const outgoingSet=comparison?.sets.current.find(set=>set.id===equippedStats?.setId);
  return <GameDialog fullScreen title={title} onClose={onClose}>
   <main className={`${s.shell} ${s.swapShell}`}>
    <section className={`${s.book} ${s.swap}`} data-gear-swap>
     <header className={s.heading}><div><strong className={s.forgeTitle}>Iona’s Forge</strong><h2>Confirm equipment</h2>{participant&&<p>Review {participant.displayName}’s {item.equipmentSlot?EQUIPMENT_SLOT_LABELS[item.equipmentSlot].toLowerCase():'equipment'} swap.</p>}</div><button aria-label="Close Confirm equipment" onClick={onClose}><ForgeIcon name="close"/></button></header>
     <div className={s.swapContent} tabIndex={0} role="region" aria-label="Gear swap details"
      onPointerDown={event=>{
       const area=event.currentTarget;
       if(event.pointerType!=='mouse'||event.button!==0||area.scrollHeight<=area.clientHeight||event.clientX>=area.getBoundingClientRect().left+area.clientWidth)return;
       drag.current={id:event.pointerId,y:event.clientY,top:area.scrollTop};
       area.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event=>{
       const start=drag.current;
       if(start?.id===event.pointerId)event.currentTarget.scrollTop=start.top+start.y-event.clientY;
      }}
      onLostPointerCapture={()=>{drag.current=null;}}>
      {participant&&<div className={s.swapRecipient}>{portrait(participant)}</div>}
      <div className={s.swapPair} aria-label="Item stats">
       <article>
        <h3>Outgoing <small>· To inventory</small></h3>
        {previous&&previousCopy&&equippedStats?<><UpgradeItemArt art={previous.iconPath} stats={equippedStats} slot={previous.equipmentSlot}/><strong>{previous.name} +{previousCopy.level}</strong><p>{outgoingSet?outgoingSet.name+' set':'No set'}</p><h4>Item stats</h4>{gearStats(equippedStats)}</>:<p>Empty slot</p>}
       </article>
       <b className={s.arrow} aria-hidden="true">→</b>
       <article>
        <h3>Incoming <small>· Equip</small></h3><UpgradeItemArt art={item.iconPath} stats={selectedStats} slot={item.equipmentSlot}/>
        <strong>{item.name} +{copy.level}</strong>
        <p>{incomingSet?incomingSet.name+' set':'No set'}</p><h4>Item stats</h4>{gearStats(selectedStats)}
       </article>
      </div>
      {lost.map(({before,after})=><p key={before.id} className={s.swapWarning} role="status"><img src={`/images/ui/forge-slate-v2/sets/sculpted/${before.id}.webp`} alt=""/><span><strong>Set bonus lost · {before.name}</strong> {before.count}/{before.required} → {after.count}/{after.required}</span></p>)}
      {gained.map(({before,after})=><p key={after.id} className={s.swapGain} role="status"><img src={`/images/ui/forge-slate-v2/sets/sculpted/${after.id}.webp`} alt=""/><span><strong>Set bonus gained · {after.name}</strong> {before.count}/{before.required} → {after.count}/{after.required}<br/><small>{after.description}</small></span></p>)}
      {incomingSet&&<p className={s.swapSet}><strong>{incomingSet.name} after equipping</strong> · {incomingSet.count}/{incomingSet.required} · {incomingSet.activations?`${incomingSet.activations} active ${incomingSet.activations===1?'bonus':'bonuses'}`:'No active bonus'}<br/><small>{incomingSet.description}</small></p>}
      <section className={s.swapStats} aria-label="Creature battle stats">
       <h3>{participant?.displayName??'Creature'} · Battle stats</h3>
       <table><thead><tr><th scope="col">Stat</th><th scope="col">Current</th><th scope="col">After</th><th scope="col">Change</th></tr></thead>
       <tbody>{allRows.map(row=><tr key={row.key}><th scope="row"><EquipmentStatIcon name={row.key}/>{row.label}</th><td>{row.current}</td><td>{row.after}</td><td data-delta={Math.sign(row.delta)}>{row.delta>0?'+':''}{row.delta}</td></tr>)}</tbody></table>
      </section>
      {blocker&&<p className={s.warning}>{blocker}</p>}
     </div>
     <footer><button onClick={onClose}>Cancel</button><button disabled={!!blocker||confirmDisabled} onClick={onConfirm}>Confirm equip</button></footer>
    </section>
   </main>
  </GameDialog>;
 }
 return <GameDialog fullScreen title={title} onClose={onClose}><main className={s.shell}><section className={s.book} data-equipment-assignment data-expanded={expanded} data-picker={!confirmation}>
 <header className={s.heading}><div>{!confirmation&&<strong className={s.forgeTitle}>Iona’s Forge</strong>}<h2>{title}</h2><p>{copy.owner&&copy.owner!==creature?.creatureId?`Equipped by ${save.creatures?.find(c=>c.creatureId===copy.owner)?.nickname??'another creature'} · Review both creatures before transferring.`:confirmation?'Equip this item on the selected creature?':'Select a creature to preview this equipment.'}</p></div><button aria-label={`Close ${title}`} onClick={onClose}><ForgeIcon name="close"/></button></header>
 {(mobile||!confirmation)&&<nav className={s.tabs} aria-label="Equipment review sections">{(mobile?(['creature','equipment','changes'] as const):(['equipment','changes'] as const)).map(t=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t==='creature'?'Creature':t==='equipment'?'Equipment':'Changes'}</button>)}</nav>}
 <div className={s.layout}>
 <section className={s.roster} hidden={mobile&&tab!=='creature'} aria-label="Creature roster">
 {!confirmation&&<h3 className={s.pageTitle}>Companions</h3>}{confirmation?participant&&<div className={s.recipient}>{portrait(participant)}<p>{EQUIPMENT_SLOT_LABELS[item.equipmentSlot!]} slot</p></div>:<><input aria-label="Search creatures" placeholder="Search creatures…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/><div className={s.candidates}>{candidates.slice(index*rosterCapacity,(index+1)*rosterCapacity).map(p=>{const reason=entry?equipmentRecipientBlocker(save,entry,p.participantId):'Equipment unavailable';return <div key={p.participantId}><button className={s.portrait} aria-pressed={p.participantId===creature?.creatureId} disabled={!!reason} onClick={()=>{onSelect(p.participantId);setExpanded(false);setStatPage(0);}}>{portrait(p)}</button>{reason&&<small>{reason}</small>}</div>;})}{!candidates.length&&<p>No creatures match.</p>}</div>{pages>1&&<nav className={s.pager} aria-label="Creature pages"><button aria-label="Previous creatures" disabled={!index} onClick={()=>setPage(index-1)}>‹</button><span>{index+1} / {pages}</span><button aria-label="Next creatures" disabled={index+1>=pages} onClick={()=>setPage(index+1)}>›</button></nav>}</>}
 </section>
 <section className={s.gearPanel} hidden={(mobile||!confirmation)&&tab!=='equipment'} aria-label="Equipment replacement">{!confirmation&&<><h3 className={s.pageTitle}>Equipment Ledger</h3><div className={s.itemIntro}><img src={item.iconPath} alt=""/><div><h3>{item.name}</h3><p>{item.description}</p></div></div></>}<div className={s.gearPair}><article><h3>Current gear{!confirmation&&participant&&<small className={s.currentOwner}>({participant.displayName})</small>}</h3>{previous&&previousCopy?<><UpgradeItemArt art={previous.iconPath} stats={equipmentStats(previous,previousCopy)} slot={previous.equipmentSlot}/><h3>{previous.name}</h3><p>{EQUIPMENT_SLOT_LABELS[previous.equipmentSlot!]} · {equipmentStats(previous,previousCopy).rarity} · +{previousCopy.level}</p>{!confirmation&&equippedStats&&gearStats(equippedStats)}</>:<p className={s.empty}>Empty slot</p>}</article><b className={s.arrow}>→</b><article><h3>Selected gear</h3><UpgradeItemArt art={item.iconPath} stats={equipmentStats(item,copy)} slot={item.equipmentSlot}/><h3>{item.name}</h3><p>{EQUIPMENT_SLOT_LABELS[item.equipmentSlot!]} · {equipmentStats(item,copy).rarity} · +{copy.level}</p>{!confirmation&&gearStats(selectedStats)}</article></div><p className={s.inventory}><EquipmentStatIcon name="inventory"/>{previous?`${previous.name} returns to inventory with its upgrades intact.`:'Equips into an empty slot.'}</p>{!confirmation&&participant&&<div className={s.selectedRecipient}>{portraitImage(participant)}<div><small>Selected creature</small><strong>{participant.displayName}</strong></div></div>}</section>
 <section className={s.impact} hidden={(mobile||!confirmation)&&tab!=='changes'} aria-label="Equipment changes"><div className={s.statHeading}><h3>Total battle stats</h3>{rows.length>3&&<button aria-expanded={expanded} aria-controls="equip-battle-changes" onClick={()=>{setExpanded(!expanded);setStatPage(0);}}>{expanded?'Minimize stats':`View all ${rows.length} changes`}</button>}</div><p className={s.summary}>{rows.filter(r=>r.delta>0).length} increases · {rows.filter(r=>r.delta<0).length} decreases · Item and set bonuses included</p>
 <table id="equip-battle-changes"><thead><tr><th>Stat</th><th>Current</th><th>After</th><th>Change</th></tr></thead><tbody>{rows.slice(statIndex*statCapacity,(statIndex+1)*statCapacity).map(r=><tr key={r.key}><th><EquipmentStatIcon name={r.key}/>{r.label}</th><td>{r.current}</td><td>{r.after}</td><td data-delta={Math.sign(r.delta)}>{r.delta>0?'+':''}{r.delta}</td></tr>)}</tbody></table>{!rows.length&&<p>No battle stat changes.</p>}
 {expanded&&statPages>1&&<nav className={s.pager} aria-label="Battle stat pages"><button aria-label="Previous stat changes" disabled={!statIndex} onClick={()=>setStatPage(statIndex-1)}>‹</button><span>{statIndex+1} / {statPages}</span><button aria-label="Next stat changes" disabled={statIndex+1>=statPages} onClick={()=>setStatPage(statIndex+1)}>›</button></nav>}
 {lost.length>0&&<p className={s.warning} role="status">{lost.map(c=>`${c.before.name} bonus will be lost (${c.before.activations} → ${c.after.activations} active groups).`).join(' ')}</p>}
 {!expanded&&<section className={s.sets} aria-label="Set changes"><h3>Set changes</h3>{sets.map(({before,after})=><div key={before.id}><img src={`/images/ui/forge-slate-v2/sets/sculpted/${before.id}.webp`} alt=""/><span><strong>{before.name} {before.count}/{before.required} → {after.count}/{after.required}</strong><small>{after.activations<before.activations?'Bonus lost':after.activations>before.activations?'Bonus gained':after.activations?'Active':'Incomplete set'} · {before.description}</small></span></div>)}{!sets.length&&<p>No set counts change.</p>}</section>}
 </section></div>
 {blocker&&<p className={s.warning}>{blocker}</p>}
 <footer><button onClick={onClose}>Cancel</button><span>{participant?.displayName??'No creature selected'} · No Gold cost</span><button disabled={!!blocker||(confirmation&&confirmDisabled)} onClick={confirmation?onConfirm:onReview}><EquipmentStatIcon name="equip"/>{confirmation?'Confirm equip':copy.owner?'Review transfer':'Review equip'}</button></footer>
 </section></main></GameDialog>;
}
