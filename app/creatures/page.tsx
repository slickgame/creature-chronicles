"use client";

import { useMemo, useState } from "react";
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

type SortOption =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "level_desc"
  | "generation_desc"
  | "happiness_desc";

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

function TraitBadgeRow({ traits }: { traits: CreatureTraitEntry[] }) {
  if (traits.length === 0) {
    return (
      <div className="inline-block rounded-full border border-stone-300 bg-stone-100 px-2 py-1 text-[11px] font-semibold text-stone-700">
        No Traits
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {traits.slice(0, 2).map((entry, index) => (
        <div
          key={`${entry.trait}-${entry.grade}-${index}`}
          className="group relative flex items-center gap-1"
        >
          <div
            className={`inline-block rounded-full border px-2 py-1 text-[11px] font-semibold ${getTraitClasses(
              entry.trait
            )}`}
          >
            {getTraitLabel(entry.trait)}
          </div>
          <div
            className={`inline-block rounded-full border px-2 py-1 text-[10px] font-semibold ${getGradeClasses(
              entry.grade
            )}`}
          >
            {entry.grade}
          </div>

          <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-56 rounded-2xl border border-stone-300 bg-white p-3 text-left text-xs text-stone-700 shadow-xl group-hover:block">
            <p className="font-semibold text-stone-900">
              {getTraitLabel(entry.trait)} ({entry.grade})
            </p>
            <p className="mt-1">{getTraitDescription(entry.trait)}</p>
            <p className="mt-1 text-stone-500">
              {getGradeDescription(entry.grade)}
            </p>
          </div>
        </div>
      ))}

      {traits.length > 2 && (
        <div className="inline-block rounded-full border border-stone-300 bg-white px-2 py-1 text-[11px] font-semibold text-stone-700">
          +{traits.length - 2} more
        </div>
      )}
    </div>
  );
}

function CreatureModal({
  open,
  creature,
  onClose,
  editingCreatureId,
  nicknameInput,
  setNicknameInput,
  startEditing,
  saveNickname,
  cancelEditing,
}: {
  open: boolean;
  creature: any | null;
  onClose: () => void;
  editingCreatureId: number | null;
  nicknameInput: string;
  setNicknameInput: (value: string) => void;
  startEditing: (creatureId: number, currentNickname: string) => void;
  saveNickname: (creatureId: number) => void;
  cancelEditing: () => void;
}) {
  if (!open || !creature) return null;

  const isEditing = editingCreatureId === creature.id;
  const traits: CreatureTraitEntry[] = Array.isArray(creature.traits)
    ? creature.traits
    : [];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border-4 border-sky-900 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-sky-200 px-5 py-4">
          <h2 className="text-2xl font-bold text-sky-950">Creature Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-stone-800 px-4 py-2 text-sm font-semibold text-white shadow"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-5 flex flex-col gap-5 md:flex-row">
            <div className="flex h-56 w-full items-center justify-center overflow-hidden rounded-3xl bg-stone-100 md:w-72">
              <Image
                src={getCreatureImage(creature.name)}
                alt={creature.name}
                width={320}
                height={320}
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
                  <h3 className="text-3xl font-bold text-sky-950">
                    {creature.nickname}
                  </h3>
                  <p className="text-stone-700">{creature.name}</p>
                  <p className="text-sm text-stone-500">{creature.theme}</p>
                  <p className="text-sm text-stone-500">ID: {creature.id}</p>
                  <button
                    onClick={() => startEditing(creature.id, creature.nickname)}
                    className="mt-3 rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Edit Name
                  </button>
                </>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
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
            </div>
          </div>

          <div className="mb-5 rounded-2xl bg-sky-50 p-4">
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

          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-sky-50 p-3">
              <p className="text-sm text-stone-500">Level</p>
              <p className="font-semibold text-stone-900">{creature.level}</p>
            </div>

            <div className="rounded-2xl bg-sky-50 p-3">
              <p className="text-sm text-stone-500">XP</p>
              <p className="font-semibold text-stone-900">
                {creature.xp} / {creature.xpToNextLevel}
              </p>
            </div>

            <div className="rounded-2xl bg-sky-50 p-3">
              <p className="text-sm text-stone-500">Happiness</p>
              <p className="font-semibold text-stone-900">{creature.happiness}</p>
            </div>

            <div className="rounded-2xl bg-sky-50 p-3">
              <p className="text-sm text-stone-500">Generation</p>
              <p className="font-semibold text-stone-900">Gen {creature.generation}</p>
            </div>

            <div className="rounded-2xl bg-sky-50 p-3">
              <p className="text-sm text-stone-500">Born On Day</p>
              <p className="font-semibold text-stone-900">Day {creature.bornOnDay}</p>
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

          <div className="mb-5 rounded-2xl bg-stone-100 p-4 space-y-1">
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
              <p className="font-semibold text-stone-900">Starter Creature</p>
            )}
          </div>

          <div className="mb-5 grid gap-2 text-stone-800 sm:grid-cols-2">
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
      </div>
    </div>
  );
}

export default function CreaturesPage() {
  const { creatures, renameCreature } = useGame();
  const [editingCreatureId, setEditingCreatureId] = useState<number | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [selectedCreatureId, setSelectedCreatureId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  const selectedCreature =
    creatures.find((creature) => creature.id === selectedCreatureId) ?? null;

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

  const filteredCreatures = useMemo(() => {
    const lowered = searchText.trim().toLowerCase();

    const filtered = creatures.filter((creature) => {
      return (
        lowered.length === 0 ||
        creature.nickname.toLowerCase().includes(lowered) ||
        creature.name.toLowerCase().includes(lowered) ||
        creature.theme.toLowerCase().includes(lowered)
      );
    });

    filtered.sort((a, b) => {
      if (sortOption === "newest") {
        if (b.bornOnDay !== a.bornOnDay) return b.bornOnDay - a.bornOnDay;
        return b.id - a.id;
      }

      if (sortOption === "oldest") {
        if (a.bornOnDay !== b.bornOnDay) return a.bornOnDay - b.bornOnDay;
        return a.id - b.id;
      }

      if (sortOption === "name_asc") return a.nickname.localeCompare(b.nickname);
      if (sortOption === "name_desc") return b.nickname.localeCompare(a.nickname);
      if (sortOption === "level_desc") return b.level - a.level;
      if (sortOption === "generation_desc") return b.generation - a.generation;
      if (sortOption === "happiness_desc") return b.happiness - a.happiness;

      return 0;
    });

    return filtered;
  }, [creatures, searchText, sortOption]);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-sky-100 to-cyan-200 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-sky-900">Creatures</h1>
              <p className="mt-1 text-stone-700">
                Compact roster view. Click any creature to open full details.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search creatures..."
                className="rounded-xl border border-sky-300 bg-white px-3 py-2"
              />

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="rounded-xl border border-sky-300 bg-white px-3 py-2"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="name_asc">Sort: Name A–Z</option>
                <option value="name_desc">Sort: Name Z–A</option>
                <option value="level_desc">Sort: Highest Level</option>
                <option value="generation_desc">Sort: Highest Generation</option>
                <option value="happiness_desc">Sort: Highest Happiness</option>
              </select>
            </div>
          </div>

          <div className="mb-6 rounded-3xl border-4 border-sky-900 bg-white/85 p-4 shadow-xl">
            <div className="grid gap-3 text-sm text-stone-800 sm:grid-cols-3">
              <p><strong>Total Creatures:</strong> {creatures.length}</p>
              <p><strong>Visible:</strong> {filteredCreatures.length}</p>
              <p><strong>Instruction:</strong> Tap a card for full details</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCreatures.map((creature) => {
              const traits: CreatureTraitEntry[] = Array.isArray(creature.traits)
                ? creature.traits
                : [];

              return (
                <button
                  key={creature.id}
                  type="button"
                  onClick={() => setSelectedCreatureId(creature.id)}
                  className="rounded-2xl border-2 border-sky-300 bg-white/90 p-3 text-left shadow transition hover:border-sky-500 hover:bg-white"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-stone-100">
                      <Image
                        src={getCreatureImage(creature.name)}
                        alt={creature.name}
                        width={160}
                        height={160}
                        className="max-h-full w-auto object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-lg font-bold text-sky-950">
                            {creature.nickname}
                          </p>
                          <p className="truncate text-sm text-stone-600">
                            {creature.name} • {creature.theme}
                          </p>
                        </div>

                        <div className="rounded-full border border-sky-300 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-900">
                          Lv {creature.level}
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-stone-700">
                        <p><strong>Gen:</strong> {creature.generation}</p>
                        <p><strong>Happy:</strong> {creature.happiness}</p>
                        <p><strong>XP:</strong> {creature.xp}/{creature.xpToNextLevel}</p>
                        <p><strong>Stam:</strong> {creature.breedingStamina}/{creature.maxBreedingStamina}</p>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <div
                          className={`inline-block rounded-full border px-2 py-1 text-[11px] font-semibold ${getRiskClasses(
                            creature.inbreedingRisk
                          )}`}
                        >
                          {getRiskLabel(creature.inbreedingRisk)}
                        </div>

                        <div
                          className={`inline-block rounded-full border px-2 py-1 text-[11px] font-semibold ${getInbredTraitClasses(
                            creature.inbredTraitSeverity
                          )}`}
                        >
                          {getInbredTraitLabel(
                            creature.inbredTrait,
                            creature.inbredTraitSeverity
                          )}
                        </div>
                      </div>

                      <div className="mt-2">
                        <TraitBadgeRow traits={traits} />
                      </div>
                    </div>
                  </div>
                </button>
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

      <CreatureModal
        open={selectedCreature !== null}
        creature={selectedCreature}
        onClose={() => {
          setSelectedCreatureId(null);
          if (editingCreatureId !== null) {
            cancelEditing();
          }
        }}
        editingCreatureId={editingCreatureId}
        nicknameInput={nicknameInput}
        setNicknameInput={setNicknameInput}
        startEditing={startEditing}
        saveNickname={saveNickname}
        cancelEditing={cancelEditing}
      />
    </>
  );
}
