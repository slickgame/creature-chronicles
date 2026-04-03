"use client";

import Link from "next/link";
import { useGame } from "@/context/GameContext";

export default function RanchPage() {
  const { currentDay, playerData, nextDay } = useGame();

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-4">Ranch</h1>

      <div className="rounded-2xl border p-4 mb-6 max-w-md space-y-1">
        <p><strong>Day:</strong> {currentDay}</p>
        <p><strong>Player:</strong> {playerData.name}</p>
        <p><strong>Gold:</strong> {playerData.gold}</p>
        <p><strong>Energy:</strong> {playerData.energy}</p>
        <p><strong>Breeding Stamina:</strong> {playerData.breedingStamina}</p>
      </div>

      <div className="mb-6 max-w-xs">
        <button
          onClick={nextDay}
          className="rounded-xl bg-orange-600 px-4 py-3 text-white w-full"
        >
          Next Day
        </button>
      </div>

      <div className="flex flex-col gap-3 max-w-xs">
        <Link href="/creatures" className="rounded-xl bg-gray-800 px-4 py-3 text-white text-center">
          View Creatures
        </Link>
        <Link href="/breeding" className="rounded-xl bg-gray-800 px-4 py-3 text-white text-center">
          Go to Breeding
        </Link>
        <Link href="/eggs" className="rounded-xl bg-gray-800 px-4 py-3 text-white text-center">
          View Eggs
        </Link>
        <Link href="/" className="rounded-xl bg-red-600 px-4 py-3 text-white text-center">
          Back to Title
        </Link>
      </div>
    </main>
  );
}