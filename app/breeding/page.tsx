"use client";

import Image from "next/image";
import Link from "next/link";
import { useGame } from "@/context/GameContext";

type Option = {
  label: string;
  image: string;
};

export default function BreedingPage() {
  const {
    breedCreatures,
    playerData,
    breedingSelection,
    setBreedingSelection,
  } = useGame();

  const giverOptions: Option[] = [
    { label: "Player", image: "/images/player.png" },
    { label: "Horse", image: "/images/horse.png" },
    { label: "Cat", image: "/images/cat.png" },
  ];

  const receiverOptions: Option[] = [
    { label: "Player", image: "/images/player.png" },
    { label: "Horse", image: "/images/horse.png" },
    { label: "Cat", image: "/images/cat.png" },
  ];

  const canAffordBreed =
    playerData.gold >= 50 &&
    playerData.energy >= 10 &&
    playerData.breedingStamina >= 15;

  const isValidPair =
    breedingSelection.giver !== "" &&
    breedingSelection.receiver !== "" &&
    breedingSelection.giver !== breedingSelection.receiver;

  const canBreed = canAffordBreed && isValidPair;
  const playerIsReceiver = breedingSelection.receiver === "Player";

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-100 to-rose-200 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-4xl font-bold text-rose-900">💞 Breeding</h1>

        <div className="rounded-3xl border-4 border-rose-900 bg-white/85 p-6 shadow-xl">
          <div className="mb-6">
            <h2 className="mb-3 text-2xl font-bold text-rose-950">Choose Giver</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {giverOptions.map((option) => {
                const isSelected = breedingSelection.giver === option.label;

                return (
                  <button
                    key={option.label}
                    onClick={() =>
                      setBreedingSelection({
                        ...breedingSelection,
                        giver: option.label,
                      })
                    }
                    className={`rounded-3xl border-4 p-4 text-left shadow transition ${
                      isSelected
                        ? "border-rose-700 bg-rose-100"
                        : "border-rose-200 bg-white hover:border-rose-400"
                    }`}
                  >
                    <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-stone-100">
                      <Image
                        src={option.image}
                        alt={option.label}
                        width={300}
                        height={300}
                        className="max-h-full w-auto object-contain"
                      />
                    </div>
                    <p className="text-xl font-bold text-stone-900">
                      {option.label}
                    </p>
                    <p className="text-sm text-stone-600">
                      {isSelected ? "Selected as giver" : "Click to select"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="mb-3 text-2xl font-bold text-rose-950">Choose Receiver</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {receiverOptions.map((option) => {
                const isSelected = breedingSelection.receiver === option.label;

                return (
                  <button
                    key={option.label}
                    onClick={() =>
                      setBreedingSelection({
                        ...breedingSelection,
                        receiver: option.label,
                      })
                    }
                    className={`rounded-3xl border-4 p-4 text-left shadow transition ${
                      isSelected
                        ? "border-rose-700 bg-rose-100"
                        : "border-rose-200 bg-white hover:border-rose-400"
                    }`}
                  >
                    <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-stone-100">
                      <Image
                        src={option.image}
                        alt={option.label}
                        width={300}
                        height={300}
                        className="max-h-full w-auto object-contain"
                      />
                    </div>
                    <p className="text-xl font-bold text-stone-900">
                      {option.label}
                    </p>
                    <p className="text-sm text-stone-600">
                      {isSelected ? "Selected as receiver" : "Click to select"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-5 rounded-2xl bg-rose-50 p-4 space-y-2">
            <p>
              <strong>Current Pair:</strong> {breedingSelection.giver} →{" "}
              {breedingSelection.receiver}
            </p>
            <p>
              <strong>Breeding Cost:</strong> 50 Gold, 10 Energy, 15 Stamina
            </p>
            <p>
              <strong>Rule:</strong> If the giver is Player, offspring will always
              be the receiver species. Otherwise, offspring rolls between giver
              and receiver species.
            </p>

            {playerIsReceiver && (
              <div className="rounded-xl border-2 border-amber-500 bg-amber-100 p-3 text-amber-900">
                <p className="font-semibold">Notice</p>
                <p>
                  If Player is selected as the receiver, breeding will not produce
                  an egg.
                </p>
              </div>
            )}

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