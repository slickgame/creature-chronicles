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

function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${suffix}`;
}

export function QuestOfferCard({
  title,
  description,
  giverName,
  completed,
  expired,
  expiringSoon = false,
  requirement,
  deadlineDay,
  deadlineHour,
  deadlineMinute,
  rewardGold,
  rewardXp,
  relationshipGain,
  eligibleCreatures,
  onSubmit,
  accentClasses,
  openClasses,
}: {
  title: string;
  description: string;
  giverName?: string;
  completed: boolean;
  expired: boolean;
  expiringSoon?: boolean;
  requirement: {
    species: string;
    minimumLevel: number;
    requiredTrait?: CreatureTrait | null;
  };
  deadlineDay: number;
  deadlineHour: number;
  deadlineMinute: number;
  rewardGold: number;
  rewardXp: number;
  relationshipGain?: number;
  eligibleCreatures: {
    id: number;
    nickname: string;
    name: string;
    level: number;
  }[];
  onSubmit: (creatureId: number) => void;
  accentClasses: string;
  openClasses: string;
}) {
  return (
    <div className={`rounded-2xl border-2 p-4 ${accentClasses}`}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          {giverName ? (
            <p className="text-sm font-semibold text-purple-800">{giverName}</p>
          ) : null}
          <h3 className="text-xl font-bold text-stone-900">{title}</h3>
          <p className="text-stone-700">{description}</p>
        </div>

        <div className="flex flex-col gap-2 text-right text-sm">
          {completed ? (
            <span className="rounded-full border border-green-300 bg-green-100 px-3 py-1 font-semibold text-green-900">
              Completed
            </span>
          ) : expired ? (
            <span className="rounded-full border border-red-300 bg-red-100 px-3 py-1 font-semibold text-red-900">
              Expired
            </span>
          ) : expiringSoon ? (
            <span className="rounded-full border border-orange-300 bg-orange-100 px-3 py-1 font-semibold text-orange-900">
              Expires Soon
            </span>
          ) : (
            <span className={`rounded-full border px-3 py-1 font-semibold ${openClasses}`}>
              Open
            </span>
          )}
        </div>
      </div>

      <div className="mb-3 rounded-2xl bg-white/80 p-3 text-sm text-stone-800">
        <p><strong>Species:</strong> {requirement.species}</p>
        <p><strong>Minimum Level:</strong> {requirement.minimumLevel}</p>
        <p><strong>Required Trait:</strong> {requirement.requiredTrait ? getTraitLabel(requirement.requiredTrait) : "None"}</p>
        <p><strong>Deadline:</strong> Day {deadlineDay} {formatTime(deadlineHour, deadlineMinute)}</p>
        <p>
          <strong>Rewards:</strong> {rewardGold} Gold, {rewardXp} XP
          {typeof relationshipGain === "number" ? `, +${relationshipGain} Relationship` : ""}
        </p>
      </div>

      {completed || expired ? null : eligibleCreatures.length === 0 ? (
        <p className="text-sm font-semibold text-red-700">
          No eligible creatures available right now.
        </p>
      ) : (
        <div className="space-y-2">
          {eligibleCreatures.map((creature) => (
            <button
              key={creature.id}
              onClick={() => onSubmit(creature.id)}
              className="w-full rounded-2xl bg-stone-800 px-4 py-3 text-left font-semibold text-white shadow"
            >
              Submit {creature.nickname} ({creature.name}, Lv {creature.level})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
