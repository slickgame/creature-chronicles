import { getSpeciesDefinition, getVariantDefinition, STAT_KEYS } from "@/data/creatures";
import type { CreatureFamily, CreatureRecord, CreatureStatKey, StatGrade } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export const COLLECTION_ASSETS = {
  collection: "/images/ui/icons/icon_collection_book.png",
  sortFilter: "/images/ui/icons/icon_sort_filter.png",
  statGrade: "/images/ui/icons/icon_stat_grade.png",
  lock: "/images/ui/icons/icon_lock_favorite.png",
  release: "/images/ui/icons/icon_release_creature.png",
  donate: "/images/ui/icons/icon_donate_creature.png",
  parentCompare: "/images/ui/icons/icon_parent_compare.png",
  originStarter: "/images/ui/icons/icon_origin_starter.png",
  originMarket: "/images/ui/icons/icon_origin_market.png",
  originHatched: "/images/ui/icons/icon_origin_hatched.png",
  originGuild: "/images/ui/icons/icon_origin_guild.png",
} as const;

export const STAT_LABELS: Record<CreatureStatKey, string> = { STR: "Strength", DEX: "Dexterity", STA: "Stamina", CHA: "Charm", WIL: "Willpower", FER: "Fertility" };
const GRADE_SCORE: Record<StatGrade, number> = { D: 1, C: 2, B: 3, A: 4, S: 5 };
export type CreatureSortMode = "name" | "species" | "variant" | "level" | "rarity" | "best-grade" | "origin";
export type CreatureFilterMode = "all" | CreatureFamily | "starter" | "market" | "hatched" | "guild" | "locked";

export type CollectionSummary = { discoveredSpecies: number; discoveredVariants: number; highestGrade: StatGrade; totalHatched: number; totalReleased: number; totalDonated: number; speciesNames: string[]; variantNames: string[] };
export function getOriginIcon(origin: CreatureRecord["origin"] | undefined): string { if (origin === "starter") return COLLECTION_ASSETS.originStarter; if (origin === "market") return COLLECTION_ASSETS.originMarket; if (origin === "hatched") return COLLECTION_ASSETS.originHatched; if (origin === "guild") return COLLECTION_ASSETS.originGuild; return COLLECTION_ASSETS.collection; }
export function getHighestStatGrade(creature: CreatureRecord): StatGrade { return STAT_KEYS.reduce((highest, key) => { const nextGrade = creature.statGrades?.[key] ?? "D"; return GRADE_SCORE[nextGrade] > GRADE_SCORE[highest] ? nextGrade : highest; }, "D" as StatGrade); }
export function getBestStatLabels(creature: CreatureRecord): string[] { const highestValue = Math.max(...STAT_KEYS.map((key) => creature.stats[key])); return STAT_KEYS.filter((key) => creature.stats[key] === highestValue).map((key) => STAT_LABELS[key]); }
export function getCollectionSummary(save: GameSave): CollectionSummary { const creatures = save.creatures ?? []; const speciesNames = Array.from(new Set(creatures.map((creature) => getSpeciesDefinition(creature.speciesId).name))).sort(); const variantNames = Array.from(new Set(creatures.map((creature) => getVariantDefinition(creature.variantId).name))).sort(); const highestGrade = creatures.reduce((highest, creature) => { const creatureGrade = getHighestStatGrade(creature); return GRADE_SCORE[creatureGrade] > GRADE_SCORE[highest] ? creatureGrade : highest; }, "D" as StatGrade); return { discoveredSpecies: speciesNames.length, discoveredVariants: variantNames.length, highestGrade, totalHatched: Number(save.flags.m9TotalHatched ?? 0), totalReleased: Number(save.flags.m9TotalReleased ?? 0), totalDonated: Number(save.flags.m9TotalDonated ?? 0), speciesNames, variantNames }; }
export function sortAndFilterCreatures(creatures: CreatureRecord[], filter: CreatureFilterMode, sort: CreatureSortMode): CreatureRecord[] {
  const filtered = creatures.filter((creature) => { const variant = getVariantDefinition(creature.variantId); if (filter === "all") return true; if (["feline", "canine", "bovine", "lapine", "equine"].includes(filter)) return variant.family === filter; if (filter === "locked") return creature.isLocked; return creature.origin === filter; });
  return [...filtered].sort((a, b) => { const variantA = getVariantDefinition(a.variantId); const variantB = getVariantDefinition(b.variantId); const speciesA = getSpeciesDefinition(a.speciesId); const speciesB = getSpeciesDefinition(b.speciesId); if (sort === "level") return b.level - a.level || a.nickname.localeCompare(b.nickname); if (sort === "rarity") return variantA.rarity.localeCompare(variantB.rarity) || a.nickname.localeCompare(b.nickname); if (sort === "species") return speciesA.name.localeCompare(speciesB.name) || a.nickname.localeCompare(b.nickname); if (sort === "variant") return variantA.name.localeCompare(variantB.name) || a.nickname.localeCompare(b.nickname); if (sort === "best-grade") return GRADE_SCORE[getHighestStatGrade(b)] - GRADE_SCORE[getHighestStatGrade(a)] || a.nickname.localeCompare(b.nickname); if (sort === "origin") return (a.originLabel ?? a.origin ?? "unknown").localeCompare(b.originLabel ?? b.origin ?? "unknown") || a.nickname.localeCompare(b.nickname); return a.nickname.localeCompare(b.nickname); });
}
export function releaseOrDonateCreature(save: GameSave, creatureId: CreatureId, mode: "release" | "donate"): { save: GameSave; ok: boolean; message: string } { const creature = (save.creatures ?? []).find((item) => item.creatureId === creatureId); if (!creature) return { save, ok: false, message: "Creature not found." }; if (creature.isLocked) return { save, ok: false, message: `${creature.nickname} is locked. Unlock them before ${mode === "donate" ? "donating" : "releasing"}.` }; const nextCreatures = (save.creatures ?? []).filter((item) => item.creatureId !== creatureId); const nextCreatureIds = save.creatureIds.filter((id) => id !== creatureId); const nextHabitats = (save.habitats ?? []).map((habitat) => ({ ...habitat, creatureIds: habitat.creatureIds.filter((id) => id !== creatureId) })); const rewardGold = mode === "donate" ? Math.max(50, creature.level * 35 + getHighestStatGrade(creature).charCodeAt(0)) : 0; const rewardGp = mode === "donate" ? 1 : 0; const totalReleased = Number(save.flags.m9TotalReleased ?? 0) + (mode === "release" ? 1 : 0); const totalDonated = Number(save.flags.m9TotalDonated ?? 0) + (mode === "donate" ? 1 : 0); return { save: { ...save, creatures: nextCreatures, creatureIds: nextCreatureIds, habitats: nextHabitats, currencies: mode === "donate" ? { ...save.currencies, gold: save.currencies.gold + rewardGold, guildPoints: save.currencies.guildPoints + rewardGp } : save.currencies, flags: { ...save.flags, m9CreatureManagement: true, m9TotalReleased: totalReleased, m9TotalDonated: totalDonated } }, ok: true, message: mode === "donate" ? `${creature.nickname} donated for ${rewardGold} Gold and ${rewardGp} GP.` : `${creature.nickname} was released from the ranch.` }; }
