"use client";

import {useRef, useState} from 'react';
import {getVariantDefinition} from '@/data/creatures';
import {RECIPES, RESOURCES, craftResource, getFarmState, recipePreview, recipeWorkerBlocker, type ResourceId} from '@/data/farmResources';
import {getResourceArt} from '@/data/resourceArt';
import {useGameContext} from '@/state/GameProvider';
import {FORGE_ART, ForgeIcon, ForgeWindow} from './ForgeWindow';
import s from './ForgeGallery.module.css';

const workersPerPage = 3;

type Props = {
  item: {name: string; iconPath?: string};
  resourceId: 'iron' | 'nails';
  missing: number;
  crafting: {laborGold: number; ready: boolean; reason?: string; onReview: () => void};
  shortages: {id: ResourceId; missing: number; required: number}[];
  onClose: () => void;
};

export function ForgeFurnace({item, resourceId, missing, shortages, crafting, onClose}: Props) {
  const recipe = RECIPES.find(({id}) => id === resourceId)!;
  const inputs = Object.entries(recipe.inputs) as [ResourceId, number][];
  const nails = resourceId === 'nails';
  const name = nails ? 'Small forge' : 'Iron furnace';
  const outputName = RESOURCES[resourceId].name;
  const artwork = FORGE_ART + (nails ? 'small-forge.webp' : 'iron-furnace.webp');
  const {currentSave: save, saveCurrentGame} = useGameContext();
  const [batches, setBatches] = useState(() => Math.min(20, Math.max(1, Math.ceil(missing / recipe.output))));
  const [workerId, setWorkerId] = useState(() => {
    const creatures = save?.creatures ?? [];
    return (save && creatures.find(creature => !recipeWorkerBlocker(save, resourceId, batches, creature)))?.creatureId
      ?? creatures[0]?.creatureId ?? '';
  });
  const [view, setView] = useState<'recipe' | 'workers' | 'review' | 'receipt'>('recipe');
  const [workerPage, setWorkerPage] = useState(0);
  const [receipt, setReceipt] = useState<{ok: false; message: string} | {ok: true; crafter: string; energy: number; output: number}>();
  const confirmed = useRef(false);
  const reviewedSave = useRef(save);

  if (!save) return null;

  const farm = getFarmState(save);
  const workers = (save.creatures ?? []).map(creature => ({
    creature,
    cost: recipePreview(save, resourceId, batches, creature)!.energy,
    blocker: recipeWorkerBlocker(save, resourceId, batches, creature),
  }));
  const worker = workers.find(({creature}) => creature.creatureId === workerId) ?? workers.find(entry => !entry.blocker) ?? workers[0];
  const pages = Math.ceil(workers.length / workersPerPage);
  const page = Math.max(0, Math.min(workerPage, pages - 1));
  const output = batches * recipe.output;
  const ironRequired = shortages.find(entry => entry.id === 'iron')?.required ?? 0;
  const ironUsable = Math.max(0, (farm.stock.iron ?? 0) - (farm.reserves.iron ?? 0));
  const ironShortAfter = Math.max(0, ironRequired - (ironUsable - batches));
  const close = view === 'workers' || view === 'review' ? () => setView('recipe') : onClose;

  function confirm() {
    if (!save || !worker || worker.blocker || confirmed.current) return;
    if (reviewedSave.current !== save) {
      setReceipt({ok: false, message: 'The ranch changed. Review the current materials and Energy before confirming.'});
      setView('receipt');
      return;
    }
    confirmed.current = true;
    const result = craftResource(save, resourceId, batches, worker.creature.creatureId);
    if (result.ok) saveCurrentGame(result.save);
    setReceipt(result.ok ? {ok: true, crafter: worker.creature.nickname, energy: worker.cost, output} : {ok: false, message: result.message});
    setView('receipt');
  }

  const title = view === 'workers' ? 'Choose a crafter' : view === 'review' ? 'Review production' : view === 'receipt' ? 'Production receipt' : name;
  const footer = (
    <div className={s.furnaceActions}>
      {view === 'recipe' ? <>
        <button onClick={onClose}><ForgeIcon name="back"/>Back to ingredient sources</button>
        <button className={s.primary} disabled={!worker || Boolean(worker.blocker)} onClick={() => {
          reviewedSave.current = save;
          confirmed.current = false;
          setView('review');
        }}>Review production</button>
      </> : view === 'review' ? <>
        <button onClick={close}>Cancel</button>
        <button className={s.primary} disabled={!worker || Boolean(worker.blocker)} onClick={confirm}>Confirm production</button>
      </> : view === 'workers' ? <button onClick={close}>Back to furnace</button>
        : receipt?.ok ? <div className={s.furnaceReceiptActions}>
          <button onClick={onClose}>Back to ingredient sources</button>
          <button className={s.primary} disabled={!crafting.ready} onClick={crafting.onReview}>Review crafting</button>
        </div> : <button className={s.primary} onClick={() => setView('recipe')}>Back to furnace</button>}
    </div>
  );

  return (
    <ForgeWindow title={title} marker="forge-furnace" subtitle={view === 'review' ? name : view === 'recipe' ? (nails ? 'Forge nails' : 'Smelt iron ingots') : undefined} onClose={close} footer={footer}>
      {view === 'workers' ? (
        <section className={s.furnaceRoster}>
          {workers.length === 0 && <p>No creature workers available.</p>}
          {workers.slice(page * workersPerPage, (page + 1) * workersPerPage).map(entry => {
            const {creature, cost, blocker} = entry;
            return (
              <button key={creature.creatureId} disabled={Boolean(blocker)} aria-pressed={worker?.creature.creatureId === creature.creatureId}
                onClick={() => {setWorkerId(creature.creatureId); setView('recipe');}}>
                <img src={getVariantDefinition(creature.variantId).portraitPath} alt=""/>
                <span><strong>{creature.nickname}</strong><small>{creature.energy}/{creature.maxEnergy} Energy · Costs {cost}</small>{blocker && <small>{blocker}</small>}</span>
              </button>
            );
          })}
          {pages > 1 && <nav className={s.ingredientPager} aria-label="Crafter pages">
            <button disabled={!page} aria-label="Previous crafters" onClick={() => setWorkerPage(page - 1)}><ForgeIcon name="back"/></button>
            <span>{page + 1} / {pages}</span>
            <button disabled={page + 1 >= pages} aria-label="Next crafters" onClick={() => setWorkerPage(page + 1)}><ForgeIcon name="next"/></button>
          </nav>}
        </section>
      ) : view === 'receipt' ? (
        receipt?.ok ? (
          <div className={`${s.furnaceReceipt} ${s.forgeReceiptSplit}`}>
            <div className={s.furnaceReceiptBanner}>
              <img src={artwork} alt=""/>
              <strong>{name}</strong>
            </div>
            <section className={`${s.furnaceLedger} ${s.forgeReceiptHero}`}>
              <div className={s.furnaceReceiptItem}><img src={item.iconPath} alt=""/><h3>{item.name}</h3></div>
              <ul className={s.furnaceShortages} aria-label="Recipe materials">
                {shortages.every(entry => !entry.missing) ? <li data-covered>Materials covered</li> : !missing && <li data-covered>{outputName} covered</li>}
                {shortages.filter(entry => entry.missing > 0).map(({id, missing: amount}) => (
                  <li key={id}>{amount} {amount === 1 && id === 'nails' ? 'Nail' : amount === 1 && id === 'iron' ? 'Iron ingot' : RESOURCES[id].name} still missing</li>
                ))}
              </ul>
              <img className={s.forgeReceiptSaber} src={item.iconPath} alt=""/>
            </section>
            <dl className={`${s.furnaceLedger} ${s.furnaceReceiptRows}`}>
              <div><dt>Crafter</dt><dd>{receipt.crafter}</dd></div>
              <div><dt>Batches</dt><dd>{batches}</dd></div>
              {inputs.map(([id, amount]) => (
                <div key={id}><dt><img src={getResourceArt(id)} alt=""/>{RESOURCES[id].name} used</dt><dd>{amount * batches}</dd></div>
              ))}
              <div><dt><span className={s.receiptEnergy} aria-hidden="true">ϟ</span>Energy spent</dt><dd>{receipt.energy}</dd></div>
              <div data-produced><dt><img src={getResourceArt(resourceId)} alt=""/>{outputName} produced</dt><dd>{receipt.output}</dd></div>
            </dl>
            <section className={`${s.furnaceLedger} ${s.forgeReceiptRequirements}`}>
              <h3>Crafting requirements</h3>
              <dl className={s.forgeReceiptChecklist}>
                {shortages.map(({id, required, missing: amount}) => (
                  <div key={id} data-covered={!amount}>
                    <dt><img src={getResourceArt(id)} alt=""/>{RESOURCES[id].name}</dt>
                    <dd>{required - amount}/{required} <span aria-label={amount ? 'Missing' : 'Covered'}>{amount ? '!' : '✓'}</span></dd>
                  </div>
                ))}
                <div data-covered={save.currencies.gold >= crafting.laborGold}>
                  <dt><ForgeIcon name="coin"/>Labor</dt>
                  <dd>{crafting.laborGold} Gold <span aria-label={save.currencies.gold >= crafting.laborGold ? 'Covered' : 'Missing'}>{save.currencies.gold >= crafting.laborGold ? '✓' : '!'}</span></dd>
                </div>
              </dl>
              {!crafting.ready && <p>{crafting.reason}</p>}
            </section>
          </div>
        ) : <section className={s.furnaceLedger}><p role="status">{receipt?.message}</p></section>
      ) : (
        <>
          {view === 'recipe' && <div className={s.furnaceContext}><img src={item.iconPath} alt=""/><strong>{item.name}</strong><span>{missing ? `${missing} ${missing === 1 && nails ? 'Nail' : outputName} missing` : `${outputName} covered`}</span></div>}
          <div className={s.furnaceGrid} data-review={view === 'review'}>
            <section className={s.furnaceCrafter}>
              <img className={s.furnaceArt} src={artwork} alt=""/>
              <button className={s.furnaceWorker} aria-label="Change crafter" onClick={() => {
                setWorkerPage(Math.floor(Math.max(0, workers.indexOf(worker)) / workersPerPage));
                setView('workers');
              }}>
                {worker && <img src={getVariantDefinition(worker.creature.variantId).portraitPath} alt=""/>}
                <span><small>Crafter</small><strong>{worker?.creature.nickname ?? 'Choose a crafter'}</strong></span>
                {worker && <b>{worker.cost} Energy</b>}<ForgeIcon name="next"/>
              </button>
            </section>
            <section className={s.furnaceLedger}>
              <div className={s.furnaceBatches}>
                {view === 'review' ? <span className={s.furnaceReceiptItem}><img src={item.iconPath} alt=""/><strong>{item.name}</strong></span> : <strong>Batches</strong>}
                {view === 'recipe' ? <div className={s.ingredientStepper}>
                  <button aria-label="Decrease batches" disabled={batches === 1} onClick={() => setBatches(batches - 1)}>−</button>
                  <output aria-label="Recipe batches">{batches}</output>
                  <button aria-label="Increase batches" disabled={batches === 20} onClick={() => setBatches(batches + 1)}>+</button>
                </div> : <b>{batches} {batches === 1 ? 'batch' : 'batches'}</b>}
              </div>
              {inputs.map(([id, amount]) => {
                const usable = Math.max(0, (farm.stock[id] ?? 0) - (farm.reserves[id] ?? 0));
                return <div key={id} className={s.furnaceResource} data-short={usable < batches * amount}>
                  <img src={getResourceArt(id)} alt=""/><span><strong>{RESOURCES[id].name}</strong><small>{usable} usable</small></span><b>{batches * amount} <small>({amount} per batch)</small></b>
                </div>;
              })}
              <div className={s.furnaceYield} aria-hidden="true">↓</div>
              <div className={s.furnaceResource} data-output><img src={getResourceArt(resourceId)} alt=""/><strong>{outputName}</strong><b>{output} <small>({recipe.output} per batch)</small></b></div>
              {worker?.blocker && <p role="status">{worker.blocker}</p>}
              {nails && !worker?.blocker && ironRequired > 0 && ironShortAfter > 0 && (
                <p role="status">{item.name} will still need {ironShortAfter} {ironShortAfter === 1 ? 'Iron ingot' : 'Iron ingots'}.</p>
              )}
            </section>
          </div>
        </>
      )}
    </ForgeWindow>
  );
}
