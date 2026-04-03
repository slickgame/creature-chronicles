"use client";

import Link from "next/link";
import { useGame } from "@/context/GameContext";

export default function CreaturesPage() {
  const { creatures } = useGame();

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-4">Creatures</h1>

      <div className="grid gap-4 max-w-xl">
        {creatures.map((creature) => (
          <div key={creature.id} className="rounded-2xl border p-4">
            <h2 className="text-2xl font-semibold">{creature.name}</h2>
            <p>Theme: {creature.theme}</p>
            <p>Strength: {creature.stats.strength}</p>
            <p>Endurance: {creature.stats.endurance}</p>
            <p>Intelligence: {creature.stats.intelligence}</p>
            <p>Speed: {creature.stats.speed}</p>
          </div>
        ))}
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