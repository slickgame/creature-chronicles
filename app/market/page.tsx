"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGame } from "@/context/GameContext";

type CreatureTrait =
  | "none"
  | "domestic"
  | "industrious"
  | "calm"
  | "fertile"
  | "quick"
  | "sturdy"
  | "affectionate"
  | "keen"
  | "barnwise"
  | "surefooted"
  | "night_prawler"
  | "graceful";

function getTraitLabel(trait: CreatureTrait) {
  if (trait === "domestic") return "Domestic";
  if (trait === "industrious") return "Industrious";
  if (trait === "calm") return "Calm";
  if (trait === "fertile") return "Fertile";
  if (trait === "quick") return "Quick";
  if (trait === "sturdy") return "Sturdy";
  if (trait === "affectionate") return "Affectionate";
  if (trait === "keen") return "Keen";
  if (trait === "barnwise") return "Barnwise";
  if (trait === "surefooted") return "Surefooted";
  if (trait === "night_prawler") return "Night Prawler";
  if (trait === "graceful") return "Graceful";
  return "No Trait";
}

function getTraitClasses(trait: CreatureTrait) {
  if (trait === "domestic") return "bg-pink-100 text-pink-900 border-pink-300";
  if (trait === "industrious") return "bg-amber-100 text-amber-900 border-amber-300";
  if (trait === "calm") return "bg-sky-100 text-sky-900 border-sky-300";
  if (trait === "fertile") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  if (trait === "quick") return "bg-violet-100 text-violet-900 border-violet-300";
  if (trait === "sturdy") return "bg-stone-200 text-stone-900 border-stone-400";
  if (trait === "affectionate") return "bg-rose-100 text-rose-900 border-rose-300";
  if (trait === "keen") return "bg-cyan-100 text-cyan-900 border-cyan-300";
  if (trait === "barnwise") return "bg-orange-100 text-orange-900 border-orange-300";
  if (trait === "surefooted") return "bg-yellow-100 text-yellow-900 border-yellow-300";
  if (trait === "night_prawler") return "bg-indigo-100 text-indigo-900 border-indigo-300";
  if (trait === "graceful") return "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300";
  return "bg-stone-100 text-stone-700 border-stone-300";
}

function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${suffix}`;
}

function PopupWindow({
  open,
  title,
  onClose,
  children,
  maxWidth = "max-w-5xl",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className={`flex h-[88vh] w-full ${maxWidth} flex-col overflow-hidden rounded-3xl border-4 border-stone-900 bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-stone-800 px-4 py-2 text-sm font-semibold text-white shadow"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export default function MarketPage() {
  const router = useRouter();
  const {
    currentDay,
    currentHour,
    currentMinute,
    currentLocation,
    playerData,
    townStock,
    purchaseTownCreature,
    travelTo,
  } = useGame();

  const [sellerOpen, setSellerOpen] = useState(false);
  const [suppliesOpen, setSuppliesOpen] = useState(false);
  const [bulletinOpen, setBulletinOpen] = useState(false);

  function handleTravelTo(destination: "town" | "ranch" | "market") {
    travelTo(destination);

    if (destination === "town") {
      router.push("/town");
      return;
    }

    if (destination === "ranch") {
      router.push("/ranch");
      return;
    }

    router.push("/market");
  }

  const sellerSummary = useMemo(() => {
    const cheapest =
      townStock.length > 0 ? Math.min(...townStock.map((entry) => entry.price)) : null;
    const highest =
      townStock.length > 0 ? Math.max(...townStock.map((entry) => entry.price)) : null;

    return {
      count: townStock.length,
      cheapest,
      highest,
    };
  }, [townStock]);

  return (
    <>
      <main className="min-h-screen overflow-hidden bg-gradient-to-b from-yellow-100 to-orange-200 p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-6 text-4xl font-bold text-orange-900">🛒 Market</h1>

          <div className="mb-6 rounded-3xl border-4 border-orange-900 bg-white/85 p-6 shadow-xl">
            <div className="grid gap-3 text-lg text-stone-800 sm:grid-cols-2 lg:grid-cols-4">
              <p><strong>Day:</strong> {currentDay}</p>
              <p><strong>Time:</strong> {formatTime(currentHour, currentMinute)}</p>
              <p><strong>Location:</strong> {currentLocation}</p>
              <p><strong>Gold:</strong> {playerData.gold}</p>
              <p><strong>Creature Stock:</strong> {sellerSummary.count}</p>
              <p><strong>Cheapest Offer:</strong> {sellerSummary.cheapest ?? 0} Gold</p>
              <p><strong>Highest Offer:</strong> {sellerSummary.highest ?? 0} Gold</p>
              <p><strong>Market Status:</strong> Open</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button
                onClick={() => handleTravelTo("town")}
                className="rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
              >
                Return to Town
              </button>
              <button
                onClick={() => handleTravelTo("ranch")}
                className="rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
              >
                Travel to Ranch
              </button>
              <button
                onClick={() => handleTravelTo("market")}
                disabled
                className="rounded-2xl bg-gray-500 px-4 py-3 text-white font-semibold shadow"
              >
                Already at Market
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-3xl border-4 border-amber-800 bg-white/85 p-6 shadow-xl">
              <h2 className="mb-2 text-3xl font-bold text-amber-900">🐾 Creature Seller</h2>
              <p className="mb-5 text-stone-600">
                Browse live market stock in a pop-up window instead of filling the whole page.
              </p>

              <button
                type="button"
                onClick={() => setSellerOpen(true)}
                className="w-full rounded-2xl bg-amber-700 px-4 py-4 text-left text-white font-semibold shadow"
              >
                Open Seller Stock
                <div className="mt-1 text-sm font-medium text-amber-100">
                  {sellerSummary.count} offers available
                </div>
              </button>
            </section>

            <section className="rounded-3xl border-4 border-sky-800 bg-white/85 p-6 shadow-xl">
              <h2 className="mb-2 text-3xl font-bold text-sky-900">📦 Supply Stalls</h2>
              <p className="mb-5 text-stone-600">
                This is the future home for consumables, feed, and ranch supplies.
              </p>

              <button
                type="button"
                onClick={() => setSuppliesOpen(true)}
                className="w-full rounded-2xl bg-sky-700 px-4 py-4 text-left text-white font-semibold shadow"
              >
                Open Supply Notes
                <div className="mt-1 text-sm font-medium text-sky-100">
                  Preview planned market systems
                </div>
              </button>
            </section>

            <section className="rounded-3xl border-4 border-rose-800 bg-white/85 p-6 shadow-xl">
              <h2 className="mb-2 text-3xl font-bold text-rose-900">📌 Market Bulletin</h2>
              <p className="mb-5 text-stone-600">
                Rotation notes, price chatter, and future market-day hooks live here.
              </p>

              <button
                type="button"
                onClick={() => setBulletinOpen(true)}
                className="w-full rounded-2xl bg-rose-700 px-4 py-4 text-left text-white font-semibold shadow"
              >
                Open Bulletin
                <div className="mt-1 text-sm font-medium text-rose-100">
                  Market-day and vendor preview
                </div>
              </button>
            </section>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/town"
              className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
            >
              Town
            </Link>
            <Link
              href="/ranch"
              className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
            >
              Ranch
            </Link>
            <Link
              href="/creatures"
              className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
            >
              Creatures
            </Link>
            <Link
              href="/eggs"
              className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
            >
              Eggs
            </Link>
          </div>
        </div>
      </main>

      <PopupWindow
        open={sellerOpen}
        onClose={() => setSellerOpen(false)}
        title="Creature Seller Stock"
      >
        {townStock.length === 0 ? (
          <div className="rounded-2xl bg-amber-50 p-4 text-stone-700">
            The seller is sold out for today.
          </div>
        ) : (
          <div className="space-y-4">
            {townStock.map((entry) => (
              <div key={entry.id} className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">{entry.creature.nickname}</h3>
                    <p className="text-stone-700">{entry.creature.name} • Lv {entry.creature.level}</p>
                    <p className="text-sm text-stone-500">Theme: {entry.creature.theme}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {entry.creature.traits.map((traitEntry, index) => (
                        <div
                          key={`${entry.id}-${traitEntry.trait}-${index}`}
                          className={`inline-block rounded-full border px-2 py-1 text-xs font-semibold ${getTraitClasses(traitEntry.trait)}`}
                        >
                          {getTraitLabel(traitEntry.trait)} {traitEntry.grade}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-900">{entry.price} Gold</p>
                  </div>
                </div>

                <div className="mb-3 grid gap-2 text-sm text-stone-800 sm:grid-cols-2">
                  <p><strong>STR:</strong> {entry.creature.stats.strength}</p>
                  <p><strong>END:</strong> {entry.creature.stats.endurance}</p>
                  <p><strong>INT:</strong> {entry.creature.stats.intelligence}</p>
                  <p><strong>SPD:</strong> {entry.creature.stats.speed}</p>
                  <p><strong>FER:</strong> {entry.creature.stats.fertility}</p>
                  <p><strong>VIT:</strong> {entry.creature.stats.vitality}</p>
                </div>

                <button
                  onClick={() => purchaseTownCreature(entry.id)}
                  disabled={playerData.gold < entry.price}
                  className={`w-full rounded-2xl px-4 py-3 font-semibold text-white shadow ${
                    playerData.gold >= entry.price ? "bg-amber-700" : "bg-gray-500"
                  }`}
                >
                  {playerData.gold >= entry.price ? "Buy Creature" : "Not Enough Gold"}
                </button>
              </div>
            ))}
          </div>
        )}
      </PopupWindow>

      <PopupWindow
        open={suppliesOpen}
        onClose={() => setSuppliesOpen(false)}
        title="Supply Stalls"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
            <h3 className="text-xl font-bold text-stone-900">Planned Supply Categories</h3>
            <div className="mt-3 grid gap-2 text-sm text-stone-700">
              <p>• Feed and pantry stock</p>
              <p>• Wheat, ingredients, and household staples</p>
              <p>• Ranch upkeep supplies</p>
              <p>• Future breeding-support consumables</p>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
            <h3 className="text-xl font-bold text-stone-900">Design Direction</h3>
            <p className="mt-2 text-stone-700">
              This market page is now the proper place for future shopping systems instead of hiding them inside town.
            </p>
          </div>
        </div>
      </PopupWindow>

      <PopupWindow
        open={bulletinOpen}
        onClose={() => setBulletinOpen(false)}
        title="Market Bulletin"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4">
            <h3 className="text-xl font-bold text-stone-900">Market Day Notes</h3>
            <p className="mt-2 text-stone-700">
              Market Days are tracked on the Calendar screen. This board is the future home for special stock rotations, discounts, and breeder notices.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4">
            <h3 className="text-xl font-bold text-stone-900">Current Merchant Chatter</h3>
            <div className="mt-3 grid gap-2 text-sm text-stone-700">
              <p>• Creature quality and traits now affect asking price.</p>
              <p>• Higher-grade traits are considered premium stock.</p>
              <p>• This page can later host limited deals, seasonal wares, and event vendors.</p>
            </div>
          </div>
        </div>
      </PopupWindow>
    </>
  );
}
