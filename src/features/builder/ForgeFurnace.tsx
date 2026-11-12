"use client";

import {useRef, useState} from 'react';
import {getVariantDefinition} from '@/data/creatures';
import {RECIPES, RESOURCES, craftResource, getFarmState, recipePreview, recipeWorkerBlocker, type ResourceId} from '@/data/farmResources';
import {getResourceArt} from '@/data/resourceArt';
import {useGameContext} from '@/state/GameProvider';
import {FORGE_ART, ForgeIcon, ForgeWindow} from './ForgeWindow';
import s from './ForgeGallery.module.css';

const ironRecipe = RECIPES.find(({id}) => id === 'iron')!;
const inputs = Object.entries(ironRecipe.inputs) as [ResourceId, number][];
const workersPerPage = 3;

type Props = {
  item: {name: string; iconPath?: string};
  missing: number;
  onClose: () => void;
};

export function ForgeFurnace({item, missing, onClose}: Props) {
  const {currentSave: save, saveCurrentGame} = useGameContext();
  const [batches, setBatches] = useState(() => Math.min(20, Math.max(1, Math.ceil(missing / ironRecipe.output))));
  const [workerId, setWorkerId] = useState(() => {
    const creatures = save?.creatures ?? [];
    return (save && creatures.find(creature => !recipeWorkerBlocker(save, 'iron', batches, creature)))?.creatureId
      ?? creatures[0]?.creatureId ?? '';
  });
  const [view, setView] = useState<'recipe' | 'workers' | 'review' | 'receipt'>('recipe');
  const [workerPage, setWorkerPage] = useState(0);
  const [receipt, setReceipt] = useState<{message: string; ok: boolean}>();
  const confirmed = useRef(false);
  const reviewedSave = useRef(save);

  if (!save) return null;

  const farm = getFarmState(save);
  const workers = (save.creatures ?? []).map(creature => ({
    creature,
    cost: recipePreview(save, 'iron', batches, creature)!.energy,
    blocker: recipeWorkerBlocker(save, 'iron', batches, creature),
  }));
  const worker = workers.find(({creature}) => creature.creatureId === workerId) ?? workers.find(entry => !entry.blocker) ?? workers[0];
  const pages = Math.ceil(workers.length / workersPerPage);
  const page = Math.max(0, Math.min(workerPage, pages - 1));
  const output = batches * ironRecipe.output;
  const close = view === 'workers' || view === 'review' ? () => setView('recipe') : onClose;

  function confirm() {
    if (!save || !worker || worker.blocker || confirmed.current) return;
    if (reviewedSave.current !== save) {
      setReceipt({ok: false, message: 'The ranch changed. Review the current materials and Energy before confirming.'});
      setView('receipt');
      return;
    }
    confirmed.current = true;
    const result = craftResource(save, 'iron', batches, worker.creature.creatureId);
    if (result.ok) saveCurrentGame(result.save);
    setReceipt({ok: result.ok, message: result.message});
    setView('receipt');
  }

  const title = view === 'workers' ? 'Choose a crafter' : view === 'review' ? 'Review production' : view === 'receipt' ? 'Production receipt' : 'Iron furnace';
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
        : <button className={s.primary} onClick={receipt?.ok ? onClose : () => setView('recipe')}>{receipt?.ok ? 'Back to ingredient sources' : 'Back to furnace'}</button>}
    </div>
  );

  return (
    <ForgeWindow title={title} marker="forge-furnace" onClose={close} footer={footer}>
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
        <section className={s.furnaceLedger}>
          <h3>{receipt?.ok ? 'Production complete' : 'Production stopped'}</h3>
          <p role="status">{receipt?.message}</p>
          {receipt?.ok && <p>{missing ? `${missing} Iron ingots still missing for ${item.name}.` : `Iron ingots covered for ${item.name}.`}</p>}
        </section>
      ) : (
        <>
          <div className={s.furnaceContext}><img src={item.iconPath} alt=""/><strong>{item.name}</strong><span>{missing ? `${missing} Iron ingots missing` : 'Iron ingots covered'}</span></div>
          <div className={s.furnaceGrid}>
            <section className={s.furnaceCrafter}>
              <img className={s.furnaceArt} src={`${FORGE_ART}iron-furnace.webp`} alt=""/>
              {view === 'recipe' ? <button className={s.furnaceWorker} aria-label="Change crafter" onClick={() => {
                setWorkerPage(Math.floor(Math.max(0, workers.indexOf(worker)) / workersPerPage));
                setView('workers');
              }}>
                {worker && <img src={getVariantDefinition(worker.creature.variantId).portraitPath} alt=""/>}
                <span><small>Crafter</small><strong>{worker?.creature.nickname ?? 'Choose a crafter'}</strong></span>
                {worker && <b>{worker.cost} Energy</b>}<ForgeIcon name="next"/>
              </button> : <p><strong>{worker?.creature.nickname}</strong> · {worker?.cost} Energy</p>}
            </section>
            <section className={s.furnaceLedger}>
              <div className={s.furnaceBatches}>
                <strong>Batches</strong>
                {view === 'recipe' ? <div className={s.ingredientStepper}>
                  <button aria-label="Decrease batches" disabled={batches === 1} onClick={() => setBatches(batches - 1)}>−</button>
                  <output aria-label="Recipe batches">{batches}</output>
                  <button aria-label="Increase batches" disabled={batches === 20} onClick={() => setBatches(batches + 1)}>+</button>
                </div> : <b>{batches}</b>}
              </div>
              {inputs.map(([id, amount]) => {
                const usable = Math.max(0, (farm.stock[id] ?? 0) - (farm.reserves[id] ?? 0));
                return <div key={id} className={s.furnaceResource} data-short={usable < batches * amount}>
                  <img src={getResourceArt(id)} alt=""/><span><strong>{RESOURCES[id].name}</strong><small>{usable} usable</small></span><b>{batches * amount} <small>({amount} per batch)</small></b>
                </div>;
              })}
              <div className={s.furnaceYield} aria-hidden="true">↓</div>
              <div className={s.furnaceResource} data-output><img src={getResourceArt('iron')} alt=""/><strong>Iron ingots</strong><b>{output} <small>({ironRecipe.output} per batch)</small></b></div>
              {!farm.facilities.furnace && <p role="status">Build Iron furnace first.</p>}
              {farm.facilities.furnace && worker?.blocker && <p role="status">{worker.blocker}</p>}
            </section>
          </div>
        </>
      )}
    </ForgeWindow>
  );
}
