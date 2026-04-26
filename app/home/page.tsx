"use client";

import Link from "next/link";
import { useGame } from "@/context/GameContext";
import StoryObjectiveStrip from "@/components/story/StoryObjectiveStrip";
import {
  GameCard,
  GameSectionHeader,
  GameStatCard,
  GameStatusBadge,
} from "@/components/ui/GameUi";

function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${suffix}`;
}

function getCleanlinessStatus(cleanliness: number) {
  if (cleanliness >= 80) return "Spotless";
  if (cleanliness >= 50) return "Comfortable";
  if (cleanliness >= 25) return "Needs Care";
  return "Messy";
}

const RANCH_LINKS = [
  {
    href: "/ranch?tab=house",
    title: "Ranch House",
    description: "Home care, cooking, cleaning, and recipe work.",
    tone: "rose",
  },
  {
    href: "/ranch?tab=fields",
    title: "Ranch Fields",
    description: "Plant, water, fertilize, harvest, and manage crop plots.",
    tone: "emerald",
  },
  {
    href: "/ranch?tab=barn",
    title: "Ranch Barn",
    description: "Creature care, recovery, roster details, and helper management.",
    tone: "amber",
  },
  {
    href: "/ranch?tab=breeding",
    title: "Breeding & Nursery",
    description: "Pairing, eggs, hatching, lineage proof, and future stock.",
    tone: "fuchsia",
  },
] as const;

export default function HomePage() {
  const {
    currentDay,
    currentHour,
    currentMinute,
    playerData,
    homeState,
    creatures,
    eggs,
    currentRegionId,
    worldRegions,
  } = useGame();

  const currentRegion = worldRegions.find((region) => region.id === currentRegionId);
  const cleanlinessStatus = getCleanlinessStatus(homeState.cleanliness);
  const averageCreatureHappiness =
    creatures.length > 0
      ? Math.round(creatures.reduce((sum, creature) => sum + creature.happiness, 0) / creatures.length)
      : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-200 p-3 sm:p-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-rose-700">Home</p>
            <h1 className="text-4xl font-bold text-rose-950">Home Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm text-stone-700">
              A calm landing page for the day. Ranch work lives in the Ranch rooms, and global navigation stays free.
            </p>
          </div>
          <GameStatusBadge tone="rose">
            {currentRegion?.name ?? "Homefold Valley"}
          </GameStatusBadge>
        </header>

        <StoryObjectiveStrip />

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <GameStatCard label="Day" value={currentDay} accentClasses="border-rose-200 bg-rose-50 text-rose-900" />
          <GameStatCard label="Time" value={formatTime(currentHour, currentMinute)} accentClasses="border-amber-200 bg-amber-50 text-amber-900" />
          <GameStatCard label="Gold" value={playerData.gold} accentClasses="border-yellow-200 bg-yellow-50 text-yellow-900" />
          <GameStatCard label="Energy" value={`${playerData.energy}/100`} accentClasses="border-emerald-200 bg-emerald-50 text-emerald-900" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <GameCard tone="rose" className="shadow-lg">
            <GameSectionHeader
              eyebrow="Home Status"
              title={cleanlinessStatus}
              description="The home overview shows pressure at a glance without duplicating Ranch room actions."
              tone="rose"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <GameStatCard label="Cleanliness" value={`${homeState.cleanliness}/100`} accentClasses="border-rose-200 bg-white text-rose-900" />
              <GameStatCard label="Food Stock" value={homeState.foodStock} accentClasses="border-orange-200 bg-white text-orange-900" />
              <GameStatCard label="Wheat Stock" value={homeState.wheatStock} accentClasses="border-amber-200 bg-white text-amber-900" />
              <GameStatCard label="Creatures" value={creatures.length} accentClasses="border-fuchsia-200 bg-white text-fuchsia-900" />
              <GameStatCard label="Eggs" value={eggs.length} accentClasses="border-lime-200 bg-white text-lime-900" />
              <GameStatCard label="Avg. Mood" value={`${averageCreatureHappiness}/100`} accentClasses="border-sky-200 bg-white text-sky-900" />
            </div>
          </GameCard>

          <GameCard tone="stone" className="shadow-lg">
            <GameSectionHeader
              eyebrow="Canonical Ranch Rooms"
              title="Choose a Room"
              description="These are free navigation links into the proper Ranch interfaces, not in-world travel actions."
              tone="stone"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {RANCH_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="min-h-32 rounded-2xl border-2 border-stone-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-stone-900 hover:shadow"
                >
                  <p className="text-lg font-bold text-stone-950">{link.title}</p>
                  <p className="mt-2 text-sm text-stone-700">{link.description}</p>
                </Link>
              ))}
            </div>
          </GameCard>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/town" className="min-h-11 rounded-xl bg-stone-900 px-4 py-3 text-center text-sm font-semibold text-white shadow">
            Town
          </Link>
          <Link href="/inventory" className="min-h-11 rounded-xl bg-stone-900 px-4 py-3 text-center text-sm font-semibold text-white shadow">
            Inventory
          </Link>
          <Link href="/calendar" className="min-h-11 rounded-xl bg-stone-900 px-4 py-3 text-center text-sm font-semibold text-white shadow">
            Calendar
          </Link>
          <Link href="/regions" className="min-h-11 rounded-xl bg-teal-800 px-4 py-3 text-center text-sm font-semibold text-white shadow">
            Regions
          </Link>
        </section>
      </div>
    </main>
  );
}
