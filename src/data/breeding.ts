import { CREATURE_PLACEHOLDER_IMAGE, DEFAULT_STAT_GRADES, STAT_KEYS, getSpeciesDefinition, getVariantDefinition, getVariantMaxEnergyBonus } from "@/data/creatures";
import { getBreedingSceneImagePath } from "@/data/breedingSceneImages";
import { applyCreatureLevelGrowth, getProjectedMaxEnergyForCreature, normalizeGrowthProgress } from "@/data/levelGrowth";
import { createPregnancyRecord } from "@/data/nursery";
import { getRanchUpgradeEffects } from "@/data/ranchUpgrades";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import type { BreedingAttemptRecord, BreedingOutcomeType, BreedingParticipant, BreedingPreview, BreedingProgressionEvent, BreedingSceneFamily, BreedingState } from "@/types/breeding";
import type { CreatureAbility, CreatureRecord, CreatureStatKey, CreatureStats, StatGrades } from "@/types/creature";
import type { BreedingAttemptId, CreatureId } from "@/types/ids";
import type { GameSave, PlayerProfile } from "@/types/save";

export const PLAYER_PARTICIPANT_ID = "player";
const DEFAULT_PLAYER_STATS: CreatureStats = { STR: 5, DEX: 5, STA: 5, CHA: 5, WIL: 5, FER: 5 };
const PLAYER_GROWTH_PROFILE = { STR: 10, DEX: 10, STA: 14, CHA: 20, WIL: 18, FER: 16 } satisfies Record<keyof CreatureStats, number>;
const FERTILITY_TONIC_PREGNANCY_BONUS = 12;

export function getCreatureMaxEnergyFromStats(stats: CreatureStats, variantId?: string, level = 1, statGrades: StatGrades = DEFAULT_STAT_GRADES): number {
  return 70 + Math.floor(stats.STA * 3.5) + (variantId ? getVariantMaxEnergyBonus(variantId as never) : 0) + Math.floor(Math.max(0, level - 1) * ({ D: 0.75, C: 1.25, B: 1.75, A: 2.25, S: 3 }[statGrades.STA] ?? 0.75));
}
export function getPlayerMaxEnergyFromStats(stats: CreatureStats): number { return 450 + stats.STA * 10; }
export function createDefaultBreedingState(): BreedingState { return { hearts: 0, maxHearts: 0, attempts: [], streaks: [] }; }
export function getPairKey(giverId: string, receiverId: string): string { return [giverId, receiverId].sort().join("__"); }
function getCreatureXpToNext(level: number): number { return 45 + level * 30; }
function getBreederXpToNext(level: number): number { return 70 + level * 45; }
function deterministicRoll(seed: string, modulo = 100): number { let hash = 0; for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003; return Math.abs(hash) % modulo; }
function normalizePlayer(player: PlayerProfile): PlayerProfile { const breederRank = player.breederRank ?? 1; return { ...player, breederRank, breederXp: player.breederXp ?? 0, breederXpToNext: player.breederXpToNext ?? getBreederXpToNext(breederRank), stats: player.stats ?? DEFAULT_PLAYER_STATS, statGrades: player.statGrades ?? DEFAULT_STAT_GRADES, hearts: player.hearts ?? 4, maxHearts: player.maxHearts ?? 4 }; }
function normalizeCreature(creature: CreatureRecord): CreatureRecord { const level = creature.level ?? 1; const statGrades = creature.statGrades ?? DEFAULT_STAT_GRADES; const maxEnergy = getProjectedMaxEnergyForCreature({ ...creature, level, statGrades }); const species = getSpeciesDefinition(creature.speciesId); const variant = getVariantDefinition(creature.variantId); const baseHearts = species.baseMaxHearts + variant.maxHeartsBonus; return { ...creature, level, statGrades, growthProgress: normalizeGrowthProgress(creature.growthProgress), xp: creature.xp ?? 0, xpToNext: creature.xpToNext ?? getCreatureXpToNext(level), maxEnergy, energy: Math.min(creature.energy ?? maxEnergy, maxEnergy), hearts: creature.hearts ?? baseHearts, maxHearts: Math.max(creature.maxHearts ?? baseHearts, baseHearts) }; }
function isCreatureInjuredForBreeding(creature: CreatureRecord, dayNumber: number): boolean { return typeof creature.injuredUntilDayNumber === "number" && creature.injuredUntilDayNumber >= dayNumber; }
function getActivePregnancyForParticipant(save: GameSave, participantId: string) { return (save.pregnancies ?? []).find((pregnancy) => pregnancy.status === "pregnant" && pregnancy.receiver.participantId === participantId); }
function gradeMultiplier(grade: CreatureAbility["grade"]): number { if (grade === "S") return 1.6; if (grade === "A") return 1.35; if (grade === "B") return 1.15; if (grade === "C") return 1; if (grade === "D") return 0.8; return 0.65; }
function getAbilityEffect(ability: CreatureAbility) { const multiplier = gradeMultiplier(ability.grade); const lowerName = ability.id.toLowerCase(); return { pregnancyChance: lowerName.includes("fert") || lowerName.includes("bond") || lowerName.includes("grace") || lowerName.includes("lucky") ? Math.round(3 * multiplier) : Math.round(1 * multiplier), xpGain: lowerName.includes("learn") || lowerName.includes("growth") || lowerName.includes("vigor") || lowerName.includes("spark") ? Math.round(4 * multiplier) : Math.round(1 * multiplier), breederXpGain: lowerName.includes("loyal") || lowerName.includes("guard") || lowerName.includes("poise") ? Math.round(4 * multiplier) : 0, energyDiscount: lowerName.includes("steady") || lowerName.includes("efficient") || lowerName.includes("hardy") ? Math.round(3 * multiplier) : 0, affectionGain: lowerName.includes("gentle") || lowerName.includes("warm") || lowerName.includes("purr") ? 1 : 0, statGrowthBias: lowerName.includes("fert") ? "FER" as CreatureStatKey : lowerName.includes("guard") ? "WIL" as CreatureStatKey : lowerName.includes("vigor") ? "STA" as CreatureStatKey : undefined, label: `${ability.name} (${ability.grade}): improves this breeding session.` }; }
function summarizeAbilityEffects(abilities: CreatureAbility[] | undefined) { const summary = { pregnancyChance: 0, xpGain: 0, xpMultiplier: 1, breederXpGain: 0, energyDiscount: 0, affectionGain: 0, statGrowthBiases: [] as CreatureStatKey[], triggers: [] as string[] }; for (const ability of abilities ?? []) { const effect = getAbilityEffect(ability); summary.pregnancyChance += effect.pregnancyChance; summary.xpGain += effect.xpGain; summary.breederXpGain += effect.breederXpGain; summary.energyDiscount += effect.energyDiscount; summary.affectionGain += effect.affectionGain; if (effect.statGrowthBias) summary.statGrowthBiases.push(effect.statGrowthBias); summary.triggers.push(effect.label); } return summary; }
function getStatValue(participant: BreedingParticipant | undefined, statKey: keyof CreatureStats, fallback = 5): number { return participant?.stats?.[statKey] ?? fallback; }
function getFlagNumber(value: boolean | number | string | undefined): number { const parsed = typeof value === "number" ? value : Number(value ?? 0); return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0; }
function getDailyBreedingComfortBonus(save: GameSave): number { return Math.max(0, Math.min(25, getFlagNumber(save.flags.ranchBreedingComfortBonusToday))); }
function getFertilityTonicCount(save: GameSave): number { return getFlagNumber(save.flags.breedingFertilityTonics); }
function getSupplyDepotFertilityTonicBonus(save: GameSave): number { return getFertilityTonicCount(save) > 0 ? FERTILITY_TONIC_PREGNANCY_BONUS : 0; }
function getSceneFamilyForVariant(variantId: string): BreedingSceneFamily { const family = getVariantDefinition(variantId as never).family; return family ?? "unknown"; }
function buildUnavailableReason(energy: number, hearts: number, isInjured: boolean, injuryLabel?: string | null, trainingLabel?: string | null): string | null { if (trainingLabel) return trainingLabel; if (isInjured) return injuryLabel ? `${injuryLabel}; recovering` : "Injured; recovering"; if (energy < 12) return "Energy too low"; if (hearts < 1) return "No Hearts remaining"; return null; }

export function getBreedingParticipants(save: GameSave): BreedingParticipant[] {
  const normalizedPlayer = normalizePlayer(save.player);
  const playerMaxEnergy = getPlayerMaxEnergyFromStats(normalizedPlayer.stats);
  const playerPregnancy = getActivePregnancyForParticipant(save, PLAYER_PARTICIPANT_ID);
  const playerUnavailable = buildUnavailableReason(Math.min(save.currencies.energy, playerMaxEnergy), normalizedPlayer.hearts, false);
  const player: BreedingParticipant = { participantId: PLAYER_PARTICIPANT_ID, kind: "player", displayName: normalizedPlayer.name, familyLabel: "Player", sceneFamily: "player", roleTags: ["giver", "receiver"], energy: Math.min(save.currencies.energy, playerMaxEnergy), maxEnergy: playerMaxEnergy, hearts: normalizedPlayer.hearts, maxHearts: normalizedPlayer.maxHearts, affection: 65, level: normalizedPlayer.breederRank, xp: normalizedPlayer.breederXp, xpToNext: normalizedPlayer.breederXpToNext, stats: normalizedPlayer.stats, statGrades: normalizedPlayer.statGrades, isPregnant: Boolean(playerPregnancy), pregnancyDaysRemaining: playerPregnancy?.daysRemaining, canBreed: !playerUnavailable, unavailableReason: playerUnavailable, description: "The player can participate in breeding and gains Breeder XP only when selected as giver or receiver.", portraitPath: "/images/ui/icons/icon_breeder_level.png", profilePath: "/images/ui/icons/icon_breeder_level.png" };
  const creatures = (save.creatures ?? []).map((sourceCreature) => { const creature = normalizeCreature(sourceCreature); const variant = getVariantDefinition(creature.variantId); const species = getSpeciesDefinition(variant.speciesId); const pregnancy = getActivePregnancyForParticipant(save, creature.creatureId); const isInjured = isCreatureInjuredForBreeding(creature, save.dayState.dayNumber); const trainingLabel = getTrainingUnavailableReason(save, creature.creatureId); const unavailableReason = buildUnavailableReason(creature.energy, creature.hearts, isInjured, creature.injuryLabel, trainingLabel); return { participantId: creature.creatureId, kind: "creature" as const, creatureId: creature.creatureId as CreatureId, displayName: creature.nickname, familyLabel: `${variant.name} ${species.name}`, sceneFamily: variant.family as BreedingSceneFamily, roleTags: ["giver", "receiver"] as const, energy: creature.energy, maxEnergy: creature.maxEnergy, hearts: creature.hearts, maxHearts: creature.maxHearts, affection: creature.affection, level: creature.level, xp: creature.xp, xpToNext: creature.xpToNext, stats: creature.stats, statGrades: creature.statGrades, abilities: creature.abilities, isPregnant: Boolean(pregnancy), pregnancyDaysRemaining: pregnancy?.daysRemaining, isInjured, canBreed: !unavailableReason, unavailableReason, description: variant.description, portraitPath: variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE, profilePath: variant.profilePath || variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE }; });
  return [player, ...creatures];
}

export function getBreedingPreview(save: GameSave, giverId: string | null, receiverId: string | null): BreedingPreview | null {
  if (!giverId || !receiverId || giverId === receiverId) return null;
  const breeding = save.breeding ?? createDefaultBreedingState();
  const ranchEffects = getRanchUpgradeEffects(save);
  const dailyComfortBonus = getDailyBreedingComfortBonus(save);
  const participants = getBreedingParticipants(save);
  const giver = participants.find((item) => item.participantId === giverId);
  const receiver = participants.find((item) => item.participantId === receiverId);
  if (!giver || !receiver) return null;
  const pairKey = getPairKey(giverId, receiverId);
  const streakCount = breeding.streaks.find((item) => item.pairKey === pairKey)?.streakCount ?? 0;
  const giverEffects = summarizeAbilityEffects(giver.abilities);
  const receiverEffects = summarizeAbilityEffects(receiver.abilities);
  const involvesPlayer = giver.kind === "player" || receiver.kind === "player";
  const receiverPregnant = Boolean(receiver.isPregnant);
  const pregnancyBlockedReason = receiverPregnant ? `${receiver.displayName} is already pregnant; this session cannot create another pregnancy for the receiver.` : null;
  const fertilityTonicBonus = receiverPregnant ? 0 : getSupplyDepotFertilityTonicBonus(save);
  const baseChance = 12;
  const streakBonus = Math.min(30, streakCount * 6);
  const affectionBonus = Math.floor((giver.affection + receiver.affection) / 40);
  const fertilityBonus = Math.floor((getStatValue(giver, "FER") + getStatValue(receiver, "FER")) / 3);
  const charmBonus = Math.floor((getStatValue(giver, "CHA") + getStatValue(receiver, "CHA")) / 6);
  const abilityBonus = giverEffects.pregnancyChance + receiverEffects.pregnancyChance + ranchEffects.breedingPregnancyBonus + dailyComfortBonus + fertilityTonicBonus;
  const calculatedChance = Math.min(90, baseChance + streakBonus + affectionBonus + fertilityBonus + charmBonus + abilityBonus);
  const pregnancyChance = receiverPregnant ? 0 : calculatedChance;
  const staminaDiscount = Math.floor((getStatValue(giver, "STA") + getStatValue(receiver, "STA")) / 6);
  const energyDiscount = Math.min(22, staminaDiscount + giverEffects.energyDiscount + receiverEffects.energyDiscount + ranchEffects.breedingEnergyDiscount);
  const energyCost = Math.max(12, 35 - energyDiscount);
  const heartCost = involvesPlayer ? 2 : 1;
  const willpowerBonus = Math.floor((getStatValue(giver, "WIL") + getStatValue(receiver, "WIL")) / 5);
  const dexterityBonus = Math.floor((getStatValue(giver, "DEX") + getStatValue(receiver, "DEX")) / 7);
  const baseXp = 8 + streakCount * 2 + willpowerBonus + dexterityBonus + giverEffects.xpGain + receiverEffects.xpGain + ranchEffects.breedingXpBonus;
  const xpGain = Math.round(baseXp * giverEffects.xpMultiplier * receiverEffects.xpMultiplier);
  const breederXpGain = involvesPlayer ? 10 + Math.floor(xpGain / 2) + giverEffects.breederXpGain + receiverEffects.breederXpGain : 0;
  const abilityTriggers = [...giverEffects.triggers, ...receiverEffects.triggers];
  if (ranchEffects.breedingPregnancyBonus > 0) abilityTriggers.push(`Breeding Pen Comfort: +${ranchEffects.breedingPregnancyBonus}% pregnancy chance.`);
  if (dailyComfortBonus > 0) abilityTriggers.push(`Today's Comfort Care: +${dailyComfortBonus}% pregnancy chance.`);
  if (fertilityTonicBonus > 0) abilityTriggers.push(`Supply Depot Fertility Tonic: +${fertilityTonicBonus}% pregnancy chance; one tonic will be consumed on a valid attempt.`);
  const readinessNotes = [giver.unavailableReason ? `${giver.displayName}: ${giver.unavailableReason}.` : `${giver.displayName}: ready.`, receiver.unavailableReason ? `${receiver.displayName}: ${receiver.unavailableReason}.` : `${receiver.displayName}: ready.`, pregnancyBlockedReason ?? `${receiver.displayName} can become pregnant if the roll succeeds.`];
  const blockedReason = giver.unavailableReason ?? receiver.unavailableReason ?? (giver.energy < energyCost ? `${giver.displayName} needs ${energyCost} energy.` : receiver.energy < energyCost ? `${receiver.displayName} needs ${energyCost} energy.` : giver.hearts < heartCost ? `${giver.displayName} needs ${heartCost} Heart(s).` : receiver.hearts < heartCost ? `${receiver.displayName} needs ${heartCost} Heart(s).` : null);
  return { pairKey, pregnancyChance, baseChance, streakBonus, affectionBonus, abilityBonus, energyDiscount, streakCount, energyCost, heartCost, xpGain, breederXpGain, abilityTriggers, canAttempt: !blockedReason, blockedReason, receiverCanBecomePregnant: !receiverPregnant, receiverPregnant, pregnancyBlockedReason, giverEnergyAfter: Math.max(0, giver.energy - energyCost), receiverEnergyAfter: Math.max(0, receiver.energy - energyCost), readinessNotes };
}

function applyCreatureProgression(creature: CreatureRecord, xpGain: number, energyCost: number, heartCost: number, biases: CreatureStatKey[], seed: string): { creature: CreatureRecord; event: BreedingProgressionEvent } {
  const normalized = normalizeCreature(creature);
  const xpBefore = normalized.xp;
  const xpToNextBefore = normalized.xpToNext;
  const levelBefore = normalized.level;
  let xp = xpBefore + xpGain;
  let level = levelBefore;
  let xpToNext = xpToNextBefore;
  let levelUps = 0;
  while (xp >= xpToNext && levelUps < 20) { xp -= xpToNext; level += 1; levelUps += 1; xpToNext = getCreatureXpToNext(level); }
  const growth = levelUps > 0 ? applyCreatureLevelGrowth(normalized, levelUps, biases, seed) : { stats: normalized.stats, growthProgress: normalizeGrowthProgress(normalized.growthProgress), statGrowth: {} as Partial<CreatureStats>, notes: [] as string[] };
  const nextCreature = { ...normalized, level, xp, xpToNext, stats: growth.stats, growthProgress: growth.growthProgress, maxEnergy: getProjectedMaxEnergyForCreature({ ...normalized, level, stats: growth.stats }), energy: Math.max(0, normalized.energy - energyCost), hearts: Math.max(0, normalized.hearts - heartCost), affection: Math.min(100, normalized.affection + 2) };
  return { creature: nextCreature, event: { participantId: normalized.creatureId, displayName: normalized.nickname, kind: "creature", xpBefore, xpAfter: xp, xpToNextBefore, xpToNextAfter: xpToNext, levelBefore, levelAfter: level, levelUps, statGrowth: growth.statGrowth, abilityTriggers: growth.notes } };
}
function applyPlayerProgression(player: PlayerProfile, xpGain: number, heartCost: number): { player: PlayerProfile; event: BreedingProgressionEvent } {
  const normalized = normalizePlayer(player);
  const xpBefore = normalized.breederXp;
  const xpToNextBefore = normalized.breederXpToNext;
  const levelBefore = normalized.breederRank;
  let xp = xpBefore + xpGain;
  let rank = levelBefore;
  let xpToNext = xpToNextBefore;
  let levelUps = 0;
  let stats = { ...normalized.stats };
  while (xp >= xpToNext && levelUps < 20) { xp -= xpToNext; rank += 1; levelUps += 1; xpToNext = getBreederXpToNext(rank); const key = STAT_KEYS[(rank + levelUps) % STAT_KEYS.length] as keyof CreatureStats; stats = { ...stats, [key]: stats[key] + Math.max(1, Math.round((PLAYER_GROWTH_PROFILE[key] ?? 10) / 20)) }; }
  return { player: { ...normalized, breederRank: rank, breederXp: xp, breederXpToNext: xpToNext, stats, hearts: Math.max(0, normalized.hearts - heartCost) }, event: { participantId: PLAYER_PARTICIPANT_ID, displayName: normalized.name, kind: "player", xpBefore, xpAfter: xp, xpToNextBefore, xpToNextAfter: xpToNext, levelBefore, levelAfter: rank, levelUps, statGrowth: {}, abilityTriggers: levelUps ? [`Breeder rank increased by ${levelUps}.`] : [] } };
}

export function performBreedingAttempt(save: GameSave, giverId: string, receiverId: string): { save: GameSave; attempt: BreedingAttemptRecord } | null {
  const preview = getBreedingPreview(save, giverId, receiverId);
  if (!preview || !preview.canAttempt) return null;
  const participants = getBreedingParticipants(save);
  const giver = participants.find((item) => item.participantId === giverId);
  const receiver = participants.find((item) => item.participantId === receiverId);
  if (!giver || !receiver) return null;
  const attemptId = `breeding_${save.dayState.dayNumber}_${Date.now()}` as BreedingAttemptId;
  const abilityBiases = [...summarizeAbilityEffects(giver.abilities).statGrowthBiases, ...summarizeAbilityEffects(receiver.abilities).statGrowthBiases];
  const pregnancyBlocked = Boolean(preview.pregnancyBlockedReason);
  const usedFertilityTonic = !pregnancyBlocked && getFertilityTonicCount(save) > 0;
  const didBecomePregnant = !pregnancyBlocked && deterministicRoll(`${attemptId}_pregnancy`, 100) < preview.pregnancyChance;
  const outcome: BreedingOutcomeType = didBecomePregnant ? "pregnancy" : "failed";
  const progressionEvents: BreedingProgressionEvent[] = [];
  let nextPlayer = save.player;
  let nextEnergy = save.currencies.energy;
  const participantIds = new Set([giverId, receiverId]);
  if (participantIds.has(PLAYER_PARTICIPANT_ID)) { const playerProgress = applyPlayerProgression(save.player, preview.breederXpGain, preview.heartCost); nextPlayer = playerProgress.player; nextEnergy = Math.max(0, save.currencies.energy - preview.energyCost); progressionEvents.push(playerProgress.event); }
  const nextCreatures = (save.creatures ?? []).map((creature) => { if (!participantIds.has(creature.creatureId)) return creature; const progressed = applyCreatureProgression(creature, preview.xpGain, preview.energyCost, preview.heartCost, abilityBiases, `${attemptId}_${creature.creatureId}`); progressionEvents.push(progressed.event); return progressed.creature; });
  const pairKey = preview.pairKey;
  const breeding = save.breeding ?? createDefaultBreedingState();
  const nextStreak = preview.streakCount + 1;
  const nextStreaks = [...breeding.streaks.filter((item) => item.pairKey !== pairKey), { pairKey, participantAId: giverId, participantBId: receiverId, streakCount: nextStreak, lastAttemptDayNumber: save.dayState.dayNumber, lastOutcome: outcome }];
  const pregnancy = didBecomePregnant ? createPregnancyRecord({ ...save, player: nextPlayer, creatures: nextCreatures }, giver, receiver, `${attemptId}_pregnancy`) : null;
  const outcomeKey = pregnancyBlocked ? "blocked" : outcome;
  const tonicText = usedFertilityTonic ? " A Fertility Tonic from the Supply Depot was consumed before the session." : "";
  const resultText = pregnancy ? `${receiver.displayName} is now pregnant. The nursery ledger has been updated.${tonicText}` : pregnancyBlocked ? `${receiver.displayName} is already pregnant, so no new pregnancy was possible.` : `No pregnancy this time. The pair still gained experience and familiarity.${tonicText}`;
  const attempt: BreedingAttemptRecord = { attemptId, dayNumber: save.dayState.dayNumber, giverId, receiverId, giverName: giver.displayName, receiverName: receiver.displayName, giverFamily: giver.sceneFamily, receiverFamily: receiver.sceneFamily, pregnancyChance: preview.pregnancyChance, energyCost: preview.energyCost, heartCost: preview.heartCost, xpGain: preview.xpGain, breederXpGain: preview.breederXpGain, streakBefore: preview.streakCount, streakAfter: nextStreak, outcome, resultText, processText: `${giver.displayName} and ${receiver.displayName} spent time together in the Breeding Pen. Energy was spent, XP was gained, and the pair's streak advanced.${usedFertilityTonic ? " Fertility Tonic support was applied." : ""}`, outcomeFlavorText: pregnancy ? "The receiver shows clear pregnancy signs. Veyra notes the result and sends the record to the nursery." : pregnancyBlocked ? "The session ended normally, but the receiver was already carrying a pregnancy, so the ledger records no new conception." : "The session ended without pregnancy signs, but the pair left more familiar with each other's rhythm.", receiverWasPregnant: pregnancyBlocked, pregnancyBlockedReason: preview.pregnancyBlockedReason, giverEnergyBefore: giver.energy, giverEnergyAfter: preview.giverEnergyAfter, receiverEnergyBefore: receiver.energy, receiverEnergyAfter: preview.receiverEnergyAfter, pairingImagePath: getBreedingSceneImagePath(giver.sceneFamily, receiver.sceneFamily, "pairing", undefined, attemptId), outcomeImagePath: getBreedingSceneImagePath(giver.sceneFamily, receiver.sceneFamily, "outcome", outcomeKey, attemptId), progressionEvents, createdAt: new Date().toISOString() };
  const nextFlags: GameSave["flags"] = { ...save.flags, m4BreedingAttempted: true, m7BreedingProgression: true, m29BreedingFeedbackUpgrade: true, m36SupplyDepotFertilityTonic: usedFertilityTonic ? true : Boolean(save.flags.m36SupplyDepotFertilityTonic), lastBreedingOutcome: outcome, lastBreedingReceiverPregnantBlocked: pregnancyBlocked ? true : false };
  if (usedFertilityTonic) {
    nextFlags.breedingFertilityTonics = Math.max(0, getFertilityTonicCount(save) - 1);
    nextFlags.lastBreedingFertilityTonicUsed = true;
  }
  return { attempt, save: { ...save, player: nextPlayer, currencies: { ...save.currencies, energy: nextEnergy }, creatures: nextCreatures, pregnancies: pregnancy ? [pregnancy, ...(save.pregnancies ?? [])] : save.pregnancies ?? [], breeding: { ...breeding, attempts: [attempt, ...breeding.attempts].slice(0, 50), streaks: nextStreaks }, flags: nextFlags } };
}
