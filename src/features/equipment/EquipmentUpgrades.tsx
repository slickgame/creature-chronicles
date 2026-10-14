"use client";
import {UpgradeSuccess,type UpgradeReceipt} from './UpgradeSuccess';
import {UpgradeReview} from './UpgradeReview';
import {equipmentStats} from '@/data/equipmentEnhancement';
import { EnhancementMilestones } from './EnhancementMilestones';
import { getUpgradeBudget } from '@/data/economyBudget';
import { useRef, useState } from 'react';
import { BATTLE_OUTFITTER_ITEMS, assignBattleOutfitterEquipment, removeBattleOutfitterEquipment } from '@/data/battleOutfitter';
import { getEquipmentCopies, getEnhancementQuote, enhanceEquipment } from '@/data/equipmentInstances';
import { BATTLE_STAT_LABELS, compareEquipment } from '@/data/equipmentComparison';
import { useGameContext } from '@/state/GameProvider';
import { useNavigation } from '@/features/navigation/NavigationContext';
import { GameDialog } from '@/features/ui/GameDialog';
import { EquipmentStats } from './EquipmentStats';
import styles from './EquipmentUpgrades.module.css';

export function EquipmentUpgrades({onBack, embedded = false, initialEquipmentId = "", initialCreatureId = "", returnLabel = "Back"}:{onBack:()=>void;embedded?:boolean;initialEquipmentId?:string;initialCreatureId?:string;returnLabel?:string}){
 const {currentSave:save,saveCurrentGame}=useGameContext();
 const {open}=useNavigation();
 const [selectedId,setSelectedId]=useState(initialEquipmentId);
 const [creatureId,setCreatureId]=useState(initialCreatureId);
 const [page,setPage]=useState(()=>save?Math.max(0,Math.floor(getEquipmentCopies(save).findIndex(c=>c.id===initialEquipmentId)/4)):0);
 const [budgetPage,setBudgetPage]=useState(0);
 const [popup,setPopup]=useState<'milestones'|'stats'|'budget'|'assignment'|'upgrade'|'equip'|'remove'|'report'|null>(null);
 const [reviewLevel,setReviewLevel]=useState(0);
 const [message,setMessage]=useState('');
 const [upgradeReceipt,setUpgradeReceipt]=useState<UpgradeReceipt|null>(null);
 const busy=useRef(false);
 if(!save)return null;
 const copies=getEquipmentCopies(save),copy=copies.find(c=>c.id===selectedId)??copies[0];
 const quote=copy?getEnhancementQuote(save,copy.id):null;
 const creature=save.creatures?.find(c=>c.creatureId===creatureId)??save.creatures?.[0];
 const owner=save.creatures?.find(c=>c.creatureId===copy?.owner);
 const pages=Math.max(1,Math.ceil(copies.length/4)),currentPage=Math.min(page,pages-1);
 const comparison=quote&&creature?compareEquipment(save,creature,quote.item,copy!.id):null;
 const budget=quote?getUpgradeBudget(save,quote.item,quote.copy.level):null;
 function review(kind:'upgrade'|'equip'|'remove'){if(!copy)return;busy.current=false;setReviewLevel(copy.level);setPopup(kind);}
 function confirm(){
  if(!save||!quote||!copy||busy.current)return;busy.current=true;setUpgradeReceipt(null);
  const result=popup==='upgrade'?enhanceEquipment(save,copy.id,reviewLevel):popup==='equip'&&creature?assignBattleOutfitterEquipment(save,creature.creatureId,quote.item.itemId,copy.id):popup==='remove'&&owner?removeBattleOutfitterEquipment(save,owner.creatureId,quote.item.equipmentSlot!):{save,ok:false,message:'Select an available copy and creature again.'};
  let report=result.message;
  if(result.ok){const persisted=saveCurrentGame(result.save);if(popup==='upgrade'){const upgraded=getEquipmentCopies(persisted).find(c=>c.id===copy.id)!;setUpgradeReceipt({name:quote.item.name,level:upgraded.level,cost:quote.cost,before:quote.before,after:equipmentStats(quote.item,upgraded)});}const g=persisted.currencies.gold-result.save.currencies.gold,gp=persisted.currencies.guildPoints-result.save.currencies.guildPoints;if(g||gp)report+=` Goal rewards: +${g} Gold, +${gp} GP.`;}
  setMessage(report);setPopup('report');
 }
 return <main className={styles.screen} data-equipment-upgrades>
  <header className={styles.header}><button onClick={onBack}>‹ {returnLabel}</button><div><small>Iona Flint · Master Blacksmith</small><h1>Improve equipment</h1></div>{!embedded&&<button data-navigation-launcher onClick={()=>open('menu')}>Menu</button>}</header>
  <div className={styles.layout}>
   <aside className={styles.inventory}><div className={styles.host}><img src="/images/ui/blacksmith-v1/iona.webp" alt="Iona Flint"/><div><strong>Your equipment</strong><p>{save.currencies.gold} Gold · {copies.length} pieces</p><small>Each piece keeps its own level and substats.</small></div></div><div className={styles.copyList}>{copies.slice(currentPage*4,currentPage*4+4).map(c=>{const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)!;return <button key={c.id} aria-pressed={c.id===copy?.id} aria-label={`Select ${item.name} copy ${c.id.replace('gear_','')} plus ${c.level}`} onClick={()=>setSelectedId(c.id)}><img src={item.iconPath} alt=""/><span><strong>{item.name} +{c.level}</strong><small>#{c.id.replace('gear_','')} · {c.owner?`Worn by ${save.creatures?.find(x=>x.creatureId===c.owner)?.nickname??'creature'}`:'In inventory'}</small></span></button>;})}</div><nav className={styles.paging} aria-label="Equipment"><button aria-label="Previous equipment" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>‹</button><span>{currentPage+1} / {pages}</span><button aria-label="Next equipment" disabled={currentPage+1>=pages} onClick={()=>setPage(currentPage+1)}>›</button></nav></aside>
   <section className={styles.details}>{quote&&copy?<><div className={styles.scroll}><div className={styles.item}><img src={quote.item.iconPath} alt={quote.item.name}/><div><h2>{quote.item.name} +{copy.level}</h2><p>#{copy.id.replace('gear_','')} · {owner?`Worn by ${owner.nickname}`:'In inventory'}</p></div></div><p className={styles.note}>Select a detail below. Review the exact next level before paying.</p><div className={styles.quickActions}><button onClick={()=>setPopup('stats')}>Stats &amp; passives</button><button onClick={()=>setPopup('milestones')}>Milestone rewards</button><button onClick={()=>setPopup('assignment')}>Equip / remove</button></div><div className={styles.levelSummary}><strong>+{copy.level} / 15</strong><span>{quote.maxed?'Fully improved':`Next: +${copy.level+1} · ${quote.cost} Gold`}</span><button onClick={()=>setPopup('budget')}>Gold &amp; food budget</button></div></div><footer className={styles.footer}><span>{quote.maxed?'Maximum +15':!quote.canUpgrade?`Need ${quote.cost-save.currencies.gold} more Gold`:`Next level: ${quote.cost} Gold`}</span><button disabled={!quote.canUpgrade} onClick={()=>review('upgrade')}>Review upgrade</button></footer></>:<div className={styles.scroll}><h2>No equipment yet</h2><p>Buy ready-made equipment at the Outfitter, craft it with Iona, or earn gear in the Coliseum. Each piece can then be improved to +15.</p></div>}</section>
  </div>
  {popup==='milestones'&&quote&&copy&&<EnhancementMilestones item={quote.item} copy={copy} gold={save.currencies.gold} onClose={()=>setPopup(null)}/>}
  {popup==='stats'&&quote&&<GameDialog title="Equipment stats & passives" onClose={()=>setPopup(null)}><EquipmentStats item={quote.item} copy={copy}/><p className={styles.note}>Main stat grows each level. Milestones at +3, +6, +9, +12 and +15 add or improve a substat, with a maximum of four.</p></GameDialog>}
  {popup==='budget'&&<GameDialog title="Upgrade budget" onClose={()=>setPopup(null)}>{budget&&budget.rows.length>0?<><div className={styles.actions}><button aria-pressed={budgetPage===0} onClick={()=>setBudgetPage(0)}>Milestone costs</button><button aria-pressed={budgetPage===1} onClick={()=>setBudgetPage(1)}>Food plan</button></div>{budgetPage===0?<><p>Total Gold from the current level to each milestone. Pay one level at a time.</p><table className={styles.table}><thead><tr><th>Target</th><th>Total Gold</th><th>Gold left</th></tr></thead><tbody>{budget.rows.map(row=><tr key={row.target}><th>+{row.target}</th><td>{row.gold}</td><td>{row.affordable?row.remaining:`Need ${-row.remaining} more`}</td></tr>)}</tbody></table></>:<><p>Seven-night food budget: {budget.food.shortage} additional Balanced rations · {budget.food.topUpGold} Gold at Trade prices.</p><p className={styles.note}>Based on current residents, unreserved stock and ingredient feeding. Assumes no gathering, rewards, new arrivals or training returns. Bundles may cost less. Gold is not reserved; allow for construction and other expenses.</p>{budget.rows.some(row=>row.affordable&&row.afterFood<0)&&<p className={styles.highlight}>Some milestones leave less than this food budget. Gather or cook more rations, or stop earlier.</p>}</>}</>:<p>This equipment is already at maximum level.</p>}</GameDialog>}
  {popup==='assignment'&&quote&&copy&&<GameDialog title="Equip or remove equipment" onClose={()=>setPopup(null)}><h3>Equip this piece</h3>{!copy.owner&&creature?<label>Creature <select value={creature.creatureId} onChange={e=>setCreatureId(e.target.value)}>{save.creatures?.map(c=><option key={c.creatureId} value={c.creatureId}>{c.nickname}</option>)}</select></label>:<p>{owner?`Remove from ${owner.nickname} before assigning to someone else.`:'No creature available.'}</p>}{comparison&&!copy.owner&&<><p>Replaces {comparison.previous?.name??'an empty slot'}.</p><table className={styles.table}><thead><tr><th>Battle stat</th><th>Current</th><th>After</th></tr></thead><tbody>{comparison.rows.filter(r=>r.delta!==0).map(r=><tr key={r.key}><th>{r.label}</th><td>{r.current}</td><td>{r.after}</td></tr>)}</tbody></table></>}<button disabled={copy.owner?!owner:!creature} onClick={()=>review(copy.owner?'remove':'equip')}>{copy.owner?'Remove this piece':'Review equip'}</button><p className={styles.note}>Equipment changes affect newly started battles. An existing battle keeps its starting loadout. Base creature stats and innate grades are unchanged.</p></GameDialog>}
  {popup==='upgrade'&&quote&&<UpgradeReview quote={quote} gold={save.currencies.gold} stale={copy?.level!==reviewLevel} onClose={()=>setPopup(null)} onConfirm={confirm}/>}
  {(popup==='equip'||popup==='remove')&&quote&&<GameDialog title={popup==='equip'?'Confirm equipment':'Confirm equipment removal'} onClose={()=>setPopup(null)}><p>{popup==='equip'?`Equip ${quote.item.name} +${copy!.level} (#${copy!.id.replace('gear_','')}) on ${creature?.nickname}? The replaced piece returns to inventory with its upgrades.`:`Return ${quote.item.name} +${copy!.level} to inventory with its upgrades intact?`}</p><EquipmentStats item={quote.item} copy={copy}/><div className={styles.actions}><button onClick={()=>setPopup(null)}>Cancel</button><button onClick={confirm}>Confirm {popup==='equip'?'equip':'removal'}</button></div></GameDialog>}
  {popup==='report'&&upgradeReceipt&&<UpgradeSuccess receipt={upgradeReceipt} gold={save.currencies.gold} onClose={()=>{setPopup(null);setUpgradeReceipt(null);}}/>}
  {popup==='report'&&!upgradeReceipt&&<GameDialog title="Equipment receipt" onClose={()=>setPopup(null)}><p role="status">{message}</p><p>Balance: {save.currencies.gold} Gold.</p><button onClick={()=>setPopup(null)}>Continue</button></GameDialog>}
 </main>;
}
