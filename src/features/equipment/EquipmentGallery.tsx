"use client";
import {useEffect,useRef,useState} from 'react';
import {EQUIPMENT_RARITIES,EQUIPMENT_SETS} from '@/data/equipmentRules';
import {getBattleOutfitterCreatureEffectSummary} from '@/data/battleOutfitterIntegration';
import {useGameContext} from '@/state/GameProvider';
import {getOwnedInventory,type InventoryEntry} from '@/data/inventoryCatalogue';
import {EQUIPMENT_SLOTS,EQUIPMENT_SLOT_LABELS,type EquipmentSlot} from '@/data/battleOutfitter';
import {equipmentStats} from '@/data/equipmentEnhancement';
import {getEquipmentCopies,getEnhancementQuote,enhanceEquipment} from '@/data/equipmentInstances';
import {BATTLE_STAT_LABELS} from '@/data/equipmentComparison';
import {equipmentRemovalBlocker} from '@/data/equipmentChangeSnapshot';
import type {EquipmentActionRequest} from '@/data/equipmentAction';
import {getBreedingParticipants} from '@/data/breeding';
import {BLACKSMITH_RECIPES} from '@/data/blacksmith';
import {GameDialog} from '@/features/ui/GameDialog';
import {BlacksmithWorkshop} from '@/features/builder/BlacksmithWorkshop';
import {ForgeIcon} from '@/features/builder/ForgeWindow';
import {BattleOutfitterBench} from '@/features/battle-outfitter/BattleOutfitterBench';
import {EquipmentActionFlow} from './EquipmentActionFlow';
import {EquipmentGuide} from './EquipmentGuide';
import {EquipmentStatIcon} from './EquipmentStatIcon';
import {UpgradeItemArt} from './UpgradeItemArt';
import {UpgradeReview} from './UpgradeReview';
import {UpgradeSuccess,type UpgradeReceipt} from './UpgradeSuccess';
import s from './EquipmentCompactGallery.module.css';

const KIT='/images/ui/forge-slate-v2/';
const categoryLabel=(slot:EquipmentSlot|'all')=>slot==='all'?'All':slot==='weapon'?'Weapons':slot==='accessory'?'Accessories':EQUIPMENT_SLOT_LABELS[slot];
const pageSize=()=>typeof window==='undefined'?8:window.innerHeight<=550||window.innerWidth<=950?4:8;
type Quote=NonNullable<ReturnType<typeof getEnhancementQuote>>;
const quoteKey=(quote:Quote)=>JSON.stringify([quote.copy,quote.cost,quote.before]);

export function EquipmentGallery({onClose,initialCreatureId='',initialSlot='all',initialEquipmentId='',onVisitColiseum}:{onClose:()=>void;initialCreatureId?:string;initialSlot?:EquipmentSlot|'all';initialEquipmentId?:string;onVisitColiseum?:()=>void}){
 const game=useGameContext(),save=game.currentSave;
 const [slot,setSlot]=useState<EquipmentSlot|'all'>(initialSlot),[search,setSearch]=useState(''),[sort,setSort]=useState('level');
 const [grade,setGrade]=useState('all'),[rarity,setRarity]=useState('all'),[setFilter,setSetFilter]=useState('all'),[availability,setAvailability]=useState('all');
 const [page,setPage]=useState(0),[capacity,setCapacity]=useState(pageSize),[selected,setSelected]=useState(initialEquipmentId);
 const [recipient,setRecipient]=useState(initialCreatureId),[picker,setPicker]=useState(false),[recipientSearch,setRecipientSearch]=useState(''),[recipientPage,setRecipientPage]=useState(0);
 const [filters,setFilters]=useState(false),[filterPage,setFilterPage]=useState(0),[equippedSetPage,setSetPage]=useState(0),[setsOpen,setSetsOpen]=useState(false),[setDetailPage,setSetDetailPage]=useState(0);
 const [view,setView]=useState<'gear'|'details'>(initialEquipmentId?'details':'gear'),[guide,setGuide]=useState<InventoryEntry|null>(null);
 const [action,setAction]=useState<EquipmentActionRequest|null>(null),[source,setSource]=useState<'shop'|'forge'|'marks'|null>(null);
 const [review,setReview]=useState<Quote|null>(null),[upgradeReceipt,setUpgradeReceipt]=useState<UpgradeReceipt|null>(null),[notice,setNotice]=useState('');
 const latest=useRef(save),busy=useRef(false);
 useEffect(()=>{latest.current=save;},[save]);
 useEffect(()=>{const resize=()=>setCapacity(pageSize());addEventListener('resize',resize);return()=>removeEventListener('resize',resize);},[]);
 if(!save)return null;
 const catalogue=getOwnedInventory(save).filter(i=>i.gear&&i.copy);
 const metadata=new Map(catalogue.map(row=>[row.id,equipmentStats(row.gear!,row.copy!)]));
 const participants=getBreedingParticipants(save).filter(p=>p.kind!=='player');
 const creature=save.creatures?.find(c=>c.creatureId===recipient)??save.creatures?.[0];
 const target=participants.find(p=>p.participantId===creature?.creatureId);
 const ownerOf=(id?:string)=>participants.find(p=>p.participantId===id);
 const rows=catalogue.filter(i=>{const stats=metadata.get(i.id)!;return (slot==='all'||i.gear!.equipmentSlot===slot)&&i.name.toLowerCase().includes(search.trim().toLowerCase())&&(grade==='all'||stats.powerGrade===grade)&&(rarity==='all'||stats.rarity===rarity)&&(setFilter==='all'||stats.setId===setFilter)&&(availability==='all'||(availability==='available'?!i.copy!.owner:!!i.copy!.owner));}).sort((a,b)=>{
  const am=metadata.get(a.id)!,bm=metadata.get(b.id)!;
  return (sort==='level'?b.copy!.level-a.copy!.level:sort==='rarity'?EQUIPMENT_RARITIES.indexOf(bm.rarity)-EQUIPMENT_RARITIES.indexOf(am.rarity):sort==='grade'?'DCBAS'.indexOf(bm.powerGrade)-'DCBAS'.indexOf(am.powerGrade):0)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id);
 });
 const pages=Math.max(1,Math.ceil(rows.length/capacity)),selectedIndex=rows.findIndex(row=>row.id===selected);
 const index=selectedIndex>=0?Math.floor(selectedIndex/capacity):Math.min(page,pages-1);
 const item=rows.find(i=>i.id===selected)??rows[index*capacity]??rows[0],copy=item?.copy,gear=item?.gear,meta=item?metadata.get(item.id):null;
 const owner=ownerOf(copy?.owner),quote=copy?getEnhancementQuote(save,copy.id):null;
 const sets=(creature?getBattleOutfitterCreatureEffectSummary(save,creature.creatureId).sets??[]:[]).filter(p=>p.count>0);
 const setIndex=Math.min(equippedSetPage,Math.max(0,sets.length-1)),progress=sets[setIndex];
 const setDetails=sets[Math.min(setDetailPage,Math.max(0,sets.length-1))];
 const selectedSet=meta?.setId?EQUIPMENT_SETS[meta.setId]:null;
 const recipe=BLACKSMITH_RECIPES.find(r=>r.itemId===gear?.itemId);
 const removalBlock=copy?.owner?equipmentRemovalBlocker(save,copy.owner):null;
 const candidates=participants.filter(p=>p.displayName.toLowerCase().includes(recipientSearch.toLowerCase()));
 const recipientPages=Math.max(1,Math.ceil(candidates.length/2)),recipientIndex=Math.min(recipientPage,recipientPages-1);
 const filtered=grade!=='all'||rarity!=='all'||setFilter!=='all'||availability!=='all';
 const freshReview=review?getEnhancementQuote(save,review.copy.id):null;
 const stale=!!review&&(!freshReview||quoteKey(freshReview)!==quoteKey(review));
 function turnPage(n:number){setPage(n);setSelected(rows[n*capacity]?.id??'');}
 function choose(id:string){setSelected(id);setView('details');setNotice('');}
 function resetFilters(){setGrade('all');setRarity('all');setSetFilter('all');setAvailability('all');setPage(0);}
 function confirmUpgrade(){
  const now=latest.current;if(!now||!review||busy.current)return;
  const fresh=getEnhancementQuote(now,review.copy.id);
  if(!fresh||quoteKey(fresh)!==quoteKey(review)){setNotice('This piece changed. Review its current upgrade again.');setReview(null);return;}
  busy.current=true;
  const result=enhanceEquipment(now,review.copy.id,review.copy.level);
  if(result.ok){const persisted=game.saveCurrentGame(result.save);latest.current=persisted;const updated=getEquipmentCopies(persisted).find(c=>c.id===review.copy.id)!;setUpgradeReceipt({name:review.item.name,art:review.item.iconPath,slot:review.item.equipmentSlot,level:updated.level,cost:review.cost,before:review.before,after:equipmentStats(review.item,updated)});}
  else setNotice(result.message);
  setReview(null);busy.current=false;
 }
 const pager=(n:number,total:number,change:(n:number)=>void,label:string)=><nav className={s.pager} aria-label={label}><button aria-label={`Previous ${label}`} disabled={!n} onClick={()=>change(n-1)}>‹ Previous</button><span>{n+1} / {total}</span><button aria-label={`Next ${label}`} disabled={n+1>=total} onClick={()=>change(n+1)}>Next ›</button></nav>;
 const closeButton=(close:()=>void,title:string)=><button className={s.close} aria-label={`Close ${title}`} onClick={close}><ForgeIcon name="close"/></button>;
 return <>
 <GameDialog title="Owned equipment" fullScreen onClose={onClose}><main className={s.shell}><section className={s.book} data-equipment-gallery data-view={view}>
  <header className={s.heading}><h1>Owned equipment</h1>{closeButton(onClose,'Owned equipment')}</header>
  <div className={s.tools}>
   <label className={s.search}><ForgeIcon name="search"/><input aria-label="Search owned gear" placeholder="Search owned gear" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/></label>
   <select aria-label="Sort equipment" value={sort} onChange={e=>{setSort(e.target.value);setPage(0);}}><option value="level">Sort: Upgrade</option><option value="grade">Sort: Power grade</option><option value="rarity">Sort: Rarity</option><option value="name">Sort: Name</option></select>
   <button onClick={()=>setFilters(true)}><ForgeIcon name="filter"/>Filters{filtered?' •':''}</button>
   <button className={s.recipient} onClick={()=>setPicker(true)}>{target&&<img src={target.portraitPath} alt=""/>}<span>{target?.displayName??'Choose creature'}<small>Change creature ▾</small></span></button>
  </div>
  <nav className={s.categories} aria-label="Equipment categories">{(['all',...EQUIPMENT_SLOTS] as const).map(key=><button key={key} aria-pressed={slot===key} onClick={()=>{setSlot(key);setPage(0);}}>{key==='all'?<span className={s.allIcon} aria-hidden="true">▦</span>:<img src={`${KIT}categories/${key}.webp`} alt=""/>}{categoryLabel(key)}</button>)}</nav>
  <nav className={s.focusTabs} aria-label="Gallery sections"><button aria-pressed={view==='gear'} onClick={()=>setView('gear')}>Gear ({rows.length})</button><button disabled={!item} aria-pressed={view==='details'} onClick={()=>setView('details')}>Selected item</button></nav>
  <div className={s.body}>
   <section className={s.galleryPane} aria-label="Owned gear tiles">
    <div className={s.grid}>{rows.slice(index*capacity,index*capacity+capacity).map(row=>{const wearer=ownerOf(row.copy!.owner);return <button className={s.tile} key={row.id} aria-label={`Select ${row.gear!.name} copy ${row.id}, plus ${row.copy!.level}`} aria-pressed={item?.id===row.id} data-equipment-id={row.id} onClick={()=>choose(row.id)}><div className={s.tileArt}><UpgradeItemArt art={row.art} stats={metadata.get(row.id)!} slot={row.gear!.equipmentSlot}/></div><span className={s.tileStatus}>{row.copy!.owner?<><img src={wearer?.portraitPath} alt=""/>{wearer?.displayName??'Equipped'}</>:<><EquipmentStatIcon name="inventory"/>In inventory</>}</span></button>;})}{!rows.length&&<p className={s.empty}>No equipment matches.<br/>Change filters or visit the Outfitter.</p>}</div>
    <div className={s.setStrip} aria-label="Target equipped sets"><strong>{creature?.nickname??'Creature'}’s equipped sets</strong>{progress?<><img src={`${KIT}sets/sculpted/${progress.id}.webp`} alt=""/><button className={s.link} onClick={()=>{setSetDetailPage(setIndex);setSetsOpen(true);}}>{progress.name} {progress.count}/{progress.required} · {progress.activations?`Active ×${progress.activations}`:'In progress'}</button>{sets.length>1&&<nav className={s.setPager}><button aria-label="Previous equipped set" disabled={!setIndex} onClick={()=>setSetPage(setIndex-1)}>‹</button><small>{setIndex+1}/{sets.length}</small><button aria-label="Next equipped set" disabled={setIndex+1>=sets.length} onClick={()=>setSetPage(setIndex+1)}>›</button></nav>}</>:<small>No sets equipped</small>}</div>
   </section>
   <aside className={s.details} aria-label="Selected equipment details">{item&&gear&&copy&&meta?<>
    <div className={s.hero}><button className={s.heroArt} aria-label={`Details for ${item.name}`} onClick={()=>setGuide(item)}><UpgradeItemArt art={item.art} stats={meta} slot={gear.equipmentSlot}/></button><div><h2>{gear.name} <span>+{copy.level}</span></h2><p>{EQUIPMENT_SLOT_LABELS[gear.equipmentSlot!]} · {meta.rarity} · Power {meta.powerGrade}</p><div className={s.owner}>{copy.owner?<><img src={owner?.portraitPath} alt=""/><span>Equipped by {owner?.displayName??'Creature'}</span></>:<><EquipmentStatIcon name="inventory"/><span>In inventory</span></>}</div></div></div>
    <section className={s.statPanel}><h3>Main stat</h3><div className={s.mainStat}><EquipmentStatIcon name={meta.main.key}/><span>{BATTLE_STAT_LABELS[meta.main.key]}</span><b>+{meta.main.value}</b></div><h3>Substats <small>{meta.substats.length} / 4</small></h3><dl>{Array.from({length:4},(_,n)=>{const st=meta.substats[n];return <div key={n}><dt>{st?<><EquipmentStatIcon name={st.key}/>{BATTLE_STAT_LABELS[st.key]}</>:'Empty substat'}</dt><dd>{st?`+${st.value}`:'—'}</dd></div>;})}</dl></section>
    <div className={s.identity}>{selectedSet&&<><img src={`${KIT}sets/sculpted/${meta.setId}.webp`} alt=""/><strong>{selectedSet.name} set</strong></>}<button className={s.link} onClick={()=>setGuide(item)}>Details ›</button><button className={s.link} onClick={()=>setSource(gear.coliseumExclusive?'marks':recipe?'forge':'shop')}>Find source ›</button></div>
    <div className={s.actions}><button disabled={!quote||quote.maxed} onClick={()=>{busy.current=false;setReview(quote);}}><ForgeIcon name="upgrade"/>Improve</button><button className={s.primary} disabled={!save.creatures?.length} onClick={()=>setAction({kind:'equip',equipmentId:copy.id,creatureId:creature?.creatureId??''})}><EquipmentStatIcon name="equip"/>{copy.owner?'Transfer':'Equip'}</button>{copy.owner&&<button title={removalBlock??'Return this exact piece to inventory'} disabled={!!removalBlock} onClick={()=>setAction({kind:'remove',equipmentId:copy.id,creatureId:copy.owner!})}>Remove</button>}</div>
    <p className={s.note} role="status">{notice||(!save.creatures?.length?'A creature is needed to equip gear.':removalBlock??(copy.owner?'Review both creatures before transferring.':'Review stat and set changes before equipping.'))}</p>
   </>:<p className={s.empty}>Select an owned piece to see its stats.</p>}</aside>
  </div>
  <footer className={s.footer}><button onClick={()=>setSource('shop')}>Visit Outfitter</button>{pager(index,pages,turnPage,'gear pages')}</footer>
 </section></main></GameDialog>
 {filters&&<GameDialog title="Equipment filters" fullScreen onClose={()=>setFilters(false)}><main className={s.shell}><section className={`${s.book} ${s.popup}`} data-equipment-filters><header className={s.heading}><h2>Equipment filters</h2>{closeButton(()=>setFilters(false),'Equipment filters')}</header><nav className={s.switches}><button aria-pressed={filterPage===0} onClick={()=>setFilterPage(0)}>Power & rarity</button><button aria-pressed={filterPage===1} onClick={()=>setFilterPage(1)}>Set & availability</button></nav><div className={s.fields}>{filterPage===0?<><label>Power grade<select aria-label="Grade filter" value={grade} onChange={e=>{setGrade(e.target.value);setPage(0);}}><option value="all">All power grades</option>{['D','C','B','A','S'].map(g=><option key={g}>{g}</option>)}</select></label><label>Rarity<select aria-label="Rarity filter" value={rarity} onChange={e=>{setRarity(e.target.value);setPage(0);}}><option value="all">All rarities</option>{EQUIPMENT_RARITIES.map(r=><option key={r}>{r}</option>)}</select></label></>:<><label>Equipment set<select aria-label="Set filter" value={setFilter} onChange={e=>{setSetFilter(e.target.value);setPage(0);}}><option value="all">All sets</option>{Object.entries(EQUIPMENT_SETS).map(([id,set])=><option key={id} value={id}>{set.name}</option>)}</select></label><label>Availability<select aria-label="Availability filter" value={availability} onChange={e=>{setAvailability(e.target.value);setPage(0);}}><option value="all">All owned</option><option value="available">In inventory</option><option value="equipped">Equipped</option></select></label></>}</div><footer className={s.popupFooter}><button onClick={resetFilters}>Reset filters</button><button className={s.primary} onClick={()=>setFilters(false)}>Show equipment</button></footer></section></main></GameDialog>}
 {picker&&<GameDialog title="Choose equipment recipient" fullScreen onClose={()=>setPicker(false)}><main className={s.shell}><section className={`${s.book} ${s.popup}`} data-equipment-recipients><header className={s.heading}><h2>Choose creature</h2>{closeButton(()=>setPicker(false),'Choose creature')}</header><input aria-label="Search equipment recipients" placeholder="Search creatures" value={recipientSearch} onChange={e=>{setRecipientSearch(e.target.value);setRecipientPage(0);}}/><p className={s.note}>Choose whose equipped sets to browse. No gear moves until confirmation.</p><div className={s.creatures}>{candidates.slice(recipientIndex*2,recipientIndex*2+2).map(p=><button key={p.participantId} aria-label={`Browse equipment for ${p.displayName}`} aria-pressed={p.participantId===creature?.creatureId} onClick={()=>{setRecipient(p.participantId);setSetPage(0);setPicker(false);}}><img src={p.portraitPath} alt=""/><strong>{p.displayName}</strong><small>Energy {p.energy}/{p.maxEnergy}</small></button>)}{!candidates.length&&<p>No creatures match.</p>}</div>{pager(recipientIndex,recipientPages,setRecipientPage,'creature pages')}</section></main></GameDialog>}
 {setsOpen&&<GameDialog title="Equipped set details" fullScreen onClose={()=>setSetsOpen(false)}><main className={s.shell}><section className={`${s.book} ${s.popup}`}><header className={s.heading}><h2>{creature?.nickname}’s equipped sets</h2>{closeButton(()=>setSetsOpen(false),'Equipped set details')}</header>{setDetails?<><h3>{setDetails.name} · {setDetails.count}/{setDetails.required} · {setDetails.activations?`Active ×${setDetails.activations}`:'In progress'}</h3><p>{setDetails.description}</p><p className={s.note}>Only worn pieces count. Percentages use innate battle stats; inventory pieces add no set progress.</p><ul className={s.members}>{catalogue.filter(row=>row.copy!.owner===creature?.creatureId&&metadata.get(row.id)!.setId===setDetails.id).map(row=><li key={row.id}>{row.name} +{row.copy!.level}</li>)}</ul>{pager(Math.min(setDetailPage,sets.length-1),sets.length,setSetDetailPage,'set pages')}</>:<p>No sets equipped.</p>}</section></main></GameDialog>}
 {guide?.gear&&<EquipmentGuide item={guide.gear} copy={guide.copy} onClose={()=>setGuide(null)}/>}
 {action&&<EquipmentActionFlow request={action} onRecipientChange={id=>{setRecipient(id);setSetPage(0);}} onClose={()=>setAction(null)}/>}
 {review&&<UpgradeReview quote={review} gold={save.currencies.gold} stale={stale} onClose={()=>setReview(null)} onConfirm={confirmUpgrade}/>}
 {upgradeReceipt&&<UpgradeSuccess receipt={upgradeReceipt} gold={save.currencies.gold} onClose={()=>setUpgradeReceipt(null)}/>}
 {source==='marks'&&<GameDialog title="Coliseum equipment" fullScreen onClose={()=>setSource(null)}><main className={s.shell}><section className={`${s.book} ${s.popup}`}><header className={s.heading}><h2>Coliseum equipment</h2>{closeButton(()=>setSource(null),'Coliseum equipment')}</header><h3>{gear?.name}</h3><p>Earn this piece at Town → Coliseum → Marks Exchange.</p>{onVisitColiseum&&<button className={s.primary} onClick={onVisitColiseum}>Visit Coliseum</button>}</section></main></GameDialog>}
 {(source==='shop'||source==='forge')&&<GameDialog title={source==='shop'?'Outfitter':'Blacksmith recipe'} fullScreen onClose={()=>setSource(null)}>{source==='shop'?<BattleOutfitterBench initialCreatureId={creature?.creatureId} initialSlot={slot==='all'?null:slot} onReturn={()=>setSource(null)} returnLabel="Return to equipment"/>:<BlacksmithWorkshop initialRecipeId={recipe?.id} onBack={()=>setSource(null)}/>}</GameDialog>}
 </>;
}
