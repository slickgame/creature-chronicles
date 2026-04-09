"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useGame } from "@/context/GameContext";

type InbreedingRisk =
  | "none"
  | "half_sibling"
  | "parent_child"
  | "full_sibling";

type EggQuality = "poor" | "normal" | "strong" | "exceptional";
type SortOption =
  | "ready_first"
  | "time_lowest"
  | "time_highest"
  | "quality_best"
  | "quality_worst"
  | "risk_first";

function getRiskLabel(risk: InbreedingRisk) {
  if (risk === "parent_child") return "Parent/Child Risk";
  if (risk === "full_sibling") return "Full Sibling Risk";
  if (risk === "half_sibling") return "Half Sibling Risk";
  return "No Risk";
}

function getRiskClasses(risk: InbreedingRisk) {
  if (risk === "none") return "bg-green-100 text-green-900 border-green-300";
  if (risk === "half_sibling") return "bg-amber-100 text-amber-900 border-amber-300";
  return "bg-red-100 text-red-900 border-red-300";
}

function getRiskRank(risk: InbreedingRisk) {
  if (risk === "parent_child" || risk === "full_sibling") return 3;
  if (risk === "half_sibling") return 2;
  return 1;
}

function getEggQualityClasses(quality: EggQuality) {
  if (quality === "exceptional") return "bg-purple-100 text-purple-900 border-purple-300";
  if (quality === "strong") return "bg-sky-100 text-sky-900 border-sky-300";
  if (quality === "normal") return "bg-green-100 text-green-900 border-green-300";
  return "bg-stone-100 text-stone-800 border-stone-300";
}

function getEggQualityDescription(quality: EggQuality) {
  if (quality === "exceptional") return "Hatches with the strongest starting bonuses.";
  if (quality === "strong") return "Hatches with a smaller starting bonus.";
  if (quality === "normal") return "Standard hatch quality.";
  return "No quality bonus on hatch.";
}

function getQualityRank(quality: EggQuality) {
  if (quality === "exceptional") return 4;
  if (quality === "strong") return 3;
  if (quality === "normal") return 2;
  return 1;
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

function HatcheryEggModal({
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
      <div className="flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border-4 border-rose-900 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-rose-200 px-5 py-4">
          <h2 className="text-2xl font-bold text-rose-950">Hatchery Egg Details</h2>
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
                <p className="text-3xl font-bold text-rose-950">{egg.name}</p>
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
                  className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold capitalize ${getEggQualityClasses(
                    egg.quality
                  )}`}
                >
                  Quality: {egg.quality}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-rose-50 p-3">
                  <p className="text-sm text-stone-500">Hatch Time Remaining</p>
                  <p className="font-semibold text-stone-900">
                    {egg.hatchDaysRemaining} in-game days
                  </p>
                </div>

                <div className="rounded-2xl bg-rose-50 p-3">
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

        <div className="border-t border-rose-200 bg-white px-5 py-4">
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

export default function HatcheryPage() {
  const { eggs, hatchEgg } = useGame();
  const [selectedEggId, setSelectedEggId] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("ready_first");

  const selectedEgg = eggs.find((egg) => egg.id === selectedEggId) ?? null;

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

      if (sortOption === "risk_first") {
        return getRiskRank(b.inbreedingRisk) - getRiskRank(a.inbreedingRisk);
      }

      return 0;
    });

    return copy;
  }, [eggs, sortOption]);

  function handleHatch(eggId: number) {
    hatchEgg(eggId);
    setSelectedEggId(null);
  }

  const readyCount = eggs.filter((egg) => egg.hatchDaysRemaining === 0).length;
  const riskCount = eggs.filter((egg) => egg.inbreedingRisk !== "none").length;

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-rose-100 to-pink-200 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-rose-900">🐣 Hatchery</h1>
              <p className="mt-1 text-stone-700">
                Compact hatchery roster. Click an egg for full details.
              </p>
            </div>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="rounded-xl border border-rose-300 bg-white px-3 py-2"
            >
              <option value="ready_first">Sort: Ready First</option>
              <option value="time_lowest">Sort: Lowest Time Remaining</option>
              <option value="time_highest">Sort: Highest Time Remaining</option>
              <option value="quality_best">Sort: Best Quality</option>
              <option value="quality_worst">Sort: Worst Quality</option>
              <option value="risk_first">Sort: Highest Risk</option>
            </select>
          </div>

          <div className="mb-6 rounded-3xl border-4 border-rose-900 bg-white/85 p-4 shadow-xl">
            <div className="grid gap-3 text-sm text-stone-800 sm:grid-cols-3">
              <p><strong>Total Eggs:</strong> {eggs.length}</p>
              <p><strong>Ready To Hatch:</strong> {readyCount}</p>
              <p><strong>Risk Eggs:</strong> {riskCount}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sortedEggs.length === 0 ? (
              <div className="rounded-3xl border-4 border-rose-900 bg-white/85 p-5 shadow-xl sm:col-span-2 xl:col-span-3">
                <p className="text-lg text-stone-700">No eggs in the hatchery right now.</p>
              </div>
            ) : (
              sortedEggs.map((egg) => (
                <button
                  key={egg.id}
                  type="button"
                  onClick={() => setSelectedEggId(egg.id)}
                  className="rounded-2xl border-2 border-rose-300 bg-white/90 p-3 text-left shadow transition hover:border-rose-500 hover:bg-white"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-stone-100 text-5xl">
                      🥚
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-lg font-bold text-rose-950">
                            {egg.name}
                          </p>
                          <p className="truncate text-sm text-stone-600">
                            {egg.parents}
                          </p>
                        </div>

                        <div className="rounded-full border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-900">
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
                          className={`inline-block rounded-full border px-2 py-1 text-[11px] font-semibold capitalize ${getEggQualityClasses(
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

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/eggs"
              className="inline-block rounded-2xl bg-white px-5 py-3 font-semibold text-rose-900 shadow border border-rose-300"
            >
              View All Eggs
            </Link>
            <Link
              href="/breeding"
              className="inline-block rounded-2xl bg-stone-800 px-5 py-3 text-white font-semibold shadow"
            >
              Back to Breeding
            </Link>
          </div>
        </div>
      </main>

      <HatcheryEggModal
        open={selectedEgg !== null}
        egg={selectedEgg}
        onClose={() => setSelectedEggId(null)}
        onHatch={handleHatch}
      />
    </>
  );
}
