import type { NpcVisitImage } from "@/lib/town/npcImages";

export function NpcVisitImageFrame({
  image,
  accentClasses = "border-stone-300 bg-stone-100 text-stone-800",
}: {
  image: NpcVisitImage;
  accentClasses?: string;
}) {
  return (
    <div className={`rounded-lg border p-3 ${accentClasses}`} aria-label={image.altText}>
      <div className="flex aspect-[4/5] min-h-40 items-center justify-center rounded-lg border border-white/80 bg-white/80 px-4 text-center shadow-inner">
        <div>
          <p className="text-xs font-semibold uppercase text-stone-500">
            {image.label}
          </p>
          <p className="mt-2 break-words text-lg font-bold text-stone-950">
            {image.imageId}
          </p>
          <p className="mt-2 text-xs text-stone-600">
            {image.source === "base"
              ? "Always-on visit art"
              : `Relationship stage: ${image.stageName}`}
          </p>
        </div>
      </div>
    </div>
  );
}
