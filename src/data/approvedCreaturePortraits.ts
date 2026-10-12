import type { GameSave } from "@/types/save";
const REPLACEMENTS: Record<string,string> = {
  "/images/creatures/feline/base_feline_portrait.png": "/images/creatures/feline/nyla/nyla_02_bust_portrait.png",
  "/images/creatures/feline/base_feline_profile.png": "/images/creatures/feline/nyla/nyla_01_full_body.png",
  "/images/creatures/equine/horse_portrait.png": "/images/creatures/equine/gameplay/equine_02_bust_portrait.png",
  "/images/creatures/equine/horse_profile.png": "/images/creatures/equine/gameplay/equine_01_full_body.png"
};
/** Migrate exact obsolete card/profile URLs, including archived menu snapshots. Scene URLs are untouched. */
export function normalizeApprovedCreaturePortraits(save: GameSave): GameSave {
 return JSON.parse(JSON.stringify(save, (_key, value: unknown) => typeof value === "string" ? REPLACEMENTS[value] ?? value : value)) as GameSave;
}
