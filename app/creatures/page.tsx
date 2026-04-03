"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGame } from "@/context/GameContext";

export default function CreaturesPage() {
  const { creatures, renameCreature } = useGame();
  const [editingCreatureId, setEditingCreatureId] = useState<number | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");

  function getCreatureImage(name: string) {
    if (name === "Horse") return "/images/horse.png";
    if (name === "Cat") return "/images/cat.png";
    return "/images/egg.png";
  }

  function getRiskLabel(
  risk: "none" | "half_sibling" | "parent_child" | "full_sibling"
) {
  if (risk === "parent_child") return "Parent/Child Risk";
  if (risk === "full_sibling") return "Full Sibling Risk";
  if (risk === "half_sibling") return "Half Sibling Risk";
  return "No Risk";
}

function getRiskClasses(
  risk: "none" | "half_sibling" | "parent_child" | "full_sibling"
) {
  if (risk === "none") {
    return "bg-green-100 text-green-900 border-green-300";
  }

  if (risk === "half_sibling") {
    return "bg-amber-100 text-amber-900 border-amber-300";
  }

  return "bg-red-100 text-red-900 border-red-300";
}

  function startEditing(creatureId: number, currentNickname: string) {
    setEditingCreatureId(creatureId);
    setNicknameInput(currentNickname);
  }

  function saveNickname(creatureId: number) {
    renameCreature(creatureId, nicknameInput);
    setEditingCreatureId(null);
    setNicknameInput("");
  }

  function cancelEditing() {
    setEditingCreatureId(null);
    setNicknameInput("");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 to-cyan-200 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-4xl font-bold text-sky-900">Creatures</h1>

        <div className="grid gap-4 md:grid-cols-2">
          {creatures.map((creature) => {
            const isEditing = editingCreatureId === creature.id;

            return (
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

                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={nicknameInput}
                          onChange={(e) => setNicknameInput(e.target.value)}
                          className="w-full rounded-xl border border-sky-300 bg-white px-3 py-2"
                          placeholder="Enter nickname"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveNickname(creature.id)}
                            className="rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="rounded-xl bg-gray-500 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold text-sky-950">
                          {creature.nickname}
                        </h2>
                        <p className="text-stone-700">{creature.name}</p>
                        <p className="text-sm text-stone-500">{creature.theme}</p>
                        <p className="text-sm text-stone-500">ID: {creature.id}</p>
                        <button
                          onClick={() => startEditing(creature.id, creature.nickname)}
                          className="mt-2 rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Edit Name
                        </button>
                      </>
                    )}
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

                <div className="mb-4 rounded-2xl bg-stone-100 p-3 space-y-1">
                  <p className="text-sm text-stone-500">Lineage</p>
                  {creature.giver && creature.receiver ? (
                    <>
                      <p className="font-semibold text-stone-900">
                        {creature.giver} → {creature.receiver}
                      </p>
                      <p className="text-sm text-stone-600">
                        Parent IDs: {creature.giverId ?? "Player"} / {creature.receiverId ?? "Player"}
                      </p>
                    </>
                  ) : (
                    <p className="font-semibold text-stone-900">
                      Starter Creature
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <div
                    className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getRiskClasses(
                      creature.inbreedingRisk
                    )}`}
                  >
                    {getRiskLabel(creature.inbreedingRisk)}
                  </div>
                </div>

                <div className="space-y-1 text-stone-800">
                  <p><strong>Strength:</strong> {creature.stats.strength}</p>
                  <p><strong>Endurance:</strong> {creature.stats.endurance}</p>
                  <p><strong>Intelligence:</strong> {creature.stats.intelligence}</p>
                  <p><strong>Speed:</strong> {creature.stats.speed}</p>
                </div>
              </div>
            );
          })}
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