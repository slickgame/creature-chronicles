"use client";

import Link from "next/link";
import { useGame } from "@/context/GameContext";

export default function CreaturesPage() {
  const { creatures } = useGame();

  function getCreatureEmoji(name: string) {
    if (name === "Horse") return "🐴";
    if (name === "Cat") return "🐱";
    return "✨";
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 to-cyan-200 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-4xl font-bold text-sky-900">Creatures</h1>

        <div className="grid gap-4 md:grid-cols-2">
          {creatures.map((creature) => (
            <div
              key={creature.id}
              className="rounded-3xl border-4 border-sky-900 bg-white/85 p-5 shadow-xl"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="text-5xl">{getCreatureEmoji(creature.name)}</div>
                <div>
                  <h2 className="text-2xl font-bold text-sky-950">
                    {creature.name}
                  </h2>
                  <p className="text-stone-700">{creature.theme}</p>
                </div>
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