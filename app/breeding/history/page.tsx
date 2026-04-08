"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import {
  BreedingHistoryCard,
  BreedingHistoryEntry,
} from "@/components/breeding/BreedingHistoryCard";
import {
  BreedingHistoryFilter,
  BreedingHistoryFilters,
} from "@/components/breeding/BreedingHistoryFilters";

type HistoryRisk = "none" | "half_sibling" | "full_sibling" | "parent_child";

function formatRiskLabel(risk: HistoryRisk) {
  if (risk === "parent_child") return "Parent / Child";
  if (risk === "full_sibling") return "Full Sibling";
  if (risk === "half_sibling") return "Half Sibling";
  return "No Risk";
}

export default function BreedingHistoryPage() {
  const router = useRouter();
  const { eggs, creatures, setBreedingSelection } = useGame();

  const [filter, setFilter] = useState<BreedingHistoryFilter>("all");
  const [search, setSearch] = useState("");

  const entries = useMemo<BreedingHistoryEntry[]>(() => {
    const eggEntries: BreedingHistoryEntry[] = eggs.map((egg) => {
      const giverCreature =
        egg.giverId !== null
          ? creatures.find((c) => c.id === egg.giverId) ?? null
          : null;
      const receiverCreature =
        egg.receiverId !== null
          ? creatures.find((c) => c.id === egg.receiverId) ?? null
          : null;

      return {
        id: `egg-${egg.id}`,
        status: "egg",
        title: egg.name,
        subtitle: egg.parents,
        giverLabel: egg.giverIsPlayer
          ? "Player"
          : giverCreature?.nickname ?? egg.giver,
        receiverLabel: egg.receiverIsPlayer
          ? "Player"
          : receiverCreature?.nickname ?? egg.receiver,
        parentSummary: egg.parents,
        speciesLabel: `${egg.giver} × ${egg.receiver}`,
        dayLabel: "Egg currently in hatchery",
        hatchLabel:
          egg.hatchDaysRemaining > 0
            ? `${egg.hatchDaysRemaining} day(s) until hatch`
            : "Ready to hatch",
        quality: egg.quality ?? "normal",
        risk: egg.inbreedingRisk ?? "none",
        canReload:
          egg.giverIsPlayer ||
          egg.receiverIsPlayer ||
          giverCreature !== null ||
          receiverCreature !== null,
        onReload: () => {
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

    const hatchedEntries: BreedingHistoryEntry[] = creatures
      .filter((creature) => creature.giver || creature.receiver)
      .map((creature) => {
        const giverCreature =
          creature.giverId !== null
            ? creatures.find((c) => c.id === creature.giverId) ?? null
            : null;
        const receiverCreature =
          creature.receiverId !== null
            ? creatures.find((c) => c.id === creature.receiverId) ?? null
            : null;

        return {
          id: `creature-${creature.id}`,
          status: "hatched",
          title: creature.nickname,
          subtitle: `${creature.name} • Generation ${creature.generation}`,
          giverLabel: creature.giverIsPlayer
            ? "Player"
            : giverCreature?.nickname ?? creature.giver ?? "Unknown",
          receiverLabel: creature.receiverIsPlayer
            ? "Player"
            : receiverCreature?.nickname ?? creature.receiver ?? "Unknown",
          parentSummary: `${creature.giver ?? "Unknown"} + ${creature.receiver ?? "Unknown"}`,
          speciesLabel: creature.name,
          dayLabel: `Born on Day ${creature.bornOnDay}`,
          hatchLabel:
            creature.inbredTrait !== "none"
              ? `Inbred Trait: ${creature.inbredTrait} (${creature.inbredTraitSeverity})`
              : null,
          quality: null,
          risk: creature.inbreedingRisk ?? "none",
          canReload:
            creature.giverIsPlayer ||
            creature.receiverIsPlayer ||
            giverCreature !== null ||
            receiverCreature !== null,
          onReload: () => {
            setBreedingSelection({
              giverType: creature.giverIsPlayer ? "player" : "creature",
              giverCreatureId: creature.giverIsPlayer ? null : creature.giverId,
              receiverType: creature.receiverIsPlayer ? "player" : "creature",
              receiverCreatureId: creature.receiverIsPlayer ? null : creature.receiverId,
            });
            router.push("/breeding");
          },
        };
      });

    return [...eggEntries, ...hatchedEntries].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "egg" ? -1 : 1;
      }
      return a.title.localeCompare(b.title);
    });
  }, [eggs, creatures, router, setBreedingSelection]);

  const filteredEntries = useMemo(() => {
    const lowered = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "eggs"
          ? entry.status === "egg"
          : filter === "hatched"
          ? entry.status === "hatched"
          : entry.risk !== "none";

      const matchesSearch =
        lowered.length === 0 ||
        entry.title.toLowerCase().includes(lowered) ||
        entry.subtitle.toLowerCase().includes(lowered) ||
        entry.giverLabel.toLowerCase().includes(lowered) ||
        entry.receiverLabel.toLowerCase().includes(lowered) ||
        entry.parentSummary.toLowerCase().includes(lowered) ||
        entry.speciesLabel.toLowerCase().includes(lowered) ||
        formatRiskLabel(entry.risk).toLowerCase().includes(lowered);

      return matchesFilter && matchesSearch;
    });
  }, [entries, filter, search]);

  const summary = useMemo(() => {
    const eggCount = entries.filter((entry) => entry.status === "egg").length;
    const hatchedCount = entries.filter((entry) => entry.status === "hatched").length;
    const riskCount = entries.filter((entry) => entry.risk !== "none").length;

    return { eggCount, hatchedCount, riskCount };
  }, [entries]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-100 to-rose-200 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-rose-900 md:text-4xl">
              📜 Breeding History
            </h1>
            <p className="mt-1 text-sm text-stone-700">
              Review eggs, hatched offspring, family-risk pairings, and reload old pairs into the breeding screen.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/breeding"
              className="rounded-2xl bg-rose-700 px-4 py-3 text-sm font-semibold text-white shadow"
            >
              Back to Breeding
            </Link>
            <Link
              href="/breeding/hatchery"
              className="rounded-2xl border border-rose-300 bg-white px-4 py-3 text-sm font-semibold text-rose-900 shadow"
            >
              View Hatchery
            </Link>
            <Link
              href="/ranch"
              className="rounded-2xl bg-stone-800 px-4 py-3 text-sm font-semibold text-white shadow"
            >
              Back to Ranch
            </Link>
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-4 text-sm text-stone-800 shadow">
            <p><strong>Eggs in Hatchery:</strong> {summary.eggCount}</p>
          </div>
          <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-4 text-sm text-stone-800 shadow">
            <p><strong>Recorded Offspring:</strong> {summary.hatchedCount}</p>
          </div>
          <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-4 text-sm text-stone-800 shadow">
            <p><strong>Risk Pairings:</strong> {summary.riskCount}</p>
          </div>
        </div>

        <div className="mb-4">
          <BreedingHistoryFilters
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
          />
        </div>

        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="rounded-3xl border-4 border-rose-900 bg-white/85 p-6 text-center shadow-xl">
              <p className="text-lg font-semibold text-stone-900">No matching breeding records found.</p>
              <p className="mt-2 text-sm text-stone-600">
                Breed creatures, hatch eggs, or change your filters to see more.
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <BreedingHistoryCard key={entry.id} entry={entry} />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
