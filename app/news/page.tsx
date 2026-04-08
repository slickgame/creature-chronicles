"use client";

import Link from "next/link";
import { useGame } from "@/context/GameContext";

const MONTH_LENGTH = 28;

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

function getNpcAvailabilityLabel(dayOfMonth: number, npcId: string) {
  const weekdayIndex = (dayOfMonth - 1) % 7;

  if (npcId === "mira") {
    return weekdayIndex === 0 || weekdayIndex === 3 || weekdayIndex === 5
      ? "At the stables"
      : "Making supply rounds";
  }

  if (npcId === "tobin") {
    return weekdayIndex === 1 || weekdayIndex === 4
      ? "At the courier post"
      : "Out on route";
  }

  return weekdayIndex === 2 || weekdayIndex === 6
    ? "Hosting visitors at home"
    : "Managing household errands";
}

function getNewsPosters(month: number, dayOfMonth: number, taxPaid: boolean) {
  return [
    {
      title: "Town Ledger Notice",
      body: taxPaid
        ? `Month ${month} taxes are currently paid. The collector will return next month.`
        : `The tax collector will arrive at the end of Month ${month}. Settling early avoids penalties.`,
      accent: "border-amber-300 bg-amber-50",
    },
    {
      title: "Merchant Circular",
      body:
        dayOfMonth % 7 === 2 || dayOfMonth % 7 === 5
          ? "Market Day is active. Traders are rotating premium stock and contracts."
          : "Next Market Day will refresh traders, creature stock, and shop chatter.",
      accent: "border-emerald-300 bg-emerald-50",
    },
    {
      title: "Guild Bulletin",
      body:
        dayOfMonth % 7 === 3 || dayOfMonth % 7 === 6
          ? "Guild Day is active. Board activity and courier work are especially busy."
          : "Guild officers are preparing the next rotation of work and membership notices.",
      accent: "border-violet-300 bg-violet-50",
    },
    {
      title: "Monthly Breeder's Notice",
      body:
        "Watch your deadlines, relationships, and tax obligations together. The town is becoming less forgiving as your ranch grows.",
      accent: "border-sky-300 bg-sky-50",
    },
  ];
}

export default function NewsPage() {
  const {
    currentDay,
    currentHour,
    currentMinute,
    currentLocation,
    townNpcs,
    paidTaxMonths,
  } = useGame();

  const currentMonth = getMonthFromAbsoluteDay(currentDay);
  const currentDayOfMonth = getDayOfMonthFromAbsoluteDay(currentDay);
  const taxPaidThisMonth = paidTaxMonths.includes(currentMonth);
  const posters = getNewsPosters(currentMonth, currentDayOfMonth, taxPaidThisMonth);

  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-200 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-orange-900">📰 News Board</h1>
            <p className="mt-1 text-stone-700">
              Monthly posters, town notices, and rotating NPC availability.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/calendar"
              className="rounded-2xl bg-indigo-700 px-4 py-3 text-white font-semibold shadow"
            >
              Calendar
            </Link>
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
          </div>
        </div>

        <div className="mb-6 rounded-3xl border-4 border-orange-900 bg-white/85 p-6 shadow-xl">
          <div className="grid gap-3 text-lg text-stone-800 sm:grid-cols-2 lg:grid-cols-4">
            <p><strong>Month / Day:</strong> {currentMonth} / {currentDayOfMonth}</p>
            <p><strong>Time:</strong> {formatTime(currentHour, currentMinute)}</p>
            <p><strong>Location:</strong> {currentLocation}</p>
            <p><strong>Tax Status:</strong> {taxPaidThisMonth ? "Paid" : "Unpaid"}</p>
          </div>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border-4 border-orange-900 bg-white/85 p-6 shadow-xl">
            <h2 className="mb-4 text-3xl font-bold text-orange-900">📌 Monthly Posters</h2>
            <div className="space-y-4">
              {posters.map((poster, index) => (
                <div key={`${poster.title}-${index}`} className={`rounded-2xl border p-4 ${poster.accent}`}>
                  <p className="text-xl font-bold text-stone-900">{poster.title}</p>
                  <p className="mt-2 text-stone-700">{poster.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border-4 border-rose-800 bg-white/85 p-6 shadow-xl">
            <h2 className="mb-4 text-3xl font-bold text-rose-900">👥 NPC Availability</h2>
            <p className="mb-4 text-stone-700">
              Where important townsfolk are most likely to be found today.
            </p>

            <div className="space-y-4">
              {townNpcs.map((npc) => (
                <div key={npc.id} className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4">
                  <p className="text-xl font-bold text-stone-900">{npc.name}</p>
                  <p className="text-sm text-stone-600">{npc.role}</p>
                  <p className="mt-2 text-sm text-stone-700">
                    <strong>Today:</strong> {getNpcAvailabilityLabel(currentDayOfMonth, npc.id)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
