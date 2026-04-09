"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import RanchPlannerPanel from "@/components/ranch/RanchPlannerPanel";

type InbreedingRisk =
  | "none"
  | "half_sibling"
  | "parent_child"
  | "full_sibling";

type InbredTraitSeverity = "none" | "mild" | "severe";
type InbredTrait = "none" | "weak" | "frail" | "dull" | "slow";

type CreatureTrait =
  | "domestic"
  | "industrious"
  | "calm"
  | "fertile"
  | "quick"
  | "sturdy"
  | "affectionate"
  | "keen"
  | "barnwise"
  | "surefooted"
  | "night_prawler"
  | "graceful";

type TraitGrade = "F" | "D" | "C" | "B" | "A" | "S";

type CreatureTraitEntry = {
  trait: CreatureTrait;
  grade: TraitGrade;
};

type SortOption =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "generation_desc"
  | "strength_desc"
  | "endurance_desc"
  | "intelligence_desc"
  | "speed_desc";

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
  if (severity === "none") return "bg-stone-100 text-stone-700 border-stone-300";
  if (severity === "mild") return "bg-amber-100 text-amber-900 border-amber-300";
  return "bg-red-100 text-red-900 border-red-300";
}

function getCreatureTraitLabel(trait: CreatureTrait) {
  if (trait === "domestic") return "Domestic";
  if (trait === "industrious") return "Industrious";
  if (trait === "calm") return "Calm";
  if (trait === "fertile") return "Fertile";
  if (trait === "quick") return "Quick";
  if (trait === "sturdy") return "Sturdy";
  if (trait === "affectionate") return "Affectionate";
  if (trait === "keen") return "Keen";
  if (trait === "barnwise") return "Barnwise";
  if (trait === "surefooted") return "Surefooted";
  if (trait === "night_prawler") return "Night Prawler";
  return "Graceful";
}

function getCreatureTraitClasses(trait: CreatureTrait) {
  if (trait === "domestic") return "bg-pink-100 text-pink-900 border-pink-300";
  if (trait === "industrious") return "bg-amber-100 text-amber-900 border-amber-300";
  if (trait === "calm") return "bg-sky-100 text-sky-900 border-sky-300";
  if (trait === "fertile") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  if (trait === "quick") return "bg-violet-100 text-violet-900 border-violet-300";
  if (trait === "sturdy") return "bg-stone-200 text-stone-900 border-stone-400";
  if (trait === "affectionate") return "bg-rose-100 text-rose-900 border-rose-300";
  if (trait === "keen") return "bg-cyan-100 text-cyan-900 border-cyan-300";
  if (trait === "barnwise") return "bg-orange-100 text-orange-900 border-orange-300";
  if (trait === "surefooted") return "bg-yellow-100 text-yellow-900 border-yellow-300";
  if (trait === "night_prawler") return "bg-indigo-100 text-indigo-900 border-indigo-300";
  return "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300";
}

function getGradeClasses(grade: TraitGrade) {
  if (grade === "F") return "bg-stone-100 text-stone-700 border-stone-300";
  if (grade === "D") return "bg-slate-100 text-slate-800 border-slate-300";
  if (grade === "C") return "bg-blue-100 text-blue-900 border-blue-300";
  if (grade === "B") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  if (grade === "A") return "bg-amber-100 text-amber-900 border-amber-300";
  return "bg-rose-100 text-rose-900 border-rose-300";
}

function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${suffix}`;
}

export default function RanchPage() {
  const router = useRouter();

  const {
    currentDay,
    currentHour,
    currentMinute,
    currentLocation,
    playerData,
    homeState,
    nextDay,
    resetGame,
    renamePlayer,
    creatures,
    travelTo,
  } = useGame();

  const [playerNameInput, setPlayerNameInput] = useState(playerData.name);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [traitFilter, setTraitFilter] = useState("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  function handleSavePlayerName() {
    renamePlayer(playerNameInput);
  }

  function handleTravelToTown() {
    travelTo("town");
    router.push("/town");
  }

  function handleTravelToHome() {
    travelTo("home");
    router.push("/home");
  }

  const registryCreatures = useMemo(() => {
    return creatures.filter(
      (creature) => creature.giver !== null || creature.receiver !== null
    );
  }, [creatures]);

  const speciesOptions = useMemo(() => {
    return Array.from(new Set(registryCreatures.map((c) => c.name))).sort();
  }, [registryCreatures]);

  const filteredRegistry = useMemo(() => {
    const loweredSearch = searchText.trim().toLowerCase();

    const filtered = registryCreatures.filter((creature) => {
      const creatureTraits: CreatureTraitEntry[] = Array.isArray(creature.traits)
        ? creature.traits
        : [];

      const matchesSearch =
        loweredSearch.length === 0 ||
        creature.nickname.toLowerCase().includes(loweredSearch) ||
        creature.name.toLowerCase().includes(loweredSearch) ||
        `${creature.giver ?? ""} ${creature.receiver ?? ""}`
          .toLowerCase()
          .includes(loweredSearch) ||
        creatureTraits.some((entry) =>
          entry.trait.toLowerCase().includes(loweredSearch)
        );

      const matchesSpecies =
        speciesFilter === "all" || creature.name === speciesFilter;

      const matchesRisk =
        riskFilter === "all" || creature.inbreedingRisk === riskFilter;

      const matchesTrait =
        traitFilter === "all" ||
        creatureTraits.some((entry) => entry.trait === traitFilter);

      return matchesSearch && matchesSpecies && matchesRisk && matchesTrait;
    });

    filtered.sort((a, b) => {
      if (sortOption === "newest") {
        if (b.bornOnDay !== a.bornOnDay) return b.bornOnDay - a.bornOnDay;
        return b.id - a.id;
      }

      if (sortOption === "oldest") {
        if (a.bornOnDay !== b.bornOnDay) return a.bornOnDay - b.bornOnDay;
        return a.id - b.id;
      }

      if (sortOption === "name_asc") return a.nickname.localeCompare(b.nickname);
      if (sortOption === "name_desc") return b.nickname.localeCompare(a.nickname);

      if (sortOption === "generation_desc") {
        if (b.generation !== a.generation) return b.generation - a.generation;
        return b.id - a.id;
      }

      if (sortOption === "strength_desc") {
        if (b.stats.strength !== a.stats.strength) return b.stats.strength - a.stats.strength;
        return b.id - a.id;
      }

      if (sortOption === "endurance_desc") {
        if (b.stats.endurance !== a.stats.endurance) return b.stats.endurance - a.stats.endurance;
        return b.id - a.id;
      }

      if (sortOption === "intelligence_desc") {
        if (b.stats.intelligence !== a.stats.intelligence) return b.stats.intelligence - a.stats.intelligence;
        return b.id - a.id;
      }

      if (sortOption === "speed_desc") {
        if (b.stats.speed !== a.stats.speed) return b.stats.speed - a.stats.speed;
        return b.id - a.id;
      }

      return 0;
    });

    return filtered;
  }, [
    registryCreatures,
    searchText,
    speciesFilter,
    riskFilter,
    traitFilter,
    sortOption,
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-100 to-lime-200 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-4xl font-bold text-green-900">🌿 Ranch</h1>

        <div className="rounded-3xl border-4 border-green-900 bg-white/85 p-6 shadow-xl">
          <div className="grid gap-3 text-lg text-stone-800 sm:grid-cols-2 lg:grid-cols-4">
            <p><strong>Day:</strong> {currentDay}</p>
            <p><strong>Time:</strong> {formatTime(currentHour, currentMinute)}</p>
            <p><strong>Location:</strong> {currentLocation}</p>
            <p><strong>Player:</strong> {playerData.name}</p>
            <p><strong>Player Level:</strong> {playerData.level}</p>
            <p><strong>Player XP:</strong> {playerData.xp}/{playerData.xpToNextLevel}</p>
            <p><strong>Gold:</strong> {playerData.gold}</p>
            <p><strong>Energy:</strong> {playerData.energy}</p>
            <p><strong>Total Creatures:</strong> {creatures.length}</p>
            <p><strong>Home Cleanliness:</strong> {homeState.cleanliness}/100</p>
            <p><strong>Food Stock:</strong> {homeState.foodStock}</p>
            <p><strong>Wheat Stock:</strong> {homeState.wheatStock}</p>
          </div>

          <div className="mt-6 rounded-2xl bg-green-50 p-4">
            <p className="mb-2 font-semibold text-green-950">Rename Player</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={playerNameInput}
                onChange={(e) => setPlayerNameInput(e.target.value)}
                className="w-full rounded-xl border border-green-300 bg-white px-3 py-2"
                placeholder="Enter player name"
              />
              <button
                onClick={handleSavePlayerName}
                className="rounded-xl bg-green-700 px-4 py-2 text-white font-semibold"
              >
                Save Name
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => setPlannerOpen(true)}
              className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-white font-semibold shadow"
            >
              Open Ranch Planner
            </button>

            <button
              onClick={() => setRegistryOpen(true)}
              className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-white font-semibold shadow"
            >
              Open Birth Registry
            </button>

            <button
              onClick={handleTravelToHome}
              className="w-full rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
            >
              Travel to Home
            </button>

            <button
              onClick={handleTravelToTown}
              className="w-full rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
            >
              Travel to Town (30m)
            </button>

            <button
              onClick={nextDay}
              className="w-full rounded-2xl bg-orange-600 px-4 py-3 text-white font-semibold shadow"
            >
              Next Day
            </button>

            <button
              onClick={resetGame}
              className="w-full rounded-2xl bg-red-700 px-4 py-3 text-white font-semibold shadow sm:col-span-2 lg:col-span-1"
            >
              Reset Save
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/creatures"
            className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
          >
            View Creatures
          </Link>
          <Link
            href="/breeding"
            className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
          >
            Go to Breeding
          </Link>
          <Link
            href="/eggs"
            className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
          >
            View Eggs
          </Link>
        </div>
      </div>

      {plannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border-4 border-emerald-900 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-200 px-5 py-4">
              <div>
                <h2 className="text-3xl font-bold text-emerald-950">Ranch Planner</h2>
                <p className="text-sm text-stone-600">
                  Program the full day, review projected stamina costs, and protect breeding availability.
                </p>
              </div>

              <button
                onClick={() => setPlannerOpen(false)}
                className="rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
              >
                Close Planner
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <RanchPlannerPanel
                creatures={creatures}
                currentDay={currentDay}
                cleanliness={homeState.cleanliness}
                foodStock={homeState.foodStock}
                onAdvanceDay={nextDay}
              />
            </div>
          </div>
        </div>
      )}

      {registryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-3xl border-4 border-emerald-900 bg-white shadow-2xl">
            <div className="border-b border-emerald-200 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-emerald-900">
                    📜 Full Birth Registry
                  </h2>
                  <p className="text-stone-600">
                    Browse all hatched creatures with filters and sorting.
                  </p>
                </div>

                <button
                  onClick={() => setRegistryOpen(false)}
                  className="rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
                >
                  Close Registry
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-2"
                  placeholder="Search by name, species, lineage, or trait"
                />

                <select
                  value={speciesFilter}
                  onChange={(e) => setSpeciesFilter(e.target.value)}
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-2"
                >
                  <option value="all">All Species</option>
                  {speciesOptions.map((species) => (
                    <option key={species} value={species}>
                      {species}
                    </option>
                  ))}
                </select>

                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-2"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="none">No Risk</option>
                  <option value="half_sibling">Half Sibling Risk</option>
                  <option value="parent_child">Parent/Child Risk</option>
                  <option value="full_sibling">Full Sibling Risk</option>
                </select>

                <select
                  value={traitFilter}
                  onChange={(e) => setTraitFilter(e.target.value)}
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-2"
                >
                  <option value="all">All Positive Traits</option>
                  <option value="domestic">Domestic</option>
                  <option value="industrious">Industrious</option>
                  <option value="calm">Calm</option>
                  <option value="fertile">Fertile</option>
                  <option value="quick">Quick</option>
                  <option value="sturdy">Sturdy</option>
                  <option value="affectionate">Affectionate</option>
                  <option value="keen">Keen</option>
                  <option value="barnwise">Barnwise</option>
                  <option value="surefooted">Surefooted</option>
                  <option value="night_prawler">Night Prawler</option>
                  <option value="graceful">Graceful</option>
                </select>

                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-2"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name_asc">Name A–Z</option>
                  <option value="name_desc">Name Z–A</option>
                  <option value="generation_desc">Highest Generation</option>
                  <option value="strength_desc">Highest Strength</option>
                  <option value="endurance_desc">Highest Endurance</option>
                  <option value="intelligence_desc">Highest Intelligence</option>
                  <option value="speed_desc">Highest Speed</option>
                </select>
              </div>

              <div className="mt-3 text-sm text-stone-600">
                Showing {filteredRegistry.length} of {registryCreatures.length} recorded births
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {filteredRegistry.length === 0 ? (
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-stone-700">
                    No births match your current filters.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredRegistry.map((creature) => {
                    const creatureTraits: CreatureTraitEntry[] = Array.isArray(creature.traits)
                      ? creature.traits
                      : [];

                    return (
                      <div
                        key={creature.id}
                        className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-bold text-stone-900">
                              {creature.nickname}
                            </h3>
                            <p className="text-stone-700">
                              {creature.name} • Lv {creature.level} • Gen {creature.generation}
                            </p>
                            <p className="text-sm text-stone-500">
                              Born Day {creature.bornOnDay}
                            </p>
                          </div>

                          <div className="text-right text-sm text-stone-500">
                            ID {creature.id}
                          </div>
                        </div>

                        <div className="mb-3 rounded-2xl bg-white/80 p-3">
                          <p className="text-sm text-stone-500">Lineage</p>
                          <p className="font-semibold text-stone-900">
                            {creature.giver} → {creature.receiver}
                          </p>
                          <p className="text-sm text-stone-600">
                            Parent IDs: {creature.giverId ?? "Player"} / {creature.receiverId ?? "Player"}
                          </p>
                        </div>

                        <div className="mb-3 flex flex-wrap gap-2">
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

                        <div className="mb-3 rounded-2xl bg-white/80 p-3">
                          <p className="mb-2 text-sm text-stone-500">Positive Traits</p>

                          {creatureTraits.length === 0 ? (
                            <p className="font-semibold text-stone-700">No Traits</p>
                          ) : (
                            <div className="space-y-2">
                              {creatureTraits.map((entry, index) => (
                                <div
                                  key={`${creature.id}-${entry.trait}-${entry.grade}-${index}`}
                                  className="flex flex-wrap items-center gap-2"
                                >
                                  <div
                                    className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getCreatureTraitClasses(
                                      entry.trait
                                    )}`}
                                  >
                                    {getCreatureTraitLabel(entry.trait)}
                                  </div>

                                  <div
                                    className={`inline-block rounded-full border px-2 py-1 text-xs font-semibold ${getGradeClasses(
                                      entry.grade
                                    )}`}
                                  >
                                    {entry.grade}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mb-3 grid gap-2 text-sm text-stone-800 sm:grid-cols-2">
                          <p><strong>STR:</strong> {creature.stats.strength}</p>
                          <p><strong>END:</strong> {creature.stats.endurance}</p>
                          <p><strong>INT:</strong> {creature.stats.intelligence}</p>
                          <p><strong>SPD:</strong> {creature.stats.speed}</p>
                          <p><strong>FER:</strong> {creature.stats.fertility}</p>
                          <p><strong>VIT:</strong> {creature.stats.vitality}</p>
                        </div>

                        <div className="grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
                          <p><strong>XP:</strong> {creature.xp}/{creature.xpToNextLevel}</p>
                          <p><strong>Stamina:</strong> {creature.breedingStamina}/{creature.maxBreedingStamina}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
