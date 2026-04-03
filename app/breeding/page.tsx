"use client";

import Image from "next/image";
import Link from "next/link";
import { useGame } from "@/context/GameContext";

export default function BreedingPage() {
  const {
    breedCreatures,
    playerData,
    breedingSelection,
    setBreedingSelection,
    creatures,
  } = useGame();

  const canAffordBreed =
    playerData.gold >= 50 &&
    playerData.energy >= 10 &&
    playerData.breedingStamina >= 15;

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

const parentChildWarning = isParentChild();
const fullSiblingWarning = isFullSibling();

const halfSiblingWarning =
  !parentChildWarning &&
  !fullSiblingWarning &&
  giverCreature !== null &&
  receiverCreature !== null &&
  (
    (
      giverCreature.giverId !== null &&
      giverCreature.giverId === receiverCreature.giverId
    ) ||
    (
      giverCreature.receiverId !== null &&
      giverCreature.receiverId === receiverCreature.receiverId
    ) ||
    (
      giverCreature.giverIsPlayer && receiverCreature.giverIsPlayer
    ) ||
    (
      giverCreature.receiverIsPlayer && receiverCreature.receiverIsPlayer
    )
  );

  {halfSiblingWarning && !sameCreatureSelected && (
  <div className="rounded-xl border-2 border-amber-500 bg-amber-100 p-3 text-amber-900">
    <p className="font-semibold">Family Warning</p>
    <p>
      These creatures appear to be half siblings. Breeding is allowed for now,
      but this pairing may later cause negative inherited traits.
    </p>
  </div>
)}

  const hasValidSelection =
    (breedingSelection.giverType === "player" ||
      breedingSelection.giverCreatureId !== null) &&
    (breedingSelection.receiverType === "player" ||
      breedingSelection.receiverCreatureId !== null) &&
    !sameCreatureSelected;

  const canBreed = canAffordBreed && hasValidSelection;
  const playerIsReceiver = breedingSelection.receiverType === "player";

  function getCreatureImage(name: string) {
    if (name === "Horse") return "/images/horse.png";
    if (name === "Cat") return "/images/cat.png";
    return "/images/egg.png";
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-100 to-rose-200 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-4xl font-bold text-rose-900">💞 Breeding</h1>

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
                      {creature.name} • Gen {creature.generation} • ID {creature.id}
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
                      {creature.name} • Gen {creature.generation} • ID {creature.id}
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
              <strong>Breeding Cost:</strong> 50 Gold, 10 Energy, 15 Stamina
            </p>
            <p>
              <strong>Rule:</strong> If the giver is Player, offspring will always
              be the receiver species. Otherwise, offspring rolls between giver
              and receiver species.
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

            {parentChildWarning && !sameCreatureSelected && (
              <div className="rounded-xl border-2 border-red-500 bg-red-100 p-3 text-red-900">
                <p className="font-semibold">Family Warning</p>
                <p>
                  These creatures appear to be a direct parent and child. Breeding
                  is allowed for now, but this pairing may later cause severe
                  negative inherited traits.
                </p>
              </div>
            )}

            {fullSiblingWarning && !sameCreatureSelected && (
              <div className="rounded-xl border-2 border-red-500 bg-red-100 p-3 text-red-900">
                <p className="font-semibold">Family Warning</p>
                <p>
                  These creatures appear to be full siblings. Breeding is allowed
                  for now, but this pairing may later cause severe negative
                  inherited traits.
                </p>
              </div>
            )}
          </div>

          <div className="mb-5 rounded-2xl bg-stone-100 p-4 space-y-1">
            <p><strong>Your Gold:</strong> {playerData.gold}</p>
            <p><strong>Your Energy:</strong> {playerData.energy}</p>
            <p><strong>Your Stamina:</strong> {playerData.breedingStamina}</p>
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