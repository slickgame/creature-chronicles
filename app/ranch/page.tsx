"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import RanchOperationsPanel from "@/components/ranch/RanchOperationsPanel";

type RanchTab = "house" | "fields" | "barn" | "nursery" | "breeding";

function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

function RanchPageContent() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const requestedInventory = searchParams.get("inventory");

  const initialTab: RanchTab =
    requestedTab === "house" ||
    requestedTab === "fields" ||
    requestedTab === "barn" ||
    requestedTab === "nursery" ||
    requestedTab === "breeding"
      ? requestedTab
      : "house";

  const initialInventoryOpen = requestedInventory === "1";

  const {
    currentDay,
    currentHour,
    currentMinute,
    currentLocation,
    playerData,
    homeState,
    resetGame,
    renamePlayer,
  } = useGame();

  const [playerNameInput, setPlayerNameInput] = useState(playerData.name);

  function handleSavePlayerName() {
    renamePlayer(playerNameInput);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-100 to-lime-200 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-4xl font-bold text-green-900">🌿 Ranch</h1>

        <div className="rounded-3xl border-4 border-green-900 bg-white/85 p-6 shadow-xl">
          <div className="grid gap-3 text-lg text-stone-800 sm:grid-cols-2 lg:grid-cols-4">
            <p><strong>Day:</strong> {currentDay}</p>
            <p><strong>Time:</strong> {formatTime(currentHour, currentMinute)}</p>
            <p><strong>Location:</strong> {currentLocation}</p>
            <p><strong>Player:</strong> {playerData.name}</p>
            <p><strong>Player Level:</strong> {playerData.level}</p>
            <p><strong>Player XP:</strong> {playerData.xp}/{playerData.xpToNextLevel}</p>
            <p><strong>Gold:</strong> {playerData.gold}</p>
            <p><strong>Energy:</strong> {playerData.energy}</p>
            <p><strong>Home Cleanliness:</strong> {homeState.cleanliness}/100</p>
            <p><strong>Food Stock:</strong> {homeState.foodStock}</p>
            <p><strong>Wheat Stock:</strong> {homeState.wheatStock}</p>
          </div>

          <div className="mt-6 rounded-2xl bg-green-50 p-4">
            <p className="mb-2 font-semibold text-green-950">Rename Player</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={playerNameInput}
                onChange={(e) => setPlayerNameInput(e.target.value)}
                className="w-full rounded-xl border border-green-300 bg-white px-3 py-2"
                placeholder="Enter player name"
              />
              <button
                onClick={handleSavePlayerName}
                className="rounded-xl bg-green-700 px-4 py-2 font-semibold text-white"
              >
                Save Name
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/town"
              className="w-full rounded-2xl bg-stone-800 px-4 py-3 text-center font-semibold text-white shadow"
            >
              Travel to Town
            </Link>

            <Link
              href="/market"
              className="w-full rounded-2xl bg-stone-800 px-4 py-3 text-center font-semibold text-white shadow"
            >
              Visit Market
            </Link>

            <button
              onClick={resetGame}
              className="w-full rounded-2xl bg-red-700 px-4 py-3 font-semibold text-white shadow"
            >
              Reset Save
            </button>
          </div>
        </div>

        <div className="mt-6">
          <RanchOperationsPanel
            initialTab={initialTab}
            initialInventoryOpen={initialInventoryOpen}
          />
        </div>
      </div>
    </main>
  );
}

export default function RanchPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-green-100 to-lime-200 p-6">
          <div className="mx-auto max-w-7xl rounded-3xl border-4 border-green-900 bg-white/85 p-6 text-green-950 shadow-xl">
            Loading ranch...
          </div>
        </main>
      }
    >
      <RanchPageContent />
    </Suspense>
  );
}
