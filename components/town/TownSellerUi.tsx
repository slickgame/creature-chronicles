"use client";

import { useState } from "react";

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

type TraitGrade = "F" | "D" | "C" | "B" | "A" | "S";

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

function getTraitDescription(trait: CreatureTrait) {
  if (trait === "domestic") return "Improves cooking and cleaning tasks around the home.";
  if (trait === "industrious") return "Improves field work, hauling, and labor-heavy tasks.";
  if (trait === "calm") return "Reduces breeding refusal chance and helps settle tense pairings.";
  if (trait === "fertile") return "Improves egg production chance and supports stronger breeding outcomes.";
  if (trait === "quick") return "Reduces time costs for breeding sessions and work actions.";
  if (trait === "sturdy") return "Reduces stamina costs and helps creatures endure repeated work.";
  if (trait === "affectionate") return "Boosts happiness gains and relationship-oriented interactions.";
  if (trait === "keen") return "Improves scouting, task efficiency, and future event/quest performance hooks.";
  if (trait === "barnwise") return "Horse-focused trait that improves ranch routines, hauling, and stable reliability.";
  if (trait === "surefooted") return "Horse-focused trait that improves travel toughness and steady field performance.";
  if (trait === "night_prawler") return "Cat-focused trait that improves stealthy or after-hours task performance.";
  if (trait === "graceful") return "Cat-focused trait that improves elegance, charm, and soft-support style bonuses.";
  return "No special effect.";
}

function getTraitSpeciesNote(trait: CreatureTrait) {
  if (trait === "barnwise" || trait === "surefooted") {
    return "Horse-specific trait";
  }
  if (trait === "night_prawler" || trait === "graceful") {
    return "Cat-specific trait";
  }
  return "General trait";
}

function getGradeMultiplier(grade: TraitGrade) {
  if (grade === "F") return 0.35;
  if (grade === "D") return 0.5;
  if (grade === "C") return 0.7;
  if (grade === "B") return 0.9;
  if (grade === "A") return 1.15;
  return 1.4;
}

function getGradeDescription(grade: TraitGrade | string) {
  if (grade === "F") return "Very weak";
  if (grade === "D") return "Weak";
  if (grade === "C") return "Average";
  if (grade === "B") return "Strong";
  if (grade === "A") return "Excellent";
  if (grade === "S") return "Exceptional";
  return "Unknown grade";
}

function scaledPercent(grade: TraitGrade, basePercent: number) {
  return Math.max(1, Math.round(basePercent * getGradeMultiplier(grade)));
}

function scaledFlat(grade: TraitGrade, baseFlat: number) {
  return Math.max(1, Math.round(baseFlat * getGradeMultiplier(grade)));
}

function getTraitGradeEffectText(trait: CreatureTrait, grade: TraitGrade | string) {
  if (grade !== "F" && grade !== "D" && grade !== "C" && grade !== "B" && grade !== "A" && grade !== "S") {
    return "Grade effect unknown.";
  }

  if (trait === "domestic") {
    return `Cooking and cleaning efficiency about +${scaledPercent(grade, 12)}%.`;
  }
  if (trait === "industrious") {
    return `Field work and labor efficiency about +${scaledPercent(grade, 12)}%.`;
  }
  if (trait === "calm") {
    return `Breeding refusal chance reduced by about ${scaledPercent(grade, 8)}%.`;
  }
  if (trait === "fertile") {
    return `Egg chance support worth about +${scaledPercent(grade, 7)}%.`;
  }
  if (trait === "quick") {
    return `Action time reduced by about ${scaledFlat(grade, 10)} minutes at full effect.`;
  }
  if (trait === "sturdy") {
    return `Stamina costs reduced by about ${scaledFlat(grade, 3)} points at full effect.`;
  }
  if (trait === "affectionate") {
    return `Extra happiness and relationship gains worth about +${scaledPercent(grade, 10)}%.`;
  }
  if (trait === "keen") {
    return `Task precision and quest/event utility worth about +${scaledPercent(grade, 10)}%.`;
  }
  if (trait === "barnwise") {
    return `Stable chores, hauling, and ranch routines worth about +${scaledPercent(grade, 11)}%.`;
  }
  if (trait === "surefooted") {
    return `Travel toughness and steady field output worth about +${scaledPercent(grade, 11)}%.`;
  }
  if (trait === "night_prawler") {
    return `Stealthy, after-hours, and scouting style actions worth about +${scaledPercent(grade, 11)}%.`;
  }
  if (trait === "graceful") {
    return `Charm, elegance, and social support utility worth about +${scaledPercent(grade, 11)}%.`;
  }
  return "No special effect.";
}

function TraitBadgeItem({
  trait,
  grade,
}: {
  trait: CreatureTrait;
  grade: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full rounded-2xl border border-amber-200 bg-white/80 p-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="flex w-full flex-wrap items-center gap-1 text-left"
      >
        <div
          className={`inline-block rounded-full border px-2 py-1 text-xs font-semibold ${getTraitClasses(
            trait
          )}`}
        >
          {getTraitLabel(trait)} {grade}
        </div>

        <div className="ml-auto rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-900">
          {open ? "Hide Info" : "Show Info"}
        </div>
      </button>

      {open ? (
        <div className="mt-2 rounded-2xl border border-stone-300 bg-white p-3 text-left text-xs text-stone-700 shadow-sm">
          <p className="font-semibold text-stone-900">
            {getTraitLabel(trait)} ({grade})
          </p>
          <p className="mt-1 text-stone-500">{getTraitSpeciesNote(trait)}</p>
          <p className="mt-2">{getTraitDescription(trait)}</p>
          <p className="mt-2 font-medium text-stone-800">
            Grade Effect: {getTraitGradeEffectText(trait, grade)}
          </p>
          <p className="mt-1 text-stone-500">
            Grade: {getGradeDescription(grade)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function TraitBadgeRow({
  traits,
}: {
  traits: { trait: CreatureTrait; grade: string }[];
}) {
  if (!traits || traits.length === 0) {
    return (
      <div className="mt-2">
        <div className="inline-block rounded-full border border-stone-300 bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
          No Traits
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {traits.map((traitEntry, index) => (
        <TraitBadgeItem
          key={`${traitEntry.trait}-${traitEntry.grade}-${index}`}
          trait={traitEntry.trait}
          grade={traitEntry.grade}
        />
      ))}
    </div>
  );
}

export function SellerStockList({
  stock,
  playerGold,
  onPurchase,
  emptyMessage,
}: {
  stock: {
    id: number;
    price: number;
    creature: {
      nickname: string;
      name: string;
      level: number;
      theme: string;
      traits: { trait: CreatureTrait; grade: string }[];
      stats: {
        strength: number;
        endurance: number;
        intelligence: number;
        speed: number;
        fertility: number;
        vitality: number;
      };
    };
  }[];
  playerGold: number;
  onPurchase: (stockId: number) => void;
  emptyMessage?: string;
}) {
  if (stock.length === 0) {
    return (
      <div className="rounded-2xl bg-amber-50 p-4 text-stone-700">
        {emptyMessage ?? "The seller is sold out for today."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stock.map((entry) => (
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
              <TraitBadgeRow traits={entry.creature.traits} />
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
            onClick={() => onPurchase(entry.id)}
            disabled={playerGold < entry.price}
            className={`w-full rounded-2xl px-4 py-3 font-semibold text-white shadow ${
              playerGold >= entry.price ? "bg-amber-700" : "bg-gray-500"
            }`}
          >
            {playerGold >= entry.price ? "Buy Creature" : "Not Enough Gold"}
          </button>
        </div>
      ))}
    </div>
  );
}
