"use client";

import { useRef, useState } from 'react';
import { EquipmentUpgrades } from '@/features/equipment/EquipmentUpgrades';
import { BLACKSMITH, BLACKSMITH_RECIPES, getBlacksmithQuote, craftBlacksmithEquipment } from '@/data/blacksmith';
import { getFarmState, resourceList, RESOURCES, type ResourceId } from '@/data/farmResources';
import { getResourceArt } from '@/data/resourceArt';
import { BATTLE_STAT_LABELS, compareEquipment } from '@/data/equipmentComparison';
import { equipmentStats } from '@/data/equipmentEnhancement';
import { getBattleOutfitterStock } from '@/data/battleOutfitter';
import { useGameContext } from '@/state/GameProvider';
import { GameDialog } from '@/features/ui/GameDialog';
import { useNavigation } from '@/features/navigation/NavigationContext';
import { IngredientCounter } from './IngredientCounter';
import s from './RecipeWorkbench.module.css';

type Popup='review'|'report'|'talk'|'output'|'comparison'|'cost'|'routes'|null;
export function BlacksmithWorkshop({ onBack }: { onBack: () => void }) {
 const {currentSave:save,saveCurrentGame,goToBattleOutfitter}=useGameContext();
 const {open}=useNavigation();
 const [recipeId,setRecipeId]=useState(BLACKSMITH_RECIPES[0].id);
 const [creatureId,setCreatureId]=useState('');
 const [popup,setPopup]=useState<Popup>(null);
 const [page,setPage]=useState(0);
 const [revision,setRevision]=useState(0);
 const [message,setMessage]=useState('');
 const [source,setSource]=useState<ResourceId|null>(null);
 const [upgradeOpen,setUpgradeOpen]=useState(false);
 const busy=useRef(false);
 if(upgradeOpen)return <EquipmentUpgrades onBack={()=>setUpgradeOpen(false)}/>;
 if(!save)return null;
 const quote=getBlacksmithQuote(save,recipeId)!;
 const {recipe,item}=quote;
 const index=BLACKSMITH_RECIPES.findIndex(r=>r.id===recipeId);
 const state=getFarmState(save);
 const creature=save.creatures?.find(c=>c.creatureId===creatureId)??save.creatures?.[0];
 const comparison=creature?compareEquipment(save,creature,item,null):null;
 const inputs=Object.entries(recipe.inputs) as [ResourceId,number][];
 const stats=equipmentStats(item);
 const statRows=Object.entries(stats.bonuses).filter(([,value])=>value!==0);
 const outputPages=Math.max(1,Math.ceil(statRows.length/3));
 const comparisonPages=Math.max(1,Math.ceil((comparison?.rows.length??0)/2));
 const usable=(id:ResourceId)=>Math.max(0,(state.stock[id]??0)-(state.reserves[id]??0));
 function show(next:Popup){setPage(0);setPopup(next);}
 function review(){busy.current=false;setRevision(quote.revision);show('review');}
 function confirm(){
  if(!save||busy.current)return;busy.current=true;
  const result=craftBlacksmithEquipment(save,recipeId,revision);let report=result.message;
  if(result.ok){const persisted=saveCurrentGame(result.save);const gold=persisted.currencies.gold-result.save.currencies.gold,gp=persisted.currencies.guildPoints-result.save.currencies.guildPoints;if(gold||gp)report+=` Goal rewards: +${gold} Gold, +${gp} GP.`;}
  setMessage(report);setPopup('report');
 }
 const output=<div className={s.popupBody}><strong>1 {item.name} +0 · {item.quality} / Grade {item.equipmentGrade}</strong><dl className={s.outputStats}>{statRows.slice(page*3,page*3+3).map(([key,value])=><div key={key}><dt>{BATTLE_STAT_LABELS[key as keyof typeof BATTLE_STAT_LABELS]}</dt><dd>+{value}</dd></div>)}</dl><p>{stats.passive??'No passive effect.'} Added to inventory, not equipped.</p></div>;
 const costs=<div className={s.popupBody}><table className={s.table}><thead><tr><th>Ingredient</th><th>Need</th><th>Owned</th><th>Reserved</th><th>Usable</th></tr></thead><tbody>{inputs.map(([id,n])=><tr key={id}><th>{RESOURCES[id].name}</th><td>{n}</td><td>{state.stock[id]??0}</td><td>{state.reserves[id]??0}</td><td>{usable(id)}</td></tr>)}</tbody></table><p><strong>{recipe.laborGold} Gold labor</strong> · Balance {save.currencies.gold}{save.currencies.gold>=recipe.laborGold?` → ${save.currencies.gold-recipe.laborGold}`:` · Need ${recipe.laborGold-save.currencies.gold} more`} Gold.</p><p>Reserved supplies are protected. Guaranteed result; no hidden fees.</p></div>;
 const pages=(count:number)=><div className={s.pager}><button disabled={page===0} onClick={()=>setPage(page-1)}>Previous details</button><span>{page+1} / {count}</span><button disabled={page+1>=count} onClick={()=>setPage(page+1)}>Next details</button></div>;
 return <main className={s.screen} data-blacksmith-workshop>
  <header className={s.header}><button onClick={onBack}>‹ Builder’s Yard</button><div><small>Iona Flint · Master Blacksmith</small><h1>Iona’s Forge</h1></div><button data-navigation-launcher onClick={()=>open('menu')}>Menu</button></header>
  <div className={s.layout}>
   <aside className={s.host}><img src={BLACKSMITH.portrait} alt="Iona Flint, master blacksmith"/><div><strong>Crafting & improvements</strong><button onClick={()=>show('talk')}>Talk to Iona</button><button onClick={()=>setUpgradeOpen(true)}>Improve equipment</button></div></aside>
   <section className={s.recipe} aria-label="Crafting recipe">
    <div className={s.selector}><button aria-label="Previous recipe" disabled={index===0} onClick={()=>setRecipeId(BLACKSMITH_RECIPES[index-1].id)}>‹</button><label>Recipe <select aria-label="Select crafting recipe" value={recipeId} onChange={e=>setRecipeId(e.target.value)}>{BLACKSMITH_RECIPES.map(r=><option key={r.id} value={r.id}>{getBlacksmithQuote(save,r.id)!.item.name}</option>)}</select></label><span>{index+1} / {BLACKSMITH_RECIPES.length}</span><button aria-label="Next recipe" disabled={index+1>=BLACKSMITH_RECIPES.length} onClick={()=>setRecipeId(BLACKSMITH_RECIPES[index+1].id)}>›</button></div>
    <div className={s.hero}><div className={s.art}><img src={item.iconPath} alt={item.name}/></div><div><small>ONE FINISHED ITEM · +0</small><h2>{item.name}</h2><strong>{item.quality} / Grade {item.equipmentGrade}</strong><p>{item.effectLabel}</p><small>{getBattleOutfitterStock(save,item)} available in inventory</small></div></div>
    <div className={s.ingredients} aria-label="Recipe cost">{inputs.map(([id,n])=><button key={id} aria-label={`Source ${RESOURCES[id].name}`} onClick={()=>setSource(id)}>{getResourceArt(id)?<img src={getResourceArt(id)} alt=""/>:null}<span><strong>{n} {RESOURCES[id].name}</strong><small>{usable(id)} usable · {(state.reserves[id]??0)} reserved</small></span></button>)}<div><strong>{recipe.laborGold} Gold</strong><small>Labor fee · {save.currencies.gold} owned</small></div></div>
    <div className={s.actions}><button onClick={()=>show('output')}>Result details</button><button onClick={()=>show('comparison')}>Compare</button><button onClick={()=>show('cost')}>Cost breakdown</button><button onClick={()=>show('routes')}>Craft or buy?</button><button className={s.mobileSmith} onClick={()=>setUpgradeOpen(true)}>Improve gear</button></div>
    <footer className={s.footer}><p role="status">{quote.canCraft?'Ready · Instant crafting':`Needed: ${quote.reason}`}</p><button disabled={!quote.canCraft} onClick={review}>Review crafting</button></footer>
   </section>
  </div>
  {source?<IngredientCounter key={source} resourceId={source} needed={Math.max(1,quote.missingInputs[source]??1)} onClose={()=>setSource(null)}/>:null}
  {popup==='review'?<GameDialog title="Review crafting" onClose={()=>setPopup(null)}>{page<outputPages?output:costs}{(!quote.canCraft||revision!==quote.revision)?<p role="alert">Supplies or crafting record changed. Review again.</p>:null}<div className={s.pager}><button onClick={()=>page?setPage(page-1):setPopup(null)}>{page?'Back':'Cancel'}</button><span>{page+1} / {outputPages+1}</span>{page<outputPages?<button onClick={()=>setPage(page+1)}>Review costs</button>:<button disabled={!quote.canCraft||revision!==quote.revision} onClick={confirm}>Confirm crafting</button>}</div></GameDialog>:null}
  {popup==='output'?<GameDialog title="Crafted equipment" onClose={()=>setPopup(null)}>{output}{outputPages>1?pages(outputPages):null}</GameDialog>:null}
  {popup==='cost'?<GameDialog title="Materials & labor" onClose={()=>setPopup(null)}>{costs}</GameDialog>:null}
  {popup==='comparison'?<GameDialog title="Equipment comparison" onClose={()=>setPopup(null)}>{creature&&comparison?<div className={s.popupBody}><label>Compare for <select aria-label="Compare equipment for" value={creature.creatureId} onChange={e=>{setCreatureId(e.target.value);setPage(0);}}>{save.creatures?.map(c=><option key={c.creatureId} value={c.creatureId}>{c.nickname}</option>)}</select></label><p>Replaces {comparison.previous?.name??'an empty slot'} when equipped.</p><table className={s.table}><thead><tr><th>Stat</th><th>Current</th><th>After</th><th>Change</th></tr></thead><tbody>{comparison.rows.slice(page*2,page*2+2).map(row=><tr key={row.key}><th>{row.label}</th><td>{row.current}</td><td>{row.after}</td><td>{row.delta>0?'+':''}{row.delta}</td></tr>)}</tbody></table>{pages(comparisonPages)}</div>:<p>No creature available. Crafted gear goes into inventory.</p>}</GameDialog>:null}
  {popup==='routes'?<GameDialog title="Craft or buy?" onClose={()=>setPopup(null)}><div className={s.popupBody}>{page===0?<><p>Ready-made at Outfitter: <strong>{item.costGold} Gold</strong>.</p><p>Buy missing materials + labor: <strong>{quote.procurementGold} Gold</strong>.</p><p>{quote.restockGold?`Missing: ${resourceList(quote.missingInputs)} · ${quote.restockGold} Gold at Trade.`:'Unreserved stock covers the materials.'} Purchases are separate.</p></>:<><p>Stored material value: {quote.materialValue} Gold. With labor: {quote.totalValue} Gold.</p><p>Both routes give the same +0 equipment. Iona uses her town forge; no farm forge is required.</p><button onClick={goToBattleOutfitter}>Visit Outfitter</button></>}{pages(2)}</div></GameDialog>:null}
  {popup==='report'?<GameDialog title="Iona’s Crafting Receipt" onClose={()=>setPopup(null)}><div className={s.popupBody}><p role="status">{message}</p><p>Balance: {save.currencies.gold} Gold.</p><button onClick={()=>setPopup(null)}>Back to forge</button></div></GameDialog>:null}
  {popup==='talk'?<GameDialog title="A Word with Iona" onClose={()=>setPopup(null)}><p>“Petra builds the places you come home to. I make the pieces you take out into the world.”</p><p>Bring refined Iron ingots, not ore. Ingredient cards show where to buy or produce them. Every pattern has fixed stats and an exact labor fee.</p></GameDialog>:null}
 </main>;
}
