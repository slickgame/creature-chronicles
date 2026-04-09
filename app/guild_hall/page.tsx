"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import { HubCard, PopupWindow } from "@/components/town/TownUi";

function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${suffix}`;
}

function getRelationshipTierLabel(relationship: number) {
  if (relationship >= 75) return "Close";
  if (relationship >= 50) return "Trusted";
  if (relationship >= 25) return "Friendly";
  return "Stranger";
}

export default function GuildHallPage() {
  const router = useRouter();
  const {
    currentDay,
    currentHour,
    currentMinute,
    currentLocation,
    playerData,
    townNpcs,
    townNpcQuests,
    travelTo,
  } = useGame();

  const [jobsOpen, setJobsOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [noticesOpen, setNoticesOpen] = useState(false);

  function handleTravelTo(destination: "town" | "ranch" | "guild_hall") {
    travelTo(destination);

    if (destination === "town") {
      router.push("/town");
      return;
    }

    if (destination === "ranch") {
      router.push("/ranch");
      return;
    }

    router.push("/guild_hall");
  }

  const activeNpcRequests = useMemo(() => {
    return townNpcQuests.filter((quest) => !quest.completed);
  }, [townNpcQuests]);

  const strongestBond = useMemo(() => {
    if (townNpcs.length === 0) return null;
    return [...townNpcs].sort((a, b) => b.relationship - a.relationship)[0];
  }, [townNpcs]);

  return (
    <>
      <main className="min-h-screen overflow-hidden bg-gradient-to-b from-indigo-100 to-violet-200 p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-6 text-4xl font-bold text-violet-900">🏛️ Guild Hall</h1>

          <div className="mb-6 rounded-3xl border-4 border-violet-900 bg-white/85 p-6 shadow-xl">
            <div className="grid gap-3 text-lg text-stone-800 sm:grid-cols-2 lg:grid-cols-4">
              <p><strong>Day:</strong> {currentDay}</p>
              <p><strong>Time:</strong> {formatTime(currentHour, currentMinute)}</p>
              <p><strong>Location:</strong> {currentLocation}</p>
              <p><strong>Gold:</strong> {playerData.gold}</p>
              <p><strong>Player Level:</strong> {playerData.level}</p>
              <p><strong>Player XP:</strong> {playerData.xp}/{playerData.xpToNextLevel}</p>
              <p><strong>Guild Contacts:</strong> {townNpcs.length}</p>
              <p><strong>Open Requests:</strong> {activeNpcRequests.length}</p>
            </div>
          </div>

          <section className="mb-6 rounded-3xl border-4 border-violet-900 bg-white/85 p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-violet-900">Guild Destinations</h2>
              <p className="mt-1 text-stone-600">
                Navigate the guild hall through hub cards instead of plain section blocks.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <HubCard
                icon="📋"
                title="Guild Jobs"
                subtitle="Open personal requests, job leads, and future contract work."
                meta={`${activeNpcRequests.length} active requests`}
                accentClasses="border-violet-300 bg-violet-50"
                onClick={() => setJobsOpen(true)}
              />

              <HubCard
                icon="👥"
                title="Members"
                subtitle="Track town contacts, bond levels, and trusted allies."
                meta={strongestBond ? `Best bond: ${strongestBond.name}` : "No tracked contacts"}
                accentClasses="border-sky-300 bg-sky-50"
                onClick={() => setMembersOpen(true)}
              />

              <HubCard
                icon="📌"
                title="Notices"
                subtitle="Preview ranks, exams, organization events, and future guild systems."
                meta="Future guild progression hub"
                accentClasses="border-amber-300 bg-amber-50"
                onClick={() => setNoticesOpen(true)}
              />
            </div>
          </section>

          <section className="mb-6 rounded-3xl border-4 border-stone-900 bg-white/85 p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-stone-900">Travel</h2>
              <p className="mt-1 text-stone-600">
                Return to town or head back to the ranch from the guild hall.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <HubCard
                icon="🏘️"
                title="Town"
                subtitle="Return to the central town hub."
                meta="Travel back to town"
                accentClasses="border-stone-300 bg-stone-50"
                onClick={() => handleTravelTo("town")}
              />

              <HubCard
                icon="🌿"
                title="Ranch"
                subtitle="Head home to creatures, eggs, and daily management."
                meta="Travel back to ranch"
                accentClasses="border-emerald-300 bg-emerald-50"
                onClick={() => handleTravelTo("ranch")}
              />

              <HubCard
                icon="🏛️"
                title="Current Location"
                subtitle="You are already inside the guild hall."
                meta="No travel needed"
                accentClasses="border-violet-300 bg-violet-50"
                onClick={() => {}}
              />
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/town" className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow">Town</Link>
            <Link href="/ranch" className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow">Ranch</Link>
            <Link href="/breeding" className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow">Breeding</Link>
            <Link href="/breeding/history" className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow">History</Link>
          </div>
        </div>
      </main>

      <PopupWindow open={jobsOpen} onClose={() => setJobsOpen(false)} title="Guild Job Board">
        {activeNpcRequests.length === 0 ? (
          <div className="rounded-2xl bg-violet-50 p-4 text-stone-700">No active guild-linked requests right now.</div>
        ) : (
          <div className="space-y-4">
            {activeNpcRequests.map((quest) => (
              <div key={quest.id} className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-4">
                <p className="text-sm font-semibold text-violet-800">{quest.npcName}</p>
                <h3 className="text-xl font-bold text-stone-900">{quest.title}</h3>
                <p className="mt-1 text-stone-700">{quest.description}</p>

                <div className="mt-3 rounded-2xl bg-white/80 p-3 text-sm text-stone-800">
                  <p><strong>Species:</strong> {quest.requirement.species}</p>
                  <p><strong>Minimum Level:</strong> {quest.requirement.minimumLevel}</p>
                  <p><strong>Rewards:</strong> {quest.rewardGold} Gold, {quest.rewardXp} XP, +{quest.relationshipGain} Relationship</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopupWindow>

      <PopupWindow open={membersOpen} onClose={() => setMembersOpen(false)} title="Guild Contacts" maxWidth="max-w-4xl">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {townNpcs.map((npc) => (
            <div key={npc.id} className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-stone-900">{npc.name}</p>
                  <p className="text-sm text-stone-600">{npc.role}</p>
                </div>
                <span className="rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-semibold text-sky-900">
                  {getRelationshipTierLabel(npc.relationship)}
                </span>
              </div>

              <p className="mt-2 text-sm text-stone-700">{npc.personality}</p>
              <p className="mt-3 text-sm text-stone-800">
                <strong>Relationship:</strong> {npc.relationship}/100
              </p>

              <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-sky-600" style={{ width: `${Math.min(100, npc.relationship)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </PopupWindow>

      <PopupWindow open={noticesOpen} onClose={() => setNoticesOpen(false)} title="Guild Notices" maxWidth="max-w-3xl">
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
            <h3 className="text-xl font-bold text-stone-900">Planned Guild Features</h3>
            <div className="mt-3 grid gap-2 text-sm text-stone-700">
              <p>• Membership ranks and unlocks</p>
              <p>• Rotating guild jobs and exams</p>
              <p>• Faction-specific perks and progression</p>
              <p>• Guild event notices and special weeks</p>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
            <h3 className="text-xl font-bold text-stone-900">Current Hall Use</h3>
            <p className="mt-2 text-stone-700">
              This page now gives the guild hall a proper destination route, so the travel button is no longer just a placeholder.
            </p>
          </div>
        </div>
      </PopupWindow>
    </>
  );
}
