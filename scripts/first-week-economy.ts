import { createStarterCreatures } from '@/data/creatures';
import { createNewGameSave } from '@/lib/save/localSave';
import { actSupplyOrder, workResourceSite, craftResource, commissionFacility, getFarmState } from '@/data/farmResources';
import { projectRanchDay } from '@/data/ranch-day/ranchDayLifecycle';
import { enterEveningReview } from '@/data/ranch-day/ranchDayState';
import { purchaseBattleOutfitterItem } from '@/data/battleOutfitter';
import { getEquipmentCopies, enhanceEquipment } from '@/data/equipmentInstances';
import { getFoodBudget } from '@/data/economyBudget';
import type { GameSave } from '@/types/save';

// Deterministic, modest farm route: no mission/battle income, sales or repeated deliveries.
export function simulateFirstWeek() {
  let save = createNewGameSave('First-week economy', 0);
  save = { ...save, saveId: 'economy-first-week' as GameSave['saveId'] };
  save.creatures = createStarterCreatures(save.saveId);
  const startGold = save.currencies.gold;
  const rows = [];
  function apply(result: {save:GameSave;ok:boolean;message:string}) {
    if (!result.ok) throw new Error(result.message);
    save = result.save;
  }
  for (let day = 1; day <= 7; day++) {
    const beforeGold = save.currencies.gold;
    const beforeWork = Number(save.flags.farmWorkActions ?? 0);
    // At most three regular actions per day; distribute them across the resident roster.
    for (const [index, site] of (['wheat_field', 'garden', 'woodlot'] as const).entries()) {
      apply(workResourceSite(save, site, save.creatures![index].creatureId));
    }
    apply(craftResource(save, 'rations', 2,save.creatures![0].creatureId));
    if (day === 1) {
      apply(purchaseBattleOutfitterItem(save, 'training_grips'));
      const copy = getEquipmentCopies(save, 'training_grips')[0];
      for (let level = 0; level < 3; level++) apply(enhanceEquipment(save, copy.id, level));
    }
    if (day === 2) {
      apply(actSupplyOrder(save, 'timber')); apply(actSupplyOrder(save, 'timber'));
    }
    if (day === 3) apply(commissionFacility(save, 'quarry'));
    const tonight = getFoodBudget(save, 1);
    const projected = projectRanchDay(enterEveningReview(save));
    if (!projected) throw new Error('Day projection failed');
    save = projected.save;
    rows.push({ day, actions: Number(save.flags.farmWorkActions) - beforeWork, goldChange: save.currencies.gold - beforeGold, gold: save.currencies.gold, foodRequired: Number(save.flags.ranchFeedRequiredToday), foodCovered: Number(save.flags.ranchFeedConsumedToday), previewShortage: tonight.shortage, rations: getFarmState(save).stock.rations ?? 0, legacyFeed: Number(save.flags.ranchFeedStock ?? 0) });
  }
  return { startGold, rows, endGold: save.currencies.gold, quarryBuilt: !!getFarmState(save).facilities.quarry, equipmentLevel: getEquipmentCopies(save, 'training_grips')[0].level, foodBudget: getFoodBudget(save) };
}
if (process.argv[1]?.endsWith('first-week-economy.ts')) console.log(JSON.stringify(simulateFirstWeek(), null, 2));
