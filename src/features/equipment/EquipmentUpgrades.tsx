"use client";
import {EquipmentActionFlow} from './EquipmentActionFlow';
import type {EquipmentActionRequest} from '@/data/equipmentAction';
import {UpgradeSuccess,type UpgradeReceipt} from './UpgradeSuccess';
import {UpgradeReview} from './UpgradeReview';
import {equipmentStats} from '@/data/equipmentEnhancement';
import { useEffect, useRef, useState } from 'react';
import {EquipmentStatIcon} from './EquipmentStatIcon';
import {ForgeIcon} from '@/features/builder/ForgeWindow';
import {EQUIPMENT_RARITIES,EQUIPMENT_SETS} from '@/data/equipmentRules';
import {EQUIPMENT_SLOT_LABELS} from '@/data/battleOutfitter';
import type {EquipmentSlot} from '@/data/battleOutfitter';
import { BATTLE_OUTFITTER_ITEMS } from '@/data/battleOutfitter';
import { getEquipmentCopies, getEnhancementQuote, enhanceEquipment } from '@/data/equipmentInstances';
import { BATTLE_STAT_LABELS } from '@/data/equipmentComparison';
import { useGameContext } from '@/state/GameProvider';
import { useNavigation } from '@/features/navigation/NavigationContext';
import { GameDialog } from '@/features/ui/GameDialog';
import { EquipmentGuide } from './EquipmentGuide';
import styles from './EquipmentUpgrades.module.css';

const slots = Object.entries(EQUIPMENT_SLOT_LABELS) as [EquipmentSlot, string][];
const equipmentItems = new Map(BATTLE_OUTFITTER_ITEMS.map(item => [item.itemId, item]));
type EquipmentSort = 'inventory' | 'name' | 'level' | 'rarity';

export function EquipmentUpgrades({onBack, embedded = false, initialEquipmentId = "", initialCreatureId = "", returnLabel = "Back"}:{onBack:()=>void;embedded?:boolean;initialEquipmentId?:string;initialCreatureId?:string;returnLabel?:string}){
 const {currentSave:save,saveCurrentGame}=useGameContext();
 const {open}=useNavigation();
 const [selectedId,setSelectedId]=useState(initialEquipmentId);
 const [creatureId,setCreatureId]=useState(initialCreatureId);
 const [page,setPage]=useState<number|null>(null);
 const [picker,setPicker]=useState(false);
 const [rarity,setRarity]=useState('');
 const [ownership,setOwnership]=useState('');
 const [setFilter,setSetFilter]=useState('');
 const [sort,setSort]=useState<EquipmentSort>('inventory');
 const [slot,setSlot]=useState<EquipmentSlot|null>(null);
 const [capacity,setCapacity]=useState(8);
 const [hoverId,setHoverId]=useState<string|null>(null);
 useEffect(()=>{const resize=()=>setCapacity(innerWidth<=700||innerHeight<=550?6:8);const frame=requestAnimationFrame(resize);const dismiss=(e:KeyboardEvent)=>{if(e.key==='Escape')setHoverId(null);};addEventListener('resize',resize);addEventListener('keydown',dismiss);return()=>{cancelAnimationFrame(frame);removeEventListener('resize',resize);removeEventListener('keydown',dismiss);};},[]);

 const [popup,setPopup]=useState<'stats'|'upgrade'|'report'|null>(null);
 const [reviewLevel,setReviewLevel]=useState(0);
 const [message,setMessage]=useState('');
 const [upgradeReceipt,setUpgradeReceipt]=useState<UpgradeReceipt|null>(null);
 const [equipmentAction,setEquipmentAction]=useState<EquipmentActionRequest|null>(null);
 const busy=useRef(false);
 if(!save)return null;
 const copies=getEquipmentCopies(save),copy=copies.find(c=>c.id===selectedId)??copies[0];
 const quote=copy?getEnhancementQuote(save,copy.id):null;
 const creature=save.creatures?.find(c=>c.creatureId===creatureId)??save.creatures?.[0];
 const owner=save.creatures?.find(c=>c.creatureId===copy?.owner);
 const entries = copies.flatMap(entry => {
  const item = equipmentItems.get(entry.itemId);
  return item ? [{entry, item, stats: equipmentStats(item, entry)}] : [];
 });
 const matching = entries.filter(({entry, item, stats}) =>
  (!slot || item.equipmentSlot === slot) &&
  (!rarity || stats.rarity === rarity) &&
  (!setFilter || (stats.setId ?? 'none') === setFilter) &&
  (!ownership || Boolean(entry.owner) === (ownership === 'equipped'))
 );
 if (sort !== 'inventory') matching.sort((a,b) => {
  if (sort === 'level') return b.entry.level - a.entry.level;
  if (sort === 'rarity') return EQUIPMENT_RARITIES.indexOf(b.stats.rarity) - EQUIPMENT_RARITIES.indexOf(a.stats.rarity);
  return a.item.name.localeCompare(b.item.name);
 });
 const pages = Math.max(1, Math.ceil(matching.length / capacity));
 const selectedPage = Math.max(0, Math.floor(matching.findIndex(({entry}) => entry.id === copy?.id) / capacity));
 const currentPage = Math.min(page ?? selectedPage, pages - 1);
 const visible = matching.slice(currentPage * capacity, (currentPage + 1) * capacity);
 const hasFilters = Boolean(slot || rarity || ownership || setFilter || sort !== 'inventory');
 function resetPage(){setPage(0);setHoverId(null);}
 function clearFilters(){setSlot(null);setRarity('');setOwnership('');setSetFilter('');setSort('inventory');setPage(null);setHoverId(null);}
 const tooltip=hoverId?copies.find(c=>c.id===hoverId):null;
 const tooltipItem=tooltip?BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===tooltip.itemId):null;
 const facts=(c:typeof copies[number])=>{const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)!;const stats=equipmentStats(item,c);return `${item.name} +${c.level} · ${EQUIPMENT_SLOT_LABELS[item.equipmentSlot!]} · ${stats.rarity} · Power ${stats.powerGrade}\n${BATTLE_STAT_LABELS[stats.main.key]} +${stats.main.value}\n${stats.substats.map(st=>`${BATTLE_STAT_LABELS[st.key]} +${st.value}`).join(' · ')||'No substats'}\n${stats.setId?EQUIPMENT_SETS[stats.setId].name+' set':'No set'} · ${c.owner?'Worn by '+(save!.creatures?.find(x=>x.creatureId===c.owner)?.nickname??'creature'):'In inventory'}\n${item.description}`;};
 const tile=(c:typeof copies[number])=>{const gear=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)!;const meta=equipmentStats(gear,c);return <><img className={styles.gear} src={gear.iconPath} alt=""/><img className={styles.frame} src={`/images/ui/forge-slate-v2/frames/item-${meta.rarity.toLowerCase()}.svg`} alt=""/><span className={styles.grade}>{meta.powerGrade}</span><span className={styles.level}>+{c.level}</span>{meta.setId&&<span className={styles.setBadge} data-equipment-set={meta.setId}><img src={`/images/ui/forge-slate-v2/sets/sculpted/${meta.setId}.webp`} alt={`${EQUIPMENT_SETS[meta.setId].name} set`}/></span>}<span className={styles.category}><img src={`/images/ui/forge-slate-v2/categories/${gear.equipmentSlot}.webp`} alt={EQUIPMENT_SLOT_LABELS[gear.equipmentSlot!]}/></span>{c.owner&&<span className={styles.worn} aria-label="Equipped">◆</span>}</>;};

 function review(){if(!copy)return;busy.current=false;setReviewLevel(copy.level);setPopup('upgrade');}
 function confirm(){
  if(!save||!quote||!copy||busy.current)return;busy.current=true;setUpgradeReceipt(null);
  const result=enhanceEquipment(save,copy.id,reviewLevel);
  let report=result.message;
  if(result.ok){const persisted=saveCurrentGame(result.save),upgraded=getEquipmentCopies(persisted).find(c=>c.id===copy.id)!;setUpgradeReceipt({name:quote.item.name,art:quote.item.iconPath,slot:quote.item.equipmentSlot,level:upgraded.level,cost:quote.cost,goalGold:Math.max(0,persisted.currencies.gold-result.save.currencies.gold),before:quote.before,after:equipmentStats(quote.item,upgraded)});const g=persisted.currencies.gold-result.save.currencies.gold,gp=persisted.currencies.guildPoints-result.save.currencies.guildPoints;if(g||gp)report+=` Goal rewards: +${g} Gold, +${gp} GP.`;}
  setMessage(report);setPopup('report');
 }
 const inventory = <div className={styles.trayContents}>
  <div className={styles.controls}>
   <label>Category<select aria-label="Category" value={slot ?? ''} onChange={event=>{setSlot((event.target.value || null) as EquipmentSlot|null);resetPage();}}><option value="">All categories</option>{slots.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
   <label>Sort<select aria-label="Sort" value={sort} onChange={event=>{setSort(event.target.value as EquipmentSort);resetPage();}}><option value="inventory">Inventory order</option><option value="name">Name A–Z</option><option value="level">Highest level</option><option value="rarity">Highest rarity</option></select></label>
   <label>Rarity<select aria-label="Rarity" value={rarity} onChange={event=>{setRarity(event.target.value);resetPage();}}><option value="">All rarities</option>{EQUIPMENT_RARITIES.map(value=><option key={value}>{value}</option>)}</select></label>
   <label>Set<select aria-label="Set" value={setFilter} onChange={event=>{setSetFilter(event.target.value);resetPage();}}><option value="">All sets</option><option value="none">No set</option>{Object.entries(EQUIPMENT_SETS).map(([key,set])=><option key={key} value={key}>{set.name}</option>)}</select></label>
   <label>Status<select aria-label="Status" value={ownership} onChange={event=>{setOwnership(event.target.value);resetPage();}}><option value="">All equipment</option><option value="inventory">In inventory</option><option value="equipped">Equipped</option></select></label>
   {hasFilters&&<button onClick={clearFilters}>Reset</button>}
  </div>
  <div className={styles.trayRow}>
   {pages>1&&<button aria-label="Previous equipment" disabled={currentPage===0} onClick={()=>{setPage(currentPage-1);setHoverId(null);}}>‹</button>}
   <div className={styles.copyList} onPointerLeave={()=>setHoverId(null)}>
    {visible.map(({entry,item})=><button className={styles.tile} key={entry.id} aria-pressed={entry.id===copy?.id} aria-label={`Select ${item.name} copy ${entry.id.replace('gear_','')} plus ${entry.level}`} aria-describedby={hoverId===entry.id?'upgrade-equipment-tooltip':undefined} onPointerEnter={event=>{if(event.pointerType==='mouse')setHoverId(entry.id);}} onFocus={()=>setHoverId(entry.id)} onBlur={()=>setHoverId(null)} onClick={()=>{setSelectedId(entry.id);setHoverId(null);setPicker(false);}}>{tile(entry)}</button>)}
    {!matching.length&&<p className={styles.empty}>{copies.length?'No equipment matches these filters.':'No equipment yet.'}</p>}
   </div>
   {pages>1&&<button aria-label="Next equipment" disabled={currentPage===pages-1} onClick={()=>{setPage(currentPage+1);setHoverId(null);}}>›</button>}
  </div>
  <p className={styles.trayCount} role="status">{matching.length} {matching.length===1?'piece':'pieces'}{pages>1&&` · Page ${currentPage+1} of ${pages}`}</p>
  {tooltip&&tooltipItem&&<div id="upgrade-equipment-tooltip" role="tooltip" className={styles.tooltip}>{facts(tooltip)}</div>}
 </div>;
 return <main className={styles.screen} data-equipment-upgrades>
 <div className={styles.composition}>
  <header className={styles.header}><button onClick={onBack}><ForgeIcon name="back"/>{returnLabel}</button><h2>Iona’s Forge</h2><div className={styles.wallet}><ForgeIcon name="coin"/>{save.currencies.gold.toLocaleString('en-US')} Gold{!embedded&&<button aria-label="Menu" data-navigation-launcher onClick={()=>open('menu')}><ForgeIcon name="menu"/></button>}</div></header>
  <div className={styles.title}><h1>Improve equipment</h1><button className={styles.openPicker} onClick={()=>{setHoverId(null);setPicker(true);}}>Your equipment{hasFilters?' · Filtered':''}</button></div>
  <div className={styles.layout}>
   <section className={styles.details} aria-label="Selected equipment">{quote&&copy?<>
    <div className={styles.item}>
     <button className={styles.showcaseArt} aria-label={`Inspect ${quote.item.name}`} onClick={()=>setPopup('stats')}><img src={quote.item.iconPath} alt=""/></button>
     <div className={styles.itemName}><h2>{quote.item.name} +{copy.level}</h2><p className={styles.rarity} data-rarity={quote.before.rarity}>{quote.before.rarity} · {EQUIPMENT_SLOT_LABELS[quote.item.equipmentSlot!]}</p><p className={styles.ownership}><EquipmentStatIcon name={copy.owner?'equip':'inventory'}/>{copy.owner?`Worn by ${owner?.nickname ?? 'creature'}`:'In inventory'}</p></div>
    </div>
    <div className={styles.statPanel}><table className={styles.stats}><thead><tr><th aria-label="Stat"/><th>Current (+{copy.level})</th><th aria-label="Change"/><th>{quote.maxed?'Maximum':`Next (+${copy.level+1})`}</th></tr></thead><tbody><tr><th><EquipmentStatIcon name={quote.before.main.key}/>{BATTLE_STAT_LABELS[quote.before.main.key]}</th><td>{quote.before.main.value}</td><td>→</td><td className={styles.gain}>{quote.after.main.value}</td></tr>{Array.from({length:4},(_,i)=>{const stat=quote.before.substats[i];return <tr key={i} className={!stat?styles.emptyRow:undefined}><th>{stat?<><EquipmentStatIcon name={stat.key}/>{BATTLE_STAT_LABELS[stat.key]}</>:'Empty substat'}</th><td>{stat?`+${stat.value}`:'—'}</td><td>→</td><td>{stat?`+${stat.value}`:'—'}</td></tr>;})}</tbody></table><p className={styles.mystery}>{quote.maxed?'Maximum improvement reached':(copy.level+1)%3===0?`${quote.before.substats.length>=4?'Random substat increase':'Mystery substat'} · Revealed after payment`:`Substats unchanged · Next ${quote.before.substats.length>=4?'random increase':'mystery'} at +${Math.ceil((copy.level+1)/3)*3}`}</p></div>
    <div className={styles.cost}><span>Improve cost <strong>{quote.maxed?'Maximum +15':`${quote.cost} Gold`}</strong></span>{!quote.maxed&&<span>{quote.canUpgrade?'Gold balance':'More Gold needed'} <strong>{quote.canUpgrade?`${save.currencies.gold.toLocaleString('en-US')} → ${(save.currencies.gold-quote.cost).toLocaleString('en-US')}`:`${quote.cost-save.currencies.gold}`}</strong></span>}</div>
   </>:<div className={styles.empty}><h2>No equipment yet</h2><p>Buy equipment at the Outfitter, craft it with Iona, or earn gear in the Coliseum.</p></div>}</section>
   <aside className={styles.inventory} aria-label="Your equipment">{!picker&&inventory}</aside>
   {quote&&copy&&<footer className={styles.footer}>
    <button onClick={()=>setEquipmentAction({kind:'equip',equipmentId:copy.id,creatureId:creature?.creatureId??''})}>{copy.owner?'Transfer':'Equip'}</button>
    {copy.owner&&<button onClick={()=>setEquipmentAction({kind:'remove',equipmentId:copy.id,creatureId:copy.owner!})}>Remove</button>}
    <button className={styles.primary} disabled={!quote.canUpgrade} onClick={review}>Improve{!quote.maxed&&<span>· {quote.cost} Gold</span>}</button>
   </footer>}
  </div>
 </div>
  {picker&&<GameDialog title="Your equipment" dialogClassName={styles.picker} onClose={()=>{setPicker(false);setHoverId(null);}}>{inventory}</GameDialog>}
  {popup==='stats'&&quote&&<EquipmentGuide item={quote.item} copy={copy} onClose={()=>setPopup(null)}/>}
  {equipmentAction&&<EquipmentActionFlow request={equipmentAction} onRecipientChange={setCreatureId} onClose={()=>setEquipmentAction(null)}/>}
  {popup==='upgrade'&&quote&&<UpgradeReview quote={quote} gold={save.currencies.gold} stale={copy?.level!==reviewLevel} onClose={()=>setPopup(null)} onConfirm={confirm}/>}
  {popup==='report'&&upgradeReceipt&&<UpgradeSuccess receipt={upgradeReceipt} gold={save.currencies.gold} onClose={()=>{setPopup(null);setUpgradeReceipt(null);}}/>}
  {popup==='report'&&!upgradeReceipt&&<GameDialog title="Equipment receipt" onClose={()=>setPopup(null)}><p role="status">{message}</p><p>Balance: {save.currencies.gold} Gold.</p><button onClick={()=>setPopup(null)}>Continue</button></GameDialog>}
 </main>;
}
