"use client";

import { useState } from 'react';
import type { CreatureRecord } from '@/types/creature';
import type { GameSave } from '@/types/save';
import { getVariantDefinition, CREATURE_PLACEHOLDER_IMAGE } from '@/data/creatures';
import { getCreatureManagementStatus } from '@/data/creatureManagement';
import { getNylaGameplayCardSprite } from '@/data/nylaGameplayArt';
import { getEquineGameplayCardSprite } from '@/data/equineGameplayArt';
import { careStatusTone } from '@/data/carePresentation';
import { PagedItems } from '@/features/ui/PagedItems';
import styles from './CreaturePickerA.module.css';

function portrait(c: CreatureRecord) {
  return getEquineGameplayCardSprite(c, getNylaGameplayCardSprite(c, getVariantDefinition(c.variantId).portraitPath || CREATURE_PLACEHOLDER_IMAGE));
}

export function CreaturePickerA({save, creatures, selectedId, search, filterCount, pageKey, onSearch, onFilters, onClear, onOpen, onCompare, onCards, onFavorite, onLock, onBack}: {
  save: GameSave; creatures: CreatureRecord[]; selectedId?: string; search: string; filterCount: number; pageKey: string;
  onSearch: (value: string) => void; onFilters: () => void; onClear: () => void;
  onOpen: (creature: CreatureRecord) => void; onCompare: () => void; onCards: (creature?: CreatureRecord) => void;
  onFavorite: (creature: CreatureRecord) => void; onLock: (creature: CreatureRecord) => void;
  onBack: () => void;
}) {
  const [previewId, setPreviewId] = useState(selectedId);
  const selected = creatures.find(c => c.creatureId === previewId) ?? creatures[0];
  function badge(c: CreatureRecord) {
    const status = getCreatureManagementStatus(save,c).primaryStatus;
    return <span className={styles.badge} data-tone={careStatusTone(status)}>{status}</span>;
  }
  function favorite(c: CreatureRecord) {
    return <button type="button" aria-label={`${c.isFavorite ? 'Remove favorite' : 'Add favorite'}: ${c.nickname}`} aria-pressed={!!c.isFavorite} onClick={()=>onFavorite(c)}><img className={styles.symbol} style={{opacity:c.isFavorite?1:.45}} src="/images/ui/creature-overview-a-v2/painted-r4/talents.webp" alt=""/></button>;
  }
  function lock(c: CreatureRecord) {
    return <button type="button" aria-label={`${c.isLocked ? 'Unlock' : 'Lock'} creature: ${c.nickname}`} onClick={()=>onLock(c)}><img className={styles.symbol} src={`/images/ui/care-b/icons/lock-${c.isLocked?'closed':'open'}.webp`} alt=""/></button>;
  }
  return <section className={styles.picker} data-creature-picker aria-label="Choose creature" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onBack();}}}>
    <div className={styles.toolbar}>
      <input type="search" aria-label="Search creatures" placeholder="Search creatures…" value={search} onChange={e=>onSearch(e.target.value)}/>
      <button type="button" onClick={onFilters}>Filters & Sort{filterCount ? ` (${filterCount})` : ''}</button>
      <span aria-live="polite">{creatures.length} / {save.creatures?.length ?? 0} creatures</span>
      <button type="button" onClick={()=>onCards(selected)}>Cards</button><button type="button" onClick={onCompare}>Compare</button>
    </div>
    <div className={styles.body}>
      <div className={styles.list}>
        {creatures.length ? <PagedItems key={pageKey} label="Creatures" rowHeight={82} initialItemIndex={creatures.findIndex(c=>c.creatureId===selectedId)} items={creatures.map(c=><article key={c.creatureId} className={styles.row} data-selected={c.creatureId===selected?.creatureId} data-long-name={c.nickname.length>18}>
          {favorite(c)}
          <button type="button" className={styles.select} aria-label={`Select ${c.nickname}`} aria-pressed={c.creatureId===selected?.creatureId} onClick={()=>setPreviewId(c.creatureId)}>
            <img className={styles.portrait} src={portrait(c)} alt=""/>
            <span className={styles.identity}><strong>{c.nickname}</strong><small>{getVariantDefinition(c.variantId).name}<span className={styles.mobileLevel}> · Lv {c.level}</span></small></span>
            <span className={styles.level}>Lv {c.level}</span>
            <span className={styles.vitals}>{badge(c)}<span className={styles.energy}><img src="/images/ui/creature-overview-a-v2/sculpted/energy.webp" alt="Energy"/> {c.energy} / {c.maxEnergy}</span></span>
          </button>
          {lock(c)}
        </article>)}/> : <div className={styles.empty}><h2>No creatures match</h2><p>Try another search or clear the filters.</p><button type="button" onClick={onClear}>Clear filters</button></div>}
      </div>
      {selected ? <article className={styles.summary} aria-label="Selected creature summary">
        <img className={styles.largePortrait} src={portrait(selected)} alt={`${selected.nickname} portrait`}/>
        <div className={styles.summaryText}><h2>{selected.nickname}</h2><p>{getVariantDefinition(selected.variantId).name} · Lv {selected.level}</p><div className={styles.summaryStatus}><span>Status</span>{badge(selected)}</div><p className={styles.summaryEnergy}><span>Energy</span><strong>{selected.energy} / {selected.maxEnergy}</strong></p></div>
        <div className={styles.actions}>{favorite(selected)}{lock(selected)}</div>
        <button className={styles.open} type="button" onClick={()=>onOpen(selected)}>Open profile →</button>
      </article> : null}
    </div>
  </section>;
}
