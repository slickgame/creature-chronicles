"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/context/GameContext";

type HistoryFilter = "all" | "eggs" | "hatched" | "ready" | "risk";
type HistoryStatus = "egg" | "hatched";
type HistoryRisk = "none" | "half_sibling" | "full_sibling" | "parent_child";
type HistoryQuality = "poor" | "normal" | "strong" | "exceptional" | null;

type HistoryEntry = {
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
  giverType: "player" | "creature";
  giverCreatureId: number | null;
  receiverType: "player" | "creature";
  receiverCreatureId: number | null;
  notes: string[];
};

function getRiskClasses(risk: HistoryRisk) {
  if (risk === "parent_child" || risk === "full_sibling") return "border-red-300 bg-red-100 text-red-900";
  if (risk === "half_sibling") return "border-amber-300 bg-amber-100 text-amber-900";
  return "border-emerald-300 bg-emerald-100 text-emerald-900";
}

function getRiskLabel(risk: HistoryRisk) {
  if (risk === "parent_child") return "Parent / Child";
  if (risk === "full_sibling") return "Full Sibling";
  if (risk === "half_sibling") return "Half Sibling";
  return "No Risk";
}

function getQualityClasses(quality: HistoryQuality) {
  if (quality === "exceptional") return "border-purple-300 bg-purple-100 text-purple-900";
  if (quality === "strong") return "border-sky-300 bg-sky-100 text-sky-900";
  if (quality === "normal") return "border-green-300 bg-green-100 text-green-900";
  if (quality === "poor") return "border-stone-300 bg-stone-100 text-stone-800";
  return "border-stone-300 bg-stone-100 text-stone-700";
}

function getEggQualityDescription(quality: HistoryQuality) {
  if (quality === "exceptional") return "Exceptional quality eggs tend to hatch into especially promising offspring with stronger overall inheritance.";
  if (quality === "strong") return "Strong quality eggs generally produce above-average hatch results and healthier inherited potential.";
  if (quality === "normal") return "Normal quality eggs hatch with standard inheritance expectations.";
  if (quality === "poor") return "Poor quality eggs may hatch with weaker inheritance outcomes or reduced overall promise.";
  return "No special quality modifier is recorded for this entry.";
}

function getRiskRank(risk: HistoryRisk) {
  if (risk === "parent_child" || risk === "full_sibling") return 3;
  if (risk === "half_sibling") return 2;
  return 1;
}

function DetailModal({
  open,
  title,
  onClose,
  children,
  maxWidth = "max-w-4xl",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className={`flex h-[88vh] w-full ${maxWidth} flex-col overflow-hidden rounded-3xl border-4 border-rose-900 bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-rose-200 px-5 py-4">
          <h2 className="text-2xl font-bold text-rose-950">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-xl bg-stone-800 px-4 py-2 text-sm font-semibold text-white shadow">
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export default function BreedingHistoryPage() {
  const { creatures, eggs, playerData, setBreedingSelection } = useGame();
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const historyEntries = useMemo(() => {
    const eggEntries: HistoryEntry[] = eggs.map((egg) => ({
      id: `egg-${egg.id}`,
      status: "egg",
      title: egg.name,
      subtitle: "Active egg in hatchery",
      giverLabel: egg.giverIsPlayer ? playerData.name : egg.giver,
      receiverLabel: egg.receiverIsPlayer ? playerData.name : egg.receiver,
      parentSummary: egg.parents,
      speciesLabel: "Unknown until hatch",
      dayLabel: "Current egg",
      hatchLabel: egg.hatchDaysRemaining <= 0 ? "Ready to hatch" : `${egg.hatchDaysRemaining} day(s) remaining`,
      quality: egg.quality ?? "normal",
      risk: egg.inbreedingRisk ?? "none",
      canReload:
        (egg.giverIsPlayer || creatures.some((c) => c.id === egg.giverId)) &&
        (egg.receiverIsPlayer || creatures.some((c) => c.id === egg.receiverId)),
      giverType: egg.giverIsPlayer ? "player" : "creature",
      giverCreatureId: egg.giverIsPlayer ? null : egg.giverId ?? null,
      receiverType: egg.receiverIsPlayer ? "player" : "creature",
      receiverCreatureId: egg.receiverIsPlayer ? null : egg.receiverId ?? null,
      notes: [
        egg.hatchDaysRemaining <= 0 ? "This egg can be hatched now." : "This egg is still incubating.",
        egg.inbreedingRisk === "none" ? "No inherited family-risk penalty is expected." : "This egg carries family-risk penalty potential.",
      ],
    }));

    const hatchedEntries: HistoryEntry[] = creatures
      .filter((creature) => creature.giver !== null || creature.receiver !== null)
      .map((creature) => ({
        id: `hatched-${creature.id}`,
        status: "hatched",
        title: creature.nickname,
        subtitle: `${creature.name} • Gen ${creature.generation}`,
        giverLabel: creature.giverIsPlayer ? playerData.name : creature.giver ?? "Unknown",
        receiverLabel: creature.receiverIsPlayer ? playerData.name : creature.receiver ?? "Unknown",
        parentSummary: `${creature.giver ?? "Unknown"} + ${creature.receiver ?? "Unknown"}`,
        speciesLabel: creature.name,
        dayLabel: `Born Day ${creature.bornOnDay}`,
        hatchLabel: `Level ${creature.level} • Happiness ${creature.happiness}`,
        quality: null,
        risk: creature.inbreedingRisk ?? "none",
        canReload:
          (creature.giverIsPlayer || creatures.some((c) => c.id === creature.giverId)) &&
          (creature.receiverIsPlayer || creatures.some((c) => c.id === creature.receiverId)),
        giverType: creature.giverIsPlayer ? "player" : "creature",
        giverCreatureId: creature.giverIsPlayer ? null : creature.giverId ?? null,
        receiverType: creature.receiverIsPlayer ? "player" : "creature",
        receiverCreatureId: creature.receiverIsPlayer ? null : creature.receiverId ?? null,
        notes: [
          creature.inbredTrait && creature.inbredTrait !== "none"
            ? `Inherited issue: ${creature.inbredTraitSeverity} ${creature.inbredTrait}.`
            : "No inherited negative trait recorded.",
          `Current breeding stamina: ${creature.breedingStamina}/${creature.maxBreedingStamina}.`,
        ],
      }));

    return [...eggEntries, ...hatchedEntries];
  }, [eggs, creatures, playerData.name]);

  const filteredEntries = useMemo(() => {
    const loweredSearch = search.trim().toLowerCase();

    const filtered = historyEntries.filter((entry) => {
      const matchesSearch =
        loweredSearch.length === 0 ||
        entry.title.toLowerCase().includes(loweredSearch) ||
        entry.subtitle.toLowerCase().includes(loweredSearch) ||
        entry.giverLabel.toLowerCase().includes(loweredSearch) ||
        entry.receiverLabel.toLowerCase().includes(loweredSearch) ||
        entry.parentSummary.toLowerCase().includes(loweredSearch) ||
        entry.speciesLabel.toLowerCase().includes(loweredSearch);

      const matchesFilter =
        filter === "all" ||
        (filter === "eggs" && entry.status === "egg") ||
        (filter === "hatched" && entry.status === "hatched") ||
        (filter === "ready" && entry.status === "egg" && entry.hatchLabel === "Ready to hatch") ||
        (filter === "risk" && entry.risk !== "none");

      return matchesSearch && matchesFilter;
    });

    filtered.sort((a, b) => {
      if (a.status !== b.status) return a.status === "egg" ? -1 : 1;
      if (filter === "risk") return getRiskRank(b.risk) - getRiskRank(a.risk);
      if (filter === "ready") {
        if (a.hatchLabel === "Ready to hatch" && b.hatchLabel !== "Ready to hatch") return -1;
        if (b.hatchLabel === "Ready to hatch" && a.hatchLabel !== "Ready to hatch") return 1;
      }
      return b.id.localeCompare(a.id);
    });

    return filtered;
  }, [historyEntries, filter, search]);

  const selectedEntry =
    filteredEntries.find((entry) => entry.id === selectedEntryId) ??
    historyEntries.find((entry) => entry.id === selectedEntryId) ??
    null;

  function loadPair(entry: HistoryEntry) {
    if (!entry.canReload) return;
    setBreedingSelection({
      giverType: entry.giverType,
      giverCreatureId: entry.giverCreatureId,
      receiverType: entry.receiverType,
      receiverCreatureId: entry.receiverCreatureId,
    });
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-rose-100 to-pink-200 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-rose-900">📜 Breeding History</h1>
              <p className="mt-1 text-stone-700">Compact history log for active eggs and hatched offspring.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                ["all", "All"],
                ["eggs", "Eggs"],
                ["ready", "Ready Eggs"],
                ["hatched", "Hatched"],
                ["risk", "Risk Only"],
              ] as [HistoryFilter, string][]).map(([value, label]) => (
                <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  filter === value ? "border-rose-700 bg-rose-700 text-white" : "border-rose-300 bg-white text-stone-700 hover:border-rose-400"
                }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 rounded-3xl border-4 border-rose-900 bg-white/85 p-4 shadow-xl">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search giver, receiver, parents, or species..." className="rounded-2xl border border-rose-300 bg-white px-4 py-3 text-sm text-stone-800 lg:col-span-2" />
              <div className="rounded-2xl bg-rose-50 p-3 text-sm text-stone-800"><p><strong>Total Records:</strong> {historyEntries.length}</p></div>
              <div className="rounded-2xl bg-rose-50 p-3 text-sm text-stone-800"><p><strong>Visible:</strong> {filteredEntries.length}</p></div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredEntries.length === 0 ? (
              <div className="rounded-3xl border-4 border-rose-900 bg-white/85 p-5 shadow-xl sm:col-span-2 xl:col-span-3">
                <p className="text-lg text-stone-700">No breeding history matches your filters.</p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <button key={entry.id} type="button" onClick={() => setSelectedEntryId(entry.id)} className="rounded-2xl border-2 border-rose-300 bg-white/90 p-3 text-left shadow transition hover:border-rose-500 hover:bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold text-rose-950">{entry.title}</p>
                      <p className="truncate text-sm text-stone-600">{entry.subtitle}</p>
                    </div>
                    <div className="rounded-full border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-900">
                      {entry.status === "egg" ? "Egg" : "Hatched"}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <div className={`inline-block rounded-full border px-2 py-1 text-[11px] font-semibold ${getRiskClasses(entry.risk)}`}>
                      {getRiskLabel(entry.risk)}
                    </div>
                    {entry.quality && (
                      <div className={`inline-block rounded-full border px-2 py-1 text-[11px] font-semibold capitalize ${getQualityClasses(entry.quality)}`}>
                        {entry.quality}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 grid gap-1 text-xs text-stone-700">
                    <p><strong>Giver:</strong> {entry.giverLabel}</p>
                    <p><strong>Receiver:</strong> {entry.receiverLabel}</p>
                    <p><strong>Species:</strong> {entry.speciesLabel}</p>
                    <p><strong>Status:</strong> {entry.hatchLabel ?? entry.dayLabel}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/breeding/hatchery" className="inline-block rounded-2xl border border-rose-300 bg-white px-5 py-3 font-semibold text-rose-900 shadow">Hatchery</Link>
            <Link href="/breeding" className="inline-block rounded-2xl bg-stone-800 px-5 py-3 font-semibold text-white shadow">Back to Breeding</Link>
          </div>
        </div>
      </main>

      <DetailModal open={selectedEntry !== null} title={selectedEntry ? selectedEntry.title : "History Details"} onClose={() => setSelectedEntryId(null)}>
        {selectedEntry && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-rose-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-rose-300 bg-white px-3 py-1 text-sm font-semibold text-rose-900">
                  {selectedEntry.status === "egg" ? "Egg Record" : "Hatched Record"}
                </div>
                <div className={`rounded-full border px-3 py-1 text-sm font-semibold ${getRiskClasses(selectedEntry.risk)}`}>
                  {getRiskLabel(selectedEntry.risk)}
                </div>
                {selectedEntry.quality && (
                  <div className={`rounded-full border px-3 py-1 text-sm font-semibold capitalize ${getQualityClasses(selectedEntry.quality)}`}>
                    {selectedEntry.quality}
                  </div>
                )}
              </div>
              <p className="mt-3 text-sm text-stone-600">{selectedEntry.subtitle}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-stone-100 p-4">
                <p className="mb-2 text-sm text-stone-500">Pair Details</p>
                <div className="space-y-1 text-sm text-stone-800">
                  <p><strong>Giver:</strong> {selectedEntry.giverLabel}</p>
                  <p><strong>Receiver:</strong> {selectedEntry.receiverLabel}</p>
                  <p><strong>Parents:</strong> {selectedEntry.parentSummary}</p>
                  <p><strong>Species:</strong> {selectedEntry.speciesLabel}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-stone-100 p-4">
                <p className="mb-2 text-sm text-stone-500">Status Details</p>
                <div className="space-y-1 text-sm text-stone-800">
                  <p><strong>Recorded:</strong> {selectedEntry.dayLabel}</p>
                  {selectedEntry.hatchLabel && <p><strong>Hatch Status:</strong> {selectedEntry.hatchLabel}</p>}
                  {selectedEntry.quality && <p><strong>Quality Effect:</strong> {getEggQualityDescription(selectedEntry.quality)}</p>}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-rose-50 p-4">
              <p className="mb-2 text-sm text-stone-500">Notes</p>
              <div className="space-y-2">
                {selectedEntry.notes.map((note, index) => (
                  <p key={`${selectedEntry.id}-note-${index}`} className="text-sm text-stone-800">• {note}</p>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => loadPair(selectedEntry)} disabled={!selectedEntry.canReload} className={`rounded-2xl px-4 py-3 text-sm font-semibold shadow ${
                selectedEntry.canReload ? "bg-rose-700 text-white" : "bg-stone-200 text-stone-500"
              }`}>
                {selectedEntry.canReload ? "Load Pair Into Breeding" : "Pair Unavailable"}
              </button>
            </div>
          </div>
        )}
      </DetailModal>
    </>
  );
}
