"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import { HubCard, PopupWindow } from "@/components/town/TownUi";

type CreatureTrait =
  | "none"
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

function getTraitLabel(trait: CreatureTrait) {
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
  if (trait === "graceful") return "Graceful";
  return "No Trait";
}

function getTraitClasses(trait: CreatureTrait) {
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
  if (trait === "graceful") return "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300";
  return "bg-stone-100 text-stone-700 border-stone-300";
}

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

  const currentTotal = currentDay * 24 * 60 + currentHour * 60 + currentMinute;
  const deadlineTotal = deadlineDay * 24 * 60 + deadlineHour * 60 + deadlineMinute;
  return deadlineTotal - currentTotal <= 24 * 60;
}

function getRelationshipTierLabel(relationship: number) {
  if (relationship >= 75) return "Close";
  if (relationship >= 50) return "Trusted";
  if (relationship >= 25) return "Friendly";
  return "Stranger";
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
    townNpcs,
    townNpcQuests,
    travelLog,
    purchaseTownCreature,
    submitCreatureToQuest,
    submitCreatureToNpcQuest,
    travelTo,
  } = useGame();

  const [sellerOpen, setSellerOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [relationshipsOpen, setRelationshipsOpen] = useState(false);
  const [npcRequestsOpen, setNpcRequestsOpen] = useState(false);
  const [travelLogOpen, setTravelLogOpen] = useState(false);

  function handleTravelTo(
    destination: "ranch" | "town" | "market" | "guild_hall"
  ) {
    travelTo(destination);

    if (destination === "ranch") {
      router.push("/ranch");
      return;
    }

    if (destination === "market") {
      router.push("/market");
      return;
    }

    if (destination === "guild_hall") {
      router.push("/guild_hall");
      return;
    }

    router.push("/town");
  }

  const sellerSummary = useMemo(() => {
    const cheapest = townStock.length > 0 ? Math.min(...townStock.map((entry) => entry.price)) : null;
    return {
      count: townStock.length,
      cheapest,
    };
  }, [townStock]);

  const openBoardCount = useMemo(() => {
    return townQuests.filter(
      (quest) =>
        !quest.completed &&
        !isExpired(
          currentDay,
          currentHour,
          currentMinute,
          quest.deadlineDay,
          quest.deadlineHour,
          quest.deadlineMinute
        )
    ).length;
  }, [townQuests, currentDay, currentHour, currentMinute]);

  const openNpcRequestCount = useMemo(() => {
    return townNpcQuests.filter(
      (quest) =>
        !quest.completed &&
        !isExpired(
          currentDay,
          currentHour,
          currentMinute,
          quest.deadlineDay,
          quest.deadlineHour,
          quest.deadlineMinute
        )
    ).length;
  }, [townNpcQuests, currentDay, currentHour, currentMinute]);

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-b from-stone-100 to-amber-200 p-6">
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
            <p><strong>Creatures Owned:</strong> {creatures.length}</p>
          </div>
        </div>

        <section className="mb-6 rounded-3xl border-4 border-stone-900 bg-white/85 p-6 shadow-xl">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-stone-900">Town Destinations</h2>
            <p className="mt-1 text-stone-600">
              Travel from town through destination cards instead of plain buttons.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <HubCard
              icon="🌿"
              title="Ranch"
              subtitle="Return home to your creatures, eggs, and daily management."
              meta="Travel time: 30m"
              accentClasses="border-emerald-300 bg-emerald-50"
              onClick={() => handleTravelTo("ranch")}
            />

            <HubCard
              icon="🛒"
              title="Market"
              subtitle="Browse creature offers and future stall inventory."
              meta={`${sellerSummary.count} creature offers today`}
              accentClasses="border-amber-300 bg-amber-50"
              onClick={() => handleTravelTo("market")}
            />

            <HubCard
              icon="🏛️"
              title="Guild Hall"
              subtitle="Check jobs, contacts, and future guild progression."
              meta={`${openNpcRequestCount} open guild-linked requests`}
              accentClasses="border-violet-300 bg-violet-50"
              onClick={() => handleTravelTo("guild_hall")}
            />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border-4 border-amber-800 bg-white/85 p-6 shadow-xl">
            <h2 className="mb-2 text-3xl font-bold text-amber-900">Town Services</h2>
            <p className="mb-5 text-stone-600">
              Open the seller or contract board in pop-up windows so the main town screen stays clean.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSellerOpen(true)}
                className="rounded-2xl bg-amber-700 px-4 py-4 text-left text-white font-semibold shadow"
              >
                Creature Seller
                <div className="mt-1 text-sm font-medium text-amber-100">
                  {sellerSummary.count} in stock
                  {sellerSummary.cheapest !== null ? ` • Cheapest ${sellerSummary.cheapest} Gold` : ""}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBoardOpen(true)}
                className="rounded-2xl bg-sky-700 px-4 py-4 text-left text-white font-semibold shadow"
              >
                Breeding Quest Board
                <div className="mt-1 text-sm font-medium text-sky-100">
                  {openBoardCount} open contracts
                </div>
              </button>
            </div>
          </section>

          <section className="rounded-3xl border-4 border-rose-800 bg-white/85 p-6 shadow-xl">
            <h2 className="mb-2 text-3xl font-bold text-rose-900">Town Info</h2>
            <p className="mb-5 text-stone-600">
              Secondary information opens in pop-up windows instead of stretching the main page.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRelationshipsOpen(true)}
                className="rounded-2xl bg-rose-700 px-4 py-4 text-left text-white font-semibold shadow"
              >
                Relationships
                <div className="mt-1 text-sm font-medium text-rose-100">
                  {townNpcs.length} tracked NPCs
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNpcRequestsOpen(true)}
                className="rounded-2xl bg-purple-700 px-4 py-4 text-left text-white font-semibold shadow"
              >
                NPC Requests
                <div className="mt-1 text-sm font-medium text-purple-100">
                  {openNpcRequestCount} open requests
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTravelLogOpen(true)}
                className="rounded-2xl bg-emerald-700 px-4 py-4 text-left text-white font-semibold shadow sm:col-span-2"
              >
                Travel Log
                <div className="mt-1 text-sm font-medium text-emerald-100">
                  {travelLog.length} recent entries
                </div>
              </button>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/creatures" className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow">View Creatures</Link>
          <Link href="/breeding" className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow">Go to Breeding</Link>
          <Link href="/eggs" className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow">View Eggs</Link>
        </div>
      </div>

      <PopupWindow open={sellerOpen} onClose={() => setSellerOpen(false)} title="Creature Seller">
        {townStock.length === 0 ? (
          <div className="rounded-2xl bg-amber-50 p-4 text-stone-700">
            The seller is sold out for today.
          </div>
        ) : (
          <div className="space-y-4">
            {townStock.map((entry) => (
              <div key={entry.id} className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">{entry.creature.nickname}</h3>
                    <p className="text-stone-700">{entry.creature.name} • Lv {entry.creature.level}</p>
                    <p className="text-sm text-stone-500">Theme: {entry.creature.theme}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {entry.creature.traits.map((traitEntry, index) => (
                        <div key={`${entry.id}-${traitEntry.trait}-${index}`} className={`inline-block rounded-full border px-2 py-1 text-xs font-semibold ${getTraitClasses(traitEntry.trait)}`}>
                          {getTraitLabel(traitEntry.trait)} {traitEntry.grade}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-900">{entry.price} Gold</p>
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
                    playerData.gold >= entry.price ? "bg-amber-700" : "bg-gray-500"
                  }`}
                >
                  {playerData.gold >= entry.price ? "Buy Creature" : "Not Enough Gold"}
                </button>
              </div>
            ))}
          </div>
        )}
      </PopupWindow>

      <PopupWindow open={boardOpen} onClose={() => setBoardOpen(false)} title="Breeding Quest Board">
        <div className="space-y-4">
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
              if (quest.requirement.species !== "any" && creature.name !== quest.requirement.species) return false;
              if (creature.level < quest.requirement.minimumLevel) return false;
              if (quest.requirement.requiredTrait && !creature.traits.some((entry) => entry.trait === quest.requirement.requiredTrait)) return false;

              const minimumStats = quest.requirement.minimumStats;
              if (minimumStats.strength !== undefined && creature.stats.strength < minimumStats.strength) return false;
              if (minimumStats.endurance !== undefined && creature.stats.endurance < minimumStats.endurance) return false;
              if (minimumStats.intelligence !== undefined && creature.stats.intelligence < minimumStats.intelligence) return false;
              if (minimumStats.speed !== undefined && creature.stats.speed < minimumStats.speed) return false;
              if (minimumStats.fertility !== undefined && creature.stats.fertility < minimumStats.fertility) return false;
              if (minimumStats.vitality !== undefined && creature.stats.vitality < minimumStats.vitality) return false;
              if (quest.title === "Healthy Bloodline" && creature.inbreedingRisk !== "none") return false;

              return true;
            });

            return (
              <div key={quest.id} className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">{quest.title}</h3>
                    <p className="text-stone-700">{quest.description}</p>
                  </div>

                  <div className="flex flex-col gap-2 text-right text-sm">
                    {quest.completed ? (
                      <span className="rounded-full border border-green-300 bg-green-100 px-3 py-1 font-semibold text-green-900">Completed</span>
                    ) : expired ? (
                      <span className="rounded-full border border-red-300 bg-red-100 px-3 py-1 font-semibold text-red-900">Expired</span>
                    ) : expiringSoon ? (
                      <span className="rounded-full border border-orange-300 bg-orange-100 px-3 py-1 font-semibold text-orange-900">Expires Soon</span>
                    ) : (
                      <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 font-semibold text-amber-900">Open</span>
                    )}
                  </div>
                </div>

                <div className="mb-3 rounded-2xl bg-white/80 p-3 text-sm text-stone-800">
                  <p><strong>Species:</strong> {quest.requirement.species}</p>
                  <p><strong>Minimum Level:</strong> {quest.requirement.minimumLevel}</p>
                  <p><strong>Required Trait:</strong> {quest.requirement.requiredTrait ? getTraitLabel(quest.requirement.requiredTrait) : "None"}</p>
                  <p><strong>Deadline:</strong> Day {quest.deadlineDay} {formatTime(quest.deadlineHour, quest.deadlineMinute)}</p>
                  <p><strong>Rewards:</strong> {quest.rewardGold} Gold, {quest.rewardXp} Player XP</p>
                </div>

                {quest.completed || expired ? null : eligibleCreatures.length === 0 ? (
                  <p className="text-sm font-semibold text-red-700">No eligible creatures available right now.</p>
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
      </PopupWindow>

      <PopupWindow open={relationshipsOpen} onClose={() => setRelationshipsOpen(false)} title="Town Relationships" maxWidth="max-w-4xl">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {townNpcs.map((npc) => (
            <div key={npc.id} className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-stone-900">{npc.name}</p>
                  <p className="text-sm text-stone-600">{npc.role}</p>
                </div>
                <span className="rounded-full border border-rose-300 bg-white px-3 py-1 text-xs font-semibold text-rose-900">
                  {getRelationshipTierLabel(npc.relationship)}
                </span>
              </div>

              <p className="mt-2 text-sm text-stone-700">{npc.personality}</p>
              <p className="mt-3 text-sm text-stone-800"><strong>Relationship:</strong> {npc.relationship}/100</p>

              <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-rose-600" style={{ width: `${Math.min(100, npc.relationship)}%` }} />
              </div>

              <p className="mt-3 text-xs text-stone-600">Milestones: 25 / 50 / 75 relationship award bonus gold once.</p>
            </div>
          ))}
        </div>
      </PopupWindow>

      <PopupWindow open={npcRequestsOpen} onClose={() => setNpcRequestsOpen(false)} title="NPC Requests">
        <div className="space-y-4">
          {townNpcQuests.map((quest) => {
            const expired = isExpired(
              currentDay,
              currentHour,
              currentMinute,
              quest.deadlineDay,
              quest.deadlineHour,
              quest.deadlineMinute
            );

            const eligibleCreatures = creatures.filter((creature) => {
              if (quest.completed || expired) return false;
              if (quest.requirement.species !== "any" && creature.name !== quest.requirement.species) return false;
              if (creature.level < quest.requirement.minimumLevel) return false;
              if (quest.requirement.requiredTrait && !creature.traits.some((entry) => entry.trait === quest.requirement.requiredTrait)) return false;

              const minimumStats = quest.requirement.minimumStats;
              if (minimumStats.strength !== undefined && creature.stats.strength < minimumStats.strength) return false;
              if (minimumStats.endurance !== undefined && creature.stats.endurance < minimumStats.endurance) return false;
              if (minimumStats.intelligence !== undefined && creature.stats.intelligence < minimumStats.intelligence) return false;
              if (minimumStats.speed !== undefined && creature.stats.speed < minimumStats.speed) return false;
              if (minimumStats.fertility !== undefined && creature.stats.fertility < minimumStats.fertility) return false;
              if (minimumStats.vitality !== undefined && creature.stats.vitality < minimumStats.vitality) return false;

              return true;
            });

            return (
              <div key={quest.id} className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-purple-800">{quest.npcName}</p>
                    <h3 className="text-xl font-bold text-stone-900">{quest.title}</h3>
                    <p className="text-stone-700">{quest.description}</p>
                  </div>

                  <div className="text-right text-sm">
                    {quest.completed ? (
                      <span className="rounded-full border border-green-300 bg-green-100 px-3 py-1 font-semibold text-green-900">Completed</span>
                    ) : expired ? (
                      <span className="rounded-full border border-red-300 bg-red-100 px-3 py-1 font-semibold text-red-900">Expired</span>
                    ) : (
                      <span className="rounded-full border border-purple-300 bg-white px-3 py-1 font-semibold text-purple-900">Open</span>
                    )}
                  </div>
                </div>

                <div className="mb-3 rounded-2xl bg-white/80 p-3 text-sm text-stone-800">
                  <p><strong>Species:</strong> {quest.requirement.species}</p>
                  <p><strong>Minimum Level:</strong> {quest.requirement.minimumLevel}</p>
                  <p><strong>Required Trait:</strong> {quest.requirement.requiredTrait ? getTraitLabel(quest.requirement.requiredTrait) : "None"}</p>
                  <p><strong>Deadline:</strong> Day {quest.deadlineDay} {formatTime(quest.deadlineHour, quest.deadlineMinute)}</p>
                  <p><strong>Rewards:</strong> {quest.rewardGold} Gold, {quest.rewardXp} XP, +{quest.relationshipGain} Relationship</p>
                </div>

                {quest.completed || expired ? null : eligibleCreatures.length === 0 ? (
                  <p className="text-sm font-semibold text-red-700">No eligible creatures available right now.</p>
                ) : (
                  <div className="space-y-2">
                    {eligibleCreatures.map((creature) => (
                      <button
                        key={creature.id}
                        onClick={() => submitCreatureToNpcQuest(quest.id, creature.id)}
                        className="w-full rounded-2xl bg-purple-700 px-4 py-3 text-left font-semibold text-white shadow"
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
      </PopupWindow>

      <PopupWindow open={travelLogOpen} onClose={() => setTravelLogOpen(false)} title="Travel Log" maxWidth="max-w-3xl">
        {travelLog.length === 0 ? (
          <div className="rounded-2xl bg-emerald-50 p-4 text-stone-700">No travel logged yet.</div>
        ) : (
          <div className="space-y-3">
            {travelLog.map((entry) => (
              <div key={entry.id} className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
                <p className="font-semibold text-stone-900">{entry.from} → {entry.to}</p>
                <p className="text-sm text-stone-700">Day {entry.day}, {formatTime(entry.hour, entry.minute)}</p>
                <p className="text-sm text-stone-600">Travel time: {entry.minutesSpent} minutes</p>
              </div>
            ))}
          </div>
        )}
      </PopupWindow>
    </main>
  );
}
