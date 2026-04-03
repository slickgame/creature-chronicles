"use client";

import Link from "next/link";
import { useGame } from "@/context/GameContext";

type InbreedingRisk =
  | "none"
  | "half_sibling"
  | "parent_child"
  | "full_sibling";

function getRiskLabel(risk: InbreedingRisk) {
  if (risk === "parent_child") return "Parent/Child Risk";
  if (risk === "full_sibling") return "Full Sibling Risk";
  if (risk === "half_sibling") return "Half Sibling Risk";
  return "No Risk";
}

function getRiskClasses(risk: InbreedingRisk) {
  if (risk === "none") {
    return "bg-green-100 text-green-900 border-green-300";
  }

  if (risk === "half_sibling") {
    return "bg-amber-100 text-amber-900 border-amber-300";
  }

  return "bg-red-100 text-red-900 border-red-300";
}

function getPenaltyPreview(risk: InbreedingRisk) {
  if (risk === "half_sibling") {
    return "Potential hatch penalty: one mild negative inherited trait.";
  }

  if (risk === "parent_child" || risk === "full_sibling") {
    return "Potential hatch penalty: one severe negative inherited trait.";
  }

  return "No inherited penalty risk on hatch.";
}

export default function EggsPage() {
  const { eggs, hatchEgg } = useGame();

  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-100 to-amber-200 p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-4xl font-bold text-amber-900">🥚 Eggs</h1>

        <div className="space-y-4">
          {eggs.length === 0 ? (
            <div className="rounded-3xl border-4 border-amber-900 bg-white/85 p-5 shadow-xl">
              <p className="text-lg text-stone-700">No eggs right now.</p>
            </div>
          ) : (
            eggs.map((egg) => (
              <div
                key={egg.id}
                className="rounded-3xl border-4 border-amber-900 bg-white/85 p-5 shadow-xl"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="text-5xl">🥚</div>
                  <div>
                    <h2 className="text-2xl font-bold text-amber-950">
                      {egg.name}
                    </h2>
                    <p className="text-stone-700">Parents: {egg.parents}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div
                    className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getRiskClasses(
                      egg.inbreedingRisk
                    )}`}
                  >
                    {getRiskLabel(egg.inbreedingRisk)}
                  </div>
                </div>

                <p className="mb-2 text-stone-800">
                  <strong>Hatch Time Remaining:</strong> {egg.hatchDaysRemaining} in-game days
                </p>

                <p className="mb-3 text-sm text-stone-600">
                  {getPenaltyPreview(egg.inbreedingRisk)}
                </p>

                {egg.hatchDaysRemaining === 0 && (
                  <button
                    onClick={() => hatchEgg(egg.id)}
                    className="w-full rounded-2xl bg-green-600 px-4 py-3 text-white font-semibold shadow"
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
            className="inline-block rounded-2xl bg-stone-800 px-5 py-3 text-white font-semibold shadow"
          >
            Back to Ranch
          </Link>
        </div>
      </div>
    </main>
  );
}