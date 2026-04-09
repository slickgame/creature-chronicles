"use client";

import { useState } from "react";
import {
  getPlayerGradeClasses,
  getPlayerGradeDescription,
  getPlayerGradeMultiplierLabel,
  getPlayerTraitClasses,
  getPlayerTraitDescription,
  getPlayerTraitGradeEffectText,
  getPlayerTraitLabel,
  getPlayerTraitSpeciesNote,
  type PlayerFacingTraitGrade,
} from "@/lib/traits/playerTraitInfo";

type CreatureTrait =
  | "domestic"
  | "industrious"
  | "calm"
  | "fertile"
  | "quick"
  | "sturdy";

type TraitGrade = PlayerFacingTraitGrade;

export type CreatureTraitEntry = {
  trait: CreatureTrait;
  grade: TraitGrade;
};

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
          className={`inline-block rounded-full border px-2 py-1 font-semibold ${getPlayerTraitClasses(
            entry.trait
          )} ${compact ? "text-[11px]" : "text-sm"}`}
        >
          {getPlayerTraitLabel(entry.trait)}
        </div>
        <div
          className={`inline-block rounded-full border px-2 py-1 font-semibold ${getPlayerGradeClasses(
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
            {getPlayerTraitLabel(entry.trait)} ({entry.grade})
          </p>
          <p className="mt-1 text-stone-500">
            {getPlayerTraitSpeciesNote(entry.trait)}
          </p>
          <p className="mt-2">{getPlayerTraitDescription(entry.trait)}</p>
          <p className="mt-2 font-medium text-stone-800">
            Grade Effect: {getPlayerTraitGradeEffectText(entry.trait, entry.grade)}
          </p>
          <p className="mt-1 text-stone-500">
            Grade: {getPlayerGradeDescription(entry.grade)} • {getPlayerGradeMultiplierLabel(entry.grade)}
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
