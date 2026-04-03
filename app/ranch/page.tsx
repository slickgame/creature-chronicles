"use client";

import { useState } from "react";
import Link from "next/link";
import { useGame } from "@/context/GameContext";

export default function RanchPage() {
  const { currentDay, playerData, nextDay, resetGame, renamePlayer } = useGame();
  const [playerNameInput, setPlayerNameInput] = useState(playerData.name);

  function handleSavePlayerName() {
    renamePlayer(playerNameInput);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-100 to-lime-200 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-4xl font-bold text-green-900">🌿 Ranch</h1>

        <div className="rounded-3xl border-4 border-green-900 bg-white/85 p-6 shadow-xl">
          <div className="grid gap-3 text-lg text-stone-800 sm:grid-cols-2">
            <p><strong>Day:</strong> {currentDay}</p>
            <p><strong>Player:</strong> {playerData.name}</p>
            <p><strong>Gold:</strong> {playerData.gold}</p>
            <p><strong>Energy:</strong> {playerData.energy}</p>
            <p><strong>Breeding Stamina:</strong> {playerData.breedingStamina}</p>
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
                className="rounded-xl bg-green-700 px-4 py-2 text-white font-semibold"
              >
                Save Name
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 max-w-xs">
            <button
              onClick={nextDay}
              className="w-full rounded-2xl bg-orange-600 px-4 py-3 text-white font-semibold shadow"
            >
              Next Day
            </button>

            <button
              onClick={resetGame}
              className="w-full rounded-2xl bg-red-700 px-4 py-3 text-white font-semibold shadow"
            >
              Reset Save
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/creatures"
            className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
          >
            View Creatures
          </Link>
          <Link
            href="/breeding"
            className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
          >
            Go to Breeding
          </Link>
          <Link
            href="/eggs"
            className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
          >
            View Eggs
          </Link>
          <Link
            href="/"
            className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
          >
            Back to Title
          </Link>
        </div>
      </div>
    </main>
  );
}