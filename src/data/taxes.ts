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

export function calculateMonthlyTax(save: GameSave, month = save.dayState.month): number {
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

export function getCurrentMonthFinalizedTax(save: GameSave): number {
  const finalizedMonth = getFlagNumber(save.flags.taxFinalizedMonth);
  const finalizedDue = getFlagNumber(save.flags.taxCurrentMonthDue);
  if (finalizedMonth === save.dayState.month && finalizedDue > 0) return finalizedDue;
  return calculateMonthlyTax(save, save.dayState.month);
}

function getDaysUntilTax(dayState: DayState): number {
  return Math.max(0, TAX_DUE_DAY - dayState.dayOfMonth);
}

function buildProjectionMessage(amountDue: number, daysUntilTax: number): string {
  if (daysUntilTax <= 0) return `Projected month-end bill: ${amountDue} Gold. Payment is due tonight.`;
  return `Projected month-end bill: ${amountDue} Gold. Due in ${daysUntilTax} day${daysUntilTax === 1 ? "" : "s"}.`;
}

export function ensureMonthlyTaxPosted(save: GameSave): GameSave {
  const finalizedMonth = getFlagNumber(save.flags.taxFinalizedMonth);
  const finalizedDue = getFlagNumber(save.flags.taxCurrentMonthDue);
  if (finalizedMonth === save.dayState.month && finalizedDue > 0) return save;
  const amountDue = calculateMonthlyTax(save, save.dayState.month);
  const daysUntilTax = getDaysUntilTax(save.dayState);
  return {
    ...save,
    flags: {
      ...save.flags,
      m15TaxCollectorEnabled: true,
      taxDueDay: TAX_DUE_DAY,
      taxFinalizedMonth: save.dayState.month,
      taxCurrentMonthDue: amountDue,
      taxDaysUntilDue: daysUntilTax,
      taxPostedDayNumber: save.dayState.dayNumber,
      taxProjectionSummary: buildProjectionMessage(amountDue, daysUntilTax),
      taxCollectorName: "Lady Vesper",
      taxCollectorTitle: "Royal Tax Collector",
      taxCollectorVisible: save.dayState.dayOfMonth >= TAX_WARNING_DAY,
      taxCollectorMood: save.dayState.dayOfMonth >= TAX_WARNING_DAY ? "warning" : "idle",
      taxCollectorMessage: save.dayState.dayOfMonth >= TAX_WARNING_DAY ? `${amountDue} Gold is due in ${daysUntilTax} day${daysUntilTax === 1 ? "" : "s"}. Keep enough Gold ready.` : `This month's posted bill is ${amountDue} Gold. Notice begins on Day ${TAX_WARNING_DAY}.`,
      taxStatus: save.dayState.dayOfMonth >= TAX_WARNING_DAY ? "warning" : "pending",
    },
  };
}

function shouldCollectTax(previousDayState: DayState, nextDayState: DayState): boolean {
  return previousDayState.dayOfMonth >= TAX_DUE_DAY && nextDayState.dayOfMonth === 1;
}

export function processMonthlyTaxes(save: GameSave, previousSave: GameSave): MonthlyTaxResult {
  const summaryItems: string[] = [];
  const postedSave = ensureMonthlyTaxPosted(save);
  const nextFlags: GameSave["flags"] = { ...postedSave.flags, m15TaxCollectorEnabled: true, taxDueDay: TAX_DUE_DAY };
  const currentMonthDue = getCurrentMonthFinalizedTax(postedSave);
  const daysUntilTax = getDaysUntilTax(postedSave.dayState);

  nextFlags.taxDaysUntilDue = daysUntilTax;
  nextFlags.taxCollectorVisible = postedSave.dayState.dayOfMonth >= TAX_WARNING_DAY;
  nextFlags.taxCollectorName = "Lady Vesper";
  nextFlags.taxCollectorTitle = "Royal Tax Collector";
  nextFlags.taxProjectionSummary = buildProjectionMessage(currentMonthDue, daysUntilTax);
  summaryItems.push(String(nextFlags.taxProjectionSummary));

  if (shouldCollectTax(previousSave.dayState, postedSave.dayState)) {
    const endedMonth = previousSave.dayState.month;
    const amountDue = getFlagNumber(previousSave.flags.taxCurrentMonthDue) || calculateMonthlyTax(previousSave, endedMonth);
    const goldBeforeTax = postedSave.currencies.gold;
    nextFlags.taxLastDueMonth = endedMonth;
    nextFlags.taxLastDueAmount = amountDue;
    nextFlags.taxLastGoldBeforePayment = goldBeforeTax;
    nextFlags.taxCollectorVisible = true;

    if (goldBeforeTax >= amountDue) {
      const nextGold = goldBeforeTax - amountDue;
      summaryItems.push(`Lady Vesper collected ${amountDue} Gold for Month ${endedMonth}. Next month's posted bill is ${currentMonthDue} Gold.`);
      nextFlags.taxLastPaidMonth = endedMonth;
      nextFlags.taxLastPaymentAmount = amountDue;
      nextFlags.taxDefaulted = false;
      nextFlags.taxStatus = "paid";
      nextFlags.taxCollectorMood = "paid";
      nextFlags.taxCollectorMessage = `Your Month ${endedMonth} payment is complete. I will return near the end of Month ${postedSave.dayState.month}.`;
      return { save: { ...postedSave, currencies: { ...postedSave.currencies, gold: nextGold }, flags: nextFlags }, summaryItems };
    }

    const shortage = amountDue - goldBeforeTax;
    summaryItems.push(`Run Ended: Lady Vesper arrived for ${amountDue} Gold, but the ranch only had ${goldBeforeTax}. Shortage: ${shortage} Gold.`);
    nextFlags.taxDefaulted = true;
    nextFlags.taxStatus = "defaulted";
    nextFlags.taxCollectorMood = "defaulted";
    nextFlags.taxCollectorMessage = `You were short ${shortage} Gold. The deed has been transferred out of your name.`;
    nextFlags.taxDefaultMonth = endedMonth;
    nextFlags.taxMissedAmount = amountDue;
    nextFlags.taxShortageAmount = shortage;
    nextFlags.badEnding = true;
    nextFlags.badEndingType = "tax_default";
    nextFlags.badEndingTitle = "Seized by the Crown";
    nextFlags.badEndingReason = `The ranch failed to pay ${amountDue} Gold in Month ${endedMonth}. The Tax Collector seized the deed and ended the run.`;
    return { save: { ...postedSave, currencies: { ...postedSave.currencies, gold: 0 }, flags: nextFlags }, summaryItems };
  }

  if (postedSave.dayState.dayOfMonth >= TAX_WARNING_DAY) {
    const warningMessage = postedSave.dayState.dayOfMonth >= TAX_DUE_DAY ? `Final notice: ${currentMonthDue} Gold is due tonight.` : `${currentMonthDue} Gold is due in ${daysUntilTax} day${daysUntilTax === 1 ? "" : "s"}. Keep enough Gold ready.`;
    summaryItems.push(`Tax Collector warning: ${warningMessage}`);
    nextFlags.taxStatus = "warning";
    nextFlags.taxCollectorMood = postedSave.dayState.dayOfMonth >= TAX_DUE_DAY ? "urgent" : "warning";
    nextFlags.taxCollectorMessage = warningMessage;
  } else {
    nextFlags.taxStatus = "pending";
    nextFlags.taxCollectorMood = "idle";
    nextFlags.taxCollectorMessage = `This month's posted bill is ${currentMonthDue} Gold. Notice begins on Day ${TAX_WARNING_DAY}.`;
  }

  return { save: { ...postedSave, flags: nextFlags }, summaryItems };
}
