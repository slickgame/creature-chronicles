"use client";

import Link from "next/link";
import { useGame } from "@/context/GameContext";

export default function BreedingPage() {
  const {
    breedCreatures,
    playerData,
    breedingSelection,
    setBreedingSelection,
  } = useGame();

  const giverOptions = ["Player", "Horse", "Cat"];
  const receiverOptions = ["Horse", "Cat"];

  const canAffordBreed =
    playerData.gold >= 50 &&
    playerData.energy >= 10 &&
    playerData.breedingStamina >= 15;

  const isValidPair =
    breedingSelection.giver !== "" &&
    breedingSelection.receiver !== "" &&
    breedingSelection.giver !== breedingSelection.receiver;

  const canBreed = canAffordBreed && isValidPair;

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-100 to-rose-200 p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-4xl font-bold text-rose-900">💞 Breeding</h1>

        <div className="rounded-3xl border-4 border-rose-900 bg-white/85 p-6 shadow-xl">
          <div className="mb-5 rounded-2xl bg-rose-50 p-4 space-y-4">
            <div>
              <label className="mb-2 block font-semibold text-rose-950">
                Giver
              </label>
              <select
                value={breedingSelection.giver}
                onChange={(e) =>
                  setBreedingSelection({
                    ...breedingSelection,
                    giver: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2"
              >
                {giverOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "Player" ? "🧍 Player" : option === "Horse" ? "🐴 Horse" : "🐱 Cat"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-semibold text-rose-950">
                Receiver
              </label>
              <select
                value={breedingSelection.receiver}
                onChange={(e) =>
                  setBreedingSelection({
                    ...breedingSelection,
                    receiver: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2"
              >
                {receiverOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "Horse" ? "🐴 Horse" : "🐱 Cat"}
                  </option>
                ))}
              </select>
            </div>

            <p>
              <strong>Breeding Cost:</strong> 50 Gold, 10 Energy, 15 Stamina
            </p>

            <div className="rounded-xl bg-white p-3 text-stone-800">
              <p>
                <strong>Rule:</strong> If the giver is Player, offspring will always
                be the receiver species. Otherwise, offspring rolls between giver
                and receiver species.
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 text-stone-800">
              <p>
                <strong>Current Pair:</strong> {breedingSelection.giver} →{" "}
                {breedingSelection.receiver}
              </p>
            </div>

            {!isValidPair && (
              <p className="font-semibold text-red-700">
                Giver and receiver must be different.
              </p>
            )}
          </div>

          <div className="mb-5 rounded-2xl bg-stone-100 p-4 space-y-1">
            <p><strong>Your Gold:</strong> {playerData.gold}</p>
            <p><strong>Your Energy:</strong> {playerData.energy}</p>
            <p><strong>Your Stamina:</strong> {playerData.breedingStamina}</p>
          </div>

          <button
            onClick={breedCreatures}
            disabled={!canBreed}
            className={`w-full rounded-2xl px-4 py-3 text-white font-semibold shadow ${
              canBreed ? "bg-pink-600" : "bg-gray-500"
            }`}
          >
            {canBreed ? "Breed" : "Cannot Breed"}
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