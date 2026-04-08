"use client";

type HistoryStatus = "egg" | "hatched";
type HistoryRisk = "none" | "half_sibling" | "full_sibling" | "parent_child";
type HistoryQuality = "poor" | "normal" | "strong" | "exceptional" | null;

export type BreedingHistoryEntry = {
  id: string;
  status: HistoryStatus;
  title: string;
  subtitle: string;
  giverLabel: string;
  receiverLabel: string;
  parentSummary: string;
  speciesLabel: string;
  dayLabel: string;
  hatchLabel: string | null;
  quality: HistoryQuality;
  risk: HistoryRisk;
  canReload: boolean;
  onReload: () => void;
};

function getRiskClasses(risk: HistoryRisk) {
  if (risk === "parent_child" || risk === "full_sibling") {
    return "border-red-300 bg-red-100 text-red-900";
  }
  if (risk === "half_sibling") {
    return "border-amber-300 bg-amber-100 text-amber-900";
  }
  return "border-emerald-300 bg-emerald-100 text-emerald-900";
}

function getRiskLabel(risk: HistoryRisk) {
  if (risk === "parent_child") return "Parent / Child";
  if (risk === "full_sibling") return "Full Sibling";
  if (risk === "half_sibling") return "Half Sibling";
  return "No Risk";
}

function getQualityClasses(quality: HistoryQuality) {
  if (quality === "exceptional") {
    return "border-purple-300 bg-purple-100 text-purple-900";
  }
  if (quality === "strong") {
    return "border-sky-300 bg-sky-100 text-sky-900";
  }
  if (quality === "normal") {
    return "border-green-300 bg-green-100 text-green-900";
  }
  if (quality === "poor") {
    return "border-stone-300 bg-stone-100 text-stone-800";
  }
  return "border-stone-300 bg-stone-100 text-stone-700";
}

export function BreedingHistoryCard({
  entry,
}: {
  entry: BreedingHistoryEntry;
}) {
  return (
    <div className="rounded-3xl border-4 border-rose-900 bg-white/85 p-4 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-rose-950">{entry.title}</h2>
            <div
              className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getRiskClasses(
                entry.risk
              )}`}
            >
              {getRiskLabel(entry.risk)}
            </div>
            {entry.quality && (
              <div
                className={`rounded-full border px-2 py-1 text-[11px] font-semibold capitalize ${getQualityClasses(
                  entry.quality
                )}`}
              >
                {entry.quality}
              </div>
            )}
            <div className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-900">
              {entry.status === "egg" ? "Egg" : "Hatched"}
            </div>
          </div>

          <p className="mt-1 text-sm text-stone-600">{entry.subtitle}</p>

          <div className="mt-3 grid gap-2 text-sm text-stone-800 md:grid-cols-2">
            <p>
              <strong>Giver:</strong> {entry.giverLabel}
            </p>
            <p>
              <strong>Receiver:</strong> {entry.receiverLabel}
            </p>
            <p>
              <strong>Parents:</strong> {entry.parentSummary}
            </p>
            <p>
              <strong>Species:</strong> {entry.speciesLabel}
            </p>
            <p>
              <strong>Recorded:</strong> {entry.dayLabel}
            </p>
            {entry.hatchLabel && (
              <p>
                <strong>Hatch Status:</strong> {entry.hatchLabel}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            onClick={entry.onReload}
            disabled={!entry.canReload}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold shadow ${
              entry.canReload
                ? "bg-rose-700 text-white"
                : "bg-stone-200 text-stone-500"
            }`}
          >
            {entry.canReload ? "Load Pair Into Breeding" : "Pair Unavailable"}
          </button>
        </div>
      </div>
    </div>
  );
}
