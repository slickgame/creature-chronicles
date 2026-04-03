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
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-4">Breeding</h1>

      <div className="rounded-2xl border p-4 max-w-md space-y-2">
        <p><strong>Parent 1:</strong> Horse</p>
        <p><strong>Parent 2:</strong> Cat</p>
        <p><strong>Breeding Cost:</strong> 50 Gold, 10 Energy, 15 Stamina</p>
        <p><strong>Rule:</strong> Offspring rolls between giver or receiver species.</p>

        <div className="pt-2 space-y-1">
          <p><strong>Your Gold:</strong> {playerData.gold}</p>
          <p><strong>Your Energy:</strong> {playerData.energy}</p>
          <p><strong>Your Stamina:</strong> {playerData.breedingStamina}</p>
        </div>

        <button
          onClick={breedCreatures}
          disabled={!canAffordBreed}
          className={`rounded-xl px-4 py-3 text-white w-full ${
            canAffordBreed ? "bg-pink-600" : "bg-gray-500"
          }`}
        >
          {canAffordBreed ? "Breed" : "Not Enough Resources"}
        </button>
      </div>

      <div className="mt-6">
        <Link
          href="/ranch"
          className="rounded-xl bg-gray-800 px-4 py-3 text-white inline-block"
        >
          Back to Ranch
        </Link>
      </div>
    </main>
  );
}