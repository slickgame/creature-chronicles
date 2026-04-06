"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGame } from "@/context/GameContext";

type EggQuality = "poor" | "normal" | "strong" | "exceptional";
type CreatureTrait =
  | "domestic"
  | "industrious"
  | "calm"
  | "fertile"
  | "quick"
  | "sturdy";

type TraitGrade = "F" | "D" | "C" | "B" | "A" | "S";

type CreatureTraitEntry = {
  trait: CreatureTrait;
  grade: TraitGrade;
};

function getTraitLabel(trait: CreatureTrait) {
  if (trait === "domestic") return "Domestic";
  if (trait === "industrious") return "Industrious";
  if (trait === "calm") return "Calm";
  if (trait === "fertile") return "Fertile";
  if (trait === "quick") return "Quick";
  return "Sturdy";
}

function getTraitClasses(trait: CreatureTrait) {
  if (trait === "domestic") return "bg-pink-100 text-pink-900 border-pink-300";
  if (trait === "industrious") return "bg-amber-100 text-amber-900 border-amber-300";
  if (trait === "calm") return "bg-sky-100 text-sky-900 border-sky-300";
  if (trait === "fertile") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  if (trait === "quick") return "bg-violet-100 text-violet-900 border-violet-300";
  return "bg-stone-200 text-stone-900 border-stone-400";
}

function getTraitDescription(trait: CreatureTrait) {
  if (trait === "domestic") return "Improves cooking and cleaning tasks.";
  if (trait === "industrious") return "Improves field work and labor tasks.";
  if (trait === "calm") return "Reduces breeding refusal chance.";
  if (trait === "fertile") return "Improves egg production chance.";
  if (trait === "quick") return "Reduces time costs.";
  return "Reduces stamina costs.";
}

function getGradeClasses(grade: TraitGrade) {
  if (grade === "F") return "bg-stone-100 text-stone-700 border-stone-300";
  if (grade === "D") return "bg-slate-100 text-slate-800 border-slate-300";
  if (grade === "C") return "bg-blue-100 text-blue-900 border-blue-300";
  if (grade === "B") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  if (grade === "A") return "bg-amber-100 text-amber-900 border-amber-300";
  return "bg-rose-100 text-rose-900 border-rose-300";
}

function getGradeMultiplier(grade: TraitGrade) {
  if (grade === "F") return 0.35;
  if (grade === "D") return 0.5;
  if (grade === "C") return 0.7;
  if (grade === "B") return 0.9;
  if (grade === "A") return 1.15;
  return 1.4;
}

function getGradeDescription(grade: TraitGrade) {
  if (grade === "F") return "Very weak";
  if (grade === "D") return "Weak";
  if (grade === "C") return "Average";
  if (grade === "B") return "Strong";
  if (grade === "A") return "Excellent";
  return "Exceptional";
}

function InfoButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-300 bg-white text-xs font-bold text-rose-900 shadow-sm hover:bg-rose-50"
      aria-label={label}
      title={label}
    >
      ?
    </button>
  );
}

function HelpModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border-4 border-rose-900 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-rose-200 px-5 py-4">
          <h2 className="text-2xl font-bold text-rose-950">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-xl bg-stone-200 px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-300"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-5 text-stone-800">{children}</div>

        <div className="border-t border-rose-200 bg-white px-5 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-rose-700 px-4 py-3 font-semibold text-white shadow"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

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

  const [traitHelpOpen, setTraitHelpOpen] = useState(false);
  const [gradeGuideOpen, setGradeGuideOpen] = useState(false);
  const [inheritanceHelpOpen, setInheritanceHelpOpen] = useState(false);

  const canAffordBreed = playerData.energy >= 8;

  const giverCreature = breedingSelection.giverCreatureId
    ? creatures.find((c) => c.id === breedingSelection.giverCreatureId) ?? null
    : null;

  const receiverCreature = breedingSelection.receiverCreatureId
    ? creatures.find((c) => c.id === breedingSelection.receiverCreatureId) ?? null
    : null;

  function getParticipantSnapshot(
    participantType: "player" | "creature",
    creature: typeof giverCreature
  ) {
    if (participantType === "player") {
      return {
        label: playerData.name,
        happiness: playerData.happiness,
        fertility: playerData.stats.fertility,
        vitality: playerData.stats.vitality,
        intelligence: playerData.stats.intelligence,
        speed: playerData.stats.speed,
        breedingCareLevel: playerData.breedingCare.level,
        traits: [] as CreatureTraitEntry[],
      };
    }

    if (!creature) return null;

    return {
      label: creature.nickname,
      happiness: creature.happiness,
      fertility: creature.stats.fertility,
      vitality: creature.stats.vitality,
      intelligence: creature.stats.intelligence,
      speed: creature.stats.speed,
      breedingCareLevel: creature.skills.breedingCare.level,
      traits: Array.isArray(creature.traits) ? creature.traits : [],
    };
  }

  function getBestTraitEntry(
    traits: CreatureTraitEntry[],
    trait: CreatureTrait
  ): CreatureTraitEntry | null {
    const matches = traits.filter((entry) => entry.trait === trait);
    if (matches.length === 0) return null;

    return matches.reduce((best, current) =>
      getGradeMultiplier(current.grade) > getGradeMultiplier(best.grade)
        ? current
        : best
    );
  }

  function hasTrait(
    participant: { traits: CreatureTraitEntry[] } | null,
    trait: CreatureTrait
  ) {
    if (!participant) return false;
    return participant.traits.some((entry) => entry.trait === trait);
  }

  function getTraitScaledBonus(
    participant: { traits: CreatureTraitEntry[] } | null,
    trait: CreatureTrait,
    maxBonus: number
  ) {
    if (!participant) return 0;
    const best = getBestTraitEntry(participant.traits, trait);
    if (!best) return 0;
    return Math.max(1, Math.round(maxBonus * getGradeMultiplier(best.grade)));
  }

  const giverParticipant = getParticipantSnapshot(
    breedingSelection.giverType,
    giverCreature
  );

  const receiverParticipant = getParticipantSnapshot(
    breedingSelection.receiverType,
    receiverCreature
  );

  const giverLabel = giverParticipant?.label ?? "None";
  const receiverLabel = receiverParticipant?.label ?? "None";

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
    const speeds = [giverParticipant?.speed, receiverParticipant?.speed].filter(
      (value): value is number => typeof value === "number"
    );

    const avgSpeed =
      speeds.length > 0
        ? speeds.reduce((sum, value) => sum + value, 0) / speeds.length
        : 6;

    const traitBonus =
      getTraitScaledBonus(giverParticipant, "quick", 10) +
      getTraitScaledBonus(receiverParticipant, "quick", 10);

    return Math.max(25, 120 - Math.round(avgSpeed * 6) - traitBonus);
  }

  function getCreatureStaminaCost(creatureId: number | null) {
    if (!creatureId) return null;
    const creature = creatures.find((c) => c.id === creatureId);
    if (!creature) return null;

    const sturdyDiscount = getTraitScaledBonus(
      { traits: Array.isArray(creature.traits) ? creature.traits : [] },
      "sturdy",
      3
    );

    return Math.max(
      6,
      22 - Math.floor(creature.stats.endurance / 2) - sturdyDiscount
    );
  }

  function getAverageHappiness() {
    const happinessValues = [giverParticipant?.happiness, receiverParticipant?.happiness]
      .filter((value): value is number => typeof value === "number");

    if (happinessValues.length === 0) return 60;

    return (
      happinessValues.reduce((sum, value) => sum + value, 0) /
      happinessValues.length
    );
  }

  function getAverageBreedingCare() {
    const skillValues = [
      giverParticipant?.breedingCareLevel,
      receiverParticipant?.breedingCareLevel,
    ].filter((value): value is number => typeof value === "number");

    if (skillValues.length === 0) return 1;

    return skillValues.reduce((sum, value) => sum + value, 0) / skillValues.length;
  }

  function getRefusalChanceEstimate() {
    let refusalChance = 0;

    const avgHappiness = getAverageHappiness();
    const avgBreedingCare = getAverageBreedingCare();
    const calmReduction =
      getTraitScaledBonus(giverParticipant, "calm", 8) / 100 +
      getTraitScaledBonus(receiverParticipant, "calm", 8) / 100;

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
    refusalChance -= calmReduction;

    return Math.max(0, Math.min(0.75, refusalChance));
  }

  function getEggChanceEstimate() {
    if (breedingSelection.receiverType === "player") {
      return 0;
    }

    const fertilities = [giverParticipant?.fertility, receiverParticipant?.fertility]
      .filter((value): value is number => typeof value === "number");
    const vitalities = [giverParticipant?.vitality, receiverParticipant?.vitality]
      .filter((value): value is number => typeof value === "number");
    const happinessValues = [giverParticipant?.happiness, receiverParticipant?.happiness]
      .filter((value): value is number => typeof value === "number");
    const breedingCareValues = [
      giverParticipant?.breedingCareLevel,
      receiverParticipant?.breedingCareLevel,
    ].filter((value): value is number => typeof value === "number");

    const avgFertility =
      fertilities.length > 0
        ? fertilities.reduce((sum, value) => sum + value, 0) / fertilities.length
        : 5;

    const avgVitality =
      vitalities.length > 0
        ? vitalities.reduce((sum, value) => sum + value, 0) / vitalities.length
        : 5;

    const avgHappiness =
      happinessValues.length > 0
        ? happinessValues.reduce((sum, value) => sum + value, 0) / happinessValues.length
        : 60;

    const avgBreedingCare =
      breedingCareValues.length > 0
        ? breedingCareValues.reduce((sum, value) => sum + value, 0) / breedingCareValues.length
        : 1;

    const fertileBonus =
      getTraitScaledBonus(giverParticipant, "fertile", 7) / 100 +
      getTraitScaledBonus(receiverParticipant, "fertile", 7) / 100;

    let chance = 0.45;
    chance += (avgFertility - 5) * 0.05;
    chance += (avgVitality - 5) * 0.02;
    chance += (avgHappiness - 50) * 0.003;
    chance += avgBreedingCare * 0.015;
    chance += fertileBonus;

    if (homeState.cleanliness >= 80) {
      chance += 0.08;
    } else if (homeState.cleanliness >= 50) {
      chance += 0.03;
    } else if (homeState.cleanliness < 25) {
      chance -= 0.15;
    } else if (homeState.cleanliness < 50) {
      chance -= 0.07;
    }

    if (homeState.foodStock >= 8) {
      chance += 0.04;
    } else if (homeState.foodStock <= 0) {
      chance -= 0.12;
    } else if (homeState.foodStock <= 2) {
      chance -= 0.05;
    }

    return Math.max(0.1, Math.min(0.95, chance));
  }

  function getEggQualityPreview(): EggQuality {
    const fertilities = [giverParticipant?.fertility, receiverParticipant?.fertility]
      .filter((value): value is number => typeof value === "number");
    const vitalities = [giverParticipant?.vitality, receiverParticipant?.vitality]
      .filter((value): value is number => typeof value === "number");
    const intelligences = [giverParticipant?.intelligence, receiverParticipant?.intelligence]
      .filter((value): value is number => typeof value === "number");
    const happinessValues = [giverParticipant?.happiness, receiverParticipant?.happiness]
      .filter((value): value is number => typeof value === "number");
    const breedingCareValues = [
      giverParticipant?.breedingCareLevel,
      receiverParticipant?.breedingCareLevel,
    ].filter((value): value is number => typeof value === "number");

    const avgFertility =
      fertilities.length > 0
        ? fertilities.reduce((sum, value) => sum + value, 0) / fertilities.length
        : 5;

    const avgVitality =
      vitalities.length > 0
        ? vitalities.reduce((sum, value) => sum + value, 0) / vitalities.length
        : 5;

    const avgIntelligence =
      intelligences.length > 0
        ? intelligences.reduce((sum, value) => sum + value, 0) / intelligences.length
        : 5;

    const avgHappiness =
      happinessValues.length > 0
        ? happinessValues.reduce((sum, value) => sum + value, 0) / happinessValues.length
        : 60;

    const avgBreedingCare =
      breedingCareValues.length > 0
        ? breedingCareValues.reduce((sum, value) => sum + value, 0) / breedingCareValues.length
        : 1;

    const extraTraitScore =
      (hasTrait(giverParticipant, "calm") ? 1 : 0) +
      (hasTrait(receiverParticipant, "calm") ? 1 : 0) +
      (hasTrait(giverParticipant, "fertile") ? 1 : 0) +
      (hasTrait(receiverParticipant, "fertile") ? 1 : 0);

    const score =
      avgFertility +
      avgVitality +
      avgIntelligence +
      avgBreedingCare * 1.5 +
      avgHappiness / 10 +
      homeState.cleanliness / 20 +
      Math.min(homeState.foodStock, 10) / 2 +
      extraTraitScore;

    if (score >= 34) return "exceptional";
    if (score >= 28) return "strong";
    if (score >= 22) return "normal";
    return "poor";
  }

  function getQualityClasses(quality: EggQuality) {
    if (quality === "exceptional") {
      return "bg-purple-100 text-purple-900 border-purple-300";
    }

    if (quality === "strong") {
      return "bg-sky-100 text-sky-900 border-sky-300";
    }

    if (quality === "normal") {
      return "bg-green-100 text-green-900 border-green-300";
    }

    return "bg-stone-100 text-stone-800 border-stone-300";
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

  function renderTraitList(traits: CreatureTraitEntry[]) {
    if (!traits || traits.length === 0) {
      return (
        <div className="mt-2 inline-block rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700">
          No Traits
        </div>
      );
    }

    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {traits.map((entry, index) => (
          <div
            key={`${entry.trait}-${entry.grade}-${index}`}
            className="group relative flex items-center gap-2"
          >
            <div
              className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getTraitClasses(
                entry.trait
              )}`}
            >
              {getTraitLabel(entry.trait)}
            </div>
            <div
              className={`inline-block rounded-full border px-2 py-1 text-xs font-semibold ${getGradeClasses(
                entry.grade
              )}`}
            >
              {entry.grade}
            </div>

            <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-2xl border border-stone-300 bg-white p-3 text-left text-xs text-stone-700 shadow-xl group-hover:block">
              <p className="font-semibold text-stone-900">
                {getTraitLabel(entry.trait)} ({entry.grade})
              </p>
              <p className="mt-1">{getTraitDescription(entry.trait)}</p>
              <p className="mt-1 text-stone-500">
                Grade: {getGradeDescription(entry.grade)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const allBreedableTraits: CreatureTrait[] = [
    "domestic",
    "industrious",
    "calm",
    "fertile",
    "quick",
    "sturdy",
  ];

  const inheritancePreview = useMemo(() => {
    const shared = allBreedableTraits
      .map((trait) => {
        const giverBest = getBestTraitEntry(giverParticipant?.traits ?? [], trait);
        const receiverBest = getBestTraitEntry(receiverParticipant?.traits ?? [], trait);

        if (!giverBest || !receiverBest) return null;

        const strongestGrade =
          getGradeMultiplier(giverBest.grade) >= getGradeMultiplier(receiverBest.grade)
            ? giverBest.grade
            : receiverBest.grade;

        return {
          type: "shared" as const,
          trait,
          strongestGrade,
          note: "High chance",
        };
      })
      .filter(Boolean);

    const giverOnly = allBreedableTraits
      .map((trait) => {
        const giverBest = getBestTraitEntry(giverParticipant?.traits ?? [], trait);
        const receiverBest = getBestTraitEntry(receiverParticipant?.traits ?? [], trait);

        if (!giverBest || receiverBest) return null;

        return {
          type: "giver" as const,
          trait,
          strongestGrade: giverBest.grade,
          note: "Good chance",
        };
      })
      .filter(Boolean);

    const receiverOnly = allBreedableTraits
      .map((trait) => {
        const giverBest = getBestTraitEntry(giverParticipant?.traits ?? [], trait);
        const receiverBest = getBestTraitEntry(receiverParticipant?.traits ?? [], trait);

        if (giverBest || !receiverBest) return null;

        return {
          type: "receiver" as const,
          trait,
          strongestGrade: receiverBest.grade,
          note: "Good chance",
        };
      })
      .filter(Boolean);

    return [...shared, ...giverOnly, ...receiverOnly] as {
      type: "shared" | "giver" | "receiver";
      trait: CreatureTrait;
      strongestGrade: TraitGrade;
      note: string;
    }[];
  }, [giverParticipant, receiverParticipant]);

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
        Math.max(
          6,
          22 -
            Math.floor(giverCreature.stats.endurance / 2) -
            getTraitScaledBonus(
              { traits: Array.isArray(giverCreature.traits) ? giverCreature.traits : [] },
              "sturdy",
              3
            )
        ));

  const receiverCreatureReady =
    !receiverCreature ||
    (receiverCreature.breedingsToday < receiverCreature.dailyBreedingLimit &&
      receiverCreature.breedingStamina >=
        Math.max(
          6,
          22 -
            Math.floor(receiverCreature.stats.endurance / 2) -
            getTraitScaledBonus(
              { traits: Array.isArray(receiverCreature.traits) ? receiverCreature.traits : [] },
              "sturdy",
              3
            )
        ));

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
    <>
      <main className="min-h-screen bg-gradient-to-b from-pink-100 to-rose-200 p-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-4xl font-bold text-rose-900">💞 Breeding</h1>

          <div className="mb-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-4 text-stone-800 shadow">
              <p><strong>Time:</strong> Day {currentDay}, {formatTime(currentHour, currentMinute)}</p>
              <p><strong>Energy:</strong> {playerData.energy}</p>
              <p><strong>Session Cost:</strong> {getBreedingMinutes()}m</p>
            </div>

            <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-4 text-stone-800 shadow">
              <p><strong>Egg Chance:</strong> {playerIsReceiver ? "None" : `${Math.round(getEggChanceEstimate() * 100)}%`}</p>
              <p><strong>Refusal:</strong> {getRefusalRiskLabel()}</p>
              <p><strong>Quality:</strong> {getEggQualityPreview()}</p>
            </div>

            <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-4 text-stone-800 shadow">
              <div className="flex flex-wrap gap-2">
                <InfoButton onClick={() => setTraitHelpOpen(true)} label="How traits work" />
                <InfoButton onClick={() => setGradeGuideOpen(true)} label="Grade guide" />
                <InfoButton onClick={() => setInheritanceHelpOpen(true)} label="Inheritance help" />
              </div>
              <p className="mt-3 text-sm text-stone-600">
                Hover over trait badges for quick explanations.
              </p>
            </div>
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
                  <p className="text-sm text-stone-600">
                    Happiness {playerData.happiness} • {getHappinessLabel(playerData.happiness)}
                  </p>
                  <p className="text-sm text-stone-600">
                    Fertility {playerData.stats.fertility} • Vitality {playerData.stats.vitality}
                  </p>
                  {renderTraitList([])}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {creatures.map((creature) => {
                  const isSelected =
                    breedingSelection.giverType === "creature" &&
                    breedingSelection.giverCreatureId === creature.id;

                  const creatureTraits: CreatureTraitEntry[] = Array.isArray(creature.traits)
                    ? creature.traits
                    : [];

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
                        Fertility {creature.stats.fertility} • Vitality {creature.stats.vitality}
                      </p>
                      <p className="text-sm text-stone-600">
                        Stamina {creature.breedingStamina}/{creature.maxBreedingStamina}
                      </p>

                      {renderTraitList(creatureTraits)}
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
                  <p className="text-sm text-stone-600">
                    Happiness {playerData.happiness} • {getHappinessLabel(playerData.happiness)}
                  </p>
                  <p className="text-sm text-stone-600">
                    Fertility {playerData.stats.fertility} • Vitality {playerData.stats.vitality}
                  </p>
                  {renderTraitList([])}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {creatures.map((creature) => {
                  const isSelected =
                    breedingSelection.receiverType === "creature" &&
                    breedingSelection.receiverCreatureId === creature.id;

                  const creatureTraits: CreatureTraitEntry[] = Array.isArray(creature.traits)
                    ? creature.traits
                    : [];

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
                        Fertility {creature.stats.fertility} • Vitality {creature.stats.vitality}
                      </p>
                      <p className="text-sm text-stone-600">
                        Stamina {creature.breedingStamina}/{creature.maxBreedingStamina}
                      </p>

                      {renderTraitList(creatureTraits)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-rose-50 p-4">
                <p><strong>Current Pair:</strong> {giverLabel} → {receiverLabel}</p>
                <p><strong>Breeding Cost:</strong> 8 Energy + creature stamina</p>
                <p><strong>Egg Chance:</strong> {playerIsReceiver ? "No egg possible" : `${Math.round(getEggChanceEstimate() * 100)}%`}</p>
                <p><strong>Refusal Risk:</strong> {getRefusalRiskLabel()}</p>
              </div>

              <div className="rounded-2xl bg-rose-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <p className="font-semibold text-stone-900">Inheritance Preview</p>
                  <InfoButton
                    onClick={() => setInheritanceHelpOpen(true)}
                    label="Inheritance help"
                  />
                </div>

                {!hasValidSelection ? (
                  <p className="text-sm text-stone-600">
                    Select a valid pair to preview likely inherited traits.
                  </p>
                ) : inheritancePreview.length === 0 ? (
                  <p className="text-sm text-stone-600">
                    No visible inherited traits from this pair. A random trait may still appear.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {inheritancePreview.map((entry, index) => (
                      <div
                        key={`${entry.trait}-${entry.strongestGrade}-${index}`}
                        className="group relative"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getTraitClasses(
                              entry.trait
                            )}`}
                          >
                            {getTraitLabel(entry.trait)}
                          </div>
                          <div
                            className={`inline-block rounded-full border px-2 py-1 text-xs font-semibold ${getGradeClasses(
                              entry.strongestGrade
                            )}`}
                          >
                            {entry.strongestGrade}
                          </div>
                        </div>

                        <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-2xl border border-stone-300 bg-white p-3 text-left text-xs text-stone-700 shadow-xl group-hover:block">
                          <p className="font-semibold text-stone-900">
                            {getTraitLabel(entry.trait)} — {entry.note}
                          </p>
                          <p className="mt-1">
                            Strongest visible parent grade: {entry.strongestGrade}
                          </p>
                          <p className="mt-1 text-stone-500">
                            {entry.type === "shared"
                              ? "Shared by both parents. Best odds, and better upgrade potential."
                              : "Present on one parent only. Still a realistic inheritance outcome."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <div
                className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getRefusalRiskClasses()}`}
              >
                Refusal: {getRefusalRiskLabel()}
              </div>

              <div
                className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getQualityClasses(
                  getEggQualityPreview()
                )}`}
              >
                Quality: {getEggQualityPreview()}
              </div>

              {playerIsReceiver && (
                <div className="inline-block rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
                  No egg if Player is receiver
                </div>
              )}

              {sameCreatureSelected && (
                <div className="inline-block rounded-full border border-red-300 bg-red-100 px-3 py-1 text-sm font-semibold text-red-900">
                  Same creature cannot fill both roles
                </div>
              )}

              {(parentChildWarning || fullSiblingWarning || halfSiblingWarning) && (
                <div className="inline-block rounded-full border border-red-300 bg-red-100 px-3 py-1 text-sm font-semibold text-red-900">
                  Family-risk pairing
                </div>
              )}

              {!giverCreatureReady && giverCreature && (
                <div className="inline-block rounded-full border border-red-300 bg-red-100 px-3 py-1 text-sm font-semibold text-red-900">
                  {giverCreature.nickname} not ready
                </div>
              )}

              {!receiverCreatureReady && receiverCreature && (
                <div className="inline-block rounded-full border border-red-300 bg-red-100 px-3 py-1 text-sm font-semibold text-red-900">
                  {receiverCreature.nickname} not ready
                </div>
              )}
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

      <HelpModal
        open={traitHelpOpen}
        title="How Traits Work"
        onClose={() => setTraitHelpOpen(false)}
      >
        <div className="space-y-4">
          {allBreedableTraits.map((trait) => (
            <div key={trait} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="mb-2 inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getTraitClasses(trait)}">
                <span className={getTraitClasses(trait).replace("inline-block rounded-full border px-3 py-1 text-sm font-semibold ", "")}>
                  {getTraitLabel(trait)}
                </span>
              </div>
              <p className="font-semibold text-stone-900">{getTraitDescription(trait)}</p>
            </div>
          ))}
        </div>
      </HelpModal>

      <HelpModal
        open={gradeGuideOpen}
        title="Grade Guide"
        onClose={() => setGradeGuideOpen(false)}
      >
        <div className="space-y-3">
          {(["F", "D", "C", "B", "A", "S"] as TraitGrade[]).map((grade) => (
            <div key={grade} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div
                className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getGradeClasses(
                  grade
                )}`}
              >
                Grade {grade}
              </div>
              <p className="mt-2 font-semibold text-stone-900">
                {getGradeDescription(grade)}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                Higher grades make the trait’s bonus stronger.
              </p>
            </div>
          ))}
        </div>
      </HelpModal>

      <HelpModal
        open={inheritanceHelpOpen}
        title="Inheritance Help"
        onClose={() => setInheritanceHelpOpen(false)}
      >
        <div className="space-y-4 text-sm">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="font-semibold text-stone-900">Shared traits</p>
            <p className="mt-1 text-stone-700">
              If both parents have the same trait, that trait has the best inheritance odds.
            </p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="font-semibold text-stone-900">Single-parent traits</p>
            <p className="mt-1 text-stone-700">
              Traits present on only one parent can still pass down, just less consistently.
            </p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="font-semibold text-stone-900">Grade upgrades</p>
            <p className="mt-1 text-stone-700">
              Shared traits have the best chance to inherit at a strong grade or improve upward.
            </p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="font-semibold text-stone-900">Random extra traits</p>
            <p className="mt-1 text-stone-700">
              Some offspring may gain an extra trait that is not clearly shown on either parent.
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-900">Family-risk pairings</p>
            <p className="mt-1 text-red-800">
              Parent-child and sibling pairings increase the chance of negative outcomes and can reduce trait quality.
            </p>
          </div>
        </div>
      </HelpModal>
    </>
  );
}