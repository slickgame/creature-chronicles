"use client";

import { useRef, useState } from 'react';
import { useGameContext } from '@/state/GameProvider';
import { GameDialog } from '@/features/ui/GameDialog';
import { ProductionBook } from './ProductionBook';
import { getResourceArt } from '@/data/resourceArt';
import { RESOURCES, RESOURCE_IDS, RECIPES, SITES, getFarmState, reserveResource, tradeResource, resourceList, type ResourceId, type FarmResult } from '@/data/farmResources';
import type { GameSave } from '@/types/save';
import s from './ResourceShelf.module.css';

export function ResourceShelf({ initialMode, onBack }: { initialMode: 'Storage' | 'Trade'; onBack: () => void }) {
  const { currentSave: save, saveCurrentGame } = useGameContext();
  const [mode, setMode] = useState(initialMode);
  const [category, setCategory] = useState('All');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ResourceId | null>(null);
  const [view, setView] = useState<'details' | 'reserve' | 'buy' | 'sell' | 'review' | 'receipt'>('details');
  const [quantity, setQuantity] = useState(1);
  const [reserve, setReserve] = useState('0');
  const [selling, setSelling] = useState(false);
  const [message, setMessage] = useState('');
  const [production, setProduction] = useState<{section: 'Gathering' | 'Kitchen' | 'Workbench'; id: string} | null>(null);
  const busy = useRef(false);
  if (!save) return null;
  const state = getFarmState(save);
  const ids = RESOURCE_IDS.filter(id => (mode !== 'Trade' || RESOURCES[id].price > 0) && (category === 'All' || RESOURCES[id].category === category) && (!ownedOnly || (state.stock[id] ?? 0) > 0));
  const pages = Math.max(1, Math.ceil(ids.length / 4));
  const currentPage = Math.min(page, pages - 1);
  const id = selected;
  const item = id ? RESOURCES[id] : null;
  const owned = id ? state.stock[id] ?? 0 : 0;
  const reserved = id ? state.reserves[id] ?? 0 : 0;
  const usable = Math.max(0, owned - reserved);
  const price = item ? (selling ? Math.floor(item.price * 0.4) : item.price) * quantity : 0;
  const recipe = RECIPES.find(r => r.id === id);
  const source = Object.entries(SITES).find(([,site]) => site.resource === id);
  const validReserve = /^\d+$/.test(reserve) && Number(reserve) <= 9999;
  function open(resource: ResourceId) { setSelected(resource); setView('details'); setQuantity(1); busy.current = false; }
  function apply(action: (save: GameSave) => FarmResult) {
    if (!save || busy.current) return;
    busy.current = true;
    const result = action(save);
    let receipt = result.message;
    if (result.ok) {
      const persisted = saveCurrentGame(result.save);
      const gold = persisted.currencies.gold - result.save.currencies.gold;
      const gp = persisted.currencies.guildPoints - result.save.currencies.guildPoints;
      const next = getFarmState(persisted).stock, previous = getFarmState(result.save).stock;
      const bonus = Object.fromEntries(RESOURCE_IDS.map(key => [key,(next[key] ?? 0)-(previous[key] ?? 0)]).filter(([,n]) => Number(n)>0));
      const rewards = [gold ? `${gold} Gold` : '', gp ? `${gp} GP` : '', resourceList(bonus)].filter(Boolean);
      if (rewards.length) receipt += ` Goal rewards: ${rewards.join(' + ')}.`;
    }
    setMessage(receipt); setView('receipt');
  }
  function trade(sell: boolean) { setSelling(sell); setView(sell ? 'sell' : 'buy'); busy.current = false; }
  return <main className={s.screen} data-resource-shelf>
    <header><button onClick={onBack}>‹ Resources</button><h1>{mode === 'Trade' ? 'Pella’s Trade Counter' : 'Farm Storage'}</h1><button onClick={() => {setMode(mode === 'Trade' ? 'Storage' : 'Trade');if(category==='Meals')setCategory('All');setPage(0);}}>Open {mode === 'Trade' ? 'Storage' : 'Trade'}</button></header>
    <section className={s.sheet}>
      <div className={s.filters}><label>Category<select aria-label="Resource category" value={category} onChange={e => {setCategory(e.target.value);setPage(0);}}>{['All','Food','Materials','Components',...(mode==='Storage'?['Meals']:[])].map(c => <option key={c}>{c}</option>)}</select></label><label><input type="checkbox" checked={ownedOnly} onChange={e => {setOwnedOnly(e.target.checked);setPage(0);}}/>In stock only</label><span>{save.currencies.gold} Gold</span></div>
      <div className={s.grid}>{ids.slice(currentPage*4,currentPage*4+4).map(resource => <button className={s.card} key={resource} onClick={() => open(resource)} aria-label={`Details for ${RESOURCES[resource].name}`}><img src={getResourceArt(resource) ?? (RESOURCES[resource].category === 'Meals' ? '/images/items/supply_depot/energy_meal.webp' : '/images/ui/resources-v1/pantry-workbench.webp')} alt=""/><span><small>{RESOURCES[resource].category}</small><strong>{RESOURCES[resource].name}</strong><span>Owned {state.stock[resource] ?? 0}</span><span>Reserved {state.reserves[resource] ?? 0} · Usable {Math.max(0,(state.stock[resource] ?? 0)-(state.reserves[resource] ?? 0))}</span>{mode === 'Trade' && <small>Buy {RESOURCES[resource].price} · Sell {Math.floor(RESOURCES[resource].price*0.4)} Gold each</small>}</span></button>)}</div>
      {!ids.length && <p className={s.empty}>No resources match these filters.</p>}
      <footer><button disabled={currentPage===0} onClick={() => setPage(currentPage-1)}>Previous shelf</button><span>{currentPage+1} / {pages} · {ids.length} resources</span><button disabled={currentPage+1>=pages} onClick={() => setPage(currentPage+1)}>Next shelf</button></footer>
    </section>
    {id && item && !production && <GameDialog title={item.name} onClose={() => setSelected(null)}><div className={s.popup}>
      {view === 'details' ? <><p><b>{owned} owned · {reserved} reserved · {usable} usable</b></p><p>{recipe ? recipe.effect : id === 'iron_ore' ? 'Raw ore. Smelt with Charcoal at the furnace to make Iron ingots.' : id === 'eggs' ? 'Food eggs are cooking ingredients, separate from nursery eggs.' : source ? `Collect at ${source[1].name}. Yield and Energy depend on your worker.` : 'Available from Pella’s ingredients counter.'}</p><div className={s.actions}><button onClick={() => {setReserve(String(reserved));setView('reserve');busy.current=false;}}>Set reserve</button>{item.price>0 && <><button onClick={() => trade(false)}>Buy</button><button onClick={() => trade(true)}>Sell</button></>}{(source || recipe) && <button onClick={() => setProduction(source ? {section:'Gathering',id:source[0]} : {section:['Meals','Food'].includes(item.category)?'Kitchen':'Workbench',id})}>{source ? 'Open work location' : 'Open recipe'}</button>}</div></> : view === 'reserve' ? <><p>Protected from recipes, feeding, sales, construction and deliveries. A reserve target can exceed current stock; it does not create supplies.</p><label>Reserve target<input aria-label="Reserve target" type="number" min={0} max={9999} value={reserve} onChange={e => setReserve(e.target.value)}/></label><p>Usable after change: {validReserve ? Math.max(0,owned-Number(reserve)) : 'Enter 0–9999'}.</p><div className={s.actions}><button onClick={() => setView('details')}>Cancel reserve</button><button disabled={!validReserve} onClick={() => apply(s => reserveResource(s,id,Number(reserve)))}>Save reserve</button></div></> : view === 'buy' || view === 'sell' ? <><label>Quantity<select aria-label="Trade quantity" value={quantity} onChange={e => setQuantity(Number(e.target.value))}>{[1,5,10,20].map(n => <option key={n}>{n}</option>)}</select></label><p>{selling ? 'Sell' : 'Buy'} {quantity} for {price} Gold. {selling ? `${usable} unreserved available. Sale price is 40% of purchase price, rounded down per unit.` : `${save.currencies.gold} Gold available.`}</p><div className={s.actions}><button onClick={() => setView('details')}>Back to item</button><button disabled={selling ? usable<quantity : save.currencies.gold<price} onClick={() => setView('review')}>Review trade</button></div></> : view === 'review' ? <><p>{selling ? 'Sell' : 'Buy'} {quantity} {item.name} for <b>{price} Gold</b>?</p><p>Gold: {save.currencies.gold} → {save.currencies.gold+(selling?price:-price)}.<br/>Stock: {owned} → {owned+(selling?-quantity:quantity)}. Reserve stays {reserved}.</p><div className={s.actions}><button onClick={() => setView(selling?'sell':'buy')}>Cancel trade</button><button disabled={selling?usable<quantity:save.currencies.gold<price} onClick={() => apply(s => tradeResource(s,id,quantity,selling))}>Confirm trade</button></div></> : <><p role="status">{message}</p><button onClick={() => {setView('details');busy.current=false;}}>Back to item</button></>}
    </div></GameDialog>}
    {production && <GameDialog fullScreen title="Resource source" onClose={() => setProduction(null)}><ProductionBook section={production.section} initialSelection={production.id} onSection={section => setProduction({section,id:''})} onBack={() => setProduction(null)}/></GameDialog>}
  </main>;
}
