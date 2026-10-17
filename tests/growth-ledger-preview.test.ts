import assert from 'node:assert/strict';
import test from 'node:test';
import { createStarterCreatures, STAT_KEYS } from '@/data/creatures';
import { applyCreatureLevelGrowth, getProjectedMaxEnergyForCreature } from '@/data/levelGrowth';
import { growthLedgerPreview } from '@/features/creatures/growthLedgerPreview';

test('natural-growth forecast matches a real base-growth level-up and preserves the record', () => {
  const creature = createStarterCreatures('growth-preview')[0];
  creature.growthProgress = Object.fromEntries(STAT_KEYS.map(key => [key, .9])) as typeof creature.growthProgress;
  const before = structuredClone(creature);
  const preview = growthLedgerPreview(creature);
  const actual = applyCreatureLevelGrowth(creature, 1);
  assert.equal(preview.uncertain, false);
  assert.deepEqual(preview.stats, actual.stats);
  assert.equal(preview.energyMin, getProjectedMaxEnergyForCreature({ ...creature, level: creature.level + 1, stats: actual.stats }));
  assert.equal(preview.energyMax, preview.energyMin);
  assert.deepEqual(creature, before);
  for (const key of STAT_KEYS) assert.ok(Math.abs(preview.projections[key].projectedProgress - actual.growthProgress[key]) < .00001);
});

test('safety-growth ranges contain every seeded result without inventing a winning attribute', () => {
  const creature = { ...createStarterCreatures('growth-preview')[0], level: 90, growthProgress: undefined };
  creature.statGrades = { STR: 'D', DEX: 'D', STA: 'D', CHA: 'D', WIL: 'D', FER: 'D' };
  const before = structuredClone(creature);
  const preview = growthLedgerPreview(creature);
  assert.equal(preview.uncertain, true);
  const winners = new Set<string>();
  for (let length = 1; length <= 12; length++) {
    const actual = applyCreatureLevelGrowth(creature, 1, [], 'x'.repeat(length));
    assert.equal(STAT_KEYS.reduce((sum, key) => sum + actual.stats[key] - creature.stats[key], 0), 1);
    for (const key of STAT_KEYS) {
      assert.ok(actual.stats[key] >= preview.stats[key] && actual.stats[key] <= preview.stats[key] + 1);
      if (actual.stats[key] > creature.stats[key]) winners.add(key);
    }
    const energy = getProjectedMaxEnergyForCreature({ ...creature, level: creature.level + 1, stats: actual.stats });
    assert.ok(energy >= preview.energyMin && energy <= preview.energyMax);
  }
  assert.equal(winners.size, 6);
  assert.deepEqual(creature, before);
});
