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
type EggQuality = "poor" | "normal" | "strong" | "exceptional";

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

type HatchedCreature = {
  id: number;
  name: string;
  nickname: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  happiness: number;
  traits: CreatureTraitEntry[];
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

type SortOption =
  | "ready_first"
  | "time_lowest"
  | "time_highest"
  | "quality_best"
  | "quality_worst";

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

function getEggQualityClasses(quality: EggQuality) {
  if (quality === "exceptional") {
    return "bg-purple-100 text-purple-900 border-purple-300";
  }

  if (quality === "strong") {
    return "bg-sky-100 text-sky-900 border-sky-300";
  }

  if (quality === "normal") {
    return "bg-green-100 text-green-900 border-green-300";
  }

  return "bg-stone-100 text-stone-800 border-stone-300";
}

function getEggQualityDescription(quality: EggQuality) {
  if (quality === "exceptional") {
    return "Hatches with the strongest starting bonuses.";
  }

  if (quality === "strong") {
    return "Hatches with a smaller starting bonus.";
  }

  if (quality === "normal") {
    return "Standard hatch quality.";
  }

  return "No quality bonus on hatch.";
}

function getQualityRank(quality: EggQuality) {
  if (quality === "exceptional") return 4;
  if (quality === "strong") return 3;
  if (quality === "normal") return 2;
  return 1;
}

function getCreatureTraitLabel(trait: CreatureTrait) {
  if (trait === "domestic") return "Domestic";
  if (trait === "industrious") return "Industrious";
  if (trait === "calm") return "Calm";
  if (trait === "fertile") return "Fertile";
  if (trait === "quick") return "Quick";
  return "Sturdy";
}

function getCreatureTraitClasses(trait: CreatureTrait) {
  if (trait === "domestic") return "bg-pink-100 text-pink-900 border-pink-300";
  if (trait === "industrious") return "bg-amber-100 text-amber-900 border-amber-300";
  if (trait === "calm") return "bg-sky-100 text-sky-900 border-sky-300";
  if (trait === "fertile") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  if (trait === "quick") return "bg-violet-100 text-violet-900 border-violet-300";
  return "bg-stone-200 text-stone-900 border-stone-400";
}

function getCreatureTraitDescription(trait: CreatureTrait) {
  if (trait === "domestic") return "Better cooking and cleaning performance.";
  if (trait === "industrious") return "Better field work and labor performance.";
  if (trait === "calm") return "Lower breeding refusal chance.";
  if (trait === "fertile") return "Higher egg production chance.";
  if (trait === "quick") return "Lower time costs.";
  return "Lower stamina costs.";
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

function EggModal({
  open,
  egg,
  onClose,
  onHatch,
}: {
  open: boolean;
  egg: any | null;
  onClose: () => void;
  onHatch: (eggId: number) => void;
}) {
  if (!open || !egg) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border-4 border-amber-900 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-200 px-5 py-4">
          <h2 className="text-2xl font-bold text-amber-950">Egg Details</h2>
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
            <div className="flex h-52 w-full items-center justify-center overflow-hidden rounded-3xl bg-stone-100 md:w-72">
              <Image
                src="/images/egg.png"
                alt="Egg"
                width={320}
                height={320}
                className="max-h-full w-auto object-contain"
              />
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm text-stone-500">Egg</p>
                <p className="text-3xl font-bold text-amber-950">{egg.name}</p>
                <p className="text-stone-700">Parents: {egg.parents}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div
                  className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getRiskClasses(
                    egg.inbreedingRisk
                  )}`}
                >
                  {getRiskLabel(egg.inbreedingRisk)}
                </div>

                <div
                  className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getEggQualityClasses(
                    egg.quality
                  )}`}
                >
                  Egg Quality: {egg.quality}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-amber-50 p-3">
                  <p className="text-sm text-stone-500">Hatch Time Remaining</p>
                  <p className="font-semibold text-stone-900">
                    {egg.hatchDaysRemaining} in-game days
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-50 p-3">
                  <p className="text-sm text-stone-500">Quality Effect</p>
                  <p className="font-semibold text-stone-900">
                    {getEggQualityDescription(egg.quality)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-stone-100 p-4">
                <p className="text-sm text-stone-500">Risk Preview</p>
                <p className="font-semibold text-stone-900">
                  {getPenaltyPreview(egg.inbreedingRisk)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-stone-100 p-4">
            <p className="text-sm text-stone-500">Summary</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <p><strong>Giver:</strong> {egg.giver}</p>
              <p><strong>Receiver:</strong> {egg.receiver}</p>
              <p><strong>Giver ID:</strong> {egg.giverId ?? "Player"}</p>
              <p><strong>Receiver ID:</strong> {egg.receiverId ?? "Player"}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-amber-200 bg-white px-5 py-4">
          {egg.hatchDaysRemaining === 0 ? (
            <button
              onClick={() => onHatch(egg.id)}
              className="w-full rounded-2xl bg-green-600 px-4 py-3 text-white font-semibold shadow"
            >
              Hatch Egg
            </button>
          ) : (
            <div className="w-full rounded-2xl bg-stone-200 px-4 py-3 text-center font-semibold text-stone-700">
              Not ready to hatch yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HatchedCreatureModal({
  open,
  creature,
  nicknameInput,
  setNicknameInput,
  onSaveAndClose,
  onCloseWithoutRename,
}: {
  open: boolean;
  creature: HatchedCreature | null;
  nicknameInput: string;
  setNicknameInput: (value: string) => void;
  onSaveAndClose: () => void;
  onCloseWithoutRename: () => void;
}) {
  if (!open || !creature) return null;

  const traits: CreatureTraitEntry[] = Array.isArray(creature.traits)
    ? creature.traits
    : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border-4 border-emerald-900 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-emerald-200 px-6 py-4">
          <h2 className="text-3xl font-bold text-emerald-900">
            🎉 Egg Hatched!
          </h2>

          <button
            onClick={onCloseWithoutRename}
            className="rounded-xl bg-stone-200 px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-300"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="mb-5 flex flex-col gap-5 md:flex-row">
            <div className="flex h-56 items-center justify-center overflow-hidden rounded-3xl bg-stone-100 md:w-72">
              <Image
                src={getCreatureImage(creature.name)}
                alt={creature.name}
                width={320}
                height={320}
                className="max-h-full w-auto object-contain"
              />
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm text-stone-500">Species</p>
                <p className="text-2xl font-bold text-stone-900">
                  {creature.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-stone-500">Current Name</p>
                <p className="text-xl font-semibold text-stone-900">
                  {creature.nickname}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <p className="text-sm text-stone-500">Level</p>
                  <p className="font-semibold text-stone-900">
                    {creature.level}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <p className="text-sm text-stone-500">XP</p>
                  <p className="font-semibold text-stone-900">
                    {creature.xp} / {creature.xpToNextLevel}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
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

          <div className="mb-5 rounded-2xl bg-emerald-50 p-3">
            <p className="mb-3 text-sm text-stone-500">Traits</p>
            {traits.length === 0 ? (
              <p className="font-semibold text-stone-900">No Traits</p>
            ) : (
              <div className="space-y-3">
                {traits.map((entry, index) => (
                  <div
                    key={`${entry.trait}-${entry.grade}-${index}`}
                    className="rounded-2xl border border-emerald-200 bg-white p-3"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <div
                        className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getCreatureTraitClasses(
                          entry.trait
                        )}`}
                      >
                        {getCreatureTraitLabel(entry.trait)}
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
                      {getCreatureTraitDescription(entry.trait)}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      {getGradeDescription(entry.grade)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-5 rounded-2xl bg-stone-100 p-4">
            <p className="mb-2 text-sm text-stone-500">Stats</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <p><strong>Strength:</strong> {creature.stats.strength}</p>
              <p><strong>Endurance:</strong> {creature.stats.endurance}</p>
              <p><strong>Intelligence:</strong> {creature.stats.intelligence}</p>
              <p><strong>Speed:</strong> {creature.stats.speed}</p>
              <p><strong>Fertility:</strong> {creature.stats.fertility}</p>
              <p><strong>Vitality:</strong> {creature.stats.vitality}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-4">
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
        </div>

        <div className="sticky bottom-0 border-t border-emerald-200 bg-white px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onSaveAndClose}
              className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-semibold text-white shadow"
            >
              Save Name and Close
            </button>
            <button
              onClick={onCloseWithoutRename}
              className="w-full rounded-2xl bg-stone-700 px-4 py-3 font-semibold text-white shadow"
            >
              Keep Current Name
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EggsPage() {
  const { eggs, hatchEgg, renameCreature } = useGame();
  const [selectedEggId, setSelectedEggId] = useState<number | null>(null);
  const [hatchedCreature, setHatchedCreature] = useState<HatchedCreature | null>(
    null
  );
  const [nicknameInput, setNicknameInput] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("ready_first");

  const selectedEgg = eggs.find((egg) => egg.id === selectedEggId) ?? null;

  function handleHatch(eggId: number) {
    const newCreature = hatchEgg(eggId);

    if (!newCreature) return;

    setSelectedEggId(null);
    setHatchedCreature(newCreature as HatchedCreature);
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

  const sortedEggs = useMemo(() => {
    const copy = [...eggs];

    copy.sort((a, b) => {
      if (sortOption === "ready_first") {
        const aReady = a.hatchDaysRemaining === 0 ? 1 : 0;
        const bReady = b.hatchDaysRemaining === 0 ? 1 : 0;
        if (bReady !== aReady) return bReady - aReady;
        return a.hatchDaysRemaining - b.hatchDaysRemaining;
      }

      if (sortOption === "time_lowest") {
        return a.hatchDaysRemaining - b.hatchDaysRemaining;
      }

      if (sortOption === "time_highest") {
        return b.hatchDaysRemaining - a.hatchDaysRemaining;
      }

      if (sortOption === "quality_best") {
        return getQualityRank(b.quality) - getQualityRank(a.quality);
      }

      if (sortOption === "quality_worst") {
        return getQualityRank(a.quality) - getQualityRank(b.quality);
      }

      return 0;
    });

    return copy;
  }, [eggs, sortOption]);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-yellow-100 to-amber-200 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-amber-900">🥚 Eggs</h1>
              <p className="mt-1 text-stone-700">
                Compact egg roster. Click an egg for full details.
              </p>
            </div>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="rounded-xl border border-amber-300 bg-white px-3 py-2"
            >
              <option value="ready_first">Sort: Ready First</option>
              <option value="time_lowest">Sort: Lowest Time Remaining</option>
              <option value="time_highest">Sort: Highest Time Remaining</option>
              <option value="quality_best">Sort: Best Quality</option>
              <option value="quality_worst">Sort: Worst Quality</option>
            </select>
          </div>

          <div className="mb-6 rounded-3xl border-4 border-amber-900 bg-white/85 p-4 shadow-xl">
            <div className="grid gap-3 text-sm text-stone-800 sm:grid-cols-3">
              <p><strong>Total Eggs:</strong> {eggs.length}</p>
              <p><strong>Ready To Hatch:</strong> {eggs.filter((egg) => egg.hatchDaysRemaining === 0).length}</p>
              <p><strong>Instruction:</strong> Tap an egg for full details</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sortedEggs.length === 0 ? (
              <div className="rounded-3xl border-4 border-amber-900 bg-white/85 p-5 shadow-xl sm:col-span-2 xl:col-span-3">
                <p className="text-lg text-stone-700">No eggs right now.</p>
              </div>
            ) : (
              sortedEggs.map((egg) => (
                <button
                  key={egg.id}
                  type="button"
                  onClick={() => setSelectedEggId(egg.id)}
                  className="rounded-2xl border-2 border-amber-300 bg-white/90 p-3 text-left shadow transition hover:border-amber-500 hover:bg-white"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-stone-100 text-5xl">
                      🥚
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-lg font-bold text-amber-950">
                            {egg.name}
                          </p>
                          <p className="truncate text-sm text-stone-600">
                            {egg.parents}
                          </p>
                        </div>

                        <div className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
                          {egg.hatchDaysRemaining === 0
                            ? "Ready"
                            : `${egg.hatchDaysRemaining}d`}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <div
                          className={`inline-block rounded-full border px-2 py-1 text-[11px] font-semibold ${getRiskClasses(
                            egg.inbreedingRisk
                          )}`}
                        >
                          {getRiskLabel(egg.inbreedingRisk)}
                        </div>

                        <div
                          className={`inline-block rounded-full border px-2 py-1 text-[11px] font-semibold ${getEggQualityClasses(
                            egg.quality
                          )}`}
                        >
                          {egg.quality}
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-stone-700">
                        {getPenaltyPreview(egg.inbreedingRisk)}
                      </p>
                    </div>
                  </div>
                </button>
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

      <EggModal
        open={selectedEgg !== null}
        egg={selectedEgg}
        onClose={() => setSelectedEggId(null)}
        onHatch={handleHatch}
      />

      <HatchedCreatureModal
        open={hatchedCreature !== null}
        creature={hatchedCreature}
        nicknameInput={nicknameInput}
        setNicknameInput={setNicknameInput}
        onSaveAndClose={handleSaveAndClose}
        onCloseWithoutRename={handleCloseWithoutRename}
      />
    </>
  );
}
