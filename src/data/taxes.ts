import type { DayState, GameSave } from "@/types/save";

export type MonthlyTaxResult = {
  save: GameSave;
  summaryItems: string[];
};

const TAX_DUE_DAY = 30;
const TAX_WARNING_DAY = 25;

function getFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function getMonthlyTaxDue(save: GameSave, month = save.dayState.month): number {
  const creatureCount = save.creatures?.length ?? 0;
  const ranchRank = save.player.ranchRank ?? 1;
  const completedGuildRequests = save.guild?.completedCount ?? 0;
  const baseTax = 150;
  const monthGrowth = Math.max(0, month - 1) * 50;
  const herdTax = Math.max(0, creatureCount - 3) * 10;
  const ranchRankTax = Math.max(0, ranchRank - 1) * 25;
  const guildDiscount = Math.min(75, completedGuildRequests * 5);
  return Math.max(75, baseTax + monthGrowth + herdTax + ranchRankTax - guildDiscount);
}

function getDaysUntilTax(dayState: DayState): number {
  return Math.max(0, TAX_DUE_DAY - dayState.dayOfMonth);
}

function shouldCollectTax(previousDayState: DayState, nextDayState: DayState): boolean {
  return previousDayState.dayOfMonth >= TAX_DUE_DAY && nextDayState.dayOfMonth === 1;
}

export function processMonthlyTaxes(save: GameSave, previousDayState: DayState): MonthlyTaxResult {
  const summaryItems: string[] = [];
  const nextFlags: GameSave["flags"] = {
    ...save.flags,
    m15TaxCollectorEnabled: true,
    taxDueDay: TAX_DUE_DAY,
  };

  const currentDue = getMonthlyTaxDue(save, save.dayState.month);
  const daysUntilTax = getDaysUntilTax(save.dayState);
  nextFlags.taxCurrentMonthDue = currentDue;
  nextFlags.taxDaysUntilDue = daysUntilTax;

  if (shouldCollectTax(previousDayState, save.dayState)) {
    const endedMonth = previousDayState.month;
    const amountDue = getMonthlyTaxDue(save, endedMonth);
    const goldBeforeTax = save.currencies.gold;
    nextFlags.taxLastDueMonth = endedMonth;
    nextFlags.taxLastDueAmount = amountDue;
    nextFlags.taxLastGoldBeforePayment = goldBeforeTax;

    if (goldBeforeTax >= amountDue) {
      const nextGold = goldBeforeTax - amountDue;
      summaryItems.push(`Tax Collector collected ${amountDue} Gold for Month ${endedMonth}. Next month's estimated tax is ${currentDue} Gold.`);
      nextFlags.taxLastPaidMonth = endedMonth;
      nextFlags.taxLastPaymentAmount = amountDue;
      nextFlags.taxDefaulted = false;
      nextFlags.taxStatus = "paid";
      return {
        save: {
          ...save,
          currencies: { ...save.currencies, gold: nextGold },
          flags: nextFlags,
        },
        summaryItems,
      };
    }

    const shortage = amountDue - goldBeforeTax;
    summaryItems.push(`Bad Ending: the Tax Collector arrived for ${amountDue} Gold, but the ranch only had ${goldBeforeTax}. Shortage: ${shortage} Gold.`);
    nextFlags.taxDefaulted = true;
    nextFlags.taxStatus = "defaulted";
    nextFlags.taxDefaultMonth = endedMonth;
    nextFlags.taxMissedAmount = amountDue;
    nextFlags.taxShortageAmount = shortage;
    nextFlags.badEnding = true;
    nextFlags.badEndingType = "tax_default";
    nextFlags.badEndingTitle = "Seized by the Crown";
    nextFlags.badEndingReason = `The ranch failed to pay ${amountDue} Gold in Month ${endedMonth}. The Tax Collector seized the deed and ended the run.`;
    return {
      save: {
        ...save,
        currencies: { ...save.currencies, gold: 0 },
        flags: nextFlags,
      },
      summaryItems,
    };
  }

  if (save.dayState.dayOfMonth >= TAX_WARNING_DAY) {
    summaryItems.push(`Tax Collector warning: ${currentDue} Gold is due in ${daysUntilTax} day${daysUntilTax === 1 ? "" : "s"}. Keep enough Gold before the month ends.`);
    nextFlags.taxStatus = "warning";
  } else {
    nextFlags.taxStatus = "pending";
  }

  return { save: { ...save, flags: nextFlags }, summaryItems };
}
