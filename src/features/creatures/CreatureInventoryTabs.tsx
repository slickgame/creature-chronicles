"use client";

import { useRef, useState } from "react";
import { BREEDING_SUPPORT_ITEMS, getBreedingSupportItemCount, useBreedingSupportItem as applySupportItem } from "@/data/breedingItems";
import { BATTLE_OUTFITTER_ITEMS, EQUIPMENT_SLOTS, EQUIPMENT_SLOT_LABELS, type EquipmentSlot } from "@/data/battleOutfitter";
import { getEquipmentCopies } from "@/data/equipmentInstances";
import { BATTLE_STAT_LABELS, getEquippedBattleStats } from "@/data/equipmentComparison";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import { DetailButton } from "@/features/ui/DetailButton";
import { equipmentStats, type EquipmentCopy } from "@/data/equipmentEnhancement";
import type { BattleOutfitterItem } from "@/data/battleOutfitter";
import { EquipmentGallery } from '@/features/equipment/EquipmentGallery';
import { BreedingPreviewBook } from '@/features/breeding/BreedingPreviewBook';
import { GameDialog } from "@/features/ui/GameDialog";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import s from "./CreatureInventoryTabs.module.css";

function gearHint(item: BattleOutfitterItem, copy: EquipmentCopy) {
  const stats = equipmentStats(item, copy);
  return `${item.name} +${stats.level} · ${stats.rarity} · Power ${stats.powerGrade}\nMain: ${BATTLE_STAT_LABELS[stats.main.key]} +${stats.main.value}\n${stats.substats.map(stat => `${BATTLE_STAT_LABELS[stat.key]} +${stat.value}`).join(" · ") || "No substats yet"}${stats.passive ? `\n${stats.passive}` : ""}\nSelect for full details and comparison.`;
}

function ItemArt({src, name}: {src:string; name:string}) {
  const [failed,setFailed]=useState(false);
  return failed ? <span className={s.fallback} aria-label={name}>✦</span> : <img src={src} alt="" onError={()=>setFailed(true)} />;
}
function Heading({eyebrow,title}: {eyebrow:string;title:string}) {
  return <header className={s.heading}><small>{eyebrow}</small><h3>{title}</h3></header>;
}

export function CreatureInventoryTab({creature}: {creature:CreatureRecord}) {
  const {currentSave:save,saveCurrentGame}=useGameContext();
  const [category,setCategory]=useState("All");
  const [selectedId,setSelectedId]=useState("");
  const [review,setReview]=useState(false);
  const [itemOpen,setItemOpen]=useState(false);
  const [message,setMessage]=useState("");
  const busy=useRef(false);
  if(!save)return null;
  const rows=BREEDING_SUPPORT_ITEMS.filter(item=>getBreedingSupportItemCount(save,item.itemId)>0&&(item.target==="creature"||item.target==="player-or-creature")&&(category==="All"||item.category===category));
  const item=rows.find(i=>i.itemId===selectedId)??rows[0];
  const stock=item?getBreedingSupportItemCount(save,item.itemId):0;
  const preview=item?applySupportItem(save,item.itemId,{source:"inventory",targetId:creature.creatureId}):null;
  const after=preview?.save.creatures?.find(c=>c.creatureId===creature.creatureId);
  const unavailable=getTrainingUnavailableReason(save,creature.creatureId);
  function confirm() {
    if(!save||!item||busy.current||unavailable)return;
    busy.current=true;
    const result=applySupportItem(save,item.itemId,{source:"inventory",targetId:creature.creatureId});
    if(result.ok)saveCurrentGame(result.save);
    setMessage(result.message);setReview(false);setItemOpen(false);
  }
  const changes=after&&preview?.ok?<dl className={s.changes}>
    <div><dt>Energy</dt><dd>{creature.energy} → {after.energy} / {creature.maxEnergy}</dd></div>
    <div><dt>Affection</dt><dd>{creature.affection} → {after.affection} / 100</dd></div>
    <div><dt>Hearts</dt><dd>{creature.hearts} → {after.hearts} / {creature.maxHearts}</dd></div>
    {creature.injuredUntilDayNumber!==after.injuredUntilDayNumber?<div><dt>Injury recovery</dt><dd>{after.injuredUntilDayNumber ? `Through day ${after.injuredUntilDayNumber}` : "Cleared"}</dd></div>:null}
  </dl>:null;
  return <section className={s.page}>
    <Heading eyebrow="Shared ranch supplies" title={`Inventory · ${creature.nickname}`} />
    <p>Select an item to review its effect. Stock is shared across the ranch.</p>
    <div className={s.filters} aria-label="Item categories">{["All","Energy","Care"].map(c=><button key={c} aria-pressed={category===c} onClick={()=>{setCategory(c);setSelectedId("");setMessage("");}}>{c}</button>)}</div>
    {!rows.length&&<p>No owned care items match this category.</p>}
    <div className={s.itemGrid}>{rows.map(i=><DetailButton hint={`${i.name} · ${i.rarity}\n${i.exactEffect}\n${getBreedingSupportItemCount(save,i.itemId)} owned · Shared ranch stock. Select to review use.`} key={i.itemId} className={s.itemCard} aria-pressed={item?.itemId===i.itemId} aria-label={`Select ${i.name}`} onClick={()=>{setSelectedId(i.itemId);setMessage("");setItemOpen(true);}}><ItemArt key={i.iconPath} src={i.iconPath} name={i.name}/><strong>{i.name}</strong><small>{i.category} · {i.rarity}</small><span className={s.stock}>{getBreedingSupportItemCount(save,i.itemId)} owned</span></DetailButton>)}</div>
    {itemOpen&&item?<GameDialog title={item.name} onClose={()=>setItemOpen(false)}><article className={s.detail}><h4>{item.name}</h4><p>{item.exactEffect}</p>{changes}<p className={s.note}>{preview?.ok ? `Stock after use: ${stock} → ${stock-1}. No Gold charge.` : preview?.message}</p>{unavailable?<p role="status">Away at training: {unavailable}. Collect this creature before using care items here.</p>:null}<button className={s.primary} disabled={!preview?.ok||!!unavailable} onClick={()=>{busy.current=false;setReview(true);}}>Review use on {creature.nickname}</button></article></GameDialog>:null}

    {message?<GameDialog title="Receipt" onClose={()=>setMessage("")}><p role="status">{message}</p><button onClick={()=>setMessage("")}>Continue</button></GameDialog>:null}
    {review&&item?<GameDialog title={`Use ${item.name}?`} onClose={()=>setReview(false)}><p>Target: <strong>{creature.nickname}</strong>. Consumes one {item.name} from shared stock.</p>{changes}<p>{item.exactEffect}</p><div className={s.actions}><button onClick={()=>setReview(false)}>Cancel</button><button disabled={!preview?.ok||!!unavailable} onClick={confirm}>Confirm item use</button></div></GameDialog>:null}
  </section>;
}

export function CreatureEquipmentTab({creature}: {creature:CreatureRecord}) {
 const {currentSave:save}=useGameContext();
 const [slot,setSlot]=useState<EquipmentSlot>('weapon'),[gearOpen,setGearOpen]=useState(false),[statsOpen,setStatsOpen]=useState(false);
 if(!save)return null;
 const equipped=getEquipmentCopies(save).filter(c=>c.owner===creature.creatureId),stats=getEquippedBattleStats(save,creature);
 return <section className={s.page}>
 <Heading eyebrow={`${equipped.length} / ${EQUIPMENT_SLOTS.length} slots filled`} title={`Equipment · ${creature.nickname}`} />
 <p>Select a slot to browse owned equipment. Each item retains its upgrades.</p>
 <div className={s.slots} aria-label="Creature equipment slots">{EQUIPMENT_SLOTS.map(key=>{const worn=equipped.find(c=>BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)?.equipmentSlot===key),gear=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===worn?.itemId);return <DetailButton key={key} hint={gear&&worn?gearHint(gear,worn):`${EQUIPMENT_SLOT_LABELS[key]} · Empty slot`} aria-label={`Inspect ${EQUIPMENT_SLOT_LABELS[key]} slot`} onClick={()=>{setSlot(key);setGearOpen(true);}}><small>{EQUIPMENT_SLOT_LABELS[key]}</small>{gear?<ItemArt src={gear.iconPath} name={gear.name}/>:<span className={s.emptySlot}>+</span>}<strong>{gear?.name??'Empty'}</strong><small>{worn?`+${worn.level} · Grade ${gear?.equipmentGrade}`:'No bonus'}</small></DetailButton>;})}</div>
 <DetailButton hint="Total battle stats include all six equipped slots. Existing battles retain their starting loadout." onClick={()=>setStatsOpen(true)}>Battle stats</DetailButton>
 {gearOpen&&<EquipmentGallery initialCreatureId={creature.creatureId} initialSlot={slot} onClose={()=>setGearOpen(false)}/>}
 {statsOpen&&<BreedingPreviewBook title="Equipped battle stats" marker="creature-equipment-stats" onClose={()=>setStatsOpen(false)} pages={Object.entries(stats).map(([key,value])=>({key,title:BATTLE_STAT_LABELS[key as keyof typeof stats],content:<p>{value}</p>}))}/>}
 </section>;
}
