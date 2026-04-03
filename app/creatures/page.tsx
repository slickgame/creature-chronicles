"use client";

import Image from "next/image";
import Link from "next/link";
import { useGame } from "@/context/GameContext";

export default function CreaturesPage() {
  const { creatures } = useGame();

  function getCreatureImage(name: string) {
    if (name === "Horse") return "/images/horse.png";
    if (name === "Cat") return "/images/cat.png";
    return "/images/egg.png";
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 to-cyan-200 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-4xl font-bold text-sky-900">Creatures</h1>

        <div className="grid gap-4 md:grid-cols-2">
          {creatures.map((creature, index) => (
            <div
              key={creature.id}
              className="rounded-3xl border-4 border-sky-900 bg-white/85 p-5 shadow-xl"
            >
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-stone-100">
                  <Image
                    src={getCreatureImage(creature.name)}
                    alt={creature.name}
                    width={200}
                    height={200}
                    className="max-h-full w-auto object-contain"
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-sky-950">
                    {creature.name} #{index + 1}
                  </h2>
                  <p className="text-stone-700">{creature.theme}</p>
                  <p className="text-sm text-stone-500">ID: {creature.id}</p>
                </div>
              </div>

              <div className="mb-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl bg-sky-50 p-3">
                  <p className="text-sm text-stone-500">Generation</p>
                  <p className="font-semibold text-stone-900">
                    Gen {creature.generation}
                  </p>
                </div>

                <div className="rounded-2xl bg-sky-50 p-3">
                  <p className="text-sm text-stone-500">Born On Day</p>
                  <p className="font-semibold text-stone-900">
                    Day {creature.bornOnDay}
                  </p>
                </div>
              </div>

              <div className="mb-4 rounded-2xl bg-stone-100 p-3">
                <p className="text-sm text-stone-500">Lineage</p>
                {creature.giver && creature.receiver ? (
                  <p className="font-semibold text-stone-900">
                    {creature.giver} → {creature.receiver}
                  </p>
                ) : (
                  <p className="font-semibold text-stone-900">
                    Starter Creature
                  </p>
                )}
              </div>

              <div className="space-y-1 text-stone-800">
                <p><strong>Strength:</strong> {creature.stats.strength}</p>
                <p><strong>Endurance:</strong> {creature.stats.endurance}</p>
                <p><strong>Intelligence:</strong> {creature.stats.intelligence}</p>
                <p><strong>Speed:</strong> {creature.stats.speed}</p>
              </div>
            </div>
          ))}
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