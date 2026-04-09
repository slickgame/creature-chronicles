"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import {
  CreatureTraitBadgeRow,
  CreatureTraitEntry,
} from "@/components/creatures/CreatureTraitUi";
import {
  EggCard,
  EggQuality,
  getEggQualityClasses,
  getEggQualityDescription,
  getPenaltyPreview,
  getQualityRank,
  getRiskClasses,
  getRiskLabel,
  InbreedingRisk,
} from "@/components/eggs/EggUi";

type InbredTrait = "none" | "weak" | "frail" | "dull" | "slow";
type InbredTraitSeverity = "none" | "mild" | "severe";

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
            <CreatureTraitBadgeRow traits={traits} maxVisible={traits.length} />
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
        return getQualityRank(b.quality as EggQuality) - getQualityRank(a.quality as EggQuality);
      }

      if (sortOption === "quality_worst") {
        return getQualityRank(a.quality as EggQuality) - getQualityRank(b.quality as EggQuality);
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
                <EggCard
                  key={egg.id}
                  egg={{
                    id: egg.id,
                    name: egg.name,
                    parents: egg.parents,
                    hatchDaysRemaining: egg.hatchDaysRemaining,
                    inbreedingRisk: egg.inbreedingRisk as InbreedingRisk,
                    quality: egg.quality as EggQuality,
                  }}
                  onClick={() => setSelectedEggId(egg.id)}
                />
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
