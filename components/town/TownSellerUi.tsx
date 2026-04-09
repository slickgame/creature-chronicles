"use client";

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
  if (trait === "domestic") return "Helps with home tasks and comfort-focused activities.";
  if (trait === "industrious") return "Improves work output and productive routines.";
  if (trait === "calm") return "Supports stable moods and smoother breeding behavior.";
  if (trait === "fertile") return "Improves egg and offspring-related outcomes.";
  if (trait === "quick") return "Improves time-sensitive tasks and general responsiveness.";
  if (trait === "sturdy") return "Improves stamina efficiency and physical resilience.";
  if (trait === "affectionate") return "Tends to improve bonding and relationship-focused interactions.";
  if (trait === "keen") return "Improves awareness, learning, and sharp reactions.";
  if (trait === "barnwise") return "Performs especially well in ranch and barn environments.";
  if (trait === "surefooted") return "Improves stability, reliability, and movement safety.";
  if (trait === "night_prawler") return "Performs best in late hours or low-light routines.";
  if (trait === "graceful") return "Improves elegant movement, poise, and refined handling.";
  return "No special effect.";
}

function getGradeDescription(grade: TraitGrade | string) {
  if (grade === "F") return "Very weak expression";
  if (grade === "D") return "Weak expression";
  if (grade === "C") return "Average expression";
  if (grade === "B") return "Strong expression";
  if (grade === "A") return "Excellent expression";
  if (grade === "S") return "Exceptional expression";
  return "Unknown grade";
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
    <div className="mt-2 flex flex-wrap gap-2">
      {traits.map((traitEntry, index) => (
        <div key={`${traitEntry.trait}-${traitEntry.grade}-${index}`} className="group relative">
          <div
            className={`inline-block rounded-full border px-2 py-1 text-xs font-semibold ${getTraitClasses(
              traitEntry.trait
            )}`}
          >
            {getTraitLabel(traitEntry.trait)} {traitEntry.grade}
          </div>

          <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-2xl border border-stone-300 bg-white p-3 text-left text-xs text-stone-700 shadow-xl group-hover:block">
            <p className="font-semibold text-stone-900">
              {getTraitLabel(traitEntry.trait)} ({traitEntry.grade})
            </p>
            <p className="mt-1">{getTraitDescription(traitEntry.trait)}</p>
            <p className="mt-1 text-stone-500">
              {getGradeDescription(traitEntry.grade)}
            </p>
          </div>
        </div>
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
