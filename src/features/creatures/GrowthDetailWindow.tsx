"use client";
import { Fragment, useState } from 'react';
import { getCombinedGrowthProfile } from '@/data/creatures';
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
          <small>{preview.uncertain ? 'One guaranteed point is assigned at level-up; its attribute is not fixed by this preview.' : 'Growth rate changes as the creature levels. Activity bonuses can affect the result.'}</small>
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
          <div className={s.rateNote}><span className={s.info} aria-hidden="true">i</span><div><strong>Growth rate changes with level.</strong><p>Capped at 135% of one point per level; activity bonuses may affect results.</p></div></div>
          <div className={s.formulaSummary} aria-label="Current attribute and formula"><div><span>Current value</span><strong>{creature.stats[statKey]}</strong></div><div><span>Innate grade</span><strong>{grade}</strong></div><div><span>Formula ({formulaNote})</span><strong>{formula}</strong></div></div>
        </> : mode === 'notes' ? <>
          <p>The next-point estimate uses the current growth rate. Young creatures grow faster; the rate gradually settles as they level.</p>
          <p>{preview.uncertain ? 'No base-growth point completes next level. The level-up safety rule still grants one point, assigned when the activity resolves. Values and Energy are shown as ranges.' : 'This preview uses base growth. Activity-specific growth bonuses can change the final gains.'}</p>
          <p>Completed growth points carry into the attribute value. Innate grades and equipment grades are separate; equipping an item never changes the creature’s innate grade.</p>
        </> : <>
          <dl><div><dt>Experience</dt><dd>{creature.xp} / {creature.xpToNext} XP</dd></div><div><dt>Maximum Energy</dt><dd>{preview.currentEnergy} → {rangeText(preview.energyMin, preview.energyMax)}</dd></div></dl>
          <p>{strongest}</p><p>Previewing growth spends no XP, Energy, or Gold and does not level up the creature.</p>
        </>}
      </div>}
      <footer className={s.footer}><span>Creature attributes · Read-only preview</span><button onClick={onClose}>Back to Stats & Growth</button></footer>
    </div>
  </GameDialog>;
}
