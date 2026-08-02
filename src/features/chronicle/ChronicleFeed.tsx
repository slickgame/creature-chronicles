import { getChronicleEntries, type ChronicleEntry } from "@/data/creatureMemories";
import type { GameSave } from "@/types/save";

type ChronicleFeedProps = {
  save: GameSave;
  limit?: number;
};

function ChronicleRow({ entry }: { entry: ChronicleEntry }) {
  return (
    <article className="grid gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 md:grid-cols-[92px_1fr]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">Ranch Day</p>
        <p className="text-2xl font-black text-amber-950">{entry.dayNumber}</p>
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-stone-950">{entry.title}</h3>
          <span className="rounded-full border border-amber-300 bg-white px-2 py-1 text-[11px] font-bold uppercase text-amber-900">
            {entry.importance}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-stone-700">{entry.description}</p>
      </div>
    </article>
  );
}

export function ChronicleFeed({ save, limit = 20 }: ChronicleFeedProps) {
  const entries = getChronicleEntries(save).slice(0, Math.max(1, limit));

  return (
    <section className="rounded-3xl border-4 border-amber-900 bg-[#fff8e7] p-5 shadow-xl" aria-labelledby="chronicle-feed-title">
      <div className="mb-4 border-b border-amber-200 pb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">Creature Chronicles</p>
        <h2 id="chronicle-feed-title" className="text-3xl font-black text-stone-950">Ranch Chronicle</h2>
        <p className="mt-1 text-sm text-stone-600">Important moments from creatures, family lines, guild work, and the Coliseum.</p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-300 bg-white/70 p-5 text-stone-600">
          The Chronicle is blank. Major ranch events will be recorded here.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <ChronicleRow key={entry.entryId} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}
