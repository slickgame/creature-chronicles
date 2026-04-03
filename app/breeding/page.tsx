"use client";

import Link from "next/link";
import { useGame } from "@/context/GameContext";

export default function BreedingPage() {
  const { breedCreatures, playerData } = useGame();

  const canAffordBreed =
    playerData.gold >= 50 &&
    playerData.energy >= 10 &&
    playerData.breedingStamina >= 15;

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-100 to-rose-200 p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-4xl font-bold text-rose-900">💞 Breeding</h1>

        <div className="rounded-3xl border-4 border-rose-900 bg-white/85 p-6 shadow-xl">
          <div className="mb-5 rounded-2xl bg-rose-50 p-4">
            <p className="text-lg"><strong>Parent 1:</strong> 🐴 Horse</p>
            <p className="text-lg"><strong>Parent 2:</strong> 🐱 Cat</p>
            <p className="mt-2">
              <strong>Breeding Cost:</strong> 50 Gold, 10 Energy, 15 Stamina
            </p>
            <p className="mt-2">
              <strong>Rule:</strong> Offspring rolls between giver or receiver species.
            </p>
          </div>

          <div className="mb-5 rounded-2xl bg-stone-100 p-4 space-y-1">
            <p><strong>Your Gold:</strong> {playerData.gold}</p>
            <p><strong>Your Energy:</strong> {playerData.energy}</p>
            <p><strong>Your Stamina:</strong> {playerData.breedingStamina}</p>
          </div>

          <button
            onClick={breedCreatures}
            disabled={!canAffordBreed}
            className={`w-full rounded-2xl px-4 py-3 text-white font-semibold shadow ${
              canAffordBreed ? "bg-pink-600" : "bg-gray-500"
            }`}
          >
            {canAffordBreed ? "Breed" : "Not Enough Resources"}
          </button>
        </div>

        <div className="mt-6">
          <Link
            href="/ranch"
            className="inline-block rounded-2xl bg-stone-800 px-5 py-3 text-white font-semibold shadow"
          >
            Back to Ranch
          </Link>
        </div>
      </div>
    </main>
  );
}