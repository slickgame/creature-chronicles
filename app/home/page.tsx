"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGame } from "@/context/GameContext";

function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${suffix}`;
}

export default function HomePage() {
  const router = useRouter();
  const {
    currentDay,
    currentHour,
    currentMinute,
    currentLocation,
    playerData,
    homeState,
    creatures,
    travelTo,
    cookMeal,
    cleanHome,
  } = useGame();

  function handleTravelTo(destination: "home" | "ranch" | "town") {
    travelTo(destination);

    if (destination === "ranch") {
      router.push("/ranch");
      return;
    }

    if (destination === "town") {
      router.push("/town");
      return;
    }

    router.push("/home");
  }

  const cleanlinessStatus =
    homeState.cleanliness >= 80
      ? "Spotless"
      : homeState.cleanliness >= 50
      ? "Acceptable"
      : homeState.cleanliness >= 25
      ? "Dirty"
      : "Filthy";

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-200 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-4xl font-bold text-rose-900">🏠 Home</h1>

        <div className="mb-6 rounded-3xl border-4 border-rose-900 bg-white/85 p-6 shadow-xl">
          <div className="grid gap-3 text-lg text-stone-800 sm:grid-cols-2 lg:grid-cols-4">
            <p><strong>Day:</strong> {currentDay}</p>
            <p><strong>Time:</strong> {formatTime(currentHour, currentMinute)}</p>
            <p><strong>Location:</strong> {currentLocation}</p>
            <p><strong>Player:</strong> {playerData.name}</p>
            <p><strong>Player Level:</strong> {playerData.level}</p>
            <p><strong>Player XP:</strong> {playerData.xp}/{playerData.xpToNextLevel}</p>
            <p><strong>Food Stock:</strong> {homeState.foodStock}</p>
            <p><strong>Wheat Stock:</strong> {homeState.wheatStock}</p>
            <p><strong>Cleanliness:</strong> {homeState.cleanliness}/100</p>
            <p><strong>Home State:</strong> {cleanlinessStatus}</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button
              onClick={() => handleTravelTo("ranch")}
              className="rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
            >
              Travel to Ranch (10m)
            </button>
            <button
              onClick={() => handleTravelTo("town")}
              className="rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
            >
              Travel to Town (35m)
            </button>
            <button
              onClick={() => handleTravelTo("home")}
              disabled
              className="rounded-2xl bg-gray-500 px-4 py-3 text-white font-semibold shadow"
            >
              Already Home
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border-4 border-orange-800 bg-white/85 p-6 shadow-xl">
          <h2 className="mb-2 text-3xl font-bold text-orange-900">
            🍲 Home Systems
          </h2>
          <p className="text-stone-700">
            Creatures consume food at the start of each new day. Low food and low cleanliness reduce happiness and raise breeding refusal risk.
          </p>
          <div className="mt-4 grid gap-3 text-sm text-stone-700 sm:grid-cols-3">
            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="font-semibold">Cooking</p>
              <p>Uses wheat to create food stock.</p>
              <p>Best with Intelligence + Speed + Cooking skill.</p>
            </div>
            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="font-semibold">Cleaning</p>
              <p>Raises home cleanliness.</p>
              <p>Best with Intelligence + Speed + Cleaning skill.</p>
            </div>
            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="font-semibold">Field Work</p>
              <p>Plant and harvest persistent crop plots at the ranch.</p>
              <p>Best with Strength + Endurance + Field Work skill.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-3xl border-4 border-emerald-800 bg-white/85 p-6 shadow-xl">
            <h2 className="mb-4 text-3xl font-bold text-emerald-900">
              🍳 Cooking
            </h2>
            <div className="space-y-3">
              {creatures.map((creature) => (
                <div
                  key={`cook-${creature.id}`}
                  className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4"
                >
                  <p className="text-lg font-bold text-stone-900">
                    {creature.nickname} ({creature.name})
                  </p>
                  <p className="text-sm text-stone-700">
                    Happiness {creature.happiness}/100
                  </p>
                  <p className="text-sm text-stone-700">
                    INT {creature.stats.intelligence} • SPD {creature.stats.speed}
                  </p>
                  <p className="text-sm text-stone-700">
                    Cooking Skill Lv {creature.skills.cooking.level}
                  </p>
                  <p className="text-sm text-stone-600">
                    Stamina {creature.breedingStamina}/{creature.maxBreedingStamina}
                  </p>
                  <button
                    onClick={() => cookMeal(creature.id)}
                    disabled={currentLocation !== "home" || homeState.wheatStock < 1}
                    className={`mt-3 w-full rounded-2xl px-4 py-3 font-semibold text-white shadow ${
                      currentLocation === "home" && homeState.wheatStock >= 1
                        ? "bg-emerald-700"
                        : "bg-gray-500"
                    }`}
                  >
                    Cook Meal
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border-4 border-sky-800 bg-white/85 p-6 shadow-xl">
            <h2 className="mb-4 text-3xl font-bold text-sky-900">
              🧼 Cleaning
            </h2>
            <div className="space-y-3">
              {creatures.map((creature) => (
                <div
                  key={`clean-${creature.id}`}
                  className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4"
                >
                  <p className="text-lg font-bold text-stone-900">
                    {creature.nickname} ({creature.name})
                  </p>
                  <p className="text-sm text-stone-700">
                    Happiness {creature.happiness}/100
                  </p>
                  <p className="text-sm text-stone-700">
                    INT {creature.stats.intelligence} • SPD {creature.stats.speed}
                  </p>
                  <p className="text-sm text-stone-700">
                    Cleaning Skill Lv {creature.skills.cleaning.level}
                  </p>
                  <p className="text-sm text-stone-600">
                    Stamina {creature.breedingStamina}/{creature.maxBreedingStamina}
                  </p>
                  <button
                    onClick={() => cleanHome(creature.id)}
                    disabled={currentLocation !== "home"}
                    className={`mt-3 w-full rounded-2xl px-4 py-3 font-semibold text-white shadow ${
                      currentLocation === "home"
                        ? "bg-sky-700"
                        : "bg-gray-500"
                    }`}
                  >
                    Clean Home
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border-4 border-amber-800 bg-white/85 p-6 shadow-xl">
            <h2 className="mb-4 text-3xl font-bold text-amber-900">
              🌾 Field Work
            </h2>
            <div className="space-y-3">
              {creatures.map((creature) => (
                <div
                  key={`field-${creature.id}`}
                  className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4"
                >
                  <p className="text-lg font-bold text-stone-900">
                    {creature.nickname} ({creature.name})
                  </p>
                  <p className="text-sm text-stone-700">
                    Happiness {creature.happiness}/100
                  </p>
                  <p className="text-sm text-stone-700">
                    STR {creature.stats.strength} • END {creature.stats.endurance}
                  </p>
                  <p className="text-sm text-stone-700">
                    Field Work Skill Lv {creature.skills.fieldWork.level}
                  </p>
                  <p className="text-sm text-stone-600">
                    Stamina {creature.breedingStamina}/{creature.maxBreedingStamina}
                  </p>
                  <button
                    onClick={() => router.push("/ranch?tab=fields")}
                    className="mt-3 w-full rounded-2xl bg-amber-700 px-4 py-3 font-semibold text-white shadow"
                  >
                    Open Ranch Fields
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/ranch"
            className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
          >
            Ranch
          </Link>
          <Link
            href="/creatures"
            className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
          >
            Creatures
          </Link>
          <Link
            href="/breeding"
            className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
          >
            Breeding
          </Link>
          <Link
            href="/eggs"
            className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
          >
            Eggs
          </Link>
        </div>
      </div>
    </main>
  );
}
