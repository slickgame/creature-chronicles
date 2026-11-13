"use client";

import {useRef, useState} from 'react';
import {FACILITIES, RECIPES, RESOURCES, SITES, getFarmState, tradeResource, type ResourceId} from '@/data/farmResources';
import {getResourceArt} from '@/data/resourceArt';
import {useGameContext} from '@/state/GameProvider';
import {ProductionBook} from '@/features/resources/ProductionBook';
import {GameDialog} from '@/features/ui/GameDialog';
import {ForgeFurnace} from './ForgeFurnace';
import {ForgeIcon, ForgeWindow} from './ForgeWindow';
import s from './ForgeGallery.module.css';

const sourceArt = '/images/ui/forge-gallery-v1/';

type PurchaseReceipt =
  | {ok: true; count: number; paid: number; balance: number; reward: number}
  | {ok: false; message: string};

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
  const [receipt, setReceipt] = useState<PurchaseReceipt | null>(null);
  const [quantity, setQuantity] = useState<number>();
  const [anchor, setAnchor] = useState(() => Math.max(0, ingredients.findIndex(([id]) => id === initialResource)));
  const [production, setProduction] = useState<'Gathering' | 'Kitchen' | 'Workbench' | 'furnace' | null>(null);
  const busy = useRef(false);
  const pageSize = compact ? 2 : 4;
  const page = Math.floor(anchor / pageSize);

  if (!save) return null;

  const farm = getFarmState(save);
  const options = ingredients.map(([id, required]) => {
    const reserved = farm.reserves[id] ?? 0;
    const usable = Math.max(0, (farm.stock[id] ?? 0) - reserved);
    return {id, required, reserved, usable, missing: Math.max(0, required - usable)};
  });
  const active = options.find(({id}) => id === selected) ?? options[0];
  const visibleOptions = options.slice(page * pageSize, (page + 1) * pageSize);
  const activeOnPage = visibleOptions.some(({id}) => id === active.id);
  const resource = RESOURCES[active.id];
  const recipe = RECIPES.find(({id}) => id === active.id);
  const site = Object.entries(SITES).find(([, entry]) => entry.resource === active.id);
  const facility = recipe?.facility ? FACILITIES[recipe.facility].name : null;
  const facilityLabel = recipe?.facility === 'furnace' ? 'Furnace' : facility;
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
    if (result.ok) {
      const persisted = saveCurrentGame(result.save);
      setReceipt({
        ok: true,
        count,
        paid: cost,
        balance: persisted.currencies.gold,
        reward: persisted.currencies.gold - result.save.currencies.gold,
      });
    } else {
      setReceipt({ok: false, message: result.message});
    }
    setReview(false);
    setQuantity(undefined);
  }

  const title = review ? 'Ingredient purchase review' : receipt ? 'Purchase receipt' : 'Ingredient sources';
  const remaining = options.filter(({id, missing}) => id !== active.id && missing > 0);
  const transactionFooter = review ? (
    <div className={s.purchaseActions}>
      <button onClick={() => setReview(false)}>Cancel</button>
      <button className={s.primary} disabled={!canBuy} onClick={confirmPurchase}>Confirm purchase</button>
    </div>
  ) : receipt ? (
    <div className={s.purchaseActions} data-receipt>
      <button className={s.primary} onClick={() => setReceipt(null)}>Continue sourcing</button>
      <button onClick={onClose}>{backLabel}</button>
    </div>
  ) : undefined;

  return (
    <>
      <ForgeWindow title={title} marker="ingredient-sources" onClose={review ? () => setReview(false) : onClose} backLabel={backLabel} footer={transactionFooter}>
        {!receipt && (
          <div className={s.ingredientItem}>
            <div className={s.ingredientItemArt}><img src={item.iconPath} alt=""/></div>
            <h3>{item.name} +0</h3>
          </div>
        )}
        {review ? (
          <section className={s.purchaseReview} aria-label="Purchase details">
            <figure className={s.purchaseVendor}>
              <img src={`${sourceArt}pella-market-stall.webp`} alt=""/>
              <figcaption>Purchase from Pella</figcaption>
            </figure>
            <div className={s.purchaseDetails}>
              <h3>Review purchase</h3>
              <div className={s.purchaseLine}>
                <span>{getResourceArt(active.id) && <img src={getResourceArt(active.id)} alt=""/>}<strong>{resource.name}</strong></span>
                <span>{count} × {resource.price} Gold</span>
                <strong>{cost} Gold</strong>
              </div>
              <dl className={s.purchaseLedger}>
                <div><dt>Total</dt><dd><ForgeIcon name="coin"/>{cost} Gold</dd></div>
                <div><dt>Balance</dt><dd>{save.currencies.gold} → {save.currencies.gold - cost} Gold</dd></div>
                <div><dt>Reserved</dt><dd>{active.reserved}</dd></div>
              </dl>
            </div>
          </section>
        ) : receipt ? (
          <section className={s.purchaseReceipt}>
            {receipt.ok ? (
              <>
                <div className={s.purchaseSuccess} role="status"><span aria-hidden="true">✓</span><h3>Success</h3></div>
                <div className={s.purchaseReceiptVendor}><img src={`${sourceArt}pella-market-stall.webp`} alt=""/><strong>Purchased from Pella</strong></div>
                <dl className={s.purchaseLedger}>
                  <div><dt>{getResourceArt(active.id) && <img src={getResourceArt(active.id)} alt=""/>}{resource.name} added</dt><dd>{receipt.count}</dd></div>
                  <div><dt><ForgeIcon name="coin"/>Gold paid</dt><dd>{receipt.paid} Gold</dd></div>
                  <div><dt><ForgeIcon name="coin"/>Balance</dt><dd>{receipt.balance} Gold</dd></div>
                  {receipt.reward > 0 && <div><dt>Ranch goal reward</dt><dd>+{receipt.reward} Gold</dd></div>}
                  <div><dt><img src={item.iconPath} alt=""/>{item.name}</dt><dd>{options.some(({missing}) => missing > 0) ? 'Materials still missing' : 'Materials covered'}</dd></div>
                  {options.some(({missing}) => missing > 0) && (
                    <div className={s.purchaseShortages}><dt>Ingredient status</dt><dd>
                      <span>{resource.name} {active.missing ? `· ${active.missing} missing` : 'covered'}</span>
                      {remaining.map(({id, missing}) => <span key={id}>{missing} {id === 'nails' && missing === 1 ? 'Nail' : RESOURCES[id].name} missing</span>)}
                    </dd></div>
                  )}
                </dl>
              </>
            ) : <p role="status">{receipt.message}</p>}
          </section>
        ) : (
          <>
            <div className={s.ingredientNavigation}>
              <div className={s.ingredientPicker} role="group" aria-label="Ingredients">
                {visibleOptions.map(({id, missing, usable, reserved}) => (
                  <button key={id} aria-pressed={id === active.id} onClick={() => selectIngredient(id)}>
                    {getResourceArt(id) && <img src={getResourceArt(id)} alt=""/>}
                    <span className={s.ingredientChipText}>
                      <strong>{RESOURCES[id].name}</strong>
                      <small>
                        <span>{missing ? `${missing} missing` : 'Covered'}</span>
                        {id === active.id && <><span>{usable} usable</span><span>{reserved} reserved</span></>}
                      </small>
                    </span>
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
            {!activeOnPage && <p className={s.ingredientStock}><strong>{resource.name}</strong> · {active.missing} missing · {active.usable} usable · {active.reserved} reserved</p>}
            <div className={s.ingredientSourceCard}>
            <div className={s.ingredientRoutes} role="group" aria-label="Ingredient sources">
              <button aria-pressed={route === 'buy'} onClick={() => setRoute('buy')}>
                Buy from Pella<small>{resource.price > 0 ? `${cost} Gold for ${count}` : 'Unavailable'}</small>
              </button>
              <button aria-pressed={route === 'produce'} onClick={() => setRoute('produce')}>
                Produce at ranch<small>{facility ? `${facilityLabel} · ${facilityStatus}` : site?.[1].name ?? 'Unavailable'}</small>
              </button>
            </div>
            {route === 'buy' ? (
              <section className={s.ingredientPanel} aria-label="Purchase details">
                <img className={s.ingredientStall} src={`${sourceArt}pella-market-stall.webp`} alt=""/>
                <div className={s.ingredientPanelDetails}>
                  <h3>Buy from Pella</h3>
                  <p>{resource.price > 0 ? `${resource.name} — ${resource.price} Gold each` : 'Pella does not sell this ingredient.'}</p>
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
                
                <div className={s.ingredientPanelDetails}>
                  <h3>Produce at ranch</h3>
                  {facility && <div className={s.ingredientFacility}>
                    {recipe?.facility === 'furnace' && <img src={`${sourceArt}iron-furnace.webp`} alt=""/>}
                    <p><strong>{facilityLabel} · {facilityStatus}</strong></p>
                  </div>}
                  {recipe ? (
                    <div className={s.ingredientFormula}>
                      {(Object.entries(recipe.inputs) as [ResourceId, number][]).map(([id, amount]) => (
                        <span key={id}><img src={getResourceArt(id)} alt=""/>{amount} {RESOURCES[id].name}</span>
                      ))}
                      <span>→ <img src={getResourceArt(active.id)} alt=""/>{recipe.output} {active.id === 'iron' && recipe.output === 1 ? 'Iron ingot' : resource.name}</span>
                    </div>
                  ) : <p>{site ? `Gather at ${site[1].name}.` : 'No ranch source is available.'}</p>}
                  {(recipe || site) && <button className={s.primary} onClick={() => setProduction((active.id === 'iron' || active.id === 'nails') ? 'furnace' : productionSection)}>
                    {facility ? `Open ${facilityLabel} recipe` : recipe ? 'Open recipe' : 'Open work location'}
                  </button>}
                </div>
              </section>
            )}
            </div>
          </>
        )}
      </ForgeWindow>
      {production === 'furnace' && (active.id === 'iron' || active.id === 'nails') && <ForgeFurnace resourceId={active.id} item={item} missing={active.missing} shortages={options} onClose={() => setProduction(null)}/>}
      {production && production !== 'furnace' && (
        <GameDialog fullScreen title={`${resource.name} · Production`} onClose={() => setProduction(null)}>
          <ProductionBook section={production} onSection={setProduction} initialSelection={recipe ? active.id : site?.[0]} onBack={() => setProduction(null)}/>
        </GameDialog>
      )}
    </>
  );
}
