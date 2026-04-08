"use client";

import Link from "next/link";
import { useGame } from "@/context/GameContext";

const MONTH_LENGTH = 28;
const TAX_WARNING_DAY = 24;

function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${suffix}`;
}

function getMonthFromAbsoluteDay(day: number) {
  return Math.floor((day - 1) / MONTH_LENGTH) + 1;
}

function getDayOfMonthFromAbsoluteDay(day: number) {
  return ((day - 1) % MONTH_LENGTH) + 1;
}

function getMonthlyTaxAmount(
  playerLevel: number,
  creatureCount: number,
  eggCount: number
) {
  return 60 + playerLevel * 20 + creatureCount * 15 + eggCount * 8;
}

function getDayOfWeekName(dayOfMonth: number) {
  const names = [
    "Sunfall",
    "Moonday",
    "Earthday",
    "Windday",
    "Fireday",
    "Waterday",
    "Starday",
  ];
  return names[(dayOfMonth - 1) % names.length];
}

function isMarketDay(dayOfMonth: number) {
  return dayOfMonth % 7 === 2 || dayOfMonth % 7 === 5;
}

function isGuildDay(dayOfMonth: number) {
  return dayOfMonth % 7 === 3 || dayOfMonth % 7 === 6;
}

function formatCountdown(
  currentDay: number,
  currentHour: number,
  currentMinute: number,
  targetDay: number,
  targetHour: number,
  targetMinute: number
) {
  const currentTotal = currentDay * 24 * 60 + currentHour * 60 + currentMinute;
  const targetTotal = targetDay * 24 * 60 + targetHour * 60 + targetMinute;
  const diff = targetTotal - currentTotal;

  if (diff <= 0) return "due now";

  const days = Math.floor(diff / (24 * 60));
  const hours = Math.floor((diff % (24 * 60)) / 60);
  const minutes = diff % 60;

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export default function CalendarPage() {
  const {
    currentDay,
    currentHour,
    currentMinute,
    currentLocation,
    playerData,
    creatures,
    eggs,
    townQuests,
    townNpcQuests,
    paidTaxMonths,
    payMonthlyTax,
  } = useGame();

  const currentMonth = getMonthFromAbsoluteDay(currentDay);
  const currentDayOfMonth = getDayOfMonthFromAbsoluteDay(currentDay);
  const taxPaidThisMonth = paidTaxMonths.includes(currentMonth);
  const currentTaxDue = getMonthlyTaxAmount(
    playerData.level,
    creatures.length,
    eggs.length
  );
  const monthEndsOnAbsoluteDay = currentDay + (MONTH_LENGTH - currentDayOfMonth);
  const taxWarningActive = currentDayOfMonth >= TAX_WARNING_DAY && !taxPaidThisMonth;

  const monthDays = Array.from({ length: MONTH_LENGTH }, (_, i) => i + 1);

  const eventDays = new Map<number, string[]>();

  for (const day of monthDays) {
    const absoluteDay = (currentMonth - 1) * MONTH_LENGTH + day;

    if (isMarketDay(day)) {
      eventDays.set(day, [...(eventDays.get(day) ?? []), "Market Day"]);
    }

    if (isGuildDay(day)) {
      eventDays.set(day, [...(eventDays.get(day) ?? []), "Guild Day"]);
    }

    if (day === MONTH_LENGTH) {
      eventDays.set(day, [...(eventDays.get(day) ?? []), "Tax Collector"]);
    }

    townQuests.forEach((quest) => {
      if (quest.deadlineDay === absoluteDay) {
        eventDays.set(day, [...(eventDays.get(day) ?? []), "Board Deadline"]);
      }
    });

    townNpcQuests.forEach((quest) => {
      if (quest.deadlineDay === absoluteDay) {
        eventDays.set(day, [...(eventDays.get(day) ?? []), `${quest.npcName} Request`]);
      }
    });
  }

  const upcomingEvents = [
    {
      title: taxPaidThisMonth ? "Monthly Tax Paid" : "Tax Collector Arrival",
      subtitle: taxPaidThisMonth
        ? `Month ${currentMonth} taxes are settled.`
        : `Tax due: ${currentTaxDue} Gold`,
      countdown: formatCountdown(
        currentDay,
        currentHour,
        currentMinute,
        monthEndsOnAbsoluteDay,
        18,
        0
      ),
      accent: taxPaidThisMonth
        ? "border-emerald-300 bg-emerald-50"
        : "border-amber-300 bg-amber-50",
    },
    ...townQuests.slice(0, 3).map((quest) => ({
      title: quest.title,
      subtitle: "Public board contract",
      countdown: formatCountdown(
        currentDay,
        currentHour,
        currentMinute,
        quest.deadlineDay,
        quest.deadlineHour,
        quest.deadlineMinute
      ),
      accent: "border-sky-300 bg-sky-50",
    })),
    ...townNpcQuests.slice(0, 2).map((quest) => ({
      title: `${quest.npcName}: ${quest.title}`,
      subtitle: "Personal request",
      countdown: formatCountdown(
        currentDay,
        currentHour,
        currentMinute,
        quest.deadlineDay,
        quest.deadlineHour,
        quest.deadlineMinute
      ),
      accent: "border-purple-300 bg-purple-50",
    })),
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-100 to-sky-200 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-indigo-900">🗓️ Calendar</h1>
            <p className="mt-1 text-stone-700">
              Track month flow, rotating activity days, deadlines, and tax pressure.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/ranch"
              className="rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
            >
              Ranch
            </Link>
            <Link
              href="/home"
              className="rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
            >
              Home
            </Link>
            <Link
              href="/town"
              className="rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
            >
              Town
            </Link>
            <Link
              href="/news"
              className="rounded-2xl bg-indigo-700 px-4 py-3 text-white font-semibold shadow"
            >
              News Board
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border-4 border-indigo-900 bg-white/85 p-6 shadow-xl">
          <div className="grid gap-3 text-lg text-stone-800 sm:grid-cols-2 lg:grid-cols-4">
            <p><strong>Current Date:</strong> Month {currentMonth}, Day {currentDayOfMonth}</p>
            <p><strong>Weekday:</strong> {getDayOfWeekName(currentDayOfMonth)}</p>
            <p><strong>Time:</strong> {formatTime(currentHour, currentMinute)}</p>
            <p><strong>Location:</strong> {currentLocation}</p>
            <p><strong>Creatures:</strong> {creatures.length}</p>
            <p><strong>Eggs:</strong> {eggs.length}</p>
            <p><strong>Tax Due:</strong> {currentTaxDue} Gold</p>
            <p><strong>Status:</strong> {taxPaidThisMonth ? "Paid" : "Unpaid"}</p>
          </div>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <section className="rounded-3xl border-4 border-indigo-900 bg-white/85 p-6 shadow-xl">
            <h2 className="mb-4 text-3xl font-bold text-indigo-900">Month {currentMonth}</h2>

            <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
              {monthDays.map((day) => {
                const isToday = day === currentDayOfMonth;
                const events = eventDays.get(day) ?? [];
                return (
                  <div
                    key={day}
                    className={`rounded-2xl border p-3 ${
                      isToday
                        ? "border-indigo-700 bg-indigo-100"
                        : "border-indigo-200 bg-indigo-50"
                    }`}
                  >
                    <p className="text-sm font-bold text-stone-900">Day {day}</p>
                    <p className="text-xs text-stone-600">{getDayOfWeekName(day)}</p>

                    <div className="mt-2 space-y-1">
                      {events.length === 0 ? (
                        <p className="text-[11px] text-stone-400">No major events</p>
                      ) : (
                        events.slice(0, 3).map((event, index) => (
                          <div
                            key={`${day}-${event}-${index}`}
                            className="rounded-full border border-white/70 bg-white px-2 py-1 text-[10px] font-semibold text-stone-700"
                          >
                            {event}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border-4 border-amber-800 bg-white/85 p-6 shadow-xl">
            <h2 className="mb-3 text-3xl font-bold text-amber-900">💰 Tax Collector</h2>
            <p className="mb-4 text-stone-700">
              A collector arrives at the end of every month. Pay early or suffer the rollover penalty.
            </p>

            <div className={`rounded-2xl border p-4 ${
              taxWarningActive
                ? "border-red-300 bg-red-50"
                : taxPaidThisMonth
                ? "border-emerald-300 bg-emerald-50"
                : "border-amber-300 bg-amber-50"
            }`}>
              <p className="text-sm font-semibold text-stone-800">
                {taxPaidThisMonth
                  ? "This month is settled."
                  : taxWarningActive
                  ? "Collector arrival is close."
                  : "You can pay ahead of time."}
              </p>
              <p className="mt-1 text-2xl font-bold text-stone-900">{currentTaxDue} Gold</p>
              <p className="mt-1 text-sm text-stone-700">
                Arrival: Month {currentMonth}, Day {MONTH_LENGTH} at {formatTime(18, 0)}
              </p>
              <p className="text-sm text-stone-700">
                Countdown: {formatCountdown(currentDay, currentHour, currentMinute, monthEndsOnAbsoluteDay, 18, 0)}
              </p>

              <button
                type="button"
                onClick={payMonthlyTax}
                disabled={taxPaidThisMonth || playerData.gold < currentTaxDue}
                className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow ${
                  !taxPaidThisMonth && playerData.gold >= currentTaxDue
                    ? "bg-amber-700"
                    : "bg-stone-400"
                }`}
              >
                {taxPaidThisMonth
                  ? "Taxes Already Paid"
                  : playerData.gold >= currentTaxDue
                  ? `Pay ${currentTaxDue} Gold`
                  : "Not Enough Gold"}
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-900">Market Day Rotation</p>
                <p className="text-sm text-stone-700">
                  Market Days occur on Days 2 and 5 of each 7-day cycle.
                </p>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <p className="font-semibold text-violet-900">Guild Day Rotation</p>
                <p className="text-sm text-stone-700">
                  Guild Days occur on Days 3 and 6 of each 7-day cycle.
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border-4 border-slate-800 bg-white/85 p-6 shadow-xl">
          <h2 className="mb-3 text-3xl font-bold text-slate-900">⏰ Upcoming Events</h2>
          <p className="mb-4 text-stone-700">
            Deadlines, requests, and collector timing collected in one place.
          </p>

          <div className="space-y-3">
            {upcomingEvents.map((event, index) => (
              <div key={`${event.title}-${index}`} className={`rounded-2xl border p-4 ${event.accent}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-stone-900">{event.title}</p>
                    <p className="text-sm text-stone-700">{event.subtitle}</p>
                  </div>
                  <span className="rounded-full border border-white/60 bg-white px-3 py-1 text-xs font-semibold text-stone-800">
                    {event.countdown}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
