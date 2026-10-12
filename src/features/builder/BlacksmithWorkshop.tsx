"use client";

import { EquipmentUpgrades } from "@/features/equipment/EquipmentUpgrades";
import { EquipmentStats } from "@/features/equipment/EquipmentStats";
import { useRef, useState } from 'react';
import { BLACKSMITH, BLACKSMITH_RECIPES, getBlacksmithQuote, craftBlacksmithEquipment } from '@/data/blacksmith';
import { getFarmState, RESOURCES, type ResourceId } from '@/data/farmResources';
import { getResourceArt } from '@/data/resourceArt';
import { compareEquipment } from '@/data/equipmentComparison';
import { getBattleOutfitterStock } from '@/data/battleOutfitter';
import { useGameContext } from '@/state/GameProvider';
import { GameDialog } from '@/features/ui/GameDialog';
import { useNavigation } from '@/features/navigation/NavigationContext';
import s from './YardCraftspeople.module.css';

export function BlacksmithWorkshop({ onBack }: { onBack: () => void }) {
  const { currentSave: save, saveCurrentGame, goToBattleOutfitter } = useGameContext();
  const { open } = useNavigation();
  const [recipeId, setRecipeId] = useState(BLACKSMITH_RECIPES[0].id);
  const [creatureId, setCreatureId] = useState('');
  const [popup, setPopup] = useState<'review' | 'report' | 'talk' | null>(null);
  const [revision, setRevision] = useState(0);
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  if (upgradeOpen) return <EquipmentUpgrades onBack={() => setUpgradeOpen(false)}/>;
  if (!save) return null;
  const quote = getBlacksmithQuote(save, recipeId)!;
  const { recipe, item } = quote;
  const state = getFarmState(save);
  const creature = save.creatures?.find(c => c.creatureId === creatureId) ?? save.creatures?.[0];
  const comparison = creature ? compareEquipment(save, creature, item, null) : null;
  const inputs = Object.entries(recipe.inputs) as [ResourceId, number][];
  function confirm() {
    if (!save || busy.current) return;
    busy.current = true;
    const result = craftBlacksmithEquipment(save, recipeId, revision);
    let report = result.message;
    if (result.ok) {
      const persisted = saveCurrentGame(result.save);
      const goldBonus = persisted.currencies.gold - result.save.currencies.gold;
      const gpBonus = persisted.currencies.guildPoints - result.save.currencies.guildPoints;
      if (goldBonus || gpBonus) report += ` Goal rewards: +${goldBonus} Gold, +${gpBonus} GP.`;
    }
    setMessage(report); setPopup('report');
  }
  const cost = <><h3>Materials & labor</h3><table className={s.table}><thead><tr><th>Ingredient</th><th>Need</th><th>Owned</th><th>Reserved</th><th>Usable</th></tr></thead><tbody>{inputs.map(([id,n])=><tr key={id}><th>{RESOURCES[id].name}</th><td>{n}</td><td>{state.stock[id]??0}</td><td>{state.reserves[id]??0}</td><td>{Math.max(0,(state.stock[id]??0)-(state.reserves[id]??0))}</td></tr>)}</tbody></table><p><strong>{recipe.laborGold} Gold labor</strong> · Balance {save.currencies.gold} → {save.currencies.gold-recipe.laborGold} Gold</p><p className={s.note}>Materials at current shop prices: {quote.materialValue} Gold. Total value with labor: {quote.totalValue} Gold · Ready-made shop price: {item.costGold} Gold.</p></>;
  const stats = <><EquipmentStats item={item}/><h3>{item.quality} / Grade {item.equipmentGrade} · {item.name}</h3><p>{item.effectLabel} No additional triggered effect.</p>{comparison ? <><p>Compare for <strong>{creature!.nickname}</strong> · Replaces {comparison.previous?.name??'an empty slot'} when equipped.</p><table className={s.table}><caption>Battle stats if equipped</caption><thead><tr><th>Stat</th><th>Current</th><th>After</th><th>Change</th></tr></thead><tbody>{comparison.rows.map(row=><tr key={row.key}><th>{row.label}</th><td>{row.current}</td><td>{row.after}</td><td>{row.delta>0?'+':''}{row.delta}</td></tr>)}</tbody></table></> : <p>No creature available for a comparison. Crafted equipment goes into inventory.</p>}<p className={s.note}>Crafting adds one copy without equipping it. Same stats as the shop copy. Creature base stats and innate grades stay unchanged.</p></>;
  return <main className={s.workshop} data-blacksmith-workshop>
    <header className={s.header}><button onClick={onBack}>‹ Builder’s Yard</button><div><small>{BLACKSMITH.name} · {BLACKSMITH.title}</small><h1>Blacksmith</h1></div><button data-navigation-launcher onClick={()=>open('menu')}>Menu</button></header>
    <section className={s.workBody}>
      <aside className={s.smith}><img src={BLACKSMITH.portrait} alt="Iona Flint, female master blacksmith"/><div><strong>Iona’s forge</strong><p>“Bring the metal. I’ll take care of the finish.”</p><div className={s.dialogActions}><button onClick={()=>setPopup('talk')}>Talk to Iona</button><button onClick={()=>setUpgradeOpen(true)}>Improve equipment</button></div></div></aside>
      <section className={s.recipePanel} aria-label="Crafting recipe">
        <nav className={s.recipeTabs} aria-label="Blacksmith recipes">{BLACKSMITH_RECIPES.map(r=><button key={r.id} aria-pressed={recipeId===r.id} onClick={()=>setRecipeId(r.id)}>{getBlacksmithQuote(save,r.id)!.item.name}</button>)}</nav>
        <div className={s.scroll}>
          <div className={s.item}><img src={item.iconPath} alt={item.name}/><div><small>ONE FINISHED ITEM</small><h2>{item.name}</h2><strong>{item.quality} / Grade {item.equipmentGrade}</strong><p>{item.effectLabel}</p><small>{getBattleOutfitterStock(save,item)} unequipped copies owned</small></div></div>
          <div className={s.costStrip}>{inputs.map(([id,n])=><span key={id}>{getResourceArt(id)&&<img src={getResourceArt(id)} alt=""/>}{n} {RESOURCES[id].name}</span>)}<span>+ {recipe.laborGold} Gold labor</span></div>
          {cost}
          {creature && <label className={s.selectLabel}>Compare equipment for <select value={creature.creatureId} onChange={e=>setCreatureId(e.target.value)}>{save.creatures?.map(c=><option key={c.creatureId} value={c.creatureId}>{c.nickname}</option>)}</select></label>}
          {stats}
        </div>
        <footer className={s.craftActions}><p role="status">{quote.canCraft ? 'Ready to craft · Guaranteed result · Completed immediately' : `Still needed: ${quote.reason}`}</p><button disabled={!quote.canCraft} onClick={()=>{busy.current=false;setRevision(quote.revision);setPopup('review');}}>Review crafting</button></footer>
      </section>
    </section>
    {popup==='review'&&<GameDialog title="Review crafting" onClose={()=>setPopup(null)}><p>Iona will craft exactly <strong>1 {item.name}</strong>. No random failures or additional fees.</p>{stats}{cost}<p>Reserved supplies are protected. Iona uses her town forge; no farm forge or construction crew is required.</p>{(!quote.canCraft||revision!==quote.revision)&&<p role="alert">Your supplies or crafting record changed. Close this review and check again.</p>}<div className={s.dialogActions}><button onClick={()=>setPopup(null)}>Cancel</button><button disabled={!quote.canCraft||revision!==quote.revision} onClick={confirm}>Confirm crafting</button></div></GameDialog>}
    {popup==='report'&&<GameDialog title="Iona’s Crafting Receipt" onClose={()=>setPopup(null)}><p role="status">{message}</p><p>Current balance: {save.currencies.gold} Gold.</p><div className={s.dialogActions}><button onClick={()=>setPopup(null)}>Back to forge</button><button onClick={goToBattleOutfitter}>Open Outfitter</button></div></GameDialog>}
    {popup==='talk'&&<GameDialog title="A Word with Iona" onClose={()=>setPopup(null)}><div className={s.dialogHost}><img src={BLACKSMITH.portrait} alt="Iona Flint"/><div><h3>Iona Flint · Master Blacksmith</h3><p>“Petra builds the places you come home to. I make the pieces you take out into the world. We share a yard, and we keep our benches busy.”</p><p>Bring refined Iron ingots, not Iron ore. Smelt ore at your farm furnace or buy ingots from Pella’s Ingredients & materials counter.</p><p>These three patterns have fixed grades and stats. Labor includes finishing and fittings. Your confirmation shows the entire cost, and reserved materials remain yours.</p></div></div></GameDialog>}
  </main>;
}
