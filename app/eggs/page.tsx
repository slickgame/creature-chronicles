"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGame } from "@/context/GameContext";

type InbreedingRisk =
  | "none"
  | "half_sibling"
  | "parent_child"
  | "full_sibling";

type InbredTrait = "none" | "weak" | "frail" | "dull" | "slow";
type InbredTraitSeverity = "none" | "mild" | "severe";

type HatchedCreature = {
  id: number;
  name: string;
  nickname: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  stats: {
    strength: number;
    endurance: number;
    intelligence: number;
    speed: number;
    fertility: number;
    vitality: number;
  };
  breedingStamina: number;
  maxBreedingStamina: number;
  dailyBreedingLimit: number;
  generation: number;
  bornOnDay: number;
  inbreedingRisk: InbreedingRisk;
  inbredTrait: InbredTrait;
  inbredTraitSeverity: InbredTraitSeverity;
};

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

function getTraitLabel(
  trait: InbredTrait,
  severity: InbredTraitSeverity
) {
  if (trait === "none" || severity === "none") {
    return "No Inbred Trait";
  }

  const traitName =
    trait === "weak"
      ? "Weakness"
      : trait === "frail"
      ? "Frailty"
      : trait === "dull"
      ? "Dullness"
      : "Slowness";

  const severityName = severity === "mild" ? "Mild" : "Severe";

  return `${severityName} ${traitName}`;
}

function getTraitClasses(severity: InbredTraitSeverity) {
  if (severity === "none") {
    return "bg-stone-100 text-stone-700 border-stone-300";
  }

  if (severity === "mild") {
    return "bg-amber-100 text-amber-900 border-amber-300";
  }

  return "bg-red-100 text-red-900 border-red-300";
}

function getCreatureImage(name: string) {
  if (name === "Horse") return "/images/horse.png";
  if (name === "Cat") return "/images/cat.png";
  return "/images/egg.png";
}

export default function EggsPage() {
  const { eggs, hatchEgg, renameCreature } = useGame();
  const [hatchedCreature, setHatchedCreature] = useState<HatchedCreature | null>(
    null
  );
  const [nicknameInput, setNicknameInput] = useState("");

  function handleHatch(eggId: number) {
    const newCreature = hatchEgg(eggId);

    if (!newCreature) return;

    setHatchedCreature(newCreature);
    setNicknameInput(newCreature.nickname);
  }

  function handleSaveAndClose() {
    if (!hatchedCreature) return;

    renameCreature(hatchedCreature.id, nicknameInput);
    setHatchedCreature(null);
    setNicknameInput("");
  }

  function handleCloseWithoutRename() {
    setHatchedCreature(null);
    setNicknameInput("");
  }

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
                    onClick={() => handleHatch(egg.id)}
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

      {hatchedCreature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl border-4 border-emerald-900 bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-3xl font-bold text-emerald-900">
              🎉 Egg Hatched!
            </h2>

            <div className="mb-5 flex flex-col gap-5 md:flex-row">
              <div className="flex h-56 items-center justify-center overflow-hidden rounded-3xl bg-stone-100 md:w-72">
                <Image
                  src={getCreatureImage(hatchedCreature.name)}
                  alt={hatchedCreature.name}
                  width={320}
                  height={320}
                  className="max-h-full w-auto object-contain"
                />
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm text-stone-500">Species</p>
                  <p className="text-2xl font-bold text-stone-900">
                    {hatchedCreature.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-stone-500">Current Name</p>
                  <p className="text-xl font-semibold text-stone-900">
                    {hatchedCreature.nickname}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-50 p-3">
                    <p className="text-sm text-stone-500">Level</p>
                    <p className="font-semibold text-stone-900">
                      {hatchedCreature.level}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-3">
                    <p className="text-sm text-stone-500">XP</p>
                    <p className="font-semibold text-stone-900">
                      {hatchedCreature.xp} / {hatchedCreature.xpToNextLevel}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div
                    className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getRiskClasses(
                      hatchedCreature.inbreedingRisk
                    )}`}
                  >
                    {getRiskLabel(hatchedCreature.inbreedingRisk)}
                  </div>

                  <div
                    className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getTraitClasses(
                      hatchedCreature.inbredTraitSeverity
                    )}`}
                  >
                    {getTraitLabel(
                      hatchedCreature.inbredTrait,
                      hatchedCreature.inbredTraitSeverity
                    )}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-50 p-3">
                    <p className="text-sm text-stone-500">Generation</p>
                    <p className="font-semibold text-stone-900">
                      Gen {hatchedCreature.generation}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-3">
                    <p className="text-sm text-stone-500">Born On Day</p>
                    <p className="font-semibold text-stone-900">
                      Day {hatchedCreature.bornOnDay}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-3">
                  <p className="text-sm text-stone-500">Breeding Capacity</p>
                  <p className="font-semibold text-stone-900">
                    Stamina {hatchedCreature.breedingStamina}/{hatchedCreature.maxBreedingStamina} • Daily Limit {hatchedCreature.dailyBreedingLimit}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5 rounded-2xl bg-stone-100 p-4">
              <p className="mb-2 text-sm text-stone-500">Stats</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <p><strong>Strength:</strong> {hatchedCreature.stats.strength}</p>
                <p><strong>Endurance:</strong> {hatchedCreature.stats.endurance}</p>
                <p><strong>Intelligence:</strong> {hatchedCreature.stats.intelligence}</p>
                <p><strong>Speed:</strong> {hatchedCreature.stats.speed}</p>
                <p><strong>Fertility:</strong> {hatchedCreature.stats.fertility}</p>
                <p><strong>Vitality:</strong> {hatchedCreature.stats.vitality}</p>
              </div>
            </div>

            <div className="mb-5 rounded-2xl bg-emerald-50 p-4">
              <p className="mb-2 font-semibold text-emerald-950">
                Rename Newborn
              </p>
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2"
                placeholder="Enter new name"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleSaveAndClose}
                className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-semibold text-white shadow"
              >
                Save Name and Close
              </button>
              <button
                onClick={handleCloseWithoutRename}
                className="w-full rounded-2xl bg-stone-700 px-4 py-3 font-semibold text-white shadow"
              >
                Keep Current Name
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}