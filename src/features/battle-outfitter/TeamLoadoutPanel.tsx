"use client";
import { useState } from "react";
import { useGameContext } from "@/state/GameProvider";
import { BATTLE_OUTFITTER_ITEMS as ITEMS, EQUIPMENT_SLOTS, EQUIPMENT_SLOT_LABELS, getEquipmentSlots, getBattleOutfitterStock, getBattleOutfitterCostLabel, equipmentQualityLabel, assignBattleOutfitterEquipment, removeBattleOutfitterEquipment, purchaseBattleOutfitterItem, type EquipmentSlot, type BattleOutfitterItemId } from "@/data/battleOutfitter";
import { compareEquipment } from "@/data/equipmentComparison";
import type { CreatureRecord } from "@/types/creature";
import s from "./TeamLoadoutPanel.module.css";

export function TeamLoadoutPanel({creature, blocked}: {creature:CreatureRecord; blocked?:string|null}) {
  const {currentSave:save,saveCurrentGame}=useGameContext();
  const [slot,setSlot]=useState<EquipmentSlot>("weapon");
  const [selection,setSelection]=useState<BattleOutfitterItemId|null>(null);
  const [owned,setOwned]=useState(true);
  const [message,setMessage]=useState("");
  const [confirm,setConfirm]=useState<"buy"|"equip"|"remove"|null>(null);
  if(!save)return null;
  const equipment=getEquipmentSlots(save,creature.creatureId);
  const choices=ITEMS.filter(i=>i.equipmentSlot===slot&&(!owned||getBattleOutfitterStock(save,i)>0||equipment[slot]===i.itemId));
  const item=choices.find(i=>i.itemId===selection)??choices[0];
  const comparison=item?compareEquipment(save,creature,item):null;
  const equipped=ITEMS.find(i=>i.itemId===equipment[slot]);
  const purchase=item?purchaseBattleOutfitterItem(save,item.itemId):null;
  const equip=item?assignBattleOutfitterEquipment(save,creature.creatureId,item.itemId):null;
  function commit(){
    if(!save||blocked)return;
    const result=confirm==="remove"?removeBattleOutfitterEquipment(save,creature.creatureId,slot):item?confirm==="buy"?purchaseBattleOutfitterItem(save,item.itemId):assignBattleOutfitterEquipment(save,creature.creatureId,item.itemId):null;
    if(result){if(result.ok)saveCurrentGame(result.save);setMessage(result.message);}
    setConfirm(null);
  }
  return <section className={s.panel} aria-label={`${creature.nickname} equipment`}>
    <p>Gear is optional. Empty slots add no bonuses. Gear grades describe equipment quality; {creature.nickname}’s innate grades never change here.</p>
    {blocked&&<p role="status">{blocked}</p>}
    <nav className={s.slots} aria-label="Equipment slots">{EQUIPMENT_SLOTS.map(key=><button key={key} aria-pressed={slot===key} onClick={()=>{setSlot(key);setSelection(null);setConfirm(null);}}><strong>{EQUIPMENT_SLOT_LABELS[key]}</strong><small>{ITEMS.find(i=>i.itemId===equipment[key])?.name??"Empty · no bonus"}</small></button>)}</nav>
    <div className={s.tabs}><button aria-pressed={owned} onClick={()=>{setOwned(true);setConfirm(null);}}>Owned gear</button><button aria-pressed={!owned} onClick={()=>{setOwned(false);setConfirm(null);}}>Shop gear</button><span>{save.currencies.gold} Gold · {Number(save.flags.ranchMaterialsStock??0)} Materials</span></div>
    <div className={s.layout}><div className={s.options}>{choices.map(i=><button key={i.itemId} aria-pressed={item?.itemId===i.itemId} onClick={()=>{setSelection(i.itemId);setConfirm(null);}}><img src={i.iconPath} alt=""/><span><strong>{i.name}</strong><small>{equipmentQualityLabel(i)}</small><small>{equipment[slot]===i.itemId?"Equipped":"Available: "+getBattleOutfitterStock(save,i)}</small></span></button>)}{!choices.length&&<p>No owned gear for this slot. Browse Shop gear to compare options before buying.</p>}</div>
    <div>{item&&<><h3>{item.name}</h3><p>{equipmentQualityLabel(item)}</p><p>{item.effectLabel}</p><p>Replaces {comparison?.previous?.name??"empty slot"}.</p><table className={s.table}><caption>Battle numbers · Current → After</caption><tbody>{comparison?.rows.filter(r=>r.delta!==0).map(r=><tr key={r.key}><th>{r.label}</th><td>{r.current} → {r.after}</td><td>{r.delta>0?"+":""}{r.delta}</td></tr>)}</tbody></table>{comparison?.rows.every(r=>r.delta===0)&&<p>No numeric change.</p>}<p>{getBattleOutfitterCostLabel(item)}</p><div className={s.tabs}><button disabled={!!blocked||!purchase?.ok} onClick={()=>setConfirm("buy")}>Buy to inventory</button><button disabled={!!blocked||!equip?.ok} onClick={()=>setConfirm("equip")}>{equipped?.itemId===item.itemId?"Equipped":"Equip owned copy"}</button></div>{!equip?.ok&&<p>{equip?.message}</p>}{!purchase?.ok&&<p>{purchase?.message}</p>}</>}{equipped&&<button disabled={!!blocked} onClick={()=>setConfirm("remove")}>Remove {equipped.name}</button>}</div></div>
    {confirm&&<section className={s.confirm} aria-label="Review equipment action"><h3>{confirm==="buy"?"Confirm Purchase":confirm==="equip"?"Confirm Equipment":"Confirm Removal"}</h3><p>{confirm==="buy"?`${item?.name}: ${item&&getBattleOutfitterCostLabel(item)}. Adds one to inventory; equip it separately.`:confirm==="equip"?`Equip ${item?.name} on ${creature.nickname}. ${equipped?equipped.name+" returns to inventory.":"Uses one owned copy."}`:`Return ${equipped?.name} to inventory and remove its battle bonuses.`}</p><button onClick={()=>setConfirm(null)}>Cancel</button> <button disabled={!!blocked} onClick={commit}>Confirm {confirm==="buy"?"Purchase":confirm==="equip"?"Equipment":"Removal"}</button></section>}
    {message&&<p role="status">{message}</p>}
  </section>;
}
