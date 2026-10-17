"use client";
import {useState} from 'react';
import {BATTLE_OUTFITTER_ITEMS,EQUIPMENT_SLOTS,EQUIPMENT_SLOT_LABELS,type EquipmentSlot} from '@/data/battleOutfitter';
import {getEquipmentCopies} from '@/data/equipmentInstances';
import {equipmentStats} from '@/data/equipmentEnhancement';
import {BATTLE_STAT_LABELS,getEquippedBattleStats} from '@/data/equipmentComparison';
import {getBattleOutfitterCreatureEffectSummary} from '@/data/battleOutfitterIntegration';
import {equipmentRemovalBlocker} from '@/data/equipmentChangeSnapshot';
import type {EquipmentActionRequest} from '@/data/equipmentAction';
import type {CreatureRecord} from '@/types/creature';
import {useGameContext} from '@/state/GameProvider';
import {UpgradeItemArt} from '@/features/equipment/UpgradeItemArt';
import {EquipmentStatIcon} from '@/features/equipment/EquipmentStatIcon';
import {EquipmentGuide} from '@/features/equipment/EquipmentGuide';
import {EquipmentGallery} from '@/features/equipment/EquipmentGallery';
import {EquipmentActionFlow} from '@/features/equipment/EquipmentActionFlow';
import {GameDialog} from '@/features/ui/GameDialog';
import s from './CreatureEquipmentLedger.module.css';

export function CreatureEquipmentLedger({creature}:{creature:CreatureRecord}){
 const {currentSave:save}=useGameContext();
 const [slot,setSlot]=useState<EquipmentSlot>('weapon'),[gallery,setGallery]=useState(false),[battle,setBattle]=useState(false),[guide,setGuide]=useState(false),[battlePage,setBattlePage]=useState(0),[setPage,setSetPage]=useState(0);
 const [view,setView]=useState<'slots'|'item'|'sets'>('slots'),[itemView,setItemView]=useState<'overview'|'substats'>('overview');
 const [action,setAction]=useState<EquipmentActionRequest|null>(null);
 if(!save)return null;
 const equipped=getEquipmentCopies(save).filter(c=>c.owner===creature.creatureId);
 const copy=equipped.find(c=>BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)?.equipmentSlot===slot);
 const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===copy?.itemId),meta=item&&copy?equipmentStats(item,copy):null;
 const sets=(getBattleOutfitterCreatureEffectSummary(save,creature.creatureId).sets??[]).filter(p=>p.count>0),setIndex=Math.min(setPage,Math.max(0,sets.length-1)),progress=sets[setIndex];
 const stats=Object.entries(getEquippedBattleStats(save,creature)),pages=Math.ceil(stats.length/4),index=Math.min(battlePage,pages-1);
 const block=equipmentRemovalBlocker(save,creature.creatureId);
 function browse(){setGallery(true);}
 return <div className={s.ledger} data-creature-equipment-ledger data-view={view} data-item-view={itemView}>
  <header className={s.heading}><h3>Equipment · {creature.nickname}</h3><small>{equipped.length} / 6 slots filled</small></header>
  <div className={s.focusTabs} aria-label="Equipment sections">{(['slots','item','sets'] as const).map(v=><button key={v} aria-pressed={view===v} onClick={()=>setView(v)}>{v==='slots'?'Slots':v==='item'?'Selected item':'Sets'}</button>)}</div>
  <div className={s.body}>
   <div className={s.slots} aria-label="Creature equipment slots">{EQUIPMENT_SLOTS.map(key=>{const worn=equipped.find(c=>BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)?.equipmentSlot===key),gear=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===worn?.itemId);return <button key={key} aria-label={`Inspect ${EQUIPMENT_SLOT_LABELS[key]} slot`} aria-pressed={slot===key} onClick={()=>{setSlot(key);setItemView('overview');setView('item');}}><div className={s.tile}>{gear&&worn?<UpgradeItemArt art={gear.iconPath} stats={equipmentStats(gear,worn)} slot={key}/>:<div className={s.emptyTile}><img src={`/images/ui/forge-slate-v2/categories/${key}.webp`} alt=""/></div>}</div><span><strong>{EQUIPMENT_SLOT_LABELS[key]}</strong><small>{gear?.name??'Empty slot'}</small></span><b aria-hidden="true">›</b></button>;})}</div>
   <div className={s.details} aria-label="Selected slot details">
    <div className={s.itemTabs}><button aria-pressed={itemView==='overview'} onClick={()=>setItemView('overview')}>Overview</button><button disabled={!meta} aria-pressed={itemView==='substats'} onClick={()=>setItemView('substats')}>Substats ({meta?.substats.length??0}/4)</button></div>
    {item&&copy&&meta?<>
     <div className={s.hero}><div className={s.heroArt}><UpgradeItemArt art={item.iconPath} stats={meta} slot={slot}/></div><div><h4>{item.name}</h4><p>{meta.rarity} · Power {meta.powerGrade} · +{copy.level}</p><div className={s.ownerLine}><small><EquipmentStatIcon name="equip"/>Equipped by {creature.nickname}</small><button className={s.detailLink} title="Item details and passive" onClick={()=>setGuide(true)}>Details</button></div></div></div>
     <div className={s.overview}><p className={s.main}><EquipmentStatIcon name={meta.main.key}/>{BATTLE_STAT_LABELS[meta.main.key]} <strong>+{meta.main.value}</strong></p></div>
     <div className={s.substats}><h4>Substats</h4><dl>{Array.from({length:4},(_,n)=>{const stat=meta.substats[n];return <div key={n}><dt>{stat?<><EquipmentStatIcon name={stat.key}/>{BATTLE_STAT_LABELS[stat.key]}</>:'Empty substat'}</dt><dd>{stat?`+${stat.value}`:'—'}</dd></div>;})}</dl></div>
    </>:<div className={s.empty}><img src={`/images/ui/forge-slate-v2/categories/${slot}.webp`} alt=""/><h4>{EQUIPMENT_SLOT_LABELS[slot]} · Empty slot</h4><p>Browse owned equipment to choose a piece.</p></div>}
    <div className={s.itemActions}><button className={s.primary} onClick={browse}>{copy?'Change item':'Choose item'}</button>{copy&&<button disabled={!!block} title={block??'Review removal'} onClick={()=>setAction({kind:'remove',equipmentId:copy.id,creatureId:creature.creatureId})}>Remove</button>}</div>
   </div>
  </div>
  <div className={s.sets} aria-label="Equipped sets"><div className={s.setHeading}><h4>Equipped sets</h4>{sets.length>1&&<div className={s.pager}><button aria-label="Previous equipped set" disabled={!setIndex} onClick={()=>setSetPage(setIndex-1)}>‹</button><small>{setIndex+1}/{sets.length}</small><button aria-label="Next equipped set" disabled={setIndex+1>=sets.length} onClick={()=>setSetPage(setIndex+1)}>›</button></div>}</div>{progress?<div className={s.setRow}><img src={`/images/ui/forge-slate-v2/sets/sculpted/${progress.id}.webp`} alt=""/><span><strong>{progress.name} {progress.count}/{progress.required}</strong><small>{progress.activations?`Active ×${progress.activations}`:'In progress · No set bonus active'}</small></span><p>{progress.description}</p></div>:<p>No sets equipped.</p>}</div>
  <footer className={s.footer}><button onClick={browse}><EquipmentStatIcon name="inventory"/>Browse equipment</button><button onClick={()=>{setBattlePage(0);setBattle(true);}}>Battle stats</button></footer>
  {guide&&item&&copy&&<EquipmentGuide item={item} copy={copy} onClose={()=>setGuide(false)}/>}
  {gallery&&<EquipmentGallery initialCreatureId={creature.creatureId} initialSlot={slot} onClose={()=>setGallery(false)}/>}
  {action&&<EquipmentActionFlow request={action} onClose={()=>setAction(null)}/>}
  {battle&&<GameDialog fullScreen title={`Battle stats · ${creature.nickname}`} onClose={()=>setBattle(false)}><div className={s.battle}><h3>Battle stats · {creature.nickname}</h3><p>Includes equipped items and active sets.</p><dl>{stats.slice(index*4,index*4+4).map(([key,value])=><div key={key}><dt>{BATTLE_STAT_LABELS[key as keyof typeof BATTLE_STAT_LABELS]}</dt><dd>{value}</dd></div>)}</dl><div className={s.pager}><button disabled={!index} onClick={()=>setBattlePage(index-1)}>Previous</button><span>{index+1}/{pages}</span><button disabled={index+1>=pages} onClick={()=>setBattlePage(index+1)}>Next</button></div><button onClick={()=>setBattle(false)}>Back to equipment</button></div></GameDialog>}
 </div>;
}
