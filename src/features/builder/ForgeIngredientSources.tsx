"use client";

import {useRef, useState} from 'react';
import {FACILITIES, RECIPES, RESOURCES, SITES, getFarmState, tradeResource, type ResourceId} from '@/data/farmResources';
import {getResourceArt} from '@/data/resourceArt';
import {useGameContext} from '@/state/GameProvider';
import {ProductionBook} from '@/features/resources/ProductionBook';
import {GameDialog} from '@/features/ui/GameDialog';
import {ForgeIcon, ForgeWindow} from './ForgeWindow';
import s from './ForgeGallery.module.css';

type Props = {
  initialResource: ResourceId;
  ingredients: [ResourceId, number][];
  item: {name: string; iconPath?: string};
  onClose: () => void;
  backLabel: string;
  compact: boolean;
};

export function ForgeIngredientSources({initialResource, ingredients, item, onClose, backLabel, compact}: Props) {
  const {currentSave: save, saveCurrentGame} = useGameContext();
  const [selected, setSelected] = useState(initialResource);
  const [route, setRoute] = useState<'buy' | 'produce'>('buy');
  const [review, setReview] = useState(false);
  const [receipt, setReceipt] = useState('');
  const [quantity, setQuantity] = useState<number>();
  const [anchor, setAnchor] = useState(() => Math.max(0, ingredients.findIndex(([id]) => id === initialResource)));
  const [production, setProduction] = useState<'Gathering' | 'Kitchen' | 'Workbench' | null>(null);
  const busy = useRef(false);
  const pageSize = compact ? 2 : 4;
  const page = Math.floor(anchor / pageSize);

  if (!save) return null;

  const farm = getFarmState(save);
  const options = ingredients.map(([id, required]) => {
    const reserved = farm.reserves[id] ?? 0;
    const usable = Math.max(0, (farm.stock[id] ?? 0) - reserved);
    return {id, reserved, usable, missing: Math.max(0, required - usable)};
  });
  const active = options.find(({id}) => id === selected) ?? options[0];
  const resource = RESOURCES[active.id];
  const recipe = RECIPES.find(({id}) => id === active.id);
  const site = Object.entries(SITES).find(([, entry]) => entry.resource === active.id);
  const facility = recipe?.facility ? FACILITIES[recipe.facility].name : null;
  const facilityStatus = recipe?.facility ? (farm.facilities[recipe.facility] ? 'Built' : 'Not built') : null;
  const count = quantity ?? Math.max(1, Math.min(active.missing, 20));
  const cost = count * resource.price;
  const canBuy = resource.price > 0 && save.currencies.gold >= cost;
  const pages = Math.ceil(options.length / pageSize);
  const productionSection = recipe ? (['Food', 'Meals'].includes(resource.category) ? 'Kitchen' : 'Workbench') : 'Gathering';

  function selectIngredient(id: ResourceId) {
    setSelected(id);
    setQuantity(undefined);
  }

  function confirmPurchase() {
    if (!save || !canBuy || busy.current) return;
    busy.current = true;
    const result = tradeResource(save, active.id, count);
    if (result.ok) saveCurrentGame(result.save);
    setReceipt(result.message);
    setReview(false);
    setQuantity(undefined);
  }

  const title = review ? 'Review ingredient purchase' : receipt ? 'Ingredient purchase' : 'Ingredient sources';
  return (
    <>
      <ForgeWindow title={title} marker="ingredient-sources" onClose={onClose} backLabel={backLabel}>
        <div className={s.ingredientItem}>
          <img src={item.iconPath} alt=""/>
          <h3>{item.name} +0</h3>
        </div>
        {review ? (
          <section className={s.ingredientPanel}>
            <h3>Buy {count} × {resource.name}</h3>
            <p>Total <strong>{cost} Gold</strong></p>
            <p>Gold balance {save.currencies.gold} → {save.currencies.gold - cost}</p>
            <div className={s.actions}>
              <button onClick={() => setReview(false)}>Cancel purchase</button>
              <button className={s.primary} disabled={!canBuy} onClick={confirmPurchase}>Confirm purchase</button>
            </div>
          </section>
        ) : receipt ? (
          <section className={s.ingredientPanel}>
            <p role="status">{receipt}</p>
            <button className={s.primary} onClick={() => setReceipt('')}>Continue sourcing</button>
          </section>
        ) : (
          <>
            <div className={s.ingredientNavigation}>
              <div className={s.ingredientPicker} role="group" aria-label="Ingredients">
                {options.slice(page * pageSize, (page + 1) * pageSize).map(({id, missing}) => (
                  <button key={id} aria-pressed={id === active.id} onClick={() => selectIngredient(id)}>
                    <img src={getResourceArt(id)} alt=""/>
                    <span>{RESOURCES[id].name}<small>{missing ? `${missing} missing` : 'Covered'}</small></span>
                  </button>
                ))}
              </div>
              {pages > 1 && (
                <nav className={s.ingredientPager} aria-label="Ingredient pages">
                  <button aria-label="Previous ingredients" disabled={page === 0} onClick={() => setAnchor((page - 1) * pageSize)}><ForgeIcon name="back"/></button>
                  <span aria-live="polite">{page + 1} / {pages}</span>
                  <button aria-label="Next ingredients" disabled={page + 1 === pages} onClick={() => setAnchor((page + 1) * pageSize)}><ForgeIcon name="next"/></button>
                </nav>
              )}
            </div>
            <p className={s.ingredientStock}><strong>{resource.name}</strong> · {active.missing} missing · {active.usable} usable · {active.reserved} reserved</p>
            <div className={s.ingredientRoutes} role="group" aria-label="Ingredient sources">
              <button aria-pressed={route === 'buy'} onClick={() => setRoute('buy')}>
                Buy from Pella<small>{resource.price > 0 ? `${cost} Gold for ${count}` : 'Unavailable'}</small>
              </button>
              <button aria-pressed={route === 'produce'} onClick={() => setRoute('produce')}>
                Produce at ranch<small>{facility ? `${facility} · ${facilityStatus}` : site?.[1].name ?? 'Unavailable'}</small>
              </button>
            </div>
            {route === 'buy' ? (
              <section className={s.ingredientPanel} aria-label="Purchase details">
                <div className={s.ingredientPanelArt}><ForgeIcon name="coin"/></div>
                <div className={s.ingredientPanelDetails}>
                  <p>{resource.price > 0 ? `${resource.price} Gold each` : 'Pella does not sell this ingredient.'}</p>
                  {resource.price > 0 && (
                    <>
                      <div className={s.ingredientOrder}>
                        <span>Quantity</span>
                        <div className={s.ingredientStepper}>
                          <button aria-label="Decrease quantity" disabled={count <= 1} onClick={() => setQuantity(count - 1)}>−</button>
                          <output aria-label="Ingredient quantity">{count}</output>
                          <button aria-label="Increase quantity" disabled={count >= 20} onClick={() => setQuantity(count + 1)}>+</button>
                        </div>
                        <strong><ForgeIcon name="coin"/>{cost} Gold</strong>
                      </div>
                      {!canBuy && <p role="status">Need {cost - save.currencies.gold} more Gold.</p>}
                      <button className={s.primary} disabled={!canBuy} onClick={() => {busy.current = false; setReview(true);}}>Review purchase</button>
                    </>
                  )}
                </div>
              </section>
            ) : (
              <section className={s.ingredientPanel} aria-label="Production details">
                <div className={s.ingredientPanelArt}><ForgeIcon name="craft"/></div>
                <div className={s.ingredientPanelDetails}>
                  {facility && <p><strong>{facility}</strong> · {facilityStatus}</p>}
                  {recipe ? (
                    <div className={s.ingredientFormula}>
                      {(Object.entries(recipe.inputs) as [ResourceId, number][]).map(([id, amount]) => (
                        <span key={id}><img src={getResourceArt(id)} alt=""/>{amount} {RESOURCES[id].name}</span>
                      ))}
                      <span>→ <img src={getResourceArt(active.id)} alt=""/>{recipe.output} × {resource.name}</span>
                    </div>
                  ) : <p>{site ? `Gather at ${site[1].name}.` : 'No ranch source is available.'}</p>}
                  {(recipe || site) && <button className={s.primary} onClick={() => setProduction(productionSection)}>
                    {facility ? `Open ${facility} recipe` : recipe ? 'Open recipe' : 'Open work location'}
                  </button>}
                </div>
              </section>
            )}
          </>
        )}
      </ForgeWindow>
      {production && (
        <GameDialog fullScreen title={`${resource.name} · Production`} onClose={() => setProduction(null)}>
          <ProductionBook section={production} onSection={setProduction} initialSelection={recipe ? active.id : site?.[0]} onBack={() => setProduction(null)}/>
        </GameDialog>
      )}
    </>
  );
}
