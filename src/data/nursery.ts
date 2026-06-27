import {
  DEFAULT_STAT_GRADES,
  STAT_KEYS,
  applyStatGrades,
  buildStats,
  getBaseMaxHearts,
  getCreatureMaxEnergyFromStats,
  getHabitatIdForFamily,
  getSpeciesDefinition,
  getVariantDefinition,
  getVariantsForFamily,
  rollCreatureAbilities,
  rollStatGrades,
  shiftStatGrade,
} from "@/data/creatures";
import type { BreedingParticipant } from "@/types/breeding";
import type { CreatureAbility, CreatureRecord, CreatureStats, StatGrade, StatGrades } from "@/types/creature";
import type { CreatureId, EggId, PregnancyId, SaveId, SpeciesId, VariantId } from "@/types/ids";
import type { EggRecord, GameSave, InheritancePreview, ParentSnapshot, PregnancyRecord } from "@/types/save";

export const NURSERY_ASSETS = { egg: "/images/ui/icons/icon_egg.png", pregnancy: "/images/ui/icons/icon_pregnancy.png", timer: "/images/ui/icons/icon_timer_hourglass.png", hatch: "/images/ui/icons/icon_hatch.png", background: "/images/backgrounds/nursery/egg_nursery_interior.png", originHatched: "/images/ui/icons/icon_origin_hatched.png", parentCompare: "/images/ui/icons/icon_parent_compare.png", statGrade: "/images/ui/icons/icon_stat_grade.png" } as const;

function getCreatureXpToNext(level: number): number { return 45 + level * 30; }
function deterministicRoll(seed: string, modulo = 100): number { let hash = 0; for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003; return Math.abs(hash) % modulo; }
function getHabitatIdForSpecies(speciesId: SpeciesId) { return getHabitatIdForFamily(getSpeciesDefinition(speciesId).family); }
function parentSnapshot(participant: BreedingParticipant): ParentSnapshot { return { participantId: participant.participantId, creatureId: participant.creatureId, displayName: participant.displayName, familyLabel: participant.familyLabel, kind: participant.kind }; }
function averageStat(statKey: keyof CreatureStats, giver?: CreatureRecord, receiver?: CreatureRecord): number { const values = [giver?.stats[statKey], receiver?.stats[statKey]].filter((value): value is number => typeof value === "number"); return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 5; }

function inheritGradeForStat(seed: string, statKey: keyof CreatureStats, giver?: CreatureRecord, receiver?: CreatureRecord): { grade: StatGrade; note: string | null } {
  const parentGrades = [giver?.statGrades?.[statKey], receiver?.statGrades?.[statKey]].filter((grade): grade is StatGrade => Boolean(grade));
  const fallbackGrade = rollStatGrades(`${seed}_fallback`, "Common")[statKey];
  const inheritedBase = parentGrades.length ? parentGrades[deterministicRoll(`${seed}_${statKey}_parent`, parentGrades.length)] : fallbackGrade;
  const roll = deterministicRoll(`${seed}_${statKey}_shift`);
  if (roll >= 94) { const upgraded = shiftStatGrade(inheritedBase, 1); return { grade: upgraded, note: upgraded === inheritedBase ? `${statKey} inherited ${inheritedBase}.` : `${statKey} inherited ${inheritedBase} and upgraded to ${upgraded}.` }; }
  if (roll <= 7) { const downgraded = shiftStatGrade(inheritedBase, -1); return { grade: downgraded, note: downgraded === inheritedBase ? `${statKey} inherited ${inheritedBase}.` : `${statKey} inherited ${inheritedBase} but downgraded to ${downgraded}.` }; }
  return { grade: inheritedBase, note: `${statKey} inherited ${inheritedBase}.` };
}

function inheritStatGrades(seed: string, giver?: CreatureRecord, receiver?: CreatureRecord): { statGrades: StatGrades; notes: string[] } { const notes: string[] = []; const statGrades = STAT_KEYS.reduce((grades, key) => { const inherited = inheritGradeForStat(seed, key, giver, receiver); if (inherited.note) notes.push(inherited.note); return { ...grades, [key]: inherited.grade }; }, {} as StatGrades); return { statGrades, notes }; }
function buildInheritedStats(seed: string, baseStats: CreatureStats, statGrades: StatGrades, giver?: CreatureRecord, receiver?: CreatureRecord): { stats: CreatureStats; notes: string[] } { const notes: string[] = []; const rawStats = STAT_KEYS.reduce((nextStats, statKey, index) => { const inheritedAverage = averageStat(statKey, giver, receiver); const gradeAdjustedBase = applyStatGrades(baseStats, statGrades)[statKey]; const baseAnchor = Math.round((inheritedAverage + gradeAdjustedBase) / 2); const roll = deterministicRoll(`${seed}_${statKey}_${index}`, 100); let variance = 0; if (roll <= 7) { variance = -2; notes.push(`${statKey} rolled unusually low.`); } else if (roll <= 24) variance = -1; else if (roll >= 93) { variance = 2; notes.push(`${statKey} rolled unusually high.`); } else if (roll >= 76) variance = 1; return { ...nextStats, [statKey]: Math.max(1, baseAnchor + variance) }; }, {} as CreatureStats); if (!notes.length) notes.push("Stats inherited normally from parent averages, stat grades, and minor RNG."); return { stats: rawStats, notes }; }

function pickVariant(seed: string, giver?: CreatureRecord, receiver?: CreatureRecord): VariantId {
  const receiverVariant = receiver ? getVariantDefinition(receiver.variantId) : null;
  const giverVariant = giver ? getVariantDefinition(giver.variantId) : null;
  const preferredFamily = receiverVariant?.family ?? giverVariant?.family ?? "feline";
  const variants = getVariantsForFamily(preferredFamily);
  const commonVariant = variants.find((variant) => variant.rarity === "Common") ?? variants[0];
  const rareVariants = variants.filter((variant) => variant.rarity !== "Common");
  const rareRoll = deterministicRoll(`${seed}_variant`, 100);
  if (rareRoll >= 90 && rareVariants.length) return rareVariants[deterministicRoll(`${seed}_rare_variant`, rareVariants.length)].variantId;
  if (receiverVariant && receiverVariant.rarity !== "Common" && rareRoll >= 82) return receiverVariant.variantId;
  if (giverVariant && giverVariant.rarity !== "Common" && rareRoll >= 86) return giverVariant.variantId;
  return commonVariant.variantId;
}

function buildInheritedAbilities(seed: string, speciesAbilities: CreatureAbility[], variantAbilities: CreatureAbility[], speciesId: SpeciesId, variantId: VariantId, giver?: CreatureRecord, receiver?: CreatureRecord): { abilities: CreatureAbility[]; notes: string[] } {
  const notes: string[] = [];
  const inheritedPool = [...(giver?.abilities ?? []), ...(receiver?.abilities ?? [])];
  const chosen = rollCreatureAbilities(`${seed}_base_abilities`, speciesId, variantId, false);
  if (inheritedPool.length && deterministicRoll(`${seed}_ability_inherit`, 100) >= 62) { const inheritedAbility = inheritedPool[deterministicRoll(`${seed}_ability_pick`, inheritedPool.length)]; if (!chosen.some((ability) => ability.id === inheritedAbility.id)) { chosen.push({ ...inheritedAbility, source: "future" }); notes.push(`${inheritedAbility.name} was inherited from a parent.`); } }
  if (deterministicRoll(`${seed}_ability_mutation`, 100) >= 94) { const mutationPool = [...speciesAbilities, ...variantAbilities].filter((ability) => !chosen.some((chosenAbility) => chosenAbility.id === ability.id)); if (mutationPool.length) { const mutatedAbility = mutationPool[deterministicRoll(`${seed}_ability_mutation_pick`, mutationPool.length)]; chosen.push({ ...mutatedAbility, source: "future" }); notes.push(`${mutatedAbility.name} appeared as a rare new ability roll.`); } }
  if (!notes.length) notes.push("Abilities followed normal species, variant, and general ability rolls.");
  return { abilities: chosen.slice(0, 3), notes };
}

export function createInheritancePreview(save: GameSave, giverParticipant: BreedingParticipant, receiverParticipant: BreedingParticipant, seed: string): InheritancePreview {
  const giverCreature = giverParticipant.creatureId ? (save.creatures ?? []).find((creature) => creature.creatureId === giverParticipant.creatureId) : undefined;
  const receiverCreature = receiverParticipant.creatureId ? (save.creatures ?? []).find((creature) => creature.creatureId === receiverParticipant.creatureId) : undefined;
  const projectedVariantId = pickVariant(seed, giverCreature, receiverCreature);
  const projectedVariant = getVariantDefinition(projectedVariantId);
  const projectedSpecies = getSpeciesDefinition(projectedVariant.speciesId);
  const gradeResult = inheritStatGrades(seed, giverCreature, receiverCreature);
  const variantAdjustedStats = STAT_KEYS.reduce((stats, key) => ({ ...stats, [key]: Math.max(1, projectedSpecies.baseStats[key] + (projectedVariant.statAdjustments[key] ?? 0)) }), {} as CreatureStats);
  const statResult = buildInheritedStats(seed, variantAdjustedStats, gradeResult.statGrades, giverCreature, receiverCreature);
  const abilityResult = buildInheritedAbilities(seed, projectedSpecies.exclusiveAbilityPool, projectedVariant.exclusiveAbilityPool, projectedSpecies.speciesId, projectedVariant.variantId, giverCreature, receiverCreature);
  return { projectedSpeciesId: projectedSpecies.speciesId, projectedVariantId: projectedVariant.variantId, projectedStats: statResult.stats, projectedStatGrades: gradeResult.statGrades, projectedAbilities: abilityResult.abilities, statRollNotes: [...gradeResult.notes, ...statResult.notes], abilityRollNotes: abilityResult.notes };
}

export function createPregnancyRecord(save: GameSave, giverParticipant: BreedingParticipant, receiverParticipant: BreedingParticipant, seed: string): PregnancyRecord { const inheritance = createInheritancePreview(save, giverParticipant, receiverParticipant, seed); const pregnancyId = `pregnancy_${save.dayState.dayNumber}_${Date.now()}` as PregnancyId; return { pregnancyId, createdAtDayNumber: save.dayState.dayNumber, createdAt: new Date().toISOString(), daysRemaining: 1, totalDays: 1, status: "pregnant", giver: parentSnapshot(giverParticipant), receiver: parentSnapshot(receiverParticipant), inheritance }; }
function createEggFromPregnancy(save: GameSave, pregnancy: PregnancyRecord): EggRecord { const variant = getVariantDefinition(pregnancy.inheritance.projectedVariantId); const eggId = `egg_${save.dayState.dayNumber}_${Date.now()}_${pregnancy.pregnancyId}` as EggId; return { eggId, ownerSaveId: save.saveId, createdAtDayNumber: save.dayState.dayNumber, createdAt: new Date().toISOString(), daysRemaining: 2, totalDays: 2, status: "incubating", rarity: variant.rarity, speciesId: pregnancy.inheritance.projectedSpeciesId, variantId: pregnancy.inheritance.projectedVariantId, habitatId: getHabitatIdForSpecies(pregnancy.inheritance.projectedSpeciesId), parents: { giver: pregnancy.giver, receiver: pregnancy.receiver }, projectedStats: pregnancy.inheritance.projectedStats, projectedStatGrades: pregnancy.inheritance.projectedStatGrades, projectedAbilities: pregnancy.inheritance.projectedAbilities, statRollNotes: pregnancy.inheritance.statRollNotes, abilityRollNotes: pregnancy.inheritance.abilityRollNotes }; }

export function advanceNurseryDay(save: GameSave): { save: GameSave; summaryItems: string[] } {
  const summaryItems: string[] = [];
  const deliveredEggs: EggRecord[] = [];
  const nextPregnancies = (save.pregnancies ?? []).map((pregnancy) => { if (pregnancy.status !== "pregnant") return pregnancy; const nextDaysRemaining = Math.max(0, pregnancy.daysRemaining - 1); if (nextDaysRemaining <= 0) { const egg = createEggFromPregnancy(save, pregnancy); deliveredEggs.push(egg); summaryItems.push(`${pregnancy.receiver.displayName} produced an egg.`); return { ...pregnancy, daysRemaining: 0, status: "delivered" as const }; } summaryItems.push(`${pregnancy.receiver.displayName}'s pregnancy timer advanced.`); return { ...pregnancy, daysRemaining: nextDaysRemaining }; });
  const nextEggs = [...deliveredEggs, ...(save.eggs ?? [])].map((egg) => { if (egg.status !== "incubating") return egg; const nextDaysRemaining = Math.max(0, egg.daysRemaining - 1); if (nextDaysRemaining <= 0) return { ...egg, daysRemaining: 0, status: "ready" as const }; return { ...egg, daysRemaining: nextDaysRemaining }; });
  if (nextEggs.some((egg) => egg.status === "ready")) summaryItems.push("An egg is ready to hatch in the nursery.");
  return { save: { ...save, pregnancies: nextPregnancies, eggs: nextEggs, eggIds: nextEggs.map((egg) => egg.eggId), flags: { ...save.flags, m5NurseryTimersAdvanced: true, m85EggGradeInheritance: true, m13NurseryContentPack: true } }, summaryItems };
}

function getNextCreatureId(save: GameSave): CreatureId { return `creature_hatched_${Date.now()}_${(save.creatures ?? []).length + 1}` as CreatureId; }
export function hatchEgg(save: GameSave, eggId: EggId, nickname?: string): { save: GameSave; creature: CreatureRecord } | null {
  const egg = (save.eggs ?? []).find((item) => item.eggId === eggId);
  if (!egg || egg.status !== "ready") return null;
  const variant = getVariantDefinition(egg.variantId);
  const species = getSpeciesDefinition(egg.speciesId);
  const targetHabitat = (save.habitats ?? []).find((habitat) => habitat.habitatId === egg.habitatId);
  if (targetHabitat && targetHabitat.creatureIds.length >= targetHabitat.capacity) return null;
  const creatureId = getNextCreatureId(save);
  const level = 1;
  const maxEnergy = getCreatureMaxEnergyFromStats(egg.projectedStats, variant.variantId);
  const maxHearts = getBaseMaxHearts(species.speciesId, variant.variantId);
  const creature: CreatureRecord = { creatureId, ownerSaveId: save.saveId, speciesId: species.speciesId, variantId: variant.variantId, habitatId: egg.habitatId, nickname: nickname?.trim() || `${variant.name} Hatchling`, level, xp: 0, xpToNext: getCreatureXpToNext(level), stats: egg.projectedStats, statGrades: egg.projectedStatGrades ?? DEFAULT_STAT_GRADES, abilities: egg.projectedAbilities, energy: maxEnergy, maxEnergy, hearts: maxHearts, maxHearts, affection: 35, generation: 2, shiny: false, cosmeticVariant: null, origin: "hatched", originLabel: `Hatched · ${egg.parents.giver.displayName} × ${egg.parents.receiver.displayName}`, isLocked: false, createdAt: new Date().toISOString(), notes: `Hatched from ${egg.parents.giver.displayName} and ${egg.parents.receiver.displayName}.` };
  const nextEggs = (save.eggs ?? []).map((item) => item.eggId === eggId ? { ...item, status: "hatched" as const } : item);
  const totalHatched = Number(save.flags.m9TotalHatched ?? 0) + 1;
  return { creature, save: { ...save, creatures: [creature, ...(save.creatures ?? [])], creatureIds: [creature.creatureId, ...save.creatureIds], habitats: (save.habitats ?? []).map((habitat) => habitat.habitatId === egg.habitatId ? { ...habitat, creatureIds: [creature.creatureId, ...habitat.creatureIds] } : habitat), eggs: nextEggs, eggIds: nextEggs.map((item) => item.eggId), flags: { ...save.flags, m5EggHatched: true, m85HatchedStatGrades: true, m9HatchResultImproved: true, m9TotalHatched: totalHatched, m13HatchedContentPack: true } } };
}

export function removeEgg(save: GameSave, eggId: EggId, mode: "release" | "donate"): GameSave { const nextEggs = (save.eggs ?? []).filter((egg) => egg.eggId !== eggId); return { ...save, eggs: nextEggs, eggIds: nextEggs.map((egg) => egg.eggId), currencies: mode === "donate" ? { ...save.currencies, gold: save.currencies.gold + 75, guildPoints: save.currencies.guildPoints + 1 } : save.currencies, flags: { ...save.flags, m5EggRemoved: mode } }; }
