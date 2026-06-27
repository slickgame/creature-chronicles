import type { GameSave } from "@/types/save";

export const TAX_COLLECTOR = {
  name: "Lady Vesper",
  title: "Royal Tax Collector",
  portraitPath: "/images/ui/currency/icon_currency_gold.png",
} as const;

function getFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function getTaxCollectorState(save: GameSave) {
  const day = save.dayState.dayOfMonth;
  const due = getFlagNumber(save.flags.taxCurrentMonthDue);
  const daysUntilDue = getFlagNumber(save.flags.taxDaysUntilDue);
  const visible = save.flags.badEnding === true || day >= 25 || save.flags.taxStatus === "paid";

  if (save.flags.badEnding === true && save.flags.badEndingType === "tax_default") {
    return {
      visible: true,
      mood: "defaulted",
      heading: "The deed has been claimed.",
      body: String(save.flags.taxCollectorMessage ?? `You failed to pay ${save.flags.taxMissedAmount ?? due} Gold.`),
      due,
      daysUntilDue,
    };
  }

  if (day >= 30) {
    return {
      visible: true,
      mood: "urgent",
      heading: "Final Collection Window",
      body: String(save.flags.taxCollectorMessage ?? `I will collect ${due} Gold when the month closes. Prepare payment now.`),
      due,
      daysUntilDue,
    };
  }

  if (day >= 25) {
    return {
      visible: true,
      mood: "warning",
      heading: "Monthly Tax Notice",
      body: String(save.flags.taxCollectorMessage ?? `Your posted tax is ${due} Gold. Payment is due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}.`),
      due,
      daysUntilDue,
    };
  }

  if (save.flags.taxStatus === "paid") {
    return {
      visible: true,
      mood: "paid",
      heading: "Payment Received",
      body: String(save.flags.taxCollectorMessage ?? `Your previous payment is recorded. I will return later this month.`),
      due,
      daysUntilDue,
    };
  }

  return {
    visible,
    mood: "idle",
    heading: "No Visit Scheduled",
    body: String(save.flags.taxCollectorMessage ?? `This month's posted tax is ${due} Gold. Notice begins on Day 25.`),
    due,
    daysUntilDue,
  };
}
