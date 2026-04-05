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

function isExpired(
  currentDay: number,
  currentHour: number,
  currentMinute: number,
  deadlineDay: number,
  deadlineHour: number,
  deadlineMinute: number
) {
  if (currentDay > deadlineDay) return true;
  if (currentDay < deadlineDay) return false;
  if (currentHour > deadlineHour) return true;
  if (currentHour < deadlineHour) return false;
  return currentMinute > deadlineMinute;
}

function isExpiringSoon(
  currentDay: number,
  currentHour: number,
  currentMinute: number,
  deadlineDay: number,
  deadlineHour: number,
  deadlineMinute: number
) {
  if (
    isExpired(
      currentDay,
      currentHour,
      currentMinute,
      deadlineDay,
      deadlineHour,
      deadlineMinute
    )
  ) {
    return false;
  }

  const currentTotal =
    currentDay * 24 * 60 + currentHour * 60 + currentMinute;
  const deadlineTotal =
    deadlineDay * 24 * 60 + deadlineHour * 60 + deadlineMinute;

  return deadlineTotal - currentTotal <= 24 * 60;
}

export default function TownPage() {
  const router = useRouter();
  const {
    currentDay,
    currentHour,
    currentMinute,
    currentLocation,
    playerData,
    creatures,
    townStock,
    townQuests,
    travelLog,
    purchaseTownCreature,
    submitCreatureToQuest,
    travelTo,
  } = useGame();

  function handleTravelTo(
  destination: "ranch" | "town" | "market" | "guild_hall"
) {
    travelTo(destination);

    if (destination === "ranch") {
      router.push("/ranch");
      return;
    }

    router.push("/town");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-100 to-amber-200 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-4xl font-bold text-stone-900">🏘️ Town</h1>

        <div className="mb-6 rounded-3xl border-4 border-stone-900 bg-white/85 p-6 shadow-xl">
          <div className="grid gap-3 text-lg text-stone-800 sm:grid-cols-2 lg:grid-cols-4">
            <p><strong>Day:</strong> {currentDay}</p>
            <p><strong>Time:</strong> {formatTime(currentHour, currentMinute)}</p>
            <p><strong>Location:</strong> {currentLocation}</p>
            <p><strong>Gold:</strong> {playerData.gold}</p>
            <p><strong>Energy:</strong> {playerData.energy}</p>
            <p><strong>Player Level:</strong> {playerData.level}</p>
            <p><strong>Player XP:</strong> {playerData.xp}/{playerData.xpToNextLevel}</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => handleTravelTo("ranch")}
              className="rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
            >
              Travel to Ranch (30m)
            </button>
            <button
              onClick={() => handleTravelTo("market")}
              className="rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
            >
              Visit Market (15m)
            </button>
            <button
              onClick={() => handleTravelTo("guild_hall")}
              className="rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
            >
              Visit Guild Hall (20m)
            </button>
            <button
              onClick={() => handleTravelTo("town")}
              className="rounded-2xl bg-gray-500 px-4 py-3 text-white font-semibold shadow"
              disabled
            >
              Already in Town
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-3">
          <section className="rounded-3xl border-4 border-amber-800 bg-white/85 p-6 shadow-xl">
            <h2 className="mb-2 text-3xl font-bold text-amber-900">
              🐾 Creature Seller
            </h2>
            <p className="mb-5 text-stone-600">
              New stock rotates each day to help you avoid inbreeding. Buying a creature takes 20 in-game minutes.
            </p>

            {townStock.length === 0 ? (
              <div className="rounded-2xl bg-amber-50 p-4 text-stone-700">
                The seller is sold out for today.
              </div>
            ) : (
              <div className="space-y-4">
                {townStock.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-stone-900">
                          {entry.creature.nickname}
                        </h3>
                        <p className="text-stone-700">
                          {entry.creature.name} • Lv {entry.creature.level}
                        </p>
                        <p className="text-sm text-stone-500">
                          Theme: {entry.creature.theme}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-amber-900">
                          {entry.price} Gold
                        </p>
                      </div>
                    </div>

                    <div className="mb-3 grid gap-2 text-sm text-stone-800 sm:grid-cols-2">
                      <p><strong>STR:</strong> {entry.creature.stats.strength}</p>
                      <p><strong>END:</strong> {entry.creature.stats.endurance}</p>
                      <p><strong>INT:</strong> {entry.creature.stats.intelligence}</p>
                      <p><strong>SPD:</strong> {entry.creature.stats.speed}</p>
                      <p><strong>FER:</strong> {entry.creature.stats.fertility}</p>
                      <p><strong>VIT:</strong> {entry.creature.stats.vitality}</p>
                    </div>

                    <button
                      onClick={() => purchaseTownCreature(entry.id)}
                      disabled={playerData.gold < entry.price}
                      className={`w-full rounded-2xl px-4 py-3 font-semibold text-white shadow ${
                        playerData.gold >= entry.price
                          ? "bg-amber-700"
                          : "bg-gray-500"
                      }`}
                    >
                      {playerData.gold >= entry.price ? "Buy Creature" : "Not Enough Gold"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border-4 border-sky-800 bg-white/85 p-6 shadow-xl xl:col-span-2">
            <h2 className="mb-2 text-3xl font-bold text-sky-900">
              📋 Breeding Quest Board
            </h2>
            <p className="mb-5 text-stone-600">
              Submit bred creatures that meet stat and species requirements. Turning in a quest takes 30 in-game minutes, and this board scrolls independently for readability.
            </p>

            <div className="max-h-[720px] overflow-y-auto pr-2 space-y-4">
              {townQuests.map((quest) => {
                const expired = isExpired(
                  currentDay,
                  currentHour,
                  currentMinute,
                  quest.deadlineDay,
                  quest.deadlineHour,
                  quest.deadlineMinute
                );

                const expiringSoon = isExpiringSoon(
                  currentDay,
                  currentHour,
                  currentMinute,
                  quest.deadlineDay,
                  quest.deadlineHour,
                  quest.deadlineMinute
                );

                const eligibleCreatures = creatures.filter((creature) => {
                  if (quest.completed || expired) return false;
                  if (
                    quest.requirement.species !== "any" &&
                    creature.name !== quest.requirement.species
                  ) {
                    return false;
                  }
                  if (creature.level < quest.requirement.minimumLevel) {
                    return false;
                  }

                  const minimumStats = quest.requirement.minimumStats;

                  if (
                    minimumStats.strength !== undefined &&
                    creature.stats.strength < minimumStats.strength
                  ) return false;
                  if (
                    minimumStats.endurance !== undefined &&
                    creature.stats.endurance < minimumStats.endurance
                  ) return false;
                  if (
                    minimumStats.intelligence !== undefined &&
                    creature.stats.intelligence < minimumStats.intelligence
                  ) return false;
                  if (
                    minimumStats.speed !== undefined &&
                    creature.stats.speed < minimumStats.speed
                  ) return false;
                  if (
                    minimumStats.fertility !== undefined &&
                    creature.stats.fertility < minimumStats.fertility
                  ) return false;
                  if (
                    minimumStats.vitality !== undefined &&
                    creature.stats.vitality < minimumStats.vitality
                  ) return false;

                  if (
                    quest.title === "Healthy Bloodline" &&
                    creature.inbreedingRisk !== "none"
                  ) {
                    return false;
                  }

                  return true;
                });

                return (
                  <div
                    key={quest.id}
                    className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-stone-900">
                          {quest.title}
                        </h3>
                        <p className="text-stone-700">{quest.description}</p>
                      </div>

                      <div className="flex flex-col gap-2 text-right text-sm">
                        {quest.completed ? (
                          <span className="rounded-full border border-green-300 bg-green-100 px-3 py-1 font-semibold text-green-900">
                            Completed
                          </span>
                        ) : expired ? (
                          <span className="rounded-full border border-red-300 bg-red-100 px-3 py-1 font-semibold text-red-900">
                            Expired
                          </span>
                        ) : expiringSoon ? (
                          <span className="rounded-full border border-orange-300 bg-orange-100 px-3 py-1 font-semibold text-orange-900">
                            Expires Soon
                          </span>
                        ) : (
                          <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 font-semibold text-amber-900">
                            Open
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-3 rounded-2xl bg-white/80 p-3 text-sm text-stone-800">
                      <p><strong>Species:</strong> {quest.requirement.species}</p>
                      <p><strong>Minimum Level:</strong> {quest.requirement.minimumLevel}</p>
                      <p>
                        <strong>Deadline:</strong> Day {quest.deadlineDay}{" "}
                        {formatTime(quest.deadlineHour, quest.deadlineMinute)}
                      </p>
                      <p>
                        <strong>Rewards:</strong> {quest.rewardGold} Gold, {quest.rewardXp} Player XP
                      </p>
                      <div className="mt-2">
                        <p className="font-semibold">Minimum Stats:</p>
                        <div className="grid gap-1 sm:grid-cols-2">
                          {Object.entries(quest.requirement.minimumStats).map(
                            ([key, value]) => (
                              <p key={key}>
                                <strong>{key.toUpperCase()}:</strong> {value}
                              </p>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {quest.completed || expired ? null : eligibleCreatures.length === 0 ? (
                      <p className="text-sm font-semibold text-red-700">
                        No eligible creatures available right now.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {eligibleCreatures.map((creature) => (
                          <button
                            key={creature.id}
                            onClick={() => submitCreatureToQuest(quest.id, creature.id)}
                            className="w-full rounded-2xl bg-sky-700 px-4 py-3 text-left font-semibold text-white shadow"
                          >
                            Submit {creature.nickname} ({creature.name}, Lv {creature.level})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="mb-6 rounded-3xl border-4 border-emerald-800 bg-white/85 p-6 shadow-xl">
          <h2 className="mb-2 text-3xl font-bold text-emerald-900">
            🧭 Travel Log
          </h2>
          <p className="mb-4 text-stone-600">
            Recent movements and time spent traveling.
          </p>

          {travelLog.length === 0 ? (
            <div className="rounded-2xl bg-emerald-50 p-4 text-stone-700">
              No travel logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {travelLog.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4"
                >
                  <p className="font-semibold text-stone-900">
                    {entry.from} → {entry.to}
                  </p>
                  <p className="text-sm text-stone-700">
                    Day {entry.day}, {formatTime(entry.hour, entry.minute)}
                  </p>
                  <p className="text-sm text-stone-600">
                    Travel time: {entry.minutesSpent} minutes
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

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
    </main>
  );
}