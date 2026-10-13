import { BATTLE_OUTFITTER_ITEMS, getBattleOutfitterStock, normalizeBattleEquipment } from '@/data/battleOutfitter';
import { consumeFarmResources, getFarmState, resourceShortages, resourceList, RESOURCES, type Stock, type ResourceId } from './farmResources';
import type { GameSave } from '@/types/save';

export const BLACKSMITH = { name: 'Iona Flint', title: 'Master Blacksmith', portrait: '/images/ui/blacksmith-v1/iona.webp' };
export const BLACKSMITH_RECIPES = [
  { id: 'training_blade', itemId: 'training_grips', inputs: { iron: 1 }, laborGold: 10 },
  { id: 'focus_circlet', itemId: 'focus_circlet', inputs: { iron: 3 }, laborGold: 45 },
  { id: 'reserve_pendant', itemId: 'reserve_pendant', inputs: { iron: 3 }, laborGold: 60 },
  { id: 'duelist_saber', itemId: 'duelist_grips', inputs: { iron: 8, nails: 2 }, laborGold: 100 },
  { id: 'sentinel_helm', itemId: 'sentinel_helm', inputs: { iron: 7, nails: 4 }, laborGold: 100 },
  { id: 'duelist_bracers', itemId: 'duelist_bracers', inputs: { iron: 7, nails: 4 }, laborGold: 110 },
] satisfies { id: string; itemId: string; inputs: Stock; laborGold: number }[];
export type BlacksmithRecipeId = typeof BLACKSMITH_RECIPES[number]['id'];
const REVISION = 'blacksmithCraftCount';
export function getCraftRevision(save: GameSave): number {
  const value = Number(save.flags[REVISION]);
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
export function getBlacksmithQuote(save: GameSave, recipeId: string) {
  const recipe = BLACKSMITH_RECIPES.find(r => r.id === recipeId);
  const item = recipe && BATTLE_OUTFITTER_ITEMS.find(i => i.itemId === recipe.itemId && !i.coliseumExclusive && i.equipmentSlot);
  if (!recipe || !item) return null;
  const state = getFarmState(save);
  const missing = resourceShortages(state, recipe.inputs);
  const goldShort = Math.max(0, recipe.laborGold - save.currencies.gold);
  const stockFull = Boolean(item.maxStock && getBattleOutfitterStock(save, item) >= item.maxStock);
  const materialValue = (Object.entries(recipe.inputs) as [ResourceId, number][]).reduce((sum,[id,n]) => sum + RESOURCES[id].price * n, 0);
  const missingInputs = Object.fromEntries((Object.entries(recipe.inputs) as [ResourceId, number][]).map(([id, n]) => [id, Math.max(0, n - Math.max(0, (state.stock[id] ?? 0) - (state.reserves[id] ?? 0))) ]).filter(([, n]) => Number(n) > 0)) as Stock;
  const restockGold = (Object.entries(missingInputs) as [ResourceId, number][]).reduce((sum, [id, n]) => sum + RESOURCES[id].price * n, 0);
  const procurementGold = restockGold + recipe.laborGold;
  const reason = stockFull ? 'Equipment stock is full.' : [...missing, ...(goldShort ? [`${goldShort} Gold for labor`] : [])].join(' · ');
  return { recipe, item, revision: getCraftRevision(save), missingInputs, restockGold, procurementGold, materialValue, totalValue: materialValue + recipe.laborGold, canCraft: !stockFull && !missing.length && !goldShort, reason };
}
/** One confirmed quote produces one copy. A persisted sequence rejects stale/replayed confirmations. */
export function craftBlacksmithEquipment(save: GameSave, recipeId: string, expectedRevision: number) {
  const fail = (message: string) => ({ save, ok: false, message });
  const quote = getBlacksmithQuote(save, recipeId);
  if (!quote) return fail('That recipe is unavailable.');
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== quote.revision || quote.revision >= Number.MAX_SAFE_INTEGER) return fail('This crafting review is no longer current. Review the recipe again.');
  if (!quote.canCraft) return fail(`Still needed: ${quote.reason}`);
  const normalized = normalizeBattleEquipment(save);
  const materials = consumeFarmResources(normalized, quote.recipe.inputs);
  if (!materials.ok) return fail(materials.message);
  const stock = getBattleOutfitterStock(normalized, quote.item);
  return {
    ok: true,
    save: { ...materials.save, updatedAt: new Date().toISOString(), currencies: { ...save.currencies, gold: save.currencies.gold - quote.recipe.laborGold }, flags: { ...materials.save.flags, [quote.item.flagKey]: stock + 1, [REVISION]: quote.revision + 1 } },
    message: `Iona crafted 1 ${quote.item.name} (${quote.item.quality} / ${quote.item.equipmentGrade}) for ${resourceList(quote.recipe.inputs)} + ${quote.recipe.laborGold} Gold labor. Added to equipment inventory; equip it at the Outfitter.`,
  };
}
