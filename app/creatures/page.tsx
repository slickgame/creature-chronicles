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

type CreatureTrait =
  | "domestic"
  | "industrious"
  | "calm"
  | "fertile"
  | "quick"
  | "sturdy";

type TraitGrade = "F" | "D" | "C" | "B" | "A" | "S";

type CreatureTraitEntry = {
  trait: CreatureTrait;
  grade: TraitGrade;
};

function getTraitLabel(trait: CreatureTrait) {
  if (trait === "domestic") return "Domestic";
  if (trait === "industrious") return "Industrious";
  if (trait === "calm") return "Calm";
  if (trait === "fertile") return "Fertile";
  if (trait === "quick") return "Quick";
  return "Sturdy";
}

function getTraitClasses(trait: CreatureTrait) {
  if (trait === "domestic") return "bg-pink-100 text-pink-900 border-pink-300";
  if (trait === "industrious") return "bg-amber-100 text-amber-900 border-amber-300";
  if (trait === "calm") return "bg-sky-100 text-sky-900 border-sky-300";
  if (trait === "fertile") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  if (trait === "quick") return "bg-violet-100 text-violet-900 border-violet-300";
  return "bg-stone-200 text-stone-900 border-stone-400";
}

function getTraitDescription(trait: CreatureTrait) {
  if (trait === "domestic") return "Boosts cooking and cleaning.";
  if (trait === "industrious") return "Boosts field work and hauling.";
  if (trait === "calm") return "Reduces breeding refusal chance.";
  if (trait === "fertile") return "Improves egg production chance.";
  if (trait === "quick") return "Reduces time costs.";
  return "Reduces stamina costs.";
}

function getGradeClasses(grade: TraitGrade) {
  if (grade === "F") return "bg-stone-100 text-stone-700 border-stone-300";
  if (grade === "D") return "bg-slate-100 text-slate-800 border-slate-300";
  if (grade === "C") return "bg-blue-100 text-blue-900 border-blue-300";
  if (grade === "B") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  if (grade === "A") return "bg-amber-100 text-amber-900 border-amber-300";
  return "bg-rose-100 text-rose-900 border-rose-300";
}

function getGradeDescription(grade: TraitGrade) {
  if (grade === "F") return "Very weak version";
  if (grade === "D") return "Weak version";
  if (grade === "C") return "Average version";
  if (grade === "B") return "Strong version";
  if (grade === "A") return "Excellent version";
  return "Exceptional version";
}

export default function CreaturesPage() {
  const { creatures, renameCreature } = useGame();
  const [editingCreatureId, setEditingCreatureId] = useState<number | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");

  function getCreatureImage(name: string) {
    if (name === "Horse") return "/images/horse.png";
    if (name === "Cat") return "/images/cat.png";
    return "/images/egg.png";
  }

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

  function getInbredTraitLabel(
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

  function getInbredTraitClasses(severity: InbredTraitSeverity) {
    if (severity === "none") {
      return "bg-stone-100 text-stone-700 border-stone-300";
    }

    if (severity === "mild") {
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
            const traits: CreatureTraitEntry[] = Array.isArray(creature.traits)
              ? creature.traits
              : [];

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

                <div className="mb-4 flex flex-wrap gap-2">
                  <div
                    className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getRiskClasses(
                      creature.inbreedingRisk
                    )}`}
                  >
                    {getRiskLabel(creature.inbreedingRisk)}
                  </div>

                  <div
                    className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getInbredTraitClasses(
                      creature.inbredTraitSeverity
                    )}`}
                  >
                    {getInbredTraitLabel(
                      creature.inbredTrait,
                      creature.inbredTraitSeverity
                    )}
                  </div>
                </div>

                <div className="mb-4 rounded-2xl bg-sky-50 p-3">
                  <p className="mb-2 text-sm text-stone-500">Traits</p>

                  {traits.length > 0 ? (
                    <div className="space-y-3">
                      {traits.map((entry, index) => (
                        <div
                          key={`${creature.id}-${entry.trait}-${entry.grade}-${index}`}
                          className="rounded-2xl border border-sky-200 bg-white p-3"
                        >
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <div
                              className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getTraitClasses(
                                entry.trait
                              )}`}
                            >
                              {getTraitLabel(entry.trait)}
                            </div>

                            <div
                              className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getGradeClasses(
                                entry.grade
                              )}`}
                            >
                              Grade {entry.grade}
                            </div>
                          </div>

                          <p className="font-semibold text-stone-900">
                            {getTraitDescription(entry.trait)}
                          </p>
                          <p className="mt-1 text-sm text-stone-600">
                            {getGradeDescription(entry.grade)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-semibold text-stone-700">No Traits</p>
                  )}
                </div>

                <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl bg-sky-50 p-3">
                    <p className="text-sm text-stone-500">Level</p>
                    <p className="font-semibold text-stone-900">
                      {creature.level}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-sky-50 p-3">
                    <p className="text-sm text-stone-500">XP</p>
                    <p className="font-semibold text-stone-900">
                      {creature.xp} / {creature.xpToNextLevel}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-sky-50 p-3">
                    <p className="text-sm text-stone-500">Happiness</p>
                    <p className="font-semibold text-stone-900">
                      {creature.happiness}
                    </p>
                  </div>

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

                  <div className="rounded-2xl bg-sky-50 p-3">
                    <p className="text-sm text-stone-500">Breeding Stamina</p>
                    <p className="font-semibold text-stone-900">
                      {creature.breedingStamina} / {creature.maxBreedingStamina}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-sky-50 p-3">
                    <p className="text-sm text-stone-500">Breedings Today</p>
                    <p className="font-semibold text-stone-900">
                      {creature.breedingsToday} / {creature.dailyBreedingLimit}
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

                <div className="mb-4 grid gap-2 text-stone-800 sm:grid-cols-2">
                  <p><strong>Strength:</strong> {creature.stats.strength}</p>
                  <p><strong>Endurance:</strong> {creature.stats.endurance}</p>
                  <p><strong>Intelligence:</strong> {creature.stats.intelligence}</p>
                  <p><strong>Speed:</strong> {creature.stats.speed}</p>
                  <p><strong>Fertility:</strong> {creature.stats.fertility}</p>
                  <p><strong>Vitality:</strong> {creature.stats.vitality}</p>
                </div>

                <div className="grid gap-2 text-stone-800 sm:grid-cols-2">
                  <p><strong>Cooking Skill:</strong> Lv {creature.skills.cooking.level}</p>
                  <p><strong>Cleaning Skill:</strong> Lv {creature.skills.cleaning.level}</p>
                  <p><strong>Breeding Care:</strong> Lv {creature.skills.breedingCare.level}</p>
                  <p><strong>Field Work:</strong> Lv {creature.skills.fieldWork.level}</p>
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