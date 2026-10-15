import type { GameSave } from "@/types/save";
const REPLACEMENTS: Record<string,string> = {
  "/images/creatures/canine/base_canine_portrait.png": "/images/creatures/canine/daisy/daisy_02.webp",
  "/images/creatures/canine/base_canine_profile.png": "/images/creatures/canine/daisy/daisy_01.webp",
  "/images/creatures/lapine/bunny_portrait.png": "/images/creatures/lapine/gameplay/lapine_02.webp",
  "/images/creatures/lapine/bunny_profile.png": "/images/creatures/lapine/gameplay/lapine_01.webp",
  "/images/creatures/feline/base_feline_portrait.png": "/images/creatures/feline/nyla/nyla_02_bust_portrait.png",
  "/images/creatures/feline/base_feline_profile.png": "/images/creatures/feline/nyla/nyla_01_full_body.png",
  "/images/creatures/equine/horse_portrait.png": "/images/creatures/equine/gameplay/equine_02_bust_portrait.png",
  "/images/creatures/equine/horse_profile.png": "/images/creatures/equine/gameplay/equine_01_full_body.png"
};
/** Migrate exact obsolete card/profile URLs, including archived menu snapshots. Scene URLs are untouched. */
export function normalizeApprovedCreaturePortraits(save: GameSave): GameSave {
 return JSON.parse(JSON.stringify(save, (_key, value: unknown) => typeof value === "string" ? REPLACEMENTS[value] ?? value : value)) as GameSave;
}
