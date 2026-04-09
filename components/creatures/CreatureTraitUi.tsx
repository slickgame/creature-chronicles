"use client";

import { useState } from "react";

type CreatureTrait =
  | "domestic"
  | "industrious"
  | "calm"
  | "fertile"
  | "quick"
  | "sturdy";

type TraitGrade = "F" | "D" | "C" | "B" | "A" | "S";

export type CreatureTraitEntry = {
  trait: CreatureTrait;
  grade: TraitGrade;
};

export function getCreatureTraitLabel(trait: CreatureTrait) {
  if (trait === "domestic") return "Domestic";
  if (trait === "industrious") return "Industrious";
  if (trait === "calm") return "Calm";
  if (trait === "fertile") return "Fertile";
  if (trait === "quick") return "Quick";
  return "Sturdy";
}

export function getCreatureTraitClasses(trait: CreatureTrait) {
  if (trait === "domestic") return "bg-pink-100 text-pink-900 border-pink-300";
  if (trait === "industrious") return "bg-amber-100 text-amber-900 border-amber-300";
  if (trait === "calm") return "bg-sky-100 text-sky-900 border-sky-300";
  if (trait === "fertile") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  if (trait === "quick") return "bg-violet-100 text-violet-900 border-violet-300";
  return "bg-stone-200 text-stone-900 border-stone-400";
}

export function getCreatureTraitDescription(trait: CreatureTrait) {
  if (trait === "domestic") return "Improves cooking and cleaning tasks around the home.";
  if (trait === "industrious") return "Improves field work, hauling, and labor-heavy tasks.";
  if (trait === "calm") return "Reduces breeding refusal chance and helps settle tense pairings.";
  if (trait === "fertile") return "Improves egg production chance and supports stronger breeding outcomes.";
  if (trait === "quick") return "Reduces time costs for breeding sessions and work actions.";
  return "Reduces stamina costs and helps creatures endure repeated work.";
}

export function getCreatureGradeClasses(grade: TraitGrade) {
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

export function getCreatureGradeDescription(grade: TraitGrade) {
  if (grade === "F") return "Very weak";
  if (grade === "D") return "Weak";
  if (grade === "C") return "Average";
  if (grade === "B") return "Strong";
  if (grade === "A") return "Excellent";
  return "Exceptional";
}

function scaledPercent(grade: TraitGrade, basePercent: number) {
  return Math.max(1, Math.round(basePercent * getGradeMultiplier(grade)));
}

function scaledFlat(grade: TraitGrade, baseFlat: number) {
  return Math.max(1, Math.round(baseFlat * getGradeMultiplier(grade)));
}

export function getCreatureTraitGradeEffectText(
  trait: CreatureTrait,
  grade: TraitGrade
) {
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
  return `Stamina costs reduced by about ${scaledFlat(grade, 3)} points at full effect.`;
}

function CreatureTraitBadgeItem({
  entry,
  compact,
}: {
  entry: CreatureTraitEntry;
  compact: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full rounded-2xl border border-sky-200 bg-white/80 p-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="flex w-full flex-wrap items-center gap-1 text-left"
      >
        <div
          className={`inline-block rounded-full border px-2 py-1 font-semibold ${getCreatureTraitClasses(
            entry.trait
          )} ${compact ? "text-[11px]" : "text-sm"}`}
        >
          {getCreatureTraitLabel(entry.trait)}
        </div>
        <div
          className={`inline-block rounded-full border px-2 py-1 font-semibold ${getCreatureGradeClasses(
            entry.grade
          )} ${compact ? "text-[10px]" : "text-xs"}`}
        >
          {compact ? entry.grade : `Grade ${entry.grade}`}
        </div>
        <div className="ml-auto rounded-full border border-sky-300 bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-900">
          {open ? "Hide Info" : "Show Info"}
        </div>
      </button>

      {open ? (
        <div className="mt-2 rounded-2xl border border-stone-300 bg-white p-3 text-left text-xs text-stone-700 shadow-sm">
          <p className="font-semibold text-stone-900">
            {getCreatureTraitLabel(entry.trait)} ({entry.grade})
          </p>
          <p className="mt-1">{getCreatureTraitDescription(entry.trait)}</p>
          <p className="mt-2 font-medium text-stone-800">
            Grade Effect: {getCreatureTraitGradeEffectText(entry.trait, entry.grade)}
          </p>
          <p className="mt-1 text-stone-500">
            Grade: {getCreatureGradeDescription(entry.grade)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function CreatureTraitBadgeRow({
  traits,
  compact = false,
  maxVisible,
}: {
  traits: CreatureTraitEntry[];
  compact?: boolean;
  maxVisible?: number;
}) {
  if (!traits || traits.length === 0) {
    return (
      <div className="inline-block rounded-full border border-stone-300 bg-stone-100 px-2 py-1 text-[11px] font-semibold text-stone-700">
        No Traits
      </div>
    );
  }

  const visibleTraits =
    typeof maxVisible === "number" ? traits.slice(0, maxVisible) : traits;
  const remaining =
    typeof maxVisible === "number" ? Math.max(0, traits.length - maxVisible) : 0;

  return (
    <div className="space-y-2">
      {visibleTraits.map((entry, index) => (
        <CreatureTraitBadgeItem
          key={`${entry.trait}-${entry.grade}-${index}`}
          entry={entry}
          compact={compact}
        />
      ))}

      {remaining > 0 && (
        <div className="inline-block rounded-full border border-stone-300 bg-white px-2 py-1 text-[11px] font-semibold text-stone-700">
          +{remaining} more
        </div>
      )}
    </div>
  );
}
