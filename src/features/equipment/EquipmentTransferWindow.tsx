"use client";
import {useEffect,useRef,useState} from 'react';
import type {EquipmentChangeSnapshot} from '@/data/equipmentChangeSnapshot';
import {EQUIPMENT_SLOT_LABELS} from '@/data/battleOutfitter';
import {GameDialog} from '@/features/ui/GameDialog';
import {EquipmentStatIcon} from './EquipmentStatIcon';
import a from './EquipmentAssignment.module.css';
import s from './EquipmentTransferWindow.module.css';

const artPath='/images/ui/forge-gallery-v1';

function changedSets(snapshot:EquipmentChangeSnapshot){
 return snapshot.sets.after.flatMap(after=>{
  const before=snapshot.sets.current.find(set=>set.id===after.id);
  return before&&before.count!==after.count?[{before,after}]:[];
 }).sort((a,b)=>Math.abs(b.after.activations-b.before.activations)-Math.abs(a.after.activations-a.before.activations));
}

function ReceiptSetCard({snapshot}:{snapshot:EquipmentChangeSnapshot}){
 const sets=changedSets(snapshot);
 return <section className={s.receiptSetCard} aria-label={`${snapshot.name} set bonuses`}>
  {snapshot.portrait&&<img className={s.receiptThumbnail} src={snapshot.portrait} alt=""/>}
  <div className={s.receiptSetContent} role="region" aria-label={`${snapshot.name} set changes`} tabIndex={sets.length>1?0:undefined}>
   <h3>{snapshot.name}</h3>
   {sets.map(({before,after})=>{
    const delta=Math.sign(after.activations-before.activations);
    return <div className={s.receiptSetLine} key={after.id}>
     <span>{after.name} <strong data-delta={delta}>{delta<0?'bonus lost':delta>0?'bonus gained':after.activations?'active':'incomplete'}</strong><small>{before.count}/{before.required} → {after.count}/{after.required}</small></span>
     <img src={`${artPath}/receipt-set-${after.id}.webp`} alt=""/>
    </div>;
   })}
   {!sets.length&&<p>No set changes</p>}
  </div>
 </section>;
}

function ReviewStats({snapshot,role,saved=false}:{snapshot:EquipmentChangeSnapshot;role:string;saved?:boolean}){
 const drag=useRef<{y:number;top:number}|null>(null);
 const sets=changedSets(snapshot);
 return <section className={s.reviewStats} aria-label={`${snapshot.name} ${role} stats`}>
  <h3>{snapshot.name} <small>· {role}</small></h3>
  <div className={s.reviewScroll} role="region" aria-label={`Scroll ${role.toLowerCase()} battle stats`} tabIndex={0}
   onPointerDown={event=>{
    const area=event.currentTarget;
    if(event.pointerType!=='mouse'||event.button!==0||area.scrollHeight<=area.clientHeight||event.clientX>=area.getBoundingClientRect().left+area.clientWidth)return;
    drag.current={y:event.clientY,top:area.scrollTop};
    area.setPointerCapture(event.pointerId);
   }}
   onPointerMove={event=>{if(drag.current)event.currentTarget.scrollTop=drag.current.top+drag.current.y-event.clientY;}}
   onLostPointerCapture={()=>{drag.current=null;}}>
   <table><thead><tr><th scope="col">Battle stat</th><th scope="col">{saved?'Before':'Current'}</th><th scope="col">{saved?'Saved':'After'}</th></tr></thead>
    <tbody>{snapshot.rows.map(row=><tr key={row.key}><th scope="row"><EquipmentStatIcon name={row.key}/>{row.label}</th><td>{row.current}</td><td data-delta={Math.sign(row.delta)}>{row.after}</td></tr>)}</tbody>
   </table>
  </div>
  <div className={s.reviewSets} role="region" aria-label={`${role} set changes`} tabIndex={sets.length>1?0:undefined}>
   {sets.map(({before,after})=>{
    const delta=after.activations-before.activations;
    return <div key={after.id} data-delta={Math.sign(delta)}><img src={`/images/ui/forge-gallery-v1/receipt-set-${after.id}.webp`} alt=""/><span><strong>{after.name}</strong> {before.count}/{before.required} → {after.count}/{after.required}</span><small>{delta<0?'Bonus lost':delta>0?'Bonus gained':after.activations?'Active':'Incomplete'}</small></div>;
   })}
   {!sets.length&&<p>No set changes</p>}
  </div>
 </section>;
}

export function EquipmentTransferWindow({donor,recipient,completed=false,blocker,confirmDisabled=false,note,onClose,onConfirm}:{donor:EquipmentChangeSnapshot;recipient:EquipmentChangeSnapshot;completed?:boolean;blocker?:string|null;confirmDisabled?:boolean;note?:string;onClose:()=>void;onConfirm?:()=>void}){
 const [ready,setReady]=useState(!completed);
 const [showStats,setShowStats]=useState(false);
 useEffect(()=>{if(!completed)return;const timer=setTimeout(()=>setReady(true),250);return()=>clearTimeout(timer);},[completed]);
 const item=recipient.after??donor.before,title=completed?'Equipment transferred':'Transfer equipment?';
 if(!completed){
  const portrait=(snapshot:EquipmentChangeSnapshot)=><figure className={s.handoffPortrait}>
   {snapshot.portrait&&<img src={snapshot.portrait} alt=""/>}
   <figcaption>{snapshot.name}</figcaption>
  </figure>;
  return <GameDialog fullScreen title={title} onClose={onClose}>
   <main className={`${a.shell} ${s.reviewShell}`}>
    <section className={`${a.book} ${s.review}`} aria-label="Gear Transfer Review">
     <header><h2>Gear Transfer Review</h2><p>Move this gear from {donor.name} to {recipient.name}?</p></header>
     <div className={s.handoff}>
      {portrait(donor)}
      <div className={s.handoffItem}>
       {item&&<><img src={item.item.iconPath} alt=""/><strong>{item.item.name} +{item.copy.level}</strong></>}
      </div>
      <div className={s.handoffArrow} aria-hidden="true"/>
      {portrait(recipient)}
      <div className={s.replaced}>
       {recipient.before?<><img src={recipient.before.item.iconPath} alt=""/><span><strong>{recipient.before.item.name} +{recipient.before.copy.level}</strong><small>Returns to inventory</small></span></>:<small>Equips into an empty {EQUIPMENT_SLOT_LABELS[recipient.slot]} slot</small>}
      </div>
     </div>
     <div className={s.reviewColumns}><ReviewStats snapshot={donor} role="Current wearer"/><ReviewStats snapshot={recipient} role="Recipient"/></div>
     {(blocker||note)&&<p className={s.reviewMessage} role={blocker?'alert':undefined}>{blocker??note}</p>}
     <footer><button onClick={onClose}>Cancel</button><button disabled={!!blocker||confirmDisabled} onClick={onConfirm}>Confirm transfer</button></footer>
    </section>
   </main>
  </GameDialog>;
 }
 return <GameDialog fullScreen title={title} onClose={onClose}>
  <main className={`${a.shell} ${s.reviewShell}`}>
   <section className={`${a.book} ${s.review} ${s.receipt}`} aria-label="Gear Transfer Receipt" data-show-stats={showStats}>
    <header>
     <img className={s.receiptCrest} src={`${artPath}/transfer-receipt-crest.webp`} alt=""/>
     <h2>Gear Transfer Receipt</h2>
     <p className={s.loadoutLabel}>New Loadout</p>
    </header>
    {showStats?<div className={s.reviewColumns}>
     <ReviewStats snapshot={donor} role="Previous wearer" saved/>
     <ReviewStats snapshot={recipient} role="Recipient" saved/>
    </div>:<>
     <div className={s.receiptHero}>
      {recipient.portrait&&<img className={s.heroPortrait} src={recipient.portrait} alt=""/>}
      <div className={s.receiptGear}>
       {item&&<><h3>{item.item.name} +{item.copy.level}</h3><img src={item.item.iconPath} alt=""/></>}
      </div>
      <p className={s.receiptOwners}>Now equipped by <strong>{recipient.name}</strong>.<small>Transferred from {donor.name}.</small></p>
     </div>
     <div className={s.receiptSets}><ReceiptSetCard snapshot={donor}/><ReceiptSetCard snapshot={recipient}/></div>
     <div className={s.receiptInventory}>
      {recipient.before?<><img src={recipient.before.item.iconPath} alt=""/><div><strong>{recipient.before.item.name} +{recipient.before.copy.level}</strong><small><EquipmentStatIcon name="inventory"/> Returned to inventory</small></div></>:<span>Equipped into an empty {EQUIPMENT_SLOT_LABELS[recipient.slot].toLowerCase()} slot.</span>}
     </div>
    </>}
    {note&&<p className={s.reviewMessage}>{note}</p>}
    <footer>
     <button type="button" aria-expanded={showStats} onClick={()=>setShowStats(value=>!value)}>{showStats?'Back to receipt':'Battle stats'}</button>
     <button type="button" disabled={!ready} onClick={onClose}>Continue</button>
    </footer>
   </section>
  </main>
 </GameDialog>;
}
