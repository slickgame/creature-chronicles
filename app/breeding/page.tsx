"use client";

import Image from "next/image";
import Link from "next/link";
import { useGame } from "@/context/GameContext";

export default function BreedingPage() {
  const {
    breedCreatures,
    playerData,
    homeState,
    breedingSelection,
    setBreedingSelection,
    creatures,
    currentDay,
    currentHour,
    currentMinute,
  } = useGame();

  const canAffordBreed = playerData.energy >= 8;

  const giverCreature = breedingSelection.giverCreatureId
    ? creatures.find((c) => c.id === breedingSelection.giverCreatureId) ?? null
    : null;

  const receiverCreature = breedingSelection.receiverCreatureId
    ? creatures.find((c) => c.id === breedingSelection.receiverCreatureId) ?? null
    : null;

  const giverLabel =
    breedingSelection.giverType === "player"
      ? playerData.name
      : giverCreature?.nickname ?? "None";

  const receiverLabel =
    breedingSelection.receiverType === "player"
      ? playerData.name
      : receiverCreature?.nickname ?? "None";

  const sameCreatureSelected =
    breedingSelection.giverType === "creature" &&
    breedingSelection.receiverType === "creature" &&
    breedingSelection.giverCreatureId !== null &&
    breedingSelection.giverCreatureId === breedingSelection.receiverCreatureId;

  function isParentChild() {
    if (
      breedingSelection.giverType === "player" &&
      receiverCreature &&
      (receiverCreature.giverIsPlayer || receiverCreature.receiverIsPlayer)
    ) {
      return true;
    }

    if (
      breedingSelection.receiverType === "player" &&
      giverCreature &&
      (giverCreature.giverIsPlayer || giverCreature.receiverIsPlayer)
    ) {
      return true;
    }

    if (!giverCreature || !receiverCreature) return false;

    return (
      giverCreature.id === receiverCreature.giverId ||
      giverCreature.id === receiverCreature.receiverId ||
      receiverCreature.id === giverCreature.giverId ||
      receiverCreature.id === giverCreature.receiverId
    );
  }

  function isFullSibling() {
    if (!giverCreature || !receiverCreature) return false;

    const sameGiverSide =
      (giverCreature.giverId !== null &&
        giverCreature.giverId === receiverCreature.giverId) ||
      (giverCreature.giverIsPlayer && receiverCreature.giverIsPlayer);

    const sameReceiverSide =
      (giverCreature.receiverId !== null &&
        giverCreature.receiverId === receiverCreature.receiverId) ||
      (giverCreature.receiverIsPlayer && receiverCreature.receiverIsPlayer);

    return sameGiverSide && sameReceiverSide;
  }

  function isHalfSibling() {
    if (!giverCreature || !receiverCreature) return false;
    if (isParentChild() || isFullSibling()) return false;

    const sameGiverSide =
      (giverCreature.giverId !== null &&
        giverCreature.giverId === receiverCreature.giverId) ||
      (giverCreature.giverIsPlayer && receiverCreature.giverIsPlayer);

    const sameReceiverSide =
      (giverCreature.receiverId !== null &&
        giverCreature.receiverId === receiverCreature.receiverId) ||
      (giverCreature.receiverIsPlayer && receiverCreature.receiverIsPlayer);

    return sameGiverSide || sameReceiverSide;
  }

  function getBreedingMinutes() {
    const speeds = [giverCreature?.stats.speed, receiverCreature?.stats.speed]
      .filter((value): value is number => typeof value === "number");

    if (speeds.length === 0) return 120;

    const avgSpeed =
      speeds.reduce((sum, value) => sum + value, 0) / speeds.length;

    return Math.max(30, 120 - Math.round(avgSpeed * 6));
  }

  function getCreatureStaminaCost(creatureId: number | null) {
    if (!creatureId) return null;
    const creature = creatures.find((c) => c.id === creatureId);
    if (!creature) return null;
    return Math.max(8, 22 - Math.floor(creature.stats.endurance / 2));
  }

  function getRefusalRiskLabel() {
    const happinessValues = [giverCreature?.happiness, receiverCreature?.happiness]
      .filter((value): value is number => typeof value === "number");

    const avgHappiness =
      happinessValues.length > 0
        ? happinessValues.reduce((sum, value) => sum + value, 0) / happinessValues.length
        : 60;

    if (avgHappiness < 20 || homeState.cleanliness < 25 || homeState.foodStock <= 0) {
      return "High";
    }

    if (avgHappiness < 50 || homeState.cleanliness < 50 || homeState.foodStock <= 2) {
      return "Moderate";
    }

    return "Low";
  }

  const refusalRiskLabel = getRefusalRiskLabel();

  const parentChildWarning = isParentChild();
  const fullSiblingWarning = isFullSibling();
  const halfSiblingWarning = isHalfSibling();

  const hasValidSelection =
    (breedingSelection.giverType === "player" ||
      breedingSelection.giverCreatureId !== null) &&
    (breedingSelection.receiverType === "player" ||
      breedingSelection.receiverCreatureId !== null) &&
    !sameCreatureSelected;

  const giverCreatureReady =
    !giverCreature ||
    (giverCreature.breedingsToday < giverCreature.dailyBreedingLimit &&
      giverCreature.breedingStamina >=
        Math.max(8, 22 - Math.floor(giverCreature.stats.endurance / 2)));

  const receiverCreatureReady =
    !receiverCreature ||
    (receiverCreature.breedingsToday < receiverCreature.dailyBreedingLimit &&
      receiverCreature.breedingStamina >=
        Math.max(8, 22 - Math.floor(receiverCreature.stats.endurance / 2)));

  const canBreed =
    canAffordBreed && hasValidSelection && giverCreatureReady && receiverCreatureReady;

  const playerIsReceiver = breedingSelection.receiverType === "player";

  function getCreatureImage(name: string) {
    if (name === "Horse") return "/images/horse.png";
    if (name === "Cat") return "/images/cat.png";
    return "/images/egg.png";
  }

  function formatTime(hour: number, minute: number) {
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMinute = minute.toString().padStart(2, "0");
    return `${displayHour}:${displayMinute} ${suffix}`;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-100 to-rose-200 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-4xl font-bold text-rose-900">💞 Breeding</h1>

        <div className="mb-4 rounded-2xl border-2 border-rose-300 bg-white/80 p-4 text-stone-800 shadow">
          <p><strong>Current Time:</strong> Day {currentDay}, {formatTime(currentHour, currentMinute)}</p>
          <p><strong>Player Energy:</strong> {playerData.energy}</p>
          <p><strong>Session Time Cost:</strong> {getBreedingMinutes()} minutes</p>
          <p><strong>Gold Cost:</strong> None</p>
          <p><strong>Home Cleanliness:</strong> {homeState.cleanliness}/100</p>
          <p><strong>Food Stock:</strong> {homeState.foodStock}</p>
          <p><strong>Estimated Refusal Risk:</strong> {refusalRiskLabel}</p>
        </div>

        <div className="rounded-3xl border-4 border-rose-900 bg-white/85 p-6 shadow-xl">
          <div className="mb-6">
            <h2 className="mb-3 text-2xl font-bold text-rose-950">Choose Giver</h2>

            <div className="mb-4">
              <button
                onClick={() =>
                  setBreedingSelection({
                    ...breedingSelection,
                    giverType: "player",
                    giverCreatureId: null,
                  })
                }
                className={`w-full rounded-3xl border-4 p-4 text-left shadow transition sm:w-72 ${
                  breedingSelection.giverType === "player"
                    ? "border-rose-700 bg-rose-100"
                    : "border-rose-200 bg-white hover:border-rose-400"
                }`}
              >
                <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-stone-100">
                  <Image
                    src="/images/player.png"
                    alt="Player"
                    width={300}
                    height={300}
                    className="max-h-full w-auto object-contain"
                  />
                </div>
                <p className="text-xl font-bold text-stone-900">{playerData.name}</p>
                <p className="text-sm text-stone-600">Player</p>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {creatures.map((creature) => {
                const isSelected =
                  breedingSelection.giverType === "creature" &&
                  breedingSelection.giverCreatureId === creature.id;

                return (
                  <button
                    key={creature.id}
                    onClick={() =>
                      setBreedingSelection({
                        ...breedingSelection,
                        giverType: "creature",
                        giverCreatureId: creature.id,
                      })
                    }
                    className={`rounded-3xl border-4 p-4 text-left shadow transition ${
                      isSelected
                        ? "border-rose-700 bg-rose-100"
                        : "border-rose-200 bg-white hover:border-rose-400"
                    }`}
                  >
                    <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-stone-100">
                      <Image
                        src={getCreatureImage(creature.name)}
                        alt={creature.name}
                        width={300}
                        height={300}
                        className="max-h-full w-auto object-contain"
                      />
                    </div>
                    <p className="text-xl font-bold text-stone-900">
                      {creature.nickname}
                    </p>
                    <p className="text-sm text-stone-600">
                      {creature.name} • Lv {creature.level} • Gen {creature.generation}
                    </p>
                    <p className="text-sm text-stone-600">
                      Happiness {creature.happiness}/100 • Breeding Care Lv {creature.skills.breedingCare.level}
                    </p>
                    <p className="text-sm text-stone-600">
                      Stamina {creature.breedingStamina}/{creature.maxBreedingStamina} • Uses {creature.breedingsToday}/{creature.dailyBreedingLimit}
                    </p>
                    <p className="text-xs text-stone-500">
                      Cost: {getCreatureStaminaCost(creature.id)} stamina
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="mb-3 text-2xl font-bold text-rose-950">
              Choose Receiver
            </h2>

            <div className="mb-4">
              <button
                onClick={() =>
                  setBreedingSelection({
                    ...breedingSelection,
                    receiverType: "player",
                    receiverCreatureId: null,
                  })
                }
                className={`w-full rounded-3xl border-4 p-4 text-left shadow transition sm:w-72 ${
                  breedingSelection.receiverType === "player"
                    ? "border-rose-700 bg-rose-100"
                    : "border-rose-200 bg-white hover:border-rose-400"
                }`}
              >
                <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-stone-100">
                  <Image
                    src="/images/player.png"
                    alt="Player"
                    width={300}
                    height={300}
                    className="max-h-full w-auto object-contain"
                  />
                </div>
                <p className="text-xl font-bold text-stone-900">{playerData.name}</p>
                <p className="text-sm text-stone-600">Player</p>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {creatures.map((creature) => {
                const isSelected =
                  breedingSelection.receiverType === "creature" &&
                  breedingSelection.receiverCreatureId === creature.id;

                return (
                  <button
                    key={creature.id}
                    onClick={() =>
                      setBreedingSelection({
                        ...breedingSelection,
                        receiverType: "creature",
                        receiverCreatureId: creature.id,
                      })
                    }
                    className={`rounded-3xl border-4 p-4 text-left shadow transition ${
                      isSelected
                        ? "border-rose-700 bg-rose-100"
                        : "border-rose-200 bg-white hover:border-rose-400"
                    }`}
                  >
                    <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-stone-100">
                      <Image
                        src={getCreatureImage(creature.name)}
                        alt={creature.name}
                        width={300}
                        height={300}
                        className="max-h-full w-auto object-contain"
                      />
                    </div>
                    <p className="text-xl font-bold text-stone-900">
                      {creature.nickname}
                    </p>
                    <p className="text-sm text-stone-600">
                      {creature.name} • Lv {creature.level} • Gen {creature.generation}
                    </p>
                    <p className="text-sm text-stone-600">
                      Happiness {creature.happiness}/100 • Breeding Care Lv {creature.skills.breedingCare.level}
                    </p>
                    <p className="text-sm text-stone-600">
                      Stamina {creature.breedingStamina}/{creature.maxBreedingStamina} • Uses {creature.breedingsToday}/{creature.dailyBreedingLimit}
                    </p>
                    <p className="text-xs text-stone-500">
                      Cost: {getCreatureStaminaCost(creature.id)} stamina
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-5 rounded-2xl bg-rose-50 p-4 space-y-2">
            <p>
              <strong>Current Pair:</strong> {giverLabel} → {receiverLabel}
            </p>
            <p>
              <strong>Breeding Cost:</strong> 8 Player Energy + stamina from selected creatures
            </p>
            <p>
              <strong>Speed Effect:</strong> Higher speed reduces session time.
            </p>
            <p>
              <strong>Intelligence Effect:</strong> Helps mitigate genetic risk.
            </p>
            <p>
              <strong>Breeding Care Skill:</strong> Helps reduce refusal chance.
            </p>
            <p>
              <strong>Home Effect:</strong> Dirty homes and low food increase refusal risk and hurt happiness.
            </p>

            {playerIsReceiver && (
              <div className="rounded-xl border-2 border-amber-500 bg-amber-100 p-3 text-amber-900">
                <p className="font-semibold">Notice</p>
                <p>
                  If Player is selected as the receiver, breeding will not produce
                  an egg.
                </p>
              </div>
            )}

            {sameCreatureSelected && (
              <p className="font-semibold text-red-700">
                The same creature cannot be both giver and receiver.
              </p>
            )}

            {!giverCreatureReady && giverCreature && (
              <p className="font-semibold text-red-700">
                {giverCreature.nickname} does not have enough stamina or has reached the daily breeding limit.
              </p>
            )}

            {!receiverCreatureReady && receiverCreature && (
              <p className="font-semibold text-red-700">
                {receiverCreature.nickname} does not have enough stamina or has reached the daily breeding limit.
              </p>
            )}

            {homeState.cleanliness < 25 && (
              <div className="rounded-xl border-2 border-red-500 bg-red-100 p-3 text-red-900">
                <p className="font-semibold">Home Condition Warning</p>
                <p>
                  Your home is filthy. Refusal chance is heavily increased and creature happiness will keep dropping.
                </p>
              </div>
            )}

            {homeState.foodStock <= 0 && (
              <div className="rounded-xl border-2 border-red-500 bg-red-100 p-3 text-red-900">
                <p className="font-semibold">Food Warning</p>
                <p>
                  Food stock is empty. Unfed creatures are less happy and more likely to refuse breeding.
                </p>
              </div>
            )}

            {giverCreature && giverCreature.happiness < 35 && (
              <p className="font-semibold text-red-700">
                {giverCreature.nickname} is unhappy and may refuse.
              </p>
            )}

            {receiverCreature && receiverCreature.happiness < 35 && (
              <p className="font-semibold text-red-700">
                {receiverCreature.nickname} is unhappy and may refuse.
              </p>
            )}

            {parentChildWarning && !sameCreatureSelected && (
              <div className="rounded-xl border-2 border-red-500 bg-red-100 p-3 text-red-900">
                <p className="font-semibold">Family Warning</p>
                <p>
                  These creatures appear to be a direct parent and child. Breeding is
                  allowed, but offspring can hatch with a severe negative inherited trait.
                </p>
              </div>
            )}

            {fullSiblingWarning && !sameCreatureSelected && (
              <div className="rounded-xl border-2 border-red-500 bg-red-100 p-3 text-red-900">
                <p className="font-semibold">Family Warning</p>
                <p>
                  These creatures appear to be full siblings. Breeding is allowed, but offspring can hatch with a severe negative inherited trait.
                </p>
              </div>
            )}

            {halfSiblingWarning && !sameCreatureSelected && (
              <div className="rounded-xl border-2 border-amber-500 bg-amber-100 p-3 text-amber-900">
                <p className="font-semibold">Family Warning</p>
                <p>
                  These creatures appear to be half siblings. Breeding is allowed, but offspring can hatch with a mild negative inherited trait.
                </p>
              </div>
            )}
          </div>

          <div className="mb-5 rounded-2xl bg-stone-100 p-4 space-y-1">
            <p><strong>Your Gold:</strong> {playerData.gold}</p>
            <p><strong>Your Energy:</strong> {playerData.energy}</p>
            <p><strong>Current Time:</strong> Day {currentDay}, {formatTime(currentHour, currentMinute)}</p>
            <p><strong>Home Cleanliness:</strong> {homeState.cleanliness}/100</p>
            <p><strong>Food Stock:</strong> {homeState.foodStock}</p>
          </div>

          <button
            onClick={breedCreatures}
            disabled={!canBreed}
            className={`w-full rounded-2xl px-4 py-3 text-white font-semibold shadow ${
              canBreed ? "bg-pink-600" : "bg-gray-500"
            }`}
          >
            {canBreed ? "Breed" : "Cannot Breed"}
          </button>
        </div>

        <div className="mt-6">
          <Link
            href="/ranch"
            className="inline-block rounded-2xl bg-stone-800 px-5 py-3 text-white font-semibold shadow"
          >
            Back to Ranch
          </Link>
        </div>
      </div>
    </main>
  );
}