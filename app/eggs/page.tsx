"use client";

import Link from "next/link";
import { useGame } from "@/context/GameContext";

export default function EggsPage() {
  const { eggs, hatchEgg } = useGame();

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-4">Eggs</h1>

      <div className="space-y-4 max-w-md">
        {eggs.length === 0 ? (
          <div className="rounded-2xl border p-4">
            <p>No eggs right now.</p>
          </div>
        ) : (
          eggs.map((egg) => (
            <div key={egg.id} className="rounded-2xl border p-4 space-y-2">
              <h2 className="text-2xl font-semibold">{egg.name}</h2>
              <p>Parents: {egg.parents}</p>
              <p>Hatch Time Remaining: {egg.hatchDaysRemaining} in-game days</p>

              {egg.hatchDaysRemaining === 0 && (
                <button
                  onClick={() => hatchEgg(egg.id)}
                  className="rounded-xl bg-green-600 px-4 py-3 text-white w-full"
                >
                  Hatch Egg
                </button>
              )}
            </div>
          ))
        )}
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