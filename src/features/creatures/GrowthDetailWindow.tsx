"use client";
import { useState } from 'react';
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
  const [mode, setMode] = useState<'progress' | 'projection' | 'factors'>('progress');
  const [factorPage, setFactorPage] = useState(0);
  const p = preview.projections[statKey];
  const nextMin = preview.stats[statKey], nextMax = nextMin + (preview.uncertain ? 1 : 0);
  const profile = getCombinedGrowthProfile(creature.speciesId, creature.variantId)[statKey];
  const grade = creature.statGrades[statKey];
  const projected = rangeText(preview.uncertain ? 0 : p.projectedProgressPercent, p.projectedProgressPercent);
  return <GameDialog title={`${label} · Growth details`} onClose={onClose} wide>
    <div className={s.window} data-growth-window data-mode={mode}>
      <div className={s.tabs} aria-label="Growth detail sections">
        <button aria-pressed={mode === 'progress'} onClick={() => setMode('progress')}>Progress</button>
        <button className={s.projectionTab} aria-pressed={mode === 'projection'} onClick={() => setMode('projection')}>Projection</button>
        <button aria-pressed={mode === 'factors'} onClick={() => setMode('factors')}>Growth factors</button>
      </div>
      {mode !== 'factors' ? <>
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
        <h3>{['Growth rate', 'Forecast notes', 'Creature context'][factorPage]}</h3>
        {factorPage === 0 ? <>
          <dl><div><dt>Species + variant growth</dt><dd>{profile}% of one point</dd></div><div><dt>Innate grade {grade}</dt><dd>×{STAT_GROWTH_MULTIPLIERS[grade].toFixed(2)}</dd></div><div><dt>Young-growth multiplier</dt><dd>×{getLevelGrowthAcceleration(creature.level).toFixed(2)}</dd></div></dl>
          <p>Base profile × grade multiplier × age multiplier. Contribution is capped at 135% of one point per level; completed points carry into the attribute value.</p>
        </> : factorPage === 1 ? <>
          <p>The next-point estimate uses the current growth rate. Young creatures grow faster; the rate gradually settles as they level.</p>
          <p>{preview.uncertain ? 'No base-growth point completes next level. The level-up safety rule still grants one point, assigned when the activity resolves. Values and Energy are shown as ranges.' : 'This preview uses base growth. Activity-specific growth bonuses can change the final gains.'}</p>
          <p>Innate grades and equipment grades are separate. Equipping an item never changes the creature’s innate grade.</p>
        </> : <>
          <dl><div><dt>Experience</dt><dd>{creature.xp} / {creature.xpToNext} XP</dd></div><div><dt>Maximum Energy</dt><dd>{preview.currentEnergy} → {rangeText(preview.energyMin, preview.energyMax)}</dd></div></dl>
          <p>{strongest}</p><p>Previewing growth spends no XP, Energy, or Gold and does not level up the creature.</p>
        </>}
        <div className={s.factorPager} aria-label="Growth factor pages"><button disabled={!factorPage} onClick={() => setFactorPage(factorPage - 1)}>Previous factors</button><span>{factorPage + 1} / 3</span><button disabled={factorPage === 2} onClick={() => setFactorPage(factorPage + 1)}>Next factors</button></div>
      </div>}
      <footer className={s.footer}><span>Creature attributes · Read-only preview</span><button onClick={onClose}>Back to Stats & Growth</button></footer>
    </div>
  </GameDialog>;
}
