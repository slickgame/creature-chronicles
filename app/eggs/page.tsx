"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import {
  CreatureTraitBadgeRow,
  CreatureTraitEntry,
} from "@/components/creatures/CreatureTraitUi";
import {
  EggQuality,
  getEggQualityClasses,
  getEggQualityDescription,
  getPenaltyPreview,
  getQualityRank,
  getRiskClasses,
  getRiskLabel,
  InbreedingRisk,
} from "@/components/eggs/EggUi";
import {
  GameCard,
  GameActionResultCard,
  GameEmptyState,
  GameFeedbackBox,
  GameModal,
  GameStatCard,
  GameStatusBadge,
} from "@/components/ui/GameUi";
import { getCreatureImage } from "@/lib/breeding/uiHelpers";
import {
  getCreatureBestUseSections,
  getCreatureStatEntries,
  getCreatureStrengthBadges,
  getEggClaritySummary,
} from "@/lib/creatures/creatureDisplay";

type InbredTrait = "none" | "weak" | "frail" | "dull" | "slow";
type InbredTraitSeverity = "none" | "mild" | "severe";

type HatchedCreature = {
  id: number;
  name: string;
  nickname: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  happiness: number;
  traits: CreatureTraitEntry[];
  stats: {
    strength: number;
    endurance: number;
    intelligence: number;
    speed: number;
    fertility: number;
    vitality: number;
  };
  breedingStamina: number;
  maxBreedingStamina: number;
  dailyBreedingLimit: number;
  generation: number;
  bornOnDay: number;
  inbreedingRisk: InbreedingRisk;
  inbredTrait: InbredTrait;
  inbredTraitSeverity: InbredTraitSeverity;
};

type SortOption =
  | "ready_first"
  | "time_lowest"
  | "time_highest"
  | "quality_best"
  | "quality_worst";

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

function getRiskTone(risk: InbreedingRisk): "emerald" | "amber" | "rose" {
  if (risk === "none") return "emerald";
  if (risk === "half_sibling") return "amber";
  return "rose";
}

function getQualityTone(quality: EggQuality): "stone" | "emerald" | "sky" | "fuchsia" {
  if (quality === "exceptional") return "fuchsia";
  if (quality === "strong") return "sky";
  if (quality === "normal") return "emerald";
  return "stone";
}

function EggDetailModal({
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

  const clarity = getEggClaritySummary(egg);
  const ready = egg.hatchDaysRemaining === 0;

  return (
    <GameModal
      open={open}
      onClose={onClose}
      title={`${egg.name} - Egg Details`}
      maxWidth="max-w-5xl"
      borderClassName="border-amber-900"
      titleClassName="text-amber-950"
    >
      <div className="space-y-5">
        <GameCard tone="amber" className="shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row">
            <div className="flex h-52 w-full items-center justify-center overflow-hidden rounded-2xl bg-white md:w-72">
              <Image
                src="/images/egg.PNG"
                alt="Egg"
                width={320}
                height={320}
                className="max-h-full w-auto object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase text-amber-800">Summary</p>
              <h3 className="mt-1 text-3xl font-bold text-amber-950">{egg.name}</h3>
              <p className="mt-1 text-sm font-semibold text-stone-700">
                Parents: {clarity.parentSummary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <GameStatusBadge tone={ready ? "emerald" : "amber"}>
                  {ready ? "Ready to Hatch" : `${egg.hatchDaysRemaining} day(s) left`}
                </GameStatusBadge>
                <GameStatusBadge tone={getRiskTone(egg.inbreedingRisk)}>
                  {getRiskLabel(egg.inbreedingRisk)}
                </GameStatusBadge>
                <GameStatusBadge tone={getQualityTone(egg.quality)}>
                  {egg.quality} quality
                </GameStatusBadge>
              </div>
              <p className="mt-4 text-sm text-stone-700">{clarity.status}</p>
            </div>
          </div>
        </GameCard>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <GameStatCard label="Hatch Status" value={ready ? "Ready" : `${egg.hatchDaysRemaining}d`} accentClasses="border-amber-200 bg-amber-50 text-amber-900" />
          <GameStatCard label="Rarity / Quality" value={egg.quality} accentClasses="border-sky-200 bg-sky-50 text-sky-900" />
          <GameStatCard label="Risk" value={getRiskLabel(egg.inbreedingRisk)} accentClasses="border-stone-200 bg-stone-50 text-stone-700" />
          <GameStatCard label="Destination" value="Nursery -> Creature Roster" accentClasses="border-emerald-200 bg-emerald-50 text-emerald-900" />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <GameCard tone="stone" className="shadow-sm">
            <p className="text-lg font-bold text-stone-950">Projection</p>
            <div className="mt-3 space-y-3 text-sm text-stone-700">
              <p><strong>Species:</strong> {clarity.projectedSpecies}</p>
              <p><strong>Projected Stats:</strong> {clarity.projectedStats}</p>
              <p><strong>Inherited Traits:</strong> {clarity.inheritedTraits}</p>
              <p><strong>Quality Effect:</strong> {getEggQualityDescription(egg.quality)}</p>
            </div>
          </GameCard>

          <GameCard tone={egg.inbreedingRisk === "none" ? "emerald" : "amber"} className="shadow-sm">
            <p className="text-lg font-bold text-stone-950">Family & Hatch Risk</p>
            <div className="mt-3 space-y-3 text-sm text-stone-700">
              <p><strong>Giver:</strong> {egg.giver}</p>
              <p><strong>Receiver:</strong> {egg.receiver}</p>
              <p><strong>Parent IDs:</strong> {egg.giverId ?? "Player"} / {egg.receiverId ?? "Player"}</p>
              <p><strong>Risk Preview:</strong> {getPenaltyPreview(egg.inbreedingRisk)}</p>
            </div>
          </GameCard>
        </section>

        <GameCard tone="sky" className="shadow-sm">
          <p className="text-lg font-bold text-stone-950">What Happens After Hatching</p>
          <p className="mt-2 text-sm text-stone-700">
            Hatching removes this egg, creates a newborn creature, then opens a rename step. The newborn joins the Creature Roster and can later help with ranch work, breeding, road dispatch, and market preparation once it has the stamina and stats for the job.
          </p>
          {clarity.disabledReason ? (
            <GameFeedbackBox tone="amber" message={`Disabled: ${clarity.disabledReason}`} />
          ) : null}
        </GameCard>

        <button
          type="button"
          disabled={!ready}
          onClick={() => onHatch(egg.id)}
          className={`min-h-12 w-full rounded-2xl px-4 py-3 font-semibold text-white shadow ${
            ready ? "bg-emerald-700" : "bg-stone-400"
          }`}
        >
          {ready ? "Hatch Egg" : "Not Ready Yet"}
        </button>
      </div>
    </GameModal>
  );
}

function HatchedCreatureModal({
  open,
  creature,
  nicknameInput,
  setNicknameInput,
  onSaveAndClose,
  onCloseWithoutRename,
}: {
  open: boolean;
  creature: HatchedCreature | null;
  nicknameInput: string;
  setNicknameInput: (value: string) => void;
  onSaveAndClose: () => void;
  onCloseWithoutRename: () => void;
}) {
  if (!open || !creature) return null;

  const traits: CreatureTraitEntry[] = Array.isArray(creature.traits)
    ? creature.traits
    : [];
  const statEntries = getCreatureStatEntries(creature);
  const bestUses = getCreatureBestUseSections(creature).slice(0, 4);
  const badges = getCreatureStrengthBadges(creature);

  return (
    <GameModal
      open={open}
      onClose={onCloseWithoutRename}
      title="Egg Hatched"
      maxWidth="max-w-4xl"
      borderClassName="border-emerald-900"
      titleClassName="text-emerald-950"
      zClassName="z-[100]"
    >
      <div className="space-y-5">
        <GameCard tone="emerald" className="shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row">
            <div className="flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-white md:w-72">
              <Image
                src={getCreatureImage(creature.name)}
                alt={creature.name}
                width={320}
                height={320}
                className="max-h-full w-auto object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase text-emerald-800">New Creature</p>
              <h3 className="mt-1 text-3xl font-bold text-emerald-950">{creature.nickname}</h3>
              <p className="mt-1 text-sm font-semibold text-stone-700">
                {creature.name} - Gen {creature.generation} - Born Day {creature.bornOnDay}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <GameStatusBadge tone={getRiskTone(creature.inbreedingRisk)}>
                  {getRiskLabel(creature.inbreedingRisk)}
                </GameStatusBadge>
                <GameStatusBadge tone={getInbredTraitTone(creature.inbredTraitSeverity)}>
                  {getInbredTraitLabel(creature.inbredTrait, creature.inbredTraitSeverity)}
                </GameStatusBadge>
                {badges.map((badge) => (
                  <GameStatusBadge key={badge} tone="emerald">{badge}</GameStatusBadge>
                ))}
              </div>
            </div>
          </div>
        </GameCard>

        <section className="grid gap-4 lg:grid-cols-2">
          <GameCard tone="stone" className="shadow-sm">
            <p className="text-lg font-bold text-stone-950">Starting Stats</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {statEntries.map((stat) => (
                <div key={stat.key} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
                  <p className="font-bold text-stone-950">{stat.label}: {stat.value}</p>
                  <p className="mt-1 text-xs text-stone-600">{stat.shortEffect}</p>
                </div>
              ))}
            </div>
          </GameCard>

          <GameCard tone="sky" className="shadow-sm">
            <p className="text-lg font-bold text-stone-950">Best Uses</p>
            <div className="mt-3 grid gap-2">
              {bestUses.map((use) => (
                <div key={use.label} className="rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm">
                  <p className="font-bold text-stone-950">{use.label}</p>
                  <p className="mt-1 text-stone-700">{use.summary}</p>
                </div>
              ))}
            </div>
          </GameCard>
        </section>

        <GameCard tone="emerald" className="shadow-sm">
          <p className="text-lg font-bold text-stone-950">Traits</p>
          <div className="mt-3">
            <CreatureTraitBadgeRow traits={traits} maxVisible={traits.length} />
          </div>
        </GameCard>

        <GameCard tone="amber" className="shadow-sm">
          <p className="text-lg font-bold text-stone-950">Rename Newborn</p>
          <input
            type="text"
            value={nicknameInput}
            onChange={(event) => setNicknameInput(event.target.value)}
            className="mt-3 min-h-11 w-full rounded-xl border border-amber-300 bg-white px-3 py-2"
            placeholder="Enter new name"
          />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onSaveAndClose}
              className="min-h-11 w-full rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white shadow"
            >
              Save Name and Close
            </button>
            <button
              type="button"
              onClick={onCloseWithoutRename}
              className="min-h-11 w-full rounded-xl bg-stone-700 px-4 py-2 font-semibold text-white shadow"
            >
              Keep Current Name
            </button>
          </div>
        </GameCard>
      </div>
    </GameModal>
  );
}

export default function EggsPage() {
  const { eggs, hatchEgg, renameCreature, getLatestResultBySource, latestActionResult } = useGame();
  const [selectedEggId, setSelectedEggId] = useState<number | null>(null);
  const [hatchedCreature, setHatchedCreature] = useState<HatchedCreature | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("ready_first");

  const selectedEgg = eggs.find((egg) => egg.id === selectedEggId) ?? null;

  function handleHatch(eggId: number) {
    const newCreature = hatchEgg(eggId);
    if (!newCreature) return;

    setSelectedEggId(null);
    setHatchedCreature(newCreature as HatchedCreature);
    setNicknameInput(newCreature.nickname);
  }

  function handleSaveAndClose() {
    if (!hatchedCreature) return;
    renameCreature(hatchedCreature.id, nicknameInput);
    setHatchedCreature(null);
    setNicknameInput("");
  }

  function handleCloseWithoutRename() {
    setHatchedCreature(null);
    setNicknameInput("");
  }

  const sortedEggs = useMemo(() => {
    const copy = [...eggs];
    copy.sort((a, b) => {
      if (sortOption === "ready_first") {
        const aReady = a.hatchDaysRemaining === 0 ? 1 : 0;
        const bReady = b.hatchDaysRemaining === 0 ? 1 : 0;
        if (bReady !== aReady) return bReady - aReady;
        return a.hatchDaysRemaining - b.hatchDaysRemaining;
      }
      if (sortOption === "time_lowest") return a.hatchDaysRemaining - b.hatchDaysRemaining;
      if (sortOption === "time_highest") return b.hatchDaysRemaining - a.hatchDaysRemaining;
      if (sortOption === "quality_best") {
        return getQualityRank(b.quality as EggQuality) - getQualityRank(a.quality as EggQuality);
      }
      if (sortOption === "quality_worst") {
        return getQualityRank(a.quality as EggQuality) - getQualityRank(b.quality as EggQuality);
      }
      return 0;
    });
    return copy;
  }, [eggs, sortOption]);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-yellow-100 to-amber-200 p-4 sm:p-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-amber-800">Nursery</p>
              <h1 className="text-4xl font-bold text-amber-950">Eggs</h1>
              <p className="mt-1 max-w-3xl text-sm text-stone-700">
                Track hatch timing, parent records, quality, risk, and what each egg becomes after hatching.
              </p>
            </div>

            <select
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as SortOption)}
              className="min-h-11 rounded-xl border border-amber-300 bg-white px-3 py-2"
            >
              <option value="ready_first">Sort: Ready First</option>
              <option value="time_lowest">Sort: Lowest Time Remaining</option>
              <option value="time_highest">Sort: Highest Time Remaining</option>
              <option value="quality_best">Sort: Best Quality</option>
              <option value="quality_worst">Sort: Worst Quality</option>
            </select>
          </header>

          <section className="mb-5 grid gap-3 sm:grid-cols-3">
            <GameStatCard label="Total Eggs" value={eggs.length} accentClasses="border-amber-200 bg-amber-50 text-amber-900" />
            <GameStatCard label="Ready To Hatch" value={eggs.filter((egg) => egg.hatchDaysRemaining === 0).length} accentClasses="border-emerald-200 bg-emerald-50 text-emerald-900" />
            <GameStatCard label="Nursery Use" value="Tap an egg for hatch details" accentClasses="border-stone-200 bg-stone-50 text-stone-700" />
          </section>

          <section className="mb-5">
            <GameActionResultCard
              result={getLatestResultBySource("egg") ?? getLatestResultBySource("breeding") ?? latestActionResult}
              compact
            />
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sortedEggs.length === 0 ? (
              <div className="sm:col-span-2 xl:col-span-3">
                <GameEmptyState>No eggs right now. Use the Ranch Breeding room when a pairing is ready.</GameEmptyState>
              </div>
            ) : (
              sortedEggs.map((egg) => {
                const clarity = getEggClaritySummary(egg);
                return (
                  <button
                    key={egg.id}
                    type="button"
                    onClick={() => setSelectedEggId(egg.id)}
                    className="rounded-2xl border-2 border-amber-300 bg-white/90 p-3 text-left shadow transition hover:border-amber-600 hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-800"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-amber-50">
                        <Image
                          src="/images/egg.PNG"
                          alt={egg.name}
                          width={150}
                          height={150}
                          className="max-h-full w-auto object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-lg font-bold text-amber-950">{egg.name}</p>
                            <p className="truncate text-sm text-stone-600">{egg.parents}</p>
                          </div>
                          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900">
                            {egg.hatchDaysRemaining === 0 ? "Ready" : `${egg.hatchDaysRemaining}d`}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getRiskClasses(egg.inbreedingRisk as InbreedingRisk)}`}>
                            {getRiskLabel(egg.inbreedingRisk as InbreedingRisk)}
                          </span>
                          <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getEggQualityClasses(egg.quality as EggQuality)}`}>
                            {egg.quality}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-stone-700">{clarity.status}</p>
                        <p className="mt-1 text-xs font-semibold text-amber-900">
                          After hatch: creature joins the roster.
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </section>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/ranch?tab=nursery"
              className="min-h-11 rounded-2xl bg-stone-900 px-5 py-3 font-semibold text-white shadow"
            >
              Ranch Nursery
            </Link>
            <Link
              href="/ranch?tab=breeding"
              className="min-h-11 rounded-2xl border border-amber-300 bg-white px-5 py-3 font-semibold text-stone-900 shadow"
            >
              Breeding Room
            </Link>
          </div>
        </div>
      </main>

      <EggDetailModal
        open={selectedEgg !== null}
        egg={selectedEgg}
        onClose={() => setSelectedEggId(null)}
        onHatch={handleHatch}
      />

      <HatchedCreatureModal
        open={hatchedCreature !== null}
        creature={hatchedCreature}
        nicknameInput={nicknameInput}
        setNicknameInput={setNicknameInput}
        onSaveAndClose={handleSaveAndClose}
        onCloseWithoutRename={handleCloseWithoutRename}
      />
    </>
  );
}
