"use client";

import { useRef, useState } from 'react';
import { useGameContext } from '@/state/GameProvider';
import { getCreatureRemovalQuote, type CreatureRemovalMode } from '@/data/creatureRemoval';
import { getVariantDefinition } from '@/data/creatures';
import { getDeterministicCreatureSex } from '@/data/creatureManagement';
import { BATTLE_OUTFITTER_ITEMS } from '@/data/battleOutfitter';
import { getNylaGameplayCardSprite } from '@/data/nylaGameplayArt';
import { getEquineGameplayCardSprite } from '@/data/equineGameplayArt';
import { GameDialog } from '@/features/ui/GameDialog';
import s from './CreatureRemovalWindow.module.css';

const base = '/images/ui/';
export function CreatureRemovalWindow({creatureId, mode, onClose, onRemoved}: {creatureId: string; mode: CreatureRemovalMode; onClose: () => void; onRemoved: (message: string) => void}) {
  const {currentSave, confirmCreatureRemovalReview} = useGameContext();
  const [quote, setQuote] = useState(() => currentSave ? getCreatureRemovalQuote(currentSave, creatureId, mode) : null);
  const [error, setError] = useState(''), [items, setItems] = useState(false), [page, setPage] = useState(0);
  const committing = useRef(false);
  const verb = mode === 'donate' ? 'Donate' : 'Release';
  function confirm() {
    if (!quote || quote.blocker || error || committing.current) return;
    committing.current = true;
    const result = confirmCreatureRemovalReview(quote);
    if (result.ok) onRemoved(result.message);
    else {setError(result.message); committing.current = false;}
  }
  function refresh() {
    setQuote(currentSave ? getCreatureRemovalQuote(currentSave, creatureId, mode) : null);
    setError(''); setPage(0);
  }
  if (!quote) return <GameDialog title={`${verb} creature`} onClose={onClose}><div className={s.window}><p role="status">This creature is no longer available.</p><button onClick={onClose}>Back to Care</button></div></GameDialog>;
  const c = quote.creature, variant = getVariantDefinition(c.variantId);
  const portrait = getEquineGameplayCardSprite(c, getNylaGameplayCardSprite(c, variant.portraitPath));
  const actionIcon = `${base}care-b/icons/${mode}.webp`, pages = Math.max(1, Math.ceil(quote.equipment.length / 2));
  return <GameDialog title={`${verb} ${c.nickname}?`} onClose={onClose}>
    <div className={s.window} data-creature-removal data-long-name={c.nickname.length > 16} data-mode={mode} data-view={items ? 'items' : 'review'}>
      <div className={s.identity}><img src={portrait} alt={`${c.nickname} portrait`}/><div><h3>{c.nickname}</h3><p>{variant.name} · {getDeterministicCreatureSex(c) === 'female' ? 'Female' : 'Male'}</p><span>{variant.rarity}</span><span>Level {c.level}</span></div></div>
      {items ? <section className={s.itemList}><h3>Items returning to inventory</h3><p>The same item copies keep their upgrades and substats.</p>{quote.equipment.slice(page * 2, page * 2 + 2).map(copy => {const item = BATTLE_OUTFITTER_ITEMS.find(i => i.itemId === copy.itemId); return <article key={copy.id}><strong>{item?.name ?? copy.itemId} +{copy.level}</strong><small>Copy #{copy.id.replace(/^gear_/, '')}</small></article>;})}<nav aria-label="Returning equipment pages"><button disabled={!page} onClick={() => setPage(page - 1)}>Previous items</button><span>{page + 1} / {pages}</span><button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next items</button></nav></section> : <>
        <div className={s.decision}><img src={actionIcon} alt=""/><div><p>Permanently removes this creature from your ranch.</p><strong>This cannot be undone.</strong></div></div>
        <div className={s.facts}>
          <div><img src={`${base}talents-c/icons/eager_learner.webp`} alt=""/><p><strong>Family records are preserved.</strong><small>Their record remains in your family history.</small></p></div>
          <div><img src={`${base}creature-overview-a-v2/painted-r4/equipment.webp`} alt=""/><p><strong>Equipped gear</strong><small>{quote.equipment.length ? `${quote.equipment.length} item${quote.equipment.length === 1 ? '' : 's'} will return to inventory.` : 'None.'}</small></p>{quote.equipment.length ? <button onClick={() => {setItems(true); setPage(0);}}>View items ›</button> : null}</div>
        </div>
        <div className={s.reward}><img src={`${base}forge-slate-v2/sculpted/gold-coin.webp`} alt=""/><div><strong>{mode === 'donate' ? 'Donation reward · after confirmation' : 'Release reward'}</strong>{mode === 'donate' ? <b>{quote.reward.gold} Gold + {quote.reward.guildPoints} Guild Point</b> : <p>No reward.</p>}{mode === 'donate' || quote.bonusLabel ? <><p>Gold: {quote.balances.gold} → {quote.afterBalances.gold}</p><p>Guild Points: {quote.balances.guildPoints} → {quote.afterBalances.guildPoints}</p></> : null}{quote.bonusLabel ? <small className={s.bonus}>Starter goals: {quote.bonusLabel}</small> : null}</div></div>
      </>}
      {quote.blocker || error ? <p className={s.blocker} role="alert">{error || quote.blocker}</p> : null}
      <footer>{items ? <button onClick={() => setItems(false)}>Back to review</button> : <>{error ? <button onClick={refresh}>Refresh review</button> : <button data-commit disabled={Boolean(quote.blocker)} onClick={confirm}>{verb} {c.nickname}</button>}<button data-initial-focus onClick={onClose}>Keep creature</button></>}</footer>
    </div>
  </GameDialog>;
}
