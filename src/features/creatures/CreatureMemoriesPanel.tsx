import { getCreatureMemories, type CreatureMemory, type CreatureMemoryImportance } from "@/data/creatureMemories";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

type CreatureMemoriesPanelProps = {
  save: GameSave;
  creatureId: CreatureId;
  limit?: number;
  compact?: boolean;
};

const IMPORTANCE_LABEL: Record<CreatureMemoryImportance, string> = {
  minor: "Memory",
  notable: "Notable",
  major: "Major",
  legendary: "Legendary",
};

function importanceClasses(importance: CreatureMemoryImportance): string {
  if (importance === "legendary") return "border-amber-400 bg-amber-50 text-amber-950";
  if (importance === "major") return "border-violet-300 bg-violet-50 text-violet-950";
  if (importance === "notable") return "border-sky-300 bg-sky-50 text-sky-950";
  return "border-stone-300 bg-stone-50 text-stone-900";
}

function MemoryCard({ memory, compact }: { memory: CreatureMemory; compact: boolean }) {
  return (
    <article className={`rounded-2xl border p-3 ${importanceClasses(memory.importance)}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-bold">{memory.title}</h4>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="rounded-full border border-current/20 bg-white/60 px-2 py-1">
            {IMPORTANCE_LABEL[memory.importance]}
          </span>
          <span>Day {memory.dayNumber}</span>
        </div>
      </div>
      {!compact && <p className="mt-2 text-sm leading-6 opacity-90">{memory.description}</p>}
      {!compact && memory.tags && memory.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {memory.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-semibold">
              {tag.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export function CreatureMemoriesPanel({
  save,
  creatureId,
  limit = 8,
  compact = false,
}: CreatureMemoriesPanelProps) {
  const memories = getCreatureMemories(save, creatureId).slice(0, Math.max(1, limit));

  return (
    <section className="rounded-3xl border-2 border-stone-300 bg-white/85 p-4 shadow-sm" aria-labelledby={`memories-${creatureId}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Legacy</p>
          <h3 id={`memories-${creatureId}`} className="text-xl font-bold text-stone-950">Memories</h3>
        </div>
        <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-bold text-white">
          {getCreatureMemories(save, creatureId).length}
        </span>
      </div>

      {memories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
          This creature has not recorded any memories yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {memories.map((memory) => (
            <MemoryCard key={memory.memoryId} memory={memory} compact={compact} />
          ))}
        </div>
      )}
    </section>
  );
}
