"use client";

function getRelationshipTierLabel(relationship: number) {
  if (relationship >= 75) return "Close";
  if (relationship >= 50) return "Trusted";
  if (relationship >= 25) return "Friendly";
  return "Stranger";
}

export function RelationshipCard({
  name,
  role,
  personality,
  relationship,
  extraNote,
}: {
  name: string;
  role: string;
  personality: string;
  relationship: number;
  extraNote?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-bold text-stone-900">{name}</p>
          <p className="text-sm text-stone-600">{role}</p>
        </div>
        <span className="rounded-full border border-rose-300 bg-white px-3 py-1 text-xs font-semibold text-rose-900">
          {getRelationshipTierLabel(relationship)}
        </span>
      </div>

      <p className="mt-2 text-sm text-stone-700">{personality}</p>
      <p className="mt-3 text-sm text-stone-800">
        <strong>Relationship:</strong> {relationship}/100
      </p>

      <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-rose-600"
          style={{ width: `${Math.min(100, relationship)}%` }}
        />
      </div>

      {extraNote ? (
        <p className="mt-3 text-xs text-stone-600">{extraNote}</p>
      ) : null}
    </div>
  );
}
