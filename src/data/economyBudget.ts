import { planNightFeeding, RESOURCES, getFarmState } from './farmResources';
import { getDailyFeedCost } from './ranchJobsPredator';
import { isCreatureAwayForTraining } from './trainingGrounds';
import { enhancementCost } from './equipmentEnhancement';
import type { BattleOutfitterItem } from './battleOutfitterC3';
import type { GameSave } from '@/types/save';

/** Stock-only forecast: no future earnings, gathering, arrivals, births or rewards assumed. */
export function getFoodBudget(save: GameSave, nights = 7) {
  const horizon = Math.max(1, Math.min(7, Math.floor(nights)));
  const needs = (save.creatures ?? []).filter(c => !isCreatureAwayForTraining(save, c.creatureId))
    .map(creature => ({ creature, amount: getDailyFeedCost(creature) }));
  const nightlyNeed = needs.reduce((sum, n) => sum + n.amount, 0);
  let projected = save;
  let shortage = 0;
  const days = [];
  for (let n = 0; n < horizon; n++) {
    const feeding = planNightFeeding(projected, needs);
    projected = feeding.save;
    const missing = nightlyNeed - feeding.covered;
    shortage += missing;
    days.push({ night: n + 1, required: nightlyNeed, covered: nightlyNeed - missing, shortage: missing });
  }
  const topUpAllowed = !getFarmState(save).excludedFoods?.includes('rations');
  return { nights: horizon, nightlyNeed, shortage, days, topUpAllowed, topUpGold: shortage * RESOURCES.rations.price };
}

export function getUpgradeBudget(save: GameSave, item: BattleOutfitterItem, currentLevel: number, constructionAllowance = 0) {
  const food = getFoodBudget(save);
  const constructionGold = Number.isFinite(constructionAllowance) ? Math.max(0, Math.floor(constructionAllowance)) : 0;
  const rows = [3, 6, 9, 12, 15].filter(target => target > currentLevel).map(target => {
    let gold = 0;
    for (let level = currentLevel; level < target; level++) gold += enhancementCost(item, level);
    const remaining = save.currencies.gold - gold;
    return { target, gold, remaining, afterFood: remaining - food.topUpGold, afterPlan: remaining - food.topUpGold - constructionGold, affordable: remaining >= 0 };
  });
  const withinPlan = rows.filter(row=>row.afterPlan>=0);
  return { food, constructionGold, rows, plannedStop: withinPlan.at(-1)?.target ?? null };
}
