"use client";

import {
  getRelationshipDisplayLabel,
  getRelationshipStageName,
} from "@/lib/town/relationshipDefaults";
import { buildNpcRelationshipStateFromPoints } from "@/lib/game/npcEconomy";

function getStageBadgeClasses(stage: ReturnType<typeof getRelationshipStageName>) {
  if (stage === "lover") return "border-fuchsia-300 text-fuchsia-900";
  if (stage === "close") return "border-rose-300 text-rose-900";
  if (stage === "familiar") return "border-pink-300 text-pink-900";
  if (stage === "interested") return "border-amber-300 text-amber-900";
  return "border-stone-300 text-stone-700";
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
  const relationshipState = buildNpcRelationshipStateFromPoints("npc", relationship);
  const stageName = getRelationshipStageName(relationshipState.level);

  return (
    <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-bold text-stone-900">{name}</p>
          <p className="text-sm text-stone-600">{role}</p>
        </div>
        <span
          className={`rounded-full border bg-white px-3 py-1 text-xs font-semibold ${getStageBadgeClasses(
            stageName
          )}`}
        >
          {stageName}
        </span>
      </div>

      <p className="mt-2 text-sm text-stone-700">{personality}</p>
      <p className="mt-3 text-sm text-stone-800">
        <strong>{getRelationshipDisplayLabel(relationshipState)}</strong>
      </p>

      <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-rose-600"
          style={{ width: `${Math.min(100, relationshipState.progress)}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-stone-600">Total progress points: {Math.max(0, Math.floor(relationship))}</p>

      {extraNote ? <p className="mt-3 text-xs text-stone-600">{extraNote}</p> : null}
    </div>
  );
}
