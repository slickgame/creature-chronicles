"use client";

import { useState } from 'react';
import { getVariantDefinition } from '@/data/creatures';
import { eggInheritanceModel } from '@/data/nurseryInheritanceLedger';
import type { CreatureRecord } from '@/types/creature';
import type { EggRecord } from '@/types/save';
import { GameDialog } from '@/features/ui/GameDialog';
import styles from './NurseryHatchWelcomeC.module.css';

const artwork = '/images/ui/nursery-hatch-welcome-c/';
const statLabels = {
  STR: 'Strength',
  DEX: 'Dexterity',
  STA: 'Stamina',
  CHA: 'Charm',
  WIL: 'Willpower',
  FER: 'Fertility',
} as const;

export function NurseryHatchWelcomeC({ creature, egg, name, onNameChange, onConfirm }: {
  creature: CreatureRecord;
  egg: EggRecord;
  name: string;
  onNameChange: (name: string) => void;
  onConfirm: () => void;
}) {
  const [details, setDetails] = useState(false);
  const title = `${name.trim() || creature.nickname} hatched!`;

  return (
    <GameDialog title={title} onClose={onConfirm} fullScreen dialogClassName={styles.dialog}>
      <main className={styles.scene} data-nursery-hatch-welcome-c>
        <div className={styles.composition}>
          <figure className={styles.portrait}>
            <img
              className={styles.creature}
              src={getVariantDefinition(creature.variantId).portraitPath}
              alt={`${creature.nickname} portrait`}
            />
            <img className={styles.frame} src={`${artwork}portrait-frame.svg`} alt="" />
          </figure>
          <form className={styles.panel} onSubmit={event => {
            event.preventDefault();
            onConfirm();
          }}>
            <h1 className={styles.plaque}>{title}</h1>
            <label className={styles.name}>
              <span>Hatchling name</span>
              <span className={styles.inputWrap}>
                <input
                  value={name}
                  onChange={event => onNameChange(event.target.value)}
                  placeholder={creature.nickname}
                  maxLength={24}
                  autoComplete="off"
                />
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="m4 16-1 5 5-1L20 8l-4-4L4 16Zm14-14 2-1 3 3-1 2Z" fill="currentColor" />
                </svg>
              </span>
            </label>
            <div className={styles.careStrip}>
              <b>First-day care</b>
              <span>Energy · Hearts · Affection</span>
            </div>
            <div className={styles.actions}>
              <button type="button" onClick={() => setDetails(true)}>View details</button>
              <button type="submit" className={styles.confirm}>Confirm Hatchling</button>
            </div>
          </form>
        </div>
        {details && <HatchlingDetails creature={creature} egg={egg} onClose={() => setDetails(false)} />}
      </main>
    </GameDialog>
  );
}

function HatchlingDetails({ creature, egg, onClose }: {
  creature: CreatureRecord;
  egg: EggRecord;
  onClose: () => void;
}) {
  const [section, setSection] = useState<'care' | 'inheritance'>('care');
  const record = eggInheritanceModel(egg);
  return (
    <GameDialog title="Hatchling details" onClose={onClose} dialogClassName={styles.details}>
      <nav className={styles.detailTabs} aria-label="Hatchling details sections">
        <button aria-pressed={section === 'care'} onClick={() => setSection('care')}>Stats &amp; care</button>
        <button aria-pressed={section === 'inheritance'} onClick={() => setSection('inheritance')}>Talents &amp; inheritance</button>
      </nav>
      {section === 'care' ? <>
        <p className={styles.parentage}>{egg.parents.giver.displayName} × {egg.parents.receiver.displayName}</p>
        <p className={styles.parentage}>Joined {record.species} housing · Birth recorded</p>
        <dl className={styles.vitals}>
          <div><dt>Energy</dt><dd>{creature.energy}/{creature.maxEnergy}</dd></div>
          <div><dt>Hearts</dt><dd>{creature.hearts}/{creature.maxHearts}</dd></div>
          <div><dt>Affection</dt><dd>{creature.affection}</dd></div>
        </dl>
        <table className={styles.stats}>
          <thead><tr><th scope="col">Stat</th><th scope="col">Value</th><th scope="col">Grade</th></tr></thead>
          <tbody>{Object.entries(statLabels).map(([key, label]) => {
            const stat = key as keyof typeof statLabels;
            return <tr key={stat}><th scope="row">{label}</th><td>{creature.stats[stat]}</td><td>{creature.statGrades[stat]}</td></tr>;
          })}</tbody>
        </table>
      </> : <>
        {creature.abilities.length ? creature.abilities.map((ability, index) => (
          <article className={styles.talent} key={`${ability.id}-${index}`}>
            <strong>{ability.name}</strong>
            <small>Grade {ability.grade} · {ability.source}</small>
            <p>{ability.description}</p>
          </article>
        )) : <p>No inherited ability recorded.</p>}
        {record.notes.filter(group => group.lines.length).map(group => (
          <details className={styles.notes} key={group.title}>
            <summary>{group.title}</summary>
            {group.lines.map((line, index) => <p key={index}>{line}</p>)}
          </details>
        ))}
      </>}
    </GameDialog>
  );
}
