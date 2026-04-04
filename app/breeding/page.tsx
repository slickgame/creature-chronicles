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

  function getAverageHappiness() {
    const happinessValues = [giverCreature?.happiness, receiverCreature?.happiness]
      .filter((value): value is number => typeof value === "number");

    if (happinessValues.length === 0) return 60;

    return (
      happinessValues.reduce((sum, value) => sum + value, 0) /
      happinessValues.length
    );
  }

  function getAverageBreedingCare() {
    const skillValues = [
      giverCreature?.skills.breedingCare.level,
      receiverCreature?.skills.breedingCare.level,
    ].filter((value): value is number => typeof value === "number");

    if (skillValues.length === 0) return 1;

    return skillValues.reduce((sum, value) => sum + value, 0) / skillValues.length;
  }

  function getRefusalChanceEstimate() {
    let refusalChance = 0;

    const avgHappiness = getAverageHappiness();
    const avgBreedingCare = getAverageBreedingCare();

    if (avgHappiness < 20) {
      refusalChance += 0.45;
    } else if (avgHappiness < 35) {
      refusalChance += 0.28;
    } else if (avgHappiness < 50) {
      refusalChance += 0.14;
    }

    if (homeState.cleanliness < 25) {
      refusalChance += 0.25;
    } else if (homeState.cleanliness < 50) {
      refusalChance += 0.12;
    }

    if (homeState.foodStock <= 0) {
      refusalChance += 0.15;
    } else if (homeState.foodStock <= 2) {
      refusalChance += 0.06;
    }

    refusalChance -= Math.min(0.12, avgBreedingCare * 0.015);

    refusalChance = Math.max(0, Math.min(0.75, refusalChance));

    return refusalChance;
  }

  function getRefusalRiskLabel() {
    const chance = getRefusalChanceEstimate();

    if (chance >= 0.4) return "High";
    if (chance >= 0.18) return "Moderate";
    return "Low";
  }

  function getRefusalRiskClasses() {
    const chance = getRefusalChanceEstimate();

    if (chance >= 0.4) {
      return "bg-red-100 text-red-900 border-red-300";
    }

    if (chance >= 0.18) {
      return "bg-amber-100 text-amber-900 border-amber-300";
    }

    return "bg-green-100 text-green-900 border-green-300";
  }

  function getHappinessLabel(happiness: number) {
    if (happiness >= 80) return "Very Happy";
    if (happiness >= 60) return "Content";
    if (happiness >= 40) return "Uneasy";
    if (happiness >= 20) return "Unhappy";
    return "Miserable";
  }

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
        </div>

        <div className="mb-4 rounded-2xl border-2 border-rose-300 bg-white/80 p-4 text-stone-800 shadow">
          <h2 className="mb-3 text-2xl font-bold text-rose-950">Home Breeding Conditions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <p><strong>Cleanliness:</strong> {homeState.cleanliness}/100</p>
            <p><strong>Food Stock:</strong> {homeState.foodStock}</p>
            <p><strong>Average Happiness:</strong> {Math.round(getAverageHappiness())}</p>
            <p><strong>Average Breeding Care:</strong> Lv {getAverageBreedingCare().toFixed(1)}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <div
              className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getRefusalRiskClasses()}`}
            >
              Refusal Risk: {getRefusalRiskLabel()} ({Math.round(getRefusalChanceEstimate() * 100)}%)
            </div>

            {homeState.cleanliness < 50 && (
              <div className="inline-block rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
                Dirty Home
              </div>
            )}

            {homeState.cleanliness < 25 && (
              <div className="inline-block rounded-full border border-red-300 bg-red-100 px-3 py-1 text-sm font-semibold text-red-900">
                Filthy Home
              </div>
            )}

            {homeState.foodStock <= 2 && homeState.foodStock > 0 && (
              <div className="inline-block rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
                Low Food
              </div>
            )}

            {homeState.foodStock <= 0 && (
              <div className="inline-block rounded-full border border-red-300 bg-red-100 px-3 py-1 text-sm font-semibold text-red-900">
                No Food
              </div>
            )}
          </div>

          <p className="mt-3 text-sm text-stone-600">
            Low happiness, poor cleanliness, and low food increase refusal chance. Breeding Care skill helps reduce it.
          </p>
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
                      Happiness {creature.happiness} • {getHappinessLabel(creature.happiness)}
                    </p>
                    <p className="text-sm text-stone-600">
                      Breeding Care Lv {creature.skills.breedingCare.level}
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
                      Happiness {creature.happiness} • {getHappinessLabel(creature.happiness)}
                    </p>
                    <p className="text-sm text-stone-600">
                      Breeding Care Lv {creature.skills.breedingCare.level}
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
              <strong>Estimated Refusal Risk:</strong> {getRefusalRiskLabel()} ({Math.round(getRefusalChanceEstimate() * 100)}%)
            </p>
            <p>
              <strong>Rule:</strong> If the giver is Player, offspring will always
              be the receiver species. Otherwise, offspring rolls between giver
              and receiver species.
            </p>
            <p>
              <strong>Speed Effect:</strong> Higher speed reduces session time.
            </p>
            <p>
              <strong>Home Effect:</strong> Dirty homes and lack of food can reduce happiness and raise refusal chance.
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

            {parentChildWarning && !sameCreatureSelected && (
              <div className="rounded-xl border-2 border-red-500 bg-red-100 p-3 text-red-900">
                <p className="font-semibold">Family Warning</p>
                <p>
                  These creatures appear to be a direct parent and child. Breeding is
                  allowed for now, but offspring from this pairing can hatch with a
                  severe negative inherited trait.
                </p>
              </div>
            )}

            {fullSiblingWarning && !sameCreatureSelected && (
              <div className="rounded-xl border-2 border-red-500 bg-red-100 p-3 text-red-900">
                <p className="font-semibold">Family Warning</p>
                <p>
                  These creatures appear to be full siblings. Breeding is allowed for
                  now, but offspring from this pairing can hatch with a severe negative
                  inherited trait.
                </p>
              </div>
            )}

            {halfSiblingWarning && !sameCreatureSelected && (
              <div className="rounded-xl border-2 border-amber-500 bg-amber-100 p-3 text-amber-900">
                <p className="font-semibold">Family Warning</p>
                <p>
                  These creatures appear to be half siblings. Breeding is allowed for
                  now, but offspring from this pairing can hatch with a mild negative
                  inherited trait.
                </p>
              </div>
            )}

            {getRefusalChanceEstimate() >= 0.4 && (
              <div className="rounded-xl border-2 border-red-500 bg-red-100 p-3 text-red-900">
                <p className="font-semibold">Breeding Readiness Warning</p>
                <p>
                  This pair has a high chance to refuse. Improve food stock, cleanliness,
                  happiness, or breeding care skill first.
                </p>
              </div>
            )}
          </div>

          <div className="mb-5 rounded-2xl bg-stone-100 p-4 space-y-1">
            <p><strong>Your Gold:</strong> {playerData.gold}</p>
            <p><strong>Your Energy:</strong> {playerData.energy}</p>
            <p><strong>Current Time:</strong> Day {currentDay}, {formatTime(currentHour, currentMinute)}</p>
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