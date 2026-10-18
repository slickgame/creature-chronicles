"use client";

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CreatureRecord } from '@/types/creature';
import { useGameContext } from '@/state/GameProvider';
import { CREATURE_NAME_LIMIT, creatureNameError } from '@/data/creatureNaming';
import { getVariantDefinition } from '@/data/creatures';
import { getDeterministicCreatureSex } from '@/data/creatureManagement';
import { getNylaGameplayCardSprite } from '@/data/nylaGameplayArt';
import { getEquineGameplayCardSprite } from '@/data/equineGameplayArt';
import { GameDialog } from '@/features/ui/GameDialog';
import s from './CreatureRenameWindow.module.css';

export function CreatureRenameWindow({creature, onClose, onRenamed}: {creature: CreatureRecord; onClose: () => void; onRenamed: (name: string, message: string) => void}) {
  const {currentSave, renameCreature} = useGameContext();
  const [name, setName] = useState(creature.nickname), [error, setError] = useState('');
  const saveId = useRef(currentSave?.saveId), committing = useRef(false);
  const variant = getVariantDefinition(creature.variantId);
  const portrait = getEquineGameplayCardSprite(creature, getNylaGameplayCardSprite(creature, variant.portraitPath));
  const invalid = creatureNameError(name), unchanged = name.trim() === creature.nickname;
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (invalid || unchanged || committing.current) return;
    if (currentSave?.saveId !== saveId.current) {setError('The active save changed. Close this window and try again.'); return;}
    committing.current = true;
    const result = renameCreature(creature.creatureId, name);
    if (result.ok) onRenamed(name.trim(), result.message);
    else {setError(result.message); committing.current = false;}
  }
  if (typeof document === 'undefined') return null;
  return createPortal(<GameDialog title="Rename creature" onClose={onClose}>
    <form className={s.window} data-creature-rename onSubmit={submit}>
      <div className={s.identity}><div className={s.portrait}><img src={portrait} alt={`${creature.nickname} portrait`}/></div><div><h3>{creature.nickname}</h3><p>{variant.name} · {getDeterministicCreatureSex(creature) === 'female' ? 'Female' : 'Male'}</p><span>{variant.rarity}</span><span>Level {creature.level}</span></div></div>
      <div className={s.editor}><img src="/images/ui/care-b/icons/rename.webp" alt=""/><div><label htmlFor="creature-new-name">New name <small aria-live="polite">{name.length} / {CREATURE_NAME_LIMIT}</small></label><input id="creature-new-name" aria-label="Creature name" data-initial-focus maxLength={CREATURE_NAME_LIMIT} value={name} onChange={event => {setName(event.target.value); setError('');}} aria-describedby="creature-name-help" aria-invalid={Boolean(invalid)}/><p id="creature-name-help">{invalid ?? 'Up to 24 characters.'}</p></div></div>
      <p className={s.note}>Only the name changes.</p>
      {error ? <p className={s.error} role="alert">{error}</p> : null}
      <footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" data-primary disabled={Boolean(invalid || unchanged || error)}>Save name</button></footer>
    </form>
  </GameDialog>, document.body);
}
