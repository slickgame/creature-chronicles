"use client";

import { useRef, useState } from 'react';
import { useGameContext } from '@/state/GameProvider';
import { GameDialog } from '@/features/ui/GameDialog';
import { IngredientCounter } from '@/features/builder/IngredientCounter';
import { getResourceArt } from '@/data/resourceArt';
import { getVariantDefinition } from '@/data/creatures';
import { SITES, RECIPES, RESOURCES, RESOURCE_IDS, FACILITIES, getFarmState, canSpend, resourceList, workPreview, workerBlocker, workResourceSite, craftResource, serveMeal, mealEnergyRestoration, type SiteId, type ResourceId, type FarmResult } from '@/data/farmResources';
import type { GameSave } from '@/types/save';
import s from './ProductionBook.module.css';

type Section = 'Gathering' | 'Kitchen' | 'Workbench';
export function ProductionBook({ section, onSection, onBack, initialSelection = '' }: { initialSelection?: string; section: Section; onSection: (section: Section) => void; onBack: () => void }) {
  const { currentSave: save, saveCurrentGame } = useGameContext();
  const [selection, setSelection] = useState(initialSelection);
  const [workerId, setWorkerId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [popup, setPopup] = useState<'details' | 'review' | 'serve' | 'receipt' | null>(null);
  const [page, setPage] = useState(0);
  const [source, setSource] = useState<ResourceId | null>(null);
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  if (!save) return null;
  const gathering = section === 'Gathering';
  const entries = gathering ? Object.entries(SITES).map(([id, site]) => ({ id, name: site.name })) : RECIPES.filter(r => ['Food', 'Meals'].includes(RESOURCES[r.id].category) === (section === 'Kitchen')).map(r => ({ id: r.id, name: RESOURCES[r.id].name }));
  const index = Math.max(0, entries.findIndex(e => e.id === selection));
  const entry = entries[index];
  const siteId = entry.id as SiteId;
  const recipe = RECIPES.find(r => r.id === entry.id);
  const resourceId = gathering ? SITES[siteId].resource : entry.id as ResourceId;
  const creature = save.creatures?.find(c => c.creatureId === workerId) ?? save.creatures?.[0];
  const state = getFarmState(save);
  const preview = gathering && creature ? workPreview(save, siteId, creature) : null;
  const cost = Object.fromEntries(Object.entries(recipe?.inputs ?? {}).map(([id, n]) => [id, n * quantity]));
  const output = gathering ? preview?.amount ?? SITES[siteId].amount : recipe!.output * quantity * (resourceId === 'planks' && state.facilities.sawmill ? 2 : 1);
  const reason = gathering ? creature ? workerBlocker(save, creature, siteId) : 'No creature available.' : recipe?.facility && !state.facilities[recipe.facility] ? `Build ${FACILITIES[recipe.facility].name} first.` : !canSpend(state, cost) ? 'Not enough unreserved ingredients.' : null;
  const art = gathering && creature ? getVariantDefinition(creature.variantId).profilePath : getResourceArt(resourceId) ?? (RESOURCES[resourceId].category === 'Meals' ? '/images/items/supply_depot/energy_meal.webp' : '/images/ui/resources-v1/pantry-workbench.webp');
  const inputs = Object.entries(cost) as [ResourceId, number][];
  const canServe = creature && canSpend(state, { [resourceId]: 1 }) && state.meals[creature.creatureId]?.day !== save.dayState.dayNumber;
  const recovered = creature ? Math.max(0, Math.min(creature.maxEnergy - creature.energy, mealEnergyRestoration(resourceId))) : 0;
  function show(next: typeof popup) { busy.current = false; setPage(0); setPopup(next); }
  function apply(action: (s: GameSave) => FarmResult) {
    if (!save || busy.current) return;
    busy.current = true;
    const result = action(save);
    let text = result.message;
    if (result.ok) {
      const persisted = saveCurrentGame(result.save);
      const gold = persisted.currencies.gold - result.save.currencies.gold;
      const gp = persisted.currencies.guildPoints - result.save.currencies.guildPoints;
      const granted = getFarmState(persisted).stock;
      const produced = getFarmState(result.save).stock;
      const bonus = Object.fromEntries(RESOURCE_IDS.map(id => [id, (granted[id] ?? 0) - (produced[id] ?? 0)]).filter(([, n]) => Number(n) > 0));
      const rewards = [gold ? `${gold} Gold` : '', gp ? `${gp} GP` : '', resourceList(bonus)].filter(Boolean);
      if (rewards.length) text += ` Goal rewards: ${rewards.join(' + ')}.`;
    }
    setMessage(text); setPopup('receipt');
  }
  const pager = <div className={s.actions}><button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous details</button><span>{page + 1} / 2</span><button disabled={page === 1} onClick={() => setPage(page + 1)}>Next details</button></div>;
  return <main className={s.book} data-production-book>
    <header><button onClick={onBack}>‹ Resources</button><h1>{gathering ? 'Work locations' : section}</h1><select aria-label="Production section" value={section} onChange={e => { setSelection(''); onSection(e.target.value as Section); }}><option value="Gathering">Work locations</option><option>Kitchen</option><option>Workbench</option></select></header>
    <section className={s.sheet} data-tutorial-id={gathering ? "farm-work-locations" : undefined}>
      <div className={s.selector}><button aria-label="Previous recipe or location" disabled={index === 0} onClick={() => setSelection(entries[index - 1].id)}>‹</button><select aria-label="Select recipe or location" value={entry.id} onChange={e => setSelection(e.target.value)}>{entries.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select><span>{index + 1}/{entries.length}</span><button aria-label="Next recipe or location" disabled={index === entries.length - 1} onClick={() => setSelection(entries[index + 1].id)}>›</button></div>
      <div className={s.hero}><img src={art} alt={gathering ? creature?.nickname ?? entry.name : getResourceArt(resourceId) ? RESOURCES[resourceId].name : 'Recipe illustration'}/><div><small>{gathering ? 'INSTANT WORK · OWNED LOCATION' : recipe?.facility ? FACILITIES[recipe.facility].name : 'INGREDIENTS ONLY · NO GOLD FEE'}</small><h2>{entry.name}</h2><strong>{output} {RESOURCES[resourceId].name}</strong><p>{gathering ? `${preview?.energy ?? '—'} Energy · 0 Gold` : `In storage: ${state.stock[resourceId] ?? 0} · 0 Gold`}</p></div></div>
      <div className={s.controls}>{gathering || RESOURCES[resourceId].category === 'Meals' ? <label>{gathering ? 'Worker' : 'Serve to'}<select aria-label="Production creature" value={creature?.creatureId ?? ''} onChange={e => setWorkerId(e.target.value)}>{save.creatures?.map(c => <option key={c.creatureId} value={c.creatureId}>{c.nickname} · {c.energy}/{c.maxEnergy} Energy</option>)}</select></label> : null}{!gathering && <label>Batches<select aria-label="Recipe batches" value={quantity} onChange={e => setQuantity(Number(e.target.value))}>{[1,5,10,20].map(n => <option key={n}>{n}</option>)}</select></label>}</div>
      {!gathering && <div className={s.ingredients}>{inputs.map(([id,n]) => <button key={id} aria-label={`Source ${RESOURCES[id].name}`} onClick={() => setSource(id)}>{getResourceArt(id) ? <img src={getResourceArt(id)} alt=""/> : null}<span><b>{n} {RESOURCES[id].name}</b><small>{Math.max(0,(state.stock[id] ?? 0)-(state.reserves[id] ?? 0))} usable · {state.reserves[id] ?? 0} reserved</small></span></button>)}</div>}
      <footer><p role="status" data-tutorial-id={gathering ? "chore-security" : undefined}>{reason ?? (gathering ? `Ready · +${preview?.xp ?? 0} work skill XP` : 'Ready · Reserved supplies protected')}</p><div className={s.actions}><button onClick={() => show('details')}>{gathering ? 'Yield & Energy details' : 'Recipe details'}</button>{!gathering && RESOURCES[resourceId].category === 'Meals' && <button disabled={!canServe} onClick={() => show('serve')}>Review serving</button>}<button disabled={!!reason} onClick={() => show('review')}>{gathering ? 'Review work' : 'Review recipe'}</button></div></footer>
    </section>
    {source && <IngredientCounter key={source} resourceId={source} needed={Math.max(1,(cost[source] ?? 1)-Math.max(0,(state.stock[source] ?? 0)-(state.reserves[source] ?? 0)))} onClose={() => setSource(null)}/>}
    {popup === 'details' && <GameDialog title={gathering ? 'Work calculation' : 'Recipe details'} onClose={() => setPopup(null)}><div className={s.details}>{gathering && preview ? page === 0 ? <><p><b>Yield: {output} {RESOURCES[resourceId].name}</b></p><p>Location + facility: {preview.details.base}. Stats: +{preview.details.statBonus}. {preview.details.skillLabel} level {preview.details.skillLevel}: +{preview.details.skillBonus}. Talents: +{preview.details.talentBonus}. Ranch upgrades: +{preview.details.upgradeBonus}.</p><p>{preview.details.stats[0]} counts twice, {preview.details.stats[1]} once. Average {preview.details.score.toFixed(1)}: +1 per 12 points, up to +4. Matching skill adds +1 per 5 levels after level 1, up to +3.</p></> : <><p><b>Energy: {preview.energy} · Skill XP: {preview.xp}</b></p><p>Base {preview.details.baseEnergy} − endurance {preview.details.staminaDiscount} − skill {preview.details.skillBonus} − talents {preview.details.talentDiscount} − ranch upgrades {preview.details.upgradeDiscount} − meal {preview.details.mealDiscount}.</p><p>Endurance uses (2 × STA + WIL) ÷ 30, rounded down, capped at 4. Worker’s stew reduces the remaining cost by 15%, rounded up. Minimum 8 Energy.</p></> : page === 0 ? <><p>{recipe?.effect}</p><p>Makes {output} {RESOURCES[resourceId].name}. Uses {resourceList(cost)}. No Gold charge.</p><p>Owned {state.stock[resourceId] ?? 0} → {(state.stock[resourceId] ?? 0)+output}. Reserved stock is protected.</p></> : <><p>Ingredients valued at {inputs.reduce((n,[id,count]) => n+RESOURCES[id].price*count,0)} Gold at Trade prices. This is a comparison, not a fee.</p><p>{RESOURCES[resourceId].category === 'Meals' ? `${creature?.nickname ?? 'Selected creature'}: +${recovered} Energy when served, capped at maximum. One bonus meal per creature daily; away trainees cannot be served. Pregnancy bonuses do not stack across parents.` : resourceId === 'planks' ? 'A completed Sawmill doubles plank output.' : 'Production is instant. Facility requirements are checked before ingredients are spent.'}</p></>}{pager}</div></GameDialog>}
    {popup === 'review' && <GameDialog title={gathering ? 'Confirm instant work' : 'Confirm recipe'} onClose={() => setPopup(null)}><div className={s.details}><p>{gathering ? `${creature?.nickname}: gain ${output} ${RESOURCES[resourceId].name}, spend ${preview?.energy} Energy. Energy ${creature?.energy} → ${(creature?.energy ?? 0)-(preview?.energy ?? 0)}.` : `Make ${output} ${RESOURCES[resourceId].name} using ${resourceList(cost)}.`}</p><p>0 Gold. {gathering ? `Gain ${preview?.xp} matching work skill XP.` : 'Reserved ingredients stay protected.'}</p><div className={s.actions}><button onClick={() => setPopup(null)}>Cancel</button><button disabled={!!reason} onClick={() => apply(s => gathering ? workResourceSite(s,siteId,creature!.creatureId) : craftResource(s,resourceId,quantity))}>Confirm {gathering ? 'work' : 'recipe'}</button></div></div></GameDialog>}
    {popup === 'serve' && <GameDialog title="Serve one meal" onClose={() => setPopup(null)}><div className={s.details}><p>Use 1 {RESOURCES[resourceId].name} for {creature?.nickname}?</p><p>{recipe?.effect}</p>{mealEnergyRestoration(resourceId)>0 && <p>Energy {creature?.energy} → {(creature?.energy ?? 0)+recovered}.</p>}<div className={s.actions}><button onClick={() => setPopup(null)}>Cancel</button><button onClick={() => apply(s => serveMeal(s,resourceId,creature!.creatureId))}>Confirm serving</button></div></div></GameDialog>}
    {popup === 'receipt' && <GameDialog title="Production receipt" onClose={() => setPopup(null)}><div className={s.details}><p role="status">{message}</p><button onClick={() => setPopup(null)}>Return to page</button></div></GameDialog>}
  </main>;
}
