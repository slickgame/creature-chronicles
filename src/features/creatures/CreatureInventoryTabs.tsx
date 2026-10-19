"use client";

import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {BREEDING_SUPPORT_ITEMS, ENERGY_SNACK_RESTORE, ENERGY_MEAL_RESTORE, AFFECTION_TREAT_GAIN, getBreedingSupportItem, getBreedingSupportItemCount} from '@/data/breedingItems';
import {creatureSupplyChanges, getCreatureSupplyQuote, type CreatureSupplyQuote, type SupplyChange} from '@/data/creatureSupplyUse';
import {GameDialog} from '@/features/ui/GameDialog';
import {useGameContext} from '@/state/GameProvider';
import type {CreatureRecord} from '@/types/creature';
import type {BreedingSupportItemId} from '@/types/items';
import s from './CreatureInventoryTabs.module.css';

const ROOT='/images/ui/creature-inventory-a';
const supplyItems=BREEDING_SUPPORT_ITEMS.filter(i=>['Energy','Care'].includes(i.category)&&['creature','player-or-creature'].includes(i.target));
const icons={energy:'/images/ui/creature-overview-a-v2/sculpted/energy.webp',heart:'/images/ui/creature-overview-a-v2/sculpted/heart.webp',stock:ROOT+'/art/stock.webp',recovery:'/images/ui/care-b/icons/recovering.webp'};
const summaries:Partial<Record<BreedingSupportItemId,string>>={energy_snack:`Restores +${ENERGY_SNACK_RESTORE} Energy. Energy is capped at your creature’s maximum.`,energy_meal:`Restores +${ENERGY_MEAL_RESTORE} Energy. Energy is capped at your creature’s maximum.`,affection_treat:`Adds +${AFFECTION_TREAT_GAIN} Affection, up to 100.`,recovery_balm:'Restores 1 Heart and shortens an active injury by 1 day. At least one effect must apply.'};
function ItemArt({id}:{id:BreedingSupportItemId}) {return <img className={s.itemArt} src={ROOT+'/art/'+id+'.webp'} alt=""/>;}
function Changes({rows,saved=false}:{rows:SupplyChange[];saved?:boolean}) {
  return <dl className={s.changes} aria-label={saved?'Before and saved result':'Item effect preview'}>{rows.map(row=><div key={row.label}><dt><img src={icons[row.icon]} alt=""/>{row.label}</dt><dd><span>{row.before}</span><span aria-hidden="true">→</span><strong>{row.after}</strong></dd></div>)}</dl>;
}
export function CreatureInventoryTab({creature}:{creature:CreatureRecord}) {
  const {currentSave:save,confirmCreatureSupplyReview}=useGameContext();
  const [category,setCategory]=useState('All'),[selectedId,setSelectedId]=useState<BreedingSupportItemId>('energy_snack');
  const [focused,setFocused]=useState(false),[effectPage,setEffectPage]=useState(false);
  const [page,setPage]=useState(0),[capacity,setCapacity]=useState(4),[availableHeight,setAvailableHeight]=useState(420);
  const [review,setReview]=useState<CreatureSupplyQuote|null>(null),[error,setError]=useState('');
  const [receipt,setReceipt]=useState<{name:string;itemId:BreedingSupportItemId;rows:SupplyChange[];message:string}|null>(null);
  const [details,setDetails]=useState(false);
  const gallery=useRef<HTMLDivElement>(null),busy=useRef(false),openedAt=useRef(0),receiptAt=useRef(0);
  useEffect(()=>{const element=gallery.current;if(!element)return;const observer=new ResizeObserver(entries=>{const h=entries[0].contentRect.height;setCapacity(h<285?2:4);setAvailableHeight(h);});observer.observe(element);return ()=>observer.disconnect();},[]);
  if(!save)return null;
  const target=save.creatures?.find(c=>c.creatureId===creature.creatureId);if(!target)return null;
  const rows=supplyItems.filter(i=>getBreedingSupportItemCount(save,i.itemId)>0&&(category==='All'||i.category===category));
  const item=rows.find(i=>i.itemId===selectedId)??rows[0],quote=item?getCreatureSupplyQuote(save,target.creatureId,item.itemId):null;
  const compact=availableHeight<310||Boolean(quote&&(quote.changes.length>2||!quote.canUse)&&availableHeight<390)||target.nickname.length>16&&availableHeight<375;
  const pages=Math.max(1,Math.ceil(rows.length/capacity)),currentPage=Math.min(page,pages-1);
  const selected=supplyItems.find(i=>i.itemId===review?.itemId),liveReview=review?getCreatureSupplyQuote(save,review.targetId,review.itemId):null;
  const stale=Boolean(review&&liveReview?.revision!==review.revision);
  function openReview(){if(!quote?.canUse)return;busy.current=false;openedAt.current=Date.now();setError('');setReview(quote);}
  function confirm(){
    if(!review||busy.current||Date.now()-openedAt.current<250||stale)return;busy.current=true;
    const before=save?.creatures?.find(c=>c.creatureId===review.targetId),result=confirmCreatureSupplyReview(review),after=result.save?.creatures?.find(c=>c.creatureId===review.targetId);
    if(result.ok&&before&&after&&result.save){receiptAt.current=Date.now();setReceipt({name:after.nickname,itemId:review.itemId,rows:creatureSupplyChanges(before,after,review.stock,getBreedingSupportItemCount(result.save,review.itemId),review.itemId),message:result.message});setReview(null);}else{setError(result.message);busy.current=false;}
  }
  function switchCategory(value:string){setCategory(value);setPage(0);setEffectPage(false);}
  return <section className={s.supply} data-supply-gallery data-focused={focused} data-compact={compact}>
    <header className={s.heading}><h3>Supplies</h3><div className={s.shared}><img src={ROOT+'/art/stock.webp'} alt=""/><span><strong>Shared Ranch Stock</strong><small>Items are shared across your ranch.</small></span></div><div className={s.filters} aria-label="Item categories">{['All','Energy','Care'].map(c=><button type="button" key={c} aria-pressed={category===c} onClick={()=>switchCategory(c)}>{c}</button>)}</div></header>
    <div className={s.focusTabs}><button type="button" aria-pressed={!focused} onClick={()=>setFocused(false)}>Items</button><button type="button" disabled={!item} aria-label="Selected item" aria-pressed={focused&&(!compact||!effectPage)} onClick={()=>{setFocused(true);setEffectPage(false);}}>{compact?'Item':'Selected item'}</button>{compact?<button type="button" className={s.compactEffect} aria-pressed={focused&&effectPage} onClick={()=>{setFocused(true);setEffectPage(true);}}>Effect</button>:null}</div>
    <div className={s.body} ref={gallery}>
      {item&&quote?<><div className={s.gallery}><div className={s.tiles}>{rows.slice(currentPage*capacity,(currentPage+1)*capacity).map(i=><button type="button" className={s.tile} key={i.itemId} aria-label={'Select '+i.name} aria-pressed={item.itemId===i.itemId} onClick={()=>{setSelectedId(i.itemId);setFocused(true);setEffectPage(false);}}><ItemArt id={i.itemId}/><span className={s.stock} aria-label={getBreedingSupportItemCount(save,i.itemId)+' owned'}>{getBreedingSupportItemCount(save,i.itemId)}</span><strong>{i.name}</strong></button>)}</div><nav className={s.pager} aria-label="Supply pages"><button type="button" disabled={!currentPage} onClick={()=>setPage(currentPage-1)}>Previous</button><span>{currentPage+1} / {pages}</span><button type="button" disabled={currentPage+1>=pages} onClick={()=>setPage(currentPage+1)}>Next</button></nav></div>
      <article className={s.inspector} aria-label="Selected supply" data-effect-page={effectPage}>
        <div className={s.detailTabs}><button type="button" aria-pressed={!effectPage} onClick={()=>setEffectPage(false)}>Item</button><button type="button" aria-pressed={effectPage} onClick={()=>setEffectPage(true)}>Effect</button></div>
        <div className={s.supplyIllustration}><ItemArt id={item.itemId}/></div><div className={s.identity}><h4>{item.name}</h4><span className={s.category}><img src={icons[item.category==='Energy'?'energy':'heart']} alt=""/>{item.category}</span><p className={s.owned}>Owned: <strong>{quote.stock}</strong></p><p className={s.description}>{summaries[item.itemId]??item.exactEffect}</p></div>
        <div className={s.effect}><h5>Effect on {target.nickname}</h5><Changes rows={quote.changes}/></div><p className={s.blocker} role="status">{quote.canUse||compact&&effectPage?'':quote.message.startsWith(target.nickname+' ')?quote.message.slice(target.nickname.length+1):quote.message}</p>
        <div className={s.inspectorFooter}><button type="button" className={s.detailLink} onClick={()=>setDetails(true)}>Item details</button><button type="button" data-primary disabled={!quote.canUse} onClick={openReview}>Review use <img src={ROOT+'/art/chevron.webp'} alt=""/></button></div>
      </article></>:<div className={s.empty}><img src={ROOT+'/art/stock.webp'} alt=""/><h4>No supplies in this category</h4><p>Owned Energy and Care items appear here. Stock is shared across the ranch.</p><button type="button" onClick={()=>switchCategory('All')}>Show all supplies</button></div>}
    </div>
    {typeof document!=='undefined'&&review&&selected?createPortal(<GameDialog title={'Use '+selected.name+'?'} onClose={()=>setReview(null)}><div className={s.window} data-supply-review><div className={s.reviewIdentity}><ItemArt id={selected.itemId}/><div><h3>{selected.name}</h3><p>For <strong>{review.targetName}</strong></p><small>Consumes one from shared ranch stock.</small></div></div><Changes rows={review.changes}/><p>No Gold charge.</p>{stale||error?<p role="alert" className={s.alert}>{error||'The creature or stock changed. Cancel and review the item again.'}</p>:null}<footer><button type="button" data-initial-focus onClick={()=>setReview(null)}>Cancel</button><button type="button" data-primary disabled={stale||!liveReview?.canUse||!!error} onClick={confirm}>Confirm item use</button></footer></div></GameDialog>,document.body):null}
    {typeof document!=='undefined'&&receipt?createPortal(<GameDialog title="Item used" onClose={()=>setReceipt(null)}><div className={s.window} data-supply-receipt><div className={s.reviewIdentity}><ItemArt id={receipt.itemId}/><div><h3>{getBreedingSupportItem(receipt.itemId)?.name}</h3><p>Used on <strong>{receipt.name}</strong></p><small>Before → Saved</small></div></div><Changes rows={receipt.rows} saved/><p role="status">{receipt.message}</p><p>Result saved. No Gold charged.</p><footer><button type="button" data-primary onClick={()=>{if(Date.now()-receiptAt.current>=250)setReceipt(null);}}>Continue</button></footer></div></GameDialog>,document.body):null}
    {typeof document!=='undefined'&&details&&item&&quote?createPortal(<GameDialog title="Supply details" onClose={()=>setDetails(false)}><div className={s.window} data-supply-details><div className={s.reviewIdentity}><ItemArt id={item.itemId}/><div><h3>{item.name}</h3><p>{item.category} · {item.rarity} · {quote.stock} owned</p></div></div><p>{item.exactEffect}</p><p>{quote.message}</p><footer><button type="button" onClick={()=>setDetails(false)}>Back to supplies</button></footer></div></GameDialog>,document.body):null}
  </section>;
}
export {CreatureEquipmentLedger as CreatureEquipmentTab} from './CreatureEquipmentLedger';
