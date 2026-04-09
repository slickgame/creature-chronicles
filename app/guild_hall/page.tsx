"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGame } from "@/context/GameContext";

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

function PopupWindow({
  open,
  title,
  onClose,
  children,
  maxWidth = "max-w-5xl",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className={`flex h-[88vh] w-full ${maxWidth} flex-col overflow-hidden rounded-3xl border-4 border-stone-900 bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-stone-800 px-4 py-2 text-sm font-semibold text-white shadow"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
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

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button
                onClick={() => handleTravelTo("town")}
                className="rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
              >
                Return to Town
              </button>
              <button
                onClick={() => handleTravelTo("ranch")}
                className="rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
              >
                Travel to Ranch
              </button>
              <button
                onClick={() => handleTravelTo("guild_hall")}
                disabled
                className="rounded-2xl bg-gray-500 px-4 py-3 text-white font-semibold shadow"
              >
                Already at Guild Hall
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-3xl border-4 border-violet-800 bg-white/85 p-6 shadow-xl">
              <h2 className="mb-2 text-3xl font-bold text-violet-900">📋 Guild Jobs</h2>
              <p className="mb-5 text-stone-600">
                Requests, contract leads, and future guild progression all live behind one popup.
              </p>

              <button
                type="button"
                onClick={() => setJobsOpen(true)}
                className="w-full rounded-2xl bg-violet-700 px-4 py-4 text-left text-white font-semibold shadow"
              >
                Open Job Board
                <div className="mt-1 text-sm font-medium text-violet-100">
                  {activeNpcRequests.length} active personal requests
                </div>
              </button>
            </section>

            <section className="rounded-3xl border-4 border-sky-800 bg-white/85 p-6 shadow-xl">
              <h2 className="mb-2 text-3xl font-bold text-sky-900">👥 Members</h2>
              <p className="mb-5 text-stone-600">
                Track important town contacts and who you are building trust with.
              </p>

              <button
                type="button"
                onClick={() => setMembersOpen(true)}
                className="w-full rounded-2xl bg-sky-700 px-4 py-4 text-left text-white font-semibold shadow"
              >
                Open Member List
                <div className="mt-1 text-sm font-medium text-sky-100">
                  {strongestBond ? `Best bond: ${strongestBond.name}` : "No tracked contacts"}
                </div>
              </button>
            </section>

            <section className="rounded-3xl border-4 border-amber-800 bg-white/85 p-6 shadow-xl">
              <h2 className="mb-2 text-3xl font-bold text-amber-900">📌 Notices</h2>
              <p className="mb-5 text-stone-600">
                This board is the future home for guild ranks, exams, and rotating organization events.
              </p>

              <button
                type="button"
                onClick={() => setNoticesOpen(true)}
                className="w-full rounded-2xl bg-amber-700 px-4 py-4 text-left text-white font-semibold shadow"
              >
                Open Guild Notices
                <div className="mt-1 text-sm font-medium text-amber-100">
                  Preview future guild systems
                </div>
              </button>
            </section>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/town"
              className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
            >
              Town
            </Link>
            <Link
              href="/ranch"
              className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
            >
              Ranch
            </Link>
            <Link
              href="/breeding"
              className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
            >
              Breeding
            </Link>
            <Link
              href="/breeding/history"
              className="rounded-2xl bg-stone-800 px-4 py-4 text-center text-white font-semibold shadow"
            >
              History
            </Link>
          </div>
        </div>
      </main>

      <PopupWindow
        open={jobsOpen}
        onClose={() => setJobsOpen(false)}
        title="Guild Job Board"
      >
        {activeNpcRequests.length === 0 ? (
          <div className="rounded-2xl bg-violet-50 p-4 text-stone-700">
            No active guild-linked requests right now.
          </div>
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

      <PopupWindow
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        title="Guild Contacts"
        maxWidth="max-w-4xl"
      >
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
                <div
                  className="h-full rounded-full bg-sky-600"
                  style={{ width: `${Math.min(100, npc.relationship)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </PopupWindow>

      <PopupWindow
        open={noticesOpen}
        onClose={() => setNoticesOpen(false)}
        title="Guild Notices"
        maxWidth="max-w-3xl"
      >
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
