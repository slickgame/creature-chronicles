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
type SortDirection = "asc" | "desc";

type CreatureTraitEntry = {
  trait: CreatureTrait;
  grade: TraitGrade;
};

type SortOption =
  | "name"
  | "fertility"
  | "happiness"
  | "generation"
  | "ready";

type DetailTarget =
  | {
      type: "player";
      roleLabel: string;
    }
  | {
      type: "creature";
      roleLabel: string;
      creature: {
        id: number;
        name: string;
        nickname: string;
        level: number;
        happiness: number;
        generation: number;
        breedingStamina: number;
        maxBreedingStamina: number;
        breedingsToday: number;
        dailyBreedingLimit: number;
        giver: string | null;
        receiver: string | null;
        giverId: number | null;
        receiverId: number | null;
        giverIsPlayer?: boolean;
        receiverIsPlayer?: boolean;
        stats: {
          strength: number;
          endurance: number;
          intelligence: number;
          speed: number;
          fertility: number;
          vitality: number;
        };
        skills?: {
          breedingCare?: {
            level: number;
          };
        };
        traits?: CreatureTraitEntry[];
      };
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

function getCreatureImage(name: string) {
  if (name === "Horse") return "/images/horse.png";
  if (name === "Cat") return "/images/cat.png";
  return "/images/egg.png";
}

function getHappinessLabel(happiness: number) {
  if (happiness >= 80) return "Very Happy";
  if (happiness >= 60) return "Content";
  if (happiness >= 40) return "Uneasy";
  if (happiness >= 20) return "Unhappy";
  return "Miserable";
}

function InfoButton({
  onClick,
  label,
  small = false,
}: {
  onClick: () => void;
  label: string;
  small?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex items-center justify-center rounded-full border border-rose-300 bg-white font-bold text-rose-900 shadow-sm hover:bg-rose-50 ${
        small ? "h-6 w-6 text-xs" : "h-7 w-7 text-sm"
      }`}
      aria-label={label}
      title={label}
      type="button"
    >
      ?
    </button>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
        active
          ? "border-rose-700 bg-rose-700 text-white"
          : "border-rose-300 bg-white text-stone-700 hover:border-rose-400"
      }`}
    >
      {label}
    </button>
  );
}

function SortDirectionButtons({
  direction,
  setDirection,
}: {
  direction: SortDirection;
  setDirection: (direction: SortDirection) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setDirection("asc")}
        className={`rounded-xl px-3 py-2 text-xs font-semibold shadow ${
          direction === "asc"
            ? "bg-rose-700 text-white"
            : "border border-rose-300 bg-white text-stone-800"
        }`}
      >
        Asc
      </button>
      <button
        type="button"
        onClick={() => setDirection("desc")}
        className={`rounded-xl px-3 py-2 text-xs font-semibold shadow ${
          direction === "desc"
            ? "bg-rose-700 text-white"
            : "border border-rose-300 bg-white text-stone-800"
        }`}
      >
        Desc
      </button>
    </div>
  );
}

function HelpModal({
  open,
  title,
  onClose,
  children,
  maxWidth = "max-w-2xl",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`flex max-h-[88vh] w-full ${maxWidth} flex-col overflow-hidden rounded-3xl border-4 border-rose-900 bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-rose-200 px-5 py-4">
          <h2 className="text-2xl font-bold text-rose-950">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-xl bg-stone-200 px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-300"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-5 text-stone-800">{children}</div>

        <div className="border-t border-rose-200 bg-white px-5 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-rose-700 px-4 py-3 font-semibold text-white shadow"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function TraitBadgeRow({ traits }: { traits: CreatureTraitEntry[] }) {
  if (!traits || traits.length === 0) {
    return (
      <div className="inline-block rounded-full border border-stone-300 bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
        No Traits
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {traits.map((entry, index) => (
        <div
          key={`${entry.trait}-${entry.grade}-${index}`}
          className="group relative flex items-center gap-1"
        >
          <div
            className={`inline-block rounded-full border px-2 py-1 text-xs font-semibold ${getTraitClasses(
              entry.trait
            )}`}
          >
            {getTraitLabel(entry.trait)}
          </div>
          <div
            className={`inline-block rounded-full border px-2 py-1 text-[10px] font-semibold ${getGradeClasses(
              entry.grade
            )}`}
          >
            {entry.grade}
          </div>

          <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-60 rounded-2xl border border-stone-300 bg-white p-3 text-left text-xs text-stone-700 shadow-xl group-hover:block">
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

function CompactParticipantCard({
  selected,
  title,
  subtitle,
  meta,
  traits,
  imageSrc,
  staminaCostLabel,
  onSelect,
  onOpenDetails,
}: {
  selected: boolean;
  title: string;
  subtitle: string;
  meta: string;
  traits: CreatureTraitEntry[];
  imageSrc: string;
  staminaCostLabel?: string;
  onSelect: () => void;
  onOpenDetails: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      type="button"
      className={`w-full rounded-2xl border-2 p-3 text-left shadow transition ${
        selected
          ? "border-rose-700 bg-rose-100"
          : "border-rose-200 bg-white hover:border-rose-400"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-stone-100">
          <Image
            src={imageSrc}
            alt={title}
            width={160}
            height={160}
            className="max-h-full w-auto object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-stone-900">{title}</p>
              <p className="truncate text-xs text-stone-600">{subtitle}</p>
            </div>

            <InfoButton
              onClick={onOpenDetails}
              label={`View full details for ${title}`}
              small
            />
          </div>

          <p className="mt-1 text-xs text-stone-600">{meta}</p>

          {staminaCostLabel && (
            <p className="mt-1 text-[11px] font-semibold text-stone-700">
              {staminaCostLabel}
            </p>
          )}

          <div className="mt-2">
            <TraitBadgeRow traits={traits} />
          </div>
        </div>
      </div>
    </button>
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
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const [giverSearch, setGiverSearch] = useState("");
  const [receiverSearch, setReceiverSearch] = useState("");
  const [giverReadyOnly, setGiverReadyOnly] = useState(false);
  const [receiverReadyOnly, setReceiverReadyOnly] = useState(false);
  const [giverTraitsOnly, setGiverTraitsOnly] = useState(false);
  const [receiverTraitsOnly, setReceiverTraitsOnly] = useState(false);
  const [giverFamilySafeOnly, setGiverFamilySafeOnly] = useState(false);
  const [receiverFamilySafeOnly, setReceiverFamilySafeOnly] = useState(false);
  const [giverSort, setGiverSort] = useState<SortOption>("name");
  const [receiverSort, setReceiverSort] = useState<SortOption>("name");
  const [giverSortDirection, setGiverSortDirection] = useState<SortDirection>("asc");
  const [receiverSortDirection, setReceiverSortDirection] =
    useState<SortDirection>("asc");

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

  function calculateRelationshipRisk(
    leftCreature: typeof giverCreature,
    rightCreature: typeof receiverCreature,
    leftIsPlayer = false,
    rightIsPlayer = false
  ) {
    if (
      leftIsPlayer &&
      rightCreature &&
      (rightCreature.giverIsPlayer || rightCreature.receiverIsPlayer)
    ) {
      return "parent_child";
    }

    if (
      rightIsPlayer &&
      leftCreature &&
      (leftCreature.giverIsPlayer || leftCreature.receiverIsPlayer)
    ) {
      return "parent_child";
    }

    if (!leftCreature || !rightCreature) {
      return "none";
    }

    const isParentChild =
      leftCreature.id === rightCreature.giverId ||
      leftCreature.id === rightCreature.receiverId ||
      rightCreature.id === leftCreature.giverId ||
      rightCreature.id === leftCreature.receiverId;

    if (isParentChild) return "parent_child";

    const sameGiverSide =
      (leftCreature.giverId !== null &&
        leftCreature.giverId === rightCreature.giverId) ||
      (leftCreature.giverIsPlayer && rightCreature.giverIsPlayer);

    const sameReceiverSide =
      (leftCreature.receiverId !== null &&
        leftCreature.receiverId === rightCreature.receiverId) ||
      (leftCreature.receiverIsPlayer && rightCreature.receiverIsPlayer);

    if (sameGiverSide && sameReceiverSide) return "full_sibling";
    if (sameGiverSide || sameReceiverSide) return "half_sibling";

    return "none";
  }

  function isParentChild() {
    return (
      calculateRelationshipRisk(
        giverCreature,
        receiverCreature,
        breedingSelection.giverType === "player",
        breedingSelection.receiverType === "player"
      ) === "parent_child"
    );
  }

  function isFullSibling() {
    return calculateRelationshipRisk(giverCreature, receiverCreature) === "full_sibling";
  }

  function isHalfSibling() {
    return calculateRelationshipRisk(giverCreature, receiverCreature) === "half_sibling";
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

  function isCreatureReady(creature: (typeof creatures)[number]) {
    const cost = getCreatureStaminaCost(creature.id) ?? 999;
    return (
      creature.breedingsToday < creature.dailyBreedingLimit &&
      creature.breedingStamina >= cost
    );
  }

  function isFamilySafeCandidate(
    candidate: (typeof creatures)[number],
    role: "giver" | "receiver"
  ) {
    if (role === "giver") {
      return (
        calculateRelationshipRisk(
          candidate,
          receiverCreature,
          false,
          breedingSelection.receiverType === "player"
        ) === "none"
      );
    }

    return (
      calculateRelationshipRisk(
        giverCreature,
        candidate,
        breedingSelection.giverType === "player",
        false
      ) === "none"
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

  function formatTime(hour: number, minute: number) {
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMinute = minute.toString().padStart(2, "0");
    return `${displayHour}:${displayMinute} ${suffix}`;
  }

  function openPlayerDetails(roleLabel: string) {
    setDetailTarget({
      type: "player",
      roleLabel,
    });
  }

  function sortCreatures(
    list: typeof creatures,
    sort: SortOption,
    direction: SortDirection
  ) {
    const sorted = [...list];

    sorted.sort((a, b) => {
      let result = 0;

      if (sort === "fertility") result = b.stats.fertility - a.stats.fertility;
      else if (sort === "happiness") result = b.happiness - a.happiness;
      else if (sort === "generation") result = b.generation - a.generation;
      else if (sort === "ready")
        result = Number(isCreatureReady(b)) - Number(isCreatureReady(a));
      else result = a.nickname.localeCompare(b.nickname);

      return direction === "asc" ? -result : result;
    });

    return sorted;
  }

  function filterCreatures(
    search: string,
    readyOnly: boolean,
    traitsOnly: boolean,
    familySafeOnly: boolean,
    sort: SortOption,
    direction: SortDirection,
    role: "giver" | "receiver"
  ) {
    const lowered = search.trim().toLowerCase();

    const filtered = creatures.filter((creature) => {
      const traits: CreatureTraitEntry[] = Array.isArray(creature.traits)
        ? creature.traits
        : [];

      const matchesSearch =
        lowered.length === 0 ||
        creature.nickname.toLowerCase().includes(lowered) ||
        creature.name.toLowerCase().includes(lowered);

      const matchesReady = !readyOnly || isCreatureReady(creature);
      const matchesTraits = !traitsOnly || traits.length > 0;
      const matchesFamilySafe = !familySafeOnly || isFamilySafeCandidate(creature, role);

      return matchesSearch && matchesReady && matchesTraits && matchesFamilySafe;
    });

    return sortCreatures(filtered, sort, direction);
  }

  const filteredGiverCreatures = useMemo(
    () =>
      filterCreatures(
        giverSearch,
        giverReadyOnly,
        giverTraitsOnly,
        giverFamilySafeOnly,
        giverSort,
        giverSortDirection,
        "giver"
      ),
    [
      creatures,
      giverSearch,
      giverReadyOnly,
      giverTraitsOnly,
      giverFamilySafeOnly,
      giverSort,
      giverSortDirection,
      receiverCreature,
      breedingSelection.receiverType,
    ]
  );

  const filteredReceiverCreatures = useMemo(
    () =>
      filterCreatures(
        receiverSearch,
        receiverReadyOnly,
        receiverTraitsOnly,
        receiverFamilySafeOnly,
        receiverSort,
        receiverSortDirection,
        "receiver"
      ),
    [
      creatures,
      receiverSearch,
      receiverReadyOnly,
      receiverTraitsOnly,
      receiverFamilySafeOnly,
      receiverSort,
      receiverSortDirection,
      giverCreature,
      breedingSelection.giverType,
    ]
  );

  return (
    <>
      <main className="h-screen overflow-hidden bg-gradient-to-b from-pink-100 to-rose-200 p-4 md:p-6">
        <div className="mx-auto flex h-full max-w-7xl flex-col">
          <h1 className="mb-4 shrink-0 text-3xl font-bold text-rose-900 md:text-4xl">
            💞 Breeding
          </h1>

          <div className="mb-4 shrink-0 grid gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-3 text-sm text-stone-800 shadow">
              <p><strong>Time:</strong> Day {currentDay}, {formatTime(currentHour, currentMinute)}</p>
              <p><strong>Energy:</strong> {playerData.energy}</p>
              <p><strong>Session:</strong> {getBreedingMinutes()}m</p>
            </div>

            <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-3 text-sm text-stone-800 shadow">
              <p><strong>Egg Chance:</strong> {playerIsReceiver ? "None" : `${Math.round(getEggChanceEstimate() * 100)}%`}</p>
              <p><strong>Refusal:</strong> {getRefusalRiskLabel()}</p>
              <p><strong>Quality:</strong> {getEggQualityPreview()}</p>
            </div>

            <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-3 text-sm text-stone-800 shadow">
              <p><strong>Home:</strong> Clean {homeState.cleanliness}/100</p>
              <p><strong>Food:</strong> {homeState.foodStock}</p>
              <p><strong>Breeding Care:</strong> Lv {getAverageBreedingCare().toFixed(1)}</p>
            </div>

            <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-3 text-sm text-stone-800 shadow">
              <div className="flex flex-wrap gap-2">
                <InfoButton onClick={() => setTraitHelpOpen(true)} label="How traits work" />
                <InfoButton onClick={() => setGradeGuideOpen(true)} label="Grade guide" />
                <InfoButton onClick={() => setInheritanceHelpOpen(true)} label="Inheritance help" />
              </div>
              <p className="mt-2 text-xs text-stone-600">
                Hover trait badges for quick help.
              </p>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_1fr_360px]">
            <section className="flex min-h-0 flex-col rounded-3xl border-4 border-rose-900 bg-white/85 p-4 shadow-xl">
              <div className="mb-3 shrink-0">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-rose-950">Choose Giver</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setBreedingSelection({
                        ...breedingSelection,
                        giverType: "player",
                        giverCreatureId: null,
                      })
                    }
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold shadow ${
                      breedingSelection.giverType === "player"
                        ? "bg-rose-700 text-white"
                        : "border border-rose-300 bg-white text-stone-800"
                    }`}
                  >
                    Select Player
                  </button>
                </div>

                <input
                  type="text"
                  value={giverSearch}
                  onChange={(e) => setGiverSearch(e.target.value)}
                  placeholder="Search giver..."
                  className="mb-3 w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
                />

                <div className="mb-3 flex flex-wrap gap-2">
                  <FilterChip
                    active={giverReadyOnly}
                    label="Ready"
                    onClick={() => setGiverReadyOnly((v) => !v)}
                  />
                  <FilterChip
                    active={giverTraitsOnly}
                    label="Has Traits"
                    onClick={() => setGiverTraitsOnly((v) => !v)}
                  />
                  <FilterChip
                    active={giverFamilySafeOnly}
                    label="Family Safe"
                    onClick={() => setGiverFamilySafeOnly((v) => !v)}
                  />
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <select
                    value={giverSort}
                    onChange={(e) => setGiverSort(e.target.value as SortOption)}
                    className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="name">Sort: Name</option>
                    <option value="fertility">Sort: Fertility</option>
                    <option value="happiness">Sort: Happiness</option>
                    <option value="generation">Sort: Generation</option>
                    <option value="ready">Sort: Ready Status</option>
                  </select>

                  <SortDirectionButtons
                    direction={giverSortDirection}
                    setDirection={setGiverSortDirection}
                  />
                </div>
              </div>

              <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
                <CompactParticipantCard
                  selected={breedingSelection.giverType === "player"}
                  title={playerData.name}
                  subtitle="Player"
                  meta={`Happy ${playerData.happiness} • Fertility ${playerData.stats.fertility} • Vitality ${playerData.stats.vitality}`}
                  traits={[]}
                  imageSrc="/images/player.png"
                  onSelect={() =>
                    setBreedingSelection({
                      ...breedingSelection,
                      giverType: "player",
                      giverCreatureId: null,
                    })
                  }
                  onOpenDetails={() => openPlayerDetails("Giver")}
                />

                {filteredGiverCreatures.map((creature) => {
                  const traits: CreatureTraitEntry[] = Array.isArray(creature.traits)
                    ? creature.traits
                    : [];

                  return (
                    <CompactParticipantCard
                      key={`giver-${creature.id}`}
                      selected={
                        breedingSelection.giverType === "creature" &&
                        breedingSelection.giverCreatureId === creature.id
                      }
                      title={creature.nickname}
                      subtitle={`${creature.name} • Lv ${creature.level} • Gen ${creature.generation}`}
                      meta={`Happy ${creature.happiness} • Fertility ${creature.stats.fertility} • Vitality ${creature.stats.vitality}`}
                      staminaCostLabel={`Cost ${getCreatureStaminaCost(creature.id)} stamina`}
                      traits={traits}
                      imageSrc={getCreatureImage(creature.name)}
                      onSelect={() =>
                        setBreedingSelection({
                          ...breedingSelection,
                          giverType: "creature",
                          giverCreatureId: creature.id,
                        })
                      }
                      onOpenDetails={() =>
                        setDetailTarget({
                          type: "creature",
                          roleLabel: "Giver",
                          creature,
                        })
                      }
                    />
                  );
                })}
              </div>
            </section>

            <section className="flex min-h-0 flex-col rounded-3xl border-4 border-rose-900 bg-white/85 p-4 shadow-xl">
              <div className="mb-3 shrink-0">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-rose-950">Choose Receiver</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setBreedingSelection({
                        ...breedingSelection,
                        receiverType: "player",
                        receiverCreatureId: null,
                      })
                    }
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold shadow ${
                      breedingSelection.receiverType === "player"
                        ? "bg-rose-700 text-white"
                        : "border border-rose-300 bg-white text-stone-800"
                    }`}
                  >
                    Select Player
                  </button>
                </div>

                <input
                  type="text"
                  value={receiverSearch}
                  onChange={(e) => setReceiverSearch(e.target.value)}
                  placeholder="Search receiver..."
                  className="mb-3 w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
                />

                <div className="mb-3 flex flex-wrap gap-2">
                  <FilterChip
                    active={receiverReadyOnly}
                    label="Ready"
                    onClick={() => setReceiverReadyOnly((v) => !v)}
                  />
                  <FilterChip
                    active={receiverTraitsOnly}
                    label="Has Traits"
                    onClick={() => setReceiverTraitsOnly((v) => !v)}
                  />
                  <FilterChip
                    active={receiverFamilySafeOnly}
                    label="Family Safe"
                    onClick={() => setReceiverFamilySafeOnly((v) => !v)}
                  />
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <select
                    value={receiverSort}
                    onChange={(e) => setReceiverSort(e.target.value as SortOption)}
                    className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="name">Sort: Name</option>
                    <option value="fertility">Sort: Fertility</option>
                    <option value="happiness">Sort: Happiness</option>
                    <option value="generation">Sort: Generation</option>
                    <option value="ready">Sort: Ready Status</option>
                  </select>

                  <SortDirectionButtons
                    direction={receiverSortDirection}
                    setDirection={setReceiverSortDirection}
                  />
                </div>
              </div>

              <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
                <CompactParticipantCard
                  selected={breedingSelection.receiverType === "player"}
                  title={playerData.name}
                  subtitle="Player"
                  meta={`Happy ${playerData.happiness} • Fertility ${playerData.stats.fertility} • Vitality ${playerData.stats.vitality}`}
                  traits={[]}
                  imageSrc="/images/player.png"
                  onSelect={() =>
                    setBreedingSelection({
                      ...breedingSelection,
                      receiverType: "player",
                      receiverCreatureId: null,
                    })
                  }
                  onOpenDetails={() => openPlayerDetails("Receiver")}
                />

                {filteredReceiverCreatures.map((creature) => {
                  const traits: CreatureTraitEntry[] = Array.isArray(creature.traits)
                    ? creature.traits
                    : [];

                  return (
                    <CompactParticipantCard
                      key={`receiver-${creature.id}`}
                      selected={
                        breedingSelection.receiverType === "creature" &&
                        breedingSelection.receiverCreatureId === creature.id
                      }
                      title={creature.nickname}
                      subtitle={`${creature.name} • Lv ${creature.level} • Gen ${creature.generation}`}
                      meta={`Happy ${creature.happiness} • Fertility ${creature.stats.fertility} • Vitality ${creature.stats.vitality}`}
                      staminaCostLabel={`Cost ${getCreatureStaminaCost(creature.id)} stamina`}
                      traits={traits}
                      imageSrc={getCreatureImage(creature.name)}
                      onSelect={() =>
                        setBreedingSelection({
                          ...breedingSelection,
                          receiverType: "creature",
                          receiverCreatureId: creature.id,
                        })
                      }
                      onOpenDetails={() =>
                        setDetailTarget({
                          type: "creature",
                          roleLabel: "Receiver",
                          creature,
                        })
                      }
                    />
                  );
                })}
              </div>
            </section>

            <aside className="flex min-h-0 flex-col rounded-3xl border-4 border-rose-900 bg-white/85 p-4 shadow-xl">
              <h2 className="mb-3 shrink-0 text-2xl font-bold text-rose-950">
                Pair Preview
              </h2>

              <div className="space-y-3 overflow-y-auto pr-1">
                <div className="rounded-2xl bg-rose-50 p-3 text-sm text-stone-800">
                  <p><strong>Giver:</strong> {giverLabel}</p>
                  <p><strong>Receiver:</strong> {receiverLabel}</p>
                  <p><strong>Cost:</strong> 8 Energy + creature stamina</p>
                </div>

                <div className="rounded-2xl bg-rose-50 p-3 text-sm text-stone-800">
                  <p><strong>Egg Chance:</strong> {playerIsReceiver ? "No egg possible" : `${Math.round(getEggChanceEstimate() * 100)}%`}</p>
                  <p><strong>Refusal:</strong> {getRefusalRiskLabel()}</p>
                  <p><strong>Quality:</strong> {getEggQualityPreview()}</p>
                </div>

                <div className="rounded-2xl bg-rose-50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="text-sm font-semibold text-stone-900">Inheritance Preview</p>
                    <InfoButton
                      onClick={() => setInheritanceHelpOpen(true)}
                      label="Inheritance help"
                      small
                    />
                  </div>

                  {!hasValidSelection ? (
                    <p className="text-sm text-stone-600">
                      Select a valid pair to preview likely inherited traits.
                    </p>
                  ) : inheritancePreview.length === 0 ? (
                    <p className="text-sm text-stone-600">
                      No clear visible inherited traits from this pair.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {inheritancePreview.map((entry, index) => (
                        <div
                          key={`${entry.trait}-${entry.strongestGrade}-${index}`}
                          className="group relative"
                        >
                          <div className="flex items-center gap-1">
                            <div
                              className={`inline-block rounded-full border px-2 py-1 text-xs font-semibold ${getTraitClasses(
                                entry.trait
                              )}`}
                            >
                              {getTraitLabel(entry.trait)}
                            </div>
                            <div
                              className={`inline-block rounded-full border px-2 py-1 text-[10px] font-semibold ${getGradeClasses(
                                entry.strongestGrade
                              )}`}
                            >
                              {entry.strongestGrade}
                            </div>
                          </div>

                          <div className="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-60 rounded-2xl border border-stone-300 bg-white p-3 text-left text-xs text-stone-700 shadow-xl group-hover:block">
                            <p className="font-semibold text-stone-900">
                              {getTraitLabel(entry.trait)} — {entry.note}
                            </p>
                            <p className="mt-1">
                              Strongest visible parent grade: {entry.strongestGrade}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
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
              </div>

              <div className="mt-4 shrink-0 space-y-3">
                <button
                  onClick={() => setCompareOpen(true)}
                  disabled={!hasValidSelection}
                  className={`w-full rounded-2xl px-4 py-3 font-semibold shadow ${
                    hasValidSelection
                      ? "border border-rose-300 bg-white text-stone-900"
                      : "bg-stone-200 text-stone-500"
                  }`}
                  type="button"
                >
                  Compare Selected Pair
                </button>

                <button
                  onClick={breedCreatures}
                  disabled={!canBreed}
                  className={`w-full rounded-2xl px-4 py-3 text-white font-semibold shadow ${
                    canBreed ? "bg-pink-600" : "bg-gray-500"
                  }`}
                  type="button"
                >
                  {canBreed ? "Breed" : "Cannot Breed"}
                </button>

                <div>
                  <Link
                    href="/ranch"
                    className="block rounded-2xl bg-stone-800 px-5 py-3 text-center font-semibold text-white shadow"
                  >
                    Back to Ranch
                  </Link>
                </div>
              </div>
            </aside>
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
              <div
                className={`mb-2 inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getTraitClasses(
                  trait
                )}`}
              >
                {getTraitLabel(trait)}
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

      <HelpModal
        open={detailTarget !== null}
        title={
          detailTarget
            ? detailTarget.type === "player"
              ? `${detailTarget.roleLabel} Details`
              : `${detailTarget.roleLabel} Details`
            : "Details"
        }
        onClose={() => setDetailTarget(null)}
        maxWidth="max-w-3xl"
      >
        {detailTarget?.type === "player" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-5 md:flex-row">
              <div className="flex h-52 w-full items-center justify-center overflow-hidden rounded-3xl bg-stone-100 md:w-72">
                <Image
                  src="/images/player.png"
                  alt="Player"
                  width={320}
                  height={320}
                  className="max-h-full w-auto object-contain"
                />
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm text-stone-500">Name</p>
                  <p className="text-2xl font-bold text-stone-900">
                    {playerData.name}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-rose-50 p-3">
                    <p className="text-sm text-stone-500">Level</p>
                    <p className="font-semibold text-stone-900">{playerData.level}</p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-3">
                    <p className="text-sm text-stone-500">Happiness</p>
                    <p className="font-semibold text-stone-900">
                      {playerData.happiness} • {getHappinessLabel(playerData.happiness)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-3">
                    <p className="text-sm text-stone-500">Energy</p>
                    <p className="font-semibold text-stone-900">{playerData.energy}</p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-3">
                    <p className="text-sm text-stone-500">Breeding Care</p>
                    <p className="font-semibold text-stone-900">
                      Lv {playerData.breedingCare.level}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-stone-100 p-4">
              <p className="mb-2 text-sm text-stone-500">Stats</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <p><strong>Strength:</strong> {playerData.stats.strength}</p>
                <p><strong>Endurance:</strong> {playerData.stats.endurance}</p>
                <p><strong>Intelligence:</strong> {playerData.stats.intelligence}</p>
                <p><strong>Speed:</strong> {playerData.stats.speed}</p>
                <p><strong>Fertility:</strong> {playerData.stats.fertility}</p>
                <p><strong>Vitality:</strong> {playerData.stats.vitality}</p>
              </div>
            </div>
          </div>
        )}

        {detailTarget?.type === "creature" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-5 md:flex-row">
              <div className="flex h-52 w-full items-center justify-center overflow-hidden rounded-3xl bg-stone-100 md:w-72">
                <Image
                  src={getCreatureImage(detailTarget.creature.name)}
                  alt={detailTarget.creature.name}
                  width={320}
                  height={320}
                  className="max-h-full w-auto object-contain"
                />
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm text-stone-500">Name</p>
                  <p className="text-2xl font-bold text-stone-900">
                    {detailTarget.creature.nickname}
                  </p>
                  <p className="text-stone-600">
                    {detailTarget.creature.name} • Lv {detailTarget.creature.level} • Gen {detailTarget.creature.generation}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-rose-50 p-3">
                    <p className="text-sm text-stone-500">Happiness</p>
                    <p className="font-semibold text-stone-900">
                      {detailTarget.creature.happiness} • {getHappinessLabel(detailTarget.creature.happiness)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-3">
                    <p className="text-sm text-stone-500">Breeding Care</p>
                    <p className="font-semibold text-stone-900">
                      Lv {detailTarget.creature.skills?.breedingCare?.level ?? 1}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-3">
                    <p className="text-sm text-stone-500">Stamina</p>
                    <p className="font-semibold text-stone-900">
                      {detailTarget.creature.breedingStamina}/{detailTarget.creature.maxBreedingStamina}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-3">
                    <p className="text-sm text-stone-500">Daily Uses</p>
                    <p className="font-semibold text-stone-900">
                      {detailTarget.creature.breedingsToday}/{detailTarget.creature.dailyBreedingLimit}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-rose-50 p-4">
              <p className="mb-2 text-sm text-stone-500">Traits</p>
              <TraitBadgeRow
                traits={Array.isArray(detailTarget.creature.traits) ? detailTarget.creature.traits : []}
              />
            </div>

            <div className="rounded-2xl bg-stone-100 p-4">
              <p className="mb-2 text-sm text-stone-500">Stats</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <p><strong>Strength:</strong> {detailTarget.creature.stats.strength}</p>
                <p><strong>Endurance:</strong> {detailTarget.creature.stats.endurance}</p>
                <p><strong>Intelligence:</strong> {detailTarget.creature.stats.intelligence}</p>
                <p><strong>Speed:</strong> {detailTarget.creature.stats.speed}</p>
                <p><strong>Fertility:</strong> {detailTarget.creature.stats.fertility}</p>
                <p><strong>Vitality:</strong> {detailTarget.creature.stats.vitality}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-stone-100 p-4">
              <p className="mb-2 text-sm text-stone-500">Lineage</p>
              {detailTarget.creature.giver && detailTarget.creature.receiver ? (
                <>
                  <p className="font-semibold text-stone-900">
                    {detailTarget.creature.giver} → {detailTarget.creature.receiver}
                  </p>
                  <p className="text-sm text-stone-600">
                    Parent IDs: {detailTarget.creature.giverId ?? "Player"} / {detailTarget.creature.receiverId ?? "Player"}
                  </p>
                </>
              ) : (
                <p className="font-semibold text-stone-900">Starter Creature</p>
              )}
            </div>
          </div>
        )}
      </HelpModal>

      <HelpModal
        open={compareOpen}
        title="Compare Selected Pair"
        onClose={() => setCompareOpen(false)}
        maxWidth="max-w-4xl"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="mb-2 text-sm text-stone-500">Giver</p>
            <p className="text-xl font-bold text-stone-900">{giverLabel}</p>
            {breedingSelection.giverType === "player" ? (
              <>
                <p className="text-sm text-stone-600">Player</p>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p><strong>Happiness:</strong> {playerData.happiness}</p>
                  <p><strong>Fertility:</strong> {playerData.stats.fertility}</p>
                  <p><strong>Vitality:</strong> {playerData.stats.vitality}</p>
                  <p><strong>Speed:</strong> {playerData.stats.speed}</p>
                </div>
              </>
            ) : giverCreature ? (
              <>
                <p className="text-sm text-stone-600">
                  {giverCreature.name} • Lv {giverCreature.level} • Gen {giverCreature.generation}
                </p>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p><strong>Happiness:</strong> {giverCreature.happiness}</p>
                  <p><strong>Fertility:</strong> {giverCreature.stats.fertility}</p>
                  <p><strong>Vitality:</strong> {giverCreature.stats.vitality}</p>
                  <p><strong>Speed:</strong> {giverCreature.stats.speed}</p>
                  <p><strong>Stamina:</strong> {giverCreature.breedingStamina}/{giverCreature.maxBreedingStamina}</p>
                  <p><strong>Cost:</strong> {getCreatureStaminaCost(giverCreature.id)} stamina</p>
                </div>
                <div className="mt-3">
                  <TraitBadgeRow traits={Array.isArray(giverCreature.traits) ? giverCreature.traits : []} />
                </div>
              </>
            ) : null}
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="mb-2 text-sm text-stone-500">Receiver</p>
            <p className="text-xl font-bold text-stone-900">{receiverLabel}</p>
            {breedingSelection.receiverType === "player" ? (
              <>
                <p className="text-sm text-stone-600">Player</p>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p><strong>Happiness:</strong> {playerData.happiness}</p>
                  <p><strong>Fertility:</strong> {playerData.stats.fertility}</p>
                  <p><strong>Vitality:</strong> {playerData.stats.vitality}</p>
                  <p><strong>Speed:</strong> {playerData.stats.speed}</p>
                </div>
              </>
            ) : receiverCreature ? (
              <>
                <p className="text-sm text-stone-600">
                  {receiverCreature.name} • Lv {receiverCreature.level} • Gen {receiverCreature.generation}
                </p>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p><strong>Happiness:</strong> {receiverCreature.happiness}</p>
                  <p><strong>Fertility:</strong> {receiverCreature.stats.fertility}</p>
                  <p><strong>Vitality:</strong> {receiverCreature.stats.vitality}</p>
                  <p><strong>Speed:</strong> {receiverCreature.stats.speed}</p>
                  <p><strong>Stamina:</strong> {receiverCreature.breedingStamina}/{receiverCreature.maxBreedingStamina}</p>
                  <p><strong>Cost:</strong> {getCreatureStaminaCost(receiverCreature.id)} stamina</p>
                </div>
                <div className="mt-3">
                  <TraitBadgeRow traits={Array.isArray(receiverCreature.traits) ? receiverCreature.traits : []} />
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-stone-100 p-4 text-sm text-stone-800">
          <p><strong>Egg Chance:</strong> {playerIsReceiver ? "No egg possible" : `${Math.round(getEggChanceEstimate() * 100)}%`}</p>
          <p><strong>Refusal Risk:</strong> {getRefusalRiskLabel()}</p>
          <p><strong>Egg Quality:</strong> {getEggQualityPreview()}</p>
          <p><strong>Session Time:</strong> {getBreedingMinutes()} minutes</p>
          <p><strong>Family Risk:</strong> {parentChildWarning ? "Parent/Child" : fullSiblingWarning ? "Full Sibling" : halfSiblingWarning ? "Half Sibling" : "None"}</p>
        </div>
      </HelpModal>
    </>
  );
}