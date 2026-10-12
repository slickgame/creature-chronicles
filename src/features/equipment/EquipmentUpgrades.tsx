"use client";
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

export function EquipmentUpgrades({onBack}:{onBack:()=>void}){
 const {currentSave:save,saveCurrentGame}=useGameContext();
 const {open}=useNavigation();
 const [selectedId,setSelectedId]=useState('');
 const [creatureId,setCreatureId]=useState('');
 const [page,setPage]=useState(0);
 const [popup,setPopup]=useState<'upgrade'|'equip'|'remove'|'report'|null>(null);
 const [reviewLevel,setReviewLevel]=useState(0);
 const [message,setMessage]=useState('');
 const busy=useRef(false);
 if(!save)return null;
 const copies=getEquipmentCopies(save),copy=copies.find(c=>c.id===selectedId)??copies[0];
 const quote=copy?getEnhancementQuote(save,copy.id):null;
 const creature=save.creatures?.find(c=>c.creatureId===creatureId)??save.creatures?.[0];
 const owner=save.creatures?.find(c=>c.creatureId===copy?.owner);
 const pages=Math.max(1,Math.ceil(copies.length/4)),currentPage=Math.min(page,pages-1);
 const comparison=quote&&creature?compareEquipment(save,creature,quote.item,copy!.id):null;
 const changed=quote?Object.keys({...quote.before.bonuses,...quote.after.bonuses}).filter(k=>quote.before.bonuses[k as keyof typeof quote.before.bonuses]!==quote.after.bonuses[k as keyof typeof quote.after.bonuses]):[];
 const budget=quote?getUpgradeBudget(save,quote.item,quote.copy.level):null;
 const milestone=quote?.after.milestones.find(m=>m.level===quote.copy.level+1);
 function review(kind:'upgrade'|'equip'|'remove'){if(!copy)return;busy.current=false;setReviewLevel(copy.level);setPopup(kind);}
 function confirm(){
  if(!save||!quote||!copy||busy.current)return;busy.current=true;
  const result=popup==='upgrade'?enhanceEquipment(save,copy.id,reviewLevel):popup==='equip'&&creature?assignBattleOutfitterEquipment(save,creature.creatureId,quote.item.itemId,copy.id):popup==='remove'&&owner?removeBattleOutfitterEquipment(save,owner.creatureId,quote.item.equipmentSlot!):{save,ok:false,message:'Select an available copy and creature again.'};
  let report=result.message;
  if(result.ok){const persisted=saveCurrentGame(result.save);const g=persisted.currencies.gold-result.save.currencies.gold,gp=persisted.currencies.guildPoints-result.save.currencies.guildPoints;if(g||gp)report+=` Goal rewards: +${g} Gold, +${gp} GP.`;}
  setMessage(report);setPopup('report');
 }
 const upgradePreview=quote&&<><p><strong>{quote.item.name} · Copy #{copy!.id.replace('gear_','')} · +{copy!.level} → +{Math.min(15,copy!.level+1)}</strong></p><table className={styles.table}><thead><tr><th>Stat</th><th>Current</th><th>After</th></tr></thead><tbody>{changed.map(key=>{const k=key as keyof typeof quote.before.bonuses;return <tr key={key}><th>{BATTLE_STAT_LABELS[k]}</th><td>+{quote.before.bonuses[k]??0}</td><td>+{quote.after.bonuses[k]??0}</td></tr>;})}</tbody></table>{milestone&&<p className={styles.highlight}>+{milestone.level} milestone: {milestone.added?'New substat':'Improve substat'} · {BATTLE_STAT_LABELS[milestone.key]} +{milestone.amount}</p>}<p>{quote.maxed?'Maximum level reached.':`${quote.cost} Gold · No materials · Guaranteed upgrade`}</p><p>Current balance: {save?.currencies.gold} Gold{quote.canUpgrade?` → ${save!.currencies.gold-quote.cost} Gold`:''}.</p></>;
 return <main className={styles.screen} data-equipment-upgrades>
  <header className={styles.header}><button onClick={onBack}>‹ Back</button><div><small>Iona Flint · Master Blacksmith</small><h1>Improve equipment</h1></div><button data-navigation-launcher onClick={()=>open('menu')}>Menu</button></header>
  <div className={styles.layout}>
   <aside className={styles.inventory}><div className={styles.host}><img src="/images/ui/blacksmith-v1/iona.webp" alt="Iona Flint"/><div><strong>Your equipment copies</strong><p>{save.currencies.gold} Gold · {copies.length} pieces</p><small>Each copy keeps its own level and substats.</small></div></div><div className={styles.copyList}>{copies.slice(currentPage*4,currentPage*4+4).map(c=>{const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)!;return <button key={c.id} aria-pressed={c.id===copy?.id} aria-label={`Select ${item.name} copy ${c.id.replace('gear_','')} plus ${c.level}`} onClick={()=>setSelectedId(c.id)}><img src={item.iconPath} alt=""/><span><strong>{item.name} +{c.level}</strong><small>Copy #{c.id.replace('gear_','')} · {c.owner?`Worn by ${save.creatures?.find(x=>x.creatureId===c.owner)?.nickname??'creature'}`:'In inventory'}</small></span></button>;})}</div><nav className={styles.paging} aria-label="Equipment copies"><button aria-label="Previous equipment copies" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>‹</button><span>{currentPage+1} / {pages}</span><button aria-label="Next equipment copies" disabled={currentPage+1>=pages} onClick={()=>setPage(currentPage+1)}>›</button></nav></aside>
   <section className={styles.details}>{quote&&copy?<><div className={styles.scroll}><div className={styles.item}><img src={quote.item.iconPath} alt={quote.item.name}/><div><h2>{quote.item.name} +{copy.level}</h2><p>Copy #{copy.id.replace('gear_','')} · {owner?`Worn by ${owner.nickname}`:'In inventory'}</p></div></div><EquipmentStats item={quote.item} copy={copy}/><h3>Next improvement</h3>{upgradePreview}<p className={styles.note}>Main stat grows each level. At +3, +6, +9, +12 and +15, gain a substat until four slots are filled, then improve one. Each copy’s milestone result is fixed and shown before payment.</p>{budget&&budget.rows.length>0&&<section aria-label="Upgrade budget"><h3>Plan your next milestone</h3><p>Costs below cover every remaining level up to that milestone. Upgrades are purchased one level at a time.</p><table className={styles.table}><thead><tr><th>Target</th><th>Total Gold</th><th>Gold left</th></tr></thead><tbody>{budget.rows.map(row=><tr key={row.target}><th>+{row.target}</th><td>{row.gold}</td><td>{row.affordable?row.remaining:`Need ${-row.remaining} more`}</td></tr>)}</tbody></table><p>Seven-night food budget: {budget.food.shortage} additional Balanced rations · {budget.food.topUpGold} Gold at Trade prices.</p><p className={styles.note}>Uses current residents, unreserved stock and your ingredient-feeding setting. Assumes no gathering, rewards, new creatures or training returns. Bundles may cost less. This estimate does not reserve Gold; keep construction and other expenses in mind.</p>{budget.rows.some(row=>row.affordable&&row.afterFood<0)&&<p className={styles.highlight}>Some affordable milestones would leave less than this food budget. Gather or cook more rations, or stop at an earlier level.</p>}</section>}<h3>Equip this copy</h3>{!copy.owner&&creature?<label>Creature <select value={creature.creatureId} onChange={e=>setCreatureId(e.target.value)}>{save.creatures?.map(c=><option key={c.creatureId} value={c.creatureId}>{c.nickname}</option>)}</select></label>:<p>{owner?`Remove from ${owner.nickname} before assigning to someone else.`:'No creature available.'}</p>}{comparison&&!copy.owner&&<><p>Replaces {comparison.previous?.name??'an empty slot'}.</p><table className={styles.table}><thead><tr><th>Battle stat</th><th>Current</th><th>After</th></tr></thead><tbody>{comparison.rows.filter(r=>r.delta!==0).map(r=><tr key={r.key}><th>{r.label}</th><td>{r.current}</td><td>{r.after}</td></tr>)}</tbody></table></>}<button disabled={copy.owner?!owner:!creature} onClick={()=>review(copy.owner?'remove':'equip')}>{copy.owner?'Remove this copy':'Review equip copy'}</button><p className={styles.note}>Equipment changes affect newly started battles. An existing battle keeps its starting loadout. Base creature stats and innate grades are unchanged.</p></div><footer className={styles.footer}><span>{quote.maxed?'Maximum +15':!quote.canUpgrade?`Need ${quote.cost-save.currencies.gold} more Gold`:`Next level: ${quote.cost} Gold`}</span><button disabled={!quote.canUpgrade} onClick={()=>review('upgrade')}>Review upgrade</button></footer></>:<div className={styles.scroll}><h2>No equipment yet</h2><p>Buy ready-made equipment at the Outfitter, craft it with Iona, or earn gear in the Coliseum. Each piece can then be improved to +15.</p></div>}</section>
  </div>
  {popup==='upgrade'&&quote&&<GameDialog title="Confirm equipment upgrade" onClose={()=>setPopup(null)}>{upgradePreview}<p>This payment improves only the selected copy. Its four-substat limit and equipment grade remain unchanged.</p><div className={styles.actions}><button onClick={()=>setPopup(null)}>Cancel</button><button disabled={!quote.canUpgrade||copy?.level!==reviewLevel} onClick={confirm}>Confirm upgrade</button></div></GameDialog>}
  {(popup==='equip'||popup==='remove')&&quote&&<GameDialog title={popup==='equip'?'Confirm copy equipment':'Confirm copy removal'} onClose={()=>setPopup(null)}><p>{popup==='equip'?`Equip ${quote.item.name} +${copy!.level} (copy #${copy!.id.replace('gear_','')}) on ${creature?.nickname}? The replaced copy returns to inventory with its upgrades.`:`Return ${quote.item.name} +${copy!.level} to inventory with its upgrades intact?`}</p><EquipmentStats item={quote.item} copy={copy}/><div className={styles.actions}><button onClick={()=>setPopup(null)}>Cancel</button><button onClick={confirm}>Confirm {popup==='equip'?'equip':'removal'}</button></div></GameDialog>}
  {popup==='report'&&<GameDialog title="Equipment receipt" onClose={()=>setPopup(null)}><p role="status">{message}</p><p>Balance: {save.currencies.gold} Gold.</p><button onClick={()=>setPopup(null)}>Continue</button></GameDialog>}
 </main>;
}
