"use client";

import { useRef, useState } from "react";
import { BREEDING_SUPPORT_ITEMS, getBreedingSupportItemCount, useBreedingSupportItem as applySupportItem } from "@/data/breedingItems";
import { BATTLE_OUTFITTER_ITEMS, EQUIPMENT_SLOTS, EQUIPMENT_SLOT_LABELS, assignBattleOutfitterEquipment, removeBattleOutfitterEquipment, type EquipmentSlot } from "@/data/battleOutfitter";
import { getEquipmentCopies } from "@/data/equipmentInstances";
import { BATTLE_STAT_LABELS, compareEquipment, getEquippedBattleStats } from "@/data/equipmentComparison";
import { getColiseumC4State } from "@/data/coliseumC4";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import { EquipmentStats } from "@/features/equipment/EquipmentStats";
import { GameDialog } from "@/features/ui/GameDialog";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import s from "./CreatureInventoryTabs.module.css";

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
  const rows=BREEDING_SUPPORT_ITEMS.filter(item=>(item.target==="creature"||item.target==="player-or-creature")&&(category==="All"||item.category===category));
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
    <div className={s.itemGrid}>{rows.map(i=><button key={i.itemId} className={s.itemCard} aria-pressed={item?.itemId===i.itemId} aria-label={`Select ${i.name}`} onClick={()=>{setSelectedId(i.itemId);setMessage("");setItemOpen(true);}}><ItemArt key={i.iconPath} src={i.iconPath} name={i.name}/><strong>{i.name}</strong><small>{i.category} · {i.rarity}</small><span className={s.stock}>{getBreedingSupportItemCount(save,i.itemId)} owned</span></button>)}</div>
    {itemOpen&&item?<GameDialog title={item.name} onClose={()=>setItemOpen(false)}><article className={s.detail}><h4>{item.name}</h4><p>{item.exactEffect}</p>{changes}<p className={s.note}>{preview?.ok ? `Stock after use: ${stock} → ${stock-1}. No Gold charge.` : preview?.message}</p>{unavailable?<p role="status">Away at training: {unavailable}. Collect this creature before using care items here.</p>:null}<button className={s.primary} disabled={!preview?.ok||!!unavailable} onClick={()=>{busy.current=false;setReview(true);}}>Review use on {creature.nickname}</button></article></GameDialog>:null}

    {message?<GameDialog title="Receipt" onClose={()=>setMessage("")}><p role="status">{message}</p><button onClick={()=>setMessage("")}>Continue</button></GameDialog>:null}
    {review&&item?<GameDialog title={`Use ${item.name}?`} onClose={()=>setReview(false)}><p>Target: <strong>{creature.nickname}</strong>. Consumes one {item.name} from shared stock.</p>{changes}<p>{item.exactEffect}</p><div className={s.actions}><button onClick={()=>setReview(false)}>Cancel</button><button disabled={!preview?.ok||!!unavailable} onClick={confirm}>Confirm item use</button></div></GameDialog>:null}
  </section>;
}

export function CreatureEquipmentTab({creature}: {creature:CreatureRecord}) {
  const {currentSave:save,saveCurrentGame}=useGameContext();
  const [gearOpen,setGearOpen]=useState(false);
  const [detailOpen,setDetailOpen]=useState(false);
  const [statsOpen,setStatsOpen]=useState(false);
  const [gearPage,setGearPage]=useState(0);
  const [slot,setSlot]=useState<EquipmentSlot>("weapon");
  const [selectedId,setSelectedId]=useState("");
  const [review,setReview]=useState<"equip"|"remove"|null>(null);
  const [message,setMessage]=useState("");
  const busy=useRef(false);
  if(!save)return null;
  const copies=getEquipmentCopies(save);
  const equipped=copies.filter(c=>c.owner===creature.creatureId);
  const current=equipped.find(c=>BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)?.equipmentSlot===slot);
  const choices=copies.filter(c=>(!c.owner||c.owner===creature.creatureId)&&BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)?.equipmentSlot===slot);
  const gearPages=Math.max(1,Math.ceil(choices.length/4));
  const gearCurrentPage=Math.min(gearPage,gearPages-1);
  const categoryLabel=slot==="weapon"?"Weapons":slot==="accessory"?"Accessories":EQUIPMENT_SLOT_LABELS[slot];
  const copy=choices.find(c=>c.id===selectedId)??current??choices[0];
  const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===copy?.itemId);
  const comparison=item&&copy?compareEquipment(save,creature,item,copy.id):null;
  const stats=getEquippedBattleStats(save,creature);
  const locked=getColiseumC4State(save).activeRun?.teamCreatureIds.includes(creature.creatureId);
  const blocked=locked?"Equipment is locked for this active gauntlet run.":getTrainingUnavailableReason(save,creature.creatureId);
  function confirm() {
    if(!save||busy.current||blocked)return;
    busy.current=true;
    const result=review==="remove"?removeBattleOutfitterEquipment(save,creature.creatureId,slot):item&&copy?assignBattleOutfitterEquipment(save,creature.creatureId,item.itemId,copy.id):null;
    if(result){if(result.ok)saveCurrentGame(result.save);setMessage(result.message);}
    setReview(null);setDetailOpen(false);
  }
  const changed=comparison?.rows.filter(r=>r.delta!==0)??[];
  const comparisonTable=<table className={s.table}><caption>Battle stats · Current → After</caption><thead><tr><th>Stat</th><th>Current</th><th>After</th><th>Change</th></tr></thead><tbody>{changed.map(r=><tr key={r.key}><th>{r.label}</th><td>{r.current}</td><td>{r.after}</td><td>{r.delta>0?"+":""}{r.delta}</td></tr>)}</tbody></table>;
  return <section className={s.page}>
    <Heading eyebrow={`${equipped.length} / 5 slots filled`} title={`Equipment · ${creature.nickname}`} />
    <p>Select a slot to browse equipment. Each piece retains its upgrades.</p>
    <div className={s.slots} aria-label="Creature equipment slots">{EQUIPMENT_SLOTS.map(key=>{const worn=equipped.find(c=>BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)?.equipmentSlot===key);const gear=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===worn?.itemId);return <button key={key} aria-pressed={slot===key} aria-label={`Inspect ${EQUIPMENT_SLOT_LABELS[key]} slot`} onClick={()=>{setSlot(key);setSelectedId("");setMessage("");setGearPage(0);setGearOpen(true);}}><small>{EQUIPMENT_SLOT_LABELS[key]}</small>{gear?<ItemArt key={gear.iconPath} src={gear.iconPath} name={gear.name}/>:<span className={s.emptySlot} aria-hidden="true">+</span>}<strong>{gear?.name??"Empty"}</strong><small>{worn?`+${worn.level} · Grade ${gear?.equipmentGrade}`:"No bonus"}</small></button>;})}</div>
    <button onClick={()=>setStatsOpen(true)}>Battle stats</button>
    {gearOpen?<GameDialog title={categoryLabel} onClose={()=>setGearOpen(false)} wide><p>{choices.length} available · Gear worn by another creature must be removed first.</p>
    <div className={s.copyList}>{choices.slice(gearCurrentPage*4,gearCurrentPage*4+4).map(c=>{const gear=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)!;return <button key={c.id} aria-pressed={copy?.id===c.id} aria-label={`Select ${gear.name} +${c.level} item ${c.id}`} onClick={()=>{setSelectedId(c.id);setMessage("");setGearOpen(false);setDetailOpen(true);}}><ItemArt key={gear.iconPath} src={gear.iconPath} name={gear.name}/><span><strong>{gear.name} +{c.level}</strong><small>#{c.id.replace("gear_","")} · {c.owner?"Equipped":"In inventory"}</small></span></button>;})}</div>
    {!choices.length?<div className={s.detail}><h4>No available {EQUIPMENT_SLOT_LABELS[slot].toLowerCase()} gear</h4><p>Buy gear at the Outfitter or craft it with Iona in the Builder’s Yard. Gear worn by another creature must be removed there first.</p></div>:null}
    <div className={s.actions}><button disabled={gearCurrentPage===0} onClick={()=>setGearPage(gearCurrentPage-1)}>Previous</button><span>{gearCurrentPage+1} / {gearPages}</span><button disabled={gearCurrentPage+1>=gearPages} onClick={()=>setGearPage(gearCurrentPage+1)}>Next</button></div></GameDialog>:null}
    {detailOpen&&item&&copy?<GameDialog title={item.name} onClose={()=>setDetailOpen(false)} wide><article className={s.detail}><div className={s.featured}><ItemArt key={item.iconPath} src={item.iconPath} name={item.name}/><div><h4>{item.name} +{copy.level}</h4><p>{item.quality} · Grade {item.equipmentGrade} · #{copy.id.replace("gear_","")}</p></div></div><EquipmentStats item={item} copy={copy}/>
      {!copy.owner?<><p>Replaces {comparison?.previous?.name??"an empty slot"}. Replaced equipment returns to inventory with its upgrades.</p>{changed.length?comparisonTable:<p>No numeric battle-stat change.</p>}</>:null}
      {blocked?<p role="status">{blocked}</p>:null}<div className={s.actions}><button className={s.primary} disabled={!!blocked||!!copy.owner} onClick={()=>{busy.current=false;setReview("equip");}}>{copy.owner?"Equipped":"Review equip"}</button>{current?<button disabled={!!blocked} onClick={()=>{busy.current=false;setReview("remove");}}>Remove equipped piece</button>:null}</div>
    </article></GameDialog>:null}
    {statsOpen?<GameDialog title="Equipped battle stats" onClose={()=>setStatsOpen(false)}><dl className={s.changes}>{(Object.keys(stats) as Array<keyof typeof stats>).map(key=><div key={key}><dt>{BATTLE_STAT_LABELS[key]}</dt><dd>{stats[key]}</dd></div>)}</dl><p>Improve equipment to +15 with Iona. Existing battles retain their starting loadout.</p></GameDialog>:null}
    {message?<GameDialog title="Receipt" onClose={()=>setMessage("")}><p role="status">{message}</p><button onClick={()=>setMessage("")}>Continue</button></GameDialog>:null}
    {review?<GameDialog title={review==="equip"?"Confirm equipment":"Confirm equipment removal"} onClose={()=>setReview(null)}><p>{review==="equip"?`Equip ${item?.name} +${copy?.level} on ${creature.nickname}? Replaced gear returns to inventory.`:`Return the equipped ${EQUIPMENT_SLOT_LABELS[slot]} piece to inventory with its upgrades intact?`}</p>{review==="equip"&&changed.length?comparisonTable:null}<p>No Gold or materials consumed.</p><div className={s.actions}><button onClick={()=>setReview(null)}>Cancel</button><button disabled={!!blocked} onClick={confirm}>Confirm {review==="equip"?"equip":"removal"}</button></div></GameDialog>:null}
  </section>;
}
