"use client";

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
  if (trait === "domestic") return "Boosts cooking and cleaning.";
  if (trait === "industrious") return "Boosts field work and hauling.";
  if (trait === "calm") return "Reduces breeding refusal chance.";
  if (trait === "fertile") return "Improves egg production chance.";
  if (trait === "quick") return "Reduces time costs.";
  return "Reduces stamina costs.";
}

export function getCreatureGradeClasses(grade: TraitGrade) {
  if (grade === "F") return "bg-stone-100 text-stone-700 border-stone-300";
  if (grade === "D") return "bg-slate-100 text-slate-800 border-slate-300";
  if (grade === "C") return "bg-blue-100 text-blue-900 border-blue-300";
  if (grade === "B") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  if (grade === "A") return "bg-amber-100 text-amber-900 border-amber-300";
  return "bg-rose-100 text-rose-900 border-rose-300";
}

export function getCreatureGradeDescription(grade: TraitGrade) {
  if (grade === "F") return "Very weak version";
  if (grade === "D") return "Weak version";
  if (grade === "C") return "Average version";
  if (grade === "B") return "Strong version";
  if (grade === "A") return "Excellent version";
  return "Exceptional version";
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

  const visibleTraits = typeof maxVisible === "number" ? traits.slice(0, maxVisible) : traits;
  const remaining = typeof maxVisible === "number" ? Math.max(0, traits.length - maxVisible) : 0;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleTraits.map((entry, index) => (
        <div
          key={`${entry.trait}-${entry.grade}-${index}`}
          className="group relative flex items-center gap-1"
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

          <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-56 rounded-2xl border border-stone-300 bg-white p-3 text-left text-xs text-stone-700 shadow-xl group-hover:block">
            <p className="font-semibold text-stone-900">
              {getCreatureTraitLabel(entry.trait)} ({entry.grade})
            </p>
            <p className="mt-1">{getCreatureTraitDescription(entry.trait)}</p>
            <p className="mt-1 text-stone-500">
              {getCreatureGradeDescription(entry.grade)}
            </p>
          </div>
        </div>
      ))}

      {remaining > 0 && (
        <div className="inline-block rounded-full border border-stone-300 bg-white px-2 py-1 text-[11px] font-semibold text-stone-700">
          +{remaining} more
        </div>
      )}
    </div>
  );
}
