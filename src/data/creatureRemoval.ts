import { getCreatureDonationReward, getCreatureRemovalBlocker, releaseOrDonateCreature } from './collection';
import { getEquipmentCopies } from './equipmentInstances';
import { applyStarterGoalRewards, getStarterGoals } from './starterGoals';
import { ensureMonthlyTaxPosted } from './taxes';
import type { GameSave } from '@/types/save';
export type CreatureRemovalMode = 'release' | 'donate';
export function getCreatureRemovalQuote(save: GameSave, creatureId: string, mode: CreatureRemovalMode) {
  const creature = save.creatures?.find(c => c.creatureId === creatureId);
  if (!creature) return null;
  const equipment = getEquipmentCopies(save).filter(c => c.owner === creatureId);
  const reward = mode === 'donate' ? getCreatureDonationReward(creature) : {gold: 0, guildPoints: 0};
  const blocker = getCreatureRemovalBlocker(save, creatureId);
  const balances = {gold: save.currencies.gold, guildPoints: save.currencies.guildPoints};
  const preview = blocker ? null : releaseOrDonateCreature(save, creatureId, mode);
  const prepared = preview?.ok ? applyStarterGoalRewards(ensureMonthlyTaxPosted(preview.save)) : null;
  const afterBalances = prepared ? {gold: prepared.currencies.gold, guildPoints: prepared.currencies.guildPoints} : {gold: balances.gold + reward.gold, guildPoints: balances.guildPoints + reward.guildPoints};
  const claimedBefore = new Set(getStarterGoals(save).filter(g => g.rewardClaimed).map(g => g.id));
  const starterRewards = prepared ? getStarterGoals(prepared).filter(g => g.rewardClaimed && !claimedBefore.has(g.id)) : [];
  const bonus = starterRewards.reduce((sum, g) => ({gold: sum.gold + (g.reward.gold ?? 0), guildPoints: sum.guildPoints + (g.reward.guildPoints ?? 0), feed: sum.feed + (g.reward.feed ?? 0), materials: sum.materials + (g.reward.materials ?? 0)}), {gold: 0, guildPoints: 0, feed: 0, materials: 0});
  const bonusLabel = [bonus.gold ? `+${bonus.gold} Gold` : '', bonus.guildPoints ? `+${bonus.guildPoints} GP` : '', bonus.feed ? `+${bonus.feed} Balanced rations` : '', bonus.materials ? `+${bonus.materials} Wood` : ''].filter(Boolean).join(', ');
  const fingerprint = JSON.stringify({saveId: save.saveId, mode, creature, equipment, reward, balances, afterBalances, bonusLabel, blocker});
  return {saveId: save.saveId, creatureId, creature, mode, equipment, reward, balances, afterBalances, bonusLabel, blocker, fingerprint};
}
export type CreatureRemovalQuote = NonNullable<ReturnType<typeof getCreatureRemovalQuote>>;
export function confirmCreatureRemoval(save: GameSave, quote: CreatureRemovalQuote) {
  const fresh = getCreatureRemovalQuote(save, quote.creatureId, quote.mode);
  if (!fresh || fresh.saveId !== quote.saveId) return {save, ok: false, message: 'That creature is no longer available in this save.'};
  if (fresh.blocker) return {save, ok: false, message: fresh.blocker};
  if (fresh.fingerprint !== quote.fingerprint) return {save, ok: false, message: 'The creature, equipment or balance changed. Refresh the review before continuing.'};
  return releaseOrDonateCreature(save, quote.creatureId, quote.mode);
}
