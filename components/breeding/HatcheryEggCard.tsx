"use client";

type HatcheryRisk = "none" | "half_sibling" | "full_sibling" | "parent_child";
type EggQuality = "poor" | "normal" | "strong" | "exceptional";

export type HatcheryEggEntry = {
  id: number;
  name: string;
  parents: string;
  giver: string;
  receiver: string;
  hatchDaysRemaining: number;
  inbreedingRisk: HatcheryRisk;
  quality: EggQuality;
  readyToHatch: boolean;
  canReloadParents: boolean;
  onHatch: () => void;
  onReloadParents: () => void;
};

function getRiskLabel(risk: HatcheryRisk) {
  if (risk === "parent_child") return "Parent / Child";
  if (risk === "full_sibling") return "Full Sibling";
  if (risk === "half_sibling") return "Half Sibling";
  return "No Risk";
}

function getRiskClasses(risk: HatcheryRisk) {
  if (risk === "parent_child" || risk === "full_sibling") {
    return "border-red-300 bg-red-100 text-red-900";
  }
  if (risk === "half_sibling") {
    return "border-amber-300 bg-amber-100 text-amber-900";
  }
  return "border-emerald-300 bg-emerald-100 text-emerald-900";
}

function getQualityClasses(quality: EggQuality) {
  if (quality === "exceptional") {
    return "border-purple-300 bg-purple-100 text-purple-900";
  }
  if (quality === "strong") {
    return "border-sky-300 bg-sky-100 text-sky-900";
  }
  if (quality === "normal") {
    return "border-green-300 bg-green-100 text-green-900";
  }
  return "border-stone-300 bg-stone-100 text-stone-800";
}

export function HatcheryEggCard({
  egg,
}: {
  egg: HatcheryEggEntry;
}) {
  return (
    <div className="rounded-3xl border-4 border-rose-900 bg-white/85 p-4 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-rose-950">{egg.name}</h2>
            <div
              className={`rounded-full border px-2 py-1 text-[11px] font-semibold capitalize ${getQualityClasses(
                egg.quality
              )}`}
            >
              {egg.quality}
            </div>
            <div
              className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getRiskClasses(
                egg.inbreedingRisk
              )}`}
            >
              {getRiskLabel(egg.inbreedingRisk)}
            </div>
            <div className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-900">
              {egg.readyToHatch ? "Ready" : `${egg.hatchDaysRemaining} day(s) left`}
            </div>
          </div>

          <p className="mt-1 text-sm text-stone-600">{egg.parents}</p>

          <div className="mt-3 grid gap-2 text-sm text-stone-800 md:grid-cols-2">
            <p>
              <strong>Giver Species:</strong> {egg.giver}
            </p>
            <p>
              <strong>Receiver Species:</strong> {egg.receiver}
            </p>
            <p>
              <strong>Hatch Timer:</strong>{" "}
              {egg.readyToHatch ? "Ready to hatch now" : `${egg.hatchDaysRemaining} day(s) remaining`}
            </p>
            <p>
              <strong>Family Risk:</strong> {getRiskLabel(egg.inbreedingRisk)}
            </p>
          </div>
        </div>

        <div className="shrink-0 space-y-2">
          <button
            type="button"
            onClick={egg.onHatch}
            disabled={!egg.readyToHatch}
            className={`block w-full rounded-2xl px-4 py-3 text-sm font-semibold shadow ${
              egg.readyToHatch
                ? "bg-rose-700 text-white"
                : "bg-stone-200 text-stone-500"
            }`}
          >
            {egg.readyToHatch ? "Hatch Egg" : "Not Ready"}
          </button>

          <button
            type="button"
            onClick={egg.onReloadParents}
            disabled={!egg.canReloadParents}
            className={`block w-full rounded-2xl px-4 py-3 text-sm font-semibold shadow ${
              egg.canReloadParents
                ? "border border-rose-300 bg-white text-rose-900"
                : "bg-stone-200 text-stone-500"
            }`}
          >
            {egg.canReloadParents ? "Load Parents Into Breeding" : "Parents Unavailable"}
          </button>
        </div>
      </div>
    </div>
  );
}
