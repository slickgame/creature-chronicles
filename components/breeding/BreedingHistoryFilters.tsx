"use client";

export type BreedingHistoryFilter =
  | "all"
  | "eggs"
  | "hatched"
  | "risk"
  | "ready";

export function BreedingHistoryFilters({
  filter,
  setFilter,
  search,
  setSearch,
}: {
  filter: BreedingHistoryFilter;
  setFilter: (value: BreedingHistoryFilter) => void;
  search: string;
  setSearch: (value: string) => void;
}) {
  const filters: { value: BreedingHistoryFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "eggs", label: "Eggs" },
    { value: "ready", label: "Ready Eggs" },
    { value: "hatched", label: "Hatched" },
    { value: "risk", label: "Risk Only" },
  ];

  return (
    <div className="rounded-3xl border-4 border-rose-900 bg-white/85 p-4 shadow-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search giver, receiver, parents, or species..."
          className="w-full rounded-2xl border border-rose-300 bg-white px-4 py-3 text-sm text-stone-800 md:max-w-md"
        />

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                filter === item.value
                  ? "border-rose-700 bg-rose-700 text-white"
                  : "border-rose-300 bg-white text-stone-700 hover:border-rose-400"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
