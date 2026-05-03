"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import {
  CreatureTraitBadgeRow,
  CreatureTraitEntry,
  getCreatureGradeClasses,
  getCreatureTraitClasses,
} from "@/components/creatures/CreatureTraitUi";
import {
  GameCard,
  GameActionResultCard,
  GameEmptyState,
  GameModal,
  GameStatCard,
  GameStatChip,
  GameStatusBadge,
} from "@/components/ui/GameUi";
import { getCreatureImage } from "@/lib/breeding/uiHelpers";
import {
  getCreatureBestUseSections,
  getCreatureRoleSummary,
  getCreatureSkillEntries,
  getCreatureStatEntries,
  getCreatureStrengthBadges,
  getCreatureTraitEntries,
} from "@/lib/creatures/creatureDisplay";

type InbreedingRisk =
  | "none"
  | "half_sibling"
  | "parent_child"
  | "full_sibling";

type InbredTrait = "none" | "weak" | "frail" | "dull" | "slow";
type InbredTraitSeverity = "none" | "mild" | "severe";

type SortOption =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "level_desc"
  | "generation_desc"
  | "happiness_desc";

function getRiskLabel(risk: InbreedingRisk) {
  if (risk === "parent_child") return "Parent/Child Risk";
  if (risk === "full_sibling") return "Full Sibling Risk";
  if (risk === "half_sibling") return "Half Sibling Risk";
  return "No Risk";
}

function getRiskTone(risk: InbreedingRisk): "emerald" | "amber" | "rose" {
  if (risk === "none") return "emerald";
  if (risk === "half_sibling") return "amber";
  return "rose";
}

function getInbredTraitLabel(
  trait: InbredTrait,
  severity: InbredTraitSeverity
) {
  if (trait === "none" || severity === "none") return "No Inbred Trait";

  const traitName =
    trait === "weak"
      ? "Weakness"
      : trait === "frail"
        ? "Frailty"
        : trait === "dull"
          ? "Dullness"
          : "Slowness";

  return `${severity === "mild" ? "Mild" : "Severe"} ${traitName}`;
}

function getInbredTraitTone(severity: InbredTraitSeverity): "stone" | "amber" | "rose" {
  if (severity === "none") return "stone";
  if (severity === "mild") return "amber";
  return "rose";
}

function getMoodLabel(happiness: number) {
  if (happiness >= 85) return "Thriving";
  if (happiness >= 65) return "Content";
  if (happiness >= 40) return "Restless";
  return "Needs Care";
}

function CreatureDetailModal({
  open,
  creature,
  onClose,
  editingCreatureId,
  nicknameInput,
  setNicknameInput,
  startEditing,
  saveNickname,
  cancelEditing,
  recentResults,
}: {
  open: boolean;
  creature: any | null;
  onClose: () => void;
  editingCreatureId: number | null;
  nicknameInput: string;
  setNicknameInput: (value: string) => void;
  startEditing: (creatureId: number, currentNickname: string) => void;
  saveNickname: (creatureId: number) => void;
  cancelEditing: () => void;
  recentResults: any[];
}) {
  if (!open || !creature) return null;

  const isEditing = editingCreatureId === creature.id;
  const traits: CreatureTraitEntry[] = Array.isArray(creature.traits)
    ? creature.traits
    : [];
  const roleSummary = getCreatureRoleSummary(creature);
  const strengthBadges = getCreatureStrengthBadges(creature);
  const statEntries = getCreatureStatEntries(creature);
  const skillEntries = getCreatureSkillEntries(creature);
  const traitEntries = getCreatureTraitEntries(creature);
  const bestUses = getCreatureBestUseSections(creature);

  return (
    <GameModal
      open={open}
      onClose={onClose}
      title={`${creature.nickname} - Creature Details`}
      maxWidth="max-w-6xl"
      borderClassName="border-sky-900"
      titleClassName="text-sky-950"
    >
      <div className="space-y-5">
        <GameCard tone="sky" className="shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row">
            <div className="flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl bg-white md:w-72">
              <Image
                src={getCreatureImage(creature.name)}
                alt={creature.name}
                width={320}
                height={320}
                className="max-h-full w-auto object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(event) => setNicknameInput(event.target.value)}
                    className="min-h-11 w-full rounded-xl border border-sky-300 bg-white px-3 py-2"
                    placeholder="Enter nickname"
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => saveNickname(creature.id)}
                      className="min-h-11 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="min-h-11 rounded-xl bg-stone-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold uppercase text-sky-800">Summary</p>
                  <h3 className="mt-1 text-3xl font-bold text-sky-950">
                    {creature.nickname}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-stone-700">
                    {creature.name} - {creature.theme}
                  </p>
                  <p className="mt-2 text-sm text-stone-700">
                    Best use: <strong>{roleSummary}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => startEditing(creature.id, creature.nickname)}
                    className="mt-3 min-h-11 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Edit Name
                  </button>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <GameStatusBadge tone={getRiskTone(creature.inbreedingRisk)}>
                  {getRiskLabel(creature.inbreedingRisk)}
                </GameStatusBadge>
                <GameStatusBadge tone={getInbredTraitTone(creature.inbredTraitSeverity)}>
                  {getInbredTraitLabel(creature.inbredTrait, creature.inbredTraitSeverity)}
                </GameStatusBadge>
                <GameStatusBadge tone="emerald">
                  {getMoodLabel(creature.happiness)}
                </GameStatusBadge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {strengthBadges.length > 0 ? (
                  strengthBadges.map((badge) => (
                    <GameStatChip key={badge} label="Strength" value={badge} />
                  ))
                ) : (
                  <GameStatChip label="Strength" value="General Helper" />
                )}
              </div>
            </div>
          </div>
        </GameCard>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <GameStatCard label="Level" value={creature.level} accentClasses="border-sky-200 bg-sky-50 text-sky-900" />
          <GameStatCard label="XP" value={`${creature.xp}/${creature.xpToNextLevel}`} accentClasses="border-stone-200 bg-stone-50 text-stone-700" />
          <GameStatCard label="Stamina" value={`${creature.breedingStamina}/${creature.maxBreedingStamina}`} accentClasses="border-emerald-200 bg-emerald-50 text-emerald-900" />
          <GameStatCard label="Generation" value={`Gen ${creature.generation}`} accentClasses="border-amber-200 bg-amber-50 text-amber-900" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <GameCard tone="stone" className="shadow-sm">
            <p className="text-lg font-bold text-stone-950">Stats</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {statEntries.map((stat) => (
                <div key={stat.key} className="rounded-xl border border-stone-200 bg-white p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-stone-950">
                      {stat.label}: {stat.value}
                    </p>
                    <GameStatusBadge tone={stat.futureHook ? "amber" : "stone"}>
                      {stat.futureHook ? "Future Hook" : stat.category}
                    </GameStatusBadge>
                  </div>
                  <p className="mt-2 text-stone-700">{stat.shortEffect}</p>
                  <p className="mt-2 text-xs font-semibold text-stone-500">
                    Applies: {stat.appliesTo.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </GameCard>

          <GameCard tone="emerald" className="shadow-sm">
            <p className="text-lg font-bold text-stone-950">Best Uses</p>
            <div className="mt-3 grid gap-2">
              {bestUses.map((use) => (
                <div key={use.label} className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm">
                  <p className="font-bold text-stone-950">{use.label}</p>
                  <p className="mt-1 text-stone-700">{use.summary}</p>
                </div>
              ))}
            </div>
          </GameCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <GameCard tone="sky" className="shadow-sm">
            <p className="text-lg font-bold text-stone-950">Abilities & Traits</p>
            <div className="mt-3 grid gap-3">
              {traitEntries.length > 0 ? (
                traitEntries.map((entry, index) => (
                  <div key={`${entry.trait}-${entry.grade}-${index}`} className="rounded-xl border border-sky-100 bg-white p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getCreatureTraitClasses(entry.trait as any)}`}>
                        {entry.label}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getCreatureGradeClasses(entry.grade as any)}`}>
                        Grade {entry.grade}
                      </span>
                      <GameStatusBadge tone={entry.futureHook ? "amber" : "sky"}>
                        {entry.futureHook ? "Future Hook" : entry.category}
                      </GameStatusBadge>
                    </div>
                    <p className="mt-2 text-stone-700">{entry.shortEffect}</p>
                    <p className="mt-2 text-xs font-semibold text-stone-500">
                      Applies: {entry.appliesTo.join(", ")}
                    </p>
                  </div>
                ))
              ) : (
                <GameEmptyState>No mapped traits yet.</GameEmptyState>
              )}
            </div>
          </GameCard>

          <GameCard tone="amber" className="shadow-sm">
            <p className="text-lg font-bold text-stone-950">Skills</p>
            <div className="mt-3 grid gap-3">
              {skillEntries.map((skill) => (
                <div key={skill.key} className="rounded-xl border border-amber-100 bg-white p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-stone-950">
                      {skill.label} Lv {skill.level}
                    </p>
                    <GameStatusBadge tone="amber">{skill.category}</GameStatusBadge>
                  </div>
                  <p className="mt-2 text-stone-700">{skill.shortEffect}</p>
                  <p className="mt-2 text-xs font-semibold text-stone-500">
                    Applies: {skill.appliesTo.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </GameCard>
        </section>

        <GameCard tone="stone" className="shadow-sm">
          <p className="text-lg font-bold text-stone-950">Lineage & Current Status</p>
          <div className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
            <p><strong>Parents:</strong> {creature.giver && creature.receiver ? `${creature.giver} x ${creature.receiver}` : "Starter creature"}</p>
            <p><strong>Parent IDs:</strong> {creature.giverId ?? "Player/Unknown"} / {creature.receiverId ?? "Player/Unknown"}</p>
            <p><strong>Born:</strong> Day {creature.bornOnDay}</p>
            <p><strong>Breedings Today:</strong> {creature.breedingsToday}/{creature.dailyBreedingLimit}</p>
          </div>
        </GameCard>

        <GameCard tone="amber" className="shadow-sm">
          <p className="text-lg font-bold text-stone-950">Recent Results</p>
          <div className="mt-3 grid gap-3">
            {recentResults.length > 0 ? (
              recentResults.map((result) => (
                <GameActionResultCard key={result.id} result={result} compact />
              ))
            ) : (
              <GameEmptyState>No recent logged actions for this creature yet.</GameEmptyState>
            )}
          </div>
        </GameCard>
      </div>
    </GameModal>
  );
}

export default function CreaturesPage() {
  const { creatures, renameCreature, getRecentCreatureResults, latestActionResult } = useGame();
  const [editingCreatureId, setEditingCreatureId] = useState<number | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [selectedCreatureId, setSelectedCreatureId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  const selectedCreature =
    creatures.find((creature) => creature.id === selectedCreatureId) ?? null;

  function startEditing(creatureId: number, currentNickname: string) {
    setEditingCreatureId(creatureId);
    setNicknameInput(currentNickname);
  }

  function saveNickname(creatureId: number) {
    renameCreature(creatureId, nicknameInput);
    setEditingCreatureId(null);
    setNicknameInput("");
  }

  function cancelEditing() {
    setEditingCreatureId(null);
    setNicknameInput("");
  }

  const filteredCreatures = useMemo(() => {
    const lowered = searchText.trim().toLowerCase();
    const filtered = creatures.filter((creature) => {
      const roleSummary = getCreatureRoleSummary(creature).toLowerCase();
      return (
        lowered.length === 0 ||
        creature.nickname.toLowerCase().includes(lowered) ||
        creature.name.toLowerCase().includes(lowered) ||
        creature.theme.toLowerCase().includes(lowered) ||
        roleSummary.includes(lowered)
      );
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
      if (sortOption === "level_desc") return b.level - a.level;
      if (sortOption === "generation_desc") return b.generation - a.generation;
      if (sortOption === "happiness_desc") return b.happiness - a.happiness;
      return 0;
    });

    return filtered;
  }, [creatures, searchText, sortOption]);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-sky-100 to-cyan-200 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-sky-700">Creature Roster</p>
              <h1 className="text-4xl font-bold text-sky-950">Creatures</h1>
              <p className="mt-1 max-w-3xl text-sm text-stone-700">
                Review each creature's role, stat meanings, abilities, and where they can help in the ranch-to-road loop.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search name, species, role..."
                className="min-h-11 rounded-xl border border-sky-300 bg-white px-3 py-2"
              />
              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                className="min-h-11 rounded-xl border border-sky-300 bg-white px-3 py-2"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="name_asc">Sort: Name A-Z</option>
                <option value="name_desc">Sort: Name Z-A</option>
                <option value="level_desc">Sort: Highest Level</option>
                <option value="generation_desc">Sort: Highest Generation</option>
                <option value="happiness_desc">Sort: Highest Happiness</option>
              </select>
            </div>
          </header>

          <section className="mb-5 grid gap-3 sm:grid-cols-3">
            <GameStatCard label="Total Creatures" value={creatures.length} accentClasses="border-sky-200 bg-sky-50 text-sky-900" />
            <GameStatCard label="Visible" value={filteredCreatures.length} accentClasses="border-emerald-200 bg-emerald-50 text-emerald-900" />
            <GameStatCard label="Roster Use" value="Tap a card for full details" accentClasses="border-amber-200 bg-amber-50 text-amber-900" />
          </section>

          <section className="mb-5">
            <GameActionResultCard result={latestActionResult} compact />
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCreatures.length === 0 ? (
              <div className="sm:col-span-2 xl:col-span-3">
                <GameEmptyState>No creatures match that search.</GameEmptyState>
              </div>
            ) : (
              filteredCreatures.map((creature) => {
                const traits: CreatureTraitEntry[] = Array.isArray(creature.traits)
                  ? creature.traits
                  : [];
                const badges = getCreatureStrengthBadges(creature).slice(0, 3);
                const roleSummary = getCreatureRoleSummary(creature);

                return (
                  <button
                    key={creature.id}
                    type="button"
                    onClick={() => setSelectedCreatureId(creature.id)}
                    className="rounded-2xl border-2 border-sky-300 bg-white/90 p-3 text-left shadow transition hover:border-sky-600 hover:bg-white focus:outline-none focus:ring-2 focus:ring-sky-800"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-stone-100">
                        <Image
                          src={getCreatureImage(creature.name)}
                          alt={creature.name}
                          width={180}
                          height={180}
                          className="max-h-full w-auto object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-lg font-bold text-sky-950">
                              {creature.nickname}
                            </p>
                            <p className="truncate text-sm text-stone-600">
                              {creature.name} - {creature.theme}
                            </p>
                          </div>
                          <GameStatusBadge tone="sky">Lv {creature.level}</GameStatusBadge>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-stone-800">
                          {roleSummary}
                        </p>

                        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-stone-700">
                          <p><strong>Stamina:</strong> {creature.breedingStamina}/{creature.maxBreedingStamina}</p>
                          <p><strong>Mood:</strong> {getMoodLabel(creature.happiness)}</p>
                          <p><strong>Gen:</strong> {creature.generation}</p>
                          <p><strong>XP:</strong> {creature.xp}/{creature.xpToNextLevel}</p>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {badges.length > 0 ? (
                            badges.map((badge) => (
                              <span
                                key={`${creature.id}-${badge}`}
                                className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-900"
                              >
                                {badge}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-semibold text-stone-700">
                              General Helper
                            </span>
                          )}
                        </div>

                        <div className="mt-2">
                          <CreatureTraitBadgeRow traits={traits} compact maxVisible={1} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </section>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/ranch?tab=barn"
              className="min-h-11 rounded-2xl bg-stone-900 px-5 py-3 font-semibold text-white shadow"
            >
              Ranch Barn
            </Link>
            <Link
              href="/regions"
              className="min-h-11 rounded-2xl border border-sky-300 bg-white px-5 py-3 font-semibold text-stone-900 shadow"
            >
              Road Dispatch
            </Link>
          </div>
        </div>
      </main>

      <CreatureDetailModal
        open={selectedCreature !== null}
        creature={selectedCreature}
        onClose={() => {
          setSelectedCreatureId(null);
          if (editingCreatureId !== null) cancelEditing();
        }}
        editingCreatureId={editingCreatureId}
        nicknameInput={nicknameInput}
        setNicknameInput={setNicknameInput}
        startEditing={startEditing}
        saveNickname={saveNickname}
        cancelEditing={cancelEditing}
        recentResults={selectedCreature ? getRecentCreatureResults(selectedCreature.id) : []}
      />
    </>
  );
}
