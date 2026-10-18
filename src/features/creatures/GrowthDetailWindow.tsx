"use client";
import { Fragment, useState } from 'react';
import { getCombinedGrowthProfile, getSpeciesDefinition, getVariantDefinition } from '@/data/creatures';
import { getLevelGrowthAcceleration, STAT_GROWTH_MULTIPLIERS } from '@/data/levelGrowth';
import type { CreatureRecord, CreatureStatKey } from '@/types/creature';
import { GameDialog } from '@/features/ui/GameDialog';
import { rangeText, type GrowthLedgerPreview } from './growthLedgerPreview';
import s from './GrowthDetailWindow.module.css';

export function GrowthDetailWindow({ creature, statKey, label, icon, preview, strongest, onClose }: {
  creature: CreatureRecord; statKey: CreatureStatKey; label: string; icon: string;
  preview: GrowthLedgerPreview; strongest: string; onClose: () => void;
}) {
  const [mode, setMode] = useState<'progress' | 'projection' | 'factors' | 'notes' | 'context'>('progress');
  const p = preview.projections[statKey];
  const nextMin = preview.stats[statKey], nextMax = nextMin + (preview.uncertain ? 1 : 0);
  const profile = getCombinedGrowthProfile(creature.speciesId, creature.variantId)[statKey];
  const grade = creature.statGrades[statKey];
  const gradeMultiplier = STAT_GROWTH_MULTIPLIERS[grade];
  const ageMultiplier = getLevelGrowthAcceleration(creature.level);
  const factors = [
    { id: 'species', title: 'Species + variant', value: `${profile}%`, sub: 'of one point', description: 'Base profile for this species and variant.' },
    { id: 'grade', title: `Innate grade ${grade}`, value: gradeMultiplier.toFixed(2), sub: 'grade multiplier', description: 'Growth multiplier from innate potential.' },
    { id: 'young', title: 'Young growth', value: ageMultiplier.toFixed(2), sub: 'age multiplier', description: 'Multiplier for young creatures.' },
  ];
  const formula = `${profile}% × ${gradeMultiplier.toFixed(2)} × ${ageMultiplier.toFixed(2)} → ${p.nextLevelGainPercent}%`;
  const formulaNote = profile * gradeMultiplier * ageMultiplier > 135 ? 'rounded; capped at 135%' : 'rounded';
  const projected = rangeText(preview.uncertain ? 0 : p.projectedProgressPercent, p.projectedProgressPercent);
  const notes = [
    { title: 'Growth changes with level', icon: '/images/ui/stats-growth-b/factors-a/young.webp', text: 'Young creatures grow faster. Estimates use their current growth rate, which may slow as they level up.' },
    { title: 'Some rewards can add extra growth', icon: '/images/ui/creature-overview-a-v2/painted-r4/talents.webp', text: 'This forecast shows normal level-up growth. Extra growth awarded by a task or event is calculated separately.' },
    { title: 'Every level gives at least one attribute point', icon: '/images/ui/stats-growth-b/factors-a/grade.webp', text: 'If normal growth doesn’t complete a point, one attribute receives a guaranteed point. When that attribute isn’t known yet, the forecast shows a possible range.' },
  ];
  return <GameDialog title={`${label} · Growth details`} onClose={onClose} titleIcon={<img src={icon} alt=""/>} wide>
    <div className={s.window} data-growth-window data-mode={mode}>
      <div className={s.tabs} aria-label="Growth detail sections">
        <button aria-pressed={mode === 'progress'} onClick={() => setMode('progress')}>Progress</button>
        <button className={s.projectionTab} aria-pressed={mode === 'projection'} onClick={() => setMode('projection')}>Projection</button>
        <button aria-pressed={mode === 'factors'} onClick={() => setMode('factors')}>Growth factors</button>
        <button aria-pressed={mode === 'notes'} onClick={() => setMode('notes')}>Forecast notes</button>
        <button aria-pressed={mode === 'context'} onClick={() => setMode('context')}>Creature context</button>
      </div>
      {mode === 'progress' || mode === 'projection' ? <>
        <div className={s.facts}>
          <div className={s.current} data-growth-fact><span>Current value</span><strong><img src={icon} alt=""/>{creature.stats[statKey]}</strong></div>
          <div className={s.current} data-growth-fact><span>Innate grade</span><strong className={s.grade}>{grade}</strong></div>
          <div className={s.current} data-growth-fact><span>Current growth</span><strong>{p.currentProgressPercent}%</strong><progress aria-label="Current attribute growth" value={p.currentProgressPercent} max={100}/></div>
          <div className={s.projected} data-growth-fact><span>Next-level contribution</span><strong className={s.contribution}>+{p.nextLevelGainPercent}%</strong><small>of one attribute point</small></div>
          <div className={s.projected} data-growth-fact><span>Growth after next level</span><strong>{projected}%</strong><progress aria-label="Projected attribute growth" value={p.projectedProgressPercent} max={100}/></div>
        </div>
        <div className={s.explanation}>
          <strong>{label}: {creature.stats[statKey]} → {rangeText(nextMin, nextMax)}</strong>
          <p>{p.willIncreaseNextLevel ? `Base growth adds +${p.statGainNextLevel} ${label} next level.` : `Next ${label} point: estimated ${p.levelsUntilIncrease} levels at the current base rate.`}</p>
          <small>{preview.uncertain ? 'One guaranteed point is assigned at level-up; its attribute is not fixed by this preview.' : 'Growth rate changes with level. Some task or event rewards can add extra growth.'}</small>
        </div>
      </> : <div className={s.factorPanel} data-growth-factors>
        <h3>{mode === 'factors' ? 'Growth rate' : mode === 'notes' ? 'Forecast notes' : 'Creature context'}</h3>
        {mode === 'factors' ? <>
          <div className={s.formulaCards} aria-label="Base-growth formula">
            {factors.map((factor, index) => <Fragment key={factor.id}>
              {index > 0 ? <span className={s.operator} aria-hidden="true">×</span> : null}
              <div className={s.factorCard} data-factor-card>
                <span className={s.factorArt} aria-hidden="true"><img src={`/images/ui/stats-growth-b/factors-a/${factor.id}.webp`} alt=""/>{factor.id === 'grade' ? <span className={s.crestLetter}>{grade}</span> : null}</span>
                <div className={s.factorCopy}><span>{factor.title}</span><strong data-multiplier={index > 0}>{factor.value}</strong><small>{factor.sub}</small></div>
                <p className={s.factorDescription}>{factor.description}</p>
              </div>
            </Fragment>)}
            <span className={s.operator} aria-hidden="true">→</span>
            <div className={`${s.factorCard} ${s.resultCard}`} data-factor-card><span>Next-level contribution</span><strong>+{p.nextLevelGainPercent}%</strong><small>of one point per level<br/> ({formulaNote})</small></div>
          </div>
          <div className={s.rateNote}><span className={s.info} aria-hidden="true">i</span><div><strong>Growth rate changes with level.</strong><p>Capped at 135% of one point per level. Some task or event rewards can add extra growth.</p></div></div>
          <div className={s.formulaSummary} aria-label="Current attribute and formula"><div><span>Current value</span><strong>{creature.stats[statKey]}</strong></div><div><span>Innate grade</span><strong>{grade}</strong></div><div><span>Formula ({formulaNote})</span><strong>{formula}</strong></div></div>
        </> : mode === 'notes' ? <>
          <div className={s.noteCards} aria-label="How to read the forecast">
            {notes.map(note => <article className={s.noteCard} key={note.title} data-growth-card>
              <img src={note.icon} alt=""/><div><h4>{note.title}</h4><p>{note.text}</p></div>
            </article>)}
          </div>
          <div className={s.rateNote}><span className={s.info} aria-hidden="true">i</span><p>Growth progress builds toward the next attribute point. At 100%, the attribute increases by 1 and leftover progress carries over.</p></div>
          <p className={s.equipmentNote}>Equipment adds its bonuses separately. It never changes level-up attributes or innate grades.</p>
        </> : <>
          <div className={s.contextIdentity}><img src="/images/ui/creature-overview-a-v2/painted-r4/identity.webp" alt=""/><div><strong>{creature.nickname} · Level {creature.level} → {creature.level + 1}</strong><span>{getSpeciesDefinition(creature.speciesId).name} · {getVariantDefinition(creature.variantId).name}</span></div></div>
          <div className={s.contextCards}>
            <article className={s.contextCard} data-growth-card><img src="/images/ui/creature-overview-a-v2/sculpted/experience.webp" alt=""/><div><span>Experience</span><strong>{creature.xp} / {creature.xpToNext} XP</strong><progress aria-label="Experience toward next level" value={creature.xp} max={Math.max(1, creature.xpToNext)}/></div></article>
            <article className={s.contextCard} data-growth-card><img src="/images/ui/creature-overview-a-v2/sculpted/energy.webp" alt=""/><div><span>Maximum Energy</span><strong>{preview.currentEnergy} → {rangeText(preview.energyMin, preview.energyMax)}</strong>{preview.uncertain ? <small>Possible range: guaranteed point pending.</small> : null}</div></article>
            <article className={s.contextCard} data-growth-card><img src="/images/ui/creature-overview-a-v2/painted-r4/talents.webp" alt=""/><div><span>Strongest attributes</span><strong className={s.strongest} data-tied={strongest.includes(',')}>{strongest.replace(/^Best stats:\s*/, '').replace(/\.$/, '')} · {Math.max(...Object.values(creature.stats))}</strong></div></article>
            <article className={s.contextCard} data-growth-card><img src={icon} alt=""/><div><span>Selected attribute</span><strong>{label}</strong><small>Current {creature.stats[statKey]} · Innate {grade} · Growth {p.currentProgressPercent}%</small><progress aria-label="Selected attribute growth" value={p.currentProgressPercent} max={100}/></div></article>
          </div>
          <div className={s.rateNote}><span className={s.info} aria-hidden="true">i</span><p>Read-only preview · No XP, Energy or Gold spent.</p></div>
        </>}
      </div>}
      <footer className={s.footer}><span>Creature attributes · Read-only preview</span><button onClick={onClose}>Back to Stats & Growth</button></footer>
    </div>
  </GameDialog>;
}
