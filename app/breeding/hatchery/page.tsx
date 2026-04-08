"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import {
  HatcheryEggCard,
  HatcheryEggEntry,
} from "@/components/breeding/HatcheryEggCard";

type HatcheryFilter = "all" | "ready" | "risk";

export default function BreedingHatcheryPage() {
  const { eggs, hatchEgg, creatures, setBreedingSelection } = useGame();
  const router = useRouter();
  const [filter, setFilter] = useState<HatcheryFilter>("all");
  const [search, setSearch] = useState("");
  const [lastHatchedName, setLastHatchedName] = useState<string | null>(null);
  const [lastBatchCount, setLastBatchCount] = useState<number>(0);

  const readyEggIds = useMemo(
    () => eggs.filter((egg) => egg.hatchDaysRemaining <= 0).map((egg) => egg.id),
    [eggs]
  );

  function hatchAllReadyEggs() {
    let hatchedCount = 0;
    let lastName: string | null = null;

    for (const eggId of readyEggIds) {
      const hatched = hatchEgg(eggId);
      if (hatched) {
        hatchedCount += 1;
        lastName = hatched.nickname;
      }
    }

    setLastBatchCount(hatchedCount);
    setLastHatchedName(lastName);
  }

  const entries = useMemo<HatcheryEggEntry[]>(() => {
    return eggs.map((egg) => {
      const giverCreature =
        egg.giverId !== null
          ? creatures.find((c) => c.id === egg.giverId) ?? null
          : null;
      const receiverCreature =
        egg.receiverId !== null
          ? creatures.find((c) => c.id === egg.receiverId) ?? null
          : null;

      const canReloadParents =
        egg.giverIsPlayer ||
        egg.receiverIsPlayer ||
        giverCreature !== null ||
        receiverCreature !== null;

      return {
        id: egg.id,
        name: egg.name,
        parents: egg.parents,
        giver: egg.giver,
        receiver: egg.receiver,
        hatchDaysRemaining: egg.hatchDaysRemaining,
        inbreedingRisk: egg.inbreedingRisk ?? "none",
        quality: egg.quality ?? "normal",
        readyToHatch: egg.hatchDaysRemaining <= 0,
        canReloadParents,
        onHatch: () => {
          const hatched = hatchEgg(egg.id);
          if (hatched) {
            setLastHatchedName(hatched.nickname);
            setLastBatchCount(1);
          }
        },
        onReloadParents: () => {
          if (!canReloadParents) return;

          setBreedingSelection({
            giverType: egg.giverIsPlayer ? "player" : "creature",
            giverCreatureId: egg.giverIsPlayer ? null : egg.giverId,
            receiverType: egg.receiverIsPlayer ? "player" : "creature",
            receiverCreatureId: egg.receiverIsPlayer ? null : egg.receiverId,
          });

          router.push("/breeding");
        },
      };
    });
  }, [eggs, hatchEgg, creatures, router, setBreedingSelection]);

  const filteredEntries = useMemo(() => {
    const lowered = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "ready"
          ? entry.readyToHatch
          : entry.inbreedingRisk !== "none";

      const matchesSearch =
        lowered.length === 0 ||
        entry.name.toLowerCase().includes(lowered) ||
        entry.parents.toLowerCase().includes(lowered) ||
        entry.giver.toLowerCase().includes(lowered) ||
        entry.receiver.toLowerCase().includes(lowered);

      return matchesFilter && matchesSearch;
    });
  }, [entries, filter, search]);

  const summary = useMemo(() => {
    const readyCount = entries.filter((entry) => entry.readyToHatch).length;
    const riskCount = entries.filter((entry) => entry.inbreedingRisk !== "none").length;
    return {
      totalEggs: entries.length,
      readyCount,
      riskCount,
      totalCreatures: creatures.length,
    };
  }, [entries, creatures.length]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-100 to-rose-200 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-rose-900 md:text-4xl">
              🥚 Hatchery
            </h1>
            <p className="mt-1 text-sm text-stone-700">
              Manage eggs, check timers, hatch any eggs that are ready, or jump back into breeding with the original parents loaded.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/breeding"
              className="rounded-2xl bg-rose-700 px-4 py-3 text-sm font-semibold text-white shadow"
            >
              Back to Breeding
            </Link>
            <Link
              href="/breeding/history"
              className="rounded-2xl border border-rose-300 bg-white px-4 py-3 text-sm font-semibold text-rose-900 shadow"
            >
              View History
            </Link>
          </div>
        </div>

        {lastHatchedName && (
          <div className="mb-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 shadow">
            {lastBatchCount > 1 ? (
              <>
                <strong>Batch Hatched:</strong> {lastBatchCount} eggs. Most recent offspring: {lastHatchedName}
              </>
            ) : (
              <>
                <strong>Hatched:</strong> {lastHatchedName}
              </>
            )}
          </div>
        )}

        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-4 text-sm text-stone-800 shadow">
            <p><strong>Total Eggs:</strong> {summary.totalEggs}</p>
          </div>
          <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-4 text-sm text-stone-800 shadow">
            <p><strong>Ready to Hatch:</strong> {summary.readyCount}</p>
          </div>
          <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-4 text-sm text-stone-800 shadow">
            <p><strong>Risk Eggs:</strong> {summary.riskCount}</p>
          </div>
          <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-4 text-sm text-stone-800 shadow">
            <p><strong>Total Creatures:</strong> {summary.totalCreatures}</p>
          </div>
        </div>

        <div className="mb-4 rounded-3xl border-4 border-rose-900 bg-white/85 p-4 shadow-xl">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search eggs, parents, or species..."
                className="w-full rounded-2xl border border-rose-300 bg-white px-4 py-3 text-sm text-stone-800 md:max-w-md"
              />

              <div className="flex flex-wrap gap-2">
                {(["all", "ready", "risk"] as HatcheryFilter[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      filter === value
                        ? "border-rose-700 bg-rose-700 text-white"
                        : "border-rose-300 bg-white text-stone-700 hover:border-rose-400"
                    }`}
                  >
                    {value === "all" ? "All" : value === "ready" ? "Ready" : "Risk Only"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-stone-700">
                {summary.readyCount > 0
                  ? `${summary.readyCount} egg(s) are ready to hatch.`
                  : "No eggs are ready right now."}
              </p>

              <button
                type="button"
                onClick={hatchAllReadyEggs}
                disabled={summary.readyCount === 0}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold shadow ${
                  summary.readyCount > 0
                    ? "bg-rose-700 text-white"
                    : "bg-stone-200 text-stone-500"
                }`}
              >
                Hatch All Ready
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="rounded-3xl border-4 border-rose-900 bg-white/85 p-6 text-center shadow-xl">
              <p className="text-lg font-semibold text-stone-900">No eggs match your current filters.</p>
              <p className="mt-2 text-sm text-stone-600">
                Breed creatures to create eggs, or change your hatchery filters.
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <HatcheryEggCard key={entry.id} egg={entry} />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
