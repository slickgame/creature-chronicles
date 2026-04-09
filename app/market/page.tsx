"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import { HubCard, PopupWindow } from "@/components/town/TownUi";
import { SellerStockList } from "@/components/town/TownSellerUi";

function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${suffix}`;
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
          </div>

          <section className="mb-6 rounded-3xl border-4 border-orange-900 bg-white/85 p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-orange-900">Market Destinations</h2>
              <p className="mt-1 text-stone-600">
                Navigate the market through hub cards instead of plain section blocks.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <HubCard
                icon="🐾"
                title="Creature Seller"
                subtitle="Browse live creature offers and premium trait stock."
                meta={`${sellerSummary.count} offers • Cheapest ${sellerSummary.cheapest ?? 0} Gold`}
                accentClasses="border-amber-300 bg-amber-50"
                onClick={() => setSellerOpen(true)}
              />

              <HubCard
                icon="📦"
                title="Supply Stalls"
                subtitle="Preview future feed, pantry, and ranch support inventory."
                meta="Placeholder hub for future item vendors"
                accentClasses="border-sky-300 bg-sky-50"
                onClick={() => setSuppliesOpen(true)}
              />

              <HubCard
                icon="📌"
                title="Market Bulletin"
                subtitle="Read rotation chatter, vendor notices, and event hooks."
                meta="Future home for market-day specials"
                accentClasses="border-rose-300 bg-rose-50"
                onClick={() => setBulletinOpen(true)}
              />
            </div>
          </section>

          <section className="mb-6 rounded-3xl border-4 border-stone-900 bg-white/85 p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-stone-900">Travel</h2>
              <p className="mt-1 text-stone-600">
                Return to town or head back to the ranch from the market hub.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <HubCard
                icon="🏘️"
                title="Town"
                subtitle="Return to the central town hub."
                meta="Travel back to town"
                accentClasses="border-stone-300 bg-stone-50"
                onClick={() => handleTravelTo("town")}
              />

              <HubCard
                icon="🌿"
                title="Ranch"
                subtitle="Head home to creatures, eggs, and daily management."
                meta="Travel back to ranch"
                accentClasses="border-emerald-300 bg-emerald-50"
                onClick={() => handleTravelTo("ranch")}
              />

              <HubCard
                icon="🛒"
                title="Current Location"
                subtitle="You are already at the market."
                meta="No travel needed"
                accentClasses="border-orange-300 bg-orange-50"
                onClick={() => {}}
              />
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/town" className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow">Town</Link>
            <Link href="/ranch" className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow">Ranch</Link>
            <Link href="/creatures" className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow">Creatures</Link>
            <Link href="/eggs" className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow">Eggs</Link>
          </div>
        </div>
      </main>

      <PopupWindow open={sellerOpen} onClose={() => setSellerOpen(false)} title="Creature Seller Stock">
        <SellerStockList
          stock={townStock}
          playerGold={playerData.gold}
          onPurchase={purchaseTownCreature}
        />
      </PopupWindow>

      <PopupWindow open={suppliesOpen} onClose={() => setSuppliesOpen(false)} title="Supply Stalls" maxWidth="max-w-3xl">
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

      <PopupWindow open={bulletinOpen} onClose={() => setBulletinOpen(false)} title="Market Bulletin" maxWidth="max-w-3xl">
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
