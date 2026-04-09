"use client";

export type InbreedingRisk =
  | "none"
  | "half_sibling"
  | "parent_child"
  | "full_sibling";

export type EggQuality = "poor" | "normal" | "strong" | "exceptional";

export function getRiskLabel(risk: InbreedingRisk) {
  if (risk === "parent_child") return "Parent/Child Risk";
  if (risk === "full_sibling") return "Full Sibling Risk";
  if (risk === "half_sibling") return "Half Sibling Risk";
  return "No Risk";
}

export function getRiskClasses(risk: InbreedingRisk) {
  if (risk === "none") {
    return "bg-green-100 text-green-900 border-green-300";
  }

  if (risk === "half_sibling") {
    return "bg-amber-100 text-amber-900 border-amber-300";
  }

  return "bg-red-100 text-red-900 border-red-300";
}

export function getPenaltyPreview(risk: InbreedingRisk) {
  if (risk === "half_sibling") {
    return "Potential hatch penalty: one mild negative inherited trait.";
  }

  if (risk === "parent_child" || risk === "full_sibling") {
    return "Potential hatch penalty: one severe negative inherited trait.";
  }

  return "No inherited penalty risk on hatch.";
}

export function getEggQualityClasses(quality: EggQuality) {
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

export function getEggQualityDescription(quality: EggQuality) {
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

export function getQualityRank(quality: EggQuality) {
  if (quality === "exceptional") return 4;
  if (quality === "strong") return 3;
  if (quality === "normal") return 2;
  return 1;
}

export function EggCard({
  egg,
  onClick,
}: {
  egg: {
    id: number;
    name: string;
    parents: string;
    hatchDaysRemaining: number;
    inbreedingRisk: InbreedingRisk;
    quality: EggQuality;
  };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
  );
}
