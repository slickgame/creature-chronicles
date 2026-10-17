"use client";
import {EquipmentResultWindow} from './EquipmentResultWindow';
import {getEquipmentChangeSnapshot,equipmentRemovalBlocker,type EquipmentChangeSnapshot} from '@/data/equipmentChangeSnapshot';
import {EquipmentAssignment} from './EquipmentAssignment';
import {getOwnedInventory,inventoryRecipientBlocker} from '@/data/inventoryCatalogue';
import {UpgradeSuccess,type UpgradeReceipt} from './UpgradeSuccess';
import {UpgradeReview} from './UpgradeReview';
import {equipmentStats} from '@/data/equipmentEnhancement';
import { useEffect, useRef, useState } from 'react';
import {EquipmentStatIcon} from './EquipmentStatIcon';
import {ForgeIcon} from '@/features/builder/ForgeWindow';
import {EQUIPMENT_SETS} from '@/data/equipmentRules';
import {EQUIPMENT_SLOT_LABELS} from '@/data/battleOutfitter';
import type {EquipmentSlot} from '@/data/battleOutfitter';
import { BATTLE_OUTFITTER_ITEMS, assignBattleOutfitterEquipment, removeBattleOutfitterEquipment } from '@/data/battleOutfitter';
import { getEquipmentCopies, getEnhancementQuote, enhanceEquipment } from '@/data/equipmentInstances';
import { BATTLE_STAT_LABELS, compareEquipment } from '@/data/equipmentComparison';
import { useGameContext } from '@/state/GameProvider';
import { useNavigation } from '@/features/navigation/NavigationContext';
import { GameDialog } from '@/features/ui/GameDialog';
import { EquipmentGuide } from './EquipmentGuide';
import styles from './EquipmentUpgrades.module.css';

export function EquipmentUpgrades({onBack, embedded = false, initialEquipmentId = "", initialCreatureId = "", returnLabel = "Back"}:{onBack:()=>void;embedded?:boolean;initialEquipmentId?:string;initialCreatureId?:string;returnLabel?:string}){
 const {currentSave:save,saveCurrentGame}=useGameContext();
 const {open}=useNavigation();
 const [selectedId,setSelectedId]=useState(initialEquipmentId);
 const [creatureId,setCreatureId]=useState(initialCreatureId);
 const [page,setPage]=useState(()=>save?Math.max(0,Math.floor(getEquipmentCopies(save).findIndex(c=>c.id===initialEquipmentId)/12)):0);
 const [slot,setSlot]=useState<EquipmentSlot|null>(null);
 const [capacity,setCapacity]=useState(12);
 const [hoverId,setHoverId]=useState<string|null>(null);
 useEffect(()=>{const resize=()=>setCapacity(innerHeight<=550?4:innerWidth<=700?6:12);const frame=requestAnimationFrame(resize);const dismiss=(e:KeyboardEvent)=>{if(e.key==='Escape')setHoverId(null);};addEventListener('resize',resize);addEventListener('keydown',dismiss);return()=>{cancelAnimationFrame(frame);removeEventListener('resize',resize);removeEventListener('keydown',dismiss);};},[]);

 const [popup,setPopup]=useState<'stats'|'assignment'|'upgrade'|'equip'|'remove'|'report'|null>(null);
 const [reviewLevel,setReviewLevel]=useState(0);
 const [message,setMessage]=useState('');
 const [upgradeReceipt,setUpgradeReceipt]=useState<UpgradeReceipt|null>(null);
 const [equipmentReceipt,setEquipmentReceipt]=useState<EquipmentChangeSnapshot|null>(null);
 const busy=useRef(false);
 const equipReview=useRef('');
 if(!save)return null;
 const copies=getEquipmentCopies(save),copy=copies.find(c=>c.id===selectedId)??copies[0];
 const quote=copy?getEnhancementQuote(save,copy.id):null;
 const creature=save.creatures?.find(c=>c.creatureId===creatureId)??save.creatures?.[0];
 const owner=save.creatures?.find(c=>c.creatureId===copy?.owner);
 const filtered=copies.filter(c=>!slot||BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)?.equipmentSlot===slot);
 const pages=Math.max(1,Math.ceil(filtered.length/capacity)),currentPage=Math.min(page,pages-1);
 const visible=filtered.slice(currentPage*capacity,(currentPage+1)*capacity);
 const slots=['weapon','armor','head','hands','feet','accessory'] as const;
 const tooltip=hoverId?copies.find(c=>c.id===hoverId):null;
 const tooltipItem=tooltip?BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===tooltip.itemId):null;
 const facts=(c:typeof copies[number])=>{const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)!;const stats=equipmentStats(item,c);return `${item.name} +${c.level} · ${EQUIPMENT_SLOT_LABELS[item.equipmentSlot!]} · ${stats.rarity} · Power ${stats.powerGrade}\n${BATTLE_STAT_LABELS[stats.main.key]} +${stats.main.value}\n${stats.substats.map(st=>`${BATTLE_STAT_LABELS[st.key]} +${st.value}`).join(' · ')||'No substats'}\n${stats.setId?EQUIPMENT_SETS[stats.setId].name+' set':'No set'} · ${c.owner?'Worn by '+(save!.creatures?.find(x=>x.creatureId===c.owner)?.nickname??'creature'):'In inventory'}\n${item.description}`;};
 const tile=(c:typeof copies[number])=>{const gear=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)!;const meta=equipmentStats(gear,c);return <><img className={styles.gear} src={gear.iconPath} alt=""/><img className={styles.frame} src={`/images/ui/forge-slate-v2/frames/item-${meta.rarity.toLowerCase()}.svg`} alt=""/><span className={styles.grade}>{meta.powerGrade}</span><span className={styles.level}>+{c.level}</span>{meta.setId&&<span className={styles.setBadge} data-equipment-set={meta.setId}><img src={`/images/ui/forge-slate-v2/sets/sculpted/${meta.setId}.webp`} alt={`${EQUIPMENT_SETS[meta.setId].name} set`}/></span>}<span className={styles.category}><img src={`/images/ui/forge-slate-v2/categories/${gear.equipmentSlot}.webp`} alt={EQUIPMENT_SLOT_LABELS[gear.equipmentSlot!]}/></span>{c.owner&&<span className={styles.worn} aria-label="Equipped">◆</span>}</>;};

 const equipFingerprint=copy&&creature&&quote?JSON.stringify({copy,comparison:compareEquipment(save,creature,quote.item,copy.id),creature:creature.creatureId}):'';
 const removal=quote&&owner?removeBattleOutfitterEquipment(save,owner.creatureId,quote.item.equipmentSlot!):null;
 const removalSnapshot=quote&&owner&&removal?.ok?getEquipmentChangeSnapshot(save,removal.save,owner.creatureId,quote.item.equipmentSlot!,'remove'):null;
 const removalBlock=owner?equipmentRemovalBlocker(save,owner.creatureId):'This equipment is no longer worn.';
 function review(kind:'upgrade'|'equip'|'remove'){if(!copy)return;busy.current=false;setReviewLevel(copy.level);if(kind==='equip'||kind==='remove')equipReview.current=kind==='equip'?equipFingerprint:JSON.stringify(removalSnapshot);setPopup(kind);}
 function confirm(){
  if(!save||!quote||!copy||busy.current)return;busy.current=true;setUpgradeReceipt(null);setEquipmentReceipt(null);
  if(popup==='equip'&&equipReview.current!==equipFingerprint){setMessage('Equipment or creature stats changed. Review this piece again before equipping.');setPopup('report');return;}
  if(popup==='remove'&&(equipReview.current!==JSON.stringify(removalSnapshot)||removalBlock)){setMessage(removalBlock??'Equipment changed. Review removal again.');setPopup('report');return;}
  const entry=getOwnedInventory(save).find(e=>e.id===copy.id);
  const restriction=popup==='equip'&&creature?(entry?inventoryRecipientBlocker(save,entry,creature.creatureId):'This equipment is no longer available.'):null;
  if(restriction){setMessage(restriction);setPopup('report');return;}
  const result=popup==='upgrade'?enhanceEquipment(save,copy.id,reviewLevel):popup==='equip'&&creature?assignBattleOutfitterEquipment(save,creature.creatureId,quote.item.itemId,copy.id):popup==='remove'&&owner?removeBattleOutfitterEquipment(save,owner.creatureId,quote.item.equipmentSlot!):{save,ok:false,message:'Select an available copy and creature again.'};
  let report=result.message;
  if(result.ok){const persisted=saveCurrentGame(result.save);if((popup==='equip'&&creature)||(popup==='remove'&&owner))setEquipmentReceipt(getEquipmentChangeSnapshot(save,persisted,popup==='equip'?creature!.creatureId:owner!.creatureId,quote.item.equipmentSlot!,popup==='equip'?'equip':'remove'));if(popup==='upgrade'){const upgraded=getEquipmentCopies(persisted).find(c=>c.id===copy.id)!;setUpgradeReceipt({name:quote.item.name,art:quote.item.iconPath,slot:quote.item.equipmentSlot,level:upgraded.level,cost:quote.cost,before:quote.before,after:equipmentStats(quote.item,upgraded)});}const g=persisted.currencies.gold-result.save.currencies.gold,gp=persisted.currencies.guildPoints-result.save.currencies.guildPoints;if(g||gp)report+=` Goal rewards: +${g} Gold, +${gp} GP.`;}
  setMessage(report);setPopup('report');
 }
 return <main className={styles.screen} data-equipment-upgrades>
 <div className={styles.composition}>
  <header className={styles.header}><button onClick={onBack}><ForgeIcon name="back"/>{returnLabel}</button><div className={styles.brand}><img src="/images/ui/blacksmith-v1/iona.webp" alt="Iona Flint"/><div><h2>Iona’s Forge</h2><small>Master Blacksmith</small></div></div><div className={styles.wallet}><ForgeIcon name="coin"/>{save.currencies.gold.toLocaleString('en-US')}{!embedded&&<button aria-label="Menu" data-navigation-launcher onClick={()=>open('menu')}><ForgeIcon name="menu"/></button>}</div></header>
  <div className={styles.title}><nav aria-label="Forge activity"><button onClick={onBack}><ForgeIcon name="craft"/>{returnLabel==='Back to forge'?'Craft':returnLabel}</button><button aria-current="page"><ForgeIcon name="upgrade"/>Improve</button></nav><h1>Improve equipment</h1></div>
  <div className={styles.layout}>
   <aside className={styles.inventory} aria-label="Your equipment"><header className={styles.inventoryHeading}><h2>Your equipment</h2><span>{filtered.length} pieces</span></header><nav className={styles.filters} aria-label="Equipment category"><button aria-pressed={!slot} onClick={()=>{setSlot(null);setPage(0);setHoverId(null);}}>All</button>{slots.map(key=><button key={key} aria-label={EQUIPMENT_SLOT_LABELS[key]} aria-pressed={slot===key} onClick={()=>{setSlot(key);setPage(0);setHoverId(null);}}><img src={`/images/ui/forge-slate-v2/categories/${key}.webp`} alt=""/></button>)}</nav>
   <div className={styles.copyList} onPointerLeave={()=>setHoverId(null)}>{visible.map(c=>{const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)!;return <button className={styles.tile} key={c.id} aria-pressed={c.id===copy?.id} aria-label={`Select ${item.name} copy ${c.id.replace('gear_','')} plus ${c.level}`} aria-describedby={hoverId===c.id?'upgrade-equipment-tooltip':undefined} onPointerEnter={e=>{if(e.pointerType==='mouse')setHoverId(c.id);}} onFocus={()=>setHoverId(c.id)} onBlur={()=>setHoverId(null)} onClick={()=>{setSelectedId(c.id);setHoverId(null);}}>{tile(c)}</button>;})}{!filtered.length&&<p className={styles.empty}>No equipment in this category.</p>}</div>
   {tooltip&&tooltipItem&&<div id="upgrade-equipment-tooltip" role="tooltip" className={styles.tooltip}>{facts(tooltip)}</div>}
   {pages>1&&<nav className={styles.paging} aria-label="Equipment"><button aria-label="Previous equipment" disabled={currentPage===0} onClick={()=>{setPage(currentPage-1);setHoverId(null);}}>‹</button><span>{currentPage+1} / {pages}</span><button aria-label="Next equipment" disabled={currentPage+1>=pages} onClick={()=>{setPage(currentPage+1);setHoverId(null);}}>›</button></nav>}</aside>
   <section className={styles.details} aria-label="Selected equipment">{quote&&copy?<>
    <div className={styles.item}><button className={styles.selectedArt} aria-label={`Inspect ${quote.item.name}`} onClick={()=>setPopup('stats')}>{tile(copy)}</button><div className={styles.itemName}><h2>{quote.item.name} +{copy.level}</h2><p>{EQUIPMENT_SLOT_LABELS[quote.item.equipmentSlot!]} · <span data-rarity={quote.before.rarity}>{quote.before.rarity}</span></p><p className={styles.ownership}><EquipmentStatIcon name={owner?'equip':'inventory'}/>{owner?`Worn by ${owner.nickname}`:'In inventory'}</p></div><button className={styles.equip} onClick={()=>copy.owner?review('remove'):setPopup('assignment')}><EquipmentStatIcon name="equip"/>{copy.owner?'Remove':'Equip'}</button></div>
    <div className={styles.statPanel}><table className={styles.stats}><thead><tr><th aria-label="Stat"/><th>Current (+{copy.level})</th><th aria-label="Change"/><th>{quote.maxed?'Maximum':`Next (+${copy.level+1})`}</th></tr></thead><tbody><tr><th><EquipmentStatIcon name={quote.before.main.key}/>{BATTLE_STAT_LABELS[quote.before.main.key]}</th><td>{quote.before.main.value}</td><td>→</td><td className={styles.gain}>{quote.after.main.value}</td></tr>{Array.from({length:4},(_,i)=>{const stat=quote.before.substats[i];return <tr key={i} className={!stat?styles.emptyRow:undefined}><th>{stat?<><EquipmentStatIcon name={stat.key}/>{BATTLE_STAT_LABELS[stat.key]}</>:'Empty substat'}</th><td>{stat?`+${stat.value}`:'—'}</td><td>→</td><td>{stat?`+${stat.value}`:'—'}</td></tr>;})}</tbody></table><p className={styles.mystery}>{quote.maxed?'Maximum improvement reached':(copy.level+1)%3===0?`${quote.before.substats.length>=4?'Random substat increase':'Mystery substat'} · Revealed after payment`:`Substats unchanged · Next ${quote.before.substats.length>=4?'random increase':'mystery'} at +${Math.ceil((copy.level+1)/3)*3}`}</p></div>
    <footer className={styles.footer}><div className={styles.cost}><strong><ForgeIcon name="coin"/>{quote.maxed?'Maximum +15':`${quote.cost} Gold`}</strong><small>No materials required</small><small>{quote.maxed?'':quote.canUpgrade?`Balance: ${save.currencies.gold.toLocaleString('en-US')} → ${(save.currencies.gold-quote.cost).toLocaleString('en-US')}`:`Need ${quote.cost-save.currencies.gold} more Gold`}</small></div><button className={styles.primary} disabled={!quote.canUpgrade} onClick={()=>review('upgrade')}><ForgeIcon name="upgrade"/>Improve</button></footer>
   </>:<div className={styles.empty}><h2>No equipment yet</h2><p>Buy equipment at the Outfitter, craft it with Iona, or earn gear in the Coliseum.</p></div>}</section>
  </div>
 </div>
  {popup==='stats'&&quote&&<EquipmentGuide item={quote.item} copy={copy} onClose={()=>setPopup(null)}/>}
  {(popup==='assignment'||popup==='equip')&&quote&&copy&&!copy.owner&&<EquipmentAssignment key={popup} save={save} copyId={copy.id} creatureId={creature?.creatureId??''} confirmation={popup==='equip'} onSelect={setCreatureId} onClose={()=>setPopup(null)} onReview={()=>review('equip')} onConfirm={confirm}/>}
  {popup==='upgrade'&&quote&&<UpgradeReview quote={quote} gold={save.currencies.gold} stale={copy?.level!==reviewLevel} onClose={()=>setPopup(null)} onConfirm={confirm}/>}
  {popup==='remove'&&removalSnapshot&&<EquipmentResultWindow snapshot={removalSnapshot} blocker={removalBlock} onClose={()=>setPopup(null)} onConfirm={confirm}/>}
  {popup==='report'&&upgradeReceipt&&<UpgradeSuccess receipt={upgradeReceipt} gold={save.currencies.gold} onClose={()=>{setPopup(null);setUpgradeReceipt(null);}}/>}
  {popup==='report'&&equipmentReceipt&&<EquipmentResultWindow snapshot={equipmentReceipt} completed onClose={()=>{setPopup(null);setEquipmentReceipt(null);}}/>}
  {popup==='report'&&!upgradeReceipt&&!equipmentReceipt&&<GameDialog title="Equipment receipt" onClose={()=>setPopup(null)}><p role="status">{message}</p><p>Balance: {save.currencies.gold} Gold.</p><button onClick={()=>setPopup(null)}>Continue</button></GameDialog>}
 </main>;
}
