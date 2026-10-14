import { planIngredientFeeding, RESOURCES } from './farmResources';
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
  let legacy = Math.max(0, Math.floor(Number(save.flags.ranchFeedStock) || 0));
  let shortage = 0;
  const days = [];
  for (let n = 0; n < horizon; n++) {
    const feeding = planIngredientFeeding(projected, needs);
    projected = feeding.save;
    const legacyUsed = Math.min(legacy, nightlyNeed - feeding.covered);
    legacy -= legacyUsed;
    const missing = nightlyNeed - feeding.covered - legacyUsed;
    shortage += missing;
    days.push({ night: n + 1, required: nightlyNeed, covered: nightlyNeed - missing, shortage: missing });
  }
  return { nights: horizon, nightlyNeed, shortage, days, topUpGold: shortage * RESOURCES.rations.price };
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
